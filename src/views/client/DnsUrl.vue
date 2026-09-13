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
          <Spinner inline size="small" />
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
          <button
            class="screenshot-btn"
            @click="openScreenshotViewer('', selectedDate.toISOString())"
          >
            查询截图
          </button>
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
                    @click="openScreenshotViewer(record.url, record.time)"
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
    <div style="height: 1px"></div>

    <!-- 截图查看器模态框 (保持不变) -->
    <Teleport to="body">
      <div
        v-if="viewerVisible"
        class="modal-overlay"
        @click.self="closeViewer"
        @keydown.esc="closeViewer"
      >
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3>截图追溯</h3>
              <p class="modal-warning-info">{{ selectedAlert?.url }}</p>
              <p class="modal-time-diff">警告时间: {{ selectedAlert?.time }}</p>
            </div>
            <button class="modal-close-btn" @click="closeViewer">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="close-icon"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body" ref="screenshotContainer">
            <div v-if="screenshots.length === 0 && !loadingScreenshots" class="no-screenshots">
              <p>未找到相关截图</p>
            </div>
            <div
              v-for="(shot, index) in screenshots"
              :key="shot.id"
              class="screenshot-card"
              :class="{ 'best-match': shot.id === bestIndex }"
              :ref="(el) => setScreenshotRef(el, shot.id)"
              :data-screenshot-index="index"
            >
              <img
                :src="shot.url"
                :alt="shot.filename"
                :fetchpriority="index === 0 ? 'high' : 'auto'"
                width="1920"
                height="1080"
                loading="lazy"
                class="screenshot-img"
                @load="handleImageLoad(index)"
              />
              <div class="screenshot-info">
                <span class="shot-filename">{{ shot.filename }}</span>
                <span class="shot-time">{{ shot.time }}</span>
                <span
                  class="shot-diff"
                  :class="{ urgent: -5 < shot.diffMinutes && shot.diffMinutes < 5 }"
                >
                  {{ formatTimeDiff(shot.diffMinutes) }}
                </span>
              </div>
            </div>
            <div v-if="loadingScreenshots" class="loading-screenshots">加载截图中...</div>
          </div>
        </div>
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
// const UrlRecord = clientStore.currentDNSUrlRecord
const targetRef = ref(null)
const { displayUUID, bindElement } = useMiddleEllipsis(uuid)

const goBack = () => router.back()

// 状态管理
const selectedDate = ref(new Date())
const alertOnly = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = 99999
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
const bestIndex = ref(0)

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

    await clientStore.fetchDNSUrlRecords(selectedDate.value, page, pageSize)

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
const generateScreenshots = async (alertRecordTime) => {
  const alertTime = new Date(alertRecordTime)
  const shots = []
  const screenshotsRes = await clientStore.fetchScreenshots(alertTime)
  const screenshots = screenshotsRes?.screenshots || []
  let minDiffShot = null
  for (let i = 0; i < screenshots.length; i++) {
    const shot = screenshots[i]
    const shotTime = new Date(shot.time)
    const diffMinutes = (shotTime.getTime() - alertTime.getTime()) / 60000

    const shotObj = {
      id: `shot-${i}-${Date.now()}`,
      url: `https://class.xlll.dpdns.org${shot.url}`,
      filename: shot.filename,
      time: shot.time,
      diffMinutes: diffMinutes,
      timestamp: shot.timestamp,
    }

    shots.push(shotObj)
    if (!minDiffShot || Math.abs(diffMinutes) < Math.abs(minDiffShot.diffMinutes)) {
      minDiffShot = shotObj
    }
  }
  // 按与警告时间接近程度排序
  return {
    minDiffShot: minDiffShot,
    shots: shots.sort((a, b) => a.timestamp - b.timestamp),
  }
}

