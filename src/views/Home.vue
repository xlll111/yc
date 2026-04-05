<template>
  <div class="software-home">
    <div class="container">
      <!-- Hero 区域 -->
      <section class="hero">
        <h1 class="hero-title">轻量工具集<br />你的设备管理助手</h1>
        <p class="hero-description">
          聚焦效率，让设备管理更轻松<br />
          提供课表管理、定时任务、网络控制与监控等实用功能
        </p>
        <div class="hero-buttons">
          <button class="btn btn-primary">开始使用</button>
          <button class="btn btn-secondary">了解详情</button>
        </div>
      </section>

      <!-- 特性展示区域 -->
      <section class="features">
        <div class="feature-card">
          <div class="feature-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="feature-title">📅 智能课表</h3>
          <p class="feature-description">支持自定义课程表，内置CSV编辑器，轻松管理课程安排。</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12L15 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </div>
          <h3 class="feature-title">⏲️ 定时任务</h3>
          <p class="feature-description">
            支持定时关机/睡眠，值日排班自动轮换，每天/每周灵活切换。
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 12H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M12 9V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </div>
          <h3 class="feature-title">🌐 网络控制</h3>
          <p class="feature-description">
            联网白名单、宵禁定时断网、U盘访问控制，全方位管理设备权限。
          </p>
        </div>
      </section>

      <!-- 产品展示区域 -->
      <section class="showcase">
        <div class="showcase-content">
          <h2 class="showcase-title">强大的监控与防护</h2>
          <p class="showcase-description">
            专为提升效率而设计，集成多种实用工具，<br />
            让您专注于真正重要的工作。
          </p>
          <ul class="showcase-list">
            <li>✓ DNS网络监控：实时分析网络请求</li>
            <li>✓ 智能截屏：访问特定网站自动记录</li>
            <li>✓ 系统应用锁：限制关键系统设置访问</li>
          </ul>
        </div>
        <div class="showcase-image">
          <div class="placeholder-image">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path d="M8 7L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path
                d="M8 12L16 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M8 17L12 17"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
            <p>产品界面预览</p>
          </div>
        </div>
      </section>

      <!-- CTA 区域 -->
      <section class="cta">
        <h2 class="cta-title">开始管理你的设备</h2>
        <p class="cta-description">立即下载，查看完整文档或前往控制台进行配置</p>
        <button class="btn btn-primary btn-large">免费下载</button>
      </section>
    </div>
  </div>
</template>

<script setup>
// 组件逻辑可在此扩展
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.software-home {
  width: 100%;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: #374151;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero 区域 */
.hero {
  padding: 80px 0 60px;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 20px;
  color: #1e40af;
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 32px;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 按钮样式 */
.btn {
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
}

.btn-primary {
  background: #1e40af;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
  background: #1e3a8a;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-large {
  padding: 14px 36px;
  font-size: 1.125rem;
}

/* 特性区域 */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  padding: 60px 0;
}

.feature-card {
  background: white;
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e40af;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 12px;
  color: #1e40af;
}

.feature-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #374151;
}

/* 产品展示区域 */
.showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  padding: 60px 0;
}

.showcase-content {
  padding-right: 24px;
}

.showcase-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1e40af;
}

.showcase-description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 24px;
  color: #374151;
}

.showcase-list {
  list-style: none;
  padding: 0;
}

.showcase-list li {
  padding: 8px 0;
  font-size: 0.9375rem;
  color: #374151;
}

.showcase-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.placeholder-image {
  width: 100%;
  height: 320px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.placeholder-image svg {
  margin-bottom: 16px;
  color: #9ca3af;
}

.placeholder-image p {
  font-size: 0.875rem;
}

/* CTA 区域 */
.cta {
  text-align: center;
  padding: 80px 0;
  margin: 20px 0 40px;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1e40af;
}

.cta-description {
  font-size: 1.125rem;
  margin-bottom: 32px;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .hero {
    padding: 60px 0 40px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
    padding: 0 16px;
  }

  .features {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 40px 0;
  }

  .showcase {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px 0;
  }

  .showcase-content {
    padding-right: 0;
    text-align: center;
  }

  .showcase-title {
    font-size: 1.75rem;
  }

  .showcase-list {
    text-align: left;
    max-width: 280px;
    margin: 0 auto;
  }

  .cta {
    padding: 60px 0 40px;
  }

  .cta-title {
    font-size: 1.75rem;
  }

  .cta-description {
    font-size: 1rem;
  }

  .btn {
    padding: 10px 24px;
  }

  .btn-large {
    padding: 12px 32px;
  }
}
</style>
