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
  console.log("插件安裝完成");
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

// TODO: 監聽來自彈出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "REQUEST_START_PICKING") {
    handleStartPicking()
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道開啟
  } else if (request.type === "GRADIENT_PICKED") {
    handleGradientPicked(request)
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道開啟
  } else if (request.type === "GET_LAST_GRADIENT") {
    sendResponse({ gradient: lastPickedGradient });
    return false; // 同步操作，不需要保持通道開啟
  }
});

// 處理開始選取的請求
async function handleStartPicking() {
  try {
    // 獲取當前視窗
    const currentWindow = await chrome.windows.getCurrent();

    // 在當前視窗中查詢活動標籤
    const tabs = await chrome.tabs.query({
      active: true,
      windowId: currentWindow.id,
    });

    const tab = tabs[0];
    if (!tab) {
      throw new Error("No active tab found");
    }

    // 檢查是否是特殊頁面
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("edge://")) {
      throw new Error("Cannot inject scripts into browser internal pages");
    }

    // 嘗試注入 content script（即使在 manifest 中已配置，某些情況下可能需要重新注入）
    try {
      console.log("嘗試注入 content script");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content/picker.js"],
      });

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["src/content/picker.css"],
      });
      console.log("Content script 注入成功");
    } catch (injectError) {
      console.log("Content script 可能已經存在:", injectError);
    }

    // 等待較長時間確保 content script 完全加載
    await new Promise(resolve => setTimeout(resolve, 500));

    // 使用 Promise 包裝消息發送，添加超時處理
    const sendMessageWithTimeout = async () => {
      const timeout = 2000; // 2 秒超時
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        try {
          console.log("嘗試發送 ACTIVATE_PICKER 消息到 tab:", tab.id);
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: "ACTIVATE_PICKER",
            timestamp: Date.now(), // 添加時間戳防止重複處理
          });

          console.log("收到 content script 回應:", response);
          return true;
        } catch (error) {
          console.log("發送消息失敗，等待重試:", error);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      throw new Error("發送消息超時");
    };

    await sendMessageWithTimeout();
    console.log("ACTIVATE_PICKER 消息發送成功");

    return { success: true };
  } catch (error) {
    console.error("Error in handleStartPicking:", error);
    throw error;
  }
}

// 處理漸層選取完成的請求
async function handleGradientPicked(request) {
  console.log("處理漸層選取完成的請求");

  lastPickedGradient = request.gradient;

  // 通知彈出窗口更新 UI
  await chrome.runtime.sendMessage({
    type: "UPDATE_GRADIENT",
    gradient: request.gradient,
  });

  return { success: true };
}
