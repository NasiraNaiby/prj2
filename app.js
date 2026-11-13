"use strict";

function createTypingFrames(lines, charDelay = 40) {
  const frames = [];
  let atMs = 0;

  lines.forEach((line, lineIndex) => {
    for (let count = 1; count <= line.length; count++) {
      frames.push({ lineIndex, text: line.slice(0, count), atMs });
      atMs += charDelay;
    }
  });

  return frames;
}

function getParticleCount(width) {
  if (width > 900) return 18;
  if (width > 600) return 12;
  return 8;
}

function lerp(min, max, ratio) {
  return min + (max - min) * ratio;
}

function createParticleSpecs(count, random = Math.random) {
  return Array.from({ length: count }, () => ({
    left: lerp(0, 100, random()),
    size: lerp(1, 3, random()),
    duration: lerp(8, 20, random()),
    delay: lerp(0, 10, random()),
    drift: lerp(-30, 30, random()),
    opacity: lerp(0.2, 0.7, random()),
  }));
}

const CODE_TOKENS = [
  [
    { text: "const ", cls: "kw" },
    { text: "dev" },
    { text: " = " },
    { text: "{ " },
    { text: "name", cls: "prop" },
    { text: ": " },
    { text: '"you"', cls: "str" },
    { text: ", " },
    { text: "stack", cls: "prop" },
    { text: ": [" },
    { text: '"html"', cls: "str" },
    { text: ", " },
    { text: '"css"', cls: "str" },
    { text: ", " },
    { text: '"js"', cls: "str" },
    { text: "] };" },
  ],
  [
    { text: "function ", cls: "kw" },
    { text: "sayHi", cls: "fn" },
    { text: "() {" },
  ],
  [
    { text: "  console." },
    { text: "log", cls: "fn" },
    { text: "(" },
    { text: '"hi."', cls: "str" },
    { text: ");" },
  ],
  [{ text: "}" }],
  [
    { text: "sayHi", cls: "fn" },
    { text: "();" },
  ],
];

const CODE_LINES = CODE_TOKENS.map((tokens) => tokens.map((token) => token.text).join(""));

let started = false;

function buildCodeLines(container) {
  container.textContent = "";

  return CODE_TOKENS.map((tokens, index) => {
    const line = document.createElement("div");
    line.className = "code-line";
    line.dataset.line = String(index);

    tokens.forEach((token) => {
      for (const char of token.text) {
        const span = document.createElement("span");
        span.className = token.cls ? `char ${token.cls}` : "char";
        span.textContent = char;
        line.append(span);
      }
    });

    container.append(line);
    return line;
  });
}

function revealAll(lines) {
  lines.forEach((line) => {
    line.querySelectorAll(".char").forEach((char) => char.classList.add("on"));
  });
}

function createParticles() {
  const layer = document.getElementById("particles");
  if (!layer) return;

  createParticleSpecs(getParticleCount(window.innerWidth)).forEach((spec) => {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.setProperty("--x", `${spec.left.toFixed(1)}%`);
    particle.style.setProperty("--size", `${spec.size.toFixed(1)}px`);
    particle.style.setProperty("--dur", `${spec.duration.toFixed(1)}s`);
    particle.style.setProperty("--delay", `${(-spec.delay).toFixed(1)}s`);
    particle.style.setProperty("--drift", `${spec.drift.toFixed(1)}px`);
    particle.style.setProperty("--opacity", spec.opacity.toFixed(2));
    layer.append(particle);
  });
}

function startTyping(cursor, lines) {
  const frames = createTypingFrames(CODE_LINES, 38);
  const linePause = 170;
  const restartPause = 1400;
  const lastFrame = frames[frames.length - 1];
  const total = lastFrame.atMs + (CODE_LINES.length - 1) * linePause;

  let frameIndex = 0;
  let activeLine = -1;
  let start = performance.now();

  const placeCursor = (line, count) => {
    const chars = line.querySelectorAll(".char");
    line.insertBefore(cursor, chars[count] ?? null);
  };

  const applyFrame = (frame) => {
    const line = lines[frame.lineIndex];

    if (frame.lineIndex !== activeLine) {
      if (activeLine >= 0) lines[activeLine].classList.remove("active");
      line.classList.add("active");
      activeLine = frame.lineIndex;
    }

    const chars = line.querySelectorAll(".char");
    for (let i = 0; i < frame.text.length; i++) chars[i].classList.add("on");
    placeCursor(line, frame.text.length);
  };

  const reset = () => {
    lines.forEach((line) => {
      line.classList.remove("active");
      line.querySelectorAll(".char").forEach((char) => char.classList.remove("on"));
    });
    activeLine = 0;
    lines[0].classList.add("active");
    placeCursor(lines[0], 0);
  };

  const tick = (now) => {
    const elapsed = now - start;

    while (frameIndex < frames.length) {
      const frame = frames[frameIndex];
      const frameAt = frame.atMs + frame.lineIndex * linePause;
      if (frameAt > elapsed) break;
      applyFrame(frame);
      frameIndex++;
    }

    if (elapsed > total + restartPause) {
      reset();
      frameIndex = 0;
      start = now;
    }

    requestAnimationFrame(tick);
  };

  reset();
  requestAnimationFrame(tick);
}

function initScene() {
  if (started) return;
  started = true;

  const container = document.getElementById("code-lines");
  const cursor = document.getElementById("cursor");
  if (!container || !cursor) return;

  const lines = buildCodeLines(container);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    document.documentElement.classList.add("reduced");
    revealAll(lines);
    cursor.hidden = true;
    return;
  }

  createParticles();
  startTyping(cursor, lines);
}

const api = { createTypingFrames, getParticleCount, createParticleSpecs };

if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.HiDev = api;

(function () {
  if (typeof document === "undefined") return;
  initScene();
})();
