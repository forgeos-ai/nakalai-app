/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
        kalam: ['Kalam', 'cursive'],
        architects: ['"Architects Daughter"', 'cursive'],
      },
      colors: {
        ink: {
          blue: '#1e40af',
          black: '#1f2937',
          red: '#b91c1c',
        },
        paper: {
          line: '#a4c8f0',
          margin: '#f9a8d4',
          bg: '#fdfdfd',
        },
      },
      boxShadow: {
        paper: '0 10px 40px -10px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
