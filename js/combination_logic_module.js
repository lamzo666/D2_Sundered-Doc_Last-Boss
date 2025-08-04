
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

  const usedSymbols = new Set([
    ...selectedSymbols.filter(Boolean),
    ...(side === 'left' ? rightGroupUsedSymbols() : leftGroupUsedSymbols())
  ]);

  const pool = getAllowedCombinations(side);

  const valid = new Set();

  for (const combo of pool) {
    let match = true;
    for (let i = 0; i < 3; i++) {
      if (i !== slotIndex && selectedSymbols[i] && combo[i] !== selectedSymbols[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      const candidate = combo[slotIndex];
      if (!usedSymbols.has(candidate)) {
        valid.add(candidate);
      }
    }
  }

  return [...valid];
}

function leftGroupUsedSymbols() {
  return getSymbolsFromGroup(['left1', 'left2', 'left3']);
}

function rightGroupUsedSymbols() {
  return getSymbolsFromGroup(['right1', 'right2', 'right3']);
}

function getSymbolsFromGroup(classList) {
  return classList.map(c => {
    const el = document.querySelector(`.dial-slot.${c}`);
    return el?.dataset.symbol || null;
  }).filter(Boolean);
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
