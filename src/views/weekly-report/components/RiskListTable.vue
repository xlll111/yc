<!-- 风险明细区：Tabs 切换「风险 DNS 域名列表」/「含敏感目录的 USB 设备列表」。
     分页 + 打印联动：beforeprint 触发展开全量数据并隐藏分页，afterprint 恢复。 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DnsDomainStat, SensitiveUsbDevice } from '../utils/aggregator'
import { formatShortTime } from '../utils/sanitizer'

const props = defineProps<{
  riskDnsList: DnsDomainStat[]
  sensitiveDevices: SensitiveUsbDevice[]
  dnsTotal: number
}>()

type TabKey = 'dns' | 'usb'
const activeTab = ref<TabKey>('dns')

const tabList = computed(() => [
  { key: 'dns' as const, label: '风险 DNS 域名', count: props.riskDnsList.length },
  { key: 'usb' as const, label: '敏感 USB 设备', count: props.sensitiveDevices.length },
])

/** 打印模式：由 beforeprint / afterprint 事件驱动 */
const printMode = ref(false)

/* ---- 前端分页 ---- */
const PAGE_SIZE = 8
const page = ref(1)

const activeList = computed<unknown[]>(() =>
  activeTab.value === 'dns' ? props.riskDnsList : props.sensitiveDevices,
)
const totalPages = computed(() => Math.max(1, Math.ceil(activeList.value.length / PAGE_SIZE)))

