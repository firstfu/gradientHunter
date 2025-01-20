/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層取色器邏輯
 */

class GradientPicker {
  constructor() {
    this.isActive = false;
    this.currentHoverElement = null;
    this.currentCleanup = null;

    // 綁定事件處理器
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    // 初始化時檢查依賴
    this.checkDependencies();
  }

  /**
   * 檢查必要的依賴是否存在
   */
  checkDependencies() {
    const missing = [];
    if (!window.DOMUtils) {
      missing.push("DOMUtils");
    }
    if (!window.GradientParser) {
      missing.push("GradientParser");
    }
    if (missing.length > 0) {
      const error = `Missing required dependencies: ${missing.join(", ")}`;
      console.error(error);
      throw new Error(error);
    }
  }

  /**
   * 啟動取色器
   */
  start() {
    try {
      if (this.isActive) {
        console.log("Picker is already active");
        return true;
      }

      // 再次檢查依賴
      this.checkDependencies();

      console.log("Starting gradient picker...");
      this.isActive = true;
      document.body.style.cursor = "crosshair";

      // 添加事件監聽
      document.addEventListener("mouseover", this.handleMouseOver, true);
      document.addEventListener("mouseout", this.handleMouseOut, true);
      document.addEventListener("click", this.handleClick, true);
      document.addEventListener("keydown", this.handleKeyPress, true);

      console.log("Gradient picker started successfully");
      return true;
    } catch (error) {
      console.error("Failed to start picker:", error);
      this.stop();
      throw error;
    }
  }

  /**
   * 停止取色器
   */
  stop() {
    try {
      if (!this.isActive) {
        return;
      }

      console.log("Stopping gradient picker...");
      this.isActive = false;
      document.body.style.cursor = "";

      // 移除事件監聽
      document.removeEventListener("mouseover", this.handleMouseOver, true);
      document.removeEventListener("mouseout", this.handleMouseOut, true);
      document.removeEventListener("click", this.handleClick, true);
      document.removeEventListener("keydown", this.handleKeyPress, true);

      // 清理當前效果
      if (this.currentCleanup) {
        this.currentCleanup();
        this.currentCleanup = null;
      }

      this.currentHoverElement = null;
      console.log("Gradient picker stopped successfully");
    } catch (error) {
      console.error("Error stopping picker:", error);
    }
  }

  /**
   * 處理滑鼠懸停
   * @param {MouseEvent} event
   */
  handleMouseOver(event) {
    try {
      event.stopPropagation();
      const element = event.target;

      // 如果元素相同，不重複處理
      if (element === this.currentHoverElement) {
        return;
      }

      // 清理之前的效果
      if (this.currentCleanup) {
        this.currentCleanup();
        this.currentCleanup = null;
      }

      // 檢查是否有漸層
      if (window.DOMUtils && window.DOMUtils.hasGradient(element)) {
        console.log("Found gradient element:", element);
        this.currentHoverElement = element;
        this.currentCleanup = window.DOMUtils.addHoverEffect(element);
      }
    } catch (error) {
      console.error("Error handling mouseover:", error);
    }
  }

  /**
   * 處理滑鼠移出
   * @param {MouseEvent} event
   */
  handleMouseOut(event) {
    try {
      event.stopPropagation();

      if (this.currentCleanup) {
        this.currentCleanup();
        this.currentCleanup = null;
      }

      this.currentHoverElement = null;
    } catch (error) {
      console.error("Error handling mouseout:", error);
    }
  }

  /**
   * 處理點擊事件
   * @param {MouseEvent} event
   */
  handleClick(event) {
    try {
      event.preventDefault();
      event.stopPropagation();

      if (!this.currentHoverElement) {
        console.log("No element selected");
        return;
      }

      const gradientStr = window.DOMUtils.getGradient(this.currentHoverElement);
      if (!gradientStr) {
        console.log("No gradient found on selected element");
        return;
      }

      console.log("Found gradient:", gradientStr);

      // 解析漸層
      const gradientObj = window.GradientParser.parse(gradientStr);
      if (!gradientObj) {
        console.error("Failed to parse gradient:", gradientStr);
        return;
      }

      // 生成 CSS
      const css = window.GradientParser.generateCSS(gradientObj);
      console.log("Generated CSS:", css);

      // 發送消息到彈出視窗
      chrome.runtime.sendMessage(
        {
          type: "GRADIENT_PICKED",
          data: {
            gradient: gradientStr,
            css: css,
          },
        },
        response => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
          } else {
            console.log("Message sent successfully:", response);
          }
        }
      );

      // 停止取色器
      this.stop();
    } catch (error) {
      console.error("Error handling click:", error);
    }
  }

  /**
   * 處理鍵盤事件
   * @param {KeyboardEvent} event
   */
  handleKeyPress(event) {
    try {
      // ESC 鍵停止取色器
      if (event.key === "Escape") {
        console.log("Escape pressed, stopping picker");
        this.stop();
      }
    } catch (error) {
      console.error("Error handling keypress:", error);
    }
  }
}

// 創建取色器實例
let picker = null;
try {
  picker = new GradientPicker();
  console.log("GradientPicker initialized successfully");
} catch (error) {
  console.error("Failed to initialize GradientPicker:", error);
}

// 監聽來自彈出視窗的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  try {
    if (message.type === "START_PICKING") {
      console.log("Starting picker...");

      // 如果 picker 未初始化，嘗試重新初始化
      if (!picker) {
        picker = new GradientPicker();
      } else {
        // 強制重置取色器狀態
        picker.stop();
      }

      // 啟動取色器
      const success = picker.start();
      sendResponse({ success, error: null });
      return true;
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});
