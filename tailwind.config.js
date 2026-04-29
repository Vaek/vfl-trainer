/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#0a1628',
        paper: '#fbf7f0',
        signal: '#d64545',
        sky: '#3a6fb0',
        sand: '#e8dcc4',
        muted: '#6b7a8a',
      },
      boxShadow: {
        card: '0 1px 0 rgba(10,22,40,0.06), 0 8px 24px -12px rgba(10,22,40,0.18)',
        'card-hover': '0 1px 0 rgba(10,22,40,0.08), 0 16px 32px -16px rgba(10,22,40,0.25)',
      },
    },
  },
  plugins: [],
}
