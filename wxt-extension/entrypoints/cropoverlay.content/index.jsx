import ReactDOM from "react-dom/client";
import CropOverlay from "./CropOverlay";
import "~/assets/tailwind.content.css";

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

    function onKeyDown(e) {
      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        if (!ui.mounted) {
          ui.mount();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        ui.remove();
      }
    }

    document.addEventListener("keydown", (e) => onKeyDown(e));
    ctx.onInvalidated(() => document.removeEventListener("keydown", onKeyDown));
  },
});
