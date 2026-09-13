<!--
  容器组件：状态管理 / 布局分发 / 打印入口
  栅格策略（Tailwind 12 列）：
  - < 640px              ：单列堆叠（grid-cols-1），热力图组件内部隐藏 Y 轴
  - 640px ~ 1199px       ：主图区 / 归因区均 col-span-12
  - >= 1200px            ：主图区 col-span-8，归因区 col-span-4
    （min-[1200px]: 为 Tailwind 3.2+ 任意断点变体；低版本可改用 xl: 或扩展 screens）
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ReportHeader from './components/ReportHeader.vue'
import KpiCards from './components/KpiCards.vue'
import OnlineTrendChart from './components/OnlineTrendChart.vue'
import ActiveHeatmap from './components/ActiveHeatmap.vue'
import UsbTopChart from './components/UsbTopChart.vue'
import RiskListTable from './components/RiskListTable.vue'
import { useWeeklyReport } from './composables/useWeeklyReport'

const props = defineProps({
  uuid: { type: [String], default: '' },
  token: { type: [String], default: '' },
})
const route = useRoute()

// 统一取一个值：优先 props，其次 query
const finalUUID = computed(() => props.uuid || String(route.query.uuid ?? ''))
const finalToken = computed(() => props.token || String(route.query.token ?? ''))

const { week, weekOptions, weekRangeLabel, loading, error, aggregate, setWeek, retry } =
  useWeeklyReport(finalUUID.value, finalToken.value)

/** DNS 风险占比（比例条填充宽度，0 ~ 100） */
const dnsRiskPct = computed(() =>
  Math.min(100, (aggregate.value?.dnsRiskRate ?? 0) * 100).toFixed(1),
)

/** 导出 PDF：beforeprint 钩子会让表格展开全量数据，@media print 负责版式收敛 */
function handlePrint() {
  window.print()
}
</script>

<template>
  <div
    class="weekly-report mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6 md:py-6 flex flex-col gap-4 md:gap-5"
  >
    <!-- ==================== 加载中：骨架屏 ==================== -->
    <div v-if="loading" class="sk-wrap flex flex-col gap-4 md:gap-5" aria-busy="true">
      <div class="wr-skeleton" style="height: 96px" />
      <div class="grid grid-cols-2 sm:grid-cols-3 min-[1200px]:grid-cols-5 gap-4">
        <div
          v-for="i in 5"
          :key="i"
          class="wr-skeleton"
          :class="{ 'sk-wide': i === 5 }"
          style="height: 110px"
        />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div class="sm:col-span-12 min-[1200px]:col-span-8 flex flex-col gap-4">
          <div class="wr-skeleton" style="height: 360px" />
        </div>
        <div class="sm:col-span-12 min-[1200px]:col-span-4 flex flex-col gap-4">
          <div class="wr-skeleton" style="height: 170px" />
          <div class="wr-skeleton" style="height: 140px" />
          <div class="wr-skeleton" style="height: 250px" />
        </div>
      </div>
      <div class="wr-skeleton" style="height: 300px" />
    </div>

    <!-- ==================== 加载失败：错误态 + 重试 ==================== -->
    <div v-else-if="error" class="wr-error wr-card">
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#d64545" stroke-width="1.6" />
        <path d="M12 7.5v6" stroke="#d64545" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="12" cy="16.6" r="1.1" fill="#d64545" />
      </svg>
      <p class="err-title">数据加载失败</p>
      <p class="err-msg">{{ error.message }}</p>
      <button class="btn-primary" @click="retry">重新加载</button>
    </div>

    <!-- ==================== 正常内容 ==================== -->
    <template v-else-if="aggregate">
      <!-- 1. Header：周期切换 / 客户端信息 / 导出 -->
      <ReportHeader
        :hostname="aggregate.clientHostname"
        :version="aggregate.clientVersion"
        :last-seen="aggregate.lastSeen"
        :note="aggregate.note"
        :week="week"
        :week-label="weekRangeLabel"
        :week-options="weekOptions"
        @change-week="setWeek"
        @export="handlePrint"
      />

      <!-- 2. KPI 区：5 个核心指标卡 -->
      <KpiCards :aggregate="aggregate" />

      <!-- 3. 主图区(8列) + 归因区(4列) -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 md:gap-5">
        <!-- 主图区 -->
        <div class="sm:col-span-12 min-[1200px]:col-span-8 flex flex-col gap-4 md:gap-5">
          <OnlineTrendChart
            :daily="aggregate.dailyOnlineSeconds"
            :week-start="week"
          ></OnlineTrendChart>
          <ActiveHeatmap :heatmap="aggregate.hourlyHeatmap" />
        </div>

        <!-- 归因区 -->
        <div class="sm:col-span-12 min-[1200px]:col-span-4 flex flex-col gap-4 md:gap-5">
          <!-- USB 允许 / 禁止状态卡 -->
          <section class="wr-card attr-card">
            <header class="attr-head">
              <h3>USB 授权概览</h3>
              <span class="attr-tag">{{ aggregate.usbDeviceCount }} 台设备</span>
            </header>
            <div class="usb-split">
              <div class="usb-item ok">
                <strong class="tabular">{{ aggregate.usbAllowedCount }}</strong>
                <span>已允许</span>
              </div>
              <i class="v-divider" />
              <div class="usb-item danger">
                <strong class="tabular">{{ aggregate.usbDeniedCount }}</strong>
                <span>已禁止</span>
              </div>
            </div>
            <p v-if="aggregate.deniedUsbSessionCount > 0" class="attr-foot">
              禁止接入的设备本周仍产生
              <b>{{ aggregate.deniedUsbSessionCount }}</b> 次接入会话，建议关注
            </p>
            <p v-else class="attr-foot">禁止设备本周无接入记录</p>
          </section>

          <!-- DNS 风险比例卡 -->
          <section class="wr-card attr-card">
            <header class="attr-head">
              <h3>DNS 风险比例</h3>
              <span class="attr-tag">{{ aggregate.riskDnsList.length }} 个风险域名</span>
            </header>
            <div class="risk-ratio">
              <strong class="tabular"
                >{{ (aggregate.dnsRiskRate * 100).toFixed(1) }}<i>%</i></strong
              >
              <span>{{ aggregate.dnsRiskCount }} / {{ aggregate.dnsTotalCount }} 次命中</span>
            </div>
            <div class="ratio-track"><i :style="{ width: `${dnsRiskPct}%` }" /></div>
          </section>

          <!-- USB 设备会话 Top5 横向条形图 -->
          <UsbTopChart :items="aggregate.usbTopSessions" />
        </div>
      </div>

      <!-- 4. 明细区：Tabs 切换的风险 DNS / 敏感 USB 设备列表 -->
      <RiskListTable
        :risk-dns-list="aggregate.riskDnsList"
        :sensitive-devices="aggregate.sensitiveUsbDevices"
        :dns-total="aggregate.dnsTotalCount"
      />
    </template>
  </div>
