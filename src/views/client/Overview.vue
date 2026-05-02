<template>
  <div class="client-overview">
    <!-- 一、客户端基本信息卡片 -->
    <section class="info-card">
      <div class="card-header">
        <h2 class="card-title">客户端信息</h2>
        <span class="status-badge" :class="isOnline ? 'status-online' : 'status-offline'">
          {{ isOnline ? '在线' : '离线' }}
        </span>
      </div>

      <div class="info-grid">
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
            <button class="icon-btn" title="编辑备注" @click="startEditNote">✎</button>
          </div>
        </div>
      </div>

      <!-- 联网授权状态区域 -->
      <div class="auth-section">
        <div class="auth-status">
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
        <div class="auth-actions">
          <button class="btn btn-primary" @click="goToAuthConfig">设置联网授权</button>
          <button class="btn btn-secondary" @click="goToWhitelist">编辑白名单</button>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-actions">
        <button class="btn btn-outline" @click="goToUsbRecords">💾 查看U盘记录</button>
        <button class="btn btn-outline" @click="goToUrlRecords">🌐 查看URL记录</button>
      </div>
    </section>

    <!-- 二、客户端在线记录图表 -->
    <section class="chart-card">
      <h2 class="card-title">在线记录（近三天）</h2>
      <v-chart class="chart" :option="onlineChartOption" autoresize />
    </section>

    <!-- 三、U盘管控（当天新加入） -->
    <section class="info-card usb-control-section">
      <div class="card-header">
        <h2 class="card-title">U盘管控 · 今日新设备</h2>
        <button class="btn btn-text" @click="goToUsbManagement">管理U盘 →</button>
      </div>

      <div v-if="setting.disableControlPanel" class="warning-banner">
        ⚠️ 控制面板已禁用，U盘检测功能可能受限。
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
      <v-chart class="chart" :option="usbChartOption" autoresize />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'

import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'

import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// inject 过滤器对象
const $filters = inject('$filters')
const router = useRouter()
const clientStore = useClientStore()

// 注册必要的 ECharts 模块
use([HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, CanvasRenderer])

// ---------- 已知默认数据（实际开发中通过 API 获取）----------
const client = ref({
  hostname: 'hostname',
  ipAddress: '127.0.0.1',
  lastSeen: '2026-05-02T20:27:11.603000Z',
  note: '备注',
  osInfo: 'os_info',
  uuid: 'uuid',
  version: 'B0.7.9',
})

const setting = ref({
  disableControlPanel: false,
  disableSystemSettings: false,
  disableTaskManager: false,
  netAllowedUntil: '2026-05-06T20:20:11.603000Z',
  netControlEnabled: false,
  netPeriodEnabled: false,
  usbControlEnabled: false,
})

const clientRecord = ref([
  { id: 1, uuid: 'uuid', time: '2026-05-02T13:30:53.339000+00:00' },
  { id: 2, uuid: 'uuid', time: '2026-05-02T13:32:53.339000+00:00' },
  { id: 3, uuid: 'uuid', time: '2026-05-02T13:35:53.339000+00:00' },
  { id: 4, uuid: 'uuid', time: '2026-05-02T13:38:53.339000+00:00' },
  { id: 5, uuid: 'uuid', time: '2026-05-02T13:41:53.339000+00:00' },
  { id: 6, uuid: 'uuid', time: '2026-05-02T13:45:53.339000+00:00' },
  { id: 7, uuid: 'uuid', time: '2026-05-02T13:47:53.339000+00:00' },
  { id: 8, uuid: 'uuid', time: '2026-05-02T13:50:53.339000+00:00' },
  { id: 9, uuid: 'uuid', time: '2026-05-02T13:55:53.339000+00:00' },
  { id: 10, uuid: 'uuid', time: '2026-05-02T13:58:53.339000+00:00' },
  { id: 11, uuid: 'uuid', time: '2026-05-02T13:59:53.339000+00:00' },
  { id: 12, uuid: 'uuid', time: '2026-05-02T14:02:53.339000+00:00' },
])

