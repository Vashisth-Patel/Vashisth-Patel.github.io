/**
 * Every BITS command. Content comes from src/data/bits.ts; this file only formats it.
 */
import { projects, games, bugs, srcFiles, whoami, readme, puzzle, type Block, type Game, type Project, type SrcFile } from '../../data/bits';
import { site } from '../../data/site';
import { withBase } from '../../lib/url';
import { prefersReducedMotion } from '../../lib/motion';
import { warpTo } from '../warp';
import { h } from './dom';
import { highlightLine } from './highlight';
import { portrait } from './portrait';
import type { Command, CommandCtx, Out } from './terminal';

export interface App {
  /** `from` gets focus back on touch screens and in the plain view. */
  openGame(game: Game, from?: Element | null): void;
  setView(view: 'plain' | 'term'): void;
  isUnlocked(): boolean;
  unlock(): void;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/^(\.\/|~\/)/, '')
    .replace(/^(projects|arcade|src)\//, '')
    .replace(/\/$/, '');

const findProject = (s: string): Project | undefined => {
  const id = norm(s).replace(/\.(md|txt)$/, '');
  return projects.find((p) => p.id === id);
};

const findGame = (s: string): Game | undefined => {
  const id = norm(s).replace(/_/g, '-').replace(/\.(py|js|html)$/, '');
  return games.find((g) => g.id === id || g.title.toLowerCase().replace(/\s+/g, '-') === id);
};

const findSrc = (s: string): SrcFile | undefined => {
  const n = norm(s);
  return srcFiles.find((f) => f.name === n || f.name === n.replace(/-/g, '_'));
};

const playable = () => games.filter((g) => g.status === 'playable');

/* ---------- shared renderers ---------- */

function grid(out: Out, rows: [Node | string, Node | string][], cls = ''): HTMLElement {
  const g = h('div', { class: `bt-grid ${cls}`.trim() });
  for (const [a, b] of rows) g.append(h('div', { class: 'bt-c1' }, a), h('div', { class: 'bt-c2' }, b));
  return out.add(g);
}

function tries(out: Out, cmds: string[], label = 'try'): void {
  const row = h('div', { class: 'bt-l bt-try' }, h('span', { class: 'bt-dim' }, `${label}:`));
  for (const c of cmds) row.append(' ', out.run(c));
  out.add(row);
}

function renderBlocks(out: Out, blocks: Block[]): void {
  for (const b of blocks) {
    switch (b.kind) {
      case 'tldr':
        out.add(h('p', { class: 'bt-l bt-tldr' }, h('span', { class: 'bt-tldr-k' }, 'In short: '), b.text));
        break;
      case 'p':
        out.add(h('p', { class: 'bt-l bt-p' }, b.text));
        break;
      case 'h':
        out.add(h('div', { class: 'bt-l bt-h' }, b.text));
        break;
      case 'pre':
        out.add(
          h(
            'div',
            { class: 'bt-figure' },
            h('pre', { class: 'bt-pre', 'aria-hidden': 'true', 'data-pre': '' }, b.text),
            h('p', { class: 'sr-only' }, b.label),
          ),
        );
        break;
      case 'kv':
        grid(out, b.rows.map(([k, v]) => [h('span', { class: 'bt-key' }, k), v]), 'bt-kv');
        break;
      case 'bars': {
        const max = Math.max(...b.rows.map((r) => r[1]));
        const g = h('div', { class: 'bt-meters' });
        for (const [label, v] of b.rows) {
          g.append(
            h(
              'div',
              { class: 'bt-meter-row' },
              h('span', { class: 'bt-meter-label' }, label),
              h('span', { class: 'bt-meter', 'aria-hidden': 'true' }, h('i', { style: `--w:${(v / max) * 100}%` })),
              h('span', { class: 'bt-meter-v' }, `${v} ${b.unit}`),
            ),
          );
        }
        out.add(g);
        break;
      }
      case 'list':
        for (const item of b.items) out.line(h('span', { class: 'bt-dim' }, '• '), item);
        break;
      case 'try':
        tries(out, b.cmds);
        break;
    }
  }
}

function project(out: Out, p: Project): void {
  out.add(
    h(
      'div',
      { class: 'bt-doc-head' },
      h('div', { class: 'bt-l bt-file' }, `${p.id}.md`),
      h('div', { class: 'bt-l bt-title' }, p.title),
      h('div', { class: 'bt-l bt-dim' }, p.meta),
    ),
  );
  renderBlocks(out, p.body);
}

const srcCache = new Map<string, Promise<string>>();

async function source(out: Out, f: SrcFile): Promise<void> {
  const status = out.styled('bt-dim', `reading ${f.name} …`);
  let text: string;
  try {
    if (!srcCache.has(f.name)) {
      srcCache.set(
        f.name,
        fetch(withBase(`bits/src/${f.name}`)).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.text();
        }),
      );
    }
    text = await srcCache.get(f.name)!;
  } catch {
    srcCache.delete(f.name);
    status.className = 'bt-l bt-err';
    status.textContent = `cat: ${f.name}: could not load the file. Check the connection and try again.`;
    return;
  }
  status.remove();

  const lines = text.replace(/\n+$/, '').split('\n');
  const pending = [...f.notes];
  const code = h('div', { class: 'bt-code', 'data-code': '' });
  const body = h('div', { class: 'bt-code-body' });
  let n = 0;
  let total = 0;
  lines.forEach((ln) => {
    const file = /^# ===== (.+) =====$/.exec(ln);
    if (file) {
      body.append(h('div', { class: 'bt-code-file' }, file[1]));
      n = 0; // numbering restarts in each original file
      return;
    }
    n++;
    total++;
    const row = h(
      'div',
      { class: 'bt-cl' },
      h('span', { class: 'bt-ln', 'aria-hidden': 'true' }, String(n)),
      h('code', null, ...highlightLine(ln, f.lang)),
    );
    body.append(row);
    const hit = pending.findIndex((n) => ln.trim().startsWith(n.match));
    if (hit >= 0) {
      const [note] = pending.splice(hit, 1);
      row.classList.add('is-flagged');
      body.append(h('div', { class: 'bt-cl bt-note' }, h('span', { class: 'bt-ln', 'aria-hidden': 'true' }), h('span', null, `└─ ${note.note}`)));
    }
  });
  code.append(
    h(
      'div',
      { class: 'bt-code-head' },
      h('span', { class: 'bt-file' }, f.name),
      h('span', { class: 'bt-dim' }, ` · original · read-only · ${total} lines`),
    ),
    body,
  );
  out.add(code);
  const g = games.find((x) => x.src === f.name);
  const next = ['cat bugs.log'];
  if (g?.status === 'playable') next.unshift(`play ${g.id}`, `diff ${g.id}`);
  tries(out, next);
}

