// End-to-end behaviour of the dial, driven through the real DOM.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  boot, slot, pick, clearSlot, fillValidDial, TRUTH_TRIO, LIE_TRIO,
  tapSlot, tapLock, tapReset, pressEscape, longPressSlot,
  lockButton, tooltipText, glowing, dialSymbols, mapPins, savedState,
  pickerOptions, pickerOpen, summaryRows, summaryVisible, padlock
} from './helpers/app.js';

beforeEach(async () => { await boot(); });

describe('symbol entry', () => {
  it('starts empty, in entry phase, with an open padlock', () => {
    expect(dialSymbols()).toEqual(['', '', '', '', '', '']);
    expect(padlock()).toBe('open');
    expect(lockButton().getAttribute('aria-pressed')).toBe('false');
    expect(tooltipText()).toMatch(/enter the symbols/i);
  });

  it('only offers symbols that can still complete a valid dial', () => {
    tapSlot('left1');
    const offered = pickerOptions();
    expect(offered.length).toBeGreaterThan(0);
    // Column 1 is always a verb; none of them can open a statement.
    expect(offered).not.toContain('drink');
    expect(offered).not.toContain('worship');
  });

  it('labels a side once its trio forms a complete statement', () => {
    TRUTH_TRIO.forEach((s, i) => pick(`left${i + 1}`, s));
    expect(document.getElementById('label-left').textContent).toBe('TRUTH');
    expect(tooltipText()).toMatch(/opposite side/i);
  });

  it('shows the symbol name on each filled slot and in the picker', () => {
    pick('left1', 'pyramid');
    expect(slot('left1').querySelector('.symbol-name').textContent).toBe('PYRAMID');
    tapSlot('left2');
    expect(document.querySelectorAll('#popupGrid .opt-name').length).toBeGreaterThan(0);
  });

  it('advances to illumination once both sides form an opposite-type pair', () => {
    fillValidDial();
    expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    expect(lockButton().classList.contains('glow-phase')).toBe(true);
    expect(tooltipText()).toMatch(/illuminated in-game/i);
  });
});

describe('type lock', () => {
  it('constrains the opposite side to the opposite type', () => {
    TRUTH_TRIO.forEach((s, i) => pick(`left${i + 1}`, s));
    tapSlot('right1');
    // 'darkness' opens a TRUTH statement but never a LIE, so a locked-truth
    // left side must rule it out on the right.
    expect(pickerOptions()).not.toContain('darkness');
  });

  it('survives clearing a symbol on the unlocked side', () => {
    TRUTH_TRIO.forEach((s, i) => pick(`left${i + 1}`, s));
    pick('right1', 'hive');
    clearSlot('right1');

    expect(slot('right1').dataset.symbol).toBeFalsy();
    tapSlot('right1');
    expect(pickerOptions()).not.toContain('darkness');   // regression: lock was dropped
    expect(pickerOptions()).toEqual(expect.arrayContaining(['savathun', 'light']));
    expect(document.getElementById('label-left').textContent).toBe('TRUTH');
  });
});

describe('the callout bar', () => {
  beforeEach(() => {
    fillValidDial();
    tapSlot('left1');    // pyramid is lit in-game
    tapLock();
  });

  it('groups the answer by room, in table order, skipping empty rooms', () => {
    expect(summaryVisible()).toBe(true);
    expect(summaryRows().map(r => r.room)).toEqual(['LEFT ROOM', 'MIDDLE ROOM', 'RIGHT ROOM']);
  });

  it('puts out lit truths and lights unlit lies', () => {
    const rows = summaryRows();
    expect(rows[0]).toEqual({ room: 'LEFT ROOM', illuminate: ['HIVE'], deIlluminate: ['PYRAMID'] });
    expect(rows[1]).toEqual({ room: 'MIDDLE ROOM', illuminate: ['KILL'], deIlluminate: [] });
    expect(rows[2]).toEqual({ room: 'RIGHT ROOM', illuminate: ['LIGHT'], deIlluminate: [] });
  });

  it('never falls back to an unassigned OTHER row', () => {
    expect(summaryRows().some(r => r.room === 'OTHER')).toBe(false);
  });

  it('drops a pin for every symbol it lists', () => {
    const listed = summaryRows().flatMap(r => [...r.illuminate, ...r.deIlluminate]);
    expect(mapPins()).toBe(listed.length);
  });
});

