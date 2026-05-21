import ReactDOM from "react-dom/client";
import CropOverlay from "./CropOverlay";
import "~/assets/tailwind.app.css";
import { registerOverlayShortcuts } from "../../lib/shortcuts";

const CROP_DIALOG_ID = "zhonglens-crop-overlay-dialog";
const CROP_DIALOG_STYLE_ID = "zhonglens-crop-overlay-dialog-style";

// The native dialog top layer sits above normal page stacking contexts. This is
// stronger than z-index and is needed for pages like YouTube with fixed chrome.
function ensureCropDialogStyles() {
  if (document.getElementById(CROP_DIALOG_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = CROP_DIALOG_STYLE_ID;
  style.textContent = `
    #${CROP_DIALOG_ID}::backdrop {
      background: transparent;
    }
  `;
  document.head.append(style);
}

// Removes the top-layer dialog wrapper that holds the shadow-root crop UI.
function removeCropDialog() {
  const dialog = document.getElementById(CROP_DIALOG_ID);

  if (dialog instanceof HTMLDialogElement && dialog.open) {
    dialog.close();
  }

  dialog?.remove();
  document.getElementById(CROP_DIALOG_STYLE_ID)?.remove();
}

// Forces the shadow host itself to occupy the whole viewport. This prevents the
// host's default 0x0 WXT wrapper box from limiting paint or pointer hit testing.
function pinShadowHostToViewport(shadowHost) {
  shadowHost.style.setProperty("position", "fixed", "important");
  shadowHost.style.setProperty("inset", "0", "important");
  shadowHost.style.setProperty("width", "100vw", "important");
  shadowHost.style.setProperty("height", "100vh", "important");
  shadowHost.style.setProperty("display", "block", "important");
  shadowHost.style.setProperty("overflow", "visible", "important");
  shadowHost.style.setProperty("z-index", "2147483647", "important");
}

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "chinese-ocr-crop-overlay",
      position: "modal",
      zIndex: 2147483647,
      anchor: () => document.documentElement,
      append: (anchor, shadowHost) => {
        removeCropDialog();
        ensureCropDialogStyles();
        pinShadowHostToViewport(shadowHost);

        const dialog = document.createElement("dialog");
        dialog.id = CROP_DIALOG_ID;
        dialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          ui.remove();
        });
        Object.assign(dialog.style, {
          position: "fixed",
          inset: "0",
          width: "100vw",
          height: "100vh",
          maxWidth: "none",
          maxHeight: "none",
          margin: "0",
          padding: "0",
          border: "0",
          background: "transparent",
          overflow: "visible",
        });

        dialog.append(shadowHost);
        anchor.append(dialog);

        try {
          dialog.showModal();
        } catch {
          dialog.show();
        }
      },
      onMount: (container, _shadow, shadowHost) => {
        pinShadowHostToViewport(shadowHost);

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
        removeCropDialog();
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
  },
});
