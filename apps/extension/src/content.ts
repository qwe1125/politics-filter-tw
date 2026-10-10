import { classify } from "@politics-filter/classifier";
import type { ClassifyResult } from "@politics-filter/classifier";
import { threadsAdapter } from "./adapters/threads.js";
import { facebookAdapter, xAdapter, youtubeAdapter } from "./adapters/generic.js";
import type { FeedAdapter } from "./adapters/types.js";
import { loadSettings, saveSettings } from "./settings.js";

const adapters: FeedAdapter[] = [threadsAdapter, xAdapter, facebookAdapter, youtubeAdapter];
const adapter = adapters.find((item) => item.matches(location.hostname));
const processed = new WeakMap<HTMLElement, string>();
const visibleText = new WeakMap<HTMLElement, string>();
const counted = new WeakSet<HTMLElement>();
let scheduled = false;

function recordHidden(post: HTMLElement): void {
  if (counted.has(post)) return;
  counted.add(post);
  void chrome.runtime.sendMessage({ type: "pftwHidden" });
}

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return String(hash);
}

function restore(post: HTMLElement): void {
  const placeholder = post.previousElementSibling as HTMLElement | null;
  if (placeholder?.dataset.pftwPlaceholder === "true") placeholder.remove();
  post.style.removeProperty("display");
  post.removeAttribute("data-pftw-hidden");
}

function hide(post: HTMLElement, result: ClassifyResult, debug: boolean, author: string | null, postKey: string): void {
  if (post.dataset.pftwHidden === "true") return;
  const placeholder = document.createElement("div");
  placeholder.dataset.pftwPlaceholder = "true";
  placeholder.className = "pftw-placeholder";
  const label = document.createElement("span");
  const evidence = result.matched.slice(0, 4).map((item) => item.term).join("、");
  label.textContent = `🙈 已隱藏政治內容${debug ? ` · ${result.politicalScore.toFixed(2)}${evidence ? ` · ${evidence}` : ""}` : ""}`;
  placeholder.append(label);
  const actions = document.createElement("span");
  actions.className = "pftw-actions";
  const reveal = document.createElement("button");
  reveal.type = "button";
  reveal.textContent = "顯示這篇";
  reveal.addEventListener("click", () => {
    post.style.removeProperty("display");
    post.dataset.pftwHidden = "revealed";
    placeholder.remove();
  });
  actions.append(reveal);
  const falsePositive = document.createElement("button");
  falsePositive.type = "button";
  falsePositive.textContent = "這不是政治內容";
  falsePositive.addEventListener("click", async () => {
    const settings = await loadSettings();
    await saveSettings({ allowedPosts: [...new Set([...settings.allowedPosts, postKey])].slice(-500) });
    restore(post);
    processed.delete(post);
    scheduleScan();
  });
  actions.append(falsePositive);
  if (author && adapter) {
    const trust = document.createElement("button");
    trust.type = "button";
    trust.textContent = "不再隱藏此作者";
    trust.addEventListener("click", async () => {
      const settings = await loadSettings();
      await saveSettings({ trustedAuthors: [...new Set([...settings.trustedAuthors, `${adapter.id}:${author}`])] });
      restore(post);
      processed.delete(post);
      scheduleScan();
    });
    actions.append(trust);
  }
  placeholder.append(actions);
  post.before(placeholder);
  post.style.setProperty("display", "none", "important");
  post.dataset.pftwHidden = "true";
  recordHidden(post);
}

async function scan(): Promise<void> {
  scheduled = false;
  if (!adapter) return;
  const settings = await loadSettings();
  const posts = [...adapter.findPosts(document), ...(adapter.findRecommendations?.(document) ?? [])];

  for (const post of posts) {
    const text = post.dataset.pftwHidden === "true"
      ? visibleText.get(post) ?? post.textContent ?? ""
      : adapter.getText(post);
    if (text.length < 8) continue;
    if (post.dataset.pftwHidden !== "true") visibleText.set(post, text);
    const postKey = `${adapter.id}:${hashText(text)}`;
    const author = adapter.getAuthor?.(post) ?? null;
    const authorKey = author ? `${adapter.id}:${author}` : null;
    const allowed = settings.allowedPosts.includes(postKey) || (authorKey !== null && settings.trustedAuthors.includes(authorKey));
    const signature = `${postKey}:${settings.enabled}:${settings.strength}:${settings.debug}:${allowed}`;
    if (processed.get(post) === signature) continue;
    processed.set(post, signature);

    if (!settings.enabled || allowed) {
      restore(post);
      continue;
    }

    const result = classify({ text, source: adapter.id as never, strength: settings.strength });
    if (result.blocked) {
      restore(post);
      hide(post, result, settings.debug, author, postKey);
    }
    else restore(post);
  }
}

function scheduleScan(): void {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => void scan(), 120);
}

if (adapter) {
  const style = document.createElement("style");
  style.textContent = `
    .pftw-placeholder { box-sizing:border-box; margin:8px 0; padding:12px 14px; border:1px solid rgba(127,127,127,.25); border-radius:12px; display:flex; align-items:center; justify-content:space-between; gap:12px; font:14px/1.4 system-ui,sans-serif; }
    .pftw-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:6px; }
    .pftw-placeholder button { border:0; border-radius:999px; padding:7px 11px; cursor:pointer; }
  `;
  document.documentElement.appendChild(style);
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener(scheduleScan);
  scheduleScan();
}
