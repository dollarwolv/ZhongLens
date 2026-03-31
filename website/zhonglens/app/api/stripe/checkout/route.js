import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const priceMap = {
  monthly: "price_1T5KcKEI5TwrmxmbiObj3Fne",
  lifetime: "price_1TGtOFEI5TwrmxmbotOuUgN8",
};

export async function POST(req) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = await createClient();
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Authorization token" },
        { status: 401 },
      );
    }

    // Verify Supabase JWT and get user
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = userData.user;

    const body = await req.json();
    const type = body.type;

    if (!type || !(type in priceMap)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const mode = type === "monthly" ? "subscription" : "payment";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const price = priceMap[type];

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],

      allow_promotion_codes: true,

      // If you want Stripe to create a Customer in payment mode too:
      customer_creation: mode === "payment" ? "always" : undefined,

      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,

      // Tie Stripe objects back to your user
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        tier: "supporter",
        billing: type, // monthly | lifetime
      },

      // Put metadata onto subscription/payment intent too (helps in webhooks)
      subscription_data:
        mode === "subscription"
          ? {
              metadata: {
                supabase_user_id: user.id,
                tier: "supporter",
                billing: "monthly",
              },
            }
          : undefined,

      payment_intent_data:
        mode === "payment"
          ? {
              metadata: {
                supabase_user_id: user.id,
                tier: "supporter",
                billing: "lifetime",
              },
            }
          : undefined,

      automatic_tax: { enabled: true },
    });

    if (!session) throw new Error("Error during session creation.");
    return NextResponse.json(
      { ok: true, stripeUrl: session.url },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse(
      { ok: false, error: error.message || "Unknown error" },
      { status: 500 },
    );
  }
}
