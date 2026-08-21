// 任务类型定义 —— TS 实战
// 学习重点: interface + 联合类型 + 枚举语义

/** 任务优先级 */
export type Priority = 'low' | 'medium' | 'high'

/** 任务状态 */
export type TaskStatus = 'todo' | 'doing' | 'done'

/** 任务实体 */
export interface Task {
  id: string
  title: string
  desc?: string
  priority: Priority
  status: TaskStatus
  /** 预估番茄数（可选） */
  estimate?: number
  createdAt: number
}

/** 新建任务入参（id/createdAt 由 store 生成） */
export type TaskInput = Omit<Task, 'id' | 'createdAt'>

// 优先级配置表（颜色/标签/排序权重）—— 单一权威来源
export const PRIORITY_META: Record<Priority, { label: string; color: string; weight: number }> = {
  low: { label: '低', color: 'blue', weight: 1 },
  medium: { label: '中', color: 'orange', weight: 2 },
  high: { label: '高', color: 'red', weight: 3 },
}

// 状态配置表
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: '待办', color: 'gray' },
  doing: { label: '进行中', color: 'blue' },
  done: { label: '已完成', color: 'green' },
}
