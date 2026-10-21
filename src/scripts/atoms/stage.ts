/**
 * The first screen: intro (narrator lines, click / Space / Enter to advance, skippable, remembered
 * per session) and the three-question quiz. Uranium hands over to the fake crash.
 */
import { introLines, quiz, returnLine, finishLine, rebootLine, type Answer, type Question } from '../../data/atoms';
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';
import { emit, pause, resume, sleep, store } from './bus';
import { runCrash } from './crash';
import { Speech } from './speech';

const SEEN_KEY = 'atoms-intro-seen';

export function initStage() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const speech = new Speech();
  const narratorEl = speech.root;
  const introSlot = document.getElementById('intro-slot')!;
  const talkSlot = document.getElementById('quiz-talk')!;
  const quizEl = document.getElementById('quiz')!;
  const skipBtn = document.getElementById('intro-skip') as HTMLButtonElement;
  const replayBtn = document.getElementById('intro-replay') as HTMLButtonElement;
  const nextLineBtn = document.getElementById('narrator-next') as HTMLButtonElement;
  const hint = document.getElementById('intro-hint')!;
  const dots = [...stage.querySelectorAll<HTMLElement>('[data-dot]')];
  const nextBtn = document.getElementById('quiz-next') as HTMLButtonElement;
  const againBtn = document.getElementById('quiz-again') as HTMLButtonElement;
  const tagEl = document.getElementById('quiz-tag')!;
  const countEl = document.getElementById('quiz-count')!;
  const pips = [...stage.querySelectorAll<HTMLElement>('[data-pip]')];
  const qEls = [...stage.querySelectorAll<HTMLElement>('.q')];
  const reduced = prefersReducedMotion();

  /* ------------------------------------------------------------ narrator moves */

  /** Move the narrator node into another slot; the atom glides there (FLIP). */
  function moveNarrator(to: HTMLElement, animate = true, mutate?: () => void) {
    const atom = narratorEl.querySelector<HTMLElement>('.narrator__atom')!;
    const first = atom.getBoundingClientRect();
    mutate?.();
    if (narratorEl.parentElement !== to) to.appendChild(narratorEl);
    if (!animate || reduced) return;
    const last = atom.getBoundingClientRect();
    if (!last.width || !first.width) return;
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const s = first.width / last.width;
    atom.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, transformOrigin: '0 0' },
        { transform: 'none', transformOrigin: '0 0' },
      ],
      { duration: 820, easing: 'cubic-bezier(0.2, 0.9, 0.1, 1)' },
    );
  }

  /* ------------------------------------------------------------------- intro */

  let line = 0;
  let introActive = false;
  let nudgeTimer = 0;

  function setDots(i: number) {
    dots.forEach((d, k) => {
      d.toggleAttribute('data-on', k <= i);
      d.toggleAttribute('data-current', k === i);
    });
  }

  function showLine(i: number) {
    line = i;
    setDots(i);
    const last = i === introLines.length - 1;
    nextLineBtn.setAttribute('aria-label', last ? 'Start the quiz' : 'Next line');
    const t = speech.say(introLines[i], { mood: last ? 'alarm' : i === 0 ? 'worried' : 'idle' });
    hint.removeAttribute('data-nudge');
    clearTimeout(nudgeTimer);
    t.done.then(() => {
      if (!introActive) return;
      nudgeTimer = window.setTimeout(() => introActive && hint.setAttribute('data-nudge', ''), 4500);
    });
  }

  function advance() {
    if (!introActive) return;
    if (speech.typing) {
      speech.finish();
      return;
    }
    if (line < introLines.length - 1) showLine(line + 1);
    else endIntro('done');
  }

  const isInteractive = (el: EventTarget | null) =>
    el instanceof Element && !!el.closest('a, button, input, textarea, select, summary, [role="button"]');

  function onStageClick(e: MouseEvent) {
    if (!introActive || isInteractive(e.target)) return;
    advance();
  }

  function onKey(e: KeyboardEvent) {
    if (!introActive || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (isInteractive(e.target) && e.target !== nextLineBtn) return;
    // only while the stage is what the visitor is looking at
    const r = stage!.getBoundingClientRect();
    if (r.bottom < window.innerHeight * 0.45) return;
    e.preventDefault();
    advance();
  }

  function runIntro() {
    introActive = true;
    pause('intro');
    replayBtn.hidden = true;
    moveNarrator(introSlot, false, () => {
      stage!.dataset.mode = 'intro';
      quizEl.hidden = true;
    });
    narratorEl.querySelector('.narrator__atom')?.animate?.(
      [{ opacity: 0, transform: 'scale(0.4) rotate(-40deg)' }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 1 : 900, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
    showLine(0);
  }

  async function endIntro(how: 'done' | 'skip') {
    if (!introActive) return;
    introActive = false;
    clearTimeout(nudgeTimer);
    track(how === 'skip' ? 'atoms-intro-skip' : 'atoms-intro-done');
    store.set(SEEN_KEY, '1');
    speech.finish();
    if (how === 'done' && !reduced) {
      stage!.dataset.alarm = '';
      speech.narrator.setMood('alarm');
      await sleep(700);
      delete stage!.dataset.alarm;
    }
    // keep keyboard users where they were: the skip button disappears with the intro
    const hadFocus = document.activeElement === skipBtn || document.activeElement === nextLineBtn;
    startQuiz(false);
    resume('intro');
    emit('intro:end');
    if (hadFocus) (qEls[0].querySelector('.tile') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  stage.addEventListener('click', onStageClick);
  // in the quiz, a click on the bubble finishes the line at once
  narratorEl.addEventListener('click', (e) => {
    if (!introActive && speech.typing && !isInteractive(e.target)) speech.finish();
  });
  document.addEventListener('keydown', onKey);
  nextLineBtn.addEventListener('click', advance);
  skipBtn.addEventListener('click', () => endIntro('skip'));
  replayBtn.addEventListener('click', () => {
    track('atoms-intro-replay');
    resetQuiz();
    runIntro();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    nextLineBtn.focus({ preventScroll: true });
  });

  /* -------------------------------------------------------------------- quiz */

  let qi = 0;
  let finished = false;
  let busy = false;

  function setProgress(i: number) {
    countEl.textContent = `Question ${i + 1} of ${quiz.length}`;
    pips.forEach((p, k) => {
      p.toggleAttribute('data-done', k < i || (finished && k <= i));
      p.toggleAttribute('data-current', k === i && !finished);
    });
  }

  function setTag(text: string) {
    tagEl.textContent = text;
    tagEl.style.animation = 'none';
    void tagEl.offsetWidth;
    tagEl.style.animation = '';
  }

  function showQuestion(i: number, enter = true) {
    qi = i;
    const q = quiz[i];
    qEls.forEach((el, k) => {
      el.hidden = k !== i;
      el.removeAttribute('data-enter');
    });
    if (enter && !reduced) {
      void qEls[i].offsetWidth;
      qEls[i].setAttribute('data-enter', '');
    }
    setTag(q.tag);
    setProgress(i);
    nextBtn.hidden = true;
    return q;
  }

  function startQuiz(returning: boolean) {
    moveNarrator(talkSlot, !returning, () => {
      stage!.dataset.mode = 'quiz';
      quizEl.hidden = false;
    });
    if (!reduced) {
      quizEl.removeAttribute('data-enter');
      void quizEl.offsetWidth;
      quizEl.setAttribute('data-enter', '');
    }
    const q = showQuestion(0, false);
    speech.say(returning ? returnLine : q.lead, { mood: 'alarm', pop: true });
    replayBtn.hidden = false;
  }

  function clearAnswer(el: HTMLElement) {
    const tiles = el.querySelector<HTMLElement>('.tiles')!;
    delete tiles.dataset.answered;
    tiles.querySelectorAll('.tile').forEach((t) => t.setAttribute('aria-pressed', 'false'));
    const scene = el.querySelector<HTMLElement>('.scene')!;
    delete scene.dataset.state;
    el.querySelector<HTMLElement>('.sfx-layer')?.removeAttribute('data-play');
  }

  function resetQuiz() {
    finished = false;
    qEls.forEach(clearAnswer);
    againBtn.hidden = true;
    showQuestion(0, false);
  }

  function playSfx(el: HTMLElement, text: string) {
    const layer = el.querySelector<HTMLElement>('.sfx-layer')!;
    layer.querySelector('.sfx')!.textContent = text;
    layer.removeAttribute('data-play');
    void layer.offsetWidth;
    layer.setAttribute('data-play', '');
  }

  function linkButton(a: Answer): HTMLElement[] {
    if (!a.link) return [];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'link-btn';
    b.innerHTML = `${a.link.label} <span aria-hidden="true">→</span>`;
    b.addEventListener('click', () => emit('open-moon', a.link!.moon));
    return [b];
  }

  async function answer(q: Question, a: Answer, tile: HTMLElement) {
    if (busy) return;
    const el = qEls[qi];
    const tiles = el.querySelector<HTMLElement>('.tiles')!;
    track(`atoms-quiz-${q.id}-${a.id}`);
    tiles.querySelectorAll('.tile').forEach((t) => t.setAttribute('aria-pressed', String(t === tile)));
    tiles.dataset.answered = '';
    const scene = el.querySelector<HTMLElement>('.scene')!;
    scene.dataset.state = a.id;

    if (a.crash) {
      busy = true;
      nextBtn.hidden = true;
      speech.say('Wait. Uranium is radioac...', { mood: 'alarm' });
      await sleep(reduced ? 200 : 650);
      await runCrash();
      clearAnswer(el);
      busy = false;
      speech.say(rebootLine, { mood: 'happy', pop: true });
      (tiles.querySelector('.tile') as HTMLElement | null)?.focus({ preventScroll: true });
      return;
    }

    playSfx(el, a.sfx);
    speech.say(a.reply, {
      mood: a.correct ? 'happy' : 'worried',
      extra: a.extra,
      actions: linkButton(a),
      pop: true,
      cps: 64,
    });
    const last = qi === quiz.length - 1;
    nextBtn.querySelector('.label')!.textContent = last ? 'Finish' : 'Next question';
    nextBtn.hidden = false;
  }

  qEls.forEach((el, i) => {
    const q = quiz[i];
    el.querySelectorAll<HTMLButtonElement>('.tile').forEach((tile) => {
      const a = q.answers.find((x) => x.id === tile.dataset.answer)!;
      tile.addEventListener('click', () => answer(q, a, tile));
    });
  });

  nextBtn.addEventListener('click', async () => {
    if (qi < quiz.length - 1) {
      const q = showQuestion(qi + 1);
      speech.say(q.lead, { mood: 'idle', pop: true });
      (qEls[qi].querySelector('.tile') as HTMLElement | null)?.focus({ preventScroll: true });
      // keep the new question in view on small screens
      const top = quizEl.getBoundingClientRect().top;
      if (top < 0) quizEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    finished = true;
    nextBtn.hidden = true;
    setProgress(qi);
    setTag('Done!');
    track('atoms-quiz-finish');
    againBtn.hidden = false;
    const t = speech.say(finishLine, { mood: 'happy', pop: true });
    await t.done;
    await sleep(reduced ? 200 : 650);
    emit('go-explore');
  });

  againBtn.addEventListener('click', () => {
    track('atoms-quiz-again');
    resetQuiz();
    speech.say(quiz[0].lead, { mood: 'alarm', pop: true });
    (qEls[0].querySelector('.tile') as HTMLElement | null)?.focus({ preventScroll: true });
  });

  /* -------------------------------------------------------------------- boot */

  const deepLink = /^#(p|m)-/.test(location.hash);
  if (store.get(SEEN_KEY) || deepLink) {
    startQuiz(true);
    queueMicrotask(() => emit('intro:end'));
  } else {
    runIntro();
  }
}
