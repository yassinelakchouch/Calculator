# Calculator, replayed · calc-project001

A small calculator that keeps score. Every result earns XP, results close together build a combo, and four badges wait to be found. Leave it alone for 15 seconds and the display turns into a one-button runner; press any calculator key and you are back in your sum, with that key applied.

It started as a 2022 side project, still working as it was at [`/legacy/`](https://yassinelakchouch.github.io/Calculator/legacy/) (linked from the header as "First version"), and was redrawn in 2026: keyboard first, honest errors, no `eval()`.

## Try

| Do | What happens |
| --- | --- |
| `7 × 8 =` | `56`, +1 XP |
| `0.1 + 0.2 =` | `0.3`, not `0.30000000000000004` |
| `8 ÷ 0 =` | "Can't divide by zero. Your number is kept." `⌫` takes the 0 back |
| Two results within 10 s | ×2 combo, up to ×5 |
| Wait 15 s | Unit appears; Space, ↑ or a tap on the screen jumps |
| Any key during the game | Back to the sum, key applied; Esc goes back with nothing typed |

Every case a visitor can try is listed, with its expected result, in [`docs/PLAN.md`](docs/PLAN.md), and each one is a test.

## Keyboard

`0–9` `.` `,` · `+` `-` `*` `x` `/` · `^` for x² · `Enter` or `=` · `Backspace` · `Esc` clears. In the game: Space or ↑ jumps.

## Stack

Vite 8 · TypeScript 7 (strict) · Tailwind CSS v4 (`@theme` tokens) · a shunting-yard parser · SVG and `requestAnimationFrame` for the runner · Web Audio for the clicks (each digit is a note of a pentatonic scale) · `localStorage` for XP, best run, badges and sound · Vitest and Playwright.

## Run

```sh
npm ci
npm run dev        # http://localhost:5180
npm test           # unit tests: engine, rewards, runner, sound
npm run test:e2e   # flows on desktop and phone, in the installed Chrome
npm run build
```

## Layout

```
src/engine   keys → expression → result (no eval), keyboard map
src/play     rewards, saved progress, the runner model, sounds
src/ui       sprites and the runner's scene
src/app.ts   wires keys, display, rewards, runner and sound together
e2e/         Playwright flows
public/legacy/  the 2022 version, served at /legacy/
```
