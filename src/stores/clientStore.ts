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
  netAllowedUntil: string | null
  netControlEnabled: boolean
  netPeriodEnabled: boolean
  usbControlEnabled: boolean
  disableTaskManager: boolean
  disableSystemSettings: boolean
  disableControlPanel: boolean
}
export interface clientSettingsRequest {
  netControlEnabled: boolean
  netPeriodEnabled: boolean
  usbControlEnabled: boolean
  disableTaskManager: boolean
  disableSystemSettings: boolean
  disableControlPanel: boolean
}
export interface clientNetAllowedUntilResponse {
  netAllowedUntil: string
}
export interface clientUDisk {
  volName: string
  usbId: string
  allowed: boolean
}
export interface clientWhiteListItem {
  id: number
  appName: string
}
export const useClientStore = defineStore('client', () => {
  // State
  const currentClientUuid = ref<string | null>(null)
  const currentClientInfo = ref<clientInfo | null>(null)
  const currentClientSettings = ref<clientSettings | string | null>(null)
  const currentClientWhiteList = ref<clientWhiteListItem[] | null>(null)
  const currentUDiskList = ref<clientUDisk[] | null>(null)
  const currentDNSUrl = ref<string | null>(null)
  // Getters
  const getCurrentClientUUID = computed(() => currentClientUuid.value)
  const getCurrentClientInfo = computed(() => currentClientInfo.value)
  const getCurrentClientSettings = computed(() => currentClientSettings.value)
  const getCurrentClientWhiteList = computed(() => currentClientWhiteList.value)
  const getCurrentUDiskList = computed(() => currentUDiskList.value)
  const getCurrentDNSUrl = computed(() => currentDNSUrl.value)
  // Actions
  const fetchClients = async (): Promise<clientInfo[]> => {
    const data = clientApi.getClients()
    return data
  }
  const fetchClientByUUID = async () => {
    if (currentClientUuid.value !== null) {
      const client = await clientApi.getClient(currentClientUuid.value)
      if (client) {
        currentClientInfo.value = client
      }
    } else {
      console.error('currentClientUuid is null, cannot fetch client')
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
        currentClientSettings.value = 'error'
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
    if (currentClientUuid.value !== null) {
      try {
        const udiskList = await clientApi.getUDiskList(currentClientUuid.value)
        if (udiskList) {
          currentUDiskList.value = udiskList
        }
      } catch (e) {
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
      try {
        await clientApi.allowUDisk(currentClientUuid.value, usbId)
        changeUDiskAllowed(usbId, true)
      } catch (e) {
        console.error('error allowing udisk', e)
      }
    }
  }
  const denyUDisk = async (usbId: string) => {
    if (currentClientUuid.value !== null) {
      try {
        await clientApi.denyUDisk(currentClientUuid.value, usbId)
        changeUDiskAllowed(usbId, false)
      } catch (e) {
        console.error('error denying udisk', e)
      }
    }
  }
  const fetchDNSUrl = async () => {
    // TODO: implement
  }

  const setCurrentClient = async (uuid: string) => {
    if (currentClientUuid.value === uuid) {
      return
    }
    currentClientUuid.value = uuid
    currentClientInfo.value = null
    currentClientSettings.value = null
    currentClientWhiteList.value = null
    currentUDiskList.value = null
    currentDNSUrl.value = null
    fetchClientByUUID()
    // fetchClientSettings()
  }

  return {
    // State
    currentClientUuid,
    currentClientInfo,
    currentClientSettings,
    currentClientWhiteList,
    currentUDiskList,
    currentDNSUrl,
    // Getters
    getCurrentClientUUID,
    getCurrentClientInfo,
    getCurrentClientSettings,
    getCurrentClientWhiteList,
    getCurrentUDiskList,
    getCurrentDNSUrl,
    // Actions
    setCurrentClient,
    fetchClients,
    fetchClientByUUID,
    fetchClientSettings,
    updateClientSettings,
    updateClientNetAllowedUntil,
    clearClientNetAllowedUntil,
    fetchClientWhiteList,
    addAppToWhiteList,
    removeAppFromWhiteList,
    fetchUDiskList,
    allowUDisk,
    denyUDisk,
    fetchDNSUrl,
  }
})
