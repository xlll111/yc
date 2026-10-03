<!-- DNS 每日请求 / 风险命中柱状图（Y 轴单位：次）；ResizeObserver 自适应 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { graphic, init } from 'echarts/core'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import { WEEKDAY_LABELS } from '../utils/aggregator'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  /** 每日 DNS 请求总数，下标 0 = 周一，长度 7 */
  dailyTotal: number[]
  /** 每日风险命中数，下标 0 = 周一，长度 7 */
  dailyRisk: number[]
  /** 周一日期 YYYY-MM-DD，用于 X 轴日期标签 */
  weekStart: string
}>()

const el = ref<HTMLDivElement>()
let chart: EChartsType | null = null
let observer: ResizeObserver | null = null

/** X 轴标签："09/01 周一" */
function dayLabels(): string[] {
  const start = dayjs(props.weekStart)
  return WEEKDAY_LABELS.map((w, i) => `${start.add(i, 'day').format('MM/DD')} ${w}`)
}

function buildOption(): EChartsCoreOption {
  const total = props.dailyTotal ?? []
  const risk = props.dailyRisk ?? []

  return {
    grid: { left: 8, right: 14, top: 40, bottom: 0, containLabel: true },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 14,
      textStyle: { color: '#6b7385', fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(47, 92, 216, 0.06)' } },
      confine: true,
      backgroundColor: 'rgba(28, 35, 51, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const rows = Array.isArray(params) ? params : [params]
        const i = rows[0]?.dataIndex ?? 0
        const t = total[i] ?? 0
        const r = risk[i] ?? 0
        const rate = t > 0 ? ((r / t) * 100).toFixed(1) : '0.0'
        return `<b>${rows[0]?.name ?? ''}</b><br/>DNS 请求：<b>${t}</b> 次<br/>风险命中：<b>${r}</b> 次<br/>风险占比：${rate}%`
      },
    },
    xAxis: {
      type: 'category',
      data: dayLabels(),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d5dbe7' } },
      axisLabel: { color: '#6b7385', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '次',
      nameTextStyle: { color: '#6b7385', fontSize: 11, padding: [0, 0, 0, 4] },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#edf0f6', type: 'dashed' } },
      axisLabel: { color: '#6b7385', fontSize: 11 },
    },
    series: [
      {
        name: 'DNS 请求',
        type: 'bar',
        data: total,
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4c7bff' },
            { offset: 1, color: '#b6ccff' },
          ]),
        },
      },
      {
        name: '风险命中',
        type: 'bar',
        data: risk,
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#e05858' },
            { offset: 1, color: '#f6c0c0' },
          ]),
        },
      },
    ],
  }
}

onMounted(() => {
  chart = init(el.value as HTMLDivElement)
  chart.setOption(buildOption())

  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value as HTMLDivElement)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})

watch([() => props.dailyTotal, () => props.dailyRisk, () => props.weekStart], () =>
  chart?.setOption(buildOption()),
)
</script>

<template>
  <section class="wr-card chart-card">
    <header class="chart-head">
      <h3>DNS 每日请求</h3>
      <span class="chart-sub">按本地时区 · 含风险命中构成</span>
    </header>
    <div ref="el" class="chart-body dns-trend" />
  </section>
</template>

<style lang="scss" scoped>
.chart-card {
  padding: 16px 18px 12px;
  overflow: hidden;
}

.chart-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--wr-text);
  }
  .chart-sub {
    font-size: 11.5px;
    color: var(--wr-text-sub);
  }
}

.dns-trend {
  height: 300px;
  @media (max-width: 639px) {
    height: 240px;
  }
}
</style>
