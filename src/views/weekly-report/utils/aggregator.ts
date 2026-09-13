/**
 * aggregator.ts —— 周报核心聚合算法（纯函数，无副作用，可独立单测）
 *
 * 三大算法：
 * 1. 心跳聚合   ：相邻心跳间隔 <= 90s 视为持续在线，否则切分会话；
 *                 输出 每日在线秒数[7] / 7x24 心跳密度热力图 / 会话区间列表。
 * 2. USB 会话切分：同设备相邻记录间隔 > 300s 视为新会话，汇总各设备会话总时长（Top5 排序依据）。
 * 3. DNS 归并   ：提取可注册主域名（含 com.cn 等二级后缀识别），统计 Top10 与风险命中数。
 *
 * 时间口径：所有输入为 UTC ISO，内部统一通过 toLocal() 转为本地时区后再做 星期/小时 归属；
 *           输出的会话区间统一存回 UTC ISO（存储口径），由展示层按本地时区格式化。
 */
import dayjs, { Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { isSensitiveFilename, maskSensitiveFilename, shortUsbId, toLocal } from './sanitizer'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)
/* ============================ 业务常量 ============================ */

/** 相邻心跳间隔阈值（秒）：<= 90s 视为持续在线 */
export const HEARTBEAT_GAP_SECONDS = 90
/** 同一 USB 设备相邻记录间隔阈值（秒）：> 300s 视为新会话 */
export const USB_SESSION_GAP_SECONDS = 300
/** 一周总秒数（在线率分母） */
export const WEEK_SECONDS = 7 * 24 * 3600
/** 周标签（索引 0 = 周一） */
export const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/* ============================ API 原始类型 ============================ */

export interface ClientInfo {
  hostname: string
  version: string
  lastSeen: string
  note: string
}

export interface HeartbeatRecord {
  id: number
  uuid: string
  time: string // ISO 8601 UTC
}

export interface UsbDirItem {
  name: string
  type: 'folder' | 'file' | string
}

export interface UsbAllowedDevice {
  id: number
  volName: string
  usbId: string // Base64
  allowed: boolean
  lastTime: string
  dirlist?: UsbDirItem[]
}

export interface UsbRecord {
  id: number
  usbId: string
  time: string // ISO 8601 UTC
}

export interface DnsRecord {
  id: number
  url: string
  time: string // ISO 8601 UTC
  detection: boolean // 是否命中风险
}

export interface WeeklyReportRawData {
  client: ClientInfo
  client_record: HeartbeatRecord[]
  usb_allowed: UsbAllowedDevice[]
  usb_record: UsbRecord[]
  dns_url_records: DnsRecord[]
}

/* ============================ 聚合结果类型 ============================ */

export interface OnlineSession {
  start: string // UTC ISO
  end: string // UTC ISO
  seconds: number
}

export interface HeartbeatAggregate {
  /** 每日在线秒数，下标 0 = 周一，长度恒为 7 */
  dailyOnlineSeconds: number[]
  /** 7x24 心跳密度矩阵，[weekday][hour] 记录心跳条数 */
  hourlyHeatmap: number[][]
  /** 在线会话区间列表 */
  onlineSessions: OnlineSession[]
  /** 周总在线秒数 */
  totalOnlineSeconds: number
}

export interface UsbDeviceStat {
  usbId: string
  shortId: string // 截断后的展示 ID（前 8 位）
  volName: string
  allowed?: boolean
  /** 会话总时长（秒）—— Top5 排序依据 */
  totalSeconds: number
  sessionCount: number
  lastActiveTime: string
}

export interface DnsDomainStat {
  domain: string // 归并后的主域名
  total: number // 总请求数
  risks: number // 风险命中数（detection: true）
  lastTime: string
  lastRiskTime?: string
}

export interface SensitiveFileItem {
  name: string // 脱敏后的文件名
  type: string
  isSensitive: boolean
}

export interface SensitiveUsbDevice {
  usbId: string
  shortId: string
  volName: string
  allowed: boolean
  lastTime: string
  sensitiveCount: number
  files: SensitiveFileItem[]
}

