import { expect, test } from 'vitest';
import { START } from './rewards';
import { introSeen, load, markIntroSeen, save } from './storage';

const memory = () => {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => void items.set(key, value) };
};

test('what is saved comes back', () => {
  const storage = memory();
  save({ progress: { ...START, xp: 240, best: 130, badges: ['first'] }, muted: true }, storage);
  expect(load(storage)).toEqual({ progress: { ...START, xp: 240, best: 130, badges: ['first'] }, muted: true });
});

test('a first visit starts fresh with sound on', () => expect(load(memory())).toEqual({ progress: START, muted: false }));

test('broken or foreign data starts fresh', () => {
  const storage = memory();
  storage.setItem('calc-project001', '{"xp":"lots"');
  expect(load(storage)).toEqual({ progress: START, muted: false });
  storage.setItem('calc-project001', JSON.stringify({ progress: { xp: -5, best: 'x', badges: ['hacked'] }, muted: 'yes' }));
  expect(load(storage)).toEqual({ progress: START, muted: false });
});

test('a blocked storage (private window) neither throws nor saves', () => {
  const blocked = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  expect(load(blocked)).toEqual({ progress: START, muted: false });
  expect(() => save({ progress: START, muted: false }, blocked)).not.toThrow();
});

test('the combo clock is not saved: a new visit starts at ×1', () => {
  const storage = memory();
  save({ progress: { ...START, combo: 4, lastAt: 123, clean: 6 }, muted: false }, storage);
  expect(load(storage).progress).toMatchObject({ combo: 0, lastAt: null, clean: 6 });
});

test('the opening scenes are remembered once seen, and a blocked store never throws', () => {
  const store = memory();
  expect(introSeen(store)).toBe(false);
  markIntroSeen(store);
  expect(introSeen(store)).toBe(true);
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  expect(introSeen(blocked)).toBe(false);
  expect(() => markIntroSeen(blocked)).not.toThrow();
});
