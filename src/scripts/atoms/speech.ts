/**
 * The narrator's voice: types a line into the speech bubble (sized up front by a hidden ghost copy,
 * so the bubble never jumps), flaps the mouth, mirrors the full line into an aria-live region,
 * and can append extras (a follow-up line, a button) once the line has finished.
 */
import { Narrator, type Mood } from './narrator';
import { plain, renderInstant, typeInto, type Typing } from './typer';

export interface SayOptions {
  mood?: Mood;
  /** A smaller follow-up line shown after the main line. */
  extra?: string;
  /** Extra controls appended after typing (buttons, links). */
  actions?: HTMLElement[];
  /** Replay the little bubble pop. */
  pop?: boolean;
  /** Characters per second. */
  cps?: number;
}

export class Speech {
  readonly root: HTMLElement;
  readonly narrator: Narrator;
  private bubble: HTMLElement;
  private ghost: HTMLElement;
  private typed: HTMLElement;
  private extra: HTMLElement;
  private live: HTMLElement;
  private current: Typing | null = null;

  constructor() {
    this.root = document.getElementById('narrator')!;
    this.bubble = document.getElementById('narrator-bubble')!;
    this.ghost = document.getElementById('narrator-ghost')!;
    this.typed = document.getElementById('narrator-typed')!;
    this.extra = document.getElementById('narrator-extra')!;
    this.live = document.getElementById('narrator-live')!;
    this.narrator = new Narrator(document.getElementById('narrator-atom') as unknown as SVGSVGElement);
  }

  get typing() {
    return !!this.current?.typing;
  }

  finish() {
    this.current?.finish();
  }

  say(text: string, opts: SayOptions = {}): Typing {
    this.current?.cancel();
    const { mood = 'idle', extra, actions = [], pop, cps = 38 } = opts;

    renderInstant(this.ghost, text);
    this.extra.textContent = '';
    if (extra) {
      // reserve the space now so the bubble doesn't grow later
      const p = document.createElement('p');
      p.className = 'extra-line';
      p.textContent = extra;
      p.style.visibility = 'hidden';
      this.extra.append(p);
    }
    this.root.dataset.typing = '';
    delete this.root.dataset.ready;
    this.live.textContent = plain(text) + (extra ? ` ${extra}` : '');

    if (pop) {
      this.bubble.classList.remove('pop');
      void this.bubble.offsetWidth;
      this.bubble.classList.add('pop');
    }

    this.narrator.setMood(mood);
    this.narrator.talk(true);
    const t = typeInto(this.typed, text, cps);
    this.current = t;
    t.done.then(() => {
      if (this.current !== t) return;
      this.narrator.talk(false);
      delete this.root.dataset.typing;
      this.root.dataset.ready = '';
      const line = this.extra.querySelector<HTMLElement>('.extra-line');
      if (line) {
        line.style.visibility = '';
        line.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
          duration: 380,
          easing: 'ease-out',
        });
      }
      for (const a of actions) this.extra.append(a);
    });
    return t;
  }
}
