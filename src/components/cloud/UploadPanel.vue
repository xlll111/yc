<!-- 上传队列浮层：右下角；移动端全屏抽屉；全部完成后 3s 自动收起（可关） -->
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useCloudStore } from '@/stores/cloudStore'
import { formatFileSize } from '@/composables/cloudHelpers'
import Spinner from '@/components/Spinner.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
const store = useCloudStore()

const STATUS_TEXT: Record<string, string> = {
  pending: '等待中',
  uploading: '上传中',
  paused: '已暂停',
  success: '成功',
  failed: '失败',
  canceled: '已取消',
  expired: '已过期',
}
const STATUS_CLS: Record<string, string> = {
  pending: 'gray',
  uploading: 'blue',
  paused: 'gray',
  success: 'green',
  failed: 'red',
  canceled: 'gray',
  expired: 'warn',
}

const tasks = computed(() => store.uploadQueue)
const hasActive = computed(() =>
  tasks.value.some((t) => t.status === 'uploading' || t.status === 'pending'),
)
const overall = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round(tasks.value.reduce((s, t) => s + (t.progress || 0), 0) / tasks.value.length)
})
const headText = computed(() =>
  hasActive.value
    ? `${store.uploadingCount} 个文件正在上传`
    : store.failedCount
      ? '部分文件上传失败'
      : '上传完成',
)

// 收起与自动收起
const collapsed = ref(false)
const autoCollapse = ref(true)
let autoTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => store.uploadingCount,
  (n, o) => {
    if (n > 0) {
      clearTimeout(autoTimer)
      collapsed.value = false
      return
    }
    if (o > 0 && n === 0) {
      // 全部完成：批量汇总提示
      if (store.failedCount) ElMessage.error(`${store.failedCount} 个文件上传失败`)
      else if (store.completedCount) ElMessage.success('全部上传完成')
      if (autoCollapse.value)
        autoTimer = setTimeout(() => {
          collapsed.value = true
        }, 3000)
    }
  },
)
onUnmounted(() => {
  clearTimeout(autoTimer)
  store.stopAllPolling()
})

// paused/无文件句柄的 failed：重新选择原文件后续传
const fileInput = ref<HTMLInputElement>()
const pendingTaskId = ref<string | null>(null)
function pick(task: any) {
  pendingTaskId.value = task.localId
  fileInput.value?.click()
}
function onPicked(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  el.value = ''
  if (!file || !pendingTaskId.value) return
  store.resumeUpload(pendingTaskId.value, file)
  pendingTaskId.value = null
}
function onAction(task: any) {
  if (task.status === 'uploading' || task.status === 'pending') store.cancelUpload(task.localId)
  else if (task.status === 'paused') pick(task)
  else if (task.status === 'failed') task.file ? store.retryUpload(task.localId) : pick(task)
  else store.removeUpload(task.localId)
}
const actionText = (s: string) =>
  s === 'uploading' || s === 'pending'
    ? '取消'
    : s === 'paused'
      ? '继续'
      : s === 'failed'
        ? '重试'
        : '移除'
</script>

<template>
  <div v-if="tasks.length" class="upload-panel" :class="{ collapsed }">
    <div class="panel-head" @click="collapsed = !collapsed">
      <Spinner v-if="hasActive" inline size="tiny" />
      <span class="head-text">{{ headText }}</span>
      <span v-if="hasActive" class="head-pct">{{ overall }}%</span>
      <div class="head-progress"><i :style="{ width: overall + '%' }" /></div>
      <label class="auto-collapse" @click.stop>
        <span class="auto-label">完成后收起</span>
        <ToggleSwitch v-model="autoCollapse" aria-label="全部完成后自动收起" />
      </label>
      <button
        class="fold"
        :aria-label="collapsed ? '展开' : '收起'"
        @click.stop="collapsed = !collapsed"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>

    <div v-show="!collapsed" class="panel-body">
      <div v-for="t in tasks" :key="t.localId" class="task">
        <div class="line1">
          <span class="t-name" :title="t.fileName">{{ t.fileName }}</span>
          <span class="badge" :class="STATUS_CLS[t.status]"><i />{{ STATUS_TEXT[t.status] }}</span>
        </div>
        <div class="line2">
          <span class="t-target" :title="t.targetFolderName"
            >→ {{ t.targetFolderName || '未知目录' }}</span
          >
          <span class="t-size">{{ formatFileSize(t.size) }}</span>
        </div>
        <div class="t-progress"><i :style="{ width: t.progress + '%' }" /></div>
        <div class="line3">
          <p v-if="t.errorMessage" class="t-err">{{ t.errorMessage }}</p>
          <span v-else class="t-hint">{{
            t.status === 'paused' ? '刷新后需重新选择原文件继续' : ''
          }}</span>
          <button class="t-btn" @click="onAction(t)">{{ actionText(t.status) }}</button>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" hidden @change="onPicked" />
  </div>
