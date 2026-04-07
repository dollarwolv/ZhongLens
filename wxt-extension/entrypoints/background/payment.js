import { onMessage } from "webext-bridge/background";
import { supabase } from "./supabase";

const YOUR_DOMAIN =
  import.meta.env.VITE_WEBSITE_URL || "https://www.zhonglens.dev";

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

export async function getSubscriptionStatus({ useCached = true } = {}) {
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

    // if it's not fresh or cached is not supposed to be used
    const { data: sessionData } = await supabase.auth.getSession();

    // if no session is found, that means user is not logged in, and also obviously not subscribed
    if (!sessionData.session) {
      await setCachedSubscriptionStatus({ userSubscribed: false });
      return { ok: true, userSubscribed: false };
    }

    const userId = sessionData.session?.user?.id;

    // if there is no user id, then user is also not logged in and not subscribed either
    if (!userId) {
      await setCachedSubscriptionStatus({ userSubscribed: false });
      return { ok: true, userSubscribed: false };
    }

    // check subscription status in supabase
    const { data, error } = await supabase
      .from("stripe_customers")
      .select()
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // set userSubscribed true if data.plan has supporter, else false
    const userSubscribed = data?.plan === "supporter";

    await setCachedSubscriptionStatus({ userSubscribed });

    return { ok: true, userSubscribed };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

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
    // arrow function without {}, meaning implicit return, so doesn't require return statement
    async ({ data: { useCached = true } }) =>
      await getSubscriptionStatus({ useCached }),
  );

  onMessage("OPEN_CUSTOMER_PORTAL", async ({ data: { accessToken } }) => {
    const res = await fetch(`${YOUR_DOMAIN}/api/stripe/portal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const body = await res.json();

    if (!res.ok || !body?.stripeUrl) return { ok: false, error: body.error };

    return { ok: true, stripeUrl: body.stripeUrl };
  });
}
