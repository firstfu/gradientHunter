/**
 * @ Author: 1891
 * @ Create Time: 2024-01-20
 * @ Description: 漸層解析引擎
 */

import type {
  GradientType,
  ColorStop,
  LinearDirection,
  GradientData,
  ParsedGradient,
  RadialShape,
  RadialSize,
  RadialPosition,
  RadialGradientSettings
} from '../types/gradient'

export class GradientParser {
  /**
   * 解析漸層字符串
   * @param input CSS 漸層字符串
   * @returns 解析結果
   */
  static parse(input: string): ParsedGradient {
    try {
      // 檢查是否為有效的漸層字符串
      if (!this.isValidGradient(input)) {
        throw new Error('Invalid gradient string')
      }

      // 提取基本信息
      const type = this.extractType(input)
      const params = this.extractParams(input)

      // 解析數據
      const data = this.parseGradientData(type, params)

      return {
        raw: input,
        data,
        valid: true
      }
    } catch (error) {
      return {
        raw: input,
        data: {
          type: 'linear',
          colorStops: []
        },
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 檢查是否為有效的漸層字符串
   */
  private static isValidGradient(input: string): boolean {
    return /^(repeating-)?(linear|radial|conic)-gradient\(([^()]+|\([^()]*\))*\)$/.test(input)
  }

  /**
   * 提取漸層類型
   */
  private static extractType(input: string): GradientType {
    const match = input.match(/^(?:repeating-)?(linear|radial|conic)-gradient/)
    if (!match) throw new Error('Cannot extract gradient type')
    return match[1] as GradientType
  }

  /**
   * 提取參數部分
   */
  private static extractParams(input: string): string {
    const match = input.match(/\((.*)\)/)
    if (!match) throw new Error('Cannot extract gradient parameters')
    return match[1].trim()
  }

  /**
   * 解析漸層數據
   */
  private static parseGradientData(type: GradientType, params: string): GradientData {
    const data: GradientData = {
      type,
      colorStops: []
    }

    // 檢查是否為重複漸層
    data.repeating = /^repeating-/.test(params)

    // 根據類型解析參數
    if (type === 'linear') {
      const { direction, remainingParams } = this.parseLinearDirection(params)
      if (direction) {
        if (direction.endsWith('deg')) {
          data.angle = direction
        } else {
          data.direction = direction as LinearDirection
        }
      }
      params = remainingParams
    } else if (type === 'radial') {
      const { settings, remainingParams } = this.parseRadialSettings(params)
      data.radial = settings
      params = remainingParams
    }

    // 解析顏色停止點
    data.colorStops = this.parseColorStops(params)

    return data
  }

  /**
   * 解析線性漸層的方向
   */
  private static parseLinearDirection(params: string): {
    direction?: string
    remainingParams: string
  } {
    const directionMatch = params.match(
      /^(to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?|\d+deg)/
    )

    if (!directionMatch) {
      return { remainingParams: params }
    }

    return {
      direction: directionMatch[1],
      remainingParams: params.slice(directionMatch[0].length).trim()
    }
  }

  /**
   * 解析放射狀漸層設定
   */
  private static parseRadialSettings(params: string): {
    settings: RadialGradientSettings
    remainingParams: string
  } {
    const settings: RadialGradientSettings = {}
    let remainingParams = params

    // 解析形狀
    const shapeMatch = params.match(/^(circle|ellipse)\s+/)
    if (shapeMatch) {
      settings.shape = shapeMatch[1] as RadialShape
      remainingParams = remainingParams.slice(shapeMatch[0].length)
    }

    // 解析大小
    const sizeMatch = remainingParams.match(
      /^(closest-side|closest-corner|farthest-side|farthest-corner)\s+/
    )
    if (sizeMatch) {
      settings.size = sizeMatch[1] as RadialSize
      remainingParams = remainingParams.slice(sizeMatch[0].length)
    }

    // 解析位置
    const positionMatch = remainingParams.match(/^at\s+([^,]+)/)
    if (positionMatch) {
      const positionStr = positionMatch[1].trim()
      const [x, y] = this.parsePosition(positionStr)
      settings.position = { x, y }
      remainingParams = remainingParams.slice(positionMatch[0].length)
    }

    // 移除尾部逗號和空格
    remainingParams = remainingParams.replace(/^,\s*/, '')

    return { settings, remainingParams }
  }

  /**
   * 解析位置
   */
  private static parsePosition(position: string): [RadialPosition, RadialPosition] {
    const parts = position.split(/\s+/)

    // 處理單個值的情況
    if (parts.length === 1) {
      const value = parts[0]
      if (value === 'center') {
        return ['center', 'center']
      }
      if (value === 'top' || value === 'bottom') {
        return ['center', value]
      }
      if (value === 'left' || value === 'right') {
        return [value, 'center']
      }
    }

    // 處理兩個值的情況
    if (parts.length === 2) {
      return [parts[0] as RadialPosition, parts[1] as RadialPosition]
    }

    // 默認值
    return ['center', 'center']
  }

  /**
   * 解析顏色停止點
   */
  private static parseColorStops(params: string): ColorStop[] {
    const colorStops: ColorStop[] = []
    const colorStopRegex =
      /(?:rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|\b\w+\b)(?:\s+(\d+%|\d+px))?,?/gi
    let match

    while ((match = colorStopRegex.exec(params)) !== null) {
      const [fullMatch, position] = match
      const color = fullMatch
        .replace(position || '', '')
        .trim()
        .replace(/,$/, '')
      colorStops.push({ color, ...(position ? { position } : {}) })
    }

    return colorStops
  }

  /**
   * 生成 CSS 漸層字符串
   */
  static stringify(data: GradientData): string {
    const parts: string[] = []

    // 添加重複標記
    if (data.repeating) {
      parts.push('repeating-')
    }

    // 添加類型
    parts.push(`${data.type}-gradient(`)

    // 根據類型添加參數
    if (data.type === 'linear') {
      if (data.direction) {
        parts.push(data.direction)
      } else if (data.angle) {
        parts.push(data.angle)
      }
    } else if (data.type === 'radial' && data.radial) {
      const radialParts: string[] = []

      // 添加形狀
      if (data.radial.shape) {
        radialParts.push(data.radial.shape)
      }

      // 添加大小
      if (data.radial.size) {
        radialParts.push(data.radial.size)
      }

      // 添加位置
      if (data.radial.position) {
        radialParts.push(`at ${data.radial.position.x} ${data.radial.position.y}`)
      }

      if (radialParts.length > 0) {
        parts.push(radialParts.join(' '))
      }
    }

    // 添加顏色停止點
    const colorStops = data.colorStops.map(stop => {
      if (stop.position) {
        return `${stop.color} ${stop.position}`
      }
      return stop.color
    })

    if (
      (data.type === 'linear' && (data.direction || data.angle)) ||
      (data.type === 'radial' && data.radial)
    ) {
      parts.push(', ')
    }

    parts.push(colorStops.join(', '))
    parts.push(')')

    return parts.join('')
  }
}
