#!/usr/bin/env node
/**
 * 分层守卫：静态断言源码的依赖方向与已被删除的旧符号不再出现。
 *
 * 依赖规则：model ← geometry ← domain ← features ← app ← App.tsx
 *           ui / canvas 只允许依赖 model / geometry / domain / features（以及同层）。
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const ROOT = resolve(process.cwd(), 'src')

/** 各层允许依赖的层（同层互引总是允许）。 */
const ALLOWED = {
  model: ['model'],
  geometry: ['model', 'geometry'],
  domain: ['model', 'geometry', 'domain'],
  features: ['model', 'geometry', 'domain', 'features'],
  app: ['model', 'geometry', 'domain', 'features', 'app'],
  ui: ['model', 'geometry', 'domain', 'features', 'ui'],
  canvas: ['model', 'geometry', 'domain', 'features', 'canvas'],
  root: ['model', 'geometry', 'domain', 'features', 'app', 'ui', 'canvas', 'root'],
}

/** 不允许出现 `react` 依赖的层：领域必须能脱离 React 单测。 */
const PURE_LAYERS = new Set(['model', 'geometry', 'domain', 'features'])

/** 已被删除的符号：重新出现说明旧写入口回流。 */
const BANNED_SYMBOLS = [
  { pattern: /\bsetElements\s*\(/g, hint: '元素写入必须走 dispatch(Command)' },
  { pattern: /\bEditorCtx\b/g, hint: '上帝契约已被 EditorState + 分组 action 取代' },
  { pattern: /\buseCanvasPointer\b/g, hint: '指针状态机已迁到 app/interaction/pointer.ts' },
]

const SOURCE = /\.(ts|tsx)$/
const IMPORT = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g

const walk = (dir) => {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (SOURCE.test(entry.name)) out.push(full)
  }
  return out
}

/** 由绝对路径推出所属层：`src/domain/x.ts` → `domain`，`src/App.tsx` → `root`。 */
const layerOf = (file) => {
  const parts = relative(ROOT, file).split(sep)
  if (parts.length === 1) return 'root'
  return parts[0] in ALLOWED ? parts[0] : 'root'
}

/** 把 import 说明符解析成所属层，外部依赖返回 null。 */
const resolveLayer = (spec, file) => {
  if (spec.startsWith('@/')) return spec.slice(2).split('/')[0]
  if (spec.startsWith('.')) return layerOf(resolve(file, '..', spec))
  return null
}

const errors = []

for (const file of walk(ROOT)) {
  const layer = layerOf(file)
  const source = readFileSync(file, 'utf8')
  const where = relative(process.cwd(), file)

  if (PURE_LAYERS.has(layer) && /from\s+['"]react['"]/.test(source)) {
    errors.push(`${where}: ${layer} 层不得依赖 react`)
  }

  for (const match of source.matchAll(IMPORT)) {
    const target = resolveLayer(match[1], file)
    if (!target || target === layer) continue
    if (!ALLOWED[layer]?.includes(target)) {
      errors.push(`${where}: ${layer} 层不得依赖 ${target} 层（${match[1]}）`)
    }
  }

  for (const { pattern, hint } of BANNED_SYMBOLS) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length
      errors.push(`${where}:${line}: 检出已删除符号 ${match[0].trim()} —— ${hint}`)
    }
  }
}

if (errors.length) {
  console.error(`分层守卫失败，共 ${errors.length} 项：`)
  for (const error of errors) console.error(`  ✗ ${error}`)
  process.exit(1)
}

console.log('分层守卫通过：依赖方向正确，旧符号无残留。')
