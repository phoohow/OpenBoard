import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { host: '0.0.0.0' },
  test: {
    // 测试与源码分开放：test/ 镜像 src/ 的目录结构，只跑领域纯函数。
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
