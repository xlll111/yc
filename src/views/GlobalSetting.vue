<template>
  <div class="client-list-container root">
    <div class="page-header">
      <h1 class="page-title">全局设置</h1>
    </div>
    <div class="setting-card">
      <div class="card-header">
        <h2 class="card-title">钉钉文件推送</h2>
      </div>
      <div class="card-body">
        <div class="toggle-item">
          <div class="toggle-label">
            <span>详情请查看：个人中心-绑定钉钉-查看完整教程</span>
            <p class="toggle-desc">当前只支持单个默认客户端的文件推送</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import Spinner from '@/components/Spinner.vue'

import { useClientStore } from '@/stores/clientStore'

const router = useRouter()
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
.client-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
  letter-spacing: -0.01em;
} /* 卡片样式 */
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
} /* 每个开关项 */
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
</style>
