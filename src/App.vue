<template>
  <div :style="appThemeStyles">
    <top-bar />
    <div><router-view /></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from './stores/themeStore'
import TopBar from '@/components/TopBar.vue'

const themeStore = useThemeStore()

const appThemeStyles = computed(() => ({
  '--theme-color': themeStore.currentTheme,
  backgroundColor: themeStore.darkMode ? '#1a1a1a' : '#ffffff',
  color: themeStore.darkMode ? '#ffffff' : '#333333',
}))
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
