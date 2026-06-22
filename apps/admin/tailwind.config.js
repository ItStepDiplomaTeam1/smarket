/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA', // Light grey background
        surface: '#FFFFFF',    // White cards
        primary: '#265447',    // Brand Dark Green
        primaryHover: '#1A3E2F',
        secondary: '#F6FAF8',  // Light green (active sidebar, hovers)
        textMain: '#111827',   // Dark grey text
        textMuted: '#6D8279',  // Gray green muted text
        accentGreen: '#10B981', // For success icons
        accentRed: '#EF4444',   // For error icons
        accentYellow: '#F59E0B',
        accentBlue: '#3B82F6',
        accentPurple: '#8B5CF6',
        border: '#E5E7EB',      // Light border
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
