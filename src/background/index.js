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
  if (request.type === "REQUEST_START_PICKING") {
    handleStartPicking()
      .then(response => {
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
        sendResponse(response);
      })
      .catch(error => {
        console.error("[Background] Gradient selected error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.type === "GET_LAST_GRADIENT") {
    // 回傳最後選取的漸層

    console.log("===================================");
    console.log("[Background] Sending last gradient:", lastPickedGradient);
    console.log("===================================");

    sendResponse({
      success: true,
      gradient: lastPickedGradient,
    });
    return true;
  }
  return true; // 保持通道打開
});

// 處理開始選取的請求
async function handleStartPicking() {
  try {
    // 獲取當前標籤頁
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error("No active tab found");
    }

    try {
      // 注入樣式
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        css: `
          #gradient-hunter-root {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2147483647;
            pointer-events: none;
          }

          #gradient-hunter-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            z-index: 2147483646;
            cursor: crosshair;
            display: none;
            pointer-events: auto;
          }

          #gradient-hunter-toolbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #FFFFFF;
            border-radius: 8px;
            padding: 8px 20px;
            display: none;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2147483647;
            pointer-events: auto;
            user-select: none;
            cursor: move;
          }

          #gradient-hunter-toolbar.dragging {
            opacity: 0.9;
            transition: none;
          }

          #gradient-hunter-toolbar .gh-instructions {
            cursor: move;
          }

          .gh-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .gh-button:hover {
            opacity: 0.9;
          }

          #gh-close-picker {
            background: #f44336;
            color: white;
            cursor: pointer;
          }

          #gh-confirm-pick {
            background: #4CAF50;
            color: white;
            cursor: pointer;
          }

          .gh-instructions {
            color: #333;
            font-size: 14px;
            font-weight: 500;
          }

          .gradient-hunter-highlight {
            outline: 3px solid #4CAF50 !important;
            outline-offset: 2px !important;
            transition: outline 0.2s ease !important;
            position: relative !important;
            z-index: 2147483646 !important;
          }
        `,
      });

      // 注入初始化腳本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // 創建根容器
          const root = document.createElement("div");
          root.id = "gradient-hunter-root";

          // 創建遮罩層
          const overlay = document.createElement("div");
          overlay.id = "gradient-hunter-overlay";
          root.appendChild(overlay);

          // 創建工具欄
          const toolbar = document.createElement("div");
          toolbar.id = "gradient-hunter-toolbar";
          toolbar.innerHTML = `
            <button id="gh-close-picker" class="gh-button">取消</button>
            <span class="gh-instructions">移動滑鼠到漸層元素上並點擊選取</span>
            <button id="gh-confirm-pick" class="gh-button">確認選擇</button>
          `;
          root.appendChild(toolbar);

          // 添加到頁面
          document.body.appendChild(root);
        },
      });

      // 注入主要腳本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["src/content/picker.js"],
      });

      // 發送消息到 content script
      await chrome.tabs.sendMessage(tab.id, {
        type: "START_PICKER",
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (injectionError) {
      console.error("[Background] Script injection error:", injectionError);
      throw new Error("Failed to inject content script");
    }
  } catch (error) {
    console.error("[Background] Error in handleStartPicking:", error);
    throw error;
  }
}

// 處理漸層選取完成
async function handleGradientSelected(request) {
  // 儲存選取的漸層
  lastPickedGradient = request.gradient;

  console.log("===================================");
  console.log("[Background] 處理漸層選取完成 Gradient selected:", lastPickedGradient);
  console.log("===================================");

  // 直接發送消息到 popup
  try {
    await chrome.runtime.sendMessage({
      type: "UPDATE_GRADIENT",
      gradient: lastPickedGradient,
    });
  } catch (error) {
    console.error("[Background] Error sending message to popup:", error);
    // 忽略錯誤，因為 popup 可能未開啟
  }

  return { success: true };
}
