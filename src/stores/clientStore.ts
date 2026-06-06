import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clientApi } from '@/api/clients'

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
type AsyncStateType = 'uuid' | 'object' | 'list' | 'listLoadingAsNull'

function defineAsyncState(ref: any, type: AsyncStateType) {
  const errorCheck = {
    uuid: (v: any) => v?.uuid === 'error',
    object: (v: any) => v?.id === -1,
    list: (v: any) => v?.[0]?.id === -1,
    listLoadingAsNull: (v: any) => v?.[0]?.id === -1,
  }[type]

  const loadedCheck = (v: any) => v !== null

  const daufaultValue = {
    uuid: null,
    object: {},
    list: [],
    listLoadingAsNull: [{ id: -1, uuid: 'error', time: 'error' }],
  }[type]

  return {
    data: computed(() =>
      loadedCheck(ref.value) && !errorCheck(ref.value) ? ref.value : daufaultValue,
    ),
    loaded: computed(() => loadedCheck(ref.value)),
    error: computed(() => errorCheck(ref.value)),
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
  const currentDNSUrl = ref<string | null>(null)
  // Getters
  const getCurrentClientUUID = computed(() => currentClientUuid.value)
  const getCurrentClientInfo = defineAsyncState(currentClientInfo, 'uuid')
  const getCurrentClientSettings = defineAsyncState(currentClientSettings, 'object')
  const getCurrentClientRecords = defineAsyncState(currentClientRecords, 'list')
  const getCurrentClientWhiteList = defineAsyncState(currentClientWhiteList, 'list')
  const getCurrentUDiskList = defineAsyncState(currentUDiskList, 'list')
  const getCurrentUDiskRecords = defineAsyncState(currentUDiskRecords, 'list')
  const getCurrentDNSUrl = computed(() => currentDNSUrl.value)
  // Actions
  const fetchClients = async (): Promise<clientInfo[]> => {
    const data = clientApi.getClients()
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
  const fetchDNSUrl = async () => {
    // TODO: implement
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
    currentDNSUrl.value = null
    getAllClientInfo()
    // fetchClientSettings()
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
    currentDNSUrl,
    // Getters
    getCurrentClientUUID,
    getCurrentClientInfo,
    getCurrentClientSettings,
    getCurrentClientRecords,
    getCurrentClientWhiteList,
    getCurrentUDiskList,
    getCurrentUDiskRecords,
    getCurrentDNSUrl,
    // Actions
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
    fetchDNSUrl,
  }
})
