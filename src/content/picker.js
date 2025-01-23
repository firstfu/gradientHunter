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
      this.overlay = null;
      this.selectedElement = null;
      this.init();

      // 在頁面卸載時清理
      window.addEventListener("unload", () => {
        this.cleanup();
      });
    }

    init() {
      this.createOverlay();
      this.bindMessageListener();
    }

    createOverlay() {
      // 創建覆蓋層容器
      this.overlay = document.createElement("div");
      this.overlay.id = "gradient-hunter-overlay";

      // 創建工具欄
      const toolbar = document.createElement("div");
      toolbar.className = "gradient-hunter-toolbar";
      toolbar.innerHTML = `
          <button id="gh-close-picker" class="gh-button">取消</button>
          <span class="gh-instructions">移動滑鼠到漸層元素上並點擊選取</span>
          <button id="gh-confirm-pick" class="gh-button gh-button-primary">確認選擇</button>
      `;

      this.overlay.appendChild(toolbar);

      // 添加樣式
      const style = document.createElement("style");
      style.textContent = `
          #gradient-hunter-overlay {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              z-index: 2147483646 !important;
              cursor: crosshair !important;
              display: none !important;
          }

          #gradient-hunter-overlay .gradient-hunter-toolbar {
              position: fixed !important;
              top: 20px !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
              background: #FFFFFF !important;
              border-radius: 8px !important;
              padding: 12px 20px !important;
              display: flex !important;
              align-items: center !important;
              gap: 16px !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
              z-index: 2147483647 !important;
              pointer-events: auto !important;
          }

          #gradient-hunter-overlay .gh-button {
              padding: 8px 16px !important;
              border: none !important;
              border-radius: 6px !important;
              font-size: 14px !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
              pointer-events: auto !important;
          }

          #gradient-hunter-overlay .gh-button:hover {
              opacity: 0.9 !important;
          }

          #gradient-hunter-overlay #gh-close-picker {
              background: #f44336 !important;
              color: white !important;
          }

          #gradient-hunter-overlay #gh-confirm-pick {
              background: #4CAF50 !important;
              color: white !important;
          }

          #gradient-hunter-overlay .gh-instructions {
              color: #333 !important;
              font-size: 14px !important;
              font-weight: 500 !important;
          }

          .gradient-hunter-highlight {
              outline: 3px solid #4CAF50 !important;
              outline-offset: 2px !important;
              transition: outline 0.2s ease !important;
          }
      `;

      // 添加到頁面
      document.head.appendChild(style);
      document.body.appendChild(this.overlay);

      // 綁定事件
      this.bindEvents();
    }

    bindEvents() {
      // 點擊事件
      this.overlay.addEventListener("click", e => {
        console.log("[GradientPicker] Clicked");

        console.log("點擊事件-截取元素:", e.target);

        // 如果點擊到工具列，不進行處理
        if (e.target.closest(".gradient-hunter-toolbar")) {
          console.log("點擊事件-工具列:", e.target.closest(".gradient-hunter-toolbar"));
          return;
        }

        // 暫時隱藏覆蓋層以獲取底下的元素
        this.overlay.style.pointerEvents = "none";
        const element = document.elementFromPoint(e.clientX, e.clientY);
        this.overlay.style.pointerEvents = "auto";

        // 移除之前的高亮
        if (this.selectedElement) {
          this.selectedElement.classList.remove("gradient-hunter-highlight");
        }

        // 檢查元素是否包含漸層
        if (this.hasGradient(element)) {
          this.selectedElement = element;
          element.classList.add("gradient-hunter-highlight");
          console.log("[GradientPicker] Gradient 找到漸層元素:", element);
        } else {
          console.log("[GradientPicker] 沒有找到漸層元素:", element);
        }
      });

      // 關閉按鈕事件
      document.getElementById("gh-close-picker").addEventListener("click", () => {
        this.stop();
      });

      // 確認選擇按鈕事件
      document.getElementById("gh-confirm-pick").addEventListener("click", () => {
        if (this.selectedElement) {
          const gradientInfo = this.extractGradientInfo(this.selectedElement);
          console.log("[GradientPicker] Gradient selected:", gradientInfo);

          // 發送消息到背景腳本
          chrome.runtime.sendMessage({
            type: "GRADIENT_SELECTED",
            gradient: gradientInfo,
          });
          this.stop();
        }
      });
    }

    bindMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "START_PICKER" || message.type === "ACTIVATE_PICKER") {
          this.start();
          sendResponse({ success: true });
        }
      });
    }

    // 檢查元素是否包含漸層
    hasGradient(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const hasGradient = style.backgroundImage.includes("gradient");
      if (hasGradient) {
        console.log("[GradientPicker] Gradient 找到漸層元素:", element);
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

    start() {
      this.isActive = true;
      if (this.overlay) {
        this.overlay.style.setProperty("display", "block", "important");
        document.body.style.setProperty("overflow", "hidden", "important");
      } else {
        console.error("[GradientPicker] Overlay not initialized");
      }
    }

    stop() {
      this.isActive = false;
      if (this.overlay) {
        this.overlay.style.setProperty("display", "none", "important");
        document.body.style.removeProperty("overflow");
      }
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
        this.selectedElement = null;
      }
    }

    cleanup() {
      if (this.overlay) {
        document.body.removeChild(this.overlay);
        this.overlay = null;
      }
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
        this.selectedElement = null;
      }
      document.body.style.removeProperty("overflow");
    }
  }

  // 初始化選取器
  window.gradientPicker = new GradientPicker();
})();
