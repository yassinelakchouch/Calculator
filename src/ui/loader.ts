// Board C-04 v3, "grows from its 0": before the page, one big digit rolls 1 to 9 to 0 (CSS, from the first paint); the 0 holds,
// then it flies into the display's own 0 while the calculator grows in around it. Once per visit, any key or tap ends it, none with reduced motion.
export const HOLD_MS = 200;
export const GROW_MS = 450;
export const SEEN = 'calc-project001:opened';
const SETTLE = 'cubic-bezier(0.34, 1.45, 0.5, 1)';

type Box = Pick<DOMRect, 'right' | 'bottom' | 'height'>;

// The move that lands the loader's 0 on the display's 0: right and bottom edges meet, heights match.
export const landing = (from: Box, to: Box) => ({ dx: to.right - from.right, dy: to.bottom - from.bottom, scale: to.height / from.height });

export function runLoader(card: HTMLElement, main: HTMLElement) {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const hidden = document.documentElement.classList.contains('loaded') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    sessionStorage.setItem(SEEN, '1');
  } catch {
    // Storage blocked: it plays on every load, it is short.
  }
  if (hidden) return loader.remove();

  const zero = loader.querySelector<HTMLElement>('.loader-digit')!;
  const ground = loader.querySelector<HTMLElement>('.loader-ground')!;
  const running: Animation[] = [];
  let timer = 0;
  let ended = false;

  const end = () => {
    if (ended) return;
    ended = true;
    window.clearTimeout(timer);
    running.forEach((animation) => animation.cancel());
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    main.style.removeProperty('visibility');
    loader.remove();
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

  const grow = () => {
    const range = document.createRange();
    range.selectNodeContents(main);
    const { dx, dy, scale } = landing(zero.getBoundingClientRect(), range.getBoundingClientRect());
    main.style.visibility = 'hidden';
    running.push(
      zero.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }], { duration: GROW_MS, easing: SETTLE, fill: 'forwards' }),
      ground.animate([{ opacity: 1 }, { opacity: 0 }], { duration: GROW_MS, easing: 'ease', fill: 'forwards' }),
      card.animate([{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: GROW_MS, easing: SETTLE }),
    );
    void Promise.allSettled(running.map((animation) => animation.finished)).then(end);
  };

  // The roll started with the first paint; the hold and the grow follow it, however late the app starts.
  void Promise.allSettled(loader.getAnimations({ subtree: true }).map((animation) => animation.finished)).then(() => {
    if (!ended) timer = window.setTimeout(grow, HOLD_MS);
  });
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
}
