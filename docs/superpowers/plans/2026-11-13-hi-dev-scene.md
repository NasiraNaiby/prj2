# hi-dev Animated Greeting Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone neon-cyberpunk static page on the Desktop where an animated developer types at a glowing PC under a large "hi." headline.

**Architecture:** Three static files (`index.html`, `styles.css`, `app.js`) plus dependency-free Node tests. HTML and CSS draw the workspace scene; CSS handles ambient motion; `app.js` owns the typing sequence, particle field, and reduced-motion behavior. No build step, no network requests, no external libraries.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (classic script, no modules), Node.js built-in test runner for logic/structure checks, Chrome headless for visual verification.

**Spec:** `docs/superpowers/specs/2026-11-13-hi-dev-scene-design.md`

## Global Constraints

- Project root: `C:\Users\user\Desktop\hi-dev`.
- Product files: `index.html`, `styles.css`, `app.js` only. Tests live in `tests\`.
- No frameworks, packages, build tools, external fonts, images, or network requests.
- Must work when opened directly from `file://`.
- Exact copy: `hi.` and `developer — building things one line at a time`.
- No emojis in page content.
- Support 375px through 1440px with no horizontal scrolling.
- Honor `prefers-reduced-motion: reduce`.
- Do not initialize git or commit; this folder is not a repository and the user did not request commits.
- ANSI/UTF-8 text must be written as UTF-8 (em dash in the tagline).

## Review Focus

- **Narrow viewport (320-375px):** scene and headline must stack, stay readable, and never overflow horizontally. Covered by Task 2 media queries and Task 5 screenshot.
- **Short viewport (e.g. 1440x600):** the tagline must not collide with the scene; the composition should scale down rather than clip. Covered by Task 2 `min-height`/clamp rules and Task 5 screenshot.
- **Reduced motion:** no looping or typing animation, full code visible, no drifting particles. Covered by Task 4 test assertions and screenshot with `--force-prefers-reduced-motion`.
- **Opened via `file://`:** no module imports, fetch calls, or absolute asset URLs. Covered by Task 1 structure test and Task 4 file-URL screenshot.
- **Repeated loop:** typing resets cleanly without stacked timers or duplicate lines. Covered by Task 4 single-loop guard and Task 5 observation.

---

### Task 1: Page shell and structure contract

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Test: `tests/structure.test.cjs`

**Interfaces:**
- Consumes: nothing.
- Produces: markup contract used by later tasks: `<h1 id="headline">`, `<p id="tagline">`, `<div id="scene" aria-hidden="true">`, `<div id="particles">`, `<div id="code-lines">`, `<div id="cursor">`; `styles.css` and `app.js` linked from `index.html`.

- [ ] **Step 1: Write the failing structure test**

Create `tests/structure.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("page shell exposes the greeting contract", () => {
  const html = read("index.html");
  assert.match(html, /<h1[^>]*id="headline"[^>]*>[\s\S]*?hi\.[\s\S]*?<\/h1>/i);
  assert.match(html, /developer — building things one line at a time/);
  assert.match(html, /id="tagline"/);
  assert.match(html, /id="scene"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*id="scene"/);
  assert.match(html, /id="particles"/);
  assert.match(html, /id="code-lines"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /<link[^>]*href="styles\.css"/);
  assert.match(html, /<script[^>]*src="app\.js"[^>]*defer/);
});

test("page makes no external requests", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//i);
  assert.doesNotMatch(html, /@import/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/structure.test.cjs`
Expected: FAIL because `index.html` does not exist.

- [ ] **Step 3: Create the minimal page shell**

Create `index.html` with UTF-8 charset, viewport meta, title `hi. — developer`, link to `styles.css`, `<main>`, `<h1 id="headline">hi.</h1>`, `<p id="tagline">developer — building things one line at a time</p>`, and `<div id="scene" aria-hidden="true">` containing `<div id="particles"></div>` and `<div id="code-lines"></div>`. End with `<script src="app.js" defer></script>`. Add a `<noscript>` line inside the scene reading `const dev = "hi.";`.

Create `styles.css` with a dark navy background, the tagline styled, and the headline using `clamp(4rem, 12vw, 10rem)`.

Create `app.js` with `"use strict";` and an empty IIFE placeholder.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/structure.test.cjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Smoke-load the page**

Run:
`& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --allow-file-access-from-files --dump-dom "file:///C:/Users/user/Desktop/hi-dev/index.html"`
Expected: output contains `id="headline"` and `hi.`; no error page.

