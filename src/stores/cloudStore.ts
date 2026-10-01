/**
 * 云盘全局 store
 * 覆盖：目录导航与面包屑、当前列表、排序/搜索、目录树缓存、上传引擎（含断点续传）、权限缓存
 *
 * TODO（待后端确认，前端按最小假设推进）：
 *  1. request 封装：成功 resolve 业务数据，失败 reject Error(message)
 *  2. API base path 暂定 /api/cloud
 *  3. folder_to_dict / file_to_dict / upload init&status / permissions 的响应字段
 */
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { ComputedRef } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { request } from '@/utils/request' // TODO: 按项目实际路径调整
import { resolveMtime, simpleUuid } from '@/composables/cloudHelpers'

// ============================== 常量与类型 ==============================

export const API_BASE = '/api/cloud' // TODO: 待后端确认

// CloudPermission IntFlag
export const CLOUD_PERM = { NONE: 0, READ: 1, WRITE: 2, DELETE: 4, SHARE: 8, MANAGE: 16 } as const

export const PERM_BIT_META = [
  { value: CLOUD_PERM.READ, key: 'READ', label: '查看' },
  { value: CLOUD_PERM.WRITE, key: 'WRITE', label: '编辑' },
  { value: CLOUD_PERM.DELETE, key: 'DELETE', label: '删除' },
  { value: CLOUD_PERM.SHARE, key: 'SHARE', label: '分享' },
  { value: CLOUD_PERM.MANAGE, key: 'MANAGE', label: '管理' },
] as const

export function parsePermissionBits(bitmask: unknown) {
  const n = Number(bitmask) || 0
  return PERM_BIT_META.filter((b) => (n & b.value) === b.value)
}

export type ResourceType = 'folder' | 'file'

// TODO: 字段名待确认（id / name / parent_id / created_at / mtime...），此处做宽松定义
export interface FolderItem {
  id: number
  name: string
  parent_id?: number | null
  created_at?: string
  mtime?: string
  [k: string]: any
}
export interface FileItem {
  id: number
  name: string
  size: number
  folder_id?: number | null
  parent_id?: number | null
  mime?: string
  created_at?: string
  mtime?: string
  [k: string]: any
}
export interface PermissionItem {
  id?: number
  perm_id?: number
  user_id: number
  username?: string
  permission: number
  created_at?: string
  is_owner?: boolean
  [k: string]: any
}

export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'paused'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'expired'

export interface UploadTask {
  localId: string
  fileName: string
  size: number
  targetFolderId: number
  targetFolderName: string
  file: File | null // File 句柄不持久化，刷新后需用户重选同文件续传
  sessionId: string | null
  status: UploadStatus
  progress: number // 0 ~ 100
  chunkSize: number
  totalChunks: number
  receivedChunks: number
  missing: number[]
  uploadMode: string | null
  expiresAt: string | null
  errorMessage: string
  cancelRequested?: boolean
}

interface TreeNode {
  loading: boolean
  loaded: boolean
  error: string
  folders: FolderItem[]
  files: FileItem[]
}
interface PermEntry {
  loading: boolean
  loaded: boolean
  error: string
  items: PermissionItem[]
}
interface PersistedRecord {
  localId: string
  sessionId: string
  fileName: string
  size: number
  targetFolderId: number
  targetFolderName: string
  chunkSize: number
  totalChunks: number
  receivedChunks: number
  missing: number[]
  expiresAt: string | null
  progress: number
  uploadMode: string | null
}

const MAX_FILE_SIZE = 8 * 1024 * 1024 * 1024 // 8GB
const MAX_CHUNK_CONCURRENCY = 2 // 分片并发 2~3
const CHUNK_MAX_RETRY = 2 // 单分片失败自动重试 2 次
const UPLOAD_SESSIONS_KEY = 'yc_cloud_upload_sessions'
const VIEW_MODE_KEY = 'yc_cloud_view_mode'

class UploadCanceledError extends Error {
  constructor() {
    super('已取消')
  }
}
class SessionExpiredError extends Error {
  constructor() {
    super('上传会话已过期')
  }
}

// ============================== Store ==============================

