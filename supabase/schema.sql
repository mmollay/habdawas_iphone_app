-- =====================================================
-- HabDaWas Push Notifications - Supabase Schema
-- =====================================================
--
-- Installation:
-- 1. Gehen Sie zu Supabase Dashboard → SQL Editor
-- 2. Kopieren Sie dieses komplette Script
-- 3. Führen Sie es aus
--
-- =====================================================

-- 1. Device Tokens Table
-- Speichert alle registrierten iOS/Android Geräte
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,  -- Ihre User-ID aus dem auth System
    device_token TEXT NOT NULL UNIQUE,  -- APNs Device Token
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    app_version TEXT,
    device_model TEXT,
    os_version TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnelle User-Suche
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_device_tokens_last_active ON device_tokens(last_active);

-- 2. Notification Logs Table
-- Trackt alle versendeten Notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT,
    device_token TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,  -- Zusätzliche Daten (z.B. product_id)
    status TEXT CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 3. Notification Queue Table
-- Queue für zu versendende Notifications (optional, für Bulk-Versand)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_ids BIGINT[],  -- Array von User IDs
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Auto-Update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_tokens_updated_at
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) Policies
-- Aktivieren Sie RLS für Sicherheit

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users können nur ihre eigenen Device Tokens sehen/bearbeiten
CREATE POLICY "Users can view their own device tokens"
    ON device_tokens FOR SELECT
    USING (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can insert their own device tokens"
    ON device_tokens FOR INSERT
    WITH CHECK (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can update their own device tokens"
    ON device_tokens FOR UPDATE
    USING (user_id = auth.uid()::BIGINT);

CREATE POLICY "Users can delete their own device tokens"
    ON device_tokens FOR DELETE
    USING (user_id = auth.uid()::BIGINT);

-- Policy: Users können ihre eigenen Notification Logs sehen
CREATE POLICY "Users can view their own notification logs"
    ON notification_logs FOR SELECT
    USING (user_id = auth.uid()::BIGINT);

-- Admin kann alles sehen (optional - passen Sie die Rolle an)
-- CREATE POLICY "Admins can view all device tokens"
--     ON device_tokens FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- 6. Function: Get Active Device Tokens for User
CREATE OR REPLACE FUNCTION get_active_device_tokens(p_user_id BIGINT)
RETURNS TABLE (
    device_token TEXT,
    platform TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT dt.device_token, dt.platform
    FROM device_tokens dt
    WHERE dt.user_id = p_user_id
      AND dt.last_active > NOW() - INTERVAL '30 days'  -- Nur aktive Geräte (letzte 30 Tage)
    ORDER BY dt.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: Cleanup Old Device Tokens
-- Löscht inaktive Geräte (älter als 90 Tage)
CREATE OR REPLACE FUNCTION cleanup_old_device_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM device_tokens
    WHERE last_active < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Example: Trigger bei neuem Produkt
-- WICHTIG: Passen Sie dies an Ihre bestehende Produkt-Tabelle an!
--
-- Annahme: Sie haben eine Tabelle "products" mit Spalte "created_by"
--
-- CREATE OR REPLACE FUNCTION notify_admin_on_new_product()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Notification Queue eintragen für Admin (user_id = 1)
--     INSERT INTO notification_queue (user_ids, title, body, data)
--     VALUES (
--         ARRAY[1],  -- Admin User ID (ändern Sie dies!)
--         'Neues Produkt',
--         'User hat "' || NEW.title || '" eingestellt',
--         jsonb_build_object(
--             'product_id', NEW.id,
--             'product_title', NEW.title,
--             'created_by', NEW.created_by,
--             'type', 'new_product'
--         )
--     );
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER trigger_notify_admin_on_new_product
--     AFTER INSERT ON products
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_admin_on_new_product();

-- =====================================================
-- Setup abgeschlossen!
-- =====================================================
--
-- Nächste Schritte:
-- 1. Edge Function erstellen (siehe send-push-notification.ts)
-- 2. Produkt-Trigger aktivieren (siehe oben, Kommentar entfernen)
-- 3. Frontend integrieren (siehe supabase-notifications.js)
--
-- =====================================================
