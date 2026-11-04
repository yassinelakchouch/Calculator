import type { Key } from './calculator';

const NAMED: Record<string, Key> = {
  ',': '.',
  '-': '−',
  '*': '×',
  x: '×',
  X: '×',
  '/': '÷',
  '^': 'x²',
  Enter: '=',
  Backspace: '⌫',
  Escape: 'AC',
  Delete: 'AC',
};

export function keyFromKeyboard(key: string): Key | null {
  if (/^[\d.+=]$/.test(key)) return key as Key;
  return NAMED[key] ?? null;
}
