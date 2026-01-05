import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Use your actual GitHub username and repo name here
  site: 'https://Vashisth-Patel.github.io',
  base: '/Vashisth-Patel.github.io',
  integrations: [tailwind()],
});