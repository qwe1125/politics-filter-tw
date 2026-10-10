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
const { facebookAdapter, youtubeAdapter } = await import(moduleUrl);

test("finds one Facebook media post without selecting the surrounding feed", () => {
  const feed = { innerText: "Facebook navigation and two posts" };
  const card = {
    innerText: "騎車環島趣 13 分鐘 下山最怕遇到 全球認證 都一個樣",
    parentElement: feed,
    querySelectorAll: (selector) => selector === "img, video" ? [{}, {}] : selector === "h4" ? [heading] : [],
    getBoundingClientRect: () => ({ width: 740 })
  };
  const header = {
    innerText: "騎車環島趣 13 分鐘",
    parentElement: card,
    querySelectorAll: () => [{}]
  };
  const heading = {
    innerText: "騎車環島趣",
    parentElement: header,
    closest: () => null,
    querySelector: () => ({})
  };
  globalThis.document = { body: feed };
  const root = {
    querySelectorAll: (selector) => selector === "h4" ? [heading] : []
  };

  assert.deepEqual(facebookAdapter.findPosts(root), [card]);
});

test("uses a stable Facebook profile path for an author whitelist", () => {
  globalThis.location = new URL("https://www.facebook.com/");
  const link = { href: "https://www.facebook.com/groups/932656640229711/user/100000493838819/?tracking=ignored" };
  const heading = { closest: () => link };
  const card = { querySelector: () => heading };
  assert.equal(facebookAdapter.getAuthor(card), "/groups/932656640229711/user/100000493838819");
});

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
