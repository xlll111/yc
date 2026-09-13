/**
 * useWeeklyReport.ts —— 周报数据的请求 / 竞态控制 / 容错聚合编排
 *
 * 状态设计：
 * - loading：骨架屏开关（切换周次时先清空旧数据再进入 loading，避免新旧数据闪切）；
 * - error  ：错误对象（携带 message），UI 提供重试按钮；
 * - aggregate：聚合后的视图数据（各模块失败均有默认值兜底）。
 *
 * 竞态控制：每次请求持有独立 AbortController，发起新请求前 abort 旧请求；
 *           被中断的请求静默退出，且不允许其复位 loading / 落地数据。
 *
 * 容错降级：四个聚合模块（心跳 / USB / DNS / 敏感设备）通过 Promise.allSettled
 *           独立包裹，任一模块异常只降级为默认值，不影响整体页面渲染。
 */
import { computed, ref } from 'vue'
import dayjs, { Dayjs } from 'dayjs'
import { clientApi } from '@/api/clients'
import {
  WEEK_SECONDS,
  aggregateDns,
  aggregateHeartbeats,
  aggregateUsbSessions,
  emptyHeatmap,
  findSensitiveUsbDevices,
  toYearWeek,
} from '../utils/aggregator'
import type {
  DnsDomainStat,
  HeartbeatAggregate,
  SensitiveUsbDevice,
  UsbAllowedDevice,
  UsbDirItem,
  UsbDeviceStat,
  UsbRecord,
  WeeklyReportAggregate,
  WeeklyReportRawData,
  HeartbeatRecord,
  ClientInfo,
  DnsRecord,
} from '../utils/aggregator'

/* ================================================================
 *  请求层： 真实接口统一签名，均支持 AbortSignal
 * ================================================================ */

/** 可中断的 sleep：请求等待期间被 abort 时立即以 AbortError 结束 */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException('请求已取消', 'AbortError'))
    if (signal.aborted) return onAbort()
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      onAbort()
    })
  })
}

async function fetchWeeklyReport(
  uuid: string,
  token: string,
  week: string,
  signal: AbortSignal,
): Promise<WeeklyReportRawData> {
  const yearWeek = toYearWeek(week)
  // ---- 真实接口 ----
  const res = await clientApi.getWeeklyClientReport(uuid, yearWeek, token, signal)
  return res
}

/* ================================================================
 *  周次选项
 * ================================================================ */

/** 取 d 所在周的周一 00:00（本地时区） */
function startOfWeek(d: Dayjs): Dayjs {
  return d.subtract((d.day() + 6) % 7, 'day').startOf('day')
}

function toOption(w: Dayjs, current: string) {
  return {
    value: w.format('YYYY-MM-DD'),
    label: `${w.format('YYYY-MM-DD')} ~ ${w.add(6, 'day').format('MM-DD')}${w.format('YYYY-MM-DD') === current ? '（本周）' : ''}`,
  }
}

/* ================================================================
 *  组合函数
 * ================================================================ */

