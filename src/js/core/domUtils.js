/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: DOM 操作工具類
 */

class DOMUtils {
  /**
   * 獲取元素的計算樣式
   * @param {HTMLElement} element - 目標元素
   * @returns {CSSStyleDeclaration} 計算後的樣式對象
   */
  static getComputedStyles(element) {
    return window.getComputedStyle(element);
  }

  /**
   * 檢查元素是否包含漸層背景
   * @param {HTMLElement} element - 目標元素
   * @returns {boolean} 是否包含漸層
   */
  static hasGradient(element) {
    const computedStyle = this.getComputedStyles(element);
    const background = computedStyle.background || computedStyle.backgroundImage;
    return background.includes("gradient");
  }

  /**
   * 獲取元素的漸層背景
   * @param {HTMLElement} element - 目標元素
   * @returns {string|null} 漸層背景字符串或 null
   */
  static getGradient(element) {
    const computedStyle = this.getComputedStyles(element);
    const background = computedStyle.background || computedStyle.backgroundImage;

    if (!this.hasGradient(element)) {
      return null;
    }

    // 提取漸層部分
    const gradientMatch = background.match(/(?:linear|radial|conic)-gradient\([^)]+\)/g);
    return gradientMatch ? gradientMatch[0] : null;
  }

  /**
   * 創建元素懸停效果
   * @param {HTMLElement} element - 目標元素
   */
  static addHoverEffect(element) {
    const originalOutline = element.style.outline;
    const originalPosition = element.style.position;

    element.style.outline = "2px solid #4a90e2";
    element.style.position = "relative";

    return () => {
      element.style.outline = originalOutline;
      element.style.position = originalPosition;
    };
  }

  /**
   * 移除元素懸停效果
   * @param {Function} cleanup - 清理函數
   */
  static removeHoverEffect(cleanup) {
    if (typeof cleanup === "function") {
      cleanup();
    }
  }
}

// 將類別掛載到全局
window.DOMUtils = DOMUtils;
