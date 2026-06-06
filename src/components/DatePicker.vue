<template>
  <div class="date-picker-wrapper" ref="wrapperRef">
    <!-- 触发器：展示当前选中日期范围 -->
    <div
      class="date-picker-trigger"
      ref="triggerRef"
      @click="toggleOpen"
      :class="{ 'is-open': isOpen }"
    >
      <svg
        class="trigger-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span class="trigger-text">{{ displayText }}</span>
      <svg
        class="trigger-arrow"
        :class="{ rotated: isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>

    <!-- 下拉面板 -->
    <transition name="picker-fade">
      <div
        v-if="isOpen"
        class="date-picker-panel"
        ref="panelRef"
        :class="panelPositionClass"
        :style="panelStyle"
      >
        <!-- 快捷操作按钮区域 -->
        <div
          v-if="showToday || showYesterday || showLastThreeDays || showThisWeek || showThisMonth"
          class="quick-actions"
        >
          <button
            v-if="showYesterday && mode === 'single'"
            class="quick-btn"
            @click="selectQuick('yesterday')"
          >
            昨天
          </button>
          <button
            v-if="showToday && mode === 'single'"
            class="quick-btn"
            @click="selectQuick('today')"
          >
            今天
          </button>
          <button
            v-if="showLastThreeDays && mode === 'range'"
            class="quick-btn"
            @click="selectQuick('lastThreeDays')"
          >
            最近三天
          </button>
          <button
            v-if="showThisWeek && mode === 'range'"
            class="quick-btn"
            @click="selectQuick('thisWeek')"
          >
            本周
          </button>
          <button
            v-if="showThisMonth && mode === 'range'"
            class="quick-btn"
            @click="selectQuick('thisMonth')"
          >
            本月
          </button>
        </div>

        <!-- 双月日历视图（连续模式）或单月视图（单日模式） -->
        <div class="calendars-container" :class="mode === 'range' ? 'dual' : 'single'">
          <!-- 左日历 / 单日历 -->
          <div class="calendar">
            <div class="calendar-header">
              <button
                class="nav-btn"
                @click="prevMonth"
                :disabled="mode === 'single' && canNotPrevMonth"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span class="month-year">{{ leftMonthYear }}</span>
              <button v-if="mode === 'single'" class="nav-btn" @click="nextMonth">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <!-- 单日模式下右箭头放在右侧日历上，此处占位 -->
              <span v-if="mode === 'range'" class="nav-btn-placeholder"></span>
            </div>
            <div class="weekdays">
              <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
            </div>
            <div class="days-grid">
              <div
                v-for="(day, index) in leftMonthDays"
                :key="'l-' + index"
                class="day-cell"
                :class="getDayClass(day, 'left')"
                @click="handleDayClick(day, 'left')"
              >
                <span v-if="day" class="day-number">{{ day.day }}</span>
              </div>
            </div>
          </div>

          <!-- 右日历（仅连续模式） -->
          <div v-if="mode === 'range'" class="calendar">
            <div class="calendar-header">
              <span v-if="mode === 'range'" class="nav-btn-placeholder"></span>
              <span class="month-year">{{ rightMonthYear }}</span>
              <button class="nav-btn" @click="nextMonth">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div class="weekdays">
              <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
            </div>
            <div class="days-grid">
              <div
                v-for="(day, index) in rightMonthDays"
                :key="'r-' + index"
                class="day-cell"
                :class="getDayClass(day, 'right')"
                @click="handleDayClick(day, 'right')"
              >
                <span v-if="day" class="day-number">{{ day.day }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="panel-footer">
          <button class="footer-btn clear-btn" @click="clearSelection">清除</button>
          <button class="footer-btn confirm-btn" @click="confirmSelection">确定</button>
        </div>
      </div>
    </transition>

    <!-- 点击遮罩关闭 -->
    <div v-if="isOpen" class="picker-backdrop" @click="toggleOpen"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject, nextTick } from 'vue'
