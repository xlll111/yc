<!-- 详情弹窗（文件夹 / 文件共用）：字段数组驱动；Tab = 详情 | 协作者；按权限位显示操作 -->
<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue'
import { useCloudStore, parsePermissionBits, CLOUD_PERM } from '@/stores/cloudStore'
import type { ResourceType } from '@/stores/cloudStore'
import { useFileActions } from '@/composables/useFileActions'
import { formatFileSize, resolveMtime } from '@/composables/cloudHelpers'
import { truncateUuid } from '@/composables/cloudHelpers'
import BaseModal from '@/components/cloud/BaseModal.vue'
import PromptModal from '@/components/cloud/PromptModal.vue'
import ConfirmModal from '@/components/cloud/ConfirmModal.vue'
import CollaboratorPanel from '@/components/cloud/CollaboratorPanel.vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    resourceType: ResourceType
    resource: any | null
    downloading?: boolean
  }>(),
  { downloading: false },
)
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'download', file: any): void
  (e: 'changed'): void
}>()

const store = useCloudStore()
const { acting, renameResource, deleteResource } = useFileActions()

// TODO: inject key 按项目实际确认
const $filters = inject<any>('$filters', { formatDateTime: (v: string) => v || '—' })
const fmt = (v?: string) => $filters.formatDateTime(v)

// 打开时拷贝一份，避免直接改 prop；同时拉权限
const local = ref<any>(null)
const metaInfo = ref<any>(null)
const tab = ref<'info' | 'collab'>('info')

watch(
  () => [props.visible, props.resource],
  async () => {
    if (!props.visible) return
    local.value = props.resource ? { ...props.resource } : null
    metaInfo.value = null
    tab.value = 'info'
    renameVisible.value = false
    delVisible.value = false
    store.loadPermissions(props.resourceType, props.resource?.id) // 详情页需要「我的权限」行
    // 文件详情可先调下载 meta 补充（TODO: 字段待确认，失败不影响展示）
    if (props.resourceType === 'file' && props.resource?.id) {
      try {
        const { request } = await import('@/utils/request') // TODO: 路径按项目调整
        metaInfo.value = await request.get(`/api/cloud/download/${props.resource.id}/meta`)
      } catch {
        /* meta 仅为补充信息 */
      }
    }
  },
)

// ---- 我的权限位 ----
const myPerm = computed(() => {
  const items = store.permissionCache.get(`${props.resourceType}:${local.value?.id}`)?.items || []
  const me = items.find((i: any) => i.user_id === userStoreId())
  return Number(me?.permission) || 0
})
// TODO: userStore 路径按项目调整；此函数由页面注入更佳，这里用延迟导入会引入循环，改为 prop 亦可
function userStoreId(): number | null {
  return (window as any).__yc_uid ?? null
}

const canRead = computed(() => (myPerm.value & CLOUD_PERM.READ) !== 0)
const canWrite = computed(() => (myPerm.value & CLOUD_PERM.WRITE) !== 0)
const canDelete = computed(() => (myPerm.value & CLOUD_PERM.DELETE) !== 0)
const permText = computed(() => {
  const labels = parsePermissionBits(myPerm.value).map((b) => b.label)
  return labels.length ? labels.join(' / ') : '—'
})

// ---- 字段数组驱动（后续加字段/预览入口只改这里） ----
const infoFields = computed(() => {
  const r = local.value
  if (!r) return []
  if (props.resourceType === 'folder') {
    return [
      { label: '名称', value: r.name || '—' },
      {
        label: '父目录',
        value: r.parent_id == null ? '我的云盘' : `文件夹 #${truncateUuid(r.parent_id)}`,
      },
      { label: '创建时间', value: fmt(r.created_at) },
      { label: '修改时间', value: fmt(resolveMtime(r)) },
      { label: '我的权限', value: permText.value },
    ]
  }
  return [
    { label: '文件名', value: r.name || '—' },
    {
      label: '所在目录',
      value:
        (r.folder_id ?? r.parent_id) == null
          ? '我的云盘'
          : `#${truncateUuid(r.folder_id ?? r.parent_id)}`,
    },
    { label: '大小', value: formatFileSize(metaInfo.value?.total_size ?? r.size) },
    { label: '类型', value: r.mime || '—' },
    { label: '修改时间', value: fmt(resolveMtime(r)) },
    { label: '创建时间', value: fmt(r.created_at) },
    { label: '我的权限', value: permText.value },
  ]
})

