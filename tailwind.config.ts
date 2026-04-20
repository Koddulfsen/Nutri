import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyan-Magenta Frost Design System
        cyan: {
          DEFAULT: '#22d3ee',
          light: '#67e8f9',
          dark: '#0891b2',
        },
        magenta: {
          DEFAULT: '#f472b6',
          light: '#f9a8d4',
          dark: '#ec4899',
        },
        black: '#0a0a0a',
        white: '#ffffff',
        gray: {
          50: 'rgba(255, 255, 255, 0.03)',
          100: 'rgba(255, 255, 255, 0.05)',
          200: 'rgba(255, 255, 255, 0.08)',
          300: 'rgba(255, 255, 255, 0.15)',
        },
        // Semantic colors
        green: '#10b981',
        yellow: '#f59e0b',
        red: '#ef4444',
        orange: '#f97316',
      },
      maxWidth: {
        container: '1140px',
      },
      fontFamily: {
        sans: ['var(--font-work-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
