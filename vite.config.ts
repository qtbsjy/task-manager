import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // Pages 子路径部署需要 base；本地开发用根路径，CI 里通过 VITE_BASE_URL 注入
  base: process.env.VITE_BASE_URL || '/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vitest 测试配置：jsdom 环境渲染 Vue 组件
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost/' }, // 需要真实 origin 才能用 localStorage
    },
    globals: true,
    setupFiles: ['./src/test-setup.ts'], // mock localStorage + 每测试清空
  },
})
