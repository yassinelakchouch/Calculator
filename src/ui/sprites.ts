// Unit is an original character (board C-03): a pink block with two eyes, not a copy of any existing game.
export type Pose = 'stand' | 'run' | 'run2' | 'jump' | 'hit';

const INK = '#0b0c0d';
const PINK = '#ff90e8';
const LEGS: Record<Pose, string> = {
  stand: 'M9 22 9 27M17 22 17 27',
  run: 'M8 22 6 27M16 22 19 26',
  run2: 'M8 22 10 27M16 22 14 27',
  jump: 'M8 22 5 24M16 22 20 23',
  hit: 'M8 22 6 27M16 22 19 26',
};

export function unitSvg(pose: Pose) {
  const eyes =
    pose === 'hit'
      ? `<path d="M9 9l3 3M12 9l-3 3M15 9l3 3M18 9l-3 3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
      : `<circle cx="10.5" cy="10" r="1.7" fill="${INK}"/><circle cx="16.5" cy="10" r="1.7" fill="${INK}"/>`;
  return `<path d="${LEGS[pose]}" stroke="${PINK}" stroke-width="2.2" stroke-linecap="round"/><rect x="3" y="4" width="21" height="18" rx="5" fill="${PINK}" stroke="${INK}" stroke-width="2"/>${eyes}`;
}

export const obstacleSvg = (glyph: string) =>
  `<rect x="1" y="1" width="24" height="24" rx="5" fill="#ece8e1" stroke="${INK}" stroke-width="2"/>` +
  `<text x="13" y="18.5" text-anchor="middle" font-family="Schibsted Grotesk, sans-serif" font-size="16" font-weight="700" fill="${INK}">${glyph}</text>`;

export function coinSvg(label: string, size: number, locked: boolean) {
  const fill = locked ? '#2a2d30' : PINK;
  const text = locked ? '#8e918f' : INK;
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 56 56" aria-hidden="true" class="block">` +
    `<ellipse cx="29" cy="31" rx="24" ry="22" fill="${INK}"/><ellipse cx="27" cy="27" rx="24" ry="22" fill="${fill}" stroke="${INK}" stroke-width="2.4"/>` +
    `<text x="27" y="34" text-anchor="middle" font-family="Schibsted Grotesk, sans-serif" font-size="20" font-weight="700" fill="${text}">${label}</text></svg>`
  );
}
