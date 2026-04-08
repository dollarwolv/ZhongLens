import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getUnsubscribeUrl } from "@/utils/app-url";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email } = await req.json();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error, status } = await supabase
      .from("waitlist_users")
      .upsert(
        { email: normalizedEmail, subscribed_status: true },
        { onConflict: "email" },
      )
      .select();

    if (error) throw error;
    if (status === 200)
      return NextResponse.json({ ok: true, data: data, sent: false });

    if (!data[0].unsubscribed_at) {
      const unsubscribeUrl = getUnsubscribeUrl(data[0].unsubscribe_token);
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `Justin from ZhongLens <updates@zhonglens.dev>`,
        to: [normalizedEmail],
        subject: "Thanks for your interest in ZhongLens!",
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
        html: `
      <p>
        Hey there, <br><br>
        you've just signed up to receive updates from ZhongLens! Thanks so much for your interest. <br><br>
        I'm working hard to get ZhongLens released as soon as possible. Once it's ready, you'll be the first to hear from me! <br><br>
        If you have any questions, feel free to contact me at support@zhonglens.dev. <br>
        If that shouldn't work for some reason, please send me a DM on reddit: u/heyguysitsjustin. <br><br>
        You'll hear from me soon!<br><br>
      </p>

      <span>If you would like to unsubscribe from this newsletter, click this link: <a href="${unsubscribeUrl}">unsubscribe</a></span>`,
      });
      if (emailError) throw emailError;
      return NextResponse.json({ ok: true, data: data, sent: true });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, sent: false, error: error.message });
  }
}
