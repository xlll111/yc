<template>
  <div class="container">
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
        <span class="client-uuid">{{ truncatedUuid }}</span>
      </div>
    </div>

    <div class="card">
      <!-- 标题栏 -->
      <div class="card-header">
        <div class="title-section">
          <h2>U盘插入记录管理</h2>
        </div>
        <p class="subtitle">管理该客户端所有已插入U盘的使用权限，控制允许或拒绝访问</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载记录中...</span>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error-state">
        <svg
          class="error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
        <button class="retry-button" @click="fetchRecords">重试</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="records.length === 0" class="empty-state">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M2 10h20" />
        </svg>
        <p class="empty-text">暂无U盘插入记录</p>
        <p class="empty-hint">该客户端目前没有检测到任何U盘插入行为</p>
      </div>

      <!-- 数据列表（根据屏幕尺寸切换表格/卡片） -->
      <template v-else>
        <!-- 桌面端：表格视图 -->
        <div class="table-wrapper desktop-table">
          <table class="records-table">
            <thead>
              <tr>
                <th>磁盘名称</th>
                <th>USB ID</th>
                <th>插入时间</th>
                <th>当前状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in records" :key="record.id || record.usb_id">
                <td class="disk-name" :title="record.disk_name">
                  {{ record.disk_name || '未知磁盘' }}
                </td>
                <td class="usb-id">{{ record.usb_id }}</td>
                <td class="insert-time">{{ formatTime(record.insert_time) }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="record.status === 'allowed' ? 'status-allowed' : 'status-denied'"
                  >
                    <span class="status-dot"></span>
                    {{ record.status === 'allowed' ? '已允许' : '已拒绝' }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="record.status === 'denied'"
                    class="action-btn allow-btn"
                    @click="updatePermission(record, 'allowed')"
                    :disabled="updatingId === record.id"
                  >
                    <svg
                      class="btn-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {{ updatingId === record.id ? '处理中...' : '允许使用' }}
                  </button>
                  <button
                    v-else
                    class="action-btn deny-btn"
                    @click="updatePermission(record, 'denied')"
                    :disabled="updatingId === record.id"
                  >
                    <svg
                      class="btn-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    {{ updatingId === record.id ? '处理中...' : '拒绝使用' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 移动端：卡片列表视图 -->
        <div class="mobile-card-list">
          <div v-for="record in records" :key="record.id || record.usb_id" class="usb-card">
            <div class="card-top">
              <div class="card-info">
                <h3 class="card-disk-name">{{ record.disk_name || '未知磁盘' }}</h3>
                <span class="card-usb-id">{{ record.usb_id }}</span>
              </div>
              <span
                class="status-badge"
                :class="record.status === 'allowed' ? 'status-allowed' : 'status-denied'"
              >
                <span class="status-dot"></span>
                {{ record.status === 'allowed' ? '已允许' : '已拒绝' }}
              </span>
            </div>
            <div class="card-time">
              <svg
                class="time-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ formatTime(record.insert_time) }}</span>
            </div>
            <div class="card-actions">
              <button
                v-if="record.status === 'denied'"
                class="action-btn allow-btn mobile-full"
                @click="updatePermission(record, 'allowed')"
                :disabled="updatingId === record.id"
              >
                <svg
                  class="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {{ updatingId === record.id ? '处理中...' : '允许使用' }}
              </button>
              <button
                v-else
                class="action-btn deny-btn mobile-full"
                @click="updatePermission(record, 'denied')"
                :disabled="updatingId === record.id"
              >
                <svg
                  class="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {{ updatingId === record.id ? '处理中...' : '拒绝使用' }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 从路由参数获取客户端UUID
const clientUuid = ref(
  route.params.uuid || route.query.uuid || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
)

const truncatedUuid = computed(() => {
  if (!clientUuid.value) return ''
  if (clientUuid.value.length <= 12) return clientUuid.value
  return (
    clientUuid.value.substring(0, 8) +
    '...' +
    clientUuid.value.substring(clientUuid.value.length - 4)
  )
})

// 数据状态
const records = ref([])
const loading = ref(false)
const error = ref('')
const updatingId = ref(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return timeStr
  }
}

// 模拟API调用 ———— 实际项目中替换为真实接口
const api = {
  // 获取U盘插入记录
  async getUsbRecords(uuid) {
    console.log('获取客户端U盘记录:', uuid)
    await new Promise((resolve) => setTimeout(resolve, 600))
    return {
      code: 200,
      data: [
        {
          id: 1,
          disk_name: 'Kingston DataTraveler 3.0',
          usb_id: '0951:1666',
          insert_time: '2026-04-29T14:30:00Z',
          status: 'allowed',
        },
        {
          id: 2,
          disk_name: 'SanDisk Ultra USB 3.0',
          usb_id: '0781:5583',
          insert_time: '2026-04-28T09:15:00Z',
          status: 'denied',
        },
        {
          id: 3,
          disk_name: 'Samsung USB Drive',
          usb_id: '04e8:61b6',
          insert_time: '2026-04-27T16:45:00Z',
          status: 'allowed',
        },
      ],
    }
  },
  // 更新U盘权限
  async updateUsbPermission(uuid, usbId, status) {
    console.log('更新U盘权限:', uuid, usbId, status)
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { code: 200, message: 'success' }
  },
}

// 获取记录
const fetchRecords = async () => {
  if (!clientUuid.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await api.getUsbRecords(clientUuid.value)
    if (res.code === 200 && Array.isArray(res.data)) {
      records.value = res.data
    } else {
      records.value = []
      if (res.message) error.value = res.message
    }
  } catch (e) {
    console.error('获取U盘记录失败:', e)
    error.value = '获取记录失败，请检查网络连接或稍后重试'
    records.value = []
  } finally {
    loading.value = false
  }
}

// 更新权限
const updatePermission = async (record, newStatus) => {
  if (updatingId.value) return
  updatingId.value = record.id
  try {
    const res = await api.updateUsbPermission(clientUuid.value, record.usb_id, newStatus)
    if (res.code === 200) {
      const target = records.value.find((r) => r.id === record.id)
      if (target) {
        target.status = newStatus
      }
    } else {
      alert(res.message || '操作失败，请重试')
    }
  } catch (e) {
    console.error('更新权限失败:', e)
    alert('更新权限失败，请稍后重试')
  } finally {
    updatingId.value = null
  }
}

onMounted(() => {
  fetchRecords()
})

watch(clientUuid, (newVal) => {
  if (newVal) {
    fetchRecords()
  }
})
</script>

<style scoped>
/* 容器与卡片 */
.container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 头部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.back-button {
  display: inline-flex;
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
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-label {
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
  margin-bottom: 4px;
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

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 0.9rem;
}

.error-icon {
  width: 40px;
  height: 40px;
  color: #ef4444;
}

.retry-button {
  background: #1e40af;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 4px;
}

.retry-button:hover {
  background: #1e3a8a;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 24px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #d1d5db;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.empty-hint {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
}

/* 桌面端表格 */
.desktop-table {
  display: block;
}

.table-wrapper {
  overflow-x: auto;
  margin: 0 -8px;
  border-radius: 8px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  white-space: nowrap;
}

.records-table thead {
  background: #f9fafb;
}

.records-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 500;
  color: #6b7280;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e5e7eb;
}

.records-table td {
  padding: 14px 16px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.records-table tbody tr {
  transition: background-color 0.2s ease;
}

.records-table tbody tr:hover {
  background-color: #f9fafb;
}

.records-table tbody tr:last-child td {
  border-bottom: none;
}

.disk-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.usb-id {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 0.85rem;
  color: #4b5563;
}

.insert-time {
  color: #6b7280;
  font-size: 0.85rem;
}

/* 状态标记 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-allowed {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #d1fae5;
}

.status-denied {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fee2e2;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 操作按钮 */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.allow-btn {
  background: #ecfdf5;
  color: #059669;
  border-color: #d1fae5;
}

.allow-btn:hover:not(:disabled) {
  background: #d1fae5;
  box-shadow: 0 1px 3px rgba(5, 150, 105, 0.15);
}

.deny-btn {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fee2e2;
}

.deny-btn:hover:not(:disabled) {
  background: #fee2e2;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.12);
}

/* 移动端卡片列表 */
.mobile-card-list {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.usb-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.usb-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.card-disk-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-usb-id {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  color: #6b7280;
}

.card-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.time-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.mobile-full {
  flex: 1;
  justify-content: center;
  padding: 8px 16px;
  font-size: 0.85rem;
}

/* 响应式断点 768px */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  .card {
    padding: 20px;
    gap: 20px;
  }

  .header {
    align-items: stretch;
    gap: 12px;
    margin-bottom: 20px;
  }
  .title-section h2 {
    font-size: 1.4rem;
  }
}
@media (max-width: 1080px) {
  .client-info {
    justify-content: center;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  /* 移动端隐藏表格，显示卡片 */
  .desktop-table {
    display: none !important;
  }

  .mobile-card-list {
    display: flex;
  }

  /* 空状态、加载、错误在移动端的间距调整 */
  .loading-state,
  .error-state,
  .empty-state {
    padding: 36px 16px;
  }

  .empty-icon {
    width: 40px;
    height: 40px;
  }
}

/* 桌面端隐藏卡片列表 */
@media (min-width: 1081px) {
  .mobile-card-list {
    display: none !important;
  }
}
</style>
