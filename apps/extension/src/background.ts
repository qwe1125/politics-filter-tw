let countQueue = Promise.resolve();

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

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get("pftwStats");
  const stats = stored.pftwStats as { date: string; dailyCount: number; sessionCount: number } | undefined;
  if (stats) await chrome.storage.local.set({ pftwStats: { ...stats, sessionCount: 0 } });
});
