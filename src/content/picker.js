// 使用 IIFE 避免全局變量污染
(function () {
  // 檢查是否已經初始化
  if (window.gradientPickerInitialized) {
    return;
  }
  window.gradientPickerInitialized = true;

  // 漸層選取器的主要類
  class GradientPicker {
    constructor() {
      this.isActive = false;
      this.selectedElement = null;
      // 保存事件處理函數的引用
      this.boundClickHandler = this.handleClick.bind(this);
      this.init();

      // 在頁面卸載時清理
      window.addEventListener("unload", () => {
        this.cleanup();
      });
    }

    init() {
      this.bindMessageListener();
      this.createPickerUI();
      // 添加樣式
      const style = document.createElement("style");
      style.textContent = `
          .gradient-hunter-toolbar {
              position: fixed !important;
              top: 20px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              background: #FFFFFF !important;
              border-radius: 8px !important;
              padding: >>>2px 20px !important;
              display: none !important;
              align-items: center !important;
              gap: 16px !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
              z-index: 2147483647 !important;
          }

          .gradient-hunter-overlay {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: rgba(0, 0, 0, 0.1) !important;
              z-index: 2147483646 !important;
              cursor: crosshair !important;
              display: none !important;
          }

          .gh-button {
              padding: 8px 16px !important;
              border: none !important;
              border-radius: 6px !important;
              font-size: 14px !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
          }

          .gh-button:hover {
              opacity: 0.9 !important;
          }

          #gh-close-picker {
              background: #f44336 !important;
              color: white !important;
          }

          #gh-confirm-pick {
              background: #4CAF50 !important;
              color: white !important;
          }

          .gh-instructions {
              color: #333 !important;
              font-size: 14px !important;
              font-weight: 500 !important;
          }

          .gradient-hunter-highlight {
              outline: 3px solid #4CAF50 !important;
              outline-offset: 2px !important;
              transition: outline 0.2s ease !important;
              position: relative !important;
              z-index: 2147483646 !important;
          }
      `;
      document.head.appendChild(style);
    }

    createPickerUI() {
      // 創建遮罩層
      const overlay = document.createElement("div");
      overlay.className = "gradient-hunter-overlay";
      document.body.appendChild(overlay);
      this.overlay = overlay;

      // 創建工具欄
      const toolbar = document.createElement("div");
      toolbar.className = "gradient-hunter-toolbar";
      toolbar.innerHTML = `
          <button id="gh-close-picker" class="gh-button">取消</button>
          <span class="gh-instructions">移動滑鼠到漸層元素上並點擊選取</span>
          <button id="gh-confirm-pick" class="gh-button">確認選擇</button>
      `;
      document.body.appendChild(toolbar);
      this.toolbar = toolbar;

      // 綁定按鈕事件
      document.getElementById("gh-close-picker").addEventListener("click", () => {
        this.stop();
      });

      // 確認選擇
      document.getElementById("gh-confirm-pick").addEventListener("click", () => {
        if (this.selectedElement) {
          const gradientInfo = this.extractGradientInfo(this.selectedElement);
          chrome.runtime.sendMessage({
            type: "GRADIENT_SELECTED",
            gradient: gradientInfo,
          });
          this.stop();
        }
      });
    }

    // 綁定消息監聽器
    bindMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "START_PICKER" || message.type === "ACTIVATE_PICKER") {
          this.start();
          sendResponse({ success: true });
        } else if (message.type === "STOP_PICKER") {
          this.stop();
          sendResponse({ success: true });
        }
      });
    }

    // 處理點擊事件
    handleClick = e => {
      // 如果點擊的是工具欄或其子元素，不處理該事件
      if (e.target.closest(".gradient-hunter-toolbar")) {
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
        if (element.closest(".gradient-hunter-toolbar")) {
          continue;
        }

        if (this.hasGradient(element)) {
          this.selectedElement = element;
          console.log("[GradientPicker] 找到漸層元素:", element.cloneNode(true)); // 在添加 highlight 之前輸出元素的副本
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

    // 提取漸層資訊
    extractGradientInfo(element) {
      const style = window.getComputedStyle(element);
      return {
        gradient: style.backgroundImage,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
        },
      };
    }

    // 開始選取
    start() {
      if (!this.isActive) {
        this.isActive = true;
        document.addEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "crosshair";
        if (this.toolbar) {
          this.toolbar.style.setProperty("display", "flex", "important");
        }
        if (this.overlay) {
          this.overlay.style.setProperty("display", "block", "important");
        }
      }
    }

    // 停止選取
    stop() {
      if (this.isActive) {
        this.isActive = false;
        document.removeEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "";
        if (this.toolbar) {
          this.toolbar.style.setProperty("display", "none", "important");
        }
        if (this.overlay) {
          this.overlay.style.setProperty("display", "none", "important");
        }

        if (this.selectedElement) {
          this.selectedElement.classList.remove("gradient-hunter-highlight");
          this.selectedElement = null;
        }
      }
    }

    // 清理
    cleanup() {
      this.stop();
      if (this.toolbar) {
        document.body.removeChild(this.toolbar);
        this.toolbar = null;
      }
      if (this.overlay) {
        document.body.removeChild(this.overlay);
        this.overlay = null;
      }
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
        this.selectedElement = null;
      }
    }
  }

  // 初始化選取器
  window.gradientPicker = new GradientPicker();
})();
