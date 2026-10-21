/**
 * Reveal-on-scroll for any element with [data-reveal] (optional style="--delay:120ms").
 * Loaded by Base.astro on every page. Without JS, or with reduced motion, content is visible.
 */
import { prefersReducedMotion } from '../lib/motion';

const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
  els.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}
