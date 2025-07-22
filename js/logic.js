// logic.js

const symbols = [
  "guardian", "hive", "kill", "light", "darkness",
  "drink", "give", "pyramid", "savathun", "stop",
  "traveller", "witness", "worm", "worship"
];

const truthCombinations = [
  ["pyramid","drink","worm"], ["pyramid","kill","worm"], ["pyramid","stop","savathun"], ["pyramid","give","darkness"],
  ["guardian","worship","light"], ["guardian","worship","traveller"], ["guardian","kill","witness"], ["traveller","give","guardian"],
  ["traveller","give","light"], ["hive","worship","darkness"], ["hive","worship","worm"], ["darkness","stop","savathun"]
];

const lieCombinations = [
  ["hive","kill","worm"], ["hive","kill","light"], ["hive","give","darkness"], ["hive","stop","witness"],
  ["traveller","kill","guardian"], ["traveller","drink","worm"], ["traveller","give","hive"], ["traveller","stop","witness"],
  ["pyramid","stop","witness"], ["witness","drink","light"], ["witness","kill","pyramid"], ["guardian","worship","witness"],
  ["guardian","kill","traveller"], ["savathun","drink","darkness"], ["savathun","stop","darkness"], ["light","stop","savathun"]
];

function getCombinationGroup(combination) {
  if (truthCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(combination.sort()))) return 'truth';
  if (lieCombinations.some(c => JSON.stringify(c.sort()) === JSON.stringify(combination.sort()))) return 'lie';
  return null;
}

function lockInSymbols() {
  const slots = document.querySelectorAll('.dial-slot');
  const left = ["left1","left2","left3"];
  const right = ["right1","right2","right3"];

  const getSymbol = id => {
    const el = document.querySelector(`.dial-slot.${id}`);
    const match = el.style.backgroundImage.match(/\/([^\/]+)\.png/);
    return match ? match[1].replace('.png','') : null;
  };

  const getIlluminated = ids => ids.filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active')).map(getSymbol);

  const leftSymbols = left.map(getSymbol);
  const rightSymbols = right.map(getSymbol);
  const leftIlluminated = getIlluminated(left);
  const rightIlluminated = getIlluminated(right);

  const sortedLeft = [...leftSymbols].sort();
  const sortedRight = [...rightSymbols].sort();

  const leftGroup = getCombinationGroup(sortedLeft);
  const rightGroup = getCombinationGroup(sortedRight);

  const label = document.getElementById('truthLieLabel');
  label.textContent = '';

  let truthSymbols = [], lieSymbols = [], allIlluminated = [...leftIlluminated, ...rightIlluminated];

  if (leftGroup === 'truth' && rightGroup === 'lie') {
    label.innerHTML = '<div style="text-align: center; color: #00ff00;">TRUTH</div><div></div><div style="text-align: center; color: #ff4444;">LIE</div>';
    truthSymbols = leftSymbols;
    lieSymbols = rightSymbols;
  } else if (rightGroup === 'truth' && leftGroup === 'lie') {
    label.innerHTML = '<div style="text-align: center; color: #ff4444;">LIE</div><div></div><div style="text-align: center; color: #00ff00;">TRUTH</div>';
    truthSymbols = rightSymbols;
    lieSymbols = leftSymbols;
  } else {
    alert('Invalid truth/lie combination.');
    return;
  }

  const truthToVisit = truthSymbols.filter(sym => allIlluminated.includes(sym));
  const lieToVisit = lieSymbols.filter(sym => !allIlluminated.includes(sym));

  showMapHighlights(truthToVisit, lieToVisit, allIlluminated);
}

window.lockInSymbols = lockInSymbols;
