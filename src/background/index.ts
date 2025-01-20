/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層獵人 Chrome 插件背景腳本
 */

interface GradientMessage {
  type: string
  data?: string
}

// 監聽來自 content script 的消息
chrome.runtime.onMessage.addListener(
  (
    message: GradientMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.type === 'GRADIENT_CAPTURED' && message.data) {
      // 將漸層數據轉發給當前活動的 popup
      chrome.runtime.sendMessage({
        type: 'UPDATE_GRADIENT',
        data: message.data
      })
    }
  }
)
