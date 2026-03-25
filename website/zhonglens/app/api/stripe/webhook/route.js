import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
