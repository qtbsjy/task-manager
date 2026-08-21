// HomeView 冒烟测试 —— 验证真实应用里消费 UiKit（尤其 UiTable）能正常渲染
// 学习重点:
//   1. 应用级集成测试：真实 ui-kit lib 产物 + mock store/router
//   2. UiTable 在真实场景：列渲染/作用域插槽/排序/空态
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UiKit from 'ui-kit'
import HomeView from '../HomeView.vue'
import { useTasksStore } from '../../stores/tasks'
import type { Task } from '../../types/task'

// mock useToast（内部 getCurrentInstance 需要真实实例，这里给假的即可）
vi.mock('../../composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

// 准备一条测试任务
function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: '写周报',
    desc: '本周进展',
    priority: 'high',
    status: 'doing',
    estimate: 3,
    createdAt: Date.now(),
    ...over,
  }
}

function mountHome(tasks: Task[]) {
  setActivePinia(createPinia())
  const store = useTasksStore()
  // 直接注入 tasks（绕过 localStorage）
  ;(store as any).tasks = tasks

  return mount(HomeView, {
    global: {
      plugins: [UiKit], // 注册真实 UiKit 全局组件（含 UiTable / UiCard / UiModal...）
      stubs: {
        RouterLink: { template: '<a><slot /></a>' }, // 简化路由链接
      },
    },
  })
}

describe('HomeView (UiKit 集成)', () => {
  it('渲染统计卡片 + 进度', () => {
    const w = mountHome([makeTask()])
    // UiCard 标题
    expect(w.text()).toContain('总任务')
    expect(w.text()).toContain('整体进度')
  })

  it('用 UiTable 渲染任务行（作用域插槽徽标）', () => {
    const w = mountHome([makeTask({ title: '写周报', priority: 'high', status: 'doing' })])
    // UiTable 表格结构
    expect(w.find('table.ui-table__table').exists()).toBe(true)
    // 表头
    expect(w.text()).toContain('任务')
    expect(w.text()).toContain('优先级')
    expect(w.text()).toContain('状态')
    // 数据行标题 + 操作按钮（作用域插槽）
    expect(w.text()).toContain('写周报')
    expect(w.text()).toContain('编辑')
    expect(w.text()).toContain('删除')
  })

  it('点击表头可排序（UiTable 内置排序）', async () => {
    const tasks = [
      makeTask({ id: 'a', title: '甲', priority: 'low' }),
      makeTask({ id: 'b', title: '乙', priority: 'high' }),
    ]
    const w = mountHome(tasks)
    // 点击"优先级"表头 → 升序（字符串比较: 'high' < 'low'，所以 high 的"乙"在前）
    const prioTh = w.findAll('th').find((th) => th.text().includes('优先级'))!
    await prioTh.trigger('click')
    // 升序第一行第一个 td 应是 high 的"乙"
    const firstRowTds = w.findAll('tbody tr')[0].findAll('td')
    expect(firstRowTds[0].text()).toBe('乙')
    // 再点 → 降序（low 的"甲"在前）
    await prioTh.trigger('click')
    const firstRowTds2 = w.findAll('tbody tr')[0].findAll('td')
    expect(firstRowTds2[0].text()).toBe('甲')
  })

  it('空数据时显示空态（empty-text）', () => {
    const w = mountHome([])
    expect(w.text()).toContain('新建任务')
  })
})
