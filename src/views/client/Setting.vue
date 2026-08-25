<template>
  <div class="settings-container root">
    <h1 class="page-title">设置</h1>
    <p class="page-subtitle">管理设备的安全策略与系统控制</p>
    <!-- 加载状态 -->
    <LoadingState
      :loading="!clientSettings.loaded"
      :error="clientSettings.error"
      @retry="clientStore.fetchClientSettings"
      loadingText="加载中..."
      errorText="加载设置失败，请重试"
    />
    <form
      v-if="clientSettings.loaded && !clientSettings.error"
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
              <p class="toggle-desc">在 17:45 到 7:15 内完全禁止联网</p>
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
              <span>启用 U 盘管控</span>
              <p class="toggle-desc">监测并阻止未经授权的USB存储设备的接入</p>
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
import LoadingState from '@/components/LoadingState.vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const clientStore = useClientStore()
const clientSettings = clientStore.getCurrentClientSettings

const form = reactive({})
const isSaving = ref(false)

// 保存设置逻辑
const saveSettings = async () => {
  isSaving.value = true

  try {
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
const getCurrentClientSettings = async () => {
  if (!clientSettings.loaded || clientSettings.error) await clientStore.fetchClientSettings()
  if (clientSettings.loaded && !clientSettings.error) Object.assign(form, clientSettings.data)
  // console.log('设置已加载:', form)
}
onMounted(async () => {
  getCurrentClientSettings()
})
</script>

<style lang="scss" scoped>
.settings-container {
  @include container;
  @include flex-column;
  flex: auto;
}

.page-title {
  font-size: $font-size-9xl;
  font-weight: 500;
  margin: 0 0 $spacing-3 0;
  color: #111827;
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: $font-size-xl;
  color: $color-text-secondary;
  margin: 0 0 $spacing-13 0;
  font-weight: 400;
}

.settings-form {
  @include flex-column;
  gap: $spacing-11;
}

.setting-card {
  @include card-bordered;

  &:hover {
    box-shadow: $shadow-card-hover;
  }
}

.card-header {
  padding: $spacing-7 $spacing-11;
  border-bottom: 1px solid $color-border-light;
  background: $color-bg-light;
}

.card-title {
  font-size: $font-size-4xl;
  font-weight: 500;
  margin: 0;
  color: $color-text-heading;
  @include flex-center;
  justify-content: normal;
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background-color: $color-primary;
    border-radius: $radius-sm;
    margin-right: $spacing-6;
  }
}

.card-body {
  padding: $spacing-6 $spacing-11;
}

.toggle-item {
  @include flex-between;
  padding: $spacing-8 0;
}

.toggle-label {
  @include flex-column;
  gap: $spacing-2;

  span {
    font-weight: 500;
    font-size: $font-size-xl;
    color: $color-text-heading;
  }
}

.toggle-desc {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.4;
}

.divider {
  height: 1px;
  background: $color-border-light;
  margin: 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  margin-left: $spacing-8;
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
  background-color: $color-border-dark;
  transition: $transition-base;
  border-radius: $radius-lg;

  &::before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: $color-bg-white;
    transition: $transition-base;
    border-radius: 50%;
    box-shadow: $shadow-inset;
  }
}

input:checked + .slider {
  background-color: $color-primary;

  &::before {
    transform: translateX(20px);
  }
}

input:focus-visible + .slider {
  box-shadow: 0 0 0 3px $color-primary-alpha-25;
}

.curfew-time-picker {
  @include flex-center;
  flex-wrap: wrap;
  gap: $spacing-6;
  padding: $spacing-6 0 $spacing-8;
  background: $color-bg-card;
  border-radius: $radius-md;
  margin-top: $spacing-2;
  padding-left: $spacing-8;
  padding-right: $spacing-8;
  border: 1px dashed $color-border;
}

.time-field {
  @include flex-column;
  gap: $spacing-2;

  label {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}

.time-input {
  padding: $spacing-6 $spacing-7;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  font-family: $font-stack;
  font-size: $font-size-lg;
  color: $color-text-base;
  background: $color-bg-white;
  transition: border-color $transition-base;
  outline: none;
  width: 120px;

  &:focus {
    border-color: $color-primary;
    box-shadow: 0 0 0 2px $color-primary-alpha-15;
  }
}

.time-separator {
  font-weight: 400;
  color: $color-text-tertiary;
  margin-top: $spacing-10;
}

.time-hint {
  width: 100%;
  margin: $spacing-3 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-style: italic;
}

.save-section {
  @include flex-center;
  justify-content: flex-end;
  gap: $spacing-10;
  margin-top: $spacing-4;
  padding: $spacing-4 0;
  flex-wrap: wrap;
}

.save-btn {
  @include btn-primary;
  padding: $spacing-7 $spacing-13;
  box-shadow: $shadow-primary;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: $shadow-primary-hover;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: $shadow-primary-sm;
  }

  &:disabled {
    opacity: 0.7;
    box-shadow: none;
  }
}

.saving-spinner {
  @include flex-center;
  gap: $spacing-3;
}

.save-message {
  font-size: $font-size-lg;
  margin: 0;
  color: $color-success;
  font-weight: 500;
  background: #ecfdf5;
  padding: $spacing-5 $spacing-8;
  border-radius: 20px;
  transition: opacity $transition-base;
}

.loading-state,
.error-state,
.empty-state {
  @include empty-state-base;
}

@include mobile {
  .settings-container {
    padding: $spacing-8;
  }

  .page-title {
    font-size: $font-size-8xl;
  }

  .card-body {
    padding: $spacing-6 $spacing-8;
  }

  .card-header {
    padding: $spacing-8;
  }

  .toggle-item {
    gap: $spacing-6;
  }

  .switch {
    margin-left: 0;
  }

  .curfew-time-picker {
    @include flex-column;
    align-items: flex-start;
  }

  .time-input {
    width: 100%;
  }

  .time-separator {
    margin-top: 0;
    margin: $spacing-3 0;
  }

  .save-section {
    @include flex-column;
    align-items: stretch;
  }

  .save-btn {
    width: 100%;
  }
}
</style>
