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
  const prevBtn = gradientPreview.querySelector(".prev");
  const nextBtn = gradientPreview.querySelector(".next");
  const gradientCount = gradientPreview.querySelector(".gradient-count");

  let currentGradients = [];
  let currentIndex = 0;

  // 更新漸層預覽
  function updatePreview() {
    if (currentGradients.length === 0) {
      gradientCount.textContent = "No gradients selected";
      gradientPreview.style.background = "none";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    gradientPreview.style.background = currentGradients[currentIndex];
    gradientCount.textContent = `Gradient ${currentIndex + 1} of ${currentGradients.length}`;

    // 更新導航按鈕狀態
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentGradients.length - 1;

    // 更新 CSS 代碼
    cssCode.textContent = currentGradients.map(g => `background: ${g};`).join("\n");
  }

  // 上一個漸層
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updatePreview();
    }
  });

  // 下一個漸層
  nextBtn.addEventListener("click", () => {
    if (currentIndex < currentGradients.length - 1) {
      currentIndex++;
      updatePreview();
    }
  });

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

      // 開始取色模式
      const response = await chrome.tabs.sendMessage(tab.id, { type: "START_PICKING" });

      if (!response || !response.success) {
        throw new Error("Failed to start picker: " + (response?.error || "Unknown error"));
      }

      // 關閉彈出視窗
      window.close();
    } catch (error) {
      console.error("Failed to start picker:", error);

      if (error.message.includes("Cannot establish connection")) {
        // 如果是連接錯誤，可能需要重新載入頁面
        alert("請重新載入頁面後再試。\n如果問題持續發生，請確保已允許擴充功能存取網站。");
      } else {
        // 其他錯誤
        alert(`無法啟動取色器：${error.message}`);
      }
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
      const editorURL = chrome.runtime.getURL("src/html/editor.html");
      const url = `${editorURL}?gradients=${encodeURIComponent(JSON.stringify(currentGradients))}`;
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error("Failed to open in editor:", error);
    }
  });

  // 監聽來自 content script 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GRADIENT_PICKED") {
      const { gradients } = message.data;

      if (gradients && gradients.length > 0) {
        currentGradients = gradients;
        currentIndex = 0;
        updatePreview();

        // 顯示結果
        resultContainer.classList.remove("hidden");
        editInEditorBtn.classList.remove("hidden");
      }
    }
  });
});