// 格式化时间差
const formatTimeDiff = (minutes) => {
  const negative = minutes < 0 ? '-' : ''
  minutes = Math.abs(minutes)
  if (minutes < 1) return '不到1分钟'
  if (minutes < 60) return `${negative} ${Math.floor(minutes * 100) / 100} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor((minutes % 60) * 100) / 100
  if (hours < 24) return `${negative} ${hours} 小时 ${mins > 0 ? mins + '分钟' : ''}`
  const days = Math.floor(hours / 24)
  return `${negative} ${days} 天 ${hours % 24} 小时`
}

// 打开截图查看器
const openScreenshotViewer = async (url, time) => {
  selectedAlert.value = {
    url: url,
    time: new Date(time).toLocaleString('zh-CN', { hour12: false }),
  }
  viewerVisible.value = true
  loadingScreenshots.value = true
  screenshots.value = []

  // 模拟异步加载截图
  const { minDiffShot, shots } = await generateScreenshots(time)
  loadingScreenshots.value = false
  screenshots.value = shots

  nextTick(() => {
    // 自动滚动到最佳匹配截图
    if (screenshotContainer.value && screenshots.value.length > 0) {
      bestIndex.value = minDiffShot.id
      const targetElement = screenshotRefs.value[bestIndex.value]
      setTimeout(() => {
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 50)
    }
  })
}

// 关闭查看器
const closeViewer = () => {
  viewerVisible.value = false
  selectedAlert.value = null
  screenshots.value = []
  bestIndex.value = 0
}

// 设置截图引用
const setScreenshotRef = (el, id) => {
  if (el) {
    screenshotRefs.value[id] = el
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
  fetchDnsUrlRecords(false)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
/* 提取的日历网格 Mixin (建议放入 scss) */
@mixin calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: $spacing-1;
}

/* 容器与卡片 */
.container {
  @include container; // 直接复用 container mixin
}

.content {
  @include container;
  border: 1px solid $color-danger; // 原 #ef4444 映射为 danger
  border-radius: $radius-md;
  background: $color-danger-hover-bg; // 原 #ffe5e5 映射为 danger hover bg
  box-shadow: $shadow-card;
  padding: $spacing-6 $spacing-8; // 12px 16px
  margin-bottom: $spacing-3; // 6px
  transition: all $transition-base;
}

.card {
  @include card-base;
  padding: $spacing-11; // 24px
  @include flex-column;
  gap: $spacing-10; // 20px
  max-height: calc(100vh - 140px);
  margin-bottom: 30px; // 无精确匹配变量，若需严格统一可改为 $spacing-12 (28px)

  &:hover {
    @include card-hover; // 复用 hover 阴影
  }
}

/* 头部导航 */
.header {
  @include flex-between;
  flex-wrap: nowrap;
  gap: $spacing-8; // 16px
  margin-bottom: $spacing-12; // 28px
}

.back-button {
  @include btn-text;
  min-width: max-content;
  color: $color-text-base;
  font-size: $font-size-xl; // 0.95rem
  padding: $spacing-4 $spacing-8; // 8px 16px

  &:hover {
    background-color: $color-bg-hover;
    color: $color-primary;
  }
}

.back-icon {
  width: 18px;
  height: 18px;
}

.client-info {
  background: $color-bg-white;
  max-width: 60vw;
  min-width: 30%;
  padding: $spacing-3 $spacing-8; // 6px 16px
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  box-shadow: $shadow-light;
  @include flex-center;
  gap: $spacing-4;
}

.client-label {
  min-width: max-content;
  font-size: $font-size-md; // 0.85rem
  font-weight: 500;
  color: $color-text-secondary;
}

.client-uuid {
  @include font-family-mono;
  font-size: $font-size-md;
  font-weight: 500;
  color: $color-primary;
  background: $color-primary-light;
  padding: $spacing-2 $spacing-4; // 4px 8px
  border-radius: $radius-lg;
}

/* 卡片头部 */
.card-header {
  margin-bottom: $spacing-4; // 8px
}

.title-section {
  @include flex-center;
  justify-content: normal;
  gap: $spacing-6; // 12px
  flex-wrap: wrap;
  margin-bottom: $spacing-4;

  h2 {
    font-size: $font-size-7xl; // 1.6rem
    font-weight: 600;
    color: $color-text-base;
    margin: 0;
    letter-spacing: -0.01em;
  }
}

.subtitle {
  color: $color-text-secondary;
  font-size: $font-size-md;
  margin: 0;
}

/* 工具栏 */
.toolbar {
  @include flex-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $spacing-8;
  padding-bottom: $spacing-8;
  border-bottom: 1px solid $color-border;
}

.filter-group {
  @include flex-column;
  gap: $spacing-4;
  flex: 1;
}

.filter-label {
  font-size: $font-size-sm; // 0.8rem
  font-weight: 500;
  color: $color-text-secondary;
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
  @include flex-between;
  margin-bottom: $spacing-8;
  padding: 0 $spacing-2;
}

.month-nav-btn {
  @include flex-center;
  width: $spacing-13; // 32px
  height: $spacing-13;
  border: none;
  border-radius: $radius-md;
  background: transparent;
  color: $color-text-base;
  transition: all $transition-base;

  &:hover {
    background: $color-bg-hover;
  }

  svg {
    width: 18px;
    height: 18px;
  }
}

.month-year {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $color-text-base;
  user-select: none;
}

.weekday-header {
  @include calendar-grid;
  margin-bottom: $spacing-4;
}

.weekday {
  text-align: center;
  font-size: $font-size-xs; // 0.75rem
  font-weight: 500;
  color: $color-text-tertiary;
  padding: $spacing-3 0;
  user-select: none;
}

.calendar-grid {
  @include calendar-grid;
  margin-bottom: $spacing-8;
}

.calendar-day {
  position: relative;
  @include flex-column-center; // 复用 flex-column-center
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: $radius-md;
  background: transparent;
  color: $color-text-base;
  font-size: $font-size-md;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast; // 0.15s

  &:hover:not(.disabled):not(.selected) {
    background: $color-bg-hover;
  }

  &.other-month {
    color: $color-border-dark;
  }

  &.today .day-number {
    color: $color-primary;
    font-weight: 700;
  }

  &.selected {
    background: $color-primary;
    color: $color-text-white;

    .day-number {
      color: $color-text-white;
    }

    &.today .day-number {
      color: $color-text-white;
    }

    .day-dot {
      background: $color-text-white;
    }
  }

  &.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.day-number {
  position: relative;
  z-index: 1;
  line-height: 1;
}

.day-dot {
  position: absolute;
  bottom: $spacing-2;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: $color-primary;
}

.picker-footer {
  display: flex;
  gap: $spacing-4;
  justify-content: flex-end;
  padding-top: $spacing-6;
  border-top: 1px solid $color-border-light;
}

.footer-btn {
  @include btn-secondary; // 替代原有的基础按钮样式
  padding: $spacing-3 $spacing-7; // 6px 14px
  font-size: $font-size-sm;

  &.primary {
    @include btn-primary;
  }
}

.actions-group {
  @include flex-center;
  gap: $spacing-6;
}

.toggle-switch {
  @include flex-center;
  gap: $spacing-4;
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  .toggle-slider {
    width: 36px;
    height: 20px;
    background: $color-border;
    border-radius: $radius-lg;
    position: relative;
    transition: background $transition-base;

    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      background: $color-text-white;
      border-radius: 50%;
      top: $spacing-1;
      left: $spacing-1;
      transition: transform $transition-base;
      box-shadow: $shadow-inset;
    }
  }

  input:checked + .toggle-slider {
    background: $color-primary;

    &::after {
      transform: translateX(16px);
    }
  }
}

.toggle-label {
  font-size: $font-size-md;
  font-weight: 500;
  color: $color-text-base;
}

/* 列表滚动区域 */
.list-scroll-area {
  flex: 1;
  @include custom-scrollbar(5px);
  overflow-y: auto;
  padding-right: $spacing-2;
  max-height: calc(100vh - 380px);
  min-height: 300px;
}

.empty-state {
  @include flex-column-center;
  gap: $spacing-8;
  padding: $spacing-15 $spacing-10; // 48px 20px
  color: $color-text-tertiary;
}

.empty-icon {
  width: 48px;
  height: 48px;
}

/* 小时分组 */
.hour-group {
  margin-bottom: $spacing-10;
}

.hour-header {
  @include flex-center;
  gap: $spacing-5; // 10px
  padding: $spacing-4 0;
  margin-bottom: $spacing-4;
  border-bottom: 1px dashed $color-border;
  position: sticky;
  top: 0;
  background: $color-bg-white;
  z-index: $z-sticky;
}

.hour-dot {
  width: $spacing-4;
  height: $spacing-4;
  background: $color-primary;
  border-radius: 50%;
  display: inline-block;
}

.hour-text {
  font-weight: 600;
  color: $color-text-base;
  font-size: $font-size-lg;
}

.hour-count {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: auto;
}

/* 记录项 */
.record-item {
  padding: $spacing-6 $spacing-8;
  border-radius: $radius-md;
  margin-bottom: $spacing-3;
  background: $color-bg-card;
  border-left: 3px solid transparent;
  transition: all $transition-base;

  &:hover {
    background: $color-bg-hover;
  }

  &.alert-item {
    background: $color-danger-hover-bg;
    border-left-color: $color-danger;
  }
}

.record-main {
  @include flex-between;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.record-details {
  @include flex-column;
  gap: $spacing-2;
  flex: 1;
  min-width: 0;
}

.record-url {
  font-weight: 500;
  color: $color-text-base;
  font-size: $font-size-lg;
  word-break: break-all;
  @include text-ellipsis;
}

.record-time {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.record-actions {
  flex-shrink: 0;
}

.screenshot-btn {
  @include btn-primary;
  padding: $spacing-3 $spacing-7; // 6px 14px
  font-size: $font-size-sm;

  &:hover {
    background: $color-primary-dark;
    box-shadow: 0 2px 6px $color-primary-alpha-25;
  }
}

.loading-indicator {
  text-align: center;
  padding: $spacing-8;
  color: $color-text-secondary;
  font-size: $font-size-md;
}

/* 模态框 */
.modal-overlay {
  @include modal-overlay;
}

.modal-content {
  @include modal-card;
}

.modal-header {
  @include flex-between;
  align-items: flex-start;
  padding: $spacing-10 $spacing-11;
  border-bottom: 1px solid $color-border;
}

.modal-title-group {
  h3 {
    margin: 0 0 $spacing-2 0;
    font-size: $font-size-5xl; // 1.3rem
    color: $color-text-base;
    font-weight: 600;
  }
}

.modal-warning-info {
  margin: 0;
  font-size: $font-size-md;
  color: $color-danger;
  word-break: break-all;
}

.modal-time-diff {
  margin: $spacing-2 0 0 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: $spacing-2;
  border-radius: $radius-lg;
  color: $color-text-secondary;
  transition: all $transition-base;

  &:hover {
    background: $color-bg-hover;
    color: $color-text-base;
  }
}

.close-icon {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: $spacing-10 $spacing-11;
  overflow-y: auto;
  max-height: 70vh;
}

.screenshot-card {
  border: 1px solid $color-border;
  margin-bottom: $spacing-10;
  border-radius: $radius-md;
  overflow: hidden;
  transition: all $transition-base;
  background: $color-bg-white;

  &.best-match {
    border-color: $color-primary;
    box-shadow: 0 0 0 2px $color-primary-alpha-20;
    background: $color-bg-light;
  }
}

.screenshot-img {
  width: 100%;
  height: auto;
  display: block;
  border-bottom: 1px solid $color-border;
}

.screenshot-info {
  @include flex-between;
  padding: $spacing-5 $spacing-7;
  gap: $spacing-6;
  flex-wrap: wrap;
  font-size: $font-size-sm;
}

.shot-filename {
  font-weight: 500;
  color: $color-text-base;
  word-break: break-all;
  flex: 1;
}

.shot-time {
  color: $color-text-secondary;
  white-space: nowrap;
}

.shot-diff {
  font-weight: 600;
  color: $color-primary;
  white-space: nowrap;

  &.urgent {
    color: $color-danger;
  }
}

.no-screenshots,
.loading-screenshots {
  text-align: center;
  padding: $spacing-14; // 40px
  color: $color-text-secondary;
}

/* 响应式 */
@include mobile {
  .container {
    padding: $container-padding-mobile;
  }

  .card {
    padding: $spacing-8;
    gap: $spacing-8;
    max-height: calc(100vh - 120px);
  }

  .header {
    align-items: stretch;
  }

  .client-info {
    justify-content: center;
  }

  .title-section h2 {
    font-size: $font-size-5xl;
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
    margin: $spacing-5;
  }

  .screenshot-info {
    flex-direction: column-reverse;
    gap: 3px; // 奇数像素无法精确映射变量，保留或统一定义 $spacing-half
    padding: $spacing-3 $spacing-5;
  }

  .list-scroll-area {
    max-height: calc(100vh - 440px);
  }
}
</style>
