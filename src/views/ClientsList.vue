<template>
  <div class="client-list-container">
    <div class="page-header">
      <h1 class="page-title">客户端列表</h1>
      <div class="header-actions">
        <button class="refresh-btn" @click="fetchClients" :disabled="loading">
          <svg
            :class="{ spin: loading }"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 512 512"
            fill="currentColor"
          >
            <g transform="translate(512, 0) scale(-1, 1)">
              <path
                class="cls-1"
                d="M267.48,382.92a130,130,0,0,1-19-1.41L238,379.94,241.13,359l10.45,1.57A105.76,105.76,0,1,0,184,321.26l6.52,8.32-16.63,13-6.52-8.32a125.72,125.72,0,0,1-25.65-97.06C152,168,216.77,120.15,286,130.48a126.92,126.92,0,0,1-18.48,252.44Z"
              />
              <polygon
                class="cls-1"
                points="179.34 347.4 117.86 328.34 124.11 308.15 175.51 324.08 191.01 274.08 211.2 280.34 192.57 340.44 179.34 347.4"
              />
            </g>
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && clients.length === 0" class="loading-state">
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
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchClients">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="clients.length === 0" class="empty-state">
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
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="8" y1="10" x2="16" y2="10" />
      </svg>
      <p>暂无客户端数据</p>
    </div>

    <!-- 卡片列表 -->
    <div v-else class="cards-grid">
      <div v-for="client in clients" :key="client.uuid" class="client-card">
        <!-- 卡片头部：UUID 和 状态 -->
        <div class="card-header">
          <span class="uuid" :title="client.uuid">{{ truncateUuid(client.uuid) }}</span>
          <span class="status-badge" :class="isOnline(client.lastSeen) ? 'online' : 'offline'">
            <span class="status-dot"></span>
            {{ isOnline(client.lastSeen) ? '在线' : '离线' }}
          </span>
        </div>

        <!-- 卡片主体：备注、IP、主机名 -->
        <div class="card-body">
          <div class="info-row">
            <span class="info-label">备注</span>
            <span class="info-value">{{ client.note || '--' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">IP 地址</span>
            <span class="info-value">{{ client.ipAddress || '--' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">主机名</span>
            <span class="info-value">{{ client.hostname || '--' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">操作系统</span>
            <span class="info-value">{{ client.osInfo || '--' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">上次在线</span>
            <span class="info-value">{{ $filters.formatDateTime(client.lastSeen) || '--' }}</span>
          </div>
        </div>

        <!-- 卡片底部：查看详情按钮 -->
        <div class="card-footer">
          <button class="detail-btn" @click="viewDetail(client.uuid)">
            查看详情
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div style="height: 1px"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import Spinner from '@/components/Spinner.vue'

import { useClientStore } from '@/stores/clientStore'

// 模拟 API 调用 - 请在实际项目中替换为真实的 API 请求
const mockFetchClients = async () => {
  return await clientStore.fetchClients()
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       reject(new Error('获取客户端列表失败，请稍后重试'))
  //     }, 1600)
  //   })
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          uuid: '360bdcf7-6d9d-4a1b-8c2e-9f3a1b2c3d4e',
          ipAddress: '10.121.65.10',
          hostname: 'DESKTOP-5490FRS',
          osInfo: 'Windows 11 专业版',
          lastSeen: '2026-04-17 16:59:30',
          note: '',
          online: '在线',
        },
        {
          uuid: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
          note: '办公室',
          ipAddress: '10.121.65.22',
          hostname: 'TEACHER-PC',
          osInfo: 'Windows 10 教育版',
          lastSeen: '2026-04-17 14:22:15',
          note: '在线',
        },
        {
          uuid: '2f3e4d5c-6b7a-8c9d-0e1f-2a3b4c5d6e7f',
          note: '机房A-03',
          ipAddress: '10.121.66.45',
          hostname: 'LAB-A-03',
          osInfo: 'Ubuntu 22.04 LTS',
          lastSeen: '2026-04-16 09:15:42',
          note: '离线',
        },
        {
          uuid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          note: '图书馆查询机',
          ipAddress: '10.121.64.88',
          hostname: 'LIB-QUERY-01',
          osInfo: 'Windows 10 企业版 LTSC',
          lastSeen: '2026-04-17 11:03:20',
          note: '在线',
        },
        {
          uuid: 'f9e8d7c6-b5a4-3c2d-1e0f-9a8b7c6d5e4f',
          note: '行政楼',
          ipAddress: '10.121.63.120',
          hostname: 'ADMIN-PC-07',
          osInfo: 'macOS Ventura',
          lastSeen: '2026-04-15 18:30:00',
          note: '离线',
        },
      ])
    }, 1600)
  })
}

const router = useRouter()
const $filters = inject('$filters')
const clients = ref([])
const loading = ref(false)
const error = ref(null)
const clientStore = useClientStore()

// 截取 UUID 显示 (前8位 + ... + 后4位)
const truncateUuid = (uuid) => {
  if (!uuid || uuid.length < 16) return uuid
  return `${uuid.slice(0, 8)}...${uuid.slice(-4)}`
}

// 获取客户端列表
const fetchClients = async () => {
  loading.value = true
  error.value = null
  clients.value = []

  try {
    const data = await mockFetchClients()
    clients.value = data
    ElMessage.success('客户端列表刷新成功')
  } catch (err) {
    error.value = err.message || '获取客户端列表失败，请稍后重试'
    console.error('Failed to fetch clients:', err)
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 查看详情
const viewDetail = (uuid) => {
  // 跳转到详情页
  clientStore.setCurrentClient(uuid)
  router.push(`/dash/client`)
}
const isOnline = (lastSeen) => {
  if (!lastSeen) return false
  const diff = new Date().getTime() - new Date(lastSeen).getTime()
  return diff < 120000 // 2分钟内视为在线
}
onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.client-list-container {
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
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.refresh-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn svg.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

/* 卡片网格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin: 6px;
}

.client-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.client-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #d1d5db;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.uuid {
  font-family:
    'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: default;
  transition: all 0.2s ease;
}

.uuid:hover {
  background-color: #e5e7eb;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s ease;
}

.status-badge.online {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.offline {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.8;
}

.status-badge.online .status-dot {
  background-color: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.status-badge.offline .status-dot {
  background-color: #ef4444;
}

.card-body {
  flex: 1;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  color: #6b7280;
  font-weight: 400;
}

.info-value {
  color: #374151;
  font-weight: 500;
  word-break: break-word;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.detail-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
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

.detail-btn:hover {
  background-color: #1e3a8a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: scale(1.02);
}

.detail-btn svg {
  transition: transform 0.2s ease;
}

.detail-btn:hover svg {
  transform: translateX(3px);
}

/* 响应式 */
@media (max-width: 768px) {
  .client-list-container {
    padding: 16px;
  }

  .page-header {
    /* flex-direction: column; */
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .client-card {
    padding: 16px;
  }

  .info-label {
    width: 70px;
  }
}
</style>
