<!-- 面包屑：根项「我的云盘」；移动端折叠为 … > 父级 > 当前 -->
<script setup lang="ts">
defineProps<{ items: Array<{ id: number | null; name: string }> }>()
defineEmits<{ (e: 'navigate', index: number): void }>()
</script>

<template>
  <nav class="breadcrumb" aria-label="目录路径">
    <!-- 根项 -->
    <button type="button" class="bc-item root" @click="$emit('navigate', 0)">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h5v-6h4v6h5V10" />
      </svg>
      <span>{{ items[0]?.name || '我的云盘' }}</span>
    </button>
    <!-- 移动端折叠省略号（桌面隐藏） -->
    <span v-if="items.length > 3" class="bc-ellipsis" aria-hidden="true">› …</span>
    <!-- 中间层级与当前项 -->
    <template v-for="(item, i) in items.slice(1)" :key="item.id ?? i">
      <span class="bc-sep" aria-hidden="true">›</span>
      <button
        v-if="i < items.length - 2"
        type="button"
        class="bc-item"
        :class="{ 'bc-mid': i < items.length - 3 }"
        @click="$emit('navigate', i + 1)"
      >
        {{ item.name }}
      </button>
      <span v-else class="bc-item current">{{ item.name }}</span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
  min-height: 24px;
}

.bc-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  padding: 4px 8px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  font-size: 13px;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
button.bc-item:hover {
  background: var(--c-primary-soft, rgba(30, 64, 175, 0.08));
  color: var(--c-primary, #1e40af);
}
.bc-item svg {
  width: 15px;
  height: 15px;
  flex: none;
}
.bc-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bc-item.current {
  padding: 4px 12px;
  cursor: default;
  font-weight: 500;
  color: var(--c-text, #374151);
  background: var(--c-border-soft, #f3f4f6);
  border-radius: 9999px;
}
.bc-sep {
  color: var(--c-text-weak, #9ca3af);
  font-size: 12px;
}
.bc-ellipsis {
  display: none;
  color: var(--c-text-weak, #9ca3af);
  font-size: 12px;
  white-space: nowrap;
}

/* 响应式：折叠中间层级 */
@media (max-width: 768px) {
  .bc-item {
    max-width: 160px;
  }
  .bc-mid {
    display: none;
  }
  .bc-ellipsis {
    display: inline;
  }
}
@media (max-width: 380px) {
  .bc-item {
    max-width: 120px;
  }
}
</style>
