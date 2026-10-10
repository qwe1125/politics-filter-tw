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
const ocrText = new WeakMap<HTMLElement, { url: string; text: string }>();
const ocrAttempted = new WeakMap<HTMLElement, string>();
const ocrQueued = new WeakSet<HTMLElement>();
const counted = new WeakSet<HTMLElement>();
let scheduled = false;
let ocrEnabled = true;
let ocrBusy = false;
const ocrQueue: Array<{ post: HTMLElement; url: string }> = [];
let reportMode = false;
const ocrObserver = adapter ? new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) queueOcr(entry.target as HTMLElement);
}, { rootMargin: "200px" }) : null;

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

function imageUrl(post: HTMLElement): string | null {
  const images = Array.from(post.querySelectorAll<HTMLImageElement>("img"))
    .filter((image) => (image.naturalWidth || image.getBoundingClientRect().width) >= 300
      && (image.naturalHeight || image.getBoundingClientRect().height) >= 150)
    .sort((a, b) => (b.naturalWidth || b.width) * (b.naturalHeight || b.height)
      - (a.naturalWidth || a.width) * (a.naturalHeight || a.height));
  const source = images[0]?.currentSrc || images[0]?.src;
  return source?.startsWith("https://") ? source : null;
}

function nearViewport(post: HTMLElement): boolean {
  const rect = post.getBoundingClientRect();
  return rect.width > 0 && rect.bottom >= -200 && rect.top <= window.innerHeight + 200;
}

function queueOcr(post: HTMLElement): void {
  if (!ocrEnabled || !post.isConnected || post.dataset.pftwHidden === "true" || ocrQueued.has(post)) return;
  const url = imageUrl(post);
  if (!url || ocrAttempted.get(post) === url) return;
  for (let i = ocrQueue.length - 1; i >= 0; i -= 1) {
    if (!nearViewport(ocrQueue[i].post)) {
      ocrQueued.delete(ocrQueue[i].post);
      ocrQueue.splice(i, 1);
    }
  }
  if (ocrQueue.length >= 8) return;
  ocrQueued.add(post);
  ocrQueue.push({ post, url });
  void drainOcr();
}

async function drainOcr(): Promise<void> {
  if (ocrBusy) return;
  ocrBusy = true;
  while (ocrQueue.length > 0) {
    const { post, url } = ocrQueue.shift()!;
    ocrQueued.delete(post);
    if (!post.isConnected || !nearViewport(post) || !ocrEnabled) continue;
    ocrAttempted.set(post, url);
    try {
      const response = await chrome.runtime.sendMessage({ type: "pftwOcrImage", url }) as { text?: string };
      if (response?.text && post.isConnected) {
        ocrText.set(post, { url, text: response.text });
        processed.delete(post);
        scheduleScan();
      }
    } catch {
      // A blocked or expired image should not interrupt ordinary text filtering.
    }
  }
  ocrBusy = false;
}

function restore(post: HTMLElement): void {
  const placeholder = post.previousElementSibling as HTMLElement | null;
  if (placeholder?.dataset.pftwPlaceholder === "true") placeholder.remove();
  post.style.removeProperty("display");
  post.removeAttribute("data-pftw-hidden");
}

