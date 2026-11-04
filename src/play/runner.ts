// Board C-02: one button, Unit only jumps. Units are display pixels; y is the height above the ground.
export const WORLD = { width: 360, unitX: 40, unitSize: 28, obstacleSize: 26, minGap: 210, maxStep: 0.05 } as const;

type Obstacle = { x: number; glyph: '+' | '−' | '×' | '÷' };
export type Run = { y: number; vy: number; obstacles: Obstacle[]; untilNext: number; score: number; over: boolean };

const GRAVITY = 1856;
const JUMP_SPEED = 464;
const BASE_SPEED = 230;
const GLYPHS: Obstacle['glyph'][] = ['+', '−', '×', '÷'];
// The hit boxes are 5 px smaller than the drawings on each side: a graze is not a hit.
const GRACE = 5;

export const startRun = (): Run => ({ y: 0, vy: 0, obstacles: [], untilNext: 140, score: 0, over: false });

export const speedAt = (score: number) => BASE_SPEED * (1 + 0.05 * Math.floor(score / 100));

export const jump = (run: Run): Run => (run.over || run.y > 0 ? run : { ...run, vy: JUMP_SPEED });

export function step(run: Run, seconds: number, random: () => number = Math.random): Run {
  if (run.over) return run;
  const dt = Math.min(seconds, WORLD.maxStep);
  const speed = speedAt(run.score);

  let vy = run.vy - GRAVITY * dt;
  let y = run.y + vy * dt;
  if (y <= 0) {
    y = 0;
    vy = 0;
  }

  const obstacles = run.obstacles.map((o) => ({ ...o, x: o.x - speed * dt })).filter((o) => o.x > -WORLD.obstacleSize);
  let untilNext = run.untilNext - speed * dt;
  if (untilNext <= 0) {
    obstacles.push({ x: WORLD.width, glyph: GLYPHS[Math.floor(random() * GLYPHS.length)] });
    untilNext = WORLD.minGap + random() * 160;
  }

  const left = WORLD.unitX + GRACE;
  const right = WORLD.unitX + WORLD.unitSize - GRACE;
  const over = obstacles.some((o) => o.x + GRACE < right && o.x + WORLD.obstacleSize - GRACE > left && y < WORLD.obstacleSize - GRACE);

  return { y, vy, obstacles, untilNext, score: run.score + 10 * dt, over };
}
