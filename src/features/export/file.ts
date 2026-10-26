/** 文件读写与 JSON 快照导出：下载、本地文件读取、白板 JSON。 */

export const downloadBlob = (filename: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const downloadText = (filename: string, text: string, type: string): void => {
  downloadBlob(filename, new Blob([text], { type }))
}

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })

export const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

export const exportJSONFile = (name: string, elements: unknown[], updatedAt: number): void => {
  const payload = { version: 1, type: 'OpenBoard', name, updatedAt, elements }
  downloadText(`${name}.json`, JSON.stringify(payload, null, 2), 'application/json')
}
