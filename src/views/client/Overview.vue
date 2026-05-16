<template>
  <div class="client-overview">
    <!-- 一、客户端基本信息卡片 -->
    <section class="info-card">
      <div class="card-header">
        <h2 class="card-title">客户端信息</h2>
        <spinner v-if="!clientLoading" inline size="tiny" />
        <span
          v-else-if="!clientLoadingError"
          class="status-badge"
          :class="isOnline ? 'status-online' : 'status-offline'"
        >
          {{ isOnline ? '在线' : '离线' }}
        </span>
      </div>
      <LoadingState
        :loading="!clientLoading"
        :error="clientLoadingError"
        @retry="clientStore.fetchClientByUUID"
        loadingText="加载中..."
        errorText="客户端信息加载失败"
      />
      <div v-if="clientLoading && !clientLoadingError" class="info-grid">
        <div class="info-item">
          <span class="label">主机名</span>
          <span class="value">{{ client.hostname }}</span>
        </div>
        <div class="info-item">
          <span class="label">UUID</span>
          <span class="value mono">{{ client.uuid }}</span>
        </div>
        <div class="info-item">
          <span class="label">IP 地址</span>
          <span class="value mono">{{ client.ipAddress }}</span>
        </div>
        <div class="info-item">
          <span class="label">操作系统</span>
          <span class="value">{{ client.osInfo }}</span>
        </div>
        <div class="info-item">
          <span class="label">上次在线</span>
          <span class="value">{{ formattedLastSeen }}</span>
        </div>
        <div class="info-item">
          <span class="label">客户端版本</span>
          <span class="value">
            {{ client.version }}
            <span v-if="isLowVersion" class="version-warning">
              ⚠️ 版本过低，请更新至 B0.8.2 以上
            </span>
          </span>
        </div>

        <!-- 备注：在线编辑 -->
        <div class="info-item full-width">
          <span class="label">备注</span>
          <div class="note-editor">
            <input
              v-if="isEditingNote"
              ref="noteInputRef"
              v-model="editableNote"
              type="text"
              class="note-input"
              @blur="saveNote"
              @keyup.enter="saveNote"
            />
            <span v-else class="value note-text">{{ client.note || '暂无备注' }}</span>
            <button
              class="icon-btn"
              title="编辑备注"
              @click="startEditNote"
              :disabled="isSavingNote"
            >
              ✎
            </button>
            <spinner v-if="isSavingNote" inline size="tiny" />
          </div>
        </div>
      </div>

      <!-- 联网授权状态区域 -->

      <div class="auth-section">
        <div v-if="!clientSettingsLoading" class="auth-status">
          <span class="label">联网授权</span><spinner inline size="tiny" />
        </div>
        <div v-else-if="!clientSettingsLoadingError" class="auth-status">
          <span class="label">联网授权</span>
          <span v-if="!setting.netControlEnabled" class="auth-tag tag-disabled">未启用</span>
          <template v-else>
            <span v-if="isAuthExpired" class="auth-tag tag-expired">已过期</span>
            <span v-else class="auth-tag tag-active">
              生效中 · 剩余 {{ remainingMinutes }} 分钟
            </span>
            <span class="auth-deadline"> 截止：{{ formattedAuthDeadline }} </span>
          </template>
        </div>
        <div v-else class="auth-status">
          <span class="label">联网授权</span>
          <span class="auth-tag tag-error">加载失败</span>
        </div>
      </div>
      <div class="actions">
        <div class="auth-actions">
          <button class="btn btn-primary" @click="goToAuthConfig">设置联网授权</button>
          <button class="btn btn-primary" @click="goToWhitelist">编辑白名单</button>
        </div>
        <div class="quick-actions">
          <button class="btn btn-outline" @click="goToUsbRecords">查看U盘记录</button>
          <button class="btn btn-outline" @click="goToUrlRecords">查看URL记录</button>
        </div>
      </div>
      <!-- 快捷入口 -->
    </section>

    <!-- 二、客户端在线记录图表 -->
    <section class="chart-card">
      <h2 class="card-title">在线记录（近三天）</h2>
      <LoadingState
        v-if="clientRecordsLoadingError"
        :error="true"
        @retry="clientStore.fetchClientRecords"
        errorText="客户端在线记录加载失败"
      />
      <LoadingState v-else-if="!clientRecordsLoading || !chartReady" :loading="true" />
      <!-- 使用 v-once 优化静态图表 -->
      <v-chart
        v-else
        class="chart"
        :option="onlineChartOption"
        autoresize
        :init-options="chartInitOptions"
      />
    </section>

    <!-- 三、U盘管控（当天新加入） -->

    <section
      v-if="!UDiskRecordsLoading || UDiskRecordsLoadingError"
      class="info-card usb-control-section"
    >
      <div class="card-header">
        <h2 class="card-title">U盘管控 · 今日新设备</h2>
        <button class="btn btn-text" @click="goToUsbRecords">管理U盘 →</button>
      </div>
      <LoadingState
        :loading="!UDiskRecordsLoading"
        :error="UDiskRecordsLoadingError"
        @retry="clientStore.fetchUDiskRecords"
        errorText="U盘记录加载失败"
      />
    </section>
    <section v-else class="info-card usb-control-section">
      <div class="card-header">
        <h2 class="card-title">U盘管控 · 今日设备</h2>
        <button class="btn btn-text" @click="goToUsbRecords">管理U盘 →</button>
      </div>

      <div v-if="!setting.usbControlEnabled" class="warning-banner">
        ⚠️ U盘管控功能已禁用，状态设置无影响
      </div>

      <div v-if="todayUnknownUsbs.length === 0" class="empty-state">今日暂无未知U盘插入</div>
      <ul v-else class="usb-list">
        <li v-for="(usb, index) in todayUnknownUsbs" :key="index" class="usb-row">
          <span class="usb-name">💿 {{ usb.diskName }}</span>
          <span class="usb-time">{{ usb.insertTime }}</span>
        </li>
      </ul>
    </section>

    <!-- 四、U盘记录图表（近三天，显示磁盘名） -->
    <section class="chart-card">
      <h2 class="card-title">U盘插入记录（近三天）</h2>
      <LoadingState
        :loading="!UDiskRecordsLoading"
        :error="UDiskRecordsLoadingError"
        @retry="clientStore.fetchUDiskRecords"
        errorText="U盘记录加载失败"
      />
      <v-chart
        v-if="UDiskRecordsLoading && !UDiskRecordsLoadingError"
        class="chart"
        :option="usbChartOption"
        autoresize
        :init-options="chartInitOptions"
      />
    </section>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  shallowRef,
  watch,
  onMounted,
  inject,
  onBeforeUnmount,
  onActivated,
  nextTick,
  onUnmounted,
} from 'vue'
import { useRouter } from 'vue-router'

