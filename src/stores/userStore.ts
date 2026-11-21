// stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'
import { defineAsyncState } from './AsyncState'
// 用户信息类型定义
export interface UserInfo {
  id: number
  username: string
  email: string
  emailVerified: boolean
  avatar?: string
  role: number
  dingtalkBind: boolean
  permissions?: string[]
}
export interface USerGlobalSettings {
  id: number
  dingtalkFileTransfer: boolean
  dingtalkFileTransferClientList?: string[]
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
// OAuth授权请求参数类型
export interface OAuthAuthorizeRequest {
  client_id: string
  redirect_uri: string
  response_type: string
  scope: string
  state: string
  code_challenge?: string
  code_challenge_method?: string
}

export interface OAuthAuthorizeResponse {
  redirect_url: string
}

// 慧云服务连通状态
export interface ShxzhyStatus {
  available: boolean
  message?: string
}

// 慧云登录请求参数类型（密码传明文，由服务端转发给慧云校验）
export interface ShxzhyLoginParams {
  userName: string
  password: string
  rememberMe?: boolean
  captchaId?: string
  captchaValue?: string
}

// 慧云登录请求体
export interface ShxzhyLoginRequest {
  userName: string
  password: string
  rememberMe?: boolean
  captchaId?: string
  captchaValue?: string
}

// 慧云登录响应类型
// 成功: { success: true, token, userInfo, isNewUser }
// 需要验证码: { success: false, details, data: { captcha_id, captcha_image_base64 } }
// 账密错误 / 服务不可用: { success: false, details, service_unavailable? }
export interface ShxzhyLoginResponse {
  success: boolean
  token?: string
  userInfo?: UserInfo
  isNewUser?: boolean
  details?: string
  service_unavailable?: boolean
  data?: {
    captcha_id: string
    captcha_image_base64: string
  }
}
export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const globalSettings = ref<USerGlobalSettings | null>(null)
  const isLoggedIn = ref<boolean>(!!token.value)

  // Getters
  const getUserInfo = computed(() => userInfo.value)
  const getToken = computed(() => token.value)
  const getGlobalSettings = defineAsyncState(globalSettings, 'object')
  const getIsLoggedIn = computed(() => isLoggedIn.value)
  const getUserRole = computed(() => userInfo.value?.role || 0)
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
      // console.log('Login response:', response) // 打印登录响应
      // 更新 token 和用户信息到本地存储和状态
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
      await userApi.logout()
      localStorage.removeItem('access_token')
      token.value = ''
      userInfo.value = null
      globalSettings.value = null
      isLoggedIn.value = false
      return Promise.resolve()
    } catch (error) {
      console.error('Logout failed:', error)
      return Promise.reject(error)
    }
  }
  const checkUserRole = async (role: number): Promise<boolean> => {
    if (!userInfo.value) await fetchUserInfo()
    if (!userInfo.value) return Promise.reject('User info not fetched')
    return (userInfo.value?.role || 0) >= role
  }

  // 获取用户信息
  const fetchUserInfo = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      await userApi.getUserInfo(getToken.value).then((response) => {
        userInfo.value = response
        // console.log('User info fetched:', userInfo.value) // 打印用户信息
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
    // console.log('User password updated:', newPassword) // 打印更新的密码
  }

  // 刷新 token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshResponse = await userApi.refreshToken()
      // console.log('Refresh token response:', refreshResponse) // 打印刷新 token 的响应
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

  const shxzhyVerify = async (
    userName: string,
    password: string,
    captchaId: string,
    captchaValue: string
  ) => {
    if (!userInfo.value) return false
    const result = await userApi.shxzhyVerify(userName, password, captchaId, captchaValue)
    // console.log('shxzhyVerify result:', result) // 打印验证结果
    return result
  }

  // 查询慧云认证服务连通状态（登录页与个人中心的慧云认证共用同一个慧云服务）
  // 状态探测与判断全部在服务端完成，前端只负责展示
  const fetchShxzhyStatus = async (): Promise<ShxzhyStatus> => {
    try {
      return await userApi.getShxzhyStatus()
    } catch (error) {
      // 接口本身异常（网络问题 / 服务端故障）时，按“无法确认”处理
      console.error('Fetch shxzhy status failed:', error)
      return { available: false, message: '暂时无法确认慧云服务状态，请稍后重试' }
    }
  }

  // 慧云登录：账号密码交给服务端，由服务端向慧云校验；未注册的账号由服务端自动注册
  // 登录成功后与普通登录一样，保存 token 与用户信息
  const shxzhyLogin = async (params: ShxzhyLoginParams): Promise<ShxzhyLoginResponse> => {
    const response = await userApi.shxzhyLogin({
      userName: params.userName,
      password: params.password,
      rememberMe: params.rememberMe,
      captchaId: params.captchaId,
      captchaValue: params.captchaValue,
    })
    if (response?.success && response.token && response.userInfo) {
      localStorage.setItem('access_token', response.token)
      token.value = response.token
      userInfo.value = response.userInfo
      isLoggedIn.value = true
    }
    return response
  }

  const fetchDingtalkVerificationToken = async () => {
    if (!token.value) return false
    const response = await userApi.getDingtalkVerificationToken()
    // console.log('Dingtalk verification token:', response) // 打印钉钉验证 token
    return response.dingtalk_verification_token
  }

  const fetchGlobalSettings = async () => {
    if (!token.value) return false
    try {
      const response: USerGlobalSettings = await userApi.getGlobalSettings()
      globalSettings.value = response
      // console.log('Global settings:', response) // 打印全局设置
    } catch (error) {
      console.error('Fetch global settings failed:', error)
      globalSettings.value = {
        id: -1,
        dingtalkFileTransfer: false,
      }
      return false
    }
  }
  const fetchDingtalkFileTransferClients = async () => {
    if (!token.value) return false
    const result: string[] = await userApi.getDingtalkFileTransferClients()
    return result
  }
  const updateUerGlobalSettings = async (settings: USerGlobalSettings) => {
    if (!token.value) return false
    await userApi.updateGlobalSettings(settings)
    globalSettings.value = settings
    // console.log('Global settings updated:', settings) // 打印更新后的全局设置
    return true
  }
  // OAuth 授权确认
  const oauthAuthorize = async (
    params: Omit<OAuthAuthorizeRequest, 'access_token'>
  ): Promise<string> => {
    if (!token.value) {
      throw new Error('未登录，无法进行授权')
    }
    try {
      const requestData: OAuthAuthorizeRequest = {
        ...params,
      }
      const response = await userApi.oauthAuthorize(requestData)
      return response.redirect_url
    } catch (error) {
      console.error('OAuth authorize failed:', error)
      throw error
    }
  }
  return {
    // State
    token,
    userInfo,
    globalSettings,
    isLoggedIn,
    // Getters
    getUserInfo,
    getToken,
    getGlobalSettings,
    getIsLoggedIn,
    getUserRole,
    getUserPermissions,
    hasPermission,
    hasAnyPermission,
    // Actions
    login,
    logout,
    checkUserRole,
    fetchUserInfo,
    register,
    updateUserName,
    updateEmail,
    updateUserPassword,
    refreshToken,
    sendEmailVerification,
    emailVerify,
    shxzhyVerify,
    fetchShxzhyStatus,
    shxzhyLogin,
    fetchDingtalkVerificationToken,
    fetchGlobalSettings,
    fetchDingtalkFileTransferClients,
    updateUerGlobalSettings,
    oauthAuthorize,
  }
})
