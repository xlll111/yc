<!-- FileIcon.vue -->
<template>
  <span class="file-icon" :class="icon.cls">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(d, i) in icon.paths" :key="i" :d="d" />
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getFileIcon } from '@/constants/fileIcons'
const props = defineProps({ filename: { type: String, default: '' } })
const icon = computed(() => getFileIcon(props.filename))
</script>

<style scoped>
.file-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.file-icon svg {
  width: 100%;
  height: 100%;
}

/* 颜色 + 背景，直接写这里 */
.file-icon.icon-word {
  color: #2b579a;
  background: rgba(43, 87, 154, 0.1);
}
.file-icon.icon-excel {
  color: #217346;
  background: rgba(33, 115, 70, 0.1);
}
.file-icon.icon-ppt {
  color: #d24726;
  background: rgba(210, 71, 38, 0.1);
}
.file-icon.icon-pdf {
  color: #e5252a;
  background: rgba(229, 37, 42, 0.1);
}
.file-icon.icon-image {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}
.file-icon.icon-zip {
  color: #b45309;
  background: rgba(180, 83, 9, 0.1);
}
.file-icon.icon-video {
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
}
.file-icon.icon-audio {
  color: #db2777;
  background: rgba(219, 39, 119, 0.1);
}
.file-icon.icon-code {
  color: #0f766e;
  background: rgba(15, 118, 110, 0.1);
}
.file-icon.icon-file {
  color: var(--text-muted, #9ca3af);
  background: var(--border-light, #f3f4f6);
}
</style>
