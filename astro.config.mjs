import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://Vashisth-Patel.github.io',
  base: '/Vashisth-Patel.github.io',
  integrations: [tailwind()],
  build: {
    // This ensures assets are easy for GitHub to find
    assets: '_assets'
  },
  // This helps with path resolution on subfolders
  trailingSlash: 'always'
});