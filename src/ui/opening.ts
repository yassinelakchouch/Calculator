// Board C-04, "the keypad wakes up": on the first load of a visit the digits 1 to 9, then 0, roll into the display while each one's key presses down
// and stays down; at 1 s the keys release together and the display rests at 0, ready. Nothing is scored.
export const OPENING_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
export const STEP_MS = 100;
export const RELEASE_AT = 1000;
export const OPENING_MS = 1200;
const SEEN = 'calc-project001:opened';

export const openingFrames = () => OPENING_DIGITS.map((digit, i) => ({ at: i * STEP_MS, digit }));

function firstOfVisit(): boolean {
  try {
    if (sessionStorage.getItem(SEEN) === '1') return false;
    sessionStorage.setItem(SEEN, '1');
  } catch {
    // Storage blocked: play it, it is short.
  }
  return true;
}

// Any key, tap or click ends it at once and is not typed; with reduced motion, or later in the visit, there is none.
export function runOpening(display: HTMLElement, keypad: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !firstOfVisit()) return;
  const layer = Object.assign(document.createElement('div'), { className: 'layer opening' });
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<output class="main" data-size="l"></output>';
  display.append(layer);
  display.dataset.opening = '';
  const main = layer.firstElementChild as HTMLElement;
  const woken = () => keypad.querySelectorAll<HTMLElement>('.key[data-woken]');
  const timers: number[] = [];
  let ended = false;

  const release = () =>
    woken().forEach((key) => {
      key.removeAttribute('data-woken');
      delete key.dataset.pressed;
    });
  const swallow = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const end = () => {
    if (ended) return;
    ended = true;
    timers.forEach((id) => window.clearTimeout(id));
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    release();
    layer.remove();
    delete display.dataset.opening;
  };
  function onKey(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
    swallow(event);
    end();
  }
  // A tap on a key that ends it must not type either: that click is dropped, or forgotten if none follows. Links and other controls keep their click.
  function onPointer(event: PointerEvent) {
    if ((event.target as Element | null)?.closest('.key')) {
      window.addEventListener('click', swallow, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', swallow, true), 600);
    }
    end();
  }

  for (const { at, digit } of openingFrames()) {
    timers.push(
      window.setTimeout(() => {
        main.textContent = digit;
        main.classList.remove('roll');
        void main.offsetWidth;
        main.classList.add('roll');
        const key = keypad.querySelector<HTMLElement>(`.key[data-key="${digit}"]`);
        if (key) {
          key.dataset.woken = '';
          key.dataset.pressed = '';
        }
      }, at),
    );
  }
  timers.push(window.setTimeout(release, RELEASE_AT));
  timers.push(window.setTimeout(end, OPENING_MS));
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
}
