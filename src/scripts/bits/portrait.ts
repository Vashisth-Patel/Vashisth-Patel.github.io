/**
 * `whoami` portrait: the site photo, cropped to the face and ordered-dithered into four phosphor
 * levels on a canvas. Sky pixels are dropped and foliage dimmed so the face carries the image.
 * Fails silently (the text still prints).
 */
import { h } from './dom';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const LEVELS: [number, number, number][] = [
  [2, 10, 6],
  [14, 70, 38],
  [40, 170, 95],
  [150, 255, 190],
];

export function portrait(src: string, alt: string): HTMLElement {
  const S = 88;
  const canvas = h('canvas', { width: S, height: S, class: 'bt-portrait-c', role: 'img', 'aria-label': alt });
  const fig = h('figure', { class: 'bt-portrait' }, canvas);
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    // The face, from the 800×800 photo.
    const k = img.naturalWidth / 800;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 282 * k, 138 * k, 272 * k, 272 * k, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S);
    const px = d.data;
    const lum = new Float32Array(S * S);
    const seen: number[] = [];
    for (let i = 0; i < S * S; i++) {
      const r = px[i * 4],
        g = px[i * 4 + 1],
        b = px[i * 4 + 2];
      const sky = b > 150 && b > r + 35 && g > r;
      const foliage = g > r + 12 && g > b + 8;
      let l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (sky) l = -1;
      else if (foliage) l *= 0.4;
      lum[i] = l;
      if (l >= 0) seen.push(l);
    }
    // Percentile contrast stretch: ignore the darkest 3% and the brightest 1.5%.
    seen.sort((a, b) => a - b);
    const lo = seen[Math.floor(seen.length * 0.03)] ?? 0;
    const hi = seen[Math.floor(seen.length * 0.985)] ?? 1;
    const span = Math.max(0.05, hi - lo);
    const n = LEVELS.length - 1;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        let v = lum[i] < 0 ? 0 : Math.pow(Math.min(1, Math.max(0, (lum[i] - lo) / span)), 0.8);
        const dx = x / S - 0.5,
          dy = y / S - 0.45;
        v *= Math.max(0, 1 - (dx * dx + dy * dy) * 1.4); // soft vignette
        const scaled = v * n;
        const base = Math.floor(scaled);
        const level = Math.min(n, base + (scaled - base > BAYER[(y % 4) * 4 + (x % 4)] ? 1 : 0));
        const [r, g, b] = LEVELS[level];
        px[i * 4] = r;
        px[i * 4 + 1] = g;
        px[i * 4 + 2] = b;
        px[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(d, 0, 0);
    fig.classList.add('is-ready');
  };
  img.onerror = () => fig.remove();
  img.src = src;
  return fig;
}
