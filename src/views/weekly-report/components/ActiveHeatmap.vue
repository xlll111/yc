<!-- 星期 × 小时活跃热力图：X 轴 0-23，Y 轴周一~周日，visualMap 映射心跳密度。
     < 640px 时隐藏 Y 轴（由 ResizeObserver 按容器实际宽度驱动） -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { init } from 'echarts/core'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { WEEKDAY_LABELS } from '../utils/aggregator'

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

const props = defineProps<{
  /** 7x24 心跳密度矩阵，[weekday][hour] = 心跳条数 */
  heatmap: number[][]
}>()

const el = ref<HTMLDivElement>()
let chart: EChartsType | null = null
let observer: ResizeObserver | null = null

/** 容器是否为紧凑布局（< 640px）—— 决定 Y 轴显隐 */
const isCompact = ref(false)

/** 二维矩阵 → ECharts heatmap 三元组 [x(小时), y(星期), value] */
function toHeatData(matrix: number[][]): Array<[number, number, number]> {
  const arr: Array<[number, number, number]> = []
  matrix.forEach((row, dayIdx) => {
    row.forEach((count, hour) => arr.push([hour, dayIdx, count]))
  })
  return arr
}

function buildOption(): EChartsCoreOption {
  const data = toHeatData(props.heatmap)
  // 动态上限（下限 10 避免全空 / 极稀数据导致色带失效）
  const maxCount = Math.max(10, ...props.heatmap.flat())

  return {
    grid: { left: 8, right: 12, top: 10, bottom: 52, containLabel: true },
    tooltip: {
      confine: true,
      backgroundColor: 'rgba(28, 35, 51, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p: any) => {
        const [hour, dayIdx, count] = p.value as [number, number, number]
        const next = String((hour + 1) % 24).padStart(2, '0')
        return `<b>${WEEKDAY_LABELS[dayIdx]}</b> ${String(hour).padStart(2, '0')}:00 – ${next}:00<br/>心跳数：<b>${count}</b> 次`
      },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')),
      splitArea: { show: false },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d5dbe7' } },
      axisLabel: { color: '#6b7385', fontSize: 11, interval: isCompact.value ? 3 : 2 },
    },
    yAxis: {
      type: 'category',
      data: WEEKDAY_LABELS,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#6b7385', fontSize: 11 },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 90,
      precision: 0,
      text: ['密集', '稀疏'],
      textStyle: { color: '#6b7385', fontSize: 11 },
      // 心跳密度色带：浅 → 深
      inRange: { color: ['#eef2fb', '#a9c1f5', '#4c7bff', '#1d3fa8'] },
    },
    series: [
      {
        type: 'heatmap',
        data,
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(28, 35, 51, 0.35)' } },
      },
    ],
  }
}

/** 响应式微调：小屏隐藏 Y 轴（需求：< 640px），并放宽 X 轴标签间隔 */
function applyResponsiveOption() {
  chart?.setOption({
    yAxis: { show: !isCompact.value },
    xAxis: { axisLabel: { interval: isCompact.value ? 3 : 2 } },
  })
}

onMounted(() => {
  chart = init(el.value as HTMLDivElement)
  chart.setOption(buildOption())

  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      chart?.resize()
      const compact = entry.contentRect.width < 640 // 以容器实际宽度判断，而非视口
      if (compact !== isCompact.value) {
        isCompact.value = compact
        applyResponsiveOption()
      }
    }
  })
  observer.observe(el.value as HTMLDivElement)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})

watch(
  () => props.heatmap,
  () => chart?.setOption(buildOption()),
)
</script>

<template>
  <section class="wr-card chart-card">
    <header class="chart-head">
      <h3>活跃时段分布</h3>
      <span class="chart-sub">星期 × 小时的心跳密度</span>
    </header>
    <div ref="el" class="chart-body active-heatmap" />
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

.active-heatmap {
  height: 330px;
  @media (max-width: 639px) {
    height: 270px;
  }
}
</style>
