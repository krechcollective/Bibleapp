import { useRef, useState } from 'react'
import type { Stroke, StrokePoint } from '../lib/strokes'
import { segmentWidth } from '../lib/strokes'

const BASE_WIDTH = 3

interface PositionedDrawing {
  id: string
  top: number
  strokes: Stroke[]
}

interface MarginCanvasProps {
  width: number
  height: number
  drawings: PositionedDrawing[]
  color: string
  /** Fires once a stroke ends, with points in margin-local coordinates (y = 0 at the margin's top). */
  onStrokeComplete: (points: StrokePoint[]) => void
}

function renderStrokeLines(points: StrokePoint[], color: string, keyPrefix: string | number) {
  const segments = []
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    segments.push(
      <line
        key={i}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={segmentWidth(a, b, BASE_WIDTH)}
        strokeLinecap="round"
      />,
    )
  }
  return <g key={keyPrefix}>{segments}</g>
}

export function MarginCanvas({ width, height, drawings, color, onStrokeComplete }: MarginCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const currentStroke = useRef<StrokePoint[] | null>(null)
  // Forces a re-render mid-stroke; the in-progress stroke itself lives in a ref.
  const [, setTick] = useState(0)

  function pointFromEvent(e: React.PointerEvent<SVGSVGElement>): StrokePoint {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX ?? 0,
      tiltY: e.tiltY ?? 0,
    }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Synthetic/unsupported pointer sessions can't be captured; drawing still
      // works via bubbled pointermove as long as the pointer stays on the surface.
    }
    currentStroke.current = [pointFromEvent(e)]
    setTick((t) => t + 1)
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!currentStroke.current) return
    currentStroke.current.push(pointFromEvent(e))
    setTick((t) => t + 1)
  }

  function endStroke() {
    const finished = currentStroke.current
    currentStroke.current = null
    if (finished && finished.length > 1) onStrokeComplete(finished)
    setTick((t) => t + 1)
  }

  return (
    <svg
      ref={svgRef}
      className="margin-canvas"
      width={width}
      height={height}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerLeave={endStroke}
      onPointerCancel={endStroke}
    >
      {drawings.map((d) => (
        <g key={d.id} transform={`translate(0, ${d.top})`}>
          {d.strokes.map((s, i) => renderStrokeLines(s.points, s.color, i))}
        </g>
      ))}
      {currentStroke.current && renderStrokeLines(currentStroke.current, color, 'live')}
    </svg>
  )
}
