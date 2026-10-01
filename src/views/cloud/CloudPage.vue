<!-- 全部文件页：页头 / 面包屑 / 工具栏 / LoadingState / 上传浮层 / 详情弹窗 -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import LoadingState from '@/components/LoadingState.vue'
import { useCloudStore } from '@/stores/cloudStore'
import { useFileActions } from '@/composables/useFileActions'
import { useFileDownload } from '@/composables/useFileDownload'
import CloudBreadcrumb from '@/components/cloud/CloudBreadcrumb.vue'
import CloudToolbar from '@/components/cloud/CloudToolbar.vue'
import FileTable from '@/components/cloud/FileTable.vue'
import FolderTree from '@/components/cloud/FolderTree.vue'
import UploadPanel from '@/components/cloud/UploadPanel.vue'
import ResourceDetailModal from '@/components/cloud/ResourceDetailModal.vue'
import PromptModal from '@/components/cloud/PromptModal.vue'

const store = useCloudStore()
const route = useRoute()
const router = useRouter()
const { acting, createFolder } = useFileActions()
const dl = useFileDownload()

// ---------- 页头 ----------
const pageTitle = computed(() => store.currentFolder?.name || '我的云盘')
const subText = computed(() =>
  store.isRoot
    ? `共 ${store.folders.length} 个文件夹`
    : `共 ${store.folders.length} 个文件夹 / ${store.files.length} 个文件`,
)

// ---------- 详情弹窗状态 ----------
const detail = reactive<{ visible: boolean; type: 'folder' | 'file'; item: any }>({
  visible: false,
  type: 'folder',
  item: null,
})
const openFolderDetail = (f: any) => {
  detail.type = 'folder'
  detail.item = f
  detail.visible = true
}
const openFileDetail = (f: any) => {
  detail.type = 'file'
  detail.item = f
  detail.visible = true
}

// ---------- 新建文件夹 ----------
const createVisible = ref(false)
async function onCreateConfirm(name: string) {
  if (await createFolder(name)) createVisible.value = false
}

// ---------- 列表导航（向下进入子级）与树导航 ----------
const onEnterChild = (folder: any) => store.enterFolder(folder.id, folder.name)
const onBreadcrumb = (i: number) => store.goToBreadcrumbIndex(i)

// ---------- 刷新 ----------
async function onRefresh() {
  const ok = await store.refreshCurrentFolder()
  if (ok) ElMessage.success('刷新成功')
}
function onRetry() {
  store.refreshCurrentFolder()
}
function onChanged() {
  store.refreshCurrentFolder(true)
}

// ---------- LoadingState 状态（TODO: props 按现有组件实现微调） ----------
const wrapper = computed(() => {
  if (store.viewMode === 'tree') {
    const root = store.treeCache.get('root')
    // 树自身的加载/错误由树内 spinner 呈现，这里只兜底空态
    return { loading: false, error: '', empty: !!root && root.loaded && root.folders.length === 0 }
  }
  return {
    loading: store.listLoading,
    error: !!store.listError,
    errorText: store.listError || '',
    empty:
      !store.listLoading &&
      !store.listError &&
      store.visibleFolders.length === 0 &&
      store.visibleFiles.length === 0,
  }
})
const emptyText = computed(() => {
  if (store.keyword.trim()) return '没有匹配的文件，换个关键词试试'
  return store.isRoot ? '暂无文件夹，点击新建' : '暂无文件，点击上传或新建文件夹'
})

// ---------- 上传：按钮选择 ----------
function onPickUpload(e: Event) {
  const el = e.target as HTMLInputElement
  const list = Array.from(el.files || [])
  el.value = ''
  if (!list.length) return
  store.enqueueUpload(list, store.currentFolderId!, store.currentFolder?.name || '当前文件夹')
}

