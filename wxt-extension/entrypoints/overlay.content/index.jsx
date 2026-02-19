import ReactDOM from "react-dom/client";
import Overlay from "./Overlay";
import "~/assets/tailwind.content.css";

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

    document.addEventListener("keydown", (e) => onKeyDown(e));
    ctx.onInvalidated(() => document.removeEventListener("keydown", onKeyDown));
  },
});
