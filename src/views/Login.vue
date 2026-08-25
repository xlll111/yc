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
            <input type="checkbox" v-model="formData.rememberMe" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">记住我(30天)</span>
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
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
// import { ElMessageBox } from 'element-plus'
// import 'element-plus/es/components/message-box/style/css'

const router = useRouter()
const userStore = useUserStore()
if (userStore.getIsLoggedIn) {
  router.push('/dash')
}
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

// 登录处理
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
  router.push('/register')
}
</script>

<style lang="scss" scoped>
.login-container {
  @include flex-center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: $spacing-8;
  flex: auto;
}

.login-card {
  max-width: 480px;
  width: 100%;
  @include card-base;
  padding: $spacing-13 $spacing-11;

  &:hover {
    box-shadow: $shadow-card-hover;
  }
}

.brand-section {
  text-align: center;
  margin-bottom: $spacing-13;
}

.logo-wrapper {
  @include flex-center;
  display: inline-flex;
  width: 56px;
  height: 56px;
  background: $color-primary-alpha-10;
  border-radius: $radius-lg;
  margin-bottom: $spacing-10;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: $color-primary;
}

.brand-title {
  @include font-family-base;
  font-weight: 500;
  font-size: 28px;
  color: $color-primary;
  margin-bottom: $spacing-4;
  letter-spacing: -0.3px;
}

.brand-subtitle {
  @include font-family-base;
  font-size: $font-size-base;
  color: $color-text-base;
  font-weight: 400;
}

.login-form {
  @include flex-column;
  gap: $spacing-11;
}

.input-group {
  @include flex-column;
  gap: $spacing-4;
}

.input-label {
  @include font-family-base;
  font-size: $font-size-base;
  font-weight: 500;
  color: $color-text-base;
}

.input-wrapper {
  position: relative;
  @include flex-center;
}

.input-icon {
  position: absolute;
  left: $spacing-7;
  width: 18px;
  height: 18px;
  color: $color-text-tertiary;
  pointer-events: none;
  transition: color $transition-base;
}

.form-input {
  @include input-base;
  padding: $spacing-6 $spacing-7 $spacing-6 42px;

  &::placeholder {
    color: $color-text-tertiary;
  }
}

.password-toggle {
  position: absolute;
  right: $spacing-7;
  background: none;
  border: none;
  cursor: pointer;
  @include flex-center;
  padding: 0;
  color: $color-text-tertiary;
  transition: color $transition-base;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: $color-text-base;
  }
}

.form-options {
  @include flex-between;
  font-size: $font-size-base;
}

.checkbox-label {
  @include flex-center;
  gap: $spacing-4;
  cursor: pointer;
  @include font-family-base;
  color: $color-text-base;
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
  border: 1.5px solid $color-border;
  border-radius: $radius-sm;
  background: $color-bg-white;
  transition: all $transition-base;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: $color-primary;
  border-color: $color-primary;

  &::after {
    content: '';
    box-sizing: content-box;
    position: absolute;
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

.checkbox-text {
  font-size: $font-size-base;
  user-select: none;
}

.forgot-link,
.signup-link {
  color: $color-primary;
  font-size: $font-size-base;
  font-weight: 500;
  transition: opacity $transition-base;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
}

.login-button {
  width: 100%;
  @include btn-primary;
  padding: $spacing-6 $spacing-10;
  font-size: $font-size-2xl;
  min-height: 48px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: $shadow-primary-hover;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.loading-spinner {
  @include loading-spinner(20px, 2px);
  border: 2px solid #e5e7eb29;
  border-top-color: white;
}

.signup-prompt {
  text-align: center;
  font-size: $font-size-base;
  color: $color-text-base;
  @include font-family-base;
  margin-top: $spacing-4;
}

.demo-hint {
  margin-top: $spacing-11;
  padding-top: $spacing-8;
  border-top: 1px solid $color-border;
}

.demo-content {
  @include flex-center;
  gap: $spacing-4;
  background: $color-bg-card;
  padding: $spacing-5 $spacing-8;
  border-radius: $radius-lg;
  font-size: 13px;
  color: $color-text-base;
  @include font-family-base;
}

.demo-icon {
  width: 16px;
  height: 16px;
  color: $color-primary;
}

.demo-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: $color-text-tertiary;
  margin-left: $spacing-4;
  transition: color $transition-base;
  line-height: 1;

  &:hover {
    color: $color-text-base;
  }
}

@include mobile {
  .login-container {
    padding: $spacing-8;
  }

  .login-card {
    padding: $spacing-11 $spacing-10;
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
    padding: $spacing-5 $spacing-6 $spacing-5 38px;
  }

  .input-icon {
    left: $spacing-6;
    width: 16px;
    height: 16px;
  }

  .login-button {
    padding: $spacing-5 $spacing-8;
    font-size: 15px;
  }

  .form-options {
    font-size: 13px;
  }
}
</style>
