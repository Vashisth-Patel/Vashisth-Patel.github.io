/**
 * BITS page entry: boot sequence, terminal, overlay, plain view toggle, arcade lock state.
 */
import { bootLines, games } from '../../data/bits';
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';
import { initWarpLinks } from '../warp';
import { h, session, finePointer } from './dom';
import { Terminal } from './terminal';
import { createCommands, type App } from './commands';
import { createOverlay } from './overlay';

const shell = document.querySelector<HTMLElement>('[data-bits-term]');
const overlayEl = document.querySelector<HTMLElement>('[data-bits-overlay]');
const plainEl = document.querySelector<HTMLElement>('[data-bits-plain]');

if (shell && overlayEl && plainEl) init(shell, overlayEl, plainEl);

function init(shell: HTMLElement, overlayEl: HTMLElement, plainEl: HTMLElement) {
  initWarpLinks();
  const html = document.documentElement;
  const term = new Terminal(shell);
  const overlay = createOverlay(overlayEl);
  const lockEl = shell.querySelector<HTMLElement>('[data-lock]');
  const toggles = document.querySelectorAll<HTMLButtonElement>('[data-view-toggle]');

  /* ---------- arcade lock ---------- */
  const isUnlocked = () => session.get('bits-arcade') === 'unlocked';
  const paintLock = () => {
    if (!lockEl) return;
    const u = isUnlocked();
    lockEl.textContent = u ? 'arcade: open' : 'arcade: locked';
    lockEl.classList.toggle('is-open', u);
  };
  paintLock();

  /* ---------- inert background while a game is open ---------- */
  let inerted: HTMLElement[] = [];
  const setInert = (on: boolean) => {
    if (!on) {
      inerted.forEach((el) => (el.inert = false));
      inerted = [];
      return;
    }
    let node: HTMLElement | null = overlayEl;
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sib of Array.from(parent.children) as HTMLElement[]) {
        if (sib !== node && !sib.inert && sib.tagName !== 'SCRIPT') {
          sib.inert = true;
          inerted.push(sib);
        }
      }
      node = parent;
    }
  };

  let lastOpener: Element | null = null;
  document.addEventListener('pointerdown', (e) => (lastOpener = e.target as Element), true);
  document.addEventListener('keydown', () => (lastOpener = document.activeElement), true);

  const app: App = {
    openGame(game, from) {
      const guess = from ?? lastOpener;
      const opener = guess instanceof HTMLElement && guess !== document.body ? guess : null;
      setInert(true);
      overlay.open(game, () => {
        setInert(false);
        // Back to the prompt with a keyboard/mouse; on touch, back to whatever opened the game.
        if (html.dataset.bitsView === 'plain' && opener?.isConnected) opener.focus({ preventScroll: true });
        else if (finePointer() || !opener?.isConnected || !(opener instanceof HTMLButtonElement)) term.focus();
        else opener.focus({ preventScroll: true });
      });
    },
    setView,
    isUnlocked,
    unlock() {
      session.set('bits-arcade', 'unlocked');
      track('bits-arcade-unlocked');
      paintLock();
    },
  };

  const { commands, fallback } = createCommands(app);
  term.register(commands, fallback);

  /* ---------- plain view ---------- */
  function setView(view: 'plain' | 'term') {
    if ((html.dataset.bitsView ?? 'term') === view) return;
    html.dataset.bitsView = view;
    try {
      history.replaceState(null, '', view === 'plain' ? '#plain' : window.location.pathname + window.location.search);
    } catch {
      /* sandboxed */
    }
    if (view === 'plain') {
      track('bits-plainview');
      window.scrollTo(0, 0);
      plainEl.querySelector<HTMLElement>('[data-plain-heading]')?.focus({ preventScroll: true });
    } else {
      term.softFocus();
      term.settle(term.out.lastElementChild as HTMLElement ?? term.out);
    }
  }
  toggles.forEach((b) =>
    b.addEventListener('click', () => setView(html.dataset.bitsView === 'plain' ? 'term' : 'plain')),
  );
  // The head script already switched to plain view for /bits/#plain links.
  if (html.dataset.bitsView === 'plain') track('bits-plainview');

  // Plain view "play" buttons skip the puzzle: the list view is for people who just want to see things.
  plainEl.addEventListener('click', (e) => {
    const t = e.target as Element;
    const b = t.closest<HTMLElement>('[data-play]');
    if (b) {
      const g = games.find((x) => x.id === b.dataset.play);
      if (g) app.openGame(g, b);
      return;
    }
    // "Original source" links: read it in the terminal (the raw file is the no-JS fallback).
    const r = t.closest<HTMLElement>('[data-term-run]');
    if (r?.dataset.termRun && !(e as MouseEvent).metaKey && !(e as MouseEvent).ctrlKey) {
      e.preventDefault();
      setView('term');
      void term.runTyped(r.dataset.termRun);
    }
  });

  /* ---------- page-level keys ---------- */
  document.addEventListener('keydown', (e) => {
    if (overlay.isOpen || html.dataset.bitsView === 'plain') return;
    const t = e.target as HTMLElement;
    if (t === term.input || t.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) term.focus(); // type anywhere
  });

  /* ---------- the visible viewport (mobile keyboards) ---------- */
  const vv = window.visualViewport;
  const setVh = () => html.style.setProperty('--bits-vh', `${Math.round(vv ? vv.height : window.innerHeight)}px`);
  setVh();
  vv?.addEventListener('resize', () => {
    setVh();
    if (document.activeElement === term.input) term.revealPrompt();
  });

  void boot(term, shell);
}

