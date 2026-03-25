import { onMessage } from "webext-bridge/background";
import { supabase } from "./supabase";

const YOUR_DOMAIN = "http://127.0.0.1:3000";

export function initPaymentHandlers() {
  onMessage(
    "STRIPE_START_CHECKOUT_SESSION",
    async ({ data: { type, accessToken } }) => {
      try {
        console.log("access token: " + accessToken);
        const res = await fetch(`${YOUR_DOMAIN}/api/stripe/checkout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type,
          }),
        });
        const body = await res.json();
        if (res.ok) {
          return { ok: true, stripeUrl: body.stripeUrl };
        } else {
          throw new Error(res.error);
        }
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
  );
}
