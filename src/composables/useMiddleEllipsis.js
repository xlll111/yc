// composables/useMiddleEllipsis.js
import { ref, watch, onUnmounted } from 'vue'

const truncateMiddle = (str, maxLength = 20, headLen = 8, tailLen = 8) => {
  if (str.length <= maxLength) return str
  const head = str.slice(0, headLen)
  const tail = str.slice(-tailLen)
  return `${head}...${tail}`
}

export function useMiddleEllipsis(uuid, options = {}) {
  const { charWidth = 9, widthRatio = 0.6 } = options

  // 确保 uuid 是 ref
  const uuidRef = typeof uuid === 'string' ? ref(uuid) : uuid
  const displayUUID = ref(uuidRef.value)
  let resizeObserver = null
  let targetElement = null

  const updateDisplay = (el) => {
    if (!el || !uuidRef.value) return

    // 获取当前实际可用宽度
    const containerWidth =
      widthRatio * el.parentElement?.parentElement?.clientWidth || el.clientWidth

    const maxChars = Math.floor(containerWidth / charWidth)

    // 关键：如果可用字符数 >= UUID 长度，直接显示完整
    if (maxChars >= uuidRef.value.length) {
      displayUUID.value = uuidRef.value
      return
    }

    // 需要省略时计算前后保留长度
    const headLen = Math.floor(maxChars * 0.4)
    const tailLen = Math.floor(maxChars * 0.4 - 3)
    displayUUID.value = truncateMiddle(uuidRef.value, maxChars, headLen, tailLen)
  }

  const bindElement = (el) => {
    if (!el) return

    targetElement = el

    // 清理旧的 observer
    if (resizeObserver) {
      resizeObserver.disconnect()
    }

    // 创建 ResizeObserver
    resizeObserver = new ResizeObserver(() => {
      if (targetElement) {
        updateDisplay(targetElement)
      }
    })

    resizeObserver.observe(el.parentElement || el)
    updateDisplay(el)
  }

  // 监听 uuid 变化
  watch(uuidRef, (newUuid) => {
    if (targetElement && newUuid) {
      updateDisplay(targetElement)
    }
  })

  // 清理函数
  const cleanup = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    targetElement = null
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    displayUUID,
    bindElement,
    cleanup,
  }
}
