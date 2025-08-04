// combination_logic_module.js (final logic applied)

const truthCombinations = [
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

const lieCombinations = [
  ["hive", "kill", "worm"],
  ["hive", "kill", "light"],
  ["hive", "give", "darkness"],
  ["hive", "stop", "witness"],
  ["traveller", "kill", "guardian"],
  ["traveller", "drink", "worm"],
  ["traveller", "give", "hive"],
  ["traveller", "stop", "witness"],
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

  const pool = getAllowedCombinations(side);
  const matches = pool.filter(combo =>
    selectedSymbols.every((sym, i) => !sym || combo[i] === sym)
  );

  return [...new Set(matches.map(c => c[slotIndex]))];
}

  return [...new Set(matches.map(combo => combo[slotIndex]))];
}

export function getSlotRestrictedSymbols(slotIndex, side) {
  const combos = getAllowedCombinations(side);
  return [...new Set(combos.map(c => c[slotIndex]))];
}

export function validateGroup(symbols) {
  const matchTruth = truthCombinations.find(c => arraysEqual(c, symbols));
  if (matchTruth) return 'truth';
  const matchLie = lieCombinations.find(c => arraysEqual(c, symbols));
  if (matchLie) return 'lie';
  return null;
}

export function lockGroup(side, type) {
  lockedSide = side;
  lockedType = type;
}

export function getAllowedCombinations(forSide) {
  if (!lockedSide) return truthCombinations.concat(lieCombinations);
  return lockedSide === forSide
    ? (lockedType === 'truth' ? truthCombinations : lieCombinations)
    : (lockedType === 'truth' ? lieCombinations : truthCombinations);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
