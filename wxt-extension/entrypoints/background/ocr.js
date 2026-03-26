import { onMessage } from "webext-bridge/background";

// helpers
async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function downloadDataUrl(dataUrl, filename = "processed.png") {
  const downloadId = await chrome.downloads.download({
    url: dataUrl,
    filename,
    conflictAction: "uniquify",
  });

  if (chrome.runtime.lastError) {
    console.error("Download failed:", chrome.runtime.lastError.message);
  } else {
    console.log("Download started, id:", downloadId);
  }

  return downloadId;
}

function cropFromCanvas(sourceCanvas, startX, startY, endX, endY) {
  const [width, height] = [endX - startX, endY - startY];

  const croppedCanvas = new OffscreenCanvas(width, height);
  const ctx = croppedCanvas.getContext("2d");

  ctx.drawImage(
    sourceCanvas,
    startX,
    startY,
    width,
    height,
    0,
    0,
    width,
    height,
  );

  return croppedCanvas;
}

function grayscaleAndOptionalThreshold(
  ctx,
  w,
  h,
  { applyThresh = false, thresh = 128 } = {},
) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    if (applyThresh) {
      const binary = gray > thresh ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = binary;
    } else {
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

async function downscaleDataUrlToViewport(
  dataUrl,
  targetW,
  targetH,
  {
    imgFormat = "jpeg",
    downscaleFurther = true,
    convertToGrayscale = true,
    applyThresh = false,
    thresh = 128,
    downscaleMaxDim = 800,
    crop = true,
    startX = 0,
    startY = 0,
    endX = targetW,
    endY = targetH,
  } = {},
) {
  // create blob that can then be converted to a bitmap, which is required for chrome
  // to be able to draw on a canvas
  const blob = await dataUrlToBlob(dataUrl);
  const bitmap = await createImageBitmap(blob);

  let scalingFactor = 1;
  let [downscaledW, downscaledH] = [null, null];

  if (downscaleFurther) {
    const maxDimViewport = Math.max(targetW, targetH);

    if (maxDimViewport >= downscaleMaxDim) {
      scalingFactor = downscaleMaxDim / maxDimViewport;
      downscaledW = targetW * scalingFactor;
      downscaledH = targetH * scalingFactor;
    }
  }

  const w = downscaledW ?? targetW;
  const h = downscaledH ?? targetH;

  // create a canvas of smaller size and a context (which is what will be drawn on).
  let canvas = new OffscreenCanvas(w, h);
  let ctx = canvas.getContext("2d", { willReadFrequently: false }); // willReadFrequently is a resource-saving measure.

  // draw image on the new canvas to downscale
  ctx.drawImage(bitmap, 0, 0, w, h);

  if (crop) {
    canvas = cropFromCanvas(
      canvas,
      startX * scalingFactor,
      startY * scalingFactor,
      endX * scalingFactor,
      endY * scalingFactor,
    );
  }

  if (convertToGrayscale || applyThresh) {
    ctx = canvas.getContext("2d", { willReadFrequently: false });
    grayscaleAndOptionalThreshold(ctx, w, h, { applyThresh, thresh });
  }

  // creates a blob from this downscaled image
  const outBlob = await canvas.convertToBlob({
    type: `image/${imgFormat}`,
    quality: 0.92,
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

async function ensureOffscreen() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({});
    const exists = contexts.some((c) => c.contextType === "OFFSCREEN_DOCUMENT");
    if (exists) return;
  }

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("/tesseract.html"),
    reasons: ["WORKERS"],
    justification: "Run Tesseract.js locally (needs Worker + WASM).",
  });
}

export function initOcrHandlers() {
  onMessage("CAPTURE_TAB", async ({ data }) => {
    try {
      // take screenshot, data gets stored in dataURL
      const dataUrl = await chrome.tabs.captureVisibleTab();

      // get settings
      const {
        serverProcessingEnabled,
        crop,
        cropXStart,
        cropYStart,
        cropXEnd,
        cropYEnd,
      } = await chrome.storage.sync.get([
        "serverProcessingEnabled",
        "crop",
        "cropXStart",
        "cropYStart",
        "cropXEnd",
        "cropYEnd",
      ]);

      if (serverProcessingEnabled) {
        // downscale URL to CSS Viewport size
        const { outBlob, outDataUrl, scalingFactor } =
          await downscaleDataUrlToViewport(dataUrl, data.cssW, data.cssH, {
            crop: crop,
            startX: crop ? cropXStart : 0,
            startY: crop ? cropYStart : 0,
            endX: crop ? cropXEnd : data.cssW,
            endY: crop ? cropYEnd : data.cssH,
          });

        // create form to send data over to backend and attach outBlob
        const form = new FormData();
        form.append("raw_img", outBlob, "frame.jpeg");

        const res = await fetch("http://127.0.0.1:8000/ocr", {
          method: "POST",
          body: form,
        });

        if (!res.ok) throw new Error(await res.text());
        const result = await res.json();

        return {
          ok: true,
          mode: "server_ocr",
          result: result.result.res,
          scalingFactor,
          crop: crop,
          startX: cropXStart,
          startY: cropYStart,
        };

        // if server processing is DISABLED (local processing):
      } else {
        // ensure that tesseract worker is active
        await ensureOffscreen();

        // get processed
        const { outBlob, outDataUrl, scalingFactor } =
          await downscaleDataUrlToViewport(dataUrl, data.cssW, data.cssH, {
            imgFormat: "png",
            downscaleFurther: false,
            convertToGrayscale: false,
            crop: crop,
            applyThresh: true,
            thresh: 128,
            startX: crop ? cropXStart : 0,
            startY: crop ? cropYStart : 0,
            endX: crop ? cropXEnd : data.cssW,
            endY: crop ? cropYEnd : data.cssH,
          });

        // await downloadDataUrl(outDataUrl);
        // apparently you cannot communicate with offscreen documents using webext-bridge,
        // so this one uses the regular chrome API
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: "OCR_LOCAL", imageDataUrl: outDataUrl },
            resolve,
          );
        });

        if (!res?.ok) throw new Error(res?.error || "Local OCR failed");
        if (res.result.blocks.length === 0)
          throw new Error("No text found in the image. Please try again.");

        const result = res.result.blocks[0].paragraphs[0].lines;

        return {
          ok: true,
          mode: "local_ocr",
          result,
          scalingFactor,
          crop,
          startX: cropXStart,
          startY: cropYStart,
        };
      }
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
}
