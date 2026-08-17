<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-card">
        <!-- 用户信息头部 - 优化布局 -->
        <div class="profile-header">
          <div class="user-info">
            <Spinner v-if="!userInfoLoaded" inline size="tiny" />
            <div v-else class="user-name-wrapper">
              <h2 class="username">{{ userInfo.username }}</h2>
              <span class="status-badge" :class="{ verified: userInfo.emailVerified }">
                {{ userInfo.emailVerified ? '✓ 已验证邮箱' : '未验证邮箱' }}
              </span>
            </div>
            <Spinner v-if="!userInfoLoaded" inline size="tiny" />
            <p v-else class="user-email">
              <svg
                class="info-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M22 6.5L12 13 2 6.5M2 6.5L12 3l10 3.5M22 6.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5"
                />
                <polyline points="2,6.5 12,13 22,6.5" />
              </svg>
              {{ userInfo.email }}
            </p>
            <div v-if="userInfoLoaded" class="user-meta">
              <span class="meta-item" v-if="false">
                <svg
                  class="meta-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                已绑定微信
              </span>
              <span class="meta-item" v-if="false">
                <svg
                  class="meta-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                已绑定手机
              </span>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 操作按钮区 - 保持不变 -->
        <div class="action-list" v-if="userInfoLoaded">
          <div class="action-item" @click="handleEditUsername">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              修改用户名
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div class="action-item" @click="handleEditEMail">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M22 6.5L12 13 2 6.5M2 6.5L12 3l10 3.5M22 6.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5"
                />
                <polyline points="2,6.5 12,13 22,6.5" />
              </svg>
              修改邮箱
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div class="action-item" @click="handleChangePassword">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              修改密码
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div
            class="action-item highlight"
            @click="handleVerifyEmail"
            v-if="!userInfo.emailVerified"
          >
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M22 6.5L12 13 2 6.5M2 6.5L12 3l10 3.5M22 6.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5"
                />
                <polyline points="2,6.5 12,13 22,6.5" />
              </svg>
              邮箱验证
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div class="action-item highlight" @click="handleshxzhyVerify" v-if="userRole < 1">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M22 6.5L12 13 2 6.5M2 6.5L12 3l10 3.5M22 6.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5"
                />
                <polyline points="2,6.5 12,13 22,6.5" />
              </svg>
              慧云认证
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div class="action-item" @click="handleBindDingtalk">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 1024 1024"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M325.354667 92.501333l-94.4-40.746666-2.624-1.152a97.813333 97.813333 0 0 0-92.864 8.469333l-4.202667 2.986667a95.488 95.488 0 0 0-36.864 57.429333l-0.576 3.029333-1.024 6.4c-8.874667 62.506667 9.642667 137.429333 47.744 193.28l2.112 3.029334-0.469333 1.216a95.872 95.872 0 0 0-3.84 50.069333l1.194666 5.738667c12.586667 57.173333 51.690667 114.496 100.629334 151.850666l4.906666 3.669334v4.48c0.362667 13.482667 3.690667 27.349333 10.581334 40.96 4.928 9.813333 11.008 18.837333 18.346666 28.181333 3.029333 3.882667 6.250667 7.765333 9.642667 11.669333 3.882667 4.458667 7.68 8.618667 11.264 12.416l6.826667 7.061334 5.994666 5.909333 5.845334 5.461333c41.130667 37.376 85.76 55.978667 128.768 61.376l2.922666 0.298667-0.064 1.92a85.546667 85.546667 0 0 0 65.28 83.989333l1.024 0.213334-22.208 67.648c-29.354667 89.301333 86.144 153.493333 146.496 81.429333l212.352-253.589333 2.496-3.114667c32.106667-41.92 17.557333-98.602667-22.08-123.882667l-2.090666-1.301333 18.794666-30.570667 11.328-18.730666 9.898667-16.746667 8.448-14.698667 4.778667-8.597333 1.792-3.349333-1.898667 3.328c22.186667-36.693333 28.842667-84.906667 13.077333-126.186667-15.104-39.616-45.610667-67.797333-87.808-84.992l-8.981333-3.434667-81.493333-28.48-172.672-59.52a2523.52 2523.52 0 0 1-72.042667-26.24l-23.381333-9.002666-17.770667-6.954667a4668.373333 4668.373333 0 0 1-103.189333-42.218667z m-143.061334 37.973334a12.565333 12.565333 0 0 1 12.330667-1.493334l43.84 19.136 57.450667 24.576 44.288 18.432 34.176 13.866667 21.226666 8.469333 28.864 11.264 14.933334 5.717334c18.666667 7.104 37.482667 14.058667 56.042666 20.650666l245.418667 84.864 26.389333 9.344 1.706667 0.618667c24.874667 9.28 37.952 21.930667 44.010667 37.845333 5.610667 14.698667 2.922667 33.834667-4.437334 48.128l-7.488 13.589334-6.677333 11.626666-10.282667 17.450667-20.693333 34.133333-25.536 41.002667-59.029333 92.714667h103.893333L570.368 896l58.090667-176.853333-97.877334-0.64 32.853334-110.933334c-6.314667 2.88-15.210667 6.186667-24.704 9.386667l-11.562667 3.712-11.370667 3.370667c-9.173333 2.624-17.365333 4.650667-22.570666 5.546666l-2.816 0.448-3.584 0.448-4.309334 0.384-4.970666 0.277334-5.546667 0.064c-1.002667 0-1.984 0-3.008-0.042667l-6.4-0.32-6.890667-0.64c-23.68-2.858667-54.613333-12.437333-84.458666-39.210667l-5.205334-4.885333-7.104-7.168-6.485333-6.933333-4.693333-5.290667a239.68 239.68 0 0 1-2.368-2.773333l-4.565334-5.632a88.576 88.576 0 0 1-9.002666-13.589334 10.858667 10.858667 0 0 1 0.064-10.389333 11.562667 11.562667 0 0 1 8.341333-5.909333l202.389333-27.157334-65.749333-1.984-34.922667-1.408-30.08-1.493333-25.130666-1.557333-11.541334-0.853334-10.624-0.917333-9.493333-0.96-8.170667-1.024a146.090667 146.090667 0 0 1-6.677333-1.088c-49.621333-9.429333-107.349333-72.896-118.016-129.365333a11.157333 11.157333 0 0 1 3.008-9.770667c2.922667-2.837333 6.421333-3.84 10.666667-3.349333l71.381333 14.869333 231.509333 49.173333-88.32-29.290666-61.930666-21.098667-48.874667-17.109333-26.197333-9.450667-29.354667-10.965333-15.146667-5.952-8.853333-3.626667-7.701333-3.306667a277.589333 277.589333 0 0 1-3.413334-1.536l-5.802666-2.773333a42.944 42.944 0 0 1-7.317334-4.373333c-44.373333-36.778667-66.794667-114.496-57.984-164.821334a11.029333 11.029333 0 0 1 4.416-6.784z"
                ></path>
              </svg>
              绑定钉钉
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <!-- <div class="action-item" @click="handleBindWechat">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {{ userInfo.wechatBound ? '解绑微信' : '绑定微信' }}
            </span>
            <span class="action-status" :class="{ bound: userInfo.wechatBound }">
              {{ userInfo.wechatBound ? '已绑定' : '未绑定' }}
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div> -->

          <!-- <div class="action-item" @click="handleBindPhone">
            <span class="action-label">
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              {{ userInfo.phoneBound ? '解绑手机' : '绑定手机' }}
            </span>
            <span class="action-status" :class="{ bound: userInfo.phoneBound }">
              {{ userInfo.phoneBound ? '已绑定' : '未绑定' }}
            </span>
            <svg
              class="arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div> -->
        </div>
      </div>
    </div>

    <!-- 置顶弹窗（保持不变） -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card" @keydown.enter="handleModalConfirm">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalType === 'username'">
            <label class="modal-label">新用户名</label>
            <input v-model="tempUsername" class="modal-input" placeholder="请输入新用户名" />
          </div>
          <div v-else-if="modalType === 'email'">
            <label class="modal-label">新邮箱</label>
            <input v-model="tempEMail" class="modal-input" placeholder="请输入新邮箱" />
          </div>
          <div v-else-if="modalType === 'password'">
            <label class="modal-label">当前密码</label>
            <input
              v-model="oldPassword"
              type="password"
              class="modal-input"
              placeholder="请输入当前密码"
            />
            <label class="modal-label">新密码</label>
            <input
              v-model="newPassword"
              type="password"
              class="modal-input"
              placeholder="请输入新密码"
            />
            <label class="modal-label">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="modal-input"
              placeholder="请再次输入新密码"
            />
          </div>
          <div v-else-if="modalType === 'emailverify'">
            <p class="modal-hint">点击确认，验证邮件将发送至您的邮箱，请查收并点击链接完成验证。</p>
            <p class="modal-hint small">邮箱：{{ userInfo.email }}</p>
          </div>
          <div v-else-if="modalType === 'shxzhy'">
            <p class="modal-hint">我们将调用行知·慧云的登录接口验证您的身份</p>
            <p class="modal-hint">您的数据只将用于验证身份，您无法使用行知·慧云账号登录YCService</p>
            <label class="modal-label">慧云账号</label>
            <input v-model="tempShxzhyUsername" class="modal-input" placeholder="请输入慧云账号" />
            <label class="modal-label">慧云密码</label>
            <input
              v-model="tempShxzhyPassword"
              class="modal-input password-mask"
              placeholder="请输入慧云密码"
            />
            <label class="modal-label" v-if="tempShxzhyCaptchaId">验证码</label>
            <input
              v-model="tempShxzhyCaptchaValue"
              class="modal-input"
              placeholder="请输入验证码"
              v-if="tempShxzhyCaptchaId"
            />
            <img v-if="tempShxzhyCaptchaId" :src="shxzhyCaptchaImageBase64" alt="" />
          </div>

          <div v-else-if="modalType === 'dingtalk'">
            <p class="modal-hint">点击获取绑定指令，指令有效期为5分钟</p>
            <p class="modal-hint">需要完成邮箱验证且权限等级1级及以上</p>
            <!-- 显示命令区域 -->
            <div class="command-display" v-if="bindCommand">
              <pre class="command-text">{{ bindCommand }}</pre>
            </div>
            <div class="modal-row">
              <!-- 获取绑定命令按钮 -->
              <button
                class="modal-btn primary"
                @click="fetchBindCommand"
                :disabled="isHandlingConfirm"
              >
                获取绑定指令
              </button>
              <!-- 复制命令按钮 -->
              <button
                class="modal-btn secondary"
                @click="copyCommand"
                :disabled="!bindCommand"
                v-if="bindCommand"
              >
                复制命令
              </button>
              <!-- 查看完整教程链接按钮 -->
              <a href="//yc.xlll.dpdns.org/docs/guide/detailed/user/dingtalkbind" class="modal-link"
                >查看完整教程</a
              >
            </div>
          </div>
          <div v-else-if="modalType === 'wechat'">
            <p class="modal-hint">
              {{
                userInfo.wechatBound ? '确认要解绑微信账号吗？' : '即将跳转至微信授权页面进行绑定。'
              }}
            </p>
          </div>
          <div v-else-if="modalType === 'phone'">
            <label class="modal-label">手机号</label>
            <input v-model="tempPhone" class="modal-input" placeholder="请输入手机号" />
            <label class="modal-label">验证码</label>
            <div class="captcha-row">
              <input v-model="tempCaptcha" class="modal-input" placeholder="请输入验证码" />
              <button class="captcha-btn" @click="handleSendCaptcha">获取验证码</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="closeModal">取消</button>
          <button
            class="modal-btn confirm"
            @click="handleModalConfirm"
            :disabled="isHandlingConfirm"
          >
            <span v-if="!isHandlingConfirm">确认</span>
            <span v-else>处理中...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Spinner from '@/components/Spinner.vue'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
