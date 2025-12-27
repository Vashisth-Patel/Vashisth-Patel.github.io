import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite'; // [1] Import Tailwind

export default defineConfig({
  vite: {
    plugins: [tailwindcss()], // [2] Add to Vite plugins
  },
});