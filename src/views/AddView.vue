<script setup lang="ts">
// 新增任务页
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasks'
import type { TaskInput } from '../types/task'
import { useToast } from '../composables/useToast'
import TaskForm from '../components/TaskForm.vue'

const router = useRouter()
const store = useTasksStore()
const toast = useToast()

const form = reactive<TaskInput>({
  title: '',
  desc: '',
  priority: 'medium',
  status: 'todo',
  estimate: undefined,
})

function submit() {
  store.addTask({ ...form })
  toast.success('任务已创建 🎉')
  router.push('/')
}
</script>

<template>
  <div class="page">
    <RouterLink to="/" class="back">← 返回</RouterLink>
    <h1>➕ 新建任务</h1>
    <UiCard>
      <TaskForm v-model="form" @submit="submit" @cancel="router.push('/')" />
    </UiCard>
  </div>
</template>

<style scoped>
.page { max-width: 560px; margin: 0 auto; }
.back { color: #4f8cff; text-decoration: none; font-size: 14px; }
h1 { font-size: 26px; margin: 16px 0 20px; }
</style>
