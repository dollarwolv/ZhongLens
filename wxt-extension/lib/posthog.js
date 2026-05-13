const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

const POSTHOG_CAPTURE_URL = `${POSTHOG_HOST}/i/v0/e/`;
const POSTHOG_USER_ID_STORAGE_KEY = "posthogUserId";
const ANON_INSTALL_ID_STORAGE_KEY = "anonInstallId";
const EXTENSION_INSTALL_TYPE = import.meta.env.DEV ? "development" : "normal";
const WEB_PAGE_PROTOCOLS = new Set(["http:", "https:"]);

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

function getWebOrigin(url) {
  try {
    const parsedUrl = new URL(url);
    if (!WEB_PAGE_PROTOCOLS.has(parsedUrl.protocol)) return null;
    // Keep analytics coarse-grained: origin only, never path/query/hash.
    return parsedUrl.origin;
  } catch {
    return null;
  }
}

async function getActiveTabOrigin() {
  try {
    if (!chrome.tabs?.query) return null;
    // Extension pages do not have the OCR page as their own location, so use
    // the active tab when Chrome exposes it and still reduce it to an origin.
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return getWebOrigin(activeTab?.url);
  } catch {
    return null;
  }
}

async function getPageOrigin() {
  // Content scripts run at the page URL, while popup/background contexts run at
  // extension URLs. Events without a web page context intentionally return null.
  const currentPageOrigin = getWebOrigin(globalThis.location?.href);
  if (currentPageOrigin) return currentPageOrigin;
  return await getActiveTabOrigin();
}

async function getExtensionContext() {
  return {
    extension_origin: chrome.runtime.getURL("").slice(0, -1),
    extension_install_type: EXTENSION_INSTALL_TYPE,
    is_unpacked_extension: EXTENSION_INSTALL_TYPE === "development",
    page_origin: await getPageOrigin(),
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
  const storedIds = await chrome.storage.sync.get([
    ANON_INSTALL_ID_STORAGE_KEY,
  ]);
  const anonInstallId = storedIds[ANON_INSTALL_ID_STORAGE_KEY];

  // Save the logged-in ID so future events are attached to this user.
  await chrome.storage.sync.set({ [POSTHOG_USER_ID_STORAGE_KEY]: userId });

  // "$identify" links the previous anonymous install ID to this logged-in ID.
  try {
    await sendEvent(
      "$identify",
      {
        ...(anonInstallId && anonInstallId !== userId
          ? { $anon_distinct_id: anonInstallId }
          : {}),
        $set: properties,
      },
      userId,
    );
  } catch (error) {
    // Login should still succeed even if the identify event fails.
    console.warn("[posthog] identify failed", error);
  }
}

export async function resetAnalytics() {
  // Remove the logged-in ID on logout. Future events go back to anonInstallId.
  await chrome.storage.sync.remove(POSTHOG_USER_ID_STORAGE_KEY);
}
