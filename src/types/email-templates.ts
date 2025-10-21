/**
 * Email Template System Types
 * ===========================
 * TypeScript types for the centralized email template management system
 */

// ============================================================================
// Email Header Types
// ============================================================================

export interface EmailHeader {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailHeaderInsert {
  name: string;
  description?: string | null;
  html_content: string;
  is_default?: boolean;
  created_by?: string;
}

export interface EmailHeaderUpdate {
  name?: string;
  description?: string | null;
  html_content?: string;
  is_default?: boolean;
}

// ============================================================================
// Email Footer Types
// ============================================================================

export interface EmailFooter {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailFooterInsert {
  name: string;
  description?: string | null;
  html_content: string;
  is_default?: boolean;
  created_by?: string;
}

export interface EmailFooterUpdate {
  name?: string;
  description?: string | null;
  html_content?: string;
  is_default?: boolean;
}

// ============================================================================
// Email Template Types (System Emails)
// ============================================================================

export type EmailTemplateType =
  | 'password_reset'
  | 'email_verification'
  | 'welcome'
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'message_notification'
  | 'item_sold'
  | 'item_purchased'
  | 'account_suspended'
  | 'account_deleted';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  variables: string[]; // Array of variable names like ["user_name", "reset_link"]
  header_id: string | null;
  footer_id: string | null;
  language: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  header?: EmailHeader;
  footer?: EmailFooter;
}

export interface EmailTemplateInsert {
  type: EmailTemplateType;
  name: string;
  description?: string | null;
  subject: string;
  html_content: string;
  variables?: string[];
  header_id?: string | null;
  footer_id?: string | null;
  language?: string;
  is_active?: boolean;
  created_by?: string;
}

export interface EmailTemplateUpdate {
  type?: EmailTemplateType;
  name?: string;
  description?: string | null;
  subject?: string;
  html_content?: string;
  variables?: string[];
  header_id?: string | null;
  footer_id?: string | null;
  language?: string;
  is_active?: boolean;
}

// ============================================================================
// Newsletter Template Types (Enhanced)
// ============================================================================

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string | null;
  body: string | null;
  header: string | null; // Legacy: inline header HTML
  footer: string | null; // Legacy: inline footer HTML
  header_id: string | null; // New: reference to email_headers
  footer_id: string | null; // New: reference to email_footers
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  headerTemplate?: EmailHeader;
  footerTemplate?: EmailFooter;
}

export interface NewsletterTemplateInsert {
  name: string;
  subject?: string | null;
  body?: string | null;
  header?: string | null;
  footer?: string | null;
  header_id?: string | null;
  footer_id?: string | null;
  created_by?: string;
}

export interface NewsletterTemplateUpdate {
  name?: string;
  subject?: string | null;
  body?: string | null;
  header?: string | null;
  footer?: string | null;
  header_id?: string | null;
  footer_id?: string | null;
}

// ============================================================================
// Template Variable Types
// ============================================================================

export interface TemplateVariable {
  key: string; // e.g., "{{user_name}}"
  description: string; // Human-readable description
  example?: string; // Example value for preview
}

// Common variables used across templates
export const COMMON_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{user_name}}', description: 'Vollständiger Name des Benutzers', example: 'Max Mustermann' },
  { key: '{{first_name}}', description: 'Vorname des Benutzers', example: 'Max' },
  { key: '{{last_name}}', description: 'Nachname des Benutzers', example: 'Mustermann' },
  { key: '{{salutation}}', description: 'Persönliche Anrede (basierend auf Profil-Einstellung)', example: 'Lieber Max / Sehr geehrter Herr Mustermann' },
  { key: '{{title}}', description: 'Akademischer Titel (wenn vorhanden)', example: 'Dr.' },
  { key: '{{email}}', description: 'E-Mail-Adresse', example: 'max@example.com' },
  { key: '{{unsubscribe_link}}', description: 'Link zum Abmelden', example: 'https://habdawas.at/settings' },
  { key: '{{verification_link}}', description: 'E-Mail-Verifizierungslink', example: 'https://habdawas.at/verify?token=...' },
  { key: '{{reset_link}}', description: 'Passwort-Reset-Link', example: 'https://habdawas.at/reset?token=...' },
  { key: '{{item_title}}', description: 'Titel des Artikels', example: 'iPhone 13 Pro' },
  { key: '{{item_price}}', description: 'Preis des Artikels', example: '€ 599,00' },
  { key: '{{order_number}}', description: 'Bestellnummer', example: '#12345' },
  { key: '{{message_preview}}', description: 'Nachrichtenvorschau', example: 'Hallo, ist der Artikel noch verfügbar?' },
];

// ============================================================================
// Email Rendering Types
// ============================================================================

export interface RenderedEmail {
  subject: string;
  html: string; // Complete HTML including header, content, and footer
}

export interface EmailRenderOptions {
  templateType?: EmailTemplateType;
  subject?: string;
  content: string;
  header?: EmailHeader | string; // Can be EmailHeader object or raw HTML
  footer?: EmailFooter | string; // Can be EmailFooter object or raw HTML
  variables?: Record<string, string>; // Variable replacements
  useDefaultHeaderFooter?: boolean;
}

// ============================================================================
// Email Preview Types
// ============================================================================

export interface EmailPreview {
  subject: string;
  headerHtml: string;
  contentHtml: string;
  footerHtml: string;
  fullHtml: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface EmailTemplateStats {
  totalHeaders: number;
  totalFooters: number;
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  templatesByLanguage: Record<string, number>;
}

export interface EmailTemplateSendResult {
  success: boolean;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  error?: string;
}
