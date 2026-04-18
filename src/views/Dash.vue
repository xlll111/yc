<template>
  <div id="dash">
    <SideBar />
    <div><router-view /></div>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import SideBar from '@/components/SideBar.vue'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
const router = useRouter()
const userStore = useUserStore()
if (!userStore.getIsLoggedIn) {
  ElMessage.error('请先登录')
  router.push('/login')
}
</script>
<style>
#dash {
  display: flex;
  flex-direction: row;
  flex: auto;
  overflow: hidden;
}
#dash > div {
  display: flex;
  flex: 50;
  overflow: auto;
}
#dash > div > div {
  z-index: 1;
}
</style>