describe('the lock toggle', () => {
  beforeEach(() => {
    fillValidDial();
    tapSlot('left1');
    tapSlot('right1');
  });

  it('closes the padlock and shows the answer', () => {
    expect(padlock()).toBe('open');
    tapLock();
    expect(padlock()).toBe('closed');
    expect(lockButton().getAttribute('aria-pressed')).toBe('true');
    expect(lockButton().title).toMatch(/unlock/i);
    expect(summaryVisible()).toBe(true);
    expect(mapPins()).toBeGreaterThan(0);
    expect(tooltipText()).toMatch(/tap the lock again/i);
  });

  it('pressing it again clears every illumination and the answer', () => {
    tapLock();
    tapLock();

    expect(padlock()).toBe('open');
    expect(lockButton().getAttribute('aria-pressed')).toBe('false');
    expect(glowing()).toEqual([]);
    expect(summaryVisible()).toBe(false);
    expect(mapPins()).toBe(0);
    expect(tooltipText()).toMatch(/illuminated in-game/i);
  });

  it('keeps the six symbols and re-arms for another go', () => {
    tapLock();
    tapLock();
    expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    expect(lockButton().classList.contains('glow-phase')).toBe(true);
    expect(savedState().phase).toBe('illumination');
  });

  it('recomputes the answer from the new marks, not the old ones', () => {
    tapLock();
    tapLock();
    tapSlot('left2');       // drink is lit this time; pyramid and hive are not
    tapLock();

    const all = summaryRows().flatMap(r => r.deIlluminate);
    expect(all).toContain('DRINK');
    expect(all).not.toContain('PYRAMID');
  });

  it('does nothing before the dial is complete', async () => {
    await boot();
    pick('left1', 'pyramid');
    tapLock();
    expect(padlock()).toBe('open');
    expect(summaryVisible()).toBe(false);
  });
});

describe('editing after the dial is complete', () => {
  it('hands the dial back without losing the six symbols', () => {
    fillValidDial();
    tapSlot('left1');
    document.querySelector('#tooltip [data-action="edit-dial"]').click();

    expect(lockButton().classList.contains('glow-phase')).toBe(false);
    expect(glowing()).toEqual([]);
    expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
  });

  it('long-pressing a slot opens it for editing, with the guide off', () => {
    vi.useFakeTimers();
    try {
      fillValidDial();
      tapSlot('left1');                        // mark it lit first
      expect(glowing()).toEqual(['pyramid']);

      longPressSlot('left1');

      expect(lockButton().classList.contains('glow-phase')).toBe(false);  // back to entry
      expect(glowing()).toEqual([]);
      expect(pickerOpen()).toBe(true);
      expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not mistake a normal tap for a long-press', () => {
    vi.useFakeTimers();
    try {
      fillValidDial();
      slot('left1').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }));
      vi.advanceTimersByTime(150);             // released well before the threshold
      slot('left1').dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 5, clientY: 5 }));
      vi.advanceTimersByTime(1000);
      tapSlot('left1');

      expect(pickerOpen()).toBe(false);
      expect(glowing()).toEqual(['pyramid']);  // still just a glow toggle
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the long-press if the finger moves, so scrolling still works', () => {
    vi.useFakeTimers();
    try {
      fillValidDial();
      slot('left1').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }));
      slot('left1').dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 5, clientY: 60 }));
      vi.advanceTimersByTime(1000);

      expect(pickerOpen()).toBe(false);
      expect(lockButton().classList.contains('glow-phase')).toBe(true);   // still illuminating
    } finally {
      vi.useRealTimers();
    }
  });

  it('right-click does the same on desktop', () => {
    fillValidDial();
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    slot('left1').dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);    // no OS menu on top of the picker
    expect(pickerOpen()).toBe(true);
    expect(lockButton().classList.contains('glow-phase')).toBe(false);
  });

  it('leaves an empty slot alone during illumination', () => {
    fillValidDial();
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    slot('left1').dataset.symbol = '';         // pretend it is empty
    slot('left1').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('reopens the picker for a slot that already holds a symbol', () => {
    fillValidDial();
    document.querySelector('#tooltip [data-action="edit-dial"]').click();
    tapSlot('left1');
    expect(pickerOpen()).toBe(true);
    expect(pickerOptions().length + 1).toBeGreaterThan(1);       // options + Clear
    expect(document.querySelector('#popupGrid .clear-option')).toBeTruthy();
  });
});

