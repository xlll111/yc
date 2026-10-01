<!--
============================================================
@ai-component StateWrapper
@ai-type ui/state
@ai-tags state,loading,error,empty,状态,加载,错误,空状态,占位
@ai-when 异步数据区域加载态|请求失败重试|列表空数据占位|卡片/表格/页面局部状态切换
@ai-not 骨架屏|进度百分比|全局全屏加载（用 Spinner 全屏模式）|表单校验提示
@ai-summary 统一处理「加载中 / 错误 / 空 / 正常内容」四种状态的容器组件，内部复用 Spinner 展示加载态，内置错误重试按钮和空状态占位。
@ai-import import StateWrapper from '@/components/StateWrapper.vue'
@ai-example <StateWrapper :loading="loading"><div>内容</div></StateWrapper>
@ai-example <StateWrapper :loading="loading" :error="error" @retry="fetchData"><List /></StateWrapper>
@ai-example <StateWrapper :loading="loading" :empty="!list.length" empty-title="暂无订单"><OrderList /></StateWrapper>
@ai-props loading:boolean, error:boolean, empty:boolean, loadingText:string, errorText:string, showRetry:boolean, retryText:string, emptyTitle:string, emptyHint:string
@ai-events retry
@ai-slots default（正常内容，AI 调用时必须传入）
@ai-behavior 优先级：loading > error > empty > 默认内容；loading 使用 Spinner inline；error 显示图标+文本+可选重试按钮；empty 显示图标+标题+提示
@ai-notes 必须传入默认插槽作为正常内容；loading 优先级最高；retry 仅在 error 且 showRetry 时触发
@ai-version 1.0.0
============================================================
-->
<template>
  <!-- 加载状态 -->
  <div v-if="loading" class="loading-state">
    <Spinner inline :text="loadingText" />
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="error-state">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p>{{ errorText }}</p>
    <button v-if="showRetry" class="retry-btn" @click="$emit('retry')">
      {{ retryText }}
    </button>
  </div>

  <!-- 空状态 -->
  <div v-else-if="empty" class="empty-state">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
    <p class="empty-text">{{ emptyTitle }}</p>
    <p v-if="emptyHint" class="empty-hint">{{ emptyHint }}</p>
  </div>
</template>

<script setup>
import Spinner from './Spinner.vue' // 根据实际路径调整

defineProps({
  // 是否加载中
  loading: {
    type: Boolean,
    default: false,
    required: true,
  },
  // 是否出错
  error: {
    type: Boolean,
    default: false,
  },
  // 是否为空
  empty: {
    type: Boolean,
    default: false,
  },
  // 自定义加载文本
  loadingText: {
    type: String,
    default: '加载中...',
  },
  // 自定义错误文本
  errorText: {
    type: String,
    default: '加载失败，请稍后再试',
  },
  // 是否显示重试按钮
  showRetry: {
    type: Boolean,
    default: true,
  },
  // 重试按钮文本
  retryText: {
    type: String,
    default: '重试',
  },
  // 空状态标题
  emptyTitle: {
    type: String,
    default: '暂无数据',
  },
  // 空状态提示文本
  emptyHint: {
    type: String,
    default: '暂无数据，请刷新后重试',
  },
})

defineEmits(['retry'])
</script>

<style scoped>
/* 状态卡片 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.error-state svg,
.empty-state svg {
  color: #9ca3af;
  margin-bottom: 16px;
}

.error-state p,
.empty-state p {
  margin: 8px 0 16px;
  font-size: 1rem;
}

.retry-btn {
  padding: 8px 20px;
  background-color: #1e40af;
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.retry-btn:hover {
  background-color: #1e3a8a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
</style>
