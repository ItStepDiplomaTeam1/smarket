import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // 1. Імпортуємо плагін Tailwind
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Додаємо його в масив плагінів
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});