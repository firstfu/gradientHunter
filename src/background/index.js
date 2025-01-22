/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的背景腳本
 */

// 儲存最後選取的漸層
let lastPickedGradient = null;

// 追蹤已注入腳本的標籤頁
const injectedTabs = new Set();

// 監聽擴充功能安裝事件
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gradient Hunter installed");
});

// 監聽標籤頁更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    injectedTabs.delete(tabId);
  }
});

// 監聽標籤頁關閉事件
chrome.tabs.onRemoved.addListener(tabId => {
  injectedTabs.delete(tabId);
});

// 監聽來自彈出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request.type);

  if (request.type === "START_PICKING") {
    handleStartPicking(sendResponse);
    return true; // 保持消息通道開啟
  } else if (request.type === "GRADIENT_PICKED") {
    handleGradientPicked(request, sendResponse);
    return true; // 保持消息通道開啟
  } else if (request.type === "GET_LAST_GRADIENT") {
    sendResponse({ gradient: lastPickedGradient });
    return false; // 同步操作，不需要保持通道開啟
  }
});

// 處理開始選取的請求
async function handleStartPicking(sendResponse) {
  try {
    console.log("處理開始選取的請求");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      sendResponse({ success: false, error: "No active tab found" });
      return;
    }

    if (!injectedTabs.has(tab.id)) {
      // 注入 CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["src/content/picker.css"],
      });

      // 注入 JavaScript
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content/picker.js"],
      });

      injectedTabs.add(tab.id);
    }

    // 發送開始選取消息
    await chrome.tabs.sendMessage(tab.id, { type: "START_PICKING" });
    sendResponse({ success: true });
  } catch (error) {
    console.error("Failed to inject picker:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// 處理漸層選取完成的請求s
async function handleGradientPicked(request, sendResponse) {
  try {
    lastPickedGradient = request.gradient;

    // 通知彈出窗口更新 UI
    await chrome.runtime.sendMessage({
      type: "UPDATE_GRADIENT",
      gradient: request.gradient,
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error("Failed to update gradient:", error);
    sendResponse({ success: false, error: error.message });
  }
}
