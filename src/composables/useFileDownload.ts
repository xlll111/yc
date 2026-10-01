import { ref, triggerRef } from 'vue' // 新增 triggerRef
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { request } from '@/utils/request'
import { API_BASE } from '@/stores/cloudStore'

export function useFileDownload() {
  const downloadingIds = ref<Set<number>>(new Set())

  function isDownloading(id?: number | null) {
    return id != null && downloadingIds.value.has(id)
  }

  async function downloadFile(file: { id: number; name: string }) {
    if (isDownloading(file.id)) return
    downloadingIds.value.add(file.id)
    triggerRef(downloadingIds) // 通知依赖更新

    try {
      // 1. 下载元信息（TODO: meta 字段待确认，最小假设 file_name）
      const meta: any = await request.get(`${API_BASE}/download/${file.id}/meta`)
      // 2. 临时 url + 必需 headers
      const info: any = await request.get(`${API_BASE}/download/${file.id}/url`)
      // 3. 带 headers 拉取 blob
      const res = await fetch(info.url, { headers: info.headers || {}, method: 'GET' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      // 4. 触发浏览器下载并释放
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = meta?.file_name || file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      ElMessage.error('下载失败，请稍后重试')
    } finally {
      downloadingIds.value.delete(file.id)
      triggerRef(downloadingIds) // 通知依赖更新
    }
  }

  return { downloadingIds, isDownloading, downloadFile }
}
