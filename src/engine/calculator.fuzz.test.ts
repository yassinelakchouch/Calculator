// 20 000 seeded random key sequences, every key checked against the rules a reader relies on (found 5²² and a 20-character result).
import { expect, test } from 'vitest';
import { EMPTY, press, view, type Key, type Outcome } from './calculator';

const KEYS: Key[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '−', '×', '÷', 'x²', '=', '⌫', 'AC'];
const TROUBLE: Key[] = ['x²', '=', '⌫', '.', '−'];

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

const RULES: [string, (outcome: Outcome, before: Outcome['state'], shown: ReturnType<typeof view>) => boolean][] = [
  ['an ignored key changes nothing', (o, before) => o.event !== 'ignored' || o.state === before],
  ['no stacked squares (5²² reads as another power)', (_o, _b, s) => !/²²/.test(s.main + s.expression)],
  ['nothing reads NaN, Infinity or undefined', (_o, _b, s) => !/NaN|Infinity|undefined/.test(s.main + s.expression)],
  ['a result is a finite number', (o) => o.event !== 'result' || Number.isFinite(Number(o.state.result))],
  ['a result fits 16 characters', (o, _b, s) => o.event !== 'result' || s.main.length <= 16],
  ['what is typed fits 18 characters (sign, 15 digits, the dot, a square)', (_o, _b, s) => s.main.length <= 18],
  ['no finished number ends with a dot', (_o, _b, s) => !/\.\s/.test(s.expression)],
  ['the sum never starts with + × or ÷', (_o, _b, s) => !/^[+×÷]/.test(s.expression)],
];

test('random sequences keep every display rule', () => {
  const random = seeded(2026);
  const broken: string[] = [];
  for (let n = 0; n < 20_000 && broken.length === 0; n++) {
    let outcome: Outcome = { state: EMPTY, event: 'ignored' };
    const keys: Key[] = [];
    const length = 1 + Math.floor(random() * 24);
    for (let i = 0; i < length; i++) {
      const key = random() < 0.25 ? TROUBLE[Math.floor(random() * TROUBLE.length)] : KEYS[Math.floor(random() * KEYS.length)];
      keys.push(key);
      const before = outcome.state;
      outcome = press(before, key);
      const shown = view(outcome.state);
      for (const [rule, holds] of RULES) if (!holds(outcome, before, shown)) broken.push(`${rule}: ${keys.join(' ')} → ${shown.expression} | ${shown.main}`);
    }
  }
  expect(broken).toEqual([]);
});
