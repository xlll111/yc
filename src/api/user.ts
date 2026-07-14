// api/user.ts
import { request } from '@/utils/request'
import type {
  LoginRequest,
  LoginResponse,
  UserInfo,
  RegisterRequest,
  UserInfoChangeRequest,
  UserInfoChangePasswordRequest,
} from '@/stores/userStore'

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
  updateUserInfo(data: Partial<UserInfoChangeRequest>): Promise<void> {
    return request.authpost('/user/update_user_info', data)
  },

  // 修改密码
  changePassword(data: UserInfoChangePasswordRequest): Promise<void> {
    return request.authpost('/user/change_password', data)
  },

  // 刷新 token
  refreshToken(): Promise<{ access_token: string }> {
    return request.post('/auth/refresh', null, { withCredentials: true })
  },
  // 验证邮箱
  sendEmailVerification(): Promise<void> {
    return request.authpost('/user/send_email_verification')
  },
  // 验证邮箱
  emailVerify(token: string): Promise<void> {
    return request.post('/user/verify_email', { token })
  },
}
