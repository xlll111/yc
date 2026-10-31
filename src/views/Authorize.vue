<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <loginIcon class="logo-icon" />
        </div>
        <h1 class="brand-title">授权确认</h1>
        <p class="brand-subtitle">应用请求访问您的账户</p>
      </div>

      <!-- 应用信息 -->
      <div class="client-info">
        <div class="client-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="4"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M8 12h8M12 8v8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="client-detail">
          <p class="client-name">{{ clientName }}</p>
          <p class="client-desc">请求以下权限访问您的账户信息</p>
        </div>
      </div>

      <!-- 权限列表 -->
      <div class="scope-list">
        <div v-for="scope in scopes" :key="scope.key" class="scope-item">
          <div class="scope-check">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="scope-text">
            <p class="scope-label">{{ scope.label }}</p>
            <p class="scope-desc">{{ scope.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-group">
        <button class="auth-button primary" :disabled="isLoading" @click="handleAuthorize">
          <span v-if="!isLoading">同意并继续</span>
          <span v-else class="loading-spinner"></span>
        </button>
        <button class="auth-button secondary" :disabled="isLoading" @click="handleDeny">
          拒绝
        </button>
      </div>

      <p class="security-hint">您将返回 {{ clientName }}。此操作不会泄露您的密码。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import loginIcon from '@/components/icons/loginIcon.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLoading = ref(false)

// 从 URL 查询参数中读取 OAuth 请求信息
const clientId = computed(() => route.query.client_id)
const clientName = computed(() => route.query.client_name || '第三方应用')
const redirectUri = computed(() => route.query.redirect_uri)
const state = computed(() => route.query.state)
const scopeParam = computed(() => route.query.scope || 'openid profile')
const codeChallenge = computed(() => route.query.code_challenge)
const codeChallengeMethod = computed(() => route.query.code_challenge_method)

// 根据 scope 展示权限说明
const scopeMap = {
  openid: { label: '身份标识', desc: '获取您的唯一用户标识' },
  profile: { label: '基本资料', desc: '获取您的昵称、头像等公开信息' },
  email: { label: '邮箱地址', desc: '获取您的邮箱及验证状态' },
}

const scopes = computed(() =>
  scopeParam.value
    .split(' ')
    .filter(Boolean)
    .map((key) => ({ key, ...(scopeMap[key] || { label: key, desc: '自定义权限' }) }))
)

onMounted(() => {
  // 如果用户未登录，跳转到登录页并携带回跳地址
  if (!userStore.getIsLoggedIn) {
    const returnUrl = route.fullPath
    router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`)
    return
  }
  // 校验必要参数
  if (!clientId.value || !redirectUri.value || !state.value) {
    ElMessage.error('授权请求参数不完整')
  }
})

const buildRedirect = (params) => {
  const url = new URL(redirectUri.value)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })
  return url.toString()
}

const handleAuthorize = async () => {
  if (!clientId.value || !redirectUri.value) {
    ElMessage.error('授权请求无效')
    return
  }
  isLoading.value = true
  try {
    const redirectUrl = await userStore.oauthAuthorize({
      client_id: clientId.value,
      redirect_uri: redirectUri.value,
      response_type: 'code',
      scope: scopeParam.value,
      state: state.value,
      code_challenge: codeChallenge.value,
      code_challenge_method: codeChallengeMethod.value || 'S256',
    })
    window.location.href = redirectUrl // 直接跳回第三方应用
  } catch (e) {
    ElMessage.error(e?.message || '授权失败，请稍后重试')
    isLoading.value = false
  }
}
const handleDeny = () => {
  // 拒绝授权：带 error 参数跳回 B 站
  if (redirectUri.value && state.value) {
    window.location.href = buildRedirect({
      error: 'access_denied',
      error_description: '用户拒绝了授权请求',
      state: state.value,
    })
  } else {
    router.back()
  }
}
</script>

<style lang="scss" scoped>
.auth-container {
  @include flex-center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: $spacing-8;
  flex: auto;
}

.auth-card {
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
  margin-bottom: $spacing-10;
}

.logo-wrapper {
  @include flex-center;
  display: inline-flex;
  width: 56px;
  height: 56px;
  background: $color-primary-alpha-10;
  border-radius: $radius-lg;
  margin-bottom: $spacing-8;
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

.client-info {
  @include flex-center;
  gap: $spacing-6;
  padding: $spacing-7 $spacing-8;
  background: $color-bg-card;
  border-radius: $radius-lg;
  margin-bottom: $spacing-10;
  justify-content: flex-start;
}

.client-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: $color-primary-alpha-10;
  border-radius: $radius-md;
  color: $color-primary;

  svg {
    width: 24px;
    height: 24px;
  }
}

.client-detail {
  text-align: left;
}

.client-name {
  @include font-family-base;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-base;
  margin-bottom: $spacing-2;
}

.client-desc {
  @include font-family-base;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.scope-list {
  @include flex-column;
  gap: $spacing-6;
  margin-bottom: $spacing-11;
}

.scope-item {
  @include flex-center;
  gap: $spacing-6;
  justify-content: flex-start;
  padding: $spacing-5 $spacing-7;
  border: 1px solid $color-border;
  border-radius: $radius-md;
}

.scope-check {
  @include flex-center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  background: $color-primary;
  border-radius: 50%;
  color: white;

  svg {
    width: 14px;
    height: 14px;
  }
}

.scope-text {
  text-align: left;
}

.scope-label {
  @include font-family-base;
  font-size: $font-size-base;
  font-weight: 500;
  color: $color-text-base;
  margin-bottom: $spacing-1;
}

.scope-desc {
  @include font-family-base;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.action-group {
  @include flex-column;
  gap: $spacing-6;
}

.auth-button {
  width: 100%;
  padding: $spacing-6 $spacing-10;
  font-size: $font-size-2xl;
  min-height: 48px;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-base;
  @include font-family-base;
  font-weight: 500;

  &.primary {
    @include btn-primary;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: $shadow-primary-hover;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &.secondary {
    background: transparent;
    border: 1.5px solid $color-border;
    color: $color-text-base;

    &:hover:not(:disabled) {
      border-color: $color-text-tertiary;
      background: $color-bg-card;
    }
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

.security-hint {
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  @include font-family-base;
  margin-top: $spacing-8;
  line-height: 1.5;
}

@include mobile {
  .auth-container {
    padding: $spacing-8;
  }

  .auth-card {
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

  .auth-button {
    padding: $spacing-5 $spacing-8;
    font-size: 15px;
  }
}
</style>
