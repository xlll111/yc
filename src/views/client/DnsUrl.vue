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
        <span ref="targetRef" class="client-uuid">{{ displayUUID }}</span>
      </div>
    </div>
    <!-- 主卡片 -->
    <div class="card">
      <!-- 标题栏 -->
      <div class="card-header">
        <div class="title-section">
          <h2>DNS 访问记录监控与截图追溯</h2>
        </div>
        <p class="subtitle">监控设备DNS查询，安全告警追溯屏幕截图</p>
      </div>

      <!-- 筛选与工具栏 -->
      <div class="toolbar">
        <div class="filter-group">
          <div>
            <span class="filter-label">日期筛选</span>
            <DatePicker v-model="selectedDate" mode="single" @change="onDateChange" />
          </div>
        </div>
        <div class="actions-group">
          <label class="toggle-switch">
            <input type="checkbox" v-model="alertOnly" @change="filterAlerts" />
            <span class="toggle-slider"></span>
            <span class="toggle-label">仅显示告警</span>
          </label>
        </div>
      </div>

      <!-- 记录列表滚动区域 -->
      <div class="list-scroll-area" ref="listContainer" @scroll="handleScroll">
        <div v-if="loading && displayRecords.length === 0" class="empty-state">
          <Spinner />
          <p>加载中...</p>
        </div>
        <div v-else-if="displayRecords.length === 0" class="empty-state">
          <svg
            class="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <p>暂无相关DNS访问记录</p>
        </div>
        <template v-else>
          <div v-for="(group, hour) in groupedRecords" :key="hour" class="hour-group">
            <div class="hour-header">
              <span class="hour-dot"></span>
              <span class="hour-text">{{ formatHour(hour) }}</span>
              <span class="hour-count">{{ group.length }} 条记录</span>
            </div>
            <div
              v-for="record in group"
              :key="record.id"
              class="record-item"
              :class="{ 'alert-item': record.isAlert }"
            >
              <div class="record-main">
                <div class="record-details">
                  <span class="record-url" :title="record.url">{{ record.url }}</span>
                  <span class="record-time">{{ record.formattedTime }}</span>
                </div>
                <div class="record-actions">
                  <button
                    v-if="record.isAlert"
                    class="screenshot-btn"
                    @click="openScreenshotViewer(record)"
                  >
                    查询截图
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-if="loadingMore" class="loading-indicator">加载更多记录...</div>
        <div v-if="!hasMore && displayRecords.length > 0" class="loading-indicator">
          已加载全部记录
        </div>
      </div>
    </div>

    <!-- 截图查看器模态框 (保持不变) -->
    <Teleport to="body">
      <div
        v-if="viewerVisible"
        class="modal-overlay"
        @click.self="closeViewer"
        @keydown.esc="closeViewer"
      >
        <!-- ... 模态框内容保持不变 ... -->
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useMiddleEllipsis } from '@/composables/useMiddleEllipsis'
import DatePicker from '@/components/DatePicker.vue'

const router = useRouter()
const clientStore = useClientStore()
const $filters = inject('$filters')
const uuid = clientStore.getCurrentClientUUID
const UrlRecord = clientStore.currentDNSUrlRecord
const targetRef = ref(null)
const { displayUUID, bindElement } = useMiddleEllipsis(uuid)

const goBack = () => router.back()

// 状态管理
const selectedDate = ref(new Date())
const alertOnly = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = 150
const listContainer = ref(null)
const hasMore = ref(true)
const fetchError = ref(null)

// 截图查看器相关
const viewerVisible = ref(false)
const selectedAlert = ref(null)
const screenshots = ref([])
const loadingScreenshots = ref(false)
const screenshotContainer = ref(null)
const screenshotRefs = ref({})

// 从 store 获取 DNS 记录
const storeRecords = computed(() => clientStore.getCurrentDNSUrlRecords || {})

// 将 store 中的记录转换为组件使用的格式
const allRecords = computed(() => {
  const records = storeRecords.value
  if (!records || typeof records !== 'object') return []

  const result = []
  // 遍历所有日期的记录
  Object.values(records).forEach((dayRecords) => {
    if (Array.isArray(dayRecords)) {
      dayRecords.forEach((record) => {
        // 过滤掉错误记录
        if (record.id === -1) return

        result.push({
          id: record.id,
          url: record.url,
          time: record.time,
          formattedTime: new Date(record.time).toLocaleString('zh-CN', { hour12: false }),
          isAlert: record.detection === true,
          alertReason: record.detection ? '检测到可疑DNS请求' : null,
          timestamp: new Date(record.time).getTime(),
        })
      })
    }
  })

  // 按时间倒序排列
  return result.sort((a, b) => b.timestamp - a.timestamp)
})

// 按日期筛选后的记录
const filteredRecords = computed(() => {
  let result = [...allRecords.value]

  // 日期筛选 - 只显示选中日期的记录
  const todayStr = selectedDate.value.toLocaleDateString('en-CA')
  result = result.filter((r) => {
    const recordDate = new Date(r.time).toLocaleDateString('en-CA')
    return recordDate === todayStr
  })

  // 告警过滤
  if (alertOnly.value) {
    result = result.filter((r) => r.isAlert)
  }

  return result
})

