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

test("animation layer honors reduced motion and file:// constraints", () => {
  const css = read("styles.css");
  const js = read("app.js");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.char\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.char\.on\s*\{[^}]*visibility:\s*visible/);
  assert.match(js, /matchMedia\(["']\(prefers-reduced-motion:\s*reduce\)["']\)/);
  assert.match(js, /requestAnimationFrame/);
  assert.match(js, /getParticleCount/);
  assert.doesNotMatch(js, /\bfetch\s*\(/);
  assert.doesNotMatch(js, /\bimport\s*\(/);
});


