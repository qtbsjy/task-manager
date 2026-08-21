# 📋 任务管理器（TypeScript 实战应用）

布鲁的**第七个 Vue 作品** —— 把上一作做的 **UiKit 组件库真正用到实际项目**里，
用 TypeScript 做了一个完整可用的任务管理 SPA。

## 技术栈

- Vue 3（Composition API + `<script setup lang="ts">`）+ **TypeScript**
- **Pinia** 状态管理 + localStorage 持久化
- **Vue Router**（动态路由 + 懒加载）
- **复用自研 UiKit 组件库**（按钮/徽标/卡片/模态框/进度条/Toast）

## 功能

- 任务增删改（新增/编辑页共用 `TaskForm` 组件）
- 优先级：低/中/高（排序权重 + 彩色徽标）
- 状态流转：待办 → 进行中 → 已完成（点 ☑ 循环推进）
- 统计面板：总数/待办/进行中/已完成 + 整体进度条
- 筛选：全部/待办/进行中/已完成
- 删除二次确认（模态框）
- localStorage 持久化 + 操作 Toast 反馈

## 页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 统计卡片 + 进度 + 筛选 + 任务列表 |
| `/add` | AddView | 新增任务（复用 TaskForm） |
| `/edit/:id` | EditView | **动态路由** + `props:true`，编辑任务 |
| 兜底 | `/:pathMatch(.*)* → /` | 重定向首页 |

## 关键设计

### 1. TypeScript 贯穿全栈
- `types/task.ts`: `Task` 接口 + `Priority`/`TaskStatus` 联合类型 + 配置表
  ```ts
  export type Priority = 'low' | 'medium' | 'high'
  export interface Task {
    id: string; title: string; desc?: string
    priority: Priority; status: TaskStatus; estimate?: number
    createdAt: number
  }
  export type TaskInput = Omit<Task, 'id' | 'createdAt'>
  ```

### 2. UI 组件复用（核心价值）
从 **npm 包 `ui-kit`** 安装使用自研组件库（vite lib 模式打包）：
```ts
import 'ui-kit/style.css'   // 样式
import UiKit from 'ui-kit'  // 包入口
app.use(UiKit)              // 全局注册 <UiButton>/<UiCard> 等 + $toast
```
- 全局 `$toast` → 操作反馈（新增成功/保存/删除）
- 封了一个类型安全的 `useToast()` composable
- 不再复制源码，直接 `npm install ../ui-kit`（file: 协议）

### 3. defineModel（表单核心）
`TaskForm.vue` 用 Vue 3.4+ 的 `defineModel` 实现 v-model 双向绑定，
新增/编辑两个页面共用同一个表单组件。

### 4. 状态流转
```ts
const next: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }
store.setStatus(id, next[t.status])
```

## 工程组织

```
task-manager/
├── index.html / vite.config.ts / package.json / verify-dev.mjs
└── src/
    ├── main.ts                # createPinia + router + UiKit
    ├── App.vue                # 顶栏 + RouterView
    ├── assets/main.css        # 深色主题
    ├── types/task.ts          # TS 类型定义
    ├── stores/tasks.ts        # Pinia store（状态/派生/动作/持久化）
    ├── composables/useToast.ts# 类型安全 Toast 封装
    ├── router/index.ts        # 懒加载路由
    ├── components/
    │   ├── TaskForm.vue       # 共用表单（defineModel）
    │   ├── index.ts           # UiKit 统一出口
    │   └── ui/                # 6 个 UiKit 组件
    └── views/                 # Home / Add / Edit
```

## 验证

- ✅ `npm run type-check`（vue-tsc）通过
- ✅ `npm run build` 生产构建通过（61 modules，懒加载拆分正确）
- ✅ `node verify-dev.mjs`：3 路由 + 17 模块全部 200

## 运行

```bash
npm install
npm run dev
npm run build
```
