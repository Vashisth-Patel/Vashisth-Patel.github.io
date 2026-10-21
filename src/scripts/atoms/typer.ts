/**
 * Typewriter for the speech bubbles. Supports *emphasis*. Pauses a beat on punctuation.
 * finish() completes the line at once (click/Space while typing). Reduced motion: instant.
 */
import { prefersReducedMotion } from '../../lib/motion';

export interface Typing {
  done: Promise<void>;
  finish(): void;
  cancel(): void;
  readonly typing: boolean;
}

interface Seg { text: string; em: boolean }

export function parse(text: string): Seg[] {
  return text.split(/(\*[^*]+\*)/).filter(Boolean).map((t) =>
    t.startsWith('*') && t.endsWith('*') ? { text: t.slice(1, -1), em: true } : { text: t, em: false },
  );
}

/** Plain text (for aria-live and analytics). */
export const plain = (text: string) => text.replace(/\*/g, '');

/** Render the full line at once. */
export function renderInstant(el: HTMLElement, text: string) {
  el.textContent = '';
  for (const s of parse(text)) {
    if (s.em) {
      const em = document.createElement('em');
      em.textContent = s.text;
      el.append(em);
    } else el.append(s.text);
  }
}

export function typeInto(el: HTMLElement, text: string, cps = 38): Typing {
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  let timer = 0;
  let active = true;

  const finishNow = () => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    renderInstant(el, text);
    resolve();
  };

  if (prefersReducedMotion()) {
    queueMicrotask(finishNow);
    return { done, finish: finishNow, cancel: finishNow, get typing() { return active; } };
  }

  el.textContent = '';
  const segs = parse(text);
  let si = 0;
  let ci = 0;
  let node: Text | null = null;
  const base = 1000 / cps;

  const step = () => {
    if (!active) return;
    const seg = segs[si];
    if (!seg) {
      active = false;
      resolve();
      return;
    }
    if (!node) {
      node = document.createTextNode('');
      if (seg.em) {
        const em = document.createElement('em');
        em.append(node);
        el.append(em);
      } else el.append(node);
    }
    const ch = seg.text[ci++];
    node.data += ch;
    if (ci >= seg.text.length) {
      si++;
      ci = 0;
      node = null;
    }
    const next = seg.text[ci] ?? '';
    const boundary = next === ' ' || next === '' || next === ')';
    let wait = base;
    if (/[.!?]/.test(ch) && boundary) wait = base * 7;
    else if ((ch === ',' || ch === ':') && boundary) wait = base * 4;
    else if (ch === '.' && next === '.') wait = base * 3;
    timer = window.setTimeout(step, wait);
  };
  timer = window.setTimeout(step, 60);

  return {
    done,
    finish: finishNow,
    cancel: () => {
      active = false;
      clearTimeout(timer);
      resolve();
    },
    get typing() {
      return active;
    },
  };
}
