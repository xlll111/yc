<template>
  <header class="global-header">
    <div class="header-container">
      <!-- 左侧：三条杠按钮（仅在小屏幕显示） -->
      <div class="mobile-menu-toggle" @click="toggleMobileMenu">
        <div class="hamburger" :class="{ 'is-active': mobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- Logo / 品牌区域 -->
      <div class="logo">
        <a href="/">YCMAIN</a>
      </div>

      <!-- 桌面端导航链接 -->
      <nav class="desktop-nav">
        <router-link to="/" class="nav-link">首页</router-link>
        <a href="/docs" class="nav-link">文档</a>
        <router-link to="/dash" class="nav-link">控制台</router-link>
        <router-link to="/about" class="nav-link">关于</router-link>
        <div class="dropdown-wrapper">
          <button class="dropdown-trigger" @click="toggleDropdown">
            更多 <span class="arrow" :class="{ rotate: dropdownOpen }">▼</span>
          </button>
          <div class="dropdown-menu" v-if="dropdownOpen" v-click-outside="closeDropdown">
            <a href="/contact">联系我们</a>
            <a href="/faq">常见问题</a>
            <a href="/careers">加入我们</a>
          </div>
        </div>
      </nav>

      <!-- 右侧用户区域 -->
      <div class="user-area">
        <div v-if="isLoggedIn" class="user-menu-wrapper">
          <span class="user-name-trigger">{{ userName }}</span>
          <div class="logout-dropdown">
            <button class="logout-btn" @click="logout">退出登录</button>
          </div>
        </div>
        <router-link v-else to="/login" class="user-btn">登录</router-link>
      </div>
    </div>

    <!-- 移动端侧边菜单（从左侧滑出） -->
    <transition name="slide">
      <div class="mobile-menu" v-if="mobileMenuOpen">
        <div class="mobile-menu-backdrop" @click="closeMobileMenu"></div>
        <div class="mobile-menu-panel">
          <div class="mobile-menu-header">
            <span>菜单</span>
            <button class="close-btn" @click="closeMobileMenu">✕</button>
          </div>
          <div class="mobile-nav-links">
            <router-link to="/" @click="closeMobileMenu">首页</router-link>
            <a href="/docs" @click="closeMobileMenu">文档</a>
            <router-link to="/dash" @click="closeMobileMenu">控制台</router-link>
            <router-link to="/about" @click="closeMobileMenu">关于</router-link>
            <div class="mobile-dropdown">
              <div class="mobile-dropdown-header" @click="toggleMobileDropdown">
                更多 <span class="arrow" :class="{ rotate: mobileDropdownOpen }">▼</span>
              </div>
              <div class="mobile-dropdown-content" v-show="mobileDropdownOpen">
                <router-link to="/contact" @click="closeMobileMenu">联系我们</router-link>
                <router-link to="/faq" @click="closeMobileMenu">常见问题</router-link>
                <router-link to="/careers" @click="closeMobileMenu">加入我们</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script>
import { useUserStore } from '@/stores/userStore'
export default {
  name: 'GlobalHeader',
  data() {
    return {
      dropdownOpen: false, // 桌面端更多下拉菜单
      mobileMenuOpen: false, // 移动端侧边菜单
      mobileDropdownOpen: false, // 移动端更多展开
    }
  },
  computed: {
    userStore() {
      return useUserStore()
    },
    isLoggedIn() {
      return this.userStore.getIsLoggedIn
    },
    userName() {
      return this.userStore.getUserInfo?.username || '???'
    },
  },
  mounted() {
    // 监听窗口尺寸变化，当从小屏幕切换到宽屏时自动关闭移动菜单
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },
    closeDropdown() {
      this.dropdownOpen = false
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
      if (this.mobileMenuOpen) {
        // 防止背景滚动
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
      document.body.style.overflow = ''
    },
    toggleMobileDropdown() {
      this.mobileDropdownOpen = !this.mobileDropdownOpen
    },
    handleResize() {
      // 如果窗口宽度大于等于768px（桌面尺寸），强制关闭移动菜单
      if (window.innerWidth >= 768 && this.mobileMenuOpen) {
        this.closeMobileMenu()
      }
    },
    logout() {
      this.userStore.logout()
    },
  },
  directives: {
    // 自定义点击外部指令，用于关闭桌面端下拉菜单
    'click-outside': {
      bind(el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el === event.target || el.contains(event.target))) {
            vnode.context[binding.expression]()
          }
        }
        document.body.addEventListener('click', el.clickOutsideEvent)
      },
      unbind(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent)
      },
    },
  },
}
</script>

