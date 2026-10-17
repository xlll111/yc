import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clientApi } from '@/api/clients'
import { fileApi } from '@/api/flie'
import { formatDateTime, isoToTimestamp, utcToLocalDate } from '@/utils/dateFilters'
import { defineAsyncState } from './AsyncState'

export interface clientInfo {
  uuid: string
  ipAddress?: string
  hostname?: string
  osInfo?: string
  lastSeen?: string
  note?: string
  version?: string
}
export interface clientSettings {
  id?: number
  netAllowedUntil: string | null
  netControlEnabled: boolean
  netPeriodEnabled: boolean
  usbControlEnabled: boolean
  disableTaskManager: boolean
  disableSystemSettings: boolean
  disableControlPanel: boolean
}
export interface clientRecord {
  id: number
  uuid: string
  time: string
}
export interface clientSettingsRequest {
  netControlEnabled: boolean
  netPeriodEnabled: boolean
  usbControlEnabled: boolean
  disableTaskManager: boolean
  disableSystemSettings: boolean
  disableControlPanel: boolean
}
export interface clientUDisk {
  id: number
  volName: string
  usbId: string
  allowed: boolean
  lastTime: string
}
export interface clientUDiskRecord {
  id: number
  uuid: string
  usbId: string
  time: string
  volName: string
}
export interface clientWhiteListItem {
  id: number
  appName: string
}
export interface clientDnsUrlRecord {
  id: number
  url: string
  time: string
  detection: boolean
}
export interface clientDnsUrlRecordRequest {
  startTime: string
  endTime: string
  page: number
  pageSize: number
}


/** ---------- 应用列表查询 ---------- */
export type AppQueryType = 'launchable' | 'running'
export type AppQueryStatus = 'pending' | 'ready' | 'failed'

export interface AppQueryResponse {
  /** 异步查询任务 ID */
  requestId: string
  /** 毫秒时间戳，过期后轮询返回 failed */
  expiresAt: string
}

export interface AppInfo {
  /** 客户端侧唯一标识 */
  appId?: string
  /** 展示名 */
  name: string
  /** 可执行路径，launchable 必给 */
  execPath?: string
  /** base64 data URL 或可访问 URL */
  icon?: string
  /** 仅 running 状态给出 */
  pid?: number
}

export interface AppQueryResultResponse {
  requestId: string
  status: AppQueryStatus
  /** status === 'ready' 时必填，可为空数组 */
  apps: AppInfo[]
  /** status === 'failed' 时的原因 */
  message?: string
  updatedAt: string
}

/** ---------- 启动 / 关闭应用 ---------- */
export interface AppLaunchRequest {
  appId: string
  execPath?: string
  name?: string
}

export interface AppLaunchResponse {
  /** true = 已成功推送到客户端连接 */
  accepted: boolean
  /** 指令 ID，用于服务端日志追溯 */
  commandId: string
}

export interface AppKillRequest {
  /** 与 pid 至少给一个，服务端优先使用 pid */
  appId?: string
  pid?: number
  name?: string
}

export type AppKillResponse = AppLaunchResponse

/** ---------- 键盘键击 ---------- */
export type KeyAction = 'down' | 'up'
export type ModifierName = 'Control' | 'Shift' | 'Alt' | 'Meta'

export interface KeyEvent {
  action: KeyAction
  /** KeyboardEvent.key，如 "Control" | "a" | "Enter" | " " */
  key: string
  /** KeyboardEvent.code，如 "ControlLeft" | "KeyA" | "Space" */
  code: string
  /** 兼容老式 API，如 65 / 17 / 13 */
  keyCode: number
  /** 该事件发生时的修饰键快照 */
  modifiers: ModifierName[]
}
export interface KeyEventsResponse {
  accepted: boolean
  commandId: string
  /** 实际接收并转发的事件条数 */
  count: number
}

/** 单次键击事件上限，与服务端保持一致 */
export const KEY_EVENTS_MAX = 64

