<template>
  <div class="register-page">
    <div class="register-card">
      <!-- 标题区 -->
      <div class="card-header">
        <h1 class="title">创建账号</h1>
        <p class="subtitle">填写信息以注册新账户</p>
      </div>

      <!-- 表单区 -->
      <form @submit.prevent="handleRegister" class="register-form" novalidate>
        <!-- 用户名 -->
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            :class="{ 'input-error': errors.username }"
            @input="clearError('username')"
          />
          <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
        </div>

        <!-- 邮箱 -->
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱地址"
            :class="{ 'input-error': errors.email }"
            @input="clearError('email')"
          />
          <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码（至少6位）"
              :class="{ 'input-error': errors.password }"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
              aria-label="切换密码可见性"
            >
              <svg
                v-if="!showPassword"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                ></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <div class="password-wrapper">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入密码"
              :class="{ 'input-error': errors.confirmPassword }"
              @input="clearError('confirmPassword')"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
              aria-label="切换密码可见性"
            >
              <svg
                v-if="!showPassword"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                ></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
        </div>

        <!-- 注册按钮 -->
        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          <span v-if="!isSubmitting">注册</span>
          <span v-else class="btn-loading">
            <span class="spinner-icon"></span>
            处理中...
          </span>
        </button>
      </form>

      <!-- 底部链接 -->
      <p class="footer-text">
        已有账号？
        <router-link to="/login" class="link">立即登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { ElMessage, formContextKey } from 'element-plus'
import 'element-plus/es/components/message/style/css'
// import { ElMessageBox } from 'element-plus'
// import 'element-plus/es/components/message-box/style/css'

const userStore = useUserStore()
const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)

// 清除单个字段错误
const clearError = (field) => {
  if (errors[field]) {
    errors[field] = ''
  }
}

// 表单验证
const validateForm = async () => {
  let isValid = true

  // 昵称校验
  const usernameRegex = /^[a-zA-Z0-9_]{2,}$/
  if (!form.username.trim()) {
    errors.username = '请输入昵称'
    isValid = false
  } else if (form.username.trim().length < 2) {
    errors.username = '昵称至少需要2个字符'
    isValid = false
  } else if (!usernameRegex.test(form.username.trim())) {
    errors.username = '昵称只能包含字母、数字和下划线'
    isValid = false
  } else {
    errors.username = ''
  }

  // 邮箱校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  } else if (!(await checkMxRecord(form.email.trim().split('@')[1]))) {
    errors.email = '域名无效，请检查邮箱地址'
    isValid = false
  } else {
    errors.email = ''
  }

  // 密码校验
  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少为6位'
    isValid = false
  } else {
    errors.password = ''
  }

  // 确认密码校验
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  } else {
    errors.confirmPassword = ''
  }

  return isValid
}

// 注册请求
const handleRegister = async () => {
  isSubmitting.value = true
  if (!(await validateForm())) {
    isSubmitting.value = false
    return
  }

  try {
    // 模拟API调用
    const success = await userStore.register(form)
    if (success) {
      ElMessage.success('注册成功！')
      router.push('/login')
    } else {
      ElMessage.error('注册失败，请稍后再试。')
    }
    console.log('注册数据:', {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    // 清空表单（可选）
    // form.username = ''
    // form.email = ''
    // form.password = ''
    // form.confirmPassword = ''
    showPassword.value = false
  } catch (error) {
    console.error('注册失败:', error)
    alert('注册失败，请稍后再试。')
  } finally {
    isSubmitting.value = false
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
/* 全局变量定义来自父组件约束，这里仅使用 */
.register-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: transparent;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

/* 卡片样式 */
.register-card {
  background: #ffffff;
  border-radius: 8px; /* 卡片圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻量阴影 */
  padding: 32px;
  width: 100%;
  max-width: 480px;
  /* margin-top: 20px; */
  border: 1px solid #e5e7eb; /* 边框色 */
  transition: box-shadow 0.2s ease;
  box-sizing: border-box;
}

.register-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-weight: 500; /* 导航字重500，标题沿用类似现代风格 */
  font-size: 24px;
  color: #1e40af; /* 主色 */
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.subtitle {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  color: #374151; /* 文字色 */
  margin: 0;
  line-height: 1.5;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-left: 2px;
}

/* 输入框通用样式 */
.form-input {
  width: 100%;
  padding: 10px 14px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px; /* 输入框同样采用8px圆角，保持统一圆润感 */
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  box-sizing: border-box;
  line-height: 1.4;
}

.form-input::placeholder {
  color: #9ca3af;
  font-size: 14px;
}

.form-input:focus {
  border-color: #1e40af;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 密码可见性切换 */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 44px; /* 为按钮留空间 */
}

.toggle-password {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 4px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.2s ease;
  line-height: 1;
}

.toggle-password:hover {
  color: #1e40af;
}

.error-message {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 13px;
  color: #ef4444;
  margin: 2px 0 0 2px;
  line-height: 1.3;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 12px 20px;
  background-color: #1e40af; /* 主色 */
  color: #ffffff;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-weight: 500;
  font-size: 16px;
  border: none;
  border-radius: 9999px; /* 按钮圆角 */
  cursor: pointer;
  margin-top: 8px;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease,
    box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  letter-spacing: 0.3px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1e3a8a; /* 深一点的蓝色 */
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.2);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #1e40af;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.footer-text {
  text-align: center;
  margin-top: 24px;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  color: #374151;
}

.link {
  color: #1e40af;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
  transition: color 0.2s ease;
}

.link:hover {
  color: #1e3a8a;
  text-decoration: underline;
}

/* 移动端适配：768px 断点 */
@media (max-width: 768px) {
  .register-page {
    padding: 16px; /* 移动端内边距16px */
  }

  .register-card {
    padding: 24px 20px;
    margin-top: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .title {
    font-size: 22px;
  }

  .form-input {
    padding: 10px 12px;
  }

  .submit-btn {
    padding: 12px 16px;
    font-size: 15px;
  }
}

/* 极小屏幕优化 */
@media (max-width: 380px) {
  .register-card {
    padding: 20px 16px;
  }
}
</style>
