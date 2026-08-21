// Vitest setup —— 提供完整 localStorage mock（jsdom 4.x 的 localStorage 是空 stub）
// 学习重点:
//   1. jsdom 新版本 localStorage 可能不完整 → 需显式 mock
//   2. setupFiles 在测试文件加载前执行，适合安装全局 mock
function createLocalStorageMock() {
  let store = new Map<string, string>()
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size },
  } as Storage
}

const mock = createLocalStorageMock()

Object.defineProperty(globalThis, 'localStorage', {
  value: mock,
  writable: true,
  configurable: true,
})

// 每个测试前清空，保证隔离
import { beforeEach } from 'vitest'
beforeEach(() => {
  mock.clear()
})
