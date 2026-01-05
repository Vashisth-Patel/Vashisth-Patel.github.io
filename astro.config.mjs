import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://github.com/Vashisth-Patel/Vashisth-Patel.github.io', // Replace with your GitHub username
  base: '/Vashisth-Patel.github.io',                  // Replace with your repository name (e.g., '/portfolio')
  vite: {
    plugins: [tailwindcss()],
  },
});