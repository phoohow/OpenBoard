/** 演示模式左上角的进度提示。 */

export const PresentHint = ({ name, step, total }: { name: string; step: number; total: number }) => (
  <div className="present-hint">
    <strong>{name}</strong>
    <span>
      演示 {Math.min(step + 1, total)} / {total} · 方向键或 Enter 切换 · Esc 退出
    </span>
  </div>
)
