// stores/userStore.ts
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
const router = useRouter()
// 用户信息类型定义
export interface UserInfo {
  id: number
  username: string
  email?: string
  avatar?: string
  role?: string
  permissions?: string[]
}

// 登录请求参数类型
export interface LoginParams {
  username: string
  password: string
}

// 登录响应类型
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
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
      const response = await userApi.login(params)
      const { token: newToken, userInfo: newUserInfo } = response

      // 保存 token 到 localStorage
      localStorage.setItem('token', newToken)
      token.value = newToken
      userInfo.value = newUserInfo
      isLoggedIn.value = true

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  // 登出
  const logout = async (): Promise<void> => {
    try {
      // 调用登出 API（可选）
      // await api.post('/logout')
      // 清除本地存储
      localStorage.removeItem('token')
      token.value = ''
      userInfo.value = null
      isLoggedIn.value = false
      ElMessage.success('已退出登录')
      // 刷新当前界面
      const currentRoute = router.currentRoute.value
      router.push({ path: '/', query: { reload: Date.now() } }).then(() => {
        router.replace(currentRoute)
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // 获取用户信息
  const fetchUserInfo = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      userApi.getUserInfo(getToken.value).then((response) => {
        userInfo.value = response
      })
      return true
    } catch (error) {
      console.error('Fetch user info failed:', error)
      return false
    }
  }

  // 更新用户信息
  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info }
    }
  }

  // 刷新 token
  const refreshToken = async (): Promise<boolean> => {
    try {
      // const response = await api.post<{ token: string }>('/token/refresh')
      // token.value = response.token
      // localStorage.setItem('token', response.token)
      return true
    } catch (error) {
      console.error('Refresh token failed:', error)
      return false
    }
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
    updateUserInfo,
    refreshToken,
  }
})
