-- ============================================================================
-- Email Template Management System Migration
-- ============================================================================
-- This migration creates a centralized email template system with:
-- 1. Reusable headers and footers
-- 2. System email templates (password reset, verification, etc.)
-- 3. Enhanced newsletter templates with header/footer references
-- ============================================================================

-- 1. Create email_headers table for reusable email headers
CREATE TABLE IF NOT EXISTS email_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  html_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create email_footers table for reusable email footers
CREATE TABLE IF NOT EXISTS email_footers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  html_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create email_templates table for system emails
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE, -- e.g., 'password_reset', 'email_verification', 'welcome', etc.
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available variables for this template
  header_id UUID REFERENCES email_headers(id) ON DELETE SET NULL,
  footer_id UUID REFERENCES email_footers(id) ON DELETE SET NULL,
  language TEXT DEFAULT 'de',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add header/footer columns to newsletter_templates if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_templates' AND column_name = 'header') THEN
    ALTER TABLE newsletter_templates ADD COLUMN header TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_templates' AND column_name = 'footer') THEN
    ALTER TABLE newsletter_templates ADD COLUMN footer TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_templates' AND column_name = 'header_id') THEN
    ALTER TABLE newsletter_templates ADD COLUMN header_id UUID REFERENCES email_headers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'newsletter_templates' AND column_name = 'footer_id') THEN
    ALTER TABLE newsletter_templates ADD COLUMN footer_id UUID REFERENCES email_footers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE email_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_footers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for email_headers
-- ============================================================================

CREATE POLICY "Admins can view all headers" ON email_headers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can create headers" ON email_headers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update headers" ON email_headers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete headers" ON email_headers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ============================================================================
-- RLS Policies for email_footers
-- ============================================================================

CREATE POLICY "Admins can view all footers" ON email_footers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can create footers" ON email_footers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update footers" ON email_footers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete footers" ON email_footers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ============================================================================
-- RLS Policies for email_templates
-- ============================================================================

CREATE POLICY "Admins can view all email templates" ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can create email templates" ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update email templates" ON email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete email templates" ON email_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX idx_email_headers_created_at ON email_headers(created_at DESC);
CREATE INDEX idx_email_headers_is_default ON email_headers(is_default);
CREATE INDEX idx_email_footers_created_at ON email_footers(created_at DESC);
CREATE INDEX idx_email_footers_is_default ON email_footers(is_default);
CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_language ON email_templates(language);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- ============================================================================
-- Insert default header and footer templates
-- ============================================================================

-- Default Header
INSERT INTO email_headers (name, description, html_content, is_default)
VALUES (
  'Standard Header',
  'Default email header with HabDaWas branding',
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">HabDaWas</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Deine Community-Plattform</p>
  </div>',
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- Default Footer
INSERT INTO email_footers (name, description, html_content, is_default)
VALUES (
  'Standard Footer',
  'Default email footer with legal information and unsubscribe link',
  '<div style="background-color: #f5f5f5; padding: 30px 20px; text-align: center; border-radius: 0 0 8px 8px; margin-top: 40px; border-top: 3px solid #667eea;">
    <p style="margin: 0 0 15px 0; font-size: 12px; color: #666;">
      Du erhältst diese E-Mail, weil du bei HabDaWas registriert bist.
    </p>
    <p style="margin: 0 0 15px 0; font-size: 12px;">
      <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Newsletter-Einstellungen ändern</a>
    </p>
    <p style="margin: 0; font-size: 11px; color: #999;">
      HabDaWas · Österreich<br>
      <a href="https://habdawas.at/impressum" style="color: #999; text-decoration: none;">Impressum</a> ·
      <a href="https://habdawas.at/datenschutz" style="color: #999; text-decoration: none;">Datenschutz</a>
    </p>
  </div>',
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Insert default system email templates
-- ============================================================================

-- Password Reset Template
INSERT INTO email_templates (type, name, description, subject, html_content, variables, language)
VALUES (
  'password_reset',
  'Passwort zurücksetzen',
  'Email template for password reset requests',
  'Passwort zurücksetzen - HabDaWas',
  '<div style="padding: 30px 20px;">
    <h2 style="color: #333; margin-top: 0;">Hallo {{user_name}}!</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #555;">
      Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.
      Klicke auf den folgenden Button, um ein neues Passwort zu erstellen:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Passwort zurücksetzen
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #777;">
      Oder kopiere diesen Link in deinen Browser:<br>
      <a href="{{reset_link}}" style="color: #667eea; word-break: break-all;">{{reset_link}}</a>
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #777; margin-top: 30px;">
      Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
    </p>
  </div>',
  '["user_name", "reset_link"]'::jsonb,
  'de'
) ON CONFLICT (type) DO NOTHING;

-- Email Verification Template
INSERT INTO email_templates (type, name, description, subject, html_content, variables, language)
VALUES (
  'email_verification',
  'E-Mail verifizieren',
  'Email template for email verification',
  'Bestätige deine E-Mail-Adresse - HabDaWas',
  '<div style="padding: 30px 20px;">
    <h2 style="color: #333; margin-top: 0;">Willkommen bei HabDaWas, {{user_name}}!</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #555;">
      Vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse,
      um dein Konto zu aktivieren:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verification_link}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        E-Mail bestätigen
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #777;">
      Oder kopiere diesen Link in deinen Browser:<br>
      <a href="{{verification_link}}" style="color: #667eea; word-break: break-all;">{{verification_link}}</a>
    </p>
  </div>',
  '["user_name", "verification_link"]'::jsonb,
  'de'
) ON CONFLICT (type) DO NOTHING;

-- Welcome Email Template
INSERT INTO email_templates (type, name, description, subject, html_content, variables, language)
VALUES (
  'welcome',
  'Willkommens-Email',
  'Welcome email for new users',
  'Willkommen bei HabDaWas! 🎉',
  '<div style="padding: 30px 20px;">
    <h2 style="color: #333; margin-top: 0;">Herzlich willkommen, {{user_name}}! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #555;">
      Schön, dass du Teil unserer Community bist! Bei HabDaWas kannst du:
    </p>
    <ul style="font-size: 15px; line-height: 1.8; color: #555;">
      <li>Deine gebrauchten Sachen verkaufen</li>
      <li>Tolle Schnäppchen in deiner Nähe finden</li>
      <li>Mit anderen Community-Mitgliedern kommunizieren</li>
      <li>Nachhaltig handeln und die Umwelt schonen</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://habdawas.at" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Jetzt loslegen
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #777;">
      Bei Fragen stehen wir dir jederzeit zur Verfügung!
    </p>
  </div>',
  '["user_name"]'::jsonb,
  'de'
) ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- Update existing templates to use default header/footer
-- ============================================================================

DO $$
DECLARE
  default_header_id UUID;
  default_footer_id UUID;
BEGIN
  -- Get default header and footer IDs
  SELECT id INTO default_header_id FROM email_headers WHERE is_default = TRUE LIMIT 1;
  SELECT id INTO default_footer_id FROM email_footers WHERE is_default = TRUE LIMIT 1;

  -- Update email_templates to use default header/footer
  IF default_header_id IS NOT NULL AND default_footer_id IS NOT NULL THEN
    UPDATE email_templates
    SET header_id = default_header_id, footer_id = default_footer_id
    WHERE header_id IS NULL OR footer_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- Trigger to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_headers_updated_at
  BEFORE UPDATE ON email_headers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_footers_updated_at
  BEFORE UPDATE ON email_footers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
