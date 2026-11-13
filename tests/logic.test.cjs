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
