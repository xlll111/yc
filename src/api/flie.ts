//api/file.ts
import { request } from '@/utils/request1'
// import type {
//   clientInfo,
//   clientSettings,
//   clientSettingsRequest,
//   clientRecord,
//   clientUDisk,
//   clientUDiskRecord,
//   clientWhiteListItem,
//   clientDnsUrlRecord,
//   clientDnsUrlRecordRequest,
// } from '@/stores/clientStore'
export const fileApi = {
  getScreenshots(uuid: string, warn_time: string): Promise<Record<any, any>> {
    return request.get('/api/get_screenshots', null, { params: { uuid, warn_time } })
  },
}
