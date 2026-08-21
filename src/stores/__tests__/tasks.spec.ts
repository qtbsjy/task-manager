// tasks store 单元测试 —— Pinia + localStorage 持久化 + 派生计算
// 学习重点:
//   1. setActivePinia 隔离每个测试的 store 状态
//   2. mock localStorage（jsdom 提供，但需清理）
//   3. 验证 addTask/updateTask/removeTask/setStatus + 派生列
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../tasks'
import type { TaskInput } from '../../types/task'

const input: TaskInput = { title: '写周报', desc: '本周进展', priority: 'high', status: 'todo', estimate: 2 }

describe('tasks store', () => {
  let store: ReturnType<typeof useTasksStore>

  beforeEach(() => {
    localStorage.clear() // 清空持久化
    setActivePinia(createPinia())
    store = useTasksStore()
  })

  it('初始为空', () => {
    expect(store.total).toBe(0)
    expect(store.progress).toBe(0)
    expect(store.tasks).toHaveLength(0)
  })

  it('addTask 生成 id/createdAt 并持久化', () => {
    const t = store.addTask(input)
    expect(t.id).toBeTruthy()
    expect(t.createdAt).toBeGreaterThan(0)
    expect(store.total).toBe(1)
    // 持久化到 localStorage
    const saved = JSON.parse(localStorage.getItem('task-manager.tasks')!)
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toBe('写周报')
  })

  it('updateTask 合并 patch 且保留 id/createdAt', () => {
    const t = store.addTask(input)
    const originalCreated = t.createdAt
    store.updateTask(t.id, { priority: 'low', title: '改标题' })
    const updated = store.findById(t.id)!
    expect(updated.title).toBe('改标题')
    expect(updated.priority).toBe('low')
    expect(updated.id).toBe(t.id)
    expect(updated.createdAt).toBe(originalCreated)
    expect(updated.desc).toBe('本周进展') // 未改字段保留
  })

  it('removeTask 删除并持久化', () => {
    store.addTask(input)
    store.addTask({ ...input, title: '第二件' })
    const second = store.findById(store.tasks[1].id)!
    store.removeTask(second.id)
    expect(store.total).toBe(1)
    expect(store.tasks[0].title).toBe('写周报')
    expect(JSON.parse(localStorage.getItem('task-manager.tasks')!)).toHaveLength(1)
  })

  it('setStatus 状态流转', () => {
    const t = store.addTask(input)
    store.setStatus(t.id, 'done')
    expect(store.doneCount).toBe(1)
    expect(store.findById(t.id)!.status).toBe('done')
  })

  it('progress = 完成数 / 总数', () => {
    store.addTask({ ...input, status: 'todo' })
    store.addTask({ ...input, title: 'x', status: 'done' })
    store.addTask({ ...input, title: 'y', status: 'done' })
    expect(store.progress).toBe(67) // 2/3 ≈ 67
  })

  it('sortedTodos 按优先级降序 + 创建时间升序', () => {
    const a = store.addTask({ ...input, priority: 'low', title: '低' })
    const b = store.addTask({ ...input, priority: 'high', title: '高' })
    const c = store.addTask({ ...input, priority: 'medium', title: '中' })
    const ids = store.sortedTodos.map((t) => t.id)
    expect(ids).toEqual([b.id, c.id, a.id]) // high > medium > low
    void a // 避免未使用
  })

  it('loadTasks 从 localStorage 恢复', () => {
    store.addTask(input)
    // 重新创建 store（新 pinia）→ 应从 localStorage 恢复
    setActivePinia(createPinia())
    const store2 = useTasksStore()
    expect(store2.total).toBe(1)
    expect(store2.tasks[0].title).toBe('写周报')
  })
})
