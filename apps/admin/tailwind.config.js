/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)', // Light grey background
        surface: 'var(--color-surface)',    // White cards
        sidebarText: 'var(--color-sidebar-text)',
        primary: '#265447',    // Brand Dark Green
        primaryHover: '#1A3E2F',
        secondary: '#F6FAF8',  // Light green (active sidebar, hovers)
        textMain: 'var(--color-text-main)',   // Dynamic main text color
        textMuted: 'var(--color-text-muted)',  // Dynamic muted text color
        accentGreen: '#10B981', // For success icons
        accentRed: '#EF4444',   // For error icons
        accentYellow: '#F59E0B',
        accentBlue: '#3B82F6',
        accentPurple: '#8B5CF6',
        border: '#E5E7EB',      // Light border
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
