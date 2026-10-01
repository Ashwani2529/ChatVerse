/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0b10',
          800: '#11131b',
          700: '#171a25',
          600: '#1f2330',
          500: '#2a2f40',
          400: '#3a4055',
        },
        brand: {
          300: '#9db4ff',
          400: '#7a95ff',
          500: '#5a76f3',
          600: '#4459d8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.35', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-2px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 180ms ease-out',
        'pulse-dot': 'pulse-dot 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