import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'

import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// inject 过滤器对象
const $filters = inject('$filters')
const router = useRouter()
const clientStore = useClientStore()

// ECharts 初始化配置
const chartInitOptions = {
  renderer: 'canvas',
  devicePixelRatio: window.devicePixelRatio || 1,
}
// 图表是否准备好
const chartReady = ref(false)

const clientLoading = computed(() => clientStore.getCurrentClientInfo !== null)
const clientLoadingError = computed(() => clientStore.getCurrentClientInfo?.uuid === 'error')
const clientSettingsLoading = computed(() => clientStore.getCurrentClientSettings !== null)
const clientSettingsLoadingError = computed(() => clientStore.getCurrentClientSettings === 'error')
const clientRecordsLoading = computed(() => clientStore.getCurrentClientRecords !== null)
const clientRecordsLoadingError = computed(
  () => clientStore.getCurrentClientRecords?.[0]?.id === -1,
)
const UDiskRecordsLoading = computed(() => clientStore.getCurrentUDiskRecords !== null)
const UDiskRecordsLoadingError = computed(() => clientStore.getCurrentUDiskRecords?.[0]?.id === -1)

onMounted(() => {
  // 延迟标记图表准备好，确保DOM渲染完成
  setTimeout(() => {
    chartReady.value = true
  }, 50)
})

// 注册必要的 ECharts 模块
use([HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, CanvasRenderer])

