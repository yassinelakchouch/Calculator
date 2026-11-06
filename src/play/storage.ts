import { BADGES, START, type Badge, type Progress } from './rewards';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
type Saved = { progress: Progress; muted: boolean };

const KEY = 'calc-project001';
const fresh = (): Saved => ({ progress: START, muted: false });
const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

// Storage can be missing or blocked (private windows): every read and write is wrapped, and bad data starts fresh.
export function load(store?: Store): Saved {
  try {
    const raw = (store ?? window.localStorage).getItem(KEY);
    if (!raw) return fresh();
    const { progress, muted } = JSON.parse(raw) ?? {};
    const badges: unknown = progress?.badges;
    const valid =
      count(progress?.xp) &&
      count(progress?.best) &&
      count(progress?.clean) &&
      typeof muted === 'boolean' &&
      Array.isArray(badges) &&
      badges.every((badge) => BADGES.includes(badge));
    if (!valid) return fresh();
    return { progress: { ...START, xp: progress.xp, best: progress.best, clean: progress.clean, badges: badges as Badge[] }, muted };
  } catch {
    return fresh();
  }
}

// The opening scenes play once per device (board C-05); blocked storage means they play each visit, never an error.
const INTRO_KEY = `${KEY}:intro`;

export function introSeen(store?: Store): boolean {
  try {
    return (store ?? window.localStorage).getItem(INTRO_KEY) === 'seen';
  } catch {
    return false;
  }
}

export function markIntroSeen(store?: Store) {
  try {
    (store ?? window.localStorage).setItem(INTRO_KEY, 'seen');
  } catch {
    // Not remembered: the scenes play again next visit.
  }
}

export function save({ progress, muted }: Saved, store?: Store) {
  const { xp, best, clean, badges } = progress;
  try {
    (store ?? window.localStorage).setItem(KEY, JSON.stringify({ progress: { xp, best, clean, badges }, muted }));
  } catch {
    // Nothing to do: the visit still works, it just won't be remembered.
  }
}
