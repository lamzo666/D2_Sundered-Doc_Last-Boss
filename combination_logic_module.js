// ===== Truth & Lie combinations (12 truth, 17 lie) =====
export const truthCombinations = [
  ["pyramid", "drink", "worm"],
  ["pyramid", "kill", "worm"],
  ["pyramid", "stop", "savathun"],
  ["pyramid", "give", "darkness"],
  ["guardian", "worship", "light"],
  ["guardian", "worship", "traveller"],
  ["guardian", "kill", "witness"],
  ["traveller", "give", "guardian"],
  ["traveller", "give", "light"],
  ["hive", "worship", "darkness"],
  ["hive", "worship", "worm"],
  ["darkness", "stop", "savathun"]
];

export const lieCombinations = [
  ["hive", "kill", "worm"],
  ["hive", "kill", "light"],
  ["hive", "give", "darkness"],
  ["hive", "stop", "witness"],
  ["traveller", "kill", "guardian"],
  ["traveller", "drink", "worm"],
  ["traveller", "give", "hive"],
  ["traveller", "stop", "witness"],
  ["pyramid", "drink", "guardian"],
  ["pyramid", "stop", "witness"],
  ["witness", "drink", "light"],
  ["witness", "kill", "pyramid"],
  ["guardian", "worship", "witness"],
  ["guardian", "kill", "traveller"],
  ["savathun", "drink", "darkness"],
  ["savathun", "stop", "darkness"],
  ["light", "stop", "savathun"]
];

let lockedSide = null;
let lockedType = null;

export function getValidSymbols(selectedSymbols, side, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return [];

  let pool = getAllowedCombinations(side);
  const oppositeUsed = new Set(getSymbolsFromOtherSide(side));

  // Remove combos that contain any symbol already used on the opposite side
  pool = pool.filter(combo => combo.every(sym => !oppositeUsed.has(sym)));

  // Must match already chosen symbols on the same side
  const matches = pool.filter(combo =>
    combo.every((val, i) =>
      i === slotIndex || !selectedSymbols[i] || selectedSymbols[i] === val
    )
  );

  // Unique candidates for this position
  const result = [...new Set(matches.map(c => c[slotIndex]))];

  // No repeats within the same side
  const ownUsed = new Set(selectedSymbols.filter(Boolean));
  const filtered = result.filter(sym => !ownUsed.has(sym));

  return filtered;
}

function getSymbolsFromOtherSide(side) {
  const otherSide = side === 'left' ? 'right' : 'left';
  const classes = [`${otherSide}1`, `${otherSide}2`, `${otherSide}3`];
  const symbols = classes.map(cls => {
    const el = document.querySelector(`.dial-slot.${cls}`);
    return el?.dataset.symbol || null;
  }).filter(Boolean);
  return symbols;
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
