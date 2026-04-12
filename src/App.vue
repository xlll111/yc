<template>
  <div>
    <top-bar />
    <div><router-view /></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'

import TopBar from '@/components/TopBar.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

onMounted(() => {
  // 如果存在 token 但没有用户信息，自动获取
  if (userStore.getToken && !userStore.getUserInfo) {
    userStore.fetchUserInfo()
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
