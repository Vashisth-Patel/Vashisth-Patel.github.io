/** Entry point for the ATOMS page. */
import { initWarpLinks } from '../warp';
import { initStage } from './stage';
import { initSystem } from './system';
import { initFacts } from './facts';
import { track } from '../../lib/track';

initWarpLinks();
initFacts();
initSystem();
initStage();

document.querySelectorAll<HTMLElement>('#listview [data-track]').forEach((el) =>
  el.addEventListener('click', () => track(el.dataset.track!)),
);
