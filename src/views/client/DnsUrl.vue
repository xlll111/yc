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
          <div class="date-filter">
            <span class="filter-label">日期筛选</span>
            <div class="modern-date-picker">
              <button class="date-nav-btn" @click="navigateDate(-1)" :disabled="isMinDate">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="nav-icon"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div class="date-display" @click="toggleDatePicker">
                <svg
                  class="calendar-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span class="date-text">{{ formattedSelectedDate }}</span>
                <svg
                  class="dropdown-icon"
                  :class="{ rotated: showDatePicker }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              <button class="date-nav-btn" @click="navigateDate(1)" :disabled="isMaxDate">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="nav-icon"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <!-- 日期选择器下拉面板 -->
            <Teleport to="body">
              <div v-if="showDatePicker" class="date-picker-overlay" @click="closeDatePicker">
                <div class="date-picker-panel" @click.stop>
                  <div class="picker-header">
                    <button class="month-nav-btn" @click="changeMonth(-1)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <span class="month-year">{{ currentMonthYear }}</span>
                    <button class="month-nav-btn" @click="changeMonth(1)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>

                  <div class="weekday-header">
                    <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
                  </div>

                  <div class="calendar-grid">
                    <button
                      v-for="(day, index) in calendarDays"
                      :key="index"
                      class="calendar-day"
                      :class="{
                        'other-month': !day.isCurrentMonth,
                        today: day.isToday,
                        selected: day.isSelected,
                        disabled: day.isDisabled,
                      }"
                      :disabled="day.isDisabled"
                      @click="selectCalendarDay(day)"
                    >
                      <span class="day-number">{{ day.date }}</span>
                      <span v-if="day.hasRecords" class="day-dot"></span>
                    </button>
                  </div>

                  <div class="picker-footer">
                    <button class="footer-btn" @click="selectToday">今天</button>
                    <button class="footer-btn" @click="selectYesterday">昨天</button>
                    <button class="footer-btn primary" @click="closeDatePicker">确定</button>
                  </div>
                </div>
              </div>
            </Teleport>
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
        <div v-if="groupedRecords.length === 0" class="empty-state">
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
              ref="recordRefs"
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
      </div>
    </div>

    <!-- 截图查看器模态框 -->
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
            <div v-if="screenshots.length === 0" class="no-screenshots">
              <p>未找到相关截图</p>
            </div>
            <div
              v-for="(shot, index) in screenshots"
              :key="shot.id"
              class="screenshot-card"
              :class="{ 'best-match': index === 0 }"
              :ref="(el) => setScreenshotRef(el, index)"
              :data-screenshot-index="index"
            >
              <img
                :src="shot.url"
                :alt="shot.filename"
                :fetchpriority="index === 0 ? 'high' : 'auto'"
                loading="lazy"
                class="screenshot-img"
                @load="handleImageLoad(index)"
              />
              <div class="screenshot-info">
                <span class="shot-filename">{{ shot.filename }}</span>
                <span class="shot-time">{{ shot.time }}</span>
                <span class="shot-diff" :class="{ urgent: shot.diffMinutes < 5 }">
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
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useMiddleEllipsis } from '@/composables/useMiddleEllipsis'

const router = useRouter()
const clientStore = useClientStore()
const $filters = inject('$filters')
const uuid = clientStore.getCurrentClientUUID
const targetRef = ref(null)
const { displayUUID, bindElement } = useMiddleEllipsis(uuid)

const goBack = () => router.back()

// 模拟客户端UUID
const truncatedUuid = ref('a1b2c3d4-...-e5f6')

// 状态管理
const records = ref([])
const allRecords = ref([]) // 原始所有记录
const selectedDate = ref('today')
const alertOnly = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = 50
const listContainer = ref(null)
const hasMore = ref(true)

// 截图查看器相关
const viewerVisible = ref(false)
const selectedAlert = ref(null)
const screenshots = ref([])
const loadingScreenshots = ref(false)
const screenshotContainer = ref(null)
const screenshotRefs = ref({})
const bestMatchIndex = ref(0)

