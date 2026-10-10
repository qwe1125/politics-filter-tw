import { createWorker } from "tesseract.js";

let workerPromise: ReturnType<typeof createWorker> | null = null;
let queue = Promise.resolve();
const cache = new Map<string, string>();

async function recognize(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;
  const response = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  const size = Number(response.headers.get("content-length") ?? 0);
  if (!response.ok || !/^image\/(?:jpeg|png|webp|avif|gif|bmp)/i.test(response.headers.get("content-type") ?? "")
    || size > 5_000_000) throw new Error("Image unavailable for local OCR");
  const image = await response.blob();
  if (image.size > 5_000_000) throw new Error("Image exceeds local OCR size limit");

  workerPromise ??= createWorker("chi_tra", 1, {
    workerPath: chrome.runtime.getURL("ocr/worker.min.js"),
    corePath: chrome.runtime.getURL("ocr/core"),
    langPath: chrome.runtime.getURL("ocr/lang"),
    workerBlobURL: false,
    errorHandler: (error) => console.error("[PFTW OCR] worker error", error)
  });
  const worker = await workerPromise;
  const result = await worker.recognize(image);
  const text = result.data.confidence >= 25 ? result.data.text.trim().slice(0, 1500) : "";
  cache.set(url, text);
  if (cache.size > 100) cache.delete(cache.keys().next().value!);
  return text;
}

chrome.runtime.onMessage.addListener((message: { target?: string; type?: string; url?: string }, _sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "pftwOcrRun" || !message.url) return;
  const job = queue.then(() => recognize(message.url!));
  queue = job.then(() => undefined, () => undefined);
  void job.then((text) => sendResponse({ text }), () => sendResponse({ text: "" }));
  return true;
});
