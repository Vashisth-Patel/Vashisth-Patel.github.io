/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a192f',        // Dark Blue Background
        'light-navy': '#112240', // Slightly lighter (for cards)
        'lightest-navy': '#233554',
        slate: '#8892b0',       // Main text color (grey-blue)
        'light-slate': '#a8b2d1', // Brighter text
        'lightest-slate': '#ccd6f6', // Brightest text (Headlines)
        white: '#e6f1ff',
        green: '#64ffda',       // ⭐ The Brittany "Teal/Green"
      },
      fontFamily: {
        sans: ['Calibre', 'Inter', 'San Francisco', 'SF Pro Text', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};