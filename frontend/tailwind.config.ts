import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a472a',
          50: '#f0f9f1',
          100: '#dcf0df',
          200: '#bbe1c1',
          300: '#8ec99a',
          400: '#5aac6d',
          500: '#37904f',
          600: '#2a7340',
          700: '#235c35',
          800: '#1a472a',
          900: '#163d24',
          950: '#0b2215',
        },
        accent: {
          DEFAULT: '#c9a84c',
          50: '#fdf9ed',
          100: '#f9f0d2',
          200: '#f2dfa0',
          300: '#eac865',
          400: '#e4b33c',
          500: '#c9a84c',
          600: '#b08a32',
          700: '#8f6c28',
          800: '#755727',
          900: '#634925',
          950: '#392611',
        },
        background: '#0d1117',
        surface: '#161b22',
        'surface-2': '#21262d',
        border: '#30363d',
        'text-primary': '#f0f6fc',
        'text-secondary': '#8b949e',
        'text-muted': '#6e7681',
        success: '#3fb950',
        warning: '#d29922',
        error: '#f85149',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'counter': 'counter 2s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0d1117 0%, #1a2810 40%, #0d1117 100%)',
        'card-gradient': 'linear-gradient(135deg, #161b22 0%, #1a2810 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e4b33c 50%, #c9a84c 100%)',
        'green-gradient': 'linear-gradient(135deg, #1a472a 0%, #2a7340 100%)',
      },
      boxShadow: {
        'glow-gold': '0 0 30px rgba(201, 168, 76, 0.4)',
        'glow-green': '0 0 30px rgba(26, 71, 42, 0.6)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}

export default config