const usbRecord = ref([
  { id: 6, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-25T07:13:59.052504+00:00' },
  { id: 7, uuid: 'uuid', usbId: 'usb_id2', time: '2026-05-02T06:36:22.582000+00:00' },
  { id: 8, uuid: 'uuid', usbId: 'usb_id2', time: '2026-05-02T06:38:22.582000+00:00' },
  { id: 9, uuid: 'uuid', usbId: 'usb_id2', time: '2026-05-02T06:40:22.582000+00:00' },
  { id: 10, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-25T09:16:59.052000+00:00' },
  { id: 11, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-25T09:19:59.052000+00:00' },
  { id: 12, uuid: 'uuid', usbId: 'usb_id1', time: '2026-04-05T12:37:50.879000+00:00' },
  { id: 13, uuid: 'uuid', usbId: 'usb_id1', time: '2026-04-05T12:39:50.879000+00:00' },
  { id: 14, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-26T07:13:59.052000+00:00' },
  { id: 15, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-26T07:16:59.052000+00:00' },
  { id: 16, uuid: 'uuid', usbId: 'usb_id', time: '2026-04-26T07:17:59.052000+00:00' },
])

// ---------- 派生状态 ----------
const isOnline = computed(() => {
  if (!client.value.lastSeen) return false
  const last = new Date(client.value.lastSeen).getTime()
  const now = Date.now()
  // 假设计算在线状态：最后在线时间在5分钟内
  return now - last < 5 * 60 * 1000
})

const formattedLastSeen = computed(() => {
  if (!client.value.lastSeen) return '--'
  return new Date(client.value.lastSeen).toLocaleString('zh-CN')
})

const isLowVersion = computed(() => {
  const version = client.value.version
  if (!version) return false
  // 简单比较版本号，低于B0.8.2则提醒
  const num = parseFloat(version.replace(/[^0-9.]/g, ''))
  return num < 0.82
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
  isEditingNote.value = false
  // 调用API保存备注 (示例)
  // await updateClientNote(client.value.uuid, editableNote.value);
  client.value.note = editableNote.value
  console.log('备注已保存:', editableNote.value)
}

// 当天未知U盘（模拟逻辑：取usbRecord中今天插入的，且usbId作为磁盘名）
const todayUnknownUsbs = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.toISOString()

  return usbRecord.value
    .filter((record) => {
      return record.time >= todayStart
    })
    .map((record) => ({
      diskName: record.usbId,
      insertTime: new Date(record.time).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))
})

// ---------- 图表数据准备 ----------
// 在线记录热力图：横轴天，纵轴小时
const onlineChartOption = computed(() => {
  const days = getLastThreeDays()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // 构建数据矩阵 [小时, 天索引, 计数]
  const data = []
  // 初始化所有格子为0
  const matrix = Array(24)
    .fill(0)
    .map(() => Array(3).fill(0))

  clientRecord.value.forEach((record) => {
    const date = $filters.utcToLocalDate(new Date(record.time))
    const dayIndex = days.findIndex((d) => d.dateStr === formatDateStr(date))
    const hour = date.getHours()
    if (dayIndex !== -1 && hour >= 0 && hour < 24) {
      matrix[hour][dayIndex] += 1
    }
  })

  // 转换为 [dayIndex, hour, value] 格式
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 3; d++) {
      data.push([d, h, matrix[h][d]])
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
      max: Math.max(...data.map((d) => d[2]), 1),
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
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
      },
    ],
  }
})

// U盘记录热力图（显示磁盘名）
const usbChartOption = computed(() => {
  const days = getLastThreeDays()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // 收集近三天所有usb记录
  const recentUsbRecords = usbRecord.value.filter((r) => {
    const recDate = new Date(r.time)
    return days.some((d) => d.dateStr === formatDateStr(recDate))
  })

  // 构建数据结构：每个记录转换为 [天索引, 小时, usbId, count?] 但热力图需要数值
  // 我们展示usbId作为tooltip，数据值使用插入次数
  const aggregatedMap = new Map() // key: "dayIndex-hour-usbId"
  recentUsbRecords.forEach((r) => {
    const date = new Date(r.time)
    const dayIndex = days.findIndex((d) => d.dateStr === formatDateStr(date))
    const hour = date.getHours()
    const key = `${dayIndex}-${hour}-${r.usbId}`
    if (!aggregatedMap.has(key)) {
      aggregatedMap.set(key, { count: 0, usbId: r.usbId })
    }
    aggregatedMap.get(key).count += 1
  })

  const data = []
  aggregatedMap.forEach((value, key) => {
    const [dayIndex, hour] = key.split('-').slice(0, 2).map(Number)
    data.push([dayIndex, hour, value.count, value.usbId])
  })

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const dayLabel = days[params.value[0]]?.label || ''
        const usbName = params.value[3] || '未知磁盘'
        return `${dayLabel} ${params.value[1]}:00<br/>磁盘: ${usbName}<br/>插入次数: ${params.value[2]}`
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
      max: Math.max(...data.map((d) => d[2]), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#fef3c7', '#b45309'] },
      show: false,
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
        },
      },
    ],
  }
})

// 辅助函数
function getLastThreeDays() {
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
}

function formatDateStr(date) {
  //   return $filters.formatDateTime(date, 'YYYY-MM-dd')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  console.log(`${year}-${month}-${day}`)
  return `${year}-${month}-${day}`
}

// ---------- 路由跳转占位方法 ----------
const goToAuthConfig = () => console.log('跳转到联网授权配置页')
const goToWhitelist = () => console.log('跳转到白名单配置页')
const goToUsbRecords = () => console.log('跳转到U盘记录页')
const goToUrlRecords = () => console.log('跳转到URL记录页')
const goToUsbManagement = () => console.log('跳转到U盘管理页')
</script>

<style scoped>
/* 全局变量风格遵循配置 */
.client-overview {
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
  outline: none;
  transition: border 0.2s ease;
}

.note-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
}

.icon-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
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

.auth-actions,
.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  border: none;
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
  list-style: none;
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
  border-bottom: none;
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
}
</style>
