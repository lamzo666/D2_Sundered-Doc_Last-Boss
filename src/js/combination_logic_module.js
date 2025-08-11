// === Canonical combinations (12 truths, 17 lies) ===
const TRUTH = [
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

const LIE = [
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

// lock state (once one side forms a valid trio)
let lockedSide = null; // 'left' | 'right' | null
let lockedType = null; // 'truth' | 'lie' | null

// ----------------- helpers -----------------
function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
function setHasOverlap(a, b) {
  const s = new Set(a);
  return b.some(x => s.has(x));
}
function groupTypeOf(symbols) {
  if (TRUTH.some(c => arraysEqual(c, symbols))) return 'truth';
  if (LIE.some(c => arraysEqual(c, symbols))) return 'lie';
  return null;
}
function getSymbolsFromSide(side) {
  return [1,2,3].map(i => {
    const el = document.querySelector(`.dial-slot.${side}${i}`);
    return el?.dataset.symbol || null;
  });
}

// Return combos (from a given pool) that match a partial trio (array of length 3 with nulls)
function matchingCombos(pool, partial) {
  return pool.filter(c => c.every((val, i) => !partial[i] || partial[i] === val));
}

// Given current partials + (optional) candidate placed, check if there exists
// at least one pair (leftCombo, rightCombo) such that:
// - leftCombo ∈ pool by side/type rules and matches leftPartial
// - rightCombo ∈ opposite pool and matches rightPartial
// - leftCombo and rightCombo are disjoint (no shared symbols)
function feasiblePairExists(leftPartial, rightPartial) {
  // Which pools are allowed per side right now?
  let leftPools, rightPools;

  if (lockedSide === 'left') {
    leftPools  = (lockedType === 'truth') ? [TRUTH] : [LIE];
    rightPools = (lockedType === 'truth') ? [LIE] : [TRUTH];
  } else if (lockedSide === 'right') {
    rightPools = (lockedType === 'truth') ? [TRUTH] : [LIE];
    leftPools  = (lockedType === 'truth') ? [LIE] : [TRUTH];
  } else {
    // not locked: each side can still be either type
    leftPools = [TRUTH, LIE];
    rightPools = [TRUTH, LIE];
  }

  // Expand all matches for each side (dedup across pools)
  const leftMatches = [...new Set(leftPools.flatMap(p => matchingCombos(p, leftPartial).map(c => c.join('|'))))]
    .map(s => s.split('|'));
  const rightMatches = [...new Set(rightPools.flatMap(p => matchingCombos(p, rightPartial).map(c => c.join('|'))))]
    .map(s => s.split('|'));

  if (leftMatches.length === 0 || rightMatches.length === 0) return false;

  // require disjoint final sets (no symbol reused across sides)
  for (const L of leftMatches) {
    for (const R of rightMatches) {
      if (!setHasOverlap(L, R)) return true;
    }
  }
  return false;
}

// ----------------- public API -----------------
export function getValidSymbols(selectedSymbols, side, slotIndex) {
  // selectedSymbols is the partial trio for THIS side (length 3 array with nulls)
  if (slotIndex < 0 || slotIndex > 2) return [];

  const otherSide = side === 'left' ? 'right' : 'left';
  const leftPartial  = (side === 'left')  ? [...selectedSymbols] : getSymbolsFromSide('left');
  const rightPartial = (side === 'right') ? [...selectedSymbols] : getSymbolsFromSide('right');

  // Candidate set = symbols at this slot from all combos that match this side's partial,
  // respecting current lock (side → truth/lie pool).
  let pool;
  if (lockedSide === side) {
    pool = (lockedType === 'truth') ? TRUTH : LIE;
  } else if (lockedSide && lockedSide !== side) {
    pool = (lockedType === 'truth') ? LIE : TRUTH;
  } else {
    pool = [...TRUTH, ...LIE];
  }

  const matches = matchingCombos(pool, (side === 'left') ? leftPartial : rightPartial);
  const candidates = [...new Set(matches.map(c => c[slotIndex]))];

  // For each candidate, simulate placing it and ask if any full (left,right) pair remains feasible
  const valid = [];
  for (const cand of candidates) {
    if (selectedSymbols.includes(cand)) continue; // no duplicate inside the same trio

    if (side === 'left') {
      const lp = [...leftPartial];
      lp[slotIndex] = cand;
      if (feasiblePairExists(lp, rightPartial)) valid.push(cand);
    } else {
      const rp = [...rightPartial];
      rp[slotIndex] = cand;
      if (feasiblePairExists(leftPartial, rp)) valid.push(cand);
    }
  }

  return valid;
}

export function validateGroup(symbols) {
  return groupTypeOf(symbols); // 'truth' | 'lie' | null
}

export function lockGroup(side, type) {
  lockedSide = side;   // 'left' | 'right'
  lockedType = type;   // 'truth' | 'lie'
}

export function clearLock() {
  lockedSide = null;
  lockedType = null;
}