</template>

<style lang="scss">
:root {
  --wr-bg: #f4f6fa;
  --wr-card: #ffffff;
  --wr-border: #e6eaf2;
  --wr-text: #1c2333;
  --wr-text-sub: #6b7385;
  --wr-brand: #2f5cd8;
  --wr-brand-soft: #eaf0fd;
  --wr-ok: #2e9e6b;
  --wr-risk: #d64545;
  --wr-warn: #d9822b;
  --wr-radius: 12px;
}

body {
  background: var(--wr-bg);
}

/* 通用卡片 */
.wr-card {
  background: var(--wr-card);
  border: 1px solid var(--wr-border);
  border-radius: var(--wr-radius);
  box-shadow:
    0 1px 2px rgba(23, 33, 61, 0.04),
    0 4px 16px rgba(23, 33, 61, 0.04);
}

/* 等宽数字（KPI / 表格数值对齐） */
.tabular {
  font-variant-numeric: tabular-nums;
}

/* 骨架屏基类：shimmer 扫光 */
.wr-skeleton {
  position: relative;
  overflow: hidden;
  background: #e8ecf4;
  border-radius: 10px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
    animation: wr-shimmer 1.4s ease-in-out infinite;
  }
}

@keyframes wr-shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* 主按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: var(--wr-brand);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.1s ease;

  &:hover {
    background: #274dbe;
  }
  &:active {
    transform: translateY(1px);
  }
}

/* ==================== 打印策略（集中管理） ==================== */
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  body {
    background: #fff !important;
  }

  /* 隐藏不必要操作栏：周期选择器、导出按钮、Tab 切换、分页等 */
  .no-print {
    display: none !important;
  }

  .weekly-report {
    max-width: none !important;
    padding: 0 !important;
    gap: 10px !important; /* 打印更紧凑 */
  }

  /* 所有卡片 / 图表容器禁止跨页截断 */
  .wr-card,
  .chart-body {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .wr-card {
    box-shadow: none !important;
    border-color: #d8dee9 !important;
  }

  /* 强制保留图表 / 徽标 / 热力图配色 */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 打印专用标题（标注当前明细类型、打印时间） */
  .print-only-title {
    display: block !important;
  }
}

.print-only-title {
  display: none;
}
</style>

<!-- 本组件 scoped：容器布局 / 归因卡 / 错误态 / 骨架布局 -->
<style lang="scss" scoped>
.weekly-report {
  width: 100%;
  max-width: 1200px;
  padding: 30px 15px 50px 15px;
}
.flex-direction {
  flex-direction: column;
}
/* ---- 骨架：小屏第 5 个 KPI 占满整行 ---- */
.sk-wide {
  grid-column: span 2 / span 2;
  @media (min-width: 640px) {
    grid-column: auto;
  }
}

/* ---- 错误态 ---- */
.wr-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;

  .err-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--wr-text);
  }
  .err-msg {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--wr-text-sub);
  }
}

/* ---- 归因区小卡片 ---- */
.attr-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attr-head {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--wr-text);
  }
}

.attr-tag {
  font-size: 12px;
  color: var(--wr-text-sub);
  background: #f0f3f9;
  border-radius: 999px;
  padding: 2px 10px;
}

.usb-split {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 4px 0;

  .usb-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    strong {
      font-size: 27px;
      font-weight: 650;
      letter-spacing: -0.5px;
    }
    span {
      font-size: 12px;
      color: var(--wr-text-sub);
    }

    &.ok strong {
      color: var(--wr-ok);
    }
    &.danger strong {
      color: var(--wr-risk);
    }
  }

  .v-divider {
    width: 1px;
    height: 36px;
    background: var(--wr-border);
  }
}

.attr-foot {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--wr-text-sub);

  b {
    color: var(--wr-risk);
    font-weight: 600;
  }
}

.risk-ratio {
  display: flex;
  align-items: baseline;
  gap: 10px;

  strong {
    font-size: 30px;
    font-weight: 650;
    letter-spacing: -0.5px;
    color: var(--wr-risk);

    i {
      font-style: normal;
      font-size: 14px;
      margin-left: 2px;
    }
  }

  span {
    font-size: 12px;
    color: var(--wr-text-sub);
  }
}

.ratio-track {
  height: 6px;
  border-radius: 999px;
  background: #eef1f7;
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--wr-risk);
    transition: width 0.5s ease;
  }
}
</style>
