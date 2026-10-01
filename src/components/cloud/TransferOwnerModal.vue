<!-- 移交所有权：二次确认语义由弹窗文案承担 -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/cloud/BaseModal.vue'

const props = withDefaults(defineProps<{ visible: boolean; submitting?: boolean }>(), {
  submitting: false,
})
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', newOwnerId: number): void }>()

const ownerId = ref('')
const error = ref('')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      ownerId.value = ''
      error.value = ''
    }
  },
)

function onConfirm() {
  const v = ownerId.value.trim()
  if (!/^\d+$/.test(v)) {
    error.value = '请输入有效的用户 ID（数字）'
    return
  }
  emit('submit', Number(v))
}
</script>

<template>
  <BaseModal :visible="visible" title="移交所有权" :max-width="400" @close="emit('close')">
    <div class="form">
      <div class="field">
        <label for="transfer-uid">新所有者用户 ID</label>
        <input
          id="transfer-uid"
          v-model="ownerId"
          type="text"
          inputmode="numeric"
          placeholder="输入对方用户 ID"
          :class="{ error: !!error }"
          @input="error = ''"
        />
      </div>
      <p class="warn-tip">移交后你将失去所有者权限，是否继续？</p>
      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
    <template #footer>
      <button class="ghost-btn" :disabled="submitting" @click="emit('close')">取消</button>
      <button class="primary-btn" :disabled="submitting" @click="onConfirm">
        <Spinner v-if="submitting" inline size="tiny" /><span>移交</span>
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
.field input {
  padding: 10px 14px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: var(--r-card, 8px);
  font-size: 15px;
  color: var(--c-text, #374151);
  outline: none;
  transition: all 0.2s ease;
}
.field input:focus {
  border-color: var(--c-primary, #1e40af);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.field input.error {
  border-color: var(--c-danger, #ef4444);
}

.warn-tip {
  margin: 0;
  padding: 10px 14px;
  border-radius: var(--r-card, 8px);
  background: var(--c-warn-bg, #fef3c7);
  color: var(--c-warn-text, #92400e);
  font-size: 13px;
  line-height: 1.6;
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