function paginate<T>(list: T[]): T[] {
  // 打印时展开全量数据（配合 @media print 隐藏分页控件）
  if (printMode.value) return list
  const start = (page.value - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
}

const dnsRows = computed(() => paginate(props.riskDnsList))
const usbRows = computed(() => paginate(props.sensitiveDevices))

// 切换 Tab / 数据源更新时回到第一页
watch([activeTab, () => props.riskDnsList, () => props.sensitiveDevices], () => {
  page.value = 1
})

function prevPage() {
  if (page.value > 1) page.value -= 1
}
function nextPage() {
  if (page.value < totalPages.value) page.value += 1
}

/** 打印时行号从全量列表起算 */
function rowIndex(i: number): number {
  return (printMode.value ? 0 : (page.value - 1) * PAGE_SIZE) + i + 1
}

function riskRate(row: DnsDomainStat): number {
  return row.total > 0 ? (row.risks / row.total) * 100 : 0
}

/** 敏感文件 chips：屏幕上最多展示 2 个 + "+N"，打印时全部展示 */
const FILE_PREVIEW = 2
function visibleFiles(dev: SensitiveUsbDevice) {
  const sensitive = dev.files.filter((f) => f.isSensitive)
  return printMode.value ? sensitive : sensitive.slice(0, FILE_PREVIEW)
}
function hiddenFileCount(dev: SensitiveUsbDevice): number {
  return printMode.value ? 0 : Math.max(0, dev.sensitiveCount - FILE_PREVIEW)
}

/* ---- 打印事件联动 ---- */
function onBeforePrint() {
  printMode.value = true
}
function onAfterPrint() {
  printMode.value = false
}

onMounted(() => {
  window.addEventListener('beforeprint', onBeforePrint)
  window.addEventListener('afterprint', onAfterPrint)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', onBeforePrint)
  window.removeEventListener('afterprint', onAfterPrint)
})

const currentTabLabel = computed(() =>
  activeTab.value === 'dns' ? '风险 DNS 域名列表' : '含敏感目录的 USB 设备列表',
)
</script>

<template>
  <section class="wr-card table-card">
    <header class="table-head">
      <h3>风险明细</h3>

      <!-- Tab 切换栏：打印时隐藏（纸质上无法交互） -->
      <nav class="tab-nav no-print">
        <button
          v-for="t in tabList"
          :key="t.key"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
        >
          {{ t.label }}<span class="badge tabular">{{ t.count }}</span>
        </button>
      </nav>

      <!-- 打印专用标题：标注当前展示的明细类型 -->
      <p class="print-only-title">{{ currentTabLabel }}</p>
    </header>

    <div class="table-scroll">
      <!-- ===== Tab 1：风险 DNS 域名列表 ===== -->
      <table v-if="activeTab === 'dns'" class="wr-table">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th>主域名</th>
            <th>风险命中</th>
            <th class="col-rate">风险率</th>
            <th>总请求</th>
            <th>最近命中时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in dnsRows" :key="row.domain">
            <td class="tabular col-idx">{{ rowIndex(i) }}</td>
            <td class="mono domain">{{ row.domain }}</td>
            <td>
              <span class="risk-chip tabular">{{ row.risks }}</span>
            </td>
            <td>
              <div class="risk-rate">
                <span class="tabular">{{ riskRate(row).toFixed(1) }}%</span>
                <i class="track"
                  ><i class="fill" :style="{ width: `${Math.max(4, riskRate(row))}%` }"
                /></i>
              </div>
            </td>
            <td class="tabular">{{ row.total }}</td>
            <td class="time tabular">{{ formatShortTime(row.lastRiskTime) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- ===== Tab 2：含敏感目录的 USB 设备列表 ===== -->
      <table v-else class="wr-table">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th>卷标</th>
            <th>设备 ID</th>
            <th>授权状态</th>
            <th>敏感文件（已脱敏）</th>
            <th>最后接入</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(dev, i) in usbRows" :key="dev.usbId">
            <td class="tabular col-idx">{{ rowIndex(i) }}</td>
            <td>{{ dev.volName }}</td>
            <td class="mono">{{ dev.shortId }}</td>
            <td>
              <span class="pill" :class="dev.allowed ? 'ok' : 'danger'">
                {{ dev.allowed ? '允许' : '禁止' }}
              </span>
            </td>
            <td>
              <div class="files">
                <span v-for="(f, j) in visibleFiles(dev)" :key="j" class="file-chip sensitive">
                  <svg
                    v-if="f.type === 'folder'"
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"
                    />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    width="11"
                    height="11"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
                    <path d="M14 3v5h5" />
                  </svg>
                  {{ f.name }}
                </span>
                <span v-if="hiddenFileCount(dev) > 0" class="more"
                  >+{{ hiddenFileCount(dev) }}</span
                >
              </div>
            </td>
            <td class="time tabular">{{ formatShortTime(dev.lastTime) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 空态 -->
      <div v-if="activeList.length === 0" class="table-empty">
        {{ activeTab === 'dns' ? '本周无风险 DNS 记录' : '本周未发现含敏感目录的 USB 设备' }}
      </div>
    </div>

    <!-- 分页：打印时隐藏（数据已在 beforeprint 中展开全量，双保险） -->
    <footer v-if="!printMode && totalPages > 1" class="table-pagination no-print">
      <span>共 {{ activeList.length }} 条</span>
      <div class="pager">
        <button :disabled="page <= 1" @click="prevPage">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 6l-6 6 6 6" />
          </svg>
          上一页
        </button>
        <span class="tabular">{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="nextPage">
          下一页
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </footer>
  </section>
</template>

<style lang="scss" scoped>
.table-card {
  padding: 16px 18px 12px;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--wr-text);
  }
}

.print-only-title {
  margin: 0;
  font-size: 12px;
  color: var(--wr-text-sub);
}

/* ---- Tab 切换 ---- */
.tab-nav {
  display: flex;
  gap: 4px;
  background: #f0f3f9;
  padding: 3px;
  border-radius: 9px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 7px 14px;
    border-radius: 7px;
    font-size: 13px;
    color: var(--wr-text-sub);
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease;

    &.active {
      background: #fff;
      color: var(--wr-text);
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(23, 33, 61, 0.1);
    }

    .badge {
      font-size: 11px;
      background: #e3e9f4;
      border-radius: 999px;
      padding: 1px 7px;
      color: #55607a;
    }

    &.active .badge {
      background: var(--wr-brand-soft);
      color: var(--wr-brand);
    }
  }
}

/* ---- 表格 ---- */
.table-scroll {
  overflow-x: auto;
} /* 移动端横向滚动，打印时由全局规则接管 */

.wr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    font-weight: 500;
    font-size: 12px;
    color: var(--wr-text-sub);
    padding: 9px 12px;
    border-bottom: 1px solid var(--wr-border);
    background: #f8fafd;
    white-space: nowrap;
  }

  td {
    padding: 11px 12px;
    border-bottom: 1px solid #eef1f7;
    color: var(--wr-text);
    vertical-align: top;
  }

  tbody tr {
    transition: background 0.12s ease;
  }
  tbody tr:hover {
    background: #f6f9ff;
  }
}

.col-idx {
  width: 42px;
  color: var(--wr-text-sub);
}
.col-rate {
  min-width: 130px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.domain {
  font-weight: 500;
}
.time {
  color: var(--wr-text-sub);
  white-space: nowrap;
}

.risk-chip {
  display: inline-block;
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  color: var(--wr-risk);
}

.risk-rate {
  display: flex;
  align-items: center;
  gap: 8px;

  > span {
    font-size: 12px;
    color: var(--wr-text-sub);
    min-width: 44px;
  }

  .track {
    flex: 1;
    min-width: 56px;
    max-width: 90px;
    height: 5px;
    border-radius: 999px;
    background: #eef1f7;
    overflow: hidden;
    font-style: normal;

    .fill {
      display: block;
      height: 100%;
      border-radius: 999px;
      background: var(--wr-risk);
    }
  }
}

.pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;

  &.ok {
    background: #e8f6ef;
    color: var(--wr-ok);
  }
  &.danger {
    background: #fdeeee;
    color: var(--wr-risk);
  }
}

.files {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  margin: 2px 6px 2px 0;
  border-radius: 6px;
  background: #f3f6fc;
  border: 1px solid #e3e9f4;
  font-size: 12px;
  color: #404b63;

  &.sensitive {
    background: #fdf1f1;
    border-color: #f3d5d5;
    color: #a33a3a;
  }

  svg {
    flex-shrink: 0;
  }
}

.more {
  font-size: 12px;
  color: var(--wr-text-sub);
}

.table-empty {
  padding: 46px 0;
  text-align: center;
  font-size: 13px;
  color: var(--wr-text-sub);
}

/* ---- 分页 ---- */
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 4px 4px;
  font-size: 12.5px;
  color: var(--wr-text-sub);

  .pager {
    display: flex;
    align-items: center;
    gap: 10px;

    button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--wr-border);
      background: #fff;
      border-radius: 7px;
      padding: 5px 12px;
      font-size: 12px;
      color: var(--wr-text);
      cursor: pointer;
      transition:
        border-color 0.15s ease,
        color 0.15s ease;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      &:hover:not(:disabled) {
        border-color: var(--wr-brand);
        color: var(--wr-brand);
      }
    }
  }
}
</style>
