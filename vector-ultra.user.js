// ==UserScript==
// @name         YouTube Smart Manager (Vector-Ultra v5.7)
// @namespace    http://tampermonkey.net/
// @version      5.7
// @description  Full Build: UI Auto-Hide, Shorts Focus, Dual Subs, Anki Export, A-B Loop, Ghost UI. Partially working, main features work though.
// @author       Solopass
// @match        *://*.youtube.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // --- State & Persistence ---
    let video = null;
    let lastVideoSrc = null;
    let autoAppliedVideoId = null;
    let settings = { zoom: 1, x: 0, y: 0, bright: 100, cont: 100, sat: 100, sharpen: 0, shortsZoom: 1.25 };

    let lockSettings = GM_getValue('vector_lockState', false);
    let smartFitActive = GM_getValue('vector_smartFitState', true);
    let loopA = null; let loopB = null;
    let zoomTimer = null;
    let uiIdleTimer = null;

    let availableTracks = [];
    let parsed1 = []; let parsed2 = [];

    let db = GM_getValue('vectorSmartVideoDB', { presets: { "Default Reset": { zoom: 1, x: 0, y: 0, bright: 100, cont: 100, sat: 100, sharpen: 0, shortsZoom: 1.25 } }, channels: {} });
    const saveDB = () => GM_setValue('vectorSmartVideoDB', db);

    // --- Global CSS Enforcer & Stealth UI ---
    GM_addStyle(`
        :root { --vz: 1; --vx: 0px; --vy: 0px; --vb: 100%; --vc: 100%; --vs: 100%; }

        ytd-app, ytd-page-manager, #page-manager { margin-top: 0 !important; padding-top: 0 !important; }

        #masthead-container {
            position: fixed !important; top: 0 !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease !important;
            z-index: 2147483645 !important;
        }
        body[vector-playing="true"]:not(.vector-hover) #masthead-container {
            transform: translateY(-100%) !important; opacity: 0 !important; pointer-events: none !important;
        }
        body.vector-hover #masthead-container { transform: translateY(0) !important; opacity: 1 !important; pointer-events: auto !important; }

        video.html5-main-video {
            transform: scale(var(--vz)) translate(var(--vx), var(--vy)) !important;
            filter: brightness(var(--vb)) contrast(var(--vc)) saturate(var(--vs)) !important;
            transform-origin: center center !important;
            transition: transform 0.1s ease-out !important;
        }

        /* VECTOR UI - Stealth Logic */
        .vector-ui-element { transition: opacity 0.4s ease-in-out !important; }
        .vector-ui-hidden { opacity: 0 !important; pointer-events: none !important; }

        #vector-btn { position: fixed; top: 80px; right: 20px; z-index: 2147483647; padding: 10px 14px; background: #111; color: #fff; border: 1px solid #444; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px #000; font-family: sans-serif; letter-spacing: 1px; }
        #zoom-hud { position: fixed; top: 125px; right: 20px; z-index: 2147483647; background: rgba(0,0,0,0.9); color: #0f0; padding: 6px 12px; border: 1px solid #0f0; border-radius: 4px; font-family: monospace; display: none; pointer-events: none; }
        #vector-panel { position: fixed; top: 130px; right: 20px; z-index: 2147483646; background: #111; color: #fff; padding: 15px; border: 1px solid #444; border-radius: 10px; display: none; width: 330px; font-family: sans-serif; max-height: 85vh; overflow-y: auto; border: 1px solid #333; box-shadow: 0 10px 40px #000; }

        .drag-handle { cursor: grab; background: #222; margin: -15px -15px 15px -15px; padding: 12px; text-align: center; font-weight: bold; color: #00ff00; font-size: 11px; border-bottom: 1px solid #333; letter-spacing: 2px; }
        .status-console { background: #000; color: #0f0; font-family: monospace; font-size: 10px; padding: 10px; border-radius: 4px; margin-top: 10px; border: 1px solid #222; min-height: 14px; }
        .ui-row { display: flex; justify-content: space-between; margin-bottom: 8px; gap: 5px; }
        .ui-btn { flex: 1; padding: 8px; background: #333; color: #fff; border: 1px solid #555; border-radius: 5px; cursor: pointer; font-size: 10px; font-weight: bold; }
        .ui-btn-blue { background: #065fd4 !important; border: none; }
        .ui-btn-red { background: #7b0000 !important; border: none; }

        input[type=range] { width: 100%; accent-color: #0f0; margin: 6px 0; cursor: pointer; }
        select { width: 100%; padding: 6px; background: #222; color: #fff; border: 1px solid #444; margin-bottom: 8px; border-radius: 4px; font-size: 11px; }

        .label-text { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-top: 5px; }
        .toggle-wrap { display: flex; align-items: center; background: #1a1a1a; padding: 8px; border-radius: 6px; margin-bottom: 6px; border: 1px solid #333; }
        .toggle-wrap input { margin-right: 12px; scale: 1.2; }

        .sub-overlay { position: absolute; bottom: 12%; left: 0; width: 100%; text-align: center; pointer-events: none; z-index: 999; display: none; flex-direction: column; align-items: center; }
        .sub-1 { background: rgba(0,0,0,0.85); color: #fff; font-size: 24px; padding: 6px 12px; border-radius: 4px; font-weight: bold; text-shadow: 2px 2px 4px #000; }
        .sub-2 { background: rgba(0,0,0,0.85); color: #ffd700; font-size: 18px; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-top: 5px; }
        #vector-sensor { position: fixed; top: 0; left: 0; width: 100%; height: 12px; z-index: 2147483646; background: transparent; }
    `);

    // --- Helpers ---
    const createEl = (tag, props = {}, style = {}) => {
        const el = document.createElement(tag);
        Object.assign(el, props);
        Object.assign(el.style, style);
        return el;
    };

    const logStatus = (msg) => {
        const c = document.getElementById('vector-status');
        if (c) c.textContent = `> ${msg.toUpperCase()}`;
    };

    const showHUD = (val, mode = "AUTO-FIT") => {
        const h = document.getElementById('zoom-hud');
        if (!h) return;
        h.textContent = `${mode}: ${val}X`;
        h.style.display = 'block';
        if (zoomTimer) clearTimeout(zoomTimer);
        zoomTimer = setTimeout(() => { h.style.display = 'none'; }, 3000);
    };

    const updateCSS = () => {
        const r = document.documentElement.style;
        r.setProperty('--vz', settings.zoom);
        r.setProperty('--vx', settings.x + 'px');
        r.setProperty('--vy', settings.y + 'px');
        r.setProperty('--vb', settings.bright + '%');
        r.setProperty('--vc', settings.cont + '%');
        r.setProperty('--vs', settings.sat + '%');
    };

    const resetIdleTimer = () => {
        const elements = [document.getElementById('vector-btn'), document.getElementById('vector-panel')];
        elements.forEach(el => { if(el) el.classList.remove('vector-ui-hidden'); });

        clearTimeout(uiIdleTimer);
        uiIdleTimer = setTimeout(() => {
            if (!document.getElementById('vector-panel')?.matches(':hover')) {
                elements.forEach(el => { if(el) el.classList.add('vector-ui-hidden'); });
            }
        }, 3000);
    };

    function performSmartFit() {
        video = document.querySelector('video.html5-main-video');
        const player = document.querySelector('#movie_player');
        if (!video || !player || !smartFitActive || video.videoWidth === 0) return;

        const vR = video.videoWidth / video.videoHeight;
        const pR = player.offsetWidth / player.offsetHeight;

        if (vR < 0.8 || window.location.pathname.includes('/shorts/')) {
            settings.zoom = settings.shortsZoom;
            settings.x = 0; settings.y = 0;
            showHUD(settings.zoom, "SHORTS-VECTOR");
            logStatus("VECTOR: SHORTS MODE " + settings.zoom + "X");
        } else {
            let scale = (pR > vR) ? (pR / vR) : (vR / pR);
            scale = parseFloat(scale.toFixed(2));
            settings.zoom = scale;
            settings.x = 0; settings.y = 0;
            showHUD(scale, "APEX-FIT");
            logStatus("VECTOR: CINEMATIC " + scale + "X");
        }
        updateCSS();
        syncSliders();
    }

    // --- UI Setup ---
    const btn = createEl('button', { id: 'vector-btn', textContent: 'V-ULTRA', className: 'vector-ui-element' });
    const hud = createEl('div', { id: 'zoom-hud' });
    const panel = createEl('div', { id: 'vector-panel', className: 'vector-ui-element' });
    const overlay = createEl('div', { className: 'sub-overlay' });
    const sb1 = createEl('div', { className: 'sub-1' });
    const sb2 = createEl('div', { className: 'sub-2' });
    overlay.append(sb1, sb2);

    const sensor = createEl('div', { id: 'vector-sensor' });
    sensor.onmouseenter = () => document.body.classList.add('vector-hover');

    const setupUI = () => {
        if (document.getElementById('vector-panel')) return;
        document.body.append(btn, hud, panel, sensor);

        const drag = createEl('div', { className: 'drag-handle', textContent: 'VECTOR-ULTRA COMMAND' });
        panel.appendChild(drag);

        let isD = false, ox, oy;
        drag.onmousedown = (e) => { isD = true; const r = panel.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; };
        document.onmousemove = (e) => { if (isD) { panel.style.left = (e.clientX - ox) + 'px'; panel.style.top = (e.clientY - oy) + 'px'; panel.style.right = 'auto'; } };
        document.onmouseup = () => isD = false;

        const createTog = (id, label, checked, fn) => {
            const w = createEl('div', { className: 'toggle-wrap' });
            const c = createEl('input', { type: 'checkbox', id, checked });
            c.onchange = (e) => fn(e.target.checked);
            w.append(c, createEl('label', { textContent: label, htmlFor: id, style: 'font-size:10px; font-weight:bold; cursor:pointer' }));
            panel.appendChild(w);
        };

        createTog('l-chk', 'LOCK SETTINGS (PERSISTENT)', lockSettings, (v) => { lockSettings = v; GM_setValue('vector_lockState', v); logStatus(v ? "Vector Locked" : "Auto-Load Active"); });
        createTog('sf-chk', 'SMART FIT (AUTO-ZOOM)', smartFitActive, (v) => { smartFitActive = v; GM_setValue('vector_smartFitState', v); if(v) performSmartFit(); });

        panel.appendChild(createEl('b', { textContent: 'VECTOR PRESETS', className: 'label-text' }));
        const pSel = createEl('select');
        const updateP = () => {
            pSel.replaceChildren(createEl('option', { value: '', textContent: '-- LOAD PRESET --' }));
            Object.keys(db.presets).forEach(n => pSel.appendChild(createEl('option', { value: n, textContent: n })));
        };
        updateP(); panel.appendChild(pSel);

        pSel.onchange = () => {
            if (db.presets[pSel.value]) {
                settings = {...db.presets[pSel.value]};
                updateCSS(); syncSliders(); logStatus("VECTOR LOADED: " + pSel.value);
            }
        };

        const pRow = createEl('div', { className: 'ui-row' });
        const pSav = createEl('button', { className: 'ui-btn', textContent: 'SAVE NEW' });
        const pDel = createEl('button', { className: 'ui-btn ui-btn-red', textContent: 'DELETE' });
        pRow.append(pSav, pDel); panel.appendChild(pRow);

        const pLnk = createEl('button', { className: 'ui-btn ui-btn-blue', textContent: 'LINK TO CHANNEL', style: 'width:100%; margin-bottom:10px' });
        panel.appendChild(pLnk);

        panel.appendChild(createEl('b', { textContent: 'DUAL SUBTITLES', className: 'label-text' }));
        const sel1 = createEl('select'); const sel2 = createEl('select');
        panel.append(sel1, sel2);

        const ankiBtn = createEl('button', { className: 'ui-btn ui-btn-blue', textContent: 'ANKI EXPORT (CLIPBOARD)', style: 'width:100%' });
        panel.appendChild(ankiBtn);

        panel.appendChild(createEl('b', { textContent: 'A-B LOOPER', className: 'label-text' }));
        const lRow = createEl('div', { className: 'ui-row' });
        const bA = createEl('button', { className: 'ui-btn', textContent: 'SET A' });
        const bB = createEl('button', { className: 'ui-btn', textContent: 'SET B' });
        const bC = createEl('button', { className: 'ui-btn ui-btn-red', textContent: 'CLEAR' });
        lRow.append(bA, bB, bC); panel.appendChild(lRow);

        const addS = (label, key, min, max, step, isShorts = false) => {
            panel.appendChild(createEl('span', { textContent: label, className: 'label-text' }));
            const s = createEl('input', { type: 'range', min, max, step, value: settings[key], id: 'slider-' + key });
            s.oninput = (e) => {
                settings[key] = parseFloat(e.target.value);
                if(!isShorts && key==='zoom') { smartFitActive = false; document.getElementById('sf-chk').checked = false; }
                if(isShorts && smartFitActive) performSmartFit();
                updateCSS();
            };
            panel.appendChild(s);
        };

        addS('SHORTS FOCUS ZOOM', 'shortsZoom', 1, 2.5, 0.01, true);
        addS('LANDSCAPE ZOOM', 'zoom', 1, 3, 0.01);
        addS('VERTICAL SHIFT', 'y', -400, 400, 1);
        addS('SHARPEN INTENSITY', 'sharpen', 0, 3, 0.1);

        panel.appendChild(createEl('div', { id: 'vector-status', textContent: '> VECTOR READY', className: 'status-console' }));

        btn.onclick = () => panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

        pSav.onclick = () => { const n = prompt("VECTOR NAME:"); if(n){ db.presets[n] = {...settings}; saveDB(); updateP(); pSel.value = n; logStatus("SAVED: " + n); } };
        pDel.onclick = () => { if(pSel.value) { delete db.presets[pSel.value]; saveDB(); updateP(); logStatus("VECTOR DELETED"); } };
        pLnk.onclick = () => {
            const chan = document.querySelector('ytd-video-owner-renderer #channel-name a')?.textContent.trim();
            if(chan && pSel.value){ db.channels[chan] = pSel.value; saveDB(); logStatus("LINKED VECTOR TO " + chan); }
        };

        ankiBtn.onclick = () => {
            if (parsed1.length === 0) return logStatus("ERR: LOAD PRIMARY TRACK");
            let out = parsed1.map(s => {
                const match = parsed2.find(t => Math.abs(t.start - s.start) < 1.5);
                return `[${Math.floor(s.start)}s] ${s.text} ${match ? '\n' + match.text : ''}`;
            }).join('\n\n');
            GM_setClipboard(out);
            logStatus("VECTOR DATA COPIED");
        };

        bA.onclick = () => { loopA = video.currentTime; logStatus("A: " + Math.floor(loopA) + "s"); };
        bB.onclick = () => { loopB = video.currentTime; logStatus("VECTOR LOOP ACTIVE"); };
        bC.onclick = () => { loopA = null; loopB = null; logStatus("LOOP CLEARED"); };

        sel1.onchange = async () => { parsed1 = await fetchTrack(sel1.value); logStatus("PRIMARY CACHED"); };
        sel2.onchange = async () => { parsed2 = await fetchTrack(sel2.value); logStatus("SECONDARY CACHED"); };

        window.populateTracks = (t) => {
            [sel1, sel2].forEach(sel => {
                sel.replaceChildren(createEl('option', { value: '', textContent: '-- SELECT TRACK --' }));
                t.forEach((track, i) => sel.appendChild(createEl('option', { value: i, textContent: track.name.simpleText })));
            });
        };

        document.addEventListener('mousemove', resetIdleTimer);
    };

    async function fetchTrack(idx) {
        if (!availableTracks[idx]) return [];
        try {
            const res = await fetch(availableTracks[idx].baseUrl + '&fmt=json3');
            const d = await res.json();
            return d.events.filter(e => e.segs).map(e => ({
                start: e.tStartMs / 1000, end: (e.tStartMs + e.dDurationMs) / 1000,
                text: e.segs.map(s => s.utf8).join('').trim()
            }));
        } catch (e) { return []; }
    }

    const syncSliders = () => {
        ['zoom', 'y', 'sharpen', 'shortsZoom'].forEach(k => {
            const el = document.getElementById('slider-' + k);
            if (el) el.value = settings[k];
        });
    };

    const resObs = new ResizeObserver(() => { if (smartFitActive) performSmartFit(); });

    setInterval(() => {
        setupUI();
        const v = document.querySelector('video.html5-main-video');
        const p = document.querySelector('#movie_player');
        const mast = document.getElementById('masthead-container');

        if (mast && !mast.hasVector) {
            mast.hasVector = true;
            mast.onmouseenter = () => document.body.classList.add('vector-hover');
            mast.onmouseleave = () => document.body.classList.remove('vector-hover');
        }

        if (v && v.src !== lastVideoSrc) {
            lastVideoSrc = v.src; video = v;
            if (p) resObs.observe(p);
            const container = document.querySelector('.html5-video-container');
            if (container && !container.contains(overlay)) container.appendChild(overlay);

            if (!lockSettings) {
                const chan = document.querySelector('ytd-video-owner-renderer #channel-name a')?.textContent.trim();
                const preset = db.channels[chan];
                if (preset && db.presets[preset]) {
                    settings = {...db.presets[preset]};
                    logStatus("VECTOR AUTO: " + preset);
                } else {
                    settings = { zoom: 1, x: 0, y: 0, bright: 100, cont: 100, sat: 100, sharpen: 0, shortsZoom: settings.shortsZoom };
                }
            }
            setTimeout(performSmartFit, 2500);
            updateCSS(); syncSliders();
        }

        if (video && !video.paused) {
            document.body.setAttribute('vector-playing', 'true');
        } else {
            document.body.removeAttribute('vector-playing');
            document.body.classList.remove('vector-hover');
        }

        if (video) {
            const t = video.currentTime;
            if (loopA !== null && loopB !== null && t >= loopB) video.currentTime = loopA;
            const getCap = (p) => p.find(s => t >= s.start && t <= s.end)?.text || "";
            const t1 = getCap(parsed1); const t2 = getCap(parsed2);
            if (t1 || t2) {
                overlay.style.display = 'flex';
                sb1.textContent = t1; sb2.textContent = t2;
                sb1.style.display = t1 ? 'block' : 'none';
                sb2.style.display = t2 ? 'block' : 'none';
            } else { overlay.style.display = 'none'; }
        }

        const vidId = new URLSearchParams(window.location.search).get('v');
        if (vidId && vidId !== autoAppliedVideoId) {
            autoAppliedVideoId = vidId;
            setTimeout(() => {
                const data = document.getElementById('movie_player')?.getPlayerResponse();
                availableTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
                if (window.populateTracks) window.populateTracks(availableTracks);
            }, 2500);
        }
    }, 1000);

})();