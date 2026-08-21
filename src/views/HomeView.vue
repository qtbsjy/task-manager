<script setup lang="ts">
// 任务总览页 — 统计 + 进度 + UiTable 任务列表
// 学习重点:
//   1. UiTable 列配置驱动渲染（真实项目消费作品㉖ 组件）
//   2. 排序（表头点击循环）/ 分页 / 空态
//   3. 作用域插槽 #cell 自定义单元格（徽标 + 操作按钮列）
import { ref, computed } from 'vue'
import { useTasksStore } from '../stores/tasks'
import { PRIORITY_META, STATUS_META } from '../types/task'
import type { Task, TaskStatus } from '../types/task'
import type { TableColumn } from 'ui-kit'
import { useToast } from '../composables/useToast'

const store = useTasksStore()
const toast = useToast()

// 删除确认模态框
const showDelete = ref(false)
const deletingId = ref<string | null>(null)
function askDelete(id: string) {
  deletingId.value = id
  showDelete.value = true
}
function confirmDelete() {
  if (deletingId.value) {
    store.removeTask(deletingId.value)
    toast.success('任务已删除')
  }
  showDelete.value = false
  deletingId.value = null
}

// 展示数据：全部任务（UiTable 内部处理排序/分页）
const rows = computed(() => store.tasks)

// ---- UiTable 列配置 ----
const columns = computed<TableColumn<Task>[]>(() => [
  {
    key: 'title',
    label: '任务',
    sortable: true,
  },
  {
    key: 'priority',
    label: '优先级',
    width: 90,
    align: 'center',
    sortable: true,
    formatter: (v) => PRIORITY_META[v as Task['priority']]?.label ?? '',
  },
  {
    key: 'status',
    label: '状态',
    width: 100,
    align: 'center',
    sortable: true,
    formatter: (v) => STATUS_META[v as TaskStatus]?.label ?? '',
  },
  {
    key: 'estimate',
    label: '🍅',
    width: 70,
    align: 'center',
    sortable: true,
    formatter: (v) => (v == null ? '—' : String(v)),
  },
  {
    key: 'createdAt',
    label: '创建时间',
    width: 170,
    sortable: true,
    formatter: (v) => new Date(v as number).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
  },
  {
    key: 'ops',
    label: '操作',
    width: 150,
    align: 'center',
  },
])

// 状态流转（todo→doing→done→todo）
function advanceStatus(id: string) {
  const t = store.findById(id)
  if (!t) return
  const next: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }
  store.setStatus(id, next[t.status])
  toast.info(`已流转为「${STATUS_META[next[t.status]].label}」`)
}

// slot 里 row 是 any，提供类型安全的取元信息辅助（避免 TS7053）
function prioMeta(p: Task['priority']) {
  return PRIORITY_META[p]
}
function statusMeta(s: TaskStatus) {
  return STATUS_META[s]
}
</script>

<template>
  <header class="head">
    <h1>📋 任务管理</h1>
    <RouterLink to="/add"><UiButton icon="＋">新建任务</UiButton></RouterLink>
  </header>

  <!-- 统计卡片 -->
  <div class="stats">
    <UiCard title="总任务" :subtitle="`${store.total} 个`"><span class="num">{{ store.total }}</span></UiCard>
    <UiCard title="待办" :subtitle="`${store.todoCount} 个`"><span class="num todo">{{ store.todoCount }}</span></UiCard>
    <UiCard title="进行中" :subtitle="`${store.doingCount} 个`"><span class="num doing">{{ store.doingCount }}</span></UiCard>
    <UiCard title="已完成" :subtitle="`${store.doneCount} 个`"><span class="num done">{{ store.doneCount }}</span></UiCard>
  </div>

  <!-- 总体进度 -->
  <UiCard title="整体进度">
    <UiProgress :value="store.progress" show-text :color="store.progress === 100 ? '#22c55e' : '#4f8cff'" :height="12" />
  </UiCard>

  <!-- 任务表格（UiTable：排序 + 分页 + 空态 + 作用域插槽） -->
  <UiTable
    class="table"
    :columns="columns"
    :data="rows"
    :page-size="8"
    striped
    empty-text="还没有任务，点右上角「新建任务」开始吧 🚀"
  >
    <template #cell="{ row, column, index }">
      <!-- 标题列：完成划线 -->
      <span v-if="column.key === 'title'" class="cell-title" :class="{ done: row.status === 'done' }">
        {{ row.title }}
      </span>

      <!-- 优先级列：徽标 -->
      <UiBadge v-else-if="column.key === 'priority'" :color="(prioMeta(row.priority).color as any)">
        {{ prioMeta(row.priority).label }}
      </UiBadge>

      <!-- 状态列：可点击流转 + 徽标 -->
      <button v-else-if="column.key === 'status'" class="status-btn" @click="advanceStatus(row.id)" :title="'点击流转状态'">
        <UiBadge :color="(statusMeta(row.status).color as any)">{{ statusMeta(row.status).label }}</UiBadge>
      </button>

      <!-- 创建时间列：小字 -->
      <span v-else-if="column.key === 'createdAt'" class="cell-time">
        {{ column.formatter ? column.formatter(row[column.key], row) : row[column.key] }}
      </span>

      <!-- 操作列：编辑 + 删除 -->
      <div v-else-if="column.key === 'ops'" class="cell-ops">
        <RouterLink :to="`/edit/${row.id}`"><UiButton variant="ghost" size="sm">编辑</UiButton></RouterLink>
        <UiButton variant="danger" size="sm" icon="🗑" @click="askDelete(row.id)">删除</UiButton>
      </div>
    </template>
  </UiTable>

  <!-- 删除确认模态框 -->
  <UiModal v-model="showDelete" title="确认删除" width="380px">
    <p>确定要删除这个任务吗？此操作不可撤销。</p>
    <template #footer>
      <UiButton variant="ghost" @click="showDelete = false">取消</UiButton>
      <UiButton variant="danger" @click="confirmDelete">删除</UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
h1 { font-size: 28px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 16px; }
.num { font-size: 34px; font-weight: 800; color: var(--ui-text-1); }
.num.todo { color: #94a3b8; }
.num.doing { color: #4f8cff; }
.num.done { color: #22c55e; }
.table { margin-top: 20px; }
.cell-title { font-weight: 600; }
.cell-title.done { text-decoration: line-through; opacity: .55; }
.cell-time { font-size: 13px; color: var(--ui-text-3); }
.cell-ops { display: flex; gap: 6px; justify-content: center; }
.status-btn { background: none; border: none; cursor: pointer; padding: 0; }
</style>
