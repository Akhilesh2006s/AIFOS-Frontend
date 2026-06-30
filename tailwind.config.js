/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#1F4E79',
          muted: '#334155',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          soft: '#FFF7ED',
        },
        canvas: '#F8FAFC',
        border: '#E5E7EB',
        steel: { DEFAULT: '#1F4E79', light: '#3B82F6' },
        command: {
          bg: 'var(--command-bg)',
          sidebar: 'var(--command-sidebar)',
          card: 'var(--command-card)',
          elevated: 'var(--command-elevated)',
          border: 'var(--command-border)',
        },
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['IBM Plex Sans', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        glass: '0 1px 2px rgba(11, 31, 58, 0.04), 0 8px 32px rgba(11, 31, 58, 0.06)',
        glasslg: '0 4px 24px rgba(11, 31, 58, 0.08), 0 1px 3px rgba(11, 31, 58, 0.04)',
        glassxl: '0 12px 48px rgba(11, 31, 58, 0.12), 0 4px 16px rgba(11, 31, 58, 0.06)',
        glow: '0 0 40px rgba(249, 115, 22, 0.15)',
        glownavy: '0 0 40px rgba(31, 78, 121, 0.2)',
      },
      backdropBlur: {
        glass: '20px',
        xl: '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        shimmer: 'shimmer 2.5s infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
