/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          dark: '#2C4F54',
          main: '#5C8A8F',
          muted: '#9FAFB0',
          bg: '#E8EBE6',
        },
      },
    },
  },
  plugins: [],
};
