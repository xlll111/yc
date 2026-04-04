import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import About from '@/views/AboutView.vue'
import Docs from '@/views/DocsView.vue'
import Dash from '@/views/Dash.vue'
import Blank from '@/components/blank.vue'

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
          component: Blank,
        },
        {
          path: '/:pathMatch(.*)*',
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
