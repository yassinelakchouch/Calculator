// Board C-04: the ten digits fall into a large keypad that shrinks onto the real one; once per visit, ended by any key or tap, none with reduced motion.
export const ORDER = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'] as const;
const DROP_GAP = 80;
const DROP_MS = 520;
const GROW_MS = 420;
const SEEN = 'calc-project001:opened';
const SETTLE = 'cubic-bezier(0.34, 1.45, 0.5, 1)';

export const dropStart = (i: number) => i * DROP_GAP;
export const landedAt = () => dropStart(ORDER.length - 1) + DROP_MS;

type Box = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

// The large keypad: the real one scaled up about its own centre and moved to the centre of the screen.
export function formation(keypad: Box, screen: { width: number; height: number }) {
  const scale = Math.min(2.4, (screen.height * 0.78) / keypad.height, (screen.width * 0.8) / keypad.width);
  const dx = screen.width / 2 - (keypad.left + keypad.width / 2) * scale;
  const dy = screen.height / 2 - (keypad.top + keypad.height / 2) * scale;
  return { scale, dx, dy };
}

export function runLoader(card: HTMLElement, keypad: HTMLElement, done: () => void = () => {}) {
  const loader = document.getElementById('loader');
  if (!loader) return done();
  const hidden = document.documentElement.classList.contains('loaded') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    sessionStorage.setItem(SEEN, '1');
  } catch {
    // Storage blocked: it plays on every load, it is short.
  }
  if (hidden) {
    loader.remove();
    return done();
  }

  const ground = loader.querySelector<HTMLElement>('.loader-ground')!;
  const pad = loader.querySelector<HTMLElement>('.loader-pad')!;
  const keys = [...keypad.querySelectorAll<HTMLElement>('.key')];
  const label = getComputedStyle(keypad.querySelector('.key[data-key="7"]')!);
  const { scale, dx, dy } = formation(keypad.getBoundingClientRect(), { width: innerWidth, height: innerHeight });
  pad.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  const running: Animation[] = [];
  let timer = 0;
  let ended = false;

  const digits = ORDER.map((digit, i) => {
    const box = keypad.querySelector<HTMLElement>(`.key[data-key="${digit}"]`)!.getBoundingClientRect();
    const span = Object.assign(document.createElement('span'), { className: 'loader-fall', textContent: digit });
    Object.assign(span.style, { left: `${box.left + box.width / 2}px`, top: `${box.top + box.height / 2}px`, fontSize: label.fontSize, fontWeight: label.fontWeight, fontFamily: label.fontFamily });
    pad.append(span);
    const from = `translate(-50%, calc(-50% - ${(box.top + box.height + 40).toFixed(0)}px)) rotate(${(i % 3) * 18 - 18}deg)`;
    running.push(span.animate([{ transform: from }, { transform: 'translate(-50%, -50%)' }], { duration: DROP_MS, delay: dropStart(i), easing: SETTLE, fill: 'both' }));
    return span;
  });

  const end = () => {
    if (ended) return;
    ended = true;
    window.clearTimeout(timer);
    running.forEach((animation) => animation.cancel());
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    loader.remove();
    done();
  };
  const swallow = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  function onKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
    swallow(event);
    end();
  }
  // The loader covers the page, so a tap lands on it: its click is dropped, or forgotten if none follows.
  function onPointer() {
    window.addEventListener('click', swallow, { capture: true, once: true });
    window.setTimeout(() => window.removeEventListener('click', swallow, true), 600);
    end();
  }

  // The keypad shrinks onto the real one, the keys grow in under the digits, the digits hand over to the keys' own labels.
  const grow = () => {
    const handover = [
      pad.animate([{ transform: pad.style.transform }, { transform: 'none' }], { duration: GROW_MS, easing: SETTLE, fill: 'forwards' }),
      ground.animate([{ opacity: 1 }, { opacity: 0 }], { duration: GROW_MS, easing: 'ease', fill: 'forwards' }),
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GROW_MS * 0.6, easing: 'ease' }),
      ...keys.map((key, i) => key.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], { duration: GROW_MS, delay: 120 + i * 14, easing: SETTLE, fill: 'backwards' })),
      ...digits.map((span) => span.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: GROW_MS, fill: 'forwards' })),
    ];
    running.push(...handover);
    void Promise.allSettled(handover.map((animation) => animation.finished)).then(end);
  };

  timer = window.setTimeout(grow, landedAt() + 80);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
}