const $filters = inject('$filters')
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const props = defineProps({
  // 外部传入的日期变量，单日模式为 Date 或 字符串，连续模式为数组 [start, end] 或 null
  modelValue: {
    type: [Date, String, Array],
    default: null,
  },
  // 选择模式: 'single' 单日, 'range' 连续
  mode: {
    type: String,
    default: 'single',
    validator: (v) => ['single', 'range'].includes(v),
  },
  // 快捷按钮显隐控制
  showToday: {
    type: Boolean,
    default: true,
  },
  showYesterday: {
    type: Boolean,
    default: true,
  },
  showLastThreeDays: {
    type: Boolean,
    default: true,
  },
  showThisWeek: {
    type: Boolean,
    default: false,
  },
  showThisMonth: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'confirm'])

// 内部状态
const isOpen = ref(false)
const tempStartDate = ref(null) // 临时起始日期
const tempEndDate = ref(null) // 临时结束日期（连续模式）
const currentLeftMonth = ref(new Date()) // 左日历当前显示月份
const currentRightMonth = ref(new Date()) // 右日历当前显示月份（连续模式）
const isMobile = ref(false)

// 检测是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 添加模板引用
const wrapperRef = ref(null)
const triggerRef = ref(null)
const panelRef = ref(null)

// 初始化内部临时值
const initTempFromProps = () => {
  if (props.mode === 'single') {
    const val = props.modelValue
    if (val instanceof Date) {
      tempStartDate.value = new Date(val)
    } else if (typeof val === 'string' && val) {
      const d = new Date(val)
      tempStartDate.value = isNaN(d.getTime()) ? null : d
    } else {
      tempStartDate.value = null
    }
  } else {
    const arr = props.modelValue
    if (Array.isArray(arr) && arr.length === 2) {
      const s = arr[0] instanceof Date ? new Date(arr[0]) : new Date(arr[0])
      const e = arr[1] instanceof Date ? new Date(arr[1]) : new Date(arr[1])
      tempStartDate.value = isNaN(s.getTime()) ? null : s
      tempEndDate.value = isNaN(e.getTime()) ? null : e
    } else {
      tempStartDate.value = null
      tempEndDate.value = null
    }
  }
}

watch(
  () => props.modelValue,
  () => {
    initTempFromProps()
  },
  { immediate: true },
)

// 显示文本
const displayText = computed(() => {
  if (props.mode === 'single') {
    return tempStartDate.value
      ? $filters.formatDateTime(tempStartDate.value, 'YYYY-MM-DD')
      : '请选择日期'
  } else {
    if (tempStartDate.value && tempEndDate.value) {
      return `${$filters.formatDateTime(tempStartDate.value, 'YYYY-MM-DD')} 至 ${$filters.formatDateTime(tempEndDate.value, 'YYYY-MM-DD')}`
    } else if (tempStartDate.value) {
      return `${$filters.formatDateTime(tempStartDate.value, 'YYYY-MM-DD')} 至 ?`
    }
    return '请选择日期范围'
  }
})

const leftMonthYear = computed(() => {
  return $filters.formatDateTime(currentLeftMonth.value, 'YYYY年 MM月')
})
const rightMonthYear = computed(() => {
  const d = new Date(currentRightMonth.value)
  return $filters.formatDateTime(d, 'YYYY年 MM月')
})

// 左日历日期网格
const leftMonthDays = computed(() => {
  return generateMonthDays(currentLeftMonth.value)
})

// 右日历日期网格
const rightMonthDays = computed(() => {
  if (props.mode !== 'range') return []
  return generateMonthDays(currentRightMonth.value)
})

// 单日模式下是否禁止左箭头（不允许选择过去？此处不强制，仅控制月份导航可自由移动，但通常我们会限制一些逻辑。这里不做过多限制，仅做基础展示，保持导航可用。）
const canNotPrevMonth = computed(() => {
  return false // 可根据需求扩展
})

// 生成某个月的日期网格（包含前后填充）
const generateMonthDays = (baseDate) => {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  // 填充上月末尾
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  // 本月日期
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      date: new Date(year, month, d),
      isCurrentMonth: true,
    })
  }
  // 填充下月开头至填满网格
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) {
      days.push(null)
    }
  }
  return days
}

