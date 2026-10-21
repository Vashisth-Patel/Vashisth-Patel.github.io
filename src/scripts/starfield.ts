/**
 * Canvas starfield: three parallax layers, slow drift, twinkle, occasional shooting star,
 * and a "warp" mode (stars stretch into lines) used for page transitions.
 * Honors prefers-reduced-motion (renders one static frame, warp resolves immediately).
 *
 * Usage: <Starfield /> component mounts one and registers it as window.__starfield.
 */
import { prefersReducedMotion } from '../lib/motion';

export interface StarfieldOptions {
  /** Relative star density. 1 = default. */
  density?: number;
  /** RGB tint mixed into ~30% of stars, e.g. [232,131,58] for copper. */
  tint?: [number, number, number] | null;
  /** Pointer + scroll parallax. */
  parallax?: boolean;
  shootingStars?: boolean;
  /** Drift speed multiplier. */
  speed?: number;
}

interface Star {
  x: number;
  y: number;
  layer: 0 | 1 | 2;
  r: number;
  a: number;
  tw: number;
  ph: number;
  color: string;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

const LAYER_PARALLAX = [6, 14, 28];
const LAYER_DRIFT = [2, 5, 10]; // px per second
const LAYER_RADIUS = [0.55, 0.9, 1.35];

export class Starfield {
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private running = false;
  private t0 = performance.now();
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private scrollY = 0;
  private shooting: Shooting | null = null;
  private nextShoot = 0;
  private warpStart = 0;
  private warpDur = 0;
  private warpResolve: (() => void) | null = null;
  private reduced = prefersReducedMotion();
  private opts: Required<StarfieldOptions>;

  constructor(private canvas: HTMLCanvasElement, opts: StarfieldOptions = {}) {
    this.opts = {
      density: opts.density ?? 1,
      tint: opts.tint ?? null,
      parallax: opts.parallax ?? true,
      shootingStars: opts.shootingStars ?? true,
      speed: opts.speed ?? 1,
    };
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.resize();
    this.bind();
    this.scheduleShoot(4000);
  }

  private bind() {
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.resize();
        if (this.reduced) this.frame(performance.now());
      }, 120);
    });
    if (this.opts.parallax && !this.reduced) {
      window.addEventListener(
        'pointermove',
        (e) => {
          this.pointer.tx = (e.clientX / this.w - 0.5) * 2;
          this.pointer.ty = (e.clientY / this.h - 0.5) * 2;
        },
        { passive: true },
      );
      window.addEventListener('scroll', () => (this.scrollY = window.scrollY), { passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.seed();
  }

  private seed() {
    const area = this.w * this.h;
    const count = Math.max(140, Math.min(950, Math.round((area / 2400) * this.opts.density)));
    const tint = this.opts.tint;
    this.stars = Array.from({ length: count }, () => {
      const roll = Math.random();
      const layer = (roll < 0.62 ? 0 : roll < 0.9 ? 1 : 2) as 0 | 1 | 2;
      let color = '244,241,234';
      const c = Math.random();
      if (tint && c < 0.3) color = tint.join(',');
      else if (c < 0.42) color = '190,210,255'; // blue-white
      else if (c < 0.5) color = '255,226,190'; // warm
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        layer,
        r: LAYER_RADIUS[layer] * (0.7 + Math.random() * 0.6),
        a: 0.35 + Math.random() * 0.65,
        tw: 0.6 + Math.random() * 2.2,
        ph: Math.random() * Math.PI * 2,
        color,
      };
    });
  }

  private scheduleShoot(min = 5000) {
    this.nextShoot = performance.now() + min + Math.random() * 7000;
  }

  start() {
    if (this.running) return;
    if (this.reduced) {
      this.frame(performance.now());
      return;
    }
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Stars stretch into lines from the centre. Resolves when finished. */
  warp(durationMs = 700): Promise<void> {
    if (this.reduced) return Promise.resolve();
    this.warpStart = performance.now();
    this.warpDur = durationMs;
    this.start();
    return new Promise((resolve) => (this.warpResolve = resolve));
  }

  private frame(now: number) {
    const { ctx, w, h } = this;
    const t = (now - this.t0) / 1000;
    ctx.clearRect(0, 0, w, h);

    if (this.warpDur > 0) {
      this.drawWarp(now);
      return;
    }

    // ease pointer
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.04;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.04;

    for (const s of this.stars) {
      const par = LAYER_PARALLAX[s.layer];
      const drift = this.reduced ? 0 : t * LAYER_DRIFT[s.layer] * this.opts.speed;
      let x = s.x - drift - this.pointer.x * par;
      let y = s.y - this.pointer.y * par - this.scrollY * 0.02 * (s.layer + 1);
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
      const alpha = this.reduced ? s.a : s.a * (0.72 + 0.28 * Math.sin(t * s.tw + s.ph));
      ctx.fillStyle = `rgba(${s.color},${alpha.toFixed(3)})`;
      if (s.r < 0.8) {
        ctx.fillRect(x, y, s.r * 1.6, s.r * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.layer === 2) {
          ctx.fillStyle = `rgba(${s.color},${(alpha * 0.12).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (this.opts.shootingStars && !this.reduced) this.drawShooting(now);
  }

  private drawShooting(now: number) {
    const { ctx } = this;
    if (!this.shooting && now > this.nextShoot) {
      const fromLeft = Math.random() < 0.5;
      const speed = 900 + Math.random() * 500;
      const angle = (Math.PI / 180) * (18 + Math.random() * 22);
      this.shooting = {
        x: fromLeft ? Math.random() * this.w * 0.5 : this.w * (0.5 + Math.random() * 0.5),
        y: Math.random() * this.h * 0.35,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 0.75 + Math.random() * 0.4,
      };
    }
    const s = this.shooting;
    if (!s) return;
    s.life += 1 / 60;
    const p = s.life / s.max;
    const x = s.x + s.vx * s.life;
    const y = s.y + s.vy * s.life;
    const tail = 0.09;
    const tx = x - s.vx * tail;
    const ty = y - s.vy * tail;
    const fade = Math.sin(Math.min(1, p) * Math.PI);
    const grad = ctx.createLinearGradient(tx, ty, x, y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (p >= 1) {
      this.shooting = null;
      this.scheduleShoot();
    }
  }

  private drawWarp(now: number) {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    const p = Math.min(1, (now - this.warpStart) / this.warpDur);
    const e = p * p * p; // ease-in cubic
    const scale = 1 + e * 9;
    const prev = 1 + Math.max(0, e - 0.06) * 9;
    ctx.lineCap = 'round';
    for (const s of this.stars) {
      const dx = s.x - cx;
      const dy = s.y - cy;
      const x1 = cx + dx * prev;
      const y1 = cy + dy * prev;
      const x2 = cx + dx * scale;
      const y2 = cy + dy * scale;
      ctx.strokeStyle = `rgba(${s.color},${Math.min(1, s.a + e).toFixed(3)})`;
      ctx.lineWidth = s.r * (1 + e * 1.5);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    if (p >= 1) {
      this.warpDur = 0;
      const r = this.warpResolve;
      this.warpResolve = null;
      r?.();
    }
  }
}

declare global {
  interface Window {
    __starfield?: Starfield;
  }
}

export function mountStarfield(canvas: HTMLCanvasElement, opts: StarfieldOptions = {}): Starfield {
  const sf = new Starfield(canvas, opts);
  sf.start();
  window.__starfield = sf;
  return sf;
}
