import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // SITE is your top-level domain
  site: 'https://Vashisth-Patel.github.io',

  // BASE must be your exact repository name with leading/trailing slashes
  // Note: Case sensitivity matters! If your repo is "Vashisth-Patel.github.io", use that.
  base: '/Vashisth-Patel.github.io/',

  integrations: [tailwind()],
});