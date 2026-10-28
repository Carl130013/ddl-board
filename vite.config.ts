import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    watch: {
      // 工具目录（依赖缓存、无头浏览器配置、截图）不属于源码，监听它们会引起无意义的重载
      ignored: ['**/.cache/**', '**/.preview/**', '**/node_modules/**', '**/dist/**'],
    },
  },
})
