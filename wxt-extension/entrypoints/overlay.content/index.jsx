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

    /**
     * Function converts a shortcut in array format to a set for easier comparison.
     */
    function toShortcutSet(shortcut, fallback) {
      if (!shortcut) return new Set(fallback);
      if (shortcut instanceof Set) return shortcut;
      if (Array.isArray(shortcut)) return new Set(shortcut);
      if (typeof shortcut === "object") return new Set(Object.values(shortcut));
      return new Set(fallback);
    }

    /**
     * Converts a keydown event to the correct strings so that it can be compared
     */
    function eventToSet(e) {
      const keys = new Set();

      if (e.ctrlKey) keys.add("ctrl");
      if (e.metaKey) keys.add("meta");
      if (e.altKey) keys.add("alt");
      if (e.shiftKey) keys.add("shift");

      const key = e.key.toLowerCase();
      if (!["control", "meta", "alt", "shift"].includes(key)) {
        keys.add(key);
      }

      return keys;
    }

    /**
     * Checks if sets are equal.
     */
    function setsEqual(a, b) {
      if (a.size !== b.size) return false;
      for (const value of a) {
        if (!b.has(value)) return false;
      }
      return true;
    }

    /**
     * Returns true if an event matches a shortcut set, and false if it doesn't
     */
    function matchesShortcut(e, shortcutSet) {
      return setsEqual(eventToSet(e), shortcutSet);
    }

    /**
     * Gets the shortcuts from settings.
     */
    async function getShortcuts() {
      const settings = await chrome.storage.sync.get([
        "openOCRShortcut",
        "closeOCRShortcut",
      ]);
      return settings;
    }

    let toggleShortcut = new Set(["ctrl", "o"]);
    let closeShortcut = new Set(["ctrl", "l"]);

    const initialSettings = await getShortcuts();
    toggleShortcut = toShortcutSet(initialSettings.openOCRShortcut, [
      "ctrl",
      "o",
    ]);
    closeShortcut = toShortcutSet(initialSettings.closeOCRShortcut, [
      "ctrl",
      "l",
    ]);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;

      if (changes.openOCRShortcut) {
        toggleShortcut = toShortcutSet(changes.openOCRShortcut.newValue, [
          "ctrl",
          "o",
        ]);
      }

      if (changes.closeOCRShortcut) {
        closeShortcut = toShortcutSet(changes.closeOCRShortcut.newValue, [
          "ctrl",
          "l",
        ]);
      }
    });

    /**
     * Fires on key down, gets shortcuts from settings, checks if shortcuts match and if yes, opens/closes overlay.
     */
    function onKeyDown(e) {
      if (matchesShortcut(e, toggleShortcut)) {
        e.preventDefault();
        if (!ui.mounted) {
          ui.mount();
        }
      }
      if (matchesShortcut(e, closeShortcut)) {
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
