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

let currentSlot = null;

function getGroupCombo(group) {
  return selectedSymbols[group].filter(Boolean);
}

function getValidSymbols(group, index) {
  const allSelected = [...selectedSymbols.left, ...selectedSymbols.right].filter(Boolean);

  if (index === 0) {
    return baseSymbols.filter(sym => !allSelected.includes(sym));
  }

  const groupSelected = selectedSymbols[group].slice(0, index).filter(Boolean);
  const isLeftGroup = group === 'left';
  const otherGroup = isLeftGroup ? 'right' : 'left';

  const validCombos = [...truthCombinations, ...lieCombinations].filter(combo =>
    groupSelected.every(s => combo.includes(s)) &&
    combo.every(s => ![...selectedSymbols[group], ...selectedSymbols[otherGroup]].includes(s))
  );

  const possible = new Set();
  validCombos.forEach(combo => {
    combo.forEach(sym => {
      if (!groupSelected.includes(sym) && !allSelected.includes(sym)) {
        possible.add(sym);
      }
    });
  });

  return [...possible];
}

function showSymbolPopup(group, index, slot) {
  currentSlot = { group, index, slot };
  const popup = document.getElementById('symbolPopup');
  const grid = document.getElementById('popupGrid');
  grid.innerHTML = '';

  const validSymbols = getValidSymbols(group, index);
  validSymbols.forEach(sym => {
    const div = document.createElement('div');
    div.className = 'symbol-option';
    div.style.backgroundImage = `url('./img/${sym}.png')`;
    div.onclick = () => {
      selectedSymbols[group][index] = sym;
      slot.style.backgroundImage = `url('./img/${sym}.png')`;
      popup.style.display = 'none';
    };
    grid.appendChild(div);
  });

  popup.style.display = 'block';
}

function resetDial() {
  selectedSymbols = { left: [null, null, null], right: [null, null, null] };
  document.querySelectorAll('.dial-slot').forEach(slot => {
    slot.style.backgroundImage = '';
    slot.classList.remove('active');
    slot.style.boxShadow = 'none';
  });
  document.getElementById('map-overlay').innerHTML = '';
  document.getElementById('truthLieLabel').innerHTML = '';
  document.getElementById('lockButton').classList.remove('glow-phase');
}

function toggleInstructions() {
  const box = document.getElementById('instructionsBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const positions = ['left1', 'left2', 'left3', 'right1', 'right2', 'right3'];
  positions.forEach(pos => {
    const slot = document.querySelector(`.dial-slot.${pos}`);
    const [group, index] = pos.includes('left') ? ['left', parseInt(pos[4]) - 1] : ['right', parseInt(pos[5]) - 1];
    slot.onclick = () => {
      if (!slot.style.backgroundImage) {
        showSymbolPopup(group, index, slot);
      }
    };
  });
});
