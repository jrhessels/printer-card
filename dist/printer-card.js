import en from './translations/en.js?v=1.0.0';
import nl from './translations/nl.js?v=1.0.0';
import de from './translations/de.js?v=1.0.0';
import cs from './translations/cs.js?v=1.0.0';

const CARD_VERSION = '1.0.0';
console.info(`%c PRINTER-CARD %c v${CARD_VERSION} `, 'background:#03a9f4;color:#fff', '');

const TRANSLATIONS = { en, nl, de, cs };

const STATUS_COLORS = {
    printing: '#2ecc71',
    paused: '#f1c40f',
    idle: '#95a5a6',
    ready: '#e67e22',
};
const FRAMES = 10;                          // frames per second
const FRAME_INTERVAL_MS = 1000 / FRAMES;
const FRAME_TIMEOUT_MS = 10000;             // no answer after 10 s: try again
const DEFAULT_STATUS_COLOR = '#e74c3c';
const RETRY_DELAY_MS = 2000;
const SERVICE_BY_DOMAIN = { button: 'press', script: 'turn_on' };
const DEFAULT_SERVICE = 'toggle';

const ICONS = {
    led: 'M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z',
    thermometer: 'M11.5 5.5C11.5 3.57 9.93 2 8 2S4.5 3.57 4.5 5.5v7.935C3.54 14.375 3 15.655 3 17c0 2.755 2.245 5 5 5s5-2.245 5-5c0-1.35-.54-2.63-1.5-3.565zM8 20.5c-1.93 0-3.5-1.57-3.5-3.5c0-1.025.45-2 1.235-2.665L6 14.11V5.5a2 2 0 1 1 4 0v8.61l.265.225A3.5 3.5 0 0 1 11.5 17c0 1.93-1.57 3.5-3.5 3.5M8.75 15.71V8.5h-1.5v7.21c-.445.26-.75.74-.75 1.29c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.555-.305-1.03-.75-1.29M21 4h-6.5v1.5H21zm-2 3.5h-4.5V9H19zm2 3.5h-6.5v1.5H21zm-2 3.5h-4.5V16H19z',
    fan: 'M12 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m.5-9c4.5 0 4.61 3.57 2.25 4.75c-.99.49-1.430 1.54-1.62 2.47c.48.2.9.51 1.22.91c3.7-2 7.68-1.21 7.68 2.37c0 4.5-3.57 4.6-4.75 2.23c-.5-.99-1.56-1.43-2.49-1.62c-.2.48-.51.89-.91 1.23c1.99 3.69 1.2 7.66-2.38 7.66c-4.5 0-4.59-3.58-2.23-4.76c.98-.49 1.42-1.53 1.62-2.45c-.49-.2-.92-.52-1.24-.92C5.96 15.850 2 15.07 2 11.5C2 7 5.56 6.89 6.74 9.26c.5.99 1.55 1.42 2.48 1.61c.19-.48.51-.9.92-1.22C8.15 5.96 8.94 2 12.5 2',
    clock: 'M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z',
    bargraph: 'M7 12h2v6H7zm4-6h2v12h-2zm4 3h2v9h-2z',
    layers: 'M12,18.54L19.37,12.8L21,14.07L12,21.07L3,14.07L4.62,12.81L12,18.54M12,16L3,9L12,2L21,9L12,16M12,4.53L6.26,9L12,13.47L17.74,9L12,4.53Z',
    pause: 'M14 18V6h3.5v12zm-7.5 0V6H10v12z',
    play: 'M8 6l10 6l-10 6Z',
    stop: 'M6 18V6h12v12z',
};

// --- translations -----------------------------------------------------------

// "status.printing" → TRANSLATIONS.xx.status.printing
const lookup = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj);

// order: language in YAML → HA profile → browser → English
const getLanguage = (hass, config) => {
    const raw = config?.language ?? hass?.locale?.language ?? hass?.language ?? navigator.language ?? 'en';
    const lang = String(raw).toLowerCase().split('-')[0];
    return TRANSLATIONS[lang] ? lang : 'en';
};

