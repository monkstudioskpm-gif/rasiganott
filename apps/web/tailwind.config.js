/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        },
        dark: {
          bg: '#0a0a0c',
          card: '#121216',
          surface: '#18181f',
          border: '#262630',
        }
      },
      aspectRatio: {
        'poster': '2 / 3',
        'banner': '16 / 9',
      }
    },
  },
  plugins: [],
}