function hide(post: HTMLElement, result: ClassifyResult, debug: boolean, author: string | null, postKey: string, manual = false, fromOcr = false): void {
  if (post.dataset.pftwHidden === "true") return;
  const placeholder = document.createElement("div");
  placeholder.dataset.pftwPlaceholder = "true";
  placeholder.className = "pftw-placeholder";
  const label = document.createElement("span");
  const evidence = result.matched.slice(0, 4).map((item) => item.term).join("、");
  label.textContent = manual ? "🙈 已依你的漏擋回報隱藏" :
    `🙈 已隱藏政治內容${fromOcr ? " · 圖片辨識" : ""}${debug ? ` · ${result.politicalScore.toFixed(2)}${evidence ? ` · ${evidence}` : ""}` : ""}`;
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

function findPosts(): HTMLElement[] {
  if (!adapter) return [];
  return [...adapter.findPosts(document), ...(adapter.findRecommendations?.(document) ?? [])];
}

function startReportMode(): void {
  if (reportMode || !adapter) return;
  reportMode = true;
  const banner = document.createElement("button");
  banner.type = "button";
  banner.textContent = "點選一篇漏擋貼文；按 Esc 取消";
  banner.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;padding:10px 14px;border:0;border-radius:10px;background:#f4c542;color:#111;font:14px system-ui,sans-serif;cursor:pointer";
  document.documentElement.append(banner);
  const stop = () => {
    reportMode = false;
    banner.remove();
    document.removeEventListener("click", select, true);
    window.removeEventListener("keydown", escape, true);
  };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") stop(); };
  const select = (event: MouseEvent) => {
    if (event.target === banner) { stop(); return; }
    const target = event.composedPath()[0];
    const post = target instanceof Node ? findPosts().find((item) => item.contains(target)) : undefined;
    if (!post) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    stop();
    void (async () => {
      const baseText = adapter!.getText(post);
      const key = `${adapter!.id}:${hashText(baseText)}`;
      const settings = await loadSettings();
      const stored = await chrome.storage.local.get("pftwReports");
      const reports = (stored.pftwReports ?? []) as Array<{ source: string; text: string; at: string; key: string }>;
      const report = { source: adapter!.id, text: `${baseText} ${ocrText.get(post)?.text ?? ""}`.trim().slice(0, 500), at: new Date().toISOString(), key };
      await chrome.storage.local.set({ pftwReports: [...reports.filter((item) => item.key !== key), report].slice(-100) });
      await saveSettings({ reportedPosts: [...new Set([...settings.reportedPosts, key])].slice(-500) });
      processed.delete(post);
      scheduleScan();
    })();
  };
  document.addEventListener("click", select, true);
  window.addEventListener("keydown", escape, true);
}

async function scan(): Promise<void> {
  scheduled = false;
  if (!adapter) return;
  const settings = await loadSettings();
  ocrEnabled = settings.ocrEnabled;
  const posts = findPosts();

  for (const post of posts) {
    const baseText = post.dataset.pftwHidden === "true"
      ? visibleText.get(post) ?? post.textContent ?? ""
      : adapter.getText(post);
    const recognized = ocrText.get(post);
    const matchingOcr = recognized && recognized.url === imageUrl(post) ? recognized.text : "";
    if (recognized && !matchingOcr) ocrText.delete(post);
    const text = `${baseText} ${matchingOcr}`.trim();
    const baseKey = `${adapter.id}:${hashText(baseText)}`;
    const reported = settings.reportedPosts.includes(baseKey);
    if (text.length < 8 && !reported) {
      if (settings.enabled && settings.ocrEnabled) ocrObserver?.observe(post);
      continue;
    }
    if (post.dataset.pftwHidden !== "true") visibleText.set(post, baseText);
    const postKey = `${adapter.id}:${hashText(text)}`;
    const author = adapter.getAuthor?.(post) ?? null;
    const authorKey = author ? `${adapter.id}:${author}` : null;
    const allowed = settings.allowedPosts.includes(postKey) || (authorKey !== null && settings.trustedAuthors.includes(authorKey));
    const signature = `${postKey}:${settings.enabled}:${settings.strength}:${settings.debug}:${settings.ocrEnabled}:${allowed}:${reported}`;
    if (processed.get(post) === signature) continue;
    processed.set(post, signature);

    if (!settings.enabled || allowed) {
      ocrObserver?.unobserve(post);
      restore(post);
      continue;
    }

    if (reported) {
      ocrObserver?.unobserve(post);
      restore(post);
      hide(post, { politicalScore: 1, blocked: true, categories: [], matched: [], confidence: "high" }, false, author, postKey, true);
      continue;
    }

    const result = classify({ text, source: adapter.id as never, strength: settings.strength });
    if (result.blocked) {
      ocrObserver?.unobserve(post);
      restore(post);
      hide(post, result, settings.debug, author, postKey, false, Boolean(matchingOcr));
    }
    else {
      restore(post);
      if (settings.ocrEnabled && baseText.length < 260) ocrObserver?.observe(post);
    }
  }
}

function scheduleScan(): void {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => void scan(), 120);
}

if (adapter) {
  chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
    if (message.type === "pftwStartReport") {
      startReportMode();
      sendResponse({ ok: true });
    }
  });
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
