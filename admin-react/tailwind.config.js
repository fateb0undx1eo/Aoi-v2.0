/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'float': 'float 10s infinite',
        'card-entrance': 'cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(-5%, -5%) rotate(180deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(100vh) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) translateX(100px)', opacity: '0' },
        },
        cardEntrance: {
          'from': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

