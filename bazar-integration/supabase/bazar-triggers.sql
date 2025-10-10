-- =====================================================
-- Bazar Push Notification Triggers
-- =====================================================
--
-- Triggers für automatische Push Notifications bei:
-- 1. Neuen Listings (Anzeigen)
-- 2. Neuen Nachrichten (Messages)
-- 3. Neuen Favoriten
-- 4. Verkauften Listings
--
-- Installation:
-- 1. Kopieren Sie dieses Script
-- 2. Supabase Dashboard → SQL Editor
-- 3. Ausführen
--
-- WICHTIG: Setzen Sie Ihre Admin User-ID!
--
-- =====================================================

-- =====================================================
-- 1. Trigger: Neues Listing erstellt
-- =====================================================
-- Admin wird benachrichtigt wenn jemand ein neues Listing erstellt

CREATE OR REPLACE FUNCTION notify_admin_on_new_listing()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id uuid := 'YOUR_ADMIN_USER_ID'::uuid;  -- ⚠️ ÄNDERN!
    seller_name text;
BEGIN
    -- Get seller's display name
    SELECT display_name INTO seller_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Nur benachrichtigen wenn Listing veröffentlicht wird (status = active)
    IF NEW.status = 'active' THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[admin_user_id],
            'Neues Inserat',
            format('%s hat "%s" für %s € eingestellt',
                COALESCE(seller_name, 'Ein User'),
                NEW.title,
                NEW.price::text
            ),
            jsonb_build_object(
                'type', 'new_listing',
                'listing_id', NEW.id,
                'user_id', NEW.user_id,
                'title', NEW.title,
                'price', NEW.price,
                'category_id', NEW.category_id
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (auf listings Tabelle)
DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_listing ON listings;
CREATE TRIGGER trigger_notify_admin_on_new_listing
    AFTER INSERT OR UPDATE ON listings
    FOR EACH ROW
    WHEN (NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status != 'active'))
    EXECUTE FUNCTION notify_admin_on_new_listing();


-- =====================================================
-- 2. Trigger: Neue Nachricht erhalten
-- =====================================================
-- User wird benachrichtigt wenn er eine neue Nachricht bekommt

CREATE OR REPLACE FUNCTION notify_user_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_name text;
    listing_title text;
