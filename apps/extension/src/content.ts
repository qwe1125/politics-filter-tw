import { classify } from "@politics-filter/classifier";
import { threadsAdapter } from "./adapters/threads.js";
import { facebookAdapter, xAdapter, youtubeAdapter } from "./adapters/generic.js";
import type { FeedAdapter } from "./adapters/types.js";
import { loadSettings } from "./settings.js";

const adapters: FeedAdapter[] = [threadsAdapter, xAdapter, facebookAdapter, youtubeAdapter];
const adapter = adapters.find((item) => item.matches(location.hostname));
const processed = new WeakMap<HTMLElement, string>();
let scheduled = false;

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

function hide(post: HTMLElement, score: number, debug: boolean): void {
  if (post.dataset.pftwHidden === "true") return;
  const placeholder = document.createElement("div");
  placeholder.dataset.pftwPlaceholder = "true";
  placeholder.className = "pftw-placeholder";
  placeholder.innerHTML = `<span>🙈 已隱藏政治內容${debug ? ` · ${score.toFixed(2)}` : ""}</span><button type="button">顯示這篇</button>`;
  placeholder.querySelector("button")?.addEventListener("click", () => {
    post.style.removeProperty("display");
    post.dataset.pftwHidden = "revealed";
    placeholder.remove();
  });
  post.before(placeholder);
  post.style.setProperty("display", "none", "important");
  post.dataset.pftwHidden = "true";
}

async function scan(): Promise<void> {
  scheduled = false;
  if (!adapter) return;
  const settings = await loadSettings();
  const posts = adapter.findPosts(document);

  for (const post of posts) {
    const text = adapter.getText(post);
    if (text.length < 8) continue;
    const signature = hashText(text);
    if (processed.get(post) === signature) continue;
    processed.set(post, signature);

    if (!settings.enabled) {
      restore(post);
      continue;
    }

    const result = classify({ text, source: adapter.id as never, strength: settings.strength });
    if (result.blocked) hide(post, result.politicalScore, settings.debug);
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
    .pftw-placeholder button { border:0; border-radius:999px; padding:7px 11px; cursor:pointer; }
  `;
  document.documentElement.appendChild(style);
  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  chrome.storage.onChanged.addListener(scheduleScan);
  scheduleScan();
}
