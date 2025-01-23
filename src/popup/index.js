/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的彈出窗口腳本
 */

// 更新 UI 顯示
function updateUI(gradientData) {
  if (!gradientData || !gradientData.gradient) return;

  const gradient = gradientData.gradient;

  // 顯示預覽區域
  const previewSection = document.querySelector(".preview-section");
  if (previewSection) {
    previewSection.classList.remove("hidden");
  }

  // 更新預覽區域
  document.querySelector(".gradient-preview").style.background = gradient;

  // 解析漸層資訊
  const match = gradient.match(/linear-gradient\((.*?)\)/);
  if (match) {
    const [angle, ...colors] = match[1].split(",").map(s => s.trim());

    // 更新漸層類型和角度
    document.querySelector(".gradient-type").textContent = "線性漸層";
    document.querySelector(".gradient-angle").textContent = angle;

    // 更新顏色停駐點
    const colorStopsContainer = document.querySelector(".color-stops");
    colorStopsContainer.innerHTML = colors
      .map(color => {
        const [value, position] = color.split(" ");
        return `
                <div class="color-stop">
                    <div class="color-preview" style="background-color: ${value}"></div>
                    <input type="text" value="${value}" class="color-value" readonly>
                    <input type="text" value="${position || "0%"}" class="stop-position" readonly>
                </div>
            `;
      })
      .join("");

    // 更新代碼區域
    document.querySelector(".code-block code").textContent = `background: linear-gradient(\n    ${angle},\n    ${colors.join(",\n    ")}\n);`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 請求最後選取的漸層資訊
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "GET_LAST_GRADIENT" }, response => {
        resolve(response);
      });
    });

    // 顯示預覽區域
    const previewSection = document.querySelector(".preview-section");
    if (previewSection) {
      previewSection.style.display = "block";
    }

    if (response && response.success && response.gradient) {
      updateUI(response);
    }

    const pickButton = document.querySelector('.tool-btn[title="開始選取"]');
    if (!pickButton) {
      throw new Error("Pick button not found");
    }

    // 當用戶點擊選取按鈕時
    pickButton.addEventListener("click", async () => {
      try {
        // 獲取當前標籤頁
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab) {
          throw new Error("No active tab found");
        }

        // 檢查是否是特殊頁面
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
          alert("無法在瀏覽器內部頁面使用選取器");
          return;
        }

        // 發送開始選取請求
        const response = await chrome.runtime.sendMessage({
          type: "REQUEST_START_PICKING",
          tabId: tab.id,
        });

        // 關閉 popup
        window.close();
      } catch (error) {
        console.error("[Popup] Error starting picker:", error);
        alert("啟動選取器時發生錯誤");
      }
    });

    // 設置消息監聽器
    const messageListener = (request, sender, sendResponse) => {
      if (request.type === "UPDATE_GRADIENT" && request.gradient) {
        updateUI(request);
        sendResponse({ success: true });
      }
      return true; // 保持消息通道開啟
    };

    // 註冊消息監聽器
    chrome.runtime.onMessage.addListener(messageListener);

    // 當 popup 關閉時移除監聽器
    window.addEventListener("unload", () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    });
  } catch (error) {
    console.error("[Popup] Error in initialization:", error);
  }
});
