// stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'

// 用户信息类型定义
export interface UserInfo {
  id: number
  username: string
  email: string
  emailVerified: boolean
  avatar?: string
  role: number
  permissions?: string[]
}
export interface UserInfoChangeRequest {
  username?: string
  email?: string
}
export interface UserInfoChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// 登录请求参数类型
export interface LoginParams {
  username: string
  password: string
  rememberMe: boolean
}
export interface RegisterParams {
  username: string
  password: string
  email: string
}
export interface RegisterRequest {
  username: string
  passwordhash: string
  email: string
}
export interface LoginRequest {
  username: string
  passwordhash: string
  rememberMe: boolean
}
// 登录响应类型
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref<boolean>(!!token.value)

  // Getters
  const getUserInfo = computed(() => userInfo.value)
  const getToken = computed(() => token.value)
  const getIsLoggedIn = computed(() => isLoggedIn.value)
  const getUserRole = computed(() => userInfo.value?.role || '')
  const getUserPermissions = computed(() => userInfo.value?.permissions || [])

  // 检查是否有某个权限
  const hasPermission = (permission: string): boolean => {
    return getUserPermissions.value.includes(permission)
  }

  // 检查是否有任意一个权限
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  // Actions
  // 登录
  const login = async (params: LoginParams): Promise<boolean> => {
    try {
      // 调用登录 API
      const requestData: LoginRequest = {
        username: params.username,
        passwordhash: await hashPassword(params.password),
        rememberMe: params.rememberMe,
      }
      const response = await userApi.login(requestData)
      const { token: newToken, userInfo: newUserInfo } = response

      // 保存 token 到 localStorage
      localStorage.setItem('access_token', newToken)
      token.value = newToken
      userInfo.value = newUserInfo
      isLoggedIn.value = true

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // 登出
  const logout = async (): Promise<void> => {
    try {
      // 调用登出 API（可选）
      // await api.post('/logout')
      // 清除本地存储
      localStorage.removeItem('access_token')
      token.value = ''
      userInfo.value = null
      isLoggedIn.value = false
      clearAllCookies()
      return Promise.resolve()
    } catch (error) {
      console.error('Logout failed:', error)
      return Promise.reject(error)
    }
  }
  function clearAllCookies() {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i]
      if (cookie) {
        // 检查 cookie 是否为空字符串
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // 设置过期时间为过去，并指定 path 为 /
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
    }
  }

  // 获取用户信息
  const fetchUserInfo = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      userApi.getUserInfo(getToken.value).then((response) => {
        userInfo.value = response
        console.log('User info fetched:', userInfo.value) // 打印用户信息
      })
      return true
    } catch (error) {
      console.error('Fetch user info failed:', error)
      return false
    }
  }

  const register = async (params: RegisterParams): Promise<boolean> => {
    try {
      const requestData: RegisterRequest = {
        username: params.username,
        passwordhash: await hashPassword(params.password),
        email: params.email,
      }
      await userApi.register(requestData)
      return true
    } catch (error) {
      console.error('Register failed:', error)
      return false
    }
  }

  // 更新用户信息
  const updateUserName = async (username: string) => {
    if (!userInfo.value) return false
    const requestData: Partial<UserInfoChangeRequest> = {
      username: username,
    }
    await userApi.updateUserInfo(requestData)
    userInfo.value.username = username
  }
  const updateEmail = async (email: string) => {
    if (!userInfo.value) return false
    const requestData: Partial<UserInfoChangeRequest> = {
      email: email,
    }
    await userApi.updateUserInfo(requestData)
    userInfo.value.email = email
    userInfo.value.emailVerified = false
  }

  // 更改用户密码
  const updateUserPassword = async (oldPassword: string, newPassword: string) => {
    if (!userInfo.value) return false
    const requestData: UserInfoChangePasswordRequest = {
      oldPassword: await hashPassword(oldPassword),
      newPassword: await hashPassword(newPassword),
    }
    await userApi.changePassword(requestData)
    console.log('User password updated:', newPassword) // 打印更新的密码
  }

  // 刷新 token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshResponse = await userApi.refreshToken()
      console.log('Refresh token response:', refreshResponse) // 打印刷新 token 的响应
      const newToken = refreshResponse.access_token

      // 更新存储的 token
      token.value = newToken
      localStorage.setItem('access_token', newToken)
      return true
    } catch (error) {
      console.error('Refresh token failed:', error)
      return false
    }
  }

  const sendEmailVerification = async (): Promise<boolean> => {
    if (!userInfo.value) return false
    await userApi.sendEmailVerification()
    return true
  }
  const emailVerify = async (token: string) => {
    await userApi.emailVerify(token)
    return true
  }

  return {
    // State
    token,
    userInfo,
    isLoggedIn,
    // Getters
    getUserInfo,
    getToken,
    getIsLoggedIn,
    getUserRole,
    getUserPermissions,
    hasPermission,
    hasAnyPermission,
    // Actions
    login,
    logout,
    fetchUserInfo,
    register,
    updateUserName,
    updateEmail,
    updateUserPassword,
    refreshToken,
    sendEmailVerification,
    emailVerify,
  }
})
