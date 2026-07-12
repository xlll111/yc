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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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

          <div class="action-item" @click="handleVerifyEmail" v-if="!userInfo.emailVerified">
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
            确认
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
console.log('User info:', userInfo.value)

const modalVisible = ref(false)
const modalTitle = ref('')
const modalType = ref('')
const tempUsername = ref('')
const tempEMail = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const tempPhone = ref('')
const tempCaptcha = ref('')

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

const openModal = (type, title) => {
  modalType.value = type
  modalTitle.value = title
  modalVisible.value = true
  tempUsername.value = ''
  tempEMail.value = ''
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
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
