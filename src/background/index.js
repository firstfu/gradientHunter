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
  console.log("==============================");
  console.log("==============================");
  console.log("request", request);
  console.log("==============================");
  console.log("==============================");

  if (request.type === "START_PICKING") {
    // 使用 Promise 處理異步操作
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
          sendResponse({ success: false, error: "No active tab found" });
          return;
        }

        // 檢查是否已經注入
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

          // 記錄已注入
          injectedTabs.add(tab.id);
        }

        // 發送開始選取消息
        await chrome.tabs.sendMessage(tab.id, { type: "START_PICKING" });
        sendResponse({ success: true });
      } catch (error) {
        console.error("Failed to inject picker:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // 保持消息通道開啟
  } else if (request.type === "GRADIENT_PICKED") {
    // 儲存選取的漸層
    lastPickedGradient = request.gradient;

    // 使用 Promise 處理異步消息發送
    (async () => {
      try {
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
    })();

    return true; // 保持消息通道開啟
  } else if (request.type === "GET_LAST_GRADIENT") {
    // 同步操作可以直接回應
    sendResponse({ gradient: lastPickedGradient });
    return false; // 不需要保持通道開啟
  }
});
