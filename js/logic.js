document.addEventListener('DOMContentLoaded', () => {
  const slots = document.querySelectorAll('.dial-slot');
  const popup = document.getElementById('symbolPopup');
  const popupGrid = document.getElementById('popupGrid');
  const lockButton = document.getElementById('lockButton');
  const label = document.getElementById('truthLieLabel');
  const overlay = document.getElementById('map-overlay');
  const instructionsBox = document.getElementById('instructionsBox');

  let currentSlot = null;
  let lockPhase = 0;
  const symbols = [
    'guardian', 'hive', 'kill', 'light', 'darkness',
    'drink', 'give', 'pyramid', 'savathun', 'stop',
    'traveller', 'witness', 'worm', 'worship'
  ];

  const truthCombos = [
    ['pyramid','drink','worm'], ['pyramid','kill','worm'], ['pyramid','stop','savathun'], ['pyramid','give','darkness'],
    ['guardian','worship','light'], ['guardian','worship','traveller'], ['guardian','kill','witness'], ['traveller','give','guardian'],
    ['traveller','give','light'], ['hive','worship','darkness'], ['hive','worship','worm'], ['darkness','stop','savathun']
  ];

  const lieCombos = [
    ['hive','kill','worm'], ['hive','kill','light'], ['hive','give','darkness'], ['hive','stop','witness'],
    ['traveller','kill','guardian'], ['traveller','drink','worm'], ['traveller','give','hive'], ['traveller','stop','witness'],
    ['pyramid','stop','witness'], ['witness','drink','light'], ['witness','kill','pyramid'], ['guardian','worship','witness'],
    ['guardian','kill','traveller'], ['savathun','drink','darkness'], ['savathun','stop','darkness'], ['light','stop','savathun']
  ];

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

  function pulseMapSymbols(symbolsToHighlight) {
    overlay.innerHTML = '';
    Object.entries(symbolPositions).forEach(([name, pos]) => {
      if (symbolsToHighlight.includes(name)) {
        const div = document.createElement('img');
        div.className = 'symbol-overlay pulse';
        div.src = `./img/${name}.png`;
        div.style.top = pos.top;
        div.style.left = pos.left;
        overlay.appendChild(div);
      }
    });
  }

  function getSymbols(group) {
    const positions = group === 'left' ? ['left1','left2','left3'] : ['right1','right2','right3'];
    return positions.map(pos => {
      const el = document.querySelector(`.dial-slot.${pos}`);
      const match = el.style.backgroundImage.match(/\/([^\/]+)\.png/);
      return match ? match[1] : null;
    });
  }

  function handleLock() {
    if (lockPhase === 0) {
      lockPhase = 1;
      lockButton.classList.add('glow-phase');
    } else {
      const left = getSymbols('left').sort();
      const right = getSymbols('right').sort();

      const leftLit = ['left1','left2','left3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'));
      const rightLit = ['right1','right2','right3'].filter(id => document.querySelector(`.dial-slot.${id}`).classList.contains('active'));

      const getNames = ids => ids.map(id => {
        const match = document.querySelector(`.dial-slot.${id}`).style.backgroundImage.match(/\/([^\/]+)\.png/);
        return match ? match[1] : null;
      });

      const leftNames = getNames(['left1','left2','left3']);
      const rightNames = getNames(['right1','right2','right3']);
      const leftIllum = getNames(leftLit);
      const rightIllum = getNames(rightLit);

      const isLeftTruth = truthCombos.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
      const isRightTruth = truthCombos.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));
      const isLeftLie = lieCombos.some(t => JSON.stringify(t.sort()) === JSON.stringify(left));
      const isRightLie = lieCombos.some(t => JSON.stringify(t.sort()) === JSON.stringify(right));

      let truth = [], lie = [], labelHTML = '';

      if (isLeftTruth && isRightLie) {
        labelHTML = '<div style="text-align: center; color: #00ff00;">TRUTH</div><div></div><div style="text-align: center; color: #ff4444;">LIE</div>';
        truth = leftNames; lie = rightNames;
      } else if (isRightTruth && isLeftLie) {
        labelHTML = '<div style="text-align: center; color: #ff4444;">LIE</div><div></div><div style="text-align: center; color: #00ff00;">TRUTH</div>';
        truth = rightNames; lie = leftNames;
      } else {
        alert('No valid truth/lie combo.');
        label.innerHTML = '';
        return;
      }

      const allLit = [...leftIllum, ...rightIllum];
      const truthHighlight = truth.filter(sym => allLit.includes(sym));
      const lieHighlight = [...leftNames, ...rightNames].filter(sym => lie.includes(sym) && !allLit.includes(sym));

      label.innerHTML = labelHTML;
      pulseMapSymbols([...truthHighlight, ...lieHighlight]);
      lockButton.classList.remove('glow-phase');
      lockPhase = 0;
    }
  }

  function resetDial() {
    slots.forEach(slot => {
      slot.style.backgroundImage = '';
      slot.classList.remove('active');
      slot.style.boxShadow = 'none';
    });
    label.innerHTML = '';
    overlay.innerHTML = '';
    popup.style.display = 'none';
    lockButton.classList.remove('glow-phase');
    lockPhase = 0;
  }

  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      if (lockPhase === 0 && !slot.style.backgroundImage) {
        currentSlot = slot;
        const used = [...document.querySelectorAll('.dial-slot')]
          .map(s => s.style.backgroundImage.match(/\/([^\/]+)\.png/))
          .filter(Boolean)
          .map(m => m[1]);

        popupGrid.innerHTML = '';
        symbols.filter(sym => !used.includes(sym)).forEach(sym => {
          const opt = document.createElement('div');
          opt.className = 'symbol-option';
          opt.style.backgroundImage = `url('./img/${sym}.png')`;
          opt.dataset.name = sym;
          opt.onclick = () => {
            currentSlot.style.backgroundImage = `url('./img/${sym}.png')`;
            popup.style.display = 'none';
          };
          popupGrid.appendChild(opt);
        });
        popup.style.display = 'block';
      } else if (lockPhase === 1 && slot.style.backgroundImage) {
        slot.classList.toggle('active');
        slot.style.boxShadow = slot.classList.contains('active')
          ? '0 0 12px 6px yellow'
          : 'none';
      }
    });
  });

  window.toggleInstructions = () => {
    instructionsBox.style.display = instructionsBox.style.display === 'none' ? 'block' : 'none';
  };

  window.handleLock = handleLock;
  window.resetDial = resetDial;
});
