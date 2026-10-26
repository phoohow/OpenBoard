/** 两个隐藏的文件输入：图片插入与 Markdown 导入共用一个受控入口。 */

import type { Ref } from 'react'

export interface FileInputsProps {
  imageRef: Ref<HTMLInputElement>
  markdownRef: Ref<HTMLInputElement>
  onImage: (file: File) => void
  onMarkdown: (file: File) => void
}

const HiddenFileInput = ({
  inputRef,
  accept,
  onPick,
}: {
  inputRef: Ref<HTMLInputElement>
  accept: string
  onPick: (file: File) => void
}) => (
  <input
    ref={inputRef}
    type="file"
    accept={accept}
    hidden
    onChange={(e) => {
      const file = e.target.files?.[0]
      if (file) onPick(file)
      e.target.value = ''
    }}
  />
)

export const FileInputs = ({ imageRef, markdownRef, onImage, onMarkdown }: FileInputsProps) => (
  <>
    <HiddenFileInput inputRef={imageRef} accept="image/*" onPick={onImage} />
    <HiddenFileInput inputRef={markdownRef} accept=".md,.txt" onPick={onMarkdown} />
  </>
)
