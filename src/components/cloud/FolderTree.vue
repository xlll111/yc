<!-- 目录树视图：懒加载子层，缩进 22px，chevron 旋转 90°；展开状态存 store -->
<script setup lang="ts">
// FolderTree.vue <script setup>（修正版）
import { computed, type Ref } from 'vue'
import { useCloudStore } from '@/stores/cloudStore'
import FileIcon from '@/components/cloud/FileIcon.vue'
import { formatFileSize } from '@/composables/cloudHelpers'
import type { FileItem, FolderItem } from '@/stores/cloudStore'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ downloadingIds: Ref<Set<number>> }>()

defineEmits<{
  (e: 'enter-folder', folder: FolderItem | null): void
  (e: 'open-folder-detail', folder: FolderItem): void
  (e: 'open-file-detail', file: FileItem): void
  (e: 'download', file: FileItem): void
}>()

const store = useCloudStore()

interface TreeRow {
  key: string
  kind: 'root' | 'folder' | 'file'
  depth: number
  item?: any
  expanded?: boolean
  loading?: boolean
}

const rows = computed<TreeRow[]>(() => {
  const out: TreeRow[] = []
  const rootNode = store.treeCache.get('root')
  const rootExpanded = store.treeExpandedPaths.has('root')
  out.push({
    key: 'root',
    kind: 'root',
    depth: 0,
    expanded: rootExpanded,
    loading: !!rootNode?.loading,
  })
  if (rootExpanded && rootNode?.loaded) {
    rootNode.folders.forEach((f) => pushFolder(f, 1))
    rootNode.files.forEach((file) =>
      out.push({ key: `f-${file.id}`, kind: 'file', item: file, depth: 1 }),
    )
  }
  return out

  function pushFolder(f: any, depth: number) {
    const key = String(f.id)
    const node = store.treeCache.get(key)
    const expanded = store.treeExpandedPaths.has(key)
    out.push({ key, kind: 'folder', item: f, depth, expanded, loading: !!node?.loading })
    if (expanded && node?.loaded) {
      node.folders.forEach((c) => pushFolder(c, depth + 1))
      node.files.forEach((file) =>
        out.push({ key: `f-${file.id}`, kind: 'file', item: file, depth: depth + 1 }),
      )
    }
  }
})

function onToggle(key: string, id: number | null) {
  if (store.toggleTreeExpand(key)) store.loadTreeNode(id)
}
function onName(row: TreeRow) {
  if (row.kind === 'file') return // 文件名点击不导航（详情走操作列）
  if (row.kind === 'folder') return // 名称点击不导航，进入用操作/父级视图
}
</script>

<template>
  <div class="folder-tree">
    <div
      v-for="row in rows"
      :key="row.key"
      class="tree-row"
      :style="{ paddingLeft: Math.min(12 + row.depth * 22, 120) + 'px' }"
    >
      <!-- 文件无展开箭头 -->
      <span v-if="row.kind === 'file'" class="chevron-spacer" />
      <button
        v-else
        class="chevron"
        :class="{ open: row.expanded }"
        :aria-label="row.expanded ? '收起' : '展开'"
        @click.stop="onToggle(row.key, row.kind === 'root' ? null : row.item.id)"
      >
        <Spinner v-if="row.loading" inline size="tiny" />
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <FileIcon
        :name="row.kind === 'root' ? '' : row.item.name"
        :is-folder="row.kind !== 'file'"
        :box="28"
      />

      <!-- 文件名/文件夹名包裹层，负责 tooltip 定位 -->
      <span class="name-wrap" :data-fullname="row.kind === 'root' ? '我的云盘' : row.item.name">
        <span class="tree-name" :class="{ link: row.kind !== 'file' }" @click="onName(row)">{{
          row.kind === 'root' ? '我的云盘' : row.item.name
        }}</span>
      </span>

      <span class="tree-meta">{{ row.kind === 'file' ? formatFileSize(row.item.size) : '' }}</span>
      <span class="tree-acts">
        <template v-if="row.kind === 'file'">
          <button
            class="icon-btn"
            :disabled="downloadingIds.value.has(row.item.id)"
            :title="downloadingIds.value.has(row.item.id) ? '下载中' : '下载'"
            @click="$emit('download', row.item)"
          >
            <Spinner v-if="downloadingIds.value.has(row.item.id)" size="tiny" />
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 4v12" />
              <path d="M7 11l5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
          </button>
        </template>
        <template v-else-if="row.kind === 'folder'">
          <button
            class="icon-btn"
            title="文件夹详情"
            @click="$emit('open-folder-detail', row.item)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-5" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </template>
      </span>
    </div>
    <p v-if="rows.length === 1" class="tree-hint">点击左侧箭头展开「我的云盘」</p>
  </div>
