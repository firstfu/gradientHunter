/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層解析工具類
 */

class GradientParser {
  /**
   * 解析漸層字符串
   * @param {string} gradientStr - 漸層 CSS 字符串
   * @returns {Object|Array<Object>} 解析後的漸層對象或漸層對象數組
   */
  static parse(gradientStr) {
    if (!gradientStr) {
      return null;
    }

    // 移除前綴
    const cleanGradient = gradientStr.replace(/^-webkit-|-moz-|-ms-|-o-/g, "");

    // 檢查是否為多重漸層
    const multipleGradients = this.splitMultipleGradients(cleanGradient);
    if (multipleGradients.length > 1) {
      return multipleGradients.map(gradient => this.parseSingleGradient(gradient));
    }

    return this.parseSingleGradient(cleanGradient);
  }

  /**
   * 解析單個漸層
   * @param {string} gradientStr - 漸層字符串
   * @returns {Object} 解析後的漸層對象
   */
  static parseSingleGradient(gradientStr) {
    // 確定漸層類型
    const type = this.getGradientType(gradientStr);

    // 提取參數
    const paramsStr = gradientStr.match(/\((.*)\)/)?.[1];
    if (!paramsStr) {
      return null;
    }

    // 解析參數
    const params = this.parseParams(paramsStr, type);

    return {
      type,
      ...params,
    };
  }

  /**
   * 分割多重漸層
   * @param {string} gradientStr - 漸層字符串
   * @returns {Array<string>} 分割後的漸層數組
   */
  static splitMultipleGradients(gradientStr) {
    const gradients = [];
    let depth = 0;
    let start = 0;
    let current = "";

    for (let i = 0; i < gradientStr.length; i++) {
      const char = gradientStr[i];
      if (char === "(") depth++;
      if (char === ")") depth--;
      current += char;

      if (depth === 0 && char === ")") {
        gradients.push(current.trim());
        current = "";
        start = i + 1;
      }
    }

    return gradients.filter(g => g.includes("gradient"));
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
   * @returns {Object} 解析後的參數對象
   */
  static parseParams(paramsStr, type) {
    let params = {};

    if (type === "linear") {
      params = this.parseLinearGradientParams(paramsStr);
    } else if (type === "radial") {
      params = this.parseRadialGradientParams(paramsStr);
    } else if (type === "conic") {
      params = this.parseConicGradientParams(paramsStr);
    }

    return params;
  }

  /**
   * 解析線性漸層參數
   * @param {string} paramsStr - 參數字符串
   * @returns {Object} 解析後的參數對象
   */
  static parseLinearGradientParams(paramsStr) {
    let angle = null;
    let colorStops = [];

    // 解析角度
    const angleMatch = paramsStr.match(/^(to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?|\d+deg)/);
    if (angleMatch) {
      angle = angleMatch[0];
      paramsStr = paramsStr.slice(angleMatch[0].length);
    }

    // 解析顏色停止點
    colorStops = this.parseColorStops(paramsStr);

    return { angle, colorStops };
  }

  /**
   * 解析放射狀漸層參數
   * @param {string} paramsStr - 參數字符串
   * @returns {Object} 解析後的參數對象
   */
  static parseRadialGradientParams(paramsStr) {
    let shape = null;
    let size = null;
    let position = null;
    let colorStops = [];

    // 解析形狀和大小
    const shapeMatch = paramsStr.match(/^(circle|ellipse)?\s*(closest-side|closest-corner|farthest-side|farthest-corner|contain|cover)?/);
    if (shapeMatch) {
      shape = shapeMatch[1] || "ellipse";
      size = shapeMatch[2] || "cover";
      paramsStr = paramsStr.slice(shapeMatch[0].length);
    }

    // 解析位置
    const positionMatch = paramsStr.match(/\s*at\s+(center|top|bottom|left|right|(\d+%|\d+px)(\s+(\d+%|\d+px))?)/);
    if (positionMatch) {
      position = positionMatch[1];
      paramsStr = paramsStr.slice(positionMatch[0].length);
    }

    // 解析顏色停止點
    colorStops = this.parseColorStops(paramsStr);

    return { shape, size, position, colorStops };
  }

  /**
   * 解析錐形漸層參數
   * @param {string} paramsStr - 參數字符串
   * @returns {Object} 解析後的參數對象
   */
  static parseConicGradientParams(paramsStr) {
    let angle = null;
    let position = null;
    let colorStops = [];

    // 解析角度
    const angleMatch = paramsStr.match(/^from\s+(\d+deg)/);
    if (angleMatch) {
      angle = angleMatch[1];
      paramsStr = paramsStr.slice(angleMatch[0].length);
    }

    // 解析位置
    const positionMatch = paramsStr.match(/\s*at\s+(center|top|bottom|left|right|(\d+%|\d+px)(\s+(\d+%|\d+px))?)/);
    if (positionMatch) {
      position = positionMatch[1];
      paramsStr = paramsStr.slice(positionMatch[0].length);
    }

    // 解析顏色停止點
    colorStops = this.parseColorStops(paramsStr);

    return { angle, position, colorStops };
  }

  /**
   * 解析顏色停止點
   * @param {string} str - 顏色停止點字符串
   * @returns {Array<Object>} 顏色停止點數組
   */
  static parseColorStops(str) {
    const colorStops = [];
    const regex = /(?:rgba?\([^)]+\)|hsla?\([^)]+\)|#[a-f0-9]{3,8}|[a-z]+)(?:\s+\d+%)?/gi;
    let match;

    while ((match = regex.exec(str)) !== null) {
      const [fullMatch] = match;
      const colorMatch = fullMatch.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[a-f0-9]{3,8}|[a-z]+)/i);
      const positionMatch = fullMatch.match(/\d+%/);

