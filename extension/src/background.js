chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed");
});

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function downscaleDataUrlToViewport(dataUrl, targetW, targetH) {
  // create blob that can then be converted to a bitmap, which is required for chrome
  // to be able to draw on a canvas
  const blob = await dataUrlToBlob(dataUrl);
  const bitmap = await createImageBitmap(blob);

  // create a canvas of smaller size and a context (which is what will be drawn on).
  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d", { willReadFrequently: false }); // willReadFrequently is a resource-saving measure.

  // to be played around with - might improve OCR quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // draw image on the new canvas to downscale
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // creates a blob from this downscaled image
  const outBlob = await canvas.convertToBlob({ type: "image/jpeg" });

  // convert blob to URL
  const outDataUrl = await new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.readAsDataURL(outBlob);
  });

  return { outBlob, outDataUrl };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "CAPTURE_TAB") {
    return;
  }
  try {
    (async () => {
      // capture tab and save image Data URL
      const dataUrl = await chrome.tabs.captureVisibleTab();
      const filename = `youtube-shot-${Date.now()}.png`;

      // downscale URL to CSS Viewport size
      const { outBlob } = await downscaleDataUrlToViewport(
        dataUrl,
        msg.cssW,
        msg.cssH,
      );

      // create form to send data over to backend and attach outBlob
      const form = new FormData();
      form.append("raw_img", outBlob, "frame.webp");

      const res = await fetch("http://127.0.0.1:8000/ocr", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      console.log(result.result.res);

      sendResponse({
        ok: true,
        result: result.result.res,
      });
    })();
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }

  return true;
});