const client = computed(() => clientStore.getCurrentClientInfo || {})
const setting = computed(() => clientStore.getCurrentClientSettings || {})
// const clientRecord = computed(() => clientStore.getCurrentClientRecords || [])
// const usbRecord = computed(() => clientStore.getCurrentUDiskRecords || [])

// 使用 shallowRef 优化大数据
const clientRecord = shallowRef([])
const usbRecord = shallowRef([])
// 监听 store 数据变化，使用 shallowRef 更新
watch(
  () => clientStore.getCurrentClientRecords,
  (newVal) => {
    if (newVal && Array.isArray(newVal) && !(newVal[0]?.id === -1)) {
      clientRecord.value = newVal
    }
  },
  { immediate: true },
)

watch(
  () => clientStore.getCurrentUDiskRecords,
  (newVal) => {
    if (newVal && Array.isArray(newVal) && !(newVal[0]?.id === -1)) {
      usbRecord.value = newVal
    }
  },
  { immediate: true },
)

// ---------- 派生状态 ----------
const isOnline = computed(() => {
  if (!client.value.lastSeen) return false
  const last = new Date(client.value.lastSeen).getTime()
  const now = Date.now()
  // 假设计算在线状态：最后在线时间在2分钟内
  return Math.abs(now - last) < 2 * 60 * 1000
})

const formattedLastSeen = computed(() => {
  if (!client.value.lastSeen) return '--'
  return new Date(client.value.lastSeen).toLocaleString('zh-CN')
})

const isLowVersion = computed(() => {
  const version = client.value.version
  if (!version) return false

  // 提取 Bx.x.x 中的版本号
  const match = version.match(/B([\d.]+)/)
  if (!match) return false

  const versionStr = match[1] // "0.10.1" 或 "0.8.2"

  // 转为可比较的数字数组
  const parts = versionStr.split('.').map(Number)

  // 目标版本 [0, 8, 2]
  const target = [0, 8, 2]

  // 逐段比较
  for (let i = 0; i < Math.max(parts.length, target.length); i++) {
    const part = parts[i] || 0
    const targetPart = target[i] || 0
    if (part > targetPart) return false // 当前版本更高
    if (part < targetPart) return true // 当前版本更低
  }

  return false // 版本相等
})

// 授权相关
const isAuthExpired = computed(() => {
  if (!setting.value.netControlEnabled) return false
  const deadline = new Date(setting.value.netAllowedUntil).getTime()
  return Date.now() > deadline
})

const formattedAuthDeadline = computed(() => {
  if (!setting.value.netAllowedUntil) return '--'
  return new Date(setting.value.netAllowedUntil).toLocaleString('zh-CN')
})

const remainingMinutes = computed(() => {
  if (!setting.value.netControlEnabled || isAuthExpired.value) return 0
  const deadline = new Date(setting.value.netAllowedUntil).getTime()
  const diff = deadline - Date.now()
  return Math.max(0, Math.floor(diff / 60000))
})

// 备注编辑
const isEditingNote = ref(false)
const isSavingNote = ref(false)
const editableNote = ref('')
const noteInputRef = ref(null)

const startEditNote = () => {
  editableNote.value = client.value.note || ''
  isEditingNote.value = true
  // 下一个 tick 自动聚焦
  setTimeout(() => {
    noteInputRef.value?.focus()
  }, 0)
}

const saveNote = async () => {
  if (!isEditingNote.value) return
  if (isSavingNote.value) return
  if (editableNote.value === client.value.note) {
    isEditingNote.value = false
    editableNote.value = ''
    return
  }
  isEditingNote.value = false
  isSavingNote.value = true
  try {
    await clientStore.updateClientNote(editableNote.value)
    ElMessage.success('备注已保存')
  } catch (e) {
    ElMessage.error('备注保存失败')
  } finally {
    isSavingNote.value = false
  }
}

// 当天未知U盘
const todayUnknownUsbs = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.toISOString()

  const filtered = usbRecord.value.filter((record) => record.time >= todayStart)

  // 去重：保留每个 volName 第一次出现的记录
  const seen = new Set()
  const uniqueRecords = [...filtered]
    .reverse() // 让较新的记录在前
    .filter((record) => {
      if (seen.has(record.volName)) return false
      seen.add(record.volName)
      return true
    })

  return uniqueRecords.map((record) => ({
    diskName: record.volName,
    insertTime: new Date(record.time).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))
})

