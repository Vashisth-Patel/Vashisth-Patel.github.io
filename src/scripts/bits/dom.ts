/** Tiny DOM helpers for the BITS terminal. Text is always set as text, never as HTML. */

export type Child = Node | string | number | null | undefined | false;

type Props = Record<string, string | number | boolean | null | undefined | EventListener>;

/** h('div', { class: 'x', 'aria-hidden': 'true', onclick: fn }, 'text', node) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2), v as EventListener);
      } else if (k === 'class') {
        el.className = String(v);
      } else {
        el.setAttribute(k, v === true ? '' : String(v));
      }
    }
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: (Child | Child[])[]): void {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function finePointer(): boolean {
  return window.matchMedia('(pointer: fine)').matches;
}

/** sessionStorage that never throws (private mode, blocked storage). */
export const session = {
  get(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* storage blocked: state just won't persist */
    }
  },
};
