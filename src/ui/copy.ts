import type { Badge } from '../play/rewards';

export const BADGE_TEXT: Record<Badge, { coin: string; name: string; why: string }> = {
  first: { coin: '1', name: 'First result', why: 'your first sum on this device' },
  'clean-ten': { coin: '10', name: 'Clean ten', why: '10 results without an error' },
  big: { coin: '1M', name: 'Big number', why: 'a result of a million or more' },
  'runner-100': { coin: '100', name: 'Runner 100', why: '100 points in one run' },
};
export const SIDE: Record<'calc' | 'attract' | 'play' | 'over', { title: string; text: string }> = {
  calc: {
    title: 'Calculator, <span class="font-serif font-normal italic">replayed</span>',
    text: 'A 2022 side project, redrawn: keyboard first, honest errors, and a runner for the idle moments.',
  },
  attract: { title: 'Unit is <span class="font-serif font-normal italic">waiting</span>', text: 'Space, ↑ or a tap on the screen to run. Any key takes you back to the sum.' },
  play: { title: 'Unit is <span class="font-serif font-normal italic">running</span>', text: 'Space, ↑ or a tap on the screen to jump. Any key takes you back to the sum.' },
  over: { title: 'Unit <span class="font-serif font-normal italic">tripped</span>', text: 'Space, ↑ or a tap on the screen to run again. Any key takes you back to the sum.' },
};
