import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
        { ok: false, error: "Missing Authorization token" },
        { status: 401 },
      );
    }

    // Verify Supabase JWT and get user
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const user = userData.user;

    const { data, error } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.stripe_customer_id)
      return NextResponse.json(
        { ok: false, error: "User does not have subscription" },
        { status: 401 },
      );

    const stripeCustomerId = data.stripe_customer_id;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: "https://zhonglens.dev/account",
    });

    if (!session)
      return NextResponse.json(
        {
          ok: false,
          error: "Error creating portal session.",
        },
        { status: 500 },
      );

    return NextResponse.json(
      { ok: true, stripeUrl: session.url },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
}
