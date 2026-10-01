<!-- 列表视图：名称 / 大小 / 修改时间 / 操作；移动端表格转卡片（data-label） -->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import FileIcon from '@/components/cloud/FileIcon.vue'
import { formatFileSize, resolveMtime } from '@/composables/cloudHelpers'
import type { FileItem, FolderItem } from '@/stores/cloudStore'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{
  folders: FolderItem[]
  files: FileItem[]
  downloadingIds: Ref<Set<number>>
}>()

defineEmits<{
  (e: 'open-folder', folder: FolderItem): void
  (e: 'open-folder-detail', folder: FolderItem): void
  (e: 'open-file-detail', file: FileItem): void
  (e: 'download', file: FileItem): void
}>()

// TODO: inject key 按项目实际确认
const $filters = inject<any>('$filters', { formatDateTime: (v: string) => v || '—' })
const fmt = (item: any) => $filters.formatDateTime(resolveMtime(item))
const isDownloading = (id: number) => props.downloadingIds.value.has(id)
const emptyRow = computed(() => props.folders.length === 0 && props.files.length === 0)
</script>

<template>
  <div class="file-table">
    <table>
      <thead>
        <tr>
          <th class="w-name">名称</th>
          <th class="w-size">大小</th>
          <th class="w-time">修改时间</th>
          <th class="w-acts">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in folders" :key="`fo-${f.id}`" class="row">
          <td data-label="名称" class="cell-name">
            <FileIcon :name="f.name" is-folder />
            <span class="name-wrap" :data-fullname="f.name">
              <button type="button" class="name link" @click="$emit('open-folder', f)">
                {{ f.name }}
              </button>
            </span>
          </td>
          <td data-label="大小" class="cell-plain">—</td>
          <td data-label="修改时间" class="cell-plain">{{ fmt(f) }}</td>
          <td data-label="操作" class="cell-acts">
            <button class="icon-btn" title="文件夹详情" @click="$emit('open-folder-detail', f)">
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
          </td>
        </tr>
        <tr v-for="f in files" :key="`fi-${f.id}`" class="row">
          <td data-label="名称" class="cell-name">
            <FileIcon :name="f.name" />
            <span class="name-wrap" :data-fullname="f.name">
              <span class="name">{{ f.name }}</span>
            </span>
          </td>
          <td data-label="大小" class="cell-plain">{{ formatFileSize(f.size) }}</td>
          <td data-label="修改时间" class="cell-plain">{{ fmt(f) }}</td>
          <td data-label="操作" class="cell-acts">
            <button
              class="icon-btn"
              :disabled="isDownloading(f.id)"
              :title="isDownloading(f.id) ? '下载中' : '下载'"
              @click="$emit('download', f)"
            >
              <Spinner v-if="isDownloading(f.id)" inline size="tiny" />
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
            <button class="icon-btn" title="文件详情" @click="$emit('open-file-detail', f)">
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
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.file-table {
  background: var(--c-card, #ffffff);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  box-shadow: var(--sh-card, 0 2px 8px rgba(0, 0, 0, 0.08));
  /* 注意：这里不再用 overflow: hidden，否则 tooltip 会被裁掉 */
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--c-text-sub, #6b7280);
  background: var(--c-bg, #f9fafb);
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
  white-space: nowrap;
}

/* 用子元素裁圆角，替代 .file-table 的 overflow: hidden */
thead th:first-child {
  border-top-left-radius: var(--r-card, 8px);
}
thead th:last-child {
  border-top-right-radius: var(--r-card, 8px);
}
tbody tr:last-child td:first-child {
  border-bottom-left-radius: var(--r-card, 8px);
}
tbody tr:last-child td:last-child {
  border-bottom-right-radius: var(--r-card, 8px);
}

tbody td {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--c-text, #374151);
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
tbody tr:last-child td {
  border-bottom: none;
}
tbody tr.row {
  transition: background 0.2s ease;
}
tbody tr.row:hover {
  background: var(--c-hover, #fafbfc);
}

.w-name {
  width: 46%;
}

.cell-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== 自定义 tooltip ===== */

/* 包裹层：负责定位，不裁剪 */
.name-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
  min-width: 0;
}

/* 文件名：只负责截断 */
.name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  vertical-align: middle;
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

button.name {
  border: none;
  background: transparent;
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: 9999px;
  font-size: 14px;
  cursor: pointer;
  color: inherit;
  text-align: left;
  transition: all 0.2s ease;
}
button.name:hover {
  color: var(--c-primary, #1e40af);
  background: var(--c-primary-soft, rgba(30, 64, 175, 0.08));
}

.cell-plain {
  white-space: nowrap;
  color: var(--c-text-sub, #6b7280);
}
.cell-acts {
  white-space: nowrap;
  text-align: right;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn svg {
  width: 18px;
  height: 18px;
}
.icon-btn:hover:not(:disabled) {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-primary, #1e40af);
}
.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式：表格转卡片 */
@media (max-width: 768px) {
  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
  }
  thead {
    display: none;
  }
  tbody tr.row {
    padding: 12px 16px;
    border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
  }
  tbody tr.row:hover {
    background: transparent;
  }
  tbody td {
    border: none;
    padding: 4px 0 4px 84px;
    position: relative;
  }
  tbody td::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    top: 6px;
    font-size: 12px;
    color: var(--c-text-sub, #6b7280);
  }
  .cell-name {
    padding-left: 84px;
  }
  .cell-name::before {
    content: '名称';
  }
  .cell-acts {
    text-align: right;
  }
  .cell-acts::before {
    top: 10px;
  }

  /* 移动端卡片模式：隐藏 tooltip */
  .name-wrap[data-fullname]::after,
  .name-wrap[data-fullname]::before {
    display: none;
  }
}
</style>