const getDayClass = (day, calendarSide) => {
  if (!day || !day.isCurrentMonth) return 'other-month'
  const date = day.date
  const classes = []

  if (props.mode === 'single') {
    if (tempStartDate.value && isSameDay(date, tempStartDate.value)) {
      classes.push('selected-single')
    }
  } else {
    const start = tempStartDate.value
    const end = tempEndDate.value

    if (start && isSameDay(date, start)) classes.push('range-start')
    if (end && isSameDay(date, end)) classes.push('range-end')

    if (start && end && date > start && date < end) {
      classes.push('in-range')
    }

    // 如果只选了开始，没有结束，并且日期大于开始，标记为临时范围预览
    if (start && !end && date > start) {
      classes.push('in-range-preview')
    }
  }

  if (isToday(date)) classes.push('is-today')

  return classes
}

const handleDayClick = (day, calendarSide) => {
  if (!day || !day.isCurrentMonth) return
  const clickedDate = new Date(day.date)

  if (props.mode === 'single') {
    tempStartDate.value = clickedDate
  } else {
    // 连续模式逻辑：如果没有开始，或者已经完成了一次选择（有开始和结束），重新开始
    if (!tempStartDate.value || (tempStartDate.value && tempEndDate.value)) {
      tempStartDate.value = clickedDate
      tempEndDate.value = null
    } else {
      // 已有开始日期，选择结束日期
      if (clickedDate < tempStartDate.value) {
        // 如果点击日期早于开始日期，则交换
        tempEndDate.value = new Date(tempStartDate.value)
        tempStartDate.value = clickedDate
      } else {
        tempEndDate.value = clickedDate
      }
    }
  }
}

const selectQuick = (type) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (props.mode === 'single') {
    if (type === 'today') {
      tempStartDate.value = today
    } else if (type === 'yesterday') {
      tempStartDate.value = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    } else if (type === 'lastThreeDays') {
      tempStartDate.value = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
    } else if (type === 'thisWeek') {
      const dayOfWeek = today.getDay()
      const monday = new Date(
        today.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000,
      )
      tempStartDate.value = monday
    } else if (type === 'thisMonth') {
      tempStartDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
    }
  } else {
    // 连续模式
    if (type === 'today') {
      tempStartDate.value = today
      tempEndDate.value = today
    } else if (type === 'lastThreeDays') {
      tempStartDate.value = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      tempEndDate.value = today
    } else if (type === 'thisWeek') {
      const dayOfWeek = today.getDay()
      const monday = new Date(
        today.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000,
      )
      tempStartDate.value = monday
      tempEndDate.value = today
    } else if (type === 'thisMonth') {
      tempStartDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
      tempEndDate.value = today
    }
  }
  // 将左日历导航到包含开始日期的月份
  if (tempStartDate.value) {
    currentLeftMonth.value = new Date(tempStartDate.value)
    if (props.mode === 'range') {
      currentRightMonth.value = new Date(
        currentLeftMonth.value.getFullYear(),
        currentLeftMonth.value.getMonth() + 1,
        1,
      )
    }
  }
}

const clearSelection = () => {
  tempStartDate.value = null
  tempEndDate.value = null
}

const confirmSelection = () => {
  if (props.mode === 'single') {
    if (!tempStartDate.value) {
      ElMessage.warning('请选择日期')
      return
    }
    emit('update:modelValue', tempStartDate.value)
    emit('change', tempStartDate.value)
    emit('confirm', tempStartDate.value)
  } else {
    if (!tempStartDate.value || !tempEndDate.value) {
      ElMessage.warning('请选择日期范围')
      return
    }
    const range = [tempStartDate.value, tempEndDate.value]
    emit('update:modelValue', range)
    emit('change', range)
    emit('confirm', range)
  }
  isOpen.value = false
}

// 添加新的响应式变量
const panelPositionClass = ref('panel-bottom-left')
const panelStyle = ref({})

// 计算面板位置
const calculatePanelPosition = () => {
  if (!isOpen.value) return

  const trigger = triggerRef.value
  const panel = panelRef.value

  if (!trigger || !panel) return

  const triggerRect = trigger.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  // console.log('panelRect:', panelRect)
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (viewportWidth <= 768) {
    panelStyle.value = {}
    return
  }

  // 计算水平方向
  let left = triggerRect.left
  let right = null

  if (left + panelRect.width > viewportWidth) {
    // 右边空间不足，向右对齐
    right = viewportWidth - triggerRect.right - 6
    panelPositionClass.value = 'panel-bottom-right'
  } else {
    panelPositionClass.value = 'panel-bottom-left'
  }

  // 计算垂直方向
  let top = triggerRect.bottom + 6
  let bottom = null

  if (top + panelRect.height > viewportHeight) {
    // 下方空间不足，向上弹出
    bottom = viewportHeight - top
    panelPositionClass.value += ' panel-top'
  }
  panelStyle.value = {
    right: left + panelRect.width > viewportWidth ? `-${right}px` : 'auto',
    bottom: top + panelRect.height > viewportHeight ? `-${bottom}px` : 'auto',
  }
}

