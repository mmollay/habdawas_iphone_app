import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendAuthEmailRequest {
  type: 'password_reset' | 'email_verification' | 'magic_link' | 'email_change' | 'birthday' | 'welcome';
  email: string;
  user_name?: string;
  token?: string;
  redirect_to?: string;
  gift_credits?: string;
}

// Generate personalized salutation variations based on user preferences
function generateSalutations(
  salutation: string,
  firstName: string,
  lastName: string,
  title?: string
): {
  formal: string;
  formal_short: string;
  informal: string;
  informal_short: string;
} {
  const titlePrefix = title ? `${title} ` : '';

  switch (salutation) {
    case 'mr':
      return {
        formal: `Sehr geehrter Herr ${titlePrefix}${lastName}`,
        formal_short: `Sehr geehrter Herr ${lastName}`,
        informal: `Lieber ${firstName}`,
        informal_short: `Lieber ${firstName}`
      };
    case 'ms':
      return {
        formal: `Sehr geehrte Frau ${titlePrefix}${lastName}`,
        formal_short: `Sehr geehrte Frau ${lastName}`,
        informal: `Liebe ${firstName}`,
        informal_short: `Liebe ${firstName}`
      };
    case 'neutral':
    default:
      return {
        formal: `Hallo ${firstName}`,
        formal_short: `Hallo ${firstName}`,
        informal: `Hallo ${firstName}`,
        informal_short: `Hallo ${firstName}`
      };
  }
}

// Replace placeholders with actual data
function replacePlaceholders(text: string, data: {
  user_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  salutation_formal?: string;
  salutation_formal_short?: string;
  salutation_informal?: string;
  salutation_informal_short?: string;
  verification_link?: string;
  reset_link?: string;
  magic_link?: string;
  unsubscribe_link?: string;
  gift_credits?: string;
}): string {
  const firstName = data.first_name || data.user_name.split(' ')[0];
  const lastName = data.last_name || data.user_name.split(' ').slice(1).join(' ') || '';

  return text
    .replace(/\{\{user_name\}\}/g, data.user_name)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{last_name\}\}/g, lastName)
    .replace(/\{\{title\}\}/g, data.title || '')
    .replace(/\{\{salutation_formal\}\}/g, data.salutation_formal || `Hallo ${firstName}`)
    .replace(/\{\{salutation_formal_short\}\}/g, data.salutation_formal_short || `Hallo ${firstName}`)
    .replace(/\{\{salutation_informal\}\}/g, data.salutation_informal || `Hallo ${firstName}`)
    .replace(/\{\{salutation_informal_short\}\}/g, data.salutation_informal_short || `Hallo ${firstName}`)
    .replace(/\{\{email\}\}/g, data.email)
    .replace(/\{\{verification_link\}\}/g, data.verification_link || '')
    .replace(/\{\{reset_link\}\}/g, data.reset_link || '')
    .replace(/\{\{magic_link\}\}/g, data.magic_link || '')
    .replace(/\{\{unsubscribe_link\}\}/g, data.unsubscribe_link || 'https://habdawas.at/settings')
    .replace(/\{\{gift_credits\}\}/g, data.gift_credits || '');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, email, user_name, token, redirect_to, gift_credits }: SendAuthEmailRequest = await req.json();

    if (!type || !email) {
      return new Response(
        JSON.stringify({ error: "Type and email are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch user profile data for personalized salutation
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, salutation, title')
      .eq('email', email)
      .single();

    const fullName = profile?.full_name || user_name || email.split('@')[0];
    const firstName = fullName.split(' ')[0];
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const salutationType = profile?.salutation || 'neutral';
    const title = profile?.title || undefined;

    // Generate personalized salutation variations
    const salutations = generateSalutations(salutationType, firstName, lastName, title);

    // Fetch system email settings
    const { data: settings } = await supabaseClient
      .from('newsletter_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['system_email_from_name', 'system_email_from_email']);

    let fromName = 'HabDaWas';
    let fromEmail = 'auth@habdawas.at';

    settings?.forEach(setting => {
      // setting_value is JSONB, so it's already parsed by Supabase client
      const value = setting.setting_value;

      if (setting.setting_key === 'system_email_from_name') {
        fromName = value;
      } else if (setting.setting_key === 'system_email_from_email') {
        fromEmail = value;
      }
    });

    // Fetch email template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select(`
        *,
        header:email_headers!email_templates_header_id_fkey(html_content),
        footer:email_footers!email_templates_footer_id_fkey(html_content)
      `)
      .eq('type', type)
      .eq('is_active', true)
      .single();

    if (!template) {
      return new Response(
        JSON.stringify({ error: `No active template found for type: ${type}` }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Build action link based on type
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://habdawas.at";
    let actionLink = '';

    if (type === 'password_reset' && token) {
      actionLink = `${baseUrl}/reset-password?token=${token}&type=recovery${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
    } else if (type === 'email_verification' && token) {
      actionLink = `${baseUrl}/verify?token=${token}&type=signup${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
    } else if (type === 'magic_link' && token) {
      actionLink = `${baseUrl}/auth/callback?token=${token}&type=magiclink${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
    }

    // Prepare placeholder data
    const placeholderData = {
      user_name: fullName,
      first_name: firstName,
      last_name: lastName,
      title: title,
      salutation_formal: salutations.formal,
      salutation_formal_short: salutations.formal_short,
      salutation_informal: salutations.informal,
      salutation_informal_short: salutations.informal_short,
      email,
      verification_link: type === 'email_verification' ? actionLink : undefined,
      reset_link: type === 'password_reset' ? actionLink : undefined,
      magic_link: type === 'magic_link' ? actionLink : undefined,
      unsubscribe_link: `${baseUrl}/settings`,
      gift_credits: gift_credits,
    };

    // Replace placeholders
    const personalizedSubject = replacePlaceholders(template.subject, placeholderData);
    const personalizedHeader = template.header?.html_content
      ? replacePlaceholders(template.header.html_content, placeholderData)
      : '';
    const personalizedBody = replacePlaceholders(template.html_content, placeholderData);
    const personalizedFooter = template.footer?.html_content
      ? replacePlaceholders(template.footer.html_content, placeholderData)
      : '';

    // Build full HTML email
    const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${personalizedSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                ${personalizedHeader ? `<tr><td>${personalizedHeader}</td></tr>` : ''}
                <tr>
                  <td style="padding: 20px;">
                    ${personalizedBody}
                  </td>
                </tr>
                ${personalizedFooter ? `<tr><td>${personalizedFooter}</td></tr>` : ''}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: personalizedSubject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const responseData = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} email sent to ${email}`,
        messageId: responseData.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send auth email",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
