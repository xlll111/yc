<template>
  <div class="auth-container">
    <!-- 头部导航区 -->
    <div class="whitelist-header">
      <button class="back-button" @click="goBack">
        <svg
          class="back-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>
      <div class="client-info">
        <span class="client-label">客户端</span>
        <span class="client-uuid">{{ truncatedUuid }}</span>
      </div>
    </div>
    <div class="auth-card">
      <!-- 标题栏 -->
      <div class="card-header">
        <div class="title-section">
          <h2>....管理</h2>
        </div>
        <p class="subtitle">.....</p>
      </div>

      <!-- 状态卡片 -->
      <!-- <div class="status-section">
        <div class="status-badge" :class="{ enabled: controlEnabled, disabled: !controlEnabled }">
          <span class="status-dot"></span>
          {{ controlEnabled ? '....已启用' : '....未启用' }}
        </div>
        <p v-if="!controlEnabled" class="hint-text">系统未启用....，设置将不会生效</p>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* 容器与卡片 */
.auth-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.auth-card {
  background: #ffffff;
  border-radius: 8px;
  /* border: 1px solid #e5e7eb; */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: box-shadow 0.2s ease;
}

.auth-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 头部导航 */
.whitelist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #374151;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 9999px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.back-button:hover {
  background-color: #f3f4f6;
  color: #1e40af;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.client-info {
  background: #fff;
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
}

.client-uuid {
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e40af;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 9999px;
}
/* 卡片头部 */
.card-header {
  margin-bottom: 28px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.title-section h2 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  letter-spacing: -0.01em;
}

.subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .whitelist-container {
    padding: 16px;
  }

  .whitelist-header {
    /* flex-direction: column; */
    align-items: stretch;
  }

  .client-info {
    justify-content: center;
  }

  .title-section h2 {
    font-size: 1.4rem;
  }

  .auth-container {
    padding: 16px;
  }

  .auth-card {
    padding: 20px;
    gap: 20px;
  }

  .card-header {
    flex-wrap: wrap;
  }
}
</style>
