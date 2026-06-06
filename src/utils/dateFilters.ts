// src/utils/dateFilters.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const formatDateTime = (
  isoString: string | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss',
) => {
  if (!isoString) return '--'
  return dayjs(isoString).tz('Asia/Shanghai').format(format)
}

export const isoToTimestamp = (isoString: string) => {
  if (!isoString) return null
  const timestamp = new Date(isoString).getTime()
  return isNaN(timestamp) ? null : timestamp
}

export const utcToLocalDate = (utcDate: Date): Date | null => {
  if (!utcDate || isNaN(utcDate.getTime())) {
    return null
  }
  return dayjs(utcDate).tz('Asia/Shanghai').toDate()
}
