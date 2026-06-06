<template>
  <div class="auth-container">
    <!-- 头部导航区 -->
    <div class="header">
      <button class="back-button" @click="goBack">
        <svg
          class="back-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>
      <div class="client-info">
        <span class="client-label">客户端</span>
        <span ref="targetRef" class="client-uuid">{{ displayUUID }}</span>
      </div>
    </div>
    <div class="auth-card">
      <!-- 标题栏 -->
      <div class="card-header">
        <div class="title-section">
          <h2>联网授权管理</h2>
        </div>
        <p class="subtitle">管理当前客户端的联网授权状态</p>
      </div>
      <!-- 加载状态 -->
      <LoadingState
        :loading="!clientSettings.loaded"
        :error="clientSettings.error"
        @retry="clientStore.fetchClientSettings"
      />

      <!-- 状态卡片 -->
      <div class="status-section" v-if="clientSettings.loaded && !clientSettings.error">
        <div class="status-badge" :class="{ enabled: controlEnabled, disabled: !controlEnabled }">
          <span class="status-dot"></span>
          {{ controlEnabled ? '联网控制已启用' : '联网控制未启用' }}
        </div>
        <p v-if="!controlEnabled" class="hint-text">系统未启用联网控制，设置将不会生效</p>
      </div>

      <!-- 授权状态展示区 -->
      <div
        class="info-panel"
        v-if="clientSettings.loaded && !clientSettings.error && controlEnabled"
      >
        <div v-if="active" class="auth-active">
          <div class="info-row">
            <span class="info-label">授权状态</span>
            <span class="info-value status-active">已授权</span>
          </div>
          <div class="info-row">
            <span class="info-label">截止时间</span>
            <span class="info-value">{{ $filters.formatDateTime(expireAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">剩余时长</span>
            <span class="info-value highlight">{{ remainingText }}</span>
          </div>
          <button class="btn btn-danger" @click="handleCancelAuth" :disabled="isSaving">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span v-if="!isSaving">取消授权</span>
            <span v-else class="saving-spinner">保存中...</span>
          </button>
        </div>
        <div v-else class="auth-inactive">
          <div class="info-row">
            <span class="info-label">当前状态</span>
            <span class="info-value status-inactive">未授权联网</span>
          </div>
        </div>
      </div>

      <!-- 设置授权区（仅在未授权且控制启用时显示） -->
      <div
        class="set-auth-section"
        v-if="clientSettings.loaded && !clientSettings.error && controlEnabled"
      >
        <h3 class="section-title">设置联网授权</h3>
        <div class="preset-grid">
          <button
            v-for="min in presetMinutes"
            :key="min"
            class="preset-btn"
            :class="{ active: selectedPreset === min && !customMode }"
            @click="selectPreset(min)"
          >
            {{ min }} 分钟
          </button>
          <button
            class="preset-btn custom-btn"
            :class="{ active: customMode }"
            @click="enableCustomMode"
          >
            自定义
          </button>
        </div>
        <div v-if="customMode" class="custom-input-group">
          <input
            v-model.number="customMinutes"
            type="number"
            min="1"
            max="1440"
            placeholder="输入分钟数"
            class="custom-input"
            @keyup.enter="submitAuth"
          />
          <span class="input-suffix">分钟</span>
        </div>
        <button
          class="btn btn-primary submit-btn"
          @click="submitAuth"
          :disabled="!isFormValid || isSaving"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span v-if="!isSaving">确认授权</span>
          <span v-else>保存中...</span>
        </button>
        <p v-if="submitError" class="error-text">{{ submitError }}</p>
      </div>

      <!-- 底部操作 -->
      <!-- <div class="card-footer">
        <button class="btn btn-outline" @click="goBack()">取消</button>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'

import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useMiddleEllipsis } from '@/composables/useMiddleEllipsis'

// inject 过滤器对象
const $filters = inject('$filters')
const router = useRouter()
const clientStore = useClientStore()
const isSaving = ref(false)
const presetMinutes = [10, 20, 30, 40, 60]
const selectedPreset = ref(null)
const customMode = ref(false)
const customMinutes = ref(null)
const submitError = ref('')
const now = ref(Date.now())
let timer = null
const uuid = clientStore.getCurrentClientUUID
const clientSettings = clientStore.getCurrentClientSettings
const controlEnabled = computed(
  () => clientSettings.data.netControlEnabled || clientSettings.data.netPeriodEnabled,
)
const active = computed(() => !!clientSettings.data.netAllowedUntil)
const expireAt = computed(() => clientSettings.data.netAllowedUntil)
const targetRef = ref(null)
const { displayUUID, bindElement } = useMiddleEllipsis(uuid)
// 表单有效性
const isFormValid = computed(() => {
  if (customMode.value) {
    return (
      Number.isInteger(customMinutes.value) &&
      customMinutes.value > 0 &&
      customMinutes.value <= 1440
    )
  }
  return selectedPreset.value !== null
})

// 选中的分钟数
const selectedMinutes = computed(() => {
  return customMode.value ? customMinutes.value : selectedPreset.value
})

// 剩余时间文本
const remainingText = computed(() => {
  if (!active || !expireAt) return '--'
  const diff = $filters.isoToTimestamp(expireAt.value) - now.value
  if (diff <= 0) return '已过期'
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟 ${seconds} 秒`
  }
  if (minutes > 0) {
    return `${minutes} 分钟 ${seconds} 秒`
  }
  return `${seconds} 秒`
})

// 选择预设
function selectPreset(min) {
  selectedPreset.value = min
  customMode.value = false
  customMinutes.value = null
  submitError.value = ''
}

// 启用自定义模式
function enableCustomMode() {
  customMode.value = true
  selectedPreset.value = null
  submitError.value = ''
}

// 提交授权
function submitAuth() {
  submitError.value = ''
  isSaving.value = true
  if (!isFormValid.value) {
    submitError.value = '请选择或输入有效的授权时长（1-1440分钟）'
    return
  }
  clientStore
    .updateClientNetAllowedUntil(selectedMinutes.value * 60 * 1000 + now.value)
    .then(() => {
      ElMessage.success('授权成功')
      resetForm()
    })
    .catch((e) => {
      console.error('error updating client net allowed until', e)
      submitError.value = '授权失败，请稍后重试'
    })
    .finally(() => {
      isSaving.value = false
    })
}

// 取消授权
function handleCancelAuth() {
  isSaving.value = true
  clientStore
    .clearClientNetAllowedUntil()
    .then(() => {
      ElMessage.success('取消授权成功')
      resetForm()
    })
    .catch((e) => {
      console.error('error clearing client net allowed until', e)
      submitError.value = '取消授权失败，请稍后重试'
    })
    .finally(() => {
      isSaving.value = false
    })
}

// 重置表单
function resetForm() {
  selectedPreset.value = null
  customMode.value = false
  customMinutes.value = null
  submitError.value = ''
}
// 返回上一页
const goBack = () => {
  router.back()
}
const getCurrentClientSettings = async () => {
  if (!clientSettings.loaded || clientSettings.error) await clientStore.fetchClientSettings()
}
// 监听授权状态变化，自动重置表单
watch(
  () => active,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  },
)

onMounted(async () => {
  getCurrentClientSettings()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onMounted(() => {
  if (targetRef.value) bindElement(targetRef.value)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* 容器与卡片 */
.auth-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.auth-card {
  background: #ffffff;
  border-radius: 8px;
  /* border: 1px solid #e5e7eb; */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: box-shadow 0.2s ease;
}

.auth-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 头部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
  margin-bottom: 28px;
}

.back-button {
  display: inline-flex;
  min-width: max-content;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #374151;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 9999px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.back-button:hover {
  background-color: #f3f4f6;
  color: #1e40af;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.client-info {
  background: #fff;
  max-width: 60vw;
  min-width: 30%;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-label {
  min-width: max-content;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
}

.client-uuid {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e40af;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 9999px;
}
/* 卡片头部 */
.card-header {
  margin-bottom: 0px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.title-section h2 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  letter-spacing: -0.01em;
}

.subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}
/* 状态卡片 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.error-state svg,
.empty-state svg {
  color: #9ca3af;
  margin-bottom: 16px;
}

.error-state p,
.empty-state p {
  margin: 8px 0 16px;
  font-size: 1rem;
}

.retry-btn {
  padding: 8px 20px;
  background-color: #1e40af;
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.retry-btn:hover {
  background-color: #1e3a8a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
/* 状态标识 */
.status-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  transition: background 0.2s ease;
}

.status-badge.enabled {
  background: rgba(30, 64, 175, 0.08);
  color: #1e40af;
}

.status-badge.disabled {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.hint-text {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

/* 信息面板 */
.info-panel {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.95rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

.info-value {
  color: #374151;
  font-weight: 500;
  font-size: 0.95rem;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

.status-active {
  color: #16a34a;
  font-weight: 600;
}

.status-inactive {
  color: #9ca3af;
  font-weight: 600;
}

.highlight {
  color: #1e40af;
  font-weight: 700;
  font-size: 1.05rem;
}

/* 按钮通用 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  border: 1px solid transparent;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  transition: all 0.2s ease;
  background: white;
}

.btn-primary {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.btn-primary:hover:not(:disabled) {
  background: #1e3a8a;
  border-color: #1e3a8a;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: white;
  color: #dc2626;
  border-color: #fecaca;
  margin-top: 12px;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-outline {
  background: white;
  color: #374151;
  border-color: #e5e7eb;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.auth-active .btn-danger {
  align-self: flex-start;
}

/* 预设网格 */
.set-auth-section {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.preset-btn {
  padding: 10px 8px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

.preset-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.preset-btn.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.custom-btn.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

/* 自定义输入 */
.custom-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  font-size: 0.95rem;
  color: #374151;
  outline: none;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.custom-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
}

.input-suffix {
  color: #6b7280;
  font-weight: 500;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

.submit-btn {
  align-self: flex-start;
}

.error-text {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0;
}

/* 底部 */
.card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式 */
@media (max-width: 768px) {
  .whitelist-container {
    padding: 16px;
  }

  .header {
    /* flex-direction: column; */
    align-items: stretch;
    margin-bottom: 10px;
  }

  .client-info {
    justify-content: center;
  }

  .title-section h2 {
    font-size: 1.4rem;
  }

  .auth-container {
    padding: 16px;
  }

  .auth-card {
    padding: 20px;
    gap: 16px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .header-spacer {
    display: none;
  }

  .card-title {
    font-size: 1.2rem;
  }

  .preset-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .btn {
    padding: 10px 18px;
    font-size: 0.9rem;
  }
}
</style>
