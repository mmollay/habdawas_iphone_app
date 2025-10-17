import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.11.0";

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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
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

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    if (stripeWebhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeWebhookSecret
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Webhook signature verification failed" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else {
      event = JSON.parse(body);
      console.warn("WARNING: Webhook signature verification is disabled. This should only be used in development.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.error("No metadata found in session");
        return new Response(
          JSON.stringify({ error: "No metadata found" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const userId = metadata.user_id;
      const packageId = metadata.package_id;
      const tokens = parseInt(metadata.tokens || "0");
      const bonus = parseInt(metadata.bonus || "0");
      const totalTokens = parseInt(metadata.total_tokens || "0");

      if (!userId || !packageId || totalTokens === 0) {
        console.error("Invalid metadata:", metadata);
        return new Response(
          JSON.stringify({ error: "Invalid metadata" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log(`Processing payment for user ${userId}: ${totalTokens} credits (${tokens} + ${bonus} bonus)`);

      // Update personal credits in profiles table
      const { data: currentProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('personal_credits')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error("Error fetching user profile:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile", details: fetchError.message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const currentCredits = currentProfile?.personal_credits || 0;
      const newCredits = currentCredits + totalTokens;

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ personal_credits: newCredits })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating personal credits:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update credits", details: updateError.message }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Also create transaction record for history (optional, but good practice)
      await supabaseClient.from('credit_transactions').insert({
        user_id: userId,
        amount: totalTokens,
        transaction_type: 'purchase',
        description: `Stripe payment: ${packageId}`,
        metadata: {
          package_id: packageId,
          tokens: tokens,
          bonus: bonus,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          amount_paid: session.amount_total ? (session.amount_total / 100) : 0,
          currency: session.currency,
        }
      });

      console.log(`Successfully added ${totalTokens} credits to user ${userId} (${currentCredits} → ${newCredits})`);

      return new Response(
        JSON.stringify({ success: true, tokens_added: totalTokens }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Webhook handler failed",
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
