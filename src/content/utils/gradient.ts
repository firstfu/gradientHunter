/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層相關工具函數
 */

import { GradientParser } from '@/core/GradientParser'
import type { ParsedGradient } from '@/types/gradient'

/**
 * 從元素中獲取計算後的漸層樣式
 * @param element 目標元素
 * @returns 漸層 CSS 字符串或 null
 */
export function getComputedGradient(element: HTMLElement): string | null {
  const style = window.getComputedStyle(element)
  const background = style.background || style.backgroundImage

  // 檢查是否包含漸層
  if (!background.includes('gradient')) {
    return null
  }

  // 提取所有漸層
  const gradients = extractGradients(background)
  return gradients.length > 0 ? gradients.join(', ') : null
}

/**
 * 從背景字符串中提取所有漸層
 * @param background 背景樣式字符串
 * @returns 漸層數組
 */
function extractGradients(background: string): string[] {
  const gradients: string[] = []
  const gradientRegex = /(repeating-)?(linear|radial|conic)-gradient\([^)]+\)/g
  let match

  while ((match = gradientRegex.exec(background)) !== null) {
    gradients.push(match[0])
  }

  return gradients
}

/**
 * 解析漸層字符串
 * @param gradient 漸層字符串
 * @returns 解析結果
 */
export function parseGradient(gradient: string): ParsedGradient {
  return GradientParser.parse(gradient)
}

/**
 * 生成漸層 CSS
 * @param gradient 解析後的漸層數據
 * @returns CSS 字符串
 */
export function generateGradientCSS(gradient: ParsedGradient): string {
  if (!gradient.valid) {
    return ''
  }
  return GradientParser.stringify(gradient.data)
}
