/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f0f0f',
        'dark-surface': '#1a1a1a',
        'dark-surface-alt': '#252525',
        'dark-border': '#333333',
        'dark-text': '#e0e0e0',
        'threat-high': '#ef4444',
        'threat-medium': '#f59e0b',
        'threat-low': '#10b981',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
