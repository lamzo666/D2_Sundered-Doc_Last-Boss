// logic.js

const symbolOptions = [
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
  left: [],
  right: []
};

function equalArray(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function checkCombinations() {
  const truthLabel = document.getElementById('truthLieLabel');
  const overlay = document.getElementById('map-overlay');
  overlay.innerHTML = '';

  const left = [...selectedSymbols.left];
  const right = [...selectedSymbols.right];

  const isLeftTruth = truthCombinations.some(c => equalArray(c, left));
  const isRightTruth = truthCombinations.some(c => equalArray(c, right));
  const isLeftLie = lieCombinations.some(c => equalArray(c, left));
  const isRightLie = lieCombinations.some(c => equalArray(c, right));

  let truth = [], lie = [];

  if (isLeftTruth && isRightLie) {
    truth = left;
    lie = right;
    truthLabel.innerHTML = '<div style="text-align:center;color:#00ff00;">TRUTH</div><div></div><div style="text-align:center;color:#ff4444;">LIE</div>';
  } else if (isRightTruth && isLeftLie) {
    truth = right;
    lie = left;
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

  [...truth, ...lie].forEach(name => {
    const img = document.createElement('img');
    img.className = 'symbol-overlay';
    img.src = `./img/${name}.png`;

    const pos = symbolPositions[name];
    if (!pos) return;

    img.style.position = 'absolute';
    img.style.top = pos.top;
    img.style.left = pos.left;
    img.style.width = '5%';
    img.style.aspectRatio = '1 / 1';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '2';
    if (truth.includes(name)) img.classList.add('pulse');

    overlay.appendChild(img);
  });
}
