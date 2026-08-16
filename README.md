# Kerrev, The Erased — Dial Helper

Works out which symbols to illuminate for **Kerrev, The Erased**, the final
encounter of Destiny 2's *Sundered Doctrine* dungeon.

**→ [lamzo666.github.io/D2_Sundered-Doc_Last-Boss](https://lamzo666.github.io/D2_Sundered-Doc_Last-Boss/)**

Made by Lamzo. Map by Aequorde.

## How it works

1. **Enter the six symbols** you can see on the in-game dial. The picker only
   offers symbols that can still lead to a valid statement, and fills a slot in
   automatically when only one option is left. One side must read as a TRUTH and
   the other as a LIE, with no symbol repeated across the dial.
2. **Mark the ones that are lit** in-game, then press the lock.
3. **Read off the answer.** The callout bar names what to do, grouped by room,
   so it can be said out loud without anyone squinting at the map:

   ```
   LEFT ROOM      ILLUMINATE HIVE     DE-ILLUMINATE PYRAMID
   MIDDLE ROOM    ILLUMINATE KILL
   ```

   The map highlights the same symbols — **amber = illuminate**,
   **blue = de-illuminate**.

Press the lock again to clear your marks and re-select. Misread a symbol? Long-press
it (or right-click) to reopen that slot without losing the other five.

### On a phone

After locking, the app switches to a fullscreen landscape map with the callout bar
pinned to the top. It's installable to a home screen and **works with no
connection** once loaded — worth doing before you're stood in the dungeon on
hotel wifi.

State survives a reload or a screen-lock for 12 hours, so a dropped tab mid-encounter
doesn't cost you the six symbols you just typed in.

## Running it

```bash
npm install
npm run dev        # dev server; add --host to reach it from a phone
npm test           # 51 tests
npm run build      # emits to docs/
npm run preview    # serves the real build, with the service worker
```

Windows users can double-click **`start.bat`** (dev server, LAN-visible) or
**`preview.bat`** (production build). The service worker is deliberately disabled
in dev, so `preview` is the only way to test offline behaviour.

## Editing the data

Everything you'd want to change by hand lives in two files.

**[`src/map_logic.js`](src/map_logic.js)** — map pin coordinates, display names,
and which room each symbol belongs to:

```js
window.MAP_ROOMS = [
  { label: 'LEFT ROOM', symbols: ['witness', 'hive', ...] },
  ...
];
```

`label` is the wording used in the callout, and array order is row order. Any
symbol missing from the table still gets reported, under an `OTHER` row.

**[`src/combination_logic_module.js`](src/combination_logic_module.js)** — the
canonical statement tables, 12 TRUTH and 17 LIE.

> ⚠️ **The combo tables have not been verified against the encounter.** The test
> suite checks they're internally consistent — no duplicates, every symbol
> reachable, every truth pairable with a lie — but nothing here can confirm they
> match what Bungie shipped. If you correct them, `npm test` will tell you if the
> edit breaks an invariant.

After editing either file, run `npm run build` and commit `docs/` — it's the
deploy output and CI fails if it falls behind the source.

## Deploying

GitHub Pages serves `docs/` from `master`, so merging to `master` and pushing is
the deploy. CI runs the tests, rebuilds, and fails if `docs/` is stale.

Link-preview tags in `index.html` hard-code the Pages URL, because Open Graph
requires absolute URLs. Update them if the site ever moves.

## Layout

```
index.html                        markup, meta, favicons
src/logic.js                      UI, phases, persistence, map rendering
src/combination_logic_module.js   TRUTH/LIE tables + the constraint solver
src/map_logic.js                  pin coordinates, names, room groupings
src/css/styles.css                everything visual
test/                             vitest + jsdom
docs/                             build output, served by Pages
```
