/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9f2',
          100: '#dcf0e2',
          200: '#bbe0c8',
          300: '#8cc9a4',
          400: '#57ac7b',
          500: '#4a7c59',
          600: '#3a6347',
          700: '#2f4f3a',
          800: '#264030',
          900: '#203427',
        },
        secondary: {
          50: '#fdf9e8',
          100: '#fdf0c4',
          200: '#fce285',
          300: '#f4d35e',
          400: '#eab308',
          500: '#ca8a04',
          600: '#a16207',
          700: '#854d0e',
          800: '#713f12',
          900: '#633507',
        },
        accent: {
          50: '#fdf6f0',
          100: '#fbe8d7',
          200: '#f6cdaf',
          300: '#e8a87c',
          400: '#dc7f47',
          500: '#d3631f',
          600: '#c54d15',
          700: '#a43b13',
          800: '#843117',
          900: '#6c2b15',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};