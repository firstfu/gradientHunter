/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: 漸層編輯器邏輯
 */

import { GradientParser } from "../core/gradientParser.js";

class GradientEditor {
  constructor() {
    this.initializeElements();
    this.initializeState();
    this.initializeEventListeners();
    this.initializeTemplates();
    this.updateUI();
  }

  /**
   * 初始化 DOM 元素引用
   */
  initializeElements() {
    // 預覽
    this.preview = document.getElementById("gradientPreview");

    // 類型選擇
    this.typeButtons = {
      linear: document.getElementById("linearType"),
      radial: document.getElementById("radialType"),
      conic: document.getElementById("conicType"),
    };

    // 控制面板
    this.controls = {
      linear: document.getElementById("linearControls"),
      radial: document.getElementById("radialControls"),
      conic: document.getElementById("conicControls"),
    };

    // 線性漸層控制
    this.angleSlider = document.getElementById("angleSlider");
    this.angleInput = document.getElementById("angleInput");

    // 放射狀漸層控制
    this.shapeSelect = document.getElementById("shapeSelect");
    this.sizeSelect = document.getElementById("sizeSelect");

    // 錐形漸層控制
    this.conicAngleSlider = document.getElementById("conicAngleSlider");
    this.conicAngleInput = document.getElementById("conicAngleInput");

    // 顏色停止點
    this.colorStopsEditor = document.getElementById("colorStopsEditor");
    this.colorStopsTrack = this.colorStopsEditor.querySelector(".color-stops-track");
    this.colorStopsGradient = this.colorStopsEditor.querySelector(".color-stops-gradient");
    this.colorStopsThumbs = this.colorStopsEditor.querySelector(".color-stops-thumbs");
    this.addColorStopBtn = document.getElementById("addColorStop");
    this.removeColorStopBtn = document.getElementById("removeColorStop");

    // 選中的顏色停止點編輯
    this.colorInput = document.getElementById("colorInput");
    this.positionInput = document.getElementById("positionInput");

    // CSS 輸出
    this.prefixToggle = document.getElementById("prefixToggle");
    this.cssOutput = document.getElementById("cssOutput");
    this.copyCodeBtn = document.getElementById("copyCode");

    // 模板
    this.templateGrid = document.getElementById("templateGrid");
  }

  /**
   * 初始化編輯器狀態
   */
  initializeState() {
    this.state = {
      type: "linear",
      angle: 90,
      shape: "ellipse",
      size: "farthest-corner",
      position: "center",
      conicAngle: 0,
      colorStops: [
        { color: "#4a90e2", position: 0 },
        { color: "#2c3e50", position: 100 },
      ],
      selectedStop: null,
      isDragging: false,
    };
  }

  /**
   * 初始化事件監聽器
   */
  initializeEventListeners() {
    // 類型切換
    Object.entries(this.typeButtons).forEach(([type, button]) => {
      button.addEventListener("click", () => this.setType(type));
    });

    // 角度控制
    this.angleSlider.addEventListener("input", e => this.setAngle(e.target.value));
    this.angleInput.addEventListener("change", e => this.setAngle(e.target.value));

    // 放射狀漸層控制
    this.shapeSelect.addEventListener("change", e => this.setShape(e.target.value));
    this.sizeSelect.addEventListener("change", e => this.setSize(e.target.value));

    // 錐形漸層控制
    this.conicAngleSlider.addEventListener("input", e => this.setConicAngle(e.target.value));
    this.conicAngleInput.addEventListener("change", e => this.setConicAngle(e.target.value));

    // 顏色停止點控制
    this.addColorStopBtn.addEventListener("click", () => this.addColorStop());
    this.removeColorStopBtn.addEventListener("click", () => this.removeSelectedStop());

    // 顏色停止點編輯
    this.colorInput.addEventListener("input", e => this.updateSelectedStopColor(e.target.value));
    this.positionInput.addEventListener("input", e => this.updateSelectedStopPosition(e.target.value));

    // 顏色停止點拖曳
    this.colorStopsEditor.addEventListener("mousedown", e => this.startDragging(e));
    document.addEventListener("mousemove", e => this.handleDragging(e));
    document.addEventListener("mouseup", () => this.stopDragging());

    // CSS 輸出控制
    this.prefixToggle.addEventListener("change", () => this.updateCSS());
    this.copyCodeBtn.addEventListener("click", () => this.copyCSS());
  }

