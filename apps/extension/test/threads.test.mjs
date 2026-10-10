import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const output = await build({
  entryPoints: [fileURLToPath(new URL("../src/adapters/threads.ts", import.meta.url))],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].contents).toString("base64")}`;
const { threadsAdapter } = await import(moduleUrl);

test("returns each Threads trend row without its surrounding sidebar", () => {
  globalThis.location = new URL("https://www.threads.com/");
  const first = { href: "https://www.threads.com/search?q=politics&serp_type=trends&trend_fbid=123", innerText: "市議員遭控抹黑" };
  const second = { href: "https://www.threads.com/search?q=music&serp_type=trends&trend_fbid=456", innerText: "演唱會開唱" };
  const unrelated = { href: "https://www.threads.com/search?q=politics", innerText: "搜尋" };
  const root = { querySelectorAll: () => [first, second, unrelated] };

  assert.deepEqual(threadsAdapter.findRecommendations(root), [first, second]);
  assert.equal(threadsAdapter.getText(first), "市議員遭控抹黑");
});
