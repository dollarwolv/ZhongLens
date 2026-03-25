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

  onMessage(
    "GET_SUBSCRIPTION_STATUS",
    async ({ data: { useCached = true } }) => {
      async function getCachedSubscriptionStatus() {
        const result = await chrome.storage.local.get("subscriptionStatus");
        return result["subscriptionStatus"] ?? null;
      }

      async function setCachedSubscriptionStatus(value) {
        await chrome.storage.local.set({
          ["subscriptionStatus"]: {
            ...value,
            checkedAt: Date.now(),
          },
        });
      }

      function isFresh(cache) {
        const SUBSCRIPTION_TTL_MS = 15 * 60 * 1000;
        return cache && Date.now() - cache.checkedAt < SUBSCRIPTION_TTL_MS;
      }

      try {
        if (useCached) {
          const cached = await getCachedSubscriptionStatus();

          if (isFresh(cached)) {
            return {
              ok: true,
              userSubscribed: cached.userSubscribed,
              cached: true,
            };
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) throw new Error("user isn't logged in.");

        const userId = sessionData.session?.user?.id;
        if (!userId) throw new Error("user id not found.");

        const { data } = await supabase
          .from("stripe_customers")
          .select()
          .eq("id", userId)
          .single();

        if (!data) {
          await setCachedSubscriptionStatus({ userSubscribed: false });
          return { ok: true, userSubscribed: false };
        }

        // this is to be changed: currently only checks if person has ever been subscribed, not unsubscribed
        if (data.plan === "supporter") {
          await setCachedSubscriptionStatus({ userSubscribed: true });
          return { ok: true, userSubscribed: true };
        }
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
  );
}