const router = useRouter()
const userStore = useUserStore()
if (!userStore.isLoggedIn) {
  ElMessage.error('未登录')
  router.push('/login')
}
const userInfo = computed(() => userStore.userInfo)
const userInfoLoaded = computed(() => userInfo.value !== null)
const userRole = computed(() => userInfo.value?.role || 0)
console.log('User info:', userInfo.value)

const modalVisible = ref(false)
const modalTitle = ref('')
const modalType = ref('')
const tempUsername = ref('')
const tempEMail = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const tempShxzhyUsername = ref('')
const tempShxzhyPassword = ref('')
const tempShxzhyCaptchaId = ref('')
const tempShxzhyCaptchaValue = ref('')
const shxzhyCaptchaImageBase64 = ref('')
const tempPhone = ref('')
const tempCaptcha = ref('')
const bindCommand = ref('')

const isHandlingConfirm = ref(false)

const bindWechat = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '微信绑定成功' })
    }, 500)
  })
}

const unbindWechat = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '微信解绑成功' })
    }, 500)
  })
}

const bindPhone = (phone, captcha) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (phone && captcha === '123456') {
        resolve({ success: true, message: '手机绑定成功' })
      } else {
        reject({ success: false, message: '验证码错误' })
      }
    }, 500)
  })
}

