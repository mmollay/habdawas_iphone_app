import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  type: 'signup' | 'recovery' | 'email_change' | 'magic_link';
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to?: string;
    site_url: string;
    confirmation_url: string;
    email_action_type: string;
  };
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[1] Auth email hook triggered");

    // Verify webhook signature (required for HTTP Auth Hooks)
    const authHookSecret = Deno.env.get("AUTH_HOOK_SECRET");
    if (!authHookSecret) {
      console.error("[ERROR] AUTH_HOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    // Get the raw request body and headers for signature verification
    const body = await req.text();
    const headers = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
    };

    console.log("[1.1] Verifying webhook signature");

    // Extract the secret (remove the 'v1,whsec_' prefix if present)
    const secret = authHookSecret.replace(/^v1,whsec_/, "");

    // Verify the webhook signature using Standard Webhooks
    const wh = new Webhook(secret);
    let verifiedPayload;
    try {
      verifiedPayload = wh.verify(body, headers) as EmailPayload;
      console.log("[1.2] Webhook signature verified successfully");
    } catch (err) {
      console.error("[ERROR] Webhook verification failed:", err);
      throw new Error("Invalid webhook signature");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Use the verified payload
    const payload = verifiedPayload;
    console.log("[2] Payload received for type:", payload.type);
    console.log("[2.1] User email:", payload.user.email);

    // Map auth type to our template type
    const templateTypeMap: Record<string, string> = {
      'signup': 'email_verification',
      'recovery': 'password_reset',
      'email_change': 'email_verification',
      'magic_link': 'email_verification',
    };

    const templateType = templateTypeMap[payload.type] || 'email_verification';
    console.log("[3] Using template type:", templateType);

    // Fetch the email template from database
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select(`
        *,
        header:email_headers!email_templates_header_id_fkey(html_content),
        footer:email_footers!email_templates_footer_id_fkey(html_content)
      `)
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error("[ERROR] Template fetch error:", templateError);
      throw new Error(`Template not found for type: ${templateType}`);
    }

    console.log("[4] Template found:", template.name);

    // Fetch user profile data for personalized salutation
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, salutation, title')
      .eq('email', payload.user.email)
      .single();

    // Get user's full name or email
    const userName = profile?.full_name ||
                     payload.user.user_metadata?.full_name ||
                     payload.user.email?.split('@')[0] ||
                     'User';

    const firstName = userName.split(' ')[0];
    const lastName = userName.split(' ').slice(1).join(' ') || '';
    const salutationType = profile?.salutation || 'neutral';
    const title = profile?.title || undefined;

    // Generate personalized salutation variations
    const salutations = generateSalutations(salutationType, firstName, lastName, title);

    // Prepare template variables
    const variables: Record<string, string> = {
      user_name: userName,
      first_name: firstName,
      last_name: lastName,
      title: title || '',
      salutation_formal: salutations.formal,
      salutation_formal_short: salutations.formal_short,
      salutation_informal: salutations.informal,
      salutation_informal_short: salutations.informal_short,
      email: payload.user.email,
      reset_link: payload.email_data.confirmation_url,
      verification_link: payload.email_data.confirmation_url,
      confirmation_url: payload.email_data.confirmation_url,
      site_url: payload.email_data.site_url,
      unsubscribe_link: `${payload.email_data.site_url}/settings`,
    };

    console.log("[5] Variables prepared");

    // Replace placeholders in header, body, and footer
    let headerHtml = template.header?.html_content || '';
    let bodyHtml = template.html_content;
    let footerHtml = template.footer?.html_content || '';

    // Replace all placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      headerHtml = headerHtml.replace(placeholder, value);
      bodyHtml = bodyHtml.replace(placeholder, value);
      footerHtml = footerHtml.replace(placeholder, value);
    });

    // Combine header + body + footer
    const fullHtmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td>
                    ${headerHtml}
                  </td>
                </tr>
                <tr>
                  <td>
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td>
                    ${footerHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log("[6] Email HTML assembled");

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.warn("[WARN] Resend API key not configured - simulating email send");
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Email would be sent",
          to: payload.user.email,
          subject: template.subject,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Send email via Resend
    console.log("[7] Sending email via Resend");
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HabDaWas <noreply@habdawas.at>",
        to: [payload.user.email],
        subject: template.subject,
        html: fullHtmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[ERROR] Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log("[8] Email sent successfully via Resend:", resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        to: payload.user.email,
        subject: template.subject,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("[ERROR] Failed to send custom auth email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        message: error instanceof Error ? error.message : "Unknown error",
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
