import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));
const require = createRequire(import.meta.url);
const tesseractDir = dirname(require.resolve("tesseract.js/package.json"));
const coreDir = dirname(require.resolve("tesseract.js-core/package.json", { paths: [tesseractDir] }));

await rm(path("dist"), { recursive: true, force: true });
await mkdir(path("dist"), { recursive: true });

await build({ entryPoints: [path("src/content.ts")], bundle: true, format: "iife", outfile: path("dist/content.js"), target: "chrome120" });
await build({ entryPoints: [path("src/popup/popup.ts")], bundle: true, format: "esm", outfile: path("dist/popup.js"), target: "chrome120" });
await build({ entryPoints: [path("src/background.ts")], bundle: true, format: "iife", outfile: path("dist/background.js"), target: "chrome120" });
await build({ entryPoints: [path("src/offscreen.ts")], bundle: true, format: "iife", outfile: path("dist/offscreen.js"), target: "chrome120" });
await cp(path("manifest.json"), path("dist/manifest.json"));
await cp(path("popup.html"), path("dist/popup.html"));
await cp(path("offscreen.html"), path("dist/offscreen.html"));
await mkdir(path("dist/ocr/core"), { recursive: true });
await mkdir(path("dist/ocr/lang"), { recursive: true });
await cp(join(tesseractDir, "dist/worker.min.js"), path("dist/ocr/worker.min.js"));
await cp(join(tesseractDir, "LICENSE.md"), path("dist/ocr/LICENSE-tesseract-js.md"));
await cp(join(coreDir, "LICENSE"), path("dist/ocr/LICENSE-tesseract-core"));
for (const variant of ["", "-simd", "-relaxedsimd"]) {
  for (const extension of ["wasm.js", "wasm"]) {
    const name = `tesseract-core${variant}-lstm.${extension}`;
    await cp(join(coreDir, name), path(`dist/ocr/core/${name}`));
  }
}
await cp(path("assets/ocr/lang/chi_tra.traineddata.gz"), path("dist/ocr/lang/chi_tra.traineddata.gz"));
await cp(path("assets/ocr/LICENSE-tessdata-fast"), path("dist/ocr/LICENSE-tessdata-fast"));
