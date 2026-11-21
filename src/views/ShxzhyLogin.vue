<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <loginIcon class="logo-icon" />
        </div>
        <h1 class="brand-title">慧云账号登录</h1>
        <p class="brand-subtitle">使用行知·慧云账号登录，未注册将自动创建账号</p>
      </div>

      <!-- 慧云服务连通状态（三态常显：检测中 / 在线 / 不可用） -->
      <div class="service-banner" :class="`service-banner--${serviceStatus}`" role="status">
        <template v-if="serviceStatus === 'checking'">
          <span class="banner-spinner"></span>
          <span class="banner-text">正在检测慧云服务状态...</span>
        </template>
        <template v-else-if="serviceStatus === 'online'">
          <svg
            class="banner-icon banner-icon--check"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="banner-text">慧云服务在线</span>
        </template>
        <template v-else>
          <svg
            class="banner-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9V13M12 17H12.01M10.3 3.9L1.8 18C1.5 18.5 1.7 19 2.2 19.3C2.4 19.4 2.6 19.5 2.8 19.5H21.2C21.7 19.5 22.1 19.1 22.1 18.6C22.1 18.4 22 18.2 21.9 18L13.4 3.9C13.2 3.4 12.6 3.2 12.1 3.5C11.9 3.6 11.8 3.7 10.3 3.9Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="banner-content">
            <span class="banner-text">
              当前服务不可用：{{ statusMessage || '暂时无法连接到慧云认证服务' }}
            </span>
            <button
              type="button"
              class="banner-retry"
              :disabled="isChecking"
              @click="checkServiceStatus"
            >
              {{ isChecking ? '检测中...' : '重新检测' }}
            </button>
          </div>
        </template>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username" class="input-label">慧云账号</label>
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
              placeholder="请输入慧云账号"
              autocomplete="username"
              class="form-input"
              :disabled="formDisabled"
            />
          </div>
        </div>

        <div class="input-group">
          <label for="password" class="input-label">慧云密码</label>
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
              placeholder="请输入慧云密码"
              autocomplete="current-password"
              class="form-input"
              :disabled="formDisabled"
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

        <div class="input-group" v-if="captchaId">
          <label for="captcha" class="input-label">验证码</label>
          <div class="input-wrapper">
            <input
              type="text"
              id="captcha"
              v-model="formData.captchaValue"
              placeholder="请输入验证码"
              autocomplete="off"
              class="form-input captcha-input"
              :disabled="formDisabled"
            />
            <img
              v-if="captchaImageBase64"
              :src="captchaImageBase64"
              alt="验证码"
              class="captcha-image"
            />
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.rememberMe" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">记住我(30天)</span>
          </label>
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading || serviceStatus !== 'online'"
        >
          <span v-if="!isLoading">登录</span>
          <span v-else class="loading-spinner"></span>
        </button>

        <div class="divider">
          <span class="divider-text">其他登录方式</span>
        </div>

        <div class="signup-prompt">
          <a href="#" class="signup-link" @click.prevent="goNormalLogin">使用 YC 账号密码登录</a>
          <span class="prompt-divider">·</span>
          <a href="#" class="signup-link" @click.prevent="handleSignup">注册新账号</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import loginIcon from '@/components/icons/loginIcon.vue'
import { useUserStore } from '@/stores/userStore'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

if (userStore.getIsLoggedIn) {
  router.push('/dash')
}

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  captchaValue: '',
  rememberMe: false,
})

// 慧云验证码（由服务端在需要时下发）
const captchaId = ref('')
const captchaImageBase64 = ref('')

// 慧云服务连通状态：checking 检测中 / online 在线 / offline 服务端确认不可用 / unknown 无法确认
const serviceStatus = ref('checking')
const statusMessage = ref('')
// 探测请求是否在途（防重入，与 serviceStatus 分开维护）
const isChecking = ref(false)

// UI 状态
const isLoading = ref(false)
const showPassword = ref(false)

// 服务不可用 / 无法确认时禁用表单
const formDisabled = computed(
  () => serviceStatus.value === 'offline' || serviceStatus.value === 'unknown'
)

