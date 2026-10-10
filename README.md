# Politics Filter TW

Local-first side project for hiding political content from social feeds. The project does **not** modify recommendation algorithms; it filters content in the user's browser / device.

## Current MVP
- Chrome / Edge Manifest V3 extension
- Threads.com feed-post and individual trending-topic adapters
- YouTube search-result and watch-page recommendation adapters
- Facebook feed-post adapter validated on a logged-in feed, including posts without `role="article"`
- X initial adapter awaiting live-page validation
- Local Taiwan political-content rule classifier with a categorized, 143-phrase lexicon
- Low / Medium / Nuclear filter strength
- Per-post reveal and local false-positive exception buttons
- Persistent author whitelist with popup removal control
- Debug score and matched terms
- Daily and browser-session hide counts in the popup
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
5. Open `https://www.threads.com/`, `https://www.youtube.com/`, or `https://www.facebook.com/` and test the feed, search results, and recommendations.

After rebuilding, reload the extension card at `chrome://extensions`, then
refresh open social-site tabs. The extension classifies visible text locally;
text that exists only inside images is not yet recognized.

The "This is not political content" action keeps an exception for that post's
text on this device (up to 500 recent exceptions). The popup can clear these
exceptions and remove authors from the whitelist. Counts record posts hidden
by this browser, and the session count resets when the browser starts.

## Principles
- Local-first classification where possible.
- No user political-preference profile.
- Neutral classification: detect political subject matter, not ideology.
- Do not modify social platforms' recommendation algorithms.
