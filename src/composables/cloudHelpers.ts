// 云盘通用工具：大小格式化、uuid 截断、mtime 兜底、简单 uuid 生成

export function formatFileSize(bytes?: number): string {
  const n = Number(bytes) || 0
  if (n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

// UUID 截断 8 位 + ... + 后 4 位
export function truncateUuid(id: unknown): string {
  const s = String(id ?? '')
  return s.length > 16 ? `${s.slice(0, 8)}...${s.slice(-4)}` : s
}

// TODO: mtime 字段名待后端确认，做多字段兜底
export function resolveMtime(item: any): string {
  return item?.mtime || item?.modified_at || item?.updated_at || item?.created_at || ''
}

export function simpleUuid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
