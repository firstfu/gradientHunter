# Gradient Hunter 網頁漸層獵手 🎨

[English](README.md) | [繁體中文](README.zh-TW.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0--beta-orange.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

![Gradient Hunter Logo](assets/icons/icon.svg)

一個專業的 Chrome 擴充功能，能夠輕鬆從網頁中擷取漸層背景並即時生成對應的 CSS 代碼。無論您是設計師還是開發者，這個工具都能幫助您快速獲取漸層資訊，提升工作效率。

## 核心功能 ✨

- 🎯 智能漸層捕捉

  - 支援 DOM 元素漸層擷取
  - 智能圖片漸層辨識
  - 自動檢測漸層方向和類型

- 🎨 全方位漸層支援

  - 支援 CSS 線性漸層
  - 支援圖片漸層分析
  - 自動最佳化色彩停駐點
  - 更多漸層類型即將推出！

- 🖼 圖片漸層分析

  - 智能辨識圖片中的漸層效果
  - 自動分析主要顏色分佈
  - 精確定位色彩停駐點
  - 支援多種圖片格式

- 📋 CSS 代碼生成

  - 支援多種顏色格式（RGB、HEX、HSL）
  - 自動生成跨瀏覽器相容代碼
  - 優化的色彩表示方式
  - 簡潔易讀的代碼輸出

- 👀 即時預覽與編輯
  - 即時漸層效果預覽
  - 可視化參數調整
  - 拖放式圖片分析
  - 快速複製功能

## 特色功能 🌟

### 智能圖片分析

我們的圖片漸層分析技術能夠：

- 自動檢測漸層方向（水平、垂直、對角線）
- 智能過濾雜訊和無效顏色
- 優化色彩停駐點數量
- 生成最佳漸層效果

### 多種操作模式

- 直接擷取：從網頁元素中擷取漸層
- 圖片分析：上傳圖片自動分析漸層
- 手動調整：微調漸層參數和顏色

### 使用情境

- 從設計稿圖片中提取精確漸層
- 從截圖中重現漸層效果
- 分析並複製喜歡的漸層背景
- 優化現有漸層效果

## 快速開始 🚀

### 線上安裝

1. 造訪 [Chrome Web Store](https://chrome.google.com/webstore) (即將上架)
2. 搜尋 "Gradient Hunter"
3. 點擊「新增至 Chrome」

### 開發環境設置

```bash
# 複製專案
git clone https://github.com/your-username/gradient-hunter.git

# 進入專案目錄
cd gradient-hunter
```

### 本地安裝

1. 開啟 Chrome，進入 `chrome://extensions/`
2. 開啟右上角「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選取專案根目錄

## 使用指南 💡

1. 點擊工具列的 Gradient Hunter 圖示
2. 選擇操作模式：
   - 快速擷取：直接點選目標元素
   - 圖片分析：上傳或拖放圖片
   - 進階模式：開啟完整編輯器
3. 調整參數：
   - 漸層類型
   - 角度/方向
   - 色彩點位置
4. 複製生成的 CSS 代碼
5. 直接應用於您的專案

## 技術棧 🛠

- **核心技術**

  - Chrome Extension MV3
  - JavaScript
  - CSS3

- **瀏覽器 API**
  - Chrome Extension API
  - DOM API
  - Web Storage API

## 使用案例 💡

### 設計師

- 從現有網站擷取靈感
- 快速複製喜歡的漸層效果
- 調整和優化漸層參數

### 開發者

- 精確複製設計規範
- 快速產生相容的 CSS 代碼
- 在不同專案間重用漸層樣式

### 學習者

- 分析優秀網站的漸層實現
- 理解漸層參數的作用
- 練習調整漸層效果

## 版本規劃 📈

### v0.1.0-beta（當前）

- [x] 基礎漸層擷取
- [x] CSS 代碼生成
- [x] 快速預覽功能
- [x] 本地儲存

### v1.0.0（2025 Q1）

- [ ] 視覺化編輯器
- [ ] 環形漸層支援
- [ ] 增強圖片分析準確度
- [ ] 批次圖片處理功能
- [ ] 快速鍵支援
- [ ] 匯出/匯入功能

### v2.0.0（2025 Q2）

- [ ] AI 輔助漸層生成
- [ ] 智能圖片配色建議
- [ ] 社群分享功能
- [ ] 雲端同步
- [ ] 團隊協作

## 貢獻 🤝

我們歡迎各種形式的貢獻：

- 🐛 回報問題
- 💡 提供建議
- 📝 改善文件
- 💻 提交程式碼

詳細指南請參考 [CONTRIBUTING.md](CONTRIBUTING.md)

## 授權 📄

本專案採用 [MIT 授權](LICENSE)

## 聯絡我們 📮

- 📧 Email：[gradient.hunter@example.com](mailto:gradient.hunter@example.com)
- 💬 Discord：[Gradient Hunter Community](https://discord.gg/gradienthunter)
- 🐦 Twitter：[@GradientHunter](https://twitter.com/gradienthunter)

---

**Made with ❤️ by Gradient Hunter Team**

[Website](https://gradienthunter.dev) · [Documentation](https://docs.gradienthunter.dev) · [Report Bug](https://github.com/your-username/gradient-hunter/issues)
