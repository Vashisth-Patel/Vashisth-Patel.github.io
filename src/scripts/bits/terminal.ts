/**
 * The BITS terminal: one real <input>, a mirrored prompt with a block cursor, an aria-live log,
 * history, tab completion, clickable output and a small "ask" mode for the arcade puzzle.
 * Commands live in commands.ts; this file only knows how to run them.
 */
import { h, sleep, finePointer, session, type Child } from './dom';
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';

export interface CommandCtx {
  raw: string;
  name: string;
  term: Terminal;
}

export interface Command {
  name: string;
  aliases?: string[];
  /** Shown in `help`, e.g. "cat <file>". Commands without one stay out of help. */
  usage?: string;
  desc?: string;
  /** Section in `help`: his work, the games, or terminal basics */
  group?: 'work' | 'games' | 'basics';
  /** Tab-completion candidates for the first argument */
  args?: () => string[];
  /** Analytics suffix; defaults to the name. Arguments are never tracked. */
  event?: string;
  run: (args: string[], out: Out, ctx: CommandCtx) => void | Promise<void>;
}

const PS1 = 'guest@vashisth:~$';

/** Writes one command's output. Every line fades in with a short stagger. */
export class Out {
  private n = 0;
  constructor(
    readonly el: HTMLElement,
    readonly term: Terminal,
  ) {}

  add<T extends HTMLElement>(el: T): T {
    el.classList.add('bt-in');
    el.style.animationDelay = `${Math.min(this.n++ * 14, 300)}ms`;
    this.el.append(el);
    return el;
  }

  line(...kids: Child[]): HTMLElement {
    return this.add(h('div', { class: 'bt-l' }, ...kids));
  }

  /** A line with a class: 'bt-dim' | 'bt-err' | 'bt-warn' | 'bt-ok' ... */
  styled(cls: string, ...kids: Child[]): HTMLElement {
    return this.add(h('div', { class: `bt-l ${cls}` }, ...kids));
  }

  blank(): HTMLElement {
    return this.add(h('div', { class: 'bt-l bt-blank', 'aria-hidden': 'true' }));
  }

  /** A clickable that runs a command (typed into the prompt first). */
  run(label: string, cmd: string = label, cls = ''): HTMLButtonElement {
    return h('button', { type: 'button', class: `bt-k ${cls}`.trim(), 'data-run': cmd, title: cmd }, label);
  }

  /** A clickable that only fills the prompt, for commands that still need an argument. */
  fill(label: string, text: string): HTMLButtonElement {
    return h('button', { type: 'button', class: 'bt-k', 'data-fill': text, title: text }, label);
  }

  link(label: string, href: string, external = false): HTMLAnchorElement {
    return h(
      'a',
      { class: 'bt-k bt-a', href, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null },
      label,
    );
  }

  span(text: string, cls: string): HTMLSpanElement {
    return h('span', { class: cls }, text);
  }
}

export class Terminal {
  readonly root: HTMLElement;
  readonly out: HTMLElement;
  readonly scroller: HTMLElement;
  readonly input: HTMLInputElement;
  private readonly ps1: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly m: { pre: HTMLElement; sel: HTMLElement; cur: HTMLElement; post: HTMLElement; hint: HTMLElement };

  private readonly commands = new Map<string, Command>();
  private readonly list: Command[] = [];
  private fallback: Command['run'] = () => {};

  history: string[] = [];
  private hPos = -1;
  private draft = '';

  private typing = false;
  private skipTyping = false;
  private current: Promise<void> | null = null;
  private asking: { resolve: (v: string | null) => void; out: Out; label: string } | null = null;
  private typingTimer = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.out = root.querySelector<HTMLElement>('[data-out]')!;
    this.scroller = root.querySelector<HTMLElement>('[data-scroll]')!;
    this.input = root.querySelector<HTMLInputElement>('[data-input]')!;
    this.ps1 = root.querySelector<HTMLElement>('[data-ps1]')!;
    this.form = root.querySelector<HTMLFormElement>('[data-prompt]')!;
    const q = (s: string) => root.querySelector<HTMLElement>(s)!;
    this.m = { pre: q('[data-m-pre]'), sel: q('[data-m-sel]'), cur: q('[data-m-cur]'), post: q('[data-m-post]'), hint: q('[data-m-hint]') };

