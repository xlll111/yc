<template>
  <aside class="vitepress-sidebar" :style="cssVariables">
    <!-- 移动端遮罩层 -->
    <div v-if="isMobileOpen" class="mobile-overlay" @click="closeMobileSidebar" />

    <!-- 侧边栏容器 -->
    <div class="sidebar-container" :class="{ 'mobile-open': isMobileOpen }">
      <!-- 侧边栏头部（Logo区域） -->
      <div class="sidebar-header">
        <div class="logo-area">
          <div class="logo-icon">
            <dashIcon />
          </div>
          <span class="logo-text">控制台</span>
        </div>
        <!-- 移动端关闭按钮 -->
        <button class="mobile-close-btn" @click="closeMobileSidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- 导航菜单列表 -->
      <nav class="sidebar-nav">
        <div v-for="item in menuItems" :key="item.id" class="nav-item-wrapper">
          <!-- 分组标题 -->
          <div v-if="item.type === 'group'" class="nav-group">
            <div
              class="nav-group-title"
              @click="toggleGroup(item.id)"
              :style="{ cursor: item.collapsible ? 'pointer' : 'default' }"
            >
              <span class="group-title-text">{{ item.text }}</span>
              <svg
                v-if="item.collapsible"
                class="group-arrow"
                :class="{ rotated: !isGroupOpen(item.id) }"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="nav-group-items" v-show="isGroupOpen(item.id)">
              <div
                v-for="child in item.items"
                :key="child.id"
                class="nav-item"
                :class="{ active: activeLink === child.link }"
                @click="navigateTo(child.link)"
              >
                <span class="nav-item-text">{{ child.text }}</span>
              </div>
            </div>
          </div>

          <!-- 单独链接 -->
          <div
            v-else-if="item.type === 'link'"
            class="nav-item standalone"
            :class="{ active: activeLink === item.link }"
            @click="navigateTo(item.link)"
          >
            <span class="nav-item-text">{{ item.text }}</span>
          </div>
        </div>
      </nav>
    </div>

    <!-- 移动端展开按钮 -->
    <button class="mobile-toggle-btn" @click="openMobileSidebar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12H21M3 6H21M3 18H21"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dashIcon from './icons/dashIcon.vue'

// 定义侧边栏菜单数据结构
const menuItems = ref([
  {
    id: 'overview',
    type: 'link',
    text: '客户端列表',
    link: '/clients',
  },
  {
    id: 'client',
    type: 'group',
    text: '客户端管理',
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'overview', text: '总览', link: '/client/overview' },
      { id: 'setting', text: '设置', link: '/client/setting' },
      { id: 'authorize_net', text: '联网授权', link: '/client/authorize_net' },
      { id: 'net_whitelist', text: '联网白名单', link: '/client/net_whitelist' },
      { id: 'udisk_records', text: 'U盘记录', link: '/client/udisk_records' },
      { id: 'url_records', text: 'Url记录(DNS)', link: '/client/url_records' },
      // { id: '', text: '', link: '/client/' },
    ],
  },
  {
    id: 'global_settings',
    type: 'link',
    text: '全局设置',
    link: '/global_settings',
  },
  // {
  //   id: '',
  //   type: '',
  //   text: '',
  //   link: '/',
  // },
])

// 分组展开状态管理
const openGroups = ref(new Set())

// 初始化分组默认状态
const initGroupState = () => {
  menuItems.value.forEach((item) => {
    if (item.type === 'group' && item.defaultOpen) {
      openGroups.value.add(item.id)
    }
  })
}

// 判断分组是否展开
const isGroupOpen = (groupId) => {
  return openGroups.value.has(groupId)
}

// 切换分组展开/收起
const toggleGroup = (groupId) => {
  const group = menuItems.value.find((item) => item.id === groupId)
  if (group && group.collapsible) {
    if (openGroups.value.has(groupId)) {
      openGroups.value.delete(groupId)
    } else {
      openGroups.value.add(groupId)
    }
  }
}

// 响应式状态
const isMobile = ref(false)
const isMobileOpen = ref(false)

// 路由相关
const router = useRouter()
const route = useRoute()
const activeLink = ref(route.path)

// 监听路由变化更新激活状态
watch(
  () => route.path,
  (newPath) => {
    activeLink.value = newPath
    // 移动端点击链接后自动关闭侧边栏
    if (isMobile.value) {
      closeMobileSidebar()
    }
  },
)