/** 页面消费的最终聚合视图（各字段均有兜底默认值，容错降级由 composable 层保证） */
export interface WeeklyReportAggregate {
  weekStart: string
  // 客户端信息
  clientHostname: string
  clientVersion: string
  lastSeen: string
  note: string
  // 心跳
  dailyOnlineSeconds: number[]
  hourlyHeatmap: number[][]
  onlineSessions: OnlineSession[]
  totalOnlineSeconds: number
  onlineRate: number // 0 ~ 1
  // USB
  usbDeviceCount: number
  usbAllowedCount: number
  usbDeniedCount: number
  deniedUsbSessionCount: number
  usbTopSessions: UsbDeviceStat[] // Top5
  sensitiveUsbDevices: SensitiveUsbDevice[]
  // DNS
  dnsTotalCount: number
  dnsRiskCount: number
  dnsRiskRate: number // 0 ~ 1
  dnsDomainCount: number
  dnsTopDomains: DnsDomainStat[] // Top10
  riskDnsList: DnsDomainStat[] // risks > 0，按命中数降序
}

/* ============================ 内部通用工具 ============================ */

/** Day.js .day() 0=周日…6=周六 → 转换为 周一=0…周日=6 的索引 */
export function toMondayIndex(d: Dayjs): number {
  return (d.day() + 6) % 7
}

/** 判断本地时间 t 是否落在 [weekStart, weekStart + 7d) 内 */
function isWithinWeek(t: Dayjs, weekStart: Dayjs): boolean {
  return !t.isBefore(weekStart) && t.isBefore(weekStart.add(7, 'day'))
}

/** 构造全 0 的 7x24 矩阵（聚合失败时的兜底值） */
export function emptyHeatmap(): number[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
}

/**
 * 把 [start, end] 的在线时长按「自然日」切分（处理跨天会话）。
 * 例：会话 23:30 ~ 次日 01:00 → 周三 1800s + 周四 3600s。
 * start === end（单心跳会话）时返回空数组，不产生分摊。
 */
function splitSecondsByDay(start: Dayjs, end: Dayjs): Array<{ dayIndex: number; seconds: number }> {
  const out: Array<{ dayIndex: number; seconds: number }> = []
  if (!start.isBefore(end)) return out
  let cursor = start
  while (cursor.isBefore(end)) {
    const dayEnd = cursor.startOf('day').add(1, 'day')
    const segEnd = dayEnd.isBefore(end) ? dayEnd : end
    const seconds = segEnd.diff(cursor, 'second')
    if (seconds > 0) {
      const dayIndex = toMondayIndex(cursor)
      if (dayIndex >= 0 && dayIndex < 7) out.push({ dayIndex, seconds }) // 越界守卫
    }
    cursor = segEnd
  }
  return out
}

export function toYearWeek(input: string | number | Date | dayjs.Dayjs, pad = true): number {
  const d = dayjs(input)
  if (!d.isValid()) {
    throw new Error(`Invalid date: ${input}`)
  }
  const year = d.isoWeekYear() // ISO 周所属的年（跨年周要对齐）
  const week = d.isoWeek() // ISO 周数 1~53
  const weekStr = pad ? String(week).padStart(2, '0') : String(week)
  return Number(week)
}

/* ============================ 算法 1：心跳聚合 ============================ */

export function aggregateHeartbeats(
  records: HeartbeatRecord[],
  week: string, // 周一日期 YYYY-MM-DD
): HeartbeatAggregate {
  const weekStart = dayjs(week).startOf('day')

  // 1) UTC → 本地时区，过滤本周之外的心跳，按时间升序排序（保证间隔计算正确）
  const beats = records
    .map((r) => toLocal(r.time))
    .filter((t) => isWithinWeek(t, weekStart))
    .sort((a, b) => a.valueOf() - b.valueOf())
  // console.log(`beats${beats}`)

  const dailyOnlineSeconds: number[] = Array.from({ length: 7 }, () => 0)
  const hourlyHeatmap: number[][] = emptyHeatmap()
  // console.log(`dailyOnlineSeconds${dailyOnlineSeconds}`)
  // console.log(`hourlyHeatmap${hourlyHeatmap}`)

  // 2) 热力图统计：每条心跳计入 [星期][小时] 一格，反映“活跃密度”
  for (const t of beats) {
    hourlyHeatmap[toMondayIndex(t)]![t.hour()]! += 1
  }

  // 3) 会话切分：用索引标记每段 [首心跳, 末心跳]。
  //    相邻间隔 > 90s 时当前心跳即会话末尾，下一心跳开启新会话。
  const segments: Array<[number, number]> = []
  let segStart = 0
  for (let i = 0; i < beats.length; i++) {
    const next = beats[i + 1]
    const gap = next ? next.diff(beats[i], 'second') : Number.POSITIVE_INFINITY
    if (gap > HEARTBEAT_GAP_SECONDS) {
      segments.push([segStart, i])
      segStart = i + 1
    }
  }

  // 4) 会话时长 + 按天分摊（跨天会话按自然日切开计入各天）
  const onlineSessions: OnlineSession[] = []
  let totalOnlineSeconds = 0
  for (const [s, e] of segments) {
    const start = beats[s] ?? dayjs()
    const end = beats[e] ?? dayjs()
    // 会话时长 = 末心跳 - 首心跳；单条心跳的孤立会话保守计 0 秒（避免高估在线率），
    // 其存在感已由热力图心跳密度体现。
    const seconds = end.diff(start, 'second')
    totalOnlineSeconds += seconds
    for (const { dayIndex, seconds: daySec } of splitSecondsByDay(start, end)) {
      dailyOnlineSeconds[dayIndex] = (dailyOnlineSeconds[dayIndex] ?? 0) + daySec
    }
    onlineSessions.push({ start: start.toISOString(), end: end.toISOString(), seconds })
  }

  return { dailyOnlineSeconds, hourlyHeatmap, onlineSessions, totalOnlineSeconds }
}

