<!-- USB 设备会话 Top5 横向条形图：Y 轴为设备 ID 前 8 位（截断显示），
     条色区分授权状态（红 = 禁止接入设备） -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { init } from 'echarts/core'
import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { UsbDeviceStat } from '../utils/aggregator'
import { formatDuration, formatShortTime } from '../utils/sanitizer'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  /** 按会话总时长降序的设备统计（Top5） */
  items: UsbDeviceStat[]
}>()

const el = ref<HTMLDivElement>()
let chart: EChartsType | null = null
let observer: ResizeObserver | null = null

function buildOption(): EChartsCoreOption {
  const minutes = props.items.map((s) => +(s.totalSeconds / 60).toFixed(1))

  return {
    grid: { left: 8, right: 46, top: 12, bottom: 0, containLabel: true },
    tooltip: {
      confine: true,
      backgroundColor: 'rgba(28, 35, 51, 0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p: any) => {
        const stat = props.items[p.dataIndex] as UsbDeviceStat
        const denied =
          stat.allowed === false
            ? '<br/><span style="color:#ff9c9c">该设备为禁止接入设备</span>'
            : ''
        return `<b>${stat.volName}</b>（${stat.shortId}）<br/>完整 ID：${stat.usbId}<br/>累计 ${formatDuration(stat.totalSeconds)} · ${stat.sessionCount} 个会话<br/>最近活动：${formatShortTime(stat.lastActiveTime)}${denied}`
      },
    },
    xAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: '#6b7385', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf0f6', type: 'dashed' } },
      axisLabel: { color: '#6b7385', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      // Y 轴为截断后的设备 ID（前 8 位 + 省略号），inverse 保证 Top1 在最上方
      data: props.items.map((s) => s.shortId),
      inverse: true,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: '#55607a',
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        // 条色语义：禁止接入设备标红，形成与上方授权概览卡的归因呼应
        data: props.items.map((s, i) => ({
          value: minutes[i],
          itemStyle: {
            color: s.allowed === false ? '#d64545' : '#4c7bff',
            borderRadius: [0, 5, 5, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#6b7385',
          fontSize: 11,
          formatter: (p: any) => `${p.value}min`,
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

watch(
  () => props.items,
  () => chart?.setOption(buildOption()),
)
</script>

<template>
  <section class="wr-card chart-card">
    <header class="chart-head">
      <h3>USB 设备会话 Top 5</h3>
      <span class="legend"> <i class="dot ok" />允许 <i class="dot danger" />禁止 </span>
    </header>
    <div class="chart-wrap">
      <div ref="el" class="chart-body usb-top" />
      <div v-if="!items.length" class="chart-empty">本周无 USB 接入会话</div>
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
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--wr-text);
  }
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--wr-text-sub);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 3px;
    margin: 0 3px 0 8px;
    &:first-child {
      margin-left: 0;
    }
    &.ok {
      background: #4c7bff;
    }
    &.danger {
      background: #d64545;
    }
  }
}

.chart-wrap {
  position: relative;
}

.usb-top {
  height: 250px;
  @media (max-width: 639px) {
    height: 220px;
  }
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--wr-text-sub);
}
</style>
