/**
 * BITS world content: projects, arcade, bugs.log, diffs and the small texts the terminal prints.
 * One source for both the terminal (scripts/bits/*) and the plain view (components/bits/PlainView.astro).
 * Every fact here has a row under "## Bits" in product/fact-check.md.
 */
import { withBase } from '../lib/url';

/* ---------- Content blocks (rendered by the terminal and by the plain view) ---------- */

export type Block =
  /** Plain-language summary for non-technical readers, shown first */
  | { kind: 'tldr'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  /** Monospace drawing. `label` is the text alternative for screen readers. */
  | { kind: 'pre'; text: string; label: string }
  | { kind: 'kv'; rows: [string, string][] }
  /** Horizontal bars, e.g. a scoring rubric. */
  | { kind: 'bars'; rows: [string, number][]; unit: string }
  | { kind: 'list'; items: string[] }
  /** Terminal commands worth trying next. The plain view turns them into links where it can. */
  | { kind: 'try'; cmds: string[] };

export interface Project {
  id: string;
  title: string;
  meta: string;
  /** One line for `ls` */
  short: string;
  body: Block[];
  /** Used by `open <id>` */
  link?: { href: string; label: string; note?: string };
}

export interface Game {
  id: string;
  title: string;
  status: 'playable' | 'wip';
  /** "Python turtle, 2022" */
  original: string;
  short: string;
  /** Page under public/, opened in the overlay iframe */
  path?: string;
  /** Original source shown by `cat` */
  src?: string;
  /** Unified-diff-ish lines: '-' removed, '+' added, ' ' unchanged, '@' hunk header */
  diff: string[];
}

/* ---------- Projects ---------- */

const leadDiagram = String.raw`
 inbound lead (form · CSV · API)
       │
┌──────↓──── n8n on Render · 13 nodes ───┐
│ webhook → validate → upsert to Neon    │
│                          ↓             │
│ route ← ICP score ← Gemini enrichment  │
│   │                                    │
│   ├─ A/B → HubSpot contact + deal      │
│   ├─ C ──→ HubSpot contact (nurture)   │
│   └─ D ──→ tagged disqualified         │
└──────┬─────────────────────────────────┘
       ↓ leads · enrichment · scores
 Neon Postgres (system of record)
       ↓
 SQL views → BI dashboards`.slice(1);

const fintechDiagram = String.raw`
 unstructured lead data
          ↓
 BaFin-aware compliance check
          ↓
 benchmark vs 100+ stored companies
          ↓
 scoring dashboard + recommendation`.slice(1);

const gaugeDiagram = String.raw`
 one reading per second, over a WebSocket
 ┌──────────────────────────────────────┐
 │ ≤ 30 °C     Normal                   │
 │ 30–35 °C    Elevated                 │
 │ > 35 °C     High Temperature Alert   │
 └──────────────────────────────────────┘`.slice(1);

export const projects: Project[] = [
  {
    id: 'b2b-lead-pipeline',
    title: 'Industrial B2B Lead Pipeline',
    meta: '2026 · independent project · simulated data',
    short: 'Sorts incoming sales leads automatically, best first (simulated data)',
    body: [
      {
        kind: 'tldr',
        text: 'When a potential customer fills in a form, this system looks up their company, gives it a fit score out of 100, and passes the best ones to sales. Built for a made-up seller of industrial inspection equipment, with simulated data.',
      },
      { kind: 'h', text: 'The details' },
      {
        kind: 'p',
        text: 'Lead qualification for a simulated seller of industrial inspection equipment (non-destructive testing, metrology). Inbound leads are validated, enriched, scored against a documented 100-point rubric, routed by tier and mirrored into a CRM. The lead data is simulated.',
      },
      { kind: 'h', text: 'Architecture' },
      {
        kind: 'pre',
        text: leadDiagram,
        label:
          'Diagram: a 13-node n8n workflow on Render. Webhook, validate, upsert to Neon Postgres, Gemini enrichment, deterministic ICP score, route by tier, then HubSpot contact and deal for tiers A and B, contact only for C, disqualified tag for D. Neon Postgres is the system of record and feeds SQL views for BI.',
      },
      { kind: 'h', text: 'Scoring rubric, 100 points' },
      {
        kind: 'bars',
        unit: 'pts',
        rows: [
          ['Industry fit', 25],
          ['Company size', 20],
          ['Inspection / QA driver', 20],
          ['Geography (DACH first)', 15],
          ['Revenue band', 10],
          ['Growth / intent', 10],
        ],
      },
      {
        kind: 'kv',
        rows: [
          ['Tiers', 'A 80+ · B 60–79 · C 40–59 · D under 40'],
          ['Disqualifiers', 'excluded industries, sanctioned regions, competitors, personal email with no company domain'],
          ['Example', 'a 3,200-employee aerospace supplier in Germany scores 94, tier A'],
        ],
      },
      {
        kind: 'p',
        text: 'Gemini supplies the facts. The rubric decides what they are worth, so the same enrichment always gives the same score, and every score is stored with its per-dimension breakdown.',
      },
      {
        kind: 'kv',
        rows: [
          ['Stack', 'n8n on Render · Gemini API · Neon Postgres · HubSpot · Python · SQL views for BI'],
          ['Tests', 'Python scoring engine with 9 pytest tests'],
        ],
      },
    ],
  },
  {
    id: 'fintech-qualifier',
    title: 'FinTech Partner Qualification Engine',
    meta: 'prototype · live demo',
    short: 'Does the first screening of startups for an investor (live demo)',
    body: [
      {
        kind: 'tldr',
        text: "An investor's first check on a fintech startup, automated: it takes the startup's details, checks them against German financial regulation (BaFin), compares them with 100+ companies and recommends what to do. You can try it.",
      },
      { kind: 'h', text: 'The details' },
      {
        kind: 'p',
        text: 'An end-to-end prototype that automates the first-pass screening of fintech and startup leads for a VC.',
      },
      {
        kind: 'pre',
        text: fintechDiagram,
        label:
          'Pipeline: unstructured lead data, then a BaFin-aware compliance check, then a benchmark against 100+ stored companies, then a scoring dashboard with a recommendation.',
      },
      { kind: 'kv', rows: [['Stack', 'n8n · open-source LLM (chosen for data security) · NeonDB · Render · Astro front end']] },
      {
        kind: 'p',
        text: "The backend sleeps on Render's free tier, so the first request can take a minute or more to wake it up.",
      },
      { kind: 'try', cmds: ['open fintech-qualifier'] },
    ],
    link: {
      href: withBase('projects/fintech-qualifier/'),
      label: 'live demo',
      note: "Opening the live demo in a new tab. First request can take a minute or more: the backend sleeps on Render's free tier.",
    },
  },
  {
    id: 'fraunhofer-hackathon',
    title: 'Fraunhofer IPT Hackathon × MTU Aero Engines',
    meta: 'Jul 2025 · Aachen · 24 h',
    short: '24-hour hackathon: a live safety dashboard, Outstanding Performance',
    body: [
      {
        kind: 'tldr',
        text: 'A 24-hour team build: a system that watches a safety reading live and raises an alarm when it gets too high. His part was the live dashboard. Awarded an Outstanding Performance certificate.',
      },
      { kind: 'h', text: 'The details' },
      {
        kind: 'p',
        text: 'A teammate built the Arduino hardware. Vashisth built the live dashboard: a FastAPI backend streams readings over a WebSocket to an SVG gauge that switches between three states.',
      },
      {
        kind: 'pre',
        text: gaugeDiagram,
        label: 'Alarm states: up to 30 °C Normal, 30 to 35 °C Elevated, above 35 °C High Temperature Alert. One reading per second over a WebSocket.',
      },
      {
        kind: 'kv',
        rows: [
          ['His part', 'Python · FastAPI · WebSockets · HTML/JS dashboard · SVG gauge'],
          ['Hardware', 'Arduino, built by a teammate'],
        ],
      },
    ],
  },
  {
    id: 'quantathon-2026',
    title: 'EBS Invest Quantathon 2026',
    meta: 'Apr 2026 · Wiesbaden · 2nd place',
    short: 'A price-prediction model for trading, 2nd place',
    body: [
      {
        kind: 'tldr',
        text: 'A quantitative-finance competition run by EBS Invest, the investment club at EBS: build a model that predicts prices for automated trading. It came second.',
      },
      {
        kind: 'p',
        text: 'The method: an asset-price prediction model for algorithmic trading, combining traditional quantitative-finance techniques with machine-learning models where they helped.',
      },
    ],
  },
  {
    id: 'webdev-course',
    title: 'Web development coursework',
    meta: '2022–23 · HTML/CSS/JS · App Brewery course',
    short: 'His first websites, from an online course',
    body: [
      {
        kind: 'tldr',
        text: 'His first websites and browser games, built while following an online web development course. Two of them are playable in the arcade.',
      },
      {
        kind: 'p',
        text: "Exercises from The App Brewery's web development course: Drum Kit, Dicee, Simon and a TinDog landing page. These are course projects built on the course's starting files.",
      },
      {
        kind: 'kv',
        rows: [
          ['Drum Kit', 'playable, one bug fixed'],
          ['Dicee', 'playable, now with a Roll again button'],
          ['Simon', 'never worked, see bugs.log'],
          ['TinDog', 'Bootstrap landing page'],
        ],
      },
      { kind: 'try', cmds: ['play drum-kit', 'play dicee', 'cat bugs.log'] },
    ],
  },
  {
    id: 'python-games',
    title: 'Python turtle games',
    meta: '2022 · Python turtle · online course',
    short: 'Small games he wrote while learning Python',
    body: [
      {
        kind: 'tldr',
        text: 'Small games he wrote while learning to program in Python. Two of them are rebuilt for the browser and playable in the arcade.',
      },
      {
        kind: 'p',
        text: 'Snake, Turtle Crossing and Pong, written while following an online Python course. The originals are in src/, bugs included. Snake and Turtle Crossing are remastered in the arcade.',
      },
      { kind: 'try', cmds: ['cat snake.py', 'cat turtle_crossing.py', 'cat pong.py', 'cat bugs.log'] },
    ],
  },
];

/* ---------- Arcade ---------- */

export const games: Game[] = [
  {
    id: 'snake',
    title: 'Snake',
    status: 'playable',
    original: 'Python turtle, 2022',
    short: 'game · the classic snake, now with levels',
    path: 'bits/games/snake/index.html',
    src: 'snake.py',
    diff: [
      '@ food',
      '-food respawns anywhere, including the very edge of the screen',
      '+food spawns only on free cells inside the walls, never on the snake',
      '@ score',
      '-score lives in the window title: "your_score_is 7"',
      '-scoreboard.py: empty file',
      '+score, level and best score on screen',
      '@ speed',
      '-one speed, forever',
      '+every 5 food: level +1, speed +12%',
      '@ controls',
      '-two quick key presses can turn the snake back into itself',
      '+turns are buffered, one per step',
      '+WASD, swipe, and a D-pad on touch screens',
      '@ unchanged',
      ' black background, white square segments, white round food',
    ],
  },
  {
    id: 'turtle-crossing',
    title: 'Turtle Crossing',
    status: 'playable',
    original: 'Python turtle, 2022',
    short: 'game · help a turtle cross a busy road',
    path: 'bits/games/turtle-crossing/index.html',
    src: 'turtle_crossing.py',
    diff: [
      '@ controls',
      '-the Up key only works after ~4 seconds',
      '+Up works from the first frame',
      '+tap anywhere to move up on touch screens',
      '@ levels',
      '-level-up doubles the speed of one car, then the restart resets it',
      '-each level starts a new game inside the old one (recursion)',
      '+every level makes all cars ~1.3× faster',
      '@ road',
      '-lanes at 0, 40, 80, 120, 160, -40, -120, -160 (no -80)',
      '+nine evenly spaced lanes',
      '@ game over',
      '-a crash freezes the window',
      '+game over screen, Space or tap restarts',
      '@ unchanged',
      ' white background, coloured cars driving left, the turtle-module turtle',
    ],
  },
  {
    id: 'drum-kit',
    title: 'Drum Kit',
    status: 'playable',
    original: 'HTML/CSS/JS, 2022–23',
    short: 'toy · play drums with your keyboard',
    path: 'bits/games/drum-kit/index.html',
    src: 'drum_kit.js',
    diff: [
      '@ buttonanimation()',
      '-any unmapped key (Shift, 1, Space) throws an error in the console',
      '+only w a s d j k l animate, every other key is ignored',
      '@ layout',
      '+smaller drums on narrow screens',
      '@ footer',
      '-"Made with ❤️ in London." (from the course starter)',
      '+credits the App Brewery web-dev course',
      '@ unchanged',
      ' same drums, same sounds, same code otherwise',
    ],
  },
  {
    id: 'dicee',
    title: 'Dicee',
    status: 'playable',
    original: 'HTML/CSS/JS, 2022–23',
    short: 'game · roll two dice, higher number wins',
    path: 'bits/games/dicee/index.html',
    diff: [
      '@ rolling',
      '-rolls only when you refresh the page (the heading says "Refresh Me")',
      '+a Roll again button, also on Space and Enter',
      '+a short roll animation',
      '@ layout',
      '+fits narrow screens',
      '@ unchanged',
      ' same dice, same rule: higher number wins',
    ],
  },
  {
    id: 'pong',
    title: 'Pong',
    status: 'wip',
    original: 'Python turtle, 2022',
    short: 'game · remaster in progress',
    src: 'pong.py',
    diff: ['@ remaster in progress', '-no scoring: a miss simply ends the game', '+scoring, at least'],
  },
  {
    id: 'simon',
    title: 'Simon',
    status: 'wip',
    original: 'JS + jQuery, 2022–23',
    short: 'game · remaster in progress',
    src: 'simon.js',
    diff: ['@ remaster in progress', '-never worked (cat bugs.log has the list)', '+a version that works'],
  },
];

/* ---------- Original source files, served from public/bits/src/ ---------- */

export interface SrcFile {
  name: string;
  from: string;
  lang: 'py' | 'js';
  /** Lines to flag in the listing: exact substring of the line + a note */
  notes: { match: string; note: string }[];
}

export const srcFiles: SrcFile[] = [
  {
    name: 'snake.py',
    from: 'snake/main.py + snake.py + food.py + scoreboard.py',
    lang: 'py',
    notes: [
      { match: 'screen.title(f"your_score_is {score}")', note: 'the scoreboard' },
      { match: 'random_x_cor = random.randint(-screen.window_width() / 2', note: 'can land on the edge' },
    ],
  },
  {
    name: 'snake_first_attempt.py',
    from: 'snake-first-attempt/Snake_Game.py',
    lang: 'py',
    notes: [{ match: 'screen.onkey(fun=f, key="Up")', note: "NameError: name 'f' is not defined" }],
  },
  {
    name: 'turtle_crossing.py',
    from: 'turtle-crossing/main.py + running_turtle.py + cars_moving.py',
    lang: 'py',
    notes: [
      { match: 'w = [ 0, 40, 80, 120, 160, -40, -120, -160]', note: 'no -80' },
      { match: 'c.new_game()', note: 'speeds up one car' },
      { match: 'game_chalu_chhe()', note: 'a new game inside the old one' },
      { match: 'while vashisth == 50:', note: '~4 s until Up works' },
    ],
  },
  {
    name: 'pong.py',
    from: 'pong/main.py + ball.py + scating.py + turtle_border.py',
    lang: 'py',
    notes: [
      { match: 'while ball_nameee[0].xcor() > -(1000-1)/2', note: 'a miss ends the loop. No score.' },
      { match: 'random_number1 = random.randint(-500,500)', note: 'can spawn next to a paddle' },
    ],
  },
  {
    name: 'drum_kit.js',
    from: 'Drum Kit/index.js',
    lang: 'js',
    notes: [{ match: 'document.querySelector("."+currentKey).classList.add("pressed");', note: 'null for unmapped keys' }],
  },
  {
    name: 'simon.js',
    from: 'Simon Game/game.js',
    lang: 'js',
    notes: [
      { match: 'if (values_bro[j] === pappa){', note: 'string === jQuery object' },
      { match: 'for (let j=0; j< 3; j++){', note: 'skips blue' },
      { match: '$(values_bro[j]).click(function(){', note: 'missing "."' },
      { match: 'click_karo(0)', note: 'checked before anyone clicks' },
    ],
  },
];

/* ---------- bugs.log ---------- */

export interface Bug {
  level: 'CRASH' | 'BUG' | 'QUIRK';
  file: string;
  lines: string[];
  status: string;
}

export const bugs: Bug[] = [
  {
    level: 'CRASH',
    file: 'snake_first_attempt.py',
    lines: [
      'Binds the Up key to a function f that does not exist.',
      'NameError before the game loop starts. The snake never moves.',
    ],
    status: 'rewritten: play snake',
  },
  {
    level: 'BUG',
    file: 'snake.py',
    lines: [
      'Food could respawn on the very edge of the screen.',
      'scoreboard.py is an empty file. The score lived in the window title.',
    ],
    status: 'fixed in the remaster',
  },
  {
    level: 'BUG',
    file: 'turtle_crossing.py',
    lines: [
      'The level-up doubled the speed of exactly one car, then the restart reset it.',
      'The Up key only started working after ~4 seconds.',
      'Each level started a new game inside the old one. Python allows about 1,000 of those. Nobody got that far.',
    ],
    status: 'fixed in the remaster',
  },
  {
    level: 'BUG',
    file: 'pong.py',
    lines: [
      'No scoring. When someone missed, the game simply ended.',
      'The border is 716 separate turtles, one every 5 px.',
    ],
    status: 'remaster in progress',
  },
  {
    level: 'BUG',
    file: 'drum_kit.js',
    lines: ['Pressing any unmapped key threw an error in the console.'],
    status: 'fixed: guarded the lookup',
  },
  {
    level: 'CRASH',
    file: 'simon.js',
    lines: [
      'Never worked. Compares a string to a jQuery object (never true).',
      'A selector is missing its ".". The loop skips blue.',
      'The sequence is checked before the player has clicked anything.',
      'And in the HTML: lass="row".',
    ],
    status: 'remaster coming later',
  },
];

/* ---------- Small texts ---------- */

export const whoami: string[] = [
  'Vashisth Patel.',
  'Materials engineer (B.Tech, IIT Gandhinagar), now a management student in Wiesbaden.',
  'Likes building small automations: lead scoring, screening workflows, dashboards.',
  'Tried making games during his bachelors. He is rusty now, and the arcade is proof.',
];

export const readme: string[] = [
  'This is the code side of the site, made to look like an old computer terminal.',
  'You never have to type: click anything green, or use the buttons at the bottom.',
  'projects/ is his work, each with a short write-up. arcade/ is small games, just for fun.',
  'Prefer a normal page? "Plain view" is in the title bar.',
  'For the curious: plain TypeScript, no terminal library. Tab completes, ↑/↓ history, Ctrl+L clears, Esc leaves a game.',
];

export const puzzle = {
  question: 'what does 0.1 + 0.2 return in JavaScript?',
  accept: (answer: string): boolean => {
    const a = answer.trim().replace(/^\./, '0.');
    return a.startsWith('0.3000000000000000');
  },
  sane: (answer: string): boolean => /^0?\.30*$/.test(answer.trim()),
};

export const bootLines: { tag?: string; text: string }[] = [
  { text: 'VP-BIOS v2.026 · booting bits...' },
  { tag: 'ok', text: 'mounting /projects' },
  { tag: 'ok', text: 'loading arcade (4 games, some of them used to be broken)' },
  { tag: 'ok', text: 'coffee level: sufficient' },
];
