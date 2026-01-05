import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // SITE must be your full GitHub URL
  site: 'https://Vashisth-Patel.github.io',
  // BASE must be your repository name with leading and trailing slashes
  base: '/Vashisth-Patel.github.io',
  integrations: [tailwind()],
});