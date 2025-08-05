
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

export function lockGroup(side, type) {
  lockedSide = side;
  lockedType = type;
}

export function validateGroup(symbols) {
  const matchTruth = truthCombinations.find(c => arraysEqual(c, symbols));
  if (matchTruth) return 'truth';
  const matchLie = lieCombinations.find(c => arraysEqual(c, symbols));
  if (matchLie) return 'lie';
  return null;
}

export function getValidSymbols(selected, side, slotIndex) {
  const isGroup1Filled = getSymbols("left").filter(Boolean).length === 3;
  const isGroup2Filled = getSymbols("right").filter(Boolean).length === 3;

  const opposite = side === "left" ? "right" : "left";
  const used = new Set([...getSymbols(opposite), ...selected.filter(Boolean)]);

  const pool = (!lockedSide && (!isGroup1Filled || !isGroup2Filled))
    ? [...truthCombinations, ...lieCombinations]
    : lockedSide === side
      ? (lockedType === 'truth' ? truthCombinations : lieCombinations)
      : (lockedType === 'truth' ? lieCombinations : truthCombinations);

  const matches = pool.filter(combo =>
    combo.every((sym, i) =>
      i === slotIndex || !selected[i] || selected[i] === sym
    ) &&
    combo.every(sym => !used.has(sym))
  );

  return [...new Set(matches.map(c => c[slotIndex]))];
}

export function getAllowedCombinations(forSide) {
  const left = getSymbols("left");
  const right = getSymbols("right");
  const isLeftComplete = left.length === 3;
  const isRightComplete = right.length === 3;

  if (!lockedSide || !isLeftComplete || !isRightComplete)
    return [...truthCombinations, ...lieCombinations];

  return lockedSide === forSide
    ? (lockedType === 'truth' ? truthCombinations : lieCombinations)
    : (lockedType === 'truth' ? lieCombinations : truthCombinations);
}

function getSymbols(side) {
  return [`${side}1`, `${side}2`, `${side}3`].map(id =>
    document.querySelector(`.dial-slot.${id}`)?.dataset.symbol || null
  ).filter(Boolean);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
