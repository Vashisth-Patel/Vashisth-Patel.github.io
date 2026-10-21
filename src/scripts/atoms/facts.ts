/**
 * Random fact bubbles. One at a time, first ~8 s after the intro, then every 20–30 s.
 * Each lives ~8 s (paused while hovered or focused) or until clicked. Never covers the quiz,
 * the narrator during the intro, or an open card; silent while anything is paused (intro, crash,
 * planet view, card). Reduced motion: no pop, always the bottom-left corner.
 */
import { facts } from '../../data/atoms';
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';
import { isPaused, on } from './bus';

const LIFE = 8000;
const FIRST = 8000;
const GAP_MIN = 20000;
const GAP_MAX = 30000;
const NAV = 76;
const M = 16;

interface Box { l: number; t: number; r: number; b: number }

const tail = `<svg class="atm-tail" viewBox="0 0 38 36" aria-hidden="true"><path class="fill" d="M0 0 H34 V4 C26 14 14 24 3 35 C7 24 6 13 0 4 Z"/><path class="line" d="M0 4 C6 13 7 24 3 35 C14 24 26 14 34 4"/></svg>`;
const speaker = `<span class="atm-fact__speaker" aria-hidden="true"><svg viewBox="-20 -20 40 40"><g class="spin"><ellipse class="orb" rx="17" ry="6"/><circle class="el" cx="17" cy="0" r="2.6"/></g><g class="spin"><ellipse class="orb" rx="17" ry="6" transform="rotate(60)"/><circle class="el" cx="-8.5" cy="-14.7" r="2.6"/></g><circle class="nuc" r="6.5"/></svg></span>`;