// 导航跳转
const navigateTo = (link) => {
  if (link) {
    router.push('/dash' + link)
  }
}

// 响应式处理函数
const handleResize = () => {
  const width = window.innerWidth
  isMobile.value = width < 768

  // 桌面端自动关闭移动端展开状态
  if (!isMobile.value && isMobileOpen.value) {
    isMobileOpen.value = false
    document.body.style.overflow = ''
  }
}

// 移动端操作
const openMobileSidebar = () => {
  if (isMobile.value) {
    isMobileOpen.value = true
    document.body.style.overflow = 'hidden'
  }
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
  document.body.style.overflow = ''
}

// CSS 变量注入
const cssVariables = computed(() => ({
  '--primary-color': '#1e40af',
  '--text-color': '#374151',
  '--border-color': '#e5e7eb',
  '--border-radius-card': '8px',
  '--border-radius-button': '9999px',
  '--box-shadow': '0 2px 8px rgba(0,0,0,0.08)',
  '--transition': '0.2s ease',
  '--max-width': '1200px',
  '--padding-desktop': '24px',
  '--padding-mobile': '16px',
}))

// 生命周期
onMounted(() => {
  initGroupState()
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* CSS 变量定义 */
.vitepress-sidebar {
  --primary: #1e40af;
  --text: #374151;
  --border: #e5e7eb;
  --card-radius: 8px;
  --btn-radius: 9999px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --transition: 0.2s ease;
  --sidebar-width: 280px;
}

/* 侧边栏主容器 - 桌面端始终显示 */
.vitepress-sidebar {
  position: relative;
  top: 0;
  left: 0;
  flex: auto;
  z-index: 100;
  width: var(--sidebar-width);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.sidebar-container {
  position: relative;
  height: 100%;
  background: white;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all var(--transition);
  box-shadow: var(--shadow);
  z-index: 100;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 8px var(--padding-desktop);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--primary);
  font-weight: 600;
  font-size: 1.1rem;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition);
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text);
  padding: 8px;
  border-radius: var(--btn-radius);
  transition: background var(--transition);
}

.mobile-close-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* 导航菜单样式 */
.sidebar-nav {
  flex: 1;
  padding: 16px var(--padding-desktop);
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 24px;
}

.nav-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  color: var(--primary);
  text-transform: uppercase;
  transition: color var(--transition);
}

.nav-group-title:hover {
  color: #1e3a8a;
}

.group-title-text {
  flex: 1;
}

.group-arrow {
  transition: transform var(--transition);
}

.group-arrow.rotated {
  transform: rotate(-90deg);
}

.nav-group-items {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: all var(--transition);
  position: relative;
}

.nav-item:hover {
  background: rgba(30, 64, 175, 0.06);
  color: var(--primary);
  transform: translateX(4px);
}

.nav-item.active {
  background: rgba(30, 64, 175, 0.12);
  color: var(--primary);
  font-weight: 600;
  border-left: 3px solid var(--primary);
}

.nav-item.standalone {
  margin-bottom: 8px;
}

.nav-item-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 移动端遮罩层 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

/* 移动端按钮 */
.mobile-toggle-btn {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 99;
  width: 48px;
  height: 48px;
  border-radius: var(--btn-radius);
  background: var(--primary);
  border: none;
  color: white;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: all var(--transition);
}

.mobile-toggle-btn:hover {
  transform: scale(1.05);
  background: #1e3a8a;
}

/* 响应式布局 - 移动端 */
@media (max-width: 768px) {
  .vitepress-sidebar {
    position: fixed;
    top: 64px;
    left: 0;
    height: 100%;
  }

  .sidebar-container.mobile-open {
    transform: translateX(0);
  }

  .mobile-toggle-btn {
    display: flex;
  }

  .sidebar-container {
    border-right: none;
    transform: translateX(-100%);
    transition: transform var(--transition);
    width: 280px !important;
  }

  .mobile-close-btn {
    display: flex;
  }
}

/* 桌面端样式 */
@media (min-width: 769px) {
  .vitepress-sidebar {
    transform: translateX(0) !important;
  }

  .mobile-toggle-btn {
    display: none;
  }

  .mobile-overlay {
    display: none;
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 滚动条美化 */
.sidebar-container::-webkit-scrollbar {
  width: 4px;
}

.sidebar-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.sidebar-container::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
