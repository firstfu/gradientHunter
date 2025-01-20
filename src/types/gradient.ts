/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層相關類型定義
 */

// 漸層類型
export type GradientType = 'linear' | 'radial' | 'conic'

// 顏色停止點
export interface ColorStop {
  color: string
  position?: string
}

// 線性漸層方向
export type LinearDirection =
  | 'to top'
  | 'to right'
  | 'to bottom'
  | 'to left'
  | 'to top right'
  | 'to top left'
  | 'to bottom right'
  | 'to bottom left'
  | `${number}deg`

// 放射狀漸層形狀
export type RadialShape = 'circle' | 'ellipse'

// 放射狀漸層大小
export type RadialSize = 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner'

// 放射狀漸層位置
export type RadialPosition =
  | 'center'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | `${number}%`
  | `${number}px`

// 放射狀漸層設定
export interface RadialGradientSettings {
  shape?: RadialShape
  size?: RadialSize
  position?: {
    x: RadialPosition
    y: RadialPosition
  }
}

// 漸層數據結構
export interface GradientData {
  type: GradientType
  angle?: string
  direction?: LinearDirection
  radial?: RadialGradientSettings
  colorStops: ColorStop[]
  repeating?: boolean
}

// 漸層解析結果
export interface ParsedGradient {
  raw: string
  data: GradientData
  valid: boolean
  error?: string
}
