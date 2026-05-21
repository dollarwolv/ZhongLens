import ReactDOM from "react-dom/client";
import Overlay from "./Overlay";
import "~/assets/tailwind.app.css";
import { registerOverlayShortcuts } from "../../lib/shortcuts";
import { captureEvent } from "@/lib/posthog";
import { getOcrAnalyticsProperties } from "@/lib/ocrAnalytics";
import { sendMessage } from "webext-bridge/content-script";

const OCR_POPOVER_ID = "zhonglens-ocr-overlay-popover";

// Popovers use the browser top layer like modal dialogs, but they do not make
// the rest of the document inert. That keeps OCR text compatible with popup
// dictionary extensions while still beating high-z-index page chrome.
function removeOcrPopover() {
  const popover = document.getElementById(OCR_POPOVER_ID);

  if (popover?.matches(":popover-open")) {
    popover.hidePopover();
  }

  popover?.remove();
}

// Keeps WXT's shadow host in the top layer without giving it a viewport-sized
// hit-test box. The React overlay still uses fixed-position children.
function pinShadowHostToTopLeft(shadowHost) {
  shadowHost.style.setProperty("position", "fixed", "important");
  shadowHost.style.setProperty("top", "0", "important");
  shadowHost.style.setProperty("left", "0", "important");
  shadowHost.style.setProperty("width", "0", "important");
  shadowHost.style.setProperty("height", "0", "important");
  shadowHost.style.setProperty("display", "block", "important");
  shadowHost.style.setProperty("overflow", "visible", "important");
  shadowHost.style.setProperty("pointer-events", "none", "important");
  shadowHost.style.setProperty("z-index", "2147483647", "important");
}

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
      position: "inline",
      anchor: () => document.documentElement,
      append: (anchor, shadowHost) => {
        removeOcrPopover();
        pinShadowHostToTopLeft(shadowHost);

        const popover = document.createElement("div");
        popover.id = OCR_POPOVER_ID;
        popover.setAttribute("popover", "manual");
        Object.assign(popover.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "0",
          height: "0",
          maxWidth: "none",
          maxHeight: "none",
          margin: "0",
          padding: "0",
          border: "0",
          background: "transparent",
          overflow: "visible",
          pointerEvents: "none",
        });

        popover.append(shadowHost);
        anchor.append(popover);

        try {
          popover.showPopover();
        } catch {
          // If the browser cannot open the popover, the overlay still works as
          // a normal fixed element; it just loses top-layer priority.
        }
      },
      onMount: (container, _shadow, shadowHost) => {
        pinShadowHostToTopLeft(shadowHost);

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
        removeOcrPopover();
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
