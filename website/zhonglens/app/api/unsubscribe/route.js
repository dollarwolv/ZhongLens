import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const unsubscribe_token = searchParams.get("unsubscribe_token");

    if (!unsubscribe_token) throw new Error("Missing unsubscribe token");

    const { error } = await supabase
      .from("waitlist_users")
      .update({
        subscribed_status: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", unsubscribe_token);

    if (error) throw error;
    return NextResponse.redirect(new URL("/unsubscribe", req.url));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
