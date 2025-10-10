-- =====================================================
-- HabDaWas - Automatische Push Notification Triggers
-- =====================================================
--
-- Diese Triggers senden automatisch Push Notifications
-- wenn bestimmte Events in der Datenbank passieren.
--
-- WICHTIG: Passen Sie die Tabellennamen und User-IDs
-- an Ihre tatsächliche Datenbank-Struktur an!
--
-- =====================================================

-- =====================================================
-- 1. Trigger: Neues Produkt erstellt
-- =====================================================

CREATE OR REPLACE FUNCTION notify_admin_on_new_product()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id BIGINT := 1;  -- ⚠️ ÄNDERN: Ihre Admin User-ID
BEGIN
    -- Notification in Queue eintragen
    INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
    VALUES (
        ARRAY[admin_user_id],
        'Neues Produkt eingestellt',
        format('User hat "%s" für %s € eingestellt', NEW.title, NEW.price),
        jsonb_build_object(
            'type', 'new_product',
            'product_id', NEW.id,
            'product_title', NEW.title,
            'product_price', NEW.price,
            'created_by', NEW.created_by,
            'image_url', NEW.image_url  -- Falls vorhanden
        ),
        NOW()
    );

    -- Optional: Direkt Edge Function aufrufen (schneller)
    -- Benötigt supabase_functions Extension:
    -- PERFORM supabase_functions.http_post(
    --     'https://your-project.supabase.co/functions/v1/send-push-notification',
    --     jsonb_build_object(
    --         'user_id', admin_user_id,
    --         'title', 'Neues Produkt eingestellt',
    --         'body', format('User hat "%s" eingestellt', NEW.title),
    --         'data', jsonb_build_object('product_id', NEW.id)
    --     ),
    --     headers => array[
    --         ['Content-Type', 'application/json'],
    --         ['Authorization', 'Bearer ' || current_setting('supabase.service_role_key')]
    --     ]::text[][]
    -- );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren
-- ⚠️ WICHTIG: Ändern Sie "products" auf Ihren tatsächlichen Tabellennamen!
-- DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_product ON products;
-- CREATE TRIGGER trigger_notify_admin_on_new_product
--     AFTER INSERT ON products
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_admin_on_new_product();


-- =====================================================
-- 2. Trigger: Neue Nachricht erhalten
-- =====================================================

