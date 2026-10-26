/** 便签面板：预设尺寸。 */

import { stickySizes } from '@/model/constants'

export const StickySizePanel = ({
  autoSize,
  onSize,
  onAutoSize,
}: {
  autoSize: boolean
  onSize: (w: number, h: number) => void
  onAutoSize: (value: boolean) => void
}) => (
  <>
    <div className="btn-row wrap">
      {stickySizes.map((s) => (
        <button key={s.label} type="button" className="chip wide" onClick={() => onSize(s.w, s.h)}>
          {s.label} {s.w}×{s.h}
        </button>
      ))}
    </div>
    <button type="button" className={autoSize ? 'chip wide active' : 'chip wide'} onClick={() => onAutoSize(!autoSize)}>
      {autoSize ? '自动撑高：开' : '自动撑高：关'}
    </button>
  </>
)
