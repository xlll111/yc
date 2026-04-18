// utils/request.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useUserStore } from '@/stores/userStore'
import router from '@/router'

// 响应数据统一格式
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

// 请求配置
interface RequestConfig extends AxiosRequestConfig {
  headers?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
}

// 安全的消息提示（避免组件未挂载时的错误）
const safeMessage = {
  error: (message: string) => {
    console.error(`[Error]: ${message}`)
    // 延迟到下一个微任务执行，确保 DOM 已准备
    Promise.resolve().then(async () => {
      try {
        const { ElMessage } = await import('element-plus')
        await import('element-plus/es/components/message/style/css')
        ElMessage.error(message)
      } catch (e) {
        // 静默失败，只输出到控制台
        console.warn('Message component not ready:', message)
      }
    })
  },
  warning: (message: string) => {
    console.warn(`[Warning]: ${message}`)
    Promise.resolve().then(async () => {
      try {
        const { ElMessage } = await import('element-plus')
        await import('element-plus/es/components/message/style/css')
        ElMessage.warning(message)
      } catch (e) {
        console.warn('Message component not ready:', message)
      }
    })
  },
  success: (message: string) => {
    console.log(`[Success]: ${message}`)
    Promise.resolve().then(async () => {
      try {
        const { ElMessage } = await import('element-plus')
        await import('element-plus/es/components/message/style/css')
        ElMessage.success(message)
      } catch (e) {
        console.log('Message component not ready:', message)
      }
    })
  },
}

class Request {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL0 || 'https://yc-server-v.xlll.dpdns.org',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const userStore = useUserStore()
        const token = userStore.getToken

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          }
        }

        return config
      },
      (error: any) => {
        console.error('Request error:', error)
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response
        console.log('Response :', response)
        if (data.code === 200 || data.code === 0) {
          return data.data
        } else if (data.code === 401) {
          const userStore = useUserStore()
          userStore.logout()
          // safeMessage.error(data.message || '登录已过期')
          return Promise.reject(new Error(data.message))
        } else if (data.code === 403) {
          safeMessage.error('没有权限访问')
          return Promise.reject(new Error(data.message))
        } else {
          safeMessage.error(data.message || '请求失败')
          return Promise.reject(new Error(data.message))
        }
      },
      (error: any) => {
        console.error('Response error:', error)

        // HTTP 状态码错误处理
        if (error.response) {
          const { status } = error.response

          switch (status) {
            case 400:
              safeMessage.error('请求参数错误')
              break
            case 401:
              safeMessage.error('登录已过期，请重新登录')
              const userStore = useUserStore()
              userStore.logout()
              // 避免在初始化时跳转导致问题
              setTimeout(() => {
                if (window.location.pathname !== '/login') {
                  router.push('/login')
                }
              }, 100)
              break
            case 403:
              safeMessage.error('拒绝访问')
              break
            case 404:
              safeMessage.error('请求资源不存在')
              break
            case 500:
              safeMessage.error('服务器内部错误')
              break
            default:
              safeMessage.error(`连接错误: ${error.message}`)
          }
        } else if (error.request) {
          safeMessage.error('网络连接异常')
        } else {
          safeMessage.error(error.message || '请求失败')
        }

        return Promise.reject(error)
      },
    )
  }

  get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, { params, ...config })
  }

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  delete<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, { params, ...config })
  }

  upload<T = any>(url: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  download(url: string, filename: string, params?: any) {
    return this.instance
      .get(url, {
        params,
        responseType: 'blob',
      })
      .then((response: any) => {
        const blob = new Blob([response])
        const link = document.createElement('a')
        const objectUrl = URL.createObjectURL(blob)
        link.href = objectUrl
        link.download = filename
        link.click()
        URL.revokeObjectURL(objectUrl)
      })
  }
}

export const request = new Request()
