/** 属性面板通用控件：色块行、数字输入、可提交文本行。 */

import { useEffect, useState } from 'react'

export const ColorRow = ({ colors, value, onChange, extra }: { colors: string[]; value: string; onChange: (c: string) => void; extra?: string[] }) => (
  <div className="swatches">
    {(extra ? [...extra, ...colors] : colors).map((c) => (
      <button
        key={c}
        type="button"
        className={`swatch ${value === c ? 'active' : ''} ${c === 'transparent' ? 'none' : ''}`}
        style={{ background: c === 'transparent' ? '#fff' : c }}
        onClick={() => onChange(c)}
        aria-label={c}
      />
    ))}
  </div>
)

export const NumberField = ({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }) => (
  <label className="field">
    <span>{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? Math.round(value) : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value)
        if (Number.isFinite(n)) onChange(n)
      }}
    />
  </label>
)


export const Field = ({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string
  value: string
  placeholder?: string
  onCommit: (value: string) => void
}) => {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <label className="panel-field">
      <span>{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      />
    </label>
  )
}