<style scoped>
/* 全局样式重置与变量 */
.global-header {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

/* 移动端菜单按钮（默认隐藏，小屏幕显示） */
.mobile-menu-toggle {
  display: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
}

.hamburger {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background-color: #333;
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* Logo */
.logo a {
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  color: #1e40af;
  letter-spacing: -0.5px;
  margin-right: 1rem;
}

/* 桌面端导航 */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #1e40af;
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
}

.arrow {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}

.arrow.rotate {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  min-width: 160px;
  padding: 8px 0;
  z-index: 100;
}

.dropdown-menu a {
  display: block;
  padding: 8px 20px;
  text-decoration: none;
  color: #374151;
  font-size: 0.9rem;
}

.dropdown-menu a:hover {
  background-color: #f3f4f6;
}

.user-area {
  margin-left: auto;
}
/* 用户菜单外层包装器 - 用于定位下拉菜单 */
.user-menu-wrapper {
  position: relative;
  display: inline-block;
}

/* 用户名触发区 - 鼠标悬浮目标 */
.user-name-trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: #374151;
  border-radius: 9999px;
  font-weight: bold; /* 用户名字体加粗 */
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  transition: all 0.2s;
  text-decoration: none;
}

.user-name-trigger:hover {
  color: #1e40af;
  background-color: rgba(30, 64, 175, 0.05);
}

/* 下拉菜单 - 退出登录卡片 */
.logout-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease,
    transform 0.2s ease;
  z-index: 100;
}

/* 鼠标悬浮在菜单包装器上时显示下拉菜单 */
.user-menu-wrapper:hover .logout-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 退出登录按钮 */
.logout-btn {
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  text-align: left;
}

.logout-btn:hover {
  background-color: #f3f4f6;
  color: #1e40af;
}
.user {
  color: #007bff; /* 用户名颜色 */
  font-weight: bold; /* 用户名字体加粗 */
  background: none;
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.user:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.user-btn {
  background: none;
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  color: #374151;
}

.user-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* 移动端侧边菜单（全屏遮罩 + 抽屉） */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1100;
}

.mobile-menu-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  transition: background-color 0.25s ease;
}

.mobile-menu-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background-color: white;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1101;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #6b7280;
}

.mobile-nav-links {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
}

.mobile-nav-links a {
  padding: 12px 20px;
  text-decoration: none;
  color: #1f2937;
  font-size: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.mobile-nav-links a:active {
  background-color: #f3f4f6;
}

.mobile-dropdown {
  border-bottom: 1px solid #f0f0f0;
}

.mobile-dropdown-header {
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #1f2937;
}

.mobile-dropdown-content {
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
}

.mobile-dropdown-content a {
  padding-left: 36px;
  border-bottom: none;
  font-size: 0.9rem;
}

/* 滑入滑出动画 */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.25s ease;
}

.slide-enter-active .mobile-menu-panel,
.slide-leave-active .mobile-menu-panel {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-from .mobile-menu-panel,
.slide-leave-to .mobile-menu-panel {
  transform: translateX(-100%);
}

/* 响应式：当屏幕宽度小于768px时，隐藏桌面导航，显示移动菜单按钮 */
@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }
  .mobile-menu-toggle {
    display: flex;
  }
  .header-container {
    padding: 0 16px;
  }
  .user-btn {
    padding: 4px 12px;
    font-size: 0.9rem;
  }
}

/* 小屏下保持右侧区域正常 */
@media (min-width: 768px) {
  .mobile-menu-toggle {
    display: none;
  }
}
</style>
