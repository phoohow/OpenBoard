/** DOM 引用：不需要触发渲染的节点集合，替代散落在各 hook 的 `useRef`。 */

export const dom: {
  wrap: HTMLDivElement | null
  svg: SVGSVGElement | null
  content: SVGGElement | null
  defs: SVGDefsElement | null
  imageInput: HTMLInputElement | null
  markdownInput: HTMLInputElement | null
} = {
  wrap: null,
  svg: null,
  content: null,
  defs: null,
  imageInput: null,
  markdownInput: null,
}