export const useCloudStore = defineStore('cloud', () => {
  // ---------- 目录导航 ----------
  const currentFolderId = ref<number | null>(null)
  const breadcrumb = ref<Array<{ id: number | null; name: string }>>([
    { id: null, name: '我的云盘' },
  ])

  // ---------- 当前列表 ----------
  const folders = ref<FolderItem[]>([])
  const files = ref<FileItem[]>([]) // 根目录恒为空
  const listLoading = ref(false)
  const listError = ref('')

  // ---------- 视图 / 排序 / 搜索 ----------
  const viewMode = ref<'list' | 'tree'>(
    localStorage.getItem(VIEW_MODE_KEY) === 'tree' ? 'tree' : 'list',
  )
  const sortKey = ref<'name' | 'size' | 'mtime'>('mtime')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const keyword = ref('')

  // ---------- 目录树 ----------
  const treeCache = reactive(new Map<string, TreeNode>())
  const treeExpandedPaths = ref(new Set<string>())

  // ---------- 上传 ----------
  const uploadQueue = ref<UploadTask[]>([])
  const uploadPanelVisible = ref(false)
  const statusTimers = new Map<string, ReturnType<typeof setTimeout>>()

  // ---------- 权限缓存 ----------
  const permissionCache = reactive(new Map<string, PermEntry>())

  // ============================== Getters ==============================

  const isRoot = computed(() => currentFolderId.value === null)
  const currentFolder = computed(
    () => breadcrumb.value[breadcrumb.value.length - 1] || { id: null, name: '我的云盘' },
  )
  const hasFolders = computed(() => folders.value.length > 0)
  const hasFiles = computed(() => files.value.length > 0)
  const totalCount = computed(() => folders.value.length + files.value.length)

  const uploadingCount = computed(
    () =>
      uploadQueue.value.filter((t) => t.status === 'pending' || t.status === 'uploading').length,
  )
  const completedCount = computed(
    () => uploadQueue.value.filter((t) => t.status === 'success').length,
  )
  const failedCount = computed(() => uploadQueue.value.filter((t) => t.status === 'failed').length)

  // 关键词前端过滤（TODO: 后端支持搜索后可改为请求参数）
  function filterByKeyword(list: Array<FolderItem | FileItem>) {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return list as any[]
    return (list as any[]).filter((i) =>
      String(i.name || '')
        .toLowerCase()
        .includes(kw),
    )
  }
  function sortEntries(list: any[], isFile: boolean) {
    const dir = sortOrder.value === 'desc' ? -1 : 1
    const key = sortKey.value
    return [...list].sort((a, b) => {
      if (key === 'size' && isFile) return ((a.size || 0) - (b.size || 0)) * dir
      if (key === 'mtime') {
        const ta = Date.parse(resolveMtime(a) || '') || 0
        const tb = Date.parse(resolveMtime(b) || '') || 0
        return (ta - tb) * dir
      }
      return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN') * dir
    })
  }
  const visibleFolders = computed(() => sortEntries(filterByKeyword(folders.value), false))
  const visibleFiles = computed(() => sortEntries(filterByKeyword(files.value), true))

  // ============================== 目录导航 ==============================

  function fetchFolder(parentId: number | null, opts: { silent?: boolean } = {}): Promise<boolean> {
    const seq = ++fetchSeq
    if (!opts.silent) {
      listLoading.value = true
      listError.value = ''
    }
    return (async () => {
      try {
        const params = parentId != null ? { parent_id: parentId } : {}
        const data: any = await request.authget(`${API_BASE}/folders`, params)
        if (seq !== fetchSeq) return false // 旧响应丢弃，避免快速切目录时覆盖
        const r = data || {}
        folders.value = r.folders || []
        files.value = parentId == null ? [] : r.files || [] // 根目录只放文件夹
        return true
      } catch (e: any) {
        if (seq !== fetchSeq) return false
        if (!opts.silent) listError.value = e?.message || '加载失败'
        return false
      } finally {
        if (seq === fetchSeq && !opts.silent) listLoading.value = false
      }
    })()
  }
  let fetchSeq = 0 // 最后一次请求生效

  function refreshCurrentFolder(silent = false) {
    return fetchFolder(currentFolderId.value, { silent })
  }

  function enterFolder(id: number, name: string) {
    currentFolderId.value = id
    breadcrumb.value.push({ id, name })
    fetchFolder(id)
  }
  function goRoot() {
    breadcrumb.value = [{ id: null, name: '我的云盘' }]
    currentFolderId.value = null
    fetchFolder(null)
  }
  function goToBreadcrumbIndex(i: number) {
    const target = breadcrumb.value[i]
    if (!target) return
    breadcrumb.value = breadcrumb.value.slice(0, i + 1)
    currentFolderId.value = target.id
    fetchFolder(target.id)
  }
  // 树/深链导航：命中面包屑则回退，否则重置为单层（TODO: 深链无法还原中间层级名）
  function navigateTo(id: number | null, name: string) {
    if (id == null) {
      goRoot()
      return
    }
    const idx = breadcrumb.value.findIndex((b) => b.id === id)
    if (idx >= 0) {
      goToBreadcrumbIndex(idx)
      return
    }
    breadcrumb.value = [
      { id: null, name: '我的云盘' },
      { id, name },
    ]
    currentFolderId.value = id
    fetchFolder(id)
  }

  function setViewMode(v: 'list' | 'tree') {
    viewMode.value = v
    localStorage.setItem(VIEW_MODE_KEY, v)
  }
  function setSort(key: 'name' | 'size' | 'mtime', order?: 'asc' | 'desc') {
    sortKey.value = key
    if (order) sortOrder.value = order
  }
  function setSortOrder(order: 'asc' | 'desc') {
    sortOrder.value = order
  }
  function setKeyword(kw: string) {
    keyword.value = kw
  }

  // ============================== 目录树 ==============================

  async function loadTreeNode(parentId: number | null): Promise<TreeNode> {
    const key = parentId == null ? 'root' : String(parentId)
    const existed = treeCache.get(key)
    if (existed && (existed.loaded || existed.loading)) return existed
    const node = reactive<TreeNode>({
      loading: true,
      loaded: false,
      error: '',
      folders: [],
      files: [],
    })
    treeCache.set(key, node)
    try {
      const params = parentId != null ? { parent_id: parentId } : {}
      const data: any = await request.authget(`${API_BASE}/folders`, params)
      node.folders = data?.folders || []
      node.files = parentId == null ? [] : data?.files || []
      node.loaded = true
    } catch (e: any) {
      node.error = e?.message || '加载失败'
    } finally {
      node.loading = false
    }
    return node
  }

  function toggleTreeExpand(key: string): boolean {
    const set = treeExpandedPaths.value
    if (set.has(key)) {
      set.delete(key)
      return false
    }
    set.add(key)
    return true
  }

  function openTreeRoot() {
    if (!treeExpandedPaths.value.has('root')) treeExpandedPaths.value.add('root')
    loadTreeNode(null)
  }

  // ============================== 增删改（纯请求，消息与刷新在 useFileActions） ==============================

  function createFolder(payload: any) {
    return request.authpost(`${API_BASE}/folders`, payload)
  }
  function renameFolder(id: number, payload: any) {
    return request.authpatch(`${API_BASE}/folders/${id}`, payload)
  }
  function deleteFolder(id: number) {
    return request.authdelete(`${API_BASE}/folders/${id}`)
  }
  function renameFile(id: number, payload: any) {
    return request.authpatch(`${API_BASE}/files/${id}`, payload)
  }
  function deleteFile(id: number) {
    return request.authdelete(`${API_BASE}/files/${id}`)
  }
  function fetchFileDetail(id: number) {
    return request.authget(`${API_BASE}/files/${id}`)
  }

  // ============================== 上传引擎 ==============================

  function findTask(localId: string) {
    return uploadQueue.value.find((t) => t.localId === localId)
  }

  function ensureSessionAlive(task: UploadTask) {
    if (task.expiresAt && Date.now() >= new Date(task.expiresAt).getTime())
      throw new SessionExpiredError()
  }

  async function uploadOneChunk(task: UploadTask, index: number) {
    let lastErr: any
    for (let attempt = 0; attempt <= CHUNK_MAX_RETRY; attempt++) {
      if (task.cancelRequested) throw new UploadCanceledError()
      ensureSessionAlive(task)
      try {
        const start = index * task.chunkSize
        const blob = (task.file as File).slice(start, Math.min(start + task.chunkSize, task.size))
        // TODO: direct 模式约定 total_chunks=1，走同一 chunk 通道
        await request.authpost(`${API_BASE}/upload/${task.sessionId}/chunk`, blob, {
          params: { index },
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        task.receivedChunks += 1
        task.missing = task.missing.filter((i) => i !== index)
        task.progress = Math.round((task.receivedChunks / Math.max(task.totalChunks, 1)) * 100)
        persistUploadSession(task.localId)
        return
      } catch (err: any) {
        lastErr = err
      }
    }
    throw lastErr
  }

  async function runChunkQueue(task: UploadTask) {
    const indexes = [...task.missing]
    if (!indexes.length) return // 无缺失分片，直接 complete
    let cursor = 0
    const workerCount = Math.min(MAX_CHUNK_CONCURRENCY, indexes.length)
    const workers = Array.from({ length: workerCount }, () =>
      (async () => {
        while (cursor < indexes.length) {
          if (task.cancelRequested) throw new UploadCanceledError()
          const index = indexes[cursor++]
          if (index === undefined) break
          await uploadOneChunk(task, index)
        }
      })(),
    )
    await Promise.all(workers)
  }

  // complete 后的 status 确认轮询；超时/过期/取消统一走 cleanup
  function confirmCompleteByPolling(task: UploadTask): Promise<void> {
    return new Promise((resolve, reject) => {
      let times = 0
      let timer: ReturnType<typeof setTimeout> | undefined
      const cleanup = () => {
        if (timer) clearTimeout(timer)
        if (task.localId) statusTimers.delete(task.localId)
      }
      const schedule = () => {
        timer = setTimeout(tick, 1500)
        statusTimers.set(task.localId, timer)
      }
      const tick = async () => {
        if (task.cancelRequested) {
          cleanup()
          reject(new UploadCanceledError())
          return
        }
        if (times++ > 40) {
          cleanup()
          reject(new Error('后端处理超时'))
          return
        }
        try {
          const s: any = await request.authget(`${API_BASE}/upload/${task.sessionId}/status`)
          if (s?.status === 'completed') {
            cleanup()
            resolve()
            return
          }
          if (
            s?.status === 'expired' ||
            (s?.expires_at && Date.now() >= new Date(s.expires_at).getTime())
          ) {
            cleanup()
            reject(new SessionExpiredError())
            return
          }
          if (typeof s?.progress === 'number')
            task.progress = Math.max(task.progress, Math.round(s.progress))
          schedule()
        } catch {
          schedule()
        } // 单次查询失败忽略，继续轮询
      }
      tick()
    })
  }

  function stopStatusPolling(localId?: string) {
    if (localId) {
      const t = statusTimers.get(localId)
      if (t) {
        clearTimeout(t)
        statusTimers.delete(localId)
      }
      return
    }
    ;[...statusTimers.keys()].forEach(stopStatusPolling)
  }
  function stopAllPolling() {
    stopStatusPolling()
  }

  function handleUploadError(task: UploadTask, err: any) {
    stopStatusPolling(task.localId)
    if (err instanceof UploadCanceledError) {
      task.status = 'canceled'
      return
    }
    if (err instanceof SessionExpiredError) {
      task.status = 'expired'
      task.errorMessage = '上传会话已过期'
      removePersistedSession(task.localId)
      ElMessage.warning(`${task.fileName} 上传会话已过期，请重新上传`)
      return
    }
    task.status = 'failed'
    task.errorMessage = err?.message || '上传失败'
    ElMessage.error(`${task.fileName} 上传失败：${task.errorMessage}`)
  }

  async function startUpload(localId: string) {
    const task = findTask(localId)
    if (!task) return
    if (!task.file) {
      task.status = 'paused'
      ElMessage.info('请重新选择原文件继续上传')
      return
    }
    task.status = 'uploading'
    task.errorMessage = ''
    task.cancelRequested = false
    try {
      if (!task.sessionId) {
        const data: any = await request.authpost(`${API_BASE}/upload/init`, {
          file_name: task.fileName, // 1~255
          target_folder_id: task.targetFolderId,
          total_size: task.size, // >0，enqueue 已校验
          mime: task.file.type || undefined,
        })
        // TODO: init 响应 schema 待确认，最小假设如下
        task.sessionId = data.session_id
        task.chunkSize = data.chunk_size
        task.totalChunks = data.total_chunks
        task.uploadMode = data.upload_mode
        task.expiresAt = data.expires_at
        task.receivedChunks = 0
        task.missing = Array.from({ length: task.totalChunks }, (_, i) => i)
        persistUploadSession(localId)
      }
      ensureSessionAlive(task)
      await runChunkQueue(task)
      if (task.cancelRequested) throw new UploadCanceledError()
      await request.authpost(`${API_BASE}/upload/${task.sessionId}/complete`)
      await confirmCompleteByPolling(task)
      task.status = 'success'
      task.progress = 100
      task.receivedChunks = task.totalChunks
      task.missing = []
      removePersistedSession(localId)
      ElMessage.success('上传成功')
      if (task.targetFolderId === currentFolderId.value) refreshCurrentFolder(true)
    } catch (err: any) {
      handleUploadError(task, err)
    }
  }

  function enqueueUpload(fileList: File[], targetFolderId: number, targetFolderName: string) {
    const accepted: File[] = []
    for (const file of fileList) {
      if (file.size > MAX_FILE_SIZE) {
        ElMessage.error(`${file.name} 超过单文件 8GB 上限`)
        continue
      }
      if (file.size <= 0) {
        ElMessage.error(`${file.name} 是空文件，无法上传`)
        continue
      } // total_size 必须 >0
      accepted.push(file)
    }
    if (!accepted.length) return
    uploadPanelVisible.value = true
    for (const file of accepted) {
      const task: UploadTask = {
        localId: simpleUuid(),
        fileName: file.name,
        size: file.size,
        targetFolderId,
        targetFolderName,
        file,
        sessionId: null,
        status: 'pending',
        progress: 0,
        chunkSize: 0,
        totalChunks: 0,
        receivedChunks: 0,
        missing: [],
        uploadMode: null,
        expiresAt: null,
        errorMessage: '',
      }
      uploadQueue.value.push(task)
      startUpload(task.localId) // 任务并行，单任务内分片并发受控
    }
  }

  // 恢复 / 重选文件后继续：只补 missing 分片
  async function resumeUpload(localId: string, file: File) {
    const task = findTask(localId)
    if (!task || !file) return
    if (file.name !== task.fileName || file.size !== task.size) {
      ElMessage.error('请选择同一个文件（文件名与大小需一致）')
      return
    }
    task.file = file
    await startUpload(localId)
  }

  async function retryUpload(localId: string) {
    const task = findTask(localId)
    if (!task) return
    if (!task.file) {
      task.status = 'paused'
      ElMessage.info('请重新选择原文件继续上传')
      return
    }
    task.errorMessage = ''
    if (task.expiresAt && Date.now() >= new Date(task.expiresAt).getTime()) task.sessionId = null // 过期会话丢弃重新 init
    task.status = 'pending'
    await startUpload(localId)
  }

  async function cancelUpload(localId: string) {
    const task = findTask(localId)
    if (!task) return
    task.cancelRequested = true
    stopStatusPolling(localId)
    try {
      if (task.sessionId) await request.authdelete(`${API_BASE}/upload/${task.sessionId}`)
    } catch {
      /* 服务端会话可能已结束 */
    }
    task.status = 'canceled'
    removePersistedSession(localId)
    ElMessage.info('已取消上传')
  }

  function removeUpload(localId: string) {
    stopStatusPolling(localId)
    uploadQueue.value = uploadQueue.value.filter((t) => t.localId !== localId)
    removePersistedSession(localId)
  }

  // ---------- session 持久化（localStorage，刷新后恢复） ----------

  function readPersisted(): PersistedRecord[] {
    try {
      return JSON.parse(localStorage.getItem(UPLOAD_SESSIONS_KEY) || '[]')
    } catch {
      return []
    }
  }
  function writePersisted(list: PersistedRecord[]) {
    localStorage.setItem(UPLOAD_SESSIONS_KEY, JSON.stringify(list))
  }
  function removePersistedSession(localId: string) {
    writePersisted(readPersisted().filter((r) => r.localId !== localId))
  }
  function persistUploadSession(localId: string) {
    const task = findTask(localId)
    if (!task || !task.sessionId) return
    const list = readPersisted().filter((r) => r.localId !== localId)
    list.push({
      localId,
      sessionId: task.sessionId,
      fileName: task.fileName,
      size: task.size,
      targetFolderId: task.targetFolderId,
      targetFolderName: task.targetFolderName,
      chunkSize: task.chunkSize,
      totalChunks: task.totalChunks,
      receivedChunks: task.receivedChunks,
      missing: [...task.missing],
      expiresAt: task.expiresAt,
      progress: task.progress,
      uploadMode: task.uploadMode,
    })
    writePersisted(list)
  }

  // 页面初始化时调用：恢复未完成会话（File 句柄已丢失 -> paused，等待用户重选文件续传）
  async function restoreUploadSessions() {
    const list = readPersisted()
    if (!list.length) return
    for (const rec of list) {
      if (!rec.sessionId) continue
      try {
        const s: any = await request.authget(`${API_BASE}/upload/${rec.sessionId}/status`)
        if (s?.status === 'completed' || s?.status === 'canceled') {
          removePersistedSession(rec.localId)
          continue
        }
        if (
          s?.status === 'expired' ||
          (s?.expires_at && Date.now() >= new Date(s.expires_at).getTime())
        ) {
          removePersistedSession(rec.localId)
          continue
        }
        uploadQueue.value.push({
          localId: rec.localId,
          fileName: rec.fileName,
          size: rec.size,
          targetFolderId: rec.targetFolderId,
          targetFolderName: rec.targetFolderName,
          file: null,
          sessionId: rec.sessionId,
          status: 'paused',
          progress: typeof s?.progress === 'number' ? Math.round(s.progress) : rec.progress,
          chunkSize: s?.chunk_size ?? rec.chunkSize ?? 0,
          totalChunks: s?.total_chunks ?? rec.totalChunks ?? 0,
          receivedChunks: s?.received_chunks ?? rec.receivedChunks ?? 0,
          missing: Array.isArray(s?.missing) ? [...s.missing] : [],
          uploadMode: s?.upload_mode ?? rec.uploadMode ?? null,
          expiresAt: s?.expires_at ?? rec.expiresAt ?? null,
          errorMessage: '',
        })
        uploadPanelVisible.value = true
      } catch {
        removePersistedSession(rec.localId)
      }
    }
  }

  // ============================== 权限缓存 ==============================

  function ensurePermEntry(key: string): PermEntry {
    if (!permissionCache.has(key))
      permissionCache.set(
        key,
        reactive<PermEntry>({ loading: false, loaded: false, error: '', items: [] }),
      )
    return permissionCache.get(key) as PermEntry
  }

  async function loadPermissions(
    resourceType: ResourceType,
    resourceId: number,
    force = false,
  ): Promise<PermEntry> {
    const key = `${resourceType}:${resourceId}`
    const entry = ensurePermEntry(key)
    if (entry.loading || (!force && entry.loaded)) return entry
    entry.loading = true
    entry.error = ''
    try {
      const data: any = await request.authget(
        `${API_BASE}/permissions/${resourceType}/${resourceId}`,
      )
      // TODO: 响应结构待确认，最小假设为数组或 { items: [] }
      entry.items = Array.isArray(data) ? data : data?.items || []
      entry.loaded = true
    } catch (e: any) {
      entry.error = e?.message || '加载失败'
    } finally {
      entry.loading = false
    }
    return entry
  }

  function grantPermission(resourceType: ResourceType, resourceId: number, payload: any) {
    return request.authpost(`${API_BASE}/permissions/${resourceType}/${resourceId}`, payload)
  }
  function revokePermission(resourceType: ResourceType, resourceId: number, permId: number) {
    return request.authdelete(`${API_BASE}/permissions/${resourceType}/${resourceId}/${permId}`)
  }
  function transferOwnership(resourceType: ResourceType, resourceId: number, newOwnerId: number) {
    return request.authpost(`${API_BASE}/permissions/${resourceType}/${resourceId}/transfer`, {
      new_owner_id: newOwnerId,
    })
  }

  // ============================== 导出 ==============================

  return {
    // state
    currentFolderId,
    breadcrumb,
    folders,
    files,
    listLoading,
    listError,
    viewMode,
    sortKey,
    sortOrder,
    keyword,
    treeCache,
    treeExpandedPaths,
    uploadQueue,
    uploadPanelVisible,
    permissionCache,
    // getters
    isRoot,
    currentFolder,
    hasFolders,
    hasFiles,
    totalCount,
    visibleFolders,
    visibleFiles,
    uploadingCount,
    completedCount,
    failedCount,
    // 导航与列表
    enterFolder,
    goRoot,
    goToBreadcrumbIndex,
    navigateTo,
    fetchFolder,
    refreshCurrentFolder,
    setViewMode,
    setSort,
    setSortOrder,
    setKeyword,
    // 增删改
    createFolder,
    renameFolder,
    deleteFolder,
    renameFile,
    deleteFile,
    fetchFileDetail,
    // 目录树
    loadTreeNode,
    toggleTreeExpand,
    openTreeRoot,
    // 上传
    enqueueUpload,
    startUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
    removeUpload,
    restoreUploadSessions,
    persistUploadSession,
    stopStatusPolling,
    stopAllPolling,
    // 权限
    loadPermissions,
    grantPermission,
    revokePermission,
    transferOwnership,
  }
})

// 供模板/组件使用的 getter 类型糖
export type CloudStore = ReturnType<typeof useCloudStore>
