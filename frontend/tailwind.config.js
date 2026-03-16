/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef1f8',
          100: '#d4dced',
          200: '#a9b9db',
          300: '#7e96c9',
          400: '#5373b7',
          500: '#3a5a9e',
          600: '#1B3A6B',
          700: '#152d54',
          800: '#0F2040',
          900: '#080F1E',
        },
        champagne: {
          300: '#f0d98a',
          400: '#e8c86a',
          500: '#C9A84C',
          600: '#a8872f',
          700: '#86681a',
        },
        ivory: '#F7F4EF',
        slate: '#2C3E50',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':  'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float':    'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float:   { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
};
