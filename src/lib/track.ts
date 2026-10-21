/**
 * Analytics events (GoatCounter, cookieless). Safe to call anywhere: a no-op when the
 * script is not loaded (local dev, ad blockers). Event names are kebab-case paths, e.g.
 *   track('door-atoms'), track('quiz-einstein-boron'), track('term-cmd-play'), track('ventures-ch-6')
 */
export function track(event: string, title?: string): void {
  try {
    const gc = (window as any).goatcounter;
    if (gc && typeof gc.count === 'function') {
      gc.count({ path: event, title: title ?? event, event: true });
    }
    if (import.meta.env.DEV) console.debug('[track]', event);
  } catch {
    /* never let analytics break the page */
  }
}
