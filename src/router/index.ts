import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import About from '@/views/AboutView.vue'
import Dash from '@/views/Dash.vue'

import Blank from '@/components/blank.vue'
import E404 from '@/views/E404.vue'

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
      path: '/dash',
      name: 'Dash',
      component: Dash,
      children: [
        {
          path: 'a',
          name: 'DashHome',
          component: Login,
        },
        {
          path: ':pathMatch(.*)*',
          name: 'Blank',
          component: Blank,
        },
      ],
    },
    {
      path: '/about',
      name: 'About',
      component: About,
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
    },
  ],
})

export default router
