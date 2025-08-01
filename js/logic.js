// Updated logic.js with refined autofill

const truthCombinations = [
  [
    "pyramid",
    "drink",
    "worm"
  ],
  [
    "pyramid",
    "kill",
    "worm"
  ],
  [
    "pyramid",
    "stop",
    "savathun"
  ],
  [
    "pyramid",
    "give",
    "darkness"
  ],
  [
    "guardian",
    "worship",
    "light"
  ],
  [
    "guardian",
    "worship",
    "traveller"
  ],
  [
    "guardian",
    "kill",
    "witness"
  ],
  [
    "traveller",
    "give",
    "guardian"
  ],
  [
    "traveller",
    "give",
    "light"
  ],
  [
    "hive",
    "worship",
    "darkness"
  ],
  [
    "hive",
    "worship",
    "worm"
  ],
  [
    "darkness",
    "stop",
    "savathun"
  ]
];
const lieCombinations = [
  [
    "hive",
    "kill",
    "worm"
  ],
  [
    "hive",
    "kill",
    "light"
  ],
  [
    "hive",
    "give",
    "darkness"
  ],
  [
    "hive",
    "stop",
    "witness"
  ],
  [
    "traveller",
    "kill",
    "guardian"
  ],
  [
    "traveller",
    "drink",
    "worm"
  ],
  [
    "traveller",
    "give",
    "hive"
  ],
  [
    "traveller",
    "stop",
    "witness"
  ],
  [
    "pyramid",
    "stop",
    "witness"
  ],
  [
    "witness",
    "drink",
    "light"
  ],
  [
    "witness",
    "kill",
    "pyramid"
  ],
  [
    "guardian",
    "worship",
    "witness"
  ],
  [
    "guardian",
    "kill",
    "traveller"
  ],
  [
    "savathun",
    "drink",
    "darkness"
  ],
  [
    "savathun",
    "stop",
    "darkness"
  ],
  [
    "light",
    "stop",
    "savathun"
  ]
];

// Evaluate autofill only when exactly one symbol leads to one valid combo
function evaluateComboAutoFill(group) {
  const slotIds = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  const current = getSymbolsFromSlots(group);
  const filled = current.filter(Boolean);
  if (filled.length !== 1) return;

  const allCombos = truthCombinations.concat(lieCombinations);
  const matchingCombos = allCombos.filter(combo =>
    combo.includes(filled[0])
  );

  const uniqueCombo = matchingCombos.find(combo =>
    combo.includes(filled[0]) && matchingCombos.filter(c => c.includes(filled[0])).length === 1
  );

  if (uniqueCombo) {
    const alreadyPlaced = new Set(filled);
    slotIds.forEach((id) => {
      const el = document.querySelector(`.dial-slot.${id}`);
      if (!el.dataset.symbol) {
        const next = uniqueCombo.find(sym => !alreadyPlaced.has(sym));
        if (next) {
          el.style.backgroundImage = `url('./img/${next}.png')`;
          el.dataset.symbol = next;
          alreadyPlaced.add(next);
        }
      }
    });
    updateTruthLieLabel();
  }
}

// Placeholder functions assumed defined elsewhere:
function getSymbolsFromSlots(group) {
  const ids = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
  return ids.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el?.dataset.symbol || null;
  });
}

function updateTruthLieLabel() {
  const left = getSymbolsFromSlots('left').sort();
  const right = getSymbolsFromSlots('right').sort();

  const isLeftTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isLeftLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isRightTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
  const isRightLie = lieCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));

  const leftLabel = document.getElementById('label-left');
  const rightLabel = document.getElementById('label-right');

  if ((isLeftTruth && isRightLie) || (isRightTruth && isLeftLie)) {
    leftLabel.textContent = isLeftTruth ? 'TRUTH' : 'LIE';
    leftLabel.style.color = isLeftTruth ? 'limegreen' : 'red';
    rightLabel.textContent = isRightTruth ? 'TRUTH' : 'LIE';
    rightLabel.style.color = isRightTruth ? 'limegreen' : 'red';
  } else {
    leftLabel.textContent = '';
    rightLabel.textContent = '';
  }
}
