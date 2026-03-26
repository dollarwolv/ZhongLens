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
    };

    chrome.storage.sync.set(defaultSettings);
    console.log("Service worker installed");
  });
}
