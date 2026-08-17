<template>
  <div class="settings-container root">
    <div class="page-header">
      <h1 class="page-title">全局设置</h1>
    </div>
    <!-- 加载状态 -->
    <LoadingState
      :loading="!globalSettings.loaded"
      :error="globalSettings.error"
      @retry="fetchAllData"
      loadingText="加载中..."
      errorText="加载设置失败，请重试"
    />
    <form
      v-if="globalSettings.loaded && !globalSettings.error"
      @submit.prevent="saveSettings"
      class="settings-form"
    >
      <div class="setting-card">
        <div class="card-header">
          <h2 class="card-title">钉钉文件推送</h2>
        </div>
        <div class="card-body">
          <div class="toggle-item">
            <div class="toggle-label">
              <span>启用钉钉文件推送</span>
              <p class="toggle-desc">详情请查看：个人中心-绑定钉钉-查看完整教程</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.dingtalkFileTransfer"
                @update:model-value="dingtalkFileTransferToggle($event)"
                aria-label="启用钉钉文件推送"
              />
            </label>
          </div>

          <div class="divider"></div>

          <!-- 客户端选择折叠面板 -->
          <div
            class="client-selector"
            :class="{
              disabled: !form.dingtalkFileTransfer || clientsLoading,
              expanded: clientPanelExpanded,
            }"
          >
            <div
              class="toggle-item selector-header"
              :class="{ 'selector-header-expanded': clientPanelExpanded }"
              @click="toggleClientPanel"
            >
              <div class="toggle-label">
                <span>推送客户端</span>
                <p class="toggle-desc">选择推送的客户端</p>
              </div>
              <Spinner
                v-if="clientsLoading || dingTalkFileTransferClientsLoading"
                inline
                :text="clientsError || dingTalkFileTransferClientsError || '加载中...'"
                size="tiny"
              />
              <span v-else class="selector-summary">
                {{
                  form.dingtalkFileTransferClientList.length
                    ? `已选 ${form.dingtalkFileTransferClientList.length} 个`
                    : '未选择'
                }}
                <span class="arrow">{{ clientPanelExpanded ? '▴' : '▾' }}</span>
              </span>
            </div>

            <div v-if="clientPanelExpanded" v-show="clientPanelExpanded" class="selector-body">
              <!-- 工具栏 -->
              <div class="selector-toolbar">
                <el-input
                  v-model="clientSearch"
                  placeholder="搜索客户端（主机名 / IP / 备注）"
                  size="small"
                  clearable
                  class="search-input"
                />
                <div class="selector-actions">
                  <el-button size="small" @click="selectAllClients">全选</el-button>
                  <el-button size="small" @click="clearSelectedClients">清空</el-button>
                </div>
              </div>

              <!-- 客户端列表 -->
              <el-checkbox-group
                v-model="form.dingtalkFileTransferClientList"
                class="client-checkbox-list"
              >
                <el-checkbox
                  v-for="client in filteredClients"
                  :key="client.uuid"
                  :value="client.uuid"
                  class="client-checkbox-item"
                >
                  <div class="client-item">
                    <span class="client-hostname">{{ client.hostname }}</span>
                    <span class="client-detail">{{ client.ipAddress }} · {{ client.osInfo }}</span>
                    <span v-if="client.note" class="client-note">{{ client.note }}</span>
                  </div>
                </el-checkbox>
              </el-checkbox-group>

              <p v-if="filteredClients.length === 0" class="empty-tip">暂无匹配客户端</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 保存按钮区域 -->
      <div class="save-section">
        <button type="submit" class="save-btn" :disabled="isSaving">
          <span v-if="!isSaving">保存设置</span>
          <span v-else class="saving-spinner">保存中...</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import LoadingState from '@/components/LoadingState.vue'
import Spinner from '@/components/Spinner.vue'
import { useClientStore } from '@/stores/clientStore'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/dist/index.css'
// 导入需要用到的 Element Plus 组件
import { ElInput, ElButton, ElCheckboxGroup, ElCheckbox } from 'element-plus'

const clientStore = useClientStore()
const userStore = useUserStore()
const globalSettings = userStore.getGlobalSettings

const form = reactive({
  id: 0,
  dingtalkFileTransfer: false,
  dingtalkFileTransferClientList: [],
})
const isSaving = ref(false)

const router = useRouter()

