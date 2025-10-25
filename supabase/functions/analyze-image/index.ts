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
  // Vehicle-specific attributes
  vehicle_brand?: string;  // e.g. "vw", "bmw", "mercedes"
  vehicle_year?: number;  // e.g. 2018
  vehicle_mileage?: number;  // e.g. 45000 (km)
  vehicle_fuel_type?: string;  // e.g. "diesel", "benzin", "elektro"
  vehicle_color?: string;  // e.g. "schwarz", "blau", "silber"
  vehicle_power_kw?: number;  // e.g. 110
  vehicle_first_registration?: string;  // e.g. "2018-03-15"
  vehicle_tuv_until?: string;  // e.g. "2025-06-30"
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

FAHRZEUG-SPEZIFISCHE ATTRIBUTE (NUR bei Kategorie "Fahrzeuge" oder "Autos" ausfüllen):
Bei Fahrzeugen (Autos, Motorräder, etc.) extrahiere zusätzlich:
- vehicle_brand: Marke als Slug (z.B. "vw", "bmw", "mercedes", "audi", "opel", "ford", "renault", "toyota", "tesla", "other")
- vehicle_year: Baujahr als Zahl (z.B. 2018)
- vehicle_mileage: Kilometerstand als Zahl (z.B. 45000 für 45.000 km)
- vehicle_fuel_type: Antrieb als Slug (z.B. "benzin", "diesel", "elektro", "hybrid", "plugin_hybrid")
- vehicle_color: Farbe als Slug (z.B. "schwarz", "weiss", "grau", "silber", "blau", "rot", "gruen", "andere")
- vehicle_power_kw: Leistung in kW als Zahl (z.B. 110 für 110 kW / 150 PS)
- vehicle_first_registration: Erstzulassung als Datum (z.B. "2018-03-15", Format: YYYY-MM-DD)
- vehicle_tuv_until: TÜV gültig bis als Datum (z.B. "2025-06-30", Format: YYYY-MM-DD)

⚠️ KRITISCH WICHTIG für Fahrzeuge - DOKUMENTEN-EXTRAKTION (OCR):
WENN du ein Bild mit einem DOKUMENT siehst (Zulassungsbescheinigung, Fahrzeugschein, Fahrzeugbrief):
1. PRIORISIERE die Daten aus dem Dokument über visuelle Einschätzungen
2. EXTRAHIERE die Daten DIREKT in die vehicle_* Felder (NICHT nur in die Beschreibung!)
3. Suche im Dokument nach diesen Feldern und übertrage sie 1:1:
   - "Erstzulassung" oder "First Registration" → vehicle_first_registration (Format: YYYY-MM-DD)
   - "B" oder "Datum der Erstzulassung" → vehicle_first_registration
   - Baujahr oder Herstellungsjahr → vehicle_year (nur die Jahreszahl als Zahl)
   - Kilometerstand (falls im Dokument) → vehicle_mileage (nur Zahl)
   - Marke/Hersteller (D.1 oder D.2) → vehicle_brand (als Slug konvertieren)
   - Kraftstoff/Antrieb (P.3) → vehicle_fuel_type (als Slug konvertieren)
   - Fahrzeugfarbe → vehicle_color (als Slug konvertieren)
   - Leistung (P.2) in kW oder PS → vehicle_power_kw (in kW konvertieren, 1 PS = 0.735 kW)
   - TÜV-Plakette oder HU-Datum → vehicle_tuv_until (Format: YYYY-MM-DD)

4. BEISPIELE für Dokumenten-Extraktion:
   - Siehst du "B: 15.03.2018" → vehicle_first_registration: "2018-03-15"
   - Siehst du "P.2: 81 kW (110 PS)" → vehicle_power_kw: 81
   - Siehst du "P.3: Diesel" → vehicle_fuel_type: "diesel"
   - Siehst du "D.1: Volkswagen" → vehicle_brand: "vw"

