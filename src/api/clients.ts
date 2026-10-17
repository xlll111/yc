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
  AppQueryResponse,
  AppQueryResultResponse,
  AppLaunchRequest,
  AppLaunchResponse,
  AppKillRequest,
  AppKillResponse,
  KeyEvent,
  KeyEventsResponse
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
  getWeeklyClientReport(
    uuid: string,
    weekNum: number,
    token: string,
    signal?: AbortSignal,
  ): Promise<any> {
    return request.get('/clients/get_weekly_client_report', null, {
      params: { uuid, weekNum },
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  },
  getQuickCommands(): Promise<any> {
    return request.authget('/clients/get_quick_commands')
  },
  executeQuickCommand(uuid: string, commandId: string): Promise<any> {
    return request.authpost(`/clients/command/${commandId}/execute`, null, { params: { uuid } })
  },
  cancelQuickCommand(uuid: string, commandId: string): Promise<any> {
    return request.authpost(`/clients/command/${commandId}/cancel`, null, { params: { uuid } })
  },

  // 实时操控
  requestAppList(uuid: string, type: string): Promise<AppQueryResponse> {
    return request.authpost(`/clients/app/query`, { type }, { params: { uuid } })
  },
  pollAppListResult(uuid: string, requestId: string): Promise<AppQueryResultResponse> {
    return request.authget(`/clients/app/query/result`, { uuid, requestId })
  },
  launchApp(uuid: string, app: AppLaunchRequest): Promise<AppLaunchResponse> {
    return request.authpost(`/clients/app/launch`, { app }, { params: { uuid } })
  },
  killApp(uuid: string, app: AppKillRequest): Promise<AppKillResponse> {
    return request.authpost(`/clients/app/kill`, { app }, { params: { uuid } })
  },
  sendKeyEvents(uuid: string, events: KeyEvent[]): Promise<KeyEventsResponse> {
    return request.authpost(`/clients/key/events`, { events }, { params: { uuid } })
  },

}
