/**
 * VENTURES story controller (vanilla, no dependencies).
 * - Fades use the shared [data-reveal] utility that Base.astro loads (scripts/reveal.ts).
 *   This file only adds the Ventures variant: hairlines ([data-vx-line]) that draw in from
 *   the left. Lines are only hidden when <html> has .vx-anim, which the page sets inline
 *   before paint unless the visitor prefers reduced motion.
 * - Active chapter: an IntersectionObserver on a thin band at mid-viewport marks the chapter
 *   being read (rail aria-current + mobile chip) and fires `ventures-ch-<n>` once per chapter.
 * - Progress: one rAF-throttled scroll handler scales the rail/bar fills.
 * - Analytics: `ventures-listview` (once per visit), `ventures-contact`.
 */
import { track } from '../../lib/track';
import { prefersReducedMotion } from '../../lib/motion';

const pad = (n: number) => String(n).padStart(2, '0');

function initLines(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-vx-line]'));
  const root = document.documentElement;
  const drawAll = () => els.forEach((el) => el.classList.add('is-drawn'));

  if (!root.classList.contains('vx-anim') || !('IntersectionObserver' in window)) {
    drawAll();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-drawn');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));

  // If the visitor switches to reduced motion mid-visit, drop the choreography.
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => {
    if (e.matches) {
      root.classList.remove('vx-anim');
      drawAll();
      io.disconnect();
    }
  });
}

function initChapters(): void {
  const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-vx-chapter]'));
  if (!chapters.length) return;

  const railLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-vx-rail]'));
  const bar = document.querySelector<HTMLElement>('[data-vx-bar]');
  const barN = document.querySelector<HTMLElement>('[data-vx-bar-n]');
  const barT = document.querySelector<HTMLElement>('[data-vx-bar-t]');
  const titles = new Map<number, string>(
    chapters.map((c) => [Number(c.dataset.vxChapter), c.querySelector('h2')?.textContent?.trim() ?? '']),
  );
  const seen = new Set<number>();
  let active = 0;

  const setActive = (n: number) => {
    if (n === active) return;
    active = n;
    railLinks.forEach((a) => {
      if (Number(a.dataset.vxRail) === n) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (n && barN && barT) {
      barN.textContent = pad(n);
      barT.textContent = titles.get(n) ?? '';
    }
    if (n && !seen.has(n)) {
      seen.add(n);
      track(`ventures-ch-${n}`);
    }
  };

  if ('IntersectionObserver' in window) {
    // A 2%-tall band just above the middle of the viewport: whichever chapter covers it is active.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number((e.target as HTMLElement).dataset.vxChapter);
          if (e.isIntersecting) setActive(n);
          else if (n === active) {
            // Left the band without another chapter taking over: above ch-1 or below ch-9.
            const above = e.boundingClientRect.top > 0;
            if ((above && n === 1) || (!above && n === chapters.length)) setActive(0);
          }
        }
      },
      { rootMargin: '-44% 0px -54% 0px', threshold: 0 },
    );
    chapters.forEach((c) => io.observe(c));
  }

  // Progress through the whole story.
  const story = document.querySelector<HTMLElement>('[data-vx-story]');
  const fills = Array.from(document.querySelectorAll<HTMLElement>('[data-vx-fill]'));
  if (!story) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const r = story.getBoundingClientRect();
    const vh = window.innerHeight;
    const mid = vh * 0.45;
    const p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
    for (const f of fills) {
      f.style.transform = f.dataset.vxFill === 'y' ? `scaleY(${p.toFixed(4)})` : `scaleX(${p.toFixed(4)})`;
    }
    if (bar) bar.classList.toggle('is-on', r.top < mid && r.bottom > mid);
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function initTracking(): void {
  let listSeen = false;
  const listview = () => {
    if (listSeen) return;
    listSeen = true;
    track('ventures-listview');
  };

  document.querySelectorAll<HTMLElement>('[data-vx-listview]').forEach((a) => a.addEventListener('click', listview));

  const ledger = document.querySelector('[data-vx-ledger]');
  if (ledger && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          listview();
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(ledger);
  }

  document.querySelectorAll<HTMLElement>('[data-vx-contact]').forEach((a) =>
    a.addEventListener('click', () => track('ventures-contact', `ventures-contact-${a.dataset.vxContact}`)),
  );
}

function initSmoothScroll(): void {
  const on = () => document.documentElement.classList.add('vx-smooth');
  for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const) {
    window.addEventListener(ev, on, { once: true, passive: true });
  }
}

export function initVentures(): void {
  // Belt and braces: the inline head script already decided, but re-check in case it did not run.
  if (prefersReducedMotion()) document.documentElement.classList.remove('vx-anim');
  initLines();
  initChapters();
  initTracking();
  initSmoothScroll();
  document.documentElement.classList.add('vx-ready');
}