BEGIN
    -- Get sender's display name
    SELECT display_name INTO sender_name
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Get listing title if message is about a listing
    IF NEW.listing_id IS NOT NULL THEN
        SELECT title INTO listing_title
        FROM listings
        WHERE id = NEW.listing_id;
    END IF;

    -- Nur benachrichtigen wenn Empfänger != Sender
    IF NEW.recipient_id != NEW.sender_id THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[NEW.recipient_id],
            'Neue Nachricht',
            format('%s: %s',
                COALESCE(sender_name, 'Ein User'),
                LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
            ),
            jsonb_build_object(
                'type', 'new_message',
                'message_id', NEW.id,
                'sender_id', NEW.sender_id,
                'listing_id', NEW.listing_id,
                'listing_title', listing_title
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (auf messages Tabelle)
DROP TRIGGER IF EXISTS trigger_notify_user_on_new_message ON messages;
CREATE TRIGGER trigger_notify_user_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_on_new_message();


-- =====================================================
-- 3. Trigger: Neuer Favorit
-- =====================================================
-- Seller wird benachrichtigt wenn jemand sein Listing favorisiert

CREATE OR REPLACE FUNCTION notify_seller_on_favorite()
RETURNS TRIGGER AS $$
DECLARE
    seller_id uuid;
    listing_title text;
    favoriter_name text;
BEGIN
    -- Get listing details and seller
    SELECT user_id, title
    INTO seller_id, listing_title
    FROM listings
    WHERE id = NEW.listing_id;

    -- Get favoriter's name
    SELECT display_name INTO favoriter_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Nur benachrichtigen wenn Favoriter != Seller
    IF seller_id IS NOT NULL AND seller_id != NEW.user_id THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[seller_id],
            'Jemand mag dein Inserat! ❤️',
            format('%s hat "%s" favorisiert',
                COALESCE(favoriter_name, 'Ein User'),
                listing_title
            ),
            jsonb_build_object(
                'type', 'new_favorite',
                'listing_id', NEW.listing_id,
                'user_id', NEW.user_id,
                'listing_title', listing_title
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (auf favorites Tabelle)
DROP TRIGGER IF EXISTS trigger_notify_seller_on_favorite ON favorites;
CREATE TRIGGER trigger_notify_seller_on_favorite
    AFTER INSERT ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION notify_seller_on_favorite();


-- =====================================================
-- 4. Trigger: Listing verkauft
-- =====================================================
-- Seller wird benachrichtigt wenn Listing auf "sold" gesetzt wird

CREATE OR REPLACE FUNCTION notify_seller_on_listing_sold()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur benachrichtigen wenn Status auf "sold" geändert wurde
    IF OLD.status != 'sold' AND NEW.status = 'sold' THEN
        INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
        VALUES (
            ARRAY[NEW.user_id],
            'Verkauft! 🎉',
            format('Dein Inserat "%s" wurde als verkauft markiert', NEW.title),
            jsonb_build_object(
                'type', 'listing_sold',
                'listing_id', NEW.id,
                'title', NEW.title,
                'price', NEW.price
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (auf listings Tabelle)
DROP TRIGGER IF EXISTS trigger_notify_seller_on_listing_sold ON listings;
CREATE TRIGGER trigger_notify_seller_on_listing_sold
    AFTER UPDATE ON listings
    FOR EACH ROW
    WHEN (OLD.status != NEW.status)
    EXECUTE FUNCTION notify_seller_on_listing_sold();


-- =====================================================
-- 5. Helper Function: Manuell Notification senden
-- =====================================================

CREATE OR REPLACE FUNCTION send_bazar_notification(
    p_user_id uuid,
    p_title text,
    p_body text,
    p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    queue_id uuid;
BEGIN
    INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
    VALUES (ARRAY[p_user_id], p_title, p_body, p_data, NOW())
    RETURNING id INTO queue_id;

    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beispiel-Aufruf:
-- SELECT send_bazar_notification(
--     'user-uuid-here',
--     'Test Notification',
--     'Dies ist eine Test-Nachricht',
--     '{"test": true}'::jsonb
-- );


-- =====================================================
-- 6. Function: Notifications für alle Favoriter senden
-- =====================================================
-- Wenn Seller Preis reduziert, alle Favoriter benachrichtigen

CREATE OR REPLACE FUNCTION notify_favoriters_on_price_drop()
RETURNS TRIGGER AS $$
DECLARE
    favoriter_ids uuid[];
    price_diff numeric;
    discount_percent numeric;
BEGIN
    -- Nur wenn Preis gesenkt wurde
    IF NEW.price < OLD.price THEN
        price_diff := OLD.price - NEW.price;
        discount_percent := ROUND((price_diff / OLD.price * 100)::numeric, 0);

        -- Get all users who favorited this listing
        SELECT ARRAY_AGG(user_id) INTO favoriter_ids
        FROM favorites
        WHERE listing_id = NEW.id;

        -- Send notification to all favoriters
        IF favoriter_ids IS NOT NULL AND array_length(favoriter_ids, 1) > 0 THEN
            INSERT INTO notification_queue (user_ids, title, body, data, scheduled_for)
            VALUES (
                favoriter_ids,
                format('Preis reduziert! -%s%%', discount_percent::text),
                format('"%s" jetzt für %s € (vorher %s €)',
                    NEW.title,
                    NEW.price::text,
                    OLD.price::text
                ),
                jsonb_build_object(
                    'type', 'price_drop',
                    'listing_id', NEW.id,
                    'title', NEW.title,
                    'old_price', OLD.price,
                    'new_price', NEW.price,
                    'discount_percent', discount_percent
                ),
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen (optional - aktivieren wenn gewünscht)
-- DROP TRIGGER IF EXISTS trigger_notify_favoriters_on_price_drop ON listings;
-- CREATE TRIGGER trigger_notify_favoriters_on_price_drop
--     AFTER UPDATE ON listings
--     FOR EACH ROW
--     WHEN (NEW.price < OLD.price AND NEW.status = 'active')
--     EXECUTE FUNCTION notify_favoriters_on_price_drop();


-- =====================================================
-- Setup abgeschlossen!
-- =====================================================
--
-- Aktivierte Triggers:
-- ✅ 1. Neues Listing → Admin Notification
-- ✅ 2. Neue Nachricht → Empfänger Notification
-- ✅ 3. Neuer Favorit → Seller Notification
-- ✅ 4. Listing verkauft → Seller Notification
-- ⬜ 5. Preisreduktion → Favoriter Notification (optional)
--
-- Nächste Schritte:
-- 1. Admin User-ID in Zeile 23 ändern!
-- 2. Edge Function deployen (siehe deploy-notifications.sh)
-- 3. Cron-Job für Queue Processing einrichten
-- 4. Frontend Integration (siehe usePushNotifications Hook)
--
-- =====================================================
