const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

const POSTHOG_CAPTURE_URL = `${POSTHOG_HOST}/i/v0/e/`;
const POSTHOG_USER_ID_STORAGE_KEY = "posthogUserId";
const ANON_INSTALL_ID_STORAGE_KEY = "anonInstallId";

export async function getAnalyticsDistinctId() {
  // If the user has logged in, use their email as the PostHog distinct_id.
  const storedIds = await chrome.storage.sync.get([
    POSTHOG_USER_ID_STORAGE_KEY,
    ANON_INSTALL_ID_STORAGE_KEY,
  ]);

  if (storedIds[POSTHOG_USER_ID_STORAGE_KEY]) {
    return storedIds[POSTHOG_USER_ID_STORAGE_KEY];
  }

  // Before login, use the anonymous install ID created by the background script.
  if (storedIds[ANON_INSTALL_ID_STORAGE_KEY]) {
    return storedIds[ANON_INSTALL_ID_STORAGE_KEY];
  }

  // This fallback should rarely run, but it keeps analytics working even if the
  // background install setup has not created an ID yet.
  const anonInstallId = crypto.randomUUID();
  await chrome.storage.sync.set({
    [ANON_INSTALL_ID_STORAGE_KEY]: anonInstallId,
  });
  return anonInstallId;
}

// this function checks whether the extension context is a dev server or a normally installed extension.
async function getExtensionContext() {
  let installType = "unknown";

  try {
    if (chrome.management?.getSelf) {
      const self = await chrome.management.getSelf();
      installType = self.installType;
    }
  } catch {
    // Leave analytics non-blocking.
  }

  return {
    extension_origin: globalThis.location?.origin,
    extension_install_type: installType,
    is_unpacked_extension: installType === "development",
  };
}

async function sendEvent(event, properties = {}, distinctId) {
  // PostHog's capture API needs three things: api_key, event, and distinct_id.

  const propertiesWithContext = {
    ...properties,
    ...(await getExtensionContext()),
  };

  const body = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: distinctId || (await getAnalyticsDistinctId()),
    properties: propertiesWithContext,
  };

  const response = await fetch(POSTHOG_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Keep this warning small: if something is wrong, the status code is the
  // fastest clue in the browser console.
  if (!response.ok) {
    console.warn(`[posthog] ${event} failed with status ${response.status}`);
  }
}

export async function captureEvent(event, properties) {
  // Use this for normal product events, like "checkout_initiated".
  try {
    await sendEvent(event, properties);
  } catch (error) {
    // Analytics should never block the app if PostHog is unreachable.
    console.warn(`[posthog] ${event} failed`, error);
  }
}

export async function identifyUser(userId, properties = {}) {
  // Save the logged-in ID so future events are attached to this user.
  await chrome.storage.sync.set({ [POSTHOG_USER_ID_STORAGE_KEY]: userId });

  // "$identify" is PostHog's special event for setting user properties.
  try {
    await sendEvent("$identify", { $set: properties }, userId);
  } catch (error) {
    // Login should still succeed even if the identify event fails.
    console.warn("[posthog] identify failed", error);
  }
}

export async function resetAnalytics() {
  // Remove the logged-in ID on logout. Future events go back to anonInstallId.
  await chrome.storage.sync.remove(POSTHOG_USER_ID_STORAGE_KEY);
}
