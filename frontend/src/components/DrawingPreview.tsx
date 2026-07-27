import type { DrawingData } from '../lib/strokes'
import { segmentWidth } from '../lib/strokes'

const BASE_WIDTH = 3.2

export function DrawingPreview({ data }: { data: DrawingData }) {
  return (
    <svg
      className="drawing-preview"
      width={data.width}
      height={data.height}
      viewBox={`0 0 ${data.width} ${data.height}`}
    >
      {data.strokes.map((stroke, si) => (
        <g key={si}>
          {stroke.points.slice(0, -1).map((a, i) => {
            const b = stroke.points[i + 1]
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke.color}
                strokeWidth={segmentWidth(a, b, BASE_WIDTH)}
                strokeLinecap="round"
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}
