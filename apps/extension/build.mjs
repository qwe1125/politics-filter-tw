import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await build({ entryPoints: ["src/content.ts"], bundle: true, format: "iife", outfile: "dist/content.js", target: "chrome120" });
await build({ entryPoints: ["src/popup/popup.ts"], bundle: true, format: "esm", outfile: "dist/popup.js", target: "chrome120" });
await cp("manifest.json", "dist/manifest.json");
await cp("popup.html", "dist/popup.html");
