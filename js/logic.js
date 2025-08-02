// logic.js (updated to use combination_logic_module)

import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  getAllowedCombinations
} from './combination_logic_module.js';

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

const popup = document.getElementById("symbolPopup");
const popupGrid = document.getElementById("popupGrid");
const symbolList = [
  "worship", "witness", "light", "guardian", "worm", "traveller", "savathun",
  "stop", "darkness", "hive", "drink", "pyramid", "kill", "give"
];

let activeSlot = null;

function getSymbolsFromSlots(group) {
  const ids = [`${group}1`, `${group}2`, `${group}3`];
  return ids.map(id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    return el?.dataset.symbol || null;
  });
}

function updateTruthLieLabel() {
  const left = getSymbolsFromSlots('left').sort();
  const right = getSymbolsFromSlots('right').sort();

  const isLeftTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(left));
  const isLeftLie = !isLeftTruth && left.every(Boolean);
  const isRightTruth = truthCombinations.some(c => JSON.stringify([...c].sort()) === JSON.stringify(right));
  const isRightLie = !isRightTruth && right.every(Boolean);

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

function openSymbolPopup(slot) {
  if (slot.classList.contains('locked')) return;
  activeSlot = slot;
  const side = slot.classList.contains('left') ? 'left' : 'right';
  const selected = getSymbolsFromSlots(side);
  const validOptions = getValidSymbols(selected, side);

  popupGrid.innerHTML = '';

  symbolList.forEach(sym => {
    const div = document.createElement("div");
    div.className = "symbol-option";
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    if (!validOptions.includes(sym)) {
      div.style.opacity = '0.2';
      div.style.pointerEvents = 'none';
    } else {
      div.onclick = () => {
        slot.style.backgroundImage = `url('./img/${sym}.png')`;
        slot.dataset.symbol = sym;

        const group = side;
        const current = getSymbolsFromSlots(group);

        if (current.every(Boolean)) {
          const result = validateGroup(current);
          if (result) {
            lockGroup(group, result);
            lockSlots(group);
            updateTruthLieLabel();
          }
        }

        popup.style.display = "none";
      };
    }
    popupGrid.appendChild(div);
  });

  popup.style.display = "block";
}

function lockSlots(side) {
  ['1','2','3'].forEach(n => {
    const slot = document.querySelector(`.dial-slot.${side}${n}`);
    slot.classList.add('locked');
    slot.style.cursor = 'not-allowed';
  });
}

window.addEventListener("click", (e) => {
  if (!popup.contains(e.target) && e.target !== activeSlot) {
    popup.style.display = "none";
  }
});

function bindDialClickHandlers() {
  const dialSlots = document.querySelectorAll('.dial-slot');
  dialSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      openSymbolPopup(slot);
    });
  });
}

window.addEventListener('DOMContentLoaded', bindDialClickHandlers);
