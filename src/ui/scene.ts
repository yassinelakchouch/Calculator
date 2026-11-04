import { WORLD, type Run } from '../play/runner';
import { obstacleSvg, unitSvg, type Pose } from './sprites';

const NS = 'http://www.w3.org/2000/svg';
// The ground line in the 360 × 146 scene; 30 px of floor below it, as on the board.
const GROUND = 116;

export function createScene(svg: SVGSVGElement) {
  svg.innerHTML = `<line x1="0" y1="${GROUND + 1}" x2="360" y2="${GROUND + 1}" stroke="rgb(236 232 225 / 0.35)" stroke-width="2" stroke-dasharray="6 6"/>`;
  const unit = document.createElementNS(NS, 'g');
  const pool = Array.from({ length: 4 }, () => document.createElementNS(NS, 'g'));
  svg.append(...pool, unit);
  let pose: Pose | null = null;

  return {
    // Redraws only what moved: the unit's legs change a few times a second, obstacles are a fixed pool.
    draw(run: Run | null, time: number, still?: Pose) {
      const y = run?.y ?? 0;
      const next: Pose = still ?? (run?.over ? 'hit' : y > 0 ? 'jump' : Math.floor(time / 110) % 2 ? 'run2' : 'run');
      if (next !== pose) {
        unit.innerHTML = unitSvg(next);
        pose = next;
      }
      unit.setAttribute('transform', `translate(${WORLD.unitX} ${GROUND - WORLD.unitSize - y})`);
      pool.forEach((group, index) => {
        const obstacle = run?.obstacles[index];
        if (!obstacle) {
          group.setAttribute('visibility', 'hidden');
          return;
        }
        if (group.dataset.glyph !== obstacle.glyph) {
          group.innerHTML = obstacleSvg(obstacle.glyph);
          group.dataset.glyph = obstacle.glyph;
        }
        group.setAttribute('visibility', 'visible');
        group.setAttribute('transform', `translate(${obstacle.x.toFixed(1)} ${GROUND - WORLD.obstacleSize})`);
      });
    },
  };
}
