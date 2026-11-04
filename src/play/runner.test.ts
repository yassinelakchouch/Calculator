import { describe, expect, test } from 'vitest';
import { jump, speedAt, startRun, step, WORLD, type Run } from './runner';

const steady = () => 0.5;
const advance = (run: Run, seconds: number, onEach?: (run: Run) => Run) => {
  let current = run;
  for (let t = 0; t < seconds; t += 1 / 60) current = step(onEach ? onEach(current) : current, 1 / 60, steady);
  return current;
};

describe('jumping', () => {
  test('a jump leaves the ground', () => expect(step(jump(startRun()), 1 / 60, steady).y).toBeGreaterThan(0));
  test('a second jump in the air does nothing', () => {
    const airborne = step(jump(startRun()), 0.1, steady);
    expect(jump(airborne)).toBe(airborne);
  });
  test('Unit lands again', () => expect(advance(jump(startRun()), 1).y).toBe(0));
  test('the jump clears an obstacle with room to spare', () => {
    let peak = 0;
    advance(jump(startRun()), 1, (run) => {
      peak = Math.max(peak, run.y);
      return run;
    });
    expect(peak).toBeGreaterThan(WORLD.obstacleSize * 2);
  });
});

describe('obstacles', () => {
  test('they come in from the right edge and move left', () => {
    const run = advance(startRun(), 1);
    expect(run.obstacles.length).toBeGreaterThan(0);
    expect(run.obstacles[0].x).toBeLessThan(WORLD.width);
  });
  test('standing still, the first one ends the run', () => expect(advance(startRun(), 4).over).toBe(true));
  test('jumping in time survives it', () => {
    const run = advance(startRun(), 4, (current) => {
      const next = current.obstacles.find((o) => o.x > WORLD.unitX);
      return next && next.x - WORLD.unitX < 70 ? jump(current) : current;
    });
    expect(run.over).toBe(false);
  });
  test('gaps are always wide enough to land and jump again', () => {
    const run = advance(startRun(), 20, (current) => {
      const next = current.obstacles.find((o) => o.x > WORLD.unitX);
      return next && next.x - WORLD.unitX < 70 ? jump(current) : current;
    });
    const xs = run.obstacles.map((o) => o.x);
    for (let i = 1; i < xs.length; i += 1) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(WORLD.minGap);
  });
});

describe('score and speed', () => {
  test('10 points a second', () => expect(Math.round(advance(jump(startRun()), 0.5).score)).toBe(5));
  test('+5 % every 100 points', () => {
    expect(speedAt(99)).toBe(speedAt(0));
    expect(speedAt(100)).toBeCloseTo(speedAt(0) * 1.05);
    expect(speedAt(250)).toBeCloseTo(speedAt(0) * 1.1);
  });
  test('a long frame (hidden tab) counts as one short step', () => {
    const run = startRun();
    expect(step(run, 5, steady)).toEqual(step(run, WORLD.maxStep, steady));
  });
  test('a finished run stays finished', () => {
    const over = advance(startRun(), 4);
    expect(step(over, 1, steady)).toBe(over);
    expect(jump(over)).toBe(over);
  });
});
