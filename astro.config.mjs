// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Staging builds live under a subpath (vashisthpatel.com/vashisthpatel-v2/ via GitHub Pages).
// Production (vashisthpatel.com) uses "/". Always build links with withBase() from src/lib/url.ts.
const base = process.env.SITE_BASE ?? '/';
const site = process.env.SITE_URL ?? 'https://vashisthpatel.com';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // Tailwind is only for the ported legacy pages (/resume, /projects/fintech-qualifier).
  // Base styles are NOT injected globally; LegacyLayout imports styles/legacy.css itself.
  integrations: [tailwind({ applyBaseStyles: false })],
});
