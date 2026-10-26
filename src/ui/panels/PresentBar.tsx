/** 演示控制条：翻页、激光笔、计时与表情反馈。 */

import { ChevronLeft, ChevronRight, Crosshair, Route, Timer, X } from 'lucide-react'

const REACTIONS = ['👏', '👍', '❤️', '🎉', '🔥', '😄']
const TIMER_PRESETS = [1, 3, 5, 10]

const mmss = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const PresentBar = (props: {
  mode: 'element' | 'slides' | 'route'
  step: number
  total: number
  title: string
  laser: boolean
  timerLeft: number
  timerRunning: boolean
  onMode: (mode: 'element' | 'slides' | 'route') => void
  onPrev: () => void
  onNext: () => void
  onExit: () => void
  onLaser: () => void
  onTimer: () => void
  onTimerPreset: (minutes: number) => void
  onReaction: (emoji: string) => void
  onRoute: () => void
}) => (
  <div className="present-bar">
    <div className="present-page">
      <button type="button" className="icon-btn sm" title="上一页 (←)" onClick={props.onPrev} disabled={!props.total}>
        <ChevronLeft size={16} />
      </button>
      <span className="present-count">
        {props.total ? `${props.step + 1} / ${props.total}` : '无内容'}
      </span>
      <button type="button" className="icon-btn sm" title="下一页 (→)" onClick={props.onNext} disabled={!props.total}>
        <ChevronRight size={16} />
      </button>
      <span className="present-title">{props.title}</span>
    </div>

    <div className="present-chip-row">
      <button type="button" className={props.mode === 'element' ? 'chip active' : 'chip'} onClick={() => props.onMode('element')}>
        逐元素
      </button>
      <button type="button" className={props.mode === 'slides' ? 'chip active' : 'chip'} onClick={() => props.onMode('slides')}>
        分页（容器）
      </button>
      <button type="button" className={props.mode === 'route' ? 'chip active' : 'chip'} onClick={() => props.onMode('route')}>
        路线图
      </button>
      <button type="button" className="chip" onClick={props.onRoute}>
        <Route size={13} /> 编辑路线
      </button>
    </div>

    <div className="present-chip-row">
      <button type="button" className={props.laser ? 'chip active' : 'chip'} title="激光笔 (L)" onClick={props.onLaser}>
        <Crosshair size={13} /> 激光笔
      </button>
      <button type="button" className="chip" onClick={props.onTimer}>
        <Timer size={13} /> {mmss(props.timerLeft)}
      </button>
      {TIMER_PRESETS.map((m) => (
        <button key={m} type="button" className="chip slim" onClick={() => props.onTimerPreset(m)}>
          {m}′
        </button>
      ))}
      <button type="button" className={props.timerRunning ? 'chip active' : 'chip'} onClick={props.onTimer}>
        {props.timerRunning ? '暂停计时' : '开始计时'}
      </button>
    </div>

    <div className="present-chip-row">
      {REACTIONS.map((emoji) => (
        <button key={emoji} type="button" className="chip reaction-chip" onClick={() => props.onReaction(emoji)}>
          {emoji}
        </button>
      ))}
    </div>

    <button type="button" className="btn ghost" onClick={props.onExit}>
      <X size={15} /> 退出 (Esc)
    </button>
  </div>
)