</template>

<style scoped>
.folder-tree {
  background: var(--c-card, #ffffff);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  box-shadow: var(--sh-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  padding: 8px 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  /* 注意：overflow-x: hidden 会裁掉垂直方向吗？不会，只裁 x。
     但为保险，tooltip 放下面，且 .tree-row 不设 overflow。 */
}
.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 8px 0;
  border-radius: var(--r-card, 8px);
  transition: background 0.2s ease;

  width: 100%;
  max-width: 100%;
  box-sizing: border-box; /* 让内联 paddingLeft 算进宽度 */
  min-width: 0; /* 让 .tree-name 能真正收缩 */
}
.tree-row:hover {
  background: var(--c-hover, #fafbfc);
}

.chevron,
.chevron-spacer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.chevron:hover {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text, #374151);
}
.chevron svg {
  width: 16px;
  height: 16px;
  transform: rotate(0deg);
  transition: transform 0.2s ease;
}
.chevron.open svg {
  transform: rotate(90deg);
}

/* ===== 名称包裹层 + tooltip ===== */

/* 包裹层：定位参考，不裁剪 */
.name-wrap {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: block; /* 让它占满剩余空间，内部 .tree-name 才能正确截断 */
}

/* 名称本身：只负责截断 */
.tree-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--c-text, #374151);
}
.tree-name.link {
  cursor: pointer;
}
.tree-name.link:hover {
  color: var(--c-primary, #1e40af);
}

/* 气泡本体 */
.name-wrap[data-fullname]::after {
  content: attr(data-fullname);
  position: absolute;
  left: 0;
  top: calc(100% + 10px);
  z-index: 100;
  max-width: min(360px, 80vw);
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(17, 24, 39, 0.96);
  color: #f9fafb;
  font-size: 12px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-all;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

/* 小三角 */
.name-wrap[data-fullname]::before {
  content: '';
  position: absolute;
  left: 14px;
  top: calc(100% + 4px);
  z-index: 101;
  border: 6px solid transparent;
  border-bottom-color: rgba(17, 24, 39, 0.96);
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

/* 悬停显示 */
.name-wrap[data-fullname]:hover::after,
.name-wrap[data-fullname]:hover::before {
  opacity: 1;
  transform: translateY(0);
}

.tree-meta {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--c-text-weak, #9ca3af);
  text-align: right;
}
.tree-acts {
  flex: none;
  display: inline-flex;
  gap: 4px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn svg {
  width: 17px;
  height: 17px;
}
.icon-btn:hover:not(:disabled) {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-primary, #1e40af);
}
.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tree-hint {
  margin: 8px 12px;
  font-size: 13px;
  color: var(--c-text-weak, #9ca3af);
}

@media (max-width: 768px) {
  .tree-meta {
    display: none;
  }
  .tree-row {
    padding-right: 8px;
  }
  /* 移动端隐藏 tooltip */
  .name-wrap[data-fullname]::after,
  .name-wrap[data-fullname]::before {
    display: none;
  }
}
</style>
