<template>
  <div class="not-found-page">
    <div class="container">
      <div class="error-card">
        <!-- 装饰性图形元素 -->
        <div class="graphics">
          <div class="floating-element element-1"></div>
          <div class="floating-element element-2"></div>
          <div class="floating-element element-3"></div>
          <div class="glow"></div>
          <div class="code-container">
            <span class="code-digit">4</span>
            <div class="zero-wrapper">
              <div class="zero-ring"></div>
              <span class="code-digit zero">0</span>
            </div>
            <span class="code-digit">4</span>
          </div>
        </div>

        <!-- 文本内容 -->
        <h1 class="title">页面未找到</h1>
        <p class="description">
          抱歉，您访问的页面不存在或已被移除。<br />
          请检查网址或返回首页。
        </p>

        <!-- 操作按钮组 -->
        <div class="actions">
          <button class="btn btn-primary" @click="goHome">
            <svg
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-8H7v8H5a2 2 0 0 1-2-2z" />
            </svg>
            返回首页
          </button>
          <button class="btn btn-secondary" @click="goBack">
            <svg
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回上一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* 重置和基础样式 */
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

/* 容器 - 最大宽度1200px，内边距响应式 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 卡片 - 圆角8px，阴影轻量级 */
.error-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 48px 32px 56px;
  text-align: center;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

/* 图形区域 */
.graphics {
  position: relative;
  height: 220px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(30, 64, 175, 0.08);
  pointer-events: none;
}

.element-1 {
  width: 120px;
  height: 120px;
  top: 20px;
  left: 10%;
  animation: float 6s ease-in-out infinite;
}

.element-2 {
  width: 80px;
  height: 80px;
  bottom: 20px;
  right: 12%;
  background: rgba(30, 64, 175, 0.05);
  animation: float 7s ease-in-out infinite reverse;
}

.element-3 {
  width: 160px;
  height: 160px;
  top: -30px;
  right: 20%;
  background: rgba(30, 64, 175, 0.03);
  animation: float 8s ease-in-out infinite;
}

.glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(30, 64, 175, 0.1) 0%, rgba(30, 64, 175, 0) 70%);
  filter: blur(20px);
  z-index: 0;
}

/* 404 数字容器 */
.code-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.code-digit {
  font-size: 120px;
  font-weight: 700;
  color: #1e40af;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(30, 64, 175, 0.15);
  letter-spacing: -4px;
}

.zero-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.zero-ring {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 3px solid rgba(30, 64, 175, 0.2);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: spin 8s linear infinite;
}

.zero {
  position: relative;
  z-index: 1;
}

/* 标题和描述 */
.title {
  font-size: 32px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  letter-spacing: -0.3px;
}

.description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 40px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* 按钮组 */
.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  text-decoration: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: #1e40af;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-primary:hover {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-secondary:active {
  transform: translateY(0);
}

/* 底部提示 */
.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
}

.link {
  color: #1e40af;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 1px dashed #e5e7eb;
}

.link:hover {
  color: #1e3a8a;
  border-bottom-color: #1e40af;
}

/* 动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 响应式断点 768px */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .error-card {
    padding: 32px 20px 40px;
  }

  .code-digit {
    font-size: 80px;
  }

  .zero-ring {
    width: 70px;
    height: 70px;
  }

  .title {
    font-size: 26px;
  }

  .description {
    font-size: 14px;
    margin-bottom: 32px;
  }

  .graphics {
    height: 160px;
    margin-bottom: 24px;
  }

  .btn {
    padding: 8px 20px;
    font-size: 13px;
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  .footer-tip {
    font-size: 13px;
  }

  .element-1 {
    width: 80px;
    height: 80px;
  }

  .element-2 {
    width: 60px;
    height: 60px;
  }

  .element-3 {
    width: 100px;
    height: 100px;
  }
}

/* 小屏手机额外优化 */
@media (max-width: 480px) {
  .code-digit {
    font-size: 60px;
  }

  .zero-ring {
    width: 55px;
    height: 55px;
  }

  .actions {
    gap: 12px;
  }

  .btn {
    padding: 7px 16px;
  }
}
</style>
