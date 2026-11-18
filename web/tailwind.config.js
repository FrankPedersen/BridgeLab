/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bridge: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#38bdf8',
          spade: '#1e293b',
          heart: '#dc2626',
          diamond: '#ea580c',
          club: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
