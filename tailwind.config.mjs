/** @type {import('tailwindcss').Config} */
export default {
  // Only the legacy pages (/resume, fintech demo) and the classic view use Tailwind utilities.
  content: [
    './src/pages/resume.astro',
    './src/pages/projects/**/*.astro',
    './src/components/legacy/**/*.astro',
    './src/pages/classic/**/*.astro',
    './src/components/classic/**/*.astro',
    './src/layouts/LegacyLayout.astro',
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#0a192f',
        'light-navy': '#112240',
        'lightest-navy': '#233554',
        'slate': '#8892b0',
        'light-slate': '#a8b2d1',
        'lightest-slate': '#ccd6f6',
        'white': '#e6f1ff',
        'green': '#64ffda',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'SF Mono', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
