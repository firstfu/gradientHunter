/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層取色器邏輯
 */

import { DOMUtils } from "../core/domUtils.js";
import { GradientParser } from "../core/gradientParser.js";

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
  }

  /**
   * 啟動取色器
   */
  start() {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    document.body.style.cursor = "crosshair";

    // 添加事件監聽
    document.addEventListener("mouseover", this.handleMouseOver, true);
    document.addEventListener("mouseout", this.handleMouseOut, true);
    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("keydown", this.handleKeyPress, true);
  }

  /**
   * 停止取色器
   */
  stop() {
    if (!this.isActive) {
      return;
    }

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
  }

  /**
   * 處理滑鼠懸停
   * @param {MouseEvent} event
   */
  handleMouseOver(event) {
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
    if (DOMUtils.hasGradient(element)) {
      this.currentHoverElement = element;
      this.currentCleanup = DOMUtils.addHoverEffect(element);
    }
  }

  /**
   * 處理滑鼠移出
   * @param {MouseEvent} event
   */
  handleMouseOut(event) {
    event.stopPropagation();

    if (this.currentCleanup) {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    this.currentHoverElement = null;
  }

  /**
   * 處理點擊事件
   * @param {MouseEvent} event
   */
  handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.currentHoverElement) {
      return;
    }

    const gradientStr = DOMUtils.getGradient(this.currentHoverElement);
    if (!gradientStr) {
      return;
    }

    // 解析漸層
    const gradientObj = GradientParser.parse(gradientStr);
    if (!gradientObj) {
      return;
    }

    // 生成 CSS
    const css = GradientParser.generateFullCSS(gradientObj);

    // 發送消息到彈出視窗
    chrome.runtime.sendMessage({
      type: "GRADIENT_PICKED",
      data: {
        gradient: gradientStr,
        css: css,
      },
    });

    // 停止取色器
    this.stop();
  }

  /**
   * 處理鍵盤事件
   * @param {KeyboardEvent} event
   */
  handleKeyPress(event) {
    // ESC 鍵停止取色器
    if (event.key === "Escape") {
      this.stop();
    }
  }
}

// 創建取色器實例
const picker = new GradientPicker();

// 監聽來自彈出視窗的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_PICKING") {
    picker.start();
  }
});
