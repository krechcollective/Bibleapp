export interface StrokePoint {
  x: number
  y: number
  pressure: number
  tiltX: number
  tiltY: number
}

export interface Stroke {
  color: string
  points: StrokePoint[]
}

export interface DrawingData {
  width: number
  height: number
  strokes: Stroke[]
}

export const PEN_COLORS = ['#2c2620', '#b3402f', '#2f5fa8'] as const

export function isEmptyDrawing(data: DrawingData): boolean {
  return data.strokes.length === 0
}

export function parseDrawing(content: string): DrawingData | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed && Array.isArray(parsed.strokes)) return parsed as DrawingData
  } catch {
    // not valid drawing JSON
  }
  return null
}

/** Width of the segment between two points, blending pressure and pen tilt for a tapered feel. */
export function segmentWidth(a: StrokePoint, b: StrokePoint, baseWidth: number): number {
  const pressure = (a.pressure + b.pressure) / 2 || 0.5
  const tilt = (Math.abs(a.tiltX) + Math.abs(a.tiltY) + Math.abs(b.tiltX) + Math.abs(b.tiltY)) / 4
  const tiltBoost = 1 + Math.min(tilt / 90, 1) * 0.6
  return Math.max(0.75, baseWidth * pressure * tiltBoost)
}
