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
          <button class="btn btn-primary" @click="download">开始使用</button>
          <button class="btn btn-secondary" @click="router.push('/docs/')">了解详情</button>
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
                d="M21.745,6.245H19.4V.335A.335.335,0,0,0,19.069,0H.335A.335.335,0,0,0,0,.335V19.068a.335.335,0,0,0,.335.335H2.677v2.342a.335.335,0,0,0,.334.334H21.745a.335.335,0,0,0,.334-.334V6.579A.335.335,0,0,0,21.745,6.245Zm-5.91,12.016V15.834h2.426ZM.669.669H18.734v2.9H.669Zm0,18.064V4.238H18.734V15.165H15.5a.335.335,0,0,0-.335.335v3.233ZM21.41,21.41H3.346V19.4H15.5a.339.339,0,0,0,.237-.1l3.568-3.569a.334.334,0,0,0,.1-.236V6.914H21.41ZM17.075,2.355c-.3.312-.784-.171-.473-.473S17.384,2.052,17.075,2.355Zm-2.543.1a.335.335,0,0,1,0-.67A.335.335,0,0,1,14.532,2.454Zm-2.065-.1c-.3.312-.783-.171-.473-.473S12.778,2.051,12.467,2.355ZM10.231,6.69h6.162a.335.335,0,0,1,0,.67H10.231A.335.335,0,0,1,10.231,6.69Zm-7.219,0H8.447a.335.335,0,0,1,0,.67H3.012A.335.335,0,0,1,3.012,6.69Zm13.381,3.643H14.014a.335.335,0,0,1,0-.669h2.379A.335.335,0,0,1,16.393,10.333Zm-4.163,0H7.109a.335.335,0,1,1,0-.669H12.23a.335.335,0,0,1,0,.669ZM3.012,9.664H5.324a.335.335,0,0,1,0,.669H3.012A.335.335,0,0,1,3.012,9.664Zm13.381,3.643H11.57a.335.335,0,0,1,0-.669h4.823A.335.335,0,0,1,16.393,13.307ZM3.012,12.638H9.785a.335.335,0,0,1,0,.669H3.012A.335.335,0,0,1,3.012,12.638Zm9.9,3.642H8.183a.335.335,0,0,1,0-.669h4.725A.335.335,0,0,1,12.908,16.28Zm-6.51,0H3.012a.335.335,0,0,1,0-.669H6.4A.335.335,0,0,1,6.4,16.28Z"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="feature-title">智能课表</h3>
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
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </div>
          <h3 class="feature-title">定时任务</h3>
          <p class="feature-description">
            支持定时关机/睡眠，值日排班自动轮换，每天/每周灵活切换。
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 128 128"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M64,126c34.2,0,62-27.8,62-62S98.2,2,64,2S2,29.8,2,64S29.8,126,64,126z M16,88.7l25.2-0.2c2.8,10.1,7.5,19.9,13.9,28.7   C38,114.4,23.7,103.5,16,88.7z M47.6,47H79c2.3,11,2.3,22.3,0.2,33.3l-31.6,0.2C45.3,69.4,45.3,58,47.6,47z M63.3,114.9   c-6.3-8.1-10.9-17-13.7-26.4l27.5-0.2C74.2,97.7,69.6,106.7,63.3,114.9z M71.3,117.5c6.6-9,11.3-18.9,14.1-29.3l26.9-0.2   C104.5,103.7,89.3,115,71.3,117.5z M118,64c0,5.6-0.9,11-2.4,16l-28.3,0.2c2-11,1.9-22.2-0.2-33.2h28.1C117,52.3,118,58.1,118,64z    M111.8,39H85.2c-2.9-10-7.5-19.7-13.9-28.5C89,12.9,103.9,23.8,111.8,39z M76.9,39H49.7c2.9-9.2,7.4-17.9,13.6-25.9   C69.5,21.1,74,29.8,76.9,39z M55.1,10.8C48.8,19.5,44.2,29,41.4,39H16.2C23.9,24.3,38.1,13.6,55.1,10.8z M39.5,47   c-2.1,11.1-2.1,22.4-0.1,33.5l-26.7,0.2C10.9,75.4,10,69.8,10,64c0-5.9,1-11.7,2.8-17H39.5z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="feature-title">网络控制</h3>
          <p class="feature-description">
            联网白名单、宵禁定时断网、U盘访问控制，全方位管理设备权限。
          </p>
        </div>
      </section>

      <!-- 产品展示区域 - 循环图片轮播 -->
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
          <!-- 替换为轮播图组件 -->
          <div class="carousel-container">
            <div class="carousel-wrapper">
              <div
                class="carousel-slides"
                :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
              >
                <div v-for="(image, idx) in carouselImages" :key="idx" class="carousel-slide">
                  <div class="carousel-image-placeholder">
                    <img :src="image.url" alt="" />
                    <component :is="image.icon" class="carousel-icon" />
                    <p class="carousel-label">{{ image.label }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 指示点 -->
            <div class="carousel-dots">
              <button
                v-for="(_, idx) in carouselImages"
                :key="idx"
                class="carousel-dot"
                :class="{ active: currentIndex === idx }"
                @click="goToSlide(idx)"
              ></button>
            </div>

            <!-- 左右箭头 -->
            <button class="carousel-arrow carousel-arrow-left" @click="prevSlide">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M15 18L9 12L15 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="carousel-arrow carousel-arrow-right" @click="nextSlide">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 18L15 12L9 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- CTA 区域 -->
      <section class="cta">
        <h2 class="cta-title">开始管理你的设备</h2>
        <p class="cta-description">立即下载，查看完整文档或前往控制台进行配置</p>
        <button class="btn btn-primary btn-large" @click="download">免费下载</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const download = () => {
  window.open('https://class.xlll.dpdns.org/api/files/installer/download/latest', '_blank')
}
// 轮播图数据
const carouselImages = ref([
  {
    icon: 'dashboard-icon',
    label: '控制台',
    url: 'https://fgarbogqref4qxbc.public.blob.vercel-storage.com/YCDash0.png',
  },
  {
    icon: 'dashboard-icon1',
    label: '控制台1',
    url: 'https://fgarbogqref4qxbc.public.blob.vercel-storage.com/YCDash1.png',
  },
  {
    icon: 'dashboard-icon2',
    label: '控制台2',
    url: 'https://fgarbogqref4qxbc.public.blob.vercel-storage.com/YCDash2.png',
  },
])

const currentIndex = ref(0)
let intervalId = null

// 下一张
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % carouselImages.value.length
}

