/**
 * dnsTimeline.ts —— DNS 记录的时间维度聚合
 *
 * 与 aggregator.ts 的 aggregateDns（按主域名归并）互补：
 * 本文件只关心「什么时间发生了多少次请求 / 多少次风险命中」。
 */
import dayjs from 'dayjs'

export interface DnsTimeline {
  /** 每日 DNS 请求总数，下标 0 = 周一，长度 7 */
  dnsDailyTotal: number[]
  /** 每日风险命中数，下标 0 = 周一，长度 7 */
  dnsDailyRisk: number[]
  /** [weekday][hour] 请求密度矩阵，7 × 24 */
  dnsHourlyTotal: number[][]
  /** [weekday][hour] 风险命中密度矩阵，7 × 24 */
  dnsHourlyRisk: number[][]
}

function zeroMatrix(): number[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
}

/** 7×24 全零兜底（聚合失败时使用） */
export function emptyDnsTimeline(): DnsTimeline {
  return {
    dnsDailyTotal: Array.from({ length: 7 }, () => 0),
    dnsDailyRisk: Array.from({ length: 7 }, () => 0),
    dnsHourlyTotal: zeroMatrix(),
    dnsHourlyRisk: zeroMatrix(),
  }
}

/* ================================================================
 *  ⚠️ 字段适配层：若后端 DNS 记录的时间 / 风险字段名不一致，
 *     只改 pickTime / pickRisk 这两个函数即可，其余逻辑无需改动。
 * ================================================================ */
function pickTime(raw: Record<string, unknown>): unknown {
  return (
    raw.time ??
    raw.recordTime ??
    raw.record_time ??
    raw.eventTime ??
    raw.event_time ??
    raw.createdAt ??
    raw.createTime ??
    raw.create_time ??
    raw.timestamp ??
    null
  )
}

function pickRisk(raw: Record<string, unknown>): boolean {
  return Boolean(raw.detection ?? raw.isRisk ?? raw.is_risk ?? raw.risk ?? false)
}

/** 宽松时间解析：兼容 10 位秒级 / 13 位毫秒级时间戳与各类字符串 */
function parseTime(raw: unknown): dayjs.Dayjs | null {
  if (raw == null || raw === '') return null
  const d = typeof raw === 'number' ? dayjs(raw < 1e12 ? raw * 1000 : raw) : dayjs(String(raw))
  return d.isValid() ? d : null
}

/**
 * 把 DNS 原始记录摊平成时间维度统计。
 * 落在 [weekStart, weekStart + 7d) 之外的记录会被丢弃（防止跨周脏数据）。
 */
export function aggregateDnsTimeline<T extends object>(
  records: readonly T[],
  weekStart: string,
): DnsTimeline {
  const out = emptyDnsTimeline()
  const start = dayjs(weekStart).startOf('day')

  for (const item of records) {
    const raw = item as Record<string, unknown>
    const t = parseTime(pickTime(raw))
    if (!t) continue

    const dayIdx = t.startOf('day').diff(start, 'day')
    if (dayIdx < 0 || dayIdx > 6) continue

    const hour = t.hour()
    const totalRow = out.dnsHourlyTotal[dayIdx]!
    const riskRow = out.dnsHourlyRisk[dayIdx]!

    out.dnsDailyTotal[dayIdx]! += 1
    totalRow[hour]! += 1

    if (pickRisk(raw)) {
      out.dnsDailyRisk[dayIdx]! += 1
      riskRow[hour]! += 1
    }
  }

  return out
}
