# Gradient Hunter - 網頁漸層獵手

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

一款專業的 Chrome 擴充功能，讓你輕鬆擷取網頁上的漸層背景，並即時生成對應的 CSS 代碼。無論是設計師或開發者，都能透過這個工具快速取得漸層資訊，提升工作效率。

## ✨ 核心特色

- 🎯 一鍵式漸層擷取
- 🎨 支援線性漸層（Linear）與環形漸層（Radial）
- 📋 自動生成跨瀏覽器相容的 CSS 代碼
- 👀 即時預覽與參數調整
- 🌈 支援多種色彩格式（HEX、RGB、HSL）

## 🚀 開始使用

### 安裝方式

1. 從 Chrome Web Store 安裝（即將上架）
2. 手動安裝：

   ```bash
   # 下載專案
   git clone https://github.com/your-username/gradient-hunter.git

   # 安裝相依套件
   npm install

   # 建置專案
   npm run build
   ```

   接著在 Chrome 瀏覽器：

   1. 開啟 `chrome://extensions/`
   2. 啟用「開發人員模式」
   3. 點擊「載入未封裝項目」
   4. 選取專案中的 `dist` 資料夾

### 使用步驟

1. 點擊瀏覽器工具列的 Gradient Hunter 圖示
2. 按下「開始選取」按鈕
3. 將滑鼠移至目標元素上
4. 點擊以擷取漸層資訊
5. 在彈出視窗中檢視並複製 CSS 代碼

## 🛠 技術特點

- 基於 Chrome Extension Manifest V3
- TypeScript 開發，型別安全
- 支援主流瀏覽器前綴
- 精準的漸層解析演算法

## 🎯 使用情境

- 設計研究：快速取得網頁設計參考
- 開發效率：即時獲取漸層 CSS 代碼
- 學習教學：理解漸層原理與實作方式

## 📝 開發規劃

### v1.0.0（當前版本）

- [x] 基礎漸層擷取
- [x] CSS 代碼生成
- [x] 即時預覽功能
- [x] 多種色彩格式支援

### 未來版本

- [ ] 視覺化漸層編輯器
- [ ] 漸層預設範本
- [ ] 歷史記錄功能
- [ ] 雲端同步支援

## 🤝 參與貢獻

歡迎協助改善這個專案！

1. Fork 專案
2. 建立分支：`git checkout -b feature/YourFeature`
3. 提交變更：`git commit -m 'Add YourFeature'`
4. 推送分支：`git push origin feature/YourFeature`
5. 建立 Pull Request

## 📄 授權條款

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 📮 聯絡方式

- GitHub Issues
- 電子郵件：[your-email@example.com](mailto:your-email@example.com)

---

**Made with ❤️ by Gradient Hunter Team**