const saveSettings = async () => {
  isSaving.value = true

  try {
    await userStore.updateUerGlobalSettings(form)
    console.log('设置已保存:', { ...form })
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存出错:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}
const dingtalkFileTransferToggle = async (value) => {
  if (value && !userStore.getUserInfo.dingtalkFileTransfer) {
    ElMessage.error('该功能需要绑定钉钉账号')
    return
  }
  form.dingtalkFileTransfer = value
}
// ---------- 客户端选择相关状态 ----------
const clientList = ref([]) // 所有客户端
const clientPanelExpanded = ref(false) // 折叠面板展开状态
const clientSearch = ref('') // 搜索关键字

// 根据搜索关键字过滤客户端
const filteredClients = computed(() => {
  const keyword = clientSearch.value.trim().toLowerCase()
  if (!keyword) return clientList.value

  return clientList.value.filter((client) => {
    const hostname = (client.hostname || '').toLowerCase()
    const ip = (client.ipAddress || '').toLowerCase()
    const note = (client.note || '').toLowerCase()
    return hostname.includes(keyword) || ip.includes(keyword) || note.includes(keyword)
  })
})

// 切换折叠面板
function toggleClientPanel() {
  clientPanelExpanded.value = !clientPanelExpanded.value
}

// 全选所有过滤后的客户端（实际全选全部客户端，你也可以改为只选过滤后的）
function selectAllClients() {
  form.dingtalkFileTransferClientList = clientList.value.map((c) => c.uuid)
}

// 清空选择
function clearSelectedClients() {
  form.dingtalkFileTransferClientList = []
}

const clientsLoading = ref(false)
const clientsError = ref(null)
const fetchClients = async () => {
  clientsLoading.value = true
  clientsError.value = null
  clientList.value = []
  try {
    const data = await clientStore.fetchClients()
    // 按 lastSeen 从新到旧排序
    const sortedData = [...data].sort((a, b) => {
      return new Date(b.lastSeen) - new Date(a.lastSeen)
    })
    clientList.value = sortedData
    // console.log('Fetched clients:', sortedData)
    ElMessage.success('客户端列表刷新成功')
  } catch (err) {
    clientsError.value = err.message || '获取客户端列表失败，请稍后重试'
    console.error('Failed to fetch clients:', err)
    ElMessage.error(clientsError.value)
  } finally {
    clientsLoading.value = false
  }
}

const dingTalkFileTransferClientsLoading = ref(false)
const dingTalkFileTransferClientsError = ref(null)
const fetchDingTalkFileTransferClients = async () => {
  dingTalkFileTransferClientsLoading.value = true
  dingTalkFileTransferClientsError.value = null
  form.dingtalkFileTransferClientList = []
  try {
    const data = await userStore.fetchDingtalkFileTransferClients()
    form.dingtalkFileTransferClientList = data
    // console.log('Fetched clients:', data)
    ElMessage.success('推送客户端列表刷新成功')
  } catch (err) {
    dingTalkFileTransferClientsError.value = err.message || '获取推送客户端列表失败，请稍后重试'
    console.error('Failed to fetch clients:', err)
    ElMessage.error(dingTalkFileTransferClientsError.value)
  } finally {
    dingTalkFileTransferClientsLoading.value = false
  }
}

const getCurrentGlobalSettings = async () => {
  if (!globalSettings.loaded || globalSettings.error) await userStore.fetchGlobalSettings()
  if (globalSettings.loaded && !globalSettings.error) Object.assign(form, globalSettings.data)
  // console.log('设置已加载:', form)
}
const fetchAllData = async () => {
  await Promise.all([
    getCurrentGlobalSettings(),
    fetchClients(),
    fetchDingTalkFileTransferClients(),
  ])
}
onMounted(async () => {
  await fetchAllData()
})
</script>

<style scoped>
/* 全局变量定义 */
.root {
  --primary: #1e40af;
  --text-color: #374151;
  --border-color: #e5e7eb;
  --card-radius: 8px;
  --btn-radius: 9999px;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.08);
  --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --transition: 0.2s ease;
}
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
  letter-spacing: -0.01em;
} /* 卡片样式 */
.setting-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-light);
  transition: box-shadow var(--transition);
  overflow: hidden;
}

.setting-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
  background-color: #fafbfc;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
}

.card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: var(--primary);
  border-radius: 4px;
  margin-right: 12px;
}

.card-body {
  padding: 12px 24px;
} /* 每个开关项 */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label span {
  font-weight: 500;
  font-size: 0.95rem;
  color: #1f2937;
}

.toggle-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}
/* 分割线 */
.divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 0;
}
/* 保存区域 */
.save-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.save-btn {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--btn-radius);
  font-size: 0.95rem;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.2px;
  min-width: 130px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(30, 64, 175, 0.25);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.saving-spinner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-message {
  font-size: 0.9rem;
  margin: 0;
  color: #059669;
  font-weight: 500;
  background: #ecfdf5;
  padding: 8px 16px;
  border-radius: 20px;
  transition: opacity var(--transition);
}

/* ---------- 容器（最大宽度 & 内边距） ---------- */
.client-selector.expanded {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 4px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    border-color 0.2s ease,
    opacity 0.2s ease;
  --font-family: var(--font-family);
}

/* 禁用状态（暗化 + 不可点击） */
.client-selector.disabled {
  opacity: 0.55;
  pointer-events: none;
  cursor: not-allowed;
}

/* ---------- 折叠头部 ---------- */
.selector-header {
  /* padding: 8px 0px; */
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
  border-radius: 6px;
}
.selector-header-expanded {
  padding: 8px 10px;
}

