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

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (!ui.mounted) {
          ui.mount();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.remove();
      }
    });
    ctx.onInvalidated(() => document.removeEventListener("keydown", onKeyDown));
  },
});
