export function initGeneralHandlers() {
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
