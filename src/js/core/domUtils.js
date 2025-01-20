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
    try {
      console.log("Checking element for gradient:", element.tagName, {
        id: element.id,
        class: element.className,
      });

      const computedStyle = this.getComputedStyles(element);

      // 檢查所有可能包含漸層的屬性
      const backgroundProps = {
        background: computedStyle.background,
        backgroundImage: computedStyle.backgroundImage,
        // 添加更多可能的屬性
        backgroundColor: computedStyle.backgroundColor,
        backgroundClip: computedStyle.backgroundClip,
        backgroundOrigin: computedStyle.backgroundOrigin,
      };

      console.log("Element background properties:", backgroundProps);

      // 檢查所有可能的漸層類型（包含前綴）
      const gradientTypes = [
        "linear-gradient",
        "radial-gradient",
        "conic-gradient",
        "-webkit-linear-gradient",
        "-webkit-radial-gradient",
        "-webkit-conic-gradient",
        "-moz-linear-gradient",
        "-moz-radial-gradient",
        "-ms-linear-gradient",
        "-ms-radial-gradient",
        "repeating-linear-gradient",
        "repeating-radial-gradient",
        "repeating-conic-gradient",
        // 添加 url() 格式的漸層檢測
        "gradient",
        "-webkit-gradient",
      ];

      // 檢查每個背景屬性
      for (const [propName, propValue] of Object.entries(backgroundProps)) {
        if (!propValue || propValue === "none") continue;

        console.log(`Checking ${propName}:`, propValue);

        // 檢查是否包含任何漸層類型
        for (const type of gradientTypes) {
          if (propValue.includes(type)) {
            console.log(`Found gradient in ${propName}:`, {
              property: propName,
              value: propValue,
              type: type,
            });
            return true;
          }
        }

        // 特殊檢查：檢查 CSS 函數格式
        if (propValue.includes("(") && propValue.includes(")")) {
          console.log(`Found potential CSS function in ${propName}:`, propValue);
        }
      }

      // 如果沒有找到漸層，記錄完整的元素信息
      console.log("No gradient found. Full element details:", {
        tag: element.tagName,
        id: element.id,
        classes: element.className,
        styles: backgroundProps,
        computedStyle: {
          display: computedStyle.display,
          position: computedStyle.position,
          visibility: computedStyle.visibility,
        },
      });

      return false;
    } catch (error) {
      console.error("Error checking gradient:", error);
      console.error("Error details:", {
        element: element,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      return false;
    }
  }

  /**
   * 獲取元素的漸層背景
   * @param {HTMLElement} element - 目標元素
   * @returns {string|null} 漸層背景字符串或 null
   */
  static getGradient(element) {
    try {
      // 檢查元素是否有漸層
      if (!this.hasGradient(element)) {
        console.log("No gradient found on element:", element);
        return null;
      }

      const computedStyle = this.getComputedStyles(element);
      const background = computedStyle.background || computedStyle.backgroundImage;

      console.log("Found background:", background);

      // 提取漸層部分（支援多重漸層和前綴）
      const gradientRegex = /(?:(?:-webkit-|-moz-|-ms-)?(?:repeating-)?(?:linear|radial|conic)-gradient\([^)]+\))/g;
      const gradientMatch = background.match(gradientRegex);

      if (!gradientMatch) {
        console.log("No gradient pattern matched in:", background);
        return null;
      }

      console.log("Matched gradients:", gradientMatch);

      // 如果有多個漸層，返回第一個，並移除瀏覽器前綴
      const gradient = gradientMatch[0].replace(/^-(?:webkit|moz|ms)-/, "");
      console.log("Selected gradient:", gradient);

      return gradient;
    } catch (error) {
      console.error("Error getting gradient:", error);
      return null;
    }
  }

  /**
   * 創建元素懸停效果
   * @param {HTMLElement} element - 目標元素
   */
  static addHoverEffect(element) {
    try {
      const originalOutline = element.style.outline;
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;
      const originalPointerEvents = element.style.pointerEvents;

      // 設置懸停效果
      element.style.outline = "2px solid #4a90e2";
      element.style.position = "relative";
      element.style.zIndex = "999999";
      element.style.pointerEvents = "auto"; // 確保元素可以接收事件

      return () => {
        element.style.outline = originalOutline;
        element.style.position = originalPosition;
        element.style.zIndex = originalZIndex;
        element.style.pointerEvents = originalPointerEvents;
      };
    } catch (error) {
      console.error("Error adding hover effect:", error);
      return () => {};
    }
  }

  /**
   * 移除元素懸停效果
   * @param {Function} cleanup - 清理函數
   */
  static removeHoverEffect(cleanup) {
    try {
      if (typeof cleanup === "function") {
        cleanup();
      }
    } catch (error) {
      console.error("Error removing hover effect:", error);
    }
  }
}

// 將類別掛載到全局
window.DOMUtils = DOMUtils;
console.log("DOMUtils initialized");