function bugsLog(out: Out): void {
  out.styled('bt-dim', '# bugs.log · real bugs from the originals, most of them fixed in the arcade');
  out.blank();
  for (const b of bugs) {
    const src = findSrc(b.file);
    const name: Node = src ? out.run(b.file, `cat ${src.name}`) : document.createTextNode(b.file);
    const entry = h(
      'div',
      { class: 'bt-log' },
      h('span', { class: `bt-badge is-${b.level.toLowerCase()}` }, `[${b.level}]`),
      h(
        'div',
        { class: 'bt-log-body' },
        h('div', { class: 'bt-l bt-log-file' }, name),
        ...b.lines.map((l) => h('div', { class: 'bt-l' }, l)),
        h('div', { class: 'bt-l bt-log-status' }, `→ ${b.status}`),
      ),
    );
    out.add(entry);
  }
}

function lockState(app: App): HTMLElement {
  return app.isUnlocked()
    ? h('span', { class: 'bt-ok' }, 'arcade: unlocked')
    : h('span', { class: 'bt-warn' }, 'arcade: locked · play asks one question first');
}

function diffView(out: Out, g: Game): void {
  out.styled('bt-dim', `diff --remaster ${g.src ?? g.id} ${g.path ? g.path.replace(/index\.html$/, '') : '(not yet)'}`);
  out.styled('bt-d-del', `--- original   ${g.original}`);
  out.styled('bt-d-add', `+++ remaster   browser, 2026`);
  for (const l of g.diff) {
    const t = l.slice(1).trim();
    if (l[0] === '@') out.styled('bt-d-hunk', `@@ ${t} @@`);
    else if (l[0] === '-') out.styled('bt-d-del bt-d-line', `- ${t}`);
    else if (l[0] === '+') out.styled('bt-d-add bt-d-line', `+ ${t}`);
    else out.styled('bt-d-ctx bt-d-line', `  ${t}`);
  }
  if (g.status === 'playable') tries(out, [`play ${g.id}`, ...(g.src ? [`cat ${g.src}`] : [])]);
  else if (g.src) tries(out, [`cat ${g.src}`, 'cat bugs.log']);
}

