import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // SITE is your top-level domain
  site: 'https://Vashisth-Patel.github.io',

  // For 'username.github.io' repos, BASE should usually be empty or just a slash
  base: '/',

  integrations: [tailwind()],
});