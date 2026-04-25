<!-- components/ToggleSwitch.vue -->
<template>
  <label class="toggle-switch" :class="{ 'toggle-switch--checked': modelValue }">
    <input
      type="checkbox"
      class="toggle-switch__input"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      v-bind="$attrs"
    />
    <span class="toggle-switch__track">
      <span class="toggle-switch__thumb">
        <svg
          v-if="modelValue"
          class="toggle-switch__check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    </span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.toggle-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  position: relative;
}

.toggle-switch__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.toggle-switch__track {
  width: 46px;
  height: 26px;
  border-radius: 9999px;
  background: #d1d5db;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-switch--checked .toggle-switch__track {
  background: #1e40af;
}

.toggle-switch__input:focus-visible + .toggle-switch__track {
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.2);
}

.toggle-switch:hover .toggle-switch__track {
  box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.06);
}

.toggle-switch--checked:hover .toggle-switch__track {
  box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.12);
}

.toggle-switch__thumb {
  position: absolute;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 1px 1px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-switch--checked .toggle-switch__thumb {
  transform: translateX(20px);
}

.toggle-switch__check {
  width: 12px;
  height: 12px;
  color: #1e40af;
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity 0.15s ease,
    transform 0.2s ease;
}

.toggle-switch--checked .toggle-switch__check {
  opacity: 1;
  transform: scale(1);
}

/* 响应式微调 */
@media (max-width: 768px) {
  .toggle-switch__track {
    width: 42px;
    height: 24px;
  }
  .toggle-switch__thumb {
    width: 18px;
    height: 18px;
    left: 3px;
  }
  .toggle-switch--checked .toggle-switch__thumb {
    transform: translateX(18px);
  }
  .toggle-switch__check {
    width: 10px;
    height: 10px;
  }
}
</style>
