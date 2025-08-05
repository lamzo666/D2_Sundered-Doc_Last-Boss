
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

  console.log(`\n--- getValidSymbols ---`);
  console.log(`side: ${side}, slotIndex: ${slotIndex}`);
  console.log(`selectedSymbols:`, selectedSymbols);

  let pool = getAllowedCombinations(side);
  const oppositeUsed = new Set(getSymbolsFromOtherSide(side));
  console.log(`oppositeUsed symbols (${side === 'left' ? 'right' : 'left'}):`, [...oppositeUsed]);

  pool = pool.filter(combo => combo.every(sym => !oppositeUsed.has(sym)));

  const matches = pool.filter(combo =>
    combo.every((val, i) =>
      i === slotIndex || !selectedSymbols[i] || selectedSymbols[i] === val
    )
  );

  const result = [...new Set(matches.map(c => c[slotIndex]))];
  const ownUsed = new Set(selectedSymbols.filter(Boolean));
  const filtered = result.filter(sym => !ownUsed.has(sym));

  console.log(`validSymbols (raw):`, result);
  console.log(`ownUsed:`, [...ownUsed]);
  console.log(`validSymbols (final):`, filtered);
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
