<template>
  <div>
    <top-bar />
    <div>
      <router-view />
      <spinner v-if="isLoading" size="large" :text="loadingText" :overlay="true" inline />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import TopBar from '@/components/TopBar.vue'
import { useUserStore } from '@/stores/userStore'
import { useLoadingStore } from '@/stores/loading'
import Spinner from '@/components/Spinner.vue'
const loadingStore = useLoadingStore()
const { isLoading, loadingText } = storeToRefs(loadingStore)

const userStore = useUserStore()
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
  }
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
