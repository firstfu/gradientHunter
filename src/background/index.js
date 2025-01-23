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
  console.log("收到 listen 消息:", request.type);

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
  console.log("處理請求: handleStartPicking");

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

    // 檢查腳本是否已注入
    if (!injectedTabs.has(tab.id)) {
      // 注入 content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content/picker.js"],
      });

      // 注入 CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["src/content/picker.css"],
      });

      // 標記該標籤頁已注入腳本
      injectedTabs.add(tab.id);
    }

    // 發送開始選取消息到 content script
    await chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_PICKER" });
    return { success: true };
  } catch (error) {
    console.error("Error in handleStartPicking:", error);
    throw error;
  }
}

// 處理漸層選取完成的請求
async function handleGradientPicked(request) {
  lastPickedGradient = request.gradient;

  // 通知彈出窗口更新 UI
  await chrome.runtime.sendMessage({
    type: "UPDATE_GRADIENT",
    gradient: request.gradient,
  });

  return { success: true };
}