.selector-header:hover {
  background: #f9fafb;
}

.selector-summary {
  font-size: 0.9rem;
  color: #6b7280;
  flex-wrap: nowrap;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 450;
}

.arrow {
  display: inline-block;
  font-size: 0.8rem;
  color: #9ca3af;
  transition: transform 0.2s ease;
  margin-left: 2px;
}

/* ---------- 折叠面板主体 ---------- */
.selector-body {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  animation: fadeSlideIn 0.25s ease;
}

@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- 工具栏 ---------- */
.selector-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0 9px;
}

.search-input {
  flex: 1 1 220px;
  min-width: 140px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 9999px;
  border-color: #e5e7eb;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #1e40af;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
}

.selector-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.selector-actions .el-button {
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.8rem;
  padding: 5px 14px;
  border: 1px solid #e5e7eb;
  color: #374151;
  background: #ffffff;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.selector-actions .el-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.selector-actions .el-button:active {
  background: #e2e8f0;
}

/* ---------- 复选框列表 ---------- */
.client-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 滚动条美化 */
.client-checkbox-list::-webkit-scrollbar {
  width: 5px;
}
.client-checkbox-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 9999px;
}
.client-checkbox-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}
.client-checkbox-list::-webkit-scrollbar-thumb:hover {
  background: #b0b8c4;
}

.client-checkbox-item {
  margin: 0 6px;
  display: flex;
  align-items: center;
  height: auto;
  padding: 8px 10px;
  border-radius: var(--card-radius);
  border: 1px solid transparent;
  background: #ffffff;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.client-checkbox-item:hover {
  background: #fafbfc;
  border-color: #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* 选中状态（利用 Element Plus 的 is-checked） */
.client-checkbox-item.is-checked {
  background: #f0f4ff;
  border-color: #1e40af;
  box-shadow: 0 0 0 1px rgba(30, 64, 175, 0.2);
}

.client-checkbox-item :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #1e40af;
}

.client-checkbox-item :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #1e40af;
  border-color: #1e40af;
}

.client-checkbox-item :deep(.el-checkbox__inner) {
  border-radius: 4px;
  border-color: #d1d5db;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

/* ---------- 客户端条目内容 ---------- */
.client-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  width: 100%;
}

.client-hostname {
  font-weight: 500;
  color: #1e40af;
}

.client-detail {
  color: #6b7280;
  font-size: 0.8rem;
  word-break: break-word;
}

.client-note {
  display: inline-block;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.7rem;
  padding: 1px 10px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 空状态 ---------- */
.empty-tip {
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
  padding: 20px;
  margin: 0;
  letter-spacing: 0.02em;
}

/* ============================================================
   响应式 — 断点 768px
   ============================================================ */
@media (max-width: 768px) {
  .client-selector {
    padding: 8px 3px;
    border-radius: 8px;
  }

  .selector-header {
    /* flex-wrap: wrap; */
    gap: 4px 0;
  }

  .selector-summary {
    font-size: 0.8rem;
  }

  .selector-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .search-input {
    flex: 1 1 auto;
    min-width: unset;
  }

  .selector-actions {
    justify-content: flex-end;
  }

  .selector-actions .el-button {
    font-size: 0.75rem;
    padding: 4px 12px;
  }

  .client-checkbox-list {
    max-height: 260px;
  }

  .client-item {
    font-size: 0.8rem;
    gap: 4px 8px;
  }

  .client-hostname {
    font-size: 0.85rem;
  }

  .client-detail {
    font-size: 0.75rem;
  }

  .client-note {
    font-size: 0.65rem;
    padding: 0 8px;
    max-width: 120px;
  }

  .client-checkbox-item {
    padding: 6px 8px;
  }

  .empty-tip {
    font-size: 0.8rem;
    padding: 16px;
  }
}

/* ---------- 小屏手机微调（≤ 480px） ---------- */
@media (max-width: 480px) {
  .client-selector {
    padding: 6px 2px;
  }

  .selector-actions .el-button {
    font-size: 0.7rem;
    padding: 3px 10px;
  }

  .client-item {
    flex-direction: column;
    gap: 2px;
  }

  .client-note {
    max-width: 100%;
    white-space: normal;
  }
}
/* 响应式调整 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .card-body {
    padding: 12px 16px;
  }

  .card-header {
    padding: 16px 16px;
  }

  .toggle-item {
    /* flex-direction: column; */
    /* align-items: flex-start; */
    gap: 12px;
  }

  .switch {
    margin-left: 0;
    /* align-self: flex-start; */
  }

  .curfew-time-picker {
    flex-direction: column;
    align-items: flex-start;
  }

  .time-input {
    width: 100%;
  }

  .time-separator {
    margin-top: 0;
    margin: 4px 0;
  }

  .save-section {
    flex-direction: column;
    align-items: stretch;
  }

  .save-btn {
    width: 100%;
  }
}
</style>
