<!--
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: DOM 元素選擇器組件
 -->

<template>
  <div class="element-selector" :class="{ active: isActive }">
    <div class="selector-overlay" v-if="isActive">
      <div
        class="hover-box"
        :style="{
          top: hoverBox.top + 'px',
          left: hoverBox.left + 'px',
          width: hoverBox.width + 'px',
          height: hoverBox.height + 'px'
        }"
      >
        <div class="gradient-info" v-if="gradientInfo">
          {{ gradientInfo }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getComputedGradient } from '../utils/gradient'

const isActive = ref(false)
const hoverBox = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0
})
const gradientInfo = ref('')

// 處理滑鼠移動
const handleMouseMove = (e: MouseEvent) => {
  if (!isActive.value) return

  const target = e.target as HTMLElement
  if (!target) return

  // 獲取元素位置和尺寸
  const rect = target.getBoundingClientRect()
  hoverBox.value = {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  }

  // 檢查是否有漸層
  const gradient = getComputedGradient(target)
  gradientInfo.value = gradient || ''
}

// 處理點擊事件
const handleClick = (e: MouseEvent) => {
  if (!isActive.value) return

  e.preventDefault()
  e.stopPropagation()

  const target = e.target as HTMLElement
  if (!target) return

  const gradient = getComputedGradient(target)
  if (gradient) {
    // 發送消息到 popup
    chrome.runtime.sendMessage({
      type: 'GRADIENT_CAPTURED',
      data: gradient
    })

    // 停止選擇模式
    isActive.value = false
  }
}

// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener(message => {
  if (message.type === 'START_CAPTURE') {
    isActive.value = true
  }
})

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('click', handleClick, true)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleClick, true)
})
</script>

<style>
.element-selector {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999999;
}

.element-selector.active {
  pointer-events: auto;
  cursor: crosshair;
}

.selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hover-box {
  position: absolute;
  border: 2px solid #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
  pointer-events: none;
  transition: all 0.1s ease;
}

.gradient-info {
  position: absolute;
  top: 100%;
  left: 0;
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  white-space: nowrap;
  pointer-events: none;
}
</style>
