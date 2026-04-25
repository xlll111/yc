//api/clients.ts
import { request } from '@/utils/request'
import type { clientInfo, clientSettings, clientSettingsRequest } from '@/stores/clientStore'

export const clientApi = {
  getClients(): Promise<clientInfo[]> {
    return request.authget('/clients/get_clients')
  },
  getClient(uuid: string): Promise<clientInfo> {
    return request.authget('/clients/get_client', { uuid })
  },
  getClientSettings(uuid: string): Promise<clientSettings> {
    return request.authget('/clients/get_client_settings', { uuid })
  },
  updateClientSettings(uuid: string, data: clientSettingsRequest): Promise<void> {
    return request.authpost('/clients/update_client_settings', data, { params: { uuid } })
  },
}
