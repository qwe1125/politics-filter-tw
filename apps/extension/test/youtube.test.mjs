import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const output = await build({
  entryPoints: [fileURLToPath(new URL("../src/adapters/generic.ts", import.meta.url))],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`;
const { youtubeAdapter } = await import(moduleUrl);

test("finds independent YouTube video cards and excludes an ad lockup", () => {
  globalThis.location = new URL("https://www.youtube.com/watch?v=example");
  const card = (href, text, parent = null) => ({
    innerText: text,
    parentElement: { closest: () => parent },
    closest: () => null,
    querySelectorAll: () => [{ href }]
  });
  const gridCard = card("https://www.youtube.com/watch?v=grid", "台灣選舉新聞");
  const nestedLockup = card("https://www.youtube.com/watch?v=grid", "台灣選舉新聞", gridCard);
  const recommendation = card("https://www.youtube.com/watch?v=recommended", "立法院質詢片段");
  const ad = { ...card("https://www.youtube.com/watch?v=sponsored", "贊助廣告"), closest: () => ({}) };
  const root = { querySelectorAll: () => [gridCard, nestedLockup, recommendation, ad] };

  assert.deepEqual(youtubeAdapter.findPosts(root), [gridCard, recommendation]);
  assert.equal(youtubeAdapter.getText(recommendation), "立法院質詢片段");
});
