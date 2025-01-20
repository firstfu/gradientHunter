/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層獵人 Chrome 插件內容腳本
 */

import { createApp } from 'vue'
import ElementSelector from './components/ElementSelector.vue'
import './styles/selector.css'

// 創建容器元素
const container = document.createElement('div')
container.id = 'gradient-hunter-container'
document.body.appendChild(container)

// 創建 Vue 應用
const app = createApp(ElementSelector)
app.mount('#gradient-hunter-container')
