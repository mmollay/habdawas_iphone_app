import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendNewsletterRequest {
  subject: string;
  body: string;
  newsletterId?: string; // Optional: If updating existing newsletter
  useTemplate?: boolean; // Optional: Use database template instead of custom HTML
}

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
}

// Replace placeholders with actual subscriber data
function replacePlaceholders(text: string, subscriber: Subscriber, baseUrl: string): string {
  const fullName = subscriber.full_name || subscriber.email.split('@')[0];
  const firstName = fullName.split(' ')[0];

  return text
    .replace(/\{\{name\}\}/g, fullName)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{email\}\}/g, subscriber.email)
    .replace(/\{\{unsubscribe_link\}\}/g, `${baseUrl}/settings`);
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

    const { subject, body, newsletterId, useTemplate = true }: SendNewsletterRequest = await req.json();

    if (!subject || !body) {
      return new Response(
        JSON.stringify({ error: "Subject and body are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch newsletter template from database if useTemplate is true
    let templateHeader = '';
    let templateFooter = '';

    if (useTemplate) {
      const { data: template, error: templateError } = await supabaseClient
        .from('email_templates')
        .select(`
          *,
          header:email_headers!email_templates_header_id_fkey(html_content),
          footer:email_footers!email_templates_footer_id_fkey(html_content)
        `)
        .eq('type', 'newsletter')
        .eq('is_active', true)
        .single();

      if (template && !templateError) {
        templateHeader = template.header?.html_content || '';
        templateFooter = template.footer?.html_content || '';
        console.log("Using newsletter template from database");
      } else {
        console.log("Newsletter template not found, using default layout");
      }
    }

    // Get all subscribed users
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("newsletter_subscribed", true);

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const recipientsCount = subscribers?.length || 0;

    if (recipientsCount === 0) {
      return new Response(
        JSON.stringify({
          message: "No subscribers found",
          recipientsCount: 0,
          sentCount: 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create or update newsletter record
    let newsletterRecord;
    if (newsletterId) {
      const { data, error } = await supabaseClient
        .from("newsletters")
        .update({
          status: "sending",
          recipients_count: recipientsCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", newsletterId)
        .select()
        .single();

      if (error) {
        console.error("Error updating newsletter:", error);
      }
      newsletterRecord = data;
    } else {
      const { data, error } = await supabaseClient
        .from("newsletters")
        .insert({
          subject,
          body,
          status: "sending",
          recipients_count: recipientsCount,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating newsletter:", error);
      }
      newsletterRecord = data;
    }

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let sentCount = 0;
    let failedCount = 0;

    if (resendApiKey) {
      // Send emails via Resend
      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "newsletter@habdawas.at";
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://habdawas.at";

      for (const subscriber of subscribers) {
        try {
          // Replace placeholders with subscriber-specific data
          const personalizedSubject = replacePlaceholders(subject, subscriber, baseUrl);
          let personalizedHeader = templateHeader ? replacePlaceholders(templateHeader, subscriber, baseUrl) : '';
          let personalizedBody = replacePlaceholders(body, subscriber, baseUrl);
          let personalizedFooter = templateFooter ? replacePlaceholders(templateFooter, subscriber, baseUrl) : '';

          // Build full HTML email using template system (similar to auth emails)
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

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `HabDaWas <${fromEmail}>`,
              to: [subscriber.email],
              subject: personalizedSubject,
              html,
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            failedCount++;
            console.error(`Failed to send to ${subscriber.email}:`, await response.text());
          }
        } catch (err) {
          failedCount++;
          console.error(`Error sending to ${subscriber.email}:`, err);
        }
      }
    } else {
      // Resend not configured, simulate sending
      console.log("RESEND_API_KEY not configured. Simulating newsletter send...");
      console.log(`Would send to ${recipientsCount} subscribers:`);
      subscribers.forEach(sub => console.log(`  - ${sub.email}`));
      sentCount = recipientsCount; // Simulate success
    }

    // Update newsletter status
    if (newsletterRecord) {
      await supabaseClient
        .from("newsletters")
        .update({
          status: failedCount === recipientsCount ? "failed" : "sent",
          sent_count: sentCount,
          failed_count: failedCount,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", newsletterRecord.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: resendApiKey
          ? `Newsletter sent to ${sentCount} of ${recipientsCount} subscribers`
          : `Newsletter simulated (Resend not configured). Would send to ${recipientsCount} subscribers`,
        newsletterId: newsletterRecord?.id,
        recipientsCount,
        sentCount,
        failedCount,
        isSimulated: !resendApiKey,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send newsletter",
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
