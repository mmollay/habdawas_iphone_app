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
    const prompt = `Du bist ein freundlicher Newsletter-Autor für die Plattform "HabDaWas" - einen Online-Flohmarkt und Community-Marktplatz.

Deine Aufgabe ist es, einen ansprechenden Newsletter zu erstellen, der die neuesten Features und Verbesserungen der Plattform vorstellt.

CHANGELOG (neueste Änderungen):
${changelogContent}

BISHERIGE NEWSLETTER (um Wiederholungen zu vermeiden):
${previousContent}

ANFORDERUNGEN:
1. Erstelle einen NEUEN Newsletter, der sich von den bisherigen unterscheidet
2. Konzentriere dich auf die neuesten Features aus dem CHANGELOG
3. Schreibe in einem freundlichen, persönlichen Ton
4. Verwende Du-Form und sprich die Community direkt an
5. Hebe die Vorteile für die Nutzer hervor
6. Halte es prägnant (max. 300 Wörter)
7. Verwende Platzhalter wie {{name}} oder {{first_name}} für Personalisierung
8. Füge einen Call-to-Action am Ende hinzu

AUSGABEFORMAT - Antworte NUR mit einem gültigen JSON-Objekt ohne zusätzlichen Text:
{
  "subject": "Betreffzeile (max. 60 Zeichen, ansprechend)",
  "header": "Optional: Kurzer Header-Text (z.B. 'HabDaWas - Deine Community-Plattform' oder 'Hallo {{first_name}}!')",
  "body": "Newsletter-Text mit Platzhaltern",
  "footer": "Footer mit rechtlichen Informationen: Abmelde-Link {{unsubscribe_link}}, Impressum-Link, Firmenadresse (DSGVO-konform)"
}

Generiere jetzt einen neuen, einzigartigen Newsletter:`;

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
            temperature: 0.7,
            maxOutputTokens: 2000,
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
