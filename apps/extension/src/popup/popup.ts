import type { FilterStrength } from "@politics-filter/classifier";
import { loadSettings, saveSettings } from "../settings.js";

const enabled = document.querySelector<HTMLInputElement>("#enabled")!;
const strength = document.querySelector<HTMLSelectElement>("#strength")!;
const debug = document.querySelector<HTMLInputElement>("#debug")!;
const stats = document.querySelector<HTMLElement>("#stats")!;
const trustedAuthors = document.querySelector<HTMLElement>("#trusted-authors")!;
const clearAllowed = document.querySelector<HTMLButtonElement>("#clear-allowed")!;

async function renderExtras(): Promise<void> {
  const settings = await loadSettings();
  const stored = await chrome.storage.local.get("pftwStats");
  const counts = stored.pftwStats as { date: string; dailyCount: number; sessionCount: number } | undefined;
  const today = new Date().toLocaleDateString("en-CA");
  stats.textContent = `今天已隱藏 ${counts?.date === today ? counts.dailyCount : 0} 篇 · 本次瀏覽器使用已隱藏 ${counts?.sessionCount ?? 0} 篇`;
  trustedAuthors.replaceChildren();
  clearAllowed.disabled = settings.allowedPosts.length === 0;
  clearAllowed.title = `目前有 ${settings.allowedPosts.length} 篇例外`;
  if (settings.trustedAuthors.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "尚無白名單作者";
    trustedAuthors.append(empty);
  }
  for (const author of settings.trustedAuthors) {
    const item = document.createElement("li");
    item.append(document.createTextNode(author));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "移除";
    remove.addEventListener("click", async () => {
      const current = await loadSettings();
      await saveSettings({ trustedAuthors: current.trustedAuthors.filter((entry) => entry !== author) });
      await renderExtras();
    });
    item.append(remove);
    trustedAuthors.append(item);
  }
}

void loadSettings().then((settings) => {
  enabled.checked = settings.enabled;
  strength.value = settings.strength;
  debug.checked = settings.debug;
});
void renderExtras();
chrome.storage.onChanged.addListener(() => void renderExtras());

enabled.addEventListener("change", () => void saveSettings({ enabled: enabled.checked }));
strength.addEventListener("change", () => void saveSettings({ strength: strength.value as FilterStrength }));
debug.addEventListener("change", () => void saveSettings({ debug: debug.checked }));
clearAllowed.addEventListener("click", async () => {
  await saveSettings({ allowedPosts: [] });
  await renderExtras();
});
