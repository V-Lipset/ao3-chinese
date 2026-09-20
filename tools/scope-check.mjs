#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const MARKER_RE = /^\s*\/\*\s*==AOT-SPLIT:REGION\s+([A-Za-z0-9._-]+)\s+(BEGIN|END)\s*==\s*\*\/\s*$/
const KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
  'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'yield', 'let', 'static', 'async', 'await', 'get', 'set', 'of', 'true', 'false', 'null',
  'undefined', 'NaN', 'Infinity',
])

const argv = process.argv.slice(2)
let file = path.join(ROOT, 'local.user.js')
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--file') file = path.resolve(argv[++i])
  else if (argv[i] === '-h' || argv[i] === '--help') {
    console.log('用法: node tools/scope-check.mjs [--file <local.user.js 路径>]')
    process.exit(0)
  } else {
    console.error(`未知参数: ${argv[i]}`)
    process.exit(2)
  }
}

const errors = []
const notes = []

if (!fs.existsSync(file)) {
  console.error(`✗ 找不到文件: ${file}`)
  process.exit(1)
}
const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')

const marks = []
lines.forEach((line, idx) => {
  const m = line.match(MARKER_RE)
  if (m) marks.push({ id: m[1], kind: m[2], idx })
})

if (!marks.length) {
  console.error('✗ 文件里没有任何 ==AOT-SPLIT:REGION <id> BEGIN/END== 标记。')
  console.error('  请先在 local.user.js 中，把要切出去的区段用成对标记包起来，例如：')
  console.error('    /* ==AOT-SPLIT:REGION zh-cn BEGIN== */')
  console.error('    ...')
  console.error('    /* ==AOT-SPLIT:REGION zh-cn END== */')
  process.exit(1)
}

const regions = []
const seen = new Map()
for (const mk of marks) {
  const key = `${mk.id}:${mk.kind}`
  if (seen.has(key)) errors.push(`标记重复：${mk.id} ${mk.kind}（第 ${seen.get(key) + 1} 行 与 第 ${mk.idx + 1} 行）`)
  seen.set(key, mk.idx)
}
const ids = [...new Set(marks.map((m) => m.id))]
for (const id of ids) {
  const b = marks.find((m) => m.id === id && m.kind === 'BEGIN')
  const e = marks.find((m) => m.id === id && m.kind === 'END')
  if (!b || !e) { errors.push(`标记不成对：region "${id}" 缺少 ${b ? 'END' : 'BEGIN'}`); continue }
  if (e.idx <= b.idx) { errors.push(`标记顺序错误：region "${id}" 的 END 在 BEGIN 之前`); continue }
  regions.push({ id, begin: b.idx, end: e.idx })
}
regions.sort((a, b) => a.begin - b.begin)
for (let i = 1; i < regions.length; i += 1) {
  if (regions[i].begin <= regions[i - 1].end) {
    errors.push(`标记区间重叠：region "${regions[i - 1].id}" 与 "${regions[i].id}"`)
  }
}
if (errors.length) {
  console.error('✗ 标记格式有误，无法继续校验：')
  errors.forEach((e) => console.error(`   · ${e}`))
  process.exit(1)
}

const inRegion = new Set()
for (const r of regions) for (let i = r.begin; i <= r.end; i += 1) inRegion.add(i)
const mainText = lines.filter((_, i) => !inRegion.has(i)).join('\n')

const REGEX_PREV = new Set([...'=(,:[!&|?{};+*%~^<>'])
function stripLiterals(code) {
  let out = ''
  let i = 0
  let prev = ''
  let mode = 'code'
  const tpl = []
  let depth = 0
  while (i < code.length) {
    const c = code[i]
    const c2 = code[i + 1]
    if (mode === 'code') {
      if (c === '/' && c2 === '/') { mode = 'line'; i += 2; continue }
      if (c === '/' && c2 === '*') { mode = 'block'; i += 2; continue }
      if (c === "'") { mode = 'sq'; i += 1; continue }
      if (c === '"') { mode = 'dq'; i += 1; continue }
      if (c === '`') { mode = 'tpl'; i += 1; continue }
      if (c === '/' && (prev === '' || REGEX_PREV.has(prev))) { mode = 'regex'; i += 1; continue }
      if (c === '{') depth += 1
      else if (c === '}') {
        depth -= 1
        if (tpl.length && depth < tpl[tpl.length - 1]) { tpl.pop(); mode = 'tpl'; i += 1; continue }
      }
      out += c
      if (!/\s/.test(c)) prev = c
      i += 1
      continue
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += '\n' } i += 1; continue }
    if (mode === 'block') { if (c === '*' && c2 === '/') { mode = 'code'; i += 2 } else i += 1; continue }
    if (mode === 'sq' || mode === 'dq') {
      if (c === '\\') { i += 2; continue }
      if (c === (mode === 'sq' ? "'" : '"')) mode = 'code'
      i += 1; continue
    }
    if (mode === 'regex') {
      if (c === '\\') { i += 2; continue }
      if (c === '/' && code[i - 1] !== '[') mode = 'code'
      i += 1; continue
    }
    if (mode === 'tpl') {
      if (c === '\\') { i += 2; continue }
      if (c === '`') { mode = 'code'; i += 1; continue }
      if (c === '$' && c2 === '{') { depth += 1; tpl.push(depth); mode = 'code'; i += 2; continue }
      out += ' '
      i += 1; continue
    }
    i += 1
  }
  return out
}