/* ============================ 算法 2：USB 会话切分 ============================ */

export function aggregateUsbSessions(
  records: UsbRecord[],
  allowedDevices: UsbAllowedDevice[],
  week: string,
): UsbDeviceStat[] {
  const weekStart = dayjs(week).startOf('day')
  // 白名单元数据索引（usbId → 设备信息），用于补齐卷标 / 授权状态
  const metaById = new Map(allowedDevices.map((d) => [d.usbId, d]))

  // 1) 按设备分组，过滤本周之外记录
  const byDevice = new Map<string, number[]>()
  for (const r of records) {
    const t = toLocal(r.time)
    if (!isWithinWeek(t, weekStart)) continue
    const arr = byDevice.get(r.usbId) ?? []
    arr.push(t.valueOf())
    byDevice.set(r.usbId, arr)
  }

  // 2) 组内排序后切会话：间隔 > 300s 视为新会话；会话时长 = 末记录 - 首记录
  const stats: UsbDeviceStat[] = []
  for (const [usbId, times] of byDevice) {
    times.sort((a, b) => a - b)
    const meta = metaById.get(usbId)
    let totalSeconds = 0
    let sessionCount = 0
    let sessionStart = times[0]
    let prev = times[0]
    if (!sessionStart || !prev) continue
    const flush = (start: number, end: number) => {
      sessionCount += 1
      totalSeconds += Math.max(0, Math.round((end - start) / 1000))
    }

    for (let i = 1; i <= times.length; i++) {
      const cur = times[i]
      const gapSec = cur !== undefined ? (cur - prev) / 1000 : Number.POSITIVE_INFINITY
      if (gapSec > USB_SESSION_GAP_SECONDS) {
        if (!sessionStart) continue
        flush(sessionStart, prev)
        sessionStart = cur // undefined 时循环已结束，赋值无副作用
      }
      if (cur !== undefined) prev = cur
    }

    stats.push({
      usbId,
      shortId: shortUsbId(usbId),
      volName: meta?.volName ?? '未知卷标',
      allowed: meta?.allowed,
      totalSeconds,
      sessionCount,
      lastActiveTime: dayjs(times[times.length - 1]).toISOString(),
    })
  }

  // 3) 按会话总时长降序 —— 直接作为 Top5 排序依据
  return stats.sort((a, b) => b.totalSeconds - a.totalSeconds)
}

/* ============================ 算法 3：DNS 主域名归并 ============================ */

/**
 * 常见二级后缀表：命中时主域名取“倒数三段”，
 * 如 img.example.com.cn → example.com.cn
 */
const SECOND_LEVEL_SUFFIXES = new Set([
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'edu.cn',
  'ac.cn',
  'com.hk',
  'com.tw',
  'com.sg',
  'com.au',
  'com.br',
  'com.ru',
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'co.jp',
  'or.jp',
  'ne.jp',
  'ac.jp',
  'go.jp',
  'co.kr',
  'co.in',
  'co.nz',
  'co.za',
])

/**
 * 从任意形式的 URL / 主机串中提取可注册主域名。
 * 步骤：去协议 → 去路径/查询/锚点 → 去端口 → 修剪首尾点 →
 *       IP 直接返回 → 取最后两段（若倒数第二段是二级后缀则取三段）。
 * 例：pcapp-data-collect.youku.com → youku.com
 */
