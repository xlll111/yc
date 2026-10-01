<!-- 列表视图：名称 / 大小 / 修改时间 / 操作；移动端表格转卡片（data-label） -->
<script setup lang="ts">
import { computed, inject } from 'vue'
import FileIcon from '@/components/cloud/FileIcon.vue'
import { formatFileSize, resolveMtime } from '@/composables/cloudHelpers'
import type { FileItem, FolderItem } from '@/stores/cloudStore'

const props = defineProps<{
  folders: FolderItem[]
  files: FileItem[]
  downloadingIds: Set<number>
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
const isDownloading = (id: number) => props.downloadingIds.has(id)
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
            <button
              type="button"
              class="name link"
              :title="f.name"
              @click="$emit('open-folder', f)"
            >
              {{ f.name }}
            </button>
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
            <span class="name" :title="f.name">{{ f.name }}</span>
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
              <Spinner v-if="isDownloading(f.id)" size="tiny" />
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
  overflow: hidden;
}
table {
  width: 100%;
  border-collapse: collapse;
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
.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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
}
</style>
