# Politics Filter TW

Local-first side project for hiding political content from social feeds. The project does **not** modify recommendation algorithms; it filters content in the user's browser / device.

## Current MVP
- Chrome / Edge Manifest V3 extension
- Threads first-class adapter
- X / Facebook / YouTube initial adapters
- Taiwan political-content rule classifier
- Low / Medium / Nuclear filter strength
- Per-post reveal button and debug score
- Android Accessibility prototype scaffold

## Workspace
- `packages/classifier` — shared Taiwan political-content classifier
- `apps/extension` — browser extension
- `apps/android` — Android prototype
- `datasets/tw-politics` — future labeled examples / datasets

## Develop
Requires Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm test
pnpm build
```

### Load the extension
After `pnpm build`:
1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `apps/extension/dist`.
5. Open Threads and test the feed.

## Principles
- Local-first classification where possible.
- No user political-preference profile.
- Neutral classification: detect political subject matter, not ideology.
- Do not modify social platforms' recommendation algorithms.
