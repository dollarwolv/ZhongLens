import { getRemainingCloudOcrUses } from "@/lib/cloudOcr";

export async function getOcrAnalyticsProperties({
  trigger,
  isLoggedIn,
  isSubscribed,
} = {}) {
  // These settings are saved in chrome.storage.sync, so both the popup and
  // content-script shortcut can describe the OCR request the same way.
  const settings = await chrome.storage.sync.get([
    "serverProcessingEnabled",
    "crop",
    "cloudOcrFreeUseCount",
  ]);

  return {
    trigger,
    processing_mode: settings.serverProcessingEnabled
      ? "server_ocr"
      : "local_ocr",
    crop_enabled: Boolean(settings.crop),
    is_logged_in: Boolean(isLoggedIn),
    is_subscribed: Boolean(isSubscribed),
    cloud_ocr_remaining: getRemainingCloudOcrUses(
      settings.cloudOcrFreeUseCount,
    ),
  };
}
