// Test harness for the dial app.
//
// logic.js does all its work inside a DOMContentLoaded handler and keeps every
// piece of state in that closure. So a clean app instance is just: reset the
// DOM, then fire DOMContentLoaded again. The module is imported once, so there
// is only ever one handler registered — no module-cache juggling needed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearLock } from '../../src/combination_logic_module.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BODY = HTML.match(/<body[^>]*>([\s\S]*)<\/body>/i)[1];

let imported = false;

/** Boot a fresh app instance, optionally seeding localStorage first. */
export async function boot(seed) {
  document.body.innerHTML = BODY;      // <script> tags via innerHTML never execute
  localStorage.clear();
  clearLock();                         // module-level lock state in the validator
  if (seed) for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);

  if (!imported) { await import('../../src/logic.js'); imported = true; }
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
}

/* ---------- queries ---------- */

export const $ = (sel) => document.querySelector(sel);
export const slot = (cls) => document.querySelector(`.dial-slot.${cls}`);
export const lockButton = () => document.getElementById('lockButton');
export const tooltipText = () => document.getElementById('tooltip').textContent;
export const glowing = () =>
  [...document.querySelectorAll('.dial-slot.glow')].map(s => s.dataset.symbol);
export const dialSymbols = () =>
  ['left1', 'left2', 'left3', 'right1', 'right2', 'right3'].map(c => slot(c).dataset.symbol || '');
export const mapPins = () => document.querySelectorAll('#map-overlay .symbol-wrap').length;
export const savedState = () => JSON.parse(localStorage.getItem('dialState') || 'null');

/** Symbols currently offered in the open picker. */
export const pickerOptions = () =>
  [...document.querySelectorAll('#popupGrid .symbol-option img')]
    .map(i => i.getAttribute('src').replace(/^img\//, '').replace(/\.png$/, ''));

export const pickerOpen = () =>
  document.getElementById('symbolPopup').style.display === 'block';

/** The callout bar, as structured rows. */
export const summaryRows = () =>
  [...document.querySelectorAll('#route-summary .room-name')].map(name => {
    const actions = name.nextElementSibling;
    const syms = (cls) => [...actions.querySelectorAll(`.${cls} .route-syms`)]
      .flatMap(el => el.textContent.split('·').map(s => s.trim()))
      .filter(Boolean);
    return {
      room: name.textContent.trim(),
      illuminate: syms('do-illuminate'),
      deIlluminate: syms('do-deilluminate')
    };
  });

export const summaryVisible = () => !document.getElementById('route-summary').hidden;

/** 'closed' once locked, 'open' otherwise — mirrors the padlock icon shown. */
export const padlock = () => lockButton().classList.contains('is-locked') ? 'closed' : 'open';

/* ---------- actions ---------- */

export const tapSlot = (cls) => slot(cls).click();
export const tapLock = () => lockButton().click();
export const tapReset = () => document.querySelector('.btn-reset').click();
export const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

/** Open a slot's picker and choose `symbol`. Returns false if not offered. */
export function pick(cls, symbol) {
  const target = slot(cls);
  if (target.dataset.symbol === symbol) return true;      // already auto-filled
  target.click();
  const option = [...document.querySelectorAll('#popupGrid .symbol-option')]
    .find(b => b.querySelector('img')?.getAttribute('src') === `img/${symbol}.png`);
  if (!option) return false;
  option.click();
  return true;
}

/** Clear a slot that already holds a symbol. */
export function clearSlot(cls) {
  slot(cls).click();
  document.querySelector('#popupGrid .clear-option').click();
}

/** A known-good dial: left is a TRUTH, right is a disjoint LIE. */
export const TRUTH_TRIO = ['pyramid', 'drink', 'worm'];
export const LIE_TRIO = ['hive', 'kill', 'light'];

export function fillValidDial() {
  TRUTH_TRIO.forEach((s, i) => pick(`left${i + 1}`, s));
  LIE_TRIO.forEach((s, i) => pick(`right${i + 1}`, s));
}
