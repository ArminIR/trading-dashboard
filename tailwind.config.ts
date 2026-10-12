import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#09090b',
        panel: '#111217',
        soft: '#181922',
        border: '#242736',
        text: '#f4f4f5',
        muted: '#a1a1aa',
        accent: '#5eead4',
        danger: '#fb7185',
        success: '#34d399',
        warning: '#f59e0b',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.03), 0 10px 40px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