const unbindPhone = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '手机解绑成功' })
    }, 500)
  })
}

const sendCaptcha = (phone) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: '验证码已发送' })
    }, 500)
  })
}

const fetchBindCommand = async () => {
  isHandlingConfirm.value = true
  try {
    const dingtalkToken = await userStore.fetchDingtalkVerificationToken()
    const payload = {
      dingtalk_token: dingtalkToken,
    }
    const jsonString = JSON.stringify(payload)
    bindCommand.value = `#绑定用户 ${jsonString}`
    ElMessage.success('绑定指令获取成功')
  } catch (error) {
    ElMessage.error('获取绑定指令失败')
    console.error('获取绑定指令失败:', error)
  } finally {
    isHandlingConfirm.value = false
  }
}

const copyCommand = () => {
  navigator.clipboard.writeText(bindCommand.value)
  ElMessage.success('绑定指令已复制到剪贴板')
}

const openModal = (type, title) => {
  modalType.value = type
  modalTitle.value = title
  modalVisible.value = true
  tempUsername.value = ''
  tempEMail.value = ''
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  tempShxzhyUsername.value = ''
  tempShxzhyPassword.value = ''
  tempShxzhyCaptchaId.value = ''
  tempShxzhyCaptchaValue.value = ''
  shxzhyCaptchaImageBase64.value = ''
  tempPhone.value = ''
  tempCaptcha.value = ''
}

