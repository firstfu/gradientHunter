<!--
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層獵人 Chrome 插件主視窗
 -->

<template>
  <div class="gradient-hunter">
    <header class="header">
      <h1>Gradient Hunter</h1>
      <button class="start-button" @click="startCapture">開始擷取</button>
    </header>
    <main class="main">
      <div class="preview-area">
        <div class="gradient-preview" :style="previewStyle"></div>
        <div class="gradient-info" v-if="gradientData">
          <pre>{{ gradientCSS }}</pre>
          <button class="copy-button" @click="copyCSS">複製 CSS</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 漸層數據
const gradientData = ref<any>(null)

// 預覽樣式
const previewStyle = computed(() => {
  if (!gradientData.value) return {}
  return {
    background: gradientData.value
  }
})

// 格式化的 CSS
const gradientCSS = computed(() => {
  if (!gradientData.value) return ''
  return `background: ${gradientData.value};`
})

// 開始擷取
const startCapture = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0]
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_CAPTURE' })
    }
  })
}

// 複製 CSS
const copyCSS = async () => {
  if (gradientCSS.value) {
    await navigator.clipboard.writeText(gradientCSS.value)
  }
}
</script>

<style>
.gradient-hunter {
  width: 320px;
  padding: 16px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 18px;
  margin: 0;
}

.start-button {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.start-button:hover {
  background: #45a049;
}

.preview-area {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.gradient-preview {
  height: 100px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.gradient-info {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  position: relative;
}

.gradient-info pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.copy-button:hover {
  background: #1976d2;
}
</style>
