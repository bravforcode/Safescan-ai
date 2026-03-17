/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E88E5',
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#1E88E5',
          600: '#1976D2',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0A2F6B',
        },
        green: {
          DEFAULT: '#00C853',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#00C853',
          600: '#00A846',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#0A3D0A',
        },
        cyan: {
          DEFAULT: '#6DEFFF',
          100: '#E0FDFF',
          200: '#B2EBF2',
          300: '#4df0ff',
          400: '#26C6DA',
          500: '#00E6FF',
          600: '#00BCD4',
          700: '#0097A7',
        },
        surface: '#FFFFFF',
        background: '#F0F7FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(30,136,229,0.08)',
        'card-hover': '0 8px 24px rgba(30,136,229,0.15)',
        float: '0 8px 32px rgba(0,0,0,0.12)',
      },
      keyframes: {
        toastIn: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toastOut: {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(30,136,229,0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(30,136,229,0.8)' },
        },
      },
      animation: {
        toastIn: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        toastOut: 'toastOut 0.25s ease-in both',
        fadeIn: 'fadeIn 0.5s ease-out',
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        slideDown: 'slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        slideRight: 'slideRight 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        scaleIn: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      transitionDelay: {
        0: '0ms',
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
      },
    },
  },
  plugins: [],
}
