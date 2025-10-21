import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[1] Request received");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[ERROR] Missing authorization header");
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

    console.log("[2] Creating Supabase client");
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
    console.log("[3] Verifying user authentication");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("[ERROR] User error:", userError);
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

    console.log("[4] Checking admin status for user:", user.id);
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("[ERROR] Profile fetch error:", profileError);
    }

    if (!profile?.is_admin) {
      console.log("[ERROR] User is not admin");
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

    // Check if Google Gemini API key is configured
    console.log("[5] Checking Gemini API key");
    const geminiApiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.log("[ERROR] No Gemini API key configured");
      return new Response(
        JSON.stringify({
          error: "AI generation not configured. Please add GOOGLE_GEMINI_API_KEY to your Edge Function secrets."
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("[5.1] Gemini API key found");

    // Fetch newsletter AI model from settings
    console.log("[5.2] Fetching newsletter AI model from settings");
    const { data: modelSetting, error: modelError } = await supabaseClient
      .from("credit_system_settings")
      .select("setting_value")
      .eq("setting_key", "newsletter_ai_model")
      .single();

    const aiModel = modelSetting?.setting_value || "gemini-2.0-flash-exp";
    console.log("[5.3] Using AI model:", aiModel);

    // Fetch CHANGELOG.md from the repository
    console.log("[6] Fetching CHANGELOG");
    const changelogUrl = "https://raw.githubusercontent.com/mmollay/bazar-bolt/main/CHANGELOG.md";
    let changelogContent = "";

    try {
      const changelogResponse = await fetch(changelogUrl);
      if (changelogResponse.ok) {
        changelogContent = await changelogResponse.text();
        console.log("[6.1] CHANGELOG fetched, length:", changelogContent.length);
      } else {
        console.warn("[6.2] Could not fetch CHANGELOG.md (status:", changelogResponse.status, "), will generate without it");
        changelogContent = "Keine Changelog-Informationen verfügbar.";
      }
    } catch (error) {
      console.error("[ERROR] Error fetching CHANGELOG:", error);
      changelogContent = "Keine Changelog-Informationen verfügbar.";
    }

    // Get last 10 sent newsletters to avoid repetition
    console.log("[7] Fetching previous newsletters");
    const { data: previousNewsletters, error: newslettersError } = await supabaseClient
      .from("newsletters")
      .select("subject, body")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(10);

    if (newslettersError) {
      console.error("[ERROR] Error fetching previous newsletters:", newslettersError);
    } else {
      console.log("[7.1] Found", previousNewsletters?.length || 0, "previous newsletters");
    }

    // Build context for AI
    const previousContent = previousNewsletters && previousNewsletters.length > 0
      ? previousNewsletters.map(n => `Betreff: ${n.subject}\n${n.body.substring(0, 200)}...`).join("\n\n---\n\n")
      : "Keine bisherigen Newsletter vorhanden.";

    // Call Google Gemini API to generate newsletter
    console.log("[8] Building prompt for Gemini");
    const prompt = `Du bist ein professioneller Newsletter-Autor für die Plattform "HabDaWas" - einen Online-Flohmarkt und Community-Marktplatz.

=== CHANGELOG MIT ECHTEN FEATURES ===
${changelogContent}

=== BISHERIGE NEWSLETTER (NICHT WIEDERHOLEN) ===
${previousContent}

=== KRITISCHE ANWEISUNGEN ===
⚠️ DU DARFST NUR FEATURES ERWÄHNEN, DIE IM CHANGELOG STEHEN!
⚠️ ERFINDE KEINE FEATURES! KEINE SPEKULATIONEN!
⚠️ LIES DEN CHANGELOG GENAU UND EXTRAHIERE NUR ECHTE FEATURES!
⚠️ Wenn im CHANGELOG steht "Email-Template-System: Vollständiges Verwaltungssystem", dann schreibe genau DAS!
⚠️ Wenn im CHANGELOG steht "iOS Safe Area Support", dann schreibe genau DAS!
⚠️ KOPIERE DIE FEATURE-NAMEN AUS DEM CHANGELOG!

=== ANFORDERUNGEN ===
1. **PFLICHT**: Lese den CHANGELOG Zeile für Zeile
2. **PFLICHT**: Nimm NUR Features aus dem CHANGELOG - keine eigenen Ideen!
3. Wähle die 3-5 wichtigsten Features aus dem CHANGELOG
4. Schreibe in Du-Form, freundlich und persönlich
5. Verwende {{first_name}} in der Anrede (z.B. "Hallo {{first_name}}")
6. Max. 300 Wörter
7. Call-to-Action am Ende

=== HTML-FORMATIERUNG ===
Verwende diese HTML-Struktur für den body:

<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.6;">Hallo {{first_name}},</p>

  <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
    [Einleitungstext - freundlich, persönlich]
  </p>

  <h2 style="color: #667eea; font-size: 20px; margin-top: 30px; margin-bottom: 15px;">🎉 Das ist neu bei HabDaWas</h2>

  <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #667eea;">✨ [Feature-Name aus CHANGELOG]</h3>
    <p style="margin: 0; font-size: 14px; line-height: 1.5;">[Kurze Beschreibung - max 2 Sätze]</p>
  </div>

  [Weitere Feature-Boxen für 2-4 weitere Features aus dem CHANGELOG]

  <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
    [Call-to-Action Text]
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://habdawas.at" style="display: inline-block; background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600;">
      Jetzt ausprobieren →
    </a>
  </div>

  <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
    Viele Grüße,<br>
    Dein HabDaWas Team
  </p>
</div>

=== AUSGABEFORMAT ===
Antworte NUR mit diesem JSON (keine zusätzlichen Texte):
{
  "subject": "[Kurze, prägnante Betreffzeile mit echten Features aus CHANGELOG - max 60 Zeichen]",
  "header": "",
  "body": "[Vollständiger HTML-Code wie oben beschrieben - MIT ECHTEN FEATURES AUS DEM CHANGELOG!]",
  "footer": ""
}

STARTE JETZT: Lies den CHANGELOG, extrahiere die echten Features und erstelle den Newsletter!`;

    console.log("[9] Calling Gemini API with model:", aiModel);
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
          }
        }),
      }
    );

    console.log("[9.1] Gemini response status:", geminiResponse.status);
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[ERROR] Gemini API error (status", geminiResponse.status, "):", errorText);
      throw new Error("Failed to generate newsletter with AI: " + errorText.substring(0, 100));
    }

    console.log("[10] Parsing Gemini response");
    const geminiData = await geminiResponse.json();
    console.log("[10.1] Gemini response structure:", JSON.stringify(geminiData).substring(0, 200));

    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("[ERROR] Unexpected Gemini response structure:", JSON.stringify(geminiData));
      throw new Error("Unexpected response structure from Gemini API");
    }

    const generatedText = geminiData.candidates[0].content.parts[0].text;
    console.log("[10.2] Generated text length:", generatedText.length);

    // Extract JSON from response (Gemini might wrap it in markdown code blocks)
    console.log("[11] Extracting JSON from response");
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[ERROR] Could not find JSON in response:", generatedText.substring(0, 200));
      throw new Error("Could not parse AI response as JSON");
    }

    console.log("[12] Parsing JSON");
    const generated = JSON.parse(jsonMatch[0]);
    console.log("[12.1] Successfully generated newsletter with subject:", generated.subject);

    return new Response(
      JSON.stringify({
        subject: generated.subject,
        header: generated.header || "",
        body: generated.body,
        footer: generated.footer || "",
        source: "ai-generated",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating newsletter:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate newsletter",
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
