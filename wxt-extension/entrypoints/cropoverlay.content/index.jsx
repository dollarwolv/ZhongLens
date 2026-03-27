import ReactDOM from "react-dom/client";
import CropOverlay from "./CropOverlay";
import "~/assets/tailwind.app.css";
import { registerOverlayShortcuts } from "../../lib/shortcuts";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "chinese-ocr-crop-overlay",
      position: "fixed",
      anchor: "body",
      onMount: (container) => {
        const app = document.createElement("div");
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(
          <CropOverlay
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
      openSettingKey: "openCropShortcut",
      closeSettingKey: "closeCropShortcut",
      openFallback: ["ctrl", "u"],
      closeFallback: ["ctrl", "i"],
      onOpen: () => {
        if (!ui.mounted) ui.mount();
      },
      onClose: () => {
        ui.remove();
      },
      ctx,
    });

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "TOGGLE_CROP_OVERLAY") {
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

      if (msg?.type === "GET_CROP_OVERLAY_STATE") {
        try {
          sendResponse({ ok: true, mounted: !!ui.mounted });
        } catch (error) {
          sendResponse({ ok: false, error: String(error) });
        }
        return; // sync response
      }
    });

    document.addEventListener("keydown", onKeyDown);
    ctx.onInvalidated(() => document.removeEventListener("keydown", onKeyDown));
  },
});
