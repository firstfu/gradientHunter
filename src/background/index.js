/**
 * @ Author: 1891
 * @ Create Time: 2024-01-21
 * @ Description: 漸層獵手插件的背景腳本
 */

// 監聽擴充功能安裝事件
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gradient Hunter installed");
});

// 監聽來自彈出窗口的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "START_PICKING") {
    // 在當前標籤頁注入選取器
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content/picker.js"],
        });
      }
    });
  }
  return true;
});