// 生成模拟数据 (最近31天)
const generateMockData = () => {
  const data = []
  const now = new Date()
  const suspiciousDomains = [
    'malware-site.com',
    'phishing-login.net',
    'suspicious-download.xyz',
    'cmd-and-control.org',
  ]
  const normalDomains = [
    'google.com',
    'github.com',
    'stackoverflow.com',
    'vuejs.org',
    'api.example.com',
    'cdn.assets.net',
    'images.unsplash.com',
    'fonts.googleapis.com',
  ]

  for (let i = 0; i < 3500; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - Math.floor(Math.random() * 31))
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 60),
    )

    const isAlert = Math.random() < 0.15 // 15% 概率为告警
    const domain = isAlert
      ? suspiciousDomains[Math.floor(Math.random() * suspiciousDomains.length)]
      : normalDomains[Math.floor(Math.random() * normalDomains.length)]
    const path = isAlert
      ? '/payload?id=' + Math.random().toString(36).substring(2, 8)
      : '/path/' + Math.random().toString(36).substring(2, 6)

    data.push({
      id: `dns-${i}-${Date.now()}`,
      url: `https://${domain}${path}`,
      time: date.toISOString(),
      formattedTime: date.toLocaleString('zh-CN', { hour12: false }),
      isAlert,
      alertReason: isAlert ? '检测到可疑DNS请求' : null,
      timestamp: date.getTime(),
    })
  }
  return data.sort((a, b) => b.timestamp - a.timestamp)
}

// 筛选后的记录
const filteredRecords = computed(() => {
  let result = [...allRecords.value]

  // 日期筛选
  if (selectedDate.value !== 'today') {
    result = result.filter((r) => r.time.startsWith(selectedDate.value))
  } else {
    const todayStr = new Date().toISOString().split('T')[0]
    result = result.filter((r) => r.time.startsWith(todayStr))
  }

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

  // 保持键顺序 (按小时倒序，因为数据本身是时间倒序)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const hourA = parseInt(a)
    const hourB = parseInt(b)
    // 简化处理：由于记录已按时间倒序，我们保持分组顺序与数据出现顺序一致
    return 0
  })

  const orderedGroups = {}
  sortedKeys.forEach((key) => {
    orderedGroups[key] = groups[key]
  })
  return orderedGroups
})

// 格式化小时显示
const formatHour = (hourKey) => {
  const hour = parseInt(hourKey)
  return `${hourKey} - ${hour + 1}:00`
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
  if (!listContainer.value || loadingMore.value || !hasMore.value) return

  const { scrollTop, scrollHeight, clientHeight } = listContainer.value
  if (scrollHeight - scrollTop <= clientHeight + 50) {
    loadMore()
  }
}

const loadMore = () => {
  if (displayRecords.value.length >= filteredRecords.value.length) {
    hasMore.value = false
    return
  }

  loadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    loadingMore.value = false
    hasMore.value = displayRecords.value.length < filteredRecords.value.length
  }, 300)
}

// 模拟生成截图数据
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
// 日期选择器相关状态
const showDatePicker = ref(false)
const calendarDate = ref(new Date()) // 日历显示的月份
const tempSelectedDate = ref(null) // 临时选择的日期

// 星期标题
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

// 计算属性
const formattedSelectedDate = computed(() => {
  if (selectedDate.value === 'today') return '今天'
  if (selectedDate.value === 'yesterday') {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return `昨天 (${formatDateShort(yesterday)})`
  }
  return formatDateShort(new Date(selectedDate.value))
})

const isMinDate = computed(() => {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 30)
  if (selectedDate.value === 'today') return true
  const currentDate = new Date(selectedDate.value)
  currentDate.setHours(0, 0, 0, 0)
  minDate.setHours(0, 0, 0, 0)
  return currentDate <= minDate
})

const isMaxDate = computed(() => {
  if (selectedDate.value === 'today') return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentDate = new Date(selectedDate.value)
  currentDate.setHours(0, 0, 0, 0)
  return currentDate >= today
})

const currentMonthYear = computed(() => {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth() + 1
  return `${year}年 ${month}月`
})

// 计算日历天数
const calendarDays = computed(() => {
  const year = calendarDate.value.getFullYear()
  const month = calendarDate.value.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 31)
  minDate.setHours(0, 0, 0, 0)

  const maxDate = new Date()
  maxDate.setHours(23, 59, 59, 999)

  // 当月第一天
  const firstDay = new Date(year, month, 1)
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0)

  // 获取当月第一天是周几 (0=周日, 调整为 1=周一)
  let startDayOfWeek = firstDay.getDay()
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const days = []

  // 填充上月日期
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: tempSelectedDate.value
        ? date.toISOString().split('T')[0] === tempSelectedDate.value
        : selectedDate.value === 'today'
          ? date.getTime() === today.getTime()
          : selectedDate.value === date.toISOString().split('T')[0],
      isDisabled: date < minDate || date > maxDate,
      hasRecords: hasRecordsOnDate(date.toISOString().split('T')[0]),
    })
  }

  // 填充当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date: i,
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isSelected: tempSelectedDate.value
        ? date.toISOString().split('T')[0] === tempSelectedDate.value
        : selectedDate.value === 'today'
          ? date.getTime() === today.getTime()
          : selectedDate.value === date.toISOString().split('T')[0],
      isDisabled: date < minDate || date > maxDate,
      hasRecords: hasRecordsOnDate(date.toISOString().split('T')[0]),
    })
  }

  // 填充下月日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      isSelected: tempSelectedDate.value
        ? date.toISOString().split('T')[0] === tempSelectedDate.value
        : selectedDate.value === 'today'
          ? date.getTime() === today.getTime()
          : selectedDate.value === date.toISOString().split('T')[0],
      isDisabled: date < minDate || date > maxDate,
      hasRecords: hasRecordsOnDate(date.toISOString().split('T')[0]),
    })
  }

  return days
})

