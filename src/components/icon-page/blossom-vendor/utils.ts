import { hexToHsl, hslToHex, hslToRgb, rgbToHsl } from '@/lib/color-utils'

import { BlossomColorPickerColor, ColorInput } from './types'

export function lightnessToSliderValue(l: number): number {
  const minLightness = 5
  const maxLightness = 95
  const clampedL = Math.max(minLightness, Math.min(maxLightness, l))
  return ((maxLightness - clampedL) / (maxLightness - minLightness)) * 100
}

export function sliderValueToLightness(sliderValue: number): number {
  const minLightness = 5
  const maxLightness = 95
  return maxLightness - (sliderValue / 100) * (maxLightness - minLightness)
}

export function parseColor(input: ColorInput): {
  h: number
  s: number
  l: number
} {
  if (typeof input === 'object') return input

  const str = input.trim().toLowerCase()

  if (str.startsWith('#')) return hexToHsl(str)

  const hslMatch = str.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/)
  if (hslMatch) {
    return {
      h: Math.round(parseFloat(hslMatch[1])),
      s: Math.round(parseFloat(hslMatch[2])),
      l: Math.round(parseFloat(hslMatch[3])),
    }
  }

  const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/)
  if (rgbMatch) {
    return rgbToHsl({
      r: parseFloat(rgbMatch[1]),
      g: parseFloat(rgbMatch[2]),
      b: parseFloat(rgbMatch[3]),
    })
  }

  return { h: 0, s: 0, l: 50 }
}

export function getVisualSaturation(sliderValue: number, baseSaturation: number): number {
  return sliderValue < 10 ? (sliderValue / 10) * baseSaturation : baseSaturation
}

export function hslToString(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

export function hslaToString(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${(a / 100).toFixed(2)})`
}

export function rgbaToString(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a / 100).toFixed(2)})`
}

export function createColorOutput(
  hue: number,
  sliderValue: number,
  visualSaturation: number,
  baseSaturation: number,
  lightness: number,
  alpha: number,
  layer: 'inner' | 'outer',
): BlossomColorPickerColor {
  const { r, g, b } = hslToRgb(hue, visualSaturation, lightness)
  return {
    hue,
    saturation: sliderValue,
    originalSaturation: baseSaturation,
    lightness,
    alpha,
    layer,
    r,
    g,
    b,
    hex: hslToHex(hue, visualSaturation, lightness),
    hsl: hslToString(hue, visualSaturation, lightness),
    hsla: hslaToString(hue, visualSaturation, lightness, alpha),
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: rgbaToString(r, g, b, alpha),
  }
}

export function organizeColorsIntoLayers(
  colors: { h: number; s: number; l: number }[],
): { h: number; s: number; l: number }[][] {
  if (!colors || colors.length === 0) return []

  const sortedByLightness = colors.toSorted((a, b) => b.l - a.l)
  const total = sortedByLightness.length

  let layerCounts: number[] = []

  if (total <= 10) {
    layerCounts = [total]
  } else if (total <= 24) {
    const inner = Math.max(4, Math.floor(total * 0.35))
    layerCounts = [inner, total - inner]
  } else if (total <= 42) {
    const inner = Math.max(5, Math.floor(total * 0.15))
    const middle = Math.floor(total * 0.35)
    layerCounts = [inner, middle, total - inner - middle]
  } else {
    const inner = Math.max(6, Math.floor(total * 0.1))
    const mid1 = Math.floor(total * 0.2)
    const mid2 = Math.floor(total * 0.3)
    layerCounts = [inner, mid1, mid2, total - inner - mid1 - mid2]
  }

  const layers: { h: number; s: number; l: number }[][] = []
  let currentIndex = 0

  for (let i = 0; i < layerCounts.length; i++) {
    const count = layerCounts[i]
    const itemsForThisLayer = sortedByLightness.slice(currentIndex, currentIndex + count)

    itemsForThisLayer.sort((a, b) => a.h - b.h)

    if (itemsForThisLayer.length > 0) {
      layers.push(itemsForThisLayer)
    }
    currentIndex += count
  }

  return layers
}
