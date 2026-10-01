<!-- 工具栏：搜索（防抖300ms/回车）+ 排序 + 视图分段 + 刷新；sticky 吸顶 -->
<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  keyword: string
  sortKey: 'name' | 'size' | 'mtime'
  sortOrder: 'asc' | 'desc'
  viewMode: 'list' | 'tree'
}>()
const emit = defineEmits<{
  (e: 'update:keyword', v: string): void
  (e: 'update:sortKey', v: 'name' | 'size' | 'mtime'): void
  (e: 'update:sortOrder', v: 'asc' | 'desc'): void
  (e: 'update:viewMode', v: 'list' | 'tree'): void
  (e: 'search', v: string): void
  (e: 'refresh'): void
}>()

// 搜索防抖 300ms；回车立即触发
const localKeyword = ref(props.keyword)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.keyword,
  (v) => {
    if (v !== localKeyword.value) localKeyword.value = v
  },
)
watch(localKeyword, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:keyword', v)
    emit('search', v)
  }, 300)
})
function onEnter() {
  clearTimeout(debounceTimer)
  emit('update:keyword', localKeyword.value)
  emit('search', localKeyword.value)
}
onUnmounted(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="cloud-toolbar">
    <div class="tb-search">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input v-model="localKeyword" type="text" placeholder="搜索当前目录" @keyup.enter="onEnter" />
      <button v-if="localKeyword" class="clear" aria-label="清空" @click="localKeyword = ''">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <select
      class="tb-select"
      :value="sortKey"
      aria-label="排序字段"
      @change="emit('update:sortKey', ($event.target as HTMLSelectElement).value as any)"
    >
      <option value="name">名称</option>
      <option value="size">大小</option>
      <option value="mtime">修改时间</option>
    </select>
    <button
      class="icon-btn"
      :title="sortOrder === 'asc' ? '升序' : '降序'"
      @click="emit('update:sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 4v16" />
        <path :d="sortOrder === 'asc' ? 'M8 8l4-4 4 4' : 'M8 16l4 4 4-4'" />
      </svg>
    </button>

    <div class="tb-seg" role="tablist" aria-label="视图切换">
      <button
        type="button"
        :class="{ active: viewMode === 'list' }"
        title="列表视图"
        @click="emit('update:viewMode', 'list')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        :class="{ active: viewMode === 'tree' }"
        title="目录树视图"
        @click="emit('update:viewMode', 'tree')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 5h12M8 12h12M8 19h12" />
          <path d="M4 5v14" />
        </svg>
      </button>
    </div>

    <button class="icon-btn refresh" title="刷新" @click="emit('refresh')">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 11a8 8 0 1 0-2.34 6.34" />
        <path d="M20 4v7h-7" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* 吸顶工具栏 */
.cloud-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--c-bg, #f9fafb);
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  box-shadow: var(--sh-card, 0 2px 8px rgba(0, 0, 0, 0.08));
}

/* 搜索框 */
.tb-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 320px;
  padding: 0 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  background: var(--c-card, #ffffff);
  transition: all 0.2s ease;
}
.tb-search:focus-within {
  border-color: var(--c-primary, #1e40af);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.tb-search svg {
  width: 17px;
  height: 17px;
  flex: none;
  color: var(--c-text-weak, #9ca3af);
}
.tb-search input {
  flex: 1;
  min-width: 0;
  padding: 9px 0;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--c-text, #374151);
  background: transparent;
}
.tb-search input::placeholder {
  color: var(--c-text-weak, #9ca3af);
}
.tb-search .clear {
  display: inline-flex;
  border: none;
  background: transparent;
  padding: 4px;
  color: var(--c-text-weak, #9ca3af);
  cursor: pointer;
  border-radius: 9999px;
}
.tb-search .clear svg {
  width: 14px;
  height: 14px;
  color: inherit;
}
.tb-search .clear:hover {
  color: var(--c-text, #374151);
}

/* 排序下拉 */
.tb-select {
  padding: 9px 32px 9px 12px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  background: var(--c-card, #ffffff)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  appearance: none;
  -webkit-appearance: none;
  font-size: 14px;
  color: var(--c-text, #374151);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tb-select:focus {
  border-color: var(--c-primary, #1e40af);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

/* 图标按钮 */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  background: var(--c-card, #ffffff);
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn svg {
  width: 18px;
  height: 18px;
}
.icon-btn:hover {
  background: var(--c-bg, #f9fafb);
  border-color: var(--c-text-weak, #9ca3af);
  color: var(--c-text, #374151);
}

/* 视图分段 */
.tb-seg {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: var(--c-card, #ffffff);
}
.tb-seg button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 32px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.tb-seg button svg {
  width: 18px;
  height: 18px;
}
.tb-seg button.active {
  background: var(--c-primary, #1e40af);
  color: #fff;
}

/* 响应式 */
@media (max-width: 768px) {
  .cloud-toolbar {
    flex-wrap: wrap;
    position: static;
    padding: 12px;
  }
  .tb-search {
    flex-basis: 100%;
    max-width: none;
    order: -1;
    margin-bottom: 4px;
  }
}
@media (max-width: 480px) {
  .tb-select {
    flex: 1;
  }
}
</style>
