import './assets/main.css'
// 引入组件库打包后的样式（通过 package.json exports 的 ./style.css 子路径）
import 'ui-kit/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// 从 ui-kit npm 包引入（具名组件 + 默认 install 挂全局 $toast）
import UiKit from 'ui-kit'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(UiKit) // 注册全部 UiKit 组件 + $toast

app.mount('#app')
