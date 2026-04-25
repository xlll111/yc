<template><router-view /></template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientStore } from '@/stores/clientStore'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
const router = useRouter()
const route = useRoute()
const clientStore = useClientStore()
const checkCurrentClint = () => {
  if (!clientStore.getCurrentClientUUID) {
    ElMessage.error('请先选择客户端')
    router.push('/dash/clients')
    return false
  }
  return true
}
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === oldPath) return
    if (newPath === '/dash/client') {
      if (checkCurrentClint()) router.push('/dash/client/overview')
    } else if (newPath.startsWith('/dash/client')) {
      checkCurrentClint()
    }
  },
  { immediate: true },
)
</script>