    try {
      const saved = JSON.parse(session.get('bits-history') || '[]');
      if (Array.isArray(saved)) this.history = saved.filter((x) => typeof x === 'string').slice(-100);
    } catch {
      /* ignore corrupt history */
    }

    this.bind();
    this.sync();
  }

  /* ---------- registry ---------- */

  register(cmds: Command[], fallback: Command['run']): void {
    for (const c of cmds) {
      this.list.push(c);
      for (const n of [c.name, ...(c.aliases ?? [])]) this.commands.set(n, c);
    }
    this.fallback = fallback;
  }

  get visibleCommands(): Command[] {
    return this.list.filter((c) => c.usage);
  }

  /* ---------- events ---------- */

  private bind(): void {
    const { input } = this;
    const sync = () => this.sync();

    input.addEventListener('input', () => {
      this.hPos = -1;
      this.markTyping();
      sync();
      this.revealPrompt();
    });
    for (const ev of ['keyup', 'click', 'select', 'focus', 'blur']) input.addEventListener(ev, sync);
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === input) sync();
    });
    input.addEventListener('keydown', (e) => this.onKey(e));

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });

    // Clickable output, chips and completion suggestions.
    this.root.addEventListener('click', (e) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-run],[data-fill]');
      if (!el || !this.root.contains(el)) return;
      e.preventDefault();
      if (el.dataset.run !== undefined) void this.runTyped(el.dataset.run);
      else this.fillPrompt(el.dataset.fill ?? '');
    });

    // Clicking empty screen space focuses the prompt (mouse only: on touch it would pop the keyboard).
    this.scroller.addEventListener('click', (e) => {
      const t = e.target as Element;
      if (t.closest('button, a, input, [data-code], [data-pre]')) return;
      if (window.getSelection()?.toString()) return;
      if (finePointer() || t.closest('[data-prompt]')) this.focus();
    });
  }

  private onKey(e: KeyboardEvent): void {
    if (this.typing) {
      e.preventDefault();
      this.skipTyping = true;
      return;
    }
    const k = e.key;
    const ctrl = e.ctrlKey && !e.metaKey && !e.altKey;

    if (k === 'Enter') {
      e.preventDefault();
      this.submit();
    } else if (k === 'Tab' && !e.shiftKey && this.input.value.trim() && !this.asking) {
      // Empty prompt: Tab moves focus as usual, so keyboard users can leave the terminal.
      e.preventDefault();
      this.complete();
    } else if (k === 'ArrowUp' && !this.asking) {
      e.preventDefault();
      this.historyStep(-1);
    } else if (k === 'ArrowDown' && !this.asking) {
      e.preventDefault();
      this.historyStep(1);
    } else if ((ctrl && k.toLowerCase() === 'l') || (e.metaKey && k.toLowerCase() === 'k')) {
      e.preventDefault();
      this.clear();
    } else if (ctrl && k.toLowerCase() === 'c' && this.input.selectionStart === this.input.selectionEnd) {
      e.preventDefault();
      this.interrupt();
    } else if (k === 'Escape') {
      if (this.asking) this.cancelAsk();
      else this.setValue('');
    } else {
      requestAnimationFrame(() => this.sync());
    }
  }

  private markTyping(): void {
    this.root.classList.add('is-typing');
    clearTimeout(this.typingTimer);
    this.typingTimer = window.setTimeout(() => this.root.classList.remove('is-typing'), 600);
  }

  /* ---------- prompt mirror (block cursor) ---------- */

  sync(): void {
    const v = this.input.value;
    const focused = document.activeElement === this.input;
    const s = this.input.selectionStart ?? v.length;
    const e = this.input.selectionEnd ?? s;
    const { pre, sel, cur, post, hint } = this.m;
    if (focused && e > s) {
      pre.textContent = v.slice(0, s);
      sel.textContent = v.slice(s, e);
      cur.textContent = '';
      post.textContent = v.slice(e);
      cur.hidden = true;
    } else {
      const at = focused ? s : v.length;
      pre.textContent = v.slice(0, at);
      sel.textContent = '';
      cur.textContent = v[at] ?? ' ';
      post.textContent = v.slice(at + 1);
      cur.hidden = false;
    }
    hint.hidden = v.length > 0 || focused || this.typing;
    this.root.classList.toggle('is-focused', focused);
  }

  setValue(v: string): void {
    this.input.value = v;
    const end = v.length;
    try {
      this.input.setSelectionRange(end, end);
    } catch {
      /* not focusable yet */
    }
    this.sync();
  }

  focus(): void {
    this.input.focus({ preventScroll: true });
    this.sync();
  }

  /** Focus the prompt where that doesn't pop a keyboard over the page. */
  softFocus(): void {
    if (finePointer()) this.focus();
  }

  private fillPrompt(text: string): void {
    this.setValue(text);
    this.focus();
    this.revealPrompt();
  }

  /* ---------- running commands ---------- */

  private submit(): void {
    if (this.typing) return;
    const raw = this.input.value;
    if (this.asking) {
      this.setValue('');
      this.answer(raw);
      return;
    }
    if (this.current) return;
    this.setValue('');
    void this.exec(raw);
  }

  /** Type a command into the prompt (fast, skippable), then run it. Used by chips and clickable output. */
  async runTyped(text: string): Promise<void> {
    if (this.typing) return;
    if (this.asking) this.cancelAsk();
    if (this.current) await this.current;
    this.typing = true;
    this.root.classList.add('is-autotyping');
    this.setValue('');
    if (!prefersReducedMotion()) {
      const per = Math.max(9, Math.min(26, 320 / Math.max(1, text.length)));
      for (const ch of text) {
        if (this.skipTyping) break;
        this.setValue(this.input.value + ch);
        await sleep(per * (0.6 + Math.random() * 0.8));
      }
      this.setValue(text);
      if (!this.skipTyping) await sleep(110);
    }
    this.typing = false;
    this.skipTyping = false;
    this.root.classList.remove('is-autotyping');
    this.setValue('');
    await this.exec(text);
  }

  exec(raw: string): Promise<void> {
    const p = this.execInner(raw).finally(() => {
      if (this.current === p) this.current = null;
    });
    this.current = p;
    return p;
  }

  private async execInner(raw: string): Promise<void> {
    const out = this.block(raw);
    const line = raw.trim();
    if (!line) {
      this.settle(out.el);
      return;
    }
    this.pushHistory(line);
    const [first, ...args] = tokenize(line);
    const name = first.toLowerCase();
    const cmd = this.commands.get(name);
    try {
      if (cmd) {
        track(`bits-cmd-${cmd.event ?? cmd.name}`);
        await cmd.run(args, out, { raw: line, name, term: this });
      } else {
        track('bits-cmd-unknown');
        await this.fallback([first, ...args], out, { raw: line, name: first, term: this });
      }
    } catch {
      out.styled('bt-err', 'Something broke. Even this terminal has bugs. Try that again?');
    }
    this.settle(out.el);
  }

  /** A new output block, optionally echoing the command that produced it. */
  block(echo: string | null): Out {
    const el = h('div', { class: 'bt-block' });
    if (echo !== null) {
      el.append(
        h(
          'div',
          { class: 'bt-l bt-echo' },
          h('span', { class: 'bt-ps1', 'aria-hidden': 'true' }, PS1),
          ' ',
          h('span', { class: 'bt-cmd' }, echo),
        ),
      );
    }
    this.out.append(el);
    return new Out(el, this);
  }

  clear(): void {
    this.out.replaceChildren();
    this.scroller.scrollTop = 0;
  }

  private interrupt(): void {
    if (this.asking) {
      this.cancelAsk();
      return;
    }
    const out = this.block(this.input.value + '^C');
    this.setValue('');
    this.settle(out.el);
  }

  /** Keep the newest output readable: long output scrolls to its own top, short output to the prompt. */
  settle(block: HTMLElement): void {
    const sc = this.scroller;
    const promptH = this.form.offsetHeight + 24;
    if (block.offsetHeight + promptH > sc.clientHeight) {
      sc.scrollTop = Math.max(0, block.offsetTop - 12);
    } else {
      sc.scrollTop = sc.scrollHeight;
    }
  }

  /** Put an element at the top of the screen (used to keep the welcome text in view). */
  scrollTo(el: HTMLElement): void {
    this.scroller.scrollTop = Math.max(0, el.offsetTop - 12);
  }

  revealPrompt(): void {
    const sc = this.scroller;
    const bottom = this.form.offsetTop + this.form.offsetHeight + 16;
    if (bottom > sc.scrollTop + sc.clientHeight) sc.scrollTop = bottom - sc.clientHeight;
  }

  /* ---------- ask mode (arcade puzzle) ---------- */

  ask(out: Out, label: string): Promise<string | null> {
    this.ps1.textContent = label;
    this.root.classList.add('is-asking');
    this.input.setAttribute('aria-label', 'Your answer');
    this.settle(out.el);
    this.softFocus();
    return new Promise((resolve) => {
      this.asking = { resolve, out, label };
    });
  }

  private endAsk() {
    const a = this.asking;
    this.asking = null;
    this.ps1.textContent = PS1;
    this.root.classList.remove('is-asking');
    this.input.setAttribute('aria-label', 'Terminal command');
    return a;
  }

  answer(raw: string): void {
    const a = this.endAsk();
    if (!a) return;
    a.out.line(h('span', { class: 'bt-ps1', 'aria-hidden': 'true' }, a.label), ' ', h('span', { class: 'bt-cmd' }, raw));
    a.resolve(raw);
  }

  cancelAsk(): void {
    const a = this.endAsk();
    if (!a) return;
    a.out.line(h('span', { class: 'bt-ps1', 'aria-hidden': 'true' }, a.label), ' ', h('span', { class: 'bt-dim' }, '^C'));
    a.resolve(null);
  }

  get isAsking(): boolean {
    return this.asking !== null;
  }

  /* ---------- history ---------- */

  private pushHistory(line: string): void {
    if (this.history[this.history.length - 1] !== line) this.history.push(line);
    if (this.history.length > 100) this.history.shift();
    this.hPos = -1;
    session.set('bits-history', JSON.stringify(this.history));
  }

  private historyStep(dir: -1 | 1): void {
    const n = this.history.length;
    if (!n) return;
    if (this.hPos === -1) {
      if (dir === 1) return;
      this.draft = this.input.value;
      this.hPos = n - 1;
    } else {
      this.hPos += dir;
    }
    if (this.hPos >= n) {
      this.hPos = -1;
      this.setValue(this.draft);
      return;
    }
    this.hPos = Math.max(0, this.hPos);
    this.setValue(this.history[this.hPos]);
  }

  /* ---------- tab completion ---------- */

  private complete(): void {
    const v = this.input.value;
    const caret = this.input.selectionStart ?? v.length;
    const before = v.slice(0, caret);
    const after = v.slice(caret);
    const parts = before.replace(/^\s+/, '').split(/\s+/);
    const isCmd = parts.length <= 1;
    const prefix = (parts[parts.length - 1] ?? '').toLowerCase();

    let pool: string[];
    if (isCmd) {
      pool = this.visibleCommands.map((c) => c.name);
    } else {
      const cmd = this.commands.get(parts[0].toLowerCase());
      pool = cmd?.args?.() ?? [];
    }
    const matches = [...new Set(pool)].filter((c) => c.startsWith(prefix)).sort();
    if (!matches.length) {
      this.root.classList.remove('is-nomatch');
      void this.root.offsetWidth;
      this.root.classList.add('is-nomatch');
      return;
    }
    const head = before.slice(0, before.length - prefix.length);
    if (matches.length === 1) {
      const m = matches[0];
      this.setValue(head + m + (m.endsWith('/') ? '' : ' ') + after.replace(/^\s+/, ''));
      return;
    }
    const common = commonPrefix(matches);
    if (common.length > prefix.length) {
      this.setValue(head + common + after);
      return;
    }
    const out = this.block(v);
    const row = h('div', { class: 'bt-l bt-cols' });
    for (const m of matches) row.append(out.fill(m, head + m + ' '));
    out.add(row);
    this.settle(out.el);
  }
}

/* ---------- helpers ---------- */

export function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

function commonPrefix(xs: string[]): string {
  let p = xs[0];
  for (const x of xs) while (!x.startsWith(p)) p = p.slice(0, -1);
  return p;
}

export { PS1 };
