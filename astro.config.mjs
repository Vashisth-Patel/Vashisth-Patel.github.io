import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://your-username.github.io', // Replace with your GitHub username
  base: '/your-repo-name',                  // Replace with your repository name (e.g., '/portfolio')
  vite: {
    plugins: [tailwindcss()],
  },
});