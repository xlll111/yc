<template>
  <div class="about-page">
    <div class="about-container">
      <!-- 页头区域 -->
      <div class="about-header">
        <h1 class="about-title">关于我们</h1>
        <p class="about-subtitle">了解我们的故事与愿景</p>
      </div>

      <!-- 主要内容卡片组 -->
      <div class="about-content">
        <!-- 项目介绍卡片 -->
        <div class="info-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <h3 class="card-title">项目背景</h3>
          <p class="card-text">
            这是一个采用 Vue 3 构建的现代化 Web 应用，致力于提供卓越的用户体验。
            我们采用最新的前端技术栈，确保性能与可维护性的完美平衡。
          </p>
        </div>

        <!-- 技术栈卡片 -->
        <div class="info-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path d="M8 7L16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path
                d="M8 12L16 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M8 17L13 17"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3 class="card-title">技术栈</h3>
          <p class="card-text">
            Vue 3、Vue Router、Pinia 状态管理、Vite 构建工具， 以及现代化的 CSS
            布局方案，为你带来流畅的交互体验。
          </p>
        </div>

        <!-- 设计理念卡片 -->
        <div class="info-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 6V12L15 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
              <path d="M12 4V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M20 12H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M4 12H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <h3 class="card-title">设计理念</h3>
          <p class="card-text">
            追求干净、现代、富有呼吸感的视觉语言。通过微妙的阴影、
            圆润的边角以及舒适的留白，营造出专业且友好的使用氛围。
          </p>
        </div>

        <!-- 版本信息卡片 - 占据更大宽度 -->
        <div class="info-card wide-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 8V12L15 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
              <path d="M12 4V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
          <div class="version-content">
            <h3 class="card-title">版本信息</h3>
            <div class="version-details">
              <div class="version-item">
                <span class="version-label">客户端当前版本</span>
                <Spinner v-if="!loading" size="tiny" inline />
                <span v-else class="version-value">{{ clientVersion?.version }}</span>
              </div>
              <div class="version-item">
                <span class="version-label">最后更新</span>
                <Spinner v-if="!loading" size="tiny" inline />
                <span v-else class="version-value">{{ formatDate(clientVersion?.vdata) }}</span>
              </div>
              <!-- <div class="version-item">
                <span class="version-label">许可协议</span>
                <span class="version-value">MIT License</span>
              </div> -->
            </div>
          </div>
        </div>

        <!-- 联系方式卡片 -->
        <div class="info-card">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22 16.92V19C22.0011 19.7919 21.743 20.563 21.2674 21.1923C20.7918 21.8216 20.1287 22.2716 19.3809 22.4682C18.6331 22.6648 17.8458 22.5965 17.139 22.273C15.7735 21.6828 14.2317 20.8028 12.7145 19.6786C11.1961 18.5536 9.79179 17.2171 8.57001 15.72C7.06011 13.8836 5.85135 11.8222 5.00001 9.60999C4.67592 8.86473 4.60439 8.03333 4.79496 7.24328C4.98554 6.45322 5.42679 5.7506 6.05001 5.23999L7.49001 4.06999C7.97922 3.67438 8.62089 3.51508 9.22886 3.6382C9.83684 3.76132 10.3497 4.15291 10.63 4.69999L12.34 7.96999C12.6155 8.51318 12.6707 9.14791 12.4927 9.73094C12.3147 10.314 11.9196 10.7969 11.4 11.08L9.95001 11.91C10.7668 13.0669 11.7857 14.071 12.95 14.86L13.78 13.41C14.0661 12.8901 14.5515 12.4957 15.1366 12.3197C15.7218 12.1437 16.3581 12.2022 16.9 12.48L20.11 14.22C20.6606 14.5046 21.0534 15.0233 21.1743 15.6378C21.2953 16.2523 21.1322 16.8896 20.73 17.37L20.05 18.24C19.7079 18.6667 19.2077 18.9388 18.66 18.99"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="card-title">联系支持</h3>
          <p class="card-text">
            本页面目前为开源状态,项目地址:
            <a class="card-link" href="https://github.com/xlll111/yc"
              >https://github.com/xlll111/yc</a
            >
            <!-- <button class="contact-btn">联系我们</button> -->
          </p>
        </div>
      </div>

      <!-- 底部版权 -->
      <!-- <div class="about-footer">
        <p>&copy; 2025 你的公司名称. All rights reserved.</p>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { request } from '@/utils/request'
import Spinner from '@/components/Spinner.vue'
const clientVersion = ref({})
const server = 'https://yc-server-v.xlll.dpdns.org'
const loading = ref(false)

const getClientVersion = async () => {
  try {
    const response = await request.get(`${server}/client/get_version`)
    // console.log(response)
    loading.value = true
    return response
  } catch (error) {
    console.error('获取版本失败:', error)
    return {}
  }
}
const formatDate = (dateNumber) => {
  if (!dateNumber) return ''

  // 将数字转换为字符串
  const dateStr = dateNumber.toString()

  // 提取年月日
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)

  // 创建日期对象 (注意：月份从0开始，所以要减1)
  // const date = new Date(year, month - 1, day)

  // 格式化输出
  return `${year}-${month}-${day}`
}

onMounted(async () => {
  clientVersion.value = await getClientVersion()
})
</script>

<style scoped>
/* 页面容器 */
.about-page {
  width: 100%;
  flex: 1;
  background-color: #f9fafb;
}

/* 内容容器 - 遵循 1200px 最大宽度和内外边距规范 */
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
}

/* 页头区域 */
.about-header {
  text-align: center;
  padding: 48px 0 32px;
}

.about-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.about-subtitle {
  font-size: 1.125rem;
  color: #374151;
  margin: 0;
  opacity: 0.8;
}

/* 卡片网格布局 */
.about-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
  padding: 24px 0 48px;
}

/* 卡片样式 */
.info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 28px 24px;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

/* 宽卡片占据双倍宽度（在大屏幕上） */
@media (min-width: 768px) {
  .wide-card {
    grid-column: span 2;
  }
}

/* 卡片图标 */
.card-icon {
  width: 48px;
  height: 48px;
  background-color: rgba(30, 64, 175, 0.08);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #1e40af;
  transition: all 0.2s ease;
}

.card-icon svg {
  width: 26px;
  height: 26px;
}

.info-card:hover .card-icon {
  background-color: #1e40af;
  color: white;
}

/* 卡片文字样式 */
.card-title {
  font-size: 1.35rem;
  font-weight: 500;
  color: #1e40af;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #374151;
  margin: 0;
  flex: 1;
}
.card-link {
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

/* 版本信息特殊样式 */
.version-content {
  flex: 1;
}

.version-details {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.version-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 400;
}

.version-value {
  font-size: 1rem;
  font-weight: 500;
  color: #1e40af;
}

/* 联系按钮样式 */
.contact-btn {
  background: transparent;
  border: 1.5px solid #1e40af;
  color: #1e40af;
  padding: 10px 20px;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s ease;
  width: fit-content;
  font-family: inherit;
}

.contact-btn:hover {
  background: #1e40af;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.2);
}

/* 底部版权 */
.about-footer {
  text-align: center;
  padding: 32px 0 40px;
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
}

.about-footer p {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

/* 响应式断点 768px */
@media (max-width: 768px) {
  .about-container {
    padding: 0 16px;
  }

  .about-header {
    padding: 32px 0 24px;
  }

  .about-title {
    font-size: 1.8rem;
  }

  .about-subtitle {
    font-size: 1rem;
  }

  .about-content {
    gap: 20px;
    padding: 16px 0 32px;
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 24px 20px;
  }

  .wide-card {
    grid-column: span 1;
  }

  .card-title {
    font-size: 1.2rem;
  }
}
</style>
