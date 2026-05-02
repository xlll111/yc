import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)
const app = createApp(App)
const filters = {
  formatDateTime: (isoString: string, format: string = 'YYYY-MM-DD HH:mm:ss') => {
    if (!isoString) return '--'
    return dayjs(isoString).tz('Asia/Shanghai').format(format)
  },

  isoToTimestamp: (isoString: string) => {
    if (!isoString) return null
    const timestamp = new Date(isoString).getTime()
    return isNaN(timestamp) ? null : timestamp
  },
  utcToLocalDate: (utcDate: Date): Date | null => {
    if (!utcDate || !(utcDate instanceof Date) || isNaN(utcDate.getTime())) {
      return null
    }
    // 方法1：使用 dayjs
    return dayjs(utcDate).tz('Asia/Shanghai').toDate()

    // 方法2：原生 JavaScript（备选方案）
    // const offset = new Date().getTimezoneOffset() * 60000
    // return new Date(utcDate.getTime() - offset)
  },
}

app.provide('$filters', filters)
app.use(createPinia())
app.use(router)
app.mount('#app')
