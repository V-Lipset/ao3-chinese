<div align="center" markdown="1">

# AO3 Translator

English / [简体中文](./README.md)

A simple userscript focused on enhancing the reading experience on AO3.

[![License](https://img.shields.io/badge/License-GPL--3.0-important?logo=gnu)](./LICENSE)

[Install](#installation) / [Features](#features) / [Usage](#usage) / [Documentation](https://v-lipset.github.io/docs/)

</div>

## ✨ Features

- **UI Chinese Localization** — Automatically translates the entire AO3 interface (navigation, forms, modals, preferences, etc.) into Chinese
- **Multi-Engine Text Translation** — 13+ translation backends including free and AI-powered services for translating work/chapter content
- **Glossary System** — Fandom-specific terminology management ensures accurate translation of character names, places, and unique terms
- **Content Blocking** — Filter works by tags, authors, titles, content IDs, word counts, crossover status, pairings, and more
- **Article Formatting** — Customizable paragraph indentation, font size, letter spacing, line height, and margins
- **Floating Ball Interface** — Quick access to all settings via a draggable floating action button

## 🔧 Installation

### Prerequisites

Install a userscript manager in your browser — [Tampermonkey](https://www.tampermonkey.net/) is recommended.

### Quick Install

| Version | Description |
|---------|-------------|
| [Remote (main.user.js)](https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/main.user.js) | Lightweight — loads secondary data from CDN on demand |
| [Local (local.user.js)](https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/local.user.js) | All-in-one — everything bundled, works offline |

**CDN Mirrors** (if GitHub is inaccessible):

| Version | Link |
|---------|------|
| Remote | [jsDelivr CDN](https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/main.user.js) |
| Local | [jsDelivr CDN](https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/local.user.js) |

### Step-by-Step

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser
2. Enable **Developer Mode** in your browser's extension settings
3. In Tampermonkey: go to **Details** → enable **Allow access to file URLs**
4. Click one of the install links above — Tampermonkey will detect and install the script
5. Visit [AO3](https://archiveofourown.org/) — the interface switches to Chinese automatically
6. To enable text translation: click the **Floating Ball** → open Settings → enable the translation feature. Blue translation buttons will then appear throughout the site.

## 📖 Usage

### Getting Started

| Guide | Description |
|-------|-------------|
| [FAQ](https://v-lipset.github.io/docs/support/faq) | Frequently asked questions |
| [Translation Services](https://v-lipset.github.io/docs/support/service) | Overview of available translation backends |
| [Using on Mirror Sites](https://v-lipset.github.io/docs/guides/mirror) | How to use on AO3 mirror/alternative domains |
| [API Whitelist](https://v-lipset.github.io/docs/guides/whitelist) | Adding custom domains to the allow list |

### Feature Documentation

| Feature | Guide |
|---------|-------|
| Local Glossary | [Using local glossaries](https://v-lipset.github.io/docs/feat/local) |
| Content Blocking | [Blocking works & filtering content](https://v-lipset.github.io/docs/feat/block) |
| Online Glossary | [Glossary repository](https://github.com/V-Lipset/ao3-chinese/wiki/在线术语库) · [Writing guide](https://v-lipset.github.io/docs/feat/online/write) · [Creating one](https://v-lipset.github.io/docs/feat/online/create) · [Sharing](https://v-lipset.github.io/docs/feat/online/share) |

### Supported Translation Services

<table>
  <tr>
    <th>Service</th>
    <th>Type</th>
    <th>API Key</th>
  </tr>
  <tr><td>Google Translate</td><td>Web translation</td><td align="center">—</td></tr>
  <tr><td>Microsoft Bing Translator</td><td>Web translation</td><td align="center">—</td></tr>
  <tr><td>OpenAI</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Anthropic Claude</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>DeepSeek</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Google Gemini</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>SiliconFlow</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Zhipu AI (智谱)</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Groq AI</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Together AI</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Cerebras</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>ModelScope</td><td>LLM</td><td align="center">Required</td></tr>
  <tr><td>Custom Endpoint</td><td>LLM</td><td align="center">Required</td></tr>
</table>

For LLM-based services, you can customize parameters including: system prompt, user prompt, temperature, chunk size, paragraph limit, request rate, and validation thresholds.

## 🤝 Contributing

Found a translation error, script bug, or have a feature suggestion? You're welcome to submit them through the [Issues](https://github.com/V-Lipset/ao3-chinese/issues) page!

## 📄 License

This project is open-sourced under the [GPL-3.0 License](./LICENSE).

## 🙏 Credits

- [V-Lipset](https://github.com/V-Lipset)
- [JiangxianEden](https://github.com/JiangxianEden)
- [github-chinese](https://github.com/maboloshi/github-chinese)
- [kiss-translator](https://github.com/fishjar/kiss-translator)
- [Traduzir-paginas-web](https://github.com/FilipePS/Traduzir-paginas-web)
- [Read Frog](https://github.com/mengxi-ream/read-frog)
- [AO3: Advanced Blocker](https://greasyfork.org/en/scripts/549942-ao3-advanced-blocker)
- [Google Material Symbols](https://fonts.google.com/icons)
