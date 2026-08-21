// useToast 组合式函数 —— 封装全局 $toast 为类型安全 API
// 学习重点: composable 返回类型化方法 + 不依赖 getCurrentInstance 也能用
import { getCurrentInstance } from 'vue'

type ToastType = 'success' | 'error' | 'info'

interface ToastApi {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

// 从全局属性取 $toast（由 main.ts 里 app.use 安装的 Toast 提供）
export function useToast(): ToastApi {
  const instance = getCurrentInstance()
  const proxy = instance?.proxy as any
  const t = (type: ToastType, msg: string) => proxy?.$toast?.[type]?.(msg)
  return {
    success: (m) => t('success', m),
    error: (m) => t('error', m),
    info: (m) => t('info', m),
  }
}
