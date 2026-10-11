<template>
  <div class="quick-command-page">
    <div class="container">
      <!-- 页头 -->
      <header class="page-header">
        <h1 class="page-title">快捷指令</h1>
        <p class="page-subtitle">选择指令并执行操作，指令无持久化存储</p>
      </header>

      <!-- 加载状态 -->
      <LoadingState
        :loading="isLoadingCategories"
        :error="!!loadingError"
        :errorText="loadingError"
        @retry="fetchCategories"
      />

      <!-- 分类列表 -->
      <div v-for="category in categories" :key="category.id" class="category-section">
        <div class="category-header">
          <span class="category-bar" />
          <h2 class="category-title">{{ category.name }}</h2>
        </div>

        <div class="command-grid">
          <div
            v-for="command in category.commands"
            :key="command.id"
            class="command-card"
            :class="{ 'command-card--loading': commandStates[command.id]?.loading }"
          >
            <div class="command-card__body">
              <div class="command-card__icon" v-html="command.icon" />
              <div class="command-card__info">
                <h3 class="command-card__name">{{ command.name }}</h3>
                <p class="command-card__desc">{{ command.description }}</p>
              </div>
            </div>

            <div class="command-card__actions">
              <button
                class="btn btn--primary"
                :disabled="commandStates[command.id]?.loading"
                @click="executeCommand(command, 'execute')"
              >
                <Spinner
                  v-if="
                    commandStates[command.id]?.loading &&
                    commandStates[command.id]?.action === 'execute'
                  "
                  inline
                  size="tiny"
                  color="#f3f4f6"
                />
                <span v-else>执行</span>
              </button>
              <button
                class="btn btn--secondary"
                :disabled="commandStates[command.id]?.loading"
                @click="executeCommand(command, 'cancel')"
              >
                <Spinner
                  v-if="
                    commandStates[command.id]?.loading &&
                    commandStates[command.id]?.action === 'cancel'
                  "
                  inline
                  size="tiny"
                />
                <span v-else>取消</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import Spinner from '@/components/Spinner.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useUserStore } from '@/stores/userStore'
import { useClientStore } from '@/stores/clientStore'

const userStore = useUserStore()
const clientStore = useClientStore()

// ---------- 指令分类（从服务端获取） ----------
const categories = ref([])
const isLoadingCategories = ref(false)
const loadingError = ref('')

// 从服务端拉取快捷指令配置
const fetchCategories = async () => {
  isLoadingCategories.value = true
  try {
    const data = await clientStore.fetchQuickCommands()
    const list = Array.isArray(data) ? data : data?.list ?? data?.data ?? []

    categories.value = list.map((cat) => ({
      id: cat.id,
      name: cat.name,
      commands: (cat.commands || []).map((cmd) => ({
        id: cmd.id,
        name: cmd.name,
        description: cmd.description,
        icon: cmd.icon,
      })),
    }))

    // 初始化每条指令的独立状态
    categories.value.forEach((cat) => {
      cat.commands.forEach((cmd) => {
        commandStates[cmd.id] = { loading: false, action: null }
      })
    })
    loadingError.value = ''
  } catch (error) {
    console.error('[QuickCommand] 获取快捷指令失败:', error)
    ElMessage.error(error?.message || '获取快捷指令失败，请重试')
    loadingError.value = error?.message || '获取快捷指令失败，请重试'
  } finally {
    isLoadingCategories.value = false
  }
}

// ---------- 每条指令的独立状态（loading / 当前动作） ----------
const commandStates = reactive({})

// ---------- 执行/取消指令 ----------
const executeCommand = async (command, action) => {
  if (!userStore.getIsLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  const state = commandStates[command.id]
  if (!state || state.loading) return

  const actionText = action === 'execute' ? '执行' : '取消'

  state.loading = true
  state.action = action

  try {
    if (action === 'execute') {
      await clientStore.executeQuickCommand(command.id)
    } else {
      await clientStore.cancelQuickCommand(command.id)
    }
    ElMessage.success(`${command.name} ${actionText}成功`)
  } catch (error) {
    console.error(`[QuickCommand] ${actionText} ${command.name} 失败:`, error)
    ElMessage.error(error?.message || `${command.name} ${actionText}失败，请重试`)
  } finally {
    state.loading = false
    state.action = null
  }
}

// ---------- 生命周期 ----------
onMounted(() => {
  fetchCategories()
})

onUnmounted(() => {
  // 当前无定时器或全局监听，保留以备扩展
})
</script>

<style scoped>
/* ========== CSS 变量（优先使用，若全局已有可覆盖） ========== */
.quick-command-page {
  --primary: #1e40af;
  --primary-hover: #1e3a8a;
  --text-primary: #374151;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --bg-page: #f9fafb;
  --bg-card: #ffffff;
  --radius-card: 8px;
  --radius-btn: 9999px;
  --shadow-base: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;

  width: 100%;
  min-height: 100%;
  background: var(--bg-page);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  overflow-y: auto;
}

/* ========== 容器布局 ========== */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* ========== 页头 ========== */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 30px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: -0.01em;
  margin: 0 0 6px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* ========== 分类 ========== */
.category-section {
  margin-bottom: 32px;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.category-bar {
  display: inline-block;
  width: 4px;
  height: 18px;
  background: var(--primary);
  border-radius: 2px;
  flex-shrink: 0;
}

.category-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

/* ========== 指令卡片网格 ========== */
.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* ========== 指令卡片 ========== */
.command-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-base);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: var(--transition);
}

.command-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.command-card--loading {
  opacity: 0.85;
  pointer-events: none;
}

.command-card__body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.command-card__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.command-card__icon :deep(svg) {
  width: 36px;
  height: 36px;
}

.command-card__info {
  flex: 1;
  min-width: 0;
}

.command-card__name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.command-card__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

/* ========== 操作按钮区 ========== */
.command-card__actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

/* 按钮基础 */
.btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-btn);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: var(--transition);
  font-family: inherit;
  line-height: 1;
  min-height: 40px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 主要按钮 */
.btn--primary {
  background: var(--primary);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.btn--primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

/* 次要按钮 */
.btn--secondary {
  background: #fff;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.btn--secondary:active:not(:disabled) {
  transform: translateY(0);
}

/* ========== 状态样式 ========== */
/* 空状态使用 LoadingState 组件，无需额外样式 */

/* ========== 动画 ========== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.category-section {
  animation: fadeIn 0.3s ease both;
}

.category-section:nth-child(2) {
  animation-delay: 0.05s;
}

.category-section:nth-child(3) {
  animation-delay: 0.1s;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .category-section {
    margin-bottom: 24px;
  }

  .command-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .command-card {
    padding: 16px;
  }

  .command-card__actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .category-title {
    font-size: 17px;
  }

  .command-card__name {
    font-size: 15px;
  }

  .command-card__desc {
    font-size: 12px;
  }
}

@media (max-width: 380px) {
  .container {
    padding: 10px;
  }

  .command-card {
    padding: 14px;
  }
}
</style>
