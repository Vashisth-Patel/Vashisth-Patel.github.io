/**
 * Tiny coordination layer for the Atoms page.
 * - pause/resume: reasons that silence the random fact bubbles (intro, crash, planet view, card).
 * - emit/on: cross-module events (quiz asks the system to open a moon, intro ends, ...).
 * - store: sessionStorage that never throws.
 */
const reasons = new Set<string>();
const target = new EventTarget();

export function pause(reason: string) {
  reasons.add(reason);
  target.dispatchEvent(new Event('pause-change'));
}
export function resume(reason: string) {
  reasons.delete(reason);
  target.dispatchEvent(new Event('pause-change'));
}
export const isPaused = () => reasons.size > 0;

export function emit<T>(name: string, detail?: T) {
  target.dispatchEvent(new CustomEvent(name, { detail }));
}
export function on<T>(name: string, fn: (detail: T) => void) {
  target.addEventListener(name, (e) => fn((e as CustomEvent<T>).detail));
}

export const store = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* private mode: fine */
    }
  },
};

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
