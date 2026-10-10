let countQueue = Promise.resolve();
let creatingOffscreen: Promise<void> | null = null;

export function isAllowedOcrUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && raw.length <= 4000
      && ["fbcdn.net", "cdninstagram.com", "ytimg.com", "twimg.com"]
        .some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

async function ensureOffscreen(): Promise<void> {
  const url = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (contexts.length > 0) return;
  creatingOffscreen ??= chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS", "BLOBS"],
    justification: "Recognize text in visible post images locally using a Web Worker"
  }).finally(() => { creatingOffscreen = null; });
  await creatingOffscreen;
}

async function recognizeWithTimeout(url: string): Promise<{ text?: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      chrome.runtime.sendMessage({ target: "offscreen", type: "pftwOcrRun", url }) as Promise<{ text?: string }>,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Local OCR timed out")), 30_000);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type !== "pftwHidden") return;
  countQueue = countQueue.then(async () => {
    const date = new Date().toLocaleDateString("en-CA");
    const stored = await chrome.storage.local.get("pftwStats");
    const previous = stored.pftwStats as { date: string; dailyCount: number; sessionCount: number } | undefined;
    await chrome.storage.local.set({ pftwStats: {
      date,
      dailyCount: (previous?.date === date ? previous.dailyCount : 0) + 1,
      sessionCount: (previous?.sessionCount ?? 0) + 1
    } });
  });
  void countQueue.then(() => sendResponse({ ok: true }));
  return true;
});

chrome.runtime.onMessage.addListener((message: { type?: string; url?: string }, sender, sendResponse) => {
  if (message.type !== "pftwOcrImage") return;
  if (!sender.tab || !message.url || !isAllowedOcrUrl(message.url)) {
    sendResponse({ text: "" });
    return;
  }
  void ensureOffscreen()
    .then(() => recognizeWithTimeout(message.url!))
    .then((result: { text?: string }) => sendResponse({ text: result?.text ?? "" }))
    .catch(async () => {
      try { await chrome.offscreen.closeDocument(); } catch { /* Offscreen page may already be gone. */ }
      sendResponse({ text: "" });
    });
  return true;
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get("pftwStats");
  const stats = stored.pftwStats as { date: string; dailyCount: number; sessionCount: number } | undefined;
  if (stats) await chrome.storage.local.set({ pftwStats: { ...stats, sessionCount: 0 } });
});
