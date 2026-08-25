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
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const $filters = inject('$filters')
const clients = ref([])
const loading = ref(false)
const error = ref(null)
const clientStore = useClientStore()
const userStore = useUserStore()

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
    const data = await clientStore.fetchClients()
    // 按 lastSeen 从新到旧排序
    const sortedData = [...data].sort((a, b) => {
      return new Date(b.lastSeen) - new Date(a.lastSeen)
    })
    clients.value = sortedData
    // console.log('Fetched clients:', sortedData)
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
  return Math.abs(diff) < 120000 // 2分钟内视为在线
}
onMounted(async () => {
  fetchClients()
})
</script>

<style lang="scss" scoped>
.client-list-container {
  @include container;
}

.page-header {
  @include flex-between;
  margin-bottom: $spacing-11;
}

.page-title {
  font-size: $font-size-9xl;
  font-weight: 500;
  color: $color-text-base;
  margin: 0;
  letter-spacing: -0.01em;
}

.refresh-btn {
  @include flex-center;
  gap: $spacing-4;
  padding: $spacing-5 $spacing-8;
  background: $color-bg-white;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  color: $color-text-base;
  font-size: $font-size-base;
  font-weight: 500;
  transition: all $transition-base;
  box-shadow: $shadow-card;

  &:hover:not(:disabled) {
    background: $color-bg-card;
    border-color: $color-border-dark;
    box-shadow: $shadow-btn-hover;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg.spin {
    animation: spin 1s linear infinite;
  }
}

.loading-state,
.error-state,
.empty-state {
  @include empty-state-base;
}

.error-state svg,
.empty-state svg {
  color: $color-text-tertiary;
  margin-bottom: $spacing-8;
}

.error-state p,
.empty-state p {
  margin: $spacing-4 0 $spacing-8;
  font-size: $font-size-2xl;
}

.retry-btn {
  @include btn-primary;
  padding: $spacing-5 $spacing-10;
  box-shadow: $shadow-card;

  &:hover {
    background: $color-primary-dark;
    box-shadow: $shadow-btn-hover;
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-10;
  margin: $spacing-3;
}

.client-card {
  @include card-bordered;
  padding: $spacing-10;
  @include flex-column;
  transition: all $transition-base;

  &:hover {
    box-shadow: $shadow-card-float;
    transform: translateY(-2px);
    border-color: $color-border-dark;
  }
}

.card-header {
  @include flex-between;
  margin-bottom: $spacing-8;
  padding-bottom: $spacing-6;
  border-bottom: 1px solid $color-border;
}

.uuid {
  @include font-family-mono;
  font-size: $font-size-base;
  color: $color-text-secondary;
  background: $color-bg-hover;
  padding: $spacing-2 $spacing-4;
  border-radius: $radius-sm;
  cursor: default;
  transition: all $transition-base;

  &:hover {
    background: $color-border;
  }
}

.status-badge {
  @include status-badge;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: $color-bg-hover;
  color: #4b5563;
  transition: all $transition-base;

  &.online {
    background: $color-success-bg;
    color: $color-success-text;

    .status-dot {
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }
  }

  &.offline {
    background: $color-danger-bg;
    color: $color-danger-text;

    .status-dot {
      background: #ef4444;
    }
  }
}

.status-dot {
  @include status-dot;
}

.card-body {
  flex: 1;
  margin-bottom: $spacing-10;
}

.info-row {
  display: flex;
  margin-bottom: $spacing-5;
  font-size: $font-size-base;
  line-height: 1.5;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  color: $color-text-secondary;
  font-weight: 400;
}

.info-value {
  color: $color-text-base;
  font-weight: 500;
  word-break: break-word;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-3;
}

.detail-btn {
  @include flex-center;
  gap: $spacing-4;
  padding: $spacing-5 $spacing-9;
  background: $color-primary;
  color: $color-text-white;
  border: none;
  border-radius: $radius-lg;
  font-size: $font-size-base;
  font-weight: 500;
  transition: all $transition-base;
  box-shadow: $shadow-card;

  &:hover {
    background: $color-primary-dark;
    box-shadow: $shadow-btn-hover;
    transform: scale(1.02);
  }

  svg {
    transition: transform $transition-base;
  }

  &:hover svg {
    transform: translateX(3px);
  }
}

@include mobile {
  .client-list-container {
    padding: $spacing-8;
  }

  .page-header {
    align-items: flex-start;
    gap: $spacing-6;
    margin-bottom: $spacing-10;
  }

  .page-title {
    font-size: $font-size-8xl;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: $spacing-8;
  }

  .client-card {
    padding: $spacing-8;
  }

  .info-label {
    width: 70px;
  }
}
</style>