// missing in the chosen language → English → fallback (default: the key itself)
const translator = (lang) => (key, fallback = key) =>
    lookup(TRANSLATIONS[lang], key) ?? lookup(TRANSLATIONS.en, key) ?? fallback;

// --- markup -----------------------------------------------------------------

const icon = (name, size = 24, className = '') => `
    <svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
        <path d="${ICONS[name] ?? ''}"/>
    </svg>`;

const STYLES = `
<style>
    [hidden] { display: none !important; }

    ha-card {
        background: var(--pc-bg, var(--ha-card-background, var(--card-background-color)));
        color: var(--pc-text, var(--primary-text-color));
        border: 1px solid var(--pc-border, var(--ha-card-border-color, var(--divider-color)));
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        padding: 0;
    }

    .title-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
        color: var(--pc-title-color, var(--pc-text, inherit));
        font-size: var(--pc-title-size, 18px);
        font-weight: var(--pc-title-weight);
    }

    .header-actions {
        margin-left: auto;
        display: flex;
        gap: 4px;
    }

    .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 0.15s ease, box-shadow 0.15s ease;
    }

    @media (hover: hover) and (pointer: fine) {
        .icon-btn:hover {
            color: var(--pc-accent, var(--primary-color, #03a9f4));
        }
    }

    /* light on: accent color */
    .led-btn.is-on { color: var(--pc-accent, var(--primary-color, #03a9f4)); }
    .pause-btn { color: #f8b806; }
    .cancel-btn { color: #e74c3c; }
    .resume-btn { color: #2ecc71; }

    .card-content {
        padding: 10px 16px 16px;
    }

    .camera-container {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;
        cursor: pointer;
    }

    .camera-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .print-name {
        position: relative;
        display: block;
        padding: 3px 12px;
        color: var(--pc-title-color, var(--pc-text, inherit));
        font-size: var(--pc-title-size, 18px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .camera-popup {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.85);
    }
    .camera-popup.open { display: flex; }

    .popup-img {
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
    }

    .state-container {
        line-height: 22px;
    }

    .state-row {
        --cols: 3;   /* data columns, the same for every row */

        display: grid;
        grid-template-columns: 24px repeat(var(--cols), minmax(0, 1fr));
        column-gap: 12px;
        align-items: center;
        border-top: var(--app-header-border-bottom, 1px solid rgba(var(--rgb-primary-text-color), 0.12));
        margin-top: 1%;
        padding: 1% 0;
        font-size: 0.85rem;
    }

    .state-row:first-child {
        margin-top: 0;
    }

    .icon-column {
        width: 24px;
    }

    .icon-column svg {
        display: block;
    }

    .state-column {
        min-width: 0;
        text-align: center;
        line-height: 1.3;
    }

    .loader {
        --progress: 0;
        --box: 20px;         /* size of the diamond, whole pixels */
        --thickness: 4px;    /* border thickness, whole pixels */

        position: relative;
        flex-shrink: 0;
        margin: 4px;
        display: block;
        box-sizing: border-box;
        width: var(--box);
        height: var(--box);
        padding: var(--thickness);
        background-color: var(--secondary-text-color);
        transform: rotate(45deg);
        overflow: hidden;

        -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
            linear-gradient(#000 0 0) content-box exclude,
            linear-gradient(#000 0 0);
    }

    .loader:before {
        content: '';
        position: absolute;
        inset: calc(var(--box) * -0.25);
        margin: auto;
        background: var(--pc-accent, var(--primary-color, #03a9f4));
        transform:
            translate(
                calc((1 - var(--progress)) * var(--box)),
                calc((1 - var(--progress)) * var(--box))
            )
            rotate(-45deg);
        transition: transform 0.3s ease;
    }
</style>`;