// 检测慧云服务连通性（判断逻辑在服务端，前端只获取状态）
const checkServiceStatus = async () => {
  if (isChecking.value) return
  isChecking.value = true
  serviceStatus.value = 'checking'
  statusMessage.value = ''
  try {
    const status = await userStore.fetchShxzhyStatus()
    if (status?.available) {
      serviceStatus.value = 'online'
    } else {
      // 服务端明确探测到慧云不可用 → offline；接口本身异常 → unknown
      serviceStatus.value = status?.message ? 'offline' : 'unknown'
      statusMessage.value = status?.message || '暂时无法确认慧云服务状态，请稍后重试'
    }
  } finally {
    isChecking.value = false
  }
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 登录处理
const handleLogin = async () => {
  // 服务不可用时不允许提交，并触发一次重新检测
  if (serviceStatus.value !== 'online') {
    ElMessage.error('慧云服务当前不可用，暂时无法登录')
    checkServiceStatus()
    return
  }
  // 简单的前端验证
  if (!formData.username.trim()) {
    ElMessage.error('请输入慧云账号')
    return
  }
  if (!formData.password) {
    ElMessage.error('请输入慧云密码')
    return
  }
  if (captchaId.value && !formData.captchaValue.trim()) {
    ElMessage.error('请输入验证码')
    return
  }
  isLoading.value = true
  try {
    const result = await userStore.shxzhyLogin({
      userName: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe,
      captchaId: captchaId.value,
      captchaValue: formData.captchaValue,
    })
    if (result?.success) {
      if (result.isNewUser) {
        ElMessage.success('登录成功，已自动为您创建YC账号')
        ElMessage.success('姓名与慧云密码分别为您的YC账号与密码')
      } else {
        ElMessage.success('登录成功')
      }

      setTimeout(() => {
        loginSuccess()
      }, 500)
    } else {
      // 服务端探测到慧云不可达
      if (result?.service_unavailable) {
        serviceStatus.value = 'offline'
        statusMessage.value = result?.details || '暂时无法连接到慧云认证服务'
        ElMessage.error('当前服务不可用，请稍后再试')
        return
      }
      // 慧云要求验证码：展示验证码输入框与图片
      const data = result?.data
      if (data?.captcha_id) {
        captchaId.value = data.captcha_id
        captchaImageBase64.value = data.captcha_image_base64
        formData.captchaValue = ''
      }
      ElMessage.error(result?.details || '登录失败，请检查慧云账号和密码')
    }
  } catch (error) {
    console.error('Shxzhy login failed:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const loginSuccess = () => {
  const redirect = route.query.redirect

  if (redirect) {
    // 有明确的目标，直接替换过去
    router.replace(redirect)
  } else if (
    window.history.state &&
    window.history.state.back &&
    !['/login', '/register', '/login/shxzhy'].includes(
      router.resolve(window.history.state.back).path
    )
  ) {
    // 有上一页且不是登录页
    const backPath = window.history.state.back
    const isHome = router.resolve(backPath).path === '/'
    if (isHome) {
      // 上一页是首页 -> 跳转到控制台
      router.replace('/dash')
    } else {
      // 上一页不是首页 -> 返回上一页
      router.back()
    }
  } else {
    // 没有上一页或上一页是登录页 -> 默认跳控制台
    router.replace('/dash')
  }
}

// 前往普通登录页
const goNormalLogin = () => {
  const redirect = route.query.redirect
  router.push(redirect ? { path: '/login', query: { redirect } } : '/login')
}

// 注册处理
const handleSignup = () => {
  router.push('/register')
}

onMounted(() => {
  checkServiceStatus()
})
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
  margin-bottom: $spacing-11;
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

// 慧云服务状态横幅
.service-banner {
  @include flex-center;
  gap: $spacing-4;
  padding: $spacing-5 $spacing-8;
  border-radius: $radius-md;
  font-size: $font-size-base;
  margin-bottom: $spacing-11;
  line-height: 1.5;

  &--checking {
    background: $color-warning-bg;
    color: $color-warning-text;
  }

  &--online {
    background: $color-success-bg;
    color: $color-success-text;
  }

  &--offline,
  &--unknown {
    background: $color-danger-bg;
    color: $color-danger-text;
    align-items: flex-start;
    text-align: left;
  }
}

.banner-spinner {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid $color-warning-border;
  border-top-color: $color-warning;
  border-radius: 50%;
  animation: banner-spin 0.8s linear infinite;
}

@keyframes banner-spin {
  to {
    transform: rotate(360deg);
  }
}

.banner-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.banner-content {
  @include flex-column;
  gap: $spacing-3;
  flex: 1;
}

.banner-text {
  @include font-family-base;
}

.banner-retry {
  align-self: flex-start;
  background: none;
  border: 1px solid $color-danger-border;
  border-radius: $radius-base;
  color: $color-danger;
  cursor: pointer;
  font-size: $font-size-sm;
  padding: $spacing-2 $spacing-6;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: $color-danger-hover-bg;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

  &:disabled {
    background: $color-bg-card;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.captcha-input {
  padding-right: 120px;
}

.captcha-image {
  position: absolute;
  right: $spacing-4;
  height: 34px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  cursor: pointer;
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

.captcha-input ~ .password-toggle {
  display: none;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.loading-spinner {
  @include loading-spinner(20px, 2px);
  border: 2px solid #e5e7eb29;
  border-top-color: white;
}

.divider {
  display: flex;
  align-items: center;
  gap: $spacing-6;
  color: $color-text-tertiary;
  font-size: $font-size-sm;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $color-border;
  }
}

.signup-prompt {
  @include flex-center;
  gap: $spacing-4;
  text-align: center;
  font-size: $font-size-base;
  color: $color-text-base;
  @include font-family-base;
}

.prompt-divider {
  color: $color-text-tertiary;
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
