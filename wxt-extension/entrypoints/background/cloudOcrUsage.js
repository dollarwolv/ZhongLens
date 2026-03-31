import {
  CLOUD_OCR_FREE_LIMIT,
  normalizeCloudOcrUseCount,
} from "../../lib/cloudOcr";

const SERVER_OCR_URL = import.meta.env.VITE_SERVER_OCR_URL;

export async function getCloudOcrFreeUseCount() {
  const result = await chrome.storage.sync.get("cloudOcrFreeUseCount");
  return normalizeCloudOcrUseCount(result["cloudOcrFreeUseCount"]);
}

export async function setCloudOcrFreeUseCount(count) {
  await chrome.storage.sync.set({
    cloudOcrFreeUseCount: normalizeCloudOcrUseCount(count),
  });
}

export async function getAnonInstallId() {
  const result = await chrome.storage.sync.get("anonInstallId");
  let anonInstallId = result.anonInstallId;

  if (!anonInstallId) {
    anonInstallId = crypto.randomUUID();
    await chrome.storage.sync.set({ anonInstallId });
  }

  return anonInstallId;
}

function getCloudOcrUsageUrl() {
  if (!SERVER_OCR_URL) return null;

  try {
    return new URL("usage/", SERVER_OCR_URL).toString();
  } catch (error) {
    console.error("Failed to build Cloud OCR usage URL:", error);
    return null;
  }
}

export async function syncCloudOcrFreeUseCount() {
  const usageUrl = getCloudOcrUsageUrl();

  if (!usageUrl) {
    console.warn(
      "SERVER_OCR_URL is undefined. Skipping Cloud OCR usage count sync.",
    );
    return null;
  }

  try {
    const anonInstallId = await getAnonInstallId();
    const form = new FormData();
    form.append("anon_install_id", anonInstallId);

    const res = await fetch(usageUrl, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      let errorText = "Cloud OCR usage sync failed.";

      try {
        const errorBody = await res.json();
        errorText =
          typeof errorBody?.detail === "string" ? errorBody.detail : errorText;
      } catch {
        errorText = await res.text();
      }

      throw new Error(errorText);
    }

    const result = await res.json();
    const requestCount = normalizeCloudOcrUseCount(result?.request_count);

    await setCloudOcrFreeUseCount(requestCount);

    return {
      requestCount,
      maxFreeRequests:
        Number(result?.max_free_requests) || CLOUD_OCR_FREE_LIMIT,
    };
  } catch (error) {
    console.error("Failed to sync Cloud OCR usage count:", error);
    return null;
  }
}

export function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeOcrSpeed(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 2;
  }

  return Math.min(Math.max(Math.round(parsed), 1), 4);
}
