// Integrity of the hand-maintained tables: the TRUTH/LIE combos, the map
// coordinates, the display names and the room groupings. These guard the data
// you edit by hand — they can't tell you the combos match the encounter, only
// that they are internally consistent and completely wired up.

import { describe, it, expect, beforeAll } from 'vitest';
import { TRUTH, LIE } from '../src/combination_logic_module.js';

let COORDS, NAMES, ROOMS;

beforeAll(async () => {
  await import('../src/map_logic.js');
  COORDS = window.MAP_COORDS;
  NAMES = window.SYMBOL_NAME_MAP;
  ROOMS = window.MAP_ROOMS;
});

const ALL_COMBOS = () => [...TRUTH, ...LIE];
const key = (trio) => trio.join('|');

describe('combination tables', () => {
  it('holds the expected counts', () => {
    expect(TRUTH).toHaveLength(12);
    expect(LIE).toHaveLength(17);
  });

  it('has no duplicate trio, within or across the two lists', () => {
    const keys = ALL_COMBOS().map(key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('never repeats a symbol inside a single trio', () => {
    const offenders = ALL_COMBOS().filter(c => new Set(c).size !== c.length);
    expect(offenders).toEqual([]);
  });

  it('gives every trio exactly three symbols', () => {
    expect(ALL_COMBOS().every(c => c.length === 3)).toBe(true);
  });

  it('leaves no truth without a disjoint lie partner', () => {
    const orphans = TRUTH.filter(t => !LIE.some(l => !l.some(s => t.includes(s))));
    expect(orphans).toEqual([]);
  });

  it('leaves no lie without a disjoint truth partner', () => {
    const orphans = LIE.filter(l => !TRUTH.some(t => !l.some(s => t.includes(s))));
    expect(orphans).toEqual([]);
  });
});

describe('map data', () => {
  it('has coordinates for every symbol used in a combo', () => {
    const used = [...new Set(ALL_COMBOS().flat())];
    expect(used.filter(s => !COORDS[s])).toEqual([]);
  });

  it('has no coordinate for a symbol no combo uses', () => {
    const used = new Set(ALL_COMBOS().flat());
    expect(Object.keys(COORDS).filter(s => !used.has(s))).toEqual([]);
  });

  it('has a display name for every symbol', () => {
    expect(Object.keys(COORDS).filter(s => !NAMES[s])).toEqual([]);
  });

  it('expresses every coordinate as a percentage', () => {
    for (const [sym, pos] of Object.entries(COORDS)) {
      expect(pos.top, `${sym}.top`).toMatch(/^-?\d+(\.\d+)?%$/);
      expect(pos.left, `${sym}.left`).toMatch(/^-?\d+(\.\d+)?%$/);
    }
  });

  it('keeps every pin inside the map', () => {
    for (const [sym, pos] of Object.entries(COORDS)) {
      expect(parseFloat(pos.top), `${sym}.top`).toBeGreaterThanOrEqual(0);
      expect(parseFloat(pos.top), `${sym}.top`).toBeLessThan(100);
      expect(parseFloat(pos.left), `${sym}.left`).toBeGreaterThanOrEqual(0);
      expect(parseFloat(pos.left), `${sym}.left`).toBeLessThan(100);
    }
  });
});

describe('room groupings', () => {
  it('gives every room a label and at least one symbol', () => {
    for (const room of ROOMS) {
      expect(room.label).toBeTruthy();
      expect(room.symbols.length).toBeGreaterThan(0);
    }
  });

  it('assigns every map symbol to a room', () => {
    const assigned = new Set(ROOMS.flatMap(r => r.symbols));
    expect(Object.keys(COORDS).filter(s => !assigned.has(s))).toEqual([]);
  });

  it('never puts a symbol in two rooms', () => {
    const assigned = ROOMS.flatMap(r => r.symbols);
    expect(assigned.filter((s, i) => assigned.indexOf(s) !== i)).toEqual([]);
  });

  it('never assigns a symbol that is not on the map', () => {
    const assigned = ROOMS.flatMap(r => r.symbols);
    expect(assigned.filter(s => !COORDS[s])).toEqual([]);
  });
});
