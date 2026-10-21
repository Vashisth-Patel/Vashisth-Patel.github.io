/**
 * Game overlay: a dialog with a title bar and an <iframe> pointing at public/bits/games/<id>/.
 * Esc (here or inside the game, via postMessage('close')) or the close button returns focus.
 */
import type { Game } from '../../data/bits';
import { withBase } from '../../lib/url';
import { track } from '../../lib/track';
import { prefersReducedMotion } from '../../lib/motion';

export interface Overlay {
  open(game: Game, returnFocus?: () => void): void;
  close(): void;
  readonly isOpen: boolean;
}

export function createOverlay(root: HTMLElement): Overlay {
  const frame = root.querySelector<HTMLIFrameElement>('[data-frame]')!;
  const name = root.querySelector<HTMLElement>('[data-name]')!;
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-close]')!;
  const loading = root.querySelector<HTMLElement>('[data-loading]')!;
  let restore: (() => void) | undefined;
  let open = false;
  let closeTimer = 0;

  const focusGame = () => {
    try {
      frame.focus();
      frame.contentWindow?.focus();
    } catch {
      /* cross-origin never happens here, but stay safe */
    }
  };

  frame.addEventListener('load', () => {
    if (!open || frame.getAttribute('src') === 'about:blank') return;
    loading.hidden = true;
    root.classList.add('is-loaded');
    focusGame();
  });

  function show(game: Game, returnFocus?: () => void) {
    if (!game.path) return;
    window.clearTimeout(closeTimer);
    restore = returnFocus;
    open = true;
    name.textContent = game.id;
    frame.title = `${game.title}, a game. Press Escape to return to the terminal.`;
    loading.hidden = false;
    loading.textContent = `loading ${game.id} …`;
    root.classList.remove('is-loaded', 'is-closing');
    root.hidden = false;
    document.documentElement.classList.add('bits-overlay-open');
    frame.src = withBase(game.path);
    // Focus the dialog chrome first so Esc works even before the game has loaded.
    closeBtn.focus({ preventScroll: true });
    track(`bits-play-${game.id}`);
  }

  function hide() {
    if (!open) return;
    open = false;
    const finish = () => {
      root.hidden = true;
      root.classList.remove('is-closing', 'is-loaded');
      frame.src = 'about:blank'; // stops game loops and audio
    };
    document.documentElement.classList.remove('bits-overlay-open');
    if (prefersReducedMotion()) finish();
    else {
      root.classList.add('is-closing');
      closeTimer = window.setTimeout(finish, 180);
    }
    restore?.();
  }

  closeBtn.addEventListener('click', hide);
  root.addEventListener('click', (e) => {
    if (e.target === root) hide(); // click on the backdrop
  });
  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin || e.source !== frame.contentWindow) return;
    if (e.data === 'close') hide();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog: close button <-> game.
      e.preventDefault();
      if (document.activeElement === closeBtn) focusGame();
      else closeBtn.focus();
    }
  });

  return {
    open: show,
    close: hide,
    get isOpen() {
      return open;
    },
  };
}
