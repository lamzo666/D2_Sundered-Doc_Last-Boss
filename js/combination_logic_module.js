// combination_logic_module.js

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
  const filled = selectedSymbols.filter(Boolean);
  if (filled.length === 0) return getAllSymbols();
  
  const matches = allCombinations.filter(combo => filled.every(sym => combo.includes(sym)));
  
  const alreadySelected = new Set(filled);
  const remainingSymbols = new Set();
  matches.forEach(combo => {
    combo.forEach(sym => {
      if (!alreadySelected.has(sym)) remainingSymbols.add(sym);
    });
  });

  return [...remainingSymbols];
}

export function validateGroup(symbols) {
  const sorted = [...symbols].sort();
  const isTruth = truthCombinations.some(c => arraysEqual(c.sort(), sorted));
  const isLie = lieCombinations.some(c => arraysEqual(c.sort(), sorted));

  if (isTruth) return 'truth';
  if (isLie) return 'lie';
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