const closeModal = () => {
  modalVisible.value = false
}

const handleEditUsername = () => {
  openModal('username', '修改用户名')
}

const handleEditEMail = () => {
  openModal('email', '修改邮箱')
}

const handleChangePassword = () => {
  openModal('password', '修改密码')
}

const handleVerifyEmail = async () => {
  openModal('emailverify', '邮箱验证')
}
const handleshxzhyVerify = async () => {
  openModal('shxzhy', '慧云认证')
}

const handleBindDingtalk = async () => {
  openModal('dingtalk', '绑定钉钉')
}

const handleBindWechat = () => {
  openModal('wechat', userInfo.wechatBound ? '解绑微信' : '绑定微信')
}

const handleBindPhone = () => {
  openModal('phone', userInfo.phoneBound ? '解绑手机' : '绑定手机')
}

const handleSendCaptcha = async () => {
  if (!tempPhone.value) {
    alert('请先输入手机号')
    return
  }
  try {
    await sendCaptcha(tempPhone.value)
    alert('验证码已发送至您的手机')
  } catch (error) {
    alert(error.message || '发送验证码失败')
  }
}
const handleModalFormatCheck = async () => {
  try {
    switch (modalType.value) {
      case 'username': {
        const usernameRegex = /^[a-zA-Z0-9_]{2,}$/
        if (!tempUsername.value.trim()) {
          ElMessage.error('新用户名不能为空')
          return
        } else if (tempUsername.value === userInfo.value.username) {
          ElMessage.error('新用户名与当前用户名相同')
          return
        } else if (!usernameRegex.test(tempUsername.value)) {
          ElMessage.error('用户名只能包含字母、数字和下划线')
          return
        } else if (tempUsername.value.trim().length < 2) {
          ElMessage.error('用户名长度至少为2个字符')
          return
        }
        break
      }
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!tempEMail.value.trim()) {
          ElMessage.error('请输入邮箱地址')
          return
        } else if (emailRegex.value === userInfo.value.email) {
          ElMessage.error('新邮箱与当前邮箱相同')
          return
        } else if (!emailRegex.test(tempEMail.value.trim())) {
          ElMessage.error('请输入有效的邮箱地址')
          return
        } else if (!(await checkMxRecord(tempEMail.value.trim().split('@')[1]))) {
          ElMessage.error('域名无效，请检查邮箱地址')
          return
        }
        // else if () {
        //   return
        // }
        break
      }
      case 'password': {
        if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
          ElMessage.error('请完整填写所有密码字段')
          return
        } else if (newPassword.value !== confirmPassword.value) {
          ElMessage.error('两次输入的密码不一致')
          return
        } else if (newPassword.value.trim().length < 6) {
          ElMessage.error('密码长度至少为6个字符')
          return
        } else if (newPassword.value === oldPassword.value) {
          ElMessage.error('新密码与当前密码相同')
          return
        }
        break
      }
      case 'emailverify': {
        break
      }
      case 'shxzhy': {
        if (!tempShxzhyUsername.value.trim()) {
          ElMessage.error('账号不能为空')
          return
        } else if (!tempShxzhyPassword.value.trim()) {
          ElMessage.error('密码不能为空')
          return
        } else if (tempShxzhyPassword.value.trim().length < 6) {
          ElMessage.error('密码长度至少为6个字符')
          return
        } else if (tempShxzhyCaptchaId.value && !tempShxzhyCaptchaValue.value.trim()) {
          ElMessage.error('请输入验证码')
          return
        }
        break
      }
      case 'dingtalk': {
        break
      }
      case 'wechat': {
        break
      }
      case 'phone': {
        break
      }
    }
    return true
  } catch (error) {
    ElMessage.error(error.message)
    return false
  }
}
const handleModalConfirm = async () => {
  isHandlingConfirm.value = true
  try {
    if (!(await handleModalFormatCheck())) return
    switch (modalType.value) {
      case 'username': {
        await userStore.updateUserName(tempUsername.value)
        ElMessage.success('用户名修改成功')
        closeModal()
        break
      }
      case 'email': {
        await userStore.updateEmail(tempEMail.value)
        ElMessage.success('邮箱修改成功')
        closeModal()
        break
      }
      case 'password': {
        await userStore.updateUserPassword(oldPassword.value, newPassword.value)
        ElMessage.success('密码修改成功')
        closeModal()
        break
      }
      case 'emailverify': {
        await userStore.sendEmailVerification()
        ElMessage.success('验证邮件已发送')
        closeModal()
        break
      }
      case 'shxzhy': {
        const result = await userStore.shxzhyVerify(
          tempShxzhyUsername.value,
          tempShxzhyPassword.value,
          tempShxzhyCaptchaId.value,
          tempShxzhyCaptchaValue.value,
        )
        if (result.success) {
          await userStore.refreshToken()
          await userStore.fetchUserInfo()
          ElMessage.success('慧云认证成功')
          closeModal()
        } else {
          const data = result.data
          if (data?.captcha_id) {
            tempShxzhyCaptchaId.value = data.captcha_id
            shxzhyCaptchaImageBase64.value = data.captcha_image_base64
            tempShxzhyCaptchaValue.value = ''
          }
          ElMessage.error(result?.details || '慧云认证失败')
        }
        break
      }
      case 'wechat': {
        if (userInfo.wechatBound) {
          await unbindWechat()
          userInfo.wechatBound = false
          alert('微信解绑成功')
        } else {
          await bindWechat()
          userInfo.wechatBound = true
          alert('微信绑定成功')
        }
        closeModal()
        break
      }
      case 'phone': {
        if (userInfo.phoneBound) {
          await unbindPhone()
          userInfo.phoneBound = false
          alert('手机解绑成功')
        } else {
          if (!tempPhone.value || !tempCaptcha.value) {
            alert('请完整填写手机号和验证码')
            return
          }
          await bindPhone(tempPhone.value, tempCaptcha.value)
          userInfo.phoneBound = true
          alert('手机绑定成功')
        }
        closeModal()
        break
      }
      default:
        closeModal()
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败，请重试')
  } finally {
    isHandlingConfirm.value = false
  }
}
// 查询 MX 记录的函数
const checkMxRecord = async (domain) => {
  try {
    // 使用 Cloudflare 的 DoH 服务，返回 JSON 格式数据
    const url = `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/dns-json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('DNS 响应:', data)

    // 检查 Answer 数组是否存在且不为空
    const hasMx = data.Answer && data.Answer.length > 0
    console.log(`${domain} ${hasMx ? '有' : '没有'} MX 记录`)
    return hasMx
  } catch (error) {
    console.error('DNS查询失败:', error)
    // 查询失败（如网络问题、域名不存在等），返回 false
    return false
  }
}
</script>

<style scoped>
.profile-page {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  background: #f9fafb;
  height: 100%;
}

@media (min-width: 768px) {
  .profile-page {
    padding: 32px 24px;
  }
}

.profile-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px 24px;
  width: 100%;
  max-width: 560px;
  transition: box-shadow 0.2s ease;
}

/* 头部新样式 */
.profile-header {
  padding: 4px 0 8px 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  letter-spacing: -0.3px;
}

.status-badge {
  font-size: 12px;
  padding: 3px 14px;
  border-radius: 9999px;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 500;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.status-badge.verified {
  background: #dcfce7;
  color: #166534;
}

.user-email {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.info-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1e40af;
  font-weight: 500;
  background: #eff6ff;
  padding: 2px 12px 2px 8px;
  border-radius: 9999px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.meta-icon {
  width: 14px;
  height: 14px;
  color: #1e40af;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 20px 0 24px 0;
}

/* 操作按钮区 - 完全保持原样 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #374151;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.action-item:hover {
  background-color: #f3f4f6;
}

/* 邮箱验证按钮 - 突出强调样式 */
.action-item.highlight {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  margin: 4px 0;
  transition: all 0.3s ease;
}

.action-item.highlight:hover {
  background: linear-gradient(135deg, #fde68a, #fcd34d);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  transform: translateY(-1px);
}

.action-item.highlight .action-label {
  color: #92400e;
}

.action-item.highlight .action-icon {
  color: #d97706;
}

.action-item.highlight .arrow-icon {
  color: #d97706;
}

.action-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 15px;
}

.action-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.arrow-icon {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}

.action-status {
  font-size: 13px;
  color: #9ca3af;
  font-weight: 400;
  margin-left: auto;
  margin-right: 8px;
}

.action-status.bound {
  color: #1e40af;
  font-weight: 500;
}

/* 弹窗样式保持不变 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  animation: fadeIn 0.2s ease;
}

.modal-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.25s ease;
  padding: 24px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  margin-bottom: 24px;
}

.modal-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  font-size: 14px;
  color: #374151;
  background: #ffffff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  margin-bottom: 14px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
}

.modal-input:last-child {
  margin-bottom: 0;
}

.modal-hint {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 6px 0;
  line-height: 1.6;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.modal-hint.small {
  font-size: 13px;
  color: #9ca3af;
}
.modal-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-row .modal-input {
  flex: 1;
  margin-bottom: 0;
}

.captcha-btn {
  padding: 10px 18px;
  background: #1e40af;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.captcha-btn:hover {
  background: #1a3a9e;
}
.password-mask {
  -webkit-text-security: disc; /* Chrome, Safari, Edge */
  text-security: disc; /* 标准属性 */
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 18px;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;
}

.modal-btn.cancel {
  background: #f3f4f6;
  color: #374151;
}

.modal-btn.cancel:hover {
  background: #e5e7eb;
}

.modal-btn.confirm {
  background: #1e40af;
  color: #ffffff;
}

.modal-btn.confirm:hover:not(:disabled) {
  background: #1a3a9e;
}
.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-btn.primary {
  background: #1e40af;
  color: #ffffff;
}
.modal-btn.primary:hover:not(:disabled) {
  background: #1a3a9e;
}

.modal-btn.secondary {
  background: #f0f0f0;
  color: #333;
}
.modal-btn.secondary:hover:not(:disabled) {
  background: #e0e0e0;
}
.modal-btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.command-display {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.command-text {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  color: #24292f;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}

/* 链接按钮风格 - 保持与按钮视觉协调 */
.modal-link {
  display: inline-block;
  color: #1677ff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 0;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
  cursor: pointer;
}
.modal-link:hover {
  border-bottom-color: #1677ff;
}

@media (max-width: 767px) {
  .profile-card {
    padding: 24px 16px;
  }

  .modal-card {
    padding: 20px 16px;
    margin: 12px;
  }

  .action-item {
    padding: 12px 10px;
  }

  .action-label {
    font-size: 14px;
  }

  .username {
    font-size: 20px;
  }

  .user-name-wrapper {
    gap: 8px;
  }

  .user-meta {
    gap: 10px;
  }
}
</style>
