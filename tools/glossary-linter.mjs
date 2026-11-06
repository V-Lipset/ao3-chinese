#!/usr/bin/env node

/**
 * AO3 Translator 在线术语表智能审查与质检内核
 * 深度对齐《术语表编写指南》与 AOT 客户端离线解析器规则
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const QUOTE_PAIRS = { '"': '"', "'": "'", '“': '”', '‘': '’' };
const TERM_SEPARATOR_RE = /[\s-－﹣—–]+/;
const TRANSLATION_SEPARATOR_RE = /[\s·・]+/;
const RESIDUAL_SEP_RE = /[=＝:：]/;
const BRACKET_DEPTH_MAP = {
  '(': 1, ')': -1, '[': 1, ']': -1, '{': 1, '}': -1,
  '（': 1, '）': -1, '【': 1, '】': -1, '「': 1, '」': -1
};

const SECTION_HEADERS = {
  TERMS: ['terms', '词条'],
  GENERAL_TERMS: ['general terms', '通用词条'],
  FORBIDDEN_TERMS: ['forbidden terms', '禁翻词条'],
  REGEX_TERMS: ['regex', 'regex_terms', '正则表达式']
};

/**
 * 安全解析键值对
 */
export function parseGlossaryKeyValuePair(entry) {
  if (!entry) return null;
  let inQuote = false;
  let expectedCloseQuote = '';
  let splitIndex = -1;
  let separator = '';

  const rawChars = entry.split('');
  for (let i = 0; i < rawChars.length; i++) {
    const char = rawChars[i];
    if (inQuote) {
      if (char === expectedCloseQuote) {
        let nextNonSpaceChar = null;
        for (let k = i + 1; k < rawChars.length; k++) {
          if (!/\s/.test(rawChars[k])) {
            nextNonSpaceChar = rawChars[k];
            break;
          }
        }
        const isSeparator =
          nextNonSpaceChar === ':' ||
          nextNonSpaceChar === '：' ||
          nextNonSpaceChar === '=' ||
          nextNonSpaceChar === '＝';
        if (isSeparator) {
          inQuote = false;
        }
      }
    } else {
      if (QUOTE_PAIRS.hasOwnProperty(char)) {
        inQuote = true;
        expectedCloseQuote = QUOTE_PAIRS[char];
      } else {
        if (char === ':' || char === '：') {
          splitIndex = i;
          separator = ':';
          break;
        }
        if (char === '=' || char === '＝') {
          splitIndex = i;
          separator = '=';
          break;
        }
      }
    }
  }

  if (splitIndex === -1) return null;
  const key = entry.substring(0, splitIndex).trim();
  const value = entry.substring(splitIndex + 1).trim();
  return { key, value, separator };
}

/**
 * 检测整行被引号包裹的错误写法
 */
export function isWholeLineQuotedWithSeparator(entry) {
  if (!entry || entry.length < 2) return null;
  const first = entry[0];
  const last = entry[entry.length - 1];
  if (typeof QUOTE_PAIRS[first] !== 'string') return null;
  if (QUOTE_PAIRS[first] !== last) return null;
  const inner = entry.slice(1, -1);
  const parsed = parseGlossaryKeyValuePair(inner);
  if (!parsed) return null;
  return { key: first + parsed.key + last, value: parsed.value };
}

/**
 * 译文中是否有残留的顶层未闭合分隔符
 */
export function hasTopLevelResidualSeparator(value) {
  if (!value) return false;
  let depth = 0;
  let inQuote = null;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (QUOTE_PAIRS[ch]) {
      inQuote = QUOTE_PAIRS[ch];
      continue;
    }
    const delta = BRACKET_DEPTH_MAP[ch];
    if (delta) {
      depth += delta;
      continue;
    }
    if (depth <= 0 && RESIDUAL_SEP_RE.test(ch)) return true;
  }
  return false;
}

/**
 * 版本号大小比较
 */
