# Vector-Ultra — YouTube Smart Manager (v5.7)

A Tampermonkey userscript that reshapes the YouTube player for distraction-free, black-bar-free viewing. Built for Brave/Chromium (should work in other Chromium browsers). Fully automatic once set up.

> ⚠️ Some features are partial/experimental (noted below). The core **Smart Fit** is the main reason to use it and works well.

## Features

| Feature | What it does | Status |
| --- | --- | --- |
| **Smart Fit** | Auto-scales landscape videos **and Shorts** to eliminate black bars and fill your monitor. | ✅ Works (the main feature) |
| **Ghost UI** | Hides the top navigation bar during playback; hover to reveal. Distraction-free, cinematic. | ~ Partial |
| **Per-channel zoom presets** | Bind zoom/crop presets to specific channels via the V-ULTRA panel. | ✅ Works |
| **A-B Looper** | Set custom start/end points to loop a clip — rhythm practice, breaking down segments. | ~ Experimental |
| **Dual Subs & Anki export** | Show two caption tracks at once and copy timestamped text for language drilling. | ⛔ Broken |

## Install

1. Install the **[Tampermonkey](https://www.tampermonkey.net/)** extension (Chrome, Brave, Firefox, or Edge).
2. Open the Tampermonkey dashboard → **Create a new script**, clear the template, and paste the contents of [`vector-ultra.user.js`](./vector-ultra.user.js). Save.
   - (Or, once this repo is public, install directly from the raw URL of `vector-ultra.user.js`.)
3. Open any YouTube video. The UI adjusts automatically and a floating **V-ULTRA** button appears in the top-right.
4. Click **V-ULTRA** to open the command panel and bind zoom presets to channels.

## Notes

- `@match *://*.youtube.com/*`, runs at `document-start`.
- Uses `GM_setValue`/`GM_getValue` for persistence, `GM_addStyle`, and `GM_setClipboard`.
- Always follow good security practices when installing userscripts — read the source before you run it.

## License

MIT-NC
