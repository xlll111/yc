<!-- 添加协作者：手输 user_id（TODO 暂无用户搜索接口）+ 预设胶囊 + 权限位多选 -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/cloud/BaseModal.vue'
import { CLOUD_PERM, PERM_BIT_META } from '@/stores/cloudStore'
import Spinner from '@/components/Spinner.vue'
const props = withDefaults(defineProps<{ visible: boolean; submitting?: boolean }>(), {
  submitting: false,
})
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { user_id: number; permission: number }): void
}>()

const PRESETS = [
  { label: '只读', value: CLOUD_PERM.READ },
  { label: '可编辑', value: CLOUD_PERM.READ | CLOUD_PERM.WRITE },
  { label: '可删除', value: CLOUD_PERM.READ | CLOUD_PERM.WRITE | CLOUD_PERM.DELETE },
  {
    label: '完全控制',
    value:
      CLOUD_PERM.READ | CLOUD_PERM.WRITE | CLOUD_PERM.DELETE | CLOUD_PERM.SHARE | CLOUD_PERM.MANAGE,
  },
]

const userId = ref('')
const perm = ref(CLOUD_PERM.READ as number)
const error = ref('')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      userId.value = ''
      perm.value = CLOUD_PERM.READ
      error.value = ''
    }
  },
)

function toggleBit(v: number) {
  perm.value = perm.value ^ v
}
const isPreset = (v: number) => computed(() => perm.value === v).value

function onConfirm() {
  const uid = userId.value.trim()
  if (!/^\d+$/.test(uid)) {
    error.value = '请输入有效的用户 ID（数字）'
    return
  }
  if (perm.value === 0) {
    error.value = '请至少选择一项权限'
    return
  }
  emit('submit', { user_id: Number(uid), permission: perm.value })
}
</script>

<template>
  <BaseModal :visible="visible" title="添加协作者" @close="emit('close')">
    <div class="form">
      <div class="field">
        <label for="collab-uid">用户 ID</label>
        <input
          id="collab-uid"
          v-model="userId"
          type="text"
          inputmode="numeric"
          placeholder="输入对方用户 ID"
          :class="{ error: !!error && !/^\d+$/.test(userId.trim()) }"
          @input="error = ''"
        />
      </div>

      <div class="field">
        <label>快捷预设</label>
        <div class="presets">
          <button
            v-for="p in PRESETS"
            :key="p.label"
            type="button"
            class="preset"
            :class="{ active: perm === p.value }"
            @click="perm = p.value"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="field">
        <label>权限明细（多选）</label>
        <div class="checks">
          <label v-for="b in PERM_BIT_META" :key="b.key" class="check">
            <input type="checkbox" :checked="(perm & b.value) !== 0" @change="toggleBit(b.value)" />
            <span>{{ b.label }}（{{ b.key }}）</span>
          </label>
        </div>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
    <template #footer>
      <button class="ghost-btn" :disabled="submitting" @click="emit('close')">取消</button>
      <button class="primary-btn" :disabled="submitting" @click="onConfirm">
        <Spinner v-if="submitting" inline size="tiny" /><span>添加</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field > label {
  font-size: 13px;
  color: var(--c-text-sub, #6b7280);
}
.field input[type='text'] {
  padding: 10px 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  font-size: 15px;
  color: var(--c-text, #374151);
  outline: none;
  transition: all 0.2s ease;
}
.field input[type='text']:focus {
  border-color: var(--c-primary, #1e40af);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.field input.error {
  border-color: var(--c-danger, #ef4444);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preset {
  padding: 7px 16px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: #fff;
  color: var(--c-text, #374151);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.preset:hover {
  background: var(--c-bg, #f9fafb);
}
.preset.active {
  background: var(--c-primary, #1e40af);
  border-color: var(--c-primary, #1e40af);
  color: #fff;
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--c-text, #374151);
  cursor: pointer;
}
.check input {
  width: 16px;
  height: 16px;
  accent-color: var(--c-primary, #1e40af);
  cursor: pointer;
}

.form-error {
  margin: 0;
  font-size: 12px;
  color: var(--c-danger-text, #b91c1c);
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
.primary-btn:hover:not(:disabled) {
  background: var(--c-primary-deep, #1e3a8a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ghost-btn {
  padding: 10px 24px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ghost-btn:hover:not(:disabled) {
  background: var(--c-border-soft, #f3f4f6);
}
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
