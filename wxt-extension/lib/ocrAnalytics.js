import { getRemainingCloudOcrUses } from "@/lib/cloudOcr";

export const NO_TEXT_FOUND_ERROR = "No text found. Please try again.";

export function normalizeOcrErrorMessage(errorMessage) {
  return String(errorMessage || "").toLowerCase();
}

export function getOcrFailureCode(errorMessage, processingMode) {
  const normalizedMessage = normalizeOcrErrorMessage(errorMessage);

  if (
    normalizedMessage.includes("free cloud ocr limit") ||
    normalizedMessage.includes("cloud ocr limit") ||
    normalizedMessage.includes("limit reached")
  ) {
    return "cloud_limit_reached";
  }

  if (normalizedMessage.includes("no text found")) {
    return "no_text_found";
  }

  if (processingMode === "server_ocr") {
    return "cloud_ocr_failed";
  }

  if (processingMode === "local_ocr") {
    return "local_ocr_failed";
  }

  return "unknown_ocr_failed";
}

export async function getOcrAnalyticsProperties({
  trigger,
  isLoggedIn,
  isSubscribed,
  response,
} = {}) {
  // These settings are saved in chrome.storage.sync, so both the popup and
  // content-script shortcut can describe OCR events the same way.
  const settings = await chrome.storage.sync.get([
    "serverProcessingEnabled",
    "crop",
    "cloudOcrFreeUseCount",
  ]);

  const properties = {
    processing_mode:
      response?.mode ||
      (settings.serverProcessingEnabled ? "server_ocr" : "local_ocr"),
    crop_enabled: Boolean(response?.crop ?? settings.crop),
    cloud_ocr_remaining: getRemainingCloudOcrUses(
      settings.cloudOcrFreeUseCount,
    ),
  };

  if (trigger) properties.trigger = trigger;
  if (typeof isLoggedIn !== "undefined") {
    properties.is_logged_in = Boolean(isLoggedIn);
  }
  if (typeof isSubscribed !== "undefined") {
    properties.is_subscribed = Boolean(isSubscribed);
  }

  return properties;
}