      colorStops.push({
        color: colorMatch[0],
        position: positionMatch ? positionMatch[0] : null,
      });
    }

    return colorStops;
  }

  /**
   * 生成標準化的 CSS 漸層代碼
   * @param {Object|Array<Object>} gradientObj - 漸層對象或漸層對象數組
   * @returns {string} CSS 代碼
   */
  static generateCSS(gradientObj) {
    if (!gradientObj) {
      return "";
    }

    // 處理多重漸層
    if (Array.isArray(gradientObj)) {
      return gradientObj.map(obj => this.generateSingleGradientCSS(obj)).join(", ");
    }

    return this.generateSingleGradientCSS(gradientObj);
  }

  /**
   * 生成單個漸層的 CSS 代碼
   * @param {Object} gradientObj - 漸層對象
   * @returns {string} CSS 代碼
   */
  static generateSingleGradientCSS(gradientObj) {
    const { type, angle, shape, size, position, colorStops } = gradientObj;

    switch (type) {
      case "linear":
        return `linear-gradient(${angle ? angle + ", " : ""}${this.formatColorStops(colorStops)})`;
      case "radial":
        let radialParams = [];
        if (shape && shape !== "ellipse") radialParams.push(shape);
        if (size && size !== "cover") radialParams.push(size);
        if (position) radialParams.push(`at ${position}`);
        return `radial-gradient(${radialParams.length ? radialParams.join(" ") + ", " : ""}${this.formatColorStops(colorStops)})`;
      case "conic":
        let conicParams = [];
        if (angle) conicParams.push(`from ${angle}`);
        if (position) conicParams.push(`at ${position}`);
        return `conic-gradient(${conicParams.length ? conicParams.join(" ") + ", " : ""}${this.formatColorStops(colorStops)})`;
      default:
        return "";
    }
  }

  /**
   * 格式化顏色停止點
   * @param {Array<Object>} colorStops - 顏色停止點數組
   * @returns {string} 格式化後的顏色停止點字符串
   */
  static formatColorStops(colorStops) {
    return colorStops.map(stop => `${stop.color}${stop.position ? " " + stop.position : ""}`).join(", ");
  }

  /**
   * 生成帶瀏覽器前綴的完整 CSS 代碼
   * @param {Object|Array<Object>} gradientObj - 漸層對象或漸層對象數組
   * @returns {string} 完整的 CSS 代碼
   */
  static generateFullCSS(gradientObj) {
    const standardCSS = this.generateCSS(gradientObj);
    if (!standardCSS) {
      return "";
    }

    return [`-webkit-background: ${standardCSS};`, `-moz-background: ${standardCSS};`, `-ms-background: ${standardCSS};`, `background: ${standardCSS};`].join(
      "\n"
    );
  }
}

// 將類別掛載到全局
window.GradientParser = GradientParser;
