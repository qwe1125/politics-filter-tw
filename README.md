# Politics Filter TW

Local-first side project for hiding political content from social feeds. The project does **not** modify recommendation algorithms; it filters content in the user's browser / device.

## Current MVP
- Chrome / Edge Manifest V3 extension
- Threads.com feed-post and individual trending-topic adapters
- YouTube search-result and watch-page recommendation adapters
- X / Facebook initial adapters awaiting live-page validation
- Local Taiwan political-content rule classifier with a categorized, 143-phrase lexicon
- Low / Medium / Nuclear filter strength
- Per-post reveal button and debug score
- Android Accessibility prototype scaffold

## Workspace
- `packages/classifier` — shared Taiwan political-content classifier
- `apps/extension` — browser extension
- `apps/android` — Android prototype
- `datasets/tw-politics` — vocabulary notes and future labeled examples

## Develop
Requires Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm -r typecheck
pnpm test
pnpm build
```

### Load the extension
After `pnpm build`:
1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `apps/extension/dist`.
5. Open `https://www.threads.com/` or `https://www.youtube.com/` and test the feed, search results, and recommendations.

After rebuilding, reload the extension card at `chrome://extensions`, then
refresh open Threads tabs. The extension classifies visible text locally;
text that exists only inside images is not yet recognized.

## Principles
- Local-first classification where possible.
- No user political-preference profile.
- Neutral classification: detect political subject matter, not ideology.
- Do not modify social platforms' recommendation algorithms.