// 当前显示的记录 (分页)
const displayRecords = computed(() => {
  return filteredRecords.value.slice(0, currentPage.value * pageSize)
})

// 按小时分组
const groupedRecords = computed(() => {
  const groups = {}
  displayRecords.value.forEach((record) => {
    const hour = new Date(record.time).getHours()
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    if (!groups[hourKey]) groups[hourKey] = []
    groups[hourKey].push(record)
  })
  return groups
})

// 格式化小时显示
const formatHour = (hourKey) => {
  const hour = parseInt(hourKey)
  return `${hourKey} - ${hour + 1}:00`
}

// 获取 DNS 记录
const fetchDnsUrlRecords = async (isLoadMore = false) => {
  if (!selectedDate.value) return

  if (!isLoadMore) {
    loading.value = true
    currentPage.value = 1
    hasMore.value = true
    fetchError.value = null
  }

  try {
    const page = isLoadMore ? currentPage.value + 1 : 1

    const pageSize1 = alertOnly.value ? 99999 : pageSize

    await clientStore.fetchDNSUrlRecords(selectedDate.value, page, pageSize1)

    if (isLoadMore) {
      currentPage.value++
    }

    // 检查是否还有更多数据
    // 如果返回的记录数少于 pageSize，说明没有更多数据了
    const dayKey = selectedDate.value.toLocaleDateString('en-CA')
    const dayRecords = storeRecords.value[dayKey]
    if (dayRecords && Array.isArray(dayRecords)) {
      // 计算当前日期的总记录数
      const totalRecordsForDay = allRecords.value.filter((r) => {
        return new Date(r.time).toLocaleDateString('en-CA') === dayKey
      }).length
      console.log('totalRecordsForDay:', totalRecordsForDay, currentPage.value, pageSize) // 添加日志

      hasMore.value = totalRecordsForDay >= currentPage.value * pageSize
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('获取DNS记录失败:', error)
    fetchError.value = error
    ElMessage.error('获取DNS记录失败，请稍后重试')
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 日期变更处理
const onDateChange = () => {
  currentPage.value = 1
  hasMore.value = true
  fetchDnsUrlRecords(false)
}

// 告警过滤切换
const filterAlerts = () => {
  currentPage.value = 1
  nextTick(() => {
    if (listContainer.value) listContainer.value.scrollTop = 0
  })
}

// 滚动加载更多
const handleScroll = () => {
  if (!listContainer.value || loadingMore.value || !hasMore.value || loading.value) return

  const { scrollTop, scrollHeight, clientHeight } = listContainer.value
  if (scrollHeight - scrollTop <= clientHeight + 50) {
    loadMore()
  }
}

const loadMore = async () => {
  // if (displayRecords.value.length >= filteredRecords.value.length) {
  //   hasMore.value = false
  //   return
  // }

  loadingMore.value = true
  await fetchDnsUrlRecords(true)
  loadingMore.value = false
}

// 模拟生成截图数据 (保持不变)
const generateScreenshots = (alertRecord) => {
  const alertTime = new Date(alertRecord.time)
  const shots = []

  // 生成前后30分钟内的5-8张截图
  const count = 5 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    const offsetMinutes = Math.random() * 60 - 30 // -30 到 +30 分钟
    const shotTime = new Date(alertTime.getTime() + offsetMinutes * 60000)
    const diffMinutes = Math.abs(offsetMinutes)

    shots.push({
      id: `shot-${i}-${Date.now()}`,
      url: `https://picsum.photos/800/450?random=${Math.random()}`,
      filename: `screenshot_${shotTime.toISOString().replace(/:/g, '-').split('.')[0]}.png`,
      time: shotTime.toLocaleString('zh-CN', { hour12: false }),
      diffMinutes: Math.round(diffMinutes),
      timestamp: shotTime.getTime(),
    })
  }

  // 按与警告时间接近程度排序
  return shots.sort((a, b) => a.diffMinutes - b.diffMinutes)
}

// 格式化时间差
const formatTimeDiff = (minutes) => {
  if (minutes < 1) return '不到1分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours < 24) return `${hours} 小时 ${mins > 0 ? mins + '分钟' : ''}`
  const days = Math.floor(hours / 24)
  return `${days} 天 ${hours % 24} 小时`
}

// 打开截图查看器
const openScreenshotViewer = (record) => {
  selectedAlert.value = record
  viewerVisible.value = true
  loadingScreenshots.value = true
  screenshots.value = []

  // 模拟异步加载截图
  setTimeout(() => {
    screenshots.value = generateScreenshots(record)
    loadingScreenshots.value = false

    nextTick(() => {
      // 自动滚动到最佳匹配截图 (第一张)
      if (screenshotContainer.value && screenshots.value.length > 0) {
        const firstCard = screenshotContainer.value.querySelector('[data-screenshot-index="0"]')
        if (firstCard) {
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })
  }, 600)
}

// 关闭查看器
const closeViewer = () => {
  viewerVisible.value = false
  selectedAlert.value = null
  screenshots.value = []
}

// 设置截图引用
const setScreenshotRef = (el, index) => {
  if (el) {
    screenshotRefs.value[index] = el
  }
}

const handleImageLoad = (index) => {
  // 图片加载完成后的处理
}

// 键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Escape' && viewerVisible.value) {
    closeViewer()
  }
}

// 监听 UUID 变化，重新获取数据
watch(
  () => clientStore.getCurrentClientUUID,
  (newUuid) => {
    if (newUuid) {
      fetchDnsUrlRecords(false)
    }
  },
)

// 初始化
onMounted(() => {
  bindElement(targetRef.value)
  window.addEventListener('keydown', handleKeydown)

  // 初始加载数据
  if (clientStore.getCurrentClientUUID) {
    fetchDnsUrlRecords(false)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
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
.content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  border: #ef4444 1px solid;
  border-radius: 8px;
  background: #ffe5e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s ease;
}
.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: box-shadow 0.2s ease;
  max-height: calc(100vh - 140px);
}

.card:hover {
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
  margin-bottom: 8px;
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

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}

.month-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.month-nav-btn:hover {
  background: #f3f4f6;
}

.month-nav-btn svg {
  width: 18px;
  height: 18px;
}

.month-year {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  user-select: none;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  padding: 6px 0;
  user-select: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 16px;
}

.calendar-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.calendar-day:hover:not(.disabled):not(.selected) {
  background: #f3f4f6;
}

.calendar-day.other-month {
  color: #d1d5db;
}

.calendar-day.today .day-number {
  color: #1e40af;
  font-weight: 700;
}

.calendar-day.selected {
  background: #1e40af;
  color: white;
}

.calendar-day.selected .day-number {
  color: white;
}

.calendar-day.selected.today .day-number {
  color: white;
}

.calendar-day.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.day-number {
  position: relative;
  z-index: 1;
  line-height: 1;
}

.day-dot {
  position: absolute;
  bottom: 4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1e40af;
}

.calendar-day.selected .day-dot {
  background: white;
}

.picker-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.footer-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: white;
  color: #374151;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.footer-btn.primary {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.footer-btn.primary:hover {
  background: #1e3a8a;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 36px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 9999px;
  position: relative;
  transition: background 0.2s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
  background: #1e40af;
}

input:checked + .toggle-slider::after {
  transform: translateX(16px);
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

/* 列表滚动区域 */
.list-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  max-height: calc(100vh - 380px);
  min-height: 300px;
}

.list-scroll-area::-webkit-scrollbar {
  width: 5px;
}

.list-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.list-scroll-area::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 9999px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

/* 小时分组 */
.hour-group {
  margin-bottom: 20px;
}

.hour-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px dashed #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 2;
}

.hour-dot {
  width: 8px;
  height: 8px;
  background: #1e40af;
  border-radius: 50%;
  display: inline-block;
}

.hour-text {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.hour-count {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: auto;
}

/* 记录项 */
.record-item {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: #f9fafb;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.record-item:hover {
  background: #f3f4f6;
}

.record-item.alert-item {
  background: #ffe5e5;
  border-left-color: #ef4444;
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.record-url {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.record-actions {
  flex-shrink: 0;
}

.screenshot-btn {
  background: #1e40af;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.screenshot-btn:hover {
  background: #1e3a8a;
  box-shadow: 0 2px 6px rgba(30, 64, 175, 0.3);
}

.loading-indicator {
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 0.85rem;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title-group h3 {
  margin: 0 0 4px 0;
  font-size: 1.3rem;
  color: #374151;
  font-weight: 600;
}

.modal-warning-info {
  margin: 0;
  font-size: 0.85rem;
  color: #ef4444;
  word-break: break-all;
}

.modal-time-diff {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 9999px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
}

.screenshot-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  background: white;
}

.screenshot-card.best-match {
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
  background: #f8fafc;
}

.screenshot-img {
  width: 100%;
  height: auto;
  display: block;
  border-bottom: 1px solid #e5e7eb;
}

.screenshot-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.shot-filename {
  font-weight: 500;
  color: #374151;
  word-break: break-all;
  flex: 1;
}

.shot-time {
  color: #6b7280;
  white-space: nowrap;
}

.shot-diff {
  font-weight: 600;
  color: #1e40af;
  white-space: nowrap;
}

.shot-diff.urgent {
  color: #ef4444;
}

.no-screenshots,
.loading-screenshots {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .card {
    padding: 16px;
    gap: 16px;
    max-height: calc(100vh - 120px);
  }

  .header {
    align-items: stretch;
  }

  .client-info {
    justify-content: center;
  }

  .title-section h2 {
    font-size: 1.3rem;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-group {
    justify-content: flex-end;
  }

  .record-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .record-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .modal-content {
    max-height: 95vh;
    margin: 10px;
  }

  .list-scroll-area {
    max-height: calc(100vh - 440px);
  }
}
</style>
