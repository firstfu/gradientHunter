// 使用 IIFE 避免全局變量污染
(function () {
  // 顏色工具類
  class ColorUtils {
    // RGB 字串轉換為物件
    static parseRGB(rgb) {
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }

    // RGB 轉 HEX
    static rgbToHex(rgb) {
      const color = this.parseRGB(rgb);
      if (!color) return rgb;
      const r = color.r.toString(16).padStart(2, "0");
      const g = color.g.toString(16).padStart(2, "0");
      const b = color.b.toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }

    // RGB 轉 HSL
    static rgbToHSL(rgb) {
      const color = this.parseRGB(rgb);
      if (!color) return rgb;

      const r = color.r / 255;
      const g = color.g / 255;
      const b = color.b / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h,
        s,
        l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    // 檢查顏色格式
    static getColorFormat(color) {
      if (color.startsWith("#")) return "hex";
      if (color.startsWith("rgb")) return "rgb";
      if (color.startsWith("hsl")) return "hsl";
      return "other";
    }

    // 轉換顏色格式
    static convertColor(color, targetFormat) {
      const currentFormat = this.getColorFormat(color);

      // 如果已經是目標格式，直接返回
      if (currentFormat === targetFormat) return color;

      // 根據目標格式轉換
      switch (targetFormat) {
        case "hex":
          return this.rgbToHex(color);
        case "hsl":
          return this.rgbToHSL(color);
        default:
          return color;
      }
    }

    // 獲取常用顏色名稱
    static getColorName(color) {
      const colorNames = {
        "#ff0000": "紅色",
        "#00ff00": "綠色",
        "#0000ff": "藍色",
        "#ffff00": "黃色",
        "#ff00ff": "洋紅",
        "#00ffff": "青色",
        "#000000": "黑色",
        "#ffffff": "白色",
      };

      // 轉換為 hex 格式進行比對
      const hexColor = this.rgbToHex(color);
      return colorNames[hexColor.toLowerCase()] || null;
    }

    // 判斷顏色是否為預設顏色名稱
    static isNamedColor(color) {
      const div = document.createElement("div");
      div.style.color = color;
      return div.style.color !== "";
    }
  }

  // 漸層選取器的主要類
  class GradientPicker {
    constructor() {
      this.isActive = false;
      this.currentColorFormat = "rgb"; // 預設顏色格式

      // 獲取已注入的 UI 元素
      this.root = document.getElementById("gradient-hunter-root");
      this.overlay = document.getElementById("gradient-hunter-overlay");
      this.toolbar = document.getElementById("gradient-hunter-toolbar");

      if (!this.root || !this.overlay || !this.toolbar) {
        console.error("[GradientPicker] UI 元素未找到");
        return;
      }

      // 初始化圖片分析器和狀態
      this.imageAnalyzer = new ImageGradientAnalyzer();
      this.isImageMode = false;

      // 其他狀態初始化
      this.selectedElement = null;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };

      // 保存事件處理函數的引用
      this.boundClickHandler = this.handleClick.bind(this);
      this.boundMessageListener = this.handleMessage.bind(this);
      this.boundMouseDownHandler = this.handleMouseDown.bind(this);
      this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
      this.boundMouseUpHandler = this.handleMouseUp.bind(this);

      this.init();
    }

    init() {
      this.bindMessageListener();
      this.bindUIEvents();
      this.initDraggable();

      // 初始化時就顯示引導 UI
      this.updateGradientUI(null);
    }

    // 初始化拖動功能
    initDraggable() {
      // 確保工具列可以被拖曳
      this.toolbar.style.position = "fixed";
      this.toolbar.style.cursor = "move";
      this.toolbar.style.userSelect = "none";

      this.toolbar.addEventListener("mousedown", this.boundMouseDownHandler);
      document.addEventListener("mousemove", this.boundMouseMoveHandler);
      document.addEventListener("mouseup", this.boundMouseUpHandler);
    }

    // 處理滑鼠按下事件
    handleMouseDown(e) {
      // 如果點擊的是按鈕，不處理拖動
      if (e.target.closest(".gh-button")) {
        return;
      }

      e.preventDefault(); // 防止文字選取
      this.isDragging = true;
      this.toolbar.classList.add("dragging");

      // 計算滑鼠點擊位置與工具欄的相對位置
      const toolbarRect = this.toolbar.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - toolbarRect.left,
        y: e.clientY - toolbarRect.top,
      };
    }

    // 處理滑鼠移動事件
    handleMouseMove(e) {
      if (!this.isDragging) return;

      e.preventDefault();

      // 計算新位置，確保不超出視窗範圍
      const x = Math.max(0, Math.min(e.clientX - this.dragOffset.x, window.innerWidth - this.toolbar.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - this.dragOffset.y, window.innerHeight - this.toolbar.offsetHeight));

      // 更新工具欄位置
      this.toolbar.style.left = `${x}px`;
      this.toolbar.style.top = `${y}px`;
    }

    // 處理滑鼠放開事件
    handleMouseUp(e) {
      if (!this.isDragging) return;

      e.preventDefault();
      this.isDragging = false;
      this.toolbar.classList.remove("dragging");
    }

    // 綁定 UI 事件
    bindUIEvents() {
      // 綁定按鈕事件
      document.getElementById("gh-close-picker")?.addEventListener("click", () => {
        this.stop();
      });

      // 綁定複製按鈕事件
      document.querySelector(".gh-copy-btn")?.addEventListener("click", async () => {
        const codeBlock = document.querySelector(".gh-code-block code");
        if (codeBlock) {
          try {
            await navigator.clipboard.writeText(codeBlock.textContent);
            // 可以添加複製成功的視覺反饋
            const copyBtn = document.querySelector(".gh-copy-btn");
            copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0015.172 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2"/>
                <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2"/>
              </svg>`;
            }, 2000);
          } catch (err) {
            console.error(chrome.i18n.getMessage("copyFailed"), err);
          }
        }
      });

      // 確認選擇
      document.getElementById("gh-confirm-pick")?.addEventListener("click", () => {
        if (this.selectedElement) {
          const gradientInfo = this.extractGradientInfo(this.selectedElement);
          chrome.runtime.sendMessage(
            {
              type: "GRADIENT_SELECTED",
              gradient: gradientInfo,
            },
            response => {}
          );
          this.stop();
        }
      });
    }

    // 綁定消息監聽器
    bindMessageListener() {
      // 移除舊的監聽器
      chrome.runtime.onMessage.removeListener(this.boundMessageListener);
      // 添加新的監聽器
      chrome.runtime.onMessage.addListener(this.boundMessageListener);
    }

    // 處理消息
    handleMessage(message, sender, sendResponse) {
      if (message.type === "START_PICKER" || message.type === "ACTIVATE_PICKER") {
        this.start();
        sendResponse({ success: true });
      } else if (message.type === "STOP_PICKER") {
        this.stop();
        sendResponse({ success: true });
      }
      return true;
    }

    // 處理點擊事件
    handleClick = e => {
      // 如果點擊的是工具欄或其子元素，不處理該事件
      if (e.target.closest("#gradient-hunter-toolbar")) {
        return;
      }

      // 阻止事件傳播和默認行為
      e.preventDefault();
      e.stopPropagation();

      // 確保事件物件存在
      if (!e) {
        console.error("[GradientPicker] 沒有收到事件物件");
        return;
      }

      // 獲取點擊位置下的所有元素
      const elements = document.elementsFromPoint(e.clientX, e.clientY);

      // 移除之前的高亮
      if (this.selectedElement) {
        this.selectedElement.classList.remove("gradient-hunter-highlight");
        this.isImageMode = false;
      }

      // 遍歷元素列表，找到第一個具有漸層的元素
      for (const element of elements) {
        // 跳過工具欄相關元素
        if (element.closest("#gradient-hunter-root")) {
          continue;
        }

        // 檢查是否為圖片元素
        if (element.tagName === "IMG") {
          this.handleImageElement(element);
          return;
        }

        if (this.hasGradient(element)) {
          this.selectedElement = element;
          const gradientInfo = this.extractGradientInfo(element);
          this.updateGradientUI(gradientInfo);
          element.classList.add("gradient-hunter-highlight");
          return;
        }
      }

      // 如果沒有找到漸層元素，顯示提示訊息
      if (!this.isImageMode) {
        this.showImageUploadUI();
      }
      this.selectedElement = null;
    };

    // 處理圖片元素
    async handleImageElement(element) {
      this.selectedElement = element;
      this.isImageMode = true;
      element.classList.add("gradient-hunter-highlight");

      try {
        const gradientInfo = await this.imageAnalyzer.analyzeGradient(element);
        this.updateGradientUI({
          ...gradientInfo,
          isImage: true,
          imageElement: element,
        });
      } catch (error) {
        console.error("分析圖片時發生錯誤:", error);
        this.updateGradientUI({ notFound: true });
      }
    }

    // 顯示圖片上傳 UI
    showImageUploadUI() {
      this.isImageMode = true;
      const previewSection = document.querySelector(".gh-preview-section");
      if (!previewSection) return;

      const preview = previewSection.querySelector(".gh-gradient-preview");
      if (!preview) return;

      preview.innerHTML = `
        <div class="gh-image-drop-zone" id="gh-image-drop-zone">
          <input type="file" accept="image/*" id="gh-image-input" />
          <div class="gh-image-drop-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="gh-image-drop-text">
            ${chrome.i18n.getMessage("dragImageHere") || "拖放圖片到這裡"} 或 <strong>${chrome.i18n.getMessage("clickToUpload") || "點擊上傳"}</strong>
          </p>
        </div>
      `;

      this.bindImageUploadEvents();
    }

    // 綁定圖片上傳相關事件
    bindImageUploadEvents() {
      const dropZone = document.getElementById("gh-image-drop-zone");
      const fileInput = document.getElementById("gh-image-input");
      if (!dropZone || !fileInput) return;

      dropZone.addEventListener("dragover", e => {
        e.preventDefault();
        dropZone.classList.add("dragging");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
      });

      dropZone.addEventListener("drop", e => {
        e.preventDefault();
        dropZone.classList.remove("dragging");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleImageFile(files[0]);
        }
      });

      fileInput.addEventListener("change", e => {
        if (e.target.files.length > 0) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    // 處理圖片文件
    handleImageFile(file) {
      if (!file.type.startsWith("image/")) {
        console.error("不是有效的圖片文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          this.handleImageElement(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // 檢查元素是否包含漸層
    hasGradient(element) {
      if (!element) return false;

      // 暫時移除 highlight class 以獲取原始樣式
      const hasHighlight = element.classList.contains("gradient-hunter-highlight");
      if (hasHighlight) {
        element.classList.remove("gradient-hunter-highlight");
      }

      const style = window.getComputedStyle(element);

      // 檢查各種可能的漸層屬性
      const hasGradient = style.backgroundImage.includes("gradient") || style.background.includes("gradient");

      // 如果之前有 highlight class，則加回去
      if (hasHighlight) {
        element.classList.add("gradient-hunter-highlight");
      }

      return hasGradient;
    }

    extractGradientInfo(element) {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;

      // 解析漸層資訊
      let gradient = {
        type: "linear", // 預設為線性漸層
        angle: "180deg", // 預設角度
        stops: [],
      };

      if (backgroundImage.includes("gradient")) {
        const match = backgroundImage.match(/(\w+-gradient)\((.*)\)/);
        if (match) {
          // 確定漸層類型
          gradient.type = match[1].split("-")[0];

          // 解析參數
          const params = match[2].split(/,(?![^(]*\))/);

          // 檢查第一個參數是否包含位置資訊（例如：from 180deg at 50% 50%）
          if (params[0].includes("from") || params[0].includes("at")) {
            gradient.angle = params[0].trim();
            params.shift();
          } else if (params[0].includes("deg")) {
            gradient.angle = params[0].trim();
            params.shift();
          }

          // 解析顏色停駐點
          gradient.stops = params.map(stop => {
            stop = stop.trim();

            // 檢查是否有位置資訊
            const posMatch = stop.match(/(.*?)(?:\s+(\d+%|\d+px|\d+em|center|top|bottom|left|right))?$/);

            if (posMatch) {
              const color = posMatch[1].trim();
              const colorInfo = {
                original: color,
                rgb: color,
                hex: ColorUtils.convertColor(color, "hex"),
                hsl: ColorUtils.convertColor(color, "hsl"),
                name: ColorUtils.isNamedColor(color) ? color : ColorUtils.getColorName(color),
              };

              return {
                color: colorInfo,
                position: posMatch[2] || null,
              };
            }

            return {
              color: { original: stop, rgb: stop },
              position: null,
            };
          });
        }
      }

      return {
        gradient: gradient,
        originalValue: backgroundImage,
        element: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
        },
      };
    }

    // 更新 UI 顯示漸層資訊
    updateGradientUI(gradientInfo) {
      const previewSection = document.querySelector(".gh-preview-section");
      const colorStops = document.querySelector(".gh-color-stops");
      const codeBlock = document.querySelector(".gh-code-block code");

      if (!previewSection) return;

      // 如果是圖片模式且有漸層資訊
      if (gradientInfo?.isImage && gradientInfo?.imageElement) {
        const preview = previewSection.querySelector(".gh-gradient-preview");
        if (preview) {
          preview.innerHTML = `
            <div class="gh-image-preview">
              <img src="${gradientInfo.imageElement.src}" alt="Selected image" />
              <div class="gh-image-overlay">
                <button class="gh-image-action gh-copy-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0015.172 2H10a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" stroke="currentColor" stroke-width="2"/>
                  </svg>
                  複製漸層
                </button>
              </div>
            </div>
          `;
        }
      }

      if (previewSection) {
        // 更新預覽
        const preview = previewSection.querySelector(".gh-gradient-preview");

        if (!gradientInfo || gradientInfo.notFound) {
          // 初始狀態或未找到漸層時的 UI
          const message = gradientInfo?.notFound
            ? `
              <div class="gh-empty-state">
                <div class="gh-empty-state-content">
                  <div class="gh-empty-state-text">
                    <h2>${chrome.i18n.getMessage("noGradientFound")}</h2>
                    <p>${chrome.i18n.getMessage("tryOtherElement")}</p>
                  </div>
                  <div class="gh-empty-state-tips">
                    <span class="gh-tip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      ${chrome.i18n.getMessage("checkGradientStyle")}
                    </span>
                    <span class="gh-tip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      ${chrome.i18n.getMessage("tryClickOther")}
                    </span>
                  </div>
                </div>
              </div>
            `
            : `
              <div class="gh-empty-state">
                <div class="gh-empty-state-content">
                  <div class="gh-empty-state-text">
                    <h2>${chrome.i18n.getMessage("clickAnyGradient")}</h2>
                    <p>${chrome.i18n.getMessage("findGradientDescription")}</p>
                  </div>
                  <div class="gh-empty-state-tips">
                    <span class="gh-tip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      ${chrome.i18n.getMessage("supportMultipleTypes")}
                    </span>
                    <span class="gh-tip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                      ${chrome.i18n.getMessage("oneClickCopy")}
                    </span>
                  </div>
                </div>
              </div>
            `;

          preview.innerHTML = message;

          // 更新漸層資訊為引導文字
          const info = previewSection.querySelector(".gh-gradient-info");
          info.innerHTML = `
            <span class="gh-gradient-type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                ${
                  gradientInfo?.notFound
                    ? '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
                    : '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 8V16M12 8L8 12M12 8L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
                }
              </svg>
              <span class="gh-status-text">${gradientInfo?.notFound ? chrome.i18n.getMessage("noGradientFound") : chrome.i18n.getMessage("readyToStart")}</span>
            </span>
            <span class="gh-gradient-angle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="gh-action-text">${gradientInfo?.notFound ? chrome.i18n.getMessage("selectAgain") : chrome.i18n.getMessage("clickToCapture")}</span>
            </span>
          `;

          // 清空顏色停駐點區域
          if (colorStops) {
            colorStops.innerHTML = `
              <div class="gh-empty-stops">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4V20M17 4V20M3 8H21M3 16H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>${gradientInfo?.notFound ? chrome.i18n.getMessage("noGradientFound") : chrome.i18n.getMessage("waitingForSelection")}</span>
              </div>
            `;
          }

          // 清空代碼區域
          if (codeBlock) {
            codeBlock.innerHTML = `<span class="gh-code-comment">/* ${
              gradientInfo?.notFound ? `${chrome.i18n.getMessage("noGradientFound")}, ${chrome.i18n.getMessage("selectAgain")}` : chrome.i18n.getMessage("clickToGenerateCSS")
            } */</span>`;
          }

          return;
        }

        // 正常狀態：顯示擷取的漸層
        preview.innerHTML = "";
        preview.style.backgroundImage = gradientInfo.originalValue;

        // 更新漸層資訊
        const info = previewSection.querySelector(".gh-gradient-info");
        info.innerHTML = `
          <span class="gh-gradient-type">${chrome.i18n.getMessage("gradientType", [gradientInfo.gradient.type])}</span>
          <div class="gh-format-buttons">
            <button class="gh-format-btn ${this.currentColorFormat === "rgb" ? "active" : ""}" data-format="rgb">RGB</button>
            <button class="gh-format-btn ${this.currentColorFormat === "hex" ? "active" : ""}" data-format="hex">HEX</button>
            <button class="gh-format-btn ${this.currentColorFormat === "hsl" ? "active" : ""}" data-format="hsl">HSL</button>
          </div>
          <span class="gh-gradient-angle">${gradientInfo.gradient.angle}</span>
        `;

        // 綁定格式切換按鈕事件
        info.querySelectorAll(".gh-format-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const newFormat = btn.dataset.format;
            this.currentColorFormat = newFormat;
            info.querySelectorAll(".gh-format-btn").forEach(b => b.classList.toggle("active", b === btn));
            this.updateGradientUI(this.extractGradientInfo(this.selectedElement));
          });
        });
      }

      if (colorStops && gradientInfo) {
        // 更新顏色停駐點
        colorStops.innerHTML = gradientInfo.gradient.stops
          .map(
            stop => `
          <div class="gh-color-stop">
            <div class="gh-color-preview" style="background-color: ${stop.color[this.currentColorFormat]}"></div>
            <input type="text" value="${stop.color[this.currentColorFormat]}${stop.position ? " " + stop.position : ""}" class="gh-color-value" readonly />
          </div>
        `
          )
          .join("");
      }

      if (codeBlock && gradientInfo) {
        // 更新代碼顯示
        const cssCode = `background: ${gradientInfo.originalValue};`;
        codeBlock.textContent = cssCode;
      }
    }

    // 開始選取
    start() {
      if (!this.isActive) {
        this.isActive = true;
        document.addEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "crosshair";
        this.overlay.style.display = "block";
        this.toolbar.style.display = "flex";

        // 添加動效類名
        requestAnimationFrame(() => {
          this.toolbar.classList.add("active");
          this.overlay.classList.add("active");
        });
      }
    }

    // 停止選取
    stop() {
      if (this.isActive) {
        this.isActive = false;
        document.removeEventListener("click", this.boundClickHandler, true);
        document.body.style.cursor = "";

        // 移除動效類名並等待動畫完成
        this.toolbar.classList.remove("active");
        this.overlay.classList.remove("active");

        setTimeout(() => {
          if (!this.isActive) {
            this.overlay.style.display = "none";
            this.toolbar.style.display = "none";
          }
        }, 300); // 等待動畫完成

        if (this.selectedElement) {
          this.selectedElement.classList.remove("gradient-hunter-highlight");
          this.selectedElement = null;
        }
      }
    }

    // 清理
    cleanup() {
      this.stop();

      // 移除事件監聽器
      document.removeEventListener("mousemove", this.boundMouseMoveHandler);
      document.removeEventListener("mouseup", this.boundMouseUpHandler);
      chrome.runtime.onMessage.removeListener(this.boundMessageListener);

      // 移除 UI
      if (this.root) {
        this.root.parentNode?.removeChild(this.root);
        this.root = null;
        this.overlay = null;
        this.toolbar = null;
      }
    }
  }

  // 初始化選取器
  window.gradientPicker = new GradientPicker();
})();
