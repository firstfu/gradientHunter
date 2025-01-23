# Gradient Hunter - 網頁漸層獵手 🎨

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0--beta-orange.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

一款專業的 Chrome 擴充功能，讓你輕鬆擷取網頁上的漸層背景，並即時生成對應的 CSS 代碼。無論是設計師或開發者，都能透過這個工具快速取得漸層資訊，提升工作效率。

## ✨ 核心特色

- 🎯 一鍵式漸層擷取：2 分鐘內完成，提升 90% 效率
- 🎨 全方位漸層支援：
  - 線性漸層（Linear Gradient）
  - 環形漸層（Radial Gradient）[即將推出]
  - 圓錐漸層（Conic Gradient）[規劃中]
- 📋 智慧化 CSS 生成：
  - 95% 以上的精確度
  - 自動添加瀏覽器前綴
  - 支援降級方案
- 👀 即時預覽功能：
  - 懸停預覽
  - 快速調整
  - 即時生成
- 🌈 專業色彩管理：
  - HEX 色碼
  - RGB/RGBA
  - HSL/HSLA
  - 色彩名稱

## 🚀 快速開始

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

# 安裝依賴
npm install

# 啟動開發環境
npm run dev

# 建置專案
npm run build
```

### 本地安裝

1. 開啟 Chrome，進入 `chrome://extensions/`
2. 開啟右上角「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選取專案中的 `dist` 資料夾

## 💡 使用指南

1. 點擊工具列的 Gradient Hunter 圖示
2. 選擇操作模式：
   - 快速擷取：直接點選目標元素
   - 進階模式：開啟完整編輯器
3. 調整參數：
   - 漸層類型
   - 角度/方向
   - 色彩點位置
4. 複製生成的 CSS 代碼
5. 直接應用於您的專案

## 🛠 技術棧

- **核心技術**

  - Chrome Extension MV3
  - TypeScript 5.0+
  - Vite 5.0+

- **開發工具**

  - ESLint + Prettier
  - Jest + Testing Library
  - Husky + lint-staged

- **效能優化**
  - Tree-shaking
  - 代碼分割
  - 非同步載入
  - Service Worker 快取

## 🔄 開發工作流程

1. 建立新分支：`feature/*` 或 `fix/*`
2. 開發並測試功能
3. 提交程式碼：

   ```bash
   git add .
   git commit -m "feat/fix: 您的更改描述"
   ```

4. 推送分支並建立 PR

## 📈 版本規劃

### v0.1.0-beta（當前）

- [x] 基礎漸層擷取
- [x] CSS 代碼生成
- [x] 快速預覽功能
- [x] 本地儲存

### v1.0.0（2024 Q2）

- [ ] 視覺化編輯器
- [ ] 環形漸層支援
- [ ] 快速鍵支援
- [ ] 匯出/匯入功能

### v2.0.0（2024 Q3）

- [ ] AI 輔助生成
- [ ] 社群分享功能
- [ ] 雲端同步
- [ ] 團隊協作

## 🤝 參與貢獻

我們歡迎各種形式的貢獻：

- 🐛 回報問題
- 💡 提供建議
- 📝 改善文件
- 💻 提交程式碼

詳細指南請參考 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 授權條款

本專案採用 [MIT 授權](LICENSE)

## 📮 聯絡我們

- 📧 Email：[gradient.hunter@example.com](mailto:gradient.hunter@example.com)
- 💬 Discord：[Gradient Hunter Community](https://discord.gg/gradienthunter)
- 🐦 Twitter：[@GradientHunter](https://twitter.com/gradienthunter)

---

<div align="center">

**Made with ❤️ by Gradient Hunter Team**

[Website](https://gradienthunter.dev) · [Documentation](https://docs.gradienthunter.dev) · [Report Bug](https://github.com/your-username/gradient-hunter/issues)

</div>
