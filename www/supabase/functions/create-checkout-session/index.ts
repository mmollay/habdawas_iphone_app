import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutRequest {
  packageId: string;
}

const PACKAGES: Record<string, { tokens: number; price: number; bonus: number; type: string }> = {
  supporter: { tokens: 500, price: 5.99, bonus: 0, type: 'donation' },
  starter: { tokens: 1000, price: 5.99, bonus: 0, type: 'purchase' },
  basic: { tokens: 3000, price: 14.99, bonus: 0, type: 'purchase' },
  pro: { tokens: 7000, price: 29.99, bonus: 0, type: 'purchase' },
  business: { tokens: 15000, price: 49.99, bonus: 0, type: 'purchase' },
};

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

    const { packageId }: CheckoutRequest = await req.json();

    if (!packageId || !PACKAGES[packageId]) {
      return new Response(
        JSON.stringify({ error: "Invalid package ID" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "Payment service not configured. Please contact administrator.",
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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });

    const pkg = PACKAGES[packageId];
    const totalTokens = pkg.tokens + pkg.bonus;

    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL") || "";

    const isDonation = pkg.type === 'donation';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: isDonation
                ? `Community Spende - ${totalTokens} Tokens`
                : `${totalTokens} Tokens`,
              description: isDonation
                ? `Unterstütze die Plattform - Finanziert ~${Math.round(totalTokens / 100)} Community-Inserate`
                : `Verbrauchsbasiertes Token-Paket für KI-Analysen`,
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tokens/buy?canceled=true`,
      metadata: {
        user_id: user.id,
        package_id: packageId,
        tokens: pkg.tokens.toString(),
        bonus: pkg.bonus.toString(),
        total_tokens: totalTokens.toString(),
        package_type: pkg.type,
      },
      customer_email: user.email,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create checkout session",
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