export function compareVersions(v1, v2) {
  const cleanV1 = String(v1 || '').replace(/[^\d.]/g, '');
  const cleanV2 = String(v2 || '').replace(/[^\d.]/g, '');
  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * 引号感知分词
 */
export function smartSplit(str, regex) {
  const quoteRe = /["“‘'”’]/;
  if (!quoteRe.test(str)) return str.split(regex);
  const parts = [];
  let current = '';
  let inQuote = false;
  let currentQuote = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (quoteRe.test(char)) {
      if (!inQuote) {
        inQuote = true;
        currentQuote = char;
      } else if (char === currentQuote || (currentQuote === '“' && char === '”') || (currentQuote === '‘' && char === '’')) {
        inQuote = false;
      }
      current += char;
    } else if (!inQuote && regex.test(char)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * 自动生成修复后术语表全文
 * mode: 'minimal' (仅修复阻断性错误) | 'recommended' (体验最佳推荐)
 */
export function generateFixedGlossary(rawContent, mode = 'minimal') {
  const lines = rawContent.split(/\r?\n/);
  const result = [];
  let inSection = '';

  // 在 recommended 模式下，预先分析所有词条，确定哪些行保留、哪些行剔除
  const keptLineIndices = new Set();
  const termLineIndices = new Set();

  if (mode === 'recommended') {
    let currentSec = '';
    const keyOccurrences = new Map(); // lowerKey -> Array<{ lineIndex, normVal }>

    for (let i = 0; i < lines.length; i++) {
      const lineTrim = lines[i].trim();
      if (!lineTrim || lineTrim.startsWith('//')) continue;

      const cleanH = lineTrim.toLowerCase().replace(/[:：\s]*$/, '');
      let isH = false;
      for (const k in SECTION_HEADERS) {
        if (SECTION_HEADERS[k].includes(cleanH)) {
          currentSec = k;
          isH = true;
          break;
        }
      }
      if (isH) continue;
      if (currentSec !== 'TERMS' && currentSec !== 'GENERAL_TERMS') continue;

      let wLine = lineTrim.replace(/[,，]$/, '');
      if (wLine.includes('//') && !wLine.startsWith('//')) {
        wLine = wLine.substring(0, wLine.indexOf('//')).trim();
      }
      const wholeQ = isWholeLineQuotedWithSeparator(wLine);
      if (wholeQ) {
        wLine = `${wholeQ.key}：${wholeQ.value}`;
      }
      let parsed = parseGlossaryKeyValuePair(wLine);
      if (!parsed) {
        if (wLine.includes("'") || wLine.includes('‘')) {
          const cIdx = wLine.indexOf('：') !== -1 ? wLine.indexOf('：') : wLine.indexOf(':');
          const eIdx = wLine.indexOf('=') !== -1 ? wLine.indexOf('=') : wLine.indexOf('＝');
          const sepIdx = cIdx !== -1 ? cIdx : eIdx;
          if (sepIdx !== -1) {
            wLine = `"${wLine.substring(0, sepIdx).trim()}"${wLine[sepIdx]}${wLine.substring(sepIdx + 1).trim()}`;
            parsed = parseGlossaryKeyValuePair(wLine);
          }
        }
        if (!parsed) {
          const matchB = wLine.match(/^([A-Za-z0-9\s.'"-]+?)\s+([\u4e00-\u9fa5\u3040-\u30ff\u0400-\u04ff].*)$/);
          if (matchB) {
            wLine = `${matchB[1].trim()}：${matchB[2].trim()}`;
            parsed = parseGlossaryKeyValuePair(wLine);
          }
        }
      }

      if (parsed) {
        const k = parsed.key.trim().replace(/^["“]|["”]$/g, '').toLowerCase();
        const v = parsed.value.trim().replace(/\/\/.*$/, '').replace(/[,，]$/, '').trim().toLowerCase();
        termLineIndices.add(i);
        if (!keyOccurrences.has(k)) {
          keyOccurrences.set(k, []);
        }
        keyOccurrences.get(k).push({ lineIndex: i, normVal: v });
      }
    }

    for (const [k, occs] of keyOccurrences.entries()) {
      if (occs.length === 1) {
        keptLineIndices.add(occs[0].lineIndex);
      } else {
        const distinctVals = new Set(occs.map(o => o.normVal));
        if (distinctVals.size === 1) {
          // 完全相同的重复：默认保留首次出现的规则
          keptLineIndices.add(occs[0].lineIndex);
        } else {
          // 相同原文不同译文的重复：默认保留最后出现的规则
          keptLineIndices.add(occs[occs.length - 1].lineIndex);
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      result.push('');
      continue;
    }

    if (trimmed.startsWith('//')) {
      result.push(rawLine);
      continue;
    }

    const cleanHeader = trimmed.toLowerCase().replace(/[:：\s]*$/, '');
    let isHeader = false;
    for (const key in SECTION_HEADERS) {
      if (SECTION_HEADERS[key].includes(cleanHeader)) {
        inSection = key;
        isHeader = true;
        result.push(trimmed.replace(/[:：\s]*$/, ''));
        break;
      }
    }
    if (isHeader) continue;

    // 在 recommended 模式下，检查是否为需要剔除的冲突/重复行
    if (mode === 'recommended' && termLineIndices.has(i) && !keptLineIndices.has(i)) {
      continue;
    }

    // 元数据区
    if (!inSection) {
      if (mode === 'recommended') {
        const dateMatch = rawLine.match(/^(\s*(?:更新时间|last_updated)\s*[:：]\s*)(\d{2})[-/.](\d{2})[-/.](\d{4})(.*)$/i);
        if (dateMatch) {
          result.push(`${dateMatch[1]}${dateMatch[4]}-${dateMatch[3]}-${dateMatch[2]}${dateMatch[5]}`);
          continue;
        }
      }
      result.push(rawLine);
      continue;
    }

    if (inSection === 'FORBIDDEN_TERMS') {
      const cleanForbidden = rawLine.replace(/[,，]$/, '').trim();
      const sepMatch = cleanForbidden.match(/^([^:=：＝]+)\s*[:=：＝].*$/);
      if (sepMatch) {
        result.push(sepMatch[1].trim());
      } else {
        result.push(cleanForbidden);
      }
      continue;
    }

    if (inSection === 'REGEX_TERMS') {
      result.push(rawLine.replace(/[,，]$/, ''));
      continue;
    }

    // TERMS 或 GENERAL_TERMS
    let workingLine = trimmed.replace(/[,，]$/, '');
    let inlineComment = '';
    if (workingLine.includes('//') && !workingLine.startsWith('//')) {
      const cIdx = workingLine.indexOf('//');
      inlineComment = workingLine.substring(cIdx).trim();
      workingLine = workingLine.substring(0, cIdx).trim();
    }

    // 检查整行被引号包裹
    const wholeQuoted = isWholeLineQuotedWithSeparator(workingLine);
    if (wholeQuoted) {
      workingLine = `${wholeQuoted.key}：${wholeQuoted.value}`;
    }

    let parsed = parseGlossaryKeyValuePair(workingLine);

    // 若解析失败，尝试自动修复
    if (!parsed) {
      // 1. 撇号未加双引号
      if (workingLine.includes("'") || workingLine.includes('‘')) {
        const cIdx = workingLine.indexOf('：') !== -1 ? workingLine.indexOf('：') : workingLine.indexOf(':');
        const eIdx = workingLine.indexOf('=') !== -1 ? workingLine.indexOf('=') : workingLine.indexOf('＝');
        const sepIdx = cIdx !== -1 ? cIdx : eIdx;
        if (sepIdx !== -1) {
          const rawK = workingLine.substring(0, sepIdx).trim();
          const sep = workingLine[sepIdx];
          const rawV = workingLine.substring(sepIdx + 1).trim();
          workingLine = `"${rawK}"${sep}${rawV}`;
          parsed = parseGlossaryKeyValuePair(workingLine);
        }
      }

      // 2. 缺失冒号或等号（仅有空格）
      if (!parsed) {
        const matchBoundary = workingLine.match(/^([A-Za-z0-9\s.'"-]+?)\s+([\u4e00-\u9fa5\u3040-\u30ff\u0400-\u04ff].*)$/);
        if (matchBoundary) {
          workingLine = `${matchBoundary[1].trim()}：${matchBoundary[2].trim()}`;
          parsed = parseGlossaryKeyValuePair(workingLine);
        } else {
          const spaceParts = workingLine.split(/\s{2,}|\t/);
          if (spaceParts.length >= 2) {
            workingLine = `${spaceParts[0].trim()}：${spaceParts.slice(1).join(' ').trim()}`;
            parsed = parseGlossaryKeyValuePair(workingLine);
          }
        }
      }
    }

    if (!parsed) {
      result.push(rawLine);
      continue;
    }

    let key = parsed.key.trim();
    let val = parsed.value.trim();
    let sep = parsed.separator === '=' ? ' = ' : '：';

    // 修复等号两侧分段数不匹配问题（转为冒号以确保兼容）
    if (parsed.separator === '=') {
      const keyParts = smartSplit(key.replace(/^["“](.*)["”]$/, '$1'), TERM_SEPARATOR_RE);
      const valParts = smartSplit(val.replace(/^["“](.*)["”]$/, '$1'), TRANSLATION_SEPARATOR_RE);
      if (keyParts.length > 1 && keyParts.length !== valParts.length) {
        sep = '：';
      }
    }

    // 拆分斜杠词条
    const subKeys = (key.includes('/') && !key.includes('://'))
      ? key.split('/').map(k => k.trim()).filter(Boolean)
      : [key];

    for (const subK of subKeys) {
      let finalKey = subK;
      let finalSep = sep;
      let finalVal = val;

      const isQuoted = (finalKey.startsWith('"') && finalKey.endsWith('"')) || (finalKey.startsWith('“') && finalKey.endsWith('”'));

      // 必须转义撇号
      if ((finalKey.includes("'") || finalKey.includes('‘')) && !isQuoted) {
        finalKey = `"${finalKey}"`;
      }

      if (mode === 'recommended') {
        // 连字符特别豁免，只为包含其它非连字符标点的词条加双引号
        const keyWithoutHyphens = finalKey.replace(/^["“]|["”]$/g, '').replace(/[\-\—\–\－]/g, '');
        const hasOtherPunctuation = keyWithoutHyphens.match(/[\'\’\‘\(\)\[\]\{\}\<\>\!\?\:\.\/\&\|\$\#\@\*\+\=\^\~]/);
        if (hasOtherPunctuation && !finalKey.startsWith('"')) {
          finalKey = `"${finalKey.replace(/^["“]|["”]$/g, '')}"`;
        }

        // 人名冒号升级为等号
        if (inSection === 'TERMS' && (finalSep === '：' || finalSep === ':')) {
          const kParts = smartSplit(finalKey.replace(/^["“](.*)["”]$/, '$1'), TERM_SEPARATOR_RE);
          const vParts = smartSplit(finalVal.replace(/^["“](.*)["”]$/, '$1'), TRANSLATION_SEPARATOR_RE);
          if (kParts.length > 1 && kParts.length === vParts.length) {
            finalSep = ' = ';
          }
        }

        // 行尾注释提取到前一行
        if (inlineComment) {
          result.push(inlineComment);
          inlineComment = '';
        }
      }

      if (inlineComment) {
        result.push(`${finalKey}${finalSep}${finalVal}          ${inlineComment}`);
      } else {
        result.push(`${finalKey}${finalSep}${finalVal}`);
      }
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * 结构化审查单个术语表文件
 */
export function lintGlossaryFile(filePath, baseBranchContent = null) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const fileReport = {
    file: fileName,
    filePath,
    rawContent: content,
    errors: [],
    warnings: [],
    errorGroups: {},
    warningGroups: {},
    stats: {
      terms: 0,
      generalTerms: 0,
      forbiddenTerms: 0,
      regexTerms: 0
    }
  };

  function addIssue(groupMap, list, typeKey, typeTitle, fullLine) {
    if (!groupMap[typeKey]) {
      groupMap[typeKey] = { title: typeTitle, items: [] };
    }
    groupMap[typeKey].items.push(fullLine);
    list.push(fullLine);
  }

  // 1. 文件后缀检查
  if (!fileName.endsWith('.txt')) {
    addIssue(fileReport.errorGroups, fileReport.errors, 'file_ext', '文件缺少 `.txt` 后缀', fileName);
  }

  // 2. 扫描并定位各区域
  const sections = [];
  const metadataLines = [];
  let inMetadata = true;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim().toLowerCase().replace(/[:：\s]*$/, '');
    let matchedHeaderKey = null;

    for (const key in SECTION_HEADERS) {
      if (SECTION_HEADERS[key].includes(trimmedLine)) {
        matchedHeaderKey = key;
        break;
      }
    }

    if (matchedHeaderKey) {
      sections.push({ type: matchedHeaderKey, title: lines[i].trim(), start: i + 1 });
      inMetadata = false;
    } else if (inMetadata && lines[i].trim()) {
      metadataLines.push({ text: lines[i], lineNo: i + 1 });
    }
  }

  // 3. 元数据区检查
  const metadata = {};
  const metadataRegex = /^\s*(maintainer|version|last_updated|visibility|feedback|contact|维护者|版本号|更新时间|可见性|反馈方式|联系方式)\s*[:：]\s*(.*?)\s*[,，]?\s*$/i;

  for (const item of metadataLines) {
    const match = item.text.match(metadataRegex);
    if (match) {
      const rawKey = match[1].trim().toLowerCase();
      const val = match[2].trim();
      const keyMap = {
        '维护者': 'maintainer', '版本号': 'version', '更新时间': 'last_updated',
        '可见性': 'visibility', '反馈方式': 'feedback', '联系方式': 'feedback', 'contact': 'feedback'
      };
      const key = keyMap[rawKey] || rawKey;
      metadata[key] = val;
    } else if (!item.text.trim().startsWith('//')) {
      addIssue(fileReport.warningGroups, fileReport.warnings, 'metadata_format', '元数据格式不规范', item.text.trim());
    }
  }

  if (!metadata.version) {
    addIssue(fileReport.errorGroups, fileReport.errors, 'missing_version', '元数据缺失版本号', '版本号：1.0.0');
  }
  if (!metadata.maintainer) {
    addIssue(fileReport.errorGroups, fileReport.errors, 'missing_maintainer', '元数据缺失维护者', '维护者：昵称');
  }

  // 日期格式检查
  if (metadata.last_updated) {
    const dateStr = metadata.last_updated;
    if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(dateStr)) {
      addIssue(fileReport.warningGroups, fileReport.warnings, 'date_format', '元数据中更新时间存在 `日-月-年` 与 `月-日-年` 的二义性。建议统一使用 ISO 8601 标准 YYYY-MM-DD 格式。', `更新时间：${dateStr}`);
    }
  }

  // 对比主分支已有版本号
  if (metadata.version && baseBranchContent) {
    const baseMatch = baseBranchContent.match(/^\s*(?:版本号|version)\s*[:：]\s*([^\s,，]+)/im);
    if (baseMatch && baseMatch[1]) {
      const baseVersion = baseMatch[1].trim();
      const cmp = compareVersions(metadata.version, baseVersion);
      if (cmp <= 0) {
        addIssue(fileReport.errorGroups, fileReport.errors, 'version_not_bumped', '版本号未递增', `当前版本号 (v${metadata.version}) 必须大于主分支已有版本号 (v${baseVersion})`);
      }
    }
  }

  // 4. 有效分区检查
  if (sections.length === 0) {
    addIssue(fileReport.errorGroups, fileReport.errors, 'missing_section', '文件缺少有效分区标题', '请至少包含「词条」、「通用词条」、「禁翻词条」或「正则表达式」中的一个。');
    return fileReport;
  }

  // 5. 逐行解析审查各分区词条
  const termEntriesByKey = new Map();

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    const end = (s + 1 < sections.length) ? sections[s + 1].start - 1 : lines.length;
    const sectionLines = lines.slice(section.start, end);

    for (let j = 0; j < sectionLines.length; j++) {
      const rawLine = sectionLines[j];
      const lineNo = section.start + j + 1;
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) continue;

      // 检查行尾注释 //
      if (line.includes('//') && !line.startsWith('//')) {
        addIssue(fileReport.warningGroups, fileReport.warnings, 'inline_comment', '规则内包含行尾注释。建议将说明/注释单独另起一行。', rawLine.trim());
      }

      // 检查行尾多余逗号
      if (/[,，]$/.test(line)) {
        addIssue(fileReport.warningGroups, fileReport.warnings, 'trailing_comma', '规则末尾包含多余逗号。建议去除。', rawLine.trim());
      }

      const cleanLine = line.replace(/[,，]$/, '');

      if (section.type === 'FORBIDDEN_TERMS') {
        fileReport.stats.forbiddenTerms++;
        if (cleanLine.includes(':') || cleanLine.includes('：') || cleanLine.includes('=')) {
          addIssue(fileReport.warningGroups, fileReport.warnings, 'forbidden_term_sep', '禁翻词条包含了分隔符或译文。禁翻词条仅需填写不希望翻译的原文本身。', rawLine.trim());
        }
        continue;
      }

      if (section.type === 'REGEX_TERMS') {
        fileReport.stats.regexTerms++;
        const regexMatch = cleanLine.match(/^(.+?)\s*[:：]\s*(.*)$/s);
        if (!regexMatch) {
          addIssue(fileReport.errorGroups, fileReport.errors, 'regex_missing_sep', '正则表达式缺少冒号分隔符', rawLine.trim());
          continue;
        }
        const pattern = regexMatch[1].trim();
        try {
          const testRegex = new RegExp(pattern);
          if (testRegex.test('')) {
            addIssue(fileReport.errorGroups, fileReport.errors, 'regex_empty_match', '正则表达式能匹配空字符串', rawLine.trim());
          }
          if (/[\(][^()]*[*+{][^()]*[\)][*+]/.test(pattern)) {
            addIssue(fileReport.errorGroups, fileReport.errors, 'regex_redos', '正则表达式包含嵌套量词（ReDoS 假死风险）', rawLine.trim());
          }
        } catch (e) {
          addIssue(fileReport.errorGroups, fileReport.errors, 'regex_syntax', '正则表达式语法非法', rawLine.trim());
        }
        continue;
      }

      // TERMS 或 GENERAL_TERMS
      if (section.type === 'TERMS') fileReport.stats.terms++;
      if (section.type === 'GENERAL_TERMS') fileReport.stats.generalTerms++;

      const wholeQuoted = isWholeLineQuotedWithSeparator(cleanLine);
      if (wholeQuoted) {
        addIssue(fileReport.warningGroups, fileReport.warnings, 'whole_line_quoted', '引号包裹了整条规则。建议引号只包裹原文词条、分隔符放引号外。', rawLine.trim());
      }

      const parsed = wholeQuoted ? { key: wholeQuoted.key, value: wholeQuoted.value, separator: ':' } : parseGlossaryKeyValuePair(cleanLine);
      if (!parsed) {
        if (cleanLine.includes("'") || cleanLine.includes('‘')) {
          addIssue(fileReport.errorGroups, fileReport.errors, 'unquoted_apostrophe', '规则原文包含标点符号但未用 `"` 包裹', rawLine.trim());
        } else {
          addIssue(fileReport.errorGroups, fileReport.errors, 'missing_separator', '规则缺失冒号 `:` 或等号 `=` 分隔符', rawLine.trim());
        }
        continue;
      }

      const key = parsed.key.trim();
      const val = parsed.value.trim().replace(/[,，]$/, '');

      // 检查原文中是否使用了斜杠 / 表示并列
      if (key.includes('/') && !key.includes('://')) {
        addIssue(fileReport.errorGroups, fileReport.errors, 'slash_in_key', '规则原文包含斜杠 `/`', rawLine.trim());
      }

      // 检查原文是否包含标点符号但未用双引号包裹
      const isQuoted = (key.startsWith('"') && key.endsWith('"')) || (key.startsWith('“') && key.endsWith('”'));
      const hasApostrophe = /[\'‘’]/.test(key);

      if (!isQuoted) {
        if (hasApostrophe) {
          addIssue(fileReport.errorGroups, fileReport.errors, 'unquoted_apostrophe', '规则原文包含标点符号但未用 `"` 包裹', rawLine.trim());
        } else if (!key.includes('/')) {
          // 连字符特别豁免，只检测连字符以外的其它非连字符标点
          const keyWithoutHyphens = key.replace(/[\-\—\–\－]/g, '');
          const hasOtherPunctuation = keyWithoutHyphens.match(/[\(\)\[\]\{\}\<\>\!\?\:\.\/\&\|\$\#\@\*\+\=\^\~]/);
          if (hasOtherPunctuation) {
            addIssue(fileReport.warningGroups, fileReport.warnings, 'unquoted_punctuation', '词条原文包含标点符号但未用 `"` 包裹。建议加 `"` 开启精准匹配。', rawLine.trim());
          }
        }
      }

      // 检查等号关联语法（=）：放进“格式与体验建议”
      if (parsed.separator === '=') {
        const keyParts = smartSplit(key.replace(/^["“](.*)["”]$/, '$1'), TERM_SEPARATOR_RE);
        const valParts = smartSplit(val.replace(/^["“](.*)["”]$/, '$1'), TRANSLATION_SEPARATOR_RE);
        if (keyParts.length > 1 && keyParts.length !== valParts.length) {
          addIssue(fileReport.warningGroups, fileReport.warnings, 'unequal_equal_parts', '`=` 语法规则原文部分数与译文部分数不一致。建议检查。', rawLine.trim());
        }
      } else {
        // 使用冒号但原文多词且译文多词（可能为姓名或其它复合专有名词）
        if (section.type === 'TERMS') {
          const cleanVal = val.replace(/\/\/.*$/, '').trim();
          const parts = smartSplit(key, TERM_SEPARATOR_RE);
          const valParts = smartSplit(cleanVal, TRANSLATION_SEPARATOR_RE);
          if (parts.length > 1 && valParts.length > 1) {
            addIssue(fileReport.warningGroups, fileReport.warnings, 'person_colon', '复合专有名词使用了 `:` 语法。若为角色姓名，建议改用 `=` 语法以支持单名/姓氏拆分自动匹配。', rawLine.trim());
          }
        }
      }

      // 记录词条，用于后续冲突与完全重复分析
      const lowerKey = key.toLowerCase();
      const cleanVal = val.replace(/\/\/.*$/, '').replace(/[,，]$/, '').trim();
      if (!termEntriesByKey.has(lowerKey)) {
        termEntriesByKey.set(lowerKey, []);
      }
      termEntriesByKey.get(lowerKey).push({
        lineNo,
        rawLine: rawLine.trim(),
        key,
        cleanVal,
        sep: parsed.separator
      });
    }
  }

  // 审查同一原文不同译文与完全重复规则
  for (const [lowerKey, entries] of termEntriesByKey.entries()) {
    if (entries.length <= 1) continue;

    const distinctVals = new Set(entries.map(e => e.cleanVal.toLowerCase()));

    if (distinctVals.size > 1) {
      // 1. 同一原文词条存在不同译文
      const groupLines = entries.map(e => {
        return e.rawLine.replace(/\/\/.*$/, '').replace(/[,，]$/, '').trim();
      });
      const uniqueGroupLines = [...new Set(groupLines)];
      addIssue(
        fileReport.warningGroups,
        fileReport.warnings,
        'conflicting_translation',
        '同一原文词条存在不同译文。建议确认并统一。',
        uniqueGroupLines.join('\n')
      );
    }

    // 2. 存在完全相同的冗余规则
    const seenRuleStrings = new Set();
    for (const e of entries) {
      const normRule = `${e.key.toLowerCase()}::${e.sep}::${e.cleanVal.toLowerCase()}`;
      if (seenRuleStrings.has(normRule)) {
        addIssue(
          fileReport.warningGroups,
          fileReport.warnings,
          'duplicate_term',
          '存在完全相同的冗余规则。建议移除。',
          e.rawLine
        );
      } else {
        seenRuleStrings.add(normRule);
      }
    }
  }

  return fileReport;
}

/**
 * 生成 Markdown 审查报告
 */
export function formatMarkdownReport(reports, autoFixedList = [], isHeadBranchMain = true) {
  const isSingle = reports.length === 1;
  const singleBaseName = isSingle ? path.basename(reports[0].file, '.txt') : '';

  let md = isSingle ? `## ${singleBaseName} - 自动审查报告\n\n` : `## 在线术语表自动审查报告\n\n`;

  if (autoFixedList.length > 0) {
    md += `> [!NOTE]\n`;
    md += `> **自动修复记录**：\n>\n`;
    for (const item of autoFixedList) {
      md += `> - 检测到文件 \`${item.oldName}\` 缺少 \`.txt\` 后缀，已自动补充并重命名为 \`${item.newName}\`。\n`;
    }
    md += `\n`;
  }

  // 目录生成
  md += `### 目录\n\n`;
  if (isSingle) {
    const report = reports[0];
    md += `- 规则统计\n`;
    if (report.errors.length > 0) {
      md += `- 阻断性错误\n`;
    }
    if (report.warnings.length > 0) {
      md += `- 格式与体验建议\n`;
    }
    if (report.rawContent && (report.errors.length > 0 || report.warnings.length > 0)) {
      md += `- 优化版本参考\n`;
      md += `  - 1\\. 基础修复版\n`;
      md += `  - 2\\. 体验最佳版\n`;
    }
    if (!isHeadBranchMain) {
      md += `- 分支更新建议\n`;
    }
  } else {
    for (const report of reports) {
      md += `- 文件：\`${report.file}\`\n`;
      md += `  - 规则统计\n`;
      if (report.errors.length > 0) {
        md += `  - 阻断性错误\n`;
      }
      if (report.warnings.length > 0) {
        md += `  - 格式与体验建议\n`;
      }
      if (report.rawContent && (report.errors.length > 0 || report.warnings.length > 0)) {
        md += `  - 优化版本参考\n`;
        md += `    - 1\\. 基础修复版\n`;
        md += `    - 2\\. 体验最佳版\n`;
      }
    }
    if (!isHeadBranchMain) {
      md += `- 分支更新建议\n`;
    }
  }
  md += `\n`;

  let totalErrors = 0;
  let totalWarnings = 0;

  const ORDERED_WARNING_KEYS = [
    'unequal_equal_parts',
    'date_format',
    'person_colon',
    'unquoted_punctuation',
    'whole_line_quoted',
    'trailing_comma',
    'inline_comment',
    'forbidden_term_sep',
    'metadata_format',
    'conflicting_translation',
    'duplicate_term'
  ];

  const WARNING_FIX_DESCRIPTIONS = {
    unequal_equal_parts: '将分段数不对等的 `=` 语法规则修改为 `:`；',
    date_format: '标准化更新时间为 ISO 8601 (`YYYY-MM-DD`) 格式；',
    person_colon: '将符合复合专有名词结构的规则升级为 `=` 语法，使单独名、姓也能自动翻译；',
    unquoted_punctuation: '为含标点符号的原文词条包裹双引号，开启精准匹配；',
    whole_line_quoted: '修正整行包裹引号的问题，使引号仅精准包裹原文词条；',
    trailing_comma: '清除规则末尾残留的逗号；',
    inline_comment: '将行尾 `//` 注释自动提取为独立行注释，避免注释混入正文替换；',
    forbidden_term_sep: '净化禁翻词条，去除多余的分隔符与译文；',
    metadata_format: '规范元数据属性书写格式；',
    conflicting_translation: '解决同一原文的译文冲突（默认保留最后出现的规则）；',
    duplicate_term: '移除完全相同的冗余规则（默认保留首次出现的规则）；'
  };

  const ORDERED_ERROR_KEYS = [
    'missing_separator',
    'slash_in_key',
    'unquoted_apostrophe',
    'file_ext',
    'missing_version',
    'missing_maintainer',
    'version_not_bumped',
    'missing_section',
    'regex_missing_sep',
    'regex_empty_match',
    'regex_redos',
    'regex_syntax'
  ];

  for (const report of reports) {
    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;

    const fileSlug = report.file.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

    if (!isSingle) {
      md += `### 文件：\`${report.file}\`\n\n`;
      md += `#### 规则统计\n\n`;
    } else {
      md += `### 规则统计\n\n`;
    }
    md += `词条区 ${report.stats.terms} 条，通用词条区 ${report.stats.generalTerms} 条，禁翻词条区 ${report.stats.forbiddenTerms} 条，正则表达式 ${report.stats.regexTerms} 条。\n\n`;

    // 阻断性错误
    if (report.errors.length > 0) {
      md += isSingle ? `### 阻断性错误\n\n` : `#### 阻断性错误\n\n`;
      let errIdx = 1;
      const sortedErrorKeys = Object.keys(report.errorGroups).sort((a, b) => {
        const ia = ORDERED_ERROR_KEYS.indexOf(a);
        const ib = ORDERED_ERROR_KEYS.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      for (const key of sortedErrorKeys) {
        const group = report.errorGroups[key];
        const countStr = `（共 ${group.items.length} 处）`;
        let titleStr = group.title;
        if (!titleStr.includes('（共')) {
          titleStr = `${titleStr}${countStr}`;
        }
        if (!titleStr.endsWith('：') && !titleStr.endsWith(':')) {
          titleStr += '：';
        }

        md += `${errIdx}. ${titleStr}\n\n`;
        md += '```text\n';
        md += group.items.join('\n') + '\n';
        md += '```\n\n';
        errIdx++;
      }
    }

    // 格式与体验建议
    if (report.warnings.length > 0) {
      md += isSingle ? `### 格式与体验建议\n\n` : `#### 格式与体验建议\n\n`;
      let warnIdx = 1;
      const sortedWarningKeys = Object.keys(report.warningGroups).sort((a, b) => {
        const ia = ORDERED_WARNING_KEYS.indexOf(a);
        const ib = ORDERED_WARNING_KEYS.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      for (const key of sortedWarningKeys) {
        const group = report.warningGroups[key];
        let titleStr = group.title;
        const countStr = key === 'duplicate_term' ? `（共 ${group.items.length} 条）` : `（共 ${group.items.length} 处）`;
        
        if (!titleStr.includes('（共')) {
          if (titleStr.includes('。')) {
            const dotIdx = titleStr.indexOf('。');
            titleStr = `${titleStr.substring(0, dotIdx)}${countStr}。${titleStr.substring(dotIdx + 1)}`;
          } else {
            titleStr = `${titleStr}${countStr}`;
          }
        }
        if (!titleStr.endsWith('：') && !titleStr.endsWith(':') && !titleStr.endsWith('。')) {
          titleStr += '：';
        }

        md += `${warnIdx}. ${titleStr}\n\n`;
        md += '```text\n';
        if (key === 'conflicting_translation') {
          md += group.items.join('\n\n') + '\n';
        } else {
          md += group.items.join('\n') + '\n';
        }
        md += '```\n\n';
        warnIdx++;
      }
    }

    if (report.errors.length === 0 && report.warnings.length === 0) {
      md += `> [!TIP]\n`;
      md += `> 该术语表编写极其规范，未发现任何格式语法问题，符合 AOT 客户端解析标准！\n\n`;
    }

    // 优化版本参考
    if (report.rawContent && (report.errors.length > 0 || report.warnings.length > 0)) {
      const fixedMinimal = generateFixedGlossary(report.rawContent, 'minimal');
      const fixedRecommended = generateFixedGlossary(report.rawContent, 'recommended');

      md += `---\n\n`;
      md += isSingle ? `### 优化版本参考\n\n` : `#### 优化版本参考\n\n`;
      md += isSingle ? `#### 1. 基础修复版\n\n` : `##### 1. 基础修复版\n\n`;
      md += `> [!TIP]\n`;
      md += `> 该版本仅修复阻断性错误：补齐缺失分隔符、拆分斜杠同义词、转义引号等，保留维护者原有的冒号匹配习惯、注释与格式。\n\n`;
      md += '```text\n';
      md += fixedMinimal.trim() + '\n';
      md += '```\n\n';

      md += isSingle ? `#### 2. 体验最佳版\n\n` : `##### 2. 体验最佳版\n\n`;
      md += `> [!TIP]\n`;

      const activeFixes = [];
      for (const wKey of ORDERED_WARNING_KEYS) {
        if (report.warningGroups[wKey] && WARNING_FIX_DESCRIPTIONS[wKey]) {
          activeFixes.push(WARNING_FIX_DESCRIPTIONS[wKey]);
        }
      }

      if (activeFixes.length > 0) {
        md += `> 该版本在版本 1 的基础上，进一步完成了：\n`;
        activeFixes.forEach((fixText, idx) => {
          let text = fixText;
          if (idx === activeFixes.length - 1 && text.endsWith('；')) {
            text = text.slice(0, -1) + '。';
          }
          md += `> ${idx + 1}. ${text}\n`;
        });
        md += `\n`;
      } else {
        md += `> 该版本在版本 1 的基础上，进一步规范了词条排版与格式排布。\n\n`;
      }
      md += '```text\n';
      md += fixedRecommended.trim() + '\n';
      md += '```\n\n';
    }
  }

  if (!isHeadBranchMain) {
    md += `---\n\n`;
    md += `### 分支更新建议\n\n`;
    md += `> [!TIP]\n`;
    md += `> 检测到当前分支非 \`main\` 主分支。建议后续在网页端直接选择 **Commit directly to the \`main\` branch** 进行保存与更新。这样订阅了你 \`main\` 分支链接的读者无需重新导入，就能永久自动接收更新。\n\n`;
  }

  // 避免超过 GitHub 评论 65536 字符限制
  if (md.length > 60000) {
    md = md.substring(0, 59500) + '\n\n> [!WARNING]\n> 报告内容过长，部分内容已截断。\n\n<!-- aria-glossary-review -->\n';
  } else {
    md += `\n<!-- aria-glossary-review -->\n`;
  }

  return { markdown: md, totalErrors, totalWarnings };
}

// CLI 执行入口
const isMainModule = Boolean(
  process.argv[1] && (
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
    (fs.existsSync(process.argv[1]) && fs.existsSync(fileURLToPath(import.meta.url)) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)))
  )
);
if (isMainModule) {
  const args = process.argv.slice(2);
  let shouldFix = args.includes('--fix');
  let headBranch = 'main';
  const branchIdx = args.indexOf('--head-branch');
  if (branchIdx !== -1 && args[branchIdx + 1]) {
    headBranch = args[branchIdx + 1];
  }

  const explicitFiles = args.filter(a => !a.startsWith('--') && (a.endsWith('.txt') || fs.existsSync(a)));

  const glossariesDir = path.resolve('glossaries');
  let autoFixed = [];
  if (shouldFix) {
    autoFixed = autoFixMissingTxtExtensions(glossariesDir);
  } else if (fs.existsSync('.auto_fixed_files.json')) {
    try {
      const list = JSON.parse(fs.readFileSync('.auto_fixed_files.json', 'utf-8'));
      autoFixed = list.map(f => ({ oldName: path.basename(f), newName: `${path.basename(f)}.txt` }));
    } catch (e) {}
  }

  let filesToLint = [];
  if (explicitFiles.length > 0) {
    filesToLint = explicitFiles;
  } else if (fs.existsSync(glossariesDir)) {
    filesToLint = fs.readdirSync(glossariesDir)
      .filter(f => !f.startsWith('.') && !f.endsWith('.json'))
      .map(f => path.join(glossariesDir, f));
  }

  const reports = [];
  for (const f of filesToLint) {
    const full = path.isAbsolute(f) ? f : path.resolve(f);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      reports.push(lintGlossaryFile(full));
    }
  }

  const { markdown, totalErrors } = formatMarkdownReport(reports, autoFixed, headBranch === 'main');
  console.log(markdown);

  if (totalErrors > 0) {
    process.exit(1);
  }
  process.exit(0);
}