// 上一张
const prevSlide = () => {
  currentIndex.value =
    (currentIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length
}

// 跳转到指定幻灯片
const goToSlide = (index) => {
  currentIndex.value = index
  resetInterval()
}

// 重置自动播放计时器
const resetInterval = () => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  intervalId = setInterval(() => {
    nextSlide()
  }, 4000)
}

// 组件挂载时启动自动轮播
onMounted(() => {
  resetInterval()
})

// 组件卸载时清除计时器
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
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
  max-width: min-content;
  justify-content: center;
  align-items: center;
}

/* ----- 轮播图样式 ----- */
.carousel-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.carousel-wrapper {
  overflow: hidden;
  border-radius: 16px;
}

.carousel-slides {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel-slide {
  flex-shrink: 0;
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* gap: 16px; */
  padding: 32px;
}

.carousel-image-placeholder img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.carousel-icon {
  width: 96px;
  /* height: 96px; */
  color: #1e40af;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.carousel-slide:hover .carousel-icon {
  transform: scale(1.05);
}

.carousel-svg svg {
  width: 96px;
  height: 96px;
}

.carousel-label {
  font-size: 1.125rem;
  font-weight: 500;
  color: #1e40af;
  letter-spacing: 0.5px;
  margin-top: 8px;
  margin-bottom: 16px;
}

/* 指示点样式 */
.carousel-dots {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-dot.active {
  width: 24px;
  border-radius: 4px;
  background: #1e40af;
}

.carousel-dot:hover {
  background: #1e40af;
  transform: scale(1.1);
}

/* 左右箭头样式 */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.carousel-arrow:hover {
  background: white;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) scale(1.05);
}

.carousel-arrow-left {
  left: 12px;
}

.carousel-arrow-right {
  right: 12px;
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
    justify-items: center;
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

  .carousel-container {
    max-width: 100%;
  }

  .carousel-slide {
    height: 280px;
  }

  .carousel-icon {
    width: 72px;
    /* height: 72px; */
  }

  .carousel-svg svg {
    width: 72px;
    height: 72px;
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
