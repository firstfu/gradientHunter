# Gradient Picker - 網頁漸層取色與 CSS 生成工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

一款強大的 Chrome 擴充功能，專門用於擷取網頁上的漸層背景，並自動生成對應的 CSS 代碼。無論是設計師或前端工程師，都能透過這個工具快速取得漸層資訊，大幅提升開發效率。

## 🌈 主要功能

- 一鍵式漸層擷取，支援多種漸層類型（linear、radial）
- 自動生成跨瀏覽器相容的 CSS 代碼
- 即時預覽與編輯漸層參數
- 支援多種色彩格式（HEX、RGBA、HSLA）
- 一鍵複製 CSS 代碼到剪貼簿

## 🚀 快速開始

### 安裝方式

1. 從 Chrome Web Store 安裝（即將推出）
2. 手動安裝：

   ```bash
   # 克隆專案
   git clone https://github.com/your-username/gradient-picker.git

   # 安裝依賴
   npm install

   # 建置專案
   npm run build
   ```

   然後在 Chrome 擴充功能頁面開啟「開發人員模式」，選擇「載入未封裝項目」並選取建置後的 dist 資料夾。

### 使用方式

1. 點擊瀏覽器工具列的擴充功能圖示
2. 按下「啟動取漸層模式」按鈕
3. 將滑鼠移至想要擷取漸層的網頁元素上
4. 點擊該元素，即可看到完整的漸層資訊
5. 可選擇直接複製 CSS 代碼，或進行進一步的調整

## 🛠 技術規格

- 基於 Chrome Extension Manifest V3
- 使用 TypeScript 開發
- 支援主流瀏覽器前綴自動生成
- 完整的漸層解析與重建演算法

## 🎯 適用場景

- 設計師需要快速取得網頁上的漸層參考
- 前端工程師優化開發流程，快速實現設計稿
- 教學情境中展示漸層原理與 CSS 實作

## 📝 開發計畫

### 當前版本 (v1.0.0)

- [x] 基礎漸層擷取功能
- [x] CSS 代碼生成
- [x] 簡易預覽介面

### 即將推出

- [ ] 視覺化漸層編輯器
- [ ] 多重漸層支援
- [ ] 常用漸層範本
- [ ] 雲端同步功能

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！如果你想要參與開發：

1. Fork 這個專案
2. 建立你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 📄 授權條款

本專案使用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 鳴謝

- 感謝所有提供意見與建議的使用者
- 特別感謝參與開發的貢獻者們

## 📧 聯絡我們

如有任何問題或建議，歡迎：

- 開啟 Issue
- 發送 Pull Request
- 寄信至：[your-email@example.com](mailto:your-email@example.com)

---

**Made with ❤️ by [Your Team Name]**
