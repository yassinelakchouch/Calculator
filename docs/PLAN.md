# Calculator, replayed: the plan

The 2022 calculator (kept in `legacy/`) worked, but it ran `eval()`, its keys were 50 × 35 px ellipses, and phones scrolled sideways. This rebuild keeps it a small calculator and adds a reason to stay: XP for every result, and when it sits idle, its display turns into a one-button runner.

The design lives on the Design canvas, page "Other personal project": C-01 (study), C-02 (storyboard), C-03 (hi-fi and parts).

## Stack

| Part | Choice | Why |
| --- | --- | --- |
| Build | Vite 8, dev server on port 5180 | Fast dev, static output for GitHub Pages |
| Language | TypeScript 7, strict | The engine is pure functions; types catch a missed key |
| Styles | Tailwind CSS v4, `@theme` tokens in `src/style.css` | One CSS file, no config file |
| Maths | Own tokenizer and shunting-yard parser | No `eval()`; every rule is tested |
| Game | One `requestAnimationFrame` loop, SVG in the display | No canvas, no library, crisp at any size |
| Sound | Web Audio synthesis | No audio files; one switch mutes it |
| Storage | `localStorage` in `try`/`catch` | XP, best run, badges and sound stay on the device |
| Tests | Vitest (engine, rewards, runner, sound), Playwright in the installed Chrome (flows) | Logic proven before the page exists |
| CI | GitHub Actions: build, unit, end-to-end, audit | Every PR proves itself |

## Steps, one PR each into `dev`

1. **Setup:** the 2022 files move to `legacy/`; Vite, TypeScript, Tailwind, Vitest, Playwright and CI arrive.
2. **Engine:** key presses become an expression and a result, test first (cases below).
3. **Rewards, runner, sound:** pure modules with their tests.
4. **Page:** the card, keys with hover, press, focus and sound, the display's states, the runner, the tape and badges; end-to-end tests.
5. **Release:** the owner tests `dev`, then merges `dev` into `main`; GitHub Pages serves `main`.

## Cases a visitor can try (each one is a test)

| Try | Result |
| --- | --- |
| `0` `0` `7` | `7`: no leading zeros |
| `.` `5` | `0.5`; a second `.` in the same number is ignored |
| `0.1 + 0.2 =` | `0.3`, not `0.30000000000000004` (12 significant digits) |
| `1 ÷ 3 =` | `0.333333333333` |
| `2 + 3 × 4 =` | `14`: × and ÷ before + and − |
| `5 + × 2 =` | `10`: a second operator replaces the first |
| `5 × − 3 =` | `-15`: − after × or ÷ starts a negative number |
| `− 4 x² =` | `16`: the minus belongs to the number |
| `3 x² + 1 =` | `10` |
| `8 ÷ 0 =` | "Can't divide by zero. Your number is kept."; `⌫` removes the 0, a digit replaces it |
| `5 +` `=` | Nothing: an unfinished sum is not a result |
| `7 =` | Nothing: a lone number earns no XP |
| `7 × 8 =` then `=` | `56` stays; no second result, no second XP |
| `7 × 8 =` then `+ 2 =` | `58`: an operator continues from the result |
| `7 × 8 =` then `4` | `4`: a digit starts fresh |
| `7 × 8 =` then `⌫` | `5`: the result becomes the number you edit |
| `99999999 × 99999999 =` | `9.9999998e15`: big results switch to e-notation |
| `1e308`-sized results | "Too big to show. Your sum is kept." |
| 16th digit | Ignored: a number holds 15 digits |

## Game and reward rules

| Rule | Value |
| --- | --- |
| XP per result | +1; +2 with two or more operators; +3 with ÷ or x² |
| Combo | Results within 10 s of each other: ×2 up to ×5, multiplies the XP |
| Level | Every 100 XP |
| Badges | First result · Clean ten (10 results in a row without an error) · Big number (≥ 1 000 000) · Runner 100 |
| Runner | Starts after 15 s idle; Space, ↑ or a tap on the display jumps; any calculator key goes back to the sum and applies; Esc goes back with nothing typed |
| Speed | +5 % every 100 points; the loop pauses when the tab is hidden |

## Repo flow

Branch → PR into `dev` → CI green → merge. `dev` → `main` only after the owner has tried it. Small commits, one concern each.
