/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層解析工具類
 */

export class GradientParser {
  /**
   * 解析漸層字符串
   * @param {string} gradientStr - 漸層 CSS 字符串
   * @returns {Object} 解析後的漸層對象
   */
  static parse(gradientStr) {
    if (!gradientStr) {
      return null;
    }

    // 移除前綴
    const cleanGradient = gradientStr.replace(/^-webkit-|-moz-|-ms-|-o-/g, "");

    // 確定漸層類型
    const type = this.getGradientType(cleanGradient);

    // 提取參數
    const paramsStr = cleanGradient.match(/\((.*)\)/)?.[1];
    if (!paramsStr) {
      return null;
    }

    // 解析角度和顏色停止點
    const { angle, colorStops } = this.parseParams(paramsStr, type);

    return {
      type,
      angle,
      colorStops,
    };
  }

  /**
   * 獲取漸層類型
   * @param {string} gradientStr - 漸層字符串
   * @returns {string} 漸層類型
   */
  static getGradientType(gradientStr) {
    if (gradientStr.includes("linear-gradient")) {
      return "linear";
    } else if (gradientStr.includes("radial-gradient")) {
      return "radial";
    } else if (gradientStr.includes("conic-gradient")) {
      return "conic";
    }
    return "unknown";
  }

  /**
   * 解析漸層參數
   * @param {string} paramsStr - 參數字符串
   * @param {string} type - 漸層類型
   * @returns {Object} 解析後的角度和顏色停止點
   */
  static parseParams(paramsStr, type) {
    let angle = null;
    let colorStops = [];

    if (type === "linear") {
      // 解析角度
      const angleMatch = paramsStr.match(/^(to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?|\d+deg)/);
      if (angleMatch) {
        angle = angleMatch[0];
        paramsStr = paramsStr.slice(angleMatch[0].length);
      }
    }

    // 解析顏色停止點
    const colorStopRegex = /(?:rgba?\([^)]+\)|hsla?\([^)]+\)|#[a-f0-9]{3,8}|[a-z]+)(?:\s+\d+%)?/gi;
    let match;
    while ((match = colorStopRegex.exec(paramsStr)) !== null) {
      colorStops.push(match[0]);
    }

    return { angle, colorStops };
  }

  /**
   * 生成標準化的 CSS 漸層代碼
   * @param {Object} gradientObj - 漸層對象
   * @returns {string} CSS 代碼
   */
  static generateCSS(gradientObj) {
    if (!gradientObj) {
      return "";
    }

    const { type, angle, colorStops } = gradientObj;
    let css = "";

    switch (type) {
      case "linear":
        css = `linear-gradient(${angle ? angle + ", " : ""}${colorStops.join(", ")})`;
        break;
      case "radial":
        css = `radial-gradient(${colorStops.join(", ")})`;
        break;
      case "conic":
        css = `conic-gradient(${colorStops.join(", ")})`;
        break;
      default:
        return "";
    }

    return css;
  }

  /**
   * 生成帶瀏覽器前綴的完整 CSS 代碼
   * @param {Object} gradientObj - 漸層對象
   * @returns {string} 完整的 CSS 代碼
   */
  static generateFullCSS(gradientObj) {
    const standardCSS = this.generateCSS(gradientObj);
    if (!standardCSS) {
      return "";
    }

    return `background: -webkit-${standardCSS};\n` + `background: -moz-${standardCSS};\n` + `background: -ms-${standardCSS};\n` + `background: ${standardCSS};`;
  }
}
