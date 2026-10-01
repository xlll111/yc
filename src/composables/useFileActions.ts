// 文件/文件夹操作统一入口；未来加「复制」「移动」只改这里
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useCloudStore } from '@/stores/cloudStore'

export function useFileActions() {
  const store = useCloudStore()
  const acting = ref(false)

  async function run(fn: () => Promise<any>, okMsg?: string): Promise<boolean> {
    acting.value = true
    try {
      await fn()
      if (okMsg) ElMessage.success(okMsg)
      return true
    } catch (e: any) {
      ElMessage.error(e?.message || '操作失败')
      return false
    } finally {
      acting.value = false
    }
  }

  function createFolder(name: string) {
    return run(async () => {
      // TODO: FolderCreate 字段待后端确认，最小假设 { name, parent_id }
      await store.createFolder({ name, parent_id: store.currentFolderId })
      await store.refreshCurrentFolder(true)
    }, '创建成功')
  }

  function renameResource(type: 'folder' | 'file', id: number, name: string) {
    return run(async () => {
      // TODO: FolderUpdate / FileUpdate 字段待确认，最小假设 { name }
      if (type === 'folder') await store.renameFolder(id, { name })
      else await store.renameFile(id, { name })
      await store.refreshCurrentFolder(true)
    }, '重命名成功')
  }

  function deleteResource(type: 'folder' | 'file', id: number) {
    return run(async () => {
      if (type === 'folder') await store.deleteFolder(id)
      else await store.deleteFile(id)
      await store.refreshCurrentFolder(true)
    }, '已删除')
  }

  return { acting, createFolder, renameResource, deleteResource }
}