// 修改 toggleOpen 方法
const toggleOpen = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    initTempFromProps()
    if (props.mode === 'single' && tempStartDate.value) {
      currentLeftMonth.value = new Date(tempStartDate.value)
    } else if (props.mode === 'range' && tempStartDate.value) {
      currentLeftMonth.value = new Date(tempStartDate.value)
      currentRightMonth.value = new Date(
        currentLeftMonth.value.getFullYear(),
        currentLeftMonth.value.getMonth() + 1,
        1,
      )
    } else {
      currentLeftMonth.value = new Date()
      currentRightMonth.value = new Date(
        currentLeftMonth.value.getFullYear(),
        currentLeftMonth.value.getMonth() + 1,
        1,
      )
    }

    // 等待 DOM 更新后计算位置
    await nextTick()
    calculatePanelPosition()

    // PC 端：添加全局点击监听来关闭面板
    if (!isMobile.value) {
      document.addEventListener('click', handleOutsideClick)
    }
  } else {
    initTempFromProps()
    // 移除全局点击监听
    document.removeEventListener('click', handleOutsideClick)
  }
}

const handleOutsideClick = (e) => {
  const wrapper = wrapperRef.value
  if (wrapper && !wrapper.contains(e.target)) {
    isOpen.value = false
    document.removeEventListener('click', handleOutsideClick)
  }
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
  // if (isOpen.value) {
  //   calculatePanelPosition()
  // }
}

// 监听滚动事件
const handleScroll = () => {
  if (isOpen.value) {
    calculatePanelPosition()
  }
}

// 在生命周期中注册事件
// onMounted(() => {
window.addEventListener('resize', handleResize)
//   window.addEventListener('scroll', handleScroll, true)
// })

// onUnmounted(() => {
window.removeEventListener('resize', handleResize)
//   window.removeEventListener('scroll', handleScroll, true)
// })

const prevMonth = () => {
  currentLeftMonth.value = new Date(
    currentLeftMonth.value.getFullYear(),
    currentLeftMonth.value.getMonth() - 1,
    1,
  )
  if (props.mode === 'range') {
    currentRightMonth.value = new Date(
      currentLeftMonth.value.getFullYear(),
      currentLeftMonth.value.getMonth() + 1,
      1,
    )
  }
}

const nextMonth = () => {
  currentLeftMonth.value = new Date(
    currentLeftMonth.value.getFullYear(),
    currentLeftMonth.value.getMonth() + 1,
    1,
  )
  if (props.mode === 'range') {
    currentRightMonth.value = new Date(
      currentLeftMonth.value.getFullYear(),
      currentLeftMonth.value.getMonth() + 1,
      1,
    )
  }
}

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const isToday = (date) => {
  const today = new Date()
  return isSameDay(date, today)
}

