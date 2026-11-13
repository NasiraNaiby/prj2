# hi-dev — Animated Developer Greeting Page

Date: 2026-11-13
Status: Approved

## Purpose

A standalone static web page that greets visitors with an animated neon
workspace scene: a developer at a PC writing code, saying "hi." It is a
personal greeting/showcase page with no backend and no build step.

## Success criteria

- Opening `index.html` from the local filesystem shows the full animated scene.
- The page says "hi." prominently with the tagline
  "developer — building things one line at a time".
- The scene animates continuously without user interaction and loops cleanly.
- The layout looks intentional from 375px wide through desktop widths.
- No console errors, no network requests, no external dependencies.
- Users who prefer reduced motion get a complete static version.

## Non-goals

- No user input, forms, navigation, audio, or backend.
- No frameworks, package manager, bundler, or build tooling.
- No personal data, links, or portfolio sections beyond the greeting.

## Chosen approach

Pure HTML, CSS, and vanilla JavaScript in three files. The illustration is
built from semantic HTML plus CSS shapes and inline SVG, animated with CSS
keyframes and a small JS controller for the typing sequence and particle
field. This keeps the artwork crisp at every size, accessible, and easy to
edit without tooling.

## File structure

```
Desktop\hi-dev\
  index.html
  styles.css
  app.js
  docs\superpowers\specs\2026-11-13-hi-dev-scene-design.md
```

## Visual design

- Night-time neon workspace. Deep navy/black background with a magenta/cyan
  glow palette and a warm monitor spill light.
- Developer silhouette seated at a desk in three-quarter side view, with
  rim light on the hair, shoulder, and arm. Subtle idle motion only.
- Desk items: glowing monitor showing a code editor, keyboard, mug with
  steam, small plant, notebooks.
- Background: window with soft city glow, faint grid, floating code glyphs
  and dust particles.
- Typography: oversized neon `hi.` headline, smaller muted tagline below.
  System font stack plus monospace for code content.
- Composition: headline layered beside/above the scene; on narrow screens
  the headline stacks above the scene and secondary props are hidden.

## Animation behavior

A single looping timeline, roughly 10 seconds, staggered so the scene never
feels synchronized:

1. On load, headline and scene fade/slide in.
2. Monitor boots with a brief flicker, then code types line by line with
   token colors and blinking cursor.
3. Developer's head, shoulders, and typing arm move subtly; keys glow in
   sequence.
4. Steam rises from the mug; particles and code glyphs drift.
5. Neon signs flicker occasionally; the loop restarts without a visible jump.

All animation is decorative and driven by CSS where possible. JS only builds
the typing lines/particles and restarts the typing cycle.

## Responsive behavior

- Fluid units and a clamped headline size.
- Desktop: full scene with background props.
- Tablet: slightly reduced scene scale.
- Mobile (≤ 600px): headline stacked above the scene, window/particles/city
  details reduced or hidden, monitor and developer remain legible.
- No horizontal scrolling at any width.

## Accessibility

- `<h1>` for "hi." and a real paragraph for the tagline.
- Illustration wrapper `aria-hidden="true"`; decorative layers never
  announced.
- Text contrast meets WCAG AA against the background.
- `prefers-reduced-motion: reduce`: disable looping animations and typing
  effect; show final scene and full code lines statically.
- No keyboard interaction required; page is read-only.

## Performance

- CSS transforms/opacity for motion; avoid layout-thrashing properties.
- Particle count capped (about 18) and reduced on small screens.
- No images or fonts fetched; SVG and CSS only.
- Script runs after DOM parse; no console errors.

## Verification

- Open `index.html` in a Chromium browser and confirm the scene, text, and
  looping animation; check DevTools console is clean.
- Resize to 375px, 768px, and 1440px and confirm no overflow and readable
  composition.
- Enable "reduce motion" (DevTools emulation) and confirm the static version.
- Confirm no network requests beyond the local files.
