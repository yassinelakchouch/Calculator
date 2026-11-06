export type IntroEnd = 'done' | 'skip' | 'play';

type Options = {
  count: number;
  hold: number;
  show: (index: number) => void;
  end: (reason: IntroEnd) => void;
};

// Board C-05: after the loader the calculator shows itself, one scene per hold; it ends on its own, on Skip, or when a key is pressed.
export function createIntro({ count, hold, show, end }: Options) {
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;

  const go = (next: number) => {
    clearTimeout(timer);
    if (next >= count) return stop('done');
    index = Math.max(0, next);
    show(index);
    timer = setTimeout(() => go(index + 1), hold);
  };

  function stop(reason: IntroEnd) {
    if (!running) return;
    running = false;
    clearTimeout(timer);
    end(reason);
  }

  return {
    get running() {
      return running;
    },
    start() {
      running = true;
      go(0);
    },
    next() {
      if (running) go(index + 1);
    },
    back() {
      if (running) go(index - 1);
    },
    stop,
  };
}

// Where the scenes are and the way out, on every scene; it covers the XP strip while they play.
export const introBar = (index: number, count: number) =>
  `<span class="intro-label">How it works · ${index + 1}/${count}</span>` +
  `<span class="intro-steps" aria-hidden="true">${Array.from({ length: count }, (_, i) => `<i${i <= index ? ' class="on"' : ''}></i>`).join('')}</span>` +
  `<button type="button" class="text-link" data-skip>Skip · Esc</button>`;
