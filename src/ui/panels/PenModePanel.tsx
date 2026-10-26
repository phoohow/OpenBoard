/** 画笔面板：笔型、粗细与墨色。 */

import { Pencil } from 'lucide-react'
import { inkPalette, penPresets } from '@/model/constants'
import type { PenMode } from '@/model/types'
import { ColorRow } from '../common/fields'

export const PenModePanel = ({
  mode,
  color,
  width,
  onMode,
  onColor,
  onWidth,
}: {
  mode: PenMode
  color: string
  width: number
  onMode: (mode: PenMode) => void
  onColor: (color: string) => void
  onWidth: (width: number) => void
}) => (
  <>
    <div className="btn-row wrap">
      {(['pen', 'marker', 'highlighter'] as PenMode[]).map((m) => (
        <button key={m} type="button" className={mode === m ? 'chip wide active' : 'chip wide'} onClick={() => onMode(m)}>
          <Pencil size={14} />
          {m === 'pen' ? '钢笔' : m === 'marker' ? '马克笔' : '荧光笔'}
        </button>
      ))}
    </div>
    <ColorRow colors={inkPalette} value={color} onChange={onColor} />
    <div className="slider-row">
      <span>粗细</span>
      <input
        type="range"
        min={1}
        max={40}
        step={1}
        value={mode === 'pen' ? width : penPresets[mode].width}
        disabled={mode !== 'pen'}
        onChange={(e) => onWidth(Number(e.target.value))}
      />
      <em>{mode === 'pen' ? width : penPresets[mode].width}</em>
    </div>
    {mode !== 'pen' && <span className="preset-note">透明度 {Math.round(penPresets[mode].opacity * 100)}%（半透明叠加效果）</span>}
  </>
)
