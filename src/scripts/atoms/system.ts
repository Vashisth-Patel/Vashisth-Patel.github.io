/**
 * The planet system.
 * - Orrery: planets on tilted elliptical orbits, depth-sorted around the sun; they slow under the
 *   pointer and stop while a planet has focus. Mobile (<=760px) gets a static vertical stack.
 * - Planet view: a dialog that zooms out of the clicked planet; moons orbit the big planet and are
 *   mirrored as chips (the accessible list). Moon cards sit beside the planet, or as a bottom sheet.
 * - Routing: #p-<planet> and #m-<moon> deep links; the back button / gesture closes one level.
 * - List view toggle, remembered for the session.
 */
import { planets } from '../../data/atoms';
import { prefersReducedMotion } from '../../lib/motion';
import { track } from '../../lib/track';
import { on, pause, resume, store } from './bus';

interface Route { planet?: string; moon?: string }

const TAU = Math.PI * 2;
const SNAP = 'cubic-bezier(0.2, 0.9, 0.1, 1)';
const html = document.documentElement;

export function initSystem() {
  const system = document.getElementById('system');
  const pview = document.getElementById('pview');
  if (!system || !pview) return;

  // The planet view is a full-screen dialog. <main> is its own stacking layer (z-index: 1) below the
  // fixed WorldNav (z-index: 50), so inside <main> the nav covered the dialog's top bar and took its
  // clicks. On <body> the dialog's z-index (60) puts it above the nav.
  if (pview.parentElement !== document.body) document.body.appendChild(pview);

  const reduced = prefersReducedMotion();
  const mqMobile = window.matchMedia('(max-width: 760px)');
  const orrery = document.getElementById('orrery')!;
  const orbitsSvg = document.getElementById('orrery-orbits') as unknown as SVGSVGElement;
  const items = [...orrery.querySelectorAll<HTMLElement>('.planet-item')];
  const pvs = new Map([...pview.querySelectorAll<HTMLElement>('.pv')].map((el) => [el.dataset.pv!, el]));
  const card = document.getElementById('card')!;
  const cardBody = document.getElementById('card-body')!;
  const cardPrev = document.getElementById('card-prev') as HTMLButtonElement;
  const cardNext = document.getElementById('card-next') as HTMLButtonElement;
  const cardPos = document.getElementById('card-pos')!;
  const scrim = document.getElementById('card-scrim')!;
  const pviewTitle = document.getElementById('pview-title')!;
  const templates = new Map(
    [...pview.querySelectorAll<HTMLTemplateElement>('template[data-card]')].map((t) => [t.dataset.card!, t]),
  );
  const moonPlanet = new Map<string, string>();
  planets.forEach((p) => p.moons.forEach((m) => m.project && moonPlanet.set(m.id, p.id)));
  const planetIds = new Set(planets.map((p) => p.id));

  /* ------------------------------------------------------------ view toggle */

  const toggles = [...system.querySelectorAll<HTMLButtonElement>('[data-set-view]')];
  function setView(v: 'orbit' | 'list', user = false) {
    system!.dataset.view = v;
    toggles.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setView === v)));
    if (user) {
      store.set('atoms-view', v);
      if (v === 'list') track('atoms-listview');
    }
    if (v === 'orbit') {
      layoutOrrery();
      kick();
    }
  }
  toggles.forEach((b) => b.addEventListener('click', () => setView(b.dataset.setView as 'orbit' | 'list', true)));

  /* ----------------------------------------------------------------- orrery */

  const PERIODS = [46, 62, 80, 98, 120];
  const START = [0.5, 2.55, 4.3, 1.45, 5.55];
  const orb = items.map((li, i) => ({ li, a: START[i] ?? i, rx: 0, ry: 0, period: PERIODS[i] ?? 100, ell: null as SVGEllipseElement | null }));
  let cx = 0;
  let cy = 0;
  let speed = 1;
  let speedTarget = 1;
  let raf = 0;
  let last = 0;
  let inView = false;
  let hovering = false;
  let focusInside = false;

  function layoutOrrery() {
    if (mqMobile.matches || system!.dataset.view !== 'orbit') {
      items.forEach((li) => (li.style.transform = ''));
      return;
    }
    const W = orrery.clientWidth;
    const rxMax = Math.max(220, Math.min(W / 2 - 64, 560));
    const ratio = 0.36;
    const H = Math.round(rxMax * ratio * 2 + 150);
    orrery.style.setProperty('--orrery-h', `${H}px`);
    cx = W / 2;
    cy = H / 2;
    orbitsSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    orb.forEach((o, i) => {
      o.rx = rxMax * (0.32 + 0.17 * i);
      o.ry = o.rx * ratio;
      if (!o.ell) {
        o.ell = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        o.ell.dataset.planet = o.li.dataset.planet;
        orbitsSvg.appendChild(o.ell);
      }
      o.ell.setAttribute('cx', String(cx));
      o.ell.setAttribute('cy', String(cy));
      o.ell.setAttribute('rx', o.rx.toFixed(1));
      o.ell.setAttribute('ry', o.ry.toFixed(1));
    });
    placePlanets();
  }

  function placePlanets() {
    for (const o of orb) {
      const s = Math.sin(o.a);
      const x = cx + o.rx * Math.cos(o.a);
      const y = cy + o.ry * s;
      const k = 0.82 + 0.18 * ((s + 1) / 2);
      o.li.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${k.toFixed(3)})`;
      o.li.style.zIndex = s > 0 ? '4' : '1';
      o.li.style.opacity = (0.62 + 0.38 * ((s + 1) / 2)).toFixed(3);
    }
  }

  const loopWanted = () =>
    !reduced && inView && !document.hidden && !mqMobile.matches && system!.dataset.view === 'orbit' && pview!.hidden;

  function kick() {
    if (raf || !loopWanted()) return;
    last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speedTarget = focusInside ? 0 : hovering ? 0.18 : 1;
      speed += (speedTarget - speed) * Math.min(1, dt * 4);
      for (const o of orb) o.a = (o.a + (dt * TAU * speed) / o.period) % TAU;
      placePlanets();
      raf = loopWanted() ? requestAnimationFrame(frame) : 0;
    };
    raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    kick();
  }).observe(orrery);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => layoutOrrery()).observe(orrery);
  mqMobile.addEventListener('change', () => {
    layoutOrrery();
    kick();
  });

  orrery.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (hovering = true));
  orrery.addEventListener('pointerleave', () => (hovering = false));
  orrery.addEventListener('focusin', () => (focusInside = true));
  orrery.addEventListener('focusout', () => (focusInside = false));

  items.forEach((li, i) => {
    const btn = li.querySelector<HTMLButtonElement>('.planet')!;
    const hot = (v: boolean) => {
      const ell = orb[i].ell;
      if (!ell) return;
      ell.toggleAttribute('data-hot', v);
      ell.style.setProperty('--hot', getComputedStyle(li.querySelector('.atm-pb')!).getPropertyValue('--tint'));
    };
    btn.addEventListener('mouseenter', () => hot(true));
    btn.addEventListener('mouseleave', () => hot(false));
    btn.addEventListener('focus', () => hot(true));
    btn.addEventListener('blur', () => hot(false));
    btn.addEventListener('click', () => {
      opener = btn;
      originEl = li.querySelector('.atm-pb');
      go({ planet: li.dataset.planet });
    });
  });
  setView(system.dataset.view === 'list' ? 'list' : 'orbit');

  /* ------------------------------------------------------------ planet view */

  let opener: HTMLElement | null = null;
  let originEl: Element | null = null;
  let pvRaf = 0;
  let pvPhase = 0;
  let pvHover = false;

  function activePv() {
    return current.planet ? pvs.get(current.planet) ?? null : null;
  }

  function layoutPv(pv: HTMLElement) {
    const orbit = pv.querySelector<HTMLElement>('.pv__orbit')!;
    const world = pv.querySelector<HTMLElement>('.pv__world')!;
    const mobile = mqMobile.matches;
    const availW = mobile ? Math.min(window.innerWidth - 32, 420) : world.clientWidth;
    const availH = mobile ? 300 : Math.max(380, world.clientHeight - 20);
    const big = Math.round(mobile ? Math.min(availW * 0.4, 150) : Math.min(availW * 0.4, availH * 0.52, 280));
    const rx = Math.min(big / 2 + (mobile ? 58 : 100), availW / 2 - (mobile ? 50 : 90));
    const ry = rx * 0.5;
    const w = Math.round(rx * 2 + 40);
    const h = Math.round(Math.max(big + 40, ry * 2 + 50));
    orbit.style.setProperty('--big', `${big}px`);
    orbit.style.setProperty('--orbit-w', `${w}px`);
    orbit.style.setProperty('--orbit-h', `${h}px`);
    orbit.dataset.rx = String(rx);
    orbit.dataset.ry = String(ry);
    const ring = orbit.querySelector('ellipse')!;
    const svg = orbit.querySelector('svg')!;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    ring.setAttribute('cx', String(w / 2));
    ring.setAttribute('cy', String(h / 2));
    ring.setAttribute('rx', rx.toFixed(1));
    ring.setAttribute('ry', ry.toFixed(1));
    placeMoons(pv);
  }

  function placeMoons(pv: HTMLElement) {
    const orbit = pv.querySelector<HTMLElement>('.pv__orbit')!;
    const moons = [...orbit.querySelectorAll<HTMLElement>('.moon')];
    const rx = Number(orbit.dataset.rx);
    const ry = Number(orbit.dataset.ry);
    const w = orbit.clientWidth;
    const h = orbit.clientHeight;
    const n = moons.length;
    moons.forEach((m, k) => {
      const a = pvPhase + (k * TAU) / n + 0.35;
      const s = Math.sin(a);
      const x = w / 2 + rx * Math.cos(a);
      const y = h / 2 + ry * s;
      const scale = 0.78 + 0.22 * ((s + 1) / 2);
      m.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      m.style.zIndex = s > 0 ? '3' : '1';
      m.style.opacity = s > 0 ? '1' : (0.45 + 0.4 * (s + 1)).toFixed(3);
    });
  }

  function startMoons() {
    if (pvRaf || reduced) return;
    let t0 = performance.now();
    let sp = 1;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const pv = activePv();
      if (!pv || pview!.hidden) {
        pvRaf = 0;
        return;
      }
      sp += ((pvHover ? 0.08 : 1) - sp) * Math.min(1, dt * 4);
      pvPhase = (pvPhase + (dt * TAU * sp) / 70) % TAU;
      placeMoons(pv);
      pvRaf = requestAnimationFrame(frame);
    };
    pvRaf = requestAnimationFrame(frame);
  }

  function center(el: Element | null) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > window.innerHeight) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  }

  async function openPlanet(id: string, animate: boolean) {
    const pv = pvs.get(id);
    if (!pv) return;
    const planet = planets.find((p) => p.id === id)!;
    pvs.forEach((el, k) => (el.hidden = k !== id));
    pview!.dataset.pv = id;
    pview!.hidden = false;
    pviewTitle.textContent = `${planet.name}: ${planet.field}`;
    html.classList.add('atm-locked');
    pause('planet');
    track(`atoms-planet-${id}`);
    layoutPv(pv);
    startMoons();

    const title = pv.querySelector<HTMLElement>('[data-pv-title]')!;
    title.focus({ preventScroll: true });

    if (!animate || reduced) return;
    const from = center(originEl);
    originEl = null;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ox = from?.x ?? W / 2;
    const oy = from?.y ?? H / 2;
    const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
    pview!.animate(
      [{ clipPath: `circle(${from ? from.w / 2 : 0}px at ${ox}px ${oy}px)` }, { clipPath: `circle(${R}px at ${ox}px ${oy}px)` }],
      { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
    );
    const big = pv.querySelector<HTMLElement>('.pv__planet')!;
    const to = center(big);
    if (from && to) {
      big.animate(
        [
          { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.w / to.w})` },
          { transform: 'none' },
        ],
        { duration: 900, easing: SNAP },
      );
    } else {
      big.animate([{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, easing: SNAP });
    }
    pv.querySelectorAll<HTMLElement>('.moon').forEach((m, k) =>
      m.animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 + k * 0.06 }, { opacity: 1 }], { duration: 1100, easing: 'ease-out' }),
    );
    pv.querySelector('.pv__info')?.animate(
      [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 0, offset: 0.35 }, { opacity: 1, transform: 'none' }],
      { duration: 900, easing: SNAP },
    );
  }

  async function closePlanet(animate: boolean) {
    const id = current.planet;
    if (animate && !reduced && id) {
      const target =
        system!.dataset.view === 'orbit' ? center(orrery.querySelector(`[data-planet='${id}'] .atm-pb`)) : null;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const ox = target?.x ?? W / 2;
      const oy = target?.y ?? H / 2;
      const R = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
      const anim = pview!.animate(
        [{ clipPath: `circle(${R}px at ${ox}px ${oy}px)` }, { clipPath: `circle(${target ? target.w / 2 : 0}px at ${ox}px ${oy}px)` }],
        { duration: 560, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
      );
      await anim.finished.catch(() => {});
    }
    pview!.hidden = true;
    delete pview!.dataset.pv;
    html.classList.remove('atm-locked');
    resume('planet');
    const back =
      opener && opener.isConnected && opener.offsetParent
        ? opener
        : orrery.querySelector<HTMLElement>(`[data-planet='${id}'] .planet`);
    if (back && back.offsetParent) back.focus({ preventScroll: true });
    else document.getElementById('system-title')?.focus({ preventScroll: true });
    opener = null;
    kick();
  }

  pview.addEventListener('pointerover', (e) => {
    pvHover = !!(e.target as Element).closest('.moon, .chip');
    const id = (e.target as Element).closest<HTMLElement>('[data-chip]')?.dataset.chip;
    pview.querySelectorAll('.moon[data-hot]').forEach((m) => m.removeAttribute('data-hot'));
    if (id) pview.querySelector(`.moon[data-moon='${id}']`)?.setAttribute('data-hot', '');
  });
  pview.addEventListener('focusin', (e) => {
    const id = (e.target as Element).closest<HTMLElement>('[data-chip]')?.dataset.chip;
    pview.querySelectorAll('.moon[data-hot]').forEach((m) => m.removeAttribute('data-hot'));
    if (id) {
      pvHover = true;
      pview.querySelector(`.moon[data-moon='${id}']`)?.setAttribute('data-hot', '');
    }
  });
  pview.addEventListener('focusout', () => (pvHover = false));

  pview.addEventListener('click', (e) => {
    const t = e.target as Element;
    const moon = t.closest<HTMLElement>('button.moon, [data-open-moon]');
    if (moon) {
      const id = moon.dataset.moon ?? moon.dataset.openMoon!;
      const chip = pview.querySelector<HTMLElement>(`[data-chip='${id}']`);
      cardOpener = chip;
      go({ planet: current.planet, moon: id }, !current.moon);
      return;
    }
    const worm = t.closest<HTMLElement>('[data-chip="wormhole"], .moon--worm');
    if (worm) track('atoms-moon-wormhole');
  });

  document.getElementById('pview-back')!.addEventListener('click', () => up(true));
  document.getElementById('pview-esc')?.addEventListener('click', () => up(true));

  /* ------------------------------------------------------------------ cards */

  let cardOpener: HTMLElement | null = null;

  function cardMoons() {
    const p = planets.find((x) => x.id === current.planet);
    return p ? p.moons.filter((m) => m.project).map((m) => m.id) : [];
  }

  function openCard(id: string, animate: boolean) {
    const tpl = templates.get(id);
    if (!tpl) return;
    const wasOpen = !card.hidden;
    cardBody.replaceChildren(tpl.content.cloneNode(true));
    cardBody.scrollTop = 0;
    card.hidden = false;
    card.style.transform = '';
    pview!.dataset.card = '';
    scrim.hidden = !mqMobile.matches;
    const title = cardBody.querySelector<HTMLElement>('.atm-mc__title');
    card.setAttribute('aria-label', title?.textContent ?? 'Project');
    pview!.querySelectorAll('[data-active]').forEach((el) => el.removeAttribute('data-active'));
    pview!.querySelectorAll(`[data-moon='${id}'], [data-chip='${id}']`).forEach((el) => el.setAttribute('data-active', ''));

    const list = cardMoons();
    const i = list.indexOf(id);
    cardPrev.disabled = i <= 0;
    cardNext.disabled = i >= list.length - 1;
    cardPos.textContent = list.length > 1 ? `${i + 1} / ${list.length}` : '';
    card.querySelector('.card__nav')!.toggleAttribute('hidden', list.length < 2);

    pause('card');
    track(`atoms-moon-${id}`);
    const pv = activePv();
    if (pv) requestAnimationFrame(() => layoutPv(pv));

    if (animate && !reduced) {
      if (wasOpen) {
        cardBody.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      } else if (mqMobile.matches) {
        card.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 480, easing: SNAP });
        scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      } else {
        card.animate([{ opacity: 0, transform: 'translateX(40px) scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: SNAP });
      }
    }
    title?.focus({ preventScroll: true });
  }

  async function closeCard(animate: boolean) {
    if (card.hidden) return;
    if (animate && !reduced) {
      const a = mqMobile.matches
        ? card.animate([{ transform: card.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: 320, easing: 'ease-in' })
        : card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(30px)' }], { duration: 260, easing: 'ease-in' });
      if (!scrim.hidden) scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320 });
      await a.finished.catch(() => {});
    }
    card.hidden = true;
    card.style.transform = '';
    scrim.hidden = true;
    delete pview!.dataset.card;
    pview!.querySelectorAll('[data-active]').forEach((el) => el.removeAttribute('data-active'));
    resume('card');
    const pv = activePv();
    if (pv) requestAnimationFrame(() => layoutPv(pv));
  }

  document.getElementById('card-close')!.addEventListener('click', () => up(true));
  scrim.addEventListener('click', () => up(true));
  const step = (d: number) => {
    const list = cardMoons();
    const i = list.indexOf(current.moon ?? '');
    const next = list[i + d];
    if (next) go({ planet: current.planet, moon: next }, false);
  };
  cardPrev.addEventListener('click', () => step(-1));
  cardNext.addEventListener('click', () => step(1));

  // drag the bottom sheet down to dismiss
  const grab = document.getElementById('card-grab')!;
  let dragY0 = -1;
  let dragDy = 0;
  grab.addEventListener('pointerdown', (e) => {
    dragY0 = e.clientY;
    dragDy = 0;
    grab.setPointerCapture(e.pointerId);
  });
  grab.addEventListener('pointermove', (e) => {
    if (dragY0 < 0) return;
    dragDy = Math.max(0, e.clientY - dragY0);
    card.style.transform = `translateY(${dragDy}px)`;
  });
  const endDrag = () => {
    if (dragY0 < 0) return;
    dragY0 = -1;
    if (dragDy > 90) up(true);
    else if (dragDy > 0) {
      card.animate([{ transform: card.style.transform }, { transform: 'none' }], { duration: 260, easing: SNAP });
      card.style.transform = '';
    }
  };
  grab.addEventListener('pointerup', endDrag);
  grab.addEventListener('pointercancel', endDrag);

  /* ---------------------------------------------------------------- routing */

  let current: Route = {};
  let queue: Promise<void> = Promise.resolve();

  function parse(hash: string): Route {
    const m = /^#m-(.+)$/.exec(hash);
    if (m && moonPlanet.has(m[1])) return { planet: moonPlanet.get(m[1]), moon: m[1] };
    const p = /^#p-(.+)$/.exec(hash);
    if (p && planetIds.has(p[1])) return { planet: p[1] };
    return {};
  }

  function apply(route: Route, animate = true) {
    queue = queue.then(async () => {
      if (route.planet !== current.planet) {
        if (current.planet) {
          await closeCard(false);
          if (route.planet) {
            current = {};
          } else {
            await closePlanet(animate);
            current = {};
          }
        }
        if (route.planet) {
          current = { planet: route.planet };
          await openPlanet(route.planet, animate);
        }
      }
      if (route.moon !== current.moon) {
        if (route.moon) {
          current = { ...current, moon: route.moon };
          openCard(route.moon, animate);
        } else {
          current = { planet: current.planet };
          await closeCard(animate);
          const back = cardOpener && cardOpener.isConnected ? cardOpener : null;
          back?.focus({ preventScroll: true });
          if (!back) activePv()?.querySelector<HTMLElement>('[data-pv-title]')?.focus({ preventScroll: true });
          cardOpener = null;
        }
      }
    });
    return queue;
  }

  function urlFor(r: Route) {
    if (r.moon) return `#m-${r.moon}`;
    if (r.planet) return `#p-${r.planet}`;
    return location.pathname + location.search;
  }

  function go(route: Route, push = true) {
    if (push) history.pushState({ atomsBack: true }, '', urlFor(route));
    else history.replaceState({ atomsBack: !!history.state?.atomsBack }, '', urlFor(route));
    return apply(route);
  }

  /** Close one level: the card, else the planet view. */
  function up(fromUi = false) {
    if (!current.planet) return;
    const target: Route = current.moon ? { planet: current.planet } : {};
    if (fromUi && history.state?.atomsBack) history.back();
    else go(target, false);
  }

  window.addEventListener('popstate', () => apply(parse(location.hash)));

  // keyboard: Esc closes one level, Tab stays inside the planet view
  document.addEventListener('keydown', (e) => {
    if (pview!.hidden) return;
    const crash = document.getElementById('crash');
    if (crash && !crash.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      up(true);
      return;
    }
    if (e.key === 'Tab') {
      const nodes = [...pview!.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')].filter(
        (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled') && el.getClientRects().length > 0 && !el.closest('[hidden]'),
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !pview!.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !pview!.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    const pv = activePv();
    if (pv && !pview.hidden) layoutPv(pv);
  });

  /* --------------------------------------------------------- page-level hooks */

  on<string>('open-moon', (id) => {
    const planet = moonPlanet.get(id);
    if (!planet) return;
    cardOpener = null;
    if (current.planet !== planet) go({ planet });
    go({ planet, moon: id });
  });

  on('go-explore', () => {
    const title = document.getElementById('system-title');
    system.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => title?.focus({ preventScroll: true }), reduced ? 0 : 700);
  });

  // deep link on load
  const initial = parse(location.hash);
  if (initial.planet) {
    history.replaceState({ atomsBack: false }, '', location.href);
    apply(initial, false);
  }
}