export function useWeeklyReport(uuid: string, week0: string, token: string) {
  /** 周次选项：Mock 模式锚定需求示例周 2026-09-01；真实模式取最近 4 个自然周 */
  const anchor = startOfWeek(dayjs())
  const currentWeek = week0
  const weekOptions = toOption(startOfWeek(dayjs(currentWeek)).subtract(0, 'week'), currentWeek)

  const DEFAULT_WEEK = weekOptions?.value || '1'

  /** 当前选中的周（周一日期，本地时区口径） */
  const week = ref<string>(DEFAULT_WEEK)
  const loading = ref(false)
  const error = ref<null | { message: string }>(null)
  const aggregate = ref<WeeklyReportAggregate | null>(null)

  /** 当前活跃请求的控制器 —— 竞态控制核心 */
  let activeController: AbortController | null = null

  /**
   * 模块级容错降级：
   * 四个聚合模块通过 Promise.allSettled 独立包裹（同步纯函数先异步化），
   * 任一模块 rejected 只记录日志并回退默认值，其余模块照常 fulfilled。
   */
  async function buildAggregateSafely(
    raw: WeeklyReportRawData,
    targetWeek: string,
  ): Promise<WeeklyReportAggregate> {
    const MODULE_NAMES = ['心跳聚合', 'USB 会话切分', 'DNS 主域名归并', '敏感 USB 设备识别']

    const tasks = (await Promise.allSettled([
      Promise.resolve().then(() => aggregateHeartbeats(raw.client_record ?? [], targetWeek)),
      Promise.resolve().then(() =>
        aggregateUsbSessions(raw.usb_record ?? [], raw.usb_allowed ?? [], targetWeek),
      ),
      Promise.resolve().then(() => aggregateDns(raw.dns_url_records ?? [], targetWeek)),
      Promise.resolve().then(() => findSensitiveUsbDevices(raw.usb_allowed ?? [])),
    ])) as [
      PromiseSettledResult<HeartbeatAggregate>,
      PromiseSettledResult<UsbDeviceStat[]>,
      PromiseSettledResult<DnsDomainStat[]>,
      PromiseSettledResult<SensitiveUsbDevice[]>,
    ]

    tasks.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[weekly-report] 「${MODULE_NAMES[i]}」聚合失败，已降级为默认值:`, r.reason)
      }
    })

    const heart = tasks[0].status === 'fulfilled' ? tasks[0].value : null
    const usbStats = tasks[1].status === 'fulfilled' ? tasks[1].value : []
    const dnsStats = tasks[2].status === 'fulfilled' ? tasks[2].value : []
    const sensitive = tasks[3].status === 'fulfilled' ? tasks[3].value : []

    const dnsRecords = raw.dns_url_records ?? []
    // 风险命中数直接从原始记录兜底统计：即使 DNS 归并失败，关键 KPI 也不丢失
    const dnsRiskCount = dnsRecords.reduce((n, r) => n + (r.detection ? 1 : 0), 0)
    const totalOnlineSeconds = heart?.totalOnlineSeconds ?? 0

    return {
      weekStart: targetWeek,
      clientHostname: raw.client?.hostname ?? '未知客户端',
      clientVersion: raw.client?.version ?? '',
      lastSeen: raw.client?.lastSeen ?? '',
      note: raw.client?.note ?? '',

      dailyOnlineSeconds: heart?.dailyOnlineSeconds ?? Array.from({ length: 7 }, () => 0),
      hourlyHeatmap: heart?.hourlyHeatmap ?? emptyHeatmap(),
      onlineSessions: heart?.onlineSessions ?? [],
      totalOnlineSeconds,
      onlineRate: Math.min(1, totalOnlineSeconds / WEEK_SECONDS),

      usbDeviceCount: (raw.usb_allowed ?? []).length,
      usbAllowedCount: (raw.usb_allowed ?? []).filter((d) => d.allowed).length,
      usbDeniedCount: (raw.usb_allowed ?? []).filter((d) => !d.allowed).length,
      deniedUsbSessionCount: usbStats
        .filter((s) => s.allowed === false)
        .reduce((n, s) => n + s.sessionCount, 0),
      usbTopSessions: usbStats.slice(0, 5),
      sensitiveUsbDevices: sensitive,

      dnsTotalCount: dnsRecords.length,
      dnsRiskCount,
      dnsRiskRate: dnsRecords.length > 0 ? dnsRiskCount / dnsRecords.length : 0,
      dnsDomainCount: dnsStats.length,
      dnsTopDomains: dnsStats.slice(0, 10),
      riskDnsList: dnsStats
        .filter((s) => s.risks > 0)
        .sort((a, b) => b.risks - a.risks || b.total - a.total),
    }
  }

  /** 加载指定周数据（竞态安全：可被后续请求随时取消） */
  async function load(targetWeek: string) {
    // 1) 取消上一次未完成的请求
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller

    // 2) 进入骨架屏，清空旧数据，避免新旧周数据闪切
    loading.value = true
    error.value = null
    aggregate.value = null

    try {
      if (!uuid || !token) {
        error.value = { message: '非法请求' }
        return null
      }
      const raw = await fetchWeeklyReport(uuid, token, targetWeek, controller.signal)
      // 双保险：即使中断未被 fetch 捕获，过期结果也不落地
      if (controller !== activeController) return
      aggregate.value = await buildAggregateSafely(raw, targetWeek)
    } catch (e) {
      const err = e as Error
      // 被新请求取代 → 静默退出，不进入错误态
      if (err.name === 'AbortError') return
      console.error('[weekly-report] 请求失败:', err)
      error.value = { message: err.message || '数据加载失败，请稍后重试' }
    } finally {
      // 只有「仍是当前活跃请求」时才复位 loading，防止旧请求干扰新请求的骨架屏
      if (controller === activeController) {
        loading.value = false
        activeController = null
      }
    }
  }

  /** 切换周次 */
  function setWeek(w: string) {
    week.value = w
    load(w)
  }

  /** 失败重试 */
  function retry() {
    load(week.value)
  }

  /** 周期展示文案 */
  const weekRangeLabel = computed(() => {
    const s = dayjs(week.value)
    return `${s.format('YYYY年MM月DD日')} ~ ${s.add(6, 'day').format('MM月DD日')}`
  })

  // 初始加载
  load(week.value)

  return { week, weekOptions, weekRangeLabel, loading, error, aggregate, setWeek, retry }
}
