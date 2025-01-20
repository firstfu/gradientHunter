/**
 * @ Author: 1891
 * @ Create Time: 2024-03-21
 * @ Description: Chrome Extension Background Service Worker
 */

// 監聽擴充功能安裝事件
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gradient Hunter extension installed");
});

// 監聽來自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_GRADIENT") {
    console.log("Received gradient data:", request.data);
    sendResponse({ status: "success" });
  }
  return true;
});
