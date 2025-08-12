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
  ["pyramid","drink","guardian"],    // per your list
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

  // Start from the allowed pool given current lock
  let pool = getAllowedCombinations(side);

  // Ban any combo that uses a symbol already chosen on the opposite side
  const oppositeUsed = new Set(getSymbolsFromOtherSide(side));
  pool = pool.filter(combo => combo.every(sym => !oppositeUsed.has(sym)));

  // Must match already-chosen symbols on the same side
  const matches = pool.filter(combo =>
    combo.every((val, i) =>
      i === slotIndex || !selectedSymbols[i] || selectedSymbols[i] === val
    )
  );

  // Candidates for this slot, excluding repeats on this side
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

// ❗ FIX: enforce the lock immediately — do NOT wait for both sides to be complete
export function getAllowedCombinations(forSide) {
  if (!lockedSide) return [...truthCombinations, ...lieCombinations];

  const lockedIsTruth = lockedType === 'truth';
  if (forSide === lockedSide) {
    return lockedIsTruth ? truthCombinations : lieCombinations;
  } else {
    return lockedIsTruth ? lieCombinations : truthCombinations;
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Dev aid (safe to keep)
if (import.meta?.env?.DEV) {
  const asKey = c => c.join(',');
  const sTruth = new Set(truthCombinations.map(asKey));
  const sLie   = new Set(lieCombinations.map(asKey));
  const overlap = [...sTruth].filter(k => sLie.has(k));
  if (overlap.length) console.warn('Overlap TRUTH/LIE:', overlap);
  console.log(`Combos → TRUTH: ${sTruth.size}, LIE: ${sLie.size}`);
}
