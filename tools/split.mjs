#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(TOOLS_DIR, '..')
const SELF = path.basename(fileURLToPath(import.meta.url))

const MARKER_RE = /^\s*\/\*\s*==AOT-SPLIT:REGION\s+([A-Za-z0-9._-]+)\s+(BEGIN|END)\s*==\s*\*\/\s*$/
const DEFAULT_REQUIRE_BASE = 'https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/'
const REGION_DESC = { 'zh-cn': 'AO3 Translator 的词库文件' }

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}
let step = 0
const say = (s) => console.log(s)
const head = (s) => console.log(`\n${c.bold(`[${++step}] ${s}`)}`)
const ok = (s) => console.log(`    ${c.green('✓')} ${s}`)
const warn = (s) => console.log(`    ${c.yellow('!')} ${s}`)
function die(msg, hint) {
  console.error(`\n${c.red('✗ 拆分中止：')}${msg}`)
  if (hint) console.error(`  ${hint}`)
  process.exit(1)
}

function parseArgs(argv) {
  const o = {
    source: path.join(ROOT, 'local.user.js'),
    out: null,
    requireBase: DEFAULT_REQUIRE_BASE,
    bump: true,
    dryRun: false,
    backup: false,
    keep: 5,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    const val = () => {
      const v = argv[++i]
      if (v === undefined) die(`选项 ${a} 缺少参数`)
      return v
    }
    if (a === '--source') o.source = path.resolve(val())
    else if (a === '--out') o.out = path.resolve(val())
    else if (a === '--require-base') o.requireBase = val()
    else if (a === '--no-bump') o.bump = false
    else if (a === '--dry-run') { o.dryRun = true; o.bump = false }
    else if (a === '--backup') o.backup = true
    else if (a === '--keep') o.keep = Number(val())
    else if (a === '-h' || a === '--help') {
      console.log(`用法: node tools/${SELF} [选项]

  --source <path>       源文件，默认 <repo>/local.user.js
  --out <dir>           输出目录，默认源文件所在目录
  --require-base <url>  @require 的 URL 前缀
  --no-bump             不修改源文件的 @version
  --dry-run             只校验，不写任何文件
  --backup              额外留一份 <源文件>.bak-<时间戳>（默认不留；
                        源文件在 git 里，回滚用 git checkout -- local.user.js）
  --keep <n>            配合 --backup，保留最近 n 份，默认 5
`)
      process.exit(0)
    } else die(`未知选项: ${a}`, `用 --help 查看用法`)
  }
  o.source = path.resolve(o.source)
  o.out = o.out || path.dirname(o.source)
  if (!o.requireBase.endsWith('/')) o.requireBase += '/'
  return o
}

function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function readVersion(lines) {
  for (const l of lines) {
    const m = l.match(/^\/\/\s*@version\s+(\S+)/)
    if (m) return m[1]
  }
  die('源文件头部找不到 // @version 行')
}

function bumpVersion(old, date) {
  const base = String(old).replace(/-.*$/, '')
  if (!/^\d+\.\d+\.\d+$/.test(base)) die(`无法从 @version "${old}" 解析出 主.次.修订 版本号`)
  return `${base}-${date}`
}

function locate(lines) {
  const marks = []
  lines.forEach((line, idx) => {
    const m = line.match(MARKER_RE)
    if (m) marks.push({ id: m[1], kind: m[2], idx })
  })
  if (!marks.length) {
    die('源文件里没有任何 ==AOT-SPLIT:REGION 标记', '至少需要一个成对的 BEGIN / END 标记来界定要切出去的区段')
  }
  const dup = new Set()
  for (const m of marks) {
    const k = `${m.id}:${m.kind}`
    if (dup.has(k)) die(`标记重复：${m.id} ${m.kind}`)
    dup.add(k)
  }
  const regions = []
  for (const id of [...new Set(marks.map((m) => m.id))]) {
    const b = marks.find((m) => m.id === id && m.kind === 'BEGIN')
    const e = marks.find((m) => m.id === id && m.kind === 'END')
    if (!b || !e) die(`region "${id}" 的标记不成对（缺少 ${b ? 'END' : 'BEGIN'}）`)
    if (e.idx <= b.idx) die(`region "${id}" 的 END 出现在 BEGIN 之前`)
    regions.push({ id, begin: b.idx, end: e.idx })
  }
  regions.sort((a, b) => a.begin - b.begin)
  for (let i = 1; i < regions.length; i += 1) {
    if (regions[i].begin <= regions[i - 1].end) {
      die(`region "${regions[i - 1].id}" 与 "${regions[i].id}" 的标记区间重叠或嵌套`)
    }
  }
  return regions
}

