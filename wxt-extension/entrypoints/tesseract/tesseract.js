import { createWorker } from "tesseract.js";

console.log("we out here.");

let tesseractWorker = null;
let workerInitializing = null;

async function getTesseractWorker() {
  if (tesseractWorker) return tesseractWorker;
  if (workerInitializing) return workerInitializing;

  workerInitializing = (async () => {
    console.log("initalizing tesseract worker");
    const workerPath = chrome.runtime.getURL("tesseract/worker.min.js");
    const corePath = chrome.runtime.getURL("tesseract/core");
    const worker = await createWorker("chi_sim", 1, {
      workerPath: chrome.runtime.getURL("tesseract/worker.min.js"),
      corePath: chrome.runtime.getURL("tesseract/core"),
      workerBlobURL: false,
      // optional but recommended if you host traineddata yourself:
      // langPath: chrome.runtime.getURL("tesseract/lang"),
    });
    tesseractWorker = worker;
    return worker;
  })();

  return workerInitializing;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "OCR_LOCAL") return;

  (async () => {
    try {
      console.log("tesseract.js: starting local OCR");
      const worker = await getTesseractWorker();
      console.log(typeof worker);
      const res = await worker.recognize(
        msg.imageDataUrl,
        {},
        { text: true, blocks: true },
      );
      console.log(res.data);
      sendResponse({ ok: true, data: res.data });
    } catch (error) {
      sendResponse({ ok: false, error: String(error) });
    }
  })();
  return true;
});
