import { describe, expect, test } from 'vitest';
import { GROW_MS, HOLD_MS, landing } from './loader';

describe('the loader, grows from its 0 (board C-04 v3)', () => {
  test('lands the big 0 on the display 0: right and bottom edges meet, heights match', () => {
    const from = { right: 820, bottom: 560, height: 220 };
    const to = { right: 700, bottom: 300, height: 56 };
    expect(landing(from, to)).toEqual({ dx: -120, dy: -260, scale: 56 / 220 });
  });

  test('holds the 0, then grows the calculator in, inside half a second', () => {
    expect(HOLD_MS).toBeGreaterThan(0);
    expect(HOLD_MS + GROW_MS).toBeLessThanOrEqual(700);
  });
});
