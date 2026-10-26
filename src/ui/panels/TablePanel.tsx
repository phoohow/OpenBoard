/** 表格面板：行列增减与表头强调。 */

export const TablePanel = ({
  rows,
  cols,
  header,
  onAction,
}: {
  rows: number
  cols: number
  header: boolean
  onAction: (action: 'row+' | 'row-' | 'col+' | 'col-' | 'header') => void
}) => (
  <>
    <span className="preset-note">
      当前 {rows} 行 × {cols} 列，行列按整体尺寸均分，可用右下角手柄整体缩放
    </span>
    <div className="btn-row wrap">
      <button type="button" className="chip wide" onClick={() => onAction('row+')}>
        增加一行
      </button>
      <button type="button" className="chip wide" onClick={() => onAction('row-')}>
        删除末行
      </button>
      <button type="button" className="chip wide" onClick={() => onAction('col+')}>
        增加一列
      </button>
      <button type="button" className="chip wide" onClick={() => onAction('col-')}>
        删除末列
      </button>
    </div>
    <button type="button" className={header ? 'chip wide active' : 'chip wide'} onClick={() => onAction('header')}>
      {header ? '表头强调：开' : '表头强调：关'}
    </button>
    <span className="preset-note">双击任意单元格输入内容，Tab 切到下一格、Enter 切到下一行。</span>
  </>
)