/** ---------- 业务错误 ---------- */
export class ClientApiError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.name = 'ClientApiError'
    this.code = code
  }
}
export const useClientStore = defineStore('client', () => {
  // State
  const currentClientUuid = ref<string | null>(null)
  const currentClientInfo = ref<clientInfo | null>(null)
  const currentClientSettings = ref<clientSettings | null>(null)
  const currentClientRecords = ref<clientRecord[] | null>(null)
  const currentClientWhiteList = ref<clientWhiteListItem[] | null>(null)
  const currentUDiskList = ref<clientUDisk[] | null>(null)
  const currentUDiskRecords = ref<clientUDiskRecord[] | null>(null)
  const currentDNSUrlRecords = ref<Record<string, clientDnsUrlRecord[]>>({})
  // Getters
  const getCurrentClientUUID = computed(() => currentClientUuid.value)
  const getCurrentClientInfo = defineAsyncState(currentClientInfo, 'uuid')
  const getCurrentClientSettings = defineAsyncState(currentClientSettings, 'object')
  const getCurrentClientRecords = defineAsyncState(currentClientRecords, 'list')
  const getCurrentClientWhiteList = defineAsyncState(currentClientWhiteList, 'list')
  const getCurrentUDiskList = defineAsyncState(currentUDiskList, 'list')
  const getCurrentUDiskRecords = defineAsyncState(currentUDiskRecords, 'list')
  const getCurrentDNSUrlRecords = computed(() => currentDNSUrlRecords.value)
  // Actions
  const currentClientOnline = () => {
    if (!currentClientUuid.value) return false
    if (getCurrentClientInfo.error.value) return false
    const lastSeen = getCurrentClientInfo.data.value.lastSeen
    const diff = Date.now() - new Date(lastSeen).getTime()
    return Math.abs(diff) < 120000
  }
  const fetchClients = async (): Promise<clientInfo[]> => {
    const data = await clientApi.getClients()
    // console.log('fetching clients', data)
    return data
  }
  const fetchClientByUUID = async () => {
    currentClientInfo.value = null
    if (currentClientUuid.value !== null) {
      try {
        const client = await clientApi.getClient(currentClientUuid.value)
        if (client) {
          currentClientInfo.value = client
        }
      } catch (e) {
        currentClientInfo.value = { uuid: 'error' }
        console.error('error fetching client', e)
      }
    } else {
      console.error('currentClientUuid is null, cannot fetch client')
    }
  }
  const updateClientNote = async (note: string) => {
    if (currentClientUuid.value !== null) {
      await clientApi.updateClientNote(currentClientUuid.value, note)
      fetchClientByUUID()
    }
  }
  const fetchClientSettings = async () => {
    currentClientSettings.value = null
    if (currentClientUuid.value !== null) {
      try {
        const settings = await clientApi.getClientSettings(currentClientUuid.value)
        // console.log('client settings', settings)
        if (settings) {
          currentClientSettings.value = settings
        }
      } catch (e) {
        console.error('error fetching client settings', e)
        currentClientSettings.value = {
          id: -1,
          netAllowedUntil: null,
          netControlEnabled: false,
          netPeriodEnabled: false,
          usbControlEnabled: false,
          disableTaskManager: false,
          disableSystemSettings: false,
          disableControlPanel: false,
        }
      }
    } else {
      console.error('currentClientUuid is null, cannot fetch settings')
    }
  }
  const updateClientSettings = async (data: clientSettingsRequest) => {
    if (currentClientUuid.value !== null) {
      try {
        await clientApi.updateClientSettings(currentClientUuid.value, data)
        fetchClientSettings()
      } catch (e) {
        console.error('error updating client settings', e)
      }
    }
  }
  const fetchClientRecords = async () => {
    currentClientRecords.value = null
    if (currentClientUuid.value !== null) {
      try {
        const records: clientRecord[] = await clientApi.getClientRecords(currentClientUuid.value)
        if (records) {
          currentClientRecords.value = records
        }
      } catch (e) {
        console.error('error fetching client records', e)
        currentClientRecords.value = [{ id: -1, uuid: 'error', time: 'error' }]
      }
    }
  }

  const updateClientNetAllowedUntil = async (netAllowedUntil: string) => {
    if (currentClientUuid.value !== null) {
      let newData = await clientApi.updateClientNetAllowedUntil(
        currentClientUuid.value,
        netAllowedUntil,
      )
      if (
        newData &&
        currentClientSettings.value &&
        typeof currentClientSettings.value === 'object'
      ) {
        if (newData === 'None') currentClientSettings.value.netAllowedUntil = null
        else currentClientSettings.value.netAllowedUntil = newData
      }
    }
  }
  const clearClientNetAllowedUntil = async () => {
    await updateClientNetAllowedUntil('')
  }
  const fetchClientWhiteList = async () => {
    currentClientWhiteList.value = null
    if (currentClientUuid.value !== null) {
      try {
        const whiteList: clientWhiteListItem[] = await clientApi.getClientWhiteList(
          currentClientUuid.value,
        )
        if (whiteList) {
          currentClientWhiteList.value = whiteList
        }
      } catch (e) {
        console.error('error fetching client white list', e)
        currentClientWhiteList.value = [{ id: -1, appName: 'error' }]
      }
    } else {
      console.error('currentClientUuid is null, cannot fetch white list')
    }
  }
  const addAppToWhiteList = async (appName: string) => {
    if (currentClientUuid.value !== null) {
      try {
        await clientApi.addAppToWhiteList(currentClientUuid.value, appName)
        fetchClientWhiteList()
      } catch (e) {
        console.error('error adding app to white list', e)
      }
    }
  }
  const removeAppFromWhiteList = async (appName: string) => {
    if (currentClientUuid.value !== null) {
      try {
        await clientApi.removeAppFromWhiteList(currentClientUuid.value, appName)
        fetchClientWhiteList()
      } catch (e) {
        console.error('error removing app from white list', e)
      }
    }
  }
  const fetchUDiskList = async () => {
    currentUDiskList.value = null
    if (currentClientUuid.value !== null) {
      try {
        const udiskList = await clientApi.getUDiskList(currentClientUuid.value)
        // console.log('udisk list', udiskList) // Debugging statement
        if (udiskList) {
          currentUDiskList.value = udiskList
        }
      } catch (e) {
        currentUDiskList.value = [
          { id: -1, volName: 'error', usbId: 'error', allowed: false, lastTime: 'error' },
        ]
        console.error('error fetching udisk list', e)
      }
    }
  }
  const changeUDiskAllowed = async (usbId: string, allowed: boolean) => {
    if (currentUDiskList.value) {
      for (const udisk of currentUDiskList.value) {
        if (udisk.usbId === usbId) {
          udisk.allowed = allowed
          break
        }
      }
    }
  }
  const allowUDisk = async (usbId: string) => {
    if (currentClientUuid.value !== null) {
      await clientApi.allowUDisk(currentClientUuid.value, usbId)
      changeUDiskAllowed(usbId, true)
    }
  }
  const denyUDisk = async (usbId: string) => {
    if (currentClientUuid.value !== null) {
      await clientApi.denyUDisk(currentClientUuid.value, usbId)
      changeUDiskAllowed(usbId, false)
    }
  }
  const fetchUDiskRecords = async () => {
    currentUDiskRecords.value = null
    if (currentClientUuid.value !== null) {
      try {
        const records: clientUDiskRecord[] = await clientApi.getUDiskRecords(
          currentClientUuid.value,
        )
        if (records) {
          currentUDiskRecords.value = records
        }
      } catch (e) {
        console.error('error fetching udisk records', e)
        currentUDiskRecords.value = [
          { id: -1, uuid: 'error', usbId: 'error', time: 'error', volName: 'error' },
        ]
      }
    }
  }
  const fetchDNSUrlRecords = async (
    time: Date | [Date, Date],
    page: number = 1,
    pageSize: number = 100,
  ) => {
    if (currentClientUuid.value === null) currentDNSUrlRecords.value = {}
    else if (Array.isArray(time)) {
      // const startTime = time[0].toISOString()
      // const endTime = time[1].toISOString()
      // const startDay = time[0].toLocaleDateString('en-CA')
      // const endDay = time[1].toLocaleDateString('en-CA')
      // const startDate = new Date(startDay)
      // const endDate = new Date(endDay)
      // const currentDate = new Date(startDate)
      // while (currentDate <= endDate) {
      //   const dateKey = currentDate.toISOString().split('T')[0]!
      //   currentDNSUrlRecords.value[dateKey] = null
      //   currentDate.setDate(currentDate.getDate() + 1)
      // }
      // try {
      //   currentDNSUrlRecords.value = {}
      //   const records = await clientApi.getDNSUrlRecords(
      //     currentClientUuid.value,
      //     startTime,
      //     endTime,
      //   )
      //   if (records) {
      //     currentDNSUrlRecords.value = records
      //   }
      // } catch (e) {
      //   console.error('error fetching dns url records', e)
      // }
    } else {
      const isoTime = time.toISOString()
      const day = time.toLocaleDateString('en-CA')
      try {
        // currentDNSUrlRecords.value[day] = null
        if (!currentDNSUrlRecords.value[day] || !Array.isArray(currentDNSUrlRecords.value[day]))
          currentDNSUrlRecords.value[day] = []
        const records = await clientApi.getDNSUrlRecords(
          currentClientUuid.value,
          isoTime,
          isoTime,
          page,
          pageSize,
        )
        if (records) {
          currentDNSUrlRecords.value[day].push(...records)
        }
      } catch (e) {
        console.error('error fetching dns url records', e)
        currentDNSUrlRecords.value[day] = [
          { id: -1, url: 'error', time: 'error', detection: false },
        ]
      }
    }
  }
  const fetchScreenshots = async (time: Date) => {
    const formatTime = formatDateTime(time, 'YYYY-MM-DD HH:mm:ss')
    if (currentClientUuid.value !== null) {
      try {
        return await fileApi.getScreenshots(currentClientUuid.value, formatTime)
      } catch (e) {
        console.error('error fetching screenshots', e)
      }
    }
  }
  const getAllClientInfo = () => {
    fetchClientByUUID()
    fetchClientSettings()
    fetchClientRecords()
    fetchUDiskRecords()
  }
  const setCurrentClient = async (uuid: string) => {
    if (currentClientUuid.value === uuid) {
      return
    }
    currentClientUuid.value = uuid
    currentClientInfo.value = null
    currentClientSettings.value = null
    currentClientRecords.value = null
    currentClientWhiteList.value = null
    currentUDiskList.value = null
    currentUDiskRecords.value = null
    currentDNSUrlRecords.value = {}
    getAllClientInfo()
    // fetchClientSettings()
  }



  // 快捷指令
  const fetchQuickCommands = async () => {
    if (!currentClientUuid.value) {
      return
    }
    const data = await clientApi.getQuickCommands()
    return data
  }
  const executeQuickCommand = async (commandId: string) => {
    if (!currentClientUuid.value) {
      return
    }
    await clientApi.executeQuickCommand(currentClientUuid.value, commandId)
  }
  const cancelQuickCommand = async (commandId: string) => {
    if (!currentClientUuid.value) {
      return
    }
    await clientApi.cancelQuickCommand(currentClientUuid.value, commandId)
  }


  /* -------------------- 1. 请求应用列表 -------------------- */
  /**
   * 通知服务端向客户端下发查询指令，返回一次查询任务 ID。
   * 调用后需使用 pollAppListResult 轮询直至 status 非 pending。
   * @throws ClientApiError 参数缺失 / 服务端拒绝 / 客户端离线
   */
  async function requestAppList(
    type: AppQueryType
  ): Promise<AppQueryResponse> {
    if (currentClientUuid.value === null) throw new ClientApiError(40001, '缺少 clientUUId')
    if (type !== 'launchable' && type !== 'running') {
      throw new ClientApiError(40001, 'type 非法')
    }
    return clientApi.requestAppList(currentClientUuid.value, type) // 请求应用列表
  }

  /* -------------------- 2. 轮询查询结果 -------------------- */
  /**
   * 按 requestId 查询异步任务结果，幂等，可重复调用直至 status 非 pending。
   * @throws ClientApiError requestId 失效 / 服务端异常
   */
  async function pollAppListResult(
    requestId: string
  ): Promise<AppQueryResultResponse> {
    if (currentClientUuid.value === null) throw new ClientApiError(40001, '缺少 clientUUId')
    return clientApi.pollAppListResult(currentClientUuid.value, requestId) // 轮询查询结果
  }

  /* -------------------- 3. 启动应用 -------------------- */
  /**
   * 下发启动指令，服务端推送到客户端连接后立即返回，不等待执行结果。
   * @throws ClientApiError 参数缺失 / 客户端离线 / 服务端异常
   */
  async function launchApp(
    payload: AppLaunchRequest
  ): Promise<AppLaunchResponse> {
    if (currentClientUuid.value === null) throw new ClientApiError(40001, '缺少 clientUUId')
    if (!payload.appId) throw new ClientApiError(40001, '缺少 appId')
    return clientApi.launchApp(currentClientUuid.value, payload) // 启动应用
  }

  /* -------------------- 4. 关闭应用 -------------------- */
  /**
   * 下发关闭指令，服务端推送到客户端连接后立即返回，不等待执行结果。
   * @throws ClientApiError 参数缺失 / 客户端离线 / 目标进程不存在
   */
  async function killApp(payload: AppKillRequest): Promise<AppKillResponse> {
    const { appId, pid } = payload
    if (currentClientUuid.value === null) throw new ClientApiError(40001, '缺少 clientUUId')
    if (!appId && pid == null) {
      throw new ClientApiError(40001, '缺少 appId 或 pid')
    }
    return clientApi.killApp(currentClientUuid.value, payload) // 关闭应用
  }

  /* -------------------- 5. 发送键击事件 -------------------- */
  /**
   * 批量下发有序键击事件（含修饰键 down/up），服务端按数组顺序转发给客户端。
   * 失败抛错，成功返回服务端确认的转发条数。
   * @throws ClientApiError 参数缺失 / events 为空或超限 / 客户端离线 / 限速
   */
  async function sendKeyEvents(
    events: KeyEvent[],
  ): Promise<KeyEventsResponse> {
    if (currentClientUuid.value === null) throw new ClientApiError(40001, '缺少 clientUUId')
    if (!Array.isArray(events) || events.length === 0) {
      throw new ClientApiError(40001, 'events 不能为空')
    }
    if (events.length > KEY_EVENTS_MAX) {
      throw new ClientApiError(
        40001,
        `单次键击事件不能超过 ${KEY_EVENTS_MAX} 条`
      )
    }
    return clientApi.sendKeyEvents(currentClientUuid.value, events) // 发送键击事件
  }

  return {
    // State
    currentClientUuid,
    currentClientInfo,
    currentClientSettings,
    currentClientRecords,
    currentClientWhiteList,
    currentUDiskList,
    currentUDiskRecords,
    currentDNSUrlRecords,
    // Getters
    getCurrentClientUUID,
    getCurrentClientInfo,
    getCurrentClientSettings,
    getCurrentClientRecords,
    getCurrentClientWhiteList,
    getCurrentUDiskList,
    getCurrentUDiskRecords,
    getCurrentDNSUrlRecords,
    // Actions
    currentClientOnline,
    setCurrentClient,
    fetchClients,
    fetchClientByUUID,
    updateClientNote,
    fetchClientSettings,
    updateClientSettings,
    fetchClientRecords,
    updateClientNetAllowedUntil,
    clearClientNetAllowedUntil,
    fetchClientWhiteList,
    addAppToWhiteList,
    removeAppFromWhiteList,
    fetchUDiskList,
    allowUDisk,
    denyUDisk,
    fetchUDiskRecords,
    fetchDNSUrlRecords,
    fetchScreenshots,
    fetchQuickCommands,
    executeQuickCommand,
    cancelQuickCommand,
    // 实时操控
    requestAppList,
    pollAppListResult,
    launchApp,
    killApp,
    sendKeyEvents
  }
})
