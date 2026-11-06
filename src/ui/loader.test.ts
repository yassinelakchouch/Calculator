import { describe, expect, test } from 'vitest';
import { dropStart, formation, landedAt, ORDER } from './loader';

describe('the loader, digits fall into place (board C-04)', () => {
  test('drops the digits in keypad order, 7 first and 0 last, 80 ms apart', () => {
    expect(ORDER.join('')).toBe('7894561230');
    expect([0, 1, 9].map(dropStart)).toEqual([0, 80, 720]);
  });

  test('every digit has landed within about 1.3 s', () => {
    expect(landedAt()).toBeLessThanOrEqual(1300);
  });

  test('the large keypad is the real one scaled about its centre and centred on the screen', () => {
    const keypad = { left: 500, top: 500, width: 300, height: 300 };
    const { scale, dx, dy } = formation(keypad, { width: 1440, height: 900 });
    expect(scale).toBeCloseTo(2.34, 2);
    expect(dx + (keypad.left + keypad.width / 2) * scale).toBeCloseTo(720);
    expect(dy + (keypad.top + keypad.height / 2) * scale).toBeCloseTo(450);
  });
});
