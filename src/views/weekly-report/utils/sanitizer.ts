/**
 * sanitizer.ts —— 时间时区转换 / 敏感信息脱敏的纯函数集合
 *
 * 时区约定：
 * - 后端所有时间均为 ISO 8601 UTC（带 Z 后缀），如 "2026-09-01T00:00:13.657Z"；
 * - Day.js 解析带 Z 的字符串时会自动换算为「浏览器本地时区」（UTC+8 环境下自动 +8），
 *   因此 format() 的结果即为本地时间，无需手动做偏移计算。
 *
 * 脱敏约定：
 * - dirlist 中文件名若包含「学生名单」「成绩」，判定为敏感文件；
 * - 掩码时将敏感片段替换为 ***（含 "副本" 等伴生修饰词），
 *   例："._副本高一（2）班 学生名单.xlsx" → "._***高一（2）班 ***.xlsx"。
 *
 * 所有函数均为纯函数，不依赖外部状态，便于单元测试。
 */
import dayjs, { Dayjs } from 'dayjs'

/** 判定文件名是否敏感的关键词（业务合规要求，可按需扩展） */
export const SENSITIVE_KEYWORDS = ['学生名单', '成绩']

/**
 * 掩码替换词库：命中的片段统一替换为 ***
 * 除关键词本身外，额外覆盖 "副本 / 备份" 等常见伴生修饰词
 */
const MASK_TOKENS = [...SENSITIVE_KEYWORDS, '副本', '备份', '原件', '扫描件']

/**
 * 敏感文件名脱敏
 * 1. 不含关键词 → 原样返回（零成本短路，非敏感文件不处理）；
 * 2. 含关键词   → 词库片段替换为 ***，保留扩展名等结构信息，
 *                 便于安全人员判断文件类型，同时不泄露具体身份信息。
 */
export function maskSensitiveFilename(name: string): string {
  if (!name) return name
  if (!SENSITIVE_KEYWORDS.some((k) => name.includes(k))) return name
  const pattern = new RegExp(`(${MASK_TOKENS.join('|')})`, 'g')
  return name.replace(pattern, '***')
}

/** 判断文件名是否命中敏感关键词（用于表格中的“敏感”标记） */
export function isSensitiveFilename(name: string): boolean {
  return SENSITIVE_KEYWORDS.some((k) => name.includes(k))
}

/** UTC ISO 字符串 → 本地时区的 Dayjs 实例（Day.js 自动完成时区换算） */
export function toLocal(iso: string): Dayjs {
  return dayjs(iso)
}

/** UTC ISO → 本地时间格式化，默认 "YYYY-MM-DD HH:mm" */
export function formatDateTime(iso?: string, template = 'YYYY-MM-DD HH:mm'): string {
  if (!iso) return '—'
  return dayjs(iso).format(template)
}

/** UTC ISO → 本地 "MM-DD HH:mm"（表格紧凑展示） */
export function formatShortTime(iso?: string): string {
  return formatDateTime(iso, 'MM-DD HH:mm')
}

/**
 * 秒数 → 人类可读时长
 * 3661 → "1小时1分钟"；540 → "9分钟"；30 → "不足1分钟"
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  if (m > 0) return `${m}分钟`
  return s > 0 ? '不足1分钟' : '0分钟'
}

/** 秒数 → 小时（保留 1 位小数），供图表 Y 轴 / 柱体数值使用 */
export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10
}

/** 设备 ID 截断展示：Base64 串只保留前 n 位，超出部分以省略号收尾 */
export function shortUsbId(usbId: string, n = 8): string {
  if (!usbId) return '—'
  return usbId.length <= n ? usbId : `${usbId.slice(0, n)}…`
}