  /**
   * 初始化漸層模板
   */
  initializeTemplates() {
    const templates = [
      {
        name: "Blue to Purple",
        gradient: {
          type: "linear",
          angle: 45,
          colorStops: [
            { color: "#4a90e2", position: 0 },
            { color: "#9b59b6", position: 100 },
          ],
        },
      },
      {
        name: "Sunset",
        gradient: {
          type: "linear",
          angle: 0,
          colorStops: [
            { color: "#ff7e5f", position: 0 },
            { color: "#feb47b", position: 100 },
          ],
        },
      },
      {
        name: "Rainbow",
        gradient: {
          type: "linear",
          angle: 90,
          colorStops: [
            { color: "#ff0000", position: 0 },
            { color: "#ff8000", position: 20 },
            { color: "#ffff00", position: 40 },
            { color: "#00ff00", position: 60 },
            { color: "#0000ff", position: 80 },
            { color: "#8000ff", position: 100 },
          ],
        },
      },
    ];

    templates.forEach(template => {
      const item = document.createElement("div");
      item.className = "template-item";
      item.style.background = GradientParser.generateCSS(template.gradient);
      item.title = template.name;
      item.addEventListener("click", () => this.applyTemplate(template.gradient));
      this.templateGrid.appendChild(item);
    });
  }

  /**
   * 設置漸層類型
   * @param {string} type - 漸層類型
   */
  setType(type) {
    this.state.type = type;

    // 更新按鈕狀態
    Object.entries(this.typeButtons).forEach(([t, button]) => {
      button.classList.toggle("active", t === type);
    });

    // 更新控制面板顯示
    Object.entries(this.controls).forEach(([t, control]) => {
      control.classList.toggle("hidden", t !== type);
    });

    this.updateUI();
  }

  /**
   * 設置線性漸層角度
   * @param {number} angle - 角度值
   */
  setAngle(angle) {
    this.state.angle = parseInt(angle, 10);
    this.angleSlider.value = this.state.angle;
    this.angleInput.value = this.state.angle;
    this.updateUI();
  }

  /**
   * 設置放射狀漸層形狀
   * @param {string} shape - 形狀
   */
  setShape(shape) {
    this.state.shape = shape;
    this.updateUI();
  }

  /**
   * 設置放射狀漸層大小
   * @param {string} size - 大小
   */
  setSize(size) {
    this.state.size = size;
    this.updateUI();
  }

  /**
   * 設置錐形漸層起始角度
   * @param {number} angle - 角度值
   */
  setConicAngle(angle) {
    this.state.conicAngle = parseInt(angle, 10);
    this.conicAngleSlider.value = this.state.conicAngle;
    this.conicAngleInput.value = this.state.conicAngle;
    this.updateUI();
  }

  /**
   * 添加顏色停止點
   */
  addColorStop() {
    const lastStop = this.state.colorStops[this.state.colorStops.length - 1];
    const newPosition = Math.min(lastStop.position + 10, 100);

    this.state.colorStops.push({
      color: "#000000",
      position: newPosition,
    });

    this.updateUI();
  }

  /**
   * 移除選中的顏色停止點
   */
  removeSelectedStop() {
    if (this.state.selectedStop !== null && this.state.colorStops.length > 2) {
      this.state.colorStops.splice(this.state.selectedStop, 1);
      this.state.selectedStop = null;
      this.updateUI();
    }
  }

  /**
   * 更新選中停止點的顏色
   * @param {string} color - 顏色值
   */
  updateSelectedStopColor(color) {
    if (this.state.selectedStop !== null) {
      this.state.colorStops[this.state.selectedStop].color = color;
      this.updateUI();
    }
  }

  /**
   * 更新選中停止點的位置
   * @param {number} position - 位置值
   */
  updateSelectedStopPosition(position) {
    if (this.state.selectedStop !== null) {
      this.state.colorStops[this.state.selectedStop].position = parseInt(position, 10);
      this.updateUI();
    }
  }

