import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));

await rm(path("dist"), { recursive: true, force: true });
await mkdir(path("dist"), { recursive: true });

await build({ entryPoints: [path("src/content.ts")], bundle: true, format: "iife", outfile: path("dist/content.js"), target: "chrome120" });
await build({ entryPoints: [path("src/popup/popup.ts")], bundle: true, format: "esm", outfile: path("dist/popup.js"), target: "chrome120" });
await build({ entryPoints: [path("src/background.ts")], bundle: true, format: "iife", outfile: path("dist/background.js"), target: "chrome120" });
await cp(path("manifest.json"), path("dist/manifest.json"));
await cp(path("popup.html"), path("dist/popup.html"));
