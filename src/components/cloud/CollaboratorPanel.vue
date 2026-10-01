<!-- 协作者面板：权限位解析多标签；添加/移除/移交，按 SHARE/MANAGE 位控制入口 -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useCloudStore, parsePermissionBits, CLOUD_PERM } from '@/stores/cloudStore'
import type { ResourceType } from '@/stores/cloudStore'
import { useUserStore } from '@/stores/userStore' // TODO: 按项目实际路径调整
import { truncateUuid } from '@/composables/cloudHelpers'
import AddCollaboratorModal from '@/components/cloud/AddCollaboratorModal.vue'
import TransferOwnerModal from '@/components/cloud/TransferOwnerModal.vue'
import ConfirmModal from '@/components/cloud/ConfirmModal.vue'

const props = defineProps<{ resourceType: ResourceType; resourceId: number }>()
const emit = defineEmits<{ (e: 'changed'): void }>()

const store = useCloudStore()
// TODO: userStore 路径与 getUserInfo 形态按项目实际调整
const userStore = useUserStore()
const myId = computed(() => userStore.getUserInfo?.id ?? userStore.getUserInfo?.id)

const entry = computed(
  () =>
    store.permissionCache.get(`${props.resourceType}:${props.resourceId}`) || {
      loading: false,
      loaded: false,
      error: '',
      items: [] as any[],
    },
)

async function reload(force = true) {
  return store.loadPermissions(props.resourceType, props.resourceId, force)
}
onMounted(() => reload(false))
watch(
  () => [props.resourceType, props.resourceId],
  () => reload(false),
)

// 我对该资源的权限位（系统级 permissions 与资源级权限是两套，勿混）
const myPerm = computed(() => {
  const me = (entry.value.items || []).find((i: any) => i.user_id === myId.value)
  return Number(me?.permission) || 0
})
const canShare = computed(() => (myPerm.value & CLOUD_PERM.SHARE) !== 0)
const canManage = computed(() => (myPerm.value & CLOUD_PERM.MANAGE) !== 0)

const TAG_CLS: Record<string, string> = {
  READ: 'gray',
  WRITE: 'blue',
  DELETE: 'warn',
  SHARE: 'green',
  MANAGE: 'deep',
}

