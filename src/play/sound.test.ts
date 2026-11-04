import { expect, test } from 'vitest';
import { TONE_NAMES, tone } from './sound';

test('every sound is short and quiet', () => {
  for (const name of TONE_NAMES) {
    const notes = tone(name);
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect(note.at + note.length).toBeLessThanOrEqual(0.4);
      expect(note.gain).toBeLessThanOrEqual(0.1);
    }
  }
});

test('each digit plays its own note, rising from 0 to 9', () => {
  const pitches = Array.from({ length: 10 }, (_, digit) => tone('digit', digit)[0].from);
  expect(new Set(pitches).size).toBe(10);
  expect([...pitches].sort((a, b) => a - b)).toEqual(pitches);
});

test('= rises: the result sounds like an answer', () => {
  const [first, second] = tone('equals');
  expect(second.from).toBeGreaterThan(first.from);
  expect(second.at).toBeGreaterThan(first.at);
});
