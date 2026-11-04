import { describe, expect, test } from 'vitest';
import { levelOf, onError, onResult, onRun, START, xpFor } from './rewards';

const sum = (operators = 1, hard = false, value = 56) => ({ operators, hard, value });

describe('XP per result', () => {
  test('+1 for one operator', () => expect(xpFor(sum())).toBe(1));
  test('+2 for two or more', () => expect(xpFor(sum(2))).toBe(2));
  test('+3 with ÷ or x²', () => expect(xpFor(sum(1, true))).toBe(3));
});

describe('combo', () => {
  test('a first result is ×1', () => expect(onResult(START, sum(), 0)).toMatchObject({ combo: 1, gained: 1 }));
  test('another within 10 s multiplies the XP', () => {
    const first = onResult(START, sum(), 0).progress;
    expect(onResult(first, sum(2), 9_000)).toMatchObject({ combo: 2, gained: 4 });
  });
  test('it stops at ×5', () => {
    let progress = START;
    for (let i = 0; i < 7; i += 1) progress = onResult(progress, sum(), i * 1000).progress;
    expect(progress.combo).toBe(5);
  });
  test('more than 10 s apart starts again at ×1', () => {
    const first = onResult(START, sum(), 0).progress;
    expect(onResult(first, sum(), 10_001).combo).toBe(1);
  });
  test('an error resets it quietly and takes no XP away', () => {
    const first = onResult(onResult(START, sum(), 0).progress, sum(), 1000).progress;
    const after = onError(first);
    expect(after).toMatchObject({ combo: 0, xp: first.xp, clean: 0 });
    expect(onResult(after, sum(), 2000).combo).toBe(1);
  });
});

describe('levels', () => {
  test('every 100 XP', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(99)).toBe(1);
    expect(levelOf(100)).toBe(2);
    expect(levelOf(240)).toBe(3);
  });
});

describe('badges, each earned once', () => {
  test('first result', () => {
    const first = onResult(START, sum(), 0);
    expect(first.earned).toEqual(['first']);
    expect(onResult(first.progress, sum(), 60_000).earned).toEqual([]);
  });
  test('clean ten: ten results without an error between them', () => {
    let progress = START;
    const earned: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const outcome = onResult(progress, sum(), i * 60_000);
      progress = outcome.progress;
      earned.push(...outcome.earned);
    }
    expect(earned).toContain('clean-ten');
  });
  test('an error starts the ten again', () => {
    let progress = START;
    for (let i = 0; i < 9; i += 1) progress = onResult(progress, sum(), i * 60_000).progress;
    progress = onError(progress);
    expect(onResult(progress, sum(), 600_000).earned).not.toContain('clean-ten');
  });
  test('big number at a million, either sign', () => {
    expect(onResult(START, sum(1, false, 999_999), 0).earned).not.toContain('big');
    expect(onResult(START, sum(1, false, -1_000_000), 0).earned).toContain('big');
  });
  test('runner 100 and the best run', () => {
    const short = onRun(START, 42);
    expect(short).toMatchObject({ earned: [], progress: { best: 42 } });
    const long = onRun(short.progress, 130);
    expect(long).toMatchObject({ earned: ['runner-100'], progress: { best: 130 } });
    expect(onRun(long.progress, 20).progress.best).toBe(130);
  });
});