watch(isOpen, (newVal) => {
  if (newVal) {
    // 移动端和PC端都锁定滚动
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${scrollBarWidth}px` // 防止滚动条消失导致页面跳动

    // const targetDiv = document.querySelector('#dash > div')
    // targetDiv.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''

    // const targetDiv = document.querySelector('#dash > div')
    // targetDiv.style.overflow = ''
  }
})
</script>

<style scoped>
/* 设计变量 */
.date-picker-wrapper {
  --primary: #1e40af;
  --primary-light: #1e40af1f;
  --secondary: #f59e0b;
  --text: #374151;
  --border: #e5e7eb;
  --radius-btn: 9999px;
  --radius-card: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --transition: 0.2s ease;
}

.date-picker-wrapper {
  position: relative;
  padding: 0;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: var(--text);
  width: 100%;
  max-width: 300px;
  max-height: max-content;
}

.date-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
  font-size: 14px;
  user-select: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.date-picker-trigger:hover {
  border-color: var(--primary);
}

.date-picker-trigger.is-open {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.15);
}

.trigger-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.trigger-text {
  flex: 1;
  font-weight: 500;
}

.trigger-arrow {
  color: #9ca3af;
  transition: transform var(--transition);
}

.trigger-arrow.rotated {
  transform: rotate(180deg);
}

.picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 19;
}

.date-picker-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow);
  padding: 16px;
  z-index: 20;
  width: 100%;
  min-width: 320px;
  max-width: 750px;
  box-sizing: border-box;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.quick-btn {
  padding: 4px 14px;
  font-size: 13px;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  background: white;
  color: var(--text);
  cursor: pointer;
  transition: all var(--transition);
  font-weight: 500;
  white-space: nowrap;
}

.quick-btn:hover {
  background: rgba(30, 64, 175, 0.05);
  border-color: var(--primary);
  color: var(--primary);
}

/* 日历容器 */
.calendars-container {
  display: flex;
  gap: 20px;
}

.calendars-container.single {
  justify-content: center;
}

.calendar {
  flex: 1;
  min-width: 220px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.month-year {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.nav-btn {
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  transition: all var(--transition);
}

.nav-btn:hover {
  background: #f3f4f6;
  border-color: var(--border);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn-placeholder {
  width: 24px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 6px;
}

.weekday {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  padding: 4px 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius-btn);
  transition: all var(--transition);
  color: var(--text);
  position: relative;
  z-index: 1;
}

.day-cell.other-month {
  visibility: hidden;
}

.day-cell:hover:not(.other-month):not(.selected-single) {
  background: var(--primary-light);
}

.day-number {
  position: relative;
  z-index: 2;
}

/* 单日选中样式 */
.day-cell.selected-single {
  background: var(--primary);
  color: white;
  font-weight: 600;
}

/* 范围选择样式 */
.day-cell.in-range {
  background: rgba(30, 64, 175, 0.1);
  border-radius: 0;
}

.day-cell.in-range-preview {
  background: rgba(30, 64, 175, 0.05);
  border-radius: 0;
}

.day-cell.range-start,
.day-cell.range-end {
  background: var(--primary);
  color: white;
  font-weight: 600;
}

.day-cell.range-start {
  border-radius: var(--radius-btn) 0 0 var(--radius-btn);
}

.day-cell.range-end {
  border-radius: 0 var(--radius-btn) var(--radius-btn) 0;
}

.day-cell.range-start.range-end {
  border-radius: var(--radius-btn);
}

/* 今天标记 */
.day-cell.is-today:not(.selected-single):not(.range-start):not(.range-end) {
  font-weight: 600;
  color: var(--primary);
  position: relative;
}

.day-cell.is-today:not(.selected-single):not(.range-start):not(.range-end)::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  background: var(--primary);
  border-radius: 50%;
}

/* 底部 */
.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.footer-btn {
  padding: 6px 18px;
  border-radius: var(--radius-btn);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid var(--border);
}

.clear-btn {
  background: white;
  color: var(--text);
}

.clear-btn:hover {
  background: #f9fafb;
}

.confirm-btn {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.confirm-btn:hover {
  background: #1e3a8a;
}

/* 过渡动画 */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition:
    opacity var(--transition),
    transform var(--transition);
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 响应式 */
@media (max-width: 768px) {
  .date-picker-panel {
    position: fixed;
    top: 54%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 45vh;
    max-height: calc(90vh - 64px);
    padding: 12px;
    min-width: 50%;
    max-width: 75%;
    overflow-y: auto;
    border-radius: 16px;
    background: white;
  }

  .calendars-container.dual {
    flex-direction: column;
    gap: 12px;
  }

  .picker-backdrop {
    background: rgba(0, 0, 0, 0.3);
  }
}

@media (min-width: 769px) {
  .date-picker-panel {
    width: auto;
  }
  /* 面板位置样式 */
  .date-picker-panel.panel-bottom-left {
    left: 0;
    right: auto;
  }

  .date-picker-panel.panel-bottom-right {
    right: 0;
    left: auto;
  }

  .date-picker-panel.panel-top {
    /* bottom: calc(100% + 6px); */
    top: auto;
  }
  .picker-backdrop {
    display: none;
  }
}
</style>
