<template>
  <div class="verification-container">
    <div class="verification-card">
      <!-- 验证中状态 -->
      <div v-if="status === 'verifying'" class="status-content">
        <div class="icon-wrapper verifying">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
          </svg>
        </div>
        <h2 class="status-title">正在验证</h2>
        <p class="status-message">请稍候，我们正在验证您的邮箱地址...</p>
      </div>

      <!-- 验证成功状态 -->
      <div v-else-if="status === 'success'" class="status-content">
        <div class="icon-wrapper success">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 class="status-title">验证成功</h2>
        <p class="status-message">您的邮箱已成功验证，感谢您的使用。</p>
        <button class="action-button" @click="handleRedirect">继续使用</button>
      </div>

      <!-- 验证失败状态 -->
      <div v-else-if="status === 'failed'" class="status-content">
        <div class="icon-wrapper failed">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 class="status-title">验证失败</h2>
        <p class="status-message">{{ errorMessage || '验证链接无效或已过期，请重新尝试。' }}</p>
        <button class="action-button" @click="handleRetry">重新验证</button>
      </div>

      <!-- 初始加载占位（几乎瞬间过渡） -->
      <div v-else class="status-content">
        <div class="icon-wrapper verifying">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
          </svg>
        </div>
        <h2 class="status-title">准备验证</h2>
        <p class="status-message">正在读取验证信息...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const userStore = useUserStore()
// 状态: 'idle' | 'verifying' | 'success' | 'failed'
const status = ref('idle')
const errorMessage = ref('')
let abortController = null

// 模拟 API 验证函数 (实际项目中替换为真实 API 调用)
const verifyEmailToken = async (token) => {
  // 模拟网络请求，随机成功或失败
  return await userStore.emailVerify(token)
}

// 执行验证
const performVerification = async (token) => {
  if (!token) {
    status.value = 'failed'
    errorMessage.value = '缺少验证令牌，请检查链接是否正确。'
    return
  }

  status.value = 'verifying'
  errorMessage.value = ''

  try {
    const result = await verifyEmailToken(token)
    status.value = 'success'
  } catch (error) {
    // 如果请求被取消，不更新状态
    if (error && error.message === '验证已取消') {
      return
    }
    status.value = 'failed'
    errorMessage.value = error.message || '验证过程中发生错误，请稍后重试。'
  } finally {
    abortController = null
  }
}

// 从路由 params 获取 token
const getTokenFromRoute = () => {
  const token = route.query.token
  return token
}

// 处理重试
const handleRetry = () => {
  const token = getTokenFromRoute()
  if (token) {
    performVerification(token)
  } else {
    errorMessage.value = '无法获取验证令牌，请确认链接完整。'
  }
}

// 处理跳转 (例如跳转到首页或登录页)
const handleRedirect = () => {
  // 根据实际路由调整，这里简单演示
  // 可以通过 router.push 或 window.location 跳转
  // 这里仅做示意，实际项目需引入 useRouter
  // 如果使用 useRouter: const router = useRouter(); router.push('/')
  window.location.href = '/'
  // 或者用 router.push
}

// 组件挂载后立即验证
onMounted(() => {
  const token = getTokenFromRoute()
  if (token) {
    performVerification(token)
  } else {
    status.value = 'failed'
    errorMessage.value = '未找到验证令牌，请检查链接。'
  }
})

// 组件卸载前取消未完成的请求
onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
})
</script>

<style scoped>
/* 全局样式已在父组件中定义，此处仅处理本组件特有样式 */
.verification-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background-color: #f9fafb;
  min-height: 100%;
  width: 100%;
}

.verification-card {
  max-width: 420px;
  width: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  text-align: center;
}

.verification-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

.icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.icon-wrapper svg {
  width: 36px;
  height: 36px;
}

/* 验证中 - 使用主色 */
.icon-wrapper.verifying {
  background-color: rgba(30, 64, 175, 0.1);
  color: #1e40af;
}

.spinner {
  animation: rotate 1.2s linear infinite;
  width: 40px;
  height: 40px;
}

.spinner .path {
  stroke: #1e40af;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 成功 - 主色背景 */
.icon-wrapper.success {
  background-color: #1e40af;
  color: white;
}

/* 失败 - 使用红色警示 */
.icon-wrapper.failed {
  background-color: #fef2f2;
  color: #dc2626;
}
.icon-wrapper.failed svg {
  stroke: #dc2626;
}

.status-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.status-message {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.5;
  max-width: 280px;
}

.action-button {
  background-color: #1e40af;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 10px 28px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-width: 120px;
}

.action-button:hover {
  background-color: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.25);
}

.action-button:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .verification-card {
    padding: 32px 20px;
    margin: 0 8px;
  }
  .status-title {
    font-size: 1.35rem;
  }
  .icon-wrapper {
    width: 64px;
    height: 64px;
  }
  .icon-wrapper svg {
    width: 30px;
    height: 30px;
  }
  .action-button {
    padding: 8px 24px;
    min-width: 100px;
  }
}

/* 简单淡入 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
