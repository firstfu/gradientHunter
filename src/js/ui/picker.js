/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層取色器邏輯
 */

class GradientPicker {
  constructor() {
    this.isActive = false;
    this.isSelecting = false;
    this.startPoint = null;
    this.selectionBox = null;
    this.selectedElements = new Set();

    // 綁定事件處理器
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
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
   * 創建選擇框
   */
  createSelectionBox() {
    const box = document.createElement("div");
    box.style.position = "fixed";
    box.style.border = "1px solid #4a90e2";
    box.style.backgroundColor = "rgba(74, 144, 226, 0.1)";
    box.style.pointerEvents = "none";
    box.style.zIndex = "999999";
    return box;
  }

  /**
   * 更新選擇框
   */
  updateSelectionBox(startX, startY, currentX, currentY) {
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;
  }

  /**
   * 獲取選擇區域內的元素
   */
  getElementsInSelection(startX, startY, endX, endY) {
    const elements = [];
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const right = Math.max(startX, endX);
    const bottom = Math.max(startY, endY);

    // 獲取所有元素
    const allElements = document.elementsFromPoint(left + (right - left) / 2, top + (bottom - top) / 2);

    for (const element of allElements) {
      const rect = element.getBoundingClientRect();
      // 檢查元素是否在選擇區域內
      if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) {
        if (window.DOMUtils && window.DOMUtils.hasGradient(element)) {
          elements.push(element);
        }
      }
    }

    return elements;
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
      document.addEventListener("mousedown", this.handleMouseDown, true);
      document.addEventListener("mousemove", this.handleMouseMove, true);
      document.addEventListener("mouseup", this.handleMouseUp, true);
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
      document.removeEventListener("mousedown", this.handleMouseDown, true);
      document.removeEventListener("mousemove", this.handleMouseMove, true);
      document.removeEventListener("mouseup", this.handleMouseUp, true);
      document.removeEventListener("keydown", this.handleKeyPress, true);

      // 清理選擇框
      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox);
      }
      this.selectionBox = null;
      this.startPoint = null;
      this.isSelecting = false;
      this.selectedElements.clear();

      console.log("Gradient picker stopped successfully");
    } catch (error) {
      console.error("Error stopping picker:", error);
    }
  }

  /**
   * 處理滑鼠按下
   */
  handleMouseDown(event) {
    try {
      event.preventDefault();
      event.stopPropagation();

      this.isSelecting = true;
      this.startPoint = { x: event.clientX, y: event.clientY };

      // 創建選擇框
      this.selectionBox = this.createSelectionBox();
      document.body.appendChild(this.selectionBox);
      this.updateSelectionBox(event.clientX, event.clientY, event.clientX, event.clientY);
    } catch (error) {
      console.error("Error handling mousedown:", error);
    }
  }

  /**
   * 處理滑鼠移動
   */
  handleMouseMove(event) {
    try {
      if (!this.isSelecting || !this.startPoint) return;

      event.preventDefault();
      event.stopPropagation();

      // 更新選擇框
      this.updateSelectionBox(this.startPoint.x, this.startPoint.y, event.clientX, event.clientY);
    } catch (error) {
      console.error("Error handling mousemove:", error);
    }
  }

  /**
   * 處理滑鼠放開
   */
  handleMouseUp(event) {
    try {
      if (!this.isSelecting) return;

      event.preventDefault();
      event.stopPropagation();

      // 獲取選擇區域內的元素
      const elements = this.getElementsInSelection(this.startPoint.x, this.startPoint.y, event.clientX, event.clientY);

      // 收集所有漸層
      const gradients = [];
      for (const element of elements) {
        const gradient = window.DOMUtils.getGradient(element);
        if (gradient) {
          gradients.push(gradient);
        }
      }

      // 如果找到漸層，發送消息
      if (gradients.length > 0) {
        chrome.runtime.sendMessage(
          {
            type: "GRADIENT_PICKED",
            data: {
              gradients: gradients,
              css: gradients.map(g => `background: ${g};`).join("\n"),
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
      } else {
        console.log("No gradients found in selection");
      }

      // 清理選擇框
      if (this.selectionBox && this.selectionBox.parentNode) {
        this.selectionBox.parentNode.removeChild(this.selectionBox);
      }
      this.selectionBox = null;
      this.startPoint = null;
      this.isSelecting = false;

      // 停止取色器
      this.stop();
    } catch (error) {
      console.error("Error handling mouseup:", error);
    }
  }

  /**
   * 處理鍵盤事件
   */
  handleKeyPress(event) {
    try {
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