/* ---------- the puzzle ---------- */

async function unlockFlow(out: Out, ctx: CommandCtx, app: App): Promise<boolean> {
  out.line(h('span', { class: 'bt-warn bt-strong' }, 'ARCADE LOCKED.'), ` Security question: ${puzzle.question}`);
  out.styled('bt-dim', 'Type your answer and press Enter. Not a coder? Any three guesses unlock it too. Esc cancels.');
  let wrong = 0;
  for (;;) {
    const a = await ctx.term.ask(out, 'answer>');
    if (a === null) {
      out.styled('bt-dim', 'Arcade stays locked. Run play again whenever you like.');
      return false;
    }
    if (!a.trim()) {
      out.styled('bt-dim', 'An answer, please. Or Esc to back out.');
      continue;
    }
    if (puzzle.accept(a)) {
      out.line(h('span', { class: 'bt-ok bt-strong' }, 'ACCESS GRANTED.'), ' Correct, and slightly upsetting.');
      app.unlock();
      return true;
    }
    wrong++;
    if (wrong >= 3) {
      out.line(h('span', { class: 'bt-ok bt-strong' }, 'Fine. Unlocked.'), ' Floating point humbles everyone.');
      app.unlock();
      return true;
    }
    const left = `${3 - wrong} ${3 - wrong === 1 ? 'try' : 'tries'} left.`;
    if (puzzle.sane(a)) out.line(h('span', { class: 'bt-warn' }, "That's what a sane language would say. Hint: floating point."), ' ', h('span', { class: 'bt-dim' }, left));
    else out.line(h('span', { class: 'bt-warn' }, 'Nope.'), ' ', h('span', { class: 'bt-dim' }, left));
  }
}

/* ---------- formatting helpers ---------- */

function unixDate(d = new Date()): string {
  const day = d.toLocaleString('en-US', { weekday: 'short' });
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour12: false });
  let tz = '';
  try {
    tz = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    /* older browsers */
  }
  return `${day} ${mon} ${String(d.getDate()).padStart(2, ' ')} ${time} ${tz} ${d.getFullYear()}`.replace(/\s+/g, ' ');
}

function warp(out: Out, path: string, label: string): void {
  out.styled('bt-ok', `warping to ${label} …`);
  window.setTimeout(() => void warpTo(withBase(path)), prefersReducedMotion() ? 0 : 420);
}

/* ---------- commands ---------- */

