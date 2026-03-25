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
    if (event.type === "checkout.session.completed") {
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
        typeof session.subscription === "string" ? session.subscription : null;

      const { error } = await supabaseAdmin.from("stripe_customers").upsert({
        id: userId,
        plan: "supporter",
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return new NextResponse(`Webhook handler error: ${error.message}`, {
      status: 500,
    });
  }
}
