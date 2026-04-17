<template>
  <div>
    <top-bar />
    <div>
      <div v-if="isLoading"><spinner size="large" :text="`正在加载...${loadProgress}%`" /></div>
      <router-view />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar from '@/components/TopBar.vue'
import { useUserStore } from '@/stores/userStore'
import Spinner from '@/components/Spinner.vue'

const userStore = useUserStore()
const isLoading = ref(true)
const loadProgress = ref(0)
onMounted(async () => {
  // 如果存在 token 但没有用户信息，自动获取
  if (userStore.getToken && !userStore.getUserInfo) {
    userStore.fetchUserInfo()
  }
  const resources: { name: string; load: () => Promise<any> }[] = [
    { name: 'Home', load: () => import('@/views/Home.vue') },
    { name: 'Login', load: () => import('@/views/Login.vue') },
    { name: 'About', load: () => import('@/views/AboutView.vue') },
    { name: 'Dash', load: () => import('@/views/Dash.vue') },
    { name: 'Blank', load: () => import('@/components/blank.vue') },
    { name: 'E404', load: () => import('@/views/E404.vue') },
  ]

  for (const resource of resources) {
    await resource.load()
    loadProgress.value += Math.floor(100 / resources.length)
  }

  isLoading.value = false
})
</script>
<style scoped>
#app > div {
  min-height: 100vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
#app > div > div {
  display: flex;
  flex: 9999;
  flex-direction: column;
}
</style>
