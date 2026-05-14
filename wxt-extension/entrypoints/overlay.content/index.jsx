import ReactDOM from "react-dom/client";
import Overlay from "./Overlay";
import "~/assets/tailwind.app.css";
import { registerOverlayShortcuts } from "../../lib/shortcuts";
import { captureEvent } from "@/lib/posthog";
import { getOcrAnalyticsProperties } from "@/lib/ocrAnalytics";
import { sendMessage } from "webext-bridge/content-script";

async function getUserAnalyticsStatus() {
  // The shortcut runs in the page content script, so it asks the background
  // worker for the same auth/subscription state the popup already knows.
  const sessionRes = await sendMessage("AUTH_GET_SESSION", {}, "background");
  const isLoggedIn = Boolean(sessionRes?.session);
  let isSubscribed = false;

  if (isLoggedIn) {
    const subscriptionRes = await sendMessage(
      "GET_SUBSCRIPTION_STATUS",
      { useCached: true },
      "background",
    );
    isSubscribed = Boolean(subscriptionRes?.userSubscribed);
  }

  return { isLoggedIn, isSubscribed };
}

async function captureOcrRequestedFromShortcut() {
  try {
    const userStatus = await getUserAnalyticsStatus();
    const properties = await getOcrAnalyticsProperties({
      trigger: "shortcut",
      ...userStatus,
    });
    await captureEvent("ocr_requested", properties);
  } catch (error) {
    // Analytics should never break the shortcut itself.
    console.warn("Failed to capture ocr_requested from shortcut:", error);
  }
}

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "zhonglens-ocr-overlay",
      position: "fixed",
      anchor: "body",
      onMount: (container) => {
        const app = document.createElement("div");
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(
          <Overlay
            onClose={() => {
              ui.remove();
            }}
          />,
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    await registerOverlayShortcuts({
      openSettingKey: "openOCRShortcut",
      closeSettingKey: "closeOCRShortcut",
      openFallback: ["ctrl", "o"],
      closeFallback: ["ctrl", "l"],
      onOpen: () => {
        if (!ui.mounted) {
          ui.mount();
          void captureOcrRequestedFromShortcut();
        }
      },
      onClose: () => {
        ui.remove();
      },
      ctx,
    });

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "TOGGLE_OCR_OVERLAY") {
        try {
          if (!ui.mounted) {
            ui.mount();
            sendResponse({ ok: true, mounted: true });
          } else {
            ui.remove();
            sendResponse({ ok: true, mounted: false });
          }
        } catch (error) {
          sendResponse({ ok: false, error: String(error) });
        }
        return; // sync response
      }

      if (msg?.type === "GET_OCR_OVERLAY_STATE") {
        try {
          sendResponse({ ok: true, mounted: !!ui.mounted });
        } catch (error) {
          sendResponse({ ok: false, error: String(error) });
        }
        return; // sync response
      }
    });
  },
});