5. Bei MEHREREN Bildern: Wenn ein Bild ein Dokument zeigt und andere das Fahrzeug:
   - Nutze Dokument-Daten für technische Felder (Baujahr, Erstzulassung, kW, etc.)
   - Nutze Fahrzeug-Fotos für visuelle Beschreibung und Zustand

WICHTIG:
- Verwende NUR die vorgegebenen Slugs für brand, fuel_type und color
- Konvertiere PS in kW (1 PS = 0.735 kW)
- Wenn Daten NICHT im Dokument sichtbar sind, lasse das Feld leer (nicht raten!)

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

Beispiel (Fahrrad): {"title": "Woom Kinderfahrrad 16 Zoll", "description": "Hochwertiges Kinderfahrrad von Woom in ausgezeichnetem Zustand. Das leichte Aluminium-Fahrrad ist perfekt für Kinder ab 4 Jahren geeignet.", "price": 299.00, "category": "Sport", "subcategory": "Fahrräder", "condition": "good", "brand": "Woom", "size": "140x50x85 cm", "weight": "8,00 kg", "dimensions": {"length": "130cm", "width": "20cm", "height": "70cm"}, "material": "Aluminium, Stahl", "colors": ["Rot", "Schwarz"], "style": "sportlich minimalistisch", "features": ["Leichtgewicht", "Verstellbarer Sattel", "Handbremse"], "accessories": ["Pumpe", "Reflektoren"], "tags": ["kinderfahrrad", "woom", "leichtgewicht", "qualität"], "estimated_weight_kg": 8.0, "package_dimensions": {"length": 130, "width": 20, "height": 70}, "ai_shipping_domestic": 12.99, "ai_shipping_international": 28.99}

Beispiel (Fahrzeug): {"title": "VW Golf VII 1.6 TDI - Gepflegt und zuverlässig", "description": "Gut erhaltener VW Golf VII mit 1.6 TDI Motor in schwarzer Metallic-Lackierung. Das Fahrzeug bietet eine sparsame und zuverlässige Performance mit 81 kW (110 PS). Regelmäßig gewartet und TÜV neu.", "price": 12500.00, "category": "Fahrzeuge", "subcategory": "Autos", "condition": "good", "brand": "VW", "colors": ["Schwarz"], "features": ["Klimaanlage", "Navigationssystem", "Parkassistent", "Tempomat"], "tags": ["vw", "golf", "diesel", "sparsam", "gepflegt"], "estimated_weight_kg": 1300, "package_dimensions": {"length": 430, "width": 180, "height": 150}, "ai_shipping_domestic": 0, "ai_shipping_international": 0, "vehicle_brand": "vw", "vehicle_year": 2015, "vehicle_mileage": 125000, "vehicle_fuel_type": "diesel", "vehicle_color": "schwarz", "vehicle_power_kw": 81, "vehicle_first_registration": "2015-06-15", "vehicle_tuv_until": "2026-05-31"}`;
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

    // Note: Credit balance check is done in the frontend before publishing
    // The analysis itself doesn't deduct credits - only publishing does

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

    // Get AI model from settings
    const { data: aiModelSetting } = await supabaseClient
      .from("credit_system_settings")
      .select("setting_value")
      .eq("setting_key", "ai_model")
      .single();

    // Use gemini-1.5-pro for better OCR capabilities (especially for documents like Zulassungsschein)
    const aiModel = aiModelSetting?.setting_value || "gemini-1.5-pro";

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${geminiApiKey}`;
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

    // Get Gemini token usage for credit calculation
    // Credits are deducted when the item is published, not during analysis
    const geminiInputTokens = usageMetadata.promptTokenCount || 0;
    const geminiOutputTokens = usageMetadata.candidatesTokenCount || 0;
    const geminiTotalTokens = usageMetadata.totalTokenCount || 0;

    // Add token usage info to response for frontend to use
    result.tokenUsage = {
      inputTokens: geminiInputTokens,
      outputTokens: geminiOutputTokens,
      totalTokens: geminiTotalTokens,
      costTokens: geminiTotalTokens
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
