<!-- 每日在线时长柱状图（Y 轴单位：小时），附日均参考线；ResizeObserver 自适应 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { graphic, init } from 'echarts/core'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import { WEEKDAY_LABELS } from '../utils/aggregator'
import { formatDuration } from '../utils/sanitizer'

// ECharts 按需注册（echarts.use 幂等，可安全重复调用）
echarts.use([BarChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  /** 每日在线秒数，下标 0 = 周一，长度 7 */
  daily: number[]
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
  // 秒 → 小时（保留 2 位，tooltip 精确还原秒级格式化）
  const data = props.daily.map((s) => +(s / 3600).toFixed(2))

  return {
    grid: { left: 8, right: 14, top: 34, bottom: 0, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(47, 92, 216, 0.06)' } },
      confine: true,
      backgroundColor: 'rgba(28, 35, 51, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0]
        return `<b>${p.name}</b><br/>在线时长：${formatDuration(props.daily[p.dataIndex] ?? 0)}`
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
      name: '小时',
      nameTextStyle: { color: '#6b7385', fontSize: 11, padding: [0, 0, 0, 4] },
      splitLine: { lineStyle: { color: '#edf0f6', type: 'dashed' } },
      axisLabel: { color: '#6b7385', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data,
        barMaxWidth: 34,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4c7bff' },
            { offset: 1, color: '#aac4ff' },
          ]),
        },
        // 日均参考线：帮助快速识别低于均值的天
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#a3adc2', type: 'dashed', width: 1 },
          label: {
            position: 'insideEndTop',
            color: '#6b7385',
            fontSize: 11,
            formatter: (p: any) => `日均 ${Math.round(p.value * 10) / 10}h`,
          },
          data: [{ type: 'average', name: '日均' }],
        },
      },
    ],
  }
}

onMounted(() => {
  chart = init(el.value as HTMLDivElement)
  chart.setOption(buildOption())

  // 容器尺寸自适应：ResizeObserver（而非 window.resize，兼容容器级布局变化）
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value as HTMLDivElement)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})

// 数据变更（周切换 / 容错降级兜底数组替换）时刷新图表
watch([() => props.daily, () => props.weekStart], () => chart?.setOption(buildOption()))
</script>

<template>
  <section class="wr-card chart-card">
    <header class="chart-head">
      <h3>每日在线时长</h3>
      <span class="chart-sub">按本地时区 · 心跳间隔 ≤ 90s 计为持续在线</span>
    </header>
    <div ref="el" class="chart-body online-trend" />
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

.online-trend {
  height: 300px;
  @media (max-width: 639px) {
    height: 240px;
  } /* 移动端压缩高度 */
}
</style>
