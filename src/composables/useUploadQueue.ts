// 上传队列 UI 侧薄封装：页面/面板通过它读写 store；秒传等优化只改内部
import { computed } from 'vue'
import { useCloudStore } from '@/stores/cloudStore'
import type { UploadTask } from '@/stores/cloudStore'

export function useUploadQueue() {
  const store = useCloudStore()
  const tasks = computed<UploadTask[]>(() => store.uploadQueue)

  return {
    tasks,
    visible: computed(() => store.uploadPanelVisible),
    enqueue: store.enqueueUpload,
    resume: store.resumeUpload,
    retry: store.retryUpload,
    cancel: store.cancelUpload,
    remove: store.removeUpload,
    // 组件卸载时停掉 status 轮询（分片请求本身继续）
    dispose: () => store.stopAllPolling(),
  }
}
