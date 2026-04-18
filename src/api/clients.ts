//api/clients.ts
import { request } from '@/utils/request'
import type { clientInfo, clientsResponse } from '@/stores/clientStore'

export const clientApi = {
  getClients(): Promise<clientsResponse[]> {
    return request.authget('/clients/get_clients')
  },
}
