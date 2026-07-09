// api/user.ts
import { request } from '@/utils/request'
import type { LoginRequest, LoginResponse, UserInfo, RegisterRequest } from '@/stores/userStore'

// 用户相关 API
export const userApi = {
  // 登录
  login(data: LoginRequest): Promise<LoginResponse> {
    return request.post('/auth/login', data, { withCredentials: true })
  },

  // 登出
  logout(): Promise<void> {
    return request.post('/auth/logout')
  },

  // 获取用户信息
  getUserInfo(token: string): Promise<UserInfo> {
    return request.get(
      '/user/get_user_info_by_token',
      null,
      { headers: { Authorization: `Bearer ${token}` } }, // 第三个参数是 config
    )
  },

  register(data: RegisterRequest) {
    return request.post('/auth/register', data)
  },

  // 更新用户信息
  updateUserInfo(data: Partial<UserInfo>): Promise<void> {
    return request.put('/user/info', data)
  },

  // 修改密码
  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return request.post('/user/change-password', { oldPassword, newPassword })
  },

  // 刷新 token
  refreshToken(): Promise<{ access_token: string }> {
    return request.post('/auth/refresh', null, { withCredentials: true })
  },

  // 获取用户列表（管理员）
  getUserList(params: { page: number; pageSize: number; keyword?: string }): Promise<{
    list: UserInfo[]
    total: number
  }> {
    return request.get('/user/list', params)
  },
}
