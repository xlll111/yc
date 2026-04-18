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
  online: boolean
}
export interface clientsResponse {
  data: clientInfo[]
}
export const useClientStore = defineStore('client', () => {
  // Actions
  const getClients = async () => {
    const data = clientApi.getClients()
    return data
  }
  return {
    getClients,
  }
})
