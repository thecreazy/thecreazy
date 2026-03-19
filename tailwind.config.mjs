/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg:        '#0a0a0a',
          surface:   '#111111',
          border:    '#2a2a2a',
          purple:    '#b6a8db',
          'purple-glow': '#c9bde8',
          green:     '#55a566',
          'green-dark': '#01470f',
          text:      '#e8e8e8',
          dim:       '#666666',
          // light theme
          'light-bg':      '#f7f7f7',
          'light-surface': '#ffffff',
          'light-border':  '#e0e0e0',
          'light-text':    '#1a1a1a',
          'light-dim':     '#666666',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        terminal: ['VT323', 'monospace'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 0.3s ease infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'type': 'type 2s steps(40) forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%':   { clipPath: 'inset(40% 0 61% 0)', transform: 'translate(-2px, -2px)' },
          '20%':  { clipPath: 'inset(92% 0 1% 0)',  transform: 'translate(1px, 1px)' },
          '40%':  { clipPath: 'inset(43% 0 1% 0)',  transform: 'translate(-1px, 2px)' },
          '60%':  { clipPath: 'inset(25% 0 58% 0)', transform: 'translate(2px, -1px)' },
          '80%':  { clipPath: 'inset(54% 0 7% 0)',  transform: 'translate(-2px, 1px)' },
          '100%': { clipPath: 'inset(58% 0 43% 0)', transform: 'translate(1px, -2px)' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%':   { opacity: '0.97' },
          '50%':  { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
        type: {
          from: { width: '0' },
          to:   { width: '100%' },
        },
      },
    },
  },
  plugins: [],
}
