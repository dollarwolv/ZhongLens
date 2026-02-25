import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { email } = await req.json();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("waitlist_users")
      .upsert(
        { email: normalizedEmail, subscribed_status: true },
        { onConflict: "email" },
      )
      .select();

    if (error) throw error;
    console.log(data);
    return NextResponse.json({ ok: true, data: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
