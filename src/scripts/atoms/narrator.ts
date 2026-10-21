/**
 * Brings the narrator atom to life: electrons on three tilted orbits (front/back depth sorted),
 * a speed that eases with mood, a flapping mouth while it talks. Pauses when off screen.
 */
import { prefersReducedMotion } from '../../lib/motion';

const SVGNS = 'http://www.w3.org/2000/svg';
export type Mood = 'idle' | 'talk' | 'alarm' | 'happy' | 'worried';

const ORBITS = [0, 60, 120].map((d) => (d * Math.PI) / 180);
const RX = 60;
const RY = 21;
const SPEED: Record<Mood, number> = { idle: 1, talk: 2.1, alarm: 5.5, happy: 1.6, worried: 3 };

export class Narrator {
  private back: SVGGElement;
  private front: SVGGElement;
  private electrons: { g: SVGGElement; angle: number; w: number; tilt: number }[] = [];
  private speed = 1;
  private target = 1;
  private raf = 0;
  private last = 0;
  private visible = true;
  private mouthTimer = 0;
  private reduced = prefersReducedMotion();
  mood: Mood = 'idle';

  constructor(private svg: SVGSVGElement) {
    this.back = svg.querySelector('.atom__back')!;
    this.front = svg.querySelector('.atom__front')!;
    ORBITS.forEach((tilt, i) => {
      const g = document.createElementNS(SVGNS, 'g');
      const halo = document.createElementNS(SVGNS, 'circle');
      halo.setAttribute('r', '9');
      halo.setAttribute('class', 'electron-halo');
      const e = document.createElementNS(SVGNS, 'circle');
      e.setAttribute('r', '4.6');
      e.setAttribute('class', 'electron');
      g.append(halo, e);
      this.electrons.push({ g, angle: i * 2.1 + 0.6, w: 1.25 + i * 0.22, tilt });
    });
    this.place();

    if (!this.reduced) {
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.start();
      }).observe(svg);
      document.addEventListener('visibilitychange', () => !document.hidden && this.start());
      this.start();
    }
  }

  private place() {
    for (const el of this.electrons) {
      const lx = RX * Math.cos(el.angle);
      const ly = RY * Math.sin(el.angle);
      const c = Math.cos(el.tilt);
      const s = Math.sin(el.tilt);
      const x = lx * c - ly * s;
      const y = lx * s + ly * c;
      const inFront = ly > 0;
      const parent = inFront ? this.front : this.back;
      if (el.g.parentNode !== parent) parent.appendChild(el.g);
      const k = inFront ? 1 : 0.82;
      el.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k})`);
      el.g.style.opacity = inFront ? '1' : '0.7';
    }
  }

  private start() {
    if (this.reduced || this.raf || !this.visible || document.hidden) return;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.speed += (this.target - this.speed) * Math.min(1, dt * 3);
      for (const el of this.electrons) el.angle += dt * el.w * this.speed;
      this.place();
      if (!this.visible || document.hidden) {
        this.raf = 0;
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setMood(m: Mood) {
    this.mood = m;
    this.svg.dataset.mood = m === 'talk' ? 'idle' : m;
    this.target = SPEED[m];
    if (m === 'alarm' || m === 'worried') this.svg.dataset.mouth = 'o';
    else if (m !== 'talk') this.svg.dataset.mouth = 'smile';
  }

  /** Mouth flaps while text types out. */
  talk(on: boolean) {
    clearInterval(this.mouthTimer);
    if (on) {
      this.target = Math.max(this.target, SPEED.talk);
      if (this.reduced) return;
      let open = false;
      this.mouthTimer = window.setInterval(() => {
        open = !open;
        this.svg.dataset.mouth = open ? 'o' : this.mood === 'alarm' || this.mood === 'worried' ? 'flat' : 'smile';
      }, 120);
    } else {
      this.target = SPEED[this.mood];
      this.svg.dataset.mouth = this.mood === 'alarm' || this.mood === 'worried' ? 'o' : 'smile';
    }
  }
}
