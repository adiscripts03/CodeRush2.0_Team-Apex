/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        },
        hazard: {
          flood: '#3b82f6',
          alert: '#ef4444',
          warning: '#f59e0b',
          safe: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
