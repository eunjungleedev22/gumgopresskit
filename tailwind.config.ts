import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0a',
          secondary: '#111111',
          tertiary: '#1a1a1a',
          elevated: '#1f1f1f',
        },
        border: {
          subtle: '#2a2a2a',
          default: '#333333',
          strong: '#444444',
        },
        text: {
          primary: '#f0f0f0',
          secondary: '#a0a0a0',
          muted: '#666666',
          accent: '#7c6af7',
        },
        accent: {
          purple: '#7c6af7',
          'purple-dim': '#4a3f9c',
          green: '#3ecf8e',
          'green-dim': '#1a5c3e',
          orange: '#f97316',
          blue: '#3b82f6',
          pink: '#ec4899',
        },
        tag: {
          web3: '#f97316',
          music: '#ec4899',
          cs: '#3ecf8e',
          community: '#3b82f6',
          growth: '#a855f7',
          ops: '#f59e0b',
          ai: '#7c6af7',
          partnerships: '#06b6d4',
          product: '#10b981',
          startup: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