function buildOutputs(lines, regions, newVersion, requireBase) {
  const drop = new Set()
  for (const r of regions) for (let i = r.begin; i <= r.end; i += 1) drop.add(i)
  const mainLines = lines.filter((_, i) => !drop.has(i))

  const headerEnd = mainLines.findIndex((l) => /^\/\/\s*==\/UserScript==\s*$/.test(l))
  if (headerEnd < 0) die('在 main 侧找不到 // ==/UserScript== 头部结束标记')
  const header = mainLines.slice(0, headerEnd + 1)
  const rest = mainLines.slice(headerEnd + 1)

  const meta = (key) => {
    const l = header.find((x) => new RegExp(`^//\\s*@${key}\\s+`).test(x))
    return l ? l.replace(new RegExp(`^//\\s*@${key}\\s+`), '').trim() : ''
  }
  const name = meta('name') || 'AO3 Translator'

  const newHeader = []
  for (const l of header) {
    if (/^\/\/\s*@version\s+/.test(l)) { newHeader.push(`// @version      ${newVersion}`); continue }
    if (/^\/\/\s*@(downloadURL|updateURL)\s+/.test(l)) {
      newHeader.push(l.replace(/local\.user\.js(?![\w-])/g, 'main.user.js'))
      continue
    }
    newHeader.push(l)
  }

  const reqLines = regions.map((r) => `// @require      ${requireBase}${r.id}.js`)
  let anchor = -1
  for (let i = newHeader.length - 1; i >= 0; i -= 1) {
    if (/^\/\/\s*@(updateURL|downloadURL)\s+/.test(newHeader[i])) { anchor = i; break }
  }
  if (anchor < 0) anchor = newHeader.length - 2
  newHeader.splice(anchor + 1, 0, ...reqLines)

  const mainText = [...newHeader, ...rest].join('\n')

  const regionFiles = regions.map((r) => {
    const body = lines.slice(r.begin + 1, r.end)
    const desc = REGION_DESC[r.id] || `${name} 的 ${r.id} 分区（自动生成，请勿手改）`
    const headLines = [
      '/**',
      ` name         ${name} - ${r.id}`,
      ` namespace    ${meta('namespace')}`,
      ` version      ${newVersion}`,
      ` description  ${desc}`,
      ` author       ${meta('author')}`,
      ` license      ${meta('license')}`,
      ` supportURL   ${meta('supportURL')}`,
      '*/',
      '',
    ]
    return { id: r.id, file: `${r.id}.js`, text: [...headLines, ...body].join('\n'), lines: r.end - r.begin - 1 }
  })

  return { mainText, regionFiles }
}

function atomicWrite(file, text) {
  const body = text.endsWith('\n') ? text : `${text}\n`
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}`)
  fs.writeFileSync(tmp, body, 'utf8')
  fs.renameSync(tmp, file)
}

function checkSyntax(file) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
  if (r.status !== 0) die(`语法检查未通过: ${path.basename(file)}\n${r.stderr.trim()}`)
}

function versionOf(file) {
  const head = fs.readFileSync(file, 'utf8').split('\n').slice(0, 12).join('\n')
  const m = head.match(/^[ \t]*(?:\/\/[ \t]*)?@?version[ \t]+(\S+)/m)
  return m ? m[1] : ''
}

function backupFiles(source) {
  const dir = path.dirname(source)
  const base = path.basename(source).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${base}\\.bak-\\d{8}-\\d{6}$`)
  return fs.readdirSync(dir).filter((f) => re.test(f)).sort()
}

function pruneBackups(source, keep) {
  const dir = path.dirname(source)
  const baks = backupFiles(source)
  const doomed = baks.slice(0, Math.max(0, baks.length - keep))
  for (const f of doomed) fs.rmSync(path.join(dir, f), { force: true })
  return doomed
}

const opt = parseArgs(process.argv.slice(2))

say(c.bold('AO3 Translator 拆分'))
say(`  源文件   ${path.relative(ROOT, opt.source) || opt.source}`)
say(`  输出目录 ${path.relative(ROOT, opt.out) || opt.out}${opt.dryRun ? c.yellow('   [dry-run]') : ''}`)

head('读取源文件')
if (!fs.existsSync(opt.source)) die(`找不到源文件: ${opt.source}`)
const raw = fs.readFileSync(opt.source, 'utf8')
const crlf = (raw.match(/\r\n/g) || []).length
const lines = raw.replace(/\r\n/g, '\n').split('\n')
if (lines[lines.length - 1] === '') lines.pop()
ok(`${lines.length} 行，${raw.length} 字节`)
if (crlf) warn(`发现 ${crlf} 个 CRLF 行尾，已在内存中归一化为 LF`)

