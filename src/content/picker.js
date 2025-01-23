/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的選取器腳本
 */

// 檢查是否已經初始化
if (window.gradientPicker) {
  console.log("Gradient picker already initialized");
} else {
  class GradientPicker {
    constructor() {
      this.isActive = false;
      this.hoveredElement = null;
      this.tooltip = null;
      this.overlay = null;
      this.init();
    }

    init() {
      // 檢查是否已經初始化
      console.log("檢查是否已經初始化");
      if (document.querySelector(".picker-tooltip")) {
        this.tooltip = document.querySelector(".picker-tooltip");
        this.overlay = document.querySelector(".picker-overlay");
      } else {
        // 創建 UI 元素
        this.createTooltip();
        this.createOverlay();
      }

      // 綁定事件監聽器
      this.bindEvents();

      // 初始化時隱藏 UI
      this.deactivate();

      console.log("Gradient Hunter picker initialized");
    }

    createTooltip() {
      console.log("創建懸浮提示元素");

      // 創建懸浮提示元素
      this.tooltip = document.createElement("div");
      this.tooltip.className = "picker-tooltip";
      this.tooltip.innerHTML = `
                    <div class="tooltip-content">
                        <div class="element-info">
                            <span class="element-tag"></span>
                            <span class="element-class"></span>
                        </div>
                        <div class="gradient-preview">
                            <div class="preview-box"></div>
                            <span class="gradient-value"></span>
                        </div>
                    </div>
                    <div class="tooltip-actions">
                        <button class="action-btn pick-btn" title="選取此元素">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            選取
                        </button>
                        <button class="action-btn cancel-btn" title="取消選取">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            取消
                        </button>
                    </div>
                `;
      document.body.appendChild(this.tooltip);

      // 綁定按鈕事件
      this.tooltip.querySelector(".pick-btn").addEventListener("click", () => this.pickElement());
      this.tooltip.querySelector(".cancel-btn").addEventListener("click", () => this.deactivate());
    }

    createOverlay() {
      // 創建選取框
      this.overlay = document.createElement("div");
      this.overlay.className = "picker-overlay";
      this.overlay.innerHTML = `
                    <div class="overlay-border overlay-border-top"></div>
                    <div class="overlay-border overlay-border-right"></div>
                    <div class="overlay-border overlay-border-bottom"></div>
                    <div class="overlay-border overlay-border-left"></div>
                `;
      document.body.appendChild(this.overlay);
    }

    bindEvents() {
      // 移除舊的事件監聽器
      document.removeEventListener("mousemove", this._handleMouseMove);
      document.removeEventListener("keydown", this._handleKeyDown);

      // 創建綁定的事件處理函數
      this._handleMouseMove = this.handleMouseMove.bind(this);
      this._handleKeyDown = this.handleKeyDown.bind(this);

      // 添加新的事件監聽器
      document.addEventListener("mousemove", this._handleMouseMove);
      document.addEventListener("keydown", this._handleKeyDown);
    }

    handleMouseMove(event) {
      if (!this.isActive) return;

      // 獲取滑鼠下的元素
      const element = document.elementFromPoint(event.clientX, event.clientY);
      if (!element || element === this.tooltip || this.tooltip.contains(element)) return;

      // 檢查元素是否有漸層背景
      const gradient = this.getGradient(element);
      if (!gradient) return;

      // 更新懸浮提示
      this.updateTooltip(element, gradient, event);
      // 更新選取框
      this.updateOverlay(element);

      this.hoveredElement = element;
    }

    handleKeyDown(event) {
      if (event.key === "Escape") {
        this.deactivate();
      }
    }

    getGradient(element) {
      const style = window.getComputedStyle(element);
      const properties = [style.background, style.backgroundImage, style.getPropertyValue("background"), style.getPropertyValue("background-image")];

      for (const prop of properties) {
        if (!prop) continue;

        // 檢查是否包含漸層
        if (prop.includes("gradient")) {
          // 匹配所有類型的漸層
          const gradientRegex = /(linear|radial|conic)-gradient\s*\([^)]+\)/g;
          const matches = prop.match(gradientRegex);

          if (matches && matches.length > 0) {
            // 返回第一個找到的漸層
            return matches[0];
          }
        }
      }
      return null;
    }

    updateTooltip(element, gradient, event) {
      // 更新元素資訊
      const tagName = element.tagName.toLowerCase();
      const className = element.className ? `.${element.className.split(" ")[0]}` : "";

      this.tooltip.querySelector(".element-tag").textContent = `<${tagName}>`;
      this.tooltip.querySelector(".element-class").textContent = className;

      // 更新漸層預覽
      this.tooltip.querySelector(".preview-box").style.background = gradient;
      this.tooltip.querySelector(".gradient-value").textContent = gradient;

      // 更新位置，確保提示框不會超出視窗
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = event.clientX;
      let top = event.clientY - tooltipRect.height - 10;

      // 水平方向調整
      if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width - 10;
      }

      // 垂直方向調整
      if (top < 0) {
        top = event.clientY + 10;
      }

      this.tooltip.style.left = left + "px";
      this.tooltip.style.top = top + "px";
    }

    updateOverlay(element) {
      const rect = element.getBoundingClientRect();

      this.overlay.style.left = rect.left + window.scrollX + "px";
      this.overlay.style.top = rect.top + window.scrollY + "px";
      this.overlay.style.width = rect.width + "px";
      this.overlay.style.height = rect.height + "px";
      this.overlay.style.display = "block";
    }

    activate() {
      this.isActive = true;
      document.body.style.cursor = "crosshair";
      this.tooltip.style.display = "block";
      this.overlay.style.display = "block";
    }

    deactivate() {
      this.isActive = false;
      document.body.style.cursor = "";
      this.tooltip.style.display = "none";
      this.overlay.style.display = "none";
      this.hoveredElement = null;
    }

    pickElement() {
      if (!this.hoveredElement) return;

      const gradient = this.getGradient(this.hoveredElement);
      if (!gradient) return;

      // 發送消息到擴充功能
      chrome.runtime.sendMessage({
        type: "GRADIENT_PICKED",
        gradient: gradient,
      });

      this.deactivate();
    }
  }

  // 將實例保存到全局變量
  window.gradientPicker = new GradientPicker();

  // TODO: 監聽來自擴充功能的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ACTIVATE_PICKER") {
      window.gradientPicker.activate();
    }
    return true;
  });
}
