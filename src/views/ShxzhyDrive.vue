<template>
  <div class="mirror-page">
    <div class="container">
      <!-- ===== 页头 ===== -->
      <header class="page-header">
        <div class="header-text">
          <h1 class="page-title">慧云云盘镜像</h1>
          <p class="page-subtitle">下载已同步至云端的文件</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" :disabled="isRefreshing" @click="handleRefresh">
            <svg
              class="icon"
              :class="{ spinning: isRefreshing }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            <span>刷新</span>
          </button>
        </div>
      </header>

      <!-- ===== 概览状态 ===== -->
      <section class="stat-bar">
        <div class="stat-item">
          <span class="stat-label">最近检查</span>
          <span class="stat-value">{{ lastScanText }}</span>
        </div>
        <span class="stat-sep" />
        <div class="stat-item">
          <span class="stat-label">文件总数</span>
          <span class="stat-value">{{ total }}</span>
        </div>
        <span class="stat-sep" />
        <div class="stat-item">
          <span class="stat-label">同步状态</span>
          <span class="status-pill" :class="scanPillClass">
            <i class="pill-dot" />
            {{ scanStatusText }}
          </span>
        </div>
      </section>

      <!-- ===== 工具栏 ===== -->
      <section class="toolbar">
        <div class="search-wrap">
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="搜索文件名…"
            @keyup.enter="handleSearch"
          />
          <button v-if="keyword" class="search-clear" type="button" @click="clearKeyword">×</button>
        </div>

        <div class="toolbar-right">
          <div class="segmented">
            <button
              class="seg-btn"
              :class="{ active: viewMode === 'list' }"
              @click="switchView('list')"
            >
              <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M8 6h13M8 12h13M8 18h13" />
                <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
              </svg>
              列表
            </button>
            <button
              class="seg-btn"
              :class="{ active: viewMode === 'tree' }"
              @click="switchView('tree')"
            >
              <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                />
              </svg>
              目录
            </button>
          </div>

          <label class="switch-wrap">
            <ToggleSwitch v-model="includeDeleted" />
            <span>显示已删除</span>
          </label>
        </div>
      </section>

      <!-- ===== 列表视图 ===== -->
      <div v-if="viewMode === 'list'" class="view-body">
        <!-- 加载态 -->
        <div v-if="listLoading" class="state-box">
          <svg
            class="state-icon spinning"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p class="state-title">正在加载文件列表…</p>
        </div>

        <!-- 错误态 -->
        <div v-else-if="listError" class="state-box">
          <svg
            class="state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p class="state-title">{{ listError }}</p>
          <button class="btn btn-primary btn-sm" @click="fetchFiles">重新加载</button>
        </div>

        <!-- 空态 -->
        <div v-else-if="!files.length" class="state-box">
          <svg
            class="state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            />
          </svg>
          <p class="state-title">{{ keyword ? '没有匹配的文件' : '暂无同步文件' }}</p>
          <p class="state-desc">
            {{
              keyword ? '换个关键词试试，或清空搜索条件' : '客户端完成一次同步后，文件会出现在这里'
            }}
          </p>
        </div>

        <!-- 表格 -->
        <template v-else>
          <div class="file-table">
            <div class="table-head">
              <span class="col">文件名</span>
              <span class="col">所在目录</span>
              <span class="col">大小</span>
              <span class="col">修改时间</span>
              <span class="col">状态</span>
              <span class="col col-op-head">操作</span>
            </div>

            <div
              v-for="item in files"
              :key="item.id"
              class="table-row"
              :class="{ 'is-deleted': item.is_deleted }"
            >
              <div class="col col-name" data-label="文件名">
                <span class="file-avatar" :class="getFileIcon(item.filename).cls">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path v-for="(d, i) in getFileIcon(item.filename).paths" :key="i" :d="d" />
                  </svg>
                </span>
                <span class="file-name" :title="item.filename">{{ item.filename }}</span>
              </div>

              <div class="col col-dir" data-label="所在目录">
                <span class="dir-text" :title="item.rel_dir">{{ item.rel_dir || '根目录' }}</span>
              </div>

              <div class="col col-size" data-label="大小">{{ formatSize(item.size) }}</div>

              <div class="col col-time" data-label="修改时间">{{ formatTime(item.mtime) }}</div>

              <div class="col col-status" data-label="状态">
                <span class="status-pill" :class="item.is_deleted ? 'is-danger' : 'is-success'">
                  <i class="pill-dot" />
                  {{ item.is_deleted ? '已删除' : '正常' }}
                </span>
              </div>

              <div class="col col-op" data-label="操作">
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="downloadingId === item.id"
                  @click="handleDownload(item)"
                >
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 11 5 5 5-5" />
                    <path d="M4 20h16" />
                  </svg>
                  {{ downloadingId === item.id ? '获取中' : '下载' }}
                </button>
                <button class="btn btn-ghost btn-sm" @click="openDetail(item)">详情</button>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
            <span class="page-info">{{ page }} / {{ totalPages }}</span>
            <button class="page-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">
              下一页
            </button>
          </div>
        </template>
      </div>

      <!-- ===== 目录树视图 ===== -->
      <div v-else class="view-body">
        <div v-if="treeLoading" class="state-box">
          <svg
            class="state-icon spinning"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p class="state-title">正在加载目录结构…</p>
        </div>

        <div v-else-if="treeError" class="state-box">
          <svg
            class="state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <p class="state-title">{{ treeError }}</p>
          <button class="btn btn-primary btn-sm" @click="loadTree">重新加载</button>
        </div>

        <div v-else-if="!flatTree.length" class="state-box">
          <svg
            class="state-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            />
          </svg>
          <p class="state-title">暂无目录数据</p>
        </div>

        <TransitionGroup v-else name="tree" tag="div" class="tree-view">
          <div
            v-for="node in flatTree"
            :key="`${node.type}-${node.path}-${node.file_id ?? 'd'}`"
            class="tree-node"
            :class="{ 'is-file': !node.isDir, 'is-dir': node.isDir }"
            :style="{ paddingLeft: `${12 + node.depth * 22}px` }"
            @click="
              node.isDir
                ? toggleDir(node.path)
                : handleDownload({ id: node.file_id, filename: node.name })
            "
          >
            <template v-if="node.isDir">
              <span class="tree-toggle" :class="{ open: node.expanded }">
                <svg
                  class="chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
              <span class="tree-icon dir-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  />
                </svg>
              </span>
              <span class="tree-name">{{ node.name }}</span>
              <span v-if="node.children?.length" class="tree-count">
                {{ node.children.length }}
              </span>
            </template>

            <template v-else>
              <span class="tree-toggle placeholder" />
              <span class="tree-icon" :class="getFileIcon(node.name).cls">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path v-for="(d, i) in getFileIcon(node.name).paths" :key="i" :d="d" />
                </svg>
              </span>
              <Spinner v-if="downloadingId === node.file_id" inline size="tiny" />
              <span class="tree-name" :class="{ 'is-deleted': node.is_deleted }">
                {{ node.name }}
              </span>
              <span v-if="node.is_deleted" class="status-pill is-danger tree-flag">
                <i class="pill-dot" />已删除
              </span>
              <span class="tree-size">{{ formatSize(node.size) }}</span>
            </template>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- ===== 详情弹窗 ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailVisible" class="modal-mask" @click.self="detailVisible = false">
          <div class="modal-card">
            <div class="modal-head">
              <h3 class="modal-title">文件详情</h3>
              <button class="modal-close" type="button" @click="detailVisible = false">×</button>
            </div>

            <div v-if="detailLoading" class="modal-loading">
              <svg
                class="state-icon spinning"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>正在加载详情…</span>
            </div>

            <div v-else-if="detail" class="modal-body">
              <div class="info-row">
                <span class="info-label">文件名</span>
                <span class="info-value">{{ detail.filename }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">所在目录</span>
                <span class="info-value">{{ detail.rel_dir || '根目录' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">文件大小</span>
                <span class="info-value">{{ formatSize(detail.size) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">修改时间</span>
                <span class="info-value">{{ formatTime(detail.mtime) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">同步时间</span>
                <span class="info-value">{{ formatTime(detail.updated_at) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">文件状态</span>
                <span class="info-value">
                  <span class="status-pill" :class="detail.is_deleted ? 'is-danger' : 'is-success'">
                    <i class="pill-dot" />
                    {{ detail.is_deleted ? '已删除' : '正常' }}
                  </span>
                </span>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn btn-secondary" @click="detailVisible = false">关闭</button>
              <button
                class="btn btn-primary"
                :disabled="!detail || downloadingId === detail.id"
                @click="handleDownload(detail)"
              >
                {{ downloadingId === detail?.id ? '获取中…' : '下载文件' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useRouter } from 'vue-router'
import { request } from '@/utils/request'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import { useUserStore } from '@/stores/userStore'
import Spinner from '@/components/Spinner.vue'
const router = useRouter()
const userStore = useUserStore()
if (!userStore.isLoggedIn) {
  ElMessage.error('未登录')
  router.push('/login')
}
const { proxy } = getCurrentInstance()

/* ---------------- 基础状态 ---------------- */
const viewMode = ref('tree') // list | tree
const includeDeleted = ref(true)
const keyword = ref('')

const files = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const listLoading = ref(false)
const listError = ref('')
const downloadingId = ref(null)
const isRefreshing = ref(false)

const treeData = ref(null)
const expandedPaths = ref(new Set())
const treeLoading = ref(false)
const treeError = ref('')

const scanInfo = ref(null)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

/* ---------------- 计算属性 ---------------- */
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const lastScanText = computed(() => {
  if (!scanInfo.value) return '暂无记录'
  return formatTime(scanInfo.value.finished_at)
})

const scanStatusText = computed(() => {
  if (!scanInfo.value) return '未知'
  return scanInfo.value.status === 'success' ? '同步正常' : '同步异常'
})

const scanPillClass = computed(() => {
  if (!scanInfo.value) return 'is-muted'
  return scanInfo.value.status === 'success' ? 'is-success' : 'is-danger'
})

/** 目录树扁平化（用于缩进渲染） */
const flatTree = computed(() => {
  const out = []
  if (!treeData.value) return out

  const walk = (node, depth) => {
    const children = [...(node.children || [])].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return String(a.name).localeCompare(String(b.name), 'zh-CN')
    })

    for (const child of children) {
      const isDir = child.type === 'dir'
      const expanded = isDir && expandedPaths.value.has(child.path)
      out.push({ ...child, depth, isDir, expanded })
      if (expanded) walk(child, depth + 1)
    }
  }

  walk(treeData.value, 0)
  return out
})

/* ---------------- 工具函数 ---------------- */
const pad2 = (n) => String(n).padStart(2, '0')

const formatTime = (val) => {
  if (val === null || val === undefined || val === '') return '—'

  const date =
    typeof val === 'number'
      ? new Date(val < 1e12 ? val * 1000 : val) // 兼容秒级/毫秒级时间戳
      : new Date(val)

  if (Number.isNaN(date.getTime())) return '—'

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`
}
const formatSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

/* ---------------- 数据请求 ---------------- */
const fetchFiles = async () => {
  listLoading.value = true
  listError.value = ''
  try {
    const res = await request.authget('/api/files', null, {
      params: {
        page: page.value,
        page_size: pageSize,
        name: keyword.value.trim() || undefined,
        include_deleted: includeDeleted.value,
      },
    })
    const data = res?.data ?? res
    files.value = Array.isArray(data?.items) ? data.items : []
    total.value = Number(data?.total) || 0
  } catch (e) {
    listError.value = '文件列表加载失败，请稍后重试'
    files.value = []
    total.value = 0
  } finally {
    listLoading.value = false
  }
}

const loadTree = async () => {
  treeLoading.value = true
  treeError.value = ''
  try {
    const res = await request.authget('/api/files/tree', null, {
      params: { include_deleted: includeDeleted.value },
    })
    const data = res?.data ?? res
    treeData.value = data || { name: '', type: 'dir', path: '', children: [] }

    // // 默认展开所有目录，方便一眼看到全部文件
    // const all = new Set()
    // const walk = (node) => {
    //   ;(node.children || []).forEach((child) => {
    //     if (child.type === 'dir') {
    //       all.add(child.path)
    //       walk(child)
    //     }
    //   })
    // }
    // walk(treeData.value)
    // expandedPaths.value = all
    // 默认收起所有目录
    expandedPaths.value = new Set()
  } catch (e) {
    treeError.value = '目录结构加载失败，请稍后重试'
    treeData.value = null
  } finally {
    treeLoading.value = false
  }
}

const loadScanStatus = async () => {
  try {
    const res = await request.authget('/api/files/scan-status/latest')
    scanInfo.value = res?.data ?? res ?? null
  } catch (e) {
    scanInfo.value = null
  }
}

/* ---------------- 交互 ---------------- */
const switchView = (mode) => {
  if (viewMode.value === mode) return
  viewMode.value = mode
  if (mode === 'tree' && !treeData.value && !treeLoading.value) loadTree()
  if (mode === 'list' && !listLoading.value && !files.value.length) fetchFiles()
}

const toggleDir = (path) => {
  const next = new Set(expandedPaths.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  expandedPaths.value = next
}

const handleSearch = () => {
  page.value = 1
  switchView('list')
  fetchFiles()
}

const clearKeyword = () => {
  keyword.value = ''
  page.value = 1
  fetchFiles()
}

const goPage = (target) => {
  if (target < 1 || target > totalPages.value) return
  page.value = target
  fetchFiles()
}

const handleRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    if (viewMode.value === 'tree') await loadTree()
    else await fetchFiles()
    await loadScanStatus()
    ElMessage.success('刷新成功')
  } finally {
    isRefreshing.value = false
  }
}

const handleDownload = async (item) => {
  if (!item?.id || downloadingId.value) return
  downloadingId.value = item.id
  try {
    const res = await request.authget(`/api/files/${item.id}/download-url`)
    const data = res?.data ?? res
    const url = data?.download_url
    if (!url) throw new Error('empty download url')

    // 用隐藏 iframe 触发下载，不会打开新窗口
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    // 稍后清理
    setTimeout(() => document.body.removeChild(iframe), 60_000)

    ElMessage.success('下载链接已获取，正在下载…')
  } catch (e) {
    ElMessage.error('获取下载链接失败，请稍后重试')
  } finally {
    downloadingId.value = null
  }
}

const openDetail = async (item) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await request.authget(`/api/files/${item.id}`)
    console.log('detail', item, res) // debug
    detail.value = res?.data ?? res
  } catch (e) {
    ElMessage.error('文件详情加载失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}
/* ---------------- 文件类型图标 ---------------- */
const getExt = (filename) => {
  if (!filename) return ''
  const idx = filename.lastIndexOf('.')
  return idx > -1 ? filename.slice(idx + 1).toLowerCase() : ''
}

// 类型 -> { 颜色类名, SVG path }
const FILE_ICON_MAP = {
  // 文档
  doc: {
    cls: 'icon-word',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 13h6M9 17h6',
    ],
  },
  docx: {
    cls: 'icon-word',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 13h6M9 17h6',
    ],
  },
  // 表格
  xls: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  xlsx: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  csv: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  // 演示
  ppt: {
    cls: 'icon-ppt',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 17v-6h2.5a1.5 1.5 0 0 1 0 3H9',
    ],
  },
  pptx: {
    cls: 'icon-ppt',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 17v-6h2.5a1.5 1.5 0 0 1 0 3H9',
    ],
  },
  // PDF
  pdf: {
    cls: 'icon-pdf',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M8 17v-6h2a1.5 1.5 0 0 1 0 3H8M13 17v-6h1.5a3 3 0 0 1 0 6H13',
    ],
  },
  // 图片
  jpg: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  jpeg: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  png: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  gif: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  // 压缩包
  zip: {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  rar: {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  '7z': {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  // 音视频
  mp4: {
    cls: 'icon-video',
    paths: [
      'm10 8 6 4-6 4z',
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  mov: {
    cls: 'icon-video',
    paths: [
      'm10 8 6 4-6 4z',
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  mp3: {
    cls: 'icon-audio',
    paths: [
      'M9 18V5l10-2v13',
      'M6 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
      'M16 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
    ],
  },
  wav: {
    cls: 'icon-audio',
    paths: [
      'M9 18V5l10-2v13',
      'M6 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
      'M16 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
    ],
  },
  // 代码
  js: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  ts: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  vue: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  py: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  json: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
}

const DEFAULT_ICON = {
  cls: 'icon-file',
  paths: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
}

const getFileIcon = (filename) => {
  const ext = getExt(filename)
  return FILE_ICON_MAP[ext] || DEFAULT_ICON
}
/* ---------------- 副作用 ---------------- */
watch(includeDeleted, () => {
  page.value = 1
  if (viewMode.value === 'tree') loadTree()
  else fetchFiles()
})

onMounted(() => {
  fetchFiles()
  loadTree()
  loadScanStatus()
})
</script>

<style scoped>
/* ===== 设计令牌 ===== */
.mirror-page {
  --primary: #1e40af;
  --primary-dark: #1e3a8a;
  --primary-soft: rgba(30, 64, 175, 0.08);
  --text: #374151;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --bg-page: #f9fafb;
  --bg-card: #ffffff;
  --success: #22c55e;
  --success-bg: #dcfce7;
  --success-text: #166534;
  --danger: #ef4444;
  --danger-bg: #fef2f2;
  --danger-text: #b91c1c;
  --radius-card: 8px;
  --radius-btn: 9999px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;

  flex: 1;
  width: 100%;
  background: var(--bg-page);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ===== 页头 ===== */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--primary);
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* ===== 按钮 ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 26px;
  border: none;
  border-radius: var(--radius-btn);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: var(--transition);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:not(:disabled):hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.btn-primary:not(:disabled):active {
  transform: translateY(0);
  box-shadow: none;
}

.btn-secondary {
  background: #fff;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:not(:disabled):hover {
  background: var(--bg-page);
  border-color: #d1d5db;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-ghost:not(:disabled):hover {
  background: var(--bg-page);
  color: var(--text);
  border-color: #d1d5db;
}

.btn-sm {
  padding: 7px 16px;
  font-size: 13px;
}

.btn-xs {
  padding: 5px 14px;
  font-size: 12px;
}

.btn .icon {
  width: 16px;
  height: 16px;
}

.icon.spinning {
  animation: spin 0.9s linear infinite;
}

/* ===== 概览状态条 ===== */
.stat-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.stat-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
}

/* ===== 状态徽章 ===== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-btn);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.status-pill .pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.status-pill.is-success {
  background: var(--success-bg);
  color: var(--success-text);
}

.status-pill.is-success .pill-dot {
  background: var(--success);
}

.status-pill.is-danger {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.status-pill.is-danger .pill-dot {
  background: var(--danger);
}

.status-pill.is-muted {
  background: var(--border-light);
  color: var(--text-secondary);
}

.status-pill.is-muted .pill-dot {
  background: var(--text-muted);
}

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 36px 10px 38px;
  font-family: inherit;
  font-size: 14px;
  color: var(--text);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  outline: none;
  transition: var(--transition);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--border-light);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: var(--transition);
}

.search-clear:hover {
  background: var(--border);
  color: var(--text);
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.segmented {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--border-light);
  border-radius: var(--radius-btn);
}

.seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  border-radius: var(--radius-btn);
  background: transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.seg-btn:hover {
  color: var(--text);
}

.seg-btn.active {
  background: #fff;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.seg-btn .icon {
  width: 15px;
  height: 15px;
}

.switch-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

/* ===== 三态提示 ===== */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  background: var(--bg-page);
  border: 1px dashed var(--border);
  border-radius: var(--radius-card);
  text-align: center;
}

.state-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
}

.state-icon.spinning {
  color: var(--primary);
  animation: spin 0.9s linear infinite;
}

.state-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
}

.state-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* ===== 文件表格 ===== */
.file-table {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.3fr) 90px 150px 96px 172px;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
}

.table-head {
  background: var(--bg-page);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}

.table-row {
  border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #fafbfc;
}

.col {
  min-width: 0;
}

.col-op-head {
  text-align: right;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-avatar {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
}

.file-avatar svg {
  width: 32px;
  height: 32px;
}
/* ===== 文件类型图标配色 ===== */
.file-avatar.icon-word,
.tree-icon.icon-word {
  color: #2b579a;
  background: rgba(43, 87, 154, 0.1);
}

.file-avatar.icon-excel,
.tree-icon.icon-excel {
  color: #217346;
  background: rgba(33, 115, 70, 0.1);
}

.file-avatar.icon-ppt,
.tree-icon.icon-ppt {
  color: #d24726;
  background: rgba(210, 71, 38, 0.1);
}

.file-avatar.icon-pdf,
.tree-icon.icon-pdf {
  color: #e5252a;
  background: rgba(229, 37, 42, 0.1);
}

.file-avatar.icon-image,
.tree-icon.icon-image {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

.file-avatar.icon-zip,
.tree-icon.icon-zip {
  color: #b45309;
  background: rgba(180, 83, 9, 0.1);
}

.file-avatar.icon-video,
.tree-icon.icon-video {
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
}

.file-avatar.icon-audio,
.tree-icon.icon-audio {
  color: #db2777;
  background: rgba(219, 39, 119, 0.1);
}

.file-avatar.icon-code,
.tree-icon.icon-code {
  color: #0f766e;
  background: rgba(15, 118, 110, 0.1);
}

.file-avatar.icon-file,
.tree-icon.icon-file {
  color: var(--text-muted);
  background: var(--border-light);
}

.file-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-row.is-deleted .file-name {
  color: var(--text-muted);
  text-decoration: line-through;
}
.tree-name.is-downloading {
  color: var(--text-muted);
  cursor: wait;
}
.dir-text {
  display: block;
  overflow: hidden;
  font-size: 13px;
  color: var(--text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-size,
.col-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.col-op {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  background: #fff;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.page-btn:not(:disabled):hover {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-secondary);
}

/* ===== 目录树 ===== */
.tree-view {
  padding: 6px 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 1px 0;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
  will-change: background-color;
}

.tree-node:hover {
  background: #f3f6fb;
}

.tree-node:active {
  background: #e8eef8;
  transform: scale(0.998);
}

.tree-node.is-file:hover {
  background: var(--primary-soft);
}

.tree-node.is-file:active {
  background: rgba(30, 64, 175, 0.14);
}

.tree-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: color 0.15s ease;
}

.tree-node:hover .tree-toggle {
  color: var(--primary);
}

.tree-toggle.placeholder {
  visibility: hidden;
  cursor: default;
}

.chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.tree-toggle.open .chevron,
.chevron.open {
  transform: rotate(90deg);
}

.tree-icon {
  flex: none;
  display: inline-flex;
  width: 18px;
  height: 18px;
}

.tree-icon svg {
  width: 100%;
  height: 100%;
}

.dir-icon {
  color: var(--primary);
}

.file-icon {
  color: var(--text-muted);
}

.tree-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-name.is-deleted {
  color: var(--text-muted);
  text-decoration: line-through;
}

.tree-count {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--border-light);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tree-node.is-dir:hover .tree-count {
  background: #fff;
  color: var(--primary);
}

.tree-flag {
  flex: none;
}

.tree-size {
  flex: none;
  margin-right: 8px;
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.tree-node.is-file:hover .tree-size {
  opacity: 1;
}

/* ===== 目录树过渡动画 ===== */
.tree-enter-active,
.tree-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tree-enter-from,
.tree-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.tree-leave-active {
  position: absolute;
  width: 100%;
}

.tree-move {
  transition: transform 0.25s ease;
}

/* ===== 弹窗 ===== */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.modal-card {
  --primary: #1e40af;
  --primary-dark: #1e3a8a;
  --primary-soft: rgba(30, 64, 175, 0.08);
  --text: #374151;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --bg-page: #f9fafb;
  --radius-card: 8px;
  --radius-btn: 9999px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --transition: all 0.2s ease;

  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  color: #374151;
  animation: slideUp 0.25s ease;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--border-light);
  color: var(--text);
}

.modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.modal-loading .state-icon {
  width: 24px;
  height: 24px;
  color: var(--primary);
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
}

.info-label {
  flex: none;
  width: 76px;
  color: var(--text-secondary);
}

.info-value {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: var(--text);
  word-break: break-word;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* ===== 动画 ===== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions .btn {
    width: 100%;
  }

  .stat-bar {
    gap: 12px;
    padding: 14px 16px;
  }

  .stat-sep {
    display: none;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrap {
    max-width: none;
  }

  .toolbar-right {
    justify-content: space-between;
  }

  /* 表格转卡片 */
  .file-table {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .table-head {
    display: none;
  }

  .table-row {
    display: block;
    margin-bottom: 12px;
    padding: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm);
  }

  .table-row:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .table-row .col {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 5px 0;
  }

  .table-row .col::before {
    content: attr(data-label);
    flex: none;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .col-name {
    justify-content: flex-start !important;
    padding-bottom: 12px !important;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border-light);
  }

  .col-name::before {
    display: none;
  }

  .col-dir,
  .col-size,
  .col-time,
  .col-status {
    text-align: right;
  }

  .col-op {
    justify-content: flex-end !important;
    padding-top: 12px !important;
  }

  .col-op::before {
    display: none;
  }

  .col-op .btn {
    flex: 1;
  }

  /* 目录树 */
  .tree-node {
    padding-right: 14px;
  }

  .tree-size {
    display: none;
  }

  /* 弹窗 */
  .modal-mask {
    padding: 12px;
  }

  .modal-card {
    padding: 20px;
  }
}

@media (max-width: 380px) {
  .seg-btn span {
    display: none;
  }

  .info-label {
    width: 64px;
  }
}

/* 触屏设备：用 :active 替代 hover 效果 */
@media (hover: none) {
  .tree-node:hover {
    background: transparent;
  }

  .tree-node.is-file:hover {
    background: transparent;
  }

  .tree-node.is-dir:hover .tree-count {
    background: var(--border-light);
    color: var(--text-muted);
  }

  .tree-node.is-file:hover .tree-size {
    opacity: 0.7;
  }

  .tree-node:active {
    background: #e8eef8;
  }

  .tree-node.is-file:active {
    background: rgba(30, 64, 175, 0.14);
  }
}
</style>