// 辅助函数
const formatDateShort = (date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// 检查某天是否有记录
const hasRecordsOnDate = (dateStr) => {
  return allRecords.value.some((r) => r.time.startsWith(dateStr))
}

// 日期选择器方法
const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value
  if (showDatePicker.value) {
    // 初始化临时选择日期和日历月份
    if (selectedDate.value === 'today') {
      tempSelectedDate.value = new Date().toISOString().split('T')[0]
      calendarDate.value = new Date()
    } else {
      tempSelectedDate.value = selectedDate.value
      calendarDate.value = new Date(selectedDate.value)
    }
  } else {
    tempSelectedDate.value = null
  }
}

const closeDatePicker = () => {
  if (tempSelectedDate.value) {
    selectedDate.value = tempSelectedDate.value
    currentPage.value = 1
    nextTick(() => {
      if (listContainer.value) listContainer.value.scrollTop = 0
    })
  }
  showDatePicker.value = false
  tempSelectedDate.value = null
}

const navigateDate = (direction) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 30)

  let targetDate
  if (selectedDate.value === 'today') {
    if (direction === -1) {
      targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() - 1)
    } else {
      console.log('不能往未来')
      return // 不能往未来
    }
  } else {
    const currentDate = new Date(selectedDate.value)
    targetDate = new Date(currentDate)
    targetDate.setDate(targetDate.getDate() + direction)
  }

  if (targetDate < minDate || targetDate > today) return

  const dateStr = targetDate.toISOString().split('T')[0]
  selectedDate.value = dateStr
  currentPage.value = 1
  nextTick(() => {
    if (listContainer.value) listContainer.value.scrollTop = 0
  })
}

const changeMonth = (direction) => {
  const newDate = new Date(calendarDate.value)
  newDate.setMonth(newDate.getMonth() + direction)

  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 31)
  const maxDate = new Date()

  if (newDate >= minDate && newDate <= maxDate) {
    calendarDate.value = newDate
  }
}

const selectCalendarDay = (day) => {
  if (day.isDisabled) return
  tempSelectedDate.value = day.fullDate
}

const selectToday = () => {
  tempSelectedDate.value = new Date().toISOString().split('T')[0]
  calendarDate.value = new Date()
}

const selectYesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  tempSelectedDate.value = yesterday.toISOString().split('T')[0]
  calendarDate.value = yesterday
}

// 点击外部关闭日期选择器
const handleClickOutside = (event) => {
  if (
    showDatePicker.value &&
    !event.target.closest('.date-picker-panel') &&
    !event.target.closest('.date-display')
  ) {
    closeDatePicker()
  }
}

// 初始化数据
onMounted(() => {
  allRecords.value = generateMockData()
  console.log(allRecords.value)
  records.value = allRecords.value
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})
onMounted(() => {
  bindElement(targetRef.value)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
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
/* 现代日期选择器 */
.modern-date-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.date-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-nav-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #1e40af;
  color: #1e40af;
}

.date-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  min-width: 160px;
  justify-content: center;
  transition: all 0.2s ease;
  user-select: none;
}

.date-display:hover {
  border-color: #1e40af;
  box-shadow: 0 1px 3px rgba(30, 64, 175, 0.1);
}

.calendar-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  flex-shrink: 0;
}

.date-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.dropdown-icon {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

/* 日期选择器面板 */
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-picker-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 20px;
  width: 320px;
  animation: slideUp 0.2s ease;
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
  .modern-date-picker {
    width: 100%;
  }

  .date-display {
    flex: 1;
    min-width: auto;
  }

  .date-picker-panel {
    width: 90vw;
    max-width: 320px;
    padding: 16px;
  }
}
</style>
