import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // 将 /docs 开头的请求代理到 VitePress 开发服务器
      '/docs': {
        target: 'http://localhost:5174', // VitePress 默认端口
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 如果请求路径是 /docs，重写为 /docs/
            if (req.url === '/docs') {
              req.url = '/docs/'
              proxyReq.path = '/docs/'
            }
          })
        },
      },
    },
  },
})
