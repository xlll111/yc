import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 加载 .env 文件中的变量（第三个参数 '' 表示加载所有变量，不限于 VITE_ 前缀）
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_ZXHY === 'true' ? '/s/ycw' : '/',
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "@/styles/variables.scss" as *;
          @use "@/styles/mixins.scss" as *;
          @use "@/styles/common.scss" as *;
          @use "@/styles/reset.scss" as *;
        `,
          api: 'modern-compiler',
        },
      },
    },
    server: {
      proxy: {
        '/docs': {
          target: 'http://localhost:5174',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.url === '/docs') {
                req.url = '/docs/'
                proxyReq.path = '/docs/'
              }
            })
          },
        },
      },
    },
  }
})
