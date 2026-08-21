import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/add',
      name: 'add',
      component: () => import('../views/AddView.vue'),
    },
    {
      // 动态路由: 编辑任务, props:true 让 :id 作为 prop 传进组件
      path: '/edit/:id',
      name: 'edit',
      component: () => import('../views/EditView.vue'),
      props: true,
    },
    {
      // 兜底
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
