import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createWorker } from "tesseract.js";

test("bundled Traditional Chinese model reads political text from an image", async () => {
  const modelDir = fileURLToPath(new URL("../assets/ocr/lang", import.meta.url));
  const image = fileURLToPath(new URL("fixtures/political-poster.png", import.meta.url));
  const worker = await createWorker("chi_tra", 1, { langPath: modelDir, cacheMethod: "none" });
  try {
    const result = await worker.recognize(image);
    assert.match(result.data.text, /市長選舉/);
    assert.match(result.data.text, /沈伯洋/);
  } finally {
    await worker.terminate();
  }
});
