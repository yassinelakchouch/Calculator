import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIntro, introBar, type IntroEnd } from './intro';

describe('createIntro', () => {
  let shown: number[];
  let ended: IntroEnd[];
  const make = () => createIntro({ count: 4, hold: 2000, show: (i) => shown.push(i), end: (r) => ended.push(r) });

  beforeEach(() => {
    vi.useFakeTimers();
    shown = [];
    ended = [];
  });
  afterEach(() => vi.useRealTimers());

  it('plays each scene for one hold, then ends by itself', () => {
    const intro = make();
    intro.start();
    expect(shown).toEqual([0]);
    vi.advanceTimersByTime(2000 * 3);
    expect(shown).toEqual([0, 1, 2, 3]);
    expect(intro.running).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(ended).toEqual(['done']);
    expect(intro.running).toBe(false);
  });

  it('steps on and back, never before the first scene, and restarts the hold', () => {
    const intro = make();
    intro.start();
    intro.back();
    intro.next();
    vi.advanceTimersByTime(1500);
    intro.back();
    expect(shown).toEqual([0, 0, 1, 0]);
    vi.advanceTimersByTime(1500);
    expect(shown).toEqual([0, 0, 1, 0]);
  });

  it('ends once with the reason it was stopped for', () => {
    const intro = make();
    intro.start();
    intro.stop('play');
    intro.stop('skip');
    vi.advanceTimersByTime(10_000);
    expect(ended).toEqual(['play']);
    expect(shown).toEqual([0]);
  });

  it('does nothing when it is not running', () => {
    const intro = make();
    intro.next();
    intro.stop('skip');
    expect(shown).toEqual([]);
    expect(ended).toEqual([]);
  });
});

describe('introBar', () => {
  it('says which scene of how many, lights the steps so far and offers Skip', () => {
    const html = introBar(2, 4);
    expect(html).toContain('How it works · 3/4');
    expect(html.match(/<i class="on"><\/i>/g)).toHaveLength(3);
    expect(html).toContain('data-skip>Skip · Esc</button>');
  });
});
