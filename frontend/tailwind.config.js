/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'kix-bg': { DEFAULT: '#0A0E27', light: '#111638', card: '#161B40' },
        'kix-cyan': { DEFAULT: '#00F0FF', dim: '#00B8C7', glow: '#00F0FF40' },
        'kix-pink': { DEFAULT: '#FF006E', dim: '#CC0058', glow: '#FF006E40' },
        'kix-gold': { DEFAULT: '#FFB800', dim: '#CC9300', glow: '#FFB80040' },
        'kix-green': '#00FF88',
        'kix-red': '#FF3333',
        'kix-text': { primary: '#FFFFFF', secondary: '#A0A8C0', muted: '#5A6280' },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'countdown': 'countdown 1s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px #00F0FF40' },
          '50%': { boxShadow: '0 0 40px #00F0FF80' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'countdown': {
          '0%': { transform: 'scale(2)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
