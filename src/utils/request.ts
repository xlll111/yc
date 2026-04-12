// utils/request.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus' // 可选，用于消息提示
import 'element-plus/es/components/message/style/css'
// 响应数据统一格式
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

// 请求配置
interface RequestConfig extends AxiosRequestConfig {
  headers?: Record<string, string> // 请求头
  showLoading?: boolean // 是否显示loading
  showError?: boolean // 是否显示错误提示
}

// 创建 axios 实例
class Request {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  // 设置拦截器
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加 token
        const userStore = useUserStore()
        const token = userStore.getToken

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加时间戳防止缓存（可选）
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
        const { data, config } = response
        console.log('Response data:', response.data)
        // console.log('data:', data)
        // console.log('Response status:', response.status)
        // console.log('Response config:', config)

        // 根据业务状态码处理
        if (data.code === 200 || data.code === 0) {
          return data.data // 直接返回业务数据
        } else if (data.code === 401) {
          // token 过期或未登录
          const userStore = useUserStore()
          userStore.logout()
          return Promise.reject(new Error(data.message))
        } else if (data.code === 403) {
          ElMessage.error('没有权限访问')
          return Promise.reject(new Error(data.message))
        } else {
          // 其他错误
          ElMessage.error(data.message || '请求失败')
          return Promise.reject(new Error(data.message))
        }
      },
      (error: { response: { status: any }; message: any; request: any }) => {
        console.log('Response error:', error)
        ElMessage.error('Response error:', error.message)
        // HTTP 状态码错误处理
        if (error.response) {
          console.log('Response status:', error.response.status)
          const { status } = error.response
          ElMessage.error(`HTTP状态码错误: ${status}`)
          switch (status) {
            case 400:
              ElMessage.error('请求参数错误')
              break
            case 401:
              ElMessage.error('登录已过期，请重新登录')
              const userStore = useUserStore()
              userStore.logout()
              window.location.href = '/login'
              break
            case 403:
              ElMessage.error('拒绝访问')
              break
            case 404:
              ElMessage.error('请求资源不存在')
              break
            case 500:
              ElMessage.error('服务器内部错误')
              break
            default:
              ElMessage.error(`连接错误: ${error.message}`)
          }
        } else if (error.request) {
          ElMessage.error('网络连接异常')
          ElMessage.error(error.message)
        } else {
          ElMessage.error(error.message || '请求失败')
        }

        return Promise.reject(error)
      },
    )
  }

  // 封装 GET 请求
  get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, { params, ...config })
  }

  // 封装 POST 请求
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  // 封装 PUT 请求
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  // 封装 DELETE 请求
  delete<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, { params, ...config })
  }

  // 文件上传
  upload<T = any>(url: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  // 文件下载
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

// 导出单例
export const request = new Request()
