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
    // 計算每個方向的顏色變化特徵
    const horizontalFeatures = this.calculateDirectionFeatures(horizontalSamples);
    const verticalFeatures = this.calculateDirectionFeatures(verticalSamples);
    const diagonalFeatures = this.calculateDirectionFeatures(diagonalSamples);

    // 綜合評分系統
    const scores = {
      horizontal: this.calculateDirectionScore(horizontalFeatures),
      vertical: this.calculateDirectionScore(verticalFeatures),
      diagonal: this.calculateDirectionScore(diagonalFeatures),
    };

    // 找出得分最高的方向
    const maxScore = Math.max(scores.horizontal, scores.vertical, scores.diagonal);

    // 根據得分返回方向和角度
    if (scores.horizontal === maxScore) {
      const angle = this.refineGradientAngle(horizontalFeatures);
      return { direction: "horizontal", type: "linear", angle: `${angle}deg` };
    } else if (scores.vertical === maxScore) {
      const angle = this.refineGradientAngle(verticalFeatures);
      return { direction: "vertical", type: "linear", angle: `${angle}deg` };
    } else {
      const angle = this.refineGradientAngle(diagonalFeatures);
      return { direction: "diagonal", type: "linear", angle: `${angle}deg` };
    }
  }

  // 計算方向特徵
  calculateDirectionFeatures(samples) {
    const features = {
      deltaE: [], // 顏色差異
      smoothness: 0, // 漸變平滑度
      consistency: 0, // 方向一致性
      labValues: [], // Lab 顏色值
    };

    // 計算並存儲每個樣本的 Lab 值
    samples.forEach(sample => {
      const lab = this.rgbToLab(sample.color.r, sample.color.g, sample.color.b);
      features.labValues.push(lab);
    });

    // 計算顏色差異和平滑度
    for (let i = 1; i < features.labValues.length; i++) {
      const deltaE = this.calculateDeltaE(features.labValues[i - 1], features.labValues[i]);
      features.deltaE.push(deltaE);
    }

    // 計算平滑度（相鄰差異的一致性）
    features.smoothness = this.calculateSmoothness(features.deltaE);

    // 計算方向一致性
    features.consistency = this.calculateConsistency(features.labValues);

    return features;
  }

  // 計算方向評分
  calculateDirectionScore(features) {
    // 綜合評分標準
    const smoothnessWeight = 0.4;
    const consistencyWeight = 0.4;
    const deltaEWeight = 0.2;

    return features.smoothness * smoothnessWeight + features.consistency * consistencyWeight + this.calculateAverageDeltaE(features.deltaE) * deltaEWeight;
  }

  // 計算平滑度
  calculateSmoothness(deltaE) {
    if (deltaE.length < 2) return 0;

    let smoothness = 0;
    for (let i = 1; i < deltaE.length; i++) {
      // 計算相鄰差異的變化率
      const change = Math.abs(deltaE[i] - deltaE[i - 1]);
      smoothness += Math.exp(-change);
    }

    return smoothness / (deltaE.length - 1);
  }

  // 計算方向一致性
  calculateConsistency(labValues) {
    if (labValues.length < 3) return 0;

    let consistency = 0;
    const vectors = [];

    // 計算顏色向量
    for (let i = 1; i < labValues.length; i++) {
      vectors.push({
        dL: labValues[i].L - labValues[i - 1].L,
        da: labValues[i].a - labValues[i - 1].a,
        db: labValues[i].b - labValues[i - 1].b,
      });
    }

    // 計算向量一致性
    for (let i = 1; i < vectors.length; i++) {
      const dotProduct = vectors[i].dL * vectors[i - 1].dL + vectors[i].da * vectors[i - 1].da + vectors[i].db * vectors[i - 1].db;
      const magnitude1 = Math.sqrt(vectors[i].dL ** 2 + vectors[i].da ** 2 + vectors[i].db ** 2);
      const magnitude2 = Math.sqrt(vectors[i - 1].dL ** 2 + vectors[i - 1].da ** 2 + vectors[i - 1].db ** 2);

      if (magnitude1 * magnitude2 !== 0) {
        consistency += dotProduct / (magnitude1 * magnitude2);
      }
    }

    return (consistency + vectors.length - 1) / vectors.length;
  }

  // 計算平均顏色差異
  calculateAverageDeltaE(deltaE) {
    if (deltaE.length === 0) return 0;
    return deltaE.reduce((sum, value) => sum + value, 0) / deltaE.length;
  }

  // 優化漸層角度
  refineGradientAngle(features) {
    if (features.consistency > 0.8) {
      // 如果方向一致性很高，使用精確角度
      const vectors = features.labValues
        .map((lab, i) => {
          if (i === 0) return null;
          return {
            dL: lab.L - features.labValues[i - 1].L,
            da: lab.a - features.labValues[i - 1].a,
            db: lab.b - features.labValues[i - 1].b,
          };
        })
        .filter(v => v !== null);

      // 計算主要方向向量
      const avgVector = vectors.reduce(
        (acc, v) => ({
          dL: acc.dL + v.dL,
          da: acc.da + v.da,
          db: acc.db + v.db,
        }),
        { dL: 0, da: 0, db: 0 }
      );

      // 計算角度
      const angle = ((Math.atan2(avgVector.db, avgVector.dL) * 180) / Math.PI + 360) % 360;
      return Math.round(angle);
    } else {
      // 如果一致性不高，使用預設角度
      return 90;
    }
  }

  // 提取關鍵顏色點
  extractColorStops(samples) {
    const stops = [];
    // 使用 Lab 色差作為閾值，2.3 是可見差異，5.0 是明顯差異
    const labThreshold = 5.0;
    const minStops = 2; // 最少顏色點
    const maxStops = 4; // 最多顏色點

    // 過濾掉透明度過低的樣本並計算 Lab 值
    const validSamples = samples.filter(sample => {
      const { r, g, b, a } = sample.color;
      // 使用 Lab 空間判斷灰色
      const lab = this.rgbToLab(r, g, b);
      const isGray = Math.abs(lab.a) < 5 && Math.abs(lab.b) < 5;
      // 為後續計算儲存 Lab 值
      sample.labColor = lab;
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
    let significantChanges = [];
    let lastColor = startSample.color;
    let lastLab = startSample.labColor;

    for (let i = 1; i < validSamples.length - 1; i++) {
      const currentColor = validSamples[i].color;
      const currentLab = validSamples[i].labColor;

      // 計算顏色差異
      const deltaE = this.calculateDeltaE(lastLab, currentLab);

      if (deltaE > labThreshold) {
        significantChanges.push({
          index: i,
          deltaE: deltaE,
          sample: validSamples[i],
        });
      }

      if (deltaE > labThreshold && stops.length < maxStops - 1) {
        // 只添加顯著的顏色變化點
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
      let middlePoint;

      if (significantChanges.length > 0) {
        // 選擇變化最顯著的點
        significantChanges.sort((a, b) => b.deltaE - a.deltaE);
        middlePoint = significantChanges[0].sample;
      } else {
        // 如果沒有顯著變化，使用中間點
        middlePoint = validSamples[Math.floor(validSamples.length / 2)];
      }

      stops.splice(1, 0, {
        color: this.createColorInfo(middlePoint.color),
        deltaE: middlePoint.deltaE,
        labColor: middlePoint.labColor,
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
  // 使用 Lab 色彩空間計算更準確的顏色差異
  getColorDifference(color1, color2) {
    const lab1 = this.rgbToLab(color1.r, color1.g, color1.b);
    const lab2 = this.rgbToLab(color2.r, color2.g, color2.b);

    // 使用 CIEDE2000 算法計算顏色差異
    return this.calculateDeltaE(lab1, lab2);
  }

  // RGB 轉換到 XYZ 色彩空間
  rgbToXYZ(r, g, b) {
    // 標準化 RGB 值
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Gamma 校正
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // 轉換矩陣
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    return { x: x * 100, y: y * 100, z: z * 100 };
  }

  // XYZ 轉換到 Lab 色彩空間
  xyzToLab(x, y, z) {
    // D65 白點參考值
    const xn = 95.047;
    const yn = 100.0;
    const zn = 108.883;

    // 標準化 XYZ 值
    x = x / xn;
    y = y / yn;
    z = z / zn;

    // 非線性轉換
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return {
      L: 116 * y - 16,
      a: 500 * (x - y),
      b: 200 * (y - z),
    };
  }

  // RGB 直接轉換到 Lab
  rgbToLab(r, g, b) {
    const xyz = this.rgbToXYZ(r, g, b);
    return this.xyzToLab(xyz.x, xyz.y, xyz.z);
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
      if (diff > 2.3) {
        // 使用 Lab 色差閾值，CIEDE2000 中 2.3 約等於可見差異
        // 只計算顯著的顏色變化
        totalVariance += diff;
        validChanges++;
      }
    }

    return validChanges > 0 ? totalVariance / validChanges : 0;
  }

  // 計算 CIEDE2000 顏色差異
  calculateDeltaE(lab1, lab2) {
    const kL = 1;
    const kC = 1;
    const kH = 1;

    const deltaL = lab2.L - lab1.L;
    const L_ = (lab1.L + lab2.L) / 2;

    const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
    const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
    const C_ = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(C_, 7) / (Math.pow(C_, 7) + Math.pow(25, 7))));

    const a1p = lab1.a * (1 + G);
    const a2p = lab2.a * (1 + G);

    const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
    const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);
    const Cp_ = (C1p + C2p) / 2;

    const h1p = Math.atan2(lab1.b, a1p);
    const h2p = Math.atan2(lab2.b, a2p);

    const dLp = deltaL / (kL * 1.0);
    const dCp = (C2p - C1p) / (kC * 1.0);

    let dHp;
    if (C1p * C2p === 0) {
      dHp = 0;
    } else {
      dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((h2p - h1p) / 2);
    }
    dHp = dHp / (kH * 1.0);

    // 返回最終的顏色差異值
    return Math.sqrt(dLp * dLp + dCp * dCp + dHp * dHp);
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
