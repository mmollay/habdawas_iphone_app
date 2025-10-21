import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendTestNewsletterRequest {
  newsletterId: string;
  testEmails: string[]; // Array of email addresses to send test to
}

// Replace placeholders with test data
function replacePlaceholders(text: string, email: string): string {
  const name = email.split('@')[0];
  const firstName = name.split('.')[0] || name; // Try to extract first name from email
  return text
    .replace(/\{\{greeting\}\}/g, `Hallo ${firstName}`) // Test greeting
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{email\}\}/g, email)
    .replace(/\{\{unsubscribe_link\}\}/g, 'https://habdawas.at/settings');
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { newsletterId, testEmails }: SendTestNewsletterRequest = await req.json();

    if (!newsletterId || !testEmails || testEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Newsletter ID and test emails are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch newsletter
    const { data: newsletter, error: newsletterError } = await supabaseClient
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      return new Response(
        JSON.stringify({ error: "Newsletter not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch newsletter template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select(`
        *,
        header:email_headers!email_templates_header_id_fkey(html_content),
        footer:email_footers!email_templates_footer_id_fkey(html_content)
      `)
      .eq('type', 'newsletter')
      .eq('is_active', true)
      .single();

    const templateHeader = template?.header?.html_content || '';
    const templateFooter = template?.footer?.html_content || '';

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

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://habdawas.at";
    let sentCount = 0;
    const failedEmails: string[] = [];

    // Send test emails
    for (const email of testEmails) {
      try {
        const personalizedSubject = `[TEST] ${replacePlaceholders(newsletter.subject, email)}`;
        const personalizedHeader = templateHeader ? replacePlaceholders(templateHeader, email) : '';
        const personalizedBody = replacePlaceholders(newsletter.body, email);
        const personalizedFooter = templateFooter ? replacePlaceholders(templateFooter, email) : '';

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
                      <td style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                        <strong>🧪 TEST EMAIL</strong> - This is a test newsletter. Not sent to subscribers.
                      </td>
                    </tr>
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

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "HabDaWas <newsletter@habdawas.at>",
            to: [email],
            subject: personalizedSubject,
            html,
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          failedEmails.push(email);
          console.error(`Failed to send test email to ${email}:`, await response.text());
        }
      } catch (err) {
        failedEmails.push(email);
        console.error(`Error sending test email to ${email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test emails sent to ${sentCount} of ${testEmails.length} addresses`,
        sentCount,
        failedCount: failedEmails.length,
        failedEmails,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending test newsletter:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send test newsletter",
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