// ---- 重命名 ----
const renameVisible = ref(false)
async function onRename(name: string) {
  if (!local.value) return
  const ok = await renameResource(props.resourceType, local.value.id, name)
  if (ok) {
    local.value.name = name
    renameVisible.value = false
    emit('changed')
  }
}

// ---- 删除 ----
const delVisible = ref(false)
const delMessage = computed(() =>
  props.resourceType === 'folder'
    ? '删除后该文件夹及其中所有内容将不可访问，是否继续？'
    : '删除后该文件将不可访问，是否继续？',
)
async function onDelete() {
  if (!local.value) return
  const ok = await deleteResource(props.resourceType, local.value.id)
  if (ok) {
    delVisible.value = false
    emit('close')
    emit('changed')
  }
}
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="resourceType === 'folder' ? '文件夹详情' : '文件详情'"
    @close="emit('close')"
  >
    <div class="tabs">
      <button type="button" :class="{ active: tab === 'info' }" @click="tab = 'info'">详情</button>
      <button type="button" :class="{ active: tab === 'collab' }" @click="tab = 'collab'">
        协作者
      </button>
    </div>

    <div v-show="tab === 'info'" class="info-list">
      <div v-for="f in infoFields" :key="f.label" class="info-row">
        <span class="label">{{ f.label }}</span>
        <span class="value">{{ f.value }}</span>
      </div>
    </div>

    <div v-show="tab === 'collab'">
      <CollaboratorPanel
        v-if="local"
        :resource-type="resourceType"
        :resource-id="local.id"
        @changed="emit('changed')"
      />
    </div>

    <template #footer>
      <div class="foot">
        <button v-if="canDelete" class="danger-btn" @click="delVisible = true">删除</button>
        <span class="spacer" />
        <button v-if="canWrite" class="secondary-btn" @click="renameVisible = true">重命名</button>
        <button
          v-if="resourceType === 'file' && canRead"
          class="secondary-btn"
          :disabled="downloading"
          @click="local && emit('download', local)"
        >
          <Spinner v-if="downloading" size="tiny" /><span>{{
            downloading ? '下载中' : '下载'
          }}</span>
        </button>
        <button class="primary-btn" @click="emit('close')">关闭</button>
      </div>
    </template>

    <PromptModal
      :visible="renameVisible"
      title="重命名"
      :initial-value="local?.name || ''"
      :submitting="acting"
      confirm-text="保存"
      @close="renameVisible = false"
      @confirm="onRename"
    />
    <ConfirmModal
      :visible="delVisible"
      title="删除"
      :message="delMessage"
      confirm-text="删除"
      danger
      :submitting="acting"
      @close="delVisible = false"
      @confirm="onDelete"
    />
  </BaseModal>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
.tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 9999px 9999px 0 0;
  font-size: 14px;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.tabs button.active {
  color: var(--c-primary, #1e40af);
  font-weight: 500;
  box-shadow: inset 0 -2px 0 var(--c-primary, #1e40af);
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
}
.info-row:last-child {
  border-bottom: none;
}
.info-row .label {
  flex: none;
  width: 76px;
  font-size: 13px;
  color: var(--c-text-sub, #6b7280);
}
.info-row .value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text, #374151);
  word-break: break-word;
}

.foot {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.foot .spacer {
  flex: 1;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border: none;
  border-radius: 9999px;
  background: var(--c-primary, #1e40af);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.primary-btn:hover {
  background: var(--c-primary-deep, #1e3a8a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: #fff;
  color: var(--c-text, #374151);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.secondary-btn:hover:not(:disabled) {
  background: var(--c-bg, #f9fafb);
  border-color: var(--c-text-weak, #9ca3af);
}
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: #fff;
  color: var(--c-danger-text, #b91c1c);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.danger-btn:hover {
  background: var(--c-danger-bg, #fef2f2);
}

@media (max-width: 480px) {
  .info-row .label {
    width: 64px;
  }
}
</style>