</template>

<style scoped>
/* 浮层：介于页面内容与弹窗之间 */
.upload-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1500;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: var(--c-card, #ffffff);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  box-shadow: var(--sh-pop, 0 8px 24px rgba(0, 0, 0, 0.1));
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
.head-text {
  flex: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text, #374151);
}
.head-pct {
  flex: none;
  font-size: 12px;
  color: var(--c-primary, #1e40af);
  font-weight: 500;
}
.head-progress {
  flex: 1;
  height: 4px;
  min-width: 40px;
  border-radius: 9999px;
  background: var(--c-border-soft, #f3f4f6);
  overflow: hidden;
}
.head-progress i {
  display: block;
  height: 100%;
  border-radius: 9999px;
  background: var(--c-primary, #1e40af);
  transition: width 0.2s ease;
}
.auto-collapse {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.auto-label {
  font-size: 12px;
  color: var(--c-text-sub, #6b7280);
  white-space: nowrap;
}
.fold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
}
.fold svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}
.upload-panel.collapsed .fold svg {
  transform: rotate(180deg);
}

.panel-body {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 16px 12px;
}
.task {
  padding: 12px 0;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
.task:last-child {
  border-bottom: none;
}

.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.t-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-text, #374151);
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
}
.badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.badge.gray {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text-sub, #6b7280);
}
.badge.blue {
  background: var(--c-primary-soft, rgba(30, 64, 175, 0.08));
  color: var(--c-primary, #1e40af);
}
.badge.green {
  background: var(--c-success-bg, #dcfce7);
  color: var(--c-success-text, #166534);
}
.badge.red {
  background: var(--c-danger-bg, #fef2f2);
  color: var(--c-danger-text, #b91c1c);
}
.badge.warn {
  background: var(--c-warn-bg, #fef3c7);
  color: var(--c-warn-text, #92400e);
}

.line2 {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}
.t-target {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--c-text-sub, #6b7280);
}
.t-size {
  flex: none;
  font-size: 12px;
  color: var(--c-text-weak, #9ca3af);
}

.t-progress {
  height: 4px;
  margin-top: 8px;
  border-radius: 9999px;
  background: var(--c-border-soft, #f3f4f6);
  overflow: hidden;
}
.t-progress i {
  display: block;
  height: 100%;
  border-radius: 9999px;
  background: var(--c-primary, #1e40af);
  transition: width 0.2s ease;
}

.line3 {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.t-err {
  flex: 1;
  margin: 0;
  font-size: 12px;
  color: var(--c-danger-text, #b91c1c);
}
.t-hint {
  flex: 1;
  margin: 0;
  font-size: 12px;
  color: var(--c-text-weak, #9ca3af);
}
.t-btn {
  flex: none;
  padding: 4px 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.t-btn:hover {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text, #374151);
}

/* 响应式：全屏抽屉 */
@media (max-width: 768px) {
  .upload-panel {
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: none;
    height: 70vh;
    border-radius: var(--r-card, 8px) var(--r-card, 8px) 0 0;
  }
  .panel-body {
    max-height: calc(70vh - 56px);
  }
  .auto-collapse {
    display: none;
  }
}
</style>
