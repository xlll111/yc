<!-- 单输入确认弹窗：新建文件夹 / 重命名共用 -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/cloud/BaseModal.vue'
import Spinner from '@/components/Spinner.vue'
const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    label?: string
    initialValue?: string
    placeholder?: string
    confirmText?: string
    submitting?: boolean
  }>(),
  {
    label: '名称',
    initialValue: '',
    placeholder: '请输入名称',
    confirmText: '确认',
    submitting: false,
  },
)

const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm', value: string): void }>()

const value = ref('')
const error = ref('')

// 每次打开重置为初始值
watch(
  () => props.visible,
  (v) => {
    if (v) {
      value.value = props.initialValue || ''
      error.value = ''
    }
  },
)

function onConfirm() {
  const v = value.value.trim()
  if (!v) {
    error.value = '名称不能为空'
    return
  }
  emit('confirm', v)
}
</script>

<template>
  <BaseModal :visible="visible" :title="title" @close="emit('close')">
    <div class="field">
      <label class="field-label" for="prompt-input">{{ label }}</label>
      <input
        id="prompt-input"
        v-model="value"
        type="text"
        :placeholder="placeholder"
        :class="{ error: !!error }"
        maxlength="255"
        @input="error = ''"
        @keyup.enter="onConfirm"
      />
      <p v-if="error" class="field-error">{{ error }}</p>
    </div>
    <template #footer>
      <button class="ghost-btn" :disabled="submitting" @click="emit('close')">取消</button>
      <button class="primary-btn" :disabled="submitting" @click="onConfirm">
        <Spinner v-if="submitting" inline size="tiny" />
        <span>{{ confirmText }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* 表单 */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
.field-label {
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
.field-error {
  margin: 0;
  font-size: 12px;
  color: var(--c-danger-text, #b91c1c);
}

/* 按钮 */
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
.primary-btn:active:not(:disabled) {
  transform: none;
  box-shadow: none;
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
  color: var(--c-text, #374151);
}
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
