// src/map_logic.js
// Data only. Pin building lives in logic.js (window.showMapHighlights);
// label placement lives in styles.css (.symbol-wrap:has(> img[src$="..."])).
//
// TOP/LEFT percentages use a top-left anchor for map.jpg; logic.js converts
// them to centre coords via normalizePos().
window.MAP_COORDS = {
  stop:      { top: '22.31%', left: '38.64%' },
  kill:      { top: '70.14%', left: '65.96%' },
  darkness:  { top: '39.91%', left: '80.93%' },
  drink:     { top: '1.74%',  left: '56.29%' },
  give:      { top: '22.31%', left: '53.32%' },
  guardian:  { top: '45.96%', left: '19.49%' },
  hive:      { top: '29.77%', left: '19.53%' },
  light:     { top: '59.68%', left: '72.98%' },
  pyramid:   { top: '62.75%', left: '2.15%'  },
  savathun:  { top: '5.32%',  left: '92.50%' },
  traveller: { top: '87.52%', left: '19.53%' },
  witness:   { top: '30.20%', left: '2.00%'  },
  worm:      { top: '7.16%',  left: '75.20%' },
  worship:   { top: '70.42%', left: '31.45%' }
};

// Which room each symbol lives in, for the callout bar above the map.
// `label` is the wording used in the shout-out; array order is row order.
// Every symbol in MAP_COORDS should appear exactly once — anything missing
// still gets reported, but lands under a generic "OTHER" row.
window.MAP_ROOMS = [
  { label: 'LEFT ROOM',    symbols: ['witness','hive','guardian','pyramid','traveller'] },
  { label: 'MIDDLE ROOM',  symbols: ['worship','kill','drink'] },
  { label: 'MIDDLE BELOW', symbols: ['stop','give'] },
  { label: 'RIGHT ROOM',   symbols: ['worm','savathun','darkness','light'] }
];

// Shown names
window.SYMBOL_NAME_MAP = {
  stop:'STOP', kill:'KILL', darkness:'DARKNESS', drink:'DRINK', give:'GIVE',
  guardian:'GUARDIAN', hive:'HIVE', light:'LIGHT', pyramid:'PYRAMID',
  savathun:'SAVATHUN', traveller:'TRAVELLER', witness:'WITNESS',
  worm:'WORM', worship:'WORSHIP'
};
