import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'
type AsyncStateType = 'uuid' | 'object' | 'list' | 'listLoadingAsNull'
export function defineAsyncState(ref: any, type: AsyncStateType) {
  const errorCheck = {
    uuid: (v: any) => v?.uuid === 'error',
    object: (v: any) => v?.id === -1,
    list: (v: any) => v?.[0]?.id === -1,
    listLoadingAsNull: (v: any) => v?.[0]?.id === -1,
  }[type]

  const loadedCheck = (v: any) => v !== null

  const daufaultValue = {
    uuid: null,
    object: {},
    list: [],
    listLoadingAsNull: [{ id: -1, uuid: 'error', time: 'error' }],
  }[type]

  return {
    data: computed(() =>
      loadedCheck(ref.value) && !errorCheck(ref.value) ? ref.value : daufaultValue,
    ),
    loaded: computed(() => loadedCheck(ref.value)),
    error: computed(() => errorCheck(ref.value)),
  }
}
