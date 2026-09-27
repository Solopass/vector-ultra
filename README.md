# Vector-Ultra — YouTube Smart Manager (v5.7)

A Tampermonkey userscript that reshapes the YouTube player for distraction-free, black-bar-free viewing. Built for Brave/Chromium (should work in other Chromium browsers). Fully automatic once set up.

IGNORE THE FEATURES TABLE IT'S OUTDATED --- JUST COPY PASTE THE RAINBOW FILE CONTENTS INTO A NEW SCRIPT IN TAMPER MONKEY.
I only tested this on Windows with Brave browser. Thanks! 
Check notes section and install section if you're confused on what to do next.

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

1. Install the **[Tampermonkey](https://www.tampermonkey.net/)** extension (Chrome, Brave, Firefox, or Edge). Or Violent Monkey.
2. Open the Tampermonkey dashboard → **Create a new script**, clear the template, and paste the contents of [`vector-ultra.user.js`](./vector-ultra.user.js). Save.
   - (Or, once this repo is public, install directly from the raw URL of `vector-ultra.user.js`.)
3. Open any YouTube video. The UI adjusts automatically and a floating **V-ULTRA** button appears in the top-right.
4. Click **V-ULTRA** to open the command panel and bind zoom presets to channels.

## Notes

- `@match *://*.youtube.com/*`, runs at `document-start`.
- Uses `GM_setValue`/`GM_getValue` for persistence, `GM_addStyle`, and `GM_setClipboard`.
- Always follow good security practices when installing userscripts — read the source before you run it.
- The rainbow border on the V-Ultra button indicates that the video is playing on the highest possible quality.
- Bugs I care about, sometimes it will scroll badly. I think I just fixed this mostly, just don't touch anything wait for a few seconds when a new video is loaded, or else it may stall the scrolling fix and then you have to MANUALLY SCROLL THE VIDEO BACK TO THE TOP AHHHHHHH THE HUMANITY!!!!
- Fixed all the other bugs I could find but please report any other issues. I'd expect compatibility issues with other YouTube scripts and stuff.

## License

**Source-available, noncommercial.** Copyright © 2026 Solopass. Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

- ✅ **Free** for personal use, hobby projects, study and research, and for nonprofits, schools and public institutions.
- 💼 **Commercial use** (in a business, product or paid service, or for-profit internal use) needs a paid license. See [COMMERCIAL.md](COMMERCIAL.md), or contact [realsolopass@gmail.com](mailto:realsolopass@gmail.com) · <https://polymatica.pages.dev>.