const template = (t) => `
<ha-card>
    <div class="title-wrapper">
        <span class="loader"></span>
        <div class="progress-value"></div>
        <div class="print-status"></div>

        <div class="header-actions">
            <button class="icon-btn led-btn" type="button" data-action="led" aria-label="${t('light')}" title="${t('light')}">
                ${icon('led', 25)}
            </button>
            <button class="icon-btn pause-btn" type="button" data-action="pause" aria-label="${t('pause')}" title="${t('pause')}" hidden>
                ${icon('pause', 30)}
            </button>
            <button class="icon-btn cancel-btn" type="button" data-action="cancel" aria-label="${t('cancel')}" title="${t('cancel')}" hidden>
                ${icon('stop', 30)}
            </button>
            <button class="icon-btn resume-btn" type="button" data-action="resume" aria-label="${t('resume')}" title="${t('resume')}" hidden>
                ${icon('play', 30)}
            </button>
        </div>
    </div>

    <div class="camera-container" id="camera-thumb">
        <img id="camera-img" alt="${t('camera')}" />
    </div>

    <div id="camera-popup" class="camera-popup">
        <img id="popup-img" class="popup-img" alt="${t('camera')}" />
    </div>

    <div class="print-name" hidden></div>

    <div class="card-content">
        <div class="state-container">
            <div class="state-row" data-row="totals">
                <div class="icon-column">${icon('bargraph')}</div>
                <div class="state-column"><strong>${t('filament')}</strong><br><span class="filament-total"></span></div>
                <div class="state-column"><strong>${t('jobs')}</strong><br><span class="print-jobs-total"></span></div>
                <div class="state-column"><strong>${t('time')}</strong><br><span class="print-time-total"></span></div>
            </div>
            <div class="state-row" data-row="temperature">
                <div class="icon-column">${icon('thermometer')}</div>
                <div class="state-column"><strong>${t('bed')}</strong><br><span class="bed-temp"></span></div>
                <div class="state-column"><strong>${t('nozzle')}</strong><br><span class="nozzle-temp"></span></div>
                <div class="state-column"><strong>${t('chamber')}</strong><br><span class="chamber-temp"></span></div>
            </div>
            <div class="state-row" data-row="fan">
                <div class="icon-column">${icon('fan')}</div>
                <div class="state-column"><strong>${t('heat')}</strong><br><span class="driver-fan"></span></div>
                <div class="state-column"><strong>${t('chamber')}</strong><br><span class="chamber-fan"></span></div>
                <div class="state-column"><strong>M106</strong><br><span class="m106-fan"></span></div>
            </div>
            <div class="state-row" data-row="time">
                <div class="icon-column">${icon('clock')}</div>
                <div class="state-column"><strong>${t('file')}</strong><br><span class="file-duration"></span></div>
                <div class="state-column"><strong>${t('slicer')}</strong><br><span class="slicer-duration"></span></div>
                <div class="state-column"><strong>${t('eta')}</strong><br><span class="eta"></span></div>
            </div>
            <div class="state-row" data-row="progress">
                <div class="icon-column">${icon('layers')}</div>
                <div class="state-column"><strong>${t('estimated')}</strong><br><span class="time-left"></span></div>
                <div class="state-column"><strong>${t('layer')}</strong><br><span class="current-layer"></span>/<span class="total-layers"></span></div>
                <div class="state-column"><strong>${t('filament')}</strong><br><span class="filament-used"></span></div>
            </div>
        </div>
    </div>
</ha-card>`;

// --- reading and formatting values ------------------------------------------

const readState = (hass, entityId) => {
    if (!entityId) return '';
    const value = String(hass.states[entityId]?.state ?? '').trim();
    return ['unknown', 'unavailable', 'none'].includes(value) ? '' : value;
};

const readNumber = (hass, entityId) => {
    const value = parseFloat(readState(hass, entityId));
    return Number.isFinite(value) ? value : 0;
};

