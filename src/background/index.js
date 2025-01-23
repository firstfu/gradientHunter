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

// 監聽插件圖標點擊事件
chrome.action.onClicked.addListener(tab => {
  handleStartPicking()
    .then(response => {
      console.log("[Background] Picking started successfully");
    })
    .catch(error => {
      console.error("[Background] Start picking error:", error);
    });
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

// 監聽來自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GRADIENT_SELECTED") {
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
    sendResponse({
      success: true,
      gradient: lastPickedGradient,
    });
    return true;
  }
  return true;
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
            right: 20px;
            width: 320px;
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 2147483647;
            pointer-events: auto;
            user-select: none;
            display: none;
            flex-direction: column;
            overflow: hidden;
          }

          .gh-toolbar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #eee;
          }

          .gh-toolbar-header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }

          .gh-main-content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .gh-preview-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .gh-gradient-preview {
            height: 100px;
            border-radius: 8px;
            border: 1px solid #eee;
          }

          .gh-gradient-info {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: #666;
          }

          .gh-color-stops {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .gh-color-stop {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .gh-color-preview {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            border: 1px solid #eee;
          }

          .gh-color-value,
          .gh-stop-position {
            padding: 4px 8px;
            border: 1px solid #eee;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
            background: #f8f8f8;
          }

          .gh-color-value {
            flex: 1;
          }

          .gh-stop-position {
            width: 60px;
          }

          .gh-code-output {
            background: #f8f8f8;
            border-radius: 8px;
            overflow: hidden;
          }

          .gh-code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #eee;
            font-size: 14px;
            color: #666;
          }

          .gh-copy-btn {
            padding: 4px;
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
          }

          .gh-copy-btn:hover {
            color: #333;
          }

          .gh-code-block {
            margin: 0;
            padding: 12px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 13px;
            line-height: 1.4;
            color: #333;
            white-space: pre-wrap;
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
            <div class="gh-toolbar-header">
              <h1>Gradient Hunter</h1>
              <div class="gh-tools">
                <button id="gh-close-picker" class="gh-button" title="關閉">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 主要內容區 -->
            <main class="gh-main-content">
              <!-- 預覽區域 -->
              <section class="gh-preview-section">
                <div class="gh-gradient-preview"></div>
                <div class="gh-gradient-info">
                  <span class="gh-gradient-type">線性漸層</span>
                  <span class="gh-gradient-angle">180°</span>
                </div>
              </section>

              <!-- 顏色停駐點列表 -->
              <section class="gh-color-stops">
                <div class="gh-color-stop">
                  <div class="gh-color-preview"></div>
                  <input type="text" class="gh-color-value" readonly />
                  <input type="text" class="gh-stop-position" readonly />
                </div>
              </section>

              <!-- 代碼輸出區 -->
              <section class="gh-code-output">
                <div class="gh-code-header">
                  <span>CSS 代碼</span>
                  <button class="gh-copy-btn" title="複製代碼">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0015.172 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2" />
                      <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2" />
                    </svg>
                  </button>
                </div>
                <pre class="gh-code-block"><code></code></pre>
              </section>
            </main>
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
