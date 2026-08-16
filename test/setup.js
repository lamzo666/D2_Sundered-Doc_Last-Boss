// Vitest's jsdom environment does not expose Web Storage, and the app reads
// localStorage on boot. Provide a minimal in-memory Storage so the real code
// runs unmodified. Guarded, so a future environment that ships the real thing
// is used instead.

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  const storage = {
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: (k) => { store.delete(String(k)); },
    clear: () => { store.clear(); },
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; }
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage, writable: true, configurable: true
  });
}

// Likewise matchMedia. Defaults to "no match", i.e. a desktop, mouse-driven,
// landscape viewport. Tests that need a touch device stub this themselves.
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: String(query),
    onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; }
  });
}