const readOptionalNumber = (hass, entityId) => {
    const raw = readState(hass, entityId);
    if (raw === '') return null;
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : null;
};

const readUnit = (hass, entityId) =>
    hass.states[entityId]?.attributes?.unit_of_measurement ?? '';

const formatValue = (value, decimals = 0, unit = '') =>
    value === null ? '–' : `${value.toFixed(decimals)}${unit}`;

const UNIT_TO_SECONDS = {
    d: 86400, days: 86400,
    h: 3600, hours: 3600,
    min: 60, minutes: 60,
    s: 1, seconds: 1,
};

const parseDurationString = (raw) => {
    // "0:11:56" or "11:56"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
        return raw.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
    }

    // "548h 14m 22s", "2d 3h", "45m"
    if (/^(\s*\d+(\.\d+)?\s*[dhms])+\s*$/i.test(raw)) {
        const factor = { d: 86400, h: 3600, m: 60, s: 1 };
        let total = 0;
        for (const [, amount, unit] of raw.matchAll(/(\d+(?:\.\d+)?)\s*([dhms])/gi)) {
            total += parseFloat(amount) * factor[unit.toLowerCase()];
        }
        return total;
    }

    // "2026-10-12T15:30:00+02:00": seconds remaining
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
        return Math.max(0, (date.getTime() - Date.now()) / 1000);
    }
    return null;
};

const readDuration = (hass, entityId) => {
    const raw = readState(hass, entityId);
    if (!raw) return null;

    const number = Number(raw);
    if (Number.isFinite(number)) {
        const unit = String(hass.states[entityId]?.attributes?.unit_of_measurement ?? 's').toLowerCase();
        return number * (UNIT_TO_SECONDS[unit] ?? 1);
    }
    return parseDurationString(raw);
};

const formatDuration = (seconds, t) => {
    if (seconds === null || !Number.isFinite(seconds)) return '–';

    const d = t('units.day');
    const h = t('units.hour');
    const m = t('units.minute');

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days) return `${days}${d} ${hours}${h}`;
    return hours ? `${hours}${h} ${minutes}${m}` : `${minutes}${m}`;
};

const formatClock = (hass, entityId, lang) => {
    const date = new Date(readState(hass, entityId));
    if (Number.isNaN(date.getTime())) return '–';
    return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
};

// --- card -------------------------------------------------------------------

class PrinterCard extends HTMLElement {

    static getStubConfig(hass) {
        const camera = Object.keys(hass.states).find((id) => id.startsWith('camera.')) ?? '';
        return { entities: { camera } };
    }

    setConfig(config) {
        const lang = getLanguage(this._hass, config);
        if (!config.entities?.camera) {
            throw new Error(`printer-card: ${translator(lang)('errorCamera')}`);
        }

        this.config = config;
        this._applyStyle();

        // language changed in YAML: rebuild the card on the next update
        if (this._mounted && lang !== this._lang) {
            this._stopStream();
            this._mounted = false;
        }

        if (this._mounted) this._applyStates();
    }

    set hass(hass) {
        this._hass = hass;

        if (!this._mounted) {
            this._lang = getLanguage(hass, this.config);
            this._t = translator(this._lang);
        }

        const data = this._collectData(hass);

        if (!this._mounted) {
            this._mounted = true;
            this.innerHTML = STYLES + template(this._t);
            this._bindEvents();
            this._applyStates();
            this._startStream();
        }

        this._render(data);
    }

    connectedCallback() {
        this._onVisibility = () => {
            if (document.visibilityState === 'visible') this._startStream();
            else this._stopStream();
        };
        document.addEventListener('visibilitychange', this._onVisibility);
        if (this._mounted) this._startStream();
    }

    disconnectedCallback() {
        document.removeEventListener('visibilitychange', this._onVisibility);
        this._stopStream();
        if (this._frameUrl) URL.revokeObjectURL(this._frameUrl);
        this._frameUrl = null;
    }

