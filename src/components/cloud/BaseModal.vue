<!-- 通用弹窗容器：遮罩 blur + 卡片 slideUp；移动端 margin 12px -->
<script setup lang="ts">
withDefaults(defineProps<{ visible: boolean; title: string; maxWidth?: number }>(), {
  maxWidth: 440,
})
defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <transition name="modal">
    <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
      <div class="modal" :style="{ maxWidth: maxWidth + 'px' }" role="dialog" aria-modal="true">
        <header class="modal-head">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="icon-btn" aria-label="关闭" @click="$emit('close')">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div class="modal-body"><slot /></div>
        <footer v-if="$slots.footer" class="modal-foot"><slot name="footer" /></footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 遮罩与浮层 */
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
  -webkit-backdrop-filter: blur(4px);
}
.modal {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-card, #ffffff);
  border-radius: var(--r-card, 8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 48px);
  overflow: hidden;
}

/* 头部 / 内容 / 底部 */
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
}
.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--c-text, #374151);
}
.modal-body {
  padding: 12px 24px;
  overflow-y: auto;
}
.modal-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--c-border-soft, #f3f4f6);
}

/* 图标按钮（关闭） */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9999px;
  background: transparent;
  color: var(--c-text-sub, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn svg {
  width: 18px;
  height: 18px;
}
.icon-btn:hover {
  background: var(--c-border-soft, #f3f4f6);
  color: var(--c-text, #374151);
}

/* 动画 */
.modal-enter-active {
  animation: modalFade 0.2s ease;
}
.modal-leave-active {
  animation: modalFadeOut 0.2s ease;
}
.modal {
  animation: modalSlideUp 0.25s ease;
}
@keyframes modalFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes modalFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes modalSlideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-mask {
    padding: 12px;
    align-items: flex-end;
  }
  .modal {
    max-height: calc(100vh - 24px);
  }
  .modal-body {
    padding: 12px 16px;
  }
  .modal-head,
  .modal-foot {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
