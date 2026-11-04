export type Badge = 'first' | 'clean-ten' | 'big' | 'runner-100';
export const BADGES: readonly Badge[] = ['first', 'clean-ten', 'big', 'runner-100'];

// clean counts results since the last error; combo and lastAt drive the ×2…×5 window.
export type Progress = { xp: number; best: number; badges: Badge[]; clean: number; combo: number; lastAt: number | null };
export const START: Progress = { xp: 0, best: 0, badges: [], clean: 0, combo: 0, lastAt: null };

type Sum = { operators: number; hard: boolean; value: number };

const COMBO_WINDOW = 10_000;
const MAX_COMBO = 5;

export const levelOf = (xp: number) => Math.floor(xp / 100) + 1;
export const xpFor = ({ operators, hard }: Sum) => (hard ? 3 : operators >= 2 ? 2 : 1);

export function onResult(progress: Progress, sum: Sum, now: number) {
  const inWindow = progress.lastAt !== null && now - progress.lastAt <= COMBO_WINDOW;
  const combo = inWindow ? Math.min(progress.combo + 1, MAX_COMBO) : 1;
  const gained = xpFor(sum) * combo;
  const clean = progress.clean + 1;
  const earned = (
    [
      ['first', true],
      ['clean-ten', clean >= 10],
      ['big', Math.abs(sum.value) >= 1_000_000],
    ] as const
  )
    .filter(([badge, met]) => met && !progress.badges.includes(badge))
    .map(([badge]) => badge as Badge);
  return {
    progress: { ...progress, xp: progress.xp + gained, clean, combo, lastAt: now, badges: [...progress.badges, ...earned] },
    gained,
    combo,
    earned,
  };
}

export const onError = (progress: Progress): Progress => ({ ...progress, clean: 0, combo: 0, lastAt: null });

export function onRun(progress: Progress, score: number) {
  const earned: Badge[] = score >= 100 && !progress.badges.includes('runner-100') ? ['runner-100'] : [];
  return { progress: { ...progress, best: Math.max(progress.best, Math.floor(score)), badges: [...progress.badges, ...earned] }, earned };
}
