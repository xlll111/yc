<!-- 通用二次确认弹窗 -->
<script setup lang="ts">
import BaseModal from '@/components/cloud/BaseModal.vue'

withDefaults(
  defineProps<{
    visible: boolean
    title: string
    message: string
    confirmText?: string
    danger?: boolean
    submitting?: boolean
  }>(),
  { confirmText: '确认', danger: false, submitting: false },
)

const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm'): void }>()
</script>

<template>
  <BaseModal :visible="visible" :title="title" :max-width="400" @close="emit('close')">
    <p class="confirm-msg">{{ message }}</p>
    <template #footer>
      <button class="ghost-btn" :disabled="submitting" @click="emit('close')">取消</button>
      <button
        :class="danger ? 'danger-btn' : 'primary-btn'"
        :disabled="submitting"
        @click="emit('confirm')"
      >
        <Spinner v-if="submitting" size="inline" />
        <span>{{ confirmText }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-msg {
  margin: 4px 0 8px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--c-text, #374151);
  word-break: break-word;
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
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  border: 1px solid var(--c-border, #e5e7eb);
  border-radius: 9999px;
  background: #fff;
  color: var(--c-danger-text, #b91c1c);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.danger-btn:hover:not(:disabled) {
  background: var(--c-danger-bg, #fef2f2);
  border-color: var(--c-border, #e5e7eb);
}
.danger-btn:disabled {
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
