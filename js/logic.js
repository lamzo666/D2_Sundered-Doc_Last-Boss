// logic.js

const baseSymbols = [
  "guardian", "hive", "traveller", "pyramid", "darkness", "savathun", "witness"
];

const allSymbols = [
  "guardian", "hive", "kill", "light", "darkness",
  "drink", "give", "pyramid", "savathun", "stop",
  "traveller", "witness", "worm", "worship"
];

const truthCombinations = [
  ["pyramid", "drink", "worm"], ["pyramid", "kill", "worm"],
  ["pyramid", "stop", "savathun"], ["pyramid", "give", "darkness"],
  ["guardian", "worship", "light"], ["guardian", "worship", "traveller"],
  ["guardian", "kill", "witness"], ["traveller", "give", "guardian"],
  ["traveller", "give", "light"], ["hive", "worship", "darkness"],
  ["hive", "worship", "worm"], ["darkness", "stop", "savathun"]
];

const lieCombinations = [
  ["hive", "kill", "worm"], ["hive", "kill", "light"],
  ["hive", "give", "darkness"], ["hive", "stop", "witness"],
  ["traveller", "kill", "guardian"], ["traveller", "drink", "worm"],
  ["traveller", "give", "hive"], ["traveller", "stop", "witness"],
  ["pyramid", "stop", "witness"], ["witness", "drink", "light"],
  ["witness", "kill", "pyramid"], ["guardian", "worship", "witness"],
  ["guardian", "kill", "traveller"], ["savathun", "drink", "darkness"],
  ["savathun", "stop", "darkness"], ["light", "stop", "savathun"]
];

let selectedSymbols = {
  left: [null, null, null],
  right: [null, null, null]
};

function equalArray(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function getValidSymbols(group, index) {
  const otherGroup = group === 'left' ? 'right' : 'left';
  const groupSymbols = selectedSymbols[group].filter(Boolean);
  const allSelected = [...selectedSymbols.left, ...selectedSymbols.right].filter(Boolean);

  if (index === 0) {
    return baseSymbols.filter(sym => !allSelected.includes(sym));
  }

  const partial = [...groupSymbols];
  const possible = new Set();

  [...truthCombinations, ...lieCombinations].forEach(combo => {
    if (partial.every(s => combo.includes(s))) {
      combo.forEach(sym => {
        if (!partial.includes(sym) && !allSelected.includes(sym)) {
          possible.add(sym);
        }
      });
    }
  });

  return [...possible];
}

function checkCombinations() {
  console.log("🧪 Running map checkCombinations");

  const truthLabel = document.getElementById('truthLieLabel');
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const left = [...selectedSymbols.left];
  const right = [...selectedSymbols.right];

  const leftActive = ['left1','left2','left3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'))
    .map(id => {
      const match = document.querySelector(`.dial-slot.${id}`).style.backgroundImage.match(/\/([^\/]+)\.png/);
      return match ? match[1] : null;
    });

  const rightActive = ['right1','right2','right3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'))
    .map(id => {
      const match = document.querySelector(`.dial-slot.${id}`).style.backgroundImage.match(/\/([^\/]+)\.png/);
      return match ? match[1] : null;
    });

  const isLeftTruth = truthCombinations.some(c => equalArray(c.sort(), left.sort()));
  const isRightTruth = truthCombinations.some(c => equalArray(c.sort(), right.sort()));
  const isLeftLie = lieCombinations.some(c => equalArray(c.sort(), left.sort()));
  const isRightLie = lieCombinations.some(c => equalArray(c.sort(), right.sort()));

  let truth = [], lie = [], truthActive = [], lieInactive = [];

  if (isLeftTruth && isRightLie) {
    truth = left;
    lie = right;
    truthActive = leftActive.filter(sym => truth.includes(sym));
    lieInactive = right.filter(sym => !rightActive.includes(sym));
    truthLabel.innerHTML = '<div style="text-align:center;color:#00ff00;">TRUTH</div><div></div><div style="text-align:center;color:#ff4444;">LIE</div>';
  } else if (isRightTruth && isLeftLie) {
    truth = right;
    lie = left;
    truthActive = rightActive.filter(sym => truth.includes(sym));
    lieInactive = left.filter(sym => !leftActive.includes(sym));
    truthLabel.innerHTML = '<div style="text-align:center;color:#ff4444;">LIE</div><div></div><div style="text-align:center;color:#00ff00;">TRUTH</div>';
  } else {
    truthLabel.innerHTML = '';
    alert('No valid Truth/Lie match');
    return;
  }

  const symbolPositions = {
    "stop": { top: '22.31%', left: '38.64%' },
    "kill": { top: '70.14%', left: '65.96%' },
    "darkness": { top: '39.91%', left: '80.93%' },
    "drink": { top: '1.74%', left: '56.29%' },
    "give": { top: '22.31%', left: '53.32%' },
    "guardian": { top: '45.96%', left: '19.49%' },
    "hive": { top: '29.77%', left: '19.53%' },
    "light": { top: '59.68%', left: '72.98%' },
    "pyramid": { top: '62.75%', left: '2.15%' },
    "savathun": { top: '5.32%', left: '92.50%' },
    "traveller": { top: '87.52%', left: '19.53%' },
    "witness": { top: '30.20%', left: '2.00%' },
    "worm": { top: '7.16%', left: '75.20%' },
    "worship": { top: '70.42%', left: '31.45%' }
  };

  [...truthActive, ...lieInactive].forEach(name => {
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `./img/${name}.png`;
    const pos = symbolPositions[name];
    if (!pos) return;
    Object.assign(img.style, {
      position: 'absolute', top: pos.top, left: pos.left,
      width: '5%', aspectRatio: '1 / 1', pointerEvents: 'none', zIndex: '2'
    });
    if (truthActive.includes(name)) img.classList.add('pulse');
    overlay.appendChild(img);
  });
}

function handleLock() {
  const allSlotsFilled = [...selectedSymbols.left, ...selectedSymbols.right].every(Boolean);
  if (!allSlotsFilled) {
    alert("Please select all 6 symbols first.");
    return;
  }

  const lockBtn = document.getElementById("lockButton");
  const glowActive = lockBtn.classList.toggle("glow-phase");

  if (!glowActive) {
    // Final lock-in phase, check and show map
    checkCombinations();
  } else {
    // Illumination mode – allow toggling
    document.querySelectorAll(".dial-slot").forEach(slot => {
      slot.onclick = () => {
        if (!slot.style.backgroundImage) return;
        slot.classList.toggle("active");
        slot.style.boxShadow = slot.classList.contains("active")
          ? "0 0 12px 6px yellow"
          : "none";
      };
    });
  }
}
