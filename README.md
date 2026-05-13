<div align="center" markdown="1">

# AO3 Translator

An extension designed to enhance the Chinese reading experience on Archive of Our Own.

[简体中文](./README_ZH-CN.md) · English · [Docs](https://v-lipset.github.io) · [Changelog](https://github.com/V-Lipset/ao3-chinese/releases) · [QQ Channel](https://pd.qq.com/s/h5cf7c1sd?b=9)

<!-- SHIELD GROUP -->

[![GitHub release badge][release-shield]][release-link]
[![GitHub stars badge][stars-shield]][stars-link]
[![GitHub contributors badge][contributors-shield]][contributors-link]
![GitHub last commit badge][last-commit-shield]

</div>

## 📖 Brief Introduction

Provides full-site UI localization, real-time multi-engine content translation, smart content blocking, immersive reading typography, glossary management, translation cache acceleration, and full-format work exporting—delivering an unprecedentedly smooth reading experience for Chinese users on AO3.

## ✨ Core Features

### 🌐 Real-Time Multi-Engine Translation System

Supports **traditional translation engines** (Google Translate, Bing Translator) and **over 10 Large Language Model (LLM) services**, covering all mainstream AI translation capabilities:

| Category | Supported Services |
|------|-----------|
| Traditional Engines | Google Translate, Bing Translator |
| Global AI | OpenAI, Anthropic (Claude), Google AI (Gemini), Groq AI, Together AI, Cerebras |
| Chinese AI | DeepSeek, Zhipu AI (GLM), SiliconFlow, ModelScope |
| Custom | **Any third-party service compatible with the OpenAI API**, supporting automatic model list fetching via `/models` |

**Enterprise-Grade Translation Dispatch Architecture:**

- **Token Bucket Rate Limiting** — Independently configure request rates and maximum burst limits for each engine to prevent API throttling.
- **Concurrent Batch Processing** — Smartly merges multiple paragraphs into a single request, supporting dynamic batching based on character length and paragraph count.
- **Retry & Exponential Backoff** — Automatically identifies scenarios like `429` rate limits and `5xx` server errors, applying exponential backoff with jitter; automatically switches to the next API Key on Auth errors.
- **Dynamic Circuit Breaking** — Automatically triggers a global freeze upon consecutive server overloads, gradually extending the cooldown period.
- **API Key Blacklisting** — Marks and automatically skips failed keys within the same page lifecycle, supporting multi-key polling.
- **Placeholder Protection** — Ensures specific terms remain unaltered during translation, supporting post-processing validation and anomaly detection.

### 🎨 Deep AO3 UI Localization

More than just text translation—the script performs **deep, native-level localization** on AO3's highly complex page structures, covering:

- Work Search Page (search fields, help modals, date/tag/crossover/numerical filter instructions)
- Tag Browsing & Search (tag types, wrangling status, synonymous/sub/meta tag relationships)
- Collections/Challenges Management (nomination rules, sign-up processes, event status)
- User Dashboard (preferences, privacy options, skin management, history, SVG translation for statistics charts)
- Posting & Editing Works (all form fields, tooltips, validation errors)
- Page-Specific Translation Functions (invitation requests, error pages, bookmark searches, and **40+** custom translation logics)

### 🛡️ Powerful Content Blocker

A comprehensive work list filtering system to help you say goodbye to unwanted content:

| Blocking Dimension | Description |
|---------|------|
| Tag Blacklist | Supports exact match, wildcards (`*`), and chained condition combinations (`'TagA'+'TagB'-'TagC'`) |
| Tag Whitelist | Tags in the whitelist mark the work as safe, **bypassing** all other blocking rules |
| Content Filtering | Exact blocking by author name, title keywords, summary keywords, or Work ID |
| Stats Filtering | Word count range, chapter range, auto-block WIPs unupdated for N months, crossover limit |
| Advanced Filtering | Exact filtering by the first N relationship tags, first N character tags, or specific languages only |

Supports **`Alt + Click` Quick Blocking**—hold `Alt` and click any tag/author/work link to instantly add it to the blacklist. Blocked work cards will be collapsed, displaying the reason for blocking, with an option to temporarily expand and view.

### 📖 Immersive Reading & Typography

- **Bilingual / Translation-Only** display modes, switchable with one click.
- Custom typography profiles (**first-line indent, font size, letter spacing, line height, margins**), supporting multi-profile management and instant preview.
- Automatically cleans up formatting residue like manually entered full-width spaces, NBSPs, and line breaks.
- Smart normalization for special text, including `~` separators, HTML tags, and small caps conversion.

### 📚 Local & Online Glossaries

- **Local Glossary** — Supports both case-sensitive and case-insensitive rules.
- **Do-Not-Translate Glossary** — Specify terms that should never be translated (e.g., character names, proper nouns).
- **Regex Support** — Use regular expressions directly for matching and replacing.
- **Multi-part Terms** — Terms separated by `=` for translating multiple segments individually.
- **DOM-Level Node Replacement** — Precise matching and replacement for complex text crossing HTML tag boundaries.
- **Online Glossary Sync** — Import community-maintained glossaries from GitHub Raw or jsDelivr, supporting auto-updates and drag-and-drop priority sorting for multiple glossaries.
- **Post-Translation Replacement** — Perform a final pass of text replacement after receiving the AI translation results.

### ⚡ High-Performance Cache System

A translation cache database built on native **IndexedDB**:

- **Hash-Based Storage** — Generates a unique Key using SHA-256 on the combination of (Original Text + Engine + Model + Language + System Prompt + Glossary Version) to ensure cache reliability.
- **Auto-Expiration Cleanup** — Supports dual eviction strategies based on days (default 30 days) and max item count (default 100,000).
- **LRU Timestamp Updates** — Automatically refreshes timestamps upon cache hits, keeping high-frequency terms from being evicted.
- **Page-Level Clearing** — One-click clearing of all translation caches on the current page for easy re-translation.
- **Significant API Token Savings** — Directly hits the cache for recurring text paragraphs, resulting in zero API calls.

### 📦 Full-Format Export Engine

One-click export of translated works into eBooks, featuring built-in JSZip and a custom CSS template system:

| Format | Description |
|------|------|
| HTML | Standalone webpage with custom CSS templates (title page, TOC, body, bilingual display, mobile adaptation) |
| EPUB | Standard eBook format, supporting TOC navigation (NCX) and metadata |
| PDF | Generated via the browser's "Save as PDF" print feature, with CSS pagination control |

- **Custom Template Editor** — Create/edit CSS templates for all three formats independently.
- **Bilingual Export** — Automatically detects the current display mode, supporting both translation-only and bilingual exports.
- **Complete Metadata** — Automatically extracts full work info including rating, warnings, fandoms, relationships, characters, and publish date.

### 🎛️ Modern UI & Interaction

- **Shadow DOM Isolation** — All extension UI runs in an isolated Shadow DOM, ensuring zero pollution to page styles and perfect coexistence with AO3's native themes and user-customized skins.
- **Smart Floating Action Button (FAB)** — Supports dragging, auto-edge snapping, and auto-hiding to the edge after 2 seconds on touch devices.
  - Four gestures: Click, Double-click, Long press, Right-click.
  - Customizable actions for each gesture: Open settings panel, Trigger translation/Clear translation, Clear page cache, Export current work, or No action.
  - Status indicator lights: Translating (Green), Retrying (Yellow), Error (Red), Idle (Blue).
- **Custom Dropdown Menus** — Replaces native `<select>`, supporting drag-and-drop sorting (for glossary priority), toggle switches, and deletion confirmation.
- **Built-in Logging System** — Tiered logs (INFO / WARN / ERROR) with auto-cleanup, real-time viewing, copying, exporting, and privacy data masking.

## 🤖 Supported Translation Engines

### Built-in Engines

| Engine | API Key | Notes |
|------|---------|------|
| Google Translate | Not required | Traditional MT, fastest speed, handles large text volumes |
| Bing Translator | Not required | Traditional MT, auto-fetches Token |
| OpenAI | Required | GPT series models, supports `reasoning_effort` |
| Anthropic (Claude) | Required | Claude series models, supports extended thinking |
| Google AI (Gemini) | Required | Gemini series models, supports thinking budget |
| DeepSeek | Required | DeepSeek series models, highly cost-effective |
| Zhipu AI (GLM) | Required | GLM series models |
| SiliconFlow | Required | Chinese model aggregator, extremely rich model selection |
| Groq AI | Required | Ultra-low latency inference (LPU accelerated) |
| Together AI | Required | Model aggregator platform |
| Cerebras | Required | Ultra-fast inference speed |
| ModelScope | Required | ModelScope community model service |
| **Custom Service** | Optional | Any service compatible with OpenAI API, supports auto-fetching models via `/models` |

### AI Translation Configuration

- Create multiple **translation parameter profiles**, each bindable to different translation services and exclusive parameters.
- Custom **System Prompt** and **User Prompt** (built-in optimized 3-stage translation strategy template).
- Adjustable parameters: `Temperature`, Reasoning Effort, Text Volume per Request, Paragraph Limit, Request Rate, Max Burst, Lazy Load Margin, and Placeholder Validation Thresholds.

## 📦 Installation & Usage

### Installation Guide

- Video Tutorials
  - [Quark Drive](https://pan.quark.cn/s/41bf3604f803)
  - [Baidu Netdisk](https://pan.baidu.com/s/1JVAj6vEVVrxu4h86sBNkVw?pwd=o1je)
- Text Tutorial
  - Install a userscript manager in your browser. [Tampermonkey](https://www.tampermonkey.net/) is recommended.
  - Enable `Developer mode` in your browser's `Manage Extensions` page.
  - Click `Tampermonkey` → `Details` → `Allow access to file URLs` (or `Allow running userscripts`).
  - Choose a version to install:
    - Primary
      - [Remote Version](https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/main.user.js)
      - [Local Version](https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/local.user.js)
    - Backup
      - [Remote Version](https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/main.user.js)
      - [Local Version](https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/local.user.js)
  - After installing the script, visit/refresh the [AO3 website](https://archiveofourown.org/), and the interface will automatically switch to Chinese.

### Basic Usage

- **Unit Translation Mode**: Click buttons like "Translate Summary", "Translate Tags", or "Translate Text" on work cards to translate on demand.
- **Full-Page Translation Mode**: Double-click the settings panel title bar to switch modes. Use the FAB to trigger full-page automatic translation with one click.
- Click the FAB to open the settings panel. All configuration options can be found under "More Features".

## ⚙️ Configuration & Advanced Usage

### Setting up API Keys

1. Open the settings panel → Select a translation service (e.g., DeepSeek).
2. Enter your Key in the "Set API Key" input box and click Save.
3. Supports entering multiple Keys (separated by `,`). The script will automatically handle polling and blacklist management.
For instructions on obtaining API Keys, please refer to the: [API Key Guide](https://v-lipset.github.io/docs/support/service).

### Configuring Glossaries

1. Settings Panel → More Features → **Set Local Glossary**.
2. Case-sensitive input format: `Original:Translation, Character Name:角色名`.
3. Case-insensitive input format is the same as above.
4. Do-Not-Translate glossary only requires listing the original text (separated by commas).
5. Multi-part terms use an equals sign: `Wakaba Mutsumi = 若叶 睦`.

**Online Glossaries**: More Features → **Manage Online Glossaries** → Enter a GitHub Raw / jsDelivr link to import. You can also browse community-shared glossaries in the "Online Glossary Library" and import them with one click.

### Setting up Blocking Rules

1. Settings Panel → More Features → **Work Blocker Configuration**.
2. Select the blocking dimension (Tag Filtering / Content Filtering / Stats Filtering / Advanced Filtering).
3. Enter the rules and save. The page will automatically refresh the blocking status.
4. Quick Action: Hold `Alt` and click any tag/author/work link to instantly add it to the blacklist.

### Exporting Works

1. Settings Panel → More Features → **Work Export & Generation**.
2. Select the file format (HTML / EPUB / PDF). You can customize the CSS template styles.
3. Click "Format Selection" to check the formats you want to export.
4. Click "Export File".

## 🛡️ Privacy & Security

- **100% Local Storage** — All configurations, API Keys, translation caches, and glossaries are stored locally in your browser's Tampermonkey storage (`GM_getValue`) or IndexedDB. **Nothing is uploaded to any remote server.**
- **Zero Telemetry** — The script contains no tracking, analytics, or crash reporting code.
- **API Key Masking in Logs** — The built-in logging system automatically replaces sensitive fields like API Keys and Tokens with `[MASKED]` when recording request data.
- **Full Data Control** — Supports categorized import/export of all configuration items (in JSON format) for easy backup and migration.
- **Strict Network Requests** — All authorized domains are explicitly declared in the script's `@connect` metadata. Tampermonkey strictly limits network requests to these domains.

## 📖 Documentation

- Documentation
  - [FAQ](https://v-lipset.github.io/docs/support/faq)
  - [Translation Services Intro](https://v-lipset.github.io/docs/support/service)
- Tutorials
  - [Using on Mirror Sites](https://v-lipset.github.io/docs/guides/mirror)
  - [Adding API Domains to Whitelist](https://v-lipset.github.io/docs/guides/whitelist)
- Feature Guides
  - [Local Glossaries](https://v-lipset.github.io/docs/feat/local)
  - [Work Blocker](https://v-lipset.github.io/docs/feat/block)
  - Online Glossaries
    - [Online Glossary Library](https://github.com/V-Lipset/ao3-chinese/wiki/在线术语库)
    - [Glossary Writing Guide](https://v-lipset.github.io/docs/feat/online/write)
    - [Creating an Online Glossary](https://v-lipset.github.io/docs/feat/online/create)
    - [Sharing Your Glossary](https://v-lipset.github.io/docs/feat/online/share)

## 🤝 Contributing & Feedback

If you find any translation errors, script bugs, or have feature suggestions, feel free to submit feedback via the [Issues](https://github.com/V-Lipset/ao3-chinese/issues) page!

## 📄 License

This project is open-sourced under the [GPL-3.0 License](./LICENSE).

## 🙏 Acknowledgements

- [V-Lipset](https://github.com/V-Lipset)
- [JiangxianEden](https://github.com/JiangxianEden)
- [github-chinese](https://github.com/maboloshi/github-chinese)
- [kiss-translator](https://github.com/fishjar/kiss-translator)
- [Traduzir-paginas-web](https://github.com/FilipePS/Traduzir-paginas-web)
- [Read Frog](https://github.com/mengxi-ream/read-frog)
- [AO3: Advanced Blocker](https://greasyfork.org/en/scripts/549942-ao3-advanced-blocker)
- [Google Material Symbols](https://fonts.google.com/icons)

<!-- LINK GROUP -->

[contributors-link]: https://github.com/V-Lipset/ao3-chinese/graphs/contributors
[contributors-shield]: https://img.shields.io/github/contributors/V-Lipset/ao3-chinese?style=flat-square&label=Contributors&labelColor=black&color=brightgreen
[last-commit-shield]: https://img.shields.io/github/last-commit/V-Lipset/ao3-chinese?style=flat-square&label=Last%20Commit&labelColor=black&color=blue
[release-link]: https://github.com/V-Lipset/ao3-chinese/releases
[release-shield]: https://img.shields.io/github/v/release/V-Lipset/ao3-chinese?include_prereleases&style=flat-square&label=Latest&color=brightgreen&labelColor=black
[stars-link]: https://github.com/V-Lipset/ao3-chinese/stargazers
[stars-shield]: https://img.shields.io/github/stars/V-Lipset/ao3-chinese?style=flat-square&label=Stars&color=yellow&labelColor=black