// ---- 添加协作者 ----
const addVisible = ref(false)
const submitting = ref(false)
async function onAddSubmit(payload: { user_id: number; permission: number }) {
  submitting.value = true
  try {
    // TODO: PermissionCreate 字段待确认，最小假设 { user_id, permission(位掩码) }
    await store.grantPermission(props.resourceType, props.resourceId, payload)
    ElMessage.success('已添加协作者')
    addVisible.value = false
    await reload(true)
  } catch (e: any) {
    ElMessage.error(e?.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

// ---- 移除协作者 ----
const removeVisible = ref(false)
const removeTarget = ref<any>(null)
function askRemove(item: any) {
  removeTarget.value = item
  removeVisible.value = true
}
async function onRemoveConfirm() {
  const item = removeTarget.value
  if (!item) return
  submitting.value = true
  try {
    await store.revokePermission(props.resourceType, props.resourceId, item.id ?? item.perm_id)
    ElMessage.success('已移除')
    removeVisible.value = false
    removeTarget.value = null
    await reload(true)
  } catch (e: any) {
    ElMessage.error(e?.message || '移除失败')
  } finally {
    submitting.value = false
  }
}

// ---- 移交所有权 ----
const transferVisible = ref(false)
async function onTransferSubmit(newOwnerId: number) {
  submitting.value = true
  try {
    await store.transferOwnership(props.resourceType, props.resourceId, newOwnerId)
    ElMessage.warning('已移交所有权')
    transferVisible.value = false
    await reload(true)
    emit('changed')
  } catch (e: any) {
    ElMessage.error(e?.message || '移交失败')
  } finally {
    submitting.value = false
  }
}

function initials(name?: string) {
  const n = String(name || '').trim()
  return n ? n.slice(0, 1).toUpperCase() : '?'
}
</script>

<template>
  <div class="collab">
    <div class="collab-head">
      <span class="collab-title">协作者</span>
      <div class="collab-acts">
        <button v-if="canShare" class="ghost-btn sm" @click="addVisible = true">添加协作者</button>
        <button v-if="canManage" class="ghost-btn sm" @click="transferVisible = true">
          移交所有权
        </button>
      </div>
    </div>

    <div v-if="entry.loading" class="collab-state"><Spinner size="inline" /></div>
    <div v-else-if="entry.error" class="collab-state error">
      <span>{{ entry.error }}</span>
      <button class="ghost-btn sm" @click="reload(true)">重试</button>
    </div>

    <ul v-else-if="entry.items.length" class="collab-list">
      <li v-for="item in entry.items" :key="item.user_id" class="collab-item">
        <span class="avatar">{{ initials(item.username) }}</span>
        <div class="who">
          <span class="username">{{ item.username || `用户 #${item.user_id}` }}</span>
          <span class="uid">ID {{ truncateUuid(item.user_id) }}</span>
        </div>
        <div class="perm-tags">
          <span v-if="item.is_owner" class="tag blue"><i />所有者</span>
          <template v-else>
            <span
              v-for="b in parsePermissionBits(item.permission)"
              :key="b.key"
              class="tag"
              :class="TAG_CLS[b.key]"
            >
              <i />{{ b.label }}
            </span>
          </template>
        </div>
        <button
          v-if="canManage && !item.is_owner"
          class="icon-btn danger"
          title="移除协作者"
          @click="askRemove(item)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </li>
    </ul>
    <p v-else class="collab-empty">
      暂无协作者，点击「添加协作者」共享此{{ resourceType === 'folder' ? '文件夹' : '文件' }}
    </p>

    <AddCollaboratorModal
      :visible="addVisible"
      :submitting="submitting"
      @close="addVisible = false"
      @submit="onAddSubmit"
    />
    <TransferOwnerModal
      :visible="transferVisible"
      :submitting="submitting"
      @close="transferVisible = false"
      @submit="onTransferSubmit"
    />
    <ConfirmModal
      :visible="removeVisible"
      title="移除协作者"
      :message="`移除后 ${removeTarget?.username || '该用户'} 将失去访问权限，是否继续？`"
      confirm-text="移除"
      danger
      :submitting="submitting"
      @close="removeVisible = false"
      @confirm="onRemoveConfirm"
    />
  </div>
</template>

<style scoped>
.collab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.collab-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.collab-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text, #374151);
}
.collab-acts {
  display: flex;
  gap: 8px;
}

.ghost-btn {
  padding: 7px 18px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ghost-btn.sm {
  padding: 5px 14px;
}
.ghost-btn:hover {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text, #374151);
}

.collab-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: var(--c-text-sub, #6b7280);
  font-size: 13px;
}
.collab-state.error {
  color: var(--c-danger-text, #b91c1c);
}

.collab-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.collab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-bottom: 1px solid var(--c-border-soft, #f3f4f6);
  border-radius: var(--r-card, 8px);
}
.collab-item:last-child {
  border-bottom: none;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  background: var(--c-primary-soft, rgba(30, 64, 175, 0.08));
  color: var(--c-primary, #1e40af);
  font-size: 14px;
  font-weight: 600;
}
.who {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text, #374151);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.uid {
  font-size: 12px;
  color: var(--c-text-weak, #9ca3af);
}

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  white-space: nowrap;
}
.tag i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.tag.gray {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text-sub, #6b7280);
}
.tag.blue {
  background: var(--c-primary-soft, rgba(30, 64, 175, 0.08));
  color: var(--c-primary, #1e40af);
}
.tag.warn {
  background: var(--c-warn-bg, #fef3c7);
  color: var(--c-warn-text, #92400e);
}
.tag.green {
  background: var(--c-success-bg, #dcfce7);
  color: var(--c-success-text, #166534);
}
.tag.deep {
  background: rgba(30, 64, 175, 0.15);
  color: var(--c-primary-deep, #1e3a8a);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn svg {
  width: 17px;
  height: 17px;
}
.icon-btn.danger {
  color: var(--c-danger, #ef4444);
}
.icon-btn.danger:hover {
  background: var(--c-danger-bg, #fef2f2);
}

.collab-empty {
  margin: 12px 0 4px;
  font-size: 13px;
  color: var(--c-text-weak, #9ca3af);
}

@media (max-width: 480px) {
  .collab-item {
    flex-wrap: wrap;
  }
  .perm-tags {
    justify-content: flex-start;
    width: 100%;
    padding-left: 46px;
  }
}
</style>
