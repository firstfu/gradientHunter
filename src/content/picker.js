// 使用 IIFE 避免全局變量污染
(function () {
  // 漸層選取器的主要類
  class GradientPicker {
    constructor() {
      this.isActive = false;
      this.selectedElement = null;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };

      // 獲取已注入的 UI 元素
      this.root = document.getElementById("gradient-hunter-root");
      this.overlay = document.getElementById("gradient-hunter-overlay");
      this.toolbar = document.getElementById("gradient-hunter-toolbar");

      if (!this.root || !this.overlay || !this.toolbar) {
        // console.error("[GradientPicker] UI 元素未找到");
        return;
      }

      // 保存事件處理函數的引用
      this.boundClickHandler = this.handleClick.bind(this);
      this.boundMessageListener = this.handleMessage.bind(this);
      this.boundMouseDownHandler = this.handleMouseDown.bind(this);
      this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
      this.boundMouseUpHandler = this.handleMouseUp.bind(this);

      this.init();
    }

    init() {
      this.bindMessageListener();
      this.bindUIEvents();
      this.initDraggable();

      // 初始化時就顯示引導 UI
      this.updateGradientUI(null);
    }

    // 初始化拖動功能
    initDraggable() {
      // 確保工具列可以被拖曳
      this.toolbar.style.position = "fixed";
      this.toolbar.style.cursor = "move";
      this.toolbar.style.userSelect = "none";

      this.toolbar.addEventListener("mousedown", this.boundMouseDownHandler);
      document.addEventListener("mousemove", this.boundMouseMoveHandler);
      document.addEventListener("mouseup", this.boundMouseUpHandler);
    }

    // 處理滑鼠按下事件
    handleMouseDown(e) {
      // 如果點擊的是按鈕，不處理拖動
      if (e.target.closest(".gh-button")) {
        return;
      }

      e.preventDefault(); // 防止文字選取
      this.isDragging = true;
      this.toolbar.classList.add("dragging");

      // 計算滑鼠點擊位置與工具欄的相對位置
      const toolbarRect = this.toolbar.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - toolbarRect.left,
        y: e.clientY - toolbarRect.top,
      };
    }

    // 處理滑鼠移動事件
    handleMouseMove(e) {
      if (!this.isDragging) return;

      e.preventDefault();

      // 計算新位置，確保不超出視窗範圍
      const x = Math.max(0, Math.min(e.clientX - this.dragOffset.x, window.innerWidth - this.toolbar.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - this.dragOffset.y, window.innerHeight - this.toolbar.offsetHeight));

      // 更新工具欄位置
      this.toolbar.style.left = `${x}px`;
      this.toolbar.style.top = `${y}px`;
    }

    // 處理滑鼠放開事件
    handleMouseUp(e) {
      if (!this.isDragging) return;

      e.preventDefault();
      this.isDragging = false;
      this.toolbar.classList.remove("dragging");
    }

    // 綁定 UI 事件
    bindUIEvents() {
      // 綁定按鈕事件
      document.getElementById("gh-close-picker")?.addEventListener("click", () => {
        this.stop();
      });

      // 綁定複製按鈕事件
      document.querySelector(".gh-copy-btn")?.addEventListener("click", async () => {
        const codeBlock = document.querySelector(".gh-code-block code");
        if (codeBlock) {
          try {
            await navigator.clipboard.writeText(codeBlock.textContent);
            // 可以添加複製成功的視覺反饋
            const copyBtn = document.querySelector(".gh-copy-btn");
            copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0015.172 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2"/>
                <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2"/>
              </svg>`;
            }, 2000);
          } catch (err) {
            console.error("複製失敗:", err);
          }
        }
      });

      // 確認選擇
      document.getElementById("gh-confirm-pick")?.addEventListener("click", () => {
        if (this.selectedElement) {
          const gradientInfo = this.extractGradientInfo(this.selectedElement);
          chrome.runtime.sendMessage(
            {
              type: "GRADIENT_SELECTED",
              gradient: gradientInfo,
            },
            response => {}
          );
          this.stop();
        }
      });
    }

    // 綁定消息監聽器
    bindMessageListener() {
      // 移除舊的監聽器
      chrome.runtime.onMessage.removeListener(this.boundMessageListener);
      // 添加新的監聽器
      chrome.runtime.onMessage.addListener(this.boundMessageListener);
    }

    // 處理消息
    handleMessage(message, sender, sendResponse) {
      if (message.type === "START_PICKER" || message.type === "ACTIVATE_PICKER") {
        this.start();
        sendResponse({ success: true });
      } else if (message.type === "STOP_PICKER") {
        this.stop();
        sendResponse({ success: true });
      }
      return true;
    }

    // 處理點擊事件
    handleClick = e => {
      // 如果點擊的是工具欄或其子元素，不處理該事件
      if (e.target.closest("#gradient-hunter-toolbar")) {
        return;
      }

      // 阻止事件傳播和默認行為
      e.preventDefault();
      e.stopPropagation();

      // 確保事件物件存在
      if (!e) {
        console.error("[GradientPicker] 沒有收到事件物件");
        return;
      }

      // 獲取點擊位置下的所有元素
      const elements = document.elementsFromPoint(e.clientX, e.clientY);

      // 移除之前的高亮
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
      }

      // 遍歷元素列表，找到第一個具有漸層的元素
      for (const element of elements) {
        // 跳過工具欄相關元素
        if (element.closest("#gradient-hunter-root")) {
          continue;
        }

        if (this.hasGradient(element)) {
          this.selectedElement = element;
          const gradientInfo = this.extractGradientInfo(element);
          this.updateGradientUI(gradientInfo);
          element.classList.add("gradient-hunter-highlight");
          return;
        }
      }
    };

    // 檢查元素是否包含漸層
    hasGradient(element) {
      if (!element) return false;

      // 暫時移除 highlight class 以獲取原始樣式
      const hasHighlight = element.classList.contains("gradient-hunter-highlight");
      if (hasHighlight) {
        element.classList.remove("gradient-hunter-highlight");
      }

      const style = window.getComputedStyle(element);

      // 檢查各種可能的漸層屬性
      const hasGradient = style.backgroundImage.includes("gradient") || style.background.includes("gradient");

      // 如果之前有 highlight class，則加回去
      if (hasHighlight) {
        element.classList.add("gradient-hunter-highlight");
      }

      return hasGradient;
    }

    // TODO: 提取漸層資訊
    extractGradientInfo(element) {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;

      // 解析漸層資訊
      let gradient = {
        type: "linear", // 預設為線性漸層
        angle: "180deg", // 預設角度
        stops: [],
      };

      if (backgroundImage.includes("gradient")) {
        const match = backgroundImage.match(/(\w+-gradient)\((.*)\)/);
        if (match) {
          // 確定漸層類型
          gradient.type = match[1].split("-")[0];

          // 解析參數
          const params = match[2].split(/,(?![^(]*\))/);

          // 檢查第一個參數是否包含位置資訊（例如：from 180deg at 50% 50%）
          if (params[0].includes("from") || params[0].includes("at")) {
            gradient.angle = params[0].trim();
            params.shift();
          } else if (params[0].includes("deg")) {
            gradient.angle = params[0].trim();
            params.shift();
          }

          // 解析顏色停駐點，保持 RGB 值的完整性
          gradient.stops = params.map(stop => {
            stop = stop.trim();

            // 檢查是否有位置資訊
            const posMatch = stop.match(/(.*?)(?:\s+(\d+%|\d+px|\d+em|center|top|bottom|left|right))?$/);

            if (posMatch) {
              return {
                color: posMatch[1].trim(),
                position: posMatch[2] || null,
              };
            }

            return {
              color: stop,
              position: null,
            };
          });
        }
      }

      return {
        gradient: gradient,
        originalValue: backgroundImage,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
        },
      };
    }

    // 更新 UI 顯示漸層資訊
    updateGradientUI(gradientInfo) {
      const previewSection = document.querySelector(".gh-preview-section");
      const colorStops = document.querySelector(".gh-color-stops");
      const codeBlock = document.querySelector(".gh-code-block code");

      if (previewSection) {
        // 更新預覽
        const preview = previewSection.querySelector(".gh-gradient-preview");

        if (!gradientInfo) {
          // 初始狀態：顯示引導 UI

          preview.innerHTML = `
            <div class="gh-empty-state">
              <div class="gh-empty-state-content">
                <div class="gh-empty-state-text">
                  <h2>點擊任意漸層元素</h2>
                  <p>在頁面上尋找並點擊含有漸層效果的元素</p>
                </div>
                <div class="gh-empty-state-tips">
                  <span class="gh-tip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    支援多種漸層類型
                  </span>
                  <span class="gh-tip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    一鍵複製 CSS 代碼
                  </span>
                </div>
              </div>
            </div>
          `;

          // 更新漸層資訊為引導文字
          const info = previewSection.querySelector(".gh-gradient-info");
          info.innerHTML = `
            <span class="gh-gradient-type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 8V16M12 8L8 12M12 8L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="gh-status-text">準備開始</span>
            </span>
            <span class="gh-gradient-angle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="gh-action-text">點擊以擷取</span>
            </span>
          `;

          // 清空顏色停駐點區域
          if (colorStops) {
            colorStops.innerHTML = `
              <div class="gh-empty-stops">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4V20M17 4V20M3 8H21M3 16H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>等待選取漸層</span>
              </div>
            `;
          }

          // 清空代碼區域
          if (codeBlock) {
            codeBlock.innerHTML = `<span class="gh-code-comment">/* 點擊頁面漸層來生成 CSS */</span>`;
          }

          return;
        }

        // 正常狀態：顯示擷取的漸層
        preview.innerHTML = "";
        preview.style.backgroundImage = gradientInfo.originalValue;

        // 更新漸層資訊
        const info = previewSection.querySelector(".gh-gradient-info");
        info.innerHTML = `
          <span class="gh-gradient-type">${gradientInfo.gradient.type}漸層</span>
          <span class="gh-gradient-angle">${gradientInfo.gradient.angle}</span>
        `;
      }

      if (colorStops && gradientInfo) {
        // 更新顏色停駐點
        colorStops.innerHTML = gradientInfo.gradient.stops
          .map(
            stop => `
          <div class="gh-color-stop">
            <div class="gh-color-preview" style="background-color: ${stop.color}"></div>
            <input type="text" value="${stop.color}${stop.position ? " " + stop.position : ""}" class="gh-color-value" readonly />
          </div>
        `
          )
          .join("");
      }

      if (codeBlock && gradientInfo) {
        // 更新代碼顯示
        const cssCode = `background: ${gradientInfo.originalValue};`;
        codeBlock.textContent = cssCode;
      }
    }

    // 開始選取
    start() {
      if (!this.isActive) {
        this.isActive = true;
        document.addEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "crosshair";
        this.overlay.style.display = "block";
        this.toolbar.style.display = "flex";

        // 添加動效類名
        requestAnimationFrame(() => {
          this.toolbar.classList.add("active");
          this.overlay.classList.add("active");
        });
      }
    }

    // 停止選取
    stop() {
      if (this.isActive) {
        this.isActive = false;
        document.removeEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "";

        // 移除動效類名並等待動畫完成
        this.toolbar.classList.remove("active");
        this.overlay.classList.remove("active");

        setTimeout(() => {
          if (!this.isActive) {
            this.overlay.style.display = "none";
            this.toolbar.style.display = "none";
          }
        }, 300); // 等待動畫完成

        if (this.selectedElement) {
          this.selectedElement.classList.remove("gradient-hunter-highlight");
          this.selectedElement = null;
        }
      }
    }

    // 清理
    cleanup() {
      this.stop();

      // 移除事件監聽器
      document.removeEventListener("mousemove", this.boundMouseMoveHandler);
      document.removeEventListener("mouseup", this.boundMouseUpHandler);
      chrome.runtime.onMessage.removeListener(this.boundMessageListener);

      // 移除 UI
      if (this.root) {
        this.root.parentNode?.removeChild(this.root);
        this.root = null;
        this.overlay = null;
        this.toolbar = null;
      }
    }
  }

  // 初始化選取器
  window.gradientPicker = new GradientPicker();
})();
