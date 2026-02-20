import ReactDOM from "react-dom/client";
import Overlay from "./Overlay";
import "~/assets/tailwind.content.css";
// import { onMessage } from "webext-bridge/content-script";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main(ctx) {
    const ui = await createIntegratedUi(ctx, {
      position: "fixed",
      anchor: "body",
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
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

    function onKeyDown(e) {
      if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        if (!ui.mounted) {
          ui.mount();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.remove();
      }
    }

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

    document.addEventListener("keydown", (e) => onKeyDown(e));
    ctx.onInvalidated(() => document.removeEventListener("keydown", onKeyDown));
  },
});
