import { useRef, useState } from 'react'
import type { DrawingData, Stroke, StrokePoint } from '../lib/strokes'
import { PEN_COLORS, segmentWidth } from '../lib/strokes'

const BASE_WIDTH = 3.2

interface DrawingPadProps {
  width: number
  height: number
  initial: DrawingData | null
  onSave: (data: DrawingData) => void
  onCancel: () => void
}

export function DrawingPad({ width, height, initial, onSave, onCancel }: DrawingPadProps) {
  const [strokes, setStrokes] = useState<Stroke[]>(initial?.strokes ?? [])
  const [color, setColor] = useState<string>(PEN_COLORS[0])
  const currentStroke = useRef<Stroke | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Forces a re-render mid-stroke, since currentStroke lives in a ref (avoids
  // rebuilding the strokes array on every pointermove).
  const [, setTick] = useState(0)

  function pointFromEvent(e: React.PointerEvent<SVGSVGElement>): StrokePoint {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX ?? 0,
      tiltY: e.tiltY ?? 0,
    }
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some pointer sessions (synthetic events, certain browsers) don't support
      // capture; drawing still works via bubbled pointermove within the surface.
    }
    currentStroke.current = { color, points: [pointFromEvent(e)] }
    setTick((t) => t + 1)
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!currentStroke.current) return
    currentStroke.current.points.push(pointFromEvent(e))
    setTick((t) => t + 1)
  }

  function endStroke() {
    const finished = currentStroke.current
    if (!finished) return
    currentStroke.current = null
    if (finished.points.length > 1) {
      setStrokes((prev) => [...prev, finished])
    }
    setTick((t) => t + 1)
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1))
  }

  function clear() {
    setStrokes([])
  }

  function renderStroke(stroke: Stroke, key: string | number) {
    const segments = []
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const a = stroke.points[i]
      const b = stroke.points[i + 1]
      segments.push(
        <line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={stroke.color}
          strokeWidth={segmentWidth(a, b, BASE_WIDTH)}
          strokeLinecap="round"
        />,
      )
    }
    return <g key={key}>{segments}</g>
  }

  return (
    <div className="drawing-pad">
      <svg
        ref={svgRef}
        className="drawing-pad-surface"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      >
        {strokes.map((s, i) => renderStroke(s, i))}
        {currentStroke.current && renderStroke(currentStroke.current, 'current')}
      </svg>

      <div className="drawing-pad-toolbar">
        <div className="drawing-pad-colors">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              className={`pen-swatch ${color === c ? 'pen-swatch-active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Pen color ${c}`}
            />
          ))}
        </div>
        <div className="drawing-pad-actions">
          <button onClick={undo} disabled={strokes.length === 0}>
            Undo
          </button>
          <button onClick={clear} disabled={strokes.length === 0}>
            Clear
          </button>
          <button className="drawing-pad-save" onClick={() => onSave({ width, height, strokes })}>
            Save
          </button>
          <button className="drawing-pad-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
