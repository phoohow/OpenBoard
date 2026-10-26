/** 快捷键一览弹层。 */

import { Modal } from '../common/Modal'

export const ShortcutsDialog = ({ onClose }: { onClose: () => void }) => (
  <Modal title="快捷键" onClose={onClose} width={520}>
    <table className="shortcut-table">
      <tbody>
        {[
          ['选择 / 抓手', 'V / H'],
          ['便签 / 文本', 'N / T'],
          ['图形 / 连接线', 'S / C'],
          ['画笔 / 橡皮 / 容器', 'P / E / F'],
          ['思维导图 / 表格', 'M / R'],
          ['成组 / 解组', 'Ctrl/⌘ + G / + Shift + G'],
          ['容器定义整页', 'F 拖拽划定区域'],
          ['导图子节点 / 同级节点', 'Tab / Enter'],
          ['临时平移', '按住 Space 或鼠标中键'],
          ['缩放画布', '滚轮 或 Ctrl/⌘ + +/−'],
          ['适配内容', 'Shift + 1'],
          ['撤销 / 重做', 'Ctrl/⌘ + Z / + Shift + Z'],
          ['复制 / 剪切 / 粘贴', 'Ctrl/⌘ + C / X / V'],
          ['原位置再制', 'Ctrl/⌘ + D'],
          ['全选 / 删除', 'Ctrl/⌘ + A / Delete'],
          ['锁定所选', 'Ctrl/⌘ + L'],
          ['跳过吸附', '拖拽时按住 Alt'],
          ['演示切换焦点', '→ / ← / Enter'],
          ['方向微调', '方向键（Shift 步进更大）'],
          ['退出编辑 / 演示', 'Esc'],
        ].map(([label, key]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>
              <kbd>{key}</kbd>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </Modal>
)
