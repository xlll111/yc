import { createRouter, createWebHistory } from 'vue-router'
import { useLoadingStore } from '@/stores/loading'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const About = () => import('@/views/AboutView.vue')
const Dash = () => import('@/views/Dash.vue')
const User = () => import('@/views/User.vue')
const ClientsList = () => import('@/views/ClientsList.vue')
const GlobalSetting = () => import('@/views/GlobalSetting.vue')
const EmailVerify = () => import('@/views/EmailVerify.vue')

const Client = () => import('@/views/Client.vue')
const Overview = () => import('@/views/client/Overview.vue')
const Setting = () => import('@/views/client/Setting.vue')
const Netauth = () => import('@/views/client/NetAuth.vue')
const WhiteList = () => import('@/views/client/WhiteList.vue')
const UDiskAllow = () => import('@/views/client/UDiskAllow.vue')
const DnsUrl = () => import('@/views/client/DnsUrl.vue')

const WeeklyClientReport = () => import('@/views/weekly-report/index.vue')

const ShxzhyDrive = () => import('@/views/ShxzhyDrive.vue')

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
      path: '/register',
      name: 'Register',
      component: Register,
      meta: {
        title: '注册',
      },
    },
    {
      path: '/dash',
      name: 'Dash',
      component: Dash,
      children: [
        {
          path: '',
          name: 'Dash0',
          redirect: '/dash/clients',
        },
        {
          path: 'clients',
          name: 'clients',
          component: ClientsList,
        },
        {
          path: 'client',
          name: 'client',
          component: Client,
          children: [
            {
              path: 'overview',
              name: 'overview',
              component: Overview,
            },
            {
              path: 'setting',
              name: 'setting',
              component: Setting,
            },
            {
              path: 'authorize_net',
              name: 'authorize_net',
              component: Netauth,
            },
            {
              path: 'net_whitelist',
              name: 'net_whitelist',
              component: WhiteList,
            },
            {
              path: 'udisk_records',
              name: 'udisk_records',
              component: UDiskAllow,
            },
            {
              path: 'url_records',
              name: 'url_records',
              component: DnsUrl,
            },
            {
              path: ':pathMatch(.*)*',
              name: 'ClientBlank',
              component: Blank,
            },
          ],
        },
        {
          path: 'global_settings',
          name: 'GlobalSetting',
          component: GlobalSetting,
        },
        {
          path: ':pathMatch(.*)*',
          name: 'DashBlank',
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
      path: '/user',
      name: 'User',
      component: User,
      meta: {
        title: '个人中心',
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
      path: '/weekly_report',
      name: 'WeeklyClientReport',
      component: WeeklyClientReport,
    },
    {
      path: '/email_verify',
      name: 'EmailVerify',
      component: EmailVerify,
      meta: {
        title: '邮箱验证',
      },
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
      path: '/shxzhy_drive',
      name: 'ShxzhyDrive',
      component: ShxzhyDrive,
      meta: {
        title: '慧云云盘镜像',
      },
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
  }, 400)

  return true
})

router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  const newPath = to.path
  const oldPath = from.path
  if (newPath === oldPath) return

  const checkLogin = async () => {
    if (!userStore.getIsLoggedIn) {
      ElMessage.error('请先登录')
      return '/login' // 返回目标路由，交给 beforeEach 处理
    }
    return true
  }

  const checkUserRole = async () => {
    try {
      if (!(await userStore.checkUserRole(2))) {
        ElMessage.warning('您没有权限查看控制台')
        if (!(await userStore.checkUserRole(1))) {
          ElMessage.warning('请完成用户验证')
          return '/user'
        }
        return false // 表示中断导航
      }
      return true
    } catch (error) {
      ElMessage.error(`用户验证失败: ${error}`)
      return false
    }
  }

  if (newPath === '/dash') {
    const login = await checkLogin()
    if (login !== true) return login // 未登录 → 跳 /login
    const role = await checkUserRole()
    if (role !== true) return role // 没权限 → 跳 /user 或中断
    return '/dash/clients'
  } else if (newPath.startsWith('/dash')) {
    const login = await checkLogin()
    if (login !== true) return login // ← 关键：检查返回值
    const role = await checkUserRole()
    if (role !== true) return role // ← 关键：检查返回值
    return true
  }
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
