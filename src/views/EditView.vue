<script setup lang="ts">
// 编辑任务页 —— 动态路由 /edit/:id, props:true 接收
import { reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import type { TaskInput } from '../types/task'
import { useToast } from '../composables/useToast'
import TaskForm from '../components/TaskForm.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const store = useTasksStore()
const toast = useToast()

// 读取目标任务；找不到则显示提示
const task = store.findById(props.id)
if (!task) {
  toast.error('任务不存在')
  router.replace('/')
}

const form = reactive<TaskInput>({
  title: task?.title ?? '',
  desc: task?.desc ?? '',
  priority: task?.priority ?? 'medium',
  status: task?.status ?? 'todo',
  estimate: task?.estimate,
})

// id 变化时刷新表单（同一组件复用场景）
watch(
  () => props.id,
  (id) => {
    const t = store.findById(id)
    if (t) {
      form.title = t.title
      form.desc = t.desc
      form.priority = t.priority
      form.status = t.status
      form.estimate = t.estimate
    }
  },
)

function submit() {
  store.updateTask(props.id, { ...form })
  toast.success('已保存修改')
  router.push('/')
}
</script>

<template>
  <div class="page">
    <RouterLink to="/" class="back">← 返回</RouterLink>
    <h1>✏️ 编辑任务</h1>
    <UiCard v-if="task">
      <TaskForm v-model="form" @submit="submit" @cancel="router.push('/')" />
    </UiCard>
    <p v-else class="missing">⚠️ 任务不存在</p>
  </div>
</template>

<style scoped>
.page { max-width: 560px; margin: 0 auto; }
.back { color: #4f8cff; text-decoration: none; font-size: 14px; }
h1 { font-size: 26px; margin: 16px 0 20px; }
.missing { color: #f59e0b; }
</style>
