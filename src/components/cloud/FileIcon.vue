<!-- 文件类型图标：颜色沿用云盘镜像页映射；文档类以 SVG 内文字标识 -->
<script setup lang="ts">
import { computed } from 'vue'
import { getFileKind, getFileColor, FILE_TEXT_BADGE } from '@/composables/useFileIcon'
import type { FileKind } from '@/composables/useFileIcon'

const props = withDefaults(defineProps<{ name: string; isFolder?: boolean; box?: number }>(), {
  isFolder: false,
  box: 32,
})

const kind = computed<FileKind>(() => getFileKind(props.name, props.isFolder))
const color = computed(() => getFileColor(kind.value))
const badge = computed(() => FILE_TEXT_BADGE[kind.value])
</script>

<template>
  <span class="file-icon" :style="{ width: box + 'px', height: box + 'px', color }">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        v-if="kind === 'folder'"
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      />
      <template v-else-if="kind === 'image'">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 15l-5-5-4 4-2-2-4 4" />
      </template>
      <template v-else-if="kind === 'video'">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M10 9.5l5 2.5-5 2.5z" />
      </template>
      <template v-else-if="kind === 'audio'">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </template>
      <template v-else-if="kind === 'archive'">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 10h16M10 10v3h4v-3M10 17h4" />
      </template>
      <template v-else-if="kind === 'code'">
        <path d="M8 6l-5 6 5 6M16 6l5 6-5 6" />
        <path d="M13.5 4l-3 16" />
      </template>
      <template v-else>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 3v4h4" />
        <text
          v-if="badge"
          x="12"
          y="16.5"
          text-anchor="middle"
          font-size="7"
          font-weight="700"
          stroke="none"
          :fill="color"
        >
          {{ badge }}
        </text>
      </template>
    </svg>
  </span>
</template>

<style scoped>
/* 组件样式 */
.file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: var(--r-ic, 6px);
  background: var(--c-border-soft, #f3f4f6);
}
.file-icon svg {
  width: 66%;
  height: 66%;
}
</style>
