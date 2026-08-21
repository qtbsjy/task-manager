<script setup lang="ts">
// 任务表单组件 — 新增/编辑共用
// 学习重点:
//   1. defineModel（Vue 3.4+）实现父组件 v-model 双向绑定
//   2. 消费 UiKit 表单组件（UiInput/UiTextarea）——真实项目验证组件库
//   3. 本地编辑副本 + 简单校验（不改父级数据，提交时才回写）
import { reactive, watch, computed } from 'vue'
import type { Priority, TaskInput } from '../types/task'

// UiInput 的 model 是 string；预估番茄数是 number|undefined，用桥接 computed 转换
// 这样表单字段始终是字符串，提交时才解析成数字
type FormEstimate = string | undefined

// defineModel：父组件 v-model 双向绑定初始值
const model = defineModel<TaskInput>({ required: true })

// 本地编辑副本（避免直接改父级数据）
const form = reactive<TaskInput>({ ...model.value })

// 当父级 model 变化时同步（编辑场景切换任务时）
watch(
  () => model.value,
  (v) => {
    form.title = v.title
    form.desc = v.desc
    form.priority = v.priority
    form.status = v.status
    form.estimate = v.estimate
    // 派生校验状态自动随 form 更新，无需手动重置
  },
)

const emit = defineEmits<{ (e: 'submit'): void; (e: 'cancel'): void }>()

// ---- 校验（表单组件化配套：error prop 驱动红框提示）----
const titleError = computed(() => (form.title.trim() ? '' : '任务标题不能为空'))
const descError = computed(() => (form.desc && form.desc.length > 200 ? '描述不能超过 200 字' : ''))
const estimateError = computed(() =>
  form.estimate != null && (form.estimate < 0 || !Number.isFinite(form.estimate))
    ? '番茄数需 ≥ 0'
    : '',
)
const valid = computed(() => !titleError.value && !descError.value && !estimateError.value)

// 字符串桥接值（UiInput v-model），数字 <-> 字符串互转
const estimateStr = computed<FormEstimate>({
  get: () => (form.estimate == null ? '' : String(form.estimate)),
  set: (v: FormEstimate) => {
    if (v === '' || v == null) form.estimate = undefined
    else {
      const n = Number(v)
      form.estimate = Number.isFinite(n) ? n : undefined
    }
  },
})

function handleSubmit() {
  if (!valid.value) return
  // 回写 model + 提交
  model.value = { ...form, title: form.title.trim() }
  emit('submit')
}
</script>

<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <!-- 标题：UiInput 带 label + 必填错误提示 -->
    <UiInput
      v-model="form.title"
      label="任务标题 *"
      :error="titleError"
      placeholder="要做点什么？"
      maxlength="60"
    />

    <!-- 描述：UiTextarea 带计数 -->
    <UiTextarea
      v-model="form.desc"
      label="描述"
      :error="descError"
      :maxlength="200"
      :show-count="true"
      rows="3"
      placeholder="补充说明（可选）"
    />

    <!-- 优先级：一组 UiButton 单选 -->
    <div class="field">
      <span class="field-label">优先级</span>
      <div class="prio-row">
        <UiButton
          v-for="p in (['low', 'medium', 'high'] as Priority[])"
          :key="p"
          :variant="form.priority === p ? 'primary' : 'secondary'"
          size="sm"
          type="button"
          @click="form.priority = p"
        >
          {{ { low: '🟢 低', medium: '🟠 中', high: '🔴 高' }[p] }}
        </UiButton>
      </div>
    </div>

    <!-- 预估番茄数：UiInput type=number -->
    <UiInput
      v-model="estimateStr"
      label="预估番茄数"
      type="number"
      min="0"
      :error="estimateError"
      placeholder="可选"
    />

    <div class="actions">
      <UiButton variant="ghost" type="button" @click="emit('cancel')">取消</UiButton>
      <UiButton type="submit" :disabled="!valid" icon="💾">保存</UiButton>
    </div>
  </form>
</template>

<style scoped>
.task-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; color: var(--ui-text-2); }
.prio-row { display: flex; gap: 8px; }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
</style>
