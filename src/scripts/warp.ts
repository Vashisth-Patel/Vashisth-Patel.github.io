/**
 * Page transitions. Any <a data-warp href="..."> (or a call to warpTo(href)) plays the
 * starfield warp when a starfield is mounted, otherwise a quick fade, then navigates.
 * Modifier-clicks, new tabs and reduced-motion visitors navigate normally.
 */
import { prefersReducedMotion } from '../lib/motion';

const VEIL_ID = 'warp-veil';

function veil(): HTMLElement {
  let el = document.getElementById(VEIL_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = VEIL_ID;
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      pointerEvents: 'none',
      background: 'var(--bg, #05060a)',
      opacity: '0',
      transition: 'opacity 380ms cubic-bezier(0.65,0,0.35,1)',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);
  }
  return el;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function warpTo(href: string): Promise<void> {
  if (prefersReducedMotion()) {
    window.location.href = href;
    return;
  }
  const v = veil();
  const sf = window.__starfield;
  if (sf) {
    const done = sf.warp(720);
    await sleep(380);
    v.style.opacity = '1';
    await done;
  } else {
    v.style.opacity = '1';
    await sleep(380);
  }
  window.location.href = href;
}

export function initWarpLinks(): void {
  const w = window as Window & { __warpBound?: boolean };
  if (w.__warpBound) return;
  w.__warpBound = true;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[data-warp]') as HTMLAnchorElement | null;
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    void warpTo(url.href);
  });

  // Coming back via the back button (bfcache): clear the veil.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const v = document.getElementById(VEIL_ID);
      if (v) v.style.opacity = '0';
    }
  });
}