// ---------- 上传：整页拖拽 ----------
const dragDepth = ref(0)
const dragActive = computed(() => dragDepth.value > 0)
function onDragEnter(e: DragEvent) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  dragDepth.value++
}
function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}
function onDrop(e: DragEvent) {
  dragDepth.value = 0
  const list = Array.from(e.dataTransfer?.files || [])
  if (!list.length) return
  if (store.isRoot) {
    ElMessage.warning('请先进入一个文件夹再上传')
    return
  }
  store.enqueueUpload(list, store.currentFolderId!, store.currentFolder?.name || '当前文件夹')
}

// ---------- 生命周期：query 初始化 / viewMode / 清理 ----------
onMounted(() => {
  const q = route.query.folder
  const id = q ? Number(q) : null
  // TODO: 深链无法还原中间层级名，先按单层进入
  if (id && !Number.isNaN(id)) store.navigateTo(id, `文件夹 #${id}`)
  else store.goRoot()
  store.restoreUploadSessions()
})
watch(
  () => store.currentFolderId,
  (id) => {
    router.replace({ query: id == null ? {} : { folder: String(id) } }).catch(() => {})
  },
)
watch(
  () => store.viewMode,
  (v) => {
    if (v === 'tree') store.openTreeRoot()
  },
  { immediate: true },
)
onUnmounted(() => {
  store.stopAllPolling()
})
// watchEffect(() => {
//   console.log(
//     'listError =',
//     JSON.stringify(store.listError),
//     'wrapper.error =',
//     wrapper.value.error,
//   )
// })
</script>

<template>
  <!-- 根节点：flex 1，交给外层滚动，不做 fixed -->
  <div
    class="cloud-page"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <div class="page-container">
      <!-- 页头 -->
      <header class="page-head">
        <div class="head-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p class="page-sub">{{ subText }}</p>
        </div>
        <div class="head-actions">
          <label
            class="primary-btn upload-trigger"
            :class="{ disabled: store.isRoot }"
            :title="store.isRoot ? '请先进入一个文件夹' : ''"
          >
            <input type="file" multiple hidden :disabled="store.isRoot" @change="onPickUpload" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
            <span>上传文件</span>
          </label>
          <button class="secondary-btn" @click="createVisible = true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>新建文件夹</span>
          </button>
        </div>
      </header>

      <CloudBreadcrumb :items="store.breadcrumb" @navigate="onBreadcrumb" />

      <CloudToolbar
        :keyword="store.keyword"
        :sort-key="store.sortKey"
        :sort-order="store.sortOrder"
        :view-mode="store.viewMode"
        @update:keyword="store.setKeyword"
        @update:sort-key="store.setSort"
        @update:sort-order="store.setSortOrder"
        @update:view-mode="store.setViewMode"
        @search="() => {}"
        @refresh="onRefresh"
      />

      <!-- 内容区：所有异步数据区域必须 LoadingState 包裹 -->
      <LoadingState
        :loading="wrapper.loading"
        :error="wrapper.error"
        :error-text="wrapper.errorText || undefined"
        :empty="wrapper.empty"
        :empty-title="emptyText"
        @retry="onRetry"
      >
        <FileTable
          v-if="store.viewMode === 'list'"
          :folders="store.visibleFolders"
          :files="store.visibleFiles"
          :downloading-ids="dl.downloadingIds"
          @open-folder="onEnterChild"
          @open-folder-detail="openFolderDetail"
          @open-file-detail="openFileDetail"
          @download="dl.downloadFile"
        />
        <FolderTree
          v-else
          :downloading-ids="dl.downloadingIds"
          @enter-folder="() => {}"
          @open-folder-detail="openFolderDetail"
          @open-file-detail="openFileDetail"
          @download="dl.downloadFile"
        />
      </LoadingState>
    </div>

    <!-- 整页拖拽 dropzone -->
    <div v-if="dragActive" class="dropzone" aria-hidden="true">
      <div class="drop-inner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
        <p>{{ store.isRoot ? '请先进入一个文件夹再上传' : '松开鼠标开始上传' }}</p>
      </div>
    </div>

    <!-- 上传队列浮层（内部读取 store） -->
    <UploadPanel />

    <!-- 详情弹窗 -->
    <ResourceDetailModal
      :visible="detail.visible"
      :resource-type="detail.type"
      :resource="detail.item"
      :downloading="dl.isDownloading(detail.item?.id)"
      @close="detail.visible = false"
      @download="dl.downloadFile"
      @changed="onChanged"
    />

    <!-- 新建文件夹 -->
    <PromptModal
      :visible="createVisible"
      title="新建文件夹"
      label="文件夹名称"
      placeholder="请输入文件夹名称"
      confirm-text="创建"
      :submitting="acting"
      @close="createVisible = false"
      @confirm="onCreateConfirm"
    />
  </div>