  /**
   * 開始拖曳顏色停止點
   * @param {MouseEvent} event - 滑鼠事件
   */
  startDragging(event) {
    const thumb = event.target.closest(".color-stop-thumb");
    if (!thumb) return;

    this.state.isDragging = true;
    this.state.selectedStop = parseInt(thumb.dataset.index, 10);
    this.updateSelectedStopUI();
  }

  /**
   * 處理顏色停止點拖曳
   * @param {MouseEvent} event - 滑鼠事件
   */
  handleDragging(event) {
    if (!this.state.isDragging) return;

    const rect = this.colorStopsTrack.getBoundingClientRect();
    const position = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));

    this.updateSelectedStopPosition(position);
  }

  /**
   * 停止拖曳
   */
  stopDragging() {
    this.state.isDragging = false;
  }

  /**
   * 應用漸層模板
   * @param {Object} template - 漸層模板
   */
  applyTemplate(template) {
    Object.assign(this.state, template);
    this.setType(template.type);
    this.updateUI();
  }

  /**
   * 更新 UI
   */
  updateUI() {
    this.updatePreview();
    this.updateColorStopsUI();
    this.updateSelectedStopUI();
    this.updateCSS();
  }

  /**
   * 更新預覽
   */
  updatePreview() {
    const gradient = this.generateGradient();
    this.preview.style.background = gradient;
    this.colorStopsGradient.style.background = gradient;
  }

  /**
   * 更新顏色停止點 UI
   */
  updateColorStopsUI() {
    // 清空現有的停止點
    this.colorStopsThumbs.innerHTML = "";

    // 創建新的停止點
    this.state.colorStops.forEach((stop, index) => {
      const thumb = document.createElement("div");
      thumb.className = "color-stop-thumb";
      thumb.style.left = `${stop.position}%`;
      thumb.style.color = stop.color;
      thumb.dataset.index = index;

      if (index === this.state.selectedStop) {
        thumb.classList.add("active");
      }

      this.colorStopsThumbs.appendChild(thumb);
    });

    // 更新刪除按鈕狀態
    this.removeColorStopBtn.disabled = this.state.selectedStop === null || this.state.colorStops.length <= 2;
  }

  /**
   * 更新選中的顏色停止點 UI
   */
  updateSelectedStopUI() {
    if (this.state.selectedStop !== null) {
      const stop = this.state.colorStops[this.state.selectedStop];
      this.colorInput.value = stop.color;
      this.positionInput.value = stop.position;
    }
  }

  /**
   * 更新 CSS 輸出
   */
  updateCSS() {
    const gradient = this.generateGradient();
    const css = this.prefixToggle.checked
      ? GradientParser.generateFullCSS({ type: this.state.type, ...this.generateGradientParams() })
      : `background: ${gradient};`;

    this.cssOutput.textContent = css;
  }

  /**
   * 生成漸層參數
   * @returns {Object} 漸層參數
   */
  generateGradientParams() {
    const params = {
      colorStops: this.state.colorStops,
    };

    switch (this.state.type) {
      case "linear":
        params.angle = `${this.state.angle}deg`;
        break;
      case "radial":
        params.shape = this.state.shape;
        params.size = this.state.size;
        params.position = this.state.position;
        break;
      case "conic":
        params.angle = `${this.state.conicAngle}deg`;
        params.position = this.state.position;
        break;
    }

    return params;
  }

  /**
   * 生成漸層字符串
   * @returns {string} 漸層字符串
   */
  generateGradient() {
    return GradientParser.generateCSS({
      type: this.state.type,
      ...this.generateGradientParams(),
    });
  }

  /**
   * 複製 CSS 代碼
   */
  async copyCSS() {
    try {
      await navigator.clipboard.writeText(this.cssOutput.textContent);
      const originalText = this.copyCodeBtn.innerHTML;
      this.copyCodeBtn.innerHTML = '<span class="icon">✓</span>Copied!';
      setTimeout(() => {
        this.copyCodeBtn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy CSS:", error);
    }
  }
}

// 初始化編輯器
new GradientEditor();