// ---------- 图表数据准备 ----------
// 在线记录热力图：横轴天，纵轴小时
// 在线记录热力图（性能优化版）
const onlineChartOption = computed(() => {
  const days = lastThreeDays.value
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const records = clientRecord.value

  // 如果数据为空，返回基础配置
  if (!records || records.length === 0) {
    return getEmptyChartOption(days, hours)
  }

  // 使用 Uint8Array 减少内存占用
  const matrix = new Uint8Array(24 * 3)

  // 使用 for 循环而非 forEach，减少函数调用开销
  for (let i = 0, len = records.length; i < len; i++) {
    const record = records[i]
    const date = $filters.utcToLocalDate(new Date(record.time))
    const dateStr = formatDateStr(date)
    const dayIndex = days.findIndex((d) => d.dateStr === dateStr)
    const hour = date.getHours()

    if (dayIndex !== -1 && hour >= 0 && hour < 24) {
      matrix[hour * 3 + dayIndex]++
    }
  }

  // 构建数据数组，预分配大小
  const dataLength = 24 * 3
  const data = new Array(dataLength)
  let maxValue = 0

  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 3; d++) {
      const value = matrix[h * 3 + d]
      data[h * 3 + d] = [d, h, value]
      if (value > maxValue) maxValue = value
    }
  }

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const dayLabel = days[params.value[0]]?.label || ''
        return `${dayLabel} ${params.value[1]}:00<br/>在线次数: ${params.value[2]}`
      },
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.label),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
    },
    yAxis: {
      type: 'category',
      data: hours.map((h) => `${h}:00`),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
      inverse: true,
    },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#e0e7ff', '#1e40af'] },
      show: false,
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 1,
            borderColor: '#333',
          },
        },
        progressive: 200, // 渐进渲染阈值
        animation: false, // 关闭动画提升性能
      },
    ],
  }
})

// U盘记录热力图（性能优化版）
const usbChartOption = computed(() => {
  const days = lastThreeDays.value
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const records = usbRecord.value

  if (!records) {
    return getEmptyChartOption(days, hours)
  }

  // 使用 TypedArray 优化
  const counts = new Uint16Array(24 * 3)
  // 使用字符串池避免重复字符串创建
  const diskNamesMap = new Map()

  for (let i = 0, len = records.length; i < len; i++) {
    const record = records[i]
    const date = new Date(record.time)
    const dateStr = formatDateStr(date)
    const dayIndex = days.findIndex((d) => d.dateStr === dateStr)
    const hour = date.getHours()

    if (dayIndex !== -1 && hour >= 0 && hour < 24) {
      const idx = hour * 3 + dayIndex
      counts[idx]++

      // 优化字符串拼接
      const key = `${dayIndex},${hour}`
      let names = diskNamesMap.get(key)
      if (!names) {
        names = new Set()
        diskNamesMap.set(key, names)
      }
      names.add(record.volName)
    }
  }

  // 构建数据
  const dataLength = 24 * 3
  const data = new Array(dataLength)
  const deviceMap = new Map()
  let maxValue = 0

  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 3; d++) {
      const idx = h * 3 + d
      const count = counts[idx]
      data[idx] = [d, h, count]
      if (count > maxValue) maxValue = count

      const key = `${d},${h}`
      const names = diskNamesMap.get(key)
      deviceMap.set(key, names ? Array.from(names).join(', ') : '无')
    }
  }

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const [dayIndex, hour, count] = params.data
        const dayLabel = days[dayIndex]?.label || ''
        const key = `${dayIndex},${hour}`
        const devices = deviceMap.get(key) || '无'
        return `${dayLabel} ${hour}:00<br/>插入次数: ${count}<br/>设备: ${devices}`
      },
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.label),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
    },
    yAxis: {
      type: 'category',
      data: hours.map((h) => `${h}:00`),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
      inverse: true,
    },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#fef3c7', '#f59e0b', '#b45309'],
      },
      show: false,
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 1,
            borderColor: '#333',
          },
        },
        progressive: 200, // 设置合理的渐进渲染阈值
        animation: false, // 关闭动画
      },
    ],
  }
})

