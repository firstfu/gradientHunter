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

// 監聽來自彈出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Background] Received message:", request);

  if (request.type === "REQUEST_START_PICKING") {
    handleStartPicking()
      .then(response => {
        console.log("[Background] Start picking response:", response);
        sendResponse(response);
      })
      .catch(error => {
        console.error("[Background] Start picking error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道開啟
  } else if (request.type === "GRADIENT_SELECTED") {
    handleGradientSelected(request)
      .then(response => {
        console.log("[Background] Gradient selected response:", response);
        sendResponse(response);
      })
      .catch(error => {
        console.error("[Background] Gradient selected error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.type === "GET_LAST_GRADIENT") {
    // 回傳最後選取的漸層
    console.log("[Background] Sending last gradient:", lastPickedGradient);
    sendResponse({
      success: true,
      gradient: lastPickedGradient,
    });
    return true;
  }
});

// 處理開始選取的請求
async function handleStartPicking() {
  console.log("[Background] Handling start picking request");
  try {
    // 獲取當前標籤頁
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error("No active tab found");
    }

    console.log("[Background] Active tab:", tab);

    // 確保內容腳本已注入
    if (!injectedTabs.has(tab.id)) {
      console.log("[Background] Injecting content script...");
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/picker.js"],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["src/content/picker.css"],
        });
        injectedTabs.add(tab.id);
        console.log("[Background] Content script injected successfully");
      } catch (injectionError) {
        console.error("[Background] Script injection error:", injectionError);
        throw new Error("Failed to inject content script");
      }
    }

    // 等待一小段時間確保腳本已完全加載
    await new Promise(resolve => setTimeout(resolve, 100));

    // 發送消息到 content script
    await chrome.tabs.sendMessage(tab.id, {
      type: "START_PICKER",
      timestamp: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("[Background] Error in handleStartPicking:", error);
    throw error;
  }
}

// 處理漸層選取完成
async function handleGradientSelected(request) {
  console.log("[Background] Handling gradient selected 處理漸層選取完成:", request);

  // 儲存選取的漸層
  lastPickedGradient = request.gradient;

  // 通知 popup 更新 UI
  try {
    await chrome.runtime.sendMessage({
      type: "UPDATE_GRADIENT",
      gradient: lastPickedGradient,
    });
    console.log("[Background] Update gradient message sent to popup");
  } catch (error) {
    console.log("[Background] Popup might be closed, ignoring error:", error);
  }

  return { success: true };
}
