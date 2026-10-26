/** 小地图：缩略展示全部元素与当前视口，点击跳转。 */

import type { BoardElement } from '@/model/types'

export const Minimap = (props: {
  elements: BoardElement[]
  viewport: { x: number; y: number; zoom: number }
  canvas: { w: number; h: number }
  onJump: (point: { x: number; y: number }) => void
}) => {
  const W = 208
  const H = 132
  const camera = {
    x: -props.viewport.x / props.viewport.zoom,
    y: -props.viewport.y / props.viewport.zoom,
    w: props.canvas.w / props.viewport.zoom,
    h: props.canvas.h / props.viewport.zoom,
  }
  let minX = camera.x
  let minY = camera.y
  let maxX = camera.x + camera.w
  let maxY = camera.y + camera.h
  for (const el of props.elements) {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + el.w)
    maxY = Math.max(maxY, el.y + el.h)
  }
  const world = { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) }
  const scale = Math.min(W / world.w, H / world.h)
  const toMini = (x: number, y: number) => ({ x: (x - world.x) * scale, y: (y - world.y) * scale })

  return (
    <div className="minimap" title="点击跳转视图">
      <svg
        width={W}
        height={H}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mx = e.clientX - rect.left
          const my = e.clientY - rect.top
          props.onJump({ x: world.x + mx / scale, y: world.y + my / scale })
        }}
      >
        <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
        {props.elements.map((el) => {
          const p = toMini(el.x, el.y)
          return (
            <rect
              key={el.id}
              x={p.x}
              y={p.y}
              width={Math.max(1.5, el.w * scale)}
              height={Math.max(1.5, el.h * scale)}
              fill={el.kind === 'draw' || el.kind === 'connector' ? '#B9A8EA' : el.fill === 'transparent' ? '#CFCADB' : el.fill}
              opacity={0.9}
            />
          )
        })}
        {(() => {
          const p = toMini(camera.x, camera.y)
          return (
            <rect
              x={p.x}
              y={p.y}
              width={Math.max(4, camera.w * scale)}
              height={Math.max(4, camera.h * scale)}
              fill="#7357E8"
              fillOpacity={0.12}
              stroke="#7357E8"
              strokeWidth={1.5}
            />
          )
        })()}
      </svg>
    </div>
  )
}
