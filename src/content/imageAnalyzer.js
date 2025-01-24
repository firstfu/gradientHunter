// 圖片漸層分析器
class ImageGradientAnalyzer {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.colorFormat = "rgb"; // 預設使用 RGB 格式
  }

  // 分析圖片漸層
  async analyzeGradient(image) {
    // 設置 canvas 大小
    this.canvas.width = image.naturalWidth || image.width;
    this.canvas.height = image.naturalHeight || image.height;

    // 繪製圖片到 canvas
    this.ctx.drawImage(image, 0, 0);

    // 獲取圖片數據
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 採樣顏色
    const { horizontalSamples, verticalSamples, diagonalSamples } = this.sampleColors(imageData);

    // 分析漸層方向和類型
    const { direction, type, angle } = this.detectGradientDirection(horizontalSamples, verticalSamples, diagonalSamples);

    // 獲取關鍵顏色點
    const stops = this.extractColorStops(direction === "horizontal" ? horizontalSamples : direction === "vertical" ? verticalSamples : diagonalSamples);

    // 生成最終的漸層信息
    return {
      gradient: {
        type: type,
        angle: angle,
        stops: stops,
      },
      originalValue: this.generateGradientCSS(stops, angle, this.colorFormat),
      element: {
        tagName: "img",
        className: "",
        id: "",
      },
    };
  }

  // 顏色採樣
  sampleColors(imageData) {
    const { width, height, data } = imageData;
    const sampleSize = 20; // 採樣點數

    const horizontalSamples = [];
    const verticalSamples = [];
    const diagonalSamples = [];

    // 水平採樣
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor((width / (sampleSize - 1)) * i);
      const y = Math.floor(height / 2);
      const index = (y * width + x) * 4;
      horizontalSamples.push({
        position: i / (sampleSize - 1),
        color: {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3] / 255,
        },
      });
    }

    // 垂直採樣
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(width / 2);
      const y = Math.floor((height / (sampleSize - 1)) * i);
      const index = (y * width + x) * 4;
      verticalSamples.push({
        position: i / (sampleSize - 1),
        color: {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3] / 255,
        },
      });
    }

    // 對角線採樣
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor((width / (sampleSize - 1)) * i);
      const y = Math.floor((height / (sampleSize - 1)) * i);
      const index = (y * width + x) * 4;
      diagonalSamples.push({
        position: i / (sampleSize - 1),
        color: {
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3] / 255,
        },
      });
    }

    return { horizontalSamples, verticalSamples, diagonalSamples };
  }

  // 檢測漸層方向
  detectGradientDirection(horizontalSamples, verticalSamples, diagonalSamples) {
    const horizontalVariance = this.calculateColorVariance(horizontalSamples);
    const verticalVariance = this.calculateColorVariance(verticalSamples);
    const diagonalVariance = this.calculateColorVariance(diagonalSamples);

    // 使用加權系統來改進方向檢測
    const weights = {
      horizontal: horizontalVariance * 1.2, // 稍微偏好水平方向
      vertical: verticalVariance,
      diagonal: diagonalVariance * 0.8, // 降低對角線的權重
    };

    const maxWeight = Math.max(weights.horizontal, weights.vertical, weights.diagonal);

    // 根據權重返回適當的角度
    if (weights.horizontal === maxWeight) {
      return { direction: "horizontal", type: "linear", angle: "90deg" };
    } else if (weights.vertical === maxWeight) {
      return { direction: "vertical", type: "linear", angle: "180deg" };
    } else {
      return { direction: "diagonal", type: "linear", angle: "120deg" }; // 使用更常見的對角線角度
    }
  }

  // 提取關鍵顏色點
  extractColorStops(samples) {
    const stops = [];
    const threshold = 30; // 顏色變化閾值
    const minStops = 2; // 最少顏色點
    const maxStops = 4; // 最多顏色點

    // 過濾掉透明度過低和灰色區域
    const validSamples = samples.filter(sample => {
      const { r, g, b, a } = sample.color;
      const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
      return a > 0.1 && !isGray;
    });

    if (validSamples.length === 0) {
      return [];
    }

    // 確保至少有起點和終點
    const startSample = validSamples[0];
    const endSample = validSamples[validSamples.length - 1];

    stops.push({
      color: this.createColorInfo(startSample.color),
      position: "0%",
    });

    // 找出中間的關鍵顏色點
    let lastColor = startSample.color;
    for (let i = 1; i < validSamples.length - 1; i++) {
      const currentColor = validSamples[i].color;
      const colorDiff = this.getColorDifference(lastColor, currentColor);

      if (colorDiff > threshold && stops.length < maxStops - 1) {
        stops.push({
          color: this.createColorInfo(currentColor),
          position: `${Math.round(validSamples[i].position * 100)}%`,
        });
        lastColor = currentColor;
      }
    }

    stops.push({
      color: this.createColorInfo(endSample.color),
      position: "100%",
    });

    // 如果顏色點太少，添加中間點
    if (stops.length < minStops) {
      const middleSample = validSamples[Math.floor(validSamples.length / 2)];
      stops.splice(1, 0, {
        color: this.createColorInfo(middleSample.color),
        position: "50%",
      });
    }

    return stops;
  }

  // 創建顏色信息對象
  createColorInfo(color) {
    const { r, g, b, a } = color;
    return {
      original: `rgb(${r}, ${g}, ${b})`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hex: this.rgbToHex(r, g, b),
      hsl: this.rgbToHsl(r, g, b),
    };
  }

  // 生成 CSS 漸層
  generateGradientCSS(stops, angle, format = "rgb") {
    if (stops.length === 0) return "none";

    // 根據指定的格式選擇對應的顏色值
    const colorStops = stops
      .map(stop => {
        let colorValue;
        switch (format.toLowerCase()) {
          case "hsl":
            colorValue = stop.color.hsl;
            break;
          case "hex":
            colorValue = stop.color.hex;
            break;
          default:
            colorValue = stop.color.rgb;
        }
        return stop.position ? `${colorValue} ${stop.position}` : colorValue;
      })
      .join(", ");

    return `linear-gradient(${angle}, ${colorStops})`;
  }

  // 計算兩個顏色之間的差異
  getColorDifference(color1, color2) {
    return Math.sqrt(Math.pow(color1.r - color2.r, 2) + Math.pow(color1.g - color2.g, 2) + Math.pow(color1.b - color2.b, 2));
  }

  // 計算顏色變化方差
  calculateColorVariance(samples) {
    let totalVariance = 0;
    let validChanges = 0;

    for (let i = 1; i < samples.length; i++) {
      const current = samples[i].color;
      const prev = samples[i - 1].color;

      // 忽略透明度過低的樣本
      if (current.a < 0.1 || prev.a < 0.1) {
        continue;
      }

      const diff = this.getColorDifference(current, prev);
      if (diff > 20) {
        // 只計算顯著的顏色變化
        totalVariance += diff;
        validChanges++;
      }
    }

    return validChanges > 0 ? totalVariance / validChanges : 0;
  }

  // RGB 轉 HEX
  rgbToHex(r, g, b) {
    const toHex = n => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // RGB 轉 HSL
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

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
}

// 確保在全局作用域中定義分析器
(function () {
  // 確保只定義一次
  if (window.ImageGradientAnalyzer) {
    return;
  }

  window.ImageGradientAnalyzer = ImageGradientAnalyzer;

  // 添加切換顏色格式的方法
  ImageGradientAnalyzer.prototype.setColorFormat = function (format) {
    if (["rgb", "hsl", "hex"].includes(format.toLowerCase())) {
      this.colorFormat = format.toLowerCase();
      // 返回當前的顏色格式，方便外部確認設置是否成功
      return this.colorFormat;
    }
    // 如果格式無效，保持當前格式不變
    return this.colorFormat;
  };

  // 獲取當前顏色格式的方法
  ImageGradientAnalyzer.prototype.getColorFormat = function () {
    return this.colorFormat;
  };
})();
