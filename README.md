# Politics Filter TW

Local-first side project for hiding political content from social feeds. The project does **not** modify recommendation algorithms; it filters content in the user's browser / device.

## Current MVP
- Chrome / Edge Manifest V3 extension
- Threads.com feed-post and individual trending-topic adapters
- YouTube search-result and watch-page recommendation adapters
- Facebook feed-post adapter validated on a logged-in feed, including posts without `role="article"`
- X initial adapter awaiting live-page validation
- Local Taiwan political-content rule classifier with 277 reviewed terms and names across ten categories
- Low / Medium / Nuclear filter strength
- Per-post reveal and local false-positive exception buttons
- Persistent author whitelist with popup removal control
- Debug score and matched terms
- Daily and browser-session hide counts in the popup
- Local Traditional Chinese OCR for visible image-led posts, with an on/off switch
- Local missed-post reporting: choose a post in the page, then export or clear reports in the popup
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

After rebuilding, reload the extension card at `chrome://extensions`, accept
the new media-host permissions if Chrome asks, then refresh open social-site
tabs. The extension classifies text locally. OCR uses a bundled Traditional
Chinese model and a single worker; it runs on a visible post's largest image
only when the post text has not already been blocked. It does not upload images
or post text. Some private, unsupported-host, or video-frame images cannot be
read; their posts continue through ordinary text filtering.

The "This is not political content" action keeps an exception for that post's
text on this device (up to 500 recent exceptions). The popup can clear these
exceptions and remove authors from the whitelist. Counts record posts hidden
by this browser, and the session count resets when the browser starts.

To report a missed post, select **選取漏擋貼文** in the popup, then click that
post. The post is hidden on this device and a short text sample is stored
locally. Reports are not sent automatically; use **匯出回報** to share them
deliberately, or **清除回報** to remove them.

The bundled OCR runtime is [Tesseract.js](https://github.com/naptha/tesseract.js)
with the [Traditional Chinese fast model](https://github.com/tesseract-ocr/tessdata_fast).
Their licenses are copied into the extension build.

## Principles
- Local-first classification where possible.
- No user political-preference profile.
- Neutral classification: detect political subject matter, not ideology.
- Do not modify social platforms' recommendation algorithms.
