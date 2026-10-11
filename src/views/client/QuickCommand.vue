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
                @click="confirmCommand(command, 'execute')"
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
                @click="confirmCommand(command, 'cancel')"
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

    <!-- ==================== 二次确认弹窗 ==================== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="confirmDialog.visible" class="modal-overlay" @click.self="closeConfirmDialog">
          <div class="modal-card" role="dialog" aria-modal="true">
            <h3 class="modal-title">{{ confirmDialog.title }}</h3>
            <p class="modal-message">{{ confirmDialog.message }}</p>
            <div class="modal-actions">
              <button
                class="btn btn--secondary modal-btn"
                :disabled="confirmDialog.loading"
                @click="closeConfirmDialog"
              >
                取消
              </button>
              <button
                class="btn btn--primary modal-btn"
                :disabled="confirmDialog.loading"
                @click="doConfirmCommand"
              >
                <Spinner v-if="confirmDialog.loading" inline size="tiny" color="#f3f4f6" />
                <span v-else>确认</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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

// ---------- 二次确认弹窗状态 ----------
const confirmDialog = reactive({
  visible: false,
  loading: false,
  title: '',
  message: '',
  command: null,
  action: null,
})

// 打开确认弹窗
const confirmCommand = (command, action) => {
  if (!userStore.getIsLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  const state = commandStates[command.id]
  if (!state || state.loading) return

  const actionText = action === 'execute' ? '执行' : '取消'
  confirmDialog.title = `确认${actionText}指令`
  confirmDialog.message = `确定要${actionText}「${command.name}」吗？`
  confirmDialog.command = command
  confirmDialog.action = action
  confirmDialog.loading = false
  confirmDialog.visible = true
}

// 关闭确认弹窗
const closeConfirmDialog = () => {
  if (confirmDialog.loading) return
  confirmDialog.visible = false
  confirmDialog.command = null
  confirmDialog.action = null
}

// 确认执行/取消指令
const doConfirmCommand = async () => {
  const { command, action } = confirmDialog
  if (!command || !action) return

  const state = commandStates[command.id]
  if (!state || state.loading) return

  const actionText = action === 'execute' ? '执行' : '取消'

  confirmDialog.loading = true
  state.loading = true
  state.action = action

  try {
    if (action === 'execute') {
      await clientStore.executeQuickCommand(command.id)
    } else {
      await clientStore.cancelQuickCommand(command.id)
    }
    ElMessage.success(`${command.name} ${actionText}成功`)
    confirmDialog.visible = false
  } catch (error) {
    console.error(`[QuickCommand] ${actionText} ${command.name} 失败:`, error)
    ElMessage.error(error?.message || `${command.name} ${actionText}失败，请重试`)
  } finally {
    confirmDialog.loading = false
    state.loading = false
    state.action = null
    confirmDialog.command = null
    confirmDialog.action = null
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
<style>
:root {
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
}
</style>
<style scoped>
/* ========== CSS 变量（优先使用，若全局已有可覆盖） ========== */
.quick-command-page {
  /* --primary: #1e40af;
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
  --transition: all 0.2s ease; */

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

/* ========== 二次确认弹窗 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 24px;
  animation: modalSlideUp 0.25s ease both;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px;
}

.modal-message {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  flex: 0 0 auto;
  min-width: 88px;
  padding: 10px 24px;
}

/* ========== 弹窗过渡 ========== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-card {
  animation: modalSlideUp 0.25s ease both;
}

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

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
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

  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-btn {
    width: 100%;
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
