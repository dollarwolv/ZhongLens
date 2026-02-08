chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CAPTURE_TAB") {
    chrome.tabs
      .captureVisibleTab()
      .then((dataUrl) => {
        const filename = `youtube-shot-${Date.now()}.png`;

        chrome.downloads.download(
          {
            url: dataUrl,
            filename,
            saveAs: false,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              sendResponse({
                ok: false,
                error: chrome.runtime.lastError.message,
              });
            } else {
              sendResponse({ ok: true, downloadId });
            }
          },
        );
      })
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) });
      });

    return true;
  }
});
