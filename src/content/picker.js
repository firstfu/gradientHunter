// 漸層選取器的主要類
class GradientPicker {
  constructor() {
    console.log("[GradientPicker] Initializing...");
    this.isActive = false;
    this.overlay = null;
    this.selectedElement = null;
    this.init();
  }

  init() {
    console.log("[GradientPicker] Running init...");
    this.createOverlay();
    this.bindMessageListener();
    console.log("[GradientPicker] Initialization complete");
  }

  createOverlay() {
    console.log("[GradientPicker] Creating overlay...");

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
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.3);
            z-index: 2147483646;
            cursor: crosshair;
            display: none;
        }

        .gradient-hunter-toolbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #FFFFFF;
            border-radius: 8px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2147483647;
        }

        .gh-button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .gh-button:hover {
            opacity: 0.9;
        }

        #gh-close-picker {
            background: #f44336;
            color: white;
        }

        #gh-confirm-pick {
            background: #4CAF50;
            color: white;
        }

        .gh-instructions {
            color: #333;
            font-size: 14px;
            font-weight: 500;
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
    console.log("[GradientPicker] Overlay created and added to page");

    // 綁定事件
    this.bindEvents();
  }

  bindEvents() {
    console.log("[GradientPicker] Binding events...");

    // 滑鼠移動事件
    this.overlay.addEventListener("mousemove", e => {
      const element = document.elementFromPoint(e.clientX, e.clientY);

      // 移除之前的高亮
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
      }

      // 檢查元素是否包含漸層
      if (this.hasGradient(element)) {
        this.selectedElement = element;
        element.classList.add("gradient-hunter-highlight");
      }
    });

    // 點擊事件
    this.overlay.addEventListener("click", e => {
      const element = document.elementFromPoint(e.clientX, e.clientY);

      if (this.hasGradient(element)) {
        this.selectedElement = element;
        element.classList.add("gradient-hunter-highlight");
      }
    });

    // 關閉按鈕事件
    document.getElementById("gh-close-picker").addEventListener("click", () => {
      console.log("[GradientPicker] Close button clicked");
      this.stop();
    });

    // 確認選擇按鈕事件
    document.getElementById("gh-confirm-pick").addEventListener("click", () => {
      console.log("[GradientPicker] Confirm button clicked");
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
    console.log("[GradientPicker] Binding message listener...");
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[GradientPicker] Received message:", message);
      if (message.type === "START_PICKER" || message.type === "ACTIVATE_PICKER") {
        this.start();
        sendResponse({ success: true });
      }
    });
  }

  hasGradient(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const hasGradient = style.backgroundImage.includes("gradient");
    console.log("[GradientPicker] Checking gradient for element:", element, hasGradient);
    return hasGradient;
  }

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
    console.log("[GradientPicker] Starting picker...");
    this.isActive = true;
    this.overlay.style.display = "block";
  }

  stop() {
    console.log("[GradientPicker] Stopping picker...");
    this.isActive = false;
    this.overlay.style.display = "none";
    if (this.selectedElement) {
      this.selectedElement.classList.remove("gradient-hunter-highlight");
      this.selectedElement = null;
    }
  }
}

// 初始化選取器
console.log("[GradientPicker] Creating instance...");
const gradientPicker = new GradientPicker();
console.log("[GradientPicker] Instance created");
