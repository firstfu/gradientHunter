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
chrome.runtime.onInstalled.addListener(() => {});

// 監聽插件圖標點擊事件
chrome.action.onClicked.addListener(tab => {
  handleStartPicking()
    .then(response => {})
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
        files: ["src/content/picker.css"],
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
        files: ["src/content/imageAnalyzer.js", "src/content/picker.js"],
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