// 空图表配置（避免重复创建）
function getEmptyChartOption(days, hours) {
  return {
    tooltip: { position: 'top' },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.label),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
    },
    yAxis: {
      type: 'category',
      data: hours.map((h) => `${h}:00`),
      splitArea: { show: true },
      axisLabel: { color: '#374151' },
      inverse: true,
    },
    visualMap: {
      min: 0,
      max: 1,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      show: false,
    },
    series: [
      {
        type: 'heatmap',
        data: [],
        animation: false,
      },
    ],
  }
}

// 辅助函数
const lastThreeDays = computed(() => {
  const days = []
  const today = new Date()
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDateStr(d)
    days.push({
      dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    })
  }
  return days
})

function formatDateStr(date) {
  return $filters.formatDateTime(date, 'YYYY-MM-dd')
}

// ---------- 路由跳转占位方法 ----------
const goToAuthConfig = () => router.push('/dash/client/authorize_net')
const goToWhitelist = () => router.push('/dash/client/net_whitelist')
const goToUsbRecords = () => router.push('/dash/client/udisk_records')
const goToUrlRecords = () => router.push('/dash/client/url_records')
</script>

<style scoped>
/* 全局变量风格遵循配置 */
.client-overview {
  flex: 1;
  min-width: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #374151;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
}

/* 卡片通用样式 */
.info-card,
.chart-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1e40af;
  margin: 0;
}

/* 基本信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px 32px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-weight: 500;
  word-break: break-word;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
}

/* 在线状态 */
.status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-online {
  background: #dcfce7;
  color: #166534;
}

.status-offline {
  background: #f3f4f6;
  color: #6b7280;
}

/* 版本警告 */
.version-warning {
  display: inline-block;
  margin-left: 8px;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 备注编辑 */
.note-editor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: null;
  transition: border 0.2s ease;
}

.note-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
}

.icon-btn {
  background: null;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s ease;
}

.icon-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
/* 授权区域 */
.auth-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.auth-tag {
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-disabled {
  background: #f3f4f6;
  color: #6b7280;
}

.tag-expired {
  background: #fee2e2;
  color: #991b1b;
}

.tag-active {
  background: #dcfce7;
  color: #166534;
}

.auth-deadline {
  font-size: 0.85rem;
  color: #6b7280;
}
.actions {
  display: flex;
  gap: 8px;
}
.auth-actions,
.quick-actions {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  flex-wrap: nowrap;
}

/* 按钮系统 */
.btn {
  padding: 8px 16px;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.85rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.btn-primary {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.btn-primary:hover {
  background: #1e3a8a;
}

.btn-secondary {
  border-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-outline {
  border-color: #e5e7eb;
  color: #1e40af;
}

.btn-outline:hover {
  background: #eff6ff;
  border-color: #1e40af;
}

.btn-text {
  background: transparent;
  border: null;
  color: #1e40af;
  padding: 4px 8px;
}

.btn-text:hover {
  text-decoration: underline;
  background: transparent;
}

/* 警告横幅 */
.warning-banner {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #92400e;
}

/* USB 列表 */
.usb-list {
  list-style: null;
  padding: 0;
  margin: 0;
}

.usb-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.usb-row:last-child {
  border-bottom: null;
}

.usb-name {
  font-weight: 500;
}

.usb-time {
  color: #6b7280;
  font-size: 0.9rem;
}

.empty-state {
  color: #9ca3af;
  text-align: center;
  padding: 16px;
}

/* 图表容器 */
.chart {
  width: 100%;
  height: 280px;
}

/* 响应式 */
@media (max-width: 768px) {
  .client-overview {
    padding: 16px;
    gap: 16px;
  }

  .info-card,
  .chart-card {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .auth-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .actions {
    flex-direction: column;
  }
  .btn-primary {
    width: 45%;
  }
  .btn-outline {
    width: 45%;
  }
}
</style>
