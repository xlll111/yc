import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import About from '@/views/AboutView.vue'
import Docs from '@/views/DocsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/docs',
      name: 'Docs',
      component: Docs,
    },
    {
      path: '/d',
      name: 'Doc',
      beforeEnter() {
        window.location.replace('https://xlll111.lanzouq.com/b00efkxesb')
      },
      component: Home,
    },
  ],
})

export default router
