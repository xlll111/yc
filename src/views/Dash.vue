<template>
  <div id="dash">
    <SideBar />
    <div><router-view /></div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SideBar from '@/components/SideBar.vue'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const checkLogin = () => {
  if (!userStore.getIsLoggedIn) {
    ElMessage.error('请先登录')
    router.push('/login')
    return false
  }
  return true
}
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === oldPath) return
    if (newPath === '/dash') {
      if (checkLogin()) router.push('/dash/clients')
    } else if (newPath.startsWith('/dash')) {
      checkLogin()
    }
  },
  { immediate: true },
)
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