</template>

<style scoped>
/* CSS 变量（沿 DOM 继承供子组件消费） */
.cloud-page {
  --c-primary: #1e40af;
  --c-primary-deep: #1e3a8a;
  --c-primary-soft: rgba(30, 64, 175, 0.08);
  --c-text: #374151;
  --c-text-sub: #6b7280;
  --c-text-weak: #9ca3af;
  --c-border: #e5e7eb;
  --c-border-soft: #f3f4f6;
  --c-bg: #f9fafb;
  --c-card: #ffffff;
  --c-hover: #fafbfc;
  --c-success-bg: #dcfce7;
  --c-success-text: #166534;
  --c-danger: #ef4444;
  --c-danger-bg: #fef2f2;
  --c-danger-text: #b91c1c;
  --c-warn-bg: #fef3c7;
  --c-warn-text: #92400e;
  --r-card: 8px;
  --r-pill: 9999px;
  --r-ic: 6px;
  --r-thumb: 16px;
  --sh-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  --sh-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
  --sh-pop: 0 8px 24px rgba(0, 0, 0, 0.1);

  flex: 1;
  width: 100%;
  background: var(--c-bg);
}

/* 容器 */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* 页头 */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.page-title {
  margin: 0 0 6px;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--c-primary);
}
.page-sub {
  margin: 0;
  font-size: 13px;
  color: var(--c-text-sub);
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}

/* 按钮 */
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 30px;
  border: none;
  border-radius: var(--r-pill);
  background: var(--c-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.primary-btn svg {
  width: 18px;
  height: 18px;
}
.primary-btn:hover:not(.disabled) {
  background: var(--c-primary-deep);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}
.primary-btn:active:not(.disabled) {
  transform: none;
  box-shadow: none;
}
.primary-btn.disabled,
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.upload-trigger {
  user-select: none;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 26px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-pill);
  background: var(--c-card);
  color: var(--c-text);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.secondary-btn svg {
  width: 18px;
  height: 18px;
}
.secondary-btn:hover {
  background: var(--c-bg);
  border-color: var(--c-text-weak);
}

/* 拖拽遮罩 */
.dropzone {
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: rgba(249, 250, 251, 0.92);
}
.drop-inner {
  position: absolute;
  inset: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 2px dashed var(--c-primary);
  border-radius: var(--r-thumb);
  color: var(--c-primary);
}
.drop-inner svg {
  width: 48px;
  height: 48px;
}
.drop-inner p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  .page-head {
    flex-direction: column;
    gap: 12px;
  }
  .page-title {
    font-size: 24px;
  }
  .head-actions {
    width: 100%;
  }
  .head-actions .primary-btn,
  .head-actions .secondary-btn {
    flex: 1;
    justify-content: center;
  }
  .drop-inner {
    inset: 8px;
  }
}
@media (max-width: 480px) {
  .head-actions .secondary-btn span {
    display: none;
  }
  .head-actions .secondary-btn {
    padding: 10px 20px;
  }
}
</style>
