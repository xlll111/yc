<!--
============================================================
组件名称: Spinner
组件类型: UI / 加载状态 / Loading
适用场景:
  - 页面级加载
  - 局部区域加载
  - 按钮提交等待
  - 表格/卡片数据加载
不适用场景:
  - 骨架屏（请使用 Skeleton 组件）
  - 进度百分比展示（请使用 Progress 组件）

AI 快速调用:
  <Spinner />
  <Spinner size="small" text="加载中..." />
  <Spinner inline text="提交中" />
  <Spinner overlay text="请稍候" />

Props:
  size: 'tiny' | 'small' | 'medium' | 'large'  默认 'medium'
  color: string                                 默认 '#1e40af'
  text: string                                  默认 ''
  textColor: string                             默认 '#374151'
  overlay: boolean                              默认 false
  inline: boolean                               默认 false
  customStyle: object                           默认 {}

Slots:
  无

Events:
  无

关键行为:
  - 默认非 inline 时为全屏 fixed 加载层
  - inline 时为局部加载，宽度由内容决定
  - overlay 为 true 时显示背景遮罩
  - 支持暗色模式 prefers-color-scheme

选择建议:
  - 页面级等待：<Spinner text="加载中..." />
  - 局部等待：<Spinner inline size="small" text="加载中..." />
  - 弹窗/卡片内等待：<Spinner inline overlay text="请稍候" />

依赖:
  Vue 3 <script setup>
============================================================
-->
<template>
  <div
    class="spinner-container"
    :class="[`spinner-${size}`, { 'spinner-inline': inline }]"
    :style="customStyle"
  >
    <div class="spinner-wrapper">
      <!-- 主转圈动画 -->
      <svg class="spinner-svg" viewBox="0 0 50 50" :style="{ color: computedColor }">
        <circle
          class="spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          :stroke="computedColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>

      <!-- 可选加载文本 -->
      <p v-if="text" class="spinner-text" :style="{ color: textColor }">
        {{ text }}
      </p>
    </div>

    <!-- 可选背景遮罩 -->
    <div v-if="overlay" class="spinner-overlay" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 组件属性定义
const props = defineProps({
  // 尺寸: small | medium | large
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['tiny', 'small', 'medium', 'large'].includes(value),
  },
  // 自定义颜色 (会覆盖主色)
  color: {
    type: String,
    default: '',
  },
  // 加载文本
  text: {
    type: String,
    default: '',
  },
  // 文本颜色
  textColor: {
    type: String,
    default: '#374151',
  },
  // 是否显示背景遮罩
  overlay: {
    type: Boolean,
    default: false,
  },
  // 是否内联模式 (不占满整屏)
  inline: {
    type: Boolean,
    default: false,
  },
  // 自定义容器样式
  customStyle: {
    type: Object,
    default: () => ({}),
  },
})

// 计算最终颜色: 优先使用自定义颜色，否则使用主色 #1e40af
const computedColor = computed(() => {
  return props.color || '#1e40af'
})
</script>

<style scoped>
/* 基础容器样式 */
.spinner-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

/* 全屏模式 (默认) */
.spinner-container:not(.spinner-inline) {
  position: fixed;
  top: 64;
  height: 100%;
  width: 100%;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

/* 内联模式 */
.spinner-inline {
  position: relative;
  /* min-height: 120px; */
  width: max-content;
  background: transparent;
}

/* 包装器 */
.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 2;
}

/* SVG 动画容器 */
.spinner-svg {
  animation: spin 0.8s linear infinite;
  width: 100%;
  height: 100%;
}

/* 圆形轨迹样式 */
.spinner-circle {
  stroke-dasharray: 126;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash 1.4s ease-in-out infinite;
}

/* 不同尺寸配置 */
.spinner-tiny .spinner-svg {
  width: 24px;
  height: 24px;
}
.spinner-tiny .spinner-text {
  font-size: 11px;
}
.spinner-tiny .spinner-wrapper {
  gap: 4px;
}
/* small */
.spinner-small .spinner-svg {
  width: 32px;
  height: 32px;
}
.spinner-small .spinner-text {
  font-size: 13px;
}
.spinner-small .spinner-wrapper {
  gap: 8px;
}
/* medium */
.spinner-medium .spinner-svg {
  width: 48px;
  height: 48px;
}
.spinner-medium .spinner-text {
  font-size: 15px;
}
.spinner-medium .spinner-wrapper {
  gap: 12px;
}
/* large */
.spinner-large .spinner-svg {
  width: 64px;
  height: 64px;
}

.spinner-large .spinner-text {
  font-size: 17px;
}
.spinner-large .spinner-wrapper {
  gap: 16px;
}
/* 文本样式 */
.spinner-text {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    sans-serif;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.3px;
  transition: color 0.2s ease;
}

/* 遮罩层 */
.spinner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(2px);
  border-radius: 8px;
  z-index: 1;
}

/* 动画定义 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}

/* 响应式调整 - 768px 断点 */
@media (max-width: 768px) {
  /* .spinner-inline {
    min-height: 100px;
  } */
  .spinner-tiny .spinner-svg {
    width: 21px;
    height: 21px;
  }

  .spinner-small .spinner-svg {
    width: 28px;
    height: 28px;
  }

  .spinner-medium .spinner-svg {
    width: 42px;
    height: 42px;
  }

  .spinner-large .spinner-svg {
    width: 56px;
    height: 56px;
  }

  .spinner-text {
    font-size: 14px;
  }

  .spinner-wrapper {
    gap: 12px;
  }
}

/* 暗色模式优雅降级支持 */
@media (prefers-color-scheme: dark) {
  .spinner-container:not(.spinner-inline) {
    background-color: rgba(0, 0, 0, 0.85);
  }

  .spinner-overlay {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .spinner-text {
    color: #e5e7eb;
  }
}
</style>