CREATE OR REPLACE FUNCTION notify_user_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur benachrichtigen wenn es NICHT der Sender selbst ist
    IF NEW.from_user_id != NEW.to_user_id THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[NEW.to_user_id],
            'Neue Nachricht',
            format('%s hat dir geschrieben', (SELECT username FROM users WHERE id = NEW.from_user_id)),
            jsonb_build_object(
                'type', 'new_message',
                'message_id', NEW.id,
                'from_user_id', NEW.from_user_id,
                'conversation_id', NEW.conversation_id,
                'preview', LEFT(NEW.message_text, 50)  -- Erste 50 Zeichen
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren
-- ⚠️ WICHTIG: Ändern Sie "messages" auf Ihren tatsächlichen Tabellennamen!
-- DROP TRIGGER IF EXISTS trigger_notify_user_on_new_message ON messages;
-- CREATE TRIGGER trigger_notify_user_on_new_message
--     AFTER INSERT ON messages
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_user_on_new_message();


-- =====================================================
-- 3. Trigger: Produkt verkauft / Status geändert
-- =====================================================

CREATE OR REPLACE FUNCTION notify_seller_on_product_sold()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur benachrichtigen wenn Status auf "sold" geändert wurde
    IF OLD.status != 'sold' AND NEW.status = 'sold' THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[NEW.seller_id],
            'Produkt verkauft! 🎉',
            format('Dein Produkt "%s" wurde verkauft!', NEW.title),
            jsonb_build_object(
                'type', 'product_sold',
                'product_id', NEW.id,
                'product_title', NEW.title,
                'buyer_id', NEW.buyer_id
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren
-- ⚠️ WICHTIG: Ändern Sie "products" auf Ihren tatsächlichen Tabellennamen!
-- DROP TRIGGER IF EXISTS trigger_notify_seller_on_product_sold ON products;
-- CREATE TRIGGER trigger_notify_seller_on_product_sold
--     AFTER UPDATE ON products
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_seller_on_product_sold();


-- =====================================================
-- 4. Trigger: Neuer Favorit / Like
-- =====================================================

CREATE OR REPLACE FUNCTION notify_seller_on_favorite()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
    VALUES (
        ARRAY[(SELECT seller_id FROM products WHERE id = NEW.product_id)],
        'Jemand mag dein Produkt! ❤️',
        format('%s hat dein Produkt "%s" favorisiert',
            (SELECT username FROM users WHERE id = NEW.user_id),
            (SELECT title FROM products WHERE id = NEW.product_id)
        ),
        jsonb_build_object(
            'type', 'new_favorite',
            'product_id', NEW.product_id,
            'user_id', NEW.user_id
        ),
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger aktivieren
-- ⚠️ WICHTIG: Ändern Sie "favorites" auf Ihren tatsächlichen Tabellennamen!
-- DROP TRIGGER IF EXISTS trigger_notify_seller_on_favorite ON favorites;
-- CREATE TRIGGER trigger_notify_seller_on_favorite
--     AFTER INSERT ON favorites
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_seller_on_favorite();


-- =====================================================
-- 5. Worker Function: Queue verarbeiten
-- =====================================================
-- Diese Function sollte per Cron-Job regelmäßig aufgerufen werden

CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS INTEGER AS $$
DECLARE
    queue_item RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Alle pending Notifications holen
    FOR queue_item IN
        SELECT * FROM notification_queue
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT 100  -- Max 100 pro Lauf
    LOOP
        -- Status auf processing setzen
        UPDATE notification_queue
        SET status = 'processing', processed_at = NOW()
        WHERE id = queue_item.id;

        -- Edge Function aufrufen (via HTTP)
        -- HINWEIS: Dies benötigt die supabase_functions Extension
        -- Alternativ können Sie einen externen Cron-Job verwenden

        -- Status auf completed setzen
        UPDATE notification_queue
        SET status = 'completed'
        WHERE id = queue_item.id;

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron-Job Setup (mit pg_cron Extension):
-- SELECT cron.schedule(
--     'process-notification-queue',
--     '*/5 * * * *',  -- Alle 5 Minuten
--     $$ SELECT process_notification_queue(); $$
-- );


-- =====================================================
-- 6. Helper Function: Manuell Notification senden
-- =====================================================

CREATE OR REPLACE FUNCTION send_notification_to_user(
    p_user_id BIGINT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
    VALUES (ARRAY[p_user_id], p_title, p_body, p_data, NOW())
    RETURNING id INTO queue_id;

    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beispiel-Aufruf:
-- SELECT send_notification_to_user(
--     1,
--     'Test Notification',
--     'Dies ist eine Test-Nachricht',
--     '{"test": true}'::jsonb
-- );


-- =====================================================
-- Setup abgeschlossen!
-- =====================================================
--
-- Um die Triggers zu aktivieren:
-- 1. Entfernen Sie die Kommentare bei den CREATE TRIGGER Statements
-- 2. Passen Sie die Tabellennamen an Ihre Datenbank an
-- 3. Setzen Sie die korrekten User-IDs (z.B. Admin-ID)
--
-- Für automatische Queue-Verarbeitung:
-- 1. Installieren Sie pg_cron Extension
-- 2. Aktivieren Sie den Cron-Job (siehe oben)
--
-- ODER verwenden Sie einen externen Cron-Job:
-- curl -X POST https://your-project.supabase.co/rest/v1/rpc/process_notification_queue \
--   -H "apikey: YOUR_ANON_KEY" \
--   -H "Content-Type: application/json"
--
-- =====================================================
