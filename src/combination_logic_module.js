// src/combination_logic_module.js

// ===== Canonical combos: 12 TRUTH, 17 LIE =====
export const truthCombinations = Object.freeze([
  ["pyramid","drink","worm"],
  ["pyramid","kill","worm"],
  ["pyramid","stop","savathun"],
  ["pyramid","give","darkness"],
  ["guardian","worship","light"],
  ["guardian","worship","traveller"],
  ["guardian","kill","witness"],
  ["traveller","give","guardian"],
  ["traveller","give","light"],
  ["hive","worship","darkness"],
  ["hive","worship","worm"],
  ["darkness","stop","savathun"]
]);

export const lieCombinations = Object.freeze([
  ["hive","kill","worm"],
  ["hive","kill","light"],
  ["hive","give","darkness"],
  ["hive","stop","witness"],
  ["traveller","kill","guardian"],
  ["traveller","drink","worm"],
  ["traveller","give","hive"],
  ["traveller","stop","witness"],
  ["pyramid","drink","guardian"],   // ← included per your list
  ["pyramid","stop","witness"],
  ["witness","drink","light"],
  ["witness","kill","pyramid"],
  ["guardian","worship","witness"],
  ["guardian","kill","traveller"],
  ["savathun","drink","darkness"],
  ["savathun","stop","darkness"],
  ["light","stop","savathun"]
]);

let lockedSide = null;
let lockedType = null;

export function getValidSymbols(selectedSymbols, side, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return [];

  let pool = getAllowedCombinations(side);
  const oppositeUsed = new Set(getSymbolsFromOtherSide(side));

  // ban any combo containing a symbol already used on the opposite side
  pool = pool.filter(combo => combo.every(sym => !oppositeUsed.has(sym)));

  // must match already-chosen symbols on this side
  const matches = pool.filter(combo =>
    combo.every((val, i) =>
      i === slotIndex || !selectedSymbols[i] || selectedSymbols[i] === val
    )
  );

  // candidates for this slot, no repeats on same side
  const ownUsed = new Set(selectedSymbols.filter(Boolean));
  return [...new Set(matches.map(c => c[slotIndex]))].filter(sym => !ownUsed.has(sym));
}

function getSymbolsFromOtherSide(side) {
  const otherSide = side === 'left' ? 'right' : 'left';
  return [1,2,3]
    .map(i => document.querySelector(`.dial-slot.${otherSide}${i}`)?.dataset.symbol || null)
    .filter(Boolean);
}

export function validateGroup(symbols) {
  if (truthCombinations.find(c => arraysEqual(c, symbols))) return 'truth';
  if (lieCombinations.find(c => arraysEqual(c, symbols))) return 'lie';
  return null;
}

export function lockGroup(side, type) { lockedSide = side; lockedType = type; }
export function clearLock() { lockedSide = null; lockedType = null; }

export function getAllowedCombinations(forSide) {
  const left = getSymbolsFromOtherSide('left');
  const right = getSymbolsFromOtherSide('right');
  const isLeftComplete = left.length === 3;
  const isRightComplete = right.length === 3;

  if (!lockedSide || !isLeftComplete || !isRightComplete)
    return [...truthCombinations, ...lieCombinations];

  return lockedSide === forSide
    ? (lockedType === 'truth' ? truthCombinations : lieCombinations)
    : (lockedType === 'truth' ? lieCombinations : truthCombinations);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/* ---- Dev-time sanity check (optional; shows in console while running vite dev) ---- */
if (import.meta?.env?.DEV) {
  const asKey = c => c.join(',');
  const sTruth = new Set(truthCombinations.map(asKey));
  const sLie   = new Set(lieCombinations.map(asKey));
  const overlap = [...sTruth].filter(k => sLie.has(k));
  if (overlap.length) {
    // eslint-disable-next-line no-console
    console.warn('Overlap between TRUTH and LIE combos:', overlap);
  }
  // eslint-disable-next-line no-console
  console.log(`Combos loaded → TRUTH: ${sTruth.size}, LIE: ${sLie.size}`);
}