    _collectData(hass) {
        const t = this._t;
        const entities = this.config.entities;

        const temp = entities.temperature ?? {};
        const fan = entities.fan ?? {};
        const layer = entities.layer ?? {};
        const file = entities.file ?? {};
        const slicer = entities.slicer ?? {};
        const printer = entities.printer ?? {};
        const filament = entities.filament ?? {};

        const status = readState(hass, printer.status).toLowerCase();

        return {
            fileName: readState(hass, file.name)
                .replace(/\+/g, ' ')
                .replace(/\.(gcode|3mf)$/i, ''),
            status,
            statusLabel: status ? t(`status.${status}`, status) : '',
            statusColor: STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR,
            progress: Math.round(readNumber(hass, file.progress)),
            fileDuration: formatDuration(readDuration(hass, file.duration), t),

            bed: formatValue(readOptionalNumber(hass, temp.bed), 2, '°C'),
            nozzle: formatValue(readOptionalNumber(hass, temp.nozzle), 2, '°C'),
            chamber: formatValue(readOptionalNumber(hass, temp.chamber), 2, '°C'),

            driverFan: formatValue(readOptionalNumber(hass, fan.driver), 0, '%'),
            chamberFan: formatValue(readOptionalNumber(hass, fan.chamber), 0, '%'),
            m106Fan: formatValue(readOptionalNumber(hass, fan.m106), 0, '%'),

            currentLayer: Math.round(readNumber(hass, layer.current)),
            totalLayer: Math.round(readNumber(hass, layer.total)),

            slicerDuration: formatDuration(readDuration(hass, slicer.duration), t),
            timeLeft: formatDuration(readDuration(hass, printer.timeleft), t),

            filamentTotal: formatValue(readOptionalNumber(hass, filament.total), 2, readUnit(hass, filament.total)),
            filamentUsed: formatValue(readOptionalNumber(hass, filament.used), 2, readUnit(hass, filament.used)),

            printJobsTotal: formatValue(readOptionalNumber(hass, printer.jobstotal), 0, ''),
            printTimeTotal: formatDuration(readDuration(hass, printer.timetotal), t),
            eta: formatClock(hass, printer.eta, this._lang),
            ledOn: readState(hass, this.config.actions?.led) === 'on',
        };
    }

    _render(d) {
        this.style.setProperty('--pc-status', d.statusColor);

        this._setText('.progress-value', `${d.progress}%`);
        this.querySelector('.loader').style.setProperty('--progress', d.progress / 100);
        this._setText('.print-status', d.statusLabel);

        this._setText('.bed-temp', d.bed);
        this._setText('.nozzle-temp', d.nozzle);
        this._setText('.chamber-temp', d.chamber);

        this._setText('.driver-fan', d.driverFan);
        this._setText('.chamber-fan', d.chamberFan);
        this._setText('.m106-fan', d.m106Fan);

        this._setText('.current-layer', d.currentLayer);
        this._setText('.total-layers', d.totalLayer);

        this._setText('.file-duration', d.fileDuration);
        this._setText('.slicer-duration', d.slicerDuration);
        this._setText('.time-left', d.timeLeft);
        this._setText('.eta', d.eta);

        this._setText('.filament-total', d.filamentTotal);
        this._setText('.filament-used', d.filamentUsed);
        this._setText('.print-jobs-total', d.printJobsTotal);
        this._setText('.print-time-total', d.printTimeTotal);

        this._setText('.print-name', d.fileName);
        this.querySelector('.print-name').hidden = !d.fileName;

        this.querySelector('.led-btn').classList.toggle('is-on', d.ledOn);

        // compare the raw status, not the translated label
        const isPrinting = d.status === 'printing';
        const isPaused = d.status === 'paused';
        this.querySelector('.pause-btn').hidden = !isPrinting;
        this.querySelector('.cancel-btn').hidden = !isPaused;
        this.querySelector('.resume-btn').hidden = !isPaused;
    }

