import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Проксі всіх запитів, що починаються з /api/v1,
    // до вашого шлюзу (gateway). У docker‑композиті шлюз
    // працює на порті 8080, а під час локальної розробки
    // можна підняти його на 127.0.0.1:8080 (docker‑compose expose).
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',   // <‑‑ URL шлюзу
        changeOrigin: true,                // необхідно для правильної Host‑заголовки
        secure: false,                     // якщо у вас http, а не https
        // Якщо ваш бекенд очікує саме префікс `/api/v1`, переписувати шлях НЕ потрібно
        // Якщо потрібно прибрати `/api/v1` – розкоментуйте rewrite:
        // rewrite: (path) => path.replace(/^\/api\/v1/, '/api/v1')
      },
    },
  },
})