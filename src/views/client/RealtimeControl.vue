<template>
  <div class="realtime-page">
    <div class="page-container">
      <!-- ========== 页头 ========== -->
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">实时操控</h1>
          <span class="status-badge" :class="clientOnline ? 'is-online' : 'is-offline'">
            <span class="status-dot"></span>
            {{ clientOnline ? '客户端在线' : '客户端离线' }}
          </span>
        </div>
        <button class="btn btn-secondary" :disabled="isRefreshing" @click="refreshAll">
          <svg
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span>{{ isRefreshing ? '刷新中…' : '刷新列表' }}</span>
        </button>
      </header>

      <!-- ========== 应用管理：启动 / 关闭 ========== -->
      <div class="app-grid">
        <!-- 启动应用 -->
        <section class="card">
          <div class="card-head">
            <span class="card-bar"></span>
            <h2 class="card-title">启动客户端应用</h2>
            <button
              class="btn-link"
              :disabled="launchable.loading"
              @click="fetchAppList('launchable')"
            >
              {{ launchable.loading ? '查询中…' : '重新获取' }}
            </button>
          </div>
          <p class="card-desc">向客户端查询本机可启动的应用列表。</p>
          <LoadingState
            :loading="launchable.loading"
            loadingText="正在向客户端查询可启动应用…"
            :error="!!launchable.error"
            :errorText="launchable.error"
            :empty="!launchable.apps.length"
            emptyTitle="暂无可启动应用"
            @retry="fetchAppList('launchable')"
          >
            <div class="app-list">
              <div v-for="app in launchable.apps" :key="app.appId" class="app-item">
                <div class="app-icon">
                  <img v-if="app.icon" :src="app.icon" alt="" />
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18" />
                  </svg>
                </div>
                <div class="app-info">
                  <div class="app-name">{{ app.name }}</div>
                  <div class="app-path">{{ app.execPath || '—' }}</div>
                </div>
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="launchingId === app.appId"
                  @click="askLaunch(app)"
                >
                  {{ launchingId === app.appId ? '发送中…' : '启动' }}
                </button>
              </div>
            </div>
          </LoadingState>
        </section>

        <!-- 关闭应用 -->
        <section class="card">
          <div class="card-head">
            <span class="card-bar"></span>
            <h2 class="card-title">关闭客户端应用</h2>
            <button class="btn-link" :disabled="running.loading" @click="fetchAppList('running')">
              {{ running.loading ? '查询中…' : '重新获取' }}
            </button>
          </div>
          <p class="card-desc">向客户端查询当前正在运行的进程并发送关闭指令。</p>
          <LoadingState
            :loading="running.loading"
            loadingText="正在向客户端查询可启动应用…"
            :error="!!running.error"
            :errorText="running.error"
            :empty="!running.apps.length"
            emptyTitle="暂无可启动应用"
            @retry="fetchAppList('running')"
          >
            <div class="app-list">
              <div v-for="app in running.apps" :key="app.appId + '-' + app.pid" class="app-item">
                <div class="app-icon">
                  <img v-if="app.icon" :src="app.icon" alt="" />
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18" />
                  </svg>
                </div>
                <div class="app-info">
                  <div class="app-name">{{ app.name }}</div>
                  <div class="app-path">PID {{ app.pid || '—' }}</div>
                </div>
                <button class="btn btn-secondary btn-sm btn-kill" @click="askKill(app)">
                  关闭
                </button>
              </div>
            </div>
          </LoadingState>
        </section>
      </div>

      <!-- ========== 键盘控制 ========== -->
      <section class="card keyboard-card">
        <div class="card-head">
          <span class="card-bar"></span>
          <h2 class="card-title">键盘控制</h2>
          <span v-if="lastSentLabel" class="key-tip">最近发送：{{ lastSentLabel }}</span>
        </div>
        <p class="card-desc">点击虚拟按键即可向客户端发送键击，支持组合键与常用快捷键。</p>

        <!-- 常用快捷键 -->
        <div class="shortcut-block">
          <h3 class="sub-title">常用快捷键</h3>
          <div class="shortcut-list">
            <button
              v-for="s in shortcuts"
              :key="s.text"
              class="shortcut-btn"
              @click="runShortcut(s)"
            >
              {{ s.text }}
            </button>
          </div>
        </div>

        <!-- 虚拟键盘 -->
        <div class="keyboard-block">
          <h3 class="sub-title">
            虚拟键盘
            <span class="hint">先点 Ctrl / Shift / Alt / Win 再点按键，即可发送组合键</span>
          </h3>
          <div class="keyboard">
            <div class="keyboard-scroll-strip"></div>
            <div class="keyboard-inner">
              <div v-for="(row, ri) in keyboardRows" :key="ri" class="keyboard-row">
                <button
                  v-for="(k, ki) in row"
                  :key="ki"
                  class="key"
                  :class="{ 'is-mod': k.mod, 'is-active': isModActive(k) }"
                  :style="{ flexGrow: k.w }"
                  @click="pressKey(k)"
                >
                  {{ k.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="keyboard-actions">
            <button
              class="btn btn-secondary btn-sm"
              :disabled="!activeMods.length"
              @click="releaseAllMods"
            >
              清除组合键
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- ========== 启动应用确认弹窗 ========== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="launchConfirmState.visible" class="modal-mask" @click.self="closeLaunchConfirm">
          <div class="modal-card">
            <h3 class="modal-title">启动应用</h3>
            <p class="modal-text">
              确定要向客户端发送「{{ launchConfirmState.app?.name }}」的启动指令吗？
            </p>
            <p class="modal-extra" v-if="launchConfirmState.app?.execPath">
              {{ launchConfirmState.app.execPath }}
            </p>
            <div class="modal-footer">
              <button
                class="btn btn-secondary"
                :disabled="launchConfirmState.sending"
                @click="closeLaunchConfirm"
              >
                取消
              </button>
              <button
                class="btn btn-primary"
                :disabled="launchConfirmState.sending"
                @click="confirmLaunch"
              >
                {{ launchConfirmState.sending ? '发送中…' : '确认启动' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ========== 关闭应用确认弹窗 ========== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmState.visible" class="modal-mask" @click.self="closeConfirm">
          <div class="modal-card">
            <h3 class="modal-title">关闭应用</h3>
            <p class="modal-text">
              确定要向客户端发送「{{
                confirmState.app?.name
              }}」的关闭指令吗？该操作会强制结束对应进程。
            </p>
            <div class="modal-footer">
              <button
                class="btn btn-secondary"
                :disabled="confirmState.sending"
                @click="closeConfirm"
              >
                取消
              </button>
              <button class="btn btn-danger" :disabled="confirmState.sending" @click="confirmKill">
                {{ confirmState.sending ? '发送中…' : '确认关闭' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useClientStore } from '@/stores/clientStore'
import LoadingState from '@/components/LoadingState.vue'

const clientStore = useClientStore()

const clientOnline = computed(() => clientStore.currentClientOnline())

/* ---------------- 列表状态 ---------------- */
const launchable = reactive({ loading: false, error: '', apps: [] })
const running = reactive({ loading: false, error: '', apps: [] })

const isRefreshing = computed(() => launchable.loading || running.loading)

const POLL_INTERVAL = 1000
const POLL_MAX_TIMES = 15
const polls = { launchable: null, running: null }

function stopPoll(type) {
  if (polls[type]) {
    clearInterval(polls[type])
    polls[type] = null
  }
}

/**
 * 通知服务端向客户端查询应用列表，并轮询查询结果
 * @param {'launchable' | 'running'} type
 */
async function fetchAppList(type) {
  const ctx = type === 'launchable' ? launchable : running
  const label = type === 'launchable' ? '可启动应用' : '运行中的应用'

  stopPoll(type)
  ctx.loading = true
  ctx.error = ''

  try {
    const { requestId } = await clientStore.requestAppList(type)
    if (!requestId) throw new Error('服务端未返回查询任务 ID')

    let times = 0
    polls[type] = setInterval(async () => {
      times += 1
      if (times > POLL_MAX_TIMES) {
        stopPoll(type)
        ctx.loading = false
        ctx.error = '客户端响应超时，请稍后重试'
        ElMessage.warning(`${label}查询超时`)
        return
      }
      try {
        const result = await clientStore.pollAppListResult(requestId)
        if (result?.status === 'pending') return

        stopPoll(type)
        ctx.loading = false

        if (result?.status === 'success') {
          ctx.apps = Array.isArray(result.apps) ? result.apps : []
          ElMessage.success(`${label}刷新成功`)
        } else {
          ctx.error = result?.message || '客户端查询失败'
          ElMessage.error(`${label}查询失败`)
        }
      } catch (err) {
        stopPoll(type)
        ctx.loading = false
        ctx.error = err?.message || '轮询查询结果失败'
        ElMessage.error(`${label}查询失败`)
      }
    }, POLL_INTERVAL)
  } catch (err) {
    ctx.loading = false
    ctx.error = err?.message || '查询指令下发失败'
    ElMessage.error(`${label}查询失败`)
  }
}

function refreshAll() {
  fetchAppList('launchable')
  fetchAppList('running')
}

/* ---------------- 启动应用 ---------------- */
const launchingId = ref('')
const launchConfirmState = reactive({ visible: false, app: null, sending: false })

function askLaunch(app) {
  if (launchingId.value) return
  launchConfirmState.app = app
  launchConfirmState.sending = false
  launchConfirmState.visible = true
}

function closeLaunchConfirm() {
  if (launchConfirmState.sending) return
  launchConfirmState.visible = false
  launchConfirmState.app = null
}

async function confirmLaunch() {
  if (launchConfirmState.sending || !launchConfirmState.app) return
  launchConfirmState.sending = true
  const app = launchConfirmState.app
  launchingId.value = app.appId
  try {
    await clientStore.launchApp({
      appId: app.appId,
      execPath: app.execPath,
      name: app.name,
    })
    // 指令发送完成即可，无需等待客户端执行结果
    ElMessage.success(`已向客户端发送「${app.name}」启动指令`)
    launchConfirmState.visible = false
    launchConfirmState.app = null
  } catch (err) {
    ElMessage.error(err?.message || `「${app.name}」启动指令发送失败`)
  } finally {
    launchConfirmState.sending = false
    launchingId.value = ''
  }
}

/* ---------------- 关闭应用 ---------------- */
const confirmState = reactive({ visible: false, app: null, sending: false })

function askKill(app) {
  confirmState.app = app
  confirmState.sending = false
  confirmState.visible = true
}

function closeConfirm() {
  if (confirmState.sending) return
  confirmState.visible = false
  confirmState.app = null
}

async function confirmKill() {
  if (confirmState.sending || !confirmState.app) return
  confirmState.sending = true
  const app = confirmState.app
  try {
    await clientStore.killApp({
      appId: app.appId,
      pid: app.pid,
      name: app.name,
    })
    ElMessage.success(`已向客户端发送「${app.name}」关闭指令`)
    confirmState.visible = false
    confirmState.app = null
  } catch (err) {
    ElMessage.error(err?.message || `「${app.name}」关闭指令发送失败`)
  } finally {
    confirmState.sending = false
  }
}

/* ---------------- 键盘控制 ---------------- */
const MODIFIER_MAP = {
  Ctrl: { key: 'Control', code: 'ControlLeft', name: 'Control' },
  Alt: { key: 'Alt', code: 'AltLeft', name: 'Alt' },
  Shift: { key: 'Shift', code: 'ShiftLeft', name: 'Shift' },
  Win: { key: 'Meta', code: 'MetaLeft', name: 'Meta' },
}
const MODIFIER_LABELS = ['Ctrl', 'Alt', 'Shift', 'Win']

const KEY_DEFS = {
  Esc: { key: 'Escape', code: 'Escape' },
  Tab: { key: 'Tab', code: 'Tab' },
  CapsLock: { key: 'CapsLock', code: 'CapsLock' },
  Enter: { key: 'Enter', code: 'Enter' },
  Backspace: { key: 'Backspace', code: 'Backspace' },
  Space: { key: ' ', code: 'Space' },
  Shift: { key: 'Shift', code: 'ShiftLeft' },
  Ctrl: { key: 'Control', code: 'ControlLeft' },
  Alt: { key: 'Alt', code: 'AltLeft' },
  Win: { key: 'Meta', code: 'MetaLeft' },
  '←': { key: 'ArrowLeft', code: 'ArrowLeft' },
  '↑': { key: 'ArrowUp', code: 'ArrowUp' },
  '↓': { key: 'ArrowDown', code: 'ArrowDown' },
  '→': { key: 'ArrowRight', code: 'ArrowRight' },
}

const KEY_WIDTHS = {
  Backspace: 2,
  Tab: 1.6,
  CapsLock: 1.9,
  Enter: 2.2,
  Shift: 2.5,
  Space: 6.5,
  Ctrl: 1.4,
  Win: 1.2,
  Alt: 1.3,
}

const PUNCT_CODES = {
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  ';': 'Semicolon',
  "'": 'Quote',
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
}

const KEY_CODES = {
  Escape: 27,
  Tab: 9,
  CapsLock: 20,
  Enter: 13,
  Backspace: 8,
  Space: 32,
  ShiftLeft: 16,
  ControlLeft: 17,
  AltLeft: 18,
  MetaLeft: 91,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Backquote: 192,
  Minus: 189,
  Equal: 187,
  BracketLeft: 219,
  BracketRight: 221,
  Backslash: 220,
  Semicolon: 186,
  Quote: 222,
  Comma: 188,
  Period: 190,
  Slash: 191,
}

function normalizeKey(label) {
  if (KEY_DEFS[label]) {
    return {
      label,
      ...KEY_DEFS[label],
      mod: MODIFIER_LABELS.includes(label),
      w: KEY_WIDTHS[label] || 1,
    }
  }
  if (/^[a-z]$/.test(label)) {
    return { label, key: label, code: 'Key' + label.toUpperCase(), mod: false, w: 1 }
  }
  if (/^[0-9]$/.test(label)) {
    return { label, key: label, code: 'Digit' + label, mod: false, w: 1 }
  }
  if (PUNCT_CODES[label]) {
    return { label, key: label, code: PUNCT_CODES[label], mod: false, w: 1 }
  }
  return { label, key: label, code: label, mod: false, w: 1 }
}

const KEY_ROWS = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Ctrl', '←', '↑', '↓', '→'],
]

const keyboardRows = KEY_ROWS.map((row) => row.map(normalizeKey))

const activeMods = ref([])
const lastSentLabel = ref('')

function isModActive(k) {
  return k.mod && activeMods.value.includes(k.label)
}

function toggleMod(label) {
  const idx = activeMods.value.indexOf(label)
  if (idx > -1) activeMods.value.splice(idx, 1)
  else activeMods.value.push(label)
}

function releaseAllMods() {
  activeMods.value = []
}

function resolveKeyCode(code) {
  if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3)
  if (/^Digit[0-9]$/.test(code)) return 48 + Number(code.slice(5))
  if (/^F\d{1,2}$/.test(code)) return 111 + Number(code.slice(1))
  return KEY_CODES[code] || 0
}

function makeEvent(action, key, code, modifiers) {
  return { action, key, code, keyCode: resolveKeyCode(code), modifiers }
}

/** 构造「修饰键按下 → 主键按下/抬起 → 修饰键抬起」的事件序列 */
function buildEvents(key, code, modLabels) {
  const mods = modLabels.map((l) => MODIFIER_MAP[l]).filter(Boolean)
  const modNames = mods.map((m) => m.name)
  const events = []

  mods.forEach((m) => events.push(makeEvent('down', m.key, m.code, [])))
  events.push(makeEvent('down', key, code, modNames))
  events.push(makeEvent('up', key, code, modNames))
  ;[...mods].reverse().forEach((m) => events.push(makeEvent('up', m.key, m.code, [])))

  return events
}

/* 键击请求串行队列，避免连点导致并发丢指令 */
const keyQueue = []
let isSendingKeys = false

async function enqueueEvents(events, label) {
  keyQueue.push({ events, label })
  if (isSendingKeys) return

  isSendingKeys = true
  while (keyQueue.length) {
    const job = keyQueue.shift()
    try {
      await clientStore.sendKeyEvents(job.events)
      lastSentLabel.value = job.label
    } catch (err) {
      ElMessage.error(err?.message || '键击指令发送失败')
    }
  }
  isSendingKeys = false
}

function pressKey(k) {
  if (k.mod) {
    toggleMod(k.label)
    return
  }
  const mods = [...activeMods.value]
  activeMods.value = []

  const events = buildEvents(k.key, k.code, mods)
  const label = mods.length
    ? `${mods.join(' + ')} + ${k.label.toUpperCase()}`
    : k.label.toUpperCase()
  enqueueEvents(events, label)
}

const shortcuts = [
  { text: 'Ctrl + C', mods: ['Ctrl'], key: 'c', code: 'KeyC' },
  { text: 'Ctrl + V', mods: ['Ctrl'], key: 'v', code: 'KeyV' },
  { text: 'Ctrl + X', mods: ['Ctrl'], key: 'x', code: 'KeyX' },
  { text: 'Ctrl + Z', mods: ['Ctrl'], key: 'z', code: 'KeyZ' },
  { text: 'Ctrl + A', mods: ['Ctrl'], key: 'a', code: 'KeyA' },
  { text: 'Ctrl + S', mods: ['Ctrl'], key: 's', code: 'KeyS' },
  { text: 'Alt + Tab', mods: ['Alt'], key: 'Tab', code: 'Tab' },
  { text: 'Alt + F4', mods: ['Alt'], key: 'F4', code: 'F4' },
  { text: 'Ctrl + Shift + Esc', mods: ['Ctrl', 'Shift'], key: 'Escape', code: 'Escape' },
  { text: 'Win + D', mods: ['Win'], key: 'd', code: 'KeyD' },
  { text: 'Win + L', mods: ['Win'], key: 'l', code: 'KeyL' },
]

function runShortcut(s) {
  enqueueEvents(buildEvents(s.key, s.code, s.mods), s.text)
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  refreshAll()
})

onUnmounted(() => {
  stopPoll('launchable')
  stopPoll('running')
})
</script>

<style>
:root {
  --primary: #1e40af;
  --primary-hover: #1e3a8a;
  --primary-soft: rgba(30, 64, 175, 0.08);
  --text: #374151;
  --text-secondary: #6b7280;
  --text-light: #9ca3af;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --bg-page: #f9fafb;
  --bg-card: #ffffff;
  --success: #22c55e;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --danger-text: #b91c1c;
  --radius-card: 8px;
  --radius-btn: 9999px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-float: 0 8px 24px rgba(0, 0, 0, 0.1);
  --shadow-primary: 0 4px 12px rgba(30, 64, 175, 0.25);
  --transition: 0.2s ease;
}
</style>
<style scoped>
/* ---------- CSS 变量 ---------- */
.realtime-page {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  box-sizing: border-box;
  padding: 24px;
  background: var(--bg-page);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

/* ---------- 容器布局 ---------- */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--primary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-btn);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.status-badge.is-online {
  background: #dcfce7;
  color: #166534;
}

.status-badge.is-offline {
  background: #fef2f2;
  color: var(--danger-text);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.is-online .status-dot {
  background: var(--success);
}

.is-offline .status-dot {
  background: var(--danger);
}

/* ---------- 按钮 ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 28px;
  border: 1px solid transparent;
  border-radius: var(--radius-btn);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn .icon {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.btn-secondary {
  background: #fff;
  color: var(--text);
  border-color: var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-page);
  border-color: #d1d5db;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-danger:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

.btn-sm {
  padding: 7px 18px;
  font-size: 13px;
}

.btn-kill:hover:not(:disabled) {
  border-color: #fca5a5;
  color: var(--danger-text);
  background: #fef2f2;
}

.btn-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-link:hover:not(:disabled) {
  color: var(--primary-hover);
  text-decoration: underline;
}

.btn-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---------- 卡片 ---------- */
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow);
  padding: 20px 24px 24px;
  transition: all var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-hover);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.card-bar {
  flex-shrink: 0;
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: var(--primary);
}

.card-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text);
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.key-tip {
  font-size: 12px;
  color: var(--text-light);
}

.sub-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.hint {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-light);
}

/* ---------- 应用列表 ---------- */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.app-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  transition: all var(--transition);
}

.app-item:hover {
  background: #fafbfc;
  border-color: var(--border);
}

.app-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--border-light);
  color: var(--text-light);
  overflow: hidden;
}

.app-icon svg {
  width: 18px;
  height: 18px;
}

.app-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-path {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 键盘 ---------- */
.shortcut-block {
  margin-bottom: 20px;
}

.shortcut-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shortcut-btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: #fff;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.shortcut-btn:hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.shortcut-btn:active {
  transform: translateY(0);
}

.keyboard {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* iOS 顺滑滚动 */
  padding-bottom: 4px;
  max-width: 100%;
}
/* 移动端专用空白滑动区：默认隐藏 */
.keyboard-scroll-strip {
  display: none;
}
.keyboard-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 640px; /* 桌面端保持，移动端覆盖 */
  width: max-content; /* 新增，让内部按内容宽度撑开 */
}

.keyboard-row {
  display: flex;
  gap: 6px;
}

.key {
  flex: 1 1 0;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fff;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  transition: all var(--transition);
}

.key:hover {
  background: var(--bg-page);
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.key:active {
  transform: translateY(0);
  background: var(--border-light);
}

.key.is-mod {
  color: var(--primary);
}

.key.is-active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-primary);
}

.keyboard-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ---------- 弹窗 ---------- */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 100%;
  max-width: 440px;
  padding: 24px;
  border-radius: var(--radius-card);
  background: #fff;
  box-shadow: var(--shadow-float);
}

.modal-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 500;
  color: var(--text);
}

.modal-text {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  word-break: break-word;
}

.modal-extra {
  margin: -12px 0 20px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--border-light);
  font-size: 12px;
  color: var(--text-light);
  word-break: break-all;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---------- 动画 ---------- */
.modal-enter-active {
  animation: fadeIn 0.2s ease;
}

.modal-enter-active .modal-card {
  animation: slideUp 0.25s ease;
}

.modal-leave-active {
  animation: fadeIn 0.2s ease reverse;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .realtime-page {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .app-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card {
    padding: 16px;
  }

  .btn {
    padding: 10px 20px;
  }

  .shortcut-btn {
    padding: 7px 12px;
    font-size: 12px;
  }

  .key {
    height: 38px;
    font-size: 12px;
  }
  .keyboard {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .keyboard-inner {
    min-width: 560px;
  }

  .modal-card {
    padding: 20px;
  }
  /* 空白滑动区：与键盘同宽、可横向滚动，高度给足手指滑动空间 */
  .keyboard-scroll-strip {
    display: block;
    flex-shrink: 0;
    height: 40px;
    min-width: 560px; /* 与 .keyboard-inner 的 min-width 保持一致 */
    width: max-content;
    border: 1px solid var(--primary); /* 边框用主色，更显眼 */
    border-radius: 6px;
    background: var(--primary-soft); /* 有透明度的主色背景 */

    /* 关键：让触摸滑动走浏览器横向滚动，而不是点击按键 */
    touch-action: pan-x;
    -webkit-overflow-scrolling: touch;
  }
  .keyboard-scroll-strip:active {
    border-color: #d1d5db;
  }
}
</style>
