import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  imageData: string;
  userId?: string;
  shippingCountry?: string;
  additionalNotes?: string;
  itemId?: string;
}

interface UserSettings {
  ai_text_style: string;
  ai_text_length: string;
  ai_include_emoji: boolean;
  ai_allow_line_breaks: boolean;
}

interface AnalyzeResponse {
  title: string;
  description: string;
  price: number;
  category?: string;
  subcategory?: string;
  condition?: string;
  brand?: string;
  size?: string;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  material?: string;
  colors?: string[];
  style?: string;
  serialNumber?: string;
  features?: string[];
  accessories?: string[];
  tags?: string[];
  estimated_weight_kg?: number;
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  ai_shipping_domestic?: number;
  ai_shipping_international?: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costTokens: number;
  };
}

function buildPrompt(settings: UserSettings, shippingCountry: string = 'DE', additionalNotes?: string): string {
  const styleMap: Record<string, string> = {
    formal: "sehr förmlich und professionell",
    casual: "locker, freundlich und ungezwungen",
    detailed: "sehr ausführlich und detailreich",
    concise: "kurz, prägnant und auf den Punkt",
    balanced: "ausgewogen mit guter Balance zwischen Detail und Kürze",
  };

  const lengthMap: Record<string, string> = {
    short: "2-3 kurze Sätze",
    medium: "4-6 Sätze mit angemessener Detailtiefe",
    long: "7-10 ausführliche Sätze mit vielen Details",
  };

  const styleInstruction = styleMap[settings.ai_text_style] || styleMap.balanced;
  const lengthInstruction = lengthMap[settings.ai_text_length] || lengthMap.medium;
  const emojiInstruction = settings.ai_include_emoji
    ? "Verwende passende Emojis in der Beschreibung, um sie ansprechender zu machen."
    : "Verwende KEINE Emojis in der Beschreibung.";
  const lineBreakInstruction = settings.ai_allow_line_breaks
    ? "Strukturiere den Text mit Zeilenumbrüchen (\\n) für bessere Lesbarkeit. Verwende Absätze, um verschiedene Aspekte zu trennen."
    : "Schreibe den Text als durchgehenden Fließtext OHNE Zeilenumbrüche.";

  const notesSection = additionalNotes ? `

ZUSÄTZLICHE INFORMATIONEN VOM VERKÄUFER:
${additionalNotes}

WICHTIG: Berücksichtige diese zusätzlichen Informationen bei der Erstellung von Titel, Beschreibung und Preis:
- Wenn "Erbstück" oder "wertvoll" erwähnt wird, betone den emotionalen/historischen Wert in der Beschreibung
- Bei "Notverkauf" oder "schnell verkaufen" setze den Preis etwas niedriger an
- Versteckte Mängel oder besondere Merkmale MÜSSEN in der Beschreibung erwähnt werden
- Bei "Originalverpackung" oder "neu" erhöhe den Preis entsprechend
- Technische Details oder Funktionszustände in die Beschreibung einarbeiten
` : '';

  return `Analysiere dieses Bild eines Artikels für einen Online-Marktplatz sehr detailliert. Erstelle auf Deutsch:${notesSection}

PFLICHTFELDER:
- title: Kurzer, ansprechender Titel (max 60 Zeichen)
- description: Beschreibung im Stil: ${styleInstruction}. Länge: ${lengthInstruction}. ${emojiInstruction} ${lineBreakInstruction}
- price: Geschätzter Preis in EUR (nur Zahl)

PRODUKT-DETAILS (extrahiere so viele Informationen wie möglich):
- category: Hauptkategorie (z.B. "Elektronik", "Möbel", "Kleidung", "Sport", "Haushalt", "Fahrzeuge", "Garten")
- subcategory: Unterkategorie (z.B. "Smartphones", "Sofas", "Herrenschuhe", "Fahrräder")
- condition: Zustand (WICHTIG: Verwende NUR diese englischen Werte: "new", "like_new", "good", "acceptable", "defective")
- brand: Marke/Hersteller (falls Logo oder Branding erkennbar, z.B. "Woom", "Apple", "IKEA")
- size: Größe (z.B. "XL", "42", "140x50x85 cm")
- weight: Geschätztes Gewicht (z.B. "500g", "2kg", "8,00 kg")
- dimensions: Abmessungen als Objekt mit length, width, height (z.B. {"length": "130cm", "width": "20cm", "height": "70cm"})
- material: Material(ien) (z.B. "Holz", "Metall", "Kunststoff", "Textil", "Leder", "Aluminium", "Stahl")
- colors: Array der erkennbaren Farben (z.B. ["Schwarz", "Rot", "Blau"])
- style: Stil (z.B. "modern", "klassisch", "sportlich", "retro", "minimalistisch", "sportlich minimalistisch")
- serialNumber: Seriennummer/Modellnummer falls sichtbar
- features: Array wichtiger Merkmale/Besonderheiten (z.B. ["Bluetooth", "Wasserdicht", "LED-Display", "Verstellbar"])
- accessories: Array sichtbarer Zubehörteile (z.B. ["Fernbedienung", "Ladekabel", "Verpackung", "Pumpe"])
- tags: Array relevanter Suchbegriffe/Meta-Tags (z.B. ["vintage", "nachhaltig", "handmade", "limitiert", "kinderfahrrad"])

VERSANDKOSTENBERECHNUNG (PFLICHT - sehr wichtig für Verkäufer):
Der Versand erfolgt von: ${shippingCountry}
Berechne realistische Versandkosten basierend auf Größe, Gewicht und Versandland des Artikels:
- estimated_weight_kg: Geschätztes Gewicht in Kilogramm als Zahl (z.B. 8.5 für 8,5kg)
- package_dimensions: Geschätzte Paketmaße in Zentimetern als Objekt mit Zahlen (z.B. {"length": 130, "width": 20, "height": 70})
- ai_shipping_domestic: Geschätzte Versandkosten innerhalb ${shippingCountry} in EUR als Zahl (basierend auf lokalen Versanddienstleister-Preisen)
- ai_shipping_international: Geschätzte Versandkosten ins EU-Ausland in EUR als Zahl (ca. 1.5-2x domestic)

VERSANDKOSTEN-RICHTLINIEN für ${shippingCountry}:
${shippingCountry === 'AT' ? `- Päckchen bis 2kg (max 60x30x15cm): domestic 4-8€, international 10-17€
- Pakete 2-5kg (max 120x60x60cm): domestic 8-14€, international 19-28€
- Pakete 5-10kg: domestic 12-18€, international 28-38€
- Pakete 10-20kg: domestic 18-28€, international 38-55€
- Pakete 20-31.5kg: domestic 28-45€, international 55-85€
- Sperrgut (über 120cm Länge oder über 31.5kg): domestic 45-90€, international 85-160€` : `- Päckchen bis 2kg (max 60x30x15cm): domestic 4-7€, international 9-15€
- Pakete 2-5kg (max 120x60x60cm): domestic 7-12€, international 17-25€
- Pakete 5-10kg: domestic 10-16€, international 25-35€
- Pakete 10-20kg: domestic 15-25€, international 35-50€
- Pakete 20-31.5kg: domestic 25-40€, international 50-80€
- Sperrgut (über 120cm Länge oder über 31.5kg): domestic 40-80€, international 80-150€`}

WICHTIG: Extrahiere ALLE sichtbaren und erkennbaren Details. Sei gründlich bei:
- Markenlogos und Markennamen
- Sichtbaren Maßen, Größenangaben oder Dimensionen
- Material-Eigenschaften (Oberflächen, Texturen)
- Farben und Farbkombinationen
- Stil und Design-Merkmale
- Besondere Features und Funktionen
- Mitgeliefertes Zubehör
- GEWICHT und GRÖSSE für präzise Versandkostenberechnung

Antworte NUR mit einem gültigen JSON-Objekt. Lasse Felder weg, wenn du dir nicht sicher bist, ABER Versandkosten-Felder sind PFLICHT.

Beispiel: {"title": "Woom Kinderfahrrad 16 Zoll", "description": "Hochwertiges Kinderfahrrad von Woom in ausgezeichnetem Zustand. Das leichte Aluminium-Fahrrad ist perfekt für Kinder ab 4 Jahren geeignet.", "price": 299.00, "category": "Sport", "subcategory": "Fahrräder", "condition": "good", "brand": "Woom", "size": "140x50x85 cm", "weight": "8,00 kg", "dimensions": {"length": "130cm", "width": "20cm", "height": "70cm"}, "material": "Aluminium, Stahl", "colors": ["Rot", "Schwarz"], "style": "sportlich minimalistisch", "features": ["Leichtgewicht", "Verstellbarer Sattel", "Handbremse"], "accessories": ["Pumpe", "Reflektoren"], "tags": ["kinderfahrrad", "woom", "leichtgewicht", "qualität"], "estimated_weight_kg": 8.0, "package_dimensions": {"length": 130, "width": 20, "height": 70}, "ai_shipping_domestic": 12.99, "ai_shipping_international": 28.99}`;
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

    const { imageData, shippingCountry, additionalNotes, itemId }: AnalyzeRequest = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check token balance
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("user_tokens")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token balance not found" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const estimatedTokensNeeded = 2500;
    if (tokenData.balance < estimatedTokensNeeded) {
      return new Response(
        JSON.stringify({
          error: "Insufficient tokens",
          insufficientTokens: true,
          currentBalance: tokenData.balance,
          required: estimatedTokensNeeded
        }),
        {
          status: 402,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("ai_text_style, ai_text_length, ai_include_emoji, ai_allow_line_breaks")
      .eq("id", user.id)
      .single();

    const userSettings: UserSettings = {
      ai_text_style: profile?.ai_text_style || "balanced",
      ai_text_length: profile?.ai_text_length || "medium",
      ai_include_emoji: profile?.ai_include_emoji ?? false,
      ai_allow_line_breaks: profile?.ai_allow_line_breaks ?? false,
    };

    const finalShippingCountry = shippingCountry || 'DE';

    const geminiApiKey = "AIzaSyDxzY3yBaQ8kPWpjs-ZzTF7K6_cq9eIsc8";
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "AI service not configured. Please contact administrator.",
          needsConfig: true 
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;
    const prompt = buildPrompt(userSettings, finalShippingCountry, additionalNotes);

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(",")[1] || imageData,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `AI analysis failed (Status: ${geminiResponse.status})`,
          details: errorText.substring(0, 200)
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

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usageMetadata = geminiData.usageMetadata || {};

    let result: AnalyzeResponse;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", generatedText);
      result = {
        title: "Artikel zu verkaufen",
        description: "Bitte fügen Sie eine Beschreibung für diesen Artikel hinzu.",
        price: 10.0,
      };
    }

    // Calculate actual token cost based on Gemini usage
    // Gemini 2.0 Flash costs: Input $0.10/1M, Output $0.40/1M
    // Our internal token value: We charge based on total Gemini tokens used
    const geminiInputTokens = usageMetadata.promptTokenCount || 0;
    const geminiOutputTokens = usageMetadata.candidatesTokenCount || 0;
    const geminiTotalTokens = usageMetadata.totalTokenCount || 0;

    // Calculate actual cost and convert to our internal tokens
    // We use a 1:1 mapping where 1 internal token = 1 Gemini token
    const tokensToDeduct = geminiTotalTokens;

    // Deduct actual consumed tokens using the database function
    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: deductError } = await serviceRoleClient.rpc('deduct_tokens', {
      p_user_id: user.id,
      p_amount: tokensToDeduct,
      p_item_id: itemId || null,
      p_gemini_input_tokens: geminiInputTokens,
      p_gemini_output_tokens: geminiOutputTokens,
      p_gemini_total_tokens: geminiTotalTokens,
      p_metadata: {
        analysis_type: 'image_analysis',
        shipping_country: finalShippingCountry,
        has_additional_notes: !!additionalNotes
      }
    });

    if (deductError) {
      console.error("Error deducting tokens:", deductError);
    }

    // Add token usage info to response
    result.tokenUsage = {
      inputTokens: geminiInputTokens,
      outputTokens: geminiOutputTokens,
      totalTokens: geminiTotalTokens,
      costTokens: tokensToDeduct
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
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
