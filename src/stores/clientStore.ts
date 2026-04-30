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
  netAllowedUntil: string
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
export const useClientStore = defineStore('client', () => {
  // State
  const currentClientUuid = ref<string | null>(null)
  const currentClientInfo = ref<clientInfo | null>(null)
  const CurrentClientSettings = ref<clientSettings | string | null>(null)
  // Getters
  const getCurrentClientUUID = computed(() => currentClientUuid.value)
  const getCurrentClientInfo = computed(() => currentClientInfo.value)
  const getCurrentClientSettings = computed(() => CurrentClientSettings.value)
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
    CurrentClientSettings.value = null
    if (currentClientUuid.value !== null) {
      try {
        const settings = await clientApi.getClientSettings(currentClientUuid.value)
        // console.log('client settings', settings)
        if (settings) {
          CurrentClientSettings.value = settings
        }
      } catch (e) {
        console.error('error fetching client settings', e)
        CurrentClientSettings.value = 'error'
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

  const setCurrentClient = async (uuid: string) => {
    if (currentClientUuid.value === uuid) {
      return
    }
    currentClientUuid.value = uuid
    currentClientInfo.value = null
    CurrentClientSettings.value = null
    fetchClientByUUID()
    // fetchClientSettings()
  }

  return {
    // State
    currentClientUuid,
    currentClientInfo,
    CurrentClientSettings,
    // Getters
    getCurrentClientUUID,
    getCurrentClientInfo,
    getCurrentClientSettings,
    // Actions
    setCurrentClient,
    fetchClients,
    fetchClientByUUID,
    fetchClientSettings,
    updateClientSettings,
  }
})