    _setText(selector, value) {
        const el = this.querySelector(selector);
        if (el) el.textContent = value;
    }

    _bindEvents() {
        this.querySelector('#camera-thumb').addEventListener('click', (e) => {
            e.stopPropagation();
            this._openPopup();
        });

        this.querySelector('#camera-popup').addEventListener('click', () => this._closePopup());

        this.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._callAction(btn.dataset.action);
                btn.blur();
            });
        });
    }

    _callAction(action) {
        const entityId = this.config.actions?.[action];
        if (!entityId) return;

        const domain = entityId.split('.')[0];
        const service = SERVICE_BY_DOMAIN[domain] ?? DEFAULT_SERVICE;
        this._hass.callService(domain, service, { entity_id: entityId });
    }

    _openPopup() {
        if (this._frameUrl) this.querySelector('#popup-img').src = this._frameUrl;
        this.querySelector('#camera-popup').classList.add('open');
    }

    _closePopup() {
        this.querySelector('#popup-img').removeAttribute('src');
        this.querySelector('#camera-popup').classList.remove('open');
    }

    _snapshotUrl() {
        const id = this.config.entities.camera;
        const token = this._hass?.states[id]?.attributes?.access_token;
        return token ? `/api/camera_proxy/${id}?token=${token}&t=${Date.now()}` : '';
    }

    _startStream() {
        this._stopStream();
        if (document.visibilityState !== 'visible') return;
        this._running = true;
        this._loadFrame();
    }

    _stopStream() {
        this._running = false;
        clearTimeout(this._frameTimer);
        this._abort?.abort();
        this._abort = null;
    }

    _nextFrame(delay) {
        clearTimeout(this._frameTimer);
        this._frameTimer = setTimeout(() => this._loadFrame(), delay);
    }

    async _loadFrame() {
        if (!this._running) return;

        const url = this._snapshotUrl();
        if (!url) return this._nextFrame(RETRY_DELAY_MS);

        const controller = new AbortController();
        this._abort = controller;
        const timeout = setTimeout(() => controller.abort(), FRAME_TIMEOUT_MS);

        try {
            const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();

            if (controller !== this._abort) return;
            this._showFrame(URL.createObjectURL(blob));
            this._nextFrame(FRAME_INTERVAL_MS);
        } catch {
            if (this._running && controller === this._abort) this._nextFrame(RETRY_DELAY_MS);
        } finally {
            clearTimeout(timeout);
        }
    }

    _showFrame(objectUrl) {
        this.querySelector('#camera-img').src = objectUrl;
        if (this.querySelector('#camera-popup').classList.contains('open')) {
            this.querySelector('#popup-img').src = objectUrl;
        }
        if (this._frameUrl) URL.revokeObjectURL(this._frameUrl);
        this._frameUrl = objectUrl;
    }

    _applyStyle() {
        const s = this.config.style || {};
        const vars = {
            '--pc-bg': s.card?.background,
            '--pc-text': s.card?.color,
            '--pc-border': s.card?.border_color,
            '--pc-accent': s.card?.accent_color,
            '--pc-title-color': s.title?.color,
            '--pc-title-size': s.title?.font_size,
            '--pc-title-weight': s.title?.font_weight,
        };
        for (const [name, value] of Object.entries(vars)) {
            if (value) this.style.setProperty(name, value);
            else this.style.removeProperty(name);
        }
    }

    _applyStates() {
        const states = this.config.style?.states ?? {};
        this.querySelectorAll('.state-row[data-row]').forEach((row) => {
            row.hidden = states[row.dataset.row] === false;
        });
    }

    getCardSize() {
        return 7;
    }
}

if (!customElements.get('printer-card')) {
    customElements.define('printer-card', PrinterCard);

    window.customCards = window.customCards || [];
    window.customCards.push({
        type: 'printer-card',
        name: 'Printer Card',
        description: 'Camera, progress and status of your 3D printer',
    });
}
