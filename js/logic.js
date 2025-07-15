// logic.js

const symbols = [
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

const symbolPopup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");
const mapOverlay = document.getElementById("map-overlay");
const lockButton = document.getElementById("lockButton");
const truthLieLabel = document.getElementById("truthLieLabel");
let currentSlot = null;
let lockPhase = 0;

let remainingCombinations = [...truthCombinations, ...lieCombinations];
let selectedSymbols = {};

const symbolPositions = {
  stop: { top: "22.31%", left: "38.64%" },
  kill: { top: "70.14%", left: "65.96%" },
  darkness: { top: "39.91%", left: "80.93%" },
  drink: { top: "1.74%", left: "56.29%" },
  give: { top: "22.31%", left: "53.32%" },
  guardian: { top: "45.96%", left: "19.49%" },
  hive: { top: "29.77%", left: "19.53%" },
  light: { top: "59.68%", left: "72.98%" },
  pyramid: { top: "62.75%", left: "2.15%" },
  savathun: { top: "5.32%", left: "92.50%" },
  traveller: { top: "87.52%", left: "19.53%" },
  witness: { top: "30.20%", left: "2.00%" },
  worm: { top: "7.16%", left: "75.20%" },
  worship: { top: "70.42%", left: "31.45%" }
};

function toggleInstructions() {
  const box = document.getElementById("instructionsBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

document.querySelectorAll(".dial-slot").forEach(slot => {
  slot.addEventListener("click", () => {
    if (lockPhase !== 0) {
      slot.classList.toggle("active");
      slot.style.boxShadow = slot.classList.contains("active") ? "0 0 12px 6px yellow" : "none";
      return;
    }
    currentSlot = slot;
    showSymbolPopup();
  });
});

function showSymbolPopup() {
  const selected = Object.values(selectedSymbols);
  const isLeft = currentSlot.classList.contains("left1") || currentSlot.classList.contains("left2") || currentSlot.classList.contains("left3");
  const group = isLeft ? "left" : "right";

  const groupKeys = Object.keys(selectedSymbols).filter(k => k.includes(group));
  const groupSelected = groupKeys.map(k => selectedSymbols[k]);

  // Reduce combinations
  let filtered = remainingCombinations.filter(comb => groupSelected.every(s => comb.includes(s)));

  // Predictive filtering
  const nextOptions = [...new Set(filtered.flat().filter(s => !groupSelected.includes(s)))];

  // Auto complete if 1 combination
  if (filtered.length === 1 && groupSelected.length < 3) {
    const combo = filtered[0];
    const remaining = combo.filter(s => !groupSelected.includes(s));
    const remainingSlots = ["1", "2", "3"].map(n => `${group}${n}`).filter(id => !selectedSymbols[id]);
    remaining.forEach((sym, idx) => {
      const slot = document.querySelector(`.dial-slot.${remainingSlots[idx]}`);
      slot.style.backgroundImage = `url('./img/${sym}.png')`;
      selectedSymbols[remainingSlots[idx]] = sym;
    });
    checkShowLock();
    return;
  }

  popupGrid.innerHTML = "";
  (nextOptions.length ? nextOptions : symbols.filter(s => !selected.includes(s))).forEach(sym => {
    const div = document.createElement("div");
    div.className = "symbol-option";
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      currentSlot.style.backgroundImage = `url('./img/${sym}.png')`;
      selectedSymbols[currentSlot.dataset.position] = sym;
      currentSlot = null;
      symbolPopup.style.display = "none";
      checkShowLock();
    };
    popupGrid.appendChild(div);
  });

  symbolPopup.style.display = "block";
}

function checkShowLock() {
  if (Object.keys(selectedSymbols).length === 6) {
    document.getElementById("lockButton").style.display = "inline-block";
  }
}

function resetDial() {
  document.querySelectorAll(".dial-slot").forEach(slot => {
    slot.style.backgroundImage = "";
    slot.classList.remove("active", "locked");
    slot.style.boxShadow = "none";
  });
  mapOverlay.innerHTML = "";
  truthLieLabel.innerHTML = "";
  lockPhase = 0;
  selectedSymbols = {};
  remainingCombinations = [...truthCombinations, ...lieCombinations];
}

function handleLock() {
  if (lockPhase === 0) {
    lockPhase = 1;
    lockButton.classList.add("glow-phase");
  } else if (lockPhase === 1) {
    lockPhase = 2;
    lockButton.classList.remove("glow-phase");
    showMapResults();
  }
}

function showMapResults() {
  const left = ["left1", "left2", "left3"].map(k => selectedSymbols[k]).sort();
  const right = ["right1", "right2", "right3"].map(k => selectedSymbols[k]).sort();
  const leftIll = ["left1", "left2", "left3"].filter(k => document.querySelector(`.dial-slot.${k}`).classList.contains("active")).map(k => selectedSymbols[k]);
  const rightIll = ["right1", "right2", "right3"].filter(k => document.querySelector(`.dial-slot.${k}`).classList.contains("active")).map(k => selectedSymbols[k]);

  const isLeftTruth = truthCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(left));
  const isRightTruth = truthCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(right));
  const isLeftLie = lieCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(left));
  const isRightLie = lieCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(right));

  let truthSymbols = [], lieSymbols = [];

  if (isLeftTruth && isRightLie) {
    truthLieLabel.innerHTML = `<div style="text-align:center;color:#00ff00">TRUTH</div><div></div><div style="text-align:center;color:#ff4444">LIE</div>`;
    truthSymbols = left;
    lieSymbols = right;
  } else if (isRightTruth && isLeftLie) {
    truthLieLabel.innerHTML = `<div style="text-align:center;color:#ff4444">LIE</div><div></div><div style="text-align:center;color:#00ff00">TRUTH</div>`;
    truthSymbols = right;
    lieSymbols = left;
  } else {
    alert("Could not match either side to a valid truth/lie combo.");
    truthLieLabel.innerHTML = "";
    return;
  }

  const illuminated = [...leftIll, ...rightIll];
  const truthToVisit = truthSymbols.filter(s => illuminated.includes(s));
  const lieToVisit = [...left, ...right].filter(s => lieSymbols.includes(s) && !illuminated.includes(s));
  const symbolsToHighlight = [...truthToVisit, ...lieToVisit];

  mapOverlay.innerHTML = "";
  symbolsToHighlight.forEach(name => {
    const div = document.createElement("img");
    div.className = "symbol-overlay pulse";
    div.src = `./img/${name}.png`;
    div.style.top = symbolPositions[name].top;
    div.style.left = symbolPositions[name].left;
    mapOverlay.appendChild(div);
  });
}

window.addEventListener("click", (e) => {
  if (!symbolPopup.contains(e.target) && currentSlot && !e.target.classList.contains("dial-slot")) {
    symbolPopup.style.display = "none";
    currentSlot = null;
  }
});
