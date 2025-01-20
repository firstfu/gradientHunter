/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層獵人 Chrome 插件入口文件
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
