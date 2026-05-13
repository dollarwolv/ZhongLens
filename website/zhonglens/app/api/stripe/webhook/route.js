import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const POSTHOG_KEY =
  process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://eu.i.posthog.com";

async function captureCheckoutCompleted(session) {
  if (!POSTHOG_KEY) {
    console.warn("Skipping checkout_completed analytics: POSTHOG_KEY is unset");
    return;
  }

  const distinctId =
    session.metadata?.posthog_distinct_id ||
    session.metadata?.supabase_user_id ||
    session.client_reference_id;

  if (!distinctId) {
    console.warn("Skipping checkout_completed analytics: missing distinct id");
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  const response = await fetch(`${POSTHOG_HOST}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: "checkout_completed",
      distinct_id: distinctId,
      properties: {
        billing_type: session.metadata?.billing,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_mode: session.mode,
        amount_total: session.amount_total,
        currency: session.currency,
      },
    }),
  });

  if (!response.ok) {
    console.warn(
      `checkout_completed analytics failed with status ${response.status}`,
    );
  }
}

export async function POST(req) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe signature", { status: 400 });
  }

  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.metadata?.supabase_user_id;
        if (!userId) {
          return new NextResponse("Missing supabase_user_id in metadata", {
            status: 400,
          });
        }

        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;

        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : null;

        const { error } = await supabaseAdmin.from("stripe_customers").upsert({
          id: userId,
          plan: "supporter",
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        });

        if (error) {
          throw error;
        }

        try {
          await captureCheckoutCompleted(session);
        } catch (error) {
          console.warn("checkout_completed analytics failed", error);
        }

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        const { error } = await supabaseAdmin
          .from("stripe_customers")
          .update({
            plan: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Failed to process subscription deletion:", error);
        }

        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return new NextResponse(`Webhook handler error: ${error.message}`, {
      status: 500,
    });
  }
}
