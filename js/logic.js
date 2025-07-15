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

let remainingLeft = [...truthCombinations, ...lieCombinations];
let remainingRight = [...truthCombinations, ...lieCombinations];
let selectedSymbols = {};
let truthGroup = null;
let lockPhase = 0;

const symbolPopup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");
const mapOverlay = document.getElementById("map-overlay");
const lockButton = document.getElementById("lockButton");
const truthLieLabel = document.getElementById("truthLieLabel");
let currentSlot = null;

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
  const otherGroup = isLeft ? "right" : "left";

  const groupKeys = Object.keys(selectedSymbols).filter(k => k.includes(group));
  const groupSelected = groupKeys.map(k => selectedSymbols[k]);

  const otherKeys = Object.keys(selectedSymbols).filter(k => k.includes(otherGroup));
  const otherSelected = otherKeys.map(k => selectedSymbols[k]);

  let pool = group === "left" ? remainingLeft : remainingRight;

  // If other group is confirmed truth/lie, only use opposite set and exclude shared symbols
  if (truthGroup === otherGroup) {
    const base = truthGroup === "left" ? lieCombinations : truthCombinations;
    pool = base.filter(comb => !comb.some(sym => otherSelected.includes(sym)));
  }

  // Filter combinations that match current groupSelected entries
  let filtered = pool.filter(comb => groupSelected.every(s => comb.includes(s)));

  // Determine valid next symbol options
  const alreadyUsed = new Set(selected);
  const validNext = new Set();
  filtered.forEach(combo => {
    combo.forEach(sym => {
      if (!groupSelected.includes(sym) && !alreadyUsed.has(sym)) {
        validNext.add(sym);
      }
    });
  });

  // If only one combo remains and group isn't full, autocomplete
  if (filtered.length === 1 && groupSelected.length < 3) {
    const combo = filtered[0];
    const remaining = combo.filter(s => !groupSelected.includes(s));
    const slots = ["1", "2", "3"].map(n => `${group}${n}`).filter(k => !selectedSymbols[k]);
    remaining.forEach((sym, i) => {
      const el = document.querySelector(`.dial-slot.${slots[i]}`);
      el.style.backgroundImage = `url('./img/${sym}.png')`;
      selectedSymbols[slots[i]] = sym;
    });
    if (group === "left") remainingLeft = filtered;
    else remainingRight = filtered;
    checkShowLock();
    return;
  }

  popupGrid.innerHTML = "";
  const optionsToShow = validNext.size ? Array.from(validNext) : symbols.filter(s => !alreadyUsed.has(s));
  optionsToShow.forEach(sym => {
    const div = document.createElement("div");
    div.className = "symbol-option";
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      currentSlot.style.backgroundImage = `url('./img/${sym}.png')`;
      selectedSymbols[currentSlot.dataset.position] = sym;
      if (group === "left") remainingLeft = filtered;
      else remainingRight = filtered;
      currentSlot = null;
      symbolPopup.style.display = "none";
      checkShowLock();
    };
    popupGrid.appendChild(div);
  });

  symbolPopup.style.display = "block";
}