---

### Task 2: Visual scene and responsive layout

**Files:**
- Modify: `index.html` (scene markup)
- Modify: `styles.css` (scene artwork, layout, mobile rules)
- Test: `tests/structure.test.cjs`

**Interfaces:**
- Consumes: IDs from Task 1.
- Produces: scene element classes for later animation: `.window`, `.city`, `.monitor`, `.screen-glow`, `.dev`, `.dev-head`, `.dev-arm`, `.desk`, `.keyboard`, `.key`, `.mug`, `.steam`, `.plant`, `.code-line`, `.char`, `.cursor`, `.particle`, `.code-glyph`.

- [ ] **Step 1: Add failing scene-structure assertions**

Append to `tests/structure.test.cjs`:

```js
test("scene contains the workspace illustration", () => {
  const html = read("index.html");
  for (const cls of ["window", "monitor", "screen-glow", "dev", "dev-head", "dev-arm", "desk", "keyboard", "key", "mug", "steam", "plant"]) {
    assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`), `missing .${cls}`);
  }
});

test("stylesheet defines mobile layout and fluid scene sizing", () => {
  const css = read("styles.css");
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.match(css, /clamp\(/);
  assert.match(css, /overflow-x:\s*hidden/i);
});
```

- [ ] **Step 2: Run the tests to verify the new assertions fail**

Run: `node --test tests/structure.test.cjs`
Expected: FAIL on missing scene classes and media query.

- [ ] **Step 3: Build the scene markup and styling**

In `index.html`, inside `#scene`, add in this order:

1. `.window` with `.city` and a few `.city-light` dots.
2. `.monitor` containing `.screen-glow`, a `.monitor-bar` with three dots, and the existing `#code-lines`; add a `.cursor` element after `#code-lines`.
3. `.dev` with `.dev-head`, `.dev-torso`, `.dev-arm`, and `.dev-hand`; use an inline SVG or CSS shapes for the silhouette.
4. `.desk` with `.keyboard` containing 3 rows of `.key` spans, `.mug` with `.steam` spans, `.plant`, and a small notebook.
5. A `.code-glyph` layer with 5-6 floating `</>`, `{ }`, and `const` labels.
6. Keep `#particles` as the last child.

In `styles.css`, use a CSS-variable palette: `--bg: #070b14`, `--panel: #0d1424`, `--cyan: #4ef2ff`, `--magenta: #ff4ecd`, `--amber: #ffd166`, `--ink: #dbe7ff`, `--muted: #8293b5`. Build the scene as a centered `min(1100px, 92vw)` stage with `min-height: 100svh`, grid or absolute composition, a faint background grid via `repeating-linear-gradient`, and `overflow-x: hidden` on `body`. Use a system sans-serif stack for the tagline and monospace for code. Use CSS-only shapes (borders, box-shadows, gradients, pseudo-elements) for the monitor, dev, desk, mug, plant, keyboard, and city. Do not use images.

Add `@media (max-width: 600px)`: stack headline/tagline above the scene, hide `.window`, `.code-glyph`, `.plant`, and reduce scene height and desk detail. Ensure the monitor text remains readable at 375px.

- [ ] **Step 4: Run the structure tests to verify they pass**

Run: `node --test tests/structure.test.cjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Capture and inspect static screenshots**

Run:
`& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --user-data-dir="$env:TEMP\hi-dev-chrome" --screenshot="C:\Users\user\Desktop\hi-dev\docs\desktop-1440.png" --window-size=1440,900 "file:///C:/Users/user/Desktop/hi-dev/index.html"`

Then:
`& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --user-data-dir="$env:TEMP\hi-dev-chrome" --screenshot="C:\Users\user\Desktop\hi-dev\docs\mobile-375.png" --window-size=375,812 "file:///C:/Users/user/Desktop/hi-dev/index.html"`

Open both PNGs and confirm: `hi.` and tagline are legible, the dev and monitor read as a person at a PC, nothing overlaps, and the mobile version has no horizontal overflow.

---

### Task 3: Pure animation logic

**Files:**
- Modify: `app.js`
- Test: `tests/logic.test.cjs`

**Interfaces:**
- Consumes: nothing from the DOM. Pure functions only.
- Produces (exported on `module.exports` for Node and `window.HiDev` for the browser):
  - `createTypingFrames(lines: string[], charDelay = 40): Array<{ lineIndex: number, text: string, atMs: number }>`
  - `getParticleCount(width: number): number` — `18` when `width > 900`, `12` when `width > 600`, otherwise `8`.
  - `createParticleSpecs(count: number, random = Math.random): Array<{ left: number, size: number, duration: number, delay: number, drift: number, opacity: number }>` with ranges: `left` 0-100, `size` 1-3, `duration` 8-20, `delay` 0-10, `drift` -30-30, `opacity` 0.2-0.7.

- [ ] **Step 1: Write the failing logic tests**

Create `tests/logic.test.cjs`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { createTypingFrames, getParticleCount, createParticleSpecs } = require("../app.js");

test("typing frames reveal one character at a time and keep a monotonic timeline", () => {
  const line = "const hi = 'hello';";
  const frames = createTypingFrames([line], 40);
  assert.equal(frames.length, line.length);
  assert.deepEqual(frames[0], { lineIndex: 0, text: "c", atMs: 0 });
  assert.deepEqual(frames.at(-1), { lineIndex: 0, text: line, atMs: (line.length - 1) * 40 });
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i].atMs > frames[i - 1].atMs);
});

test("typing resumes after the previous line at its own offset", () => {
  const frames = createTypingFrames(["ab", "cd"], 10);
  assert.deepEqual(frames.map((f) => `${f.lineIndex}:${f.text}:${f.atMs}`), [
    "0:a:0", "0:ab:10", "1:c:20", "1:cd:30",
  ]);
});

test("particle count scales with viewport width", () => {
  assert.equal(getParticleCount(1440), 18);
  assert.equal(getParticleCount(901), 18);
  assert.equal(getParticleCount(900), 12);
  assert.equal(getParticleCount(601), 12);
  assert.equal(getParticleCount(600), 8);
  assert.equal(getParticleCount(375), 8);
});

test("particle specs stay inside their documented ranges", () => {
  const specs = createParticleSpecs(40, () => 0.5);
  assert.equal(specs.length, 40);
  for (const p of specs) {
    assert.ok(p.left >= 0 && p.left <= 100);
    assert.ok(p.size >= 1 && p.size <= 3);
    assert.ok(p.duration >= 8 && p.duration <= 20);
    assert.ok(p.delay >= 0 && p.delay <= 10);
    assert.ok(p.drift >= -30 && p.drift <= 30);
    assert.ok(p.opacity >= 0.2 && p.opacity <= 0.7);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/logic.test.cjs`
Expected: FAIL because the exports do not exist.

- [ ] **Step 3: Implement the three pure functions in `app.js`**

Implement the exact signatures and ranges above. `createTypingFrames` walks each line character by character, pushing `{ lineIndex, text: line.slice(0, count), atMs }` and advancing `atMs` by `charDelay` after each character. `getParticleCount` uses the thresholds above. `createParticleSpecs` calls `random()` once per field and maps it into each range with linear interpolation.

Add:
```js
const api = { createTypingFrames, getParticleCount, createParticleSpecs };
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.HiDev = api;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/logic.test.cjs`
Expected: PASS, 4 tests.

---

### Task 4: Typing, particles, loop, and reduced motion

**Files:**
- Modify: `app.js` (DOM wiring)
- Modify: `index.html` (code lines fallback)
- Modify: `styles.css` (cursor, particle, reduced-motion rules)
- Test: `tests/structure.test.cjs`

**Interfaces:**
- Consumes: `createTypingFrames`, `getParticleCount`, `createParticleSpecs` from Task 3; scene classes from Task 2.
- Produces: a running animation with `initScene()` called once, and a single guarded loop. No new exports.

- [ ] **Step 1: Add failing reduced-motion and wiring assertions**

Append to `tests/structure.test.cjs`:

```js
test("animation layer honors reduced motion and file:// constraints", () => {
  const css = read("styles.css");
  const js = read("app.js");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(js, /matchMedia\(["']\(prefers-reduced-motion:\s*reduce\)["']\)/);
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /getParticleCount/);
  assert.doesNotMatch(js, /\bfetch\s*\(/);
  assert.doesNotMatch(js, /\bimport\s*\(/);
});
```

- [ ] **Step 2: Run the structure tests to verify the new assertion fails**

Run: `node --test tests/structure.test.cjs`
Expected: FAIL on the missing reduced-motion rule or `matchMedia`.

- [ ] **Step 3: Implement the DOM animation**

In `app.js`, define the exact code lines and token classes:

1. `const dev = { name: "you", stack: ["html", "css", "js"] };`
2. `function sayHi() {`
3. `  console.log("hi.");`
4. `}`
5. `sayHi();`

Render each line into `#code-lines` as `.code-line`, with every character wrapped in `<span class="char">` and token classes `kw` (const/function), `fn` (sayHi), `str` (quoted text), `prop` (name/stack), `punct` (braces, brackets, semicolons), and default for identifiers. Start every `.char` hidden except the first line's first character.

Use `createTypingFrames(lines, 38)` and a single `requestAnimationFrame` loop: track `start = performance.now()`, reveal chars whose frame `atMs` has passed, clear the previous active line, and move `.cursor` to the active line. When the plan ends, wait 1400ms, clear all chars, then restart the same loop; keep a module-level `started` flag so multiple calls cannot create parallel loops.

Replace the `.code-glyph` text and particle layer only from JS if needed; keep existing markup otherwise. Set each particle's `--x`, `--size`, `--dur`, `--delay`, `--drift`, and `--opacity` from `createParticleSpecs(getParticleCount(innerWidth))`; create at most once per page load.

If `matchMedia("(prefers-reduced-motion: reduce)").matches`, skip the typing loop and particle creation, add class `reduced` to `document.documentElement`, reveal every `.char`, and hide the cursor.

In `styles.css`, add: `.char { visibility: hidden; } .char.on { visibility: visible; }`, token colors using the palette, a blinking `.cursor` animation, `.particle` absolute positioning with a drift keyframe using the CSS variables, `.code-line.active .cursor` placement, and the ambient keyframes: scene/headline entrance fade-and-slide, monitor boot flicker, screen-glow pulse, dev head/shoulder bob, typing arm sway, staggered key glow, mug steam rise, code-glyph drift, and occasional neon title flicker. Stagger delays so the loop feels unsynchronized and runs roughly 10 seconds before restarting. Inside `@media (prefers-reduced-motion: reduce)` disable all animations/transitions, show `.char`, and hide `.cursor` and `.particle`.

- [ ] **Step 4: Run all tests to verify they pass**

Run: `node --test tests/`
Expected: PASS, 9 tests (5 structure + 4 logic).

- [ ] **Step 5: Capture animated and reduced-motion screenshots**

Run the 1440x900 and 375x812 commands from Task 2, then:
`& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --force-prefers-reduced-motion --user-data-dir="$env:TEMP\hi-dev-chrome" --screenshot="C:\Users\user\Desktop\hi-dev\docs\reduced-motion.png" --window-size=1440,900 "file:///C:/Users/user/Desktop/hi-dev/index.html"`

Inspect all three PNGs: code text visible and colored, cursor visible, dev/PC composition intact, reduced-motion version shows full code with no particles.

---

### Task 5: Final verification and handoff

**Files:**
- No product file changes expected; fix any issues found, then rerun affected steps.
- Screenshots: `docs\desktop-1440.png`, `docs\mobile-375.png`, `docs\reduced-motion.png`.

**Interfaces:**
- Consumes: everything above.
- Produces: verified, runnable page.

- [ ] **Step 1: Run the full test suite**

Run: `node --test tests/`
Expected: PASS with 0 failures.

- [ ] **Step 2: Verify offline/external-request constraint**

Run: `node --test tests/structure.test.cjs`
Expected: PASS, including the no-external-requests test.

- [ ] **Step 3: Check the three target widths plus a short viewport**

Capture screenshots at 1440x900, 1440x600, 768x1024, and 375x812 using the Chrome command from Task 2 (change `--window-size` and output name). Inspect each: headline/tagline readable, no horizontal overflow, scene centered, monitor text legible, and no collision between the tagline and scene on the 600px-tall view. Save as `docs\desktop-1440.png`, `docs\short-1440x600.png`, `docs\tablet-768.png`, and `docs\mobile-375.png`.

- [ ] **Step 4: Open the finished page for the user**

Run:
`Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" "file:///C:/Users/user/Desktop/hi-dev/index.html"`
Expected: Chrome opens the animated page. With DevTools open, the Console shows no uncaught errors and the Network tab shows only the three local files.

- [ ] **Step 5: Report**

State the project path, files created, test result, and any visual limitation. Do not claim success without the passing test output and inspected screenshots.