/* ---------- boot ---------- */

async function boot(term: Terminal, shell: HTMLElement) {
  const again = session.get('bits-booted') === '1';
  const instant = prefersReducedMotion() || again;
  let skip = instant;
  const waits = new Set<() => void>();
  const wait = (ms: number) =>
    skip
      ? Promise.resolve()
      : new Promise<void>((r) => {
          const done = () => {
            waits.delete(done);
            clearTimeout(id);
            r();
          };
          const id = window.setTimeout(done, ms);
          waits.add(done);
        });
  const doSkip = () => {
    if (skip) return;
    skip = true;
    waits.forEach((d) => d());
  };
  window.addEventListener('keydown', doSkip, { once: true });
  window.addEventListener('pointerdown', doSkip, { once: true });

  if (!instant) shell.classList.add('is-powering');
  shell.dataset.state = 'booting';
  await wait(260);
  const out = term.block(null);
  out.styled('bt-bios', bootLines[0].text);
  await wait(200);
  for (const l of bootLines.slice(1)) {
    const tag = h('span', { class: 'bt-tag is-pending' }, '[ .. ]');
    out.line(tag, ' ', l.text);
    await wait(170);
    tag.textContent = '[ ok ]';
    tag.classList.remove('is-pending');
    await wait(110);
  }
  const welcome = out.line(
    again ? 'Welcome back. Type ' : 'Welcome. Type ',
    out.run('help'),
    ', or click anything that looks clickable.',
  );
  // Plain words for visitors who have never used a terminal.
  const arrow = () => h('span', { class: 'bt-ok', 'aria-hidden': 'true' }, '→ ');
  if (again) {
    out.line(arrow(), 'Not a terminal person? The same content as a normal page: ', out.run('plain view', 'plain'));
  } else {
    out.add(
      h(
        'div',
        { class: 'bt-guide' },
        h('div', { class: 'bt-l bt-guide-title' }, 'Never used a terminal? Nothing to learn:'),
        h('div', { class: 'bt-l' }, arrow(), 'No typing needed. Click anything ', h('span', { class: 'bt-ok' }, 'green'), ', or use the buttons at the bottom.'),
        h('div', { class: 'bt-l' }, arrow(), out.run('projects/', 'ls projects'), ' is his work. Click a name for a short, plain write-up.'),
        h('div', { class: 'bt-l' }, arrow(), out.run('arcade/', 'games'), ' is small games he built while learning to code. Just for fun.'),
        h('div', { class: 'bt-l' }, arrow(), 'Prefer a normal web page? ', out.run('plain view', 'plain'), '.'),
      ),
    );
  }
  shell.classList.remove('is-powering');
  window.removeEventListener('keydown', doSkip);
  window.removeEventListener('pointerdown', doSkip);
  session.set('bits-booted', '1');
  shell.dataset.state = 'ready';
  await wait(160);
  if (skip) await term.exec('ls');
  else await term.runTyped('ls');
  // If the listing pushed the welcome off screen, bring the welcome and guide back into view.
  if (term.scroller.scrollTop > welcome.offsetTop) term.scrollTo(welcome);
  term.softFocus();
}
