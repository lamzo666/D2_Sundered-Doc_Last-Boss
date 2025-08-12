// combination_logic_module.js
// Deep-simulation validator for the Sundered-Doc dial
// Canonical lists: TRUTH x12, LIE x17

const TRUTH = Object.freeze([
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

const LIE = Object.freeze([
  ["hive","kill","worm"],
  ["hive","kill","light"],
  ["hive","give","darkness"],
  ["hive","stop","witness"],
  ["traveller","kill","guardian"],
  ["traveller","drink","worm"],
  ["traveller","give","hive"],
  ["traveller","stop","witness"],
  ["pyramid","drink","guardian"],
  ["pyramid","stop","witness"],
  ["witness","drink","light"],
  ["witness","kill","pyramid"],
  ["guardian","worship","witness"],
  ["guardian","kill","traveller"],
  ["savathun","drink","darkness"],
  ["savathun","stop","darkness"],
  ["light","stop","savathun"]
]);

let lockedSide = null; // 'left' | 'right' | null
let lockedType = null; // 'truth' | 'lie'   | null

// ---------- helpers ----------
const eq = (a,b) => a.length===b.length && a.every((v,i)=>v===b[i]);
const groupTypeOf = (t) =>
  TRUTH.some(c=>eq(c,t)) ? 'truth' :
  LIE.some(c=>eq(c,t))   ? 'lie'   : null;

const getSidePartial = (side) =>
  [1,2,3].map(i => document.querySelector(`.dial-slot.${side}${i}`)?.dataset.symbol || null);

const matchingCombos = (pool, partial) =>
  pool.filter(c => c.every((val,i)=> !partial[i] || partial[i]===val));

const disjoint = (a,b) => {
  const s = new Set(a);
  return !b.some(x => s.has(x));
};

// pools allowed for a given side under current lock
function poolsFor(side) {
  if (!lockedSide) return [TRUTH, LIE];
  if (lockedSide === side) return lockedType === 'truth' ? [TRUTH] : [LIE];
  // opposite side must be the opposite type
  return lockedType === 'truth' ? [LIE] : [TRUTH];
}

// Is there at least one complete (left,right) pair remaining that:
// - matches both partials
// - respects the lock (opposite types when locked)
// - uses disjoint symbols across sides
function feasiblePairExists(leftPartial, rightPartial) {
  const leftMatches = [...new Set(
    poolsFor('left').flatMap(p => matchingCombos(p, leftPartial).map(c=>c.join('|')))
  )].map(s=>s.split('|'));

  const rightMatches = [...new Set(
    poolsFor('right').flatMap(p => matchingCombos(p, rightPartial).map(c=>c.join('|')))
  )].map(s=>s.split('|'));

  if (!leftMatches.length || !rightMatches.length) return false;

  for (const L of leftMatches) {
    for (const R of rightMatches) {
      if (disjoint(L,R)) return true;
    }
  }
  return false;
}

// ---------- public API used by logic.js ----------
export function getValidSymbols(selectedSymbols, side, slotIndex) {
  if (slotIndex < 0 || slotIndex > 2) return [];

  const other = side === 'left' ? 'right' : 'left';
  const leftPartial  = side === 'left'  ? [...selectedSymbols] : getSidePartial('left');
  const rightPartial = side === 'right' ? [...selectedSymbols] : getSidePartial('right');

  // Candidates = symbols at this slot from combos that match this side's partial,
  // restricted to currently allowed pool(s) for this side.
  const baseMatches = matchingCombos(
    poolsFor(side).flat(),
    side === 'left' ? leftPartial : rightPartial
  );
  const candidates = [...new Set(baseMatches.map(c => c[slotIndex]))];

  // Try each candidate; keep only the ones that can still lead to a valid (truth, lie) pair
  const usedOnThisSide = new Set(selectedSymbols.filter(Boolean));
  const valid = [];
  for (const cand of candidates) {
    if (usedOnThisSide.has(cand)) continue; // no repeats within the trio
    if (side === 'left') {
      const lp = [...leftPartial]; lp[slotIndex] = cand;
      if (feasiblePairExists(lp, rightPartial)) valid.push(cand);
    } else {
      const rp = [...rightPartial]; rp[slotIndex] = cand;
      if (feasiblePairExists(leftPartial, rp)) valid.push(cand);
    }
  }
  return valid;
}

export function validateGroup(symbols) {
  return groupTypeOf(symbols); // 'truth' | 'lie' | null
}
export function lockGroup(side, type) { lockedSide = side; lockedType = type; }
export function clearLock() { lockedSide = null; lockedType = null; }

// Dev aid (seen in console during `npm run dev`)
if (import.meta?.env?.DEV) {
  console.log(`Combos loaded → TRUTH: ${TRUTH.length}, LIE: ${LIE.length}`);
}
