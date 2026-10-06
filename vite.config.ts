import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './': 패키징 후 file:// 로 로드되므로 절대경로 자산 참조 금지
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, watch: { ignored: ['**/release/**', '**/build/**', '**/dist-electron/**'] } },
  build: { outDir: 'dist' }
})
