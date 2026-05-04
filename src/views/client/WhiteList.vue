<template>
  <div class="whitelist-container">
    <!-- 头部导航区 -->
    <div class="whitelist-header">
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

    <!-- 主体卡片 -->
    <div class="whitelist-card">
      <!-- 标题栏与统计 -->
      <div class="card-header">
        <div class="title-section">
          <h2>应用白名单</h2>
          <span v-if="loading" class="badge">{{ appList.length }}</span>
          <span v-else><Spinner inline size="tiny" /></span>
        </div>
        <p class="subtitle">仅允许白名单内的应用在客户端运行</p>
      </div>
      <!-- 加载状态 -->
      <div v-if="!loading" class="loading-state">
        <Spinner inline text="加载中..." />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>加载数据失败，请重试</p>
        <button class="retry-btn" @click="clientStore.fetchClientSettings">重试</button>
      </div>

      <!-- 添加区域 -->
      <div v-if="loading" class="add-section">
        <div class="input-group">
          <input
            v-model="newAppName"
            type="text"
            class="app-input"
            placeholder="输入可执行文件名，如：chrome.exe"
            @keyup.enter="addApplication"
          />
          <button class="add-button" @click="addApplication" :disabled="isAdding">
            {{ isAdding ? '添加中...' : '添加' }}
          </button>
        </div>
        <p class="input-hint">支持按回车键快速添加</p>
      </div>

      <!-- 列表区域 / 空状态 -->
      <div v-if="loading" class="list-section">
        <div v-if="appList.length === 0" class="empty-state">
          <svg
            class="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          <p>暂无白名单应用</p>
          <span>请在上方添加允许运行的应用</span>
        </div>
        <div v-else class="app-list">
          <div v-for="app in appList" :key="app.id" class="app-item">
            <div class="app-info">
              <div class="app-icon">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 7l3 3 7-7"
                  />
                </svg>
              </div>
              <span class="app-filename">{{ app.appName }}</span>
            </div>
            <button
              class="remove-button"
              @click="removeApplication(app.id, app.appName)"
              :disabled="removingIds.has(app.id)"
            >
              {{ removingIds.has(app.id) ? '移除中' : '移除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'

import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useMiddleEllipsis } from '@/composables/useMiddleEllipsis'
// inject 过滤器对象
const $filters = inject('$filters')
const router = useRouter()
const clientStore = useClientStore()
const uuid = clientStore.getCurrentClientUUID
const appList = computed(() => clientStore.getCurrentClientWhiteList || [])
const targetRef = ref(null)
const { displayUUID, bindElement } = useMiddleEllipsis(uuid)
// 白名单数据模型
const loading = computed(() => clientStore.getCurrentClientWhiteList !== null)
const error = computed(() => clientStore.getCurrentClientWhiteList?.[0]?.id === -1)
const isAdding = ref(false) // 添加按钮防抖
const removingIds = ref(new Set()) // 正在移除的id集合

// 新应用输入
const newAppName = ref('')

// 添加应用逻辑
const addApplication = async () => {
  const filename = newAppName.value.trim()
  if (!filename) {
    ElMessage.error('请输入可执行文件名')
    return
  }
  // 简单校验重复 (可扩展)
  const exists = appList.value.some((app) => app.appName.toLowerCase() === filename.toLowerCase())
  if (exists) {
    ElMessage.error('该应用已在白名单中')
    return
  }

  isAdding.value = true
  try {
    await clientStore.addAppToWhiteList(filename)
    newAppName.value = '' // 清空输入
  } catch (error) {
    console.error('添加失败', error)
    ElMessage.error('添加应用失败，请稍后重试')
  } finally {
    isAdding.value = false
  }
}

// 移除应用逻辑
const removeApplication = async (id, appName) => {
  // 防止重复点击
  if (removingIds.value.has(id)) return
  removingIds.value.add(id)
  try {
    await clientStore.removeAppFromWhiteList(appName)
    // 前端删除对应项
    // appList.value = appList.value.filter((app) => app.id !== id)
  } catch (error) {
    console.error('移除失败', error)
    ElMessage.error('移除应用失败，请稍后重试')
  } finally {
    removingIds.value.delete(id)
  }
}

/**
 * 返回上一页（客户端详情）
 */
const goBack = () => {
  router.back()
}
const getClientWhiteList = async () => {
  if (!clientStore.getCurrentClientWhiteList || clientStore.getCurrentClientWhiteList[0]?.id === -1)
    await clientStore.fetchClientWhiteList()
  console.log(' getClientWhiteList', clientStore.getCurrentClientWhiteList)
}
onMounted(() => {
  bindElement(targetRef.value)
})
// 组件挂载时获取数据
onMounted(() => {
  getClientWhiteList()
})
</script>

<style scoped>
/* ----- 变量定义与重置 ----- */
.whitelist-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

/* 头部导航 */
.whitelist-header {
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

/* 卡片主体 */
.whitelist-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 28px 24px;
  transition: box-shadow 0.2s ease;
}
.whitelist-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
/* 卡片头部 */
.card-header {
  margin-bottom: 18px;
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

.badge {
  background: #1e40af;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 2px 10px;
  border-radius: 9999px;
  line-height: 1.4;
  min-width: 28px;
  text-align: center;
}

.subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

/* 添加区域 */
.add-section {
  margin-bottom: 32px;
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
}

.input-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.app-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
  outline: none;
  font-family: inherit;
  color: #374151;
}

.app-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.1);
}

.add-button {
  background: #1e40af;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0 24px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.05s linear;
  font-family: inherit;
  white-space: nowrap;
}

.add-button:hover:not(:disabled) {
  background: #15358f;
}

.add-button:active:not(:disabled) {
  transform: scale(0.97);
}

.add-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}

.input-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 10px;
  margin-bottom: 0;
}

/* 列表区域 */
.list-section {
  min-height: 180px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #6b7280;
  gap: 12px;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  width: 52px;
  height: 52px;
  stroke: #9ca3af;
  margin-bottom: 8px;
}

.empty-state p {
  font-weight: 500;
  color: #374151;
  margin: 0;
  font-size: 1.1rem;
}

.empty-state span {
  font-size: 0.85rem;
}

/* 应用列表卡片样式 */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.app-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.app-icon {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.app-icon svg {
  width: 18px;
  height: 18px;
  stroke: #1e40af;
  stroke-width: 1.8;
}

.app-filename {
  /* font-family: 'SF Mono', monospace; */
  font-size: 0.9rem;
  font-weight: 500;
  color: #1f2937;
  word-break: break-all;
}

.remove-button {
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 6px 18px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}

.remove-button:hover:not(:disabled) {
  border-color: #fecaca;
  background-color: #fef2f2;
  color: #b91c1c;
}

.remove-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

/* 响应式布局 (768px) */
@media (max-width: 768px) {
  .whitelist-container {
    padding: 16px;
  }

  .whitelist-header {
    /* flex-direction: column; */
    align-items: stretch;
    margin-bottom: 10px;
  }

  .client-info {
    justify-content: center;
  }

  .whitelist-card {
    padding: 20px 16px;
  }

  .title-section h2 {
    font-size: 1.4rem;
  }

  .input-group {
    flex-direction: column;
  }

  .add-button {
    padding: 12px;
    width: 100%;
    justify-content: center;
  }

  .app-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .remove-button {
    padding: 5px 16px;
  }
}

/* 微调过渡 */
* {
  transition-property: background-color, border-color, box-shadow, transform;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
</style>
