async function ensureInstallTrackingState() {
  const syncStorage = await chrome.storage.sync.get([
    "anonInstallId",
    "cloudOcrFreeUseCount",
  ]);

  if (!syncStorage["anonInstallId"]) {
    await chrome.storage.sync.set({
      ["anonInstallId"]: crypto.randomUUID(),
    });
  }

  if (typeof syncStorage["cloudOcrFreeUseCount"] !== "number") {
    await chrome.storage.sync.set({
      ["cloudOcrFreeUseCount"]: 0,
    });
  }
}

export function initGeneralHandlers() {
  void ensureInstallTrackingState();

  chrome.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
      crop: false,
      cropXStart: 0,
      cropYStart: 0,
      cropXEnd: undefined,
      cropYEnd: undefined,
      serverProcessingEnabled: false,
      devSettingsEnabled: false,
      ocrSpeed: 2,
      maxDim: 800,
      captionBgEnabled: true,
      captionTextColor: "#39ff14",
      openOCRShortcut: ["ctrl", "o"],
      closeOCRShortcut: ["ctrl", "l"],
      openCropShortcut: ["ctrl", "u"],
      closeCropShortcut: ["ctrl", "i"],
    };

    chrome.storage.sync.set(defaultSettings);
    console.log("Service worker installed");
  });

  // listener for install tracking state
  chrome.runtime.onInstalled.addListener(async () => {
    await ensureInstallTrackingState();
  });

  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== "install") return;

    await chrome.storage.sync.set({
      hasCompletedOnboarding: false,
    });

    await chrome.tabs.create({
      url: chrome.runtime.getURL("/onboarding.html"),
    });
  });
}
