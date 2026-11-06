import { EMPTY, press, view, type Calc, type Key, type Outcome } from './engine/calculator';
import { keyFromKeyboard } from './engine/keyboard';
import { runLoader } from './ui/loader';
import { BADGES, levelOf, onError, onResult, onRun, type Badge, type Progress } from './play/rewards';
import { jump, startRun, step, WORLD, type Run } from './play/runner';
import { createSound } from './play/sound';
import { introSeen, load, markIntroSeen, save } from './play/storage';
import { createIntro, introBar } from './ui/intro';
import { createScene } from './ui/scene';
import { createQueue } from './ui/queue';
import { BADGE_TEXT, INTRO, SIDE } from './ui/copy';
import { coinSvg } from './ui/sprites';

type Mode = keyof typeof SIDE;

const IDLE_MS = 15_000;
const COMBO_MS = 10_000;
const TOAST_MS = 3_000;
// Board C-05: each opening scene holds this long (longer when nothing moves); Space right after the loader is ignored.
const SCENE_MS = 2200;
const SCENE_CALM_MS = 2600;
const SCENE_QUIET_MS = 600;

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const pad = (score: number) => String(Math.floor(score)).padStart(4, '0');

export function start() {
  const el = {
    card: $('#card'),
    display: $('#display'),
    expression: $('#expression'),
    main: $('#main'),
    note: $('#note'),
    error: $('#error'),
    backNote: $('#back-note'),
    level: $('#level'),
    xpFill: $('#xp-fill'),
    xpText: $('#xp-text'),
    combo: $('#combo'),
    sound: $<HTMLButtonElement>('#sound'),
    tapeToggle: $<HTMLButtonElement>('#tape-toggle'),
    tape: $('#tape'),
    tapeRows: $('#tape-rows'),
    keys: $('#keys'),
    toast: $('#toast'),
    live: $('#live'),
    score: $('#score'),
    runLabel: $('#run-label'),
    runHint: $('#run-hint'),
    gameText: $('#game-text'),
    sideTitle: $('#side-title'),
    sideText: $('#side-text'),
    coins: $('#coins'),
    stats: $('#stats'),
    intro: $('#intro'),
    how: $<HTMLButtonElement>('#how'),
  };
  const scene = createScene($<SVGSVGElement>('#scene'));
  const saved = load();
  const sound = createSound(saved.muted);

  let progress: Progress = saved.progress;
  let calc: Calc = EMPTY;
  let note = '';
  let mode: Mode = 'calc';
  let run: Run | null = null;
  let frame = 0;
  let lastTime = 0;
  let idleTimer = 0;
  let comboTimer = 0;
  const tape: { line: string; xp: string }[] = [];

  const persist = () => save({ progress, muted: sound.muted });
  const announce = (text: string) => (el.live.textContent = text);
  const replay = (node: HTMLElement, className: string) => {
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
  };

  // ---------- drawing ----------
  function renderSum() {
    const shown = view(calc);
    el.expression.replaceChildren(Object.assign(document.createElement('span'), { dir: 'ltr', textContent: shown.expression }));
    el.expression.dataset.done = String(calc.result !== null);
    el.main.textContent = shown.main;
    el.main.dataset.size = shown.main.length > 15 ? 'xs' : shown.main.length > 13 ? 's' : shown.main.length > 9 ? 'm' : 'l';
    el.error.hidden = !shown.error;
    el.error.innerHTML = shown.error ? `<span class="text-accent">! </span>${shown.error}` : '';
    el.display.dataset.error = String(Boolean(shown.error));
    el.note.textContent = note;
  }

  function renderProgress() {
    const level = levelOf(progress.xp);
    const of = level * 100;
    el.level.textContent = `LVL ${level}`;
    el.xpText.textContent = `${progress.xp}/${of} XP`;
    el.xpFill.style.width = `${Math.min(100, (progress.xp / of) * 100)}%`;
    const live = progress.combo >= 2 && progress.lastAt !== null && Date.now() - progress.lastAt <= COMBO_MS;
    el.combo.hidden = !live;
    el.combo.textContent = `×${progress.combo} combo`;
    el.coins.innerHTML = BADGES.map((badge) => {
      const { coin, name } = BADGE_TEXT[badge];
      const earned = progress.badges.includes(badge);
      return `<span title="${name}${earned ? '' : ' · not yet'}">${coinSvg(coin, 44, !earned)}</span>`;
    }).join('');
    el.stats.textContent = `${progress.badges.length} of ${BADGES.length} badges · best run ${progress.best}`;
  }

  function renderTape() {
    el.tapeRows.innerHTML = tape.length
      ? tape.map(({ line, xp }) => `<li class="tape-row"><span>${line}</span><span class="text-quiet">${xp}</span></li>`).join('')
      : '<li class="tape-row text-quiet">Results land here.</li>';
  }

  function renderMode() {
    el.display.dataset.mode = mode;
    el.sideTitle.innerHTML = SIDE[mode].title;
    el.sideText.textContent = SIDE[mode].text;
    el.runLabel.hidden = mode !== 'play';
    el.score.hidden = mode !== 'play';
    // Board C-02 frame 05: the number waiting underneath is named, so leaving the game never feels like losing it.
    const kept = calc.error ? '0' : view(calc).main;
    el.runHint.hidden = !(mode === 'play' || (mode !== 'calc' && kept !== '0'));
    el.runHint.textContent = mode === 'play' ? 'Space · ↑ · tap' : `${kept} kept`;
    if (mode === 'attract') {
      scene.draw(null, 0, 'stand');
      el.gameText.innerHTML = `<strong>Idle? Run for it.</strong><span>Space, ↑ or tap to jump · any key to calculate</span>`;
    } else if (mode === 'over' && run) {
      el.gameText.innerHTML = `<strong>${Math.floor(run.score)} · best ${progress.best}</strong><span>Space, ↑ or tap to retry · any key to calculate</span>`;
    } else {
      el.gameText.innerHTML = '';
    }
  }

  // ---------- badges ----------
  const toasts = createQueue<Badge>((badge, done) => {
    const { coin, name, why } = BADGE_TEXT[badge];
    el.toast.innerHTML = `${coinSvg(coin, 34, false)}<span class="grid gap-0.5"><strong class="text-[13px]">Badge · ${name}</strong><span class="font-mono text-xs text-quiet">${why}</span></span>`;
    el.toast.hidden = false;
    replay(el.toast, 'toast-in');
    sound.play('badge');
    window.setTimeout(() => {
      el.toast.classList.remove('toast-in');
      el.toast.classList.add('toast-out');
      window.setTimeout(() => {
        el.toast.hidden = true;
        el.toast.classList.remove('toast-out');
        done();
      }, 250);
    }, TOAST_MS);
  });

  function earn(badges: Badge[]) {
    toasts.push(...badges);
  }

  // ---------- the calculator ----------
  function soundFor(key: Key, outcome: Outcome) {
    if (outcome.event === 'ignored') return sound.play('nope');
    if (outcome.event === 'cleared') return sound.play('clear');
    if (outcome.event === 'error') return sound.play('error');
    if (outcome.event === 'result') return sound.play('equals');
    if (/^\d$/.test(key)) return sound.play('digit', Number(key));
    sound.play('operator');
  }

  function input(key: Key) {
    if (intro.running) intro.stop('play');
    if (mode !== 'calc') backToSum();
    resetIdle();
    const outcome = press(calc, key);
    calc = outcome.state;
    note = '';
    soundFor(key, outcome);

    if (outcome.event === 'result' && outcome.stats) {
      const reward = onResult(progress, outcome.stats, Date.now());
      progress = reward.progress;
      note = `+${reward.gained} XP${reward.combo > 1 ? ` · ×${reward.combo} combo` : ''}`;
      const shown = view(calc);
      tape.unshift({ line: `${shown.expression} ${shown.main}`, xp: `+${reward.gained} XP` });
      tape.splice(3);
      announce(`${shown.main}, plus ${reward.gained} XP`);
      replay(el.main, 'pop');
      replay(el.note, 'rise');
      earn(reward.earned);
      persist();
      window.clearTimeout(comboTimer);
      comboTimer = window.setTimeout(renderProgress, COMBO_MS + 50);
    } else if (outcome.event === 'error') {
      progress = onError(progress);
      announce(view(calc).error ?? '');
      replay(el.display, 'nudge');
      persist();
    } else if (outcome.event === 'ignored') {
      replay(el.main, 'nudge');
    }
    renderSum();
    renderProgress();
    renderTape();
  }

  function flash(key: Key) {
    const button = el.keys.querySelector<HTMLElement>(`[data-key="${key}"]`);
    if (!button) return;
    button.dataset.pressed = '';
    window.setTimeout(() => delete button.dataset.pressed, 110);
  }

  // ---------- the runner ----------
  function tick(time: number) {
    if (!run || mode !== 'play') return;
    const seconds = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;
    run = step(run, seconds);
    scene.draw(run, time);
    el.score.textContent = pad(run.score);
    if (run.over) {
      finishRun(run);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function play() {
    mode = 'play';
    run = startRun();
    lastTime = 0;
    renderMode();
    frame = requestAnimationFrame(tick);
  }

  function finishRun(finished: Run) {
    mode = 'over';
    sound.play('hit');
    const outcome = onRun(progress, finished.score);
    progress = outcome.progress;
    persist();
    renderMode();
    renderProgress();
    earn(outcome.earned);
  }

  function gameAction() {
    if (mode === 'play' && run) {
      const next = jump(run);
      if (next !== run) sound.play('jump');
      run = next;
      return;
    }
    play();
  }

  // Any calculator key ends the game: the run sinks and fades, the sum rises back (styles: .display[data-mode]).
  function backToSum() {
    cancelAnimationFrame(frame);
    mode = 'calc';
    renderMode();
    replay(el.backNote, 'back-in');
  }

  function enterAttract() {
    if (mode !== 'calc' || document.hidden) return;
    mode = 'attract';
    run = null;
    renderMode();
  }

  function resetIdle() {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(enterAttract, IDLE_MS);
  }

  // ---------- the opening scenes (board C-05): the calculator shows itself, then hands over ----------
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introAt = 0;
  let demoFrame = 0;
  let swallowSpaceUp = false;

  const demoKey = (key: string | null) =>
    el.keys.querySelectorAll<HTMLElement>('[data-key]').forEach((button) => button.toggleAttribute('data-demo', button.dataset.key === key));

  // Scene 4: Unit runs and jumps on its own over a steady course; nothing is scored or saved.
  function demoRun() {
    const steady = () => 0.5;
    let demo = startRun();
    let last = 0;
    const loop = (time: number) => {
      demo = step(demo, last ? (time - last) / 1000 : 0, steady);
      last = time;
      if (demo.obstacles.some((o) => o.x > WORLD.unitX && o.x - WORLD.unitX < 70)) demo = jump(demo);
      scene.draw(demo, time);
      if (!demo.over) demoFrame = requestAnimationFrame(loop);
    };
    if (calm) {
      scene.draw(step(jump(demo), 0.12, steady), 0);
      return;
    }
    demoFrame = requestAnimationFrame(loop);
  }

  function showScene(index: number) {
    const line = INTRO[index];
    el.intro.innerHTML = introBar(index, INTRO.length);
    cancelAnimationFrame(demoFrame);
    if (index < 2) {
      el.display.dataset.mode = 'calc';
      el.expression.replaceChildren(Object.assign(document.createElement('span'), { dir: 'ltr', textContent: index === 0 ? '7 ×' : '7 × 8 =' }));
      el.expression.dataset.done = String(index === 1);
      el.main.textContent = index === 0 ? '8' : '56';
      el.main.dataset.size = 'l';
      el.error.hidden = true;
      el.note.textContent = line.line;
      demoKey(index === 0 ? '8' : '=');
      if (index === 1 && !calm) replay(el.main, 'pop');
    } else {
      demoKey(null);
      el.display.dataset.mode = index === 2 ? 'attract' : 'play';
      el.runLabel.hidden = index !== 3;
      el.score.hidden = index !== 3;
      el.score.textContent = pad(0);
      el.runHint.hidden = index !== 3;
      el.runHint.textContent = 'Space · ↑ · tap';
      el.gameText.innerHTML = `<strong>${line.title}</strong><span>${line.line}</span>`;
      if (index === 2) scene.draw(null, 0, 'stand');
      else demoRun();
    }
    announce(line.said);
  }

  // The scenes only borrowed the display: it goes back to the sum as it was.
  function restoreDisplay() {
    cancelAnimationFrame(demoFrame);
    demoKey(null);
    el.intro.hidden = true;
    el.intro.innerHTML = '';
    renderSum();
    renderMode();
  }

  const intro = createIntro({
    count: INTRO.length,
    hold: calm ? SCENE_CALM_MS : SCENE_MS,
    show: showScene,
    end: (reason) => {
      markIntroSeen();
      restoreDisplay();
      resetIdle();
      if (reason === 'play') return;
      // The way back is marked once, then left alone.
      el.how.dataset.ring = '';
      window.setTimeout(() => delete el.how.dataset.ring, 2400);
    },
  });

  function playIntro() {
    if (intro.running) return;
    if (mode !== 'calc') backToSum();
    window.clearTimeout(idleTimer);
    el.intro.hidden = false;
    introAt = performance.now();
    intro.start();
  }

  el.intro.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-skip]')) intro.stop('skip');
  });
  el.how.addEventListener('click', playIntro);

  // ---------- wiring ----------
  el.keys.addEventListener('mousedown', (event) => {
    // Keep focus where it was, so Enter on the keyboard still means = after a click.
    if ((event.target as Element).closest('[data-key]')) event.preventDefault();
  });
  el.keys.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-key]');
    if (button) input(button.dataset.key as Key);
  });

  el.display.addEventListener('pointerdown', (event) => {
    if (mode === 'calc') return;
    event.preventDefault();
    resetIdle();
    gameAction();
  });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (intro.running) {
      const move = { ' ': 'next', ArrowRight: 'next', ArrowLeft: 'back' }[event.key];
      if (event.key === 'Escape') {
        event.preventDefault();
        intro.stop('skip');
        return;
      }
      if (move) {
        event.preventDefault();
        swallowSpaceUp = event.key === ' ';
        // The Space that closed the loader must not also skip a scene.
        if (performance.now() - introAt > SCENE_QUIET_MS) intro[move as 'next' | 'back']();
        return;
      }
    }
    resetIdle();
    if (mode !== 'calc' && (event.key === ' ' || event.key === 'ArrowUp')) {
      event.preventDefault();
      if (!event.repeat) gameAction();
      return;
    }
    if (mode !== 'calc' && event.key === 'Escape') {
      event.preventDefault();
      backToSum();
      return;
    }
    // Enter on a focused button already clicks it.
    if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) return;
    const key = keyFromKeyboard(event.key);
    if (!key) return;
    event.preventDefault();
    flash(key);
    input(key);
  });
  // A focused button would also click on Space's keyup; in the game Space only jumps.
  document.addEventListener('keyup', (event) => {
    if (event.key !== ' ') return;
    // A Space the scenes used must not click a focused key on its way up.
    if (mode !== 'calc' || swallowSpaceUp) event.preventDefault();
    swallowSpaceUp = false;
  });
  document.addEventListener('pointerdown', resetIdle);

  el.sound.addEventListener('click', () => {
    sound.setMuted(!sound.muted);
    el.sound.textContent = sound.muted ? 'Sound off' : 'Sound on';
    el.sound.setAttribute('aria-pressed', String(!sound.muted));
    sound.play('digit', 4);
    persist();
  });

  el.tapeToggle.addEventListener('click', () => {
    const open = el.tape.hidden !== false;
    el.tape.hidden = !open;
    el.card.toggleAttribute('data-tape', open);
    el.tapeToggle.textContent = open ? 'Hide tape' : 'Tape';
    el.tapeToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      return;
    }
    if (mode === 'play') {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    } else resetIdle();
  });

  el.sound.textContent = sound.muted ? 'Sound off' : 'Sound on';
  el.sound.setAttribute('aria-pressed', String(!sound.muted));
  renderSum();
  renderProgress();
  renderTape();
  renderMode();
  resetIdle();
  runLoader(el.card, el.keys, () => {
    if (!introSeen()) playIntro();
  });
}
