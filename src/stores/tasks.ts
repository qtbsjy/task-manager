// 任务 Pinia store —— TS 版状态管理
// 学习重点:
//   1. defineStore 组合式写法 + TS 类型
//   2. ref 状态 / computed 派生 / 函数动作
//   3. localStorage 持久化
//   4. 返回 sortedTodos 等派生列表
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Task, TaskInput, Priority, TaskStatus } from '../types/task'

const STORAGE_KEY = 'task-manager.tasks'

// 读本地缓存
function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

export const useTasksStore = defineStore('tasks', () => {
  // ---- 状态 ----
  const tasks = ref<Task[]>(loadTasks())

  // ---- 持久化（每次变更写回） ----
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
  }

  // ---- 派生计算 ----
  const total = computed(() => tasks.value.length)
  const doneCount = computed(() => tasks.value.filter((t) => t.status === 'done').length)
  const doingCount = computed(() => tasks.value.filter((t) => t.status === 'doing').length)
  const todoCount = computed(() => tasks.value.filter((t) => t.status === 'todo').length)
  // 完成率 0-100
  const progress = computed(() =>
    total.value === 0 ? 0 : Math.round((doneCount.value / total.value) * 100),
  )
  // 按优先级+创建时间排序的任务列表
  const sortedTodos = computed(() =>
    [...tasks.value].sort((a, b) => {
      const w = (p: Priority) => ({ high: 3, medium: 2, low: 1 })[p]
      return w(b.priority) - w(a.priority) || a.createdAt - b.createdAt
    }),
  )
  // 按状态筛选
  const byStatus = (status: TaskStatus) => tasks.value.filter((t) => t.status === status)

  // ---- 动作 ----
  function addTask(input: TaskInput) {
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    tasks.value.push(task)
    persist()
    return task
  }

  function updateTask(id: string, patch: Partial<TaskInput>) {
    const i = tasks.value.findIndex((t) => t.id === id)
    if (i === -1) return
    const cur = tasks.value[i]!
    // 先合并出完整新对象（保留 id/createdAt），再整体赋值
    const updated: Task = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt }
    tasks.value[i] = updated
    persist()
  }

  function removeTask(id: string) {
    tasks.value = tasks.value.filter((t) => t.id !== id)
    persist()
  }

  function setStatus(id: string, status: TaskStatus) {
    updateTask(id, { status })
  }

  // 找单个任务
  function findById(id: string) {
    return tasks.value.find((t) => t.id === id)
  }

  return {
    tasks,
    total,
    doneCount,
    doingCount,
    todoCount,
    progress,
    sortedTodos,
    byStatus,
    addTask,
    updateTask,
    removeTask,
    setStatus,
    findById,
  }
})
