<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <loginIcon class="logo-icon" />
        </div>
        <h1 class="brand-title">欢迎回来</h1>
        <p class="brand-subtitle">请登录您的账户以继续</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username" class="input-label">用户名</label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              type="text"
              id="username"
              v-model="formData.username"
              placeholder="请输入用户名"
              autocomplete="username"
              class="form-input"
            />
          </div>
        </div>

        <div class="input-group">
          <label for="password" class="input-label">密码</label>
          <div class="input-wrapper">
            <svg
              class="input-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15V17M6 21H18C19.1 21 20 20.1 20 19V11C20 9.9 19.1 9 18 9H6C4.9 9 4 9.9 4 11V19C4 20.1 4.9 21 6 21Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M8 9V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              placeholder="请输入密码"
              autocomplete="current-password"
              class="form-input"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
              tabindex="-1"
            >
              <svg
                v-if="!showPassword"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
                <path
                  d="M21 21L3 3"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <path
                  d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <!-- <input type="checkbox" v-model="formData.rememberMe" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">记住我</span> -->
          </label>
          <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">忘记密码？</a>
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="!isLoading">登录</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="signup-prompt">
          还没有账户？
          <a href="#" class="signup-link" @click.prevent="handleSignup">立即注册</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import loginIcon from '@/components/icons/loginIcon.vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import 'element-plus/es/components/message/style/css'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
if (userStore.getIsLoggedIn) {
  router.push('/dash')
}
console.log(userStore.getIsLoggedIn, userStore.getUserInfo)
// 表单数据
const formData = reactive({
  username: '',
  password: '',
  rememberMe: false,
})

// UI 状态
const isLoading = ref(false)
const showPassword = ref(false)
const showDemoHint = ref(true)

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 登录处理（模拟登录管理）
const handleLogin = async () => {
  // 简单的前端验证
  if (!formData.username.trim()) {
    ElMessage.error('请输入用户名')
    return
  }
  if (!formData.password) {
    ElMessage.error('请输入密码')
    return
  }
  isLoading.value = true
  try {
    const success = await userStore.login(formData)
    if (success) {
      ElMessage.success('登录成功')
      setTimeout(() => {
        router.push('/dash')
      }, 500)
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } finally {
    isLoading.value = false
  }
}

// 忘记密码处理
const handleForgotPassword = () => {
  ElMessage.info('密码重置链接已发送至您的注册邮箱（演示功能）')
}

// 注册处理
const handleSignup = () => {
  ElMessage.info('跳转至注册页面（演示功能）')
}
</script>

<style scoped>
/* 重置与基础 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 登录容器 - 使用主色作为背景点缀 */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 16px;
  flex: auto;
}

/* 登录卡片 - 符合规范 */
.login-card {
  max-width: 480px;
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px 24px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.login-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(30, 64, 175, 0.1);
  border-radius: 9999px;
  margin-bottom: 20px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #1e40af;
}

.brand-title {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-weight: 500;
  font-size: 28px;
  color: #1e40af;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.brand-subtitle {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  color: #374151;
  font-weight: 400;
}

/* 表单样式 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
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
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.2s ease;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  color: #1f2937;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* 密码可见性切换按钮 */
.password-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #9ca3af;
  transition: color 0.2s ease;
}

.password-toggle svg {
  width: 18px;
  height: 18px;
}

.password-toggle:hover {
  color: #374151;
}

/* 表单选项行 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  color: #374151;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 1.5px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: #1e40af;
  border-color: #1e40af;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 14px;
  user-select: none;
}

.forgot-link,
.signup-link {
  color: #1e40af;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.forgot-link:hover,
.signup-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 12px 20px;
  background-color: #1e40af;
  border: none;
  border-radius: 9999px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.login-button:hover:not(:disabled) {
  background-color: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 注册提示 */
.signup-prompt {
  text-align: center;
  font-size: 14px;
  color: #374151;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  margin-top: 8px;
}

/* 演示提示条 */
.demo-hint {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.demo-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f9fafb;
  padding: 10px 16px;
  border-radius: 9999px;
  font-size: 13px;
  color: #374151;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

.demo-icon {
  width: 16px;
  height: 16px;
  color: #1e40af;
}

.demo-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #9ca3af;
  margin-left: 8px;
  transition: color 0.2s ease;
  line-height: 1;
}

.demo-close:hover {
  color: #374151;
}

/* 响应式断点 768px */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 24px 20px;
  }

  .brand-title {
    font-size: 24px;
  }

  .logo-wrapper {
    width: 48px;
    height: 48px;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  .form-input {
    padding: 10px 12px 10px 38px;
  }

  .input-icon {
    left: 12px;
    width: 16px;
    height: 16px;
  }

  .login-button {
    padding: 10px 16px;
    font-size: 15px;
  }

  .form-options {
    font-size: 13px;
  }
}

/* 最大宽度 1200px 居中已通过容器自然居中实现，内边距已包含 */
</style>
