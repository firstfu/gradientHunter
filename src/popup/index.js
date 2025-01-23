/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的彈出窗口腳本
 */

// 更新 UI 顯示
function updateUI(gradient) {
  console.log("更新 UI 顯示");
  if (!gradient) return;

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

document.addEventListener("DOMContentLoaded", () => {
  try {
    const pickButton = document.querySelector('.tool-btn[title="開始選取"]');
    const saveButton = document.querySelector('.tool-btn[title="儲存"]');
    const settingsButton = document.querySelector('.tool-btn[title="設定"]');

    // 消息流程 1: Popup -> Background
    // 當用戶點擊選取按鈕時，發送 REQUEST_START_PICKING 消息到背景腳本
    // 請求開始選取操作
    pickButton.addEventListener("click", () => {
      console.log("綁定選取按鈕事件");
      chrome.runtime.sendMessage({ type: "REQUEST_START_PICKING" });
      //   window.close();
    });

    //   // 綁定複製按鈕事件
    //   document.querySelector(".copy-btn").addEventListener("click", () => {
    //     console.log("複製代碼");
    //     const code = document.querySelector(".code-block code").textContent;
    //     console.log("code:", code);
    //     navigator.clipboard.writeText(code);
    //   });

    //   // 檢查是否有最近選取的漸層
    //   chrome.runtime.sendMessage({ type: "GET_LAST_GRADIENT" }, response => {
    //     console.log("檢查是否有最近選取的漸層");
    //     if (response && response.gradient) {
    //       updateUI(response.gradient);
    //     }
    //   });

    // 消息流程 4: Background -> Popup
    // 監聽來自背景腳本的 UPDATE_GRADIENT 消息
    // 當收到新的漸層數據時，更新 UI 顯示
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "UPDATE_GRADIENT" && request.gradient) {
        console.log("更新 UI 顯示");
        updateUI(request.gradient);
      }
    });
  } catch (error) {
    console.error("[ERROR] Error in popup initialization:", error);
  }
});
