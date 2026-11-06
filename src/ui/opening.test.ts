import { describe, expect, test } from 'vitest';
import { OPENING_MS, openingFrames, RELEASE_AT, STEP_MS } from './opening';

describe('the opening, the keypad wakes up (board C-04)', () => {
  test('rolls the digits 1 to 9, then 0, one every 100 ms, ending on the 0 the calculator rests at', () => {
    const frames = openingFrames();
    expect(frames.map((f) => f.digit).join('')).toBe('1234567890');
    expect(frames.map((f) => f.at)).toEqual(frames.map((_, i) => i * STEP_MS));
    expect(frames.at(-1)!.digit).toBe('0');
  });

  test('releases the keys after the last digit and is over inside about 1.2 s', () => {
    expect(RELEASE_AT).toBeGreaterThan(openingFrames().at(-1)!.at);
    expect(OPENING_MS).toBeLessThanOrEqual(1200);
  });
});
