/**
 * Fake crash: shake, white flash, black glitch screen, then "[ Reboot the universe ]" plays a tiny
 * Big Bang (a white dot that bursts into stars) and hands control back to the quiz.
 * Everything stays inside the page; Esc also reboots once the button is up.
 */
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';
import { pause, resume, sleep } from './bus';

const html = document.documentElement;

export async function runCrash(): Promise<void> {
  const root = document.getElementById('crash');
  if (!root) return;
  const screen = root.querySelector<HTMLElement>('.crash__screen')!;
  const flash = root.querySelector<HTMLElement>('.crash__flash')!;
  const canvas = root.querySelector<HTMLCanvasElement>('.crash__bang')!;
  const reboot = root.querySelector<HTMLButtonElement>('#crash-reboot')!;
  const reduced = prefersReducedMotion();

  pause('crash');

  if (!reduced) {
    html.classList.add('atm-shaking');
    await sleep(620);
    html.classList.remove('atm-shaking');
  }

  root.hidden = false;
  root.dataset.step = '0';
  screen.style.opacity = '1';
  html.classList.add('atm-locked');
  root.tabIndex = -1;
  root.focus({ preventScroll: true });

  // keep focus inside the dialog
  const trap = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (root.dataset.step === '4') reboot.focus();
    }
  };
  document.addEventListener('keydown', trap, true);

  if (!reduced) {
    flash.animate([{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 560, easing: 'ease-out' });
  }
  await sleep(reduced ? 100 : 380);
  root.dataset.step = '1';
  await sleep(reduced ? 300 : 650);
  root.dataset.step = '2';
  await sleep(reduced ? 400 : 700);
  root.dataset.step = '3';
  await sleep(reduced ? 600 : 900);
  root.dataset.step = '4';
  reboot.focus({ preventScroll: true });

  await new Promise<void>((done) => {
    const finish = () => {
      reboot.removeEventListener('click', finish);
      document.removeEventListener('keydown', onKey, true);
      done();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    reboot.addEventListener('click', finish);
    document.addEventListener('keydown', onKey, true);
  });

  track('atoms-quiz-reboot');
  root.dataset.step = '5';
  await bigBang(canvas, screen, reduced);

  document.removeEventListener('keydown', trap, true);
  root.hidden = true;
  delete root.dataset.step;
  html.classList.remove('atm-locked');
  resume('crash');
}

interface P { a: number; v: number; r: number; c: string; tw: number }

async function bigBang(canvas: HTMLCanvasElement, screen: HTMLElement, reduced: boolean) {
  if (reduced) {
    await sleep(350);
    screen.style.opacity = '0';
    await sleep(450);
    return;
  }
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (!ctx) {
    screen.style.opacity = '0';
    await sleep(900);
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2;
  const cy = h / 2;
  const reach = Math.hypot(w, h) * 0.62;
  const palette = ['255,255,255', '255,246,230', '232,131,58', '242,176,125', '190,210,255'];
  const parts: P[] = Array.from({ length: Math.min(700, Math.round((w * h) / 2600)) }, () => ({
    a: Math.random() * Math.PI * 2,
    v: Math.pow(Math.random(), 0.7),
    r: 0.5 + Math.random() * 1.5,
    c: palette[Math.random() < 0.55 ? 0 : 1 + Math.floor(Math.random() * 4)],
    tw: Math.random() * Math.PI * 2,
  }));

  const GROW = 750;
  const BANG = 1900;
  const start = performance.now();
  let faded = false;

  await new Promise<void>((done) => {
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);

      if (t < GROW) {
        // the singularity: a dot that swells and trembles
        const p = t / GROW;
        const r = 1 + p * p * 7 + Math.sin(t / 30) * p * 0.8;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 6);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.2, 'rgba(255,240,220,0.9)');
        g.addColorStop(1, 'rgba(232,131,58,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const b = Math.min(1, (t - GROW) / BANG);
        const ease = 1 - Math.pow(1 - b, 4);
        if (!faded && b > 0.12) {
          faded = true;
          screen.style.opacity = '0';
        }
        // the flash of the bang
        if (b < 0.25) {
          const fl = 1 - b / 0.25;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + b * reach);
          g.addColorStop(0, `rgba(255,255,255,${0.95 * fl})`);
          g.addColorStop(1, 'rgba(255,200,150,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        const alpha = b < 0.7 ? 1 : 1 - (b - 0.7) / 0.3;
        for (const s of parts) {
          const d = ease * s.v * reach;
          const x = cx + Math.cos(s.a) * d;
          const y = cy + Math.sin(s.a) * d;
          const tw = 0.65 + 0.35 * Math.sin(t / 90 + s.tw);
          ctx.fillStyle = `rgba(${s.c},${(alpha * tw).toFixed(3)})`;
          // streak while fast, dot when slow
          const streak = (1 - ease) * 18 * s.v;
          if (streak > 1.2) {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = s.r;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(s.a) * streak, y - Math.sin(s.a) * streak);
            ctx.stroke();
          } else {
            ctx.fillRect(x, y, s.r, s.r);
          }
        }
      }

      if (t < GROW + BANG) requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, w, h);
        done();
      }
    };
    requestAnimationFrame(frame);
  });
}
