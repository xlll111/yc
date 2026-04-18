import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'

const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/Login.vue')
const About = () => import('@/views/AboutView.vue')
const Dash = () => import('@/views/Dash.vue')
const ClientsList = () => import('@/views/ClientsList.vue')

const Blank = () => import('@/components/blank.vue')
const E404 = () => import('@/views/E404.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: {
        title: '首页',
      },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        title: '登录',
      },
    },
    {
      path: '/dash',
      name: 'Dash',
      component: Dash,
      children: [
        {
          path: 'clients',
          name: 'clients',
          component: ClientsList,
        },

        {
          path: ':pathMatch(.*)*',
          name: 'Blank',
          component: Blank,
        },
      ],
      meta: {
        title: '控制台',
      },
    },
    {
      path: '/about',
      name: 'About',
      component: About,
      meta: {
        title: '关于',
      },
    },
    {
      path: '/docs',
      name: 'Docs',
      beforeEnter() {
        window.location.replace('/docs')
      },
      component: Home,
    },
    {
      path: '/d',
      name: 'Doc',
      beforeEnter() {
        window.location.replace('https://xlll111.lanzouq.com/b00efkxesb')
      },
      component: Home,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'E404',
      component: E404,
      meta: {
        title: '404',
      },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

let loadingTimeout: number | null = null

router.beforeEach((to, from) => {
  const loadingStore = useLoadingStore()
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  // 清除之前的超时
  if (loadingTimeout) clearTimeout(loadingTimeout)

  // 延迟显示loading，避免闪烁（页面加载很快时）
  loadingTimeout = setTimeout(() => {
    loadingStore.showLoading(`加载 ${to.meta.title || '页面中'}...`)
  }, 200)

  return true
})

router.afterEach((to, from) => {
  const loadingStore = useLoadingStore()

  // 清除延迟显示的loading
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  // 隐藏loading
  loadingStore.hideLoading()
})

export default router
