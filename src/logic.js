import {
  getValidSymbols,
  validateGroup,
  lockGroup,
  clearLock
} from './combination_logic_module.js';
import './map_logic.js';

window.addEventListener('DOMContentLoaded', () => {
  /* ---------- TRUTH/LIE label size tracks dial width ---------- */
  const sizeTruthLieFromDial = () => {
    const dial = document.querySelector('.dial');
    if (!dial) return;
    const dialWidth = dial.getBoundingClientRect().width;
    const coef = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--truthlie-coef')
    ) || 0.065;                      // fraction of dial width
    const px = Math.max(10, Math.round(dialWidth * coef)) + 'px';
    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    if (L) L.style.setProperty('font-size', px, 'important');
    if (R) R.style.setProperty('font-size', px, 'important');
  };
  requestAnimationFrame(sizeTruthLieFromDial);
  window.addEventListener('resize', sizeTruthLieFromDial);

  /* ---------- MAP COORD NORMALIZER (top-left → center) ---------- */
  const PIN_SIZE_PCT = 5; // visual center math; keep ≈ the pin width in %
  function normalizePos(p) {
    if (!p) return { x: 50, y: 50 };
    if ('x' in p && 'y' in p) return { x: +p.x, y: +p.y };
    const left = parseFloat(p.left);
    const top  = parseFloat(p.top);
    const half = PIN_SIZE_PCT / 2;
    return { x: left + half, y: top + half };
  }

  /* ---------- iOS animation bootstrap helpers ---------- */
  function restartMapPulsesNow() {
    const pins = document.querySelectorAll('.symbol-overlay');
    pins.forEach(el => el.classList.remove('pulse'));
    void document.body.offsetWidth;
    pins.forEach(el => el.classList.add('pulse'));
  }
  const queueRestartPulses = () =>
    requestAnimationFrame(() => requestAnimationFrame(restartMapPulsesNow));

  /* ---------- UI refs ---------- */
  const slots = document.querySelectorAll('.dial-slot');
  const symbolPopup = document.getElementById('symbolPopup');
  const popupGrid = document.getElementById('popupGrid');
  const lockButton = document.getElementById('lockButton');
  const resetButton = document.querySelector('.btn-reset');
  const tooltip = document.getElementById('tooltip');
  const tooltipCheckbox = document.getElementById('tooltipCheckbox');
  const symbolNamesCheckbox = document.getElementById('symbolNamesCheckbox');
  const routeSummary = document.getElementById('route-summary');

  let phase = 'entry';
  let allowedGlowSlots = [];
  let truthGroup = [];
  let lieGroup = [];

  /* ---------- session restore ----------
     A dropped tab or a phone screen-lock shouldn't cost you six symbols
     mid-encounter. Expires so you don't come back to a stale dial days later. */
  const STATE_KEY = 'dialState';
  const STATE_TTL_MS = 12 * 60 * 60 * 1000;
  let restoring = false;

  function saveState() {
    if (restoring) return;
    const symbols = [...slots].map(s => s.dataset.symbol || '');
    try {
      if (!symbols.some(Boolean)) { localStorage.removeItem(STATE_KEY); return; }
      localStorage.setItem(STATE_KEY, JSON.stringify({
        t: Date.now(),
        phase,
        symbols,
        glow: [...slots].map(s => s.classList.contains('glow'))
      }));
    } catch (_) { /* private mode / quota — not worth failing over */ }
  }

  /* ---------- first-visit defaults ---------- */
  if (localStorage.getItem('firstVisitDone') !== 'true') {
    localStorage.setItem('tooltipVisible', 'true');
    localStorage.setItem('showSymbolNames', 'true');
    localStorage.setItem('firstVisitDone', 'true');
  }

  /* ---------- tooltip toggle ---------- */
  const tooltipOn = (localStorage.getItem('tooltipVisible') ?? 'true') === 'true';
  tooltipCheckbox.checked = tooltipOn;
  tooltip.classList.toggle('hidden', !tooltipOn);
  tooltipCheckbox.addEventListener('change', () => {
    const show = tooltipCheckbox.checked;
    tooltip.classList.toggle('hidden', !show);
    localStorage.setItem('tooltipVisible', show ? 'true' : 'false');
  });
  const tell = (msg) => { if (tooltip) tooltip.textContent = msg; };
  const tellHTML = (html) => { if (tooltip) tooltip.innerHTML = html; };

  /* ---------- symbol-name toggle ---------- */
  const showNames = (localStorage.getItem('showSymbolNames') ?? 'true') === 'true';
  symbolNamesCheckbox.checked = showNames;
  function applyNamesVisibility(show) {
    document.querySelectorAll('.dial-slot .symbol-name, .map-label, .symbol-option .opt-name').forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }
  applyNamesVisibility(showNames);
  symbolNamesCheckbox.addEventListener('change', () => {
    const on = symbolNamesCheckbox.checked;
    localStorage.setItem('showSymbolNames', on ? 'true' : 'false');
    applyNamesVisibility(on);
  });

  /* ---------- helpers ---------- */
  const sideSlots = (side) => [1,2,3].map(i => document.querySelector(`.dial-slot.${side}${i}`));
  const trio = (side) => sideSlots(side).map(s => s?.dataset.symbol || null);
  const bothComplete = () => trio('left').every(Boolean) && trio('right').every(Boolean);

  function updateSlotLabel(slot) {
    const name = (slot.dataset.symbol || '').toUpperCase();
    let label = slot.querySelector('.symbol-name');
    if (!label) {
      label = document.createElement('div');
      label.className = 'symbol-name';
      slot.appendChild(label);
    }
    label.textContent = name;
    label.style.display = symbolNamesCheckbox.checked ? 'block' : 'none';
  }

  const pickSymbol = (slot, symbol) => {
    slot.dataset.symbol = symbol || '';
    slot.style.backgroundImage = symbol ? `url('img/${symbol}.png')` : '';
    updateSlotLabel(slot);
    saveState();
  };

  function getOptionsForSelected(selectedArr, side, index) {
    const raw = [...new Set(getValidSymbols(selectedArr, side, index))];
    const taken = new Set(selectedArr.filter(Boolean));
    return raw.filter(sym => !taken.has(sym));
  }
  function optionsTreatingSlotEmpty(side, index) {
    const arr = trio(side);
    arr[index] = null;
    return getOptionsForSelected(arr, side, index);
  }
  function optionsNormal(side, index) {
    const arr = trio(side);
    return getOptionsForSelected(arr, side, index);
  }

  const maybePrelock = () => {
    if (phase !== 'entry') return;
    const L = trio('left'), R = trio('right');
    const Lc = L.every(Boolean), Rc = R.every(Boolean);
    if (Lc && !Rc) {
      const t = validateGroup(L);
      if (t) { lockGroup('left', t); setLabel('left', t); tell('Now complete the opposite side.'); }
    } else if (Rc && !Lc) {
      const t = validateGroup(R);
      if (t) { lockGroup('right', t); setLabel('right', t); tell('Now complete the opposite side.'); }
    }
  };

  function setLabel(which, type) {
    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    const apply = (el, t) => {
      if (!el) return;
      el.textContent = t ? t.toUpperCase() : '';
      el.className = t === 'truth' ? 'truth-label' : (t === 'lie' ? 'lie-label' : '');
    };
    if (which === 'left') { apply(L, type); if (R) apply(R, ''); }
    else { apply(R, type); if (L) apply(L, ''); }
    sizeTruthLieFromDial();
  }

  const cascadeAutofill = () => {
    if (phase !== 'entry') return;
    let changed = true;
    while (changed) {
      changed = false;
      ['left','right'].forEach(side => {
        sideSlots(side).forEach((slot, i) => {
          if (!slot || slot.dataset.symbol) return;
          const options = optionsNormal(side, i);
          if (options.length === 1) {
            pickSymbol(slot, options[0]);
            changed = true;
            maybePrelock();
          }
        });
      });
    }
    checkProgress();
  };

  /* ----------------- MAP HIGHLIGHTS ------------------ */
  const MAP_COORDS = window.MAP_COORDS || {};
  const SYMBOL_NAME_MAP = window.SYMBOL_NAME_MAP || {};

  window.showMapHighlights = (truthToVisit, lieToVisit, staticNames = true) => {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    const chosen = [
      ...truthToVisit.map(s => ({ sym: s, type: 'truth' })),
      ...lieToVisit.map(s => ({ sym: s, type: 'lie' })),
    ];

    chosen.forEach(({ sym, type }) => {
      const raw = MAP_COORDS[sym];
      if (!raw) return;
      const pos = normalizePos(raw);

      const wrap = document.createElement('div');
      wrap.className = `symbol-wrap ${type}`;
      wrap.style.left = `${pos.x}%`;
      wrap.style.top  = `${pos.y}%`;
      wrap.style.transform = 'translate(-50%, -50%)';

      const img = document.createElement('img');
      img.className = 'symbol-overlay pulse';
      img.src = `img/${sym}.png`;
      img.alt = sym;
      wrap.appendChild(img);

      const nearBottom = pos.y >= 88;
      wrap.classList.add(nearBottom ? 'label-above' : 'label-below');

      const label = document.createElement('div');
      label.className = 'map-label';
      label.textContent = staticNames ? (SYMBOL_NAME_MAP[sym] || sym.toUpperCase()) : '';
      wrap.appendChild(label);

      overlay.appendChild(wrap);
    });

    applyNamesVisibility(symbolNamesCheckbox.checked);
    queueRestartPulses();
  };

  /* ------------------ MAP-ONLY MODE (mobile after Lock) ------------------ */
  const rotatePrompt = document.createElement('div');
  rotatePrompt.className = 'rotate-prompt';
  rotatePrompt.textContent = 'Rotate device to view the map';
  // Placed right after the callout bar rather than on the body, so in portrait
  // it flows underneath the answer instead of floating over the page.
  if (routeSummary && routeSummary.parentNode) {
    routeSummary.parentNode.insertBefore(rotatePrompt, routeSummary.nextSibling);
  } else {
    document.body.appendChild(rotatePrompt);
  }
  const showRotatePrompt = (show) => rotatePrompt.classList.toggle('show', !!show);

  /* A rotation is worth easing; the iOS URL bar sliding is not, because it
     fires continuously and any transition leaves the map trailing behind the
     viewport. Each refit picks its own mode. */
  function setMapAnimation(enabled) {
    [document.querySelector('.map-img'), document.getElementById('map-overlay')]
      .forEach(el => el && el.classList.toggle('no-anim', !enabled));
  }

  function fitMapToViewport() {
    const container = document.querySelector('.map-container');
    const img = document.querySelector('.map-img');
    const overlay = document.getElementById('map-overlay');
    if (!container || !img || !overlay) return;

    const vv = window.visualViewport;
    const vw = vv ? vv.width  : window.innerWidth;
    const vh = vv ? vv.height : window.innerHeight;
    const ox = vv ? vv.offsetLeft : 0;
    const oy = vv ? vv.offsetTop  : 0;

    const ratio = (img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight
      : (1920 / 1080);

    let w = vw, h = w / ratio;
    if (h > vh) { h = vh; w = h * ratio; }

    const left = ox + (vw - w) / 2;
    const top  = oy + (vh - h) / 2;

    Object.assign(img.style,     { width:`${w}px`, height:`${h}px`, left:`${left}px`, top:`${top}px` });
    Object.assign(overlay.style, { width:`${w}px`, height:`${h}px`, left:`${left}px`, top:`${top}px` });

    queueRestartPulses();
  }

  async function tryLockLandscape() {
    try {
      if (document.documentElement.requestFullscreen &&
          !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch(_) { /* iOS ignores — fine */ }
  }

  // Must match the gate on every `body.map-only` rule in styles.css.
  const isTouchDevice = () =>
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  async function enterMapOnlyIfMobile() {
    if (!isTouchDevice()) return;             // desktop unchanged
    document.body.classList.add('map-only');

    // The first fit places the map; easing it would make it fly in from
    // wherever it happened to be sitting in the page.
    setMapAnimation(false);
    const img = document.querySelector('.map-img');
    if (img && !img.complete) {
      img.addEventListener('load', fitMapToViewport, { once: true });
    } else {
      fitMapToViewport();
    }
    requestAnimationFrame(() => setMapAnimation(true));

    await tryLockLandscape();

    // Portrait → show prompt centered; Landscape → hide prompt
    showRotatePrompt(window.matchMedia('(orientation: portrait)').matches);

    // Kick pulses after any orientation/FS change settles
    queueRestartPulses();
  }

  function exitMapOnly() {
    document.body.classList.remove('map-only');
    showRotatePrompt(false);

    // Drop the inline px sizing fitMapToViewport() wrote, or the map stays
    // pinned to a fixed size and the overlay stays offset from the image.
    // Unanimated: these fall back to `auto`/`100%`, which cannot tween anyway.
    setMapAnimation(false);
    [document.querySelector('.map-img'), document.getElementById('map-overlay')]
      .forEach(el => {
        if (!el) return;
        ['width','height','left','top'].forEach(p => el.style.removeProperty(p));
      });

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(()=>{});
    }
  }

  const refitIfMapOnly = (animate) => {
    if (!document.body.classList.contains('map-only')) return;
    setMapAnimation(!!animate);
    fitMapToViewport();
    queueRestartPulses();
  };
  const refitSmooth  = () => refitIfMapOnly(true);   // deliberate: a rotation
  const refitInstant = () => refitIfMapOnly(false);  // incidental: URL bar, load

  window.addEventListener('resize', refitSmooth);
  window.addEventListener('orientationchange', () => {
    refitSmooth();
    if (document.body.classList.contains('map-only')) {
      showRotatePrompt(window.matchMedia('(orientation: portrait)').matches);
    }
  });
  window.addEventListener('load', refitInstant);
  if (window.visualViewport) {
    const vv = window.visualViewport;
    // These fire continuously while the iOS URL bar slides; easing them would
    // leave the map trailing the viewport edge.
    vv.addEventListener('resize', refitInstant);
    vv.addEventListener('scroll', refitInstant);
  }

  /* ----------------- PHASES ----------------- */
  const nameOf = (sym) => SYMBOL_NAME_MAP[sym] || sym.toUpperCase();

  // Room table lives with the rest of the map data, in map_logic.js.
  const ROOMS = window.MAP_ROOMS || [];
  const ROOMED = new Set(ROOMS.flatMap(r => r.symbols));

  function renderRouteSummary(illuminate, deIlluminate) {
    if (!routeSummary) return;

    const group = (cls, action, list) => list.length
      ? `<span class="route-act ${cls}"><span class="route-action">${action}</span>` +
        `<span class="route-syms">${list.map(nameOf).join(' &middot; ')}</span></span>`
      : '';
    const roomRow = (label, ill, dei) =>
      (ill.length || dei.length)
        ? `<div class="route-room"><span class="room-name">${label}</span>` +
          '<span class="room-actions">' +
          group('do-illuminate', 'ILLUMINATE', ill) +
          group('do-deilluminate', 'DE-ILLUMINATE', dei) +
          '</span></div>'
        : '';

    let rows = ROOMS
      .map(r => roomRow(r.label,
        illuminate.filter(s => r.symbols.includes(s)),
        deIlluminate.filter(s => r.symbols.includes(s))))
      .join('');

    // Never silently drop a symbol that has no room assigned.
    rows += roomRow('OTHER',
      illuminate.filter(s => !ROOMED.has(s)),
      deIlluminate.filter(s => !ROOMED.has(s)));

    routeSummary.innerHTML = rows ||
      '<div class="route-room"><span class="room-name do-nothing">NOTHING TO CHANGE</span>' +
      '<span class="room-actions"><span class="route-syms">the dial is already correct</span>' +
      '</span></div>';
    routeSummary.hidden = false;
  }

  function clearRouteSummary() {
    if (!routeSummary) return;
    routeSummary.innerHTML = '';
    routeSummary.hidden = true;
  }

  const ILLUMINATION_GUIDE =
    'Now select the symbols that are illuminated in-game, then tap the lock.<br>' +
    'Misread one? Long-press it, or ' +
    '<button type="button" class="link-btn" data-action="edit-dial">edit the dial</button>.';

  // Open padlock = not locked yet; closed padlock = locked, tap to undo.
  function setLockAffordance() {
    const locked = phase === 'final';
    const label = locked ? 'Unlock and clear your selections' : 'Lock in your selections';
    lockButton.classList.toggle('is-locked', locked);
    lockButton.setAttribute('aria-pressed', locked ? 'true' : 'false');
    lockButton.setAttribute('aria-label', label);
    lockButton.title = label;
  }

  function enterIllumination(leftType, rightType) {
    phase = 'illumination';
    lockButton.classList.add('glow-phase');
    symbolPopup.style.display = 'none';
    tellHTML(ILLUMINATION_GUIDE);

    const L = document.getElementById('label-left');
    const R = document.getElementById('label-right');
    if (L && R) {
      L.textContent = leftType.toUpperCase();
      R.textContent = rightType.toUpperCase();
      L.className = leftType === 'truth' ? 'truth-label' : 'lie-label';
      R.className = rightType === 'truth' ? 'truth-label' : 'lie-label';
      sizeTruthLieFromDial();
    }

    const left = trio('left');
    const right = trio('right');
    truthGroup = (leftType === 'truth') ? left : right;
    lieGroup   = (leftType === 'truth') ? right : left;

    allowedGlowSlots = [];
    [...truthGroup, ...lieGroup].forEach(sym => {
      const slot = [...slots].find(s => s.dataset.symbol === sym);
      if (slot) allowedGlowSlots.push(slot);
    });

    clearRouteSummary();
    setLockAffordance();
    saveState();
  }

  // Escape hatch: back to symbol entry without losing the six you already typed.
  function returnToEntry() {
    if (phase !== 'illumination') return;
    phase = 'entry';
    lockButton.classList.remove('glow-phase');
    [...slots].forEach(s => s.classList.remove('glow'));
    allowedGlowSlots = [];
    truthGroup = [];
    lieGroup = [];
    clearRouteSummary();
    setLockAffordance();
    tell('Tap any symbol on the dial to change it.');
    saveState();
  }

  // Delegated: the guide's innerHTML is rewritten on every phase change.
  if (tooltip) {
    tooltip.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="edit-dial"]')) returnToEntry();
    });
  }

  // Tapping the lock again undoes it: wipes every illumination mark and the
  // answer, and hands the dial straight back for another go.
  function unlockDial() {
    if (phase !== 'final') return;
    phase = 'illumination';
    [...slots].forEach(s => s.classList.remove('glow'));
    clearRouteSummary();
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.innerHTML = '';
    exitMapOnly();
    lockButton.classList.add('glow-phase');
    tellHTML(ILLUMINATION_GUIDE);
    setLockAffordance();
    sizeTruthLieFromDial();
    saveState();
  }

  function handleLock() {
    if (phase === 'final') { unlockDial(); return; }
    if (phase !== 'illumination') return;
    const glowing = [...document.querySelectorAll('.dial-slot.glow')].map(s => s.dataset.symbol);
    // Truth symbols that ARE lit need putting out; lie symbols that AREN'T lit need lighting.
    const deIlluminate = truthGroup.filter(sym => glowing.includes(sym));
    const illuminate   = lieGroup.filter(sym => !glowing.includes(sym));
    lockButton.classList.remove('glow-phase');
    phase = 'final';

    renderRouteSummary(illuminate, deIlluminate);

    if (tooltip) {
      tooltip.innerHTML = `
        <p>Move to the symbol(s) on the map and align the lens.</p>
        <p>Colours match the list above. <strong>Amber glow = ILLUMINATE</strong>, <strong>violet glow = DE-ILLUMINATE</strong>.</p>
        <p>Tap the lock again to clear your marks and re-select, or Reset to start over.</p>
      `;
    }

    window.showMapHighlights(deIlluminate, illuminate);
    setLockAffordance();

    // → switch to map-only on mobile. Presentation only: if fullscreen or the
    // orientation lock misbehaves, the answer above must still stand.
    enterMapOnlyIfMobile().catch(err => console.warn('map-only mode failed:', err));
    saveState();
  }

  function resetUI() {
    document.querySelectorAll('.dial-slot').forEach(s => {
      s.dataset.symbol = '';
      s.style.backgroundImage = '';
      s.classList.remove('glow');
      const label = s.querySelector('.symbol-name');
      if (label) label.textContent = '';
    });
    document.getElementById('label-left').textContent = '';
    document.getElementById('label-right').textContent = '';
    lockButton.classList.remove('glow-phase');
    symbolPopup.style.display = 'none';
    phase = 'entry';
    allowedGlowSlots = [];
    truthGroup = [];
    lieGroup = [];
    clearLock();
    clearRouteSummary();
    setLockAffordance();
    tell('Enter the symbols you see in-game');
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.innerHTML = '';
    applyNamesVisibility(symbolNamesCheckbox.checked);
    exitMapOnly();
    sizeTruthLieFromDial();
    saveState();
  }

  window.handleLock = handleLock;
  window.resetDial = resetUI;
  lockButton.addEventListener('click', handleLock);
  resetButton.addEventListener('click', resetUI);

  // Both sides complete AND a valid opposite-type, non-overlapping pair? → {Lt, Rt}
  function dialTypes() {
    if (!bothComplete()) return null;
    const L = trio('left');
    const R = trio('right');
    const Lt = validateGroup(L);
    const Rt = validateGroup(R);
    const disjoint = !L.some(s => R.includes(s));
    const validPair =
      disjoint &&
      ((Lt === 'truth' && Rt === 'lie') || (Lt === 'lie' && Rt === 'truth'));
    return validPair ? { Lt, Rt } : null;
  }

  function checkProgress() {
    if (!bothComplete()) return;
    const types = dialTypes();
    if (types) {
      enterIllumination(types.Lt, types.Rt);
    } else {
      tell('Both sides must be opposite types with no duplicate symbols across the dial.');
    }
  }

  /* ----- slot interaction ----- */
  function slotPosition(slot) {
    const cls = Array.from(slot.classList);
    const l = cls.find(c => /^left[123]$/.test(c));
    if (l) return { side: 'left', idx: +l.replace('left', '') - 1 };
    const r = cls.find(c => /^right[123]$/.test(c));
    if (r) return { side: 'right', idx: +r.replace('right', '') - 1 };
    return null;
  }

  function openPickerFor(slot) {
    const pos = slotPosition(slot);
    if (!pos) return;
    const { side, idx } = pos;

    const hadSymbol = !!slot.dataset.symbol;

    let options = hadSymbol ? optionsTreatingSlotEmpty(side, idx)
                            : optionsNormal(side, idx);

    if (hadSymbol && options.length === 0) {
      options = [slot.dataset.symbol];
    }

    popupGrid.innerHTML = '';

      if (hadSymbol) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'symbol-option clear-option';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
          pickSymbol(slot, '');
          symbolPopup.style.display = 'none';
          setLabel('left', '');            // blanks both sides
          tell('Enter the symbols you see in-game');
          // Re-lock the side that is still complete, otherwise the opposite
          // side reopens to both pools and offers same-type symbols.
          clearLock();
          maybePrelock();
          sizeTruthLieFromDial();
          checkProgress();
        });
        popupGrid.appendChild(clearBtn);
      }

      if (options.length === 0) {
        const div = document.createElement('div');
        div.className = 'popup-empty';
        div.textContent = 'No valid symbols';
        popupGrid.appendChild(div);
      } else {
        options.forEach(symbol => {
          const opt = document.createElement('button');
          opt.type = 'button';
          opt.className = 'symbol-option';
          opt.setAttribute('aria-label', nameOf(symbol));

          const img = document.createElement('img');
          img.src = `img/${symbol}.png`;
          img.alt = '';
          opt.appendChild(img);

          const nm = document.createElement('span');
          nm.className = 'opt-name';
          nm.textContent = nameOf(symbol);
          opt.appendChild(nm);

          opt.addEventListener('click', () => {
            pickSymbol(slot, symbol);
            symbolPopup.style.display = 'none';
            maybePrelock();
            checkProgress();
            cascadeAutofill();
          });
          popupGrid.appendChild(opt);
        });
      }
    applyNamesVisibility(symbolNamesCheckbox.checked);
    symbolPopup.style.display = 'block';
  }

  /* Long-press (or right-click) a slot during the illumination step to fix a
     misread symbol. The guide carries the same escape hatch as a link, but the
     guide can be switched off — this one always works. */
  const LONG_PRESS_MS = 550;
  const MOVE_CANCEL_PX = 10;
  let pressTimer = null;
  let pressOrigin = null;
  let suppressClick = false;

  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    pressOrigin = null;
  };

  function editFromIllumination(slot) {
    if (phase !== 'illumination' || !slot.dataset.symbol) return false;
    returnToEntry();
    openPickerFor(slot);
    return true;
  }

  [...slots].forEach(slot => {
    slot.addEventListener('click', () => {
      // Swallow the click that trails a completed long-press.
      if (suppressClick) { suppressClick = false; return; }
      if (phase === 'final') return;
      if (!slotPosition(slot)) return;

      if (phase === 'illumination') {
        if (allowedGlowSlots.includes(slot)) { slot.classList.toggle('glow'); saveState(); }
        return;
      }
      openPickerFor(slot);
    });

    slot.addEventListener('pointerdown', (e) => {
      suppressClick = false;
      if (phase !== 'illumination' || !slot.dataset.symbol) return;
      pressOrigin = { x: e.clientX, y: e.clientY };
      pressTimer = setTimeout(() => {
        cancelPress();
        suppressClick = true;
        editFromIllumination(slot);
      }, LONG_PRESS_MS);
    });

    slot.addEventListener('pointermove', (e) => {
      if (!pressOrigin) return;
      const dx = e.clientX - pressOrigin.x;
      const dy = e.clientY - pressOrigin.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancelPress();   // a scroll, not a press
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
      slot.addEventListener(type, cancelPress));

    slot.addEventListener('contextmenu', (e) => {
      if (editFromIllumination(slot)) e.preventDefault();
    });
  });

  document.addEventListener('click', e => {
    if (!symbolPopup.contains(e.target) && ![...slots].includes(e.target)) {
      symbolPopup.style.display = 'none';
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && symbolPopup.style.display === 'block') {
      symbolPopup.style.display = 'none';
    }
  });

  /* ---------- restore a dial left over from a reload / screen-lock ---------- */
  function restoreState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); } catch (_) { return; }
    if (!saved || !Array.isArray(saved.symbols) || !saved.symbols.some(Boolean)) return;
    if (!saved.t || Date.now() - saved.t > STATE_TTL_MS) {
      try { localStorage.removeItem(STATE_KEY); } catch (_) {}
      return;
    }

    restoring = true;
    [...slots].forEach((slot, i) => {
      const sym = saved.symbols[i] || '';
      if (!sym) return;
      pickSymbol(slot, sym);
      if (saved.glow?.[i]) slot.classList.add('glow');
    });
    maybePrelock();

    // A saved 'final' comes back as 'illumination' — re-entering fullscreen needs
    // a user gesture, so one tap of Lock replays the answer.
    if (saved.phase === 'illumination' || saved.phase === 'final') {
      const types = dialTypes();
      if (types) enterIllumination(types.Lt, types.Rt);
    }
    restoring = false;
    setLockAffordance();

    tell(phase === 'illumination'
      ? 'Restored your last dial — mark the illuminated symbols, or tap Reset to start over.'
      : 'Restored your last dial — tap Reset to start over.');
  }
  setLockAffordance();
  restoreState();
});
