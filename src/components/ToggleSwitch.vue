<!-- components/ToggleSwitch.vue -->
<!--
============================================================
@ai-component ToggleSwitch
@ai-type form/control
@ai-tags toggle,switch,开关,切换,布尔值,表单控件
@ai-when 布尔值开关|设置项启停|功能开关|表单布尔字段
@ai-not 多选|单选组|下拉选择|复杂表单校验
@ai-summary 布尔值开关组件，基于 v-model 双向绑定，支持键盘焦点与 hover 反馈，自带选中对勾动画。
@ai-import import ToggleSwitch from '@/components/ToggleSwitch.vue'
@ai-example <ToggleSwitch v-model="enabled" />
@ai-example <ToggleSwitch v-model="form.notify" />
@ai-example <ToggleSwitch v-model="darkMode" aria-label="切换暗色模式" />
@ai-props modelValue:boolean
@ai-events update:modelValue
@ai-attrs 支持 v-bind="$attrs"，可透传 aria-label、disabled、name、id 等原生属性
@ai-behavior 选中时轨道变主色 #1e40af；点击切换并 emit update:modelValue；支持 focus-visible 焦点环；窄屏自动缩小
@ai-version 1.0.0
============================================================
-->

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
/**
 * ToggleSwitch 布尔开关
 *
 * 调用建议：
 * - 设置项开关：<ToggleSwitch v-model="settings.xxx" />
 * - 表单布尔字段：<ToggleSwitch v-model="form.xxx" />
 * - 功能启停：<ToggleSwitch v-model="featureEnabled" />
 *
 * 注意：
 * - 必须使用 v-model，不要手动传 :model-value + @update:model-value
 * - 需要无障碍标签时传 aria-label
 */
const props = defineProps({
  /**
   * 当前开关状态
   * true = 开，false = 关
   */
  modelValue: {
    type: Boolean,
    default: false,
  },
})

/**
 * 状态变化事件
 * 用法：v-model 自动绑定
 */
const emit = defineEmits(['update:modelValue'])
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