describe('persistence', () => {
  it('saves symbols, phase and illumination marks', () => {
    fillValidDial();
    tapSlot('left1');
    const saved = savedState();
    expect(saved.symbols).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    expect(saved.phase).toBe('illumination');
    expect(saved.glow[0]).toBe(true);
  });

  it('restores a dial after a reload', async () => {
    fillValidDial();
    tapSlot('left1');
    const seed = { dialState: localStorage.getItem('dialState') };

    await boot(seed);
    expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    expect(glowing()).toEqual(['pyramid']);
    expect(lockButton().classList.contains('glow-phase')).toBe(true);
    expect(tooltipText()).toMatch(/restored your last dial/i);
  });

  it('brings a locked dial back unlocked, ready to re-lock', async () => {
    fillValidDial();
    tapSlot('left1');
    tapLock();
    const seed = { dialState: localStorage.getItem('dialState') };

    await boot(seed);
    expect(padlock()).toBe('open');
    expect(dialSymbols()).toEqual([...TRUTH_TRIO, ...LIE_TRIO]);
    tapLock();
    expect(summaryVisible()).toBe(true);
  });

  it('discards a dial older than the 12 hour window', async () => {
    fillValidDial();
    const stale = JSON.parse(localStorage.getItem('dialState'));
    stale.t = Date.now() - 13 * 60 * 60 * 1000;

    await boot({ dialState: JSON.stringify(stale) });
    expect(dialSymbols()).toEqual(['', '', '', '', '', '']);
  });

  it('ignores corrupt saved state instead of throwing', async () => {
    await boot({ dialState: '{ not json' });
    expect(dialSymbols()).toEqual(['', '', '', '', '', '']);
  });

  it('is cleared by Reset', () => {
    fillValidDial();
    tapLock();
    tapReset();

    expect(localStorage.getItem('dialState')).toBeNull();
    expect(dialSymbols()).toEqual(['', '', '', '', '', '']);
    expect(summaryVisible()).toBe(false);
    expect(mapPins()).toBe(0);
    expect(padlock()).toBe('open');
    expect(document.getElementById('label-left').textContent).toBe('');
  });
});

describe('map-only mode', () => {
  const stubTouch = (isTouch) => {
    globalThis.matchMedia = (q) => ({
      matches: isTouch && /hover: none|pointer: coarse/.test(String(q)),
      media: String(q), onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }
    });
  };

  it('does not engage on a mouse-driven device, however narrow the window', () => {
    stubTouch(false);
    fillValidDial();
    tapLock();
    expect(document.body.classList.contains('map-only')).toBe(false);
    expect(summaryVisible()).toBe(true);
  });

  it('engages on a touch device', () => {
    stubTouch(true);
    fillValidDial();
    tapLock();
    expect(document.body.classList.contains('map-only')).toBe(true);
  });

  it('leaves no inline sizing behind when it exits', () => {
    stubTouch(true);
    fillValidDial();
    tapLock();
    tapReset();

    const img = document.querySelector('.map-img');
    const overlay = document.getElementById('map-overlay');
    expect(document.body.classList.contains('map-only')).toBe(false);
    for (const el of [img, overlay]) {
      for (const prop of ['width', 'height', 'left', 'top']) {
        expect(el.style.getPropertyValue(prop), `${el.className}.${prop}`).toBe('');
      }
    }
  });
});

describe('the picker', () => {
  it('closes on Escape', () => {
    tapSlot('left1');
    expect(pickerOpen()).toBe(true);
    pressEscape();
    expect(pickerOpen()).toBe(false);
  });

  it('closes when you click away', () => {
    tapSlot('left1');
    document.querySelector('.footer').click();
    expect(pickerOpen()).toBe(false);
  });

  it('offers Clear only for a slot that already holds a symbol', () => {
    tapSlot('left1');
    expect(document.querySelector('#popupGrid .clear-option')).toBeNull();
    pick('left1', 'pyramid');
    tapSlot('left1');
    expect(document.querySelector('#popupGrid .clear-option')).toBeTruthy();
  });

  it('uses real buttons so they are keyboard reachable', () => {
    tapSlot('left1');
    const options = [...document.querySelectorAll('#popupGrid .symbol-option')];
    expect(options.length).toBeGreaterThan(0);
    expect(options.every(o => o.tagName === 'BUTTON')).toBe(true);
    expect(options.every(o => o.getAttribute('aria-label'))).toBe(true);
  });
});
