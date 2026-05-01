import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const filters = {
  formatDateTime: (isoString: string) => {
    if (!isoString) return '--'
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  },
  isoToTimestamp: (isoString: string) => {
    if (!isoString) return null
    const timestamp = new Date(isoString).getTime()
    return isNaN(timestamp) ? null : timestamp
  },
}

app.provide('$filters', filters)
app.use(createPinia())
app.use(router)
app.mount('#app')
