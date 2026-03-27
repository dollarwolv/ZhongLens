// utils/shortcuts.js
export function toShortcutSet(shortcut, fallback) {
  if (!shortcut) return new Set(fallback);
  if (shortcut instanceof Set) return shortcut;
  if (Array.isArray(shortcut)) return new Set(shortcut);
  if (typeof shortcut === "object") return new Set(Object.values(shortcut));
  return new Set(fallback);
}

export function eventToSet(e) {
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

export function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function matchesShortcut(e, shortcutSet) {
  return setsEqual(eventToSet(e), shortcutSet);
}

export async function registerOverlayShortcuts({
  openSettingKey,
  closeSettingKey,
  openFallback,
  closeFallback,
  onOpen,
  onClose,
  ctx,
}) {
  let openShortcut = new Set(openFallback);
  let closeShortcut = new Set(closeFallback);

  const settings = await chrome.storage.sync.get([
    openSettingKey,
    closeSettingKey,
  ]);

  openShortcut = toShortcutSet(settings[openSettingKey], openFallback);
  closeShortcut = toShortcutSet(settings[closeSettingKey], closeFallback);

  const handleStorageChange = (changes, areaName) => {
    if (areaName !== "sync") return;

    if (changes[openSettingKey]) {
      openShortcut = toShortcutSet(
        changes[openSettingKey].newValue,
        openFallback,
      );
    }

    if (changes[closeSettingKey]) {
      closeShortcut = toShortcutSet(
        changes[closeSettingKey].newValue,
        closeFallback,
      );
    }
  };

  const handleKeyDown = (e) => {
    if (matchesShortcut(e, openShortcut)) {
      e.preventDefault();
      onOpen();
      return;
    }

    if (matchesShortcut(e, closeShortcut)) {
      e.preventDefault();
      onClose();
    }
  };

  chrome.storage.onChanged.addListener(handleStorageChange);
  document.addEventListener("keydown", handleKeyDown);

  ctx.onInvalidated(() => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
    document.removeEventListener("keydown", handleKeyDown);
  });
}
