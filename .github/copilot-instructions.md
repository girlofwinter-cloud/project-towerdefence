# Project TowerDefence

This is a browser tower-defense game implemented in plain JavaScript ES modules. It has no runtime dependencies or build step; the source is served directly and must remain compatible with Node 20+.

## Commands

- `npm start` - serve the game at `http://localhost:8080`.
- `npm test` - run all unit tests in `tests/*.test.js`.
- `node --test tests/game.test.js` - run one unit-test file; replace the path for another file.
- `node --test --test-name-pattern="Neues Spiel" tests/game.test.js` - run one matching unit test.
- `npm run test:e2e` - run Playwright browser tests in `tests/e2e/*.test.mjs`.
- `npm run test:all` - run unit tests, then browser tests.

There is no lint or build script. Browser tests need Playwright; CI installs it with `npm install --no-save playwright` and `npx playwright install --with-deps chromium`. Local browser tests also require a matching Chromium installation.

The test-mode URL is `http://localhost:8080/?test`. It exposes extra tools and keeps real saved progress untouched.

## Architecture

- `src/config.js` is the central source of truth for balancing and shared constants: map data, tower and enemy definitions, waves, speed limits, palettes, and UI constants. Do not duplicate balancing numbers in logic or rendering modules.
- `src/game.js` owns the mutable game state and simulation. `src/path.js` provides path geometry. Both are DOM-free and Canvas-free so Node can test them.
- `src/input.js` and `src/progress.js` are also pure logic modules. Progress storage is passed into them as a storage object rather than read directly from `window`.
- `src/main.js` wires the DOM, pointer and keyboard input, HUD, local-storage progress, icons, and the animation loop to the pure modules and renderer.
- `src/render.js` is the rendering entry point. It deliberately contains no state transitions or game rules. Its specialized drawing modules handle terrain, decor, towers, enemies, water, lava, effects, and UI icons.
- `src/hud.js` derives HUD view values from state. `src/test-page.js` and `src/test-tools.js` support test-mode controls.
- `index.html` is the static page structure and `style.css` contains the responsive layout and component styles.
- `scripts/serve.mjs` is a dependency-free static server used by `npm start` and browser tests.

The browser loop advances state with `stepGame()` and then calls `render()`. `main.js` may translate UI interactions into calls on `game.js`, but simulation decisions belong in `game.js` or a relevant pure helper module.

## Repository conventions

- Keep comments and visible UI text in German. Use English for identifiers and module/function names.
- Put pure Node-testable logic in `src/game.js`, `src/path.js`, `src/input.js`, or `src/progress.js`, not in DOM or Canvas modules.
- Rendering modules must only read/draw state and UI. Do not move simulation behavior into `render.js` or specialized `render-*` modules.
- For config-based behavior, extend `src/config.js` rather than introducing magic numbers in another module.
- Add or extend tests in `tests/` using the matching area: `game.test.js`, `input.test.js`, `progress.test.js`, `decor.test.js`, `render.test.js`, `fx.test.js`, or `test-tools.test.js`. Shared test helpers belong in `tests/helpers.js`.
- Existing tests must not be deleted or weakened. When balancing changes intentionally alter expected values, document the changes and update only the affected assertions.
- Browser tests use the Node test runner plus Playwright. Use `window.__game` and `window.__ui` from the browser console or `page.evaluate()` to inspect state.
- Working branches are named `agent/<kurzname>` and changes go through pull requests; do not push directly to `main`.
- New logic and balancing changes need explicit human approval when they are not already specified by the current backlog entry. New dependencies and changes to `.claude/`, `.github/`, `package.json`, or `CLAUDE.md` are not made without approval.
- Use the repository pipeline and risk guidance in `.claude/skills/pipeline/SKILL.md`: work runs in blocks of 3 to 4 backlog entries on one branch; logic, balancing, input, and layout changes are risky and get one tester and reviewer pass over the whole block. Record completed work in `docs/LEDGER.md` and keep the backlog and ledger rules from `CLAUDE.md`.
