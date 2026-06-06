//api/clients.ts
import { request } from '@/utils/request'
import type {
  clientInfo,
  clientSettings,
  clientSettingsRequest,
  clientRecord,
  clientUDisk,
  clientUDiskRecord,
  clientWhiteListItem,
  clientDnsUrlRecord,
  clientDnsUrlRecordRequest,
} from '@/stores/clientStore'

export const clientApi = {
  getClients(): Promise<clientInfo[]> {
    return request.authget('/clients/get_clients')
  },
  getClient(uuid: string): Promise<clientInfo> {
    return request.authget('/clients/get_client', null, { params: { uuid } })
  },
  updateClientNote(uuid: string, note: string): Promise<void> {
    return request.authpost('/clients/update_client_note', { note }, { params: { uuid } })
  },
  getClientSettings(uuid: string): Promise<clientSettings> {
    return request.authget('/clients/get_client_settings', null, { params: { uuid } })
  },
  updateClientSettings(uuid: string, data: clientSettingsRequest): Promise<void> {
    return request.authpost('/clients/update_client_settings', data, { params: { uuid } })
  },
  getClientRecords(uuid: string): Promise<clientRecord[]> {
    return request.authget('/clients/get_client_record', null, { params: { uuid } })
  },
  updateClientNetAllowedUntil(uuid: string, netAllowedUntil: string): Promise<string> {
    return request.authpost(
      '/clients/update_client_net_allowed_until',
      { netAllowedUntil },
      { params: { uuid } },
    )
  },
  getClientWhiteList(uuid: string): Promise<clientWhiteListItem[]> {
    return request.authget('/clients/get_whitelist', null, { params: { uuid } })
  },
  addAppToWhiteList(uuid: string, app: string): Promise<void> {
    return request.authpost('/clients/add_app_to_whitelist', { app }, { params: { uuid } })
  },
  removeAppFromWhiteList(uuid: string, app: string): Promise<void> {
    return request.authpost('/clients/remove_app_from_whitelist', { app }, { params: { uuid } })
  },
  getUDiskList(uuid: string): Promise<clientUDisk[]> {
    return request.authget('/clients/get_udisk_list', null, { params: { uuid } })
  },
  allowUDisk(uuid: string, usbId: string): Promise<void> {
    return request.authpost('/clients/allow_udisk', { usbId }, { params: { uuid } })
  },
  denyUDisk(uuid: string, usbId: string): Promise<void> {
    return request.authpost('/clients/deny_udisk', { usbId }, { params: { uuid } })
  },
  getUDiskRecords(uuid: string): Promise<clientUDiskRecord[]> {
    return request.authget('/clients/get_udisk_record', null, { params: { uuid } })
  },
  getDNSUrlRecords(
    uuid: string,
    startTime: string,
    endTime: string,
    page: number,
    pageSize: number,
  ): Promise<clientDnsUrlRecord[]> {
    return request.authget('/clients/get_dns_url_records', null, {
      params: { uuid, startTime, endTime, page, pageSize },
    })
  },
}