function identifiers(code) {
  const clean = stripLiterals(code)
  const found = new Set()
  const re = /[A-Za-z_$][\w$]*/g
  let m
  while ((m = re.exec(clean))) {
    const name = m[0]
    if (KEYWORDS.has(name)) continue
    if (clean[m.index - 1] === '.') continue
    found.add(name)
  }
  return found
}

function parameters(code) {
  const clean = stripLiterals(code)
  const declared = new Set()
  const patterns = [
    /function\s*[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g,
    /function\s*\(([^)]*)\)/g,
    /\(([^)]*)\)\s*=>/g,
    /(?:^|[,(=\s])([A-Za-z_$][\w$]*)\s*=>/g,
    /catch\s*\(([^)]*)\)/g,
    /(?:^|[{,;\n])\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*\(([^)]*)\)\s*\{/g,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(clean))) {
      for (const id of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) {
        if (!KEYWORDS.has(id[0])) declared.add(id[0])
      }
    }
  }
  return declared
}

const DECL_RE = /^\t?(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/
const mainDecls = new Set()
for (const line of mainText.split('\n')) {
  const m = line.match(DECL_RE)
  if (m) mainDecls.add(m[1])
}
const exposed = new Set()
for (const m of mainText.matchAll(/(?:window|globalThis)\.([A-Za-z_$][\w$]*)\s*=/g)) exposed.add(m[1])

console.log(`校验文件: ${path.relative(ROOT, file) || file}`)
console.log(`main 侧 IIFE 内声明: ${mainDecls.size} 个（其中 ${exposed.size} 个已挂到 window/globalThis）`)
console.log(`待校验 region: ${regions.length} 个\n`)

let violations = 0
for (const r of regions) {
  const body = lines.slice(r.begin + 1, r.end).join('\n')
  const ownDecls = new Set()
  for (const line of body.split('\n')) {
    const m = line.match(DECL_RE)
    if (m) ownDecls.add(m[1])
  }
  for (const p of parameters(body)) ownDecls.add(p)
  const refs = identifiers(body)
  const bad = []
  const viaGlobal = []
  for (const name of refs) {
    if (ownDecls.has(name) || !mainDecls.has(name)) continue
    if (exposed.has(name)) viaGlobal.push(name)
    else bad.push(name)
  }
  bad.sort()
  viaGlobal.sort()
  const linesCount = r.end - r.begin - 1
  console.log(`── region "${r.id}"  第 ${r.begin + 2}–${r.end} 行（${linesCount} 行），自身声明 ${ownDecls.size} 个名字`)
  if (viaGlobal.length) {
    notes.push(`region "${r.id}" 通过 window/globalThis 依赖 main 侧：${viaGlobal.join(', ')}`)
    console.log(`   ⚠ 经 window/globalThis 间接依赖: ${viaGlobal.join(', ')}（允许，但属于隐式耦合）`)
  }
  if (bad.length) {
    violations += bad.length
    console.log(`   ✗ 违规 ${bad.length} 个：这些名字只在 main 侧 IIFE 内声明，region 里取不到`)
    for (const n of bad) console.log(`        ${n}`)
  } else if (!viaGlobal.length) {
    console.log('   ✓ 无跨层依赖')
  }
  console.log('')
}

if (notes.length) {
  console.log('提示：')
  notes.forEach((n) => console.log(`   · ${n}`))
  console.log('')
}

if (violations) {
  console.error(`✗ 作用域校验失败：共 ${violations} 个越界引用。`)
  console.error('  这些代码被切进独立文件后会在运行期抛 ReferenceError。')
  console.error('  修法：把它们移回 main 侧，或把它们挪进 region，或在 main 侧挂到 window 上。')
  process.exit(1)
}
console.log('✓ 作用域校验通过：region 不依赖 main 侧 IIFE 内部声明。')
