// 使用 IIFE 避免全局變量污染
(function () {
  // 漸層選取器的主要類
  class GradientPicker {
    constructor() {
      this.isActive = false;
      this.selectedElement = null;

      // 獲取已注入的 UI 元素
      this.root = document.getElementById("gradient-hunter-root");
      this.overlay = document.getElementById("gradient-hunter-overlay");
      this.toolbar = document.getElementById("gradient-hunter-toolbar");

      if (!this.root || !this.overlay || !this.toolbar) {
        console.error("[GradientPicker] UI 元素未找到");
        return;
      }

      // 保存事件處理函數的引用
      this.boundClickHandler = this.handleClick.bind(this);
      this.boundMessageListener = this.handleMessage.bind(this);

      this.init();
    }

    init() {
      this.bindMessageListener();
      this.bindUIEvents();
    }

    // 綁定 UI 事件
    bindUIEvents() {
      // 綁定按鈕事件
      document.getElementById("gh-close-picker")?.addEventListener("click", () => {
        this.stop();
      });

      // 確認選擇
      document.getElementById("gh-confirm-pick")?.addEventListener("click", () => {
        if (this.selectedElement) {
          console.log("[GradientPicker] 確認選擇按鈕被點擊");
          const gradientInfo = this.extractGradientInfo(this.selectedElement);
          console.log("[GradientPicker] 提取的漸層資訊:", gradientInfo);
          chrome.runtime.sendMessage(
            {
              type: "GRADIENT_SELECTED",
              gradient: gradientInfo,
            },
            response => {
              console.log("[GradientPicker] 發送消息的回應:", response);
            }
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
        console.log("[GradientPicker] 收到開始選取消息");
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
          console.log("[GradientPicker] 找到漸層元素:", element.cloneNode(true));
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
        this.overlay.style.display = "block";
        this.toolbar.style.display = "flex";
      }
    }

    // 停止選取
    stop() {
      if (this.isActive) {
        this.isActive = false;
        document.removeEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "";
        this.overlay.style.display = "none";
        this.toolbar.style.display = "none";

        if (this.selectedElement) {
          this.selectedElement.classList.remove("gradient-hunter-highlight");
          this.selectedElement = null;
        }
      }
    }

    // 清理
    cleanup() {
      console.log("[GradientPicker] 執行清理");
      this.stop();

      // 移除消息監聽器
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
