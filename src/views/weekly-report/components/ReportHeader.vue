<!-- 顶部信息与操作栏：客户端名称 / 版本 / 最后心跳（本地时区）、周期切换（打印时隐藏）、导出 PDF -->
<script setup lang="ts">
import dayjs from 'dayjs'
import { formatDateTime } from '../utils/sanitizer'

defineProps<{
  hostname: string
  version: string
  lastSeen: string
  note: string
  week: string
  weekLabel: string
  weekOptions: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{
  (e: 'change-week', week: string): void
  (e: 'export'): void
}>()

/** 浏览器时区标识（如 Asia/Shanghai），用于标注时间口径 */
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时区'

/** 打印留档时间 */
const printedAt = dayjs().format('YYYY-MM-DD HH:mm')

function onWeekChange(e: Event) {
  emit('change-week', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <header class="wr-card report-header">
    <div class="header-main">
      <div class="title-wrap">
        <h1>客户端运行周报</h1>
        <p class="meta">
          <span class="host">{{ hostname }}</span>
          <span class="note">{{ note }}</span>
          <span v-if="version" class="chip">v{{ version }}</span>
        </p>
      </div>

      <!-- 操作栏：打印时整体隐藏（.no-print） -->
      <div class="header-actions no-print">
        <label class="week-select">
          <span class="sr-only">统计周期</span>
          <select :value="week" @change="onWeekChange">
            <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <button class="btn-primary" @click="emit('export')">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7 8V4h10v4" />
            <rect x="4" y="8" width="16" height="7" rx="2" />
            <path d="M8 15h8v5H8z" />
          </svg>
          导出 PDF
        </button>
      </div>
    </div>

    <div class="header-sub">
      <span
        >统计周期：<b>{{ weekLabel }}</b></span
      >
      <span
        >最后心跳：<b class="tabular">{{ formatDateTime(lastSeen) }}</b
        >（{{ timezone }}）</span
      >
    </div>
    <!-- 打印留档：打印时间 -->
    <p class="print-only-title">打印时间：{{ printedAt }}（{{ timezone }}）</p>
  </header>
</template>

<style lang="scss" scoped>
.report-header {
  padding: 18px 20px 16px;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.title-wrap {
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--wr-text);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0 0;

    .host {
      font-size: 13px;
      color: var(--wr-text-sub);
    }

    .note {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: 4px;
      color: var(--wr-text-sub);
      background: var(--wr-fill-weak, rgba(0, 0, 0, 0.04));
      line-height: 1.6;
    }

    .chip {
      font-size: 11px;
      padding: 1px 8px;
      border-radius: 999px;
      background: var(--wr-brand-soft);
      color: var(--wr-brand);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 自绘下拉箭头 */
.week-select {
  position: relative;

  select {
    appearance: none;
    height: 34px;
    padding: 0 30px 0 12px;
    border: 1px solid var(--wr-border);
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    color: var(--wr-text);
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s ease;

    &:hover,
    &:focus {
      border-color: var(--wr-brand);
    }
  }

  &::after {
    content: '';
    position: absolute;
    right: 11px;
    top: 50%;
    width: 7px;
    height: 7px;
    border-right: 1.6px solid var(--wr-text-sub);
    border-bottom: 1.6px solid var(--wr-text-sub);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }
}

.header-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 24px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--wr-border);
  font-size: 12px;
  color: var(--wr-text-sub);

  b {
    color: var(--wr-text);
    font-weight: 600;
  }
}

.print-only-title {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--wr-text-sub);
}
</style>
