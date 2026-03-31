import { onMessage } from "webext-bridge/background";
import { getSubscriptionStatus } from "./payment";
import { supabase } from "./supabase";

const SERVER_OCR_URL = import.meta.env.VITE_SERVER_OCR_URL;
const CLOUD_OCR_FREE_LIMIT = 50;

async function getCloudOcrFreeUseCount() {
  const result = await chrome.storage.sync.get("cloudOcrFreeUseCount");
  return Number(result["cloudOcrFreeUseCount"]) || 0;
}

async function setCloudOcrFreeUseCount(count) {
  await chrome.storage.sync.set({
    ["cloudOcrFreeUseCount"]: count,
  });
}

async function getAnonInstallId() {
  const result = await chrome.storage.sync.get("anonInstallId");
  let anonInstallId = result.anonInstallId;

  if (!anonInstallId) {
    anonInstallId = crypto.randomUUID();
    await chrome.storage.sync.set({ anonInstallId });
  }

  return anonInstallId;
}

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

  const processedW = canvas.width;
  const processedH = canvas.height;

  if (convertToGrayscale || applyThresh) {
    ctx = canvas.getContext("2d", { willReadFrequently: false });
    grayscaleAndOptionalThreshold(ctx, processedW, processedH, {
      applyThresh,
      thresh,
    });
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
        // test that checks if env variable has been found
        if (!SERVER_OCR_URL) {
          console.error("SERVER_OCR_URL is undefined in background/ocr.js");
          throw new Error("SERVER_OCR_URL is undefined");
        }
        console.log("Server OCR URL:", SERVER_OCR_URL);

        // get subscription status to check if user is eligible
        const subscriptionStatus = await getSubscriptionStatus({
          useCached: true,
        });
        const isSupporter =
          subscriptionStatus?.ok && subscriptionStatus?.userSubscribed;

        // get OCR Count from sync storage
        const cloudOcrFreeUseCount = await getCloudOcrFreeUseCount();

        // if NOT supporter and usage over limit, reject before request even sends out
        if (!isSupporter && cloudOcrFreeUseCount >= CLOUD_OCR_FREE_LIMIT) {
          return {
            ok: false,
            error:
              "Free Cloud OCR limit reached. Upgrade to Supporter to continue using Cloud OCR.",
          };
        }

        // downscale URL to CSS Viewport size
        const { outBlob, outDataUrl, scalingFactor } =
          await downscaleDataUrlToViewport(dataUrl, data.cssW, data.cssH, {
            crop: crop,
            startX: crop ? cropXStart : 0,
            startY: crop ? cropYStart : 0,
            endX: crop ? cropXEnd : data.cssW,
            endY: crop ? cropYEnd : data.cssH,
          });

        // get anon install ID to attach to backend for usage tracking
        const anonInstallId = await getAnonInstallId();

        // get jwt
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message || "couldn't get session...");
        }

        const jwt = sessionData?.session?.access_token;

        // create form to send data over to backend and attach outBlob and anon install id
        const form = new FormData();
        form.append("raw_img", outBlob, "frame.jpeg");
        form.append("anon_install_id", anonInstallId);
        if (jwt) form.append("jwt", jwt);

        const res = await fetch(SERVER_OCR_URL, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          let errorText = "Cloud OCR request failed.";

          try {
            const errorBody = await res.json();
            if (typeof errorBody?.detail === "string") {
              errorText = errorBody.detail;
            } else if (Array.isArray(errorBody?.detail)) {
              errorText = errorBody.detail.map((item) => item.msg).join(", ");
            } else if (typeof errorBody?.message === "string") {
              errorText = errorBody.message;
            }
          } catch {
            errorText = await res.text();
          }

          console.error("Server OCR request failed:", {
            url: SERVER_OCR_URL,
            status: res.status,
            statusText: res.statusText,
            errorText,
          });
          throw new Error(errorText);
        }
        const result = await res.json();

        // increase count client-side on successful request (will be changed to accept server-side only)
        console.log("request count from server: ");
        console.log(result?.request_count);
        if (!isSupporter) {
          await setCloudOcrFreeUseCount(
            result?.request_count ?? cloudOcrFreeUseCount + 1,
          );
        }

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
      console.error("CAPTURE_TAB failed:", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}
