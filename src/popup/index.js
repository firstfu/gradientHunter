/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的彈出窗口腳本
 */

// 更新 UI 顯示
function updateUI(gradient) {
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
  // 獲取按鈕元素
  const pickButton = document.querySelector('.tool-btn[title="開始選取"]');
  const saveButton = document.querySelector('.tool-btn[title="儲存"]');
  const settingsButton = document.querySelector('.tool-btn[title="設定"]');

  console.log("==============================");
  console.log("pickButton", pickButton);
  console.log("==============================");

  // 綁定選取按鈕事件
  pickButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "START_PICKING" });
    window.close();
  });

  // 綁定複製按鈕事件
  document.querySelector(".copy-btn").addEventListener("click", () => {
    const code = document.querySelector(".code-block code").textContent;
    console.log("code:", code);
    navigator.clipboard.writeText(code);
  });

  // 檢查是否有最近選取的漸層
  chrome.runtime.sendMessage({ type: "GET_LAST_GRADIENT" }, response => {
    if (response && response.gradient) {
      updateUI(response.gradient);
    }
  });

  // 監聽來自背景腳本的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "UPDATE_GRADIENT" && request.gradient) {
      updateUI(request.gradient);
    }
  });
});