export function initFacts() {
  const host = document.getElementById('facts');
  if (!host) return;
  const reduced = prefersReducedMotion();
  const order = [...facts.keys()].sort(() => Math.random() - 0.5);
  let next = 0;
  let timer = 0;
  let current: HTMLElement | null = null;
  let started = false;

  const rect = (el: Element | null): Box | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  };
  const hit = (a: Box, b: Box, pad = 14) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
  const onScreen = (b: Box) => b.b > 0 && b.t < window.innerHeight;

  function hardZones(): Box[] {
    const zones: (Box | null)[] = [];
    const stage = document.getElementById('stage');
    if (stage?.dataset.mode === 'intro') zones.push(rect(document.getElementById('intro-slot')));
    const quiz = document.getElementById('quiz');
    if (quiz && !quiz.hidden) zones.push(rect(quiz.querySelector('.panel')));
    const card = document.getElementById('card');
    if (card && !card.hidden) zones.push(rect(card));
    zones.push(rect(document.querySelector('.viewtoggle')));
    return zones.filter((z): z is Box => !!z && onScreen(z));
  }

  function softZones(): Box[] {
    return [...document.querySelectorAll('.planet-item, .sun, .pc, .portal, .outro__line, .system__intro')]
      .map(rect)
      .filter((z): z is Box => !!z && onScreen(z));
  }

  function place(el: HTMLElement): boolean {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight + 66; // the speaker hangs below
    const hard = hardZones();
    const soft = softZones();
    const maxL = vw - w - M;
    const maxT = vh - h - M;
    if (maxL < M - 1 || maxT < NAV) return false;

    type C = { l: number; t: number; side: 'left' | 'right' };
    const jitter = (n: number) => (reduced ? 0 : (Math.random() - 0.5) * n);
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    let cands: C[] = reduced
      ? [{ l: M, t: maxT, side: 'left' }]
      : [
          { l: M + 8, t: NAV + 20, side: 'left' },
          { l: maxL - 8, t: NAV + 20, side: 'right' },
          { l: M + 8, t: (vh - h) / 2, side: 'left' },
          { l: maxL - 8, t: (vh - h) / 2, side: 'right' },
          { l: M + 8, t: maxT - 8, side: 'left' },
          { l: maxL - 8, t: maxT - 8, side: 'right' },
          { l: vw * 0.25, t: maxT - 8, side: 'left' },
          { l: vw * 0.55, t: NAV + 20, side: 'right' },
        ].map((c) => ({ ...c, l: clamp(c.l + jitter(60), M, maxL), t: clamp(c.t + jitter(80), NAV, maxT) }));
    cands = cands.sort(() => Math.random() - 0.5);

    let best: C | null = null;
    let bestSoft = Infinity;
    for (const c of cands) {
      const box = { l: c.l, t: c.t, r: c.l + w, b: c.t + h };
      if (hard.some((z) => hit(box, z))) continue;
      const s = soft.filter((z) => hit(box, z, 6)).length;
      if (s < bestSoft) {
        best = c;
        bestSoft = s;
        if (s === 0) break;
      }
    }
    if (!best) return false;
    el.style.transform = '';
    el.style.left = `${Math.round(best.l)}px`;
    el.style.top = `${Math.round(best.t)}px`;
    el.dataset.side = best.side;
    el.style.setProperty('--ox', best.side === 'right' ? '85%' : '15%');
    return true;
  }

  function schedule(ms: number) {
    clearTimeout(timer);
    timer = window.setTimeout(show, ms);
  }

  function show() {
    if (current) return;
    if (isPaused() || document.hidden) {
      schedule(3000);
      return;
    }
    const idx = order[next % order.length];
    const el = document.createElement('aside');
    el.className = 'atm-fact atm-bubble';
    el.setAttribute('aria-label', 'Materials fact');
    el.style.setProperty('--life', `${LIFE}ms`);
    el.innerHTML = `<span class="atm-fact__tag" aria-hidden="true">Psst!</span><p class="atm-fact__text"></p><button class="atm-fact__close" type="button" aria-label="Dismiss fact"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8"/></svg></button><span class="atm-fact__timer" aria-hidden="true"></span>${tail}${speaker}`;
    el.querySelector('.atm-fact__text')!.textContent = facts[idx];
    el.style.visibility = 'hidden';
    host!.appendChild(el);
    if (!place(el)) {
      el.remove();
      schedule(6000);
      return;
    }
    next++;
    el.style.visibility = '';
    if (!reduced) el.setAttribute('data-in', '');
    current = el;
    track('atoms-fact-show');

    let remaining = LIFE;
    let since = performance.now();
    let life = window.setTimeout(() => dismiss(false), remaining);
    const hold = () => {
      if (el.hasAttribute('data-hold')) return;
      el.setAttribute('data-hold', '');
      clearTimeout(life);
      remaining -= performance.now() - since;
    };
    const release = () => {
      if (el.matches(':hover') || el.contains(document.activeElement)) return;
      el.removeAttribute('data-hold');
      since = performance.now();
      clearTimeout(life);
      life = window.setTimeout(() => dismiss(false), Math.max(1200, remaining));
    };
    el.addEventListener('mouseenter', hold);
    el.addEventListener('mouseleave', release);
    el.addEventListener('focusin', hold);
    el.addEventListener('focusout', () => setTimeout(release, 0));
    el.addEventListener('click', () => dismiss(true));
    el.addEventListener('keydown', (e) => e.key === 'Escape' && dismiss(true));
    (el as HTMLElement & { _stop?: () => void })._stop = () => clearTimeout(life);
  }

  function dismiss(byUser: boolean) {
    const el = current as (HTMLElement & { _stop?: () => void }) | null;
    if (!el) return;
    current = null;
    el._stop?.();
    if (byUser) track('atoms-fact-dismiss');
    const hadFocus = el.contains(document.activeElement);
    if (reduced) el.remove();
    else {
      el.removeAttribute('data-in');
      el.setAttribute('data-out', '');
      setTimeout(() => el.remove(), 300);
    }
    if (hadFocus) (document.getElementById('main') as HTMLElement | null)?.focus?.({ preventScroll: true });
    schedule(GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN));
  }

  // hide at once when something important opens, and when scrolling brings the quiz underneath
  const check = () => {
    if (!current) return;
    if (isPaused()) {
      dismiss(false);
      return;
    }
    const box = rect(current);
    if (box && hardZones().some((z) => hit(box, z, 4))) dismiss(false);
  };
  window.addEventListener('scroll', () => requestAnimationFrame(check), { passive: true });
  window.addEventListener('resize', check);
  setInterval(check, 500);

  on('intro:end', () => {
    if (started) return;
    started = true;
    schedule(FIRST);
  });
}
