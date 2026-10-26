/** 导出与分享弹层。 */

import { useState } from 'react'
import { Copy, Download, FileImage, FileJson, FileText, Printer, Upload } from 'lucide-react'
import { Modal } from '../common/Modal'

export const ExportDialog = (props: {
  name: string
  busy: string | null
  count: number
  scope: 'content' | 'selection' | 'view'
  scale: number
  transparent: boolean
  onScope: (scope: 'content' | 'selection' | 'view') => void
  onScale: (scale: number) => void
  onTransparent: (value: boolean) => void
  onPNG: () => void
  onSVG: () => void
  onJSON: () => void
  onPDF: () => void
  onMarkdown: () => void
  onImportMarkdown: () => void
  onClose: () => void
}) => (
  <Modal title="导出白板" subtitle={`${props.name} · ${props.count} 个元素`} onClose={props.onClose}>
    <div className="option-row">
      <span>范围</span>
      <div className="btn-row">
        {(['content', 'selection', 'view'] as const).map((s) => (
          <button key={s} type="button" className={props.scope === s ? 'chip wide active' : 'chip wide'} disabled={s === 'selection' && !props.count} onClick={() => props.onScope(s)}>
            {s === 'content' ? '全部内容' : s === 'selection' ? '选中元素' : '当前视图'}
          </button>
        ))}
      </div>
    </div>
    <div className="option-row">
      <span>倍数</span>
      <div className="btn-row">
        {[1, 2, 4].map((s) => (
          <button key={s} type="button" className={props.scale === s ? 'chip wide active' : 'chip wide'} onClick={() => props.onScale(s)}>
            {s}x
          </button>
        ))}
      </div>
    </div>
    <div className="option-row">
      <span>背景</span>
      <div className="btn-row">
        <button type="button" className={props.transparent ? 'chip wide' : 'chip wide active'} onClick={() => props.onTransparent(false)}>
          白色
        </button>
        <button type="button" className={props.transparent ? 'chip wide active' : 'chip wide'} onClick={() => props.onTransparent(true)}>
          透明
        </button>
      </div>
    </div>
    <div className="export-list">
      <button type="button" disabled={!!props.busy} onClick={props.onPNG}>
        <FileImage size={18} />
        <span>
          <strong>PNG 图片</strong>
          <em>适合插入到文档与幻灯片</em>
        </span>
      </button>
      <button type="button" disabled={!!props.busy} onClick={props.onSVG}>
        <Download size={18} />
        <span>
          <strong>SVG 矢量图</strong>
          <em>可继续在矢量软件中编辑</em>
        </span>
      </button>
      <button type="button" disabled={!!props.busy} onClick={props.onJSON}>
        <FileJson size={18} />
        <span>
          <strong>JSON 源文件</strong>
          <em>可再次导入继续编辑</em>
          </span>
          </button>
          <button type="button" disabled={!!props.busy} onClick={props.onPDF}>
            <Printer size={18} />
            <span>
              <strong>PDF / 打印</strong>
              <em>在打印对话框选择「另存为 PDF」</em>
            </span>
          </button>
          <button type="button" onClick={props.onMarkdown}>
            <FileText size={18} />
            <span>
              <strong>Markdown 大纲</strong>
              <em>导出可编辑的文本大纲</em>
            </span>
          </button>
          <button type="button" onClick={props.onImportMarkdown}>
            <Upload size={18} />
            <span>
              <strong>导入 Markdown</strong>
              <em>从 .md 文件生成便签与卡片</em>
            </span>
          </button>
          </div>
    {props.busy && <p className="confirm-text">{props.busy}</p>}
  </Modal>
)

export const ShareDialog = (props: { name: string; onExportJSON: () => void; onClose: () => void }) => {
  const [copied, setCopied] = useState(false)
  return (
    <Modal title="分享这个白板" subtitle="首版本地优先，暂不支持云端实时协作" onClose={props.onClose}>
      <div className="share-card">
        <strong>{props.name}</strong>
        <p>你可以导出一份 JSON 版本副本，对方在 OpenBoard 中导入即可继续编辑。</p>
      </div>
      <div className="modal-foot">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(`${props.name} · OpenBoard`).catch(() => undefined)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          <Copy size={15} /> {copied ? '已复制名称' : '复制信息'}
        </button>
        <button type="button" className="btn primary" onClick={props.onExportJSON}>
          <FileJson size={15} /> 导出版本副本
        </button>
      </div>
    </Modal>
  )
}
