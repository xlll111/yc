<!-- DNS 星期 × 小时风险命中热力图：与「DNS 活跃时段分布」共用同一坐标系，
     便于上下对照「请求量大的时段」与「风险集中的时段」。
     < 640px 时隐藏 Y 轴（由 ResizeObserver 按容器实际宽度驱动） -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { init } from 'echarts/core'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { WEEKDAY_LABELS } from '../utils/aggregator'

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

const props = withDefaults(
  defineProps<{
    /** 7×24 风险命中矩阵，[weekday][hour] = 命中次数 */
    riskHeatmap?: number[][]
    /** 7×24 请求总量矩阵（可选，仅用于 tooltip 展示命中率上下文） */
    totalHeatmap?: number[][]
  }>(),
  {
    riskHeatmap: () => [],
    totalHeatmap: () => [],
  },
)

const el = ref<HTMLDivElement>()
let chart: EChartsType | null = null
let observer: ResizeObserver | null = null

/** 容器是否为紧凑布局（< 640px）—— 决定 Y 轴显隐 */
const isCompact = ref(false)

/** 全周零命中：给出显式提示，避免与「无数据」混淆 */
const isEmpty = computed(() => !props.riskHeatmap.flat().some((n) => n > 0))

/** 二维矩阵 → ECharts heatmap 三元组 [x(小时), y(星期), value] */
function toHeatData(matrix: number[][]): Array<[number, number, number]> {
  const arr: Array<[number, number, number]> = []
  matrix.forEach((row, dayIdx) => {
    row.forEach((count, hour) => arr.push([hour, dayIdx, count]))
  })
  return arr
}

function buildOption(): EChartsCoreOption {
  const data = toHeatData(props.riskHeatmap)
  // 风险命中通常极稀疏：下限取 3，避免仅 0/1 两档就把整条色带占满
  const maxCount = Math.max(3, ...props.riskHeatmap.flat())

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
        const total = props.totalHeatmap?.[dayIdx]?.[hour] ?? 0
        const rate = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        return (
          `<b>${WEEKDAY_LABELS[dayIdx]}</b> ${String(hour).padStart(2, '0')}:00 – ${next}:00<br/>` +
          `风险命中：<b>${count}</b> 次<br/>` +
          `请求总量：<b>${total}</b> 次<br/>` +
          `命中率：<b>${rate}%</b>`
        )
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
      text: ['高', '低'],
      textStyle: { color: '#6b7385', fontSize: 11 },
      // 风险命中色带：冷红系，与「请求密度」的暖橙系形成语义区分
      inRange: { color: ['#fdf3f3', '#f2c0c0', '#dd7b7b', '#b32d2d'] },
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

/** 响应式微调：小屏隐藏 Y 轴，并放宽 X 轴标签间隔 */
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

watch([() => props.riskHeatmap, () => props.totalHeatmap], () => chart?.setOption(buildOption()))
</script>

<template>
  <section class="wr-card chart-card">
    <header class="chart-head">
      <h3>DNS 风险命中分布</h3>
      <span class="chart-sub">星期 × 小时的风险命中次数</span>
    </header>
    <div class="chart-wrap">
      <div ref="el" class="chart-body dns-risk-heatmap" />
      <p v-if="isEmpty" class="empty-hint">本周该客户端未命中任何风险域名</p>
    </div>
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

.chart-wrap {
  position: relative;
}

.dns-risk-heatmap {
  height: 330px;
  @media (max-width: 639px) {
    height: 270px;
  }
}

.empty-hint {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--wr-text-sub);
  background: rgba(255, 255, 255, 0.72);
  pointer-events: none;
  border-radius: 8px;
}
</style>