export function createCommands(app: App): { commands: Command[]; fallback: Command['run'] } {
  const catTargets = () => [...projects.map((p) => p.id), 'bugs.log', 'readme.txt', ...srcFiles.map((f) => f.name)];

  const play: Command = {
    name: 'play',
    usage: 'play <game>',
    desc: 'play one, e.g. play snake (one quick question first)',
    group: 'games',
    args: () => games.map((g) => g.id),
    async run(args, out, ctx) {
      if (!args.length) {
        out.line('Pick a game (small games he built while learning to code):');
        const row = h('div', { class: 'bt-l bt-cols' });
        for (const g of playable()) row.append(out.run(g.id, `play ${g.id}`));
        out.add(row);
        return;
      }
      const g = findGame(args[0]);
      if (!g) {
        out.line(h('span', { class: 'bt-err' }, `play: no such game: ${args[0]}.`), ' Try ', out.run('games'), '.');
        return;
      }
      if (g.status === 'wip' || !g.path) {
        out.line(h('span', { class: 'bt-warn' }, `${g.title}: remaster in progress.`), ` The original is still in src/.`);
        tries(out, [g.src ? `cat ${g.src}` : 'games', 'cat bugs.log']);
        return;
      }
      if (!app.isUnlocked()) {
        const ok = await unlockFlow(out, ctx, app);
        if (!ok) return;
      }
      out.styled('bt-ok', `launching ${g.id} … Esc brings you back.`);
      app.openGame(g);
    },
  };

  const commands: Command[] = [
    {
      name: 'help',
      aliases: ['?', 'man', 'commands'],
      usage: 'help',
      desc: 'this list',
      run(_a, out, ctx) {
        out.line(
          'No typing needed: click anything in ',
          h('span', { class: 'bt-accent' }, 'green'),
          '. Or type a command and press Enter.',
        );
        out.line('Prefer a normal web page? ', out.run('plain view', 'plain'), '.');
        const sections: [Command['group'], string][] = [
          ['work', 'His work'],
          ['games', 'Games · optional, just for fun'],
          ['basics', 'Terminal basics'],
        ];
        for (const [group, title] of sections) {
          const cmds = ctx.term.visibleCommands.filter((c) => c.name !== 'help' && (c.group ?? 'basics') === group);
          if (!cmds.length) continue;
          out.add(h('div', { class: 'bt-l bt-h' }, title));
          const rows: [Node, string][] = cmds.map((c) => {
            const u = c.usage!;
            return [u.includes('<') ? out.fill(u, `${c.name} `) : out.run(u, c.name), c.desc ?? ''];
          });
          grid(out, rows, 'bt-help');
        }
        out.blank();
        out.styled('bt-dim', 'Keys: Tab completes · ↑/↓ history · Ctrl+L clears · Esc leaves a game');
      },
    },
    {
      name: 'ls',
      aliases: ['dir', 'll', 'la'],
      usage: 'ls',
      desc: 'list everything: his projects and the games',
      group: 'work',
      args: () => ['projects/', 'arcade/', 'src/'],
      run(args, out) {
        const target = norm(args.find((a) => !a.startsWith('-')) ?? '');
        if (target && !['projects', 'arcade', 'src'].includes(target)) {
          out.styled('bt-err', `ls: ${target}: No such file or directory`);
          return;
        }
        if (!target || target === 'projects') {
          out.line(h('span', { class: 'bt-dir' }, 'projects/'), h('span', { class: 'bt-dim' }, '  his work · click a name to read a short write-up'));
          grid(out, projects.map((p) => [out.run(p.id, `cat ${p.id}`), p.short]), 'bt-ls');
        }
        if (!target || target === 'arcade') {
          if (!target) out.blank();
          out.line(h('span', { class: 'bt-dir' }, 'arcade/'), h('span', { class: 'bt-dim' }, '  small games he built while learning to code · just for fun'));
          grid(
            out,
            games.map((g) => [
              g.status === 'playable' ? out.run(g.id, `play ${g.id}`) : out.run(g.id, `play ${g.id}`, 'is-wip'),
              h('span', null, h('span', { class: g.status === 'playable' ? 'bt-ok' : 'bt-dim' }, g.status === 'playable' ? '✓ ' : '◌ '), g.short),
            ]),
            'bt-ls',
          );
        }
        if (target === 'src') {
          out.styled('bt-dir', 'src/');
          grid(out, srcFiles.map((f) => [out.run(f.name, `cat ${f.name}`), h('span', { class: 'bt-dim' }, f.from)]), 'bt-ls');
        }
        if (!target) {
          out.blank();
          const row = h('div', { class: 'bt-l bt-cols' });
          row.append(out.run('bugs.log', 'cat bugs.log'), out.run('readme.txt', 'cat readme.txt'), out.run('src/', 'ls src'));
          out.add(row);
          out.styled('bt-dim bt-aside', 'bugs.log: the honest list of bugs in his old games · src/: their original code');
        }
      },
    },
    {
      name: 'cat',
      aliases: ['less', 'more', 'head', 'tail', 'bat'],
      usage: 'cat <file>',
      desc: 'read a project write-up, e.g. cat fintech-qualifier',
      group: 'work',
      args: catTargets,
      event: 'cat',
      async run(args, out) {
        if (!args.length) {
          out.line('cat shows a file. The project write-ups:');
          const row = h('div', { class: 'bt-l bt-cols' });
          for (const p of projects) row.append(out.run(p.id, `cat ${p.id}`));
          out.add(row);
          return;
        }
        for (const arg of args) {
          const n = norm(arg);
          if (n === 'bugs.log' || n === 'bugs') bugsLog(out);
          else if (n === 'readme.txt' || n === 'readme' || n === 'readme.md') {
            for (const l of readme) out.line(l);
          } else if (findProject(arg)) project(out, findProject(arg)!);
          else if (findSrc(arg)) await source(out, findSrc(arg)!);
          else if (findGame(arg)) {
            const g = findGame(arg)!;
            out.line(`${g.id} is a game, not a file.`);
            tries(out, [...(g.status === 'playable' ? [`play ${g.id}`] : []), ...(g.src ? [`cat ${g.src}`] : []), `diff ${g.id}`]);
          } else if (n === 'projects' || n === 'arcade' || n === 'src') {
            out.line(h('span', { class: 'bt-err' }, `cat: ${n}: Is a directory.`), ' Try ', out.run(`ls ${n}`), '.');
          } else {
            out.line(h('span', { class: 'bt-err' }, `cat: ${arg}: No such file or directory.`), ' Try ', out.run('ls'), '.');
          }
          if (args.length > 1) out.blank();
        }
      },
    },
    {
      name: 'open',
      aliases: ['xdg-open', 'start'],
      usage: 'open <project>',
      desc: "open a project's live demo",
      group: 'work',
      args: () => [...projects.filter((p) => p.link).map((p) => p.id), ...projects.filter((p) => !p.link).map((p) => p.id), 'cv'],
      async run(args, out, ctx) {
        if (!args.length) {
          out.line('usage: open <project>. Live right now: ', out.run('fintech-qualifier', 'open fintech-qualifier'));
          return;
        }
        const n = norm(args[0]);
        const p = findProject(args[0]);
        if (p?.link) {
          if (p.link.note) out.line(p.link.note);
          out.line(h('span', { class: 'bt-dim' }, '→ '), out.link(p.link.label, p.link.href, true));
          window.open(p.link.href, '_blank', 'noopener');
        } else if (p) {
          out.line(`${p.id} has no public link yet. The details are one command away: `, out.run(`cat ${p.id}`));
        } else if (n === 'cv' || n === 'resume') {
          out.line('CV → ', out.link('résumé page', withBase('resume/'), true));
          window.open(withBase('resume/'), '_blank', 'noopener');
        } else if (findGame(args[0])) {
          await play.run(args, out, ctx);
        } else {
          out.line(h('span', { class: 'bt-err' }, `open: ${args[0]}: No such file or directory.`), ' Try ', out.run('ls'), '.');
        }
      },
    },
    {
      name: 'games',
      aliases: ['arcade'],
      usage: 'games',
      desc: 'list the games he built',
      group: 'games',
      run(_a, out, ctx) {
        out.line(h('span', { class: 'bt-strong' }, 'ARCADE'), h('span', { class: 'bt-dim' }, ` · ${playable().length} playable · ${games.length - playable().length} in the workshop`));
        out.styled('bt-dim', 'Small games he built while learning to code, rebuilt for the browser. Optional, just for fun. Click play.');
        out.blank();
        const g = h('div', { class: 'bt-games' });
        for (const gm of games) {
          const ok = gm.status === 'playable';
          const actions = h('span', { class: 'bt-actions' });
          if (ok) actions.append(out.run('play', `play ${gm.id}`), ' ', out.run('diff', `diff ${gm.id}`));
          if (gm.src) actions.append(' ', out.run('src', `cat ${gm.src}`));
          g.append(
            h(
              'div',
              { class: 'bt-game' },
              h('span', { class: 'bt-game-name' }, ok ? out.run(gm.id, `play ${gm.id}`) : h('span', { class: 'bt-dim' }, gm.id)),
              h('span', { class: ok ? 'bt-ok' : 'bt-warn' }, ok ? '✓ playable' : '◌ remaster in progress'),
              h('span', { class: 'bt-dim bt-game-orig' }, gm.original),
              actions,
            ),
          );
        }
        out.add(g);
        out.blank();
        out.line(lockState(app));
        void ctx;
      },
    },
    play,
    {
      name: 'diff',
      usage: 'diff <game>',
      desc: 'what changed since the original',
      group: 'games',
      args: () => games.map((g) => g.id),
      run(args, out) {
        if (!args.length) {
          out.line('usage: diff <game>');
          const row = h('div', { class: 'bt-l bt-cols' });
          for (const g of games) row.append(out.run(g.id, `diff ${g.id}`));
          out.add(row);
          return;
        }
        const g = findGame(args[0]);
        if (!g) {
          out.line(h('span', { class: 'bt-err' }, `diff: no such game: ${args[0]}.`), ' Try ', out.run('games'), '.');
          return;
        }
        diffView(out, g);
      },
    },
    {
      name: 'whoami',
      aliases: ['about', 'finger'],
      usage: 'whoami',
      desc: 'who he is, in four lines',
      group: 'work',
      run(_a, out) {
        const text = h('div', { class: 'bt-who-text' }, ...whoami.map((l, i) => h('div', { class: i === 0 ? 'bt-l bt-title' : 'bt-l' }, l)));
        text.append(h('div', { class: 'bt-l bt-try' }, h('span', { class: 'bt-dim' }, 'more:'), ' ', out.run('contact'), ' ', out.run('cd atoms'), ' ', out.run('cd ventures')));
        out.add(h('div', { class: 'bt-who' }, portrait(withBase('img/me.jpeg'), 'Vashisth, rendered as green phosphor dots'), text));
      },
    },
    {
      name: 'contact',
      aliases: ['email', 'mail'],
      usage: 'contact',
      desc: 'email, LinkedIn, GitHub',
      group: 'work',
      run(_a, out) {
        const strip = (u: string) => u.replace(/^https?:\/\//, '');
        grid(
          out,
          [
            [h('span', { class: 'bt-key' }, 'email'), out.link(site.email, `mailto:${site.email}`)],
            [h('span', { class: 'bt-key' }, 'linkedin'), out.link(strip(site.linkedin), site.linkedin, true)],
            [h('span', { class: 'bt-key' }, 'github'), out.link(strip(site.github), site.github, true)],
            [h('span', { class: 'bt-key' }, 'cv'), out.link('résumé page', withBase('resume/'))],
          ],
          'bt-kv',
        );
      },
    },
    {
      name: 'cd',
      usage: 'cd <world>',
      desc: 'go elsewhere: cd atoms · cd ventures · cd .. (home)',
      args: () => ['atoms', 'ventures', '..'],
      run(args, out) {
        const raw = args[0] ?? '~';
        const t = raw.toLowerCase().replace(/\/+$/, '').replace(/^(\.\.\/|\/)(?=(atoms|ventures|bits)$)/, '');
        if (t === 'atoms') warp(out, 'atoms/', 'atoms');
        else if (t === 'ventures') warp(out, 'ventures/', 'ventures');
        else if (t === '..' || t === '' || t === '/' || t === '../..' || t === 'home') warp(out, '', 'orbit');
        else if (t === '~' || t === '.' || t === 'bits' || t === '~/bits') out.line("You're already in ~/bits.");
        else if (['projects', 'arcade', 'src'].includes(norm(t))) out.line('No need to cd. Try ', out.run(`ls ${norm(t)}`), '.');
        else out.line(h('span', { class: 'bt-err' }, `cd: no such directory: ${raw}.`), ' Try ', out.run('cd atoms'), ', ', out.run('cd ventures'), ' or ', out.run('cd ..'));
      },
    },
    {
      name: 'history',
      usage: 'history',
      desc: 'what you typed',
      run(_a, out, ctx) {
        const hist = ctx.term.history;
        const g = h('div', { class: 'bt-hist' });
        hist.forEach((c, i) => g.append(h('span', { class: 'bt-dim' }, String(i + 1).padStart(3, ' ')), h('span', null, out.run(c))));
        out.add(g);
      },
    },
    {
      name: 'clear',
      aliases: ['cls', 'reset'],
      usage: 'clear',
      desc: 'clear the screen (Ctrl+L)',
      run(_a, _o, ctx) {
        ctx.term.clear();
      },
    },
    {
      name: 'echo',
      usage: 'echo <text>',
      desc: 'print text',
      run(args, out) {
        out.line(args.join(' '));
      },
    },
    {
      name: 'date',
      usage: 'date',
      desc: 'print the date',
      run(_a, out) {
        out.line(unixDate());
      },
    },
    {
      name: 'exit',
      aliases: ['logout', 'quit', 'q', ':q', ':wq'],
      usage: 'exit',
      desc: 'back to orbit',
      run(_a, out) {
        out.line('logout');
        out.styled('bt-dim', 'Connection to bits closed.');
        window.setTimeout(() => void warpTo(withBase('')), prefersReducedMotion() ? 0 : 520);
      },
    },
    {
      name: 'plain',
      aliases: ['plainview', 'gui'],
      usage: 'plain',
      desc: 'the same content as a normal web page',
      group: 'work',
      run(_a, out) {
        out.styled('bt-dim', 'Switching to plain view …');
        app.setView('plain');
      },
    },

    /* ---------- hidden: real-ish commands and easter eggs ---------- */
    {
      name: 'pwd',
      run(_a, out) {
        out.line('/home/guest/bits');
      },
    },
    {
      name: 'uname',
      run(args, out) {
        out.line(args.includes('-a') ? 'VP-OS 2.026 bits (Astro + TypeScript, no kernel) web' : 'VP-OS');
      },
    },
    {
      name: 'sudo',
      aliases: ['su', 'doas'],
      run(_a, out) {
        out.styled('bt-warn', "Nice try. This incident will be reported to... nobody. I don't have a server.");
      },
    },
    {
      name: 'rm',
      aliases: ['rmdir', 'mv', 'touch', 'mkdir', 'chmod'],
      event: 'rm',
      run(_a, out, ctx) {
        if (/^rm\s+(-\w+\s+)*-?\w*r\w*\s+(-\w+\s+)*(\/|\/\*|~|\*)\s*$/i.test(ctx.raw)) {
          out.styled('bt-err', 'Permission denied. Also, rude.');
        } else {
          out.styled('bt-err', `${ctx.name}: read-only file system. It's a static website.`);
        }
      },
    },
    {
      name: 'vim',
      aliases: ['vi', 'nano', 'emacs', 'code', 'ed'],
      event: 'editor',
      run(_a, out) {
        out.line('Read-only file system. Also, you would never get out of vim.');
      },
    },
    {
      name: 'python',
      aliases: ['python3', 'py', 'node', 'pip'],
      event: 'python',
      run(_a, out) {
        out.line('No interpreter in here. The Python originals are readable, though: ', out.run('cat snake.py'));
      },
    },
    {
      name: 'coffee',
      aliases: ['brew'],
      run(_a, out) {
        out.line(h('span', { class: 'bt-ok' }, '[ ok ]'), ' coffee level: sufficient');
      },
    },
    {
      name: 'ping',
      run(_a, out) {
        out.line('pong. (The Pong remaster is still in the workshop.)');
      },
    },
    {
      name: 'hello',
      aliases: ['hi', 'hey', 'hallo'],
      run(_a, out) {
        out.line('Hi. Start with ', out.run('ls'), ', or ', out.run('whoami'), ' for the short version.');
      },
    },
    {
      name: 'git',
      run(_a, out) {
        out.line('fatal: not a git repository. The real ones are on GitHub: ', out.link('github.com/Vashisth-Patel', site.github, true));
      },
    },
  ];

  const fallback: Command['run'] = (args, out) => {
    out.line(`command not found: ${args[0]}. Try '`, out.run('help'), `'.`);
  };

  return { commands, fallback };
}
