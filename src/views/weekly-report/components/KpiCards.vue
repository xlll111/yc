<!-- 核心指标卡片群：在线率 / 总时长 / USB 设备数 / DNS 请求量 / 风险命中数 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklyReportAggregate } from '../utils/aggregator'
import { formatDuration } from '../utils/sanitizer'

const props = defineProps<{ aggregate: WeeklyReportAggregate }>()

/** 卡片数据视图：值统一走 tabular-nums 保证等宽对齐 */
const cards = computed(() => {
  const agg = props.aggregate
  return [
    {
      key: 'rate',
      label: '周在线率',
      value: (agg.onlineRate * 100).toFixed(1),
      unit: '%',
      hint: `在线 ${formatDuration(agg.totalOnlineSeconds)} / 168 小时`,
      bar: agg.onlineRate, // mini 进度条
      accent: 'is-brand',
    },
    {
      key: 'duration',
      label: '累计在线时长',
      value: (agg.totalOnlineSeconds / 3600).toFixed(1),
      unit: '小时',
      hint: `共 ${agg.onlineSessions.length} 个在线会话`,
      accent: '',
    },
    {
      key: 'usb',
      label: 'USB 接入设备',
      value: String(agg.usbDeviceCount),
      unit: '台',
      hint: `允许 ${agg.usbAllowedCount} 台 · 禁止 ${agg.usbDeniedCount} 台`,
      accent: agg.usbDeniedCount > 0 ? 'is-warn' : '',
    },
    {
      key: 'dns',
      label: 'DNS 请求量',
      value: agg.dnsTotalCount.toLocaleString('zh-CN'),
      unit: '次',
      hint: `覆盖 ${agg.dnsDomainCount} 个主域名`,
      accent: '',
    },
    {
      key: 'risk',
      label: '风险命中数',
      value: agg.dnsRiskCount.toLocaleString('zh-CN'),
      unit: '次',
      hint: `来自 ${agg.riskDnsList.length} 个域名 · 占比 ${(agg.dnsRiskRate * 100).toFixed(1)}%`,
      accent: 'is-risk',
    },
  ]
})

function pct(v: number): string {
  return `${Math.min(100, Math.max(0, v * 100)).toFixed(1)}%`
}
</script>

<template>
  <!-- 响应式：2 列 → 3 列(sm) → 5 列(>=1200px) -->
  <div class="grid grid-cols-2 sm:grid-cols-3 min-[1200px]:grid-cols-5 gap-4">
    <section
      v-for="(c, i) in cards"
      :key="c.key"
      class="wr-card kpi-card"
      :class="[c.accent, { 'kpi-wide': i === 4 }]"
    >
      <p class="kpi-label">{{ c.label }}</p>
      <p class="kpi-value tabular">
        <span class="num">{{ c.value }}</span>
        <span v-if="c.unit" class="kpi-unit">{{ c.unit }}</span>
      </p>
      <p v-if="c.hint" class="kpi-hint">{{ c.hint }}</p>
      <div v-if="c.bar !== undefined" class="kpi-track">
        <i class="kpi-fill" :style="{ width: pct(c.bar) }" />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.kpi-card {
  padding: 15px 17px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow:
      0 2px 4px rgba(23, 33, 61, 0.06),
      0 8px 22px rgba(23, 33, 61, 0.08);
  }
}

/* 小屏 2 列布局时，第 5 张卡占满整行，避免孤零零半格 */
.kpi-wide {
  grid-column: span 2 / span 2;
  @media (min-width: 640px) {
    grid-column: auto;
  }
}

.kpi-label {
  margin: 0;
  font-size: 12px;
  color: var(--wr-text-sub);
}

.kpi-value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;

  .num {
    font-size: 27px;
    font-weight: 650;
    letter-spacing: -0.5px;
    color: var(--wr-text);
    font-variant-numeric: tabular-nums; /* 等宽数字对齐 */
  }

  .kpi-unit {
    font-size: 12px;
    font-weight: 500;
    color: var(--wr-text-sub);
  }
}

.kpi-hint {
  margin: 0;
  font-size: 11.5px;
  color: var(--wr-text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 语义色 */
.kpi-card.is-brand .num {
  color: var(--wr-brand);
}
.kpi-card.is-risk .num {
  color: var(--wr-risk);
}
.kpi-card.is-warn .num {
  color: var(--wr-warn);
}

/* 在线率 mini 进度条 */
.kpi-track {
  margin-top: 2px;
  height: 4px;
  border-radius: 999px;
  background: #edf0f6;
  overflow: hidden;

  .kpi-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--wr-brand);
    transition: width 0.5s ease;
  }
}
</style>
