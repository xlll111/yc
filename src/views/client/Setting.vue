<template>
  <div class="settings-container root">
    <h1 class="page-title">设置</h1>
    <p class="page-subtitle">管理设备的安全策略与系统控制</p>
    <!-- 加载状态 -->
    <div v-if="!clientStore.getCurrentClientSettings" class="loading-state">
      <Spinner inline text="加载中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="clientStore.getCurrentClientSettings === 'error'" class="error-state">
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
      <p>加载设置失败，请重试</p>
      <button class="retry-btn" @click="clientStore.fetchClientSettings">重试</button>
    </div>
    <form
      v-if="
        clientStore.getCurrentClientSettings && clientStore.getCurrentClientSettings !== 'error'
      "
      @submit.prevent="saveSettings"
      class="settings-form"
    >
      <!-- 安全控制卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2 class="card-title">安全控制</h2>
        </div>
        <div class="card-body">
          <div class="toggle-item">
            <div class="toggle-label">
              <span>启用全局联网控制</span>
              <p class="toggle-desc">开启后将根据规则限制网络访问</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.netControlEnabled"
                @update:model-value="form.netControlEnabled = $event"
                aria-label="启用全局联网控制"
              />
            </label>
          </div>

          <div class="divider"></div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span>宵禁</span>
              <p class="toggle-desc">在指定时段内完全禁止联网</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.netPeriodEnabled"
                @update:model-value="form.netPeriodEnabled = $event"
                aria-label="启用宵禁"
              />
            </label>
          </div>

          <!-- <transition name="fade">
            <div v-if="form.curfewEnabled" class="curfew-time-picker">
              <div class="time-field">
                <label for="startTime">开始时间</label>
                <input id="startTime" type="time" v-model="form.curfewStart" class="time-input" />
              </div>
              <span class="time-separator">至</span>
              <div class="time-field">
                <label for="endTime">结束时间</label>
                <input id="endTime" type="time" v-model="form.curfewEnd" class="time-input" />
              </div>
              <p class="time-hint">当前设置: 下午5:45 至 上午7:15</p>
            </div>
          </transition> -->

          <div class="divider"></div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span>启用 U 盘检测</span>
              <p class="toggle-desc">监测并记录USB存储设备的接入</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.usbControlEnabled"
                @update:model-value="form.usbControlEnabled = $event"
                aria-label="启用 U 盘检测"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- 禁用系统应用卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2 class="card-title">禁用系统应用</h2>
        </div>
        <div class="card-body">
          <div class="toggle-item">
            <div class="toggle-label">
              <span>禁用任务管理器</span>

              <p class="toggle-desc">阻止用户访问任务管理器</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.disableTaskManager"
                @update:model-value="form.disableTaskManager = $event"
                aria-label="禁用任务管理器"
              />
            </label>
          </div>

          <div class="divider"></div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span>禁用系统设置</span>
              <p class="toggle-desc">禁止打开Windows设置应用</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.disableSystemSettings"
                @update:model-value="form.disableSystemSettings = $event"
                aria-label="禁用系统设置"
              />
            </label>
          </div>

          <div class="divider"></div>

          <div class="toggle-item">
            <div class="toggle-label">
              <span>禁用控制面板</span>
              <p class="toggle-desc">阻止用户访问控制面板</p>
            </div>
            <label class="switch">
              <ToggleSwitch
                :model-value="form.disableControlPanel"
                @update:model-value="form.disableControlPanel = $event"
                aria-label="禁用控制面板"
              />
            </label>
          </div>
        </div>
      </div>
      <!-- 保存按钮区域 -->
      <div class="save-section">
        <button type="submit" class="save-btn" :disabled="isSaving">
          <span v-if="!isSaving">保存设置</span>
          <span v-else class="saving-spinner">保存中...</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import { useClientStore } from '@/stores/clientStore'
import Spinner from '@/components/Spinner.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const clientStore = useClientStore()
const form = reactive({})

const isSaving = ref(false)

// 保存设置逻辑
const saveSettings = async () => {
  isSaving.value = true

  try {
    // 模拟API请求延迟
    await clientStore.updateClientSettings(form)
    console.log('设置已保存:', { ...form })
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存出错:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}
onMounted(async () => {
  if (!clientStore.getCurrentClientSettings || clientStore.getCurrentClientSettings === 'error')
    await clientStore.fetchClientSettings()
  if (clientStore.getCurrentClientSettings && clientStore.getCurrentClientSettings !== 'error')
    Object.assign(form, clientStore.getCurrentClientSettings)
  console.log('设置已加载:', form)
})
</script>

<style scoped>
/* 全局变量定义 */
.root {
  --primary: #1e40af;
  --text-color: #374151;
  --border-color: #e5e7eb;
  --card-radius: 8px;
  --btn-radius: 9999px;
  --shadow-light: 0 2px 8px rgba(0, 0, 0, 0.08);
  --font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --transition: 0.2s ease;
}

/* 容器布局 */
.settings-container {
  display: flex;
  flex-direction: column;
  flex: auto;
  margin: 0 auto;
  padding: 24px;
  font-family: var(--font-family);
  color: var(--text-color);
  box-sizing: border-box;
}
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

.page-title {
  font-size: 1.8rem;
  font-weight: 500;
  margin: 0 0 6px 0;
  color: #111827;
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0 0 32px 0;
  font-weight: 400;
}

/* 表单布局 */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片样式 */
.setting-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-light);
  transition: box-shadow var(--transition);
  overflow: hidden;
}

.setting-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f3f4f6;
  background-color: #fafbfc;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
}

.card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: var(--primary);
  border-radius: 4px;
  margin-right: 12px;
}

.card-body {
  padding: 12px 24px;
}

/* 每个开关项 */
.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-label span {
  font-weight: 500;
  font-size: 0.95rem;
  color: #1f2937;
}

.toggle-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* 分割线 */
.divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 0;
}

/* 自定义开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  margin-left: 16px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: var(--transition);
  border-radius: 9999px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--transition);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:focus-visible + .slider {
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.25);
}

/* 宵禁时间选择器 */
.curfew-time-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-top: 4px;
  padding-left: 16px;
  padding-right: 16px;
  border: 1px dashed #e5e7eb;
}

.time-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-field label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: var(--font-family);
  font-size: 0.9rem;
  color: var(--text-color);
  background: white;
  transition: border-color var(--transition);
  outline: none;
  width: 120px;
}

.time-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.15);
}

.time-separator {
  font-weight: 400;
  color: #9ca3af;
  margin-top: 20px;
}

.time-hint {
  width: 100%;
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

/* 保存区域 */
.save-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.save-btn {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--btn-radius);
  font-size: 0.95rem;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.2px;
  min-width: 130px;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(30, 64, 175, 0.25);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.saving-spinner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-message {
  font-size: 0.9rem;
  margin: 0;
  color: #059669;
  font-weight: 500;
  background: #ecfdf5;
  padding: 8px 16px;
  border-radius: 20px;
  transition: opacity var(--transition);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    max-height 0.3s ease;
  max-height: 120px;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .card-body {
    padding: 12px 16px;
  }

  .card-header {
    padding: 16px 16px;
  }

  .toggle-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .switch {
    margin-left: 0;
    align-self: flex-start;
  }

  .curfew-time-picker {
    flex-direction: column;
    align-items: flex-start;
  }

  .time-input {
    width: 100%;
  }

  .time-separator {
    margin-top: 0;
    margin: 4px 0;
  }

  .save-section {
    flex-direction: column;
    align-items: stretch;
  }

  .save-btn {
    width: 100%;
  }
}
</style>
