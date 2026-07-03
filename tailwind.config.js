/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#01BDC1',
          dark: '#019A9D',
          light: '#E0F8F8',
        },
        orange: {
          DEFAULT: '#FE7203',
          dark: '#D45F00',
          light: '#FFEDDC',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