export function extractRegistrableDomain(url: string): string {
  let host = (url || '').trim().toLowerCase()
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // scheme
  host = host.split(/[/?#]/)[0] ?? '' // path / query / hash
  host = host.split(':')[0] ?? '' // port
  host = host.replace(/^\.+|\.+$/g, '') // 首尾点
  if (!host) return '(unknown)'

  // IPv4 直接返回（IPv6 已被端口处理兜底为空，归入 unknown）
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host

  const parts = host.split('.')
  if (parts.length <= 2) return host

  const lastTwo = parts.slice(-2).join('.')
  if (SECOND_LEVEL_SUFFIXES.has(lastTwo)) return parts.slice(-3).join('.')
  return lastTwo
}

export function aggregateDns(records: DnsRecord[], week: string): DnsDomainStat[] {
  const weekStart = dayjs(week).startOf('day')
  const byDomain = new Map<string, DnsDomainStat>()

  for (const r of records) {
    const t = toLocal(r.time)
    if (!isWithinWeek(t, weekStart)) continue
    const domain = extractRegistrableDomain(r.url)

    let stat = byDomain.get(domain)
    if (!stat) {
      stat = { domain, total: 0, risks: 0, lastTime: t.toISOString() }
      byDomain.set(domain, stat)
    }
    stat.total += 1
    if (t.isAfter(dayjs(stat.lastTime))) stat.lastTime = t.toISOString()
    if (r.detection) {
      stat.risks += 1
      // 记录最近一次风险命中时间（记录未排序，用比较更新保证正确）
      if (!stat.lastRiskTime || t.isAfter(dayjs(stat.lastRiskTime))) {
        stat.lastRiskTime = t.toISOString()
      }
    }
  }

  // 按总请求数降序 —— Top10 直接 slice
  return [...byDomain.values()].sort((a, b) => b.total - a.total)
}

/* ============================ 敏感 USB 设备识别 ============================ */

/**
 * 识别 dirlist 中含敏感文件名的 USB 设备。
 * 判断基于「原始文件名」，展示基于「脱敏后文件名」——原始敏感串永不离开数据层。
 */
export function findSensitiveUsbDevices(devices: UsbAllowedDevice[]): SensitiveUsbDevice[] {
  return devices
    .map((dev) => {
      const files: SensitiveFileItem[] = (dev.dirlist ?? []).map((f) => ({
        name: maskSensitiveFilename(f.name),
        type: f.type,
        isSensitive: isSensitiveFilename(f.name),
      }))
      return {
        usbId: dev.usbId,
        shortId: shortUsbId(dev.usbId),
        volName: dev.volName,
        allowed: dev.allowed,
        lastTime: dev.lastTime,
        sensitiveCount: files.filter((f) => f.isSensitive).length,
        files,
      }
    })
    .filter((d) => d.sensitiveCount > 0)
}

/* ============================ 总聚合入口 ============================ */

/**
 * 一次性完成全部聚合（同步、无容错）。
 * 说明：useWeeklyReport 出于「模块级容错降级」会把上述子函数拆开、
 * 用 Promise.allSettled 包裹后分别兜底；本入口供单元测试 / 脚本场景复用。
 */
export function buildWeeklyAggregate(
  raw: WeeklyReportRawData,
  week: string,
): WeeklyReportAggregate {
  const heart = aggregateHeartbeats(raw.client_record ?? [], week)
  const usbStats = aggregateUsbSessions(raw.usb_record ?? [], raw.usb_allowed ?? [], week)
  const dnsStats = aggregateDns(raw.dns_url_records ?? [], week)
  const dnsRecords = raw.dns_url_records ?? []

  const dnsRiskCount = dnsRecords.reduce((n, r) => n + (r.detection ? 1 : 0), 0)

  return {
    weekStart: week,
    clientHostname: raw.client?.hostname ?? '未知客户端',
    clientVersion: raw.client?.version ?? '',
    lastSeen: raw.client?.lastSeen ?? '',
    note: raw.client?.note ?? '',

    dailyOnlineSeconds: heart.dailyOnlineSeconds,
    hourlyHeatmap: heart.hourlyHeatmap,
    onlineSessions: heart.onlineSessions,
    totalOnlineSeconds: heart.totalOnlineSeconds,
    onlineRate: Math.min(1, heart.totalOnlineSeconds / WEEK_SECONDS),

    usbDeviceCount: (raw.usb_allowed ?? []).length,
    usbAllowedCount: (raw.usb_allowed ?? []).filter((d) => d.allowed).length,
    usbDeniedCount: (raw.usb_allowed ?? []).filter((d) => !d.allowed).length,
    deniedUsbSessionCount: usbStats
      .filter((s) => s.allowed === false)
      .reduce((n, s) => n + s.sessionCount, 0),
    usbTopSessions: usbStats.slice(0, 5),
    sensitiveUsbDevices: findSensitiveUsbDevices(raw.usb_allowed ?? []),

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
