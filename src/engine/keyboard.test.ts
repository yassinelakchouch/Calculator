import { expect, test } from 'vitest';
import { keyFromKeyboard } from './keyboard';

test.each([
  ['7', '7'],
  ['.', '.'],
  [',', '.'],
  ['+', '+'],
  ['-', '−'],
  ['*', '×'],
  ['x', '×'],
  ['/', '÷'],
  ['^', 'x²'],
  ['Enter', '='],
  ['=', '='],
  ['Backspace', '⌫'],
  ['Escape', 'AC'],
  ['Delete', 'AC'],
])('%s presses %s', (key, expected) => expect(keyFromKeyboard(key)).toBe(expected));

test('other keys press nothing', () => {
  expect(keyFromKeyboard('a')).toBeNull();
  expect(keyFromKeyboard(' ')).toBeNull();
  expect(keyFromKeyboard('ArrowUp')).toBeNull();
});
