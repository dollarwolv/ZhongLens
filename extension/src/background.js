chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed");
});

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function downscaleDataUrlToViewport(
  dataUrl,
  targetW,
  targetH,
  downscaleFurther = true,
  downscaleMaxDim = 800,
) {
  // create blob that can then be converted to a bitmap, which is required for chrome
  // to be able to draw on a canvas
  const blob = await dataUrlToBlob(dataUrl);
  const bitmap = await createImageBitmap(blob);

  let scalingFactor = 1;
  let downscaledW = null;
  let downscaledH = null;

  if (downscaleFurther) {
    const maxDimViewport = Math.max(targetW, targetH);

    if (maxDimViewport >= downscaleMaxDim) {
      scalingFactor = downscaleMaxDim / maxDimViewport;
      downscaledW = targetW * scalingFactor;
      downscaledH = targetH * scalingFactor;
    }
  }

  // create a canvas of smaller size and a context (which is what will be drawn on).
  const canvas = new OffscreenCanvas(
    downscaledW ?? targetW,
    downscaledH ?? targetH,
  );
  const ctx = canvas.getContext("2d", { willReadFrequently: false }); // willReadFrequently is a resource-saving measure.

  // draw image on the new canvas to downscale
  ctx.drawImage(bitmap, 0, 0, downscaledW ?? targetW, downscaledH ?? targetH);

  // convert to grayscale for extra good compression
  const imgData = ctx.getImageData(
    0,
    0,
    downscaledW ?? targetW,
    downscaledH ?? targetH,
  );
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);

  // creates a blob from this downscaled image
  const outBlob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.3,
  });

  console.log(outBlob.size / 1024); // KB

  // convert blob to URL
  const outDataUrl = await new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.readAsDataURL(outBlob);
  });

  return { outBlob, outDataUrl, scalingFactor };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "CAPTURE_TAB") {
    return;
  }
  try {
    (async () => {
      // capture tab and save image Data URL
      const dataUrl = await chrome.tabs.captureVisibleTab();

      // downscale URL to CSS Viewport size
      const { outBlob, scalingFactor } = await downscaleDataUrlToViewport(
        dataUrl,
        msg.cssW,
        msg.cssH,
      );

      // create form to send data over to backend and attach outBlob
      const form = new FormData();
      form.append("raw_img", outBlob, "frame.jpeg");

      const res = await fetch("http://127.0.0.1:8000/ocr", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      console.log(result.result.res);
      console.log("scaling factor: " + scalingFactor);

      sendResponse({
        ok: true,
        result: result.result.res,
        scalingFactor,
      });
    })();
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }

  return true;
});
