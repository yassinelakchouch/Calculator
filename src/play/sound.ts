export type ToneName = 'digit' | 'operator' | 'equals' | 'clear' | 'error' | 'nope' | 'jump' | 'hit' | 'badge';
export const TONE_NAMES: readonly ToneName[] = ['digit', 'operator', 'equals', 'clear', 'error', 'nope', 'jump', 'hit', 'badge'];

export type Note = { from: number; to?: number; at: number; length: number; gain: number; wave: OscillatorType };

// Digits walk a major pentatonic scale from C5, so typing a number sounds like a short tune, never a wrong note.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const C5 = 523.25;

export function tone(name: ToneName, variant = 0): Note[] {
  switch (name) {
    case 'digit': {
      const from = C5 * 2 ** (SCALE[variant] / 12);
      return [{ from, to: from * 0.94, at: 0, length: 0.06, gain: 0.06, wave: 'triangle' }];
    }
    case 'operator':
      return [{ from: 392, to: 349, at: 0, length: 0.07, gain: 0.06, wave: 'sine' }];
    case 'equals':
      return [
        { from: 659.25, at: 0, length: 0.1, gain: 0.07, wave: 'triangle' },
        { from: 987.77, at: 0.08, length: 0.18, gain: 0.07, wave: 'triangle' },
      ];
    case 'clear':
      return [{ from: 600, to: 240, at: 0, length: 0.14, gain: 0.05, wave: 'sine' }];
    case 'error':
      return [
        { from: 233, to: 208, at: 0, length: 0.1, gain: 0.06, wave: 'triangle' },
        { from: 185, to: 147, at: 0.1, length: 0.18, gain: 0.06, wave: 'triangle' },
      ];
    case 'nope':
      return [{ from: 180, at: 0, length: 0.05, gain: 0.04, wave: 'sine' }];
    case 'jump':
      return [{ from: 330, to: 660, at: 0, length: 0.12, gain: 0.035, wave: 'square' }];
    case 'hit':
      return [{ from: 300, to: 80, at: 0, length: 0.28, gain: 0.045, wave: 'square' }];
    case 'badge':
      return [C5, 659.25, 783.99, 1046.5].map((from, i) => ({ from, at: i * 0.07, length: 0.12, gain: 0.06, wave: 'triangle' as const }));
  }
}

// Made on the first sound (after a click or key press), as browsers require; muted plays nothing.
export function createSound(muted = false) {
  let context: AudioContext | null = null;
  return {
    get muted() {
      return muted;
    },
    setMuted(next: boolean) {
      muted = next;
    },
    play(name: ToneName, variant = 0) {
      if (muted || typeof AudioContext === 'undefined') return;
      context ??= new AudioContext();
      if (context.state === 'suspended') void context.resume();
      const now = context.currentTime;
      for (const note of tone(name, variant)) {
        const start = now + note.at;
        const end = start + note.length;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = note.wave;
        oscillator.frequency.setValueAtTime(note.from, start);
        if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to, end);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
      }
    },
  };
}