head('定位区段标记')
const regions = locate(lines)
for (const r of regions) {
  ok(`region "${r.id}"：第 ${r.begin + 2}–${r.end} 行（${r.end - r.begin - 1} 行）`)
}
const outside = lines.length - regions.reduce((s, r) => s + (r.end - r.begin - 1), 0)
ok(`main 侧保留 ${outside} 行`)

head('版本号')
const oldVersion = readVersion(lines)
const newVersion = bumpVersion(oldVersion, today())
if (oldVersion === newVersion) ok(`@version 已是 ${newVersion}（今天）`)
else ok(`@version ${oldVersion} → ${newVersion}`)

const built = buildOutputs(lines, regions, newVersion, opt.requireBase)

const workDir = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'aot-split-'))
try {
  head('作用域校验（region 不得依赖 main 侧 IIFE 内部声明）')
  const workSrc = path.join(workDir, path.basename(opt.source))
  fs.writeFileSync(workSrc, `${lines.join('\n')}\n`, 'utf8')
  const sc = spawnSync(process.execPath, [path.join(TOOLS_DIR, 'scope-check.mjs'), '--file', workSrc], {
    encoding: 'utf8',
  })
  process.stdout.write(sc.stdout || '')
  if (sc.status !== 0) {
    process.stderr.write(sc.stderr || '')
    die('作用域校验未通过', '把越界的声明移回 main 侧，或在 main 侧挂到 window 上，或把代码挪进 region')
  }

  head('写出并做语法检查')
  const outDir = path.join(workDir, 'out')
  fs.mkdirSync(outDir, { recursive: true })
  const outputs = [
    { file: 'main.user.js', text: built.mainText },
    ...built.regionFiles.map((r) => ({ file: r.file, text: r.text })),
  ]
  for (const o of outputs) {
    atomicWrite(path.join(outDir, o.file), o.text)
    checkSyntax(path.join(outDir, o.file))
    const ln = fs.readFileSync(path.join(outDir, o.file), 'utf8').split('\n').length - 1
    ok(`${o.file.padEnd(14)} ${String(ln).padStart(6)} 行  ${String(fs.statSync(path.join(outDir, o.file)).size).padStart(8)} 字节  语法 ✓`)
  }

  head('一致性检查')
  let bad = 0
  for (const o of outputs) {
    const v = versionOf(path.join(outDir, o.file))
    if (v !== newVersion) { console.error(`    ${c.red('✗')} ${o.file} 的 @version 是 ${v}，期望 ${newVersion}`); bad += 1 }
  }
  if (bad) die('产物版本号不一致')
  ok(`三份产物的 @version 均为 ${newVersion}`)
  const mainText = fs.readFileSync(path.join(outDir, 'main.user.js'), 'utf8')
  for (const m of mainText.matchAll(/^\/\/\s*@require\s+(\S+)/gm)) ok(`@require ${m[1]}`)
  for (const m of mainText.matchAll(/^\/\/\s*@(?:download|update)URL\s+(\S+)/gm)) ok(`URL ${m[1]}`)

  if (opt.dryRun) {
    say(`\n${c.yellow('dry-run：全部校验通过，没有写入任何文件。')}`)
  } else {
    head('安装产物')
    fs.mkdirSync(opt.out, { recursive: true })
    for (const o of outputs) {
      const dest = path.join(opt.out, o.file)
      fs.copyFileSync(path.join(outDir, o.file), `${dest}.tmp-${process.pid}`)
      fs.renameSync(`${dest}.tmp-${process.pid}`, dest)
      ok(`写入 ${path.relative(ROOT, dest) || dest}`)
    }

    if (opt.bump) {
      head('写回源文件 @version')
      if (opt.backup) {
        const stamp = `${today().replace(/-/g, '')}-${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}`
        const bak = `${opt.source}.bak-${stamp}`
        fs.copyFileSync(opt.source, bak)
        ok(`备份 ${path.basename(bak)}`)
        for (const f of pruneBackups(opt.source, opt.keep)) warn(`清理旧备份 ${f}`)
      } else {
        for (const f of pruneBackups(opt.source, 0)) ok(`清理旧备份 ${f}`)
      }
      const idx = lines.findIndex((l) => /^\/\/\s*@version\s+/.test(l))
      const patched = [...lines]
      patched[idx] = `// @version      ${newVersion}`
      atomicWrite(opt.source, patched.join('\n'))
      ok(`${path.relative(ROOT, opt.source) || opt.source} → ${newVersion}`)
    } else {
      head('写回源文件 @version')
      warn('--no-bump，源文件未改动')
    }

    say(`\n${c.green('✓ 拆分完成')}：${outputs.map((o) => o.file).join(' + ')} → ${path.relative(ROOT, opt.out) || opt.out}`)
  }
} finally {
  fs.rmSync(workDir, { recursive: true, force: true })
}
