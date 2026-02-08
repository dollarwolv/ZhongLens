chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed");
});

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function downscaleDataUrlToViewport(dataUrl, targetW, targetH) {
  const blob = await dataUrlToBlob(dataUrl);
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const outBlob = await canvas.convertToBlob({ type: "image/jpeg" });

  const outDataUrl = await new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.readAsDataURL(outBlob);
  });

  return { outBlob, outDataUrl };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CAPTURE_TAB") {
    chrome.tabs
      .captureVisibleTab()
      .then((dataUrl) => {
        const filename = `youtube-shot-${Date.now()}.png`;

        const cssW = msg.cssW;
        const cssH = msg.cssH;

        (async () => {
          const { outDataUrl } = await downscaleDataUrlToViewport(
            dataUrl,
            cssW,
            cssH,
          );
          chrome.downloads.download(
            {
              url: outDataUrl,
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
        })();
      })
      .catch((err) => {
        sendResponse({ ok: false, error: String(err) });
      });

    return true;
  }
});
