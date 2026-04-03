import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 处理 localStorage 可能为 null 的情况
  const getInitialTheme = (): string => {
    const saved = localStorage.getItem('themeColor')
    return saved || '#42b983'
  }

  const getInitialDarkMode = (): boolean => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  }

  const themeColor = ref<string>(getInitialTheme())
  const darkMode = ref<boolean>(getInitialDarkMode())

  const isDarkMode = computed(() => darkMode.value)
  const currentTheme = computed(() => themeColor.value)

  function setThemeColor(color: string): void {
    themeColor.value = color
    localStorage.setItem('themeColor', color)
  }

  function toggleDarkMode(): void {
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', String(darkMode.value))
  }

  return {
    themeColor,
    darkMode,
    isDarkMode,
    currentTheme,
    setThemeColor,
    toggleDarkMode,
  }
})
