// combination_logic_module.js (enforces strict position matching for each slot)

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

let lockedSide = null; // 'left' or 'right'
let lockedType = null; // 'truth' or 'lie'

export function getValidSymbols(selectedSymbols, side) {
  const allCombinations = getAllowedCombinations(side);
  const slotIndex = selectedSymbols.findIndex(s => !s);
  if (slotIndex < 0) return [];

  const matches = allCombinations.filter(combo => {
    return selectedSymbols.every((sym, i) => {
      if (!sym) return true;
      return combo[i] === sym;
    });
  });

  return [...new Set(matches.map(combo => combo[slotIndex]))];
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

function getAllSymbols() {
  const all = truthCombinations.concat(lieCombinations);
  return [...new Set(all.flat())];
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
