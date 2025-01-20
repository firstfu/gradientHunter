/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 彈出視窗邏輯控制
 */

document.addEventListener("DOMContentLoaded", () => {
  const startPickerBtn = document.getElementById("startPicker");
  const openEditorBtn = document.getElementById("openEditor");
  const resultContainer = document.getElementById("resultContainer");
  const gradientPreview = document.getElementById("gradientPreview");
  const cssCode = document.getElementById("cssCode");
  const copyCodeBtn = document.getElementById("copyCode");
  const editInEditorBtn = document.getElementById("editInEditor");

  // 開始取色
  startPickerBtn.addEventListener("click", async () => {
    try {
      // 獲取當前標籤頁
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error("No active tab found");
      }

      // 檢查標籤頁是否可以注入腳本
      if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
        throw new Error("Cannot access this page");
      }

      // 先檢查 content script 是否已載入
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "PING" });
        if (response !== "PONG") {
          throw new Error("Content script not ready");
        }
      } catch (e) {
        // 如果 content script 未載入，嘗試注入必要的腳本
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/js/core/domUtils.js", "src/js/core/gradientParser.js", "src/js/ui/picker.js"],
        });
      }

      // 注入取色模式
      await chrome.tabs.sendMessage(tab.id, { type: "START_PICKING" });

      // 關閉彈出視窗
      window.close();
    } catch (error) {
      console.error("Failed to start picker:", error);
      // 顯示錯誤訊息給用戶
      alert(`無法啟動取色器：${error.message}`);
    }
  });

  // 打開編輯器
  openEditorBtn.addEventListener("click", async () => {
    try {
      const editorURL = chrome.runtime.getURL("src/html/editor.html");
      await chrome.tabs.create({ url: editorURL });
    } catch (error) {
      console.error("Failed to open editor:", error);
    }
  });

  // 複製 CSS 代碼
  copyCodeBtn.addEventListener("click", async () => {
    try {
      const code = cssCode.textContent;
      await navigator.clipboard.writeText(code);

      // 顯示複製成功提示
      const originalText = copyCodeBtn.textContent;
      copyCodeBtn.textContent = "Copied!";
      setTimeout(() => {
        copyCodeBtn.innerHTML = '<span class="icon">📋</span>Copy CSS';
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  });

  // 在編輯器中打開
  editInEditorBtn.addEventListener("click", async () => {
    try {
      const gradient = gradientPreview.style.background;
      const editorURL = chrome.runtime.getURL("src/html/editor.html");
      const url = `${editorURL}?gradient=${encodeURIComponent(gradient)}`;
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error("Failed to open in editor:", error);
    }
  });

  // 監聽來自 content script 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GRADIENT_PICKED") {
      const { gradient, css } = message.data;

      // 更新預覽
      gradientPreview.style.background = gradient;

      // 更新代碼
      cssCode.textContent = css;

      // 顯示結果
      resultContainer.classList.remove("hidden");
      editInEditorBtn.classList.remove("hidden");
    }
  });
});
