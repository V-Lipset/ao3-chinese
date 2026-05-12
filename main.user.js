// ==UserScript==
// @name         AO3 Translator
// @namespace    https://github.com/V-Lipset/ao3-chinese
// @description  一个简单的用户脚本，专注于提升 AO3 的阅读体验
// @version      1.7.0-2026-05-12
// @author       V-Lipset
// @license      GPL-3.0
// @include      http*://archiveofourown.org/*
// @include      http*://archiveofourown.gay/*
// @match        https://neversleep.top/*
// @match        https://jdkg.org/*
// @match        https://bk3.jdkg.org/*
// @match        https://archiveofourown.site/*
// @match        https://ao3mirror.site/*
// @match        https://ao1s.top/*
// @match        https://ao3l.site/*
// @match        https://i.aois.top/*
// @match        https://xn--iao3-lw4b.ws/*
// @match        https://ao3sg.hyf9588.tech/*
// @match        https://ao3rc.hyf9588.tech/*
// @icon         https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/assets/icon.png
// @resource     vIcon https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/assets/icon.png
// @resource     santaHat https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/assets/santa%20hat.png
// @supportURL   https://github.com/V-Lipset/ao3-chinese/issues
// @downloadURL  https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/main.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/main.user.js
// @require      https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/zh-cn.js
// @connect      github.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @connect      translate.googleapis.com
// @connect      translate-pa.googleapis.com
// @connect      edge.microsoft.com
// @connect      api-edge.cognitive.microsofttranslator.com
// @connect      api.anthropic.com
// @connect      api.cerebras.ai
// @connect      api.deepseek.com
// @connect      generativelanguage.googleapis.com
// @connect      api.groq.com
// @connect      api-inference.modelscope.cn
// @connect      api.openai.com
// @connect      api.siliconflow.cn
// @connect      api.together.xyz
// @connect      open.bigmodel.cn
// @connect      fanyi.baidu.com
// @connect      transmart.qq.com
// @connect      cdnjs.cloudflare.com
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @grant        GM_download
// @grant        GM_info
// ==/UserScript==

(function (window, document) {
	'use strict';

	// Shadow DOM 全局变量
	let shadowHost = null;
	let shadowRoot = null;
	let shadowWrapper = null;

	/**************************************************************************
	 * 全局常量与配置
	 **************************************************************************/

	const monthMap = {
		'Jan': '1', 'Feb': '2', 'Mar': '3', 'Apr': '4', 'May': '5', 'Jun': '6',
		'Jul': '7', 'Aug': '8', 'Sep': '9', 'Oct': '10', 'Nov': '11', 'Dec': '12'
	};

	window.monthMap = monthMap;

	/**
	 * 全局自定义事件字典
	 */
	const CUSTOM_EVENTS = {
		PANEL_STATE_SYNC: 'ao3-panel-state-sync',
		CACHE_UPDATED: 'ao3-cache-updated',
		CLEAR_PAGE_CACHE: 'ao3-clear-current-page-cache',
		MODE_CHANGED: 'ao3-mode-changed',
		AUTO_TRANSLATE_CHANGED: 'ao3-auto-translate-changed',
		FAB_CLICKED: 'ao3-fab-clicked',
		STATUS_LIGHT_TOGGLED: 'ao3-status-light-toggled',
		LOG_ADDED: 'ao3-log-added',
		GLOSSARY_IMPORTED: 'ao3-glossary-imported'
	};

	/**
	 * 全局默认配置常量库
	 */
	const DEFAULT_CONFIG = {
		GENERAL: {
			enable_RegExp: true,
			enable_transDesc: false,
			enable_ui_trans: true,
			show_fab: true,
			log_level: 'INFO',
			log_auto_clear: 3,
			translation_display_mode: 'bilingual',
			from_lang: 'script_auto',
			to_lang: 'zh-CN',
			lang_detector: 'franc',
			custom_url_first_save_done: false,
			fab_actions: {
				unit: {
					click: 'toggle_panel',
					double_click: 'none',
					long_press: 'toggle_panel',
					right_click: 'toggle_panel'
				},
				full_page: {
					click: 'toggle_translate',
					double_click: 'none',
					long_press: 'toggle_panel',
					right_click: 'toggle_panel'
				}
			}
		},
		BLOCKER: {
			enabled: true,
			show_reasons: true,
			current_view: 'tags',
			current_sub_view: 'black',
			tags_black: '',
			tags_white: '',
			content_author: '',
			content_title: '',
			content_summary: '',
			content_id: '',
			stats_min_words: '',
			stats_max_words: '',
			stats_min_chapters: '',
			stats_max_chapters: '',
			stats_update: '',
			stats_crossover: '',
			adv_pairing: '',
			adv_char: '',
			adv_lang: '',
			adv_scope_rel: '1',
			adv_scope_char: '5'
		},
		FORMATTING: {
			indent: 'false',
			fontSize: '100',
			letterSpacing: '0',
			lineHeight: '1.5',
			margins: '0'
		},
		ENGINE: {
			current: 'google_translate'
		}
	};

	/**
	 * 全局 SVG 图标库
	 */
	const SVG_ICONS = {
		home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>',
		delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M312-144q-29.7 0-50.85-20.15Q240-184.3 240-214v-506h-48v-40h164v-30h248v30h164v40h-48v506q0 29.7-21.15 50.85Q677.7-144 648-144H312Zm336-576H312v506q0 13 8.5 21.5t21.5 8.5h306q13 0 21.5-8.5t8.5-21.5v-506Zm-261 418h40v-330h-40v330Zm146 0h40v-330h-40v330ZM312-720v536-536Z"/></svg>',
		search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>',
		download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>',
		spinner: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480.5-80Q398-80 325-111.5Z"/></svg>',
		success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>',
		error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>',
		arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="240 -760 480 520"><path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z"/></svg>',
		arrowDown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="240 -760 480 520"><path d="M480-240 240-480l56-56 144 144v-368h80v368l144-144 56 56-240 240Z"/></svg>',
		toggleOn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm485-75q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm-285-85Z"/></svg>',
		toggleOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-240q-100 0-170-70T40-480q0-100 70-170t170-70h400q100 0 170 70t70 170q0 100-70 170t-170 70H280Zm0-80h400q66 0 113-47t47-113q0-66-47-113t-113-47H280q-66 0-113 47t-47 113q0 66 47 113t113 47Zm85-75q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm115-85Z"/></svg>',
		retry: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-694v-106h80v240H560v-80h136q-34-45-84.5-72.5T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q88 0 151.5-54T713-440h82q-19 127-115 203.5T480-160Z"/></svg>',
		visibilityOn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>',
		visibilityOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'
	};

	/**
	 * 占位符全局配置与管理模块
	 */
	const PlaceholderConfig = {
		prefix: 'vtr_',  // 占位符前缀
		length: 5,       // 占位符数字长度

		get exampleString() {
			return this.prefix + '123456789'.substring(0, this.length);
		},
		generate: function () {
			const chars = '0123456789';
			let result = '';
			for (let i = 0; i < this.length; i++) {
				result += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return this.prefix + result;
		},
		get endBoundaryRegex() {
			return new RegExp(`${this.prefix}\\d{${this.length}}$`);
		},
		get startBoundaryRegex() {
			return new RegExp(`^${this.prefix}\\d{${this.length}}`);
		},
		get fuzzyRegex() {
			const prefixBase = this.prefix.replace(/_$/, '');
			return new RegExp(`${prefixBase}[\\s_\\-－＿—]*(\\d{${this.length}})`, 'gi');
		},
		get instructionText() {
			const numWord = this.length === 5 ? 'five' : (this.length === 6 ? 'six' : this.length);
			return `- **Placeholder Preservation:** If an item contains special placeholders in the format \`${this.prefix}\` followed by ${numWord} digits (e.g., \`${this.exampleString}\`), you MUST preserve these placeholders exactly as they are. DO NOT translate, modify, or delete them.`;
		}
	};

	// 功能开关
	const FeatureSet = {
		enable_RegExp: GM_getValue('enable_RegExp', DEFAULT_CONFIG.GENERAL.enable_RegExp),
		enable_transDesc: GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc),
		enable_ui_trans: GM_getValue('enable_ui_trans', DEFAULT_CONFIG.GENERAL.enable_ui_trans),
	};

	// 自定义服务存储键
	const CUSTOM_SERVICES_LIST_KEY = 'custom_services_list';
	const ACTIVE_MODEL_PREFIX_KEY = 'active_model_for_';
	const ADD_NEW_CUSTOM_SERVICE_ID = 'add_new_custom';

	// 存储已编译的术语表正则组
	let runtimePreparedGlossaryCache = null;

	/**
	 * 语言选项常量
	 */
	const ALL_LANG_OPTIONS = [
		["zh-CN", "简体中文"],
		["zh-TW", "繁體中文"],
		["ar", "العربية"],
		["bg", "Български"],
		["bn", "বাংলা"],
		["ca", "Català"],
		["cs", "Čeština"],
		["da", "Dansk"],
		["de", "Deutsch"],
		["el", "Ελληνικά"],
		["en", "English"],
		["es", "Español"],
		["et", "Eesti"],
		["fa", "فارسی"],
		["fi", "Suomi"],
		["fr", "Français"],
		["gu", "ગુજરાતી"],
		["he", "עברית"],
		["hi", "हिन्दी"],
		["hr", "Hrvatski"],
		["hu", "Magyar"],
		["id", "Indonesia"],
		["is", "Íslenska"],
		["it", "Italiano"],
		["ja", "日本語"],
		["kn", "ಕನ್ನಡ"],
		["ko", "한국어"],
		["lt", "Lietuvių"],
		["lv", "Latviešu"],
		["ml", "മലയാളം"],
		["mr", "मराठी"],
		["ms", "Melayu"],
		["mt", "Malti"],
		["nl", "Nederlands"],
		["no", "Norsk"],
		["pa", "ਪੰਜਾਬੀ"],
		["pl", "Polski"],
		["pt", "Português"],
		["ro", "Română"],
		["ru", "Русский"],
		["sk", "Slovenčina"],
		["sl", "Slovenščina"],
		["sv", "Svenska"],
		["sw", "Kiswahili"],
		["ta", "தமிழ்"],
		["te", "తెలుగు"],
		["th", "ไทย"],
		["tr", "Türkçe"],
		["uk", "Українська"],
		["ur", "اردو"],
		["vi", "Tiếng Việt"],
		["zu", "isiZulu"],
	];

	/**
	 * 语言代码到自然语言名称的映射
	 */
	const LANG_CODE_TO_NAME = {
		'auto': 'the original language',
		'zh-CN': 'Simplified Chinese (简体中文)',
		'zh-TW': 'Traditional Chinese (繁體中文)',
		'ar': 'Arabic (العربية)',
		'bg': 'Bulgarian (Български)',
		'bn': 'Bengali (বাংলা)',
		'ca': 'Catalan (Català)',
		'cs': 'Czech (Čeština)',
		'da': 'Danish (Dansk)',
		'de': 'German (Deutsch)',
		'el': 'Greek (Ελληνικά)',
		'en': 'English',
		'es': 'Spanish (Español)',
		'et': 'Estonian (Eesti)',
		'fa': 'Persian (فارسی)',
		'fi': 'Finnish (Suomi)',
		'fr': 'French (Français)',
		'gu': 'Gujarati (ગુજરાતી)',
		'he': 'Hebrew (עברית)',
		'hi': 'Hindi (हिन्दी)',
		'hr': 'Croatian (Hrvatski)',
		'hu': 'Hungarian (Magyar)',
		'id': 'Indonesian (Indonesia)',
		'is': 'Icelandic (Íslenska)',
		'it': 'Italian (Italiano)',
		'ja': 'Japanese (日本語)',
		'kn': 'Kannada (ಕನ್ನಡ)',
		'ko': 'Korean (한국어)',
		'lt': 'Lithuanian (Lietuvių)',
		'lv': 'Latvian (Latviešu)',
		'ml': 'Malayalam (മലയാളം)',
		'mr': 'Marathi (मराठी)',
		'ms': 'Malay (Melayu)',
		'mt': 'Maltese (Malti)',
		'nl': 'Dutch (Nederlands)',
		'no': 'Norwegian (Norsk)',
		'pa': 'Punjabi (ਪੰਜਾਬੀ)',
		'pl': 'Polish (Polski)',
		'pt': 'Portuguese (Português)',
		'ro': 'Romanian (Română)',
		'ru': 'Russian (Русский)',
		'sk': 'Slovak (Slovenčina)',
		'sl': 'Slovenian (Slovenščina)',
		'sv': 'Swedish (Svenska)',
		'sw': 'Swahili (Kiswahili)',
		'ta': 'Tamil (தமிழ்)',
		'te': 'Telugu (తెలుగు)',
		'th': 'Thai (ไทย)',
		'tr': 'Turkish (Türkçe)',
		'uk': 'Ukrainian (Українська)',
		'ur': 'Urdu (اردو)',
		'vi': 'Vietnamese (Tiếng Việt)',
		'zu': 'Zulu (isiZulu)',
	};

	// 占位符示例
	const ph = PlaceholderConfig.exampleString;

	/**
	 * 针对不同目标语言的输出示例数据
	 */
	const PROMPT_EXAMPLE_OUTPUTS = {
		'zh-CN': `[#0] 这是<em>第一个</em>句子。\n[#1] ---\n[#2] 她的名字是 ${ph}。`,
		'zh-TW': `[#0] 這是<em>第一個</em>句子。\n[#1] ---\n[#2] 她的名字是 ${ph}。`,
		'ar': `[#0] هذه هي الجملة <em>الأولى</em>.\n[#1] ---\n[#2] اسمها هو ${ph}.`,
		'bg': `[#0] Това е <em>първото</em> изречение.\n[#1] ---\n[#2] Нейното име е ${ph}.`,
		'bn': `[#0] এটি <em>প্রথম</em> বাক্য।\n[#1] ---\n[#2] তার নাম ${ph}।`,
		'ca': `[#0] Aquesta és la <em>primera</em> frase.\n[#1] ---\n[#2] El seu nom és ${ph}.`,
		'cs': `[#0] Toto je <em>první</em> věta.\n[#1] ---\n[#2] Jmenuje se ${ph}.`,
		'da': `[#0] Dette er den <em>første</em> sætning.\n[#1] ---\n[#2] Hendes navn er ${ph}.`,
		'de': `[#0] Das ist der <em>erste</em> Satz.\n[#1] ---\n[#2] Ihr Name ist ${ph}.`,
		'el': `[#0] Αυτή είναι η <em>πρώτη</em> πρόταση.\n[#1] ---\n[#2] Το όνομά της είναι ${ph}.`,
		'es': `[#0] Esta es la <em>primera</em> frase.\n[#1] ---\n[#2] Su nombre es ${ph}.`,
		'et': `[#0] See on <em>esimene</em> lause.\n[#1] ---\n[#2] Tema nimi on ${ph}.`,
		'fa': `[#0] این <em>اولین</em> جمله است.\n[#1] ---\n[#2] نام او ${ph} است.`,
		'fi': `[#0] Tämä on <em>ensimmäinen</em> lause.\n[#1] ---\n[#2] Hänen nimensä on ${ph}.`,
		'fr': `[#0] C'est la <em>première</em> phrase.\n[#1] ---\n[#2] Son nom est ${ph}.`,
		'gu': `[#0] આ <em>પહેલું</em> વાક્ય છે।\n[#1] ---\n[#2] તેનું નામ ${ph} છે।`,
		'he': `[#0] זהו המשפט ה<em>ראשון</em>.\n[#1] ---\n[#2] שמה הוא ${ph}.`,
		'hi': `[#0] यह <em>पहला</em> वाक्य है।\n[#1] ---\n[#2] उसका नाम ${ph} है।`,
		'hr': `[#0] Ovo je <em>prva</em> rečenica.\n[#1] ---\n[#2] Njeno ime je ${ph}.`,
		'hu': `[#0] Ez az <em>első</em> mondat.\n[#1] ---\n[#2] A neve ${ph}.`,
		'id': `[#0] Ini adalah kalimat <em>pertama</em>.\n[#1] ---\n[#2] Namanya adalah ${ph}.`,
		'is': `[#0] Þetta er <em>fyrsta</em> setningin.\n[#1] ---\n[#2] Hún heitir ${ph}.`,
		'it': `[#0] Questa è la <em>prima</em> frase.\n[#1] ---\n[#2] Il suo nome è ${ph}.`,
		'ja': `[#0] これは<em>最初の</em>文です。\n[#1] ---\n[#2] 彼女の名前は ${ph} です。`,
		'kn': `[#0] ಇದು <em>ಮೊದಲ</em> ವಾಕ್ಯ।\n[#1] ---\n[#2] ಅವಳ ಹೆಸರು ${ph}।`,
		'ko': `[#0] 이것은 <em>첫 번째</em> 문장입니다。\n[#1] ---\n[#2] 그녀의 이름은 ${ph} 입니다。`,
		'lt': `[#0] Tai yra <em>pirmas</em> sakinys.\n[#1] ---\n[#2] Jos vardas yra ${ph}.`,
		'lv': `[#0] Šis ir <em>pirmais</em> teikums.\n[#1] ---\n[#2] Viņas vārds ir ${ph}.`,
		'ml': `[#0] ഇതാണ് <em>ഒന്നാമത്തെ</em> വാക്യം।\n[#1] ---\n[#2] അവളുടെ പേര് ${ph} എന്നാണ്।`,
		'mr': `[#0] हे <em>पहिले</em> वाक्य आहे।\n[#1] ---\n[#2] तिचे नाव ${ph} आहे।`,
		'ms': `[#0] Ini adalah ayat <em>pertama</em>.\n[#1] ---\n[#2] Namanya ialah ${ph}.`,
		'mt': `[#0] Din hija l-<em>ewwel</em> sentenza.\n[#1] ---\n[#2] Jisimha hu ${ph}.`,
		'nl': `[#0] Dit is de <em>eerste</em> zin.\n[#1] ---\n[#2] Haar naam is ${ph}.`,
		'no': `[#0] Dette er den <em>første</em> setningen.\n[#1] ---\n[#2] Hennes navn er ${ph}.`,
		'pa': `[#0] ਇਹ <em>ਪਹਿਲਾ</em> ਵਾਕ ਹੈ।\n[#1] ---\n[#2] ਉਸਦਾ ਨਾਮ ${ph} ਹੈ।`,
		'pl': `[#0] To jest <em>pierwsze</em> zdanie.\n[#1] ---\n[#2] Nazywa się ${ph}.`,
		'pt': `[#0] Esta é a <em>primeira</em> frase.\n[#1] ---\n[#2] O nome dela é ${ph}.`,
		'ro': `[#0] Aceasta este <em>prima</em> propoziție.\n[#1] ---\n[#2] Numele ei este ${ph}.`,
		'ru': `[#0] Это <em>первое</em> предложение.\n[#1] ---\n[#2] Её зовут ${ph}.`,
		'sk': `[#0] Toto je <em>prvá</em> veta.\n[#1] ---\n[#2] Volá sa ${ph}.`,
		'sl': `[#0] To je <em>prvi</em> stavek.\n[#1] ---\n[#2] Ime ji je ${ph}.`,
		'sv': `[#0] Detta är den <em>första</em> meningen.\n[#1] ---\n[#2] Hennes namn är ${ph}.`,
		'sw': `[#0] Hii ni sentensi ya <em>kwanza</em>.\n[#1] ---\n[#2] Jina lake ni ${ph}.`,
		'ta': `[#0] இது <em>முதல்</em> வாக்கியம்.\n[#1] ---\n[#2] அவள் பெயர் ${ph}.`,
		'te': `[#0] ఇది <em>మొదటి</em> వాక్యం.\n[#1] ---\n[#2] ఆమె పేరు ${ph}.`,
		'th': `[#0] นี่คือประโยค<em>แรก</em>\n[#1] ---\n[#2] ชื่อของเธอคือ ${ph}`,
		'tr': `[#0] Bu <em>birinci</em> cümledir.\n[#1] ---\n[#2] Onun adı ${ph}.`,
		'uk': `[#0] Це <em>перше</em> речення.\n[#1] ---\n[#2] Її звати ${ph}.`,
		'ur': `[#0] یہ <em>پہلا</em> جملہ ہے۔\n[#1] ---\n[#2] اس کا نام ${ph} ہے۔`,
		'vi': `[#0] Đây là câu <em>đầu tiên</em>.\n[#1] ---\n[#2] Tên cô ấy là ${ph}.`,
		'zu': `[#0] Lona umusho <em>wokuqala</em>.\n[#1] ---\n[#2] Igama lakhe ngu-${ph}.`,
		'default': `[#0] This is the <em>first</em> sentence.\n[#1] ---\n[#2] Her name is ${ph}.`
	};

	/**
	 * 根据目标语言动态生成完整的提示示例
	 */
	function generatePromptExample(toLang, useShortTextMode = false) {
		const exampleOutputText = PROMPT_EXAMPLE_OUTPUTS[toLang] || PROMPT_EXAMPLE_OUTPUTS['zh-CN'];
		if (useShortTextMode) {
			const shortTextExample = exampleOutputText
				.replace(/\[#0\]\s*/g, '0. ')
				.replace(/\[#1\]\s*/g, '1. ')
				.replace(/\[#2\]\s*/g, '2. ');
			return `### Example Output:\n${shortTextExample}`;
		}
		return `### Example Output:\n${exampleOutputText}`;
	}

	/**
	 * 获取 AI 翻译系统提示词模板
	 */
	function getSharedSystemPrompt() {
		return `You are a professional translator fluent in {toLangName}, with particular expertise in translating web novels and online fanfiction from {fromLangName}.

		Your task is to translate multiple text segments provided by the user. For each segment, you will follow an internal three-stage strategy to produce the final, polished translation.

		### Internal Translation Strategy (for each item):
		1.  **Stage 1 (Internal Thought Process):** Produce a literal, word-for-word translation of the original content.
		2.  **Stage 2 (Internal Thought Process):** Based on the literal translation, identify any phrasing that is unnatural or does not flow well in the target language.
		3.  **Stage 3 (Final Output):** Produce a polished, idiomatic translation that fully preserves the original meaning, tone, cultural nuances, and any specialized fandom terminology. The final translation must be natural-sounding, readable, and conform to standard usage in {toLangName}.

		### CRITICAL OUTPUT INSTRUCTIONS:
		- The input consists of multiple segments, each prefixed with an ID tag like [#0], [#1], etc.
		- Your entire response MUST consist of *only* the polished translations from Stage 3.
		- You MUST prefix each translated segment with its EXACT corresponding ID tag (e.g., [#0] Translated text...).
		- Do NOT include any stage numbers, headers, notes, or explanations in your final output.
		- **HTML Tag Preservation:** If an item contains HTML tags (e.g., \`<em>\`, \`<strong>\`), you MUST preserve these tags exactly as they are in the original.
		${PlaceholderConfig.instructionText}

		### Example Input:
		[#0] This is the <em>first</em> sentence.
		[#1] ---
		[#2] Her name is ${PlaceholderConfig.exampleString}.

		{exampleOutput}
		`;
	}

	// 创建一个标准的、兼容OpenAI API的服务配置对象
	const createStandardApiConfig = ({ name, url }) => ({
		name: name,
		url_api: url,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		responseIdentifier: 'choices[0].message.content',
	});

	/**
	 * 微软翻译语言代码映射表
	 */
	const BING_LANG_CODE_MAP = {
		'zh-CN': 'zh-Hans',
		'zh-TW': 'zh-Hant',
		'yue': 'yue',
		'auto': 'auto-detect'
	};

	// 语言检测截取字符长度限制
	const LANG_DETECT_MAX_LENGTH = 400;

	/**
	 * 底层实现配置
	 */
	const CONFIG = {
		LANG: 'zh-CN',
		OBSERVER_CONFIG: {
			childList: true,
			subtree: true,
			characterData: true,
			attributeFilter:['value', 'placeholder', 'aria-label', 'data-confirm', 'title', 'style', 'class']
		},
		transEngine: GM_getValue('transEngine', DEFAULT_CONFIG.ENGINE.current),
		SERVICE_CONFIG: {
			// 默认翻译参数配置
			default: {
				CHUNK_SIZE: 1600,
				PARAGRAPH_LIMIT: 8,
				LAZY_LOAD_ROOT_MARGIN: '400px 0px 1200px 0px',
				REQUEST_RATE: 0.5,
				REQUEST_CAPACITY: 1,
				VALIDATION: {
					absolute_loss: 6,
					proportional_loss: 0.5,
					proportional_trigger_count: 6,
					catastrophic_loss: 3
				}
			},
			// 谷歌翻译
			google_translate: {
				CHUNK_SIZE: 4000,
				PARAGRAPH_LIMIT: 20,
				LAZY_LOAD_ROOT_MARGIN: '1200px 0px 10000px 0px',
				REQUEST_RATE: 5,
				REQUEST_CAPACITY: 20,
				VALIDATION: {
					absolute_loss: 6,
					proportional_loss: 0.5,
					proportional_trigger_count: 6,
					catastrophic_loss: 3
				}
			},
			// 微软翻译
			bing_translator: {
				CHUNK_SIZE: 3000,
				PARAGRAPH_LIMIT: 15,
				LAZY_LOAD_ROOT_MARGIN: '1200px 0px 10000px 0px',
				REQUEST_RATE: 5,
				REQUEST_CAPACITY: 20,
				VALIDATION: {
					absolute_loss: 6,
					proportional_loss: 0.5,
					proportional_trigger_count: 6,
					catastrophic_loss: 3
				}
			}
		},
		TRANS_ENGINES: {
			google_translate: {
				name: '谷歌翻译',
				url_api: 'https://translate-pa.googleapis.com/v1/translateHtml',
				method: 'POST',
				headers: { 'Content-Type': 'application/json+protobuf' },
				getRequestData: (paragraphs) => {
					const sourceTexts = paragraphs.map(p => p.outerHTML);
					return JSON.stringify([
						[sourceTexts, "auto", "zh-CN"], "te"
					]);
				},
			},
			bing_translator: {
				name: '微软翻译',
				url_api: 'https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&includeSentenceLength=true',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			},
			openai: createStandardApiConfig({
				name: 'OpenAI',
				url: 'https://api.openai.com/v1/chat/completions',
			}),
			siliconflow: createStandardApiConfig({
				name: 'SiliconFlow',
				url: 'https://api.siliconflow.cn/v1/chat/completions',
			}),
			anthropic: {
				name: 'Anthropic',
				url_api: 'https://api.anthropic.com/v1/messages',
				method: 'POST',
				responseIdentifier: 'content[0].text',
			},
			zhipu_ai: createStandardApiConfig({
				name: 'Zhipu AI',
				url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
			}),
			deepseek_ai: createStandardApiConfig({
				name: 'DeepSeek',
				url: 'https://api.deepseek.com/chat/completions',
			}),
			google_ai: {
				name: 'Google AI',
				url_api: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				responseIdentifier: 'candidates[0].content.parts[0].text',
			},
			groq_ai: createStandardApiConfig({
				name: 'Groq AI',
				url: 'https://api.groq.com/openai/v1/chat/completions',
			}),
			together_ai: createStandardApiConfig({
				name: 'Together AI',
				url: 'https://api.together.xyz/v1/chat/completions',
			}),
			cerebras_ai: createStandardApiConfig({
				name: 'Cerebras',
				url: 'https://api.cerebras.ai/v1/chat/completions',
			}),
			modelscope_ai: createStandardApiConfig({
				name: 'ModelScope',
				url: 'https://api-inference.modelscope.cn/v1/chat/completions',
			}),
		}
	};

	/**
	 * 翻译参数配置管理器
	 */
	const AI_PROFILES_KEY = 'ao3_translation_profiles';

	// 基础参数默认值
	const BASE_AI_PARAMS = {
		system_prompt: getSharedSystemPrompt(),
		user_prompt: `Translate the following numbered list to {toLangName} (output translation only):\n\n{numberedText}`,
		temperature: 0,
		chunk_size: CONFIG.SERVICE_CONFIG.default.CHUNK_SIZE,
		para_limit: CONFIG.SERVICE_CONFIG.default.PARAGRAPH_LIMIT,
		request_rate: CONFIG.SERVICE_CONFIG.default.REQUEST_RATE,
		request_capacity: CONFIG.SERVICE_CONFIG.default.REQUEST_CAPACITY,
		lazy_load_margin: CONFIG.SERVICE_CONFIG.default.LAZY_LOAD_ROOT_MARGIN,
		validation_thresholds: `${CONFIG.SERVICE_CONFIG.default.VALIDATION.absolute_loss}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.proportional_loss}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.proportional_trigger_count}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.catastrophic_loss}`,
		reasoning_effort: 'default'
	};

	const ProfileManager = {
		// 初始化配置数据
		init() {
			let profiles = GM_getValue(AI_PROFILES_KEY);

			if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
				// 初始化默认配置
				const defaultProfile = {
					id: 'profile_default',
					name: '默认',
					isProtected: true,
					services: [],
					params: { ...BASE_AI_PARAMS }
				};

				// 初始化 DeepSeek 配置
				const deepseekProfile = {
					id: 'profile_deepseek_init',
					name: 'DeepSeek',
					isProtected: false,
					services: ['deepseek_ai'],
					params: {
						...BASE_AI_PARAMS,
						request_rate: 5,
						request_capacity: 20
					}
				};

				profiles = [defaultProfile, deepseekProfile];
				GM_setValue(AI_PROFILES_KEY, profiles);
				Logger.info('Config', '翻译参数配置已初始化');
			}
		},

		getAllProfiles() {
			return GM_getValue(AI_PROFILES_KEY, []);
		},

		getProfile(id) {
			const profiles = this.getAllProfiles();
			return profiles.find(p => p.id === id) || null;
		},

		saveProfile(updatedProfile) {
			const profiles = this.getAllProfiles();
			const index = profiles.findIndex(p => p.id === updatedProfile.id);
			if (index !== -1) {
				profiles[index] = updatedProfile;
				GM_setValue(AI_PROFILES_KEY, profiles);
				return true;
			}
			return false;
		},

		createProfile(name) {
			const profiles = this.getAllProfiles();
			const newProfile = {
				id: `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
				name: name,
				isProtected: false,
				services: [],
				params: { ...BASE_AI_PARAMS }
			};
			profiles.push(newProfile);
			GM_setValue(AI_PROFILES_KEY, profiles);
			return newProfile.id;
		},

		deleteProfile(id) {
			let profiles = this.getAllProfiles();
			const profile = profiles.find(p => p.id === id);
			if (profile && profile.isProtected) return false;

			profiles = profiles.filter(p => p.id !== id);
			GM_setValue(AI_PROFILES_KEY, profiles);
			return true;
		},

		updateServiceAssociation(targetProfileId, serviceIds) {
			const profiles = this.getAllProfiles();
			const targetProfile = profiles.find(p => p.id === targetProfileId);
			if (!targetProfile) return;

			profiles.forEach(p => {
				if (p.id !== targetProfileId && p.services) {
					p.services = p.services.filter(sId => !serviceIds.includes(sId));
				}
			});

			targetProfile.services = serviceIds;

			GM_setValue(AI_PROFILES_KEY, profiles);
		},

		getParamsByEngine(engineId) {
			if (engineId === 'google_translate' || engineId === 'bing_translator') {
				return null;
			}

			const profiles = this.getAllProfiles();
			const matchedProfile = profiles.find(p => p.services && p.services.includes(engineId));

			if (matchedProfile) {
				return { ...BASE_AI_PARAMS, ...matchedProfile.params };
			}

			const defaultProfile = profiles.find(p => p.id === 'profile_default');
			if (defaultProfile) {
				return { ...BASE_AI_PARAMS, ...defaultProfile.params };
			}

			return { ...BASE_AI_PARAMS };
		}
	};

	/**
	 * 文章格式相关存储键及默认值
	 */
	const FORMATTING_PROFILES_KEY = 'ao3_formatting_profiles';
	const FORMATTING_SELECTED_ID_KEY = 'ao3_formatting_selected_id';

	const DEFAULT_FORMAT_PARAMS = {
		indent: 'false',
		fontSize: '100',
		letterSpacing: '0',
		lineHeight: '1.5',
		margins: '0'
	};

	const FormattingManager = {
		init() {
			let profiles = GM_getValue(FORMATTING_PROFILES_KEY);
			if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
				const defaultProfile = {
					id: 'fmt_default',
					name: '默认',
					params: { ...DEFAULT_FORMAT_PARAMS }
				};
				profiles = [defaultProfile];
				GM_setValue(FORMATTING_PROFILES_KEY, profiles);
				GM_setValue(FORMATTING_SELECTED_ID_KEY, 'fmt_default');
			}
		},

		getAllProfiles() {
			return GM_getValue(FORMATTING_PROFILES_KEY, []);
		},

		getProfile(id) {
			const profiles = this.getAllProfiles();
			return profiles.find(p => p.id === id) || null;
		},

		getCurrentProfile() {
			const selectedId = GM_getValue(FORMATTING_SELECTED_ID_KEY);
			const profiles = this.getAllProfiles();
			return profiles.find(p => p.id === selectedId) || profiles[0];
		},

		saveProfile(updatedProfile) {
			const profiles = this.getAllProfiles();
			const index = profiles.findIndex(p => p.id === updatedProfile.id);
			if (index !== -1) {
				profiles[index] = updatedProfile;
				GM_setValue(FORMATTING_PROFILES_KEY, profiles);
				return true;
			}
			return false;
		},

		createProfile() {
			const profiles = this.getAllProfiles();

			let maxNum = 0;
			const regex = /^方案 (\d+)$/;
			profiles.forEach(p => {
				const match = p.name.match(regex);
				if (match) {
					const num = parseInt(match[1], 10);
					if (num > maxNum) maxNum = num;
				}
			});
			const newName = `方案 ${maxNum + 1}`;

			const newProfile = {
				id: `fmt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
				name: newName,
				params: { ...DEFAULT_FORMAT_PARAMS }
			};

			profiles.push(newProfile);
			GM_setValue(FORMATTING_PROFILES_KEY, profiles);
			return newProfile.id;
		},

		deleteProfile(id) {
			let profiles = this.getAllProfiles();
			profiles = profiles.filter(p => p.id !== id);

			let newSelectedId;

			if (profiles.length === 0) {
				const defaultProfile = {
					id: 'fmt_default',
					name: '默认',
					params: { ...DEFAULT_FORMAT_PARAMS }
				};
				profiles = [defaultProfile];
				newSelectedId = defaultProfile.id;
			} else {
				newSelectedId = profiles[0].id;
			}

			GM_setValue(FORMATTING_PROFILES_KEY, profiles);
			GM_setValue(FORMATTING_SELECTED_ID_KEY, newSelectedId);

			return newSelectedId;
		},

		setCurrentId(id) {
			GM_setValue(FORMATTING_SELECTED_ID_KEY, id);
		}
	};

	/**
	 * SHA-256 哈希计算 (用于生成唯一的 Cache Key)
	 */
	async function sha256(message) {
		if (window.crypto && window.crypto.subtle) {
			const msgBuffer = new TextEncoder().encode(message);
			const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		} else {
			let hash = 5381;
			for (let i = 0; i < message.length; i++) {
				hash = ((hash << 5) + hash) ^ message.charCodeAt(i);
			}
			return (hash >>> 0).toString(16).padStart(8, '0');
		}
	}

	/**
	 * 构建缓存 Key
	 */
	async function buildCacheKey(text, fromLang, toLang) {
		const engine = getValidEngineName();
		const provider = getProviderById(engine);
		const model = provider ? provider.selectedModel : 'default';
		const apiHost = provider ? provider.apiHost : 'default';
		const params = ProfileManager.getParamsByEngine(engine) || {};
		const sysPrompt = params.system_prompt || '';
		const usrPrompt = params.user_prompt || '';
		const temperature = params.temperature !== undefined ? params.temperature : 'default'; 
		const reasoningEffort = params.reasoning_effort || 'default'; 
		const glossaryVer = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);
		const postReplaceRules = JSON.stringify(GM_getValue(POST_REPLACE_RULES_KEY, []));
		const rawString = `${text}|${engine}|${model}|${apiHost}|${fromLang}|${toLang}|${sysPrompt}|${usrPrompt}|${temperature}|${reasoningEffort}|${glossaryVer}|${postReplaceRules}`;
		return await sha256(rawString);
	}

	/**
	 * 翻译缓存数据库 (原生 IndexedDB 封装)
	 */
	const TranslationCacheDB = {
		dbName: 'AO3TranslatorCacheDB',
		storeName: 'translations',
		version: 1,
		db: null,

		async init() {
			return new Promise((resolve) => {
				const request = indexedDB.open(this.dbName, this.version);
				
				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains(this.storeName)) {
						const store = db.createObjectStore(this.storeName, { keyPath: 'hashKey' });
						store.createIndex('timestamp', 'timestamp', { unique: false });
						store.createIndex('textHash', 'textHash', { unique: false });
					}
				};
				
				request.onsuccess = (event) => {
					this.db = event.target.result;
					resolve();
				};
				
				request.onerror = (event) => {
					Logger.error('System', 'IndexedDB 初始化失败', event.target.error);
					resolve();
				};
				
				request.onblocked = () => {
					Logger.warn('System', 'IndexedDB 访问被阻塞，请关闭其她 AO3 标签页后刷新重试');
					resolve();
				};
			});
		},

		async get(keys) {
			if (!this.db) return keys.map(() => null);
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readonly');
					const store = transaction.objectStore(this.storeName);
					const results = new Array(keys.length);
					let completed = 0;

					if (keys.length === 0) return resolve([]);

					keys.forEach((key, index) => {
						const req = store.get(key);
						req.onsuccess = (e) => {
							results[index] = e.target.result || null;
							completed++;
							if (completed === keys.length) resolve(results);
						};
						req.onerror = () => {
							results[index] = null;
							completed++;
							if (completed === keys.length) resolve(results);
						};
					});
				} catch (e) {
					Logger.error('System', 'IndexedDB get 事务创建失败', e);
					this.db = null;
					resolve(keys.map(() => null));
				}
			});
		},

		async put(entries) {
			if (!this.db || entries.length === 0) return;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readwrite');
					const store = transaction.objectStore(this.storeName);
					entries.forEach(entry => store.put(entry));
					transaction.oncomplete = () => {
						document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
						resolve();
					};
					transaction.onerror = () => resolve();
				} catch (e) {
					Logger.error('System', 'IndexedDB put 事务创建失败', e);
					this.db = null;
					resolve();
				}
			});
		},

		async updateTimestamps(keys) {
			if (!this.db || keys.length === 0) return;
			const now = Date.now();
			try {
				const transaction = this.db.transaction([this.storeName], 'readwrite');
				const store = transaction.objectStore(this.storeName);
				keys.forEach(key => {
					const req = store.get(key);
					req.onsuccess = (e) => {
						const data = e.target.result;
						if (data) {
							data.timestamp = now;
							store.put(data);
						}
					};
				});
			} catch (e) {
				Logger.error('System', 'IndexedDB updateTimestamps 事务创建失败', e);
				this.db = null;
			}
		},

		async delete(keys) {
			if (!this.db || keys.length === 0) return;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readwrite');
					const store = transaction.objectStore(this.storeName);
					keys.forEach(key => store.delete(key));
					transaction.oncomplete = () => resolve();
					transaction.onerror = () => resolve();
				} catch (e) {
					Logger.error('System', 'IndexedDB delete 事务创建失败', e);
					this.db = null;
					resolve();
				}
			});
		},

		async deleteByTextHashes(textHashes) {
			if (!this.db || textHashes.length === 0) return 0;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readwrite');
					const store = transaction.objectStore(this.storeName);
					
					if (!store.indexNames.contains('textHash')) {
						Logger.warn('System', 'IndexedDB 缺少 textHash 索引，无法按原文清除缓存');
						return resolve(0);
					}

					const index = store.index('textHash');
					let deletedCount = 0;

					const deletePromises = textHashes.map(hash => {
						return new Promise(res => {
							const req = index.getAllKeys(IDBKeyRange.only(hash));
							req.onsuccess = (e) => {
								const primaryKeys = e.target.result;
								primaryKeys.forEach(pk => {
									store.delete(pk);
									deletedCount++;
								});
								res();
							};
							req.onerror = () => res();
						});
					});

					Promise.all(deletePromises).then(() => {
						transaction.oncomplete = () => {
							document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
							resolve(deletedCount);
						};
					});
				} catch (e) {
					Logger.error('System', 'IndexedDB deleteByTextHashes 事务创建失败', e);
					this.db = null;
					resolve(0);
				}
			});
		},

		async clear() {
			if (!this.db) return;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readwrite');
					const store = transaction.objectStore(this.storeName);
					store.clear();
					transaction.oncomplete = () => {
						document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
						resolve();
					};
					transaction.onerror = () => resolve();
				} catch (e) {
					Logger.error('System', 'IndexedDB clear 事务创建失败', e);
					this.db = null;
					resolve();
				}
			});
		},

		async count() {
			if (!this.db) return 0;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readonly');
					const store = transaction.objectStore(this.storeName);
					const req = store.count();
					req.onsuccess = () => resolve(req.result);
					req.onerror = () => resolve(0);
				} catch (e) {
					Logger.error('System', 'IndexedDB count 事务创建失败', e);
					this.db = null;
					resolve(0);
				}
			});
		},

		async cleanup(maxItems, expireTime) {
			if (!this.db) return 0;
			return new Promise((resolve) => {
				try {
					const transaction = this.db.transaction([this.storeName], 'readwrite');
					const store = transaction.objectStore(this.storeName);
					
					// 如果索引不存在，直接返回 0
					if (!store.indexNames.contains('timestamp')) {
						return resolve(0);
					}
					
					const index = store.index('timestamp');
					let deletedCount = 0;

					// 删除过期数据
					const range = IDBKeyRange.upperBound(expireTime);
					const req = index.openCursor(range);
					req.onsuccess = (e) => {
						const cursor = e.target.result;
						if (cursor) {
							cursor.delete();
							deletedCount++;
							cursor.continue();
						} else {
							// 检查是否超出最大条目数
							const countReq = store.count();
							countReq.onsuccess = () => {
								const total = countReq.result;
								if (total > maxItems) {
									const toDelete = total - maxItems;
									let deletedLRU = 0;
									const lruReq = index.openCursor();
									lruReq.onsuccess = (ev) => {
										const lruCursor = ev.target.result;
										if (lruCursor && deletedLRU < toDelete) {
											lruCursor.delete();
											deletedLRU++;
											deletedCount++;
											lruCursor.continue();
										} else {
											resolve(deletedCount);
										}
									};
								} else {
									resolve(deletedCount);
								}
							};
						}
					};
					req.onerror = () => resolve(deletedCount);
				} catch (e) {
					Logger.error('System', 'IndexedDB cleanup 事务创建失败', e);
					this.db = null;
					resolve(0);
				}
			});
		},

		async autoCleanup() {
			const isEnabled = GM_getValue('ao3_cache_auto_cleanup_enabled', true);
			if (!isEnabled) return;

			const lockKey = 'ao3_cache_cleanup_lock';
			const now = Date.now();
			const lock = GM_getValue(lockKey, 0);
			if (now - lock < 60000) return;
			GM_setValue(lockKey, now);

			const lastCheck = GM_getValue('ao3_cache_last_check_time', 0);
			if (now - lastCheck < 24 * 60 * 60 * 1000) return;

			let maxItems = parseInt(GM_getValue('ao3_cache_max_items', 100000), 10);
			let maxDays = parseInt(GM_getValue('ao3_cache_max_days', 30), 10);

			if (isNaN(maxItems) || maxItems <= 0) maxItems = 100000;
			if (isNaN(maxDays) || maxDays <= 0) maxDays = 30;

			const expireTime = now - (maxDays * 24 * 60 * 60 * 1000);

			const run = async () => {
				const deletedCount = await this.cleanup(maxItems, expireTime);
				if (deletedCount > 0) {
					Logger.info('System', `自动清理了 ${deletedCount} 条过期/超量的翻译缓存`);
					document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
					GM_setValue('ao3_cache_last_cleanup_time', Date.now());
				}
				GM_setValue('ao3_cache_last_check_time', Date.now());
			};

			if (window.requestIdleCallback) {
				window.requestIdleCallback(() => run());
			} else {
				setTimeout(run, 5000);
			}
		}
	};

	/**
	 * 语言检测与决策管理器
	 */
	const LanguageDetectionManager = {
		/**
		 * 提取容器前 400 字符用于检测
		 */
		extractText(container, rule) {
			if (!container) return '';
			if (rule.isTags) {
				const tags = Array.from(container.querySelectorAll('a.tag')).map(a => a.textContent.trim());
				return tags.join(' ').substring(0, 400);
			}
			if (rule.isTitle) {
				const clone = container.cloneNode(true);
				clone.querySelectorAll('a').forEach(a => {
					if (a.textContent.match(/^(?:Chapter|第)\s*\d+\s*(?:章)?$/i)) a.remove();
				});
				return clone.textContent.trim().substring(0, 400);
			}
			return container.textContent.trim().substring(0, 400);
		},

		/**
		 * 核心决策逻辑
		 * @param {HTMLElement} container - 目标容器
		 * @param {Object} rule - 翻译规则
		 * @param {String} mode - 'full_page' 或 'unit'
		 * @returns {Promise<{detectedLang: string, shouldSkip: boolean}>}
		 */
		async processContainer(container, rule, mode) {
			const userSelectedFromLang = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			const targetLang = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);

			let detectedLang = 'auto';
			let shouldSkip = false;

			if (userSelectedFromLang === 'script_auto') {
				const textToDetect = this.extractText(container, rule);
				if (textToDetect) {
					detectedLang = await LanguageDetector.detect(textToDetect);
					if (!detectedLang || detectedLang === 'und' || detectedLang === 'unknown') {
						detectedLang = 'auto';
					}
				}
			} else if (userSelectedFromLang !== 'auto') {
				detectedLang = userSelectedFromLang;
			}

			if (mode === 'full_page' && detectedLang !== 'auto' && detectedLang === targetLang) {
				shouldSkip = true;
			}

			return { detectedLang, shouldSkip };
		}
	};

	/**
	 * 文件保存函数
	 */
	async function saveFile(content, filename, mimeType) {
		const finalMimeType = mimeType.includes('charset') ? mimeType : `${mimeType};charset=utf-8`;
		const blob = new Blob([content], { type: finalMimeType });
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		const downloadDataUrl = () => {
			const reader = new FileReader();
			reader.onload = function () {
				const url = reader.result;
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				a.target = '_blank';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			};
			reader.readAsDataURL(blob);
		};
		const downloadBlob = () => {
			try {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				setTimeout(() => URL.revokeObjectURL(url), 100);
			} catch (e) {
				downloadDataUrl();
			}
		};
		if (isIOS) {
			if (navigator.canShare && navigator.share) {
				try {
					const file = new File([blob], filename, { type: finalMimeType });
					if (navigator.canShare({ files: [file] })) {
						await navigator.share({
							files: [file],
							title: filename
						});
						return;
					}
				} catch (e) {
					if (e.name !== 'AbortError') console.warn(e);
				}
			}
			if (typeof GM_download === 'function') {
				const url = URL.createObjectURL(blob);
				GM_download({
					url: url,
					name: filename,
					saveAs: true,
					onload: () => URL.revokeObjectURL(url),
					onerror: () => {
						URL.revokeObjectURL(url);
						downloadBlob();
					}
				});
				return;
			}
			downloadBlob();
			return;
		}
		downloadBlob();
	}

	/**
	 * 日志管理系统
	 */
	const Logger = {
		config: {
			level: GM_getValue('ao3_log_level', 'INFO'),
			autoClearDays: GM_getValue('ao3_log_auto_clear', 3),
			maxHistory: 2000,
			maxPersist: 500
		},
		levels: { 'ALL': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3, 'OFF': 99 },
		history:[],
		saveTimer: null,

		init() {
			this.history = GM_getValue('ao3_log_history',[]);
			this.cleanOldLogs();
		},

		cleanOldLogs() {
			const now = Date.now();
			const cutoff = now - (this.config.autoClearDays * 24 * 60 * 60 * 1000);
			const initialLength = this.history.length;
            
            // 1. 先按时间过期清理
			this.history = this.history.filter(entry => entry.timestampMs >= cutoff);
            
            // 2. 如果剩余日志依然超过持久化上限，执行优先级清理
            if (this.history.length > this.config.maxPersist) {
                this.history = this._prune(this.history, this.config.maxPersist);
            }

			if (this.history.length !== initialLength) {
				GM_setValue('ao3_log_history', this.history);
			}
		},

		setLevel(level) {
			this.config.level = level;
			GM_setValue('ao3_log_level', level);
		},

		setAutoClear(days) {
			this.config.autoClearDays = days;
			GM_setValue('ao3_log_auto_clear', days);
			this.cleanOldLogs();
		},

		// 生成唯一的 Trace ID 用于串联请求链路
		generateTraceId() {
			return Math.random().toString(36).substring(2, 10).toUpperCase();
		},

		_sanitize(data) {
			if (!data) return data;
			if (typeof data !== 'object') {
				if (typeof data === 'string' && data.length > 150) return data.substring(0, 150) + '... [TRUNCATED]';
				return data;
			}

			try {
				const cleanData = JSON.parse(JSON.stringify(data));
				// 隐私凭证脱敏
				const sensitiveKeys =['apikey', 'api_key', 'token', 'auth', 'authorization', 'x-api-key', 'password', 'email'];
				// 翻译文本脱敏
				const textKeys =['text', 'content', 'originalhtml', 'translatedtext', 'paragraphs', 'messages', 'prompt', 'source', 'target', 'system_prompt', 'user_prompt'];

				const mask = (obj, depth = 0) => {
					if (depth > 5) return;
					for (const key in obj) {
						if (Object.prototype.hasOwnProperty.call(obj, key)) {
							const lowerKey = key.toLowerCase();
							if (typeof obj[key] === 'object' && obj[key] !== null) {
								mask(obj[key], depth + 1);
							} else if (sensitiveKeys.some(k => lowerKey.includes(k))) {
								obj[key] = '[MASKED]';
							} else if (textKeys.includes(lowerKey)) {
								obj[key] = '[TEXT_CONTENT_MASKED]';
							} else if (key === 'url') {
								const urlStr = String(obj[key]);
								if (!urlStr.includes('microsoft') && !urlStr.includes('googleapis') && !urlStr.includes('qq.com') && !urlStr.includes('baidu.com')) {
									obj[key] = 'Custom URL [MASKED]';
								}
							} else if (typeof obj[key] === 'string' && obj[key].length > 150) {
								obj[key] = obj[key].substring(0, 150) + '[TRUNCATED]';
							}
						}
					}
				};
				mask(cleanData);
				return cleanData;
			} catch (e) {
				return '[Data Sanitization Failed]';
			}
		},

		/**
		 * 核心清理算法：优先清理最早的低级别日志 (WARN 以下)
		 * @param {Array} list - 待处理的日志数组
		 * @param {number} targetSize - 目标保留条数
		 */
		_prune(list, targetSize) {
			if (list.length <= targetSize) return list;
			
			let toRemoveCount = list.length - targetSize;
			const warnWeight = this.levels['WARN']; // 权重为 2

			// 1. 找出所有权重低于 WARN 的日志索引 (INFO=1, ALL=0)
			const lowPriorityIndices = [];
			for (let i = 0; i < list.length; i++) {
				if ((this.levels[list[i].level] || 0) < warnWeight) {
					lowPriorityIndices.push(i);
				}
			}

			// 2. 决定要删除的索引集合
			const indicesToDelete = new Set();
			
			// 优先从低级别日志中按时间顺序（最早的）取
			const removeFromLow = Math.min(toRemoveCount, lowPriorityIndices.length);
			for (let i = 0; i < removeFromLow; i++) {
				indicesToDelete.add(lowPriorityIndices[i]);
			}
			
			toRemoveCount -= removeFromLow;

			// 3. 如果低级别日志删光了还没达到目标，则按时间顺序删除剩余的最早日志（无论级别）
			if (toRemoveCount > 0) {
				for (let i = 0; i < list.length && toRemoveCount > 0; i++) {
					if (!indicesToDelete.has(i)) {
						indicesToDelete.add(i);
						toRemoveCount--;
					}
				}
			}

			// 4. 返回过滤后的数组
			return list.filter((_, index) => !indicesToDelete.has(index));
		},

		_record(level, module, message, data, traceId = null, reasoning = null) {
			const currentWeight = this.levels[this.config.level] ?? 2;
			const msgWeight = this.levels[level] ?? 1;

			if (msgWeight < currentWeight) return;

			const now = Date.now();
			const baseTime = new Date(now).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
			const ms = String(now % 1000).padStart(3, '0');
			const timestamp = `${baseTime}.${ms}`;

			const logEntry = { 
				timestampMs: now, 
				timestamp, 
				level, 
				module, 
				traceId, 
				message, 
				data: this._sanitize(data),
				reasoning: reasoning
			};

			this.history.push(logEntry);
			if (this.history.length > this.config.maxHistory) {
				this.history = this._prune(this.history, this.config.maxHistory);
			}

			this._scheduleSave();

			document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.LOG_ADDED, { detail: logEntry }));

			if (currentWeight !== 99) {
				const traceStr = traceId ? `[${traceId}] ` : '';
				const prefix = `[${timestamp}] %c[${module}] ${traceStr}`;
				let style = 'font-weight: bold;';
				if (level === 'INFO') style += 'color: #2196F3;';
				else if (level === 'WARN') style += 'color: #FF9800;';
				else if (level === 'ERROR') style += 'color: #F44336;';

				if (data) console.log(prefix, style, message, logEntry.data);
				else console.log(prefix, style, message);

				if (reasoning) console.log('%c[Reasoning]\n' + reasoning, 'color: #9c27b0;');
			}
		},

		_scheduleSave() {
			if (this.saveTimer) clearTimeout(this.saveTimer);
			this.saveTimer = setTimeout(() => {
				const persistData = this._prune(this.history, this.config.maxPersist).map(entry => {
					const copy = { ...entry };
					delete copy.reasoning;
					return copy;
				});
				GM_setValue('ao3_log_history', persistData);
			}, 2000);
		},

		info(module, message, data = null, traceId = null, reasoning = null) { this._record('INFO', module, message, data, traceId, reasoning); },
		warn(module, message, data = null, traceId = null, reasoning = null) { this._record('WARN', module, message, data, traceId, reasoning); },
		error(module, message, error = null, traceId = null, reasoning = null) {
			let errorData = error;
			if (error instanceof Error) {
				errorData = { message: error.message, stack: error.stack, type: error.type };
			}
			this._record('ERROR', module, message, errorData, traceId, reasoning);
		},

		clear() {
			this.history =[];
			GM_setValue('ao3_log_history', this.history);
		},

		export() {
			const exportData = this.history.map(entry => {
				const copy = { ...entry };
				if (copy.reasoning) copy.reasoning = '[REASONING_CONTENT_MASKED]';
				return copy;
			});
			const jsonString = JSON.stringify(exportData, null, 2);
			const dateStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })
				.replace(/:/g, '-')
				.replace(' ', '_');
			saveFile(jsonString, `AO3-Translator-Log-${dateStr}.log`, 'application/json;charset=utf-8');
		}
	};

	/**
	 * 统一网络请求拦截器
	 */
	function safeRequest(options, traceId = null) {
		const reqTraceId = traceId || Logger.generateTraceId();
		const startTime = Date.now();

		// 辅助函数：将原生 Headers 字符串解析为对象
		const parseHeaders = (rawHeaders) => {
			if (!rawHeaders) return {};
			const headers = {};
			rawHeaders.trim().split(/[\r\n]+/).forEach(line => {
				const index = line.indexOf(':');
				if (index > 0) {
					const key = line.substring(0, index).trim().toLowerCase();
					const value = line.substring(index + 1).trim();
					headers[key] = value;
				}
			});
			return headers;
		};

		// 记录请求发起
		Logger.info('Network', `[REQ] ${options.method || 'GET'} ${options.url}`, {
			requestHeaders: options.headers,
			requestBody: options.data ? '[PAYLOAD_MASKED]' : null
		}, reqTraceId);

		const originalOnLoad = options.onload;
		const originalOnError = options.onerror;
		const originalOnTimeout = options.ontimeout;

		options.onload = (res) => {
			const duration = Date.now() - startTime;
			// 记录请求响应 (Headers 结构化)
			Logger.info('Network', `[RES] ${res.status} ${res.statusText} (${duration}ms)`, {
				responseHeaders: parseHeaders(res.responseHeaders),
				responseBody: res.responseText ? '[PAYLOAD_MASKED]' : null
			}, reqTraceId);

			if (originalOnLoad) originalOnLoad(res);
		};

		options.onerror = (err) => {
			const duration = Date.now() - startTime;
			Logger.error('Network', `[ERR] Network Error (${duration}ms)`, err, reqTraceId);
			if (originalOnError) originalOnError(err);
		};

		options.ontimeout = () => {
			const duration = Date.now() - startTime;
			Logger.error('Network', `[TIMEOUT] Request Timeout (${duration}ms)`, null, reqTraceId);
			if (originalOnTimeout) originalOnTimeout();
		};

		return GM_xmlhttpRequest(options);
	}

	/**************************************************************************
	 * 作品导出与生成引擎
	 **************************************************************************/

	/**
	 * 模板管理器
	 */
	class ExportTemplateStore {
		static DEFAULT_TEMPLATES = {
			html:[{
				id: 'default_html', name: '默认', isProtected: true,
				css: `
/* 1. 全局基础设置 */
* { font-style: normal !important; } 
body { font-family: "Georgia", "Times New Roman", "Microsoft YaHei", serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6em; color: #333; background: #f9f9f9; text-align: justify; word-wrap: break-word; } 
h1, h2, h3, h4, h5, h6, b, strong { font-weight: bold !important; } 
.text-center, .text-center * { text-align: center !important; } 
/* 2. 页面容器与分页 */
.content-wrapper { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); } 
.page-break { margin-top: 4em; padding-top: 2em; border-top: 1px solid #eee; } 
/* 3. 扉页 (Title Page) */
.title-page { padding: 4em 2em; text-align: center; } 
.title-page h1 { font-size: 2.0em !important; line-height: 1.3; } 
.title-page h2 { font-size: 1.3em !important; margin-top: 2em; } 
/* 4. 作品信息页 (Imprint Page) */
.imprint-page { font-size: 0.9em; line-height: 1.6em; background: #f4f4f4; padding: 2em; border-radius: 4px; } 
.imprint-page h2 { font-size: 1.8em !important; margin-bottom: 1.5em !important; } 
.imprint-page p { margin: 0.5em 0; padding: 0; } 
.meta-label { font-weight: bold; font-size: 1.05em; } 
/* 5. 目录页 (Table of Contents) */
.toc-page { padding: 2em 0; } 
.toc-list { list-style: none; padding: 0; margin: 0; } 
.toc-item { margin-bottom: 1.0em; line-height: 1.8em; } 
.toc-item a { text-decoration: none; color: #333; display: block; transition: color 0.2s; font-size: 1.25em; font-weight: 500; } 
.toc-item a:hover { color: #000; text-decoration: none; } 
/* 6. 章节与正文 (Chapters & Text) */
.foreword-page h2, .chapter-page h2, .toc-page h2 { font-size: 1.8em !important; margin-bottom: 2em !important; } 
.foreword-section h3 { font-size: 1.3em !important; margin-bottom: 0.5em !important; } 
.chapter-meta { font-size: 0.95em; margin-bottom: 2.5em; padding: 1em; border-left: 3px solid #ccc; background: #f9f9f9; } 
.meta-heading { font-size: 1.2em; font-weight: bold; margin-bottom: 0.4em; } 
.chapter-end-notes { margin-top: 3em; } 
.chapter-text p { text-indent: 2em; margin: 0 0 1.2em 0; line-height: 1.6em; } 
.chapter-text > p:first-of-type { text-indent: 0; } 
.drop-cap { font-size: 3em; float: left; margin-top: -0.1em; margin-right: 0.1em; line-height: 1; color: #555; } 
/* 7. 双语对照显示控制 */
.ao3-original-content { display: block; color: inherit; font-weight: inherit; } 
.ao3-translated-content { display: block; margin-top: 1.2em; color: inherit; font-weight: inherit; }
.chapter-text > p:first-of-type .ao3-translated-content { text-indent: 2em; }
.title-page h1 .ao3-translated-content, .chapter-page h2 .ao3-translated-content { margin-top: 1.2em; font-size: 0.75em; color: #555; display: block; font-weight: normal !important; } 
/* 8. 结尾与关于页 */
.the-end { margin-top: 4em; margin-bottom: 2em; } 
.about-page { padding-top: 2em; } 
/* 9. 移动端适配 */
@media (max-width: 768px) { body { padding: 10px; text-align: left; } .content-wrapper { padding: 20px 15px; } .title-page { padding: 2em 1em; } .chapter-text p { text-align: left; } .drop-cap { font-size: 2.5em; margin-top: 0; } .page-break { margin-top: 2em; padding-top: 1em; } .imprint-page { padding: 1.5em; } }`
			}],
			epub:[{
				id: 'default_epub', name: '默认', isProtected: true,
				css: `
/* 1. 全局基础设置 */
* { font-style: normal !important; } 
body { font-family: "Georgia", "Times New Roman", "Microsoft YaHei", serif; line-height: 1.6em; text-align: justify; color: #333; word-wrap: break-word; } 
h1, h2, h3, h4, h5, h6, b, strong { font-weight: bold !important; } 
.text-center, .text-center * { text-align: center !important; } 
/* 2. 页面容器与分页 */
.page-break { page-break-before: always; } 
/* 3. 扉页 (Title Page) */
.title-page { margin-top: 10%; text-align: center; } 
.title-page h1 { font-size: 2.0em !important; padding-bottom: 0.2em; margin-bottom: 0.2em; line-height: 1.3; } 
.title-page h2 { font-size: 1.3em !important; margin-top: 2em; } 
/* 4. 作品信息页 (Imprint Page) */
.imprint-page { font-size: 0.9em; line-height: 1.6em; margin-top: 2em; background: #f4f4f4; padding: 2em; border-radius: 4px; } 
.imprint-page h2 { font-size: 1.8em !important; margin-bottom: 1.5em !important; } 
.imprint-page p { margin: 0.5em 0; padding: 0; } 
.meta-label { font-weight: bold; font-size: 1.05em; } 
/* 5. 目录页 (Table of Contents) */
.toc-page { padding: 2em 0; } 
.toc-list { list-style: none; padding: 0; margin: 0; } 
.toc-item { margin-bottom: 1.0em; line-height: 1.8em; } 
.toc-item a { text-decoration: none; color: #333; display: block; transition: color 0.2s; font-size: 1.25em; font-weight: 500; } 
.toc-item a:hover { color: #000; text-decoration: none; } 
/* 6. 章节与正文 (Chapters & Text) */
.foreword-page h2, .chapter-page h2, .toc-page h2 { font-size: 1.8em !important; margin-bottom: 2em !important; } 
.foreword-section h3 { font-size: 1.3em !important; margin-bottom: 0.5em !important; } 
.chapter-meta { font-size: 0.95em; margin-bottom: 2.5em; padding: 1em; border-left: 3px solid #ccc; background: #f9f9f9; } 
.meta-heading { font-size: 1.2em; font-weight: bold; margin-bottom: 0.4em; } 
.chapter-end-notes { margin-top: 3em; } 
.chapter-text p { text-indent: 2em; margin: 0 0 1.2em 0; line-height: 1.6em; } 
.chapter-text > p:first-of-type { text-indent: 0; } 
.drop-cap { font-size: 3em; float: left; margin-top: -0.1em; margin-right: 0.1em; line-height: 1; color: #555; } 
/* 7. 双语对照显示控制 */
.ao3-original-content { display: block; color: inherit; font-weight: inherit; } 
.ao3-translated-content { display: block; margin-top: 1.2em; color: inherit; font-weight: inherit; }
.chapter-text > p:first-of-type .ao3-translated-content { text-indent: 2em; }
.title-page h1 .ao3-translated-content, .chapter-page h2 .ao3-translated-content { margin-top: 1.2em; font-size: 0.75em; color: #555; display: block; font-weight: normal !important; } 
/* 8. 结尾与关于页 */
.the-end { margin-top: 4em; margin-bottom: 2em; } 
.about-page { margin-top: 2em; } 
/* 9. 移动端适配 */
@media (max-width: 768px) { body { text-align: left; } .chapter-text p { text-align: left; } .drop-cap { font-size: 2.5em; margin-top: 0; } .imprint-page { padding: 1.5em; } }`
			}],
			pdf:[{
				id: 'default_pdf', name: '默认', isProtected: true,
				css: `
/* 1. 全局基础设置 */
* { font-style: normal !important; } 
body { font-family: "Georgia", "Times New Roman", "Microsoft YaHei", serif; line-height: 1.6em; color: #333; text-align: justify; word-wrap: break-word; } 
h1, h2, h3, h4, h5, h6, b, strong { font-weight: bold !important; } 
.text-center, .text-center * { text-align: center !important; } 
/* 2. 页面容器与分页控制 */
.page-break { page-break-before: always; }
li, .chapter-meta, .imprint-page, .about-page, .the-end { page-break-inside: avoid; }
h1, h2, h3, h4, h5, h6, .meta-heading { page-break-after: avoid; } 
/* 3. 扉页 (Title Page) */
.title-page { padding-top: 4em; text-align: center; } 
.title-page h1 { font-size: 2.0em !important; padding-bottom: 15px; margin-bottom: 15px; line-height: 1.3; } 
.title-page h2 { font-size: 1.3em !important; margin-top: 2em; } 
/* 4. 作品信息页 (Imprint Page) */
.imprint-page { font-size: 0.9em; line-height: 1.6em; background: #f4f4f4; padding: 2em; border-radius: 4px; } 
.imprint-page h2 { font-size: 1.8em !important; margin-bottom: 1.5em !important; } 
.imprint-page p { margin: 0.5em 0; padding: 0; } 
.meta-label { font-weight: bold; font-size: 1.05em; } 
/* 5. 目录页 (Table of Contents) */
.toc-page { padding: 2em 0; } 
.toc-list { list-style: none; padding: 0; margin: 0; } 
.toc-item { margin-bottom: 1.0em; line-height: 1.8em; } 
.toc-item a { text-decoration: none; color: #333; display: block; transition: color 0.2s; font-size: 1.25em; font-weight: 500; } 
.toc-item a:hover { color: #000; text-decoration: none; } 
/* 6. 章节与正文 (Chapters & Text) */
.foreword-page h2, .chapter-page h2, .toc-page h2 { font-size: 1.8em !important; margin-bottom: 2em !important; } 
.foreword-section h3 { font-size: 1.3em !important; margin-bottom: 0.5em !important; } 
.chapter-meta { font-size: 0.95em; margin-bottom: 2.5em; padding: 1em; border-left: 3px solid #ccc; background: #f9f9f9; } 
.meta-heading { font-size: 1.2em; font-weight: bold; margin-bottom: 0.4em; } 
.chapter-end-notes { margin-top: 3em; } 
.chapter-text p { text-indent: 2em; margin: 0 0 1.2em 0; line-height: 1.6em; } 
.chapter-text > p:first-of-type { text-indent: 0; } 
.drop-cap { font-size: 3em; float: left; margin-top: -0.1em; margin-right: 0.1em; line-height: 1; color: #555; } 
/* 7. 双语对照显示控制 */
.ao3-original-content { display: block; color: inherit; font-weight: inherit; } 
.ao3-translated-content { display: block; margin-top: 1.2em; color: inherit; font-weight: inherit; }
.chapter-text > p:first-of-type .ao3-translated-content { text-indent: 2em; }
.title-page h1 .ao3-translated-content, .chapter-page h2 .ao3-translated-content { margin-top: 1.2em; font-size: 0.75em; color: #555; display: block; font-weight: normal !important; } 
/* 8. 结尾与关于页 */
.the-end { margin-top: 4em; margin-bottom: 2em; } 
.about-page { padding-top: 2em; }`
			}]
		};

		static init() {
			let templates = GM_getValue('ao3_export_templates');
			if (!templates || !templates.epub) {
				templates = JSON.parse(JSON.stringify(this.DEFAULT_TEMPLATES));
			} else {
				['html', 'epub', 'pdf'].forEach(format => {
					if (!templates[format]) templates[format] = [];
					const defaultTpl = this.DEFAULT_TEMPLATES[format][0];
					const existingIndex = templates[format].findIndex(t => t.id === defaultTpl.id);
					if (existingIndex !== -1) {
						templates[format][existingIndex] = JSON.parse(JSON.stringify(defaultTpl));
					} else {
						templates[format].unshift(JSON.parse(JSON.stringify(defaultTpl)));
					}
				});
			}
			GM_setValue('ao3_export_templates', templates);

			if (!GM_getValue('ao3_export_selected_templates')) {
				GM_setValue('ao3_export_selected_templates', { epub: 'default_epub', pdf: 'default_pdf', html: 'default_html' });
			}
		}

		static getTemplates(format) {
			return GM_getValue('ao3_export_templates', this.DEFAULT_TEMPLATES)[format] ||[];
		}

		static getTemplate(format, id) {
			const templates = this.getTemplates(format);
			return templates.find(t => t.id === id) || templates[0];
		}

		static saveTemplate(format, template) {
			const allTemplates = GM_getValue('ao3_export_templates', this.DEFAULT_TEMPLATES);
			const formatTemplates = allTemplates[format] ||[];
			const index = formatTemplates.findIndex(t => t.id === template.id);
			if (index !== -1) formatTemplates[index] = template;
			else formatTemplates.push(template);
			allTemplates[format] = formatTemplates;
			GM_setValue('ao3_export_templates', allTemplates);
		}

		static deleteTemplate(format, id) {
			const allTemplates = GM_getValue('ao3_export_templates', this.DEFAULT_TEMPLATES);
			let formatTemplates = allTemplates[format] ||[];
			formatTemplates = formatTemplates.filter(t => t.id !== id);
			if (formatTemplates.length === 0) {
				formatTemplates.push(JSON.parse(JSON.stringify(this.DEFAULT_TEMPLATES[format][0])));
			}
			allTemplates[format] = formatTemplates;
			GM_setValue('ao3_export_templates', allTemplates);
		}
	}

	/**
	 * DOM 解析与清洗器
	 */
	class AO3DOMParser {
		static safeExtractText(selector, context = document) {
			const elements = context.querySelectorAll(selector);
			if (elements.length === 0) return 'N/A';
			return Array.from(elements).map(el => {
				if (el.tagName === 'A' && el.href?.includes('/tags/')) {
					try {
						let tagPart = el.href.split('/tags/')[1].split('/')[0];
						tagPart = decodeURIComponent(tagPart);
						return tagPart.replace(/\*a\*/g, '&').replace(/\*s\*/g, '/').replace(/\*d\*/g, '.').replace(/\*h\*/g, '#').replace(/\*q\*/g, '?');
					} catch (e) {}
				}
				const orig = el.querySelector('.ao3-tag-original, .ao3-original-content');
				return orig ? orig.textContent.trim() : el.textContent.trim();
			}).join(', ');
		}

		static cleanDOM(node) {
			const clone = node.cloneNode(true);
			const displayMode = GM_getValue('translation_display_mode', 'bilingual');
			
			if (displayMode === 'translation_only') {
				clone.querySelectorAll('.ao3-original-content, .ao3-original-title, .ao3-tag-original').forEach(el => el.remove());
				clone.querySelectorAll('.ao3-translated-content, .ao3-translated-title, .ao3-tag-translation').forEach(el => {
					el.replaceWith(...el.childNodes);
				});
			} else {
				clone.querySelectorAll('.ao3-text-block').forEach(block => {
					if (block.querySelector('.ao3-translated-content')) {
						let next = block.nextSibling;
						let brCount = 0;
						let brsToRemove =[];
						while (next && next.nodeType === Node.ELEMENT_NODE && next.tagName === 'BR') {
							brCount++;
							brsToRemove.push(next);
							next = next.nextSibling;
						}
						if (brCount > 0) {
							brsToRemove.forEach(br => br.remove());
							const transContent = block.querySelector('.ao3-translated-content');
							if (transContent) {
								transContent.style.marginBottom = brCount === 1 ? '1.5em' : '0';
							}
						}
					}
				});
			}
			
			const selectorsToRemove =[
				'.translate-me-ao3-wrapper', '.retry-translation-button', 
				'.translated-by-ao3-translator-error', '.ao3-title-translatable-temp',
				'a.bookmark_form_placement_open', 'form.button_to', 
				'.work.navigation.actions', '.landmark.heading'
			];
			clone.querySelectorAll(selectorsToRemove.join(', ')).forEach(el => el.remove());
			
			const stripDataAttributes = (el) => {
				Array.from(el.attributes).forEach(attr => {
					if (/^data-(translation|detected|dom|br|indent)-/.test(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			};
			stripDataAttributes(clone);
			clone.querySelectorAll('*').forEach(stripDataAttributes);

			return clone;
		}

		static getCleanTitle(titleNode) {
			if (!titleNode) return '';
			const displayMode = GM_getValue('translation_display_mode', 'bilingual');
			const originalSpan = titleNode.querySelector('.ao3-original-title');
			const translatedSpan = titleNode.querySelector('.ao3-translated-title');

			if (translatedSpan && originalSpan) {
				if (displayMode === 'translation_only') {
					return translatedSpan.textContent.trim();
				} else {
					return `<span class="ao3-original-content">${originalSpan.textContent.trim()}</span><span class="ao3-translated-content">${translatedSpan.textContent.trim()}</span>`;
				}
			}
			const clone = titleNode.cloneNode(true);
			clone.querySelectorAll('.ao3-title-translatable-temp').forEach(el => el.remove());
			return clone.textContent.trim();
		}

		static extractMetadata() {
			const titleNode = document.querySelector('.preface.group h2.title.heading');
			let title = this.getCleanTitle(titleNode) || 'Unknown Title';
			
			const authorNodes = document.querySelectorAll('.preface.group h3.byline.heading a[rel="author"]');
			const author = Array.from(authorNodes).map(a => {
				const orig = a.querySelector('.ao3-tag-original, .ao3-original-content');
				return orig ? orig.textContent.trim() : a.textContent.trim();
			}).join(', ') || 'Unknown Author';
			
			const getSeries = () => {
				const seriesSpan = document.querySelector('dd.series span.position');
				if (!seriesSpan) return 'N/A';
				const aTag = seriesSpan.querySelector('a');
				if (!aTag) return seriesSpan.textContent.trim();

				const origSpan = aTag.querySelector('.ao3-tag-original, .ao3-original-content');
				const seriesName = origSpan ? origSpan.textContent.trim() : aTag.textContent.trim();

				const clone = seriesSpan.cloneNode(true);
				const linkInClone = clone.querySelector('a');
				if (linkInClone) clone.removeChild(linkInClone); 
				
				const numMatch = clone.textContent.match(/\d+/);
				return numMatch ? `Part ${numMatch[0]} of ${seriesName}` : seriesName;
			};

			const getRawStat = (className) => {
				const dd = document.querySelector(`dd.${className}`);
				if (!dd) return 'N/A';
				const orig = dd.querySelector('.ao3-tag-original, .ao3-original-content');
				return orig ? orig.textContent.trim() : dd.textContent.trim();
			};

			const rawMetadata = {
				url: window.location.href.split('?')[0].split('#')[0],
				rating: this.safeExtractText('dd.rating.tags a.tag'),
				warnings: this.safeExtractText('dd.warning.tags a.tag'),
				category: this.safeExtractText('dd.category.tags a.tag'),
				fandoms: this.safeExtractText('dd.fandom.tags a.tag'),
				relationships: this.safeExtractText('dd.relationship.tags a.tag'),
				characters: this.safeExtractText('dd.character.tags a.tag'),
				additionalTags: this.safeExtractText('dd.freeform.tags a.tag'),
				series: getSeries(),
				collections: this.safeExtractText('dd.collections a'),
				language: getRawStat('language'),
				published: getRawStat('published'),
				updated: getRawStat('status') !== 'N/A' ? getRawStat('status') : getRawStat('published'),
				words: getRawStat('words'),
				chapters: getRawStat('chapters')
			};

			const summaryNode = document.querySelector('.preface.group .summary blockquote.userstuff');
			const summary = summaryNode ? this.cleanDOM(summaryNode).innerHTML : '';

			const notesNode = document.querySelector('.preface.group .notes blockquote.userstuff');
			const notes = notesNode ? this.cleanDOM(notesNode).innerHTML : '';
			
			return { title, author, rawMetadata, summary, notes, language: 'zh-CN' };
		}

		static extractChapters() {
			const chapters =[];
			const chapterNodes = document.querySelectorAll('#chapters > .chapter');
			
			if (chapterNodes.length > 0) {
				chapterNodes.forEach((node, index) => {
					let title = `Chapter ${index + 1}`;
					const titleNode = node.querySelector('.chapter.preface.group h3.title');
					if (titleNode) title = this.getCleanTitle(titleNode) || title;
					
					const summaryNode = node.querySelector('.chapter.preface.group .summary blockquote.userstuff');
					const summary = summaryNode ? this.cleanDOM(summaryNode).innerHTML : '';

					const prefaces = node.querySelectorAll('.chapter.preface.group');
					const startNotesNode = prefaces.length > 0 ? prefaces[0].querySelector('.notes.module:not(.end) blockquote.userstuff') : null;
					const startNotes = startNotesNode ? this.cleanDOM(startNotesNode).innerHTML : '';

					const contentNode = node.querySelector('.userstuff.module[role="article"]');
					const content = contentNode ? this.cleanDOM(contentNode).innerHTML : '';

					const endNotesNode = node.querySelector('.end.notes.module blockquote.userstuff');
					const endNotes = endNotesNode ? this.cleanDOM(endNotesNode).innerHTML : '';

					chapters.push({ title, summary, startNotes, content, endNotes });
				});
			} else {
				const contentNode = document.querySelector('#chapters > .userstuff');
				const content = contentNode ? this.cleanDOM(contentNode).innerHTML : '';
				chapters.push({ title: '', summary: '', startNotes: '', content, endNotes: '' });
			}
			return chapters;
		}
	}

	/**
	 * 文档生成器
	 */
	class DocumentBuilder {
		static fixXHTML(html) {
			if (!html) return '';
			let fixed = html.replace(/<br\s*\/?>/gi, '<br/>')
							.replace(/<hr\s*\/?>/gi, '<hr/>')
							.replace(/<img([^>]+)>/gi, (match, p1) => p1.trim().endsWith('/') ? match : `<img ${p1} />`);
			fixed = fixed.replace(/&(?!(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);)/g, '&amp;');
			return fixed;
		}

		static escapeXML(str) {
			if (!str) return '';
			return str.replace(/&/g, '&amp;')
					  .replace(/</g, '&lt;')
					  .replace(/>/g, '&gt;')
					  .replace(/"/g, '&quot;')
					  .replace(/'/g, '&apos;');
		}

		static applyManualDropCap(htmlString) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = htmlString;
			const firstP = tempDiv.querySelector('p');
			if (!firstP) return htmlString;

			const walker = document.createTreeWalker(firstP, NodeFilter.SHOW_TEXT, null, false);
			let firstTextNode = null;
			let node;
			while ((node = walker.nextNode())) {
				if (node.nodeValue.trim().length > 0) {
					firstTextNode = node;
					break;
				}
			}

			if (firstTextNode) {
				const text = firstTextNode.nodeValue;
				const match = text.match(/^([\s\p{P}\p{S}]*)([^\s\p{P}\p{S}])/u);
				if (match) {
					const prefix = match[1];
					const firstChar = match[2];
					const rest = text.substring(match[0].length);
					
					const dropCapSpan = document.createElement('span');
					dropCapSpan.className = 'drop-cap';
					dropCapSpan.textContent = prefix + firstChar;
					
					const fragment = document.createDocumentFragment();
					fragment.appendChild(dropCapSpan);
					fragment.appendChild(document.createTextNode(rest));
					
					firstTextNode.parentNode.replaceChild(fragment, firstTextNode);
				}
			}
			return tempDiv.innerHTML;
		}

		static buildFullHTML(meta, chapters) {
			const scriptVersion = typeof GM_info !== 'undefined' ? GM_info.script.version : 'Unknown';
			const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

			let html = `
				<div class="title-page text-center">
					<h1>${meta.title}</h1>
					<h2>by ${meta.author}</h2>
				</div>
				<div class="page-break"></div>
				<div class="imprint-page">
					<h2 class="text-center">Imprint</h2>
					<p><span class="meta-label">Original Copyright ©</span> <strong>${meta.author}</strong></p>
					<p>Original Work published on Archive of Our Own.</p>
					<p><span class="meta-label">Source:</span> ${meta.rawMetadata.url}</p>
					<br/>
			`;
			
			const addMeta = (label, value) => {
				if (value && value !== 'N/A') html += `<p><span class="meta-label">${label}:</span> ${value}</p>\n`;
			};
			
			addMeta('Rating', meta.rawMetadata.rating);
			addMeta('Archive Warning', meta.rawMetadata.warnings);
			addMeta('Category', meta.rawMetadata.category);
			addMeta('Fandoms', meta.rawMetadata.fandoms);
			addMeta('Relationships', meta.rawMetadata.relationships);
			addMeta('Characters', meta.rawMetadata.characters);
			addMeta('Additional Tags', meta.rawMetadata.additionalTags);
			addMeta('Series', meta.rawMetadata.series);
			addMeta('Collections', meta.rawMetadata.collections);
			addMeta('Language', meta.rawMetadata.language);
			addMeta('Published', meta.rawMetadata.published);
			addMeta('Updated', meta.rawMetadata.updated);
			addMeta('Words', meta.rawMetadata.words);
			addMeta('Chapters', meta.rawMetadata.chapters);
			
			html += `<br/><p>Exported by AO3 Translator v${scriptVersion} on ${exportDate}.</p></div>`;

			if (meta.summary || meta.notes) {
				html += `<div class="page-break"></div><div class="foreword-page"><h2 class="text-center">Foreword</h2>`;
				if (meta.summary) html += `<div class="foreword-section"><h3>Summary</h3><div>${this.fixXHTML(meta.summary)}</div></div>`;
				if (meta.summary && meta.notes) html += `<br/>`;
				if (meta.notes) html += `<div class="foreword-section"><h3>Notes</h3><div>${this.fixXHTML(meta.notes)}</div></div>`;
				html += `</div>`;
			}

			if (chapters.length > 1) {
				html += `<div class="page-break"></div><div class="toc-page"><h2 class="text-center">Table of Contents</h2><ul class="toc-list">`;
				chapters.forEach((chap, index) => {
					let tocTitle = `第 ${index + 1} 章`;
					if (chap.title) {
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = chap.title;
						const origSpan = tempDiv.querySelector('.ao3-original-content');
						let rawOrigTitle = origSpan ? origSpan.textContent : tempDiv.textContent;
						let cleanName = rawOrigTitle.replace(/^(Chapter\s*\d+|第\s*\d+\s*章)\s*[:：]?\s*/i, '').trim();
						if (cleanName) tocTitle = `第 ${index + 1} 章 ${cleanName}`;
					}
					html += `<li class="toc-item"><a href="#chapter-${index + 1}">${tocTitle}</a></li>`;
				});
				html += `</ul></div>`;
			}

			chapters.forEach((chap, index) => {
				html += `<div class="page-break"></div><div class="chapter-page" id="chapter-${index + 1}">`;
				if (chap.title) {
					let displayTitle = chap.title.replace(/(Chapter\s*\d+|第\s*\d+\s*章)\s*[:：]\s*/gi, '$1 ');
					html += `<h2 class="text-center">${displayTitle}</h2>`;
				} else if (chapters.length > 1) {
					html += `<h2 class="text-center">第 ${index + 1} 章</h2>`;
				}

				if (chap.summary || chap.startNotes) {
					html += `<div class="chapter-meta">`;
					if (chap.summary) html += `<div><div class="meta-heading">Summary</div><div>${this.fixXHTML(chap.summary)}</div></div>`;
					if (chap.summary && chap.startNotes) html += `<br/>`;
					if (chap.startNotes) html += `<div><div class="meta-heading">Notes</div><div>${this.fixXHTML(chap.startNotes)}</div></div>`;
					html += `</div>`;
				}

				let contentHtml = this.fixXHTML(chap.content);
				contentHtml = this.applyManualDropCap(contentHtml);
				html += `<div class="chapter-text">${contentHtml}</div>`;
				
				if (chap.endNotes) {
					html += `<div class="chapter-meta chapter-end-notes"><div class="meta-heading">End Notes</div><div>${this.fixXHTML(chap.endNotes)}</div></div>`;
				}
				html += `</div>`;
			});

			html += `
				<div class="the-end text-center"><h2>THE END</h2><hr style="width: 50%; margin: 2em auto; border: 1px solid #ccc;"/></div>
				<div class="page-break"></div>
				<div class="about-page text-center" id="about-page">
					<h3>About AO3 Translator</h3>
					<p>This document was generated using AO3 Translator, an open-source user script designed to enhance the reading experience on Archive of Our Own.</p>
					<p>For more information, updates, or to report issues, please visit our GitHub repository:</p>
					<p>https://github.com/V-Lipset/ao3-chinese</p>
				</div>
			`;
			return html;
		}
	}

	/**
	 * 导出引擎
	 */
	class ExportEngine {
		static generateUUID() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		}

		static async loadJSZip() {
			if (typeof JSZip !== 'undefined') return JSZip;
			if (window.JSZip) return window.JSZip;

			const urls =[
				'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
				'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
				'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
			];

			for (const url of urls) {
				try {
					const res = await new Promise((resolve, reject) => {
						GM_xmlhttpRequest({
							method: 'GET', url: url, timeout: 10000,
							onload: (r) => r.status === 200 ? resolve(r.responseText) : reject(new Error(`HTTP ${r.status}`)),
							onerror: () => reject(new Error('Network Error')),
							ontimeout: () => reject(new Error('Timeout'))
						});
					});
					const wrapper = `var module = undefined; var exports = undefined; var define = undefined; ${res}\nreturn typeof JSZip !== 'undefined' ? JSZip : window.JSZip;`;
					const jszip = new Function(wrapper)();
					if (jszip) return jszip;
				} catch (e) {
					Logger.warn('Export', `JSZip 加载失败 (${url}): ${e.message}`);
				}
			}
			throw new Error('所有 JSZip CDN 均加载失败，请检查网络连接。');
		}

		static async generateEPUB(meta, chapters, css, fileNameBase) {
			const JSZipClass = await this.loadJSZip();
			const zip = new JSZipClass();
			zip.file("mimetype", "application/epub+zip");
			
			const metaInf = zip.folder("META-INF");
			metaInf.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
			
			const oebps = zip.folder("OEBPS");
			oebps.file("Styles/style.css", css);
			
			let manifest = `<item id="css" href="Styles/style.css" media-type="text/css"/>\n<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`;
			let spine = ``;
			let navPoints = '';
			let playOrder = 1;

			const addXHTMLFile = (id, title, bodyContent) => {
				const fileName = `Text/${id}.xhtml`;
				const content = `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml">\n<head>\n<title>${DocumentBuilder.escapeXML(title)}</title>\n<link href="../Styles/style.css" rel="stylesheet" type="text/css"/>\n</head>\n<body>\n${DocumentBuilder.fixXHTML(bodyContent)}\n</body>\n</html>`;
				oebps.file(fileName, content);
				manifest += `<item id="${id}" href="${fileName}" media-type="application/xhtml+xml"/>\n`;
				spine += `<itemref idref="${id}"/>\n`;
				navPoints += `<navPoint id="navPoint-${playOrder}" playOrder="${playOrder}"><navLabel><text>${DocumentBuilder.escapeXML(title)}</text></navLabel><content src="${fileName}"/></navPoint>\n`;
				playOrder++;
			};

			addXHTMLFile('titlepage', 'Title Page', `<div class="title-page text-center"><h1>${meta.title}</h1><h2>by ${meta.author}</h2></div>`);
			
			const scriptVersion = typeof GM_info !== 'undefined' ? GM_info.script.version : 'Unknown';
			const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
			
			let imprintContent = `<div class="imprint-page">\n<h2 class="text-center">Imprint</h2>\n<p><span class="meta-label">Original Copyright ©</span> <strong>${meta.author}</strong></p>\n<p>Original Work published on Archive of Our Own.</p>\n<p><span class="meta-label">Source:</span> ${meta.rawMetadata.url}</p>\n<br/>\n`;
			const addMeta = (label, value) => { if (value && value !== 'N/A') imprintContent += `<p><span class="meta-label">${label}:</span> ${value}</p>\n`; };
			addMeta('Rating', meta.rawMetadata.rating);
			addMeta('Archive Warning', meta.rawMetadata.warnings);
			addMeta('Category', meta.rawMetadata.category);
			addMeta('Fandoms', meta.rawMetadata.fandoms);
			addMeta('Relationships', meta.rawMetadata.relationships);
			addMeta('Characters', meta.rawMetadata.characters);
			addMeta('Additional Tags', meta.rawMetadata.additionalTags);
			addMeta('Series', meta.rawMetadata.series);
			addMeta('Collections', meta.rawMetadata.collections);
			addMeta('Language', meta.rawMetadata.language);
			addMeta('Published', meta.rawMetadata.published);
			addMeta('Updated', meta.rawMetadata.updated);
			addMeta('Words', meta.rawMetadata.words);
			addMeta('Chapters', meta.rawMetadata.chapters);
			imprintContent += `<br/>\n<p>Exported by AO3 Translator v${scriptVersion} on ${exportDate}.</p>\n</div>`;
			addXHTMLFile('imprint', 'Imprint', imprintContent);

			if (meta.summary || meta.notes) {
				let forewordContent = `<div class="foreword-page"><h2 class="text-center">Foreword</h2>`;
				if (meta.summary) forewordContent += `<div class="foreword-section"><h3>Summary</h3><div>${meta.summary}</div></div>`;
				if (meta.summary && meta.notes) forewordContent += `<br/>`;
				if (meta.notes) forewordContent += `<div class="foreword-section"><h3>Notes</h3><div>${meta.notes}</div></div>`;
				forewordContent += `</div>`;
				addXHTMLFile('foreword', 'Foreword', forewordContent);
			}

			if (chapters.length > 1) {
				let tocContent = `<div class="toc-page"><h2 class="text-center">Table of Contents</h2><ul class="toc-list">`;
				chapters.forEach((chap, index) => {
					let tocTitle = `第 ${index + 1} 章`;
					if (chap.title) {
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = chap.title;
						const origSpan = tempDiv.querySelector('.ao3-original-content');
						let rawOrigTitle = origSpan ? origSpan.textContent : tempDiv.textContent;
						let cleanName = rawOrigTitle.replace(/^(Chapter\s*\d+|第\s*\d+\s*章)\s*[:：]?\s*/i, '').trim();
						if (cleanName) tocTitle = `第 ${index + 1} 章 ${cleanName}`;
					}
					tocContent += `<li class="toc-item"><a href="chapter${index + 1}.xhtml">${tocTitle}</a></li>`;
				});
				tocContent += `</ul></div>`;
				addXHTMLFile('toc', 'Table of Contents', tocContent);
			}
			
			chapters.forEach((chap, index) => {
				const chapId = `chapter${index + 1}`;
				let tocTitle = `第 ${index + 1} 章`;
				let displayTitle = `第 ${index + 1} 章`;
				
				if (chap.title) {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = chap.title;
					const origSpan = tempDiv.querySelector('.ao3-original-content');
					let rawOrigTitle = origSpan ? origSpan.textContent : tempDiv.textContent;
					let cleanName = rawOrigTitle.replace(/^(Chapter\s*\d+|第\s*\d+\s*章)\s*[:：]?\s*/i, '').trim();
					if (cleanName) tocTitle = `第 ${index + 1} 章 ${cleanName}`;
					displayTitle = chap.title.replace(/(Chapter\s*\d+|第\s*\d+\s*章)\s*[:：]\s*/gi, '$1 ');
				}

				let chapContent = `<div class="chapter-page">`;
				if (chap.title) chapContent += `<h2 class="text-center">${displayTitle}</h2>\n`;
				else if (chapters.length > 1) chapContent += `<h2 class="text-center">第 ${index + 1} 章</h2>\n`;

				if (chap.summary || chap.startNotes) {
					chapContent += `<div class="chapter-meta">`;
					if (chap.summary) chapContent += `<div><div class="meta-heading">Summary</div><div>${DocumentBuilder.fixXHTML(chap.summary)}</div></div>`;
					if (chap.summary && chap.startNotes) chapContent += `<br/>`;
					if (chap.startNotes) chapContent += `<div><div class="meta-heading">Notes</div><div>${DocumentBuilder.fixXHTML(chap.startNotes)}</div></div>`;
					chapContent += `</div>`;
				}
				
				let contentHtml = DocumentBuilder.applyManualDropCap(chap.content);
				contentHtml = DocumentBuilder.fixXHTML(contentHtml);
				chapContent += `<div class="chapter-text">${contentHtml}</div>\n`;
				
				if (chap.endNotes) chapContent += `<div class="chapter-meta chapter-end-notes"><div class="meta-heading">End Notes</div><div>${DocumentBuilder.fixXHTML(chap.endNotes)}</div></div>\n`;
				chapContent += `</div>`;
				
				addXHTMLFile(chapId, tocTitle, chapContent);
			});

			const aboutContent = `
				<div class="about-page">
					<h2 class="text-center" style="margin-bottom: 3em;">THE END</h2>
					<hr style="width: 50%; margin: 2em auto;"/>
					<h3 class="text-center">About AO3 Translator</h3>
					<p>This document was generated using AO3 Translator, an open-source user script designed to enhance the reading experience on Archive of Our Own.</p>
					<p>For more information, updates, or to report issues, please visit our GitHub repository:</p>
					<p>https://github.com/V-Lipset/ao3-chinese</p>
				</div>`;
			addXHTMLFile('about', 'About AO3 Translator', aboutContent);
			
			const uuid = this.generateUUID();
			const metaTempDiv = document.createElement('div');
			metaTempDiv.innerHTML = meta.title;
			const origSpan = metaTempDiv.querySelector('.ao3-original-content');
			const transSpan = metaTempDiv.querySelector('.ao3-translated-content');
			let plainMetaTitle = (origSpan && transSpan) ? `${origSpan.textContent.trim()} ${transSpan.textContent.trim()}` : metaTempDiv.textContent.trim();

			const contentOpf = `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">\n  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">\n    <dc:title>${DocumentBuilder.escapeXML(plainMetaTitle)}</dc:title>\n    <dc:creator opf:role="aut">${DocumentBuilder.escapeXML(meta.author)}</dc:creator>\n    <dc:language>${meta.language}</dc:language>\n    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>\n  </metadata>\n  <manifest>\n    ${manifest}  </manifest>\n  <spine toc="ncx">\n    ${spine}  </spine>\n</package>`;
			oebps.file("content.opf", contentOpf);
			
			const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n  <head>\n    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>\n    <meta name="dtb:depth" content="1"/>\n    <meta name="dtb:totalPageCount" content="0"/>\n    <meta name="dtb:maxPageNumber" content="0"/>\n  </head>\n  <docTitle><text>${DocumentBuilder.escapeXML(plainMetaTitle)}</text></docTitle>\n  <navMap>\n    ${navPoints}  </navMap>\n</ncx>`;
			oebps.file("toc.ncx", tocNcx);
			
			const content = await zip.generateAsync({ type: "blob" });
			saveFile(content, `${fileNameBase}.epub`, 'application/epub+zip');
		}

		static async generatePDF(meta, chapters, css, fileNameBase) {
			Logger.info('Export', '正在准备 PDF 打印视图，请在弹出的系统对话框中选择“另存为 PDF”...');

			const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>${fileNameBase}</title>
					<style>
						* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
						@page { margin: 20mm; }
						html, body { margin: 0 !important; padding: 0 !important; background-color: #ffffff !important; }
						.pdf-export-container { width: 100%; max-width: 100% !important; margin: 0 auto; padding: 0; box-sizing: border-box; }
						${css}
					</style>
				</head>
				<body>
					<div class="pdf-export-container">
						${DocumentBuilder.buildFullHTML(meta, chapters)}
					</div>
				</body>
				</html>
			`;

			const iframe = document.createElement('iframe');
			iframe.style.position = 'fixed';
			iframe.style.right = '0';
			iframe.style.bottom = '0';
			iframe.style.width = '0';
			iframe.style.height = '0';
			iframe.style.border = '0';
			document.body.appendChild(iframe);

			const doc = iframe.contentWindow.document;
			doc.open();
			doc.write(htmlContent);
			doc.close();

			const originalTitle = document.title;
			document.title = fileNameBase;

			return new Promise((resolve) => {
				iframe.onload = () => {
					setTimeout(() => {
						let isCleanedUp = false;
						const cleanup = () => {
							if (isCleanedUp) return;
							isCleanedUp = true;
							document.title = originalTitle;
							if (document.body.contains(iframe)) document.body.removeChild(iframe);
							resolve();
						};

						try {
							iframe.contentWindow.focus();
							iframe.contentWindow.onafterprint = cleanup;
							const mediaQueryList = iframe.contentWindow.matchMedia('print');
							const mqlListener = (mql) => {
								if (!mql.matches) {
									cleanup();
									mediaQueryList.removeListener(mqlListener);
								}
							};
							mediaQueryList.addListener(mqlListener);

							if (Logger.saveTimer) {
								clearTimeout(Logger.saveTimer);
								Logger.saveTimer = null;
								try {
									GM_setValue('ao3_log_history', Logger._prune(Logger.history, Logger.config.maxPersist));
								} catch (e) {}
							}

							iframe.contentWindow.print();
						} catch (e) {
							try {
								Logger.error('Export', 'PDF 打印调用失败', e);
								notifyAndLog('PDF 打印调用失败，请检查浏览器权限。', '错误', 'error');
							} catch (logErr) {}
							cleanup();
						}
						setTimeout(cleanup, 300000); 
					}, 500);
				};
			});
		}

		static generateHTML(meta, chapters, css, fileNameBase) {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>${fileNameBase}</title>
					<style>${css}</style>
				</head>
				<body>
					<div class="content-wrapper">
						${DocumentBuilder.buildFullHTML(meta, chapters)}
					</div>
				</body>
				</html>
			`;
			saveFile(html, `${fileNameBase}.html`, 'text/html;charset=utf-8');
		}

		static async executeExport() {
			const formats = GM_getValue('ao3_export_selected_formats', ['html']);
			if (formats.length === 0) return;
			
			Logger.info('Export', '正在提取网页内容，请稍候...');
			
			const meta = AO3DOMParser.extractMetadata();
			const chapters = AO3DOMParser.extractChapters();
			
			const titleNode = document.querySelector('.preface.group h2.title.heading');
			let plainTitle = 'Unknown Title';
			if (titleNode) {
				const origTitleSpan = titleNode.querySelector('.ao3-original-title');
				if (origTitleSpan) {
					plainTitle = origTitleSpan.textContent.trim();
				} else {
					const clone = titleNode.cloneNode(true);
					clone.querySelectorAll('.ao3-title-translatable-temp, .ao3-translated-title').forEach(el => el.remove());
					plainTitle = clone.textContent.trim();
				}
			}
			
			const safeTitle = plainTitle.replace(/[\\/:*?"<>|]/g, '_');
			const safeAuthor = meta.author.replace(/[\\/:*?"<>|]/g, '_');
			const fileNameBase = `${safeTitle} - ${safeAuthor}`;
			
			const selectedTemplates = GM_getValue('ao3_export_selected_templates', { epub: 'default_epub', pdf: 'default_pdf', html: 'default_html' });
			
			for (const format of formats) {
				const templateId = selectedTemplates[format];
				const template = ExportTemplateStore.getTemplate(format, templateId);
				const css = template ? template.css : '';
				
				try {
					if (format === 'epub') await this.generateEPUB(meta, chapters, css, fileNameBase);
					else if (format === 'pdf') await this.generatePDF(meta, chapters, css, fileNameBase);
					else if (format === 'html') this.generateHTML(meta, chapters, css, fileNameBase);
				} catch (e) {
					Logger.error('Export', `导出 ${format.toUpperCase()} 失败`, e);
					notifyAndLog(`导出 ${format.toUpperCase()} 失败: ${e.message}`, '错误', 'error');
				}
			}
		}
	}

	/**
	 * 导出 UI 控制器
	 */
	class ExportUIController {
		static init(panel) {
			const exportFormatSelect = panel.querySelector('#export-format-select');
			const exportTemplateSelect = panel.querySelector('#export-template-select');
			const exportActionSelect = panel.querySelector('#export-action-select');
			const exportContainerName = panel.querySelector('#export-container-name');
			const exportContainerEdit = panel.querySelector('#export-container-edit');
			const exportTemplateNameInput = panel.querySelector('#export-template-name');
			const btnExportSaveName = panel.querySelector('#btn-export-save-name');
			const btnOpenStyleEditor = panel.querySelector('#btn-open-style-editor');
			const btnExportFormatChoose = panel.querySelector('#btn-export-format-choose');
			const btnExportExecute = panel.querySelector('#btn-export-execute');

			const renderExportManage = () => {
				const format = exportFormatSelect.value;
				const templates = ExportTemplateStore.getTemplates(format);
				const selectedTemplates = GM_getValue('ao3_export_selected_templates', { epub: 'default_epub', pdf: 'default_pdf', html: 'default_html' });
				let currentId = selectedTemplates[format];

				if (!templates.find(t => t.id === currentId)) {
					currentId = templates[0].id;
					selectedTemplates[format] = currentId;
					GM_setValue('ao3_export_selected_templates', selectedTemplates);
				}

				exportTemplateSelect.innerHTML = '';
				templates.forEach(t => {
					const option = document.createElement('option');
					option.value = t.id;
					option.textContent = t.name;
					exportTemplateSelect.appendChild(option);
				});
				const createOption = document.createElement('option');
				createOption.value = 'create_new';
				createOption.textContent = '新建模板';
				exportTemplateSelect.appendChild(createOption);

				exportTemplateSelect.value = currentId;

				const action = exportActionSelect.value;
				exportContainerName.style.display = 'none';
				exportContainerEdit.style.display = 'none';

				if (action === 'name') {
					exportContainerName.style.display = 'block';
					const currentTemplate = ExportTemplateStore.getTemplate(format, currentId);
					exportTemplateNameInput.value = currentTemplate ? currentTemplate.name : '';
					if (exportTemplateNameInput.value) exportTemplateNameInput.classList.add('has-value');
					else exportTemplateNameInput.classList.remove('has-value');
				} else if (action === 'edit') {
					exportContainerEdit.style.display = 'block';
				}
			};

			exportFormatSelect.addEventListener('change', (e) => {
				GM_setValue('ao3_export_last_format', e.target.value);
				renderExportManage();
			});

			exportTemplateSelect.addEventListener('change', (e) => {
				const format = exportFormatSelect.value;
				if (e.target.value === 'create_new') {
					const newId = `template_${Date.now()}`;
					const templates = ExportTemplateStore.getTemplates(format);
					let maxNum = 0;
					templates.forEach(t => {
						const match = t.name.match(/^自定义 (\d+)$/);
						if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
					});
					const newTemplate = {
						id: newId,
						name: `自定义 ${maxNum + 1}`,
						isProtected: false,
						css: ExportTemplateStore.DEFAULT_TEMPLATES[format][0].css 
					};
					ExportTemplateStore.saveTemplate(format, newTemplate);
					const selectedTemplates = GM_getValue('ao3_export_selected_templates');
					selectedTemplates[format] = newId;
					GM_setValue('ao3_export_selected_templates', selectedTemplates);
					exportActionSelect.value = 'name';
					GM_setValue('ao3_export_last_action', 'name');
					renderExportManage();
				} else {
					const selectedTemplates = GM_getValue('ao3_export_selected_templates');
					selectedTemplates[format] = e.target.value;
					GM_setValue('ao3_export_selected_templates', selectedTemplates);
					renderExportManage();
				}
			});

			exportActionSelect.addEventListener('change', (e) => {
				const action = e.target.value;
				if (action !== 'delete') {
					GM_setValue('ao3_export_last_action', action);
				}
				if (action === 'delete') {
					const format = exportFormatSelect.value;
					const currentId = exportTemplateSelect.value;
					const template = ExportTemplateStore.getTemplate(format, currentId);
					
					showCustomConfirm(`您确定要删除 ${template.name} 模板吗？\n\n注意：此操作无法撤销。`, '提示', { textAlign: 'center' })
						.then(() => {
							ExportTemplateStore.deleteTemplate(format, currentId);
							const selectedTemplates = GM_getValue('ao3_export_selected_templates');
							selectedTemplates[format] = ExportTemplateStore.getTemplates(format)[0].id;
							GM_setValue('ao3_export_selected_templates', selectedTemplates);
							exportActionSelect.value = 'name';
							GM_setValue('ao3_export_last_action', 'name');
							renderExportManage();
						})
						.catch(() => {
							exportActionSelect.value = 'name';
							GM_setValue('ao3_export_last_action', 'name');
							renderExportManage();
						});
				} else {
					renderExportManage();
				}
			});

			btnExportSaveName.addEventListener('click', () => {
				const format = exportFormatSelect.value;
				const currentId = exportTemplateSelect.value;
				const template = ExportTemplateStore.getTemplate(format, currentId);
				
				if (template) {
					const newName = exportTemplateNameInput.value.trim();
					if (newName) {
						template.name = newName;
						ExportTemplateStore.saveTemplate(format, template);
						renderExportManage();
					}
				}
			});

			btnOpenStyleEditor.addEventListener('click', () => {
				const format = exportFormatSelect.value;
				const currentId = exportTemplateSelect.value;
				openExportStyleModal(format, currentId);
			});

			btnExportFormatChoose.addEventListener('click', () => {
				openExportFormatModal();
			});

			btnExportExecute.addEventListener('click', () => {
				const formats = GM_getValue('ao3_export_selected_formats', ['html']);
				if (formats.length === 0) {
					showCustomConfirm('请先在“格式选择”中勾选需要导出的格式。', '提示', { textAlign: 'center' })
						.then(() => openExportFormatModal())
						.catch(() => {});
					return;
				}
				ExportEngine.executeExport();
			});

			return { renderExportManage };
		}
	}

	// 初始化模板存储
	ExportTemplateStore.init();

	/**************************************************************************
	 * UI 面板逻辑与用户设置
	 **************************************************************************/

	/**
	 * 将包含 <br> 的段落拆分为多个 .ao3-text-block
	 */
	function splitBrParagraphs(rootNode = document) {
		const selectors = '.userstuff p, .userstuff blockquote';
		let elements =[];
		
		if (rootNode.matches && rootNode.matches(selectors)) elements.push(rootNode);
		if (rootNode.querySelectorAll) elements.push(...rootNode.querySelectorAll(selectors));

		elements.forEach(el => {
			// 1. O(1) 拦截已处理节点
			if (el.dataset.brSplit === 'true') return;
			
			// 2. 快速预检：仅查找直接子元素中的 br
			if (!el.querySelector(':scope > br')) {
				el.dataset.brSplit = 'true';
				return;
			}

			const newUnits =[];
			let contentBuffer =[];

			const flushBuffer = () => {
				if (contentBuffer.length === 0) return;
				
				let hasContent = false;
				for (let i = 0; i < contentBuffer.length; i++) {
					const node = contentBuffer[i];
					if ((node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) || 
						(node.nodeType === Node.ELEMENT_NODE)) {
						hasContent = true;
						break;
					}
				}

				if (hasContent) {
					const wrapper = document.createElement('span');
					wrapper.className = 'ao3-text-block';
					if (el.dataset.detectedLang) {
						wrapper.dataset.detectedLang = el.dataset.detectedLang;
					}
					contentBuffer.forEach(node => wrapper.appendChild(node));
					newUnits.push(wrapper);
				} else {
					const frag = document.createDocumentFragment();
					contentBuffer.forEach(node => frag.appendChild(node));
					newUnits.push(frag);
				}
				contentBuffer =[];
			};

			const childNodes = Array.from(el.childNodes);
			for (let i = 0; i < childNodes.length; i++) {
				const node = childNodes[i];
				if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
					flushBuffer();
					newUnits.push(node);
				} else {
					contentBuffer.push(node);
				}
			}
			flushBuffer();

			el.innerHTML = '';
			newUnits.forEach(node => el.appendChild(node));
			el.dataset.brSplit = 'true';
		});
	}

	/**
	 * 清理段落开头的全角空格、NBSP、换行符等手动缩进，防止与 CSS 缩进叠加
	 */
	function cleanManualIndents(rootNode = document) {
		const selectors = '.userstuff p, .userstuff .ao3-text-block';
		let elements =[];
		
		if (rootNode.matches && rootNode.matches(selectors)) elements.push(rootNode);
		if (rootNode.querySelectorAll) elements.push(...rootNode.querySelectorAll(selectors));
		
		elements.forEach(el => {
			if (el.dataset.indentCleaned === 'true' && !el.querySelector('.ao3-translated-content')) return;
			
			// 快速预检：如果开头不是空白字符（包括 \n 和 \r），直接跳过
			const firstChar = el.textContent.charAt(0);
			if (firstChar && !/^[ \t\u3000\u00A0\n\r]/.test(firstChar)) {
				el.setAttribute('data-indent-cleaned', 'true');
				return;
			}
			
			const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
			let textNode;
			while ((textNode = walker.nextNode())) {
				const originalText = textNode.nodeValue;
				// 匹配开头所有的空白字符：普通空格、制表符、全角空格、NBSP、换行符
				const cleanedText = originalText.replace(/^[ \t\u3000\u00A0\n\r]+/, '');
				
				if (originalText !== cleanedText) {
					textNode.nodeValue = cleanedText;
				}
				
				if (cleanedText.trim().length > 0) break;
			}
			el.setAttribute('data-indent-cleaned', 'true');
		});
	}

	/**
	 * 应用文章格式样式至页面
	 */
	function applyFormatting(profile = null) {
		if (!profile) {
			profile = FormattingManager.getCurrentProfile();
		}

		if (!profile || !profile.params) return;

		const opts = profile.params;
		const isIndentEnabled = opts.indent === 'true';
		const indentValue = isIndentEnabled ? '2em' : '0';

		const fontSize = opts.fontSize + '%';
		const letterSpacing = opts.letterSpacing + 'px';
		const lineHeight = opts.lineHeight;
		const margins = opts.margins + '%';

		const cssParts = [];

		// 1. 页面布局
		if (opts.margins !== '0') {
			cssParts.push(`#workskin { padding: 0 ${margins} !important; margin: 0 auto !important; }`);
		}
		if (opts.fontSize !== '100') {
			cssParts.push(`#workskin > .preface, #workskin > #chapters, #workskin > .userstuff { font-size: ${fontSize} !important; }`);
		}

		// 2. 文本样式
		if (opts.lineHeight !== '1.5' || opts.letterSpacing !== '0') {
			const textSelectors = `#workskin p, #workskin li, #workskin dd, #workskin blockquote, #workskin .userstuff p`;
			let textRules = [];
			if (opts.lineHeight !== '1.5') textRules.push(`line-height: ${lineHeight} !important;`);
			if (opts.letterSpacing !== '0') textRules.push(`letter-spacing: ${letterSpacing} !important;`);
			cssParts.push(`${textSelectors} { ${textRules.join(' ')} }`);
		}

		// 3. 缩进接管逻辑
		cssParts.push(`
			.userstuff p, 
			.userstuff .ao3-text-block {
				text-indent: ${indentValue} !important;
				padding-left: 0 !important;
				margin-left: 0 !important;
			}
			
			.userstuff p:has(.ao3-text-block),
			.userstuff p:has(.ao3-original-content) {
				text-indent: 0 !important;
			}
			
			.userstuff .ao3-text-block:not(:has(.ao3-original-content)) {
				margin-left: ${indentValue} !important;
			}
			
			.userstuff .ao3-original-content {
				margin-left: ${indentValue} !important;
			}
			
			.userstuff .ao3-translated-content {
				text-indent: ${indentValue} !important;
				display: block;
			}
		`);

		splitBrParagraphs();
		cleanManualIndents();

		const css = cssParts.join('\n');
		let styleEl = document.getElementById('ao3-format-style')
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = 'ao3-format-style';
			document.head.appendChild(styleEl);
		}
		styleEl.textContent = css;
	}

	/**
	 * 数据导出/导入的分类定义
	 */
	const DATA_CATEGORIES =[
		{ id: 'staticKeys', label: '通用设置' },
		{ id: 'uiState', label: '界面位置' },
		{ id: 'apiKeys', label: 'API Key' },
		{ id: 'glossaries', label: '术语表配置' },
		{ id: 'postReplace', label: '后处理替换' },
		{ id: 'customServices', label: '自定义服务' },
		{ id: 'modelSelections', label: '内置模型偏好' },
		{ id: 'aiParameters', label: '翻译参数配置' },
		{ id: 'blockerSettings', label: '作品屏蔽设置' },
		{ id: 'formatting', label: '文章格式方案' },
		{ id: 'fabActions', label: '悬浮按钮操作' },
		{ id: 'exportTemplates', label: '作品导出模板' },
		{ id: 'cacheSettings', label: '缓存清理策略' }
	];

	// 页面配置缓存
	let pageConfig = {};

	/**
	 * 菜单渲染函数
	 */
	function setupMenuCommands(fabLogic, panelLogic) {
		let menuCommandIds = [];
		const render = () => {
			menuCommandIds.forEach(id => GM_unregisterMenuCommand(id));
			menuCommandIds = [];

			const register = (text, callback) => {
				menuCommandIds.push(GM_registerMenuCommand(text, callback));
			};

			// 1. 界面翻译开关
			const uiTransEnabled = GM_getValue('enable_ui_trans', true);
			register(uiTransEnabled ? '禁用界面翻译' : '启用界面翻译', () => {
				const newState = !uiTransEnabled;
				GM_setValue('enable_ui_trans', newState);
				FeatureSet.enable_ui_trans = newState;
				location.reload();
			});

			// 2. 悬浮按钮开关
			const showFab = GM_getValue('show_fab', true);
			register(showFab ? '隐藏悬浮按钮' : '显示悬浮按钮', () => {
				const newState = !showFab;
				GM_setValue('show_fab', newState);
				fabLogic.toggleFabVisibility(newState);
				render();
			});

			// 3. 状态指示灯开关
			const showLight = GM_getValue('show_status_light', true);
			register(showLight ? '隐藏状态指示' : '显示状态指示', () => {
				const newState = !showLight;
				GM_setValue('show_status_light', newState);
				document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.STATUS_LIGHT_TOGGLED, { detail: { show: newState } }));
				render();
			});

			// 4. 设置面板开关
			const isPanelOpen = panelLogic.panel.style.display === 'flex';
			const panelToggleText = isPanelOpen ? '关闭设置面板' : '打开设置面板';
			register(panelToggleText, () => {
				panelLogic.togglePanel();
			});
		};
		return render;
	}

	/**
	 * 检查当前上海时间是否为圣诞节 (12月25日)
	 */
	function checkChristmas() {
		try {
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: 'Asia/Shanghai',
				month: 'numeric',
				day: 'numeric'
			});
			const parts = formatter.formatToParts(new Date());
			const month = parts.find(p => p.type === 'month').value;
			const day = parts.find(p => p.type === 'day').value;
			return month === '12' && day === '25';
		} catch (e) {
			return false;
		}
	}

	/**
	 * 悬浮球的结构与样式
	 */
	function createFabUI() {
		// 检查 Shadow DOM 中是否已存在
		const existing = shadowWrapper.querySelector('#ao3-trans-fab-container');
		if (existing) {
			return { fabContainer: existing, statusLight: existing.querySelector('.fab-status-light') };
		}

		const iconUrl = GM_getResourceURL('vIcon');
		const santaHatUrl = GM_getResourceURL('santaHat');

		const fabContainer = document.createElement('div');
		fabContainer.id = 'ao3-trans-fab-container';

		const fabStyle = document.createElement('style');
		fabStyle.textContent = `
			#ao3-trans-fab-container {
				--fab-icon-url: url(${iconUrl});
				--santa-hat-url: url(${santaHatUrl});
			}
		`;
		shadowRoot.appendChild(fabStyle);

		const fabButton = document.createElement('div');
		fabButton.id = 'ao3-trans-fab';

		if (checkChristmas()) {
			fabButton.classList.add('christmas-mode');
		}

		const settingsIcon = document.createElement('div');
		settingsIcon.className = 'fab-icon';

		// 状态灯 DOM
		const statusLight = document.createElement('div');
		statusLight.className = 'fab-status-light status-idle';
		statusLight.id = 'ao3-fab-status-light';

		fabButton.appendChild(settingsIcon);
		fabButton.appendChild(statusLight);
		fabContainer.appendChild(fabButton);
		
		// 挂载到 Shadow Wrapper
		shadowWrapper.appendChild(fabContainer);

		return { fabContainer, statusLight };
	}

	const debounce = (func, delay) => {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), delay);
		};
	};

	/**
	 * 悬浮球交互逻辑
	 */
	function initializeFabInteraction(fabElements, panelLogic, statusLightController) {
		const { fabContainer, statusLight } = fabElements;
		const FAB_POSITION_KEY = 'ao3_fab_position';
		const DRAG_THRESHOLD = 5;
		const SAFE_MARGIN = 16;
		const RETRACT_MARGIN = 10;
		const SNAP_THRESHOLD = 40;
		const LONG_PRESS_DURATION = 500;

		let isPointerDown = false;
		let isDragging = false;
		let preventClick = false;
		let startCoords = { x: 0, y: 0 };
		let startPosition = { x: 0, y: 0 };
		let fabSize = { width: 0, height: 0 };
		let longPressTimer = null;
		let hasLongPressed = false;

		// 用于触控设备的 2 秒自动贴边倒计时
		let autoSnapTimer = null;
		// 记录最后一次交互的设备类型 ('touch' 或 'mouse')
		let lastPointerType = 'mouse';

		// 用于双击检测的变量
		let clickTimer = null;
		let clickCount = 0;

		let lastWinWidth = document.documentElement.clientWidth;
		let maxWinHeight = window.innerHeight;

		// 动态检测移动端键盘弹起状态
		const isMobileKeyboardState = () => {
			const winW = document.documentElement.clientWidth;
			const currentH = window.innerHeight;
			return lastPointerType === 'touch' &&
				   (Math.abs(winW - lastWinWidth) < 5) &&
				   (currentH < maxWinHeight * 0.80);
		};

		const limitNumber = (num, min, max) => Math.max(min, Math.min(num, max));
		const savePosition = debounce((pos) => GM_setValue(FAB_POSITION_KEY, pos), 500);

		const updateFabSize = () => {
			const rect = fabContainer.getBoundingClientRect();
			fabSize = { width: rect.width, height: rect.height };
		};

		const setPosition = (pos, useTransition = false) => {
			fabContainer.style.transition = useTransition ? 'all 0.3s ease' : 'none';
			fabContainer.style.left = `${pos.x}px`;
			fabContainer.style.top = `${pos.y}px`;
			if (statusLightController) statusLightController.updateDirection();
		};

		// 扩展安全区检测，防止边缘抖动
		const checkMouseLeave = (e) => {
			if (lastPointerType !== 'mouse') return;
			const rect = fabContainer.getBoundingClientRect();
			// 扩展判定区域，覆盖悬浮球到屏幕边缘的间隙
			const extendedRect = {
				left: rect.left - SAFE_MARGIN,
				top: rect.top - SAFE_MARGIN,
				right: rect.right + SAFE_MARGIN,
				bottom: rect.bottom + SAFE_MARGIN
			};
			// 只有鼠标真正离开这个扩展区域，才执行贴边
			if (e.clientX < extendedRect.left || e.clientX > extendedRect.right || e.clientY < extendedRect.top || e.clientY > extendedRect.bottom) {
				if (!panelLogic.panel || panelLogic.panel.style.display !== 'flex') {
					snapDecision(true);
				}
			}
		};

		// 清除 2 秒自动贴边倒计时
		const clearAutoSnapTimer = () => {
			if (autoSnapTimer) {
				clearTimeout(autoSnapTimer);
				autoSnapTimer = null;
			}
			document.removeEventListener('click', handleOutsideClickForSnap, true);
		};

		// 处理触控模式下，点击外部区域立刻贴边的逻辑
		const handleOutsideClickForSnap = (e) => {
			// 如果点击的是悬浮球本身，或者设置面板内部，则不处理
			if (fabContainer.contains(e.target) || (panelLogic.panel && panelLogic.panel.contains(e.target))) {
				return;
			}
			// 点击了外部，立刻清除倒计时并强制贴边
			clearAutoSnapTimer();
			snapDecision(true);
		};

		// 核心位置判定逻辑
		const snapDecision = (forceRetract = false) => {
			if (isDragging) return;
			window.removeEventListener('mousemove', checkMouseLeave);

			// 最高优先级：面板打开时，绝对不允许贴边
			if (panelLogic.panel && panelLogic.panel.style.display === 'flex') {
				activateFab();
				return;
			}

			const winW = document.documentElement.clientWidth;
			const currentH = window.innerHeight;
			if (currentH > maxWinHeight) maxWinHeight = currentH;

			const effectiveH = isMobileKeyboardState() ? maxWinHeight : currentH;
			const currentPos = { x: parseFloat(fabContainer.style.left || 0), y: parseFloat(fabContainer.style.top || 0) };

			const dist = {
				left: currentPos.x,
				right: winW - (currentPos.x + fabSize.width),
				top: currentPos.y,
				bottom: effectiveH - (currentPos.y + fabSize.height)
			};

			const isNearLeft = dist.left < SNAP_THRESHOLD;
			const isNearRight = dist.right < SNAP_THRESHOLD;
			const isNearTop = dist.top < SNAP_THRESHOLD;
			const isNearBottom = dist.bottom < SNAP_THRESHOLD;

			let finalPos = { ...currentPos };
			let shouldSnap = true;

			// 角落保护：如果同时靠近两个相邻边缘，弹开一段安全距离，并保持完全显示
			if ((isNearLeft && isNearTop) || (isNearLeft && isNearBottom) || (isNearRight && isNearTop) || (isNearRight && isNearBottom)) {
				finalPos.x = isNearLeft ? SAFE_MARGIN : winW - fabSize.width - SAFE_MARGIN;
				finalPos.y = isNearTop ? SAFE_MARGIN : effectiveH - fabSize.height - SAFE_MARGIN;
				fabContainer.classList.remove('snapped');
				fabContainer.classList.add('is-active');
			}
			// 边缘吸附：靠近单一边缘时，执行半透明贴边
			else if (isNearLeft || isNearRight || isNearTop || isNearBottom) {
				const minVertical = Math.min(dist.top, dist.bottom);
				const minHorizontal = Math.min(dist.left, dist.right);

				if (minHorizontal < minVertical) {
					finalPos.x = isNearLeft ? -fabSize.width / 2 : winW - fabSize.width / 2;
				} else {
					finalPos.y = isNearTop ? -fabSize.height / 2 : effectiveH - fabSize.height / 2;
				}
				fabContainer.classList.add('snapped');
				fabContainer.classList.remove('is-active');
			}
			// 屏幕中间：保持完全显示
			else {
				shouldSnap = false;
				fabContainer.classList.remove('snapped', 'is-active');
			}

			if (shouldSnap || forceRetract) {
				setPosition(finalPos, true);
				savePosition(finalPos);
			}
		};

		// 激活悬浮球 (向内侧移动一点安全距离，完全显示)
		const activateFab = () => {
			if (isDragging) return;
			window.removeEventListener('mousemove', checkMouseLeave);

			clearAutoSnapTimer();
			fabContainer.classList.add('is-active');
			fabContainer.classList.remove('snapped');

			const winW = document.documentElement.clientWidth;
			const winH = window.innerHeight;
			const currentPos = { x: parseFloat(fabContainer.style.left), y: parseFloat(fabContainer.style.top) };
			let newPos = { ...currentPos };

			// 向内侧移动 RETRACT_MARGIN 距离
			if (currentPos.x < 0) newPos.x = RETRACT_MARGIN;
			else if (currentPos.x > winW - fabSize.width) newPos.x = winW - fabSize.width - RETRACT_MARGIN;

			if (currentPos.y < 0) newPos.y = RETRACT_MARGIN;
			else if (currentPos.y > winH - fabSize.height) newPos.y = winH - fabSize.height - RETRACT_MARGIN;

			setPosition(newPos, true);
		};

		// 启动 2 秒自动贴边倒计时
		const startAutoSnapTimer = () => {
			clearAutoSnapTimer();
			if (panelLogic.panel && panelLogic.panel.style.display === 'flex') return;

			// 监听外部点击
			document.addEventListener('click', handleOutsideClickForSnap, true);

			autoSnapTimer = setTimeout(() => {
				if (panelLogic.panel && panelLogic.panel.style.display !== 'flex') {
					snapDecision(true);
				}
				clearAutoSnapTimer();
			}, 2000);
		};

		// 统一处理悬浮球操作逻辑
		const handleFabAction = (action) => {
			if (action === 'none') return;

			const isSnapped = fabContainer.classList.contains('snapped');
			if (isSnapped) activateFab();

			if (action === 'toggle_panel') {
				panelLogic.togglePanel();
			} else if (action === 'toggle_translate') {
				document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FAB_CLICKED));
			} else if (action === 'clear_cache') {
				document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CLEAR_PAGE_CACHE));
			} else if (action === 'export_work') {
				const formats = GM_getValue('ao3_export_selected_formats', ['html']);
				if (formats.length === 0) {
					showCustomConfirm('请先在“格式选择”中勾选需要导出的格式。', '提示', { textAlign: 'center' })
						.then(() => openExportFormatModal())
						.catch(() => {});
				} else {
					ExportEngine.executeExport();
				}
			}

			// 触控设备下，如果执行的不是打开面板，则启动 2 秒自动贴边倒计时
			if (lastPointerType === 'touch' && action !== 'toggle_panel') {
				startAutoSnapTimer();
			}
		};

		// 事件监听

		const onPointerDown = (e) => {
			if (e.button !== 0 && e.pointerType !== 'touch') return;

			lastPointerType = e.pointerType;
			fabContainer.setPointerCapture(e.pointerId);
			isPointerDown = true;
			isDragging = false;
			preventClick = false;
			hasLongPressed = false;
			startCoords = { x: e.clientX, y: e.clientY };
			startPosition = { x: parseFloat(fabContainer.style.left || 0), y: parseFloat(fabContainer.style.top || 0) };
			fabContainer.style.transition = 'none';

			clearAutoSnapTimer();

			longPressTimer = setTimeout(() => {
				if (!isDragging) {
					hasLongPressed = true;
					const currentMode = GM_getValue('ao3_translation_mode', 'unit');
					const config = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
					const action = config[currentMode]['long_press'];
					handleFabAction(action);
				}
			}, LONG_PRESS_DURATION);
		};

		const onPointerMove = (e) => {
			if (!isPointerDown) return;
			const dx = e.clientX - startCoords.x;
			const dy = e.clientY - startCoords.y;

			if (!isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
				isDragging = true;
				preventClick = true;
				if (longPressTimer) {
					clearTimeout(longPressTimer);
					longPressTimer = null;
				}
				fabContainer.classList.add('dragging');
				fabContainer.classList.remove('snapped', 'is-active');
			}

			if (isDragging) {
				const newX = startPosition.x + dx;
				const newY = startPosition.y + dy;
				setPosition({ x: newX, y: newY });
			}
		};

		const onPointerUp = (e) => {
			if (!isPointerDown) return;
			fabContainer.releasePointerCapture(e.pointerId);
			isPointerDown = false;

			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}

			if (hasLongPressed) {
				panelLogic.setIgnoreOutsideClick();
			}

			if (isDragging) {
				isDragging = false;
				fabContainer.classList.remove('dragging');

				const winW = document.documentElement.clientWidth;
				const winH = window.innerHeight;
				let finalPos = { x: parseFloat(fabContainer.style.left), y: parseFloat(fabContainer.style.top) };
				finalPos.x = limitNumber(finalPos.x, 0, winW - fabSize.width);
				finalPos.y = limitNumber(finalPos.y, 0, winH - fabSize.height);
				setPosition(finalPos);
				savePosition(finalPos);

				snapDecision();
			}
		};

		// 点击逻辑分发
		fabContainer.addEventListener('click', (e) => {
			if (preventClick || hasLongPressed) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			const currentMode = GM_getValue('ao3_translation_mode', 'unit');
			const config = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
			const modeConfig = config[currentMode] || config['unit'];

			// 检查是否配置了双击事件
			const hasDoubleClick = modeConfig['double_click'] !== 'none';

			clickCount++;

			if (hasDoubleClick) {
				if (clickCount === 1) {
					// 启动延时，等待可能的第二次点击
					clickTimer = setTimeout(() => {
						clickCount = 0;
						handleFabAction(modeConfig['click']);
					}, 250);
				} else if (clickCount === 2) {
					// 触发双击
					clearTimeout(clickTimer);
					clickCount = 0;
					handleFabAction(modeConfig['double_click']);
				}
			} else {
				// 如果没有配置双击，直接无延迟触发单击
				clickCount = 0;
				handleFabAction(modeConfig['click']);
			}
		});

		// 鼠标悬停逻辑
		fabContainer.addEventListener('mouseenter', (e) => {
			// 只有最后一次操作是鼠标时，才响应 hover
			if (lastPointerType === 'mouse') {
				activateFab();
			}
		});

		fabContainer.addEventListener('mouseleave', (e) => {
			if (lastPointerType === 'mouse' && (!panelLogic.panel || panelLogic.panel.style.display !== 'flex')) {
				// 鼠标移出 DOM 元素时，不立刻贴边，而是开启扩展安全区检测
				window.addEventListener('mousemove', checkMouseLeave);
			}
		});

		fabContainer.addEventListener('pointerdown', onPointerDown);
		fabContainer.addEventListener('pointermove', onPointerMove);
		fabContainer.addEventListener('pointerup', onPointerUp);
		
		// 右键菜单逻辑
		fabContainer.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			if (lastPointerType === 'touch') return;
			const currentMode = GM_getValue('ao3_translation_mode', 'unit');
			const config = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
			const action = config[currentMode]['right_click'];
			handleFabAction(action);
		});

		const onResize = debounce(() => {
			const currentHeight = window.innerHeight;

			if (currentHeight > maxWinHeight) {
				maxWinHeight = currentHeight;
			}

			if (isMobileKeyboardState()) {
				return;
			}

			updateFabSize();
			snapDecision(true);
			if (statusLightController) statusLightController.updateDirection();
		}, 200);

		window.addEventListener('resize', onResize);

		const initializePosition = () => {
			updateFabSize();
			let initialPosition = GM_getValue(FAB_POSITION_KEY);
			if (!initialPosition) {
				const winW = document.documentElement.clientWidth;
				const winH = window.innerHeight;
				initialPosition = {
					x: winW - fabSize.width / 2,
					y: winH * 0.75 - fabSize.height / 2
				};
			}
			setPosition(initialPosition);
			setTimeout(() => snapDecision(true), 100);
		};

		initializePosition();

		return {
			toggleFabVisibility: (forceState) => {
				const showFab = forceState !== undefined ? forceState : GM_getValue('show_fab', true);
				fabContainer.style.display = showFab ? 'block' : 'none';
				if (showFab && statusLightController) {
					statusLightController.updateDirection();
				}
			},
			retractFab: () => snapDecision(true),
		};
	}

	/**
	 * 创建数据选择模态框
	 */
	function createSelectionModal(title, items, mode = 'import', storageKey = null) {
		return new Promise((resolve, reject) => {
			if (shadowWrapper.querySelector('#ao3-data-selection-overlay')) {
				return reject(new Error('已有模态框正在显示'));
			}

			const overlay = document.createElement('div');
			overlay.id = 'ao3-data-selection-overlay';
			overlay.className = 'ao3-overlay';

			const savedSelection = storageKey ? GM_getValue(storageKey, []) :[];
			const hasSavedSelection = savedSelection.length > 0;

			let html = `
				<div class="ao3-modal" id="ao3-data-selection-modal">
					<div class="ao3-modal-header">
						<h3>${title}</h3>
						<div class="data-select-all-wrapper">全选</div>
					</div>
					<div class="ao3-modal-body ao3-custom-scrollbar">
			`;

			items.forEach(item => {
				let isChecked = true;
				if (item.disabled) {
					isChecked = false;
				} else if (hasSavedSelection) {
					isChecked = savedSelection.includes(item.id);
				} else if (item.checked === false) {
					isChecked = false;
				}

				html += `
					<label class="data-selection-item ${item.disabled ? 'disabled' : ''}">
						<input type="checkbox" value="${item.id}" ${isChecked ? 'checked' : ''} ${item.disabled ? 'disabled' : ''}>
						<div class="data-item-content">
							<span class="data-item-label">${item.label}</span>
						</div>
					</label>
				`;
			});

			html += `
					</div>
					<div class="ao3-modal-footer">
			`;

			if (mode === 'export') {
				html += `
						<button class="ao3-modal-btn cancel">取消</button>
						<button class="ao3-modal-btn confirm">确认</button>
				`;
			} else {
				html += `
						<button class="ao3-modal-btn cancel">取消导入</button>
						<button class="ao3-modal-btn merge">数据合并</button>
						<button class="ao3-modal-btn overwrite">数据覆盖</button>
				`;
			}

			html += `
					</div>
				</div>
			`;

			overlay.insertAdjacentHTML('beforeend', html);
			shadowWrapper.appendChild(overlay);

			const modal = overlay.querySelector('#ao3-data-selection-modal');
			const checkboxes = modal.querySelectorAll('input[type="checkbox"]:not(:disabled)');
			const selectAllBtn = modal.querySelector('.data-select-all-wrapper');

			let isAllSelected = Array.from(checkboxes).every(cb => cb.checked);
			selectAllBtn.textContent = isAllSelected ? '取消全选' : '全选';

			selectAllBtn.addEventListener('click', () => {
				isAllSelected = !isAllSelected;
				checkboxes.forEach(cb => cb.checked = isAllSelected);
				selectAllBtn.textContent = isAllSelected ? '取消全选' : '全选';
			});

			checkboxes.forEach(cb => {
				cb.addEventListener('change', () => {
					isAllSelected = Array.from(checkboxes).every(c => c.checked);
					selectAllBtn.textContent = isAllSelected ? '取消全选' : '全选';
				});
			});

			const cleanup = () => overlay.remove();

			const getSelectedIds = () => {
				return Array.from(modal.querySelectorAll('input[type="checkbox"]'))
					.filter(cb => cb.checked)
					.map(cb => cb.value);
			};

			modal.querySelector('.cancel').addEventListener('click', () => {
				cleanup();
				reject(new Error('User cancelled'));
			});

			if (mode === 'export') {
				modal.querySelector('.confirm').addEventListener('click', () => {
					const selectedIds = getSelectedIds();
					if (storageKey) GM_setValue(storageKey, selectedIds);
					cleanup();
					resolve({ ids: selectedIds, mode: 'export' });
				});
			} else {
				modal.querySelector('.merge').addEventListener('click', () => {
					const selectedIds = getSelectedIds();
					if (storageKey) GM_setValue(storageKey, selectedIds);
					cleanup();
					resolve({ ids: selectedIds, mode: 'merge' });
				});

				modal.querySelector('.overwrite').addEventListener('click', () => {
					const selectedIds = getSelectedIds();
					if (storageKey) GM_setValue(storageKey, selectedIds);
					cleanup();
					resolve({ ids: selectedIds, mode: 'overwrite' });
				});
			}

			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					cleanup();
					reject(new Error('User cancelled'));
				}
			});
		});
	}

	/**
	 * 屏蔽功能相关的所有键名集合
	 */
	const BLOCKER_KEYS = [
		'ao3_blocker_enabled',
		'ao3_blocker_show_reasons',
		'ao3_blocker_tags_black',
		'ao3_blocker_tags_white',
		'ao3_blocker_content_author',
		'ao3_blocker_content_title',
		'ao3_blocker_content_summary',
		'ao3_blocker_content_id',
		'ao3_blocker_stats_min_words',
		'ao3_blocker_stats_max_words',
		'ao3_blocker_stats_min_chapters',
		'ao3_blocker_stats_max_chapters',
		'ao3_blocker_stats_update',
		'ao3_blocker_stats_crossover',
		'ao3_blocker_adv_pairing',
		'ao3_blocker_adv_char',
		'ao3_blocker_adv_lang',
		'ao3_blocker_adv_scope_rel',
		'ao3_blocker_adv_scope_char',
		'ao3_blocker_current_view',
		'ao3_blocker_current_sub_view'
	];

	/**
	 * 聚合用户配置数据，支持按需导出
	 */
	async function exportAllData(selectedCategories = null) {
		const categories = selectedCategories || DATA_CATEGORIES.map(c => c.id);
		const isSelected = (id) => categories.includes(id);

		const allData = {
			metadata: {
				exportFormatVersion: "1.3",
				scriptVersion: GM_info.script.version,
				exportDate: getShanghaiTimeString(),
				selectedCategories: categories
			},
			data: {}
		};

		if (isSelected('staticKeys')) {
			allData.data.staticKeys = {};
			const keys =[
				'enable_RegExp', 'enable_transDesc', 'show_fab', 'transEngine',
				'translation_display_mode', 'ao3_glossary_last_action',
				'from_lang', 'to_lang', 'lang_detector', 'enable_ui_trans',
				'ao3_log_level', 'ao3_log_auto_clear', 'custom_url_first_save_done',
				'ao3_translation_mode', 'ao3_auto_translate', 'show_status_light', 'hide_whitelist_prompt'
			];
			for (const key of keys) {
				const value = GM_getValue(key);
				if (value !== undefined) allData.data.staticKeys[key] = value;
			}
		}

		if (isSelected('apiKeys')) {
			allData.data.apiKeys = {};
			const builtInServices = Object.keys(engineMenuConfig)
				.filter(id => id !== 'google_translate' && id !== 'bing_translator' && id !== ADD_NEW_CUSTOM_SERVICE_ID);
			for (const serviceId of builtInServices) {
				const apiKey = GM_getValue(`${serviceId}_keys_string`);
				if (apiKey !== undefined) allData.data.apiKeys[`${serviceId}_keys_string`] = apiKey;
				const keyIndex = GM_getValue(`${serviceId}_key_index`);
				if (keyIndex !== undefined) allData.data.apiKeys[`${serviceId}_key_index`] = keyIndex;
			}
		}

		if (isSelected('modelSelections')) {
			allData.data.modelSelections = {};
			const builtInServices = Object.keys(engineMenuConfig);
			for (const serviceId of builtInServices) {
				if (engineMenuConfig[serviceId].modelGmKey) {
					const model = GM_getValue(engineMenuConfig[serviceId].modelGmKey);
					if (model !== undefined) allData.data.modelSelections[engineMenuConfig[serviceId].modelGmKey] = model;

					const customMappingKey = `${serviceId}_custom_model_mapping`;
					const customMapping = GM_getValue(customMappingKey);
					if (customMapping !== undefined) {
						allData.data.modelSelections[customMappingKey] = customMapping;
					}
				}
			}
		}

		if (isSelected('customServices')) {
			allData.data.customServices = [];
			const customServicesList = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
			for (const service of customServicesList) {
				const serviceExport = {
					id: service.id,
					name: service.name,
					url: service.url,
					modelsRaw: service.modelsRaw,
					selectedModel: GM_getValue(`${ACTIVE_MODEL_PREFIX_KEY}${service.id}`),
					lastAction: GM_getValue(`custom_service_last_action_${service.id}`)
				};
				if (isSelected('apiKeys')) {
					const apiKey = GM_getValue(`${service.id}_keys_string`);
					if (apiKey !== undefined) {
						if (!allData.data.apiKeys) allData.data.apiKeys = {};
						allData.data.apiKeys[`${service.id}_keys_string`] = apiKey;
						const keyIndex = GM_getValue(`${service.id}_key_index`);
						if (keyIndex !== undefined) allData.data.apiKeys[`${service.id}_key_index`] = keyIndex;
					}
				}
				allData.data.customServices.push(serviceExport);
			}
		}

		if (isSelected('glossaries')) {
			allData.data.glossaries = {
				customGlossaries: GM_getValue(CUSTOM_GLOSSARIES_KEY),
				metadata: GM_getValue(GLOSSARY_METADATA_KEY),
				onlineOrder: GM_getValue(ONLINE_GLOSSARY_ORDER_KEY,[]),
				lastSelected: GM_getValue(LAST_SELECTED_GLOSSARY_KEY)
			};
		}

		if (isSelected('postReplace')) {
			allData.data.postReplace = {
				postReplaceRules: GM_getValue(POST_REPLACE_RULES_KEY,[])
			};
		}

		if (isSelected('aiParameters')) {
			allData.data.aiParameters = {};

			const uiStateKeys = ['ao3_ai_param_last_action'];
			for (const key of uiStateKeys) {
				const value = GM_getValue(key);
				if (value !== undefined) allData.data.aiParameters[key] = value;
			}

			const profiles = GM_getValue(AI_PROFILES_KEY);
			if (profiles && Array.isArray(profiles) && profiles.length > 0) {
				allData.data.aiParameters[AI_PROFILES_KEY] = profiles;
			}
		}

		if (isSelected('uiState')) {
			const collapsedStates = {};
			const allServiceIds = [
				...Object.keys(engineMenuConfig),
				...GM_getValue(CUSTOM_SERVICES_LIST_KEY, []).map(s => s.id)
			];
			for (const sId of allServiceIds) {
				const val = GM_getValue(`service_collapsed_${sId}`);
				if (val !== undefined) collapsedStates[sId] = val;
			}

			allData.data.uiState = {
				fabPosition: GM_getValue('ao3_fab_position'),
				panelPosition: GM_getValue('ao3_panel_position'),
				panelHasOpened: GM_getValue('panel_has_been_opened_once'),
				exportSelection: GM_getValue('ao3_export_selection_memory'),
				localGlossarySelectedId: GM_getValue('ao3_local_glossary_selected_id'),
				localGlossaryEditMode: GM_getValue('ao3_local_glossary_edit_mode'),
				postReplaceSelectedId: GM_getValue('ao3_post_replace_selected_id'),
				postReplaceEditMode: GM_getValue('ao3_post_replace_edit_mode'),
				fabManageMode: GM_getValue('ao3_fab_manage_mode'),
				fabManageGesture: GM_getValue('ao3_fab_manage_gesture'),
				formattingLastProp: GM_getValue('formatting_last_prop'),
				logModalFilter: GM_getValue('ao3_log_modal_filter'),
				exportLastFormat: GM_getValue('ao3_export_last_format'),
				exportLastAction: GM_getValue('ao3_export_last_action'),
				hasSwitchedToFullPageOnce: GM_getValue('has_switched_to_full_page_once'),
				cacheManageMode: GM_getValue('ao3_cache_manage_mode'),
				serviceCollapsedStates: collapsedStates
			};
		}

		if (isSelected('blockerSettings')) {
			allData.data.blockerSettings = {};
			for (const key of BLOCKER_KEYS) {
				const value = GM_getValue(key);
				if (value !== undefined) {
					allData.data.blockerSettings[key] = value;
				}
			}
		}

		if (isSelected('formatting')) {
			allData.data.formatting = {
				[FORMATTING_PROFILES_KEY]: GM_getValue(FORMATTING_PROFILES_KEY),
				[FORMATTING_SELECTED_ID_KEY]: GM_getValue(FORMATTING_SELECTED_ID_KEY)
			};
		}

		if (isSelected('fabActions')) {
			allData.data.fabActions = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
		}

		if (isSelected('exportTemplates')) {
			allData.data.exportTemplates = {
				templates: GM_getValue('ao3_export_templates'),
				selected: GM_getValue('ao3_export_selected_templates')
			};
		}

		if (isSelected('cacheSettings')) {
			allData.data.cacheSettings = {
				autoCleanupEnabled: GM_getValue('ao3_cache_auto_cleanup_enabled', true),
				maxItems: GM_getValue('ao3_cache_max_items'),
				maxDays: GM_getValue('ao3_cache_max_days')
			};
		}
		return allData;
	}

	/**
	 * 智能合并辅助函数
	 */
	function deepEqual(obj1, obj2) {
		if (obj1 === obj2) return true;
		if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) return false;
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		if (keys1.length !== keys2.length) return false;
		for (const key of keys1) {
			if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
		}
		return true;
	}

	function generateUniqueName(desiredName, existingNames) {
		let newName = desiredName;
		let counter = 1;
		const nameSet = new Set(existingNames);
		while (nameSet.has(newName)) {
			const match = desiredName.match(/^(.*?)(?:\s*\((\d+)\))?$/);
			const baseName = match[1].trim();
			newName = `${baseName} (${counter})`;
			counter++;
		}
		return newName;
	}

	function mergeApiKeys(localStr, importedStr) {
		if (!localStr) return importedStr || '';
		if (!importedStr) return localStr || '';
		const localKeys = localStr.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
		const importedKeys = importedStr.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
		const mergedSet = new Set([...localKeys, ...importedKeys]);
		return Array.from(mergedSet).join(', ');
	}

	/**
	 * 导入用户配置数据，支持按需导入及智能合并/覆盖模式
	 */
	async function importAllData(jsonData, selectedCategories, importMode) {
		if (!jsonData || typeof jsonData !== 'object' || !jsonData.data || typeof jsonData.data !== 'object') {
			return { success: false, message: "文件格式无效或文件已损坏：缺少核心 'data' 模块。" };
		}

		// 记录导入前的模式和开关状态
		const oldMode = GM_getValue('ao3_translation_mode', 'unit');
		const oldTransDesc = GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
		const oldAutoTranslate = GM_getValue('ao3_auto_translate', false);

		const fileMetadata = jsonData.metadata || {};
		const fileFormatVersion = parseFloat(fileMetadata.exportFormatVersion || "1.0");
		const currentScriptSupportedVersion = 1.3;

		if (fileFormatVersion > currentScriptSupportedVersion) {
			try {
				await showCustomConfirm(
					`该备份文件的格式版本高于当前插件支持的版本。\n\n强制导入可能会导致部分设置丢失或功能异常。\n是否仍要继续导入？`,
					'提示',
					{ textAlign: 'center' }
				);
			} catch (e) {
				return { success: false, message: "用户取消导入：版本不兼容。" };
			}
		}

		const data = jsonData.data;
		const isSelected = (id) => selectedCategories.includes(id);
		const isOverwrite = importMode === 'overwrite';
		let importLog =[];

		const serviceIdMap = new Map();

		// 1. 自定义服务
		if (isSelected('customServices')) {
			if (isOverwrite) {
				GM_setValue(CUSTOM_SERVICES_LIST_KEY,[]);
			}

			if (Array.isArray(data.customServices)) {
				const existingServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY,[]);
				const existingNames = existingServices.map(s => s.name);
				let addedCount = 0;
				let mergedCount = 0;

				for (const importedService of data.customServices) {
					if (!importedService || typeof importedService.id !== 'string') continue;

					let models = importedService.models ||[];
					if (models.length === 0 && importedService.modelsRaw) {
						models = importedService.modelsRaw.replace(/[，]/g, ',').split(',').map(m => m.trim()).filter(Boolean);
					}

					const matchedService = existingServices.find(s => s.url === importedService.url);

					if (!isOverwrite && matchedService) {
						// 合并模式且 URL 相同：合并模型和 API Key，不创建新服务
						serviceIdMap.set(importedService.id, matchedService.id);
						
						const mergedModelsSet = new Set([...(matchedService.models || []), ...models]);
						matchedService.models = Array.from(mergedModelsSet);
						matchedService.modelsRaw = matchedService.models.join(', ');

						if (isSelected('apiKeys') && data.apiKeys) {
							const oldKeyName = `${importedService.id}_keys_string`;
							const importedApiKey = data.apiKeys[oldKeyName] || importedService.apiKey;
							if (importedApiKey) {
								const localApiKey = GM_getValue(`${matchedService.id}_keys_string`, '');
								const mergedKey = mergeApiKeys(localApiKey, importedApiKey);
								GM_setValue(`${matchedService.id}_keys_string`, mergedKey);
								GM_setValue(`${matchedService.id}_keys_array`, mergedKey.split(', '));
							}
						}
						mergedCount++;
					} else {
						// 覆盖模式 或 URL 不同：创建新服务
						const newServiceId = `custom_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
						serviceIdMap.set(importedService.id, newServiceId);

						let finalName = importedService.name;
						if (!isOverwrite) {
							finalName = generateUniqueName(importedService.name, existingNames);
							existingNames.push(finalName);
						}

						const newServiceConfig = {
							id: newServiceId,
							name: finalName,
							url: importedService.url,
							modelsRaw: models.join(', '),
							models: models
						};

						if (importedService.selectedModel !== undefined) {
							GM_setValue(`${ACTIVE_MODEL_PREFIX_KEY}${newServiceId}`, importedService.selectedModel);
						}

						if (isSelected('apiKeys') && data.apiKeys) {
							const oldKeyName = `${importedService.id}_keys_string`;
							const apiKeyVal = data.apiKeys[oldKeyName] || importedService.apiKey;
							if (apiKeyVal !== undefined) {
								GM_setValue(`${newServiceId}_keys_string`, apiKeyVal);
								const keysArray = apiKeyVal.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
								GM_setValue(`${newServiceId}_keys_array`, keysArray);
							}
							const oldIndexKey = `${importedService.id}_key_index`;
							if (data.apiKeys[oldIndexKey] !== undefined) {
								GM_setValue(`${newServiceId}_key_index`, data.apiKeys[oldIndexKey]);
							}
						}

						existingServices.push(newServiceConfig);
						addedCount++;
					}
				}
				GM_setValue(CUSTOM_SERVICES_LIST_KEY, existingServices);
				if (addedCount > 0) importLog.push(`新增 ${addedCount} 个自定义服务`);
				if (mergedCount > 0) importLog.push(`合并 ${mergedCount} 个自定义服务`);
			}
		}

		// 2. 基础设置
		if (isSelected('staticKeys') && data.staticKeys) {
			let updatedCount = 0;
			for (const [key, value] of Object.entries(data.staticKeys)) {
				if (value !== undefined) {
					let finalValue = value;
					if (key === 'transEngine' && serviceIdMap.has(value)) {
						finalValue = serviceIdMap.get(value);
					}
					if (key === 'from_lang' && (value === 'auto' || value === 'script_auto')) {
						finalValue = 'auto';
					}

					if (isOverwrite) {
						GM_setValue(key, finalValue);
						updatedCount++;
					} else {
						// 仅当本地为空或为默认值时才覆盖
						const localValue = GM_getValue(key);
						let defaultValue = undefined;
						if (DEFAULT_CONFIG.GENERAL.hasOwnProperty(key)) defaultValue = DEFAULT_CONFIG.GENERAL[key];
						else if (DEFAULT_CONFIG.ENGINE.hasOwnProperty(key)) defaultValue = DEFAULT_CONFIG.ENGINE[key];
						
						if (localValue === undefined || localValue === defaultValue) {
							GM_setValue(key, finalValue);
							updatedCount++;
						}
					}
				}
			}
			if (data.staticKeys.ao3_log_level !== undefined) Logger.setLevel(data.staticKeys.ao3_log_level);
			if (data.staticKeys.ao3_log_auto_clear !== undefined) Logger.setAutoClear(data.staticKeys.ao3_log_auto_clear);
			if (updatedCount > 0) importLog.push("基础设置已更新");
		}

		// 3. 内置服务 API Keys
		if (isSelected('apiKeys') && data.apiKeys) {
			const builtInServices = Object.keys(engineMenuConfig).filter(id => !id.startsWith('custom_') && id !== 'add_new_custom');
			let keysUpdated = false;

			if (isOverwrite) {
				builtInServices.forEach(id => {
					GM_deleteValue(`${id}_keys_string`);
					GM_deleteValue(`${id}_keys_array`);
					GM_deleteValue(`${id}_key_index`);
				});
			}

			for (const[key, value] of Object.entries(data.apiKeys)) {
				const isBuiltInKey = builtInServices.some(id => key.startsWith(id) && key.endsWith('_keys_string'));
				if (value !== undefined && isBuiltInKey) {
					if (isOverwrite) {
						GM_setValue(key, value);
						GM_setValue(key.replace('_keys_string', '_keys_array'), value.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean));
						keysUpdated = true;
					} else {
						const localValue = GM_getValue(key, '');
						const mergedKey = mergeApiKeys(localValue, value);
						if (mergedKey !== localValue) {
							GM_setValue(key, mergedKey);
							GM_setValue(key.replace('_keys_string', '_keys_array'), mergedKey.split(', '));
							keysUpdated = true;
						}
					}
				}
			}
			if (keysUpdated) importLog.push("内置服务 API Key 已更新");
		}

		// 4. 模型偏好
		if (isSelected('modelSelections') && data.modelSelections) {
			let hasCustomMappings = false;
			for (const [key, value] of Object.entries(data.modelSelections)) {
				if (value !== undefined) {
					if (isOverwrite || GM_getValue(key) === undefined) {
						GM_setValue(key, value);
						if (key.endsWith('_custom_model_mapping')) hasCustomMappings = true;
					}
				}
			}
			if (hasCustomMappings) importLog.push("内置服务自定义模型已导入");
		}

		// 5. 术语表
		if (isSelected('glossaries') && data.glossaries) {
			const g = data.glossaries;

			if (isOverwrite) {
				GM_setValue(CUSTOM_GLOSSARIES_KEY,[]);
				GM_setValue(IMPORTED_GLOSSARY_KEY, {});
				GM_setValue(GLOSSARY_METADATA_KEY, {});
				GM_setValue(ONLINE_GLOSSARY_ORDER_KEY,[]);
			}

			if (g.local || g.forbidden) {
				const existingLocal = GM_getValue(CUSTOM_GLOSSARIES_KEY,[]);
				existingLocal.push({
					id: `local_migrated_${Date.now()}`,
					name: '默认',
					sensitive: g.local || '',
					insensitive: '',
					forbidden: g.forbidden || '',
					enabled: true
				});
				GM_setValue(CUSTOM_GLOSSARIES_KEY, existingLocal);
				importLog.push("旧版术语表已迁移");
			}

			if (g.customGlossaries && Array.isArray(g.customGlossaries)) {
				const existingLocal = GM_getValue(CUSTOM_GLOSSARIES_KEY,[]);
				const existingNames = existingLocal.map(l => l.name);
				let localAdded = 0;
				
				g.customGlossaries.forEach(importedLocal => {
					const isDuplicate = !isOverwrite && existingLocal.some(local => 
						local.sensitive === importedLocal.sensitive && 
						local.insensitive === importedLocal.insensitive && 
						local.forbidden === importedLocal.forbidden
					);

					if (!isDuplicate) {
						const newId = `local_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
						if (data.uiState && data.uiState.localGlossarySelectedId === importedLocal.id) {
							data.uiState._mappedLocalId = newId;
						}
						
						let finalName = importedLocal.name;
						if (!isOverwrite) {
							finalName = generateUniqueName(importedLocal.name, existingNames);
							existingNames.push(finalName);
						}

						existingLocal.push({
							...importedLocal,
							id: newId,
							name: finalName
						});
						localAdded++;
					}
				});
				GM_setValue(CUSTOM_GLOSSARIES_KEY, existingLocal);
				if (localAdded > 0) importLog.push(`新增 ${localAdded} 个本地术语表`);
			}

			if (g.importedGlossaries) {
				const existingImported = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
				const mergedImported = isOverwrite ? g.importedGlossaries : { ...existingImported, ...g.importedGlossaries };
				GM_setValue(IMPORTED_GLOSSARY_KEY, mergedImported);
			}

			if (g.metadata || g.onlineMetadata) {
				const importedMeta = g.metadata || g.onlineMetadata;
				const existingMeta = GM_getValue(GLOSSARY_METADATA_KEY, {});
				
				if (isOverwrite) {
					GM_setValue(GLOSSARY_METADATA_KEY, importedMeta);
				} else {
					for (const [url, meta] of Object.entries(importedMeta)) {
						if (existingMeta[url] && existingMeta[url].enabled !== undefined) {
							meta.enabled = existingMeta[url].enabled;
						}
						existingMeta[url] = meta;
					}
					GM_setValue(GLOSSARY_METADATA_KEY, existingMeta);
				}
			}

			if (g.onlineOrder && Array.isArray(g.onlineOrder)) {
				if (isOverwrite) {
					GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, g.onlineOrder);
				} else {
					const currentOrder = GM_getValue(ONLINE_GLOSSARY_ORDER_KEY,[]);
					const currentSet = new Set(currentOrder);
					const newItems = g.onlineOrder.filter(url => !currentSet.has(url));
					GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, [...currentOrder, ...newItems]);
				}
			}
		}

		// 6. 替换规则
		const postReplaceSource = data.postReplace || data.glossaries;
		if (isSelected('postReplace') && postReplaceSource) {
			const pr = postReplaceSource;

			if (isOverwrite) {
				GM_setValue(POST_REPLACE_RULES_KEY,[]);
			}

			if (pr.postReplaceRules && Array.isArray(pr.postReplaceRules)) {
				const existingRules = GM_getValue(POST_REPLACE_RULES_KEY,[]);
				const existingNames = existingRules.map(r => r.name);
				let rulesAdded = 0;
				
				pr.postReplaceRules.forEach(importedRule => {
					const isDuplicate = !isOverwrite && existingRules.some(rule => rule.content === importedRule.content);
					
					if (!isDuplicate) {
						const newId = `replace_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
						if (data.uiState && data.uiState.postReplaceSelectedId === importedRule.id) {
							data.uiState._mappedReplaceId = newId;
						}
						
						let finalName = importedRule.name;
						if (!isOverwrite) {
							finalName = generateUniqueName(importedRule.name, existingNames);
							existingNames.push(finalName);
						}

						existingRules.push({
							...importedRule,
							id: newId,
							name: finalName
						});
						rulesAdded++;
					}
				});
				GM_setValue(POST_REPLACE_RULES_KEY, existingRules);
				if (rulesAdded > 0) importLog.push(`新增 ${rulesAdded} 个替换规则`);
			}

			// 兼容极早期版本的替换规则字符串
			let importedPostReplaceString = '';
			if (typeof pr.postReplaceString === 'string' && pr.postReplaceString.trim()) {
				importedPostReplaceString = pr.postReplaceString;
			} else if (pr.postReplace && typeof pr.postReplace === 'object') {
				const parts =[];
				if (pr.postReplace.singleRules) {
					Object.entries(pr.postReplace.singleRules).forEach(([k, v]) => parts.push(`${k}:${v}`));
				}
				if (Array.isArray(pr.postReplace.multiPartRules)) {
					pr.postReplace.multiPartRules.forEach(r => {
						if (r.source && r.target) parts.push(`${r.source}=${r.target}`);
					});
				}
				importedPostReplaceString = parts.join('，');
			} else if (typeof pr.postReplace === 'string') {
				importedPostReplaceString = pr.postReplace;
			}

			if (importedPostReplaceString) {
				const defaultRule = {
					id: `replace_legacy_${Date.now()}`,
					name: '默认',
					content: importedPostReplaceString,
					enabled: true
				};
				const currentRules = GM_getValue(POST_REPLACE_RULES_KEY, []);
				currentRules.push(defaultRule);
				GM_setValue(POST_REPLACE_RULES_KEY, currentRules);
				importLog.push("旧版替换规则已转换为新规则");
			}
		}

		// 7. AI 参数配置
		if (isSelected('aiParameters') && data.aiParameters) {
			const legacyKeys =[
				'custom_ai_system_prompt', 'custom_ai_user_prompt', 'custom_ai_temperature',
				'custom_ai_chunk_size', 'custom_ai_para_limit', 'custom_ai_request_rate',
				'custom_ai_request_capacity', 'custom_ai_lazy_load_margin',
				'custom_ai_validation_thresholds', 'ao3_ai_param_last_action'
			];

			for (const key of legacyKeys) {
				const value = data.aiParameters[key];
				if (value !== undefined) {
					let finalValue = value;
					if (key === 'custom_ai_system_prompt' && typeof value === 'string' && value.includes('${')) {
						finalValue = value.replace(/\$\{/g, '{');
					}
					GM_setValue(key, finalValue);
				}
			}

			const importedProfiles = data.aiParameters[AI_PROFILES_KEY];
			if (importedProfiles && Array.isArray(importedProfiles)) {
				if (serviceIdMap.size > 0) {
					importedProfiles.forEach(profile => {
						if (profile.services && Array.isArray(profile.services)) {
							profile.services = profile.services.map(oldId => serviceIdMap.get(oldId) || oldId);
						}
					});
				}

				if (isOverwrite) {
					GM_setValue(AI_PROFILES_KEY, importedProfiles);
					importLog.push("AI 参数配置已覆盖");
				} else {
					const currentProfiles = GM_getValue(AI_PROFILES_KEY,[]);
					const existingNames = currentProfiles.map(p => p.name);
					let addedCount = 0;

					importedProfiles.forEach(importedProfile => {
						const isDuplicate = currentProfiles.some(p => deepEqual(p.params, importedProfile.params));
						
						if (!isDuplicate) {
							let finalName = generateUniqueName(importedProfile.name, existingNames);
							existingNames.push(finalName);

							importedProfile.id = `profile_imp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
							importedProfile.name = finalName;
							importedProfile.isProtected = false; 
							
							currentProfiles.push(importedProfile);
							addedCount++;
						}
					});
					GM_setValue(AI_PROFILES_KEY, currentProfiles);
					if (addedCount > 0) importLog.push(`新增 ${addedCount} 个 AI 参数配置`);
				}
			}
		}

		// 8. UI 状态
		if (isSelected('uiState') && data.uiState) {
			if (data.uiState.fabPosition) GM_setValue('ao3_fab_position', data.uiState.fabPosition);
			if (data.uiState.panelPosition) GM_setValue('ao3_panel_position', data.uiState.panelPosition);

			if (data.uiState.panelHasOpened !== undefined) GM_setValue('panel_has_been_opened_once', data.uiState.panelHasOpened);
			if (data.uiState.exportSelection) GM_setValue('ao3_export_selection_memory', data.uiState.exportSelection);

			if (data.uiState._mappedLocalId) GM_setValue('ao3_local_glossary_selected_id', data.uiState._mappedLocalId);
			else if (data.uiState.localGlossarySelectedId) GM_setValue('ao3_local_glossary_selected_id', data.uiState.localGlossarySelectedId);

			if (data.uiState.localGlossaryEditMode) GM_setValue('ao3_local_glossary_edit_mode', data.uiState.localGlossaryEditMode);

			if (data.uiState._mappedReplaceId) GM_setValue('ao3_post_replace_selected_id', data.uiState._mappedReplaceId);
			else if (data.uiState.postReplaceSelectedId) GM_setValue('ao3_post_replace_selected_id', data.uiState.postReplaceSelectedId);

			if (data.uiState.postReplaceEditMode) GM_setValue('ao3_post_replace_edit_mode', data.uiState.postReplaceEditMode);

			if (data.uiState.fabManageMode) GM_setValue('ao3_fab_manage_mode', data.uiState.fabManageMode);
			if (data.uiState.fabManageGesture) GM_setValue('ao3_fab_manage_gesture', data.uiState.fabManageGesture);

			if (data.uiState.formattingLastProp) GM_setValue('formatting_last_prop', data.uiState.formattingLastProp);
			if (data.uiState.logModalFilter) GM_setValue('ao3_log_modal_filter', data.uiState.logModalFilter);
			if (data.uiState.exportLastFormat) GM_setValue('ao3_export_last_format', data.uiState.exportLastFormat);
			if (data.uiState.exportLastAction) GM_setValue('ao3_export_last_action', data.uiState.exportLastAction);
			if (data.uiState.hasSwitchedToFullPageOnce !== undefined) GM_setValue('has_switched_to_full_page_once', data.uiState.hasSwitchedToFullPageOnce);

			if (data.uiState.cacheManageMode) GM_setValue('ao3_cache_manage_mode', data.uiState.cacheManageMode);

			if (data.uiState.serviceCollapsedStates) {
				for (const [sId, isCollapsed] of Object.entries(data.uiState.serviceCollapsedStates)) {
					let targetId = sId;
					if (serviceIdMap.has(sId)) {
						targetId = serviceIdMap.get(sId);
					} else if (sId.startsWith('custom_')) {
						continue;
					}
					GM_setValue(`service_collapsed_${targetId}`, isCollapsed);
				}
			}
		}

		// 9. 屏蔽规则
		if (isSelected('blockerSettings') && data.blockerSettings) {
			const bData = data.blockerSettings;
			const listKeys =[
				'ao3_blocker_tags_black', 'ao3_blocker_tags_white',
				'ao3_blocker_content_author', 'ao3_blocker_content_title',
				'ao3_blocker_content_summary', 'ao3_blocker_content_id',
				'ao3_blocker_adv_pairing', 'ao3_blocker_adv_char',
				'ao3_blocker_adv_lang'
			];

			let blockerUpdated = false;

			for (const [key, value] of Object.entries(bData)) {
				if (!BLOCKER_KEYS.includes(key)) continue;

				if (isOverwrite) {
					GM_setValue(key, value);
					blockerUpdated = true;
				} else {
					if (listKeys.includes(key) && typeof value === 'string') {
						const localVal = GM_getValue(key, '');

						const getItems = (str) => {
							if (!str) return new Set();
							return new Set(tokenizeQuoteAware(normalizeBlockerInput(str), [',']).map(t => t.value).filter(Boolean));
						};

						const localSet = getItems(localVal);
						const importItems = tokenizeQuoteAware(normalizeBlockerInput(value), [',']).map(t => t.value).filter(Boolean);

						const newItems = importItems.filter(item => !localSet.has(item));

						if (newItems.length > 0) {
							const separator = ", ";
							const prefix = (localVal && !/[,，]\s*$/.test(localVal)) ? separator : '';

							const processedNewItems = newItems.map(item => {
								if (item.includes(',') && !((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'")))) {
									return `"${item}"`;
								}
								return item;
							});

							GM_setValue(key, localVal + prefix + processedNewItems.join(separator));
							blockerUpdated = true;
						}
					} else {
						const localVal = GM_getValue(key);
						const defaultKey = key.replace('ao3_blocker_', '');
						const defaultVal = DEFAULT_CONFIG.BLOCKER[defaultKey];
						
						if (localVal === undefined || localVal === defaultVal || localVal === '') {
							GM_setValue(key, value);
							blockerUpdated = true;
						}
					}
				}
			}
			if (blockerUpdated) importLog.push("屏蔽规则已更新");
		}

		// 10. 文章格式方案
		if (isSelected('formatting') && data.formatting) {
			const fData = data.formatting;
			const importedProfiles = fData[FORMATTING_PROFILES_KEY];
			
			if (importedProfiles && Array.isArray(importedProfiles)) {
				if (isOverwrite) {
					GM_setValue(FORMATTING_PROFILES_KEY, importedProfiles);
					if (fData[FORMATTING_SELECTED_ID_KEY] !== undefined) {
						GM_setValue(FORMATTING_SELECTED_ID_KEY, fData[FORMATTING_SELECTED_ID_KEY]);
					}
					importLog.push("文章格式设置已覆盖");
				} else {
					const currentProfiles = GM_getValue(FORMATTING_PROFILES_KEY,[]);
					const existingNames = currentProfiles.map(p => p.name);
					let addedCount = 0;

					importedProfiles.forEach(importedProfile => {
						// 深度比对参数，完全一致则视为重复，跳过导入
						const isDuplicate = currentProfiles.some(p => deepEqual(p.params, importedProfile.params));
						
						if (!isDuplicate) {
							let finalName = generateUniqueName(importedProfile.name, existingNames);
							existingNames.push(finalName);

							importedProfile.id = `fmt_imp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
							importedProfile.name = finalName;
							
							currentProfiles.push(importedProfile);
							addedCount++;
						}
					});
					GM_setValue(FORMATTING_PROFILES_KEY, currentProfiles);
					if (addedCount > 0) importLog.push(`新增 ${addedCount} 个文章格式方案`);
				}
			}
		}

		// 11. 悬浮按钮操作项
		if (isSelected('fabActions') && data.fabActions) {
			if (isOverwrite || GM_getValue('ao3_fab_actions') === undefined) {
				GM_setValue('ao3_fab_actions', data.fabActions);
				importLog.push("悬浮按钮操作项已导入");
			}
		}

		// 12. 导出模板与样式
		if (isSelected('exportTemplates') && data.exportTemplates) {
			const eData = data.exportTemplates;
			const importedTemplates = eData.templates;
			
			if (importedTemplates && typeof importedTemplates === 'object') {
				if (isOverwrite) {
					GM_setValue('ao3_export_templates', importedTemplates);
					if (eData.selected) GM_setValue('ao3_export_selected_templates', eData.selected);
					importLog.push("导出模板已覆盖");
				} else {
					const currentTemplates = GM_getValue('ao3_export_templates', ExportTemplateStore.DEFAULT_TEMPLATES);
					let addedCount = 0;

					['html', 'epub', 'pdf'].forEach(format => {
						if (importedTemplates[format] && Array.isArray(importedTemplates[format])) {
							if (!currentTemplates[format]) currentTemplates[format] = [];
							const existingNames = currentTemplates[format].map(t => t.name);
							
							importedTemplates[format].forEach(importedTpl => {
								// 跳过默认模板的导入，防止覆盖内置默认模板
								if (importedTpl.isProtected) return;
								
								// 通过 CSS 内容比对去重
								const isDuplicate = currentTemplates[format].some(t => t.css === importedTpl.css);
								if (!isDuplicate) {
									let finalName = generateUniqueName(importedTpl.name, existingNames);
									existingNames.push(finalName);
									
									importedTpl.id = `template_imp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
									importedTpl.name = finalName;
									
									currentTemplates[format].push(importedTpl);
									addedCount++;
								}
							});
						}
					});
					GM_setValue('ao3_export_templates', currentTemplates);
					if (addedCount > 0) importLog.push(`新增 ${addedCount} 个导出模板`);
				}
			}
		}

		// 13. 缓存清理策略
		if (isSelected('cacheSettings') && data.cacheSettings) {
			const cData = data.cacheSettings;
			if (cData.autoCleanupEnabled !== undefined) GM_setValue('ao3_cache_auto_cleanup_enabled', cData.autoCleanupEnabled);
			if (cData.maxItems !== undefined) GM_setValue('ao3_cache_max_items', cData.maxItems);
			if (cData.maxDays !== undefined) GM_setValue('ao3_cache_max_days', cData.maxDays);
			importLog.push("缓存清理策略已导入");
		}

		// 统一激活所有数据和状态
		SettingsSyncManager.syncAll();

		const newMode = GM_getValue('ao3_translation_mode', 'unit');
		const newTransDesc = GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
		const newAutoTranslate = GM_getValue('ao3_auto_translate', false);
		
		if (oldMode !== newMode || oldTransDesc !== newTransDesc || oldAutoTranslate !== newAutoTranslate) {
			document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.MODE_CHANGED, { detail: { mode: newMode } }));
		}

		// 14. 后台同步在线术语表
		let syncSummary = "";
		if (isSelected('glossaries')) {
			const importedUrls = Object.keys(
				data.glossaries?.importedGlossaries ||
				data.glossaries?.metadata ||
				data.glossaries?.onlineMetadata ||
				{}
			);

			if (importedUrls.length > 0) {
				setTimeout(async () => {
					let successCount = 0;
					for (const url of importedUrls) {
						const res = await importOnlineGlossary(url, { silent: true });
						if (res.success) successCount++;
						await sleep(500); 
					}
					if (successCount > 0) {
						Logger.info('Data', `后台同步了 ${successCount} 个在线术语表`);
					}
				}, 1000);
				
				syncSummary = `\n已触发 ${importedUrls.length} 个在线术语表的后台同步。`;
			}
		}

		const modeText = isOverwrite ? "覆盖" : "合并";
		const finalMessage = importLog.length > 0 ? `${modeText}导入完成：${importLog.join('，')}。` : "数据导入完成。";
		return { success: true, message: finalMessage + syncSummary };
	}

	/**
	 * 数据清洗逻辑：格式化所有 API Keys
	 */
	function normalizeAllApiKeys() {
		const allServiceIds =[
			...Object.keys(engineMenuConfig),
			...GM_getValue(CUSTOM_SERVICES_LIST_KEY, []).map(s => s.id)
		];
		for (const serviceId of new Set(allServiceIds)) {
			if (serviceId === 'google_translate' || serviceId === 'bing_translator' || serviceId === ADD_NEW_CUSTOM_SERVICE_ID) continue;
			const stringKey = `${serviceId}_keys_string`;
			const arrayKey = `${serviceId}_keys_array`;
			const keysString = GM_getValue(stringKey);
			if (typeof keysString === 'string') {
				const keysArray = keysString.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
				GM_setValue(arrayKey, keysArray);
			}
		}
		Logger.info('System', 'API Keys 格式化校验完成');
	}

	/**
	 * 同步管理器：按需触发各模块的刷新与重绘
	 */
	const SettingsSyncManager = {
		sync(options = {}) {
			if (options.glossary) invalidateGlossaryCache();
			if (options.blocker) refreshBlocker(options.blocker === true ? 'full' : options.blocker);
			if (options.formatting) applyFormatting();
			if (options.displayMode) applyDisplayModeChange(GM_getValue('translation_display_mode', 'bilingual'));
			if (options.ui) document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.PANEL_STATE_SYNC));
		},
		syncGlossary(updateUI = true) {
			this.sync({ glossary: true, ui: updateUI });
		},
		syncBlocker(mode = 'full') {
			this.sync({ blocker: mode });
		},
		syncFormatting() {
			this.sync({ formatting: true });
		},
		syncUI() {
			this.sync({ ui: true });
		},
		syncAll() {
			normalizeAllApiKeys();
			this.sync({ glossary: true, blocker: 'full', formatting: true, displayMode: true, ui: true });
		}
	};

	/**
	 * 设置面板的结构
	 */
	function createSettingsPanelUI() {
		const existing = shadowWrapper.querySelector('#ao3-trans-settings-panel');
		if (existing) {
			return {
				panel: existing,
				closeBtn: existing.querySelector('.settings-panel-close-btn'),
				header: existing.querySelector('.settings-panel-header'),
				masterSwitch: existing.querySelector('#setting-master-switch'),
				swapLangBtn: existing.querySelector('#swap-lang-btn'),
				engineSelect: existing.querySelector('#setting-trans-engine'),
				serviceDetailsToggleContainer: existing.querySelector('#service-details-toggle-container'),
				serviceDetailsToggleBtn: existing.querySelector('.service-details-toggle-btn'),
				fromLangSelect: existing.querySelector('#setting-from-lang'),
				toLangSelect: existing.querySelector('#setting-to-lang'),
				modelGroup: existing.querySelector('#setting-model-group'),
				modelSelect: existing.querySelector('#setting-trans-model'),
				displayModeSelect: existing.querySelector('#setting-display-mode'),
				apiKeyGroup: existing.querySelector('#api-key-group'),
				apiKeyInput: existing.querySelector('#setting-input-apikey'),
				apiKeySaveBtn: existing.querySelector('#setting-btn-apikey-save'),
				customServiceContainer: existing.querySelector('#custom-service-container'),
				glossaryActionsSelect: existing.querySelector('#setting-glossary-actions'),
				editableSections: existing.querySelectorAll('.editable-section'),
				aiSettingsSection: existing.querySelector('#editable-section-ai-settings'),
				aiProfileSelect: existing.querySelector('#ai-profile-select'),
				aiServiceTrigger: existing.querySelector('#ai-service-association-trigger'),
				aiParamSelect: existing.querySelector('#ai-param-select'),
				aiParamInputArea: existing.querySelector('#ai-param-input-area'),
				langDetectSection: existing.querySelector('#editable-section-lang-detect'),
				langDetectSelect: existing.querySelector('#setting-lang-detector'),
				localManageSection: existing.querySelector('#editable-section-local-manage'),
				localGlossarySelect: existing.querySelector('#setting-local-glossary-select'),
				localEditModeSelect: existing.querySelector('#setting-local-edit-mode'),
				localContainerName: existing.querySelector('#local-edit-container-name'),
				localContainerTranslation: existing.querySelector('#local-edit-container-translation'),
				localContainerForbidden: existing.querySelector('#local-edit-container-forbidden'),
				localGlossaryNameInput: existing.querySelector('#setting-local-glossary-name'),
				localGlossarySaveNameBtn: existing.querySelector('#setting-btn-local-glossary-save-name'),
				localSensitiveInput: existing.querySelector('#setting-input-local-sensitive'),
				localSensitiveSaveBtn: existing.querySelector('#setting-btn-local-sensitive-save'),
				localInsensitiveInput: existing.querySelector('#setting-input-local-insensitive'),
				localInsensitiveSaveBtn: existing.querySelector('#setting-btn-local-insensitive-save'),
				localForbiddenInput: existing.querySelector('#setting-input-local-forbidden'),
				localForbiddenSaveBtn: existing.querySelector('#setting-btn-local-forbidden-save'),
				onlineManageSection: existing.querySelector('#editable-section-online-manage'),
				glossaryImportUrlInput: existing.querySelector('#setting-input-glossary-import-url'),
				glossaryImportSaveBtn: existing.querySelector('#setting-btn-glossary-import-save'),
				glossaryManageSelect: existing.querySelector('#setting-select-glossary-manage'),
				glossaryManageDetailsContainer: existing.querySelector('#online-glossary-details-container'),
				glossaryManageInfo: existing.querySelector('#online-glossary-info'),
				glossaryManageDeleteBtn: existing.querySelector('#online-glossary-delete-btn'),
				openOnlineLibraryBtn: existing.querySelector('#btn-open-online-library'),
				viewImportedGlossaryContainer: existing.querySelector('#view-imported-glossary-container'),
				viewImportedGlossaryBtn: existing.querySelector('#btn-view-imported-glossary'),
				postReplaceSection: existing.querySelector('#editable-section-post-replace'),
				postReplaceSelect: existing.querySelector('#setting-post-replace-select'),
				postReplaceEditModeSelect: existing.querySelector('#setting-post-replace-edit-mode'),
				postReplaceContainerName: existing.querySelector('#post-replace-container-name'),
				postReplaceContainerSettings: existing.querySelector('#post-replace-container-settings'),
				postReplaceNameInput: existing.querySelector('#setting-post-replace-name'),
				postReplaceSaveNameBtn: existing.querySelector('#setting-btn-post-replace-save-name'),
				postReplaceInput: existing.querySelector('#setting-input-post-replace'),
				postReplaceSaveBtn: existing.querySelector('#setting-btn-post-replace-save'),
				dataSyncActionsContainer: existing.querySelector('#data-sync-actions-container'),
				debugModeSection: existing.querySelector('#editable-section-debug-mode'),
				logLevelSelect: existing.querySelector('#setting-log-level'),
				viewLogsBtn: existing.querySelector('#btn-view-logs'),
				logAutoClearSelect: existing.querySelector('#setting-log-auto-clear'),
				importDataBtn: existing.querySelector('#btn-import-data'),
				exportDataBtn: existing.querySelector('#btn-export-data'),
				blockerSection: existing.querySelector('#editable-section-blocker'),
				blockerDimensionSelect: existing.querySelector('#blocker-dimension-select'),
				blockerSubDimensionSelect: existing.querySelector('#blocker-sub-dimension-select'),
				blockerInputArea: existing.querySelector('#blocker-input-area'),
				blockerActionsContainer: existing.querySelector('#blocker-actions-container'),
				toggleBlockerBtn: existing.querySelector('#btn-toggle-blocker'),
				toggleReasonsBtn: existing.querySelector('#btn-toggle-reasons'),
				formattingSection: existing.querySelector('#editable-section-formatting'),
				fmtProfileSelect: existing.querySelector('#setting-fmt-profile'),
				fmtPropertySelect: existing.querySelector('#setting-fmt-property'),
				fmtValueContainer: existing.querySelector('#setting-fmt-value-container'),
			};
		}

		const panel = document.createElement('div');
		panel.id = 'ao3-trans-settings-panel';
		const scriptVersion = GM_info.script.version.split('-')[0];

		panel.innerHTML = `
			<div class="settings-panel-header">
				<div class="settings-panel-header-title">
					<a href="https://github.com/V-Lipset/ao3-chinese" target="_blank" class="home-icon-link" title="访问项目主页">
						${SVG_ICONS.home}
					</a>
					<h2>AO3 Translator v${scriptVersion}</h2>
				</div>
				<span class="settings-panel-close-btn" title="关闭">&times;</span>
			</div>
			<div class="settings-panel-body">
				<div class="settings-switch-group">
					<span class="settings-label">显示翻译按钮</span>
					<label class="settings-switch">
						<input type="checkbox" id="setting-master-switch">
						<span class="slider"></span>
					</label>
				</div>

				<div class="language-swap-container">
					<div class="settings-group settings-group-select">
						<select id="setting-from-lang" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-from-lang" class="settings-label">原文语言</label>
					</div>
					<button id="swap-lang-btn" title="互换">⇄</button>
					<div class="settings-group settings-group-select">
						<select id="setting-to-lang" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-to-lang" class="settings-label">目标语言</label>
					</div>
				</div>

				<div class="settings-group settings-group-select">
					<select id="setting-display-mode" class="settings-control settings-select custom-styled-select">
						<option value="bilingual">双语对照</option>
						<option value="translation_only">仅译文</option>
					</select>
					<label for="setting-display-mode" class="settings-label">显示模式</label>
				</div>

				<div class="settings-group settings-group-select">
					<select id="setting-trans-engine" class="settings-control settings-select custom-styled-select"></select>
					<label for="setting-trans-engine" class="settings-label">翻译服务</label>
				</div>

				<div id="service-details-toggle-container" class="service-details-toggle-container" style="display: none;">
					<div class="service-details-toggle-btn"></div>
				</div>

				<div id="custom-service-container" style="display: none; flex-direction: column; gap: 16px;"></div>

				<div class="settings-group settings-group-select" id="setting-model-group" style="display: none;">
					<select id="setting-trans-model" class="settings-control settings-select custom-styled-select"></select>
					<label for="setting-trans-model" class="settings-label">使用模型</label>
				</div>

				<div class="settings-group static-label" id="api-key-group">
					<div class="input-wrapper">
						<input type="text" id="setting-input-apikey" class="settings-control settings-input" spellcheck="false">
						<label for="setting-input-apikey" class="settings-label">设置 API Key</label>
						<button id="setting-btn-apikey-save" class="settings-action-button-inline">保存</button>
					</div>
				</div>

				<div class="settings-group static-label settings-group-select">
					<select id="setting-glossary-actions" class="settings-control settings-select custom-styled-select">
						<option value="">请选择一个功能</option>
						<option value="local_manage">设置本地术语表</option>
						<option value="online_manage">管理在线术语表</option>
						<option value="post_replace">译文后处理替换</option>
						<option value="ai_settings">翻译参数自定义</option>
						<option value="lang_detect">原文语言检测项</option>
						<option value="blocker_manage">作品屏蔽配置项</option>
						<option value="formatting">文章格式调整项</option>
						<option value="export_manage">作品导出与生成</option>
						<option value="cache_manage">翻译缓存管理项</option>
						<option value="fab_manage">悬浮按钮操作项</option>
						<option value="data_sync">数据导入与导出</option>
						<option value="debug_mode">调试模式与日志</option>
					</select>
					<label for="setting-glossary-actions" class="settings-label">更多功能</label>
				</div>

				<div id="editable-section-debug-mode" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="setting-log-level" class="settings-control settings-select custom-styled-select">
							<option value="ALL">ALL</option>
							<option value="INFO">INFO</option>
							<option value="WARN">WARN</option>
							<option value="ERROR">ERROR</option>
							<option value="OFF">OFF</option>
						</select>
						<label for="setting-log-level" class="settings-label">日志级别</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<div id="btn-view-logs" class="settings-control settings-select pseudo-select">查看实时日志</div>
						<span class="settings-label">查看日志</span>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="setting-log-auto-clear" class="settings-control settings-select custom-styled-select">
							<option value="1">1 天</option>
							<option value="3">3 天</option>
							<option value="7">7 天</option>
						</select>
						<label for="setting-log-auto-clear" class="settings-label">自动清理</label>
					</div>
				</div>

				<div id="data-sync-actions-container" class="data-sync-actions-container" style="display: none;">
					<button id="btn-import-data" class="data-sync-action-btn">数据导入</button>
					<button id="btn-export-data" class="data-sync-action-btn">数据导出</button>
				</div>

				<div id="editable-section-ai-settings" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="ai-profile-select" class="settings-control settings-select custom-styled-select"></select>
						<label for="ai-profile-select" class="settings-label">参数配置</label>
					</div>

					<div class="settings-group static-label settings-group-select">
						<div id="ai-service-association-trigger" class="settings-control settings-select pseudo-select">关联翻译服务</div>
						<span class="settings-label">翻译服务</span>
					</div>

					<div class="settings-group static-label settings-group-select">
						<select id="ai-param-select" class="settings-control settings-select custom-styled-select">
							<option value="system_prompt">System Prompt</option>
							<option value="user_prompt">User Prompt</option>
							<option value="temperature">Temperature</option>
							<option value="reasoning_effort">推理深度</option>
							<option value="chunk_size">每次翻译文本量</option>
							<option value="para_limit">每次翻译段落数</option>
							<option value="request_rate">平均每秒请求数</option>
							<option value="request_capacity">最大突发请求数</option>
							<option value="lazy_load_margin">懒加载参数设置</option>
							<option value="validation_thresholds">占位符校验阈值</option>
						</select>
						<label for="ai-param-select" class="settings-label">参数选择</label>
					</div>
					<div id="ai-param-input-area"></div>
				</div>

				<div id="editable-section-formatting" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group settings-group-select static-label">
						<select id="setting-fmt-profile" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-fmt-profile" class="settings-label">格式方案</label>
					</div>
					<div class="settings-group settings-group-select static-label">
						<select id="setting-fmt-property" class="settings-control settings-select custom-styled-select">
							<option value="letterSpacing">字间距</option>
							<option value="lineHeight">行间距</option>
							<option value="margins">页边距</option>
							<option value="fontSize">文字大小</option>
							<option value="indent">首行缩进</option>
							<option value="profileName">方案名称</option>
							<option value="deleteProfile">删除方案</option>
						</select>
						<label for="setting-fmt-property" class="settings-label">调整项目</label>
					</div>
					<div id="setting-fmt-value-container"></div>
				</div>

				<div id="editable-section-export-manage" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="export-format-select" class="settings-control settings-select custom-styled-select">
							<option value="html">HTML</option>
							<option value="epub">EPUB</option>
							<option value="pdf">PDF</option>
						</select>
						<label for="export-format-select" class="settings-label">文件格式</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="export-template-select" class="settings-control settings-select custom-styled-select"></select>
						<label for="export-template-select" class="settings-label">当前模板</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="export-action-select" class="settings-control settings-select custom-styled-select">
							<option value="name">模板名称</option>
							<option value="edit">样式编辑</option>
							<option value="delete">删除模板</option>
						</select>
						<label for="export-action-select" class="settings-label">模板管理</label>
					</div>
					<div id="export-container-name" class="settings-group static-label">
						<div class="input-wrapper">
							<input type="text" id="export-template-name" class="settings-control settings-input" placeholder="模板名称" spellcheck="false">
							<label for="export-template-name" class="settings-label">模板名称</label>
							<button id="btn-export-save-name" class="settings-action-button-inline">保存</button>
						</div>
					</div>
					<div id="export-container-edit" class="settings-group static-label settings-group-select" style="display: none;">
						<div id="btn-open-style-editor" class="settings-control settings-select pseudo-select">打开样式编辑器</div>
						<span class="settings-label">样式编辑</span>
					</div>
				</div>

				<div id="export-actions-container" class="data-sync-actions-container" style="display: none;">
					<button id="btn-export-format-choose" class="data-sync-action-btn">格式选择</button>
					<button id="btn-export-execute" class="data-sync-action-btn">导出文件</button>
				</div>

				<div id="editable-section-cache-manage" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="cache-manage-mode-select" class="settings-control settings-select custom-styled-select">
							<option value="manual">手动清理</option>
							<option value="auto">自动清理</option>
						</select>
						<label for="cache-manage-mode-select" class="settings-label">清理模式</label>
					</div>

					<div id="cache-manage-manual-container" style="display: flex; flex-direction: column; gap: 16px;">
						<div class="settings-group static-label settings-group-select">
							<div id="btn-clear-current-page-cache" class="settings-control settings-select pseudo-select">当前页面缓存</div>
							<span class="settings-label">清除缓存</span>
						</div>
						<div class="settings-group static-label settings-group-select">
							<div id="btn-clear-all-cache" class="settings-control settings-select pseudo-select">所有翻译缓存</div>
							<span class="settings-label">清除缓存</span>
						</div>
					</div>

					<div id="cache-manage-auto-container" style="display: none; flex-direction: column; gap: 16px;">
						<div class="settings-group static-label settings-group-select">
							<select id="setting-cache-auto-cleanup-enabled" class="settings-control settings-select custom-styled-select">
								<option value="true">启用</option>
								<option value="false">禁用</option>
							</select>
							<label for="setting-cache-auto-cleanup-enabled" class="settings-label">自动清理状态</label>
						</div>
						<div class="settings-group static-label">
							<div class="input-wrapper">
								<input type="number" id="setting-input-cache-max-items" class="settings-control settings-input" placeholder="100000" spellcheck="false">
								<label for="setting-input-cache-max-items" class="settings-label">最大缓存条目</label>
								<button id="setting-btn-cache-max-items-save" class="settings-action-button-inline">保存</button>
							</div>
						</div>
						<div class="settings-group static-label">
							<div class="input-wrapper">
								<input type="number" id="setting-input-cache-max-days" class="settings-control settings-input" placeholder="30" spellcheck="false">
								<label for="setting-input-cache-max-days" class="settings-label">超过 n 天未访问</label>
								<button id="setting-btn-cache-max-days-save" class="settings-action-button-inline">保存</button>
							</div>
						</div>
					</div>

					<div id="cache-manage-details-container">
						<div class="online-glossary-details" style="justify-content: flex-start;">
							<span id="cache-count-display">已缓存：计算中...</span>
						</div>
					</div>
				</div>

				<div id="editable-section-fab-manage" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="fab-manage-mode-select" class="settings-control settings-select custom-styled-select">
							<option value="unit">单元翻译模式</option>
							<option value="full_page">整页翻译模式</option>
						</select>
						<label for="fab-manage-mode-select" class="settings-label">翻译模式</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="fab-manage-gesture-select" class="settings-control settings-select custom-styled-select">
							<option value="click">单击</option>
							<option value="double_click">双击</option>
							<option value="long_press">长按</option>
							<option value="right_click">右击</option>
						</select>
						<label for="fab-manage-gesture-select" class="settings-label">操作手势</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="fab-manage-action-select" class="settings-control settings-select custom-styled-select">
							<option value="toggle_panel">打开/关闭设置面板</option>
							<option value="toggle_translate">触发翻译/清除译文</option>
							<option value="clear_cache">清除当前页面缓存</option>
							<option value="export_work">导出当前作品</option>
							<option value="none">无操作</option>
						</select>
						<label for="fab-manage-action-select" class="settings-label">交互逻辑</label>
					</div>
				</div>

				<div id="editable-section-lang-detect" class="settings-group static-label editable-section">
					<div class="settings-group settings-group-select">
						<select id="setting-lang-detector" class="settings-control settings-select custom-styled-select">
							<option value="franc">Franc</option>
							<option value="microsoft">Microsoft</option>
							<option value="google">Google</option>
							<option value="tencent">Tencent</option>
							<option value="baidu">Baidu</option>
						</select>
						<label for="setting-lang-detector" class="settings-label">语言检测引擎</label>
					</div>
				</div>

				<div id="editable-section-local-manage" class="editable-section" style="display: none;">
					<div class="settings-group settings-group-select static-label">
						<select id="setting-local-glossary-select" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-local-glossary-select" class="settings-label">当前术语表</label>
					</div>
					<div class="settings-group settings-group-select static-label">
						<select id="setting-local-edit-mode" class="settings-control settings-select custom-styled-select">
							<option value="name">术语表名称</option>
							<option value="translation">翻译术语表</option>
							<option value="forbidden">禁翻术语表</option>
							<option value="delete">删除术语表</option>
						</select>
						<label for="setting-local-edit-mode" class="settings-label">本地术语表</label>
					</div>
					<div id="local-edit-container-name" class="settings-group static-label">
						<div class="input-wrapper">
							<input type="text" id="setting-local-glossary-name" class="settings-control settings-input" placeholder="术语表名称" spellcheck="false">
							<label for="setting-local-glossary-name" class="settings-label">术语表名称</label>
							<button id="setting-btn-local-glossary-save-name" class="settings-action-button-inline">保存</button>
						</div>
					</div>
					<div id="local-edit-container-translation" style="display: none;">
						<div class="settings-group static-label">
							<div class="input-wrapper">
								<input type="text" id="setting-input-local-sensitive" class="settings-control settings-input" placeholder="原文1：译文1，原文2：译文2" spellcheck="false">
								<label for="setting-input-local-sensitive" class="settings-label">区分大小写</label>
								<button id="setting-btn-local-sensitive-save" class="settings-action-button-inline">保存</button>
							</div>
						</div>
						<div class="settings-group static-label">
							<div class="input-wrapper">
								<input type="text" id="setting-input-local-insensitive" class="settings-control settings-input" placeholder="原文1：译文1，原文2：译文2" spellcheck="false">
								<label for="setting-input-local-insensitive" class="settings-label">不区分大小写</label>
								<button id="setting-btn-local-insensitive-save" class="settings-action-button-inline">保存</button>
							</div>
						</div>
					</div>
					<div id="local-edit-container-forbidden" class="settings-group static-label" style="display: none;">
						<div class="input-wrapper">
							<input type="text" id="setting-input-local-forbidden" class="settings-control settings-input" placeholder="原文1，原文2，原文3，原文4" spellcheck="false">
							<label for="setting-input-local-forbidden" class="settings-label">区分大小写</label>
							<button id="setting-btn-local-forbidden-save" class="settings-action-button-inline">保存</button>
						</div>
					</div>
				</div>

				<div id="editable-section-online-manage" class="editable-section" style="display: none;">
					<div class="settings-group static-label">
						<div class="input-wrapper">
							<input type="text" id="setting-input-glossary-import-url" class="settings-control settings-input" placeholder="请输入 GitHub/jsDelivr 链接" spellcheck="false">
							<label for="setting-input-glossary-import-url" class="settings-label">导入在线术语表</label>
							<button id="setting-btn-glossary-import-save" class="settings-action-button-inline">导入</button>
						</div>
					</div>
					<div class="settings-group static-label settings-group-select">
						<div id="btn-open-online-library" class="settings-control settings-select pseudo-select">在线术语库</div>
						<span class="settings-label">浏览在线术语库</span>
					</div>

					<div class="settings-group settings-group-select static-label">
						<select id="setting-select-glossary-manage" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-select-glossary-manage" class="settings-label">已导入的术语表</label>
					</div>
					<div id="view-imported-glossary-container" class="settings-group static-label settings-group-select" style="display: none;">
						<div id="btn-view-imported-glossary" class="settings-control settings-select pseudo-select">查看术语表</div>
						<span class="settings-label">查看当前术语表</span>
					</div>

					<div id="online-glossary-details-container" style="display: none;">
						<div class="online-glossary-details">
							<span id="online-glossary-info"></span>
							<button id="online-glossary-delete-btn" class="online-glossary-delete-btn">删除</button>
						</div>
					</div>
				</div>

				<div id="editable-section-post-replace" class="editable-section" style="display: none;">
					<div class="settings-group settings-group-select static-label">
						<select id="setting-post-replace-select" class="settings-control settings-select custom-styled-select"></select>
						<label for="setting-post-replace-select" class="settings-label">当前替换规则</label>
					</div>
					<div class="settings-group settings-group-select static-label">
						<select id="setting-post-replace-edit-mode" class="settings-control settings-select custom-styled-select">
							<option value="name">规则名称</option>
							<option value="settings">规则设置</option>
							<option value="delete">删除规则</option>
						</select>
						<label for="setting-post-replace-edit-mode" class="settings-label">管理替换规则</label>
					</div>
					<div id="post-replace-container-name" class="settings-group static-label">
						<div class="input-wrapper">
							<input type="text" id="setting-post-replace-name" class="settings-control settings-input" placeholder="规则名称" spellcheck="false">
							<label for="setting-post-replace-name" class="settings-label">规则名称</label>
							<button id="setting-btn-post-replace-save-name" class="settings-action-button-inline">保存</button>
						</div>
					</div>
					<div id="post-replace-container-settings" class="settings-group static-label" style="display: none;">
						<div class="input-wrapper">
							<input type="text" id="setting-input-post-replace" class="settings-control settings-input" placeholder="译文1：替换1，译文2：替换2" spellcheck="false">
							<label for="setting-input-post-replace" class="settings-label">译文后处理替换</label>
							<button id="setting-btn-post-replace-save" class="settings-action-button-inline">保存</button>
						</div>
					</div>
				</div>

				<div id="editable-section-blocker" class="editable-section" style="display: none; flex-direction: column; gap: 16px;">
					<div class="settings-group static-label settings-group-select">
						<select id="blocker-dimension-select" class="settings-control settings-select custom-styled-select">
							<option value="tags">标签过滤</option>
							<option value="content">内容过滤</option>
							<option value="stats">统计过滤</option>
							<option value="advanced">高级筛选</option>
						</select>
						<label for="blocker-dimension-select" class="settings-label">屏蔽维度</label>
					</div>
					<div class="settings-group static-label settings-group-select">
						<select id="blocker-sub-dimension-select" class="settings-control settings-select custom-styled-select"></select>
						<label for="blocker-sub-dimension-select" class="settings-label">具体配置项</label>
					</div>
					<div id="blocker-input-area" style="display: flex; flex-direction: column; gap: 16px;"></div>
				</div>

				<div id="blocker-actions-container" class="data-sync-actions-container" style="display: none;">
					<button id="btn-toggle-blocker" class="data-sync-action-btn"></button>
					<button id="btn-toggle-reasons" class="data-sync-action-btn"></button>
				</div>
			</div>
		</div>
		`;

		// 挂载到 Shadow Wrapper
		shadowWrapper.appendChild(panel);

		return {
			panel,
			closeBtn: panel.querySelector('.settings-panel-close-btn'),
			header: panel.querySelector('.settings-panel-header'),
			masterSwitch: panel.querySelector('#setting-master-switch'),
			swapLangBtn: panel.querySelector('#swap-lang-btn'),
			engineSelect: panel.querySelector('#setting-trans-engine'),
			serviceDetailsToggleContainer: panel.querySelector('#service-details-toggle-container'),
			serviceDetailsToggleBtn: panel.querySelector('.service-details-toggle-btn'),
			fromLangSelect: panel.querySelector('#setting-from-lang'),
			toLangSelect: panel.querySelector('#setting-to-lang'),
			modelGroup: panel.querySelector('#setting-model-group'),
			modelSelect: panel.querySelector('#setting-trans-model'),
			displayModeSelect: panel.querySelector('#setting-display-mode'),
			apiKeyGroup: panel.querySelector('#api-key-group'),
			apiKeyInput: panel.querySelector('#setting-input-apikey'),
			apiKeySaveBtn: panel.querySelector('#setting-btn-apikey-save'),
			customServiceContainer: panel.querySelector('#custom-service-container'),
			glossaryActionsSelect: panel.querySelector('#setting-glossary-actions'),
			editableSections: panel.querySelectorAll('.editable-section'),
			aiSettingsSection: panel.querySelector('#editable-section-ai-settings'),
			aiProfileSelect: panel.querySelector('#ai-profile-select'),
			aiServiceTrigger: panel.querySelector('#ai-service-association-trigger'),
			aiParamSelect: panel.querySelector('#ai-param-select'),
			aiParamInputArea: panel.querySelector('#ai-param-input-area'),
			langDetectSection: panel.querySelector('#editable-section-lang-detect'),
			langDetectSelect: panel.querySelector('#setting-lang-detector'),
			localManageSection: panel.querySelector('#editable-section-local-manage'),
			localGlossarySelect: panel.querySelector('#setting-local-glossary-select'),
			localEditModeSelect: panel.querySelector('#setting-local-edit-mode'),
			localContainerName: panel.querySelector('#local-edit-container-name'),
			localContainerTranslation: panel.querySelector('#local-edit-container-translation'),
			localContainerForbidden: panel.querySelector('#local-edit-container-forbidden'),
			localGlossaryNameInput: panel.querySelector('#setting-local-glossary-name'),
			localGlossarySaveNameBtn: panel.querySelector('#setting-btn-local-glossary-save-name'),
			localSensitiveInput: panel.querySelector('#setting-input-local-sensitive'),
			localSensitiveSaveBtn: panel.querySelector('#setting-btn-local-sensitive-save'),
			localInsensitiveInput: panel.querySelector('#setting-input-local-insensitive'),
			localInsensitiveSaveBtn: panel.querySelector('#setting-btn-local-insensitive-save'),
			localForbiddenInput: panel.querySelector('#setting-input-local-forbidden'),
			localForbiddenSaveBtn: panel.querySelector('#setting-btn-local-forbidden-save'),
			onlineManageSection: panel.querySelector('#editable-section-online-manage'),
			glossaryImportUrlInput: panel.querySelector('#setting-input-glossary-import-url'),
			glossaryImportSaveBtn: panel.querySelector('#setting-btn-glossary-import-save'),
			glossaryManageSelect: panel.querySelector('#setting-select-glossary-manage'),
			glossaryManageDetailsContainer: panel.querySelector('#online-glossary-details-container'),
			glossaryManageInfo: panel.querySelector('#online-glossary-info'),
			glossaryManageDeleteBtn: panel.querySelector('#online-glossary-delete-btn'),
			openOnlineLibraryBtn: panel.querySelector('#btn-open-online-library'),
			viewImportedGlossaryContainer: panel.querySelector('#view-imported-glossary-container'),
			viewImportedGlossaryBtn: panel.querySelector('#btn-view-imported-glossary'),
			postReplaceSection: panel.querySelector('#editable-section-post-replace'),
			postReplaceSelect: panel.querySelector('#setting-post-replace-select'),
			postReplaceEditModeSelect: panel.querySelector('#setting-post-replace-edit-mode'),
			postReplaceContainerName: panel.querySelector('#post-replace-container-name'),
			postReplaceContainerSettings: panel.querySelector('#post-replace-container-settings'),
			postReplaceNameInput: panel.querySelector('#setting-post-replace-name'),
			postReplaceSaveNameBtn: panel.querySelector('#setting-btn-post-replace-save-name'),
			postReplaceInput: panel.querySelector('#setting-input-post-replace'),
			postReplaceSaveBtn: panel.querySelector('#setting-btn-post-replace-save'),
			dataSyncActionsContainer: panel.querySelector('#data-sync-actions-container'),
			debugModeSection: panel.querySelector('#editable-section-debug-mode'),
			logLevelSelect: panel.querySelector('#setting-log-level'),
			viewLogsBtn: panel.querySelector('#btn-view-logs'),
			logAutoClearSelect: panel.querySelector('#setting-log-auto-clear'),
			importDataBtn: panel.querySelector('#btn-import-data'),
			exportDataBtn: panel.querySelector('#btn-export-data'),
			blockerSection: panel.querySelector('#editable-section-blocker'),
			blockerDimensionSelect: panel.querySelector('#blocker-dimension-select'),
			blockerSubDimensionSelect: panel.querySelector('#blocker-sub-dimension-select'),
			blockerInputArea: panel.querySelector('#blocker-input-area'),
			blockerActionsContainer: panel.querySelector('#blocker-actions-container'),
			toggleBlockerBtn: panel.querySelector('#btn-toggle-blocker'),
			toggleReasonsBtn: panel.querySelector('#btn-toggle-reasons'),
			formattingSection: panel.querySelector('#editable-section-formatting'),
			fmtProfileSelect: panel.querySelector('#setting-fmt-profile'),
			fmtPropertySelect: panel.querySelector('#setting-fmt-property'),
			fmtValueContainer: panel.querySelector('#setting-fmt-value-container'),
			cacheAutoCleanupSelect: panel.querySelector('#setting-cache-auto-cleanup-enabled'),
		};
	}

	/**
	 * 显示一个自定义的确认模态框
	 */
	function showCustomConfirm(message, title = '提示', options = {}) {
		const { textAlign = 'left', useTextIndent = false, singleButton = false, confirmText = '确定', showNeverAgain = false, modalClass = '' } = options;
		return new Promise((resolve, reject) => {
			if (shadowWrapper.querySelector('#ao3-custom-confirm-overlay')) {
				return reject(new Error('已有提示框正在显示中。'));
			}

			const overlay = document.createElement('div');
			overlay.id = 'ao3-custom-confirm-overlay';
			overlay.className = 'ao3-overlay';

			const style = document.createElement('style');
			style.textContent = `
				.ao3-custom-confirm-body { padding: 20px 16px; font-size: 14px; line-height: 1.6; color: var(--ao3-text); white-space: pre-wrap; }
				.ao3-custom-confirm-body p { margin: 0; }
				.ao3-custom-confirm-body.with-indent p { text-indent: 2em; }
			`;
			overlay.appendChild(style);

			const modal = document.createElement('div');
			modal.id = 'ao3-custom-confirm-modal';
			modal.className = `ao3-modal ${modalClass}`.trim();

			const indentClass = useTextIndent ? ' with-indent' : '';

			let footerHtml = '';
			if (singleButton) {
				footerHtml = `<button class="ao3-modal-btn confirm">${confirmText}</button>`;
			} else if (showNeverAgain) {
				footerHtml = `
					<button class="ao3-modal-btn cancel">取消</button>
					<button class="ao3-modal-btn never-again">不再显示</button>
					<button class="ao3-modal-btn confirm">${confirmText}</button>
				`;
			} else {
				footerHtml = `
					<button class="ao3-modal-btn cancel">取消</button>
					<button class="ao3-modal-btn confirm">${confirmText}</button>
				`;
			}

			modal.innerHTML = `
				<div class="ao3-modal-header"><h3>${title}</h3></div>
				<div class="ao3-custom-confirm-body${indentClass}" style="text-align: ${textAlign};">${message.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
				<div class="ao3-modal-footer">
					${footerHtml}
				</div>
			`;

			overlay.appendChild(modal);
			shadowWrapper.appendChild(overlay);

			const cleanup = () => {
				overlay.remove();
			};

			const confirmBtn = modal.querySelector('.confirm');
			const cancelBtn = modal.querySelector('.cancel');
			const neverAgainBtn = modal.querySelector('.never-again');

			confirmBtn.addEventListener('click', () => {
				cleanup();
				resolve(true);
			});

			if (neverAgainBtn) {
				neverAgainBtn.addEventListener('click', () => {
					cleanup();
					resolve('never_again');
				});
			}

			if (cancelBtn) {
				cancelBtn.addEventListener('click', () => {
					cleanup();
					reject(new Error('User cancelled.'));
				});
			}

			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					cleanup();
					reject(new Error('User cancelled by clicking overlay.'));
				}
			});
		});
	}

	/**
	 * 打开实时日志可视化模态框
	 */
	function openLogModal() {
		if (shadowWrapper.querySelector('#ao3-log-modal-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ao3-log-modal-overlay';
		overlay.className = 'ao3-overlay';

		const style = document.createElement('style');
		style.textContent = `
			.log-modal-title { position: absolute; left: 50%; transform: translateX(-50%); margin: 0; font-size: 16px; font-weight: 600; color: var(--ao3-text); white-space: nowrap; pointer-events: none; }
			.log-filter-wrapper { position: absolute; right: 16px; width: 72px; z-index: 10; }
			.log-filter-wrapper .settings-control { height: 22px !important; line-height: 22px !important; font-size: 11px !important; padding: 0 16px 0 6px !important; border-radius: 4px !important; border-color: var(--ao3-border) !important; background-color: transparent !important; }
			.log-filter-wrapper .settings-control:hover, .log-filter-wrapper .settings-control:focus, .log-filter-wrapper.dropdown-active .settings-control { border-color: var(--ao3-border) !important; background-color: transparent !important; box-shadow: none !important; }
			.log-filter-wrapper.settings-group-select::after { right: 6px; top: 11px; font-size: 9px; opacity: 0.6; }
			.log-header-btn { font-size: 13px; cursor: pointer; user-select: none; background: none; border: none; padding: 0; position: absolute; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; }
			.log-header-btn.left { left: 16px; width: 24px; height: 24px; color: var(--ao3-primary) !important; }
			.log-header-btn svg { width: 20px; height: 20px; fill: currentColor; opacity: 0.75; transition: opacity 0.2s; }
			.log-header-btn:hover svg { opacity: 1; }
			.log-entry { 
				margin-bottom: 12px; 
				padding-bottom: 12px; 
				position: relative; 
			}
			.log-entry:not(:last-child)::after { 
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 1px;
				background-color: var(--ao3-border);
				transform: scaleY(0.5);
				transform-origin: center bottom;
			}
			.log-entry:last-child { margin-bottom: 0; padding-bottom: 0; }
			.log-entry-header { font-size: 12px; margin-bottom: 4px; display: flex; gap: 3px; flex-wrap: wrap; align-items: center; }
			.log-time { color: var(--ao3-text-secondary); }
			.log-module { color: var(--ao3-text-secondary); }
			.log-level-INFO { color: #2196F3; font-weight: 600; }
			.log-level-WARN { color: #FF9800; font-weight: 600; }
			.log-level-ERROR { color: #F44336; font-weight: 600; }
			@media (prefers-color-scheme: dark) { .log-level-INFO { color: #64b5f6; } .log-level-WARN { color: #ffb74d; } .log-level-ERROR { color: #e57373; } }
			.log-entry-content { word-break: break-word; }
			.log-entry-data { font-size: 12px; color: var(--ao3-text-secondary); background: var(--ao3-hover-bg); padding: 6px; border-radius: 4px; margin-top: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
		`;
		overlay.appendChild(style);

		overlay.insertAdjacentHTML('beforeend', `
			<div id="ao3-log-modal" class="ao3-modal" style="height: 60vh;">
				<div class="ao3-modal-header">
					<button class="log-header-btn left" id="log-btn-clear" title="清空">
						${SVG_ICONS.delete}
					</button>
					<h3 class="log-modal-title">日志</h3>
					<div class="settings-group settings-group-select log-filter-wrapper">
						<select id="log-filter-level" class="settings-control settings-select custom-styled-select small-select">
							<option value="ALL">ALL</option>
							<option value="INFO">INFO</option>
							<option value="WARN">WARN</option>
							<option value="ERROR">ERROR</option>
							<option value="OFF">OFF</option>
						</select>
					</div>
				</div>
				<div class="ao3-modal-body ao3-custom-scrollbar" id="log-container" style="padding: 12px 16px; font-size: 13px; line-height: 1.5;"></div>
				<div class="ao3-modal-footer">
					<button class="ao3-modal-btn" id="log-btn-cancel">关闭</button>
					<button class="ao3-modal-btn" id="log-btn-copy">复制</button>
					<button class="ao3-modal-btn" id="log-btn-export">导出</button>
				</div>
			</div>
		`);

		shadowWrapper.appendChild(overlay);

		const container = overlay.querySelector('#log-container');
		const filterSelect = overlay.querySelector('#log-filter-level');
		const clearBtn = overlay.querySelector('#log-btn-clear');
		const closeBtn = overlay.querySelector('#log-btn-cancel');
		const copyBtn = overlay.querySelector('#log-btn-copy');
		const exportBtn = overlay.querySelector('#log-btn-export');
		
		const WEIGHTS = { 'ALL': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3, 'OFF': 99 };
		const savedFilter = GM_getValue('ao3_log_modal_filter', Logger.config.level);
		filterSelect.value = savedFilter;

		const escapeHTML = (str) => {
			return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
		};

		const renderEntry = (entry) => {
			const div = document.createElement('div');
			div.className = 'log-entry';
			const dataStr = entry.data ? `<div class="log-entry-data">${escapeHTML(JSON.stringify(entry.data, null, 2))}</div>` : '';
			div.innerHTML = `
				<div class="log-entry-header">
					<span class="log-time">[${escapeHTML(entry.timestamp)}]</span>
					<span class="log-level-${escapeHTML(entry.level)}">[${escapeHTML(entry.level)}]</span>
					<span class="log-module">[${escapeHTML(entry.module)}]</span>
					${entry.traceId ? `<span class="log-trace" style="color: #4CAF50;">[${escapeHTML(entry.traceId)}]</span>` : ''}
				</div>
				<div class="log-entry-content">${escapeHTML(entry.message)}</div>
				${dataStr}
			`;
			return div;
		};

		let currentRenderId = 0;
		function startRendering() {
			container.innerHTML = '';
			const filterWeight = WEIGHTS[filterSelect.value] ?? 1;
			const filteredHistory = Logger.history.filter(entry => (WEIGHTS[entry.level] ?? 1) >= filterWeight);
			
			const myRenderId = ++currentRenderId;
			const chunkSize = 50;
			let currentIndex = 0;

			function renderChunk() {
				if (myRenderId !== currentRenderId) return;
				const fragment = document.createDocumentFragment();
				const end = Math.min(currentIndex + chunkSize, filteredHistory.length);
				for (let i = currentIndex; i < end; i++) {
					fragment.appendChild(renderEntry(filteredHistory[i]));
				}
				container.appendChild(fragment);
				currentIndex = end;
				if (currentIndex < filteredHistory.length) {
					requestAnimationFrame(renderChunk);
				} else {
					requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
				}
			}
			if (filteredHistory.length > 0) requestAnimationFrame(renderChunk);
		}

		startRendering();

		filterSelect.addEventListener('change', () => {
			GM_setValue('ao3_log_modal_filter', filterSelect.value);
			startRendering();
		});

		const onLogAdded = (e) => {
			const entry = e.detail;
			const filterWeight = WEIGHTS[filterSelect.value] ?? 1;
			if ((WEIGHTS[entry.level] ?? 1) >= filterWeight) {
				const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
				container.appendChild(renderEntry(entry));
				if (isAtBottom) container.scrollTop = container.scrollHeight;
			}
		};
		document.addEventListener(CUSTOM_EVENTS.LOG_ADDED, onLogAdded);

		const cleanup = () => {
			document.removeEventListener(CUSTOM_EVENTS.LOG_ADDED, onLogAdded);
			overlay.remove();
		};

		clearBtn.addEventListener('click', () => {
			showCustomConfirm('您确定要清空所有本地日志吗？\n\n注意：此操作无法撤销。', '提示', { textAlign: 'center' })
				.then(() => {
					Logger.clear();
					container.innerHTML = '';
				}).catch(() => {});
		});

		copyBtn.addEventListener('click', () => {
			const filterWeight = WEIGHTS[filterSelect.value] ?? 1;
			const filteredLogs = Logger.history.filter(entry => (WEIGHTS[entry.level] ?? 1) >= filterWeight);

			const logText = JSON.stringify(filteredLogs, null, 2);

			const originalText = copyBtn.textContent;

			navigator.clipboard.writeText(logText).then(() => {
				copyBtn.textContent = '✓';
				setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
			}).catch((err) => {
				copyBtn.textContent = '×';
				setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
				console.error('复制日志失败:', err);
			});
		});

		exportBtn.addEventListener('click', () => {
			Logger.export();
		});

		closeBtn.addEventListener('click', cleanup);
		
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) cleanup();
		});
	}

	/**
	 * 打开“导出格式选择”模态框
	 */
	function openExportFormatModal() {
		if (shadowWrapper.querySelector('#ao3-export-format-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ao3-export-format-overlay';
		overlay.className = 'ao3-overlay';

		const savedFormats = GM_getValue('ao3_export_selected_formats', ['html']);

		overlay.insertAdjacentHTML('beforeend', `
			<div id="ao3-export-format-modal" class="ao3-modal" style="height: auto;">
				<div class="ao3-modal-header">
					<h3>导出格式选择</h3>
				</div>
				<div class="ao3-modal-body ao3-custom-scrollbar" style="padding: 8px 0;">
					<label class="export-format-item">
						<input type="checkbox" value="html" ${savedFormats.includes('html') ? 'checked' : ''}>
						<span>HTML</span>
					</label>
					<label class="export-format-item">
						<input type="checkbox" value="epub" ${savedFormats.includes('epub') ? 'checked' : ''}>
						<span>EPUB</span>
					</label>
					<label class="export-format-item">
						<input type="checkbox" value="pdf" ${savedFormats.includes('pdf') ? 'checked' : ''}>
						<span>PDF</span>
					</label>
				</div>
				<div class="ao3-modal-footer">
					<button class="ao3-modal-btn" id="ef-btn-cancel">关闭</button>
					<button class="ao3-modal-btn" id="ef-btn-confirm">确认</button>
				</div>
			</div>
		`);
		shadowWrapper.appendChild(overlay);

		const cleanup = () => overlay.remove();

		overlay.querySelector('#ef-btn-cancel').addEventListener('click', cleanup);
		overlay.querySelector('#ef-btn-confirm').addEventListener('click', () => {
			const checkboxes = overlay.querySelectorAll('input[type="checkbox"]');
			const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
			GM_setValue('ao3_export_selected_formats', selected);
			cleanup();
		});
		overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
	}

	/**
	 * 打开“样式编辑器”模态框
	 */
	function openExportStyleModal(format, templateId) {
		if (shadowWrapper.querySelector('#ao3-export-style-overlay')) return;

		const template = ExportTemplateStore.getTemplate(format, templateId);
		if (!template) return;

		const overlay = document.createElement('div');
		overlay.id = 'ao3-export-style-overlay';
		overlay.className = 'ao3-overlay';

		overlay.insertAdjacentHTML('beforeend', `
			<div id="ao3-export-style-modal" class="ao3-modal">
				<div class="ao3-modal-header">
					<h3>样式编辑</h3>
				</div>
				<div class="ao3-modal-body" style="padding: 0; display: flex; flex-direction: column;">
					<textarea id="es-textarea" class="style-editor-textarea ao3-custom-scrollbar" spellcheck="false"></textarea>
				</div>
				<div class="ao3-modal-footer">
					<button class="ao3-modal-btn" id="es-btn-cancel">关闭</button>
					<button class="ao3-modal-btn" id="es-btn-confirm">确认</button>
				</div>
			</div>
		`);
		shadowWrapper.appendChild(overlay);

		const textarea = overlay.querySelector('#es-textarea');
		textarea.value = template.css;

		const cleanup = () => overlay.remove();

		overlay.querySelector('#es-btn-cancel').addEventListener('click', cleanup);
		overlay.querySelector('#es-btn-confirm').addEventListener('click', () => {
			template.css = textarea.value;
			ExportTemplateStore.saveTemplate(format, template);
			cleanup();
		});
		overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
	}

    /**
	 * 打开“在线术语库”模态框
	 */
	function openOnlineLibraryModal() {
		if (shadowWrapper.querySelector('#ao3-library-modal-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ao3-library-modal-overlay';
		overlay.className = 'ao3-overlay';

		const style = document.createElement('style');
		style.textContent = `
			.lib-search-container { flex: 1; position: relative; display: flex; align-items: center; width: 100%; }
			.lib-search-box { width: 100%; height: 28px; border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 20px; padding: 4px 30px 4px 12px; background: #ffffff !important; color: #000000DE !important; font-size: 13px; outline: none; box-sizing: border-box; box-shadow: none !important; }
			.lib-search-box:focus { border-color: var(--ao3-border-hover); background: #ffffff !important; box-shadow: none !important; }
			
			@media (prefers-color-scheme: dark) { 
				.lib-search-box { background: #252525 !important; color: #e0e0e0 !important; border-color: rgba(255, 255, 255, 0.12) !important; } 
				.lib-search-box:focus { background: #252525 !important; border-color: var(--ao3-border-hover) !important; } 
			}

			.lib-search-container svg { position: absolute; right: 10px; width: 14px; height: 14px; fill: var(--ao3-text-secondary); pointer-events: none; }
			
			.lib-item { display: flex; justify-content: space-between; align-items: center; padding: 0 16px; height: 45px; position: relative; box-sizing: border-box; }
			.lib-item:not(:last-child)::after { content: ''; position: absolute; bottom: 0; left: 16px; right: 16px; height: 1px; background-color: var(--ao3-border); transform: scaleY(0.5); transform-origin: center bottom; }
			.lib-item-name { flex: 1; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
			.lib-item-actions { display: flex; gap: 8px; flex-shrink: 0; }
			.lib-item-actions .ao3-icon-btn svg { width: 18px !important; height: 18px !important; }
			.lib-loading-container { display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; flex: 1; height: 360px; }
			.lib-loading-container svg { width: 32px; height: 32px; fill: rgba(150, 150, 150, 0.5); animation: ao3-spin 1s linear infinite; }
			@keyframes ao3-spin { to { transform: rotate(360deg); } }
			.lib-error-text { color: var(--ao3-text-secondary); font-size: 13px; text-align: center; padding: 20px; }
		`;
		overlay.appendChild(style);

		overlay.insertAdjacentHTML('beforeend', `
			<div id="ao3-library-modal" class="ao3-modal" style="height: auto;">
				<div class="ao3-modal-header">
					<div class="lib-search-container">
						<input type="text" class="lib-search-box" id="lib-search-input" spellcheck="false">
						${SVG_ICONS.search}
					</div>
				</div>
				<div class="ao3-modal-body ao3-custom-scrollbar" id="lib-container" style="padding: 0; height: 360px;">
				</div>
				<div class="ao3-modal-footer">
					<button class="ao3-modal-btn" id="lib-btn-close">关闭</button>
					<button class="ao3-modal-btn" id="lib-btn-visit">访问</button>
					<button class="ao3-modal-btn" id="lib-btn-refresh">刷新</button>
				</div>
			</div>
		`);
		shadowWrapper.appendChild(overlay);

		const container = overlay.querySelector('#lib-container');
		const searchInput = overlay.querySelector('#lib-search-input');

		let allGlossaries =[];

		const renderList = (filterText = '') => {
			container.innerHTML = '';
			const lowerFilter = filterText.toLowerCase();
			
			const filtered = allGlossaries.filter(g => 
				(g.name && g.name.toLowerCase().includes(lowerFilter)) || 
				(g.maintainer && g.maintainer.toLowerCase().includes(lowerFilter)) ||
				(g.tags && Array.isArray(g.tags) && g.tags.some(tag => tag.toLowerCase().includes(lowerFilter)))
			);

			if (filtered.length === 0) {
				container.innerHTML = `<div class="lib-error-text">未找到匹配的术语表</div>`;
				return;
			}

			filtered.forEach(item => {
				const div = document.createElement('div');
				div.className = 'lib-item';
				div.innerHTML = `
					<div class="lib-item-name" title="${item.name}">${item.name}</div>
					<div class="lib-item-actions">
						<button class="ao3-icon-btn btn-import" title="导入">
							${SVG_ICONS.download}
						</button>
					</div>
				`;

				const importBtn = div.querySelector('.btn-import');
				importBtn.addEventListener('click', async () => {
					importBtn.innerHTML = SVG_ICONS.spinner;
					importBtn.querySelector('svg').style.animation = 'ao3-spin 1s linear infinite';
					importBtn.disabled = true;
					const res = await importOnlineGlossary(item.url, { silent: true });

					if (res.success) {
						importBtn.innerHTML = SVG_ICONS.success;
					} else {
						importBtn.innerHTML = SVG_ICONS.error;
					}

					setTimeout(() => {
						importBtn.innerHTML = SVG_ICONS.download;
						importBtn.disabled = false;
					}, 1500);
				});

				container.appendChild(div);
			});
		};

		const fetchLibraryData = (force = false) => {
			const CACHE_DATA_KEY = 'ao3_online_library_cache_data';
			const CACHE_TIME_KEY = 'ao3_online_library_cache_time';
			const ONE_DAY_MS = 24 * 60 * 60 * 1000;
			
			const cachedData = GM_getValue(CACHE_DATA_KEY);
			const cachedTime = GM_getValue(CACHE_TIME_KEY, 0);
			const now = Date.now();

			if (!force && cachedData && (now - cachedTime < ONE_DAY_MS)) {
				try {
					allGlossaries = JSON.parse(cachedData);
					renderList(searchInput.value.trim());
					return;
				} catch (e) {
					Logger.warn('System', '在线术语库缓存解析失败，将重新获取');
				}
			}

			container.innerHTML = `
				<div class="lib-loading-container">
					${SVG_ICONS.spinner}
				</div>
			`;

			const url = 'https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/glossaries/glossary-index.json';
			const fetchUrl = force ? `${url}?t=${now}` : url;

			fetchWithFallback(fetchUrl, { timeout: 5000 })
				.then(({ responseText }) => {
					try {
						let text = responseText.trim();
						allGlossaries = JSON.parse(text);
						GM_setValue(CACHE_DATA_KEY, text);
						GM_setValue(CACHE_TIME_KEY, now);
						renderList(searchInput.value.trim());
					} catch (e) {
						handleFetchError('解析术语库数据失败', cachedData);
					}
				})
				.catch((err) => {
					handleFetchError(err.message === 'Timeout' ? '请求超时' : '网络请求失败', cachedData);
				});
		};

		const handleFetchError = (errorMsg, cachedData) => {
			if (cachedData) {
				try {
					allGlossaries = JSON.parse(cachedData);
					renderList(searchInput.value.trim());
					Logger.warn('System', `${errorMsg}，已回退使用本地缓存`);
					return;
				} catch (e) {}
			}
			container.innerHTML = `<div class="lib-error-text">${errorMsg}</div>`;
		};

		fetchLibraryData();

		searchInput.addEventListener('input', (e) => renderList(e.target.value.trim()));

		const cleanup = () => overlay.remove();
		overlay.querySelector('#lib-btn-close').addEventListener('click', cleanup);
		overlay.querySelector('#lib-btn-refresh').addEventListener('click', () => fetchLibraryData(true));
		overlay.querySelector('#lib-btn-visit').addEventListener('click', () => {
			window.open('https://github.com/V-Lipset/ao3-chinese/wiki/在线术语库', '_blank');
		});
		overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
	}

    /**
	 * 打开“查看术语表”模态框
	 * @param {string} url 术语表的 URL
	 */
	function openGlossaryViewModal(url) {
		if (shadowWrapper.querySelector('#ao3-glossary-view-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ao3-glossary-view-overlay';
		overlay.className = 'ao3-overlay';

		const style = document.createElement('style');
		style.textContent = `
			/* 控制整个 Header 的布局 */
			#ao3-glossary-view-modal .ao3-modal-header { justify-content: space-between; gap: 8px; flex-wrap: nowrap; }

			/* 搜索框容器 */
			.gv-search-container { flex: 1 1 auto; min-width: 60px; position: relative; display: flex; align-items: center; }

			/* 1. 搜索图标 */
			.gv-search-container svg { position: absolute; right: 10px; width: 14px; height: 14px; fill: var(--ao3-text-secondary); pointer-events: none; }

			/* 2. 搜索框 */
			.gv-search-box { width: 100%; height: 28px; padding: 4px 30px 4px 12px; border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 20px; background: #ffffff !important; color: #000000DE !important; font-size: 13px; outline: none; min-width: 0; box-sizing: border-box; box-shadow: none !important; }
			.gv-search-box:focus { border-color: var(--ao3-border-hover); background: #ffffff !important; box-shadow: none !important; }
			@media (prefers-color-scheme: dark) { 
				.gv-search-box { background: #252525 !important; color: #e0e0e0 !important; border-color: rgba(255, 255, 255, 0.12) !important; } 
				.gv-search-box:focus { background: #252525 !important; border-color: var(--ao3-border-hover) !important; } 
			}

			/* 文字信息 */
			.gv-search-info { flex: 0 0 auto; font-size: 12px; color: var(--ao3-text-secondary); text-align: center; white-space: nowrap; }

			/* 3. 按钮组 */
			.gv-nav-btn-group { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin: 0; }

			/* 4. 上下箭头 */
			.gv-nav-btn-group .ao3-icon-btn { color: var(--ao3-text-secondary); width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; }
			.gv-nav-btn-group .ao3-icon-btn svg { width: 12px; height: 12px; }

			.ao3-search-highlight { background-color: rgba(255, 255, 0, 0.4); color: inherit; border-radius: 2px; }
			.ao3-search-highlight.active { background-color: rgba(255, 255, 0, 0.8); font-weight: bold; color: #000; }
			.gv-loading-container { display: flex; justify-content: center; align-items: center; width: 100%; flex: 1; flex-direction: column; gap: 10px; height: 360px; }
			.lib-loading-container svg { width: 32px; height: 32px; fill: rgba(150, 150, 150, 0.5); animation: ao3-spin 1s linear infinite; }
			.gv-error-text { color: var(--ao3-text-secondary); font-size: 13px; text-align: center; padding: 20px; }
		`;
		overlay.appendChild(style);

		const rightBtnText = '反馈'; 
		
		overlay.insertAdjacentHTML('beforeend', `
			<div id="ao3-glossary-view-modal" class="ao3-modal" style="height: 60vh;">
				<div class="ao3-modal-header">
					<div class="gv-search-container">
						<input type="text" class="gv-search-box" id="gv-search-input" spellcheck="false">
						${SVG_ICONS.search}
					</div>
					<span class="gv-search-info" id="gv-search-info">第 0 项，共 0 项</span>
					<div class="gv-nav-btn-group">
						<button class="ao3-icon-btn" id="gv-btn-prev" disabled>
							${SVG_ICONS.arrowUp}
						</button>
						<button class="ao3-icon-btn" id="gv-btn-next" disabled>
							${SVG_ICONS.arrowDown}
						</button>
					</div>
				</div>
				<div class="ao3-modal-body ao3-custom-scrollbar" id="gv-container" style="padding: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; display: flex; flex-direction: column;">
					<div class="gv-loading-container">
						${SVG_ICONS.spinner}
					</div>
				</div>
				<div class="ao3-modal-footer">
					<button class="ao3-modal-btn" id="gv-btn-cancel">关闭</button>
					<button class="ao3-modal-btn" id="gv-btn-visit">访问</button>
					<button class="ao3-modal-btn" id="gv-btn-action">${rightBtnText}</button>
				</div>
			</div>
		`);
		shadowWrapper.appendChild(overlay);

		const container = overlay.querySelector('#gv-container');
		const searchInput = overlay.querySelector('#gv-search-input');
		const searchInfo = overlay.querySelector('#gv-search-info');
		const btnPrev = overlay.querySelector('#gv-btn-prev');
		const btnNext = overlay.querySelector('#gv-btn-next');
		const btnAction = overlay.querySelector('#gv-btn-action');
		const btnVisit = overlay.querySelector('#gv-btn-visit');
		
		const parsedUrls = parseGlossaryUrl(url);

		if (btnVisit) {
			if (!parsedUrls) {
				btnVisit.style.display = 'none';
			} else {
				GitHubStatusManager.check(parsedUrls.owner, parsedUrls.repo);
				btnVisit.addEventListener('click', () => {
					window.open(parsedUrls.visitUrl, '_blank');
				});
			}
		}
		
		let rawText = '';
		let parsedMetadata = {};
		let matches =[];
		let currentMatchIndex = -1;

		const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		const updatePagination = () => {
			if (matches.length === 0) {
				searchInfo.textContent = '第 0 项，共 0 项';
				btnPrev.disabled = true;
				btnNext.disabled = true;
			} else {
				searchInfo.textContent = `第 ${currentMatchIndex + 1} 项，共 ${matches.length} 项`;
				btnPrev.disabled = false;
				btnNext.disabled = false;
			}
		};

		const highlightCurrentMatch = () => {
			matches.forEach(m => m.classList.remove('active'));
			if (currentMatchIndex >= 0 && currentMatchIndex < matches.length) {
				const el = matches[currentMatchIndex];
				el.classList.add('active');
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			updatePagination();
		};

		const performSearch = (term) => {
			if (!term) {
				container.innerHTML = escapeHTML(rawText);
				matches =[];
				currentMatchIndex = -1;
				updatePagination();
				return;
			}
			
			const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`(${escapedTerm})`, 'gi');
			const parts = rawText.split(regex);
			
			let html = '';
			for (let i = 0; i < parts.length; i++) {
				if (i % 2 === 0) {
					html += escapeHTML(parts[i]);
				} else {
					html += `<mark class="ao3-search-highlight">${escapeHTML(parts[i])}</mark>`;
				}
			}
			
			container.innerHTML = html;
			matches = container.querySelectorAll('.ao3-search-highlight');
			
			if (matches.length > 0) {
				currentMatchIndex = 0;
				highlightCurrentMatch();
			} else {
				currentMatchIndex = -1;
				updatePagination();
			}
		};

		const cleanup = () => overlay.remove();

		const rawTextCache = GM_getValue(GLOSSARY_RAW_TEXT_CACHE_KEY, {});
		const cachedText = rawTextCache[url];

		const handleLoadedText = (text) => {
			rawText = text;
			container.style.padding = '12px 16px';
			container.style.display = 'block';
			
			const allMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
			parsedMetadata = allMetadata[url] || {};
			
			if (parsedMetadata.visibility === false) {
				showCustomConfirm('此术语表暂未开放预览。', '提示', { textAlign: 'center', singleButton: true, confirmText: '确认' }).catch(() => {});
				cleanup();
				return;
			}
			container.innerHTML = escapeHTML(rawText);
		};

		if (cachedText) {
			handleLoadedText(cachedText);
		} else {
			const separator = url.includes('?') ? '&' : '?';
			fetchWithFallback(url + separator + 't=' + Date.now(), { timeout: 5000 })
				.then(({ responseText }) => {
					const text = responseText;
					const newCache = GM_getValue(GLOSSARY_RAW_TEXT_CACHE_KEY, {});
					newCache[url] = text;
					GM_setValue(GLOSSARY_RAW_TEXT_CACHE_KEY, newCache);
					handleLoadedText(text);
				})
				.catch((err) => {
					container.style.display = 'block';
					container.innerHTML = `<div class="gv-error-text">获取内容失败 (${err.message})</div>`;
				});
		}

		let searchTimer;
		searchInput.addEventListener('input', (e) => {
			clearTimeout(searchTimer);
			const term = e.target.value.trim();
			searchTimer = setTimeout(() => performSearch(term), 300);
		});

		btnPrev.addEventListener('click', () => {
			if (matches.length === 0) return;
			currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
			highlightCurrentMatch();
		});

		btnNext.addEventListener('click', () => {
			if (matches.length === 0) return;
			currentMatchIndex = (currentMatchIndex + 1) % matches.length;
			highlightCurrentMatch();
		});

		overlay.querySelector('#gv-btn-cancel').addEventListener('click', cleanup);
		overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });

		btnAction.addEventListener('click', async () => {
			const originalBtnText = btnAction.textContent;

			if (parsedUrls && parsedUrls.feedbackUrl) {
				const syncStatus = GitHubStatusManager.getSync(parsedUrls.owner, parsedUrls.repo);
				
				if (syncStatus === true) {
					window.open(parsedUrls.feedbackUrl, '_blank');
					return;
				} else if (syncStatus === null) {
					let newTab = window.open('about:blank', '_blank');
					btnAction.textContent = '检测中...';
					btnAction.disabled = true;
					
					const canUse = await GitHubStatusManager.check(parsedUrls.owner, parsedUrls.repo);
					
					if (canUse) {
						newTab.location.href = parsedUrls.feedbackUrl;
						btnAction.textContent = originalBtnText;
						btnAction.disabled = false;
						return;
					} else {
						newTab.close();
						btnAction.textContent = originalBtnText;
						btnAction.disabled = false;
					}
				}
			}

			let feedback = parsedMetadata.feedback;
			
			if (!feedback) {
				const CACHE_DATA_KEY = 'ao3_online_library_cache_data';
				const cachedData = GM_getValue(CACHE_DATA_KEY);
				if (cachedData) {
					try {
						const allGlossaries = JSON.parse(cachedData);
						const matchedGlossary = allGlossaries.find(g => g.url === url);
						if (matchedGlossary && matchedGlossary.feedback) {
							feedback = matchedGlossary.feedback;
						}
					} catch (e) {
						Logger.warn('System', '解析在线术语库缓存失败', e);
					}
				}
			}

			if (!feedback) {
				showCustomConfirm('该术语表维护者暂未提供反馈方式。', '提示', { textAlign: 'center', singleButton: true, confirmText: '确认' }).catch(() => {});
				return;
			}
			
			if (/^https?:\/\//i.test(feedback)) {
				window.open(feedback, '_blank');
			} else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedback)) {
				window.location.href = `mailto:${feedback}`;
			} else {
				showCustomConfirm(`该术语表维护者提供的反馈方式如下：\n\n${feedback}\n\n您可点击 “确定” 将其复制到剪贴板。`, '提示', { textAlign: 'center' })
					.then(() => navigator.clipboard.writeText(feedback))
					.catch(() => {});
			}
		});
	}

	/**
	 * 更新输入框的 Label 浮动状态
	 */
	function updateInputLabel(input) {
		if (!input) return;
		if (input.value && (input.tagName !== 'SELECT' || input.options[input.selectedIndex]?.disabled !== true)) {
			input.classList.add('has-value');
		} else {
			input.classList.remove('has-value');
		}
	}

	/**
	 * 创建并管理自定义翻译服务的 UI 和逻辑
	 */
	function createCustomServiceManager(panelElements) {
		const { customServiceContainer, modelGroup, modelSelect, apiKeyGroup } = panelElements;
		let currentServiceId = null;
		let currentEditSection = 'name';
		let isPendingCreation = false;
		let pendingServiceData = {};

		const getServices = () => GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
		const setServices = (services) => GM_setValue(CUSTOM_SERVICES_LIST_KEY, services);

		const ensureServiceExists = () => {
			if (!isPendingCreation) return currentServiceId;
			const services = getServices();
			const newService = { ...pendingServiceData, id: `custom_${Date.now()}` };
			services.push(newService);
			setServices(services);

			isPendingCreation = false;
			currentServiceId = newService.id;

			const lastActionKey = `custom_service_last_action_${currentServiceId}`;
			GM_setValue(lastActionKey, currentEditSection);

			GM_setValue('transEngine', currentServiceId);

			return newService.id;
		};

		const saveServiceField = (field, value) => {
			const serviceId = isPendingCreation ? ensureServiceExists() : currentServiceId;

			if (field === 'apiKey') {
				GM_setValue(`${serviceId}_keys_string`, value);
			} else {
				const services = getServices();
				const serviceIndex = services.findIndex(s => s.id === serviceId);
				if (serviceIndex > -1) {
					services[serviceIndex][field] = value;
					setServices(services);
				}
			}
			return serviceId;
		};

		const saveAndSyncCustomServiceField = (field, value) => {
			const serviceId = saveServiceField(field, value);
			SettingsSyncManager.syncUI();
			triggerModelFetchIfReady(serviceId);
		};

		const triggerModelFetchIfReady = (serviceId) => {
			if (!serviceId) return;
			const services = getServices();
			const service = services.find(s => s.id === serviceId);
			if (!service) return;

			const apiKey = (GM_getValue(`${serviceId}_keys_array`, [])[0] || '').trim();
			const modelsExist = service.models && service.models.length > 0;

			if (service.url && apiKey && !modelsExist) {
				fetchModelsForService(serviceId, service.url);
			}
		};

		const fetchModelsForService = async (serviceId, url) => {
			const serviceName = (getServices().find(s => s.id === serviceId) || {}).name || '新服务';
			try {
				const apiKey = (GM_getValue(`${serviceId}_keys_array`, [])[0] || '').trim();
				if (!apiKey) return;

				const modelsUrl = url.replace(/\/chat\/?(completions)?\/?$/, '') + '/models';

				const response = await new Promise((resolve, reject) => {
					GM_xmlhttpRequest({
						method: 'GET',
						url: modelsUrl,
						headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
						responseType: 'json',
						timeout: 15000,
						onload: res => {
							if (res.status === 200 && res.response) {
								resolve(res.response);
							} else {
								reject(new Error(`服务器返回状态 ${res.status}。请检查接口地址和 API Key。`));
							}
						},
						onerror: () => reject(new Error('网络请求失败，请检查您的网络连接和浏览器控制台。')),
						ontimeout: () => reject(new Error('请求超时。'))
					});
				});

				const models = getNestedProperty(response, 'data');
				if (!Array.isArray(models) || models.length === 0) {
					throw new Error('API 返回的数据格式不正确或模型列表为空。');
				}

				const modelIds = models.map(m => m.id).filter(Boolean);
				if (modelIds.length === 0) {
					throw new Error('未能从 API 响应中提取任何有效的模型 ID。');
				}

				saveServiceField('models', modelIds);
				saveServiceField('modelsRaw', modelIds.join(', '));
				Logger.info('Network', `成功为自定义服务 ${serviceName} 获取 ${modelIds.length} 个模型`);

				const actionSelect = customServiceContainer.querySelector('#custom-service-action-select');
				if (actionSelect) {
					actionSelect.value = 'models';
					actionSelect.dispatchEvent(new Event('change', { bubbles: true }));
				}

				SettingsSyncManager.syncUI();

			} catch (error) {
				Logger.error('Network', `自动获取模型失败: ${error.message}`);
				notifyAndLog(`自动获取模型失败：${error.message}`, '操作失败', 'error');
			}
		};

		function renderEditMode(serviceId) {
			currentServiceId = serviceId;

			if (serviceId) {
				const lastActionKey = `custom_service_last_action_${serviceId}`;
				currentEditSection = GM_getValue(lastActionKey, 'name');
			}

			let serviceData;
			if (isPendingCreation) {
				serviceData = pendingServiceData;
			} else {
				const services = getServices();
				serviceData = services.find(s => s.id === serviceId) || {};
			}

			customServiceContainer.innerHTML = `
                <div class="settings-group static-label settings-group-select">
                    <select id="custom-service-action-select" class="settings-control settings-select custom-styled-select">
                        <option value="name">设置服务名称</option>
                        <option value="url">设置接口地址</option>
                        <option value="apiKey">设置 API Key</option>
                        <option value="models">设置模型 ID</option>
                    </select>
                    <label for="custom-service-action-select" class="settings-label">自定义翻译服务</label>
                </div>
                <div id="custom-service-editor"></div>
            `;
			customServiceContainer.style.display = 'flex';

			const actionSelect = customServiceContainer.querySelector('#custom-service-action-select');
			actionSelect.value = currentEditSection;

			renderEditSection(serviceData);
		}

		const renderEditSection = (service) => {
			const editorDiv = customServiceContainer.querySelector('#custom-service-editor');
			editorDiv.innerHTML = '';
			apiKeyGroup.style.display = 'none';

			const createInputSection = (id, label, placeholder, value, fieldName) => {
				const section = document.createElement('div');
				section.className = 'settings-group static-label';
				section.innerHTML = `
                    <div class="input-wrapper">
                        <input type="text" id="${id}" class="settings-control settings-input" placeholder="${placeholder}" spellcheck="false">
                        <label for="${id}" class="settings-label">${label}</label>
                        <button class="settings-action-button-inline">保存</button>
                    </div>
                `;
				const input = section.querySelector('input');
				input.value = value;
				section.querySelector('button').addEventListener('click', async () => {
					const trimmedValue = input.value.trim();
					if (fieldName === 'url' && trimmedValue && !trimmedValue.startsWith('http')) {
						notifyAndLog('接口地址格式不正确，必须以 http 或 https 开头。', '保存失败', 'error');
						return;
					}
					saveAndSyncCustomServiceField(fieldName, trimmedValue);

					if (fieldName === 'url') {
						const hideWhitelistPrompt = GM_getValue('hide_whitelist_prompt', false);
						if (!hideWhitelistPrompt) {
							const confirmationMessage = `您正在添加一个自定义翻译服务接口地址。\n为了保护您的浏览器安全，油猴脚本要求您为这个新地址手动授权。\n您需要将刚才输入的接口地址域名添加到 AO3 Translator 的 “域名白名单” 中。\n点击 “确定” ，将跳转到一份图文版操作教程；点击 “取消” ，则不会进行跳转。\n是否跳转到教程页面？`;
							try {
								const result = await showCustomConfirm(confirmationMessage, '安全授权', { useTextIndent: true, showNeverAgain: true, modalClass: 'whitelist-auth-modal' });
								if (result === 'never_again') {
									GM_setValue('hide_whitelist_prompt', true);
								} else if (result === true) {
									window.open('https://v-lipset.github.io/docs/guides/whitelist', '_blank');
								}
							} catch (e) { }
						}
					}
				});
				return section;
			};

			switch (currentEditSection) {
				case 'name':
					editorDiv.appendChild(createInputSection('custom-service-name-input', '服务名称', '', service.name || '', 'name'));
					break;
				case 'url':
					editorDiv.appendChild(createInputSection('custom-service-url-input', '接口地址', 'https://api.example.com/v1/chat/completions', service.url || '', 'url'));
					break;
				case 'models':
					editorDiv.dataset.mode = 'select';
					renderModelEditor(service);
					break;
				case 'apiKey':
					const serviceId = currentServiceId || (isPendingCreation ? 'pending_custom' : null);
					const apiKeyString = serviceId === 'pending_custom' ? '' : GM_getValue(`${serviceId}_keys_string`, '');
					const serviceName = service.name || (isPendingCreation ? '新服务' : '自定义服务');
					editorDiv.appendChild(createInputSection('custom-service-apikey-input', `设置 ${serviceName} API Key`, 'Key 1，Key 2，Key 3', apiKeyString, 'apiKey'));
					break;
			}
			panelElements.panel.querySelectorAll('.settings-control').forEach(el => {
				if (el.value) el.classList.add('has-value');
			});
		};

		const renderModelEditor = (service) => {
			const editorDiv = customServiceContainer.querySelector('#custom-service-editor');
			editorDiv.innerHTML = '';
			const modelsRaw = service.modelsRaw || (service.models || []).join(', ');

			if (editorDiv.dataset.mode === 'edit' || !modelsRaw) {
				const section = document.createElement('div');
				section.className = 'settings-group static-label';
				section.innerHTML = `
                    <div class="input-wrapper">
                        <input type="text" id="custom-service-models-input" class="settings-control settings-input" placeholder="model 1，model 2，model 3" spellcheck="false">
                        <label for="custom-service-models-input" class="settings-label">模型 ID</label>
                        <button class="settings-action-button-inline">保存</button>
                    </div>
                `;
				const input = section.querySelector('input');
				input.value = modelsRaw;
				section.querySelector('button').addEventListener('click', () => {
					const rawValue = input.value;
					const normalizedModels = rawValue.replace(/[，]/g, ',').split(',').map(m => m.trim()).filter(Boolean);
					const serviceId = saveServiceField('models', normalizedModels);
					saveServiceField('modelsRaw', rawValue);
					SettingsSyncManager.syncUI();
					triggerModelFetchIfReady(serviceId);
					editorDiv.dataset.mode = 'select';
				});
				editorDiv.appendChild(section);
			} else {
				const section = document.createElement('div');
				section.className = 'settings-group static-label settings-group-select';
				const select = document.createElement('select');
				select.id = 'custom-service-models-select';
				select.className = 'settings-control settings-select custom-styled-select';
				(service.models || []).forEach(modelId => {
					const option = document.createElement('option');
					option.value = modelId;
					option.textContent = modelId;
					select.appendChild(option);
				});
				const editOption = document.createElement('option');
				editOption.value = 'edit_models';
				editOption.textContent = '编辑模型 ID';
				select.appendChild(editOption);
				section.innerHTML = `<label for="custom-service-models-select" class="settings-label">模型 ID</label>`;
				section.prepend(select);

				const activeModel = GM_getValue(`${ACTIVE_MODEL_PREFIX_KEY}${currentServiceId}`, (service.models || [])[0]);
				if (activeModel) {
					select.value = activeModel;
				}

				select.addEventListener('change', () => {
					if (select.value === 'edit_models') {
						editorDiv.dataset.mode = 'edit';
						renderModelEditor(service);
					} else {
						GM_setValue(`${ACTIVE_MODEL_PREFIX_KEY}${currentServiceId}`, select.value);
					}
				});
				editorDiv.appendChild(section);
			}
			panelElements.panel.querySelectorAll('.settings-control').forEach(el => {
				if (el.value) el.classList.add('has-value');
			});
		};

		return {
			enterEditMode: (serviceId) => {
				isPendingCreation = false;
				renderEditMode(serviceId);
			},
			startPendingCreation: () => {
				isPendingCreation = true;
				currentEditSection = 'name';
				const services = getServices();
				const defaultNamePrefix = '默认 ';
				const defaultNames = services.filter(s => s.name.startsWith(defaultNamePrefix))
					.map(s => parseInt(s.name.substring(defaultNamePrefix.length), 10))
					.filter(n => !isNaN(n));
				let nextNum = 1;
				while (defaultNames.includes(nextNum)) {
					nextNum++;
				}

				pendingServiceData = {
					name: `${defaultNamePrefix}${nextNum}`,
					url: '',
					models: [],
					modelsRaw: ''
				};

				modelGroup.style.display = 'none';
				apiKeyGroup.style.display = 'none';
				renderEditMode(null);
			},
			isPending: () => isPendingCreation,
			cancelPending: () => {
				isPendingCreation = false;
				pendingServiceData = {};
			},
			updatePendingSection: (newAction) => {
				if (isPendingCreation) {
					currentEditSection = newAction;
					renderEditMode(null);
				}
			},
			renderDisplayModeModelSelect: (serviceId) => {
				const services = getServices();
				const service = services.find(s => s.id === serviceId);
				if (!service) return;

				const models = service.models || [];
				modelSelect.innerHTML = '';

				if (models.length === 0) {
					const noModelOption = document.createElement('option');
					noModelOption.disabled = true;
					noModelOption.selected = true;
					noModelOption.textContent = '暂无模型';
					modelSelect.appendChild(noModelOption);
					modelSelect.disabled = true;
				} else {
					models.forEach(modelId => {
						const option = document.createElement('option');
						option.value = modelId;
						option.textContent = modelId;
						modelSelect.appendChild(option);
					});
					modelSelect.disabled = false;
					const activeModel = GM_getValue(`${ACTIVE_MODEL_PREFIX_KEY}${serviceId}`, models[0]);
					modelSelect.value = activeModel;
				}
				modelGroup.style.display = 'block';
			},
			deleteService: (serviceId) => {
				let services = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
				services = services.filter(s => s.id !== serviceId);
				setServices(services);

				GM_deleteValue(`${serviceId}_keys_string`);
				GM_deleteValue(`${serviceId}_keys_array`);
				GM_deleteValue(`${serviceId}_key_index`);
				GM_deleteValue(`${ACTIVE_MODEL_PREFIX_KEY}${serviceId}`);
				GM_deleteValue(`custom_service_last_action_${serviceId}`);

				const currentEngine = getValidEngineName();
				if (currentEngine === serviceId) {
					GM_setValue('transEngine', 'google_translate');
				}

				SettingsSyncManager.syncUI();
			}
		};
	}

	/**
	 * 清理无效的自定义服务配置
	 */
	function cleanupAllEmptyCustomServices() {
		const services = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
		const servicesToKeep = services.filter(s => {
			const hasName = s.name && s.name.trim() !== '';
			const hasUrl = s.url && s.url.trim() !== '';
			const hasModels = s.models && s.models.length > 0;
			const hasApiKey = GM_getValue(`${s.id}_keys_string`, '').trim() !== '';

			return hasName || hasUrl || hasModels || hasApiKey;
		});

		if (services.length !== servicesToKeep.length) {
			GM_setValue(CUSTOM_SERVICES_LIST_KEY, servicesToKeep);
			const currentEngine = GM_getValue('transEngine');
			const isCurrentEngineRemoved = !servicesToKeep.some(s => s.id === currentEngine);

			if (isCurrentEngineRemoved && currentEngine && currentEngine.startsWith('custom_')) {
				GM_setValue('transEngine', 'google_translate');
			}
		}
	}

	/**
	 * 解析用户输入的模型列表字符串
	 */
	function parseModelString(str) {
		const map = {};
		if (!str || typeof str !== 'string') return map;
		const regex = /['"‘“]?([^'":：,，\r\n‘“’”]+)['"’”]?\s*[:：]\s*['"‘“]?([^'",，\r\n‘“’”]+)['"’”]?/g;

		let match;
		while ((match = regex.exec(str)) !== null) {
			if (match[1] && match[2]) {
				const key = match[1].trim();
				const value = match[2].trim();
				if (key && value) {
					map[key] = value;
				}
			}
		}
		return map;
	}

	/**
	 * 将模型对象转换为易读的字符串格式
	 */
	function stringifyModelObject(obj) {
		if (!obj) return '';
		return Object.entries(obj)
			.map(([k, v]) => `'${k}': '${v}'`)
			.join(',\n');
	}

	/**
	 * 创建关联翻译服务模态框
	 */
	function createServiceAssociationModal(currentProfileId, onConfirm) {
		if (shadowWrapper.querySelector('#ai-service-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ai-service-overlay';
		overlay.className = 'ao3-overlay';

		const modal = document.createElement('div');
		modal.id = 'ai-service-modal';
		modal.className = 'ao3-modal';

		const builtInServices = Object.keys(engineMenuConfig).filter(id =>
			id !== 'google_translate' && id !== 'bing_translator' && id !== 'add_new_custom'
		);
		const customServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
		const allServices =[
			...builtInServices.map(id => ({ id, name: engineMenuConfig[id].displayName })),
			...customServices.map(s => ({ id: s.id, name: s.name }))
		];

		const profile = ProfileManager.getProfile(currentProfileId);
		const associatedServices = new Set(profile ? profile.services :[]);

		let html = `
			<div class="ao3-modal-header">
				<h3>翻译服务</h3>
				<div class="ai-select-all-btn">全选</div>
			</div>
			<div class="ao3-modal-body ao3-custom-scrollbar" id="ai-service-list">
		`;

		allServices.forEach(service => {
			const isChecked = associatedServices.has(service.id);
			html += `
				<label class="ai-service-item">
					<input type="checkbox" value="${service.id}" ${isChecked ? 'checked' : ''}>
					<span class="ai-service-label">${service.name}</span>
				</label>
			`;
		});

		html += `
			</div>
			<div class="ao3-modal-footer">
				<button class="ao3-modal-btn cancel">取消</button>
				<button class="ao3-modal-btn confirm">确认</button>
			</div>
		`;

		modal.innerHTML = html;
		overlay.appendChild(modal);
		shadowWrapper.appendChild(overlay);

		const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
		const selectAllBtn = modal.querySelector('.ai-select-all-btn');
		let isAllSelected = Array.from(checkboxes).every(cb => cb.checked);

		const updateSelectAllBtn = () => {
			selectAllBtn.textContent = isAllSelected ? '取消全选' : '全选';
		};
		updateSelectAllBtn();

		selectAllBtn.addEventListener('click', () => {
			isAllSelected = !isAllSelected;
			checkboxes.forEach(cb => cb.checked = isAllSelected);
			updateSelectAllBtn();
		});

		checkboxes.forEach(cb => {
			cb.addEventListener('change', () => {
				isAllSelected = Array.from(checkboxes).every(c => c.checked);
				updateSelectAllBtn();
			});
		});

		const cleanup = () => overlay.remove();

		modal.querySelector('.cancel').addEventListener('click', cleanup);
		modal.querySelector('.confirm').addEventListener('click', () => {
			const selectedIds = Array.from(checkboxes)
				.filter(cb => cb.checked)
				.map(cb => cb.value);
			onConfirm(selectedIds);
			cleanup();
		});

		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) cleanup();
		});
	}

	/**
	 * 初始化 AI 设置逻辑
	 */
	function initializeAiSettingsLogic(panelElements) {
		const {
			aiProfileSelect, aiServiceTrigger, aiParamSelect, aiParamInputArea
		} = panelElements;

		const LAST_PROFILE_KEY = 'ao3_ai_settings_last_profile';
		const LAST_PARAM_KEY = 'ao3_ai_settings_last_param';

		/**
		 * 校验 AI 参数合法性
		 */
		const validateAiParam = (value, config) => {
			if (!config.validation) return { valid: true, value: value };

			const num = parseFloat(value);
			const { min, max, step } = config.validation;
			const label = config.label;

			if (isNaN(num)) {
				return { valid: false, message: `${label} 必须是有效的数字。` };
			}

			if (min !== undefined && num < min) {
				return { valid: false, message: `${label} 不能小于 ${min}。` };
			}

			if (max !== undefined && num > max) {
				return { valid: false, message: `${label} 不能大于 ${max}。` };
			}

			if (step !== undefined) {
				const remainder = (num - (min || 0)) % step;
				if (remainder > 0.00001 && Math.abs(remainder - step) > 0.00001) {
					return { valid: false, message: `${label} 的步长必须是 ${step}。` };
				}
			}

			return { valid: true, value: num };
		};

		const generateNewProfileName = (profiles) => {
			let maxNum = 0;
			const regex = /^配置 (\d+)$/;
			profiles.forEach(p => {
				const match = p.name.match(regex);
				if (match) {
					const num = parseInt(match[1], 10);
					if (num > maxNum) maxNum = num;
				}
			});
			return `配置 ${maxNum + 1}`;
		};

		const updateParamOptions = (isProtected) => {
			const renameOption = aiParamSelect.querySelector('option[value="rename_profile"]');
			const deleteOption = aiParamSelect.querySelector('option[value="delete_profile"]');

			if (isProtected) {
				if (renameOption) renameOption.remove();
				if (deleteOption) deleteOption.remove();
				if (aiParamSelect.value === 'rename_profile' || aiParamSelect.value === 'delete_profile') {
					aiParamSelect.value = 'system_prompt';
					GM_setValue(LAST_PARAM_KEY, 'system_prompt');
				}
			} else {
				if (!renameOption) {
					const opt = document.createElement('option');
					opt.value = 'rename_profile';
					opt.textContent = '设置参数配置名';
					aiParamSelect.appendChild(opt);
				}
				if (!deleteOption) {
					const opt = document.createElement('option');
					opt.value = 'delete_profile';
					opt.textContent = '删除此参数配置';
					aiParamSelect.appendChild(opt);
				}
			}
		};

		const refreshProfileSelect = () => {
			const profiles = ProfileManager.getAllProfiles();
			const savedId = GM_getValue(LAST_PROFILE_KEY);
			let targetId = savedId;

			if (!profiles.find(p => p.id === savedId)) {
				targetId = profiles[0].id;
			}

			aiProfileSelect.innerHTML = '';
			profiles.forEach(p => {
				const option = document.createElement('option');
				option.value = p.id;
				option.textContent = p.name;
				aiProfileSelect.appendChild(option);
			});

			const createOption = document.createElement('option');
			createOption.value = 'create_new';
			createOption.textContent = '新建配置';
			aiProfileSelect.appendChild(createOption);

			aiProfileSelect.value = targetId;
			GM_setValue(LAST_PROFILE_KEY, targetId);

			const currentProfile = ProfileManager.getProfile(targetId);
			if (currentProfile) {
				updateParamOptions(currentProfile.isProtected);
			}

			return targetId;
		};

		const renderParamEditor = () => {
			const profileId = aiProfileSelect.value;
			const profile = ProfileManager.getProfile(profileId);
			if (!profile) return;

			const paramType = aiParamSelect.value;
			aiParamInputArea.innerHTML = '';

			// 处理重命名配置
			if (paramType === 'rename_profile') {
				if (profile.isProtected) return;
				const section = document.createElement('div');
				section.className = 'settings-group static-label';
				section.innerHTML = `
					<div class="input-wrapper">
						<input type="text" id="ai-profile-rename-input" class="settings-control settings-input" value="${profile.name}" spellcheck="false">
						<label for="ai-profile-rename-input" class="settings-label">配置名称</label>
						<button class="settings-action-button-inline">保存</button>
					</div>
				`;
				section.querySelector('button').addEventListener('click', () => {
					const newName = section.querySelector('input').value.trim();
					if (newName) {
						profile.name = newName;
						ProfileManager.saveProfile(profile);
						refreshProfileSelect();
					}
				});
				aiParamInputArea.appendChild(section);
				updateInputLabel(section.querySelector('input'));
				return;
			}

			const paramConfig = {
				system_prompt: { type: 'textarea', label: 'System Prompt', autoSave: true },
				user_prompt: { type: 'textarea', label: 'User Prompt', autoSave: true },
				temperature: {
					type: 'number',
					label: 'Temperature',
					attrs: { min: 0, max: 2, step: 0.1 },
					hint: ' (0-2)',
					validation: { min: 0, max: 2, step: 0.1 },
					defaultKey: 'temperature'
				},
				reasoning_effort: {
					type: 'select',
					label: '推理深度',
					options:[
						{ value: 'default', text: 'Default' },
						{ value: 'low', text: 'Low' },
						{ value: 'medium', text: 'Medium' },
						{ value: 'high', text: 'High' }
					],
					defaultKey: 'reasoning_effort'
				},
				chunk_size: {
					type: 'number',
					label: '每次翻译文本量',
					attrs: { min: 100, step: 100 },
					validation: { min: 100, step: 100 },
					defaultKey: 'chunk_size'
				},
				para_limit: {
					type: 'number',
					label: '每次翻译段落数',
					attrs: { min: 1, step: 1 },
					validation: { min: 1, step: 1 },
					defaultKey: 'para_limit'
				},
				request_rate: {
					type: 'number',
					label: '平均每秒请求数',
					attrs: { min: 0.1, step: 0.1 },
					hint: ' (req/s)',
					validation: { min: 0.1, step: 0.1 },
					defaultKey: 'request_rate'
				},
				request_capacity: {
					type: 'number',
					label: '最大突发请求数',
					attrs: { min: 1, step: 1 },
					hint: ' (burst)',
					validation: { min: 1, step: 1 },
					defaultKey: 'request_capacity'
				},
				lazy_load_margin: { type: 'text', label: '懒加载参数设置', hint: ' (px)' },
				validation_thresholds: { type: 'text', label: '占位符校验阈值', hint: ' (Abs, Ratio, Base, Zero)' }
			};

			const config = paramConfig[paramType];
			if (!config) return;

			const section = document.createElement('div');
			const inputId = `ai-param-input-${paramType}`;
			
			// 保存逻辑
			const saveValue = () => {
				let val = inputElement.value;
				
				// 仅对非下拉框进行合法性校验
				if (config.type !== 'select') {
					const validationResult = validateAiParam(val, config);
					if (!validationResult.valid) {
						const defaultValue = BASE_AI_PARAMS[config.defaultKey];
						GM_notification({
							title: '参数设置错误',
							text: `${validationResult.message}\n已自动重置为默认值：${defaultValue}。`
						});
						val = defaultValue;
						inputElement.value = val;
					} else {
						val = validationResult.value;
					}
				}

				profile.params[paramType] = val;
				ProfileManager.saveProfile(profile);
				updateInputLabel(inputElement);
			};

			let inputElement;

			if (config.type === 'select') {
				section.className = 'settings-group static-label settings-group-select';
				inputElement = document.createElement('select');
				inputElement.className = 'settings-control settings-select custom-styled-select';
				
				config.options.forEach(opt => {
					const option = document.createElement('option');
					option.value = opt.value;
					option.textContent = opt.text;
					inputElement.appendChild(option);
				});
				inputElement.value = profile.params[paramType] || BASE_AI_PARAMS[config.defaultKey];

				inputElement.addEventListener('change', saveValue);
				
				section.appendChild(inputElement);
			} else {
				// 普通输入框样式
				section.className = 'settings-group static-label';
				const inputWrapper = document.createElement('div');
				inputWrapper.className = 'input-wrapper';
				
				inputElement = document.createElement(config.type === 'textarea' ? 'textarea' : 'input');
				inputElement.className = 'settings-control settings-input';
				inputElement.setAttribute('spellcheck', 'false');
				if (config.type !== 'textarea') inputElement.type = config.type;
				if (config.attrs) Object.entries(config.attrs).forEach(([k, v]) => inputElement.setAttribute(k, v));
				inputElement.value = profile.params[paramType];

				inputWrapper.appendChild(inputElement);
				
				if (config.autoSave) {
					inputElement.addEventListener('blur', saveValue);
				} else {
					const saveBtn = document.createElement('button');
					saveBtn.className = 'settings-action-button-inline';
					saveBtn.textContent = '保存';
					saveBtn.addEventListener('click', saveValue);
					inputWrapper.appendChild(saveBtn);
				}
				section.appendChild(inputWrapper);
			}

			inputElement.id = inputId;
			const label = document.createElement('label');
			label.className = 'settings-label';
			label.htmlFor = inputId;
			label.textContent = config.label + (config.hint || '');
			section.appendChild(label);

			aiParamInputArea.appendChild(section);
			updateInputLabel(inputElement);
		};

		aiProfileSelect.addEventListener('change', () => {
			if (aiProfileSelect.value === 'create_new') {
				const profiles = ProfileManager.getAllProfiles();
				const newName = generateNewProfileName(profiles);
				const newId = ProfileManager.createProfile(newName);
				refreshProfileSelect();
				aiProfileSelect.value = newId;
				GM_setValue(LAST_PROFILE_KEY, newId);
				aiParamSelect.value = 'system_prompt';
				GM_setValue(LAST_PARAM_KEY, 'system_prompt');
			} else {
				GM_setValue(LAST_PROFILE_KEY, aiProfileSelect.value);
			}

			const profile = ProfileManager.getProfile(aiProfileSelect.value);
			if (profile) updateParamOptions(profile.isProtected);

			renderParamEditor();
		});

		aiServiceTrigger.addEventListener('click', () => {
			const profileId = aiProfileSelect.value;
			createServiceAssociationModal(profileId, (selectedIds) => {
				ProfileManager.updateServiceAssociation(profileId, selectedIds);
			});
		});

		aiParamSelect.addEventListener('change', () => {
			const paramType = aiParamSelect.value;

			if (paramType === 'delete_profile') {
				const profileId = aiProfileSelect.value;
				const profile = ProfileManager.getProfile(profileId);

				if (profile && !profile.isProtected) {
					showCustomConfirm(`您确定要删除 ${profile.name} 参数配置吗？\n\n注意：此操作无法撤销。`, '提示', { textAlign: 'center' })
						.then(() => {
							ProfileManager.deleteProfile(profileId);
							refreshProfileSelect();
							aiParamSelect.value = 'system_prompt';
							GM_setValue(LAST_PARAM_KEY, 'system_prompt');
							renderParamEditor();
						})
						.catch(() => {
							const lastParam = GM_getValue(LAST_PARAM_KEY, 'system_prompt');
							const safeParam = lastParam === 'delete_profile' ? 'system_prompt' : lastParam;
							aiParamSelect.value = safeParam;
							renderParamEditor();
						});
				}
				return;
			}

			GM_setValue(LAST_PARAM_KEY, paramType);
			renderParamEditor();
		});

		return {
			refresh: () => {
				refreshProfileSelect();
				const lastParam = GM_getValue(LAST_PARAM_KEY, 'system_prompt');
				const safeParam = lastParam === 'delete_profile' ? 'system_prompt' : lastParam;
				aiParamSelect.value = safeParam;
				renderParamEditor();
			}
		};
	}

	/**
	 * 设置面板的内部逻辑
	 */
	function initializeSettingsPanelLogic(panelElements, rerenderMenuCallback, onPanelCloseCallback) {
		let ignoreNextOutsideClickTime = 0;
		const setIgnoreOutsideClick = () => {
			ignoreNextOutsideClickTime = Date.now();
		};

		const {
			panel, closeBtn, header, masterSwitch, swapLangBtn, engineSelect, fromLangSelect, toLangSelect,
			modelGroup, modelSelect, displayModeSelect,
			apiKeyGroup, apiKeyInput, apiKeySaveBtn, customServiceContainer,
			serviceDetailsToggleContainer, serviceDetailsToggleBtn,
			glossaryActionsSelect, editableSections,
			aiSettingsSection,
			langDetectSection, langDetectSelect,
			localManageSection, localGlossarySelect, localEditModeSelect,
			localContainerName, localContainerTranslation, localContainerForbidden,
			localGlossaryNameInput, localGlossarySaveNameBtn,
			localSensitiveInput, localSensitiveSaveBtn,
			localInsensitiveInput, localInsensitiveSaveBtn,
			localForbiddenInput, localForbiddenSaveBtn,
			onlineManageSection, glossaryImportUrlInput, glossaryImportSaveBtn,
			openOnlineLibraryBtn, viewImportedGlossaryContainer, viewImportedGlossaryBtn,
			glossaryManageSelect, glossaryManageDetailsContainer, glossaryManageInfo, glossaryManageDeleteBtn,
			postReplaceSection, postReplaceSelect, postReplaceEditModeSelect,
			postReplaceContainerName, postReplaceContainerSettings,
			postReplaceNameInput, postReplaceSaveNameBtn,
			postReplaceInput, postReplaceSaveBtn,
			dataSyncActionsContainer, importDataBtn, exportDataBtn,
			debugModeSection, logLevelSelect, viewLogsBtn, logAutoClearSelect,
			blockerSection, blockerDimensionSelect, blockerSubDimensionSelect, blockerInputArea, blockerActionsContainer, toggleBlockerBtn, toggleReasonsBtn,
			formattingSection, fmtProfileSelect, fmtPropertySelect, fmtValueContainer,
			cacheAutoCleanupSelect
		} = panelElements;

		const PANEL_POSITION_KEY = 'ao3_panel_position';
		const GLOSSARY_ACTION_KEY = 'ao3_glossary_last_action';
		const LOCAL_GLOSSARY_SELECTED_ID_KEY = 'ao3_local_glossary_selected_id';
		const LOCAL_GLOSSARY_EDIT_MODE_KEY = 'ao3_local_glossary_edit_mode';
		const BLOCKER_VIEW_KEY = 'ao3_blocker_current_view';
		const BLOCKER_SUB_VIEW_KEY = 'ao3_blocker_current_sub_view';
		const TRANSLATION_MODE_KEY = 'ao3_translation_mode';
		const AUTO_TRANSLATE_KEY = 'ao3_auto_translate';
		const FAB_MANAGE_MODE_KEY = 'ao3_fab_manage_mode';
		const FAB_MANAGE_GESTURE_KEY = 'ao3_fab_manage_gesture';
		const CACHE_MANAGE_MODE_KEY = 'ao3_cache_manage_mode';

		const cacheManageSection = panel.querySelector('#editable-section-cache-manage');
		const cacheModeSelect = panel.querySelector('#cache-manage-mode-select');
		const cacheManualContainer = panel.querySelector('#cache-manage-manual-container');
		const cacheAutoContainer = panel.querySelector('#cache-manage-auto-container');
		const btnClearCurrentPage = panel.querySelector('#btn-clear-current-page-cache');
		const btnClearAllCache = panel.querySelector('#btn-clear-all-cache');
		const inputCacheMaxItems = panel.querySelector('#setting-input-cache-max-items');
		const btnCacheMaxItemsSave = panel.querySelector('#setting-btn-cache-max-items-save');
		const inputCacheMaxDays = panel.querySelector('#setting-input-cache-max-days');
		const btnCacheMaxDaysSave = panel.querySelector('#setting-btn-cache-max-days-save');
		const cacheCountDisplay = panel.querySelector('#cache-count-display');
		const fabManageSection = panel.querySelector('#editable-section-fab-manage');
		const fabModeSelect = panel.querySelector('#fab-manage-mode-select');
		const fabGestureSelect = panel.querySelector('#fab-manage-gesture-select');
		const fabActionSelect = panel.querySelector('#fab-manage-action-select');

		// 导出相关的 DOM 元素获取
		const exportManageSection = panel.querySelector('#editable-section-export-manage');
		const exportFormatSelect = panel.querySelector('#export-format-select');
		const exportTemplateSelect = panel.querySelector('#export-template-select');
		const exportActionSelect = panel.querySelector('#export-action-select');
		const exportContainerName = panel.querySelector('#export-container-name');
		const exportContainerEdit = panel.querySelector('#export-container-edit');
		const exportTemplateNameInput = panel.querySelector('#export-template-name');
		const btnExportSaveName = panel.querySelector('#btn-export-save-name');
		const btnOpenStyleEditor = panel.querySelector('#btn-open-style-editor');
		const exportActionsContainer = panel.querySelector('#export-actions-container');
		const btnExportFormatChoose = panel.querySelector('#btn-export-format-choose');
		const btnExportExecute = panel.querySelector('#btn-export-execute');
		// 初始化导出 UI 控制器
		const exportUI = ExportUIController.init(panel);
		const renderExportManage = exportUI.renderExportManage;

		// 获取当前模式，默认为 'unit' (单元模式)
		let currentMode = GM_getValue(TRANSLATION_MODE_KEY, 'unit');

		// 更新面板 UI 以反映当前模式
		const updatePanelModeUI = () => {
			const isFullPage = currentMode === 'full_page';
			const switchLabel = panel.querySelector('.settings-switch-group:first-child .settings-label');

			if (isFullPage) {
				document.body.classList.add('ao3-full-page-mode');
				if (switchLabel) switchLabel.textContent = '自动翻译页面';
				masterSwitch.checked = GM_getValue(AUTO_TRANSLATE_KEY, false);
			} else {
				document.body.classList.remove('ao3-full-page-mode');
				if (switchLabel) switchLabel.textContent = '显示翻译按钮';
				masterSwitch.checked = GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
			}
		};

		// 切换模式逻辑
		const toggleTranslationMode = () => {
			currentMode = currentMode === 'unit' ? 'full_page' : 'unit';
			GM_setValue(TRANSLATION_MODE_KEY, currentMode);

			if (currentMode === 'full_page') {
				const hasSwitched = GM_getValue('has_switched_to_full_page_once', false);
				if (!hasSwitched) {
					GM_setValue('has_switched_to_full_page_once', true);
					GM_setValue('from_lang', 'script_auto');
					if (fromLangSelect) {
						fromLangSelect.value = 'script_auto';
						updateInputLabel(fromLangSelect);
					}
				}
			}

			document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.MODE_CHANGED, { detail: { mode: currentMode } }));

			updatePanelModeUI();
			syncPanelState();
		};

		let isDragging = false;
		let origin = { x: 0, y: 0 }, startPosition = { x: 0, y: 0 };
		let activeDropdown = null;
		let isEditingBuiltInModel = false;

		const customServiceManager = createCustomServiceManager(panelElements);
		const aiSettingsLogic = initializeAiSettingsLogic(panelElements);

		const saveSetting = (key, value, defaultValue) => {
			if (value === defaultValue) {
				GM_deleteValue(key);
			} else {
				GM_setValue(key, value);
			}
		};

		const blockerConfig = {
			tags: {
				black: { label: '标签黑名单', keys: ['ao3_blocker_tags_black'], ph: "'*标签 1*', '标签 2'-'标签 3'" },
				white: { label: '标签白名单', keys: ['ao3_blocker_tags_white'], ph: "'*标签 1*', '标签 2'+'标签 3'" }
			},
			content: {
				author: { label: '作者黑名单', keys: ['ao3_blocker_content_author'], ph: '作者名 1, 作者名 2, 作者名 3' },
				id: { label: '作品黑名单', keys: ['ao3_blocker_content_id'], ph: '作品 ID 1, 作品 ID 2, 作品 ID 3' },
				title: { label: '标题黑名单', keys: ['ao3_blocker_content_title'], ph: '关键词 1, 关键词 2, 关键词 3' },
				summary: { label: '简介黑名单', keys: ['ao3_blocker_content_summary'], ph: '关键词 1, 关键词 2, 关键词 3' }
			},
			stats: {
				words: { label: '字数范围', keys: ['ao3_blocker_stats_min_words', 'ao3_blocker_stats_max_words'], ph: '1000-10000', isRange: true },
				chapters: { label: '章节范围', keys: ['ao3_blocker_stats_min_chapters', 'ao3_blocker_stats_max_chapters'], ph: '2-50', isRange: true },
				update: { label: '更新时间', inputLabel: 'n 月内未更新 (连载)', keys: ['ao3_blocker_stats_update'], ph: '6' },
				crossover: { label: '同人圈数', inputLabel: '最大数量限制', keys: ['ao3_blocker_stats_crossover'], ph: '5' },
				lang: { label: '语言筛选', inputLabel: '仅显示的语言', keys: ['ao3_blocker_adv_lang'], ph: '中文-普通话 國語, English' }
			},
			advanced: {
				pairing: {
					label: '主要关系筛选',
					getInputLabel: () => {
						const scope = parseInt(GM_getValue('ao3_blocker_adv_scope_rel', DEFAULT_CONFIG.BLOCKER.adv_scope_rel)) || 1;
						return scope === 1 ? '第 1 个关系标签' : `前 ${scope} 个关系标签`;
					},
					keys: ['ao3_blocker_adv_pairing'],
					ph: "'关系 1', '关系 2', '关系 3'"
				},
				char: {
					label: '主要角色筛选',
					getInputLabel: () => {
						const scope = parseInt(GM_getValue('ao3_blocker_adv_scope_char', DEFAULT_CONFIG.BLOCKER.adv_scope_char)) || 5;
						return scope === 1 ? '第 1 个角色标签' : `前 ${scope} 个角色标签`;
					},
					keys: ['ao3_blocker_adv_char'],
					ph: "'角色 1', '角色 2', '角色 3'"
				},
				scope: {
					label: '调整检索深度',
					isDual: true,
					keys: ['ao3_blocker_adv_scope_rel', 'ao3_blocker_adv_scope_char'],
					labels: ['主要关系检索深度', '主要角色检索深度'],
					phs: ['1', '5']
				}
			}
		};

		const fetchModelsForBuiltInService = async (engineId) => {
			const config = engineMenuConfig[engineId];
			const apiConfig = CONFIG.TRANS_ENGINES[engineId];
			if (!config || !apiConfig) return;

			const serviceName = config.displayName;
			const customMappingKey = `${engineId}_custom_model_mapping`;
			
			const apiKey = (GM_getValue(`${engineId}_keys_array`, [])[0] || '').trim();
			if (!apiKey) {
				notifyAndLog(`请先设置 ${serviceName} 的 API Key。`, '获取失败', 'error');
				renderBuiltInModelUI(engineId);
				return;
			}

			let baseUrl = apiConfig.url_api || apiConfig.url;
			if (!baseUrl) {
				notifyAndLog(`无法获取 ${serviceName} 的接口地址。`, '获取失败', 'error');
				renderBuiltInModelUI(engineId);
				return;
			}

			let modelsUrl = baseUrl.replace(/\/chat\/?(completions)?\/?$/, '') + '/models';
			
			if (engineId === 'google_ai') {
				modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
			} else if (engineId === 'anthropic') {
				modelsUrl = 'https://api.anthropic.com/v1/models';
			}

			try {
				const select = modelGroup.querySelector('select');
				let originalValue = null;
				if (select) {
					originalValue = GM_getValue(config.modelGmKey);
					const fetchOption = select.querySelector('option[value="FETCH_MODELS_INLINE"]');
					if (fetchOption) fetchOption.textContent = '获取中...';
					select.disabled = true;
				}

				const headers = { 'Accept': 'application/json' };
				if (engineId === 'anthropic') {
					headers['x-api-key'] = apiKey;
					headers['anthropic-version'] = '2023-06-01';
				} else if (engineId !== 'google_ai') {
					headers['Authorization'] = `Bearer ${apiKey}`;
				}

				const response = await new Promise((resolve, reject) => {
					GM_xmlhttpRequest({
						method: 'GET',
						url: modelsUrl,
						headers: headers,
						responseType: 'json',
						timeout: 15000,
						onload: res => {
							if (res.status === 200 && res.response) {
								resolve(res.response);
							} else {
								reject(new Error(`服务器返回状态 ${res.status}。`));
							}
						},
						onerror: () => reject(new Error('网络请求失败。')),
						ontimeout: () => reject(new Error('请求超时。'))
					});
				});

				let models =[];
				if (engineId === 'google_ai') {
					const modelsList = getNestedProperty(response, 'models') ||[];
					models = modelsList.map(m => m.name.replace('models/', ''));
				} else {
					const dataList = getNestedProperty(response, 'data') || response;
					if (Array.isArray(dataList)) {
						models = dataList.map(m => m.id).filter(Boolean);
					}
				}

				if (!Array.isArray(models) || models.length === 0) {
					throw new Error('API 返回的数据格式不正确或模型列表为空。');
				}

				const newMapping = {};
				models.forEach(modelId => {
					newMapping[modelId] = modelId;
				});

				GM_setValue(customMappingKey, newMapping);
				
				if (config.modelGmKey) {
					if (models.includes(originalValue)) {
						GM_setValue(config.modelGmKey, originalValue);
					} else {
						GM_setValue(config.modelGmKey, models[0]);
					}
				}

				notifyAndLog(`成功获取 ${models.length} 个模型。`, '获取成功', 'info');
				renderBuiltInModelUI(engineId);

			} catch (error) {
				Logger.error('Network', `获取内置服务模型失败: ${error.message}`);
				notifyAndLog(`获取模型失败：${error.message}`, '操作失败', 'error');
				renderBuiltInModelUI(engineId);
			}
		};

		function renderBuiltInModelUI(engineId) {
			const config = engineMenuConfig[engineId];
			if (engineId.startsWith('custom_')) {
				if (!modelGroup.contains(modelSelect)) {
					modelGroup.innerHTML = '';
					modelGroup.appendChild(modelSelect);
					let label = modelGroup.querySelector(`label[for="${modelSelect.id}"]`);
					if (!label) {
						label = document.createElement('label');
						label.htmlFor = modelSelect.id;
						label.className = 'settings-label';
						label.textContent = '使用模型';
						modelGroup.appendChild(label);
					}
					modelGroup.className = 'settings-group settings-group-select';
				}
				modelGroup.style.display = 'block';
				customServiceManager.renderDisplayModeModelSelect(engineId);
				updateInputLabel(modelSelect);
				return;
			}
			modelGroup.innerHTML = '';
			modelGroup.style.display = 'none';

			if (!config || !config.modelMapping) return;

			modelGroup.style.display = 'block';
			const customMappingKey = `${engineId}_custom_model_mapping`;
			const currentMapping = GM_getValue(customMappingKey) || config.modelMapping;

			if (isEditingBuiltInModel) {
				modelGroup.className = 'settings-group static-label';

				const wrapper = document.createElement('div');
				wrapper.className = 'input-wrapper';

				const input = document.createElement('input');
				input.type = 'text';
				input.className = 'settings-control settings-input';
				input.value = stringifyModelObject(currentMapping).replace(/\n/g, ' ');
				input.placeholder = "'ID 1': '名称 1', 'ID 2': '名称 2'";
				input.spellcheck = false;

				const label = document.createElement('label');
				label.className = 'settings-label';
				label.textContent = '编辑模型 ID';

				const saveBtn = document.createElement('button');
				saveBtn.className = 'settings-action-button-inline';
				saveBtn.textContent = '保存';

				saveBtn.addEventListener('click', () => {
					const newMapping = parseModelString(input.value);
					if (Object.keys(newMapping).length === 0) {
						GM_deleteValue(customMappingKey);
					} else {
						GM_setValue(customMappingKey, newMapping);
					}

					isEditingBuiltInModel = false;
					renderBuiltInModelUI(engineId);
				});

				wrapper.appendChild(input);
				wrapper.appendChild(label);
				wrapper.appendChild(saveBtn);
				modelGroup.appendChild(wrapper);
				updateInputLabel(input);

			} else {
				modelGroup.className = 'settings-group settings-group-select';

				const select = document.createElement('select');
				select.id = 'setting-trans-model';
				select.className = 'settings-control settings-select custom-styled-select';

				Object.keys(currentMapping).forEach(modelId => {
					const option = document.createElement('option');
					option.value = modelId;
					option.textContent = currentMapping[modelId];
					select.appendChild(option);
				});

				const fetchOption = document.createElement('option');
				fetchOption.value = 'FETCH_MODELS_INLINE';
				fetchOption.textContent = '获取模型 ID';
				select.appendChild(fetchOption);

				const editOption = document.createElement('option');
				editOption.value = 'EDIT_MODELS_INLINE';
				editOption.textContent = '编辑模型 ID';
				select.appendChild(editOption);

				const resetOption = document.createElement('option');
				resetOption.value = 'RESET_MODELS_INLINE';
				resetOption.textContent = '重置模型 ID';
				select.appendChild(resetOption);
				const savedModel = GM_getValue(config.modelGmKey);
				if (savedModel && currentMapping[savedModel]) {
					select.value = savedModel;
				} else {
					const firstModel = Object.keys(currentMapping)[0];
					select.value = firstModel;
					GM_setValue(config.modelGmKey, firstModel);
				}

				select.addEventListener('change', () => {
					if (select.value === 'FETCH_MODELS_INLINE') {
						fetchModelsForBuiltInService(engineId);
					} else if (select.value === 'EDIT_MODELS_INLINE') {
						isEditingBuiltInModel = true;
						renderBuiltInModelUI(engineId);
					} else if (select.value === 'RESET_MODELS_INLINE') {
						GM_deleteValue(customMappingKey);
						renderBuiltInModelUI(engineId);
					} else {
						GM_setValue(config.modelGmKey, select.value);
					}
				});

				const label = document.createElement('label');
				label.htmlFor = 'setting-trans-model';
				label.className = 'settings-label';
				label.textContent = '使用模型';

				modelGroup.appendChild(select);
				modelGroup.appendChild(label);
				updateInputLabel(select);
			}
		}

		function updateApiKeySection(engineId) {
			const config = engineMenuConfig[engineId];
			if (config && config.requiresApiKey) {
				apiKeyGroup.style.display = 'block';
				const stringKeyName = `${engineId}_keys_string`;
				apiKeyInput.value = GM_getValue(stringKeyName, '');
				apiKeyGroup.querySelector('.settings-label').textContent = `设置 ${config.displayName} API Key`;
				apiKeyInput.placeholder = 'Key 1，Key 2，Key 3';
				updateInputLabel(apiKeyInput);
			} else {
				apiKeyGroup.style.display = 'none';
			}
		}

		function updateUiForEngine(engineId) {
			customServiceContainer.style.display = 'none';
			modelGroup.style.display = 'none';
			apiKeyGroup.style.display = 'none';
			serviceDetailsToggleContainer.style.display = 'none';

			if (engineId.startsWith('custom_')) {
				customServiceManager.enterEditMode(engineId);
				serviceDetailsToggleContainer.style.display = 'flex';
			} else if (engineId === ADD_NEW_CUSTOM_SERVICE_ID) {
				serviceDetailsToggleContainer.style.display = 'flex';
				customServiceContainer.style.display = 'flex';
			} else {
				const isBuiltInSimple = engineId === 'google_translate' || engineId === 'bing_translator';
				if (!isBuiltInSimple) {
					serviceDetailsToggleContainer.style.display = 'flex';
					renderBuiltInModelUI(engineId);
					updateApiKeySection(engineId);
				}
			}

			if (serviceDetailsToggleContainer.style.display === 'flex') {
				const isCollapsed = GM_getValue(`service_collapsed_${engineId}`, false);
				serviceDetailsToggleBtn.classList.toggle('collapsed', isCollapsed);
				if (isCollapsed) {
					modelGroup.style.display = 'none';
					apiKeyGroup.style.display = 'none';
					if (engineId.startsWith('custom_') || engineId === ADD_NEW_CUSTOM_SERVICE_ID) {
						customServiceContainer.style.display = 'none';
					}
				}
			}

			updateAllLabels();
		}

		const populateEngineSelect = () => {
			engineSelect.innerHTML = '';
			const customServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
			const createOption = (engineId, config) => {
				const option = document.createElement('option');
				option.value = engineId;
				option.textContent = config.displayName;
				return option;
			};
			engineSelect.appendChild(createOption('google_translate', engineMenuConfig['google_translate']));
			engineSelect.appendChild(createOption('bing_translator', engineMenuConfig['bing_translator']));
			const sortedBuiltInServices = Object.keys(engineMenuConfig)
				.filter(id => id !== 'google_translate' && id !== 'bing_translator' && id !== ADD_NEW_CUSTOM_SERVICE_ID)
				.sort((a, b) => engineMenuConfig[a].displayName.localeCompare(engineMenuConfig[b].displayName));
			sortedBuiltInServices.forEach(id => {
				engineSelect.appendChild(createOption(id, engineMenuConfig[id]));
			});
			customServices.forEach(service => {
				const option = document.createElement('option');
				option.value = service.id;
				option.textContent = service.name || `默认 ${customServices.indexOf(service) + 1}`;
				option.dataset.isCustom = 'true';
				engineSelect.appendChild(option);
			});
			engineSelect.appendChild(createOption(ADD_NEW_CUSTOM_SERVICE_ID, engineMenuConfig[ADD_NEW_CUSTOM_SERVICE_ID]));
		};

		function syncPanelState() {
			currentMode = GM_getValue(TRANSLATION_MODE_KEY, 'unit');
			
			updatePanelModeUI();
			const isEnabled = currentMode === 'full_page' ? GM_getValue(AUTO_TRANSLATE_KEY, false) : GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
			masterSwitch.checked = isEnabled;
			populateEngineSelect();
			const currentEngine = getValidEngineName();
			engineSelect.value = currentEngine;
			updateUiForEngine(currentEngine);
			fromLangSelect.value = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			toLangSelect.value = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
			updateSwapButtonState();
			displayModeSelect.value = GM_getValue('translation_display_mode', DEFAULT_CONFIG.GENERAL.translation_display_mode);
			applyDisplayModeChange(displayModeSelect.value);
			exportFormatSelect.value = GM_getValue('ao3_export_last_format', 'html');
			exportActionSelect.value = GM_getValue('ao3_export_last_action', 'name');

			updateAllLabels();
		}

		const isMobile = () => window.innerWidth < 768;
		const ensureOnScreen = (pos, size) => {
			const newPos = { ...pos };
			const winW = document.documentElement.clientWidth;
			const winH = window.innerHeight;
			const margin = 10;
			newPos.x = Math.max(margin, Math.min(newPos.x, winW - size.width - margin));
			newPos.y = Math.max(margin, Math.min(newPos.y, winH - size.height - margin));
			return newPos;
		};
		const updatePanelPosition = () => {
			if (panel.style.display !== 'flex') return;
			if (isMobile()) {
				panel.classList.add('mobile-fixed-center');
				panel.style.left = '';
				panel.style.top = '';
			} else {
				panel.classList.remove('mobile-fixed-center');

				const panelWidth = panel.offsetWidth || 300;
				const panelHeight = panel.offsetHeight || 400;

				let savedPos = GM_getValue(PANEL_POSITION_KEY);
				const hasBeenOpened = GM_getValue('panel_has_been_opened_once', false);
				
				if (!hasBeenOpened) {
					const winW = document.documentElement.clientWidth;
					const winH = window.innerHeight;
					savedPos = {
						x: (winW - panelWidth) / 2,
						y: (winH - panelHeight) / 2
					};
					GM_setValue(PANEL_POSITION_KEY, savedPos);
					GM_setValue('panel_has_been_opened_once', true);
				} else if (!savedPos || isDragging) {
					savedPos = { x: panel.offsetLeft, y: panel.offsetTop };
				}
				
				const correctedPos = ensureOnScreen(savedPos, { width: panelWidth, height: panelHeight });
				panel.style.left = `${correctedPos.x}px`;
				panel.style.top = `${correctedPos.y}px`;
			}
			repositionActiveDropdown();
		};
		const updateAllLabels = () => {
			panel.querySelectorAll('.settings-control').forEach(updateInputLabel);
		};

		function populateLocalGlossarySelect() {
			const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
			localGlossarySelect.innerHTML = '';
			glossaries.forEach(g => {
				const option = document.createElement('option');
				option.value = g.id;
				option.textContent = g.name;
				option.dataset.isLocalGlossary = 'true';
				localGlossarySelect.appendChild(option);
			});
			const createOption = document.createElement('option');
			createOption.value = 'create_new';
			createOption.textContent = '新建术语表';
			localGlossarySelect.appendChild(createOption);
		}

		function loadLocalGlossaryData(id) {
			const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
			const glossary = glossaries.find(g => g.id === id);
			if (glossary) {
				localGlossaryNameInput.value = glossary.name;
				localSensitiveInput.value = glossary.sensitive || '';
				localInsensitiveInput.value = glossary.insensitive || '';
				localForbiddenInput.value = glossary.forbidden || '';
				updateAllLabels();
			}
		}

		function generateNewGlossaryName(glossaries) {
			const prefix = "术语表 ";
			let maxNum = 0;
			glossaries.forEach(g => {
				if (g.name.startsWith(prefix)) {
					const num = parseInt(g.name.slice(prefix.length), 10);
					if (!isNaN(num) && num > maxNum) maxNum = num;
				}
			});
			return prefix + (maxNum + 1);
		}

		function handleDeleteLocalGlossary(id) {
			let glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
			glossaries = glossaries.filter(g => g.id !== id);
			if (glossaries.length === 0) {
				glossaries.push({
					id: `local_${Date.now()}`,
					name: '默认',
					sensitive: '',
					insensitive: '',
					forbidden: '',
					enabled: true
				});
			}
			GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);

			const currentSelected = localGlossarySelect.value;
			let nextId = glossaries[0].id;
			if (id === currentSelected) {
				GM_setValue(LOCAL_GLOSSARY_SELECTED_ID_KEY, nextId);
			}

			populateLocalGlossarySelect();
			const newSelected = (id === currentSelected) ? nextId : currentSelected;
			localGlossarySelect.value = newSelected;
			loadLocalGlossaryData(newSelected);

			localEditModeSelect.value = 'name';
			updateLocalEditVisibility();
			GM_setValue(LOCAL_GLOSSARY_EDIT_MODE_KEY, 'name');

			SettingsSyncManager.syncGlossary();
		}

		function updateLocalEditVisibility() {
			const mode = localEditModeSelect.value;
			localContainerName.style.display = 'none';
			localContainerTranslation.style.display = 'none';
			localContainerForbidden.style.display = 'none';

			if (mode === 'name') {
				localContainerName.style.display = 'block';
			} else if (mode === 'translation') {
				localContainerTranslation.style.display = 'flex';
			} else if (mode === 'forbidden') {
				localContainerForbidden.style.display = 'block';
			}
		}

		function populatePostReplaceSelect() {
			const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
			postReplaceSelect.innerHTML = '';
			rules.forEach(r => {
				const option = document.createElement('option');
				option.value = r.id;
				option.textContent = r.name;
				option.dataset.isPostReplaceRule = 'true';
				postReplaceSelect.appendChild(option);
			});
			const createOption = document.createElement('option');
			createOption.value = 'create_new';
			createOption.textContent = '新建替换规则';
			postReplaceSelect.appendChild(createOption);
		}

		function loadPostReplaceData(id) {
			const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
			const rule = rules.find(r => r.id === id);
			if (rule) {
				postReplaceNameInput.value = rule.name;
				postReplaceInput.value = rule.content || '';
				updateAllLabels();
			}
		}

		function generateNewPostReplaceName(rules) {
			const prefix = "规则 ";
			let maxNum = 0;
			rules.forEach(r => {
				if (r.name.startsWith(prefix)) {
					const num = parseInt(r.name.slice(prefix.length), 10);
					if (!isNaN(num) && num > maxNum) maxNum = num;
				}
			});
			return prefix + (maxNum + 1);
		}

		function handleDeletePostReplaceRule(id) {
			let rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
			rules = rules.filter(r => r.id !== id);
			if (rules.length === 0) {
				rules.push({
					id: `replace_${Date.now()}`,
					name: '默认',
					content: '',
					enabled: true
				});
			}
			GM_setValue(POST_REPLACE_RULES_KEY, rules);

			const currentSelected = postReplaceSelect.value;
			let nextId = rules[0].id;
			if (id === currentSelected) {
				GM_setValue(POST_REPLACE_SELECTED_ID_KEY, nextId);
			}

			populatePostReplaceSelect();
			const newSelected = (id === currentSelected) ? nextId : currentSelected;
			postReplaceSelect.value = newSelected;
			loadPostReplaceData(newSelected);

			postReplaceEditModeSelect.value = 'name';
			updatePostReplaceEditVisibility();
			GM_setValue(POST_REPLACE_EDIT_MODE_KEY, 'name');

			SettingsSyncManager.syncGlossary();
		}

		function updatePostReplaceEditVisibility() {
			const mode = postReplaceEditModeSelect.value;
			postReplaceContainerName.style.display = 'none';
			postReplaceContainerSettings.style.display = 'none';

			if (mode === 'name') {
				postReplaceContainerName.style.display = 'block';
			} else if (mode === 'settings') {
				postReplaceContainerSettings.style.display = 'block';
			}
		}

		const toggleEditableSection = (sectionToShow) => {
			editableSections.forEach(s => s.style.display = 'none');
			dataSyncActionsContainer.style.display = 'none';
			blockerActionsContainer.style.display = 'none';
			exportActionsContainer.style.display = 'none';
			if (sectionToShow) {
				sectionToShow.style.display = 'flex';
				if (sectionToShow.id === 'editable-section-blocker') {
					blockerActionsContainer.style.display = 'flex';
				}
				if (sectionToShow.id === 'editable-section-export-manage') {
					exportActionsContainer.style.display = 'flex';
				}
				const input = sectionToShow.querySelector('.settings-control');
				if (input) updateInputLabel(input);
			}
		};

		const updateBlockerButtonText = () => {
			toggleBlockerBtn.textContent = GM_getValue('ao3_blocker_enabled', DEFAULT_CONFIG.BLOCKER.enabled) ? '禁用作品屏蔽' : '启用作品屏蔽';
			toggleReasonsBtn.textContent = GM_getValue('ao3_blocker_show_reasons', DEFAULT_CONFIG.BLOCKER.show_reasons) ? '隐藏屏蔽原因' : '显示屏蔽原因';
		};

		const renderBlockerSubDimensions = () => {
			const dimension = blockerDimensionSelect.value;
			const subConfig = blockerConfig[dimension];
			blockerSubDimensionSelect.innerHTML = '';
			Object.keys(subConfig).forEach(key => {
				const option = document.createElement('option');
				option.value = key;
				option.textContent = subConfig[key].label;
				blockerSubDimensionSelect.appendChild(option);
			});
			const savedSub = GM_getValue(BLOCKER_SUB_VIEW_KEY, DEFAULT_CONFIG.BLOCKER.current_sub_view);
			if (savedSub && subConfig[savedSub]) {
				blockerSubDimensionSelect.value = savedSub;
			} else {
				blockerSubDimensionSelect.selectedIndex = 0;
			}
			renderBlockerInput();
		};

		const renderBlockerInput = () => {
			const dimension = blockerDimensionSelect.value;
			const subDimension = blockerSubDimensionSelect.value;
			const config = blockerConfig[dimension][subDimension];
			blockerInputArea.innerHTML = '';

			if (config.isDual) {
				config.keys.forEach((key, index) => {
					const group = document.createElement('div');
					group.className = 'settings-group static-label';
					const labelText = config.labels[index];
					const placeholder = config.phs[index];
					const inputId = `input-blocker-val-${index}`;

					group.innerHTML = `
                        <div class="input-wrapper">
                            <input type="text" id="${inputId}" class="settings-control settings-input" placeholder="${placeholder}" spellcheck="false">
                            <label for="${inputId}" class="settings-label">${labelText}</label>
                            <button class="settings-action-button-inline">保存</button>
                        </div>
                    `;
					const input = group.querySelector('input');
					const defaultKey = key.replace('ao3_blocker_', '');
					const defaultValue = DEFAULT_CONFIG.BLOCKER[defaultKey] || '';
					input.value = GM_getValue(key, defaultValue);
					group.querySelector('button').addEventListener('click', () => {
						const val = input.value.trim();
						saveSetting(key, val, defaultValue);
						updateInputLabel(input);
						SettingsSyncManager.syncBlocker('full');
					});
					blockerInputArea.appendChild(group);
					updateInputLabel(input);
				});
			} else {
				const group = document.createElement('div');
				group.className = 'settings-group static-label';

				let displayLabel = config.label;
				if (config.getInputLabel) {
					displayLabel = config.getInputLabel();
				} else if (config.inputLabel) {
					displayLabel = config.inputLabel;
				}

				group.innerHTML = `
                    <div class="input-wrapper">
                        <input type="text" id="input-blocker-val" class="settings-control settings-input" placeholder="${config.ph}" spellcheck="false">
                        <label for="input-blocker-val" class="settings-label">${displayLabel}</label>
                        <button class="settings-action-button-inline">保存</button>
                    </div>
                `;
				const input = group.querySelector('input');

				if (config.isRange) {
					const defaultKeyMin = config.keys[0].replace('ao3_blocker_', '');
					const defaultKeyMax = config.keys[1].replace('ao3_blocker_', '');
					const min = GM_getValue(config.keys[0], DEFAULT_CONFIG.BLOCKER[defaultKeyMin] || '');
					const max = GM_getValue(config.keys[1], DEFAULT_CONFIG.BLOCKER[defaultKeyMax] || '');
					if (min && max) input.value = `${min}-${max}`;
					else if (min) input.value = min;
					else if (max) input.value = `-${max}`;
				} else {
					const defaultKey = config.keys[0].replace('ao3_blocker_', '');
					const defaultValue = DEFAULT_CONFIG.BLOCKER[defaultKey] || '';
					input.value = GM_getValue(config.keys[0], defaultValue);
				}

				group.querySelector('button').addEventListener('click', () => {
					const val = input.value.trim();
					if (config.isRange) {
						const defaultKeyMin = config.keys[0].replace('ao3_blocker_', '');
						const defaultKeyMax = config.keys[1].replace('ao3_blocker_', '');

						const parts = val.split(/[-－—]/);
						if (parts.length >= 2) {
							saveSetting(config.keys[0], parts[0].trim(), DEFAULT_CONFIG.BLOCKER[defaultKeyMin] || '');
							saveSetting(config.keys[1], parts[1].trim(), DEFAULT_CONFIG.BLOCKER[defaultKeyMax] || '');
						} else {
							saveSetting(config.keys[0], val, DEFAULT_CONFIG.BLOCKER[defaultKeyMin] || '');
							saveSetting(config.keys[1], '', DEFAULT_CONFIG.BLOCKER[defaultKeyMax] || '');
						}
					} else {
						const defaultKey = config.keys[0].replace('ao3_blocker_', '');
						saveSetting(config.keys[0], val, DEFAULT_CONFIG.BLOCKER[defaultKey] || '');
					}
					updateInputLabel(input);
					SettingsSyncManager.syncBlocker('full');
				});

				blockerInputArea.appendChild(group);
				updateInputLabel(input);
			}
		};

		const saveApiKey = () => {
			const engineId = engineSelect.value;
			const value = apiKeyInput.value;
			let serviceIdToUpdate;
			if (engineId.startsWith('custom_')) {
				serviceIdToUpdate = engineId;
			} else if (engineId === ADD_NEW_CUSTOM_SERVICE_ID && customServiceManager.isPending()) {
				serviceIdToUpdate = customServiceManager.ensureServiceExists();
			} else {
				serviceIdToUpdate = engineId;
			}
			if (!serviceIdToUpdate) {
				return;
			}
			const stringKeyName = `${serviceIdToUpdate}_keys_string`;
			const arrayKeyName = `${serviceIdToUpdate}_keys_array`;
			GM_setValue(stringKeyName, value);
			const keysArray = value.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
			GM_setValue(arrayKeyName, keysArray);
			GM_deleteValue(`${serviceIdToUpdate}_key_index`);
		};

		const resetDeleteButton = () => {
			glossaryManageDeleteBtn.textContent = '删除';
			glossaryManageDeleteBtn.removeAttribute('data-confirming');
		};

		const populateManageGlossary = () => {
			const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
			const urls = Object.keys(metadata);
			const lastSelectedUrl = GM_getValue(LAST_SELECTED_GLOSSARY_KEY, null);
			glossaryManageSelect.innerHTML = '';
			if (urls.length === 0) {
				glossaryManageSelect.innerHTML = '<option value="" disabled selected>暂无术语表</option>';
				glossaryManageSelect.disabled = true;
				glossaryManageDetailsContainer.style.display = 'none';
			} else {
				urls.forEach(url => {
					const filename = url.split('/').pop();
					const lastDotIndex = filename.lastIndexOf('.');
					const baseName = (lastDotIndex > 0) ? filename.substring(0, lastDotIndex) : filename;
					const name = decodeURIComponent(baseName);
					const option = document.createElement('option');
					option.value = url;
					option.textContent = name;
					option.title = name;
					glossaryManageSelect.appendChild(option);
				});
				glossaryManageSelect.disabled = false;
				if (lastSelectedUrl && urls.includes(lastSelectedUrl)) {
					glossaryManageSelect.value = lastSelectedUrl;
				} else {
					glossaryManageSelect.selectedIndex = 0;
				}
			}
			glossaryManageSelect.dispatchEvent(new Event('change'));
			resetDeleteButton();
		};

		const renderFabManage = () => {
			const config = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
			const mode = fabModeSelect.value;
			const gesture = fabGestureSelect.value;

			fabActionSelect.innerHTML = '';
			
			const addOption = (val, text) => {
				const opt = document.createElement('option');
				opt.value = val;
				opt.textContent = text;
				fabActionSelect.appendChild(opt);
			};

			addOption('toggle_panel', '打开/关闭设置面板');
			
			// 仅在“整页翻译模式”下，才添加“触发翻译/清除译文”选项
			if (mode === 'full_page') {
				addOption('toggle_translate', '触发翻译/清除译文');
			}
			
			addOption('clear_cache', '清除当前页面缓存');
			addOption('export_work', '导出当前作品');
			addOption('none', '无操作');

			let savedAction = config[mode][gesture] || 'none';

			// 安全校验：如果当前是单元模式，且保存的动作是不合法的 toggle_translate，则强制重置为 none
			if (mode === 'unit' && savedAction === 'toggle_translate') {
				savedAction = 'none';
				config[mode][gesture] = savedAction;
				GM_setValue('ao3_fab_actions', config);
			}

			fabActionSelect.value = savedAction;
			
			// 刷新输入框的 Label 浮动状态
			if (typeof updateInputLabel === 'function') {
				updateInputLabel(fabActionSelect);
			}
		};

		fabModeSelect.addEventListener('change', () => {
			GM_setValue(FAB_MANAGE_MODE_KEY, fabModeSelect.value);
			renderFabManage();
		});
		
		fabGestureSelect.addEventListener('change', () => {
			GM_setValue(FAB_MANAGE_GESTURE_KEY, fabGestureSelect.value);
			renderFabManage();
		});
		
		fabActionSelect.addEventListener('change', () => {
			const config = GM_getValue('ao3_fab_actions', DEFAULT_CONFIG.GENERAL.fab_actions);
			const mode = fabModeSelect.value;
			const gesture = fabGestureSelect.value;
			config[mode][gesture] = fabActionSelect.value;
			GM_setValue('ao3_fab_actions', config);
		});

		// 监听全局清除缓存事件，触发按钮点击
		document.addEventListener(CUSTOM_EVENTS.CLEAR_PAGE_CACHE, () => {
			if (btnClearCurrentPage) btnClearCurrentPage.click();
		});

		const handleExport = async () => {
			try {
				const availableItems = DATA_CATEGORIES.map(cat => ({
					...cat,
					checked: true,
					disabled: false
				}));

				const selectionResult = await createSelectionModal(
					'数据导出',
					availableItems,
					'export',
					'ao3_export_selection_memory'
				);

				const data = await exportAllData(selectionResult.ids);
				const jsonString = JSON.stringify(data, null, 2);
				const dateStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })
					.replace(/:/g, '-')
					.replace(' ', '_');
				saveFile(jsonString, `AO3-Translator-Config-${dateStr}.json`, 'application/json');
			} catch (e) {
				if (e.message !== 'User cancelled') {
					notifyAndLog(`导出失败: ${e.message}`, '操作失败', 'error');
				}
			}
		};

		const handleImport = () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';
			input.onchange = (e) => {
				const file = e.target.files[0];
				if (!file) return;

				const reader = new FileReader();
				reader.onload = async (event) => {
					try {
						const jsonData = JSON.parse(event.target.result);
						if (!jsonData.data) throw new Error("文件缺少 data 字段");

						const hasData = (catId, allData) => {
							const data = allData[catId];
							const hasContent = (val) => {
								if (!val) return false;
								if (typeof val === 'string') return val.trim() !== '';
								if (Array.isArray(val)) return val.length > 0;
								if (typeof val === 'object') return Object.keys(val).length > 0;
								return false;
							};

							switch (catId) {
								case 'staticKeys':
								case 'apiKeys':
								case 'modelSelections':
								case 'aiParameters':
								case 'blockerSettings':
									return data ? Object.keys(data).length > 0 : false;
								case 'uiState':
									return data ? !!(data.fabPosition || data.panelPosition) : false;
								case 'customServices':
									return data ? Array.isArray(data) && data.length > 0 : false;
								case 'glossaries':
									return data ? (hasContent(data.customGlossaries) ||
										hasContent(data.importedGlossaries) ||
										hasContent(data.local) ||
										hasContent(data.forbidden) ||
										hasContent(data.onlineMetadata)) : false;
								case 'postReplace':
									return (data && (hasContent(data.postReplaceRules) || 
										hasContent(data.postReplaceString) || 
										hasContent(data.postReplace))) ||
										(allData.glossaries && (hasContent(allData.glossaries.postReplaceRules) ||
										hasContent(allData.glossaries.postReplaceString) ||
										hasContent(allData.glossaries.postReplace)));
								case 'formatting':
									return data ? Object.keys(data).length > 0 : false;
								case 'fabActions':
									return data ? Object.keys(data).length > 0 : false;
								case 'exportTemplates':
									return data ? data.templates && Object.keys(data.templates).length > 0 : false;
								case 'cacheSettings':
									return data ? data.maxItems !== undefined || data.maxDays !== undefined : false;
								default:
									return false;
							}
						};

						const availableItems = DATA_CATEGORIES.map(cat => {
							const dataExists = hasData(cat.id, jsonData.data);
							return {
								...cat,
								checked: dataExists,
								label: cat.label,
								disabled: !dataExists
							};
						});

						const validItems = availableItems.filter(item => !item.disabled);

						if (validItems.length === 0) {
							notifyAndLog('该文件中没有可导入的有效数据。', '导入失败', 'error');
							return;
						}

						const selectionResult = await createSelectionModal(
							'数据导入',
							availableItems,
							'import',
							null
						);

						if (selectionResult && selectionResult.ids.length > 0) {
							const result = await importAllData(jsonData, selectionResult.ids, selectionResult.mode);
							Logger.info('Data', result.message);
						}
					} catch (err) {
						if (err.message !== 'User cancelled') {
							notifyAndLog(`导入失败: ${err.message}`, '导入错误', 'error');
						}
					}
				};
				reader.readAsText(file);
			};
			input.click();
		};

		const togglePanel = () => {
			const isOpening = panel.style.display !== 'flex';
			if (isOpening) {
				editableSections.forEach(s => s.style.display = 'none');
				dataSyncActionsContainer.style.display = 'none';
				blockerActionsContainer.style.display = 'none';
				syncPanelState();
				const lastAction = GM_getValue(GLOSSARY_ACTION_KEY, '');
				glossaryActionsSelect.value = lastAction;
				if (lastAction) {
					glossaryActionsSelect.dispatchEvent(new Event('change', { bubbles: true }));
				} else {
					glossaryActionsSelect.value = "";
				}
				panel.style.display = 'flex';
				updatePanelPosition();
			} else {
				if (customServiceManager.isPending()) {
					customServiceManager.cancelPending();
				}
				cleanupAllEmptyCustomServices();
				panel.style.display = 'none';
				if (onPanelCloseCallback) onPanelCloseCallback();
			}
			if (rerenderMenuCallback) rerenderMenuCallback();
		};

		const updateSwapButtonState = () => {
			const val = fromLangSelect.value;
			const isAutoDetect = val === 'auto' || val === 'script_auto';
			swapLangBtn.disabled = isAutoDetect;
		};

		const handleLanguageChange = () => {
			if (glossaryActionsSelect.value === 'ai_settings') {
				aiSettingsLogic.refresh();
			} else if (glossaryActionsSelect.value === 'formatting') {
				renderFormattingEditor();
			}
		};

		applyFormatting();

		const renderFormattingEditor = () => {
			const currentProfile = FormattingManager.getCurrentProfile();
			if (!currentProfile) return;

			const savedProp = GM_getValue('formatting_last_prop', 'letterSpacing');
			const safeProp = (savedProp === 'deleteProfile') ? 'letterSpacing' : savedProp;
			fmtPropertySelect.value = safeProp;

			const profiles = FormattingManager.getAllProfiles();
			fmtProfileSelect.innerHTML = '';
			profiles.forEach(p => {
				const option = document.createElement('option');
				option.value = p.id;
				option.textContent = p.name;
				fmtProfileSelect.appendChild(option);
			});
			const createOption = document.createElement('option');
			createOption.value = 'create_new';
			createOption.textContent = '新建方案';
			fmtProfileSelect.appendChild(createOption);

			fmtProfileSelect.value = currentProfile.id;

			const prop = fmtPropertySelect.value;
			fmtValueContainer.innerHTML = '';

			if (prop === 'deleteProfile') {
				return;
			}

			if (prop === 'profileName') {
				const wrapper = document.createElement('div');
				wrapper.className = 'settings-group static-label';
				const inputId = 'fmt-profile-rename-input';
				wrapper.innerHTML = `
                    <div class="input-wrapper">
                        <input type="text" id="${inputId}" name="fmt_profile_name" class="settings-control settings-input" value="${currentProfile.name}" spellcheck="false">
                        <label for="${inputId}" class="settings-label">方案名称</label>
                        <button class="settings-action-button-inline">保存</button>
                    </div>
                `;
				const input = wrapper.querySelector('input');
				wrapper.querySelector('button').addEventListener('click', () => {
					const newName = input.value.trim();
					if (newName) {
						currentProfile.name = newName;
						FormattingManager.saveProfile(currentProfile);
						renderFormattingEditor();
					}
				});
				fmtValueContainer.appendChild(wrapper);
				updateInputLabel(input);
			} else {
				const wrapper = document.createElement('div');
				wrapper.className = 'settings-group settings-group-select static-label';
				const select = document.createElement('select');
				select.id = 'fmt-value-select';
				select.name = 'fmt_value';
				select.className = 'settings-control settings-select custom-styled-select';

				const addOpt = (val, text, selectedVal) => {
					const option = document.createElement('option');
					option.value = val;
					option.textContent = text;
					if (String(val) === String(selectedVal)) option.selected = true;
					select.appendChild(option);
				};

				const opts = currentProfile.params;
				let labelText = '';

				if (prop === 'indent') {
					labelText = '首行缩进';
					addOpt('true', '启用', opts.indent);
					addOpt('false', '禁用', opts.indent);
				} else if (prop === 'fontSize') {
					labelText = '文字大小';
					for (let i = 50; i <= 200; i += 5) {
						addOpt(i, i + '%', opts.fontSize);
					}
				} else if (prop === 'letterSpacing') {
					labelText = '字间距';
					for (let i = 0; i <= 5; i += 0.5) {
						addOpt(i, i + 'px', opts.letterSpacing);
					}
				} else if (prop === 'lineHeight') {
					labelText = '行间距';
					for (let i = 0.8; i <= 2.0; i = parseFloat((i + 0.1).toFixed(1))) {
						addOpt(i, i, opts.lineHeight);
					}
				} else if (prop === 'margins') {
					labelText = '页边距';
					for (let i = 0; i <= 40; i += 5) {
						addOpt(i, i + '%', opts.margins);
					}
				}

				select.addEventListener('change', (e) => {
					currentProfile.params[prop] = e.target.value;
					FormattingManager.saveProfile(currentProfile);
					SettingsSyncManager.syncFormatting();
				});

				const label = document.createElement('label');
				label.htmlFor = 'fmt-value-select';
				label.className = 'settings-label';
				label.textContent = labelText;

				wrapper.appendChild(select);
				wrapper.appendChild(label);
				fmtValueContainer.appendChild(wrapper);
				updateInputLabel(select);
			}

			updateAllLabels();
		};

		fmtProfileSelect.addEventListener('change', (e) => {
			if (e.target.value === 'create_new') {
				const newId = FormattingManager.createProfile();
				FormattingManager.setCurrentId(newId);
				SettingsSyncManager.syncFormatting();
				GM_setValue('formatting_last_prop', 'profileName');
				renderFormattingEditor();
			} else {
				FormattingManager.setCurrentId(e.target.value);
				SettingsSyncManager.syncFormatting();
				renderFormattingEditor();
			}
		});

		fmtPropertySelect.addEventListener('change', (e) => {
			const prop = e.target.value;
			if (prop === 'deleteProfile') {
				const currentProfile = FormattingManager.getCurrentProfile();
				showCustomConfirm(`您确定要删除 ${currentProfile.name} 格式方案吗？\n\n注意：此操作无法撤销。`, '提示', { textAlign: 'center' })
					.then(() => {
						FormattingManager.deleteProfile(currentProfile.id);
						SettingsSyncManager.syncFormatting();
						fmtPropertySelect.value = 'profileName';
						GM_setValue('formatting_last_prop', 'profileName');
						renderFormattingEditor();
					})
					.catch(() => {
						const lastProp = GM_getValue('formatting_last_prop', 'letterSpacing');
						fmtPropertySelect.value = lastProp;
						renderFormattingEditor();
					});
			} else {
				GM_setValue('formatting_last_prop', prop);
				renderFormattingEditor();
			}
		});

		panel.addEventListener('change', (e) => {
			if (e.target.classList.contains('settings-control')) {
				updateInputLabel(e.target);
			}
		});
		panel.addEventListener('input', (e) => {
			if (e.target.classList.contains('settings-control')) {
				updateInputLabel(e.target);
			}
		});

		masterSwitch.addEventListener('change', () => {
			const isEnabled = masterSwitch.checked;
			if (currentMode === 'full_page') {
				GM_setValue(AUTO_TRANSLATE_KEY, isEnabled);
				document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.AUTO_TRANSLATE_CHANGED, { detail: { enabled: isEnabled } }));
			} else {
				saveSetting('enable_transDesc', isEnabled, DEFAULT_CONFIG.GENERAL.enable_transDesc);
				FeatureSet.enable_transDesc = isEnabled;
				syncPanelState();
				if (typeof fabLogic !== 'undefined' && fabLogic.toggleFabVisibility) {
					fabLogic.toggleFabVisibility();
				}
				if (isEnabled) {
					transDesc();
				} else {
					TranslationDOMUtils.deepCleanup(document.body);
				}
			}
		});

		swapLangBtn.addEventListener('click', () => {
			if (swapLangBtn.disabled) return;
			const fromLang = fromLangSelect.value;
			const toLang = toLangSelect.value;
			fromLangSelect.value = toLang;
			toLangSelect.value = fromLang;
			saveSetting('from_lang', toLang, DEFAULT_CONFIG.GENERAL.from_lang);
			saveSetting('to_lang', fromLang, DEFAULT_CONFIG.GENERAL.to_lang);
			fromLangSelect.dispatchEvent(new Event('change', { bubbles: true }));
			toLangSelect.dispatchEvent(new Event('change', { bubbles: true }));
		});

		fromLangSelect.addEventListener('change', () => {
			const newLang = fromLangSelect.value;
			saveSetting('from_lang', newLang, DEFAULT_CONFIG.GENERAL.from_lang);
			updateSwapButtonState();
			handleLanguageChange();
		});

		toLangSelect.addEventListener('change', () => {
			const newLang = toLangSelect.value;
			saveSetting('to_lang', newLang, DEFAULT_CONFIG.GENERAL.to_lang);
			handleLanguageChange();
		});

		engineSelect.addEventListener('change', () => {
			if (customServiceManager.isPending()) {
				customServiceManager.cancelPending();
			}
			const newEngine = engineSelect.value;
			if (newEngine === ADD_NEW_CUSTOM_SERVICE_ID) {
				customServiceManager.startPendingCreation();
				updateUiForEngine(newEngine);
			} else {
				saveSetting('transEngine', newEngine, DEFAULT_CONFIG.ENGINE.current);
				updateUiForEngine(newEngine);
				isEditingBuiltInModel = false;
			}
		});

		modelSelect.addEventListener('change', () => {
			const engineId = engineSelect.value;
			if (engineId.startsWith('custom_')) {
				if (!modelSelect.disabled) {
					GM_setValue(`${ACTIVE_MODEL_PREFIX_KEY}${engineId}`, modelSelect.value);
				}
			} else {
				if (modelSelect.value === 'FETCH_MODELS_INLINE') {
					fetchModelsForBuiltInService(engineId);
				} else if (modelSelect.value === 'EDIT_MODELS_INLINE') {
					isEditingBuiltInModel = true;
					renderBuiltInModelUI(engineId);
				} else if (modelSelect.value === 'RESET_MODELS_INLINE') {
					GM_deleteValue(`${engineId}_custom_model_mapping`);
					renderBuiltInModelUI(engineId);
				} else {
					const config = engineMenuConfig[engineId];
					if (config && config.modelGmKey) {
						GM_setValue(config.modelGmKey, modelSelect.value);
					}
				}
			}
		});

		displayModeSelect.addEventListener('change', () => {
			const newMode = displayModeSelect.value;
			saveSetting('translation_display_mode', newMode, DEFAULT_CONFIG.GENERAL.translation_display_mode);
			applyDisplayModeChange(newMode);
		});

		apiKeySaveBtn.addEventListener('click', saveApiKey);

		serviceDetailsToggleContainer.addEventListener('click', () => {
			const engineId = engineSelect.value;
			const isCollapsed = serviceDetailsToggleBtn.classList.contains('collapsed');
			const newState = !isCollapsed;
			serviceDetailsToggleBtn.classList.toggle('collapsed', newState);
			GM_setValue(`service_collapsed_${engineId}`, newState);
			updateUiForEngine(engineId);
		});

		glossaryActionsSelect.addEventListener('change', () => {
			const action = glossaryActionsSelect.value;
			GM_setValue(GLOSSARY_ACTION_KEY, action);
			toggleEditableSection(null);
			switch (action) {
				case 'ai_settings':
					toggleEditableSection(aiSettingsSection);
					aiSettingsLogic.refresh();
					break;
				case 'lang_detect':
					langDetectSelect.value = GM_getValue('lang_detector', DEFAULT_CONFIG.GENERAL.lang_detector);
					toggleEditableSection(langDetectSection);
					break;
				case 'local_manage':
					let glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
					if (glossaries.length === 0) {
						const defaultGlossary = {
							id: `local_${Date.now()}`,
							name: '默认',
							sensitive: '',
							insensitive: '',
							forbidden: '',
							enabled: true
						};
						glossaries.push(defaultGlossary);
						GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
					}
					populateLocalGlossarySelect();
					glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
					const savedId = GM_getValue(LOCAL_GLOSSARY_SELECTED_ID_KEY);

					const savedMode = GM_getValue(LOCAL_GLOSSARY_EDIT_MODE_KEY, 'translation');

					let targetId;
					if (glossaries.length > 0) {
						const exists = glossaries.some(g => g.id === savedId);
						targetId = exists ? savedId : glossaries[0].id;
					}

					if (targetId) {
						localGlossarySelect.value = targetId;
						loadLocalGlossaryData(targetId);
					}

					localEditModeSelect.value = savedMode;
					updateLocalEditVisibility();
					toggleEditableSection(localManageSection);
					break;
				case 'online_manage':
					populateManageGlossary();
					toggleEditableSection(onlineManageSection);
					break;
				case 'post_replace':
					let rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
					let isInitializedDefault = false;
					if (rules.length === 0) {
						const defaultRule = {
							id: `replace_${Date.now()}`,
							name: '默认',
							content: '',
							enabled: true
						};
						rules.push(defaultRule);
						GM_setValue(POST_REPLACE_RULES_KEY, rules);
						isInitializedDefault = true;
					}
					populatePostReplaceSelect();
					const currentRules = GM_getValue(POST_REPLACE_RULES_KEY, []);
					const savedReplaceId = GM_getValue(POST_REPLACE_SELECTED_ID_KEY);

					let targetReplaceId;
					if (currentRules.length > 0) {
						const exists = currentRules.some(r => r.id === savedReplaceId);
						targetReplaceId = exists ? savedReplaceId : currentRules[0].id;
					}

					if (targetReplaceId) {
						postReplaceSelect.value = targetReplaceId;
						loadPostReplaceData(targetReplaceId);
					}
					let targetMode;
					if (isInitializedDefault) {
						targetMode = 'settings';
						GM_setValue(POST_REPLACE_EDIT_MODE_KEY, 'settings');
					} else {
						targetMode = GM_getValue(POST_REPLACE_EDIT_MODE_KEY, 'settings');
					}

					postReplaceEditModeSelect.value = targetMode;
					updatePostReplaceEditVisibility();
					toggleEditableSection(postReplaceSection);
					break;
				case 'debug_mode':
					logLevelSelect.value = Logger.config.level;
					logAutoClearSelect.value = Logger.config.autoClearDays;
					toggleEditableSection(debugModeSection);
					break;
				case 'data_sync':
					dataSyncActionsContainer.style.display = 'flex';
					break;
				case 'blocker_manage':
					blockerDimensionSelect.value = GM_getValue(BLOCKER_VIEW_KEY, DEFAULT_CONFIG.BLOCKER.current_view);
					renderBlockerSubDimensions();
					updateBlockerButtonText();
					toggleEditableSection(blockerSection);
					break;
				case 'formatting':
					toggleEditableSection(formattingSection);
					renderFormattingEditor();
					break;
				case 'export_manage':
					toggleEditableSection(exportManageSection);
					renderExportManage();
					break;
				case 'cache_manage':
					toggleEditableSection(cacheManageSection);
					cacheModeSelect.value = GM_getValue(CACHE_MANAGE_MODE_KEY, 'manual');
					cacheModeSelect.dispatchEvent(new Event('change'));
					updateCacheCountDisplay();
					break;
				case 'fab_manage':
					fabModeSelect.value = GM_getValue(FAB_MANAGE_MODE_KEY, 'unit');
					fabGestureSelect.value = GM_getValue(FAB_MANAGE_GESTURE_KEY, 'click');
					toggleEditableSection(fabManageSection);
					renderFabManage();
					break;
				default:
					break;
			}
			syncPanelState();
		});

		langDetectSelect.addEventListener('change', () => {
			saveSetting('lang_detector', langDetectSelect.value, DEFAULT_CONFIG.GENERAL.lang_detector);
		});

		localGlossarySelect.addEventListener('change', () => {
			if (localGlossarySelect.value === 'create_new') {
				const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
				const newId = `local_${Date.now()}`;
				const newName = generateNewGlossaryName(glossaries);
				const newGlossary = {
					id: newId,
					name: newName,
					sensitive: '',
					insensitive: '',
					forbidden: '',
					enabled: true
				};
				glossaries.push(newGlossary);
				GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
				populateLocalGlossarySelect();
				localGlossarySelect.value = newId;
				loadLocalGlossaryData(newId);
				SettingsSyncManager.syncGlossary();
				GM_setValue(LOCAL_GLOSSARY_SELECTED_ID_KEY, newId);
				localEditModeSelect.value = 'name';
				GM_setValue(LOCAL_GLOSSARY_EDIT_MODE_KEY, 'name');
			} else {
				loadLocalGlossaryData(localGlossarySelect.value);
				GM_setValue(LOCAL_GLOSSARY_SELECTED_ID_KEY, localGlossarySelect.value);
			}
			updateLocalEditVisibility();
		});

		localEditModeSelect.addEventListener('change', () => {
			const mode = localEditModeSelect.value;
			if (mode === 'delete') {
				const glossaryName = localGlossarySelect.options[localGlossarySelect.selectedIndex].text;
				const confirmMessage = `您确定要删除 ${glossaryName} 术语表吗？\n\n注意：此操作无法撤销。</span>`;
				showCustomConfirm(confirmMessage, '提示', { textAlign: 'center' })
					.then(() => {
						handleDeleteLocalGlossary(localGlossarySelect.value);
					})
					.catch(() => {
						const previousMode = GM_getValue(LOCAL_GLOSSARY_EDIT_MODE_KEY, 'name');
						localEditModeSelect.value = previousMode;
					});
			} else {
				updateLocalEditVisibility();
				GM_setValue(LOCAL_GLOSSARY_EDIT_MODE_KEY, mode);
			}
		});

		localGlossarySaveNameBtn.addEventListener('click', () => {
			const id = localGlossarySelect.value;
			const newName = localGlossaryNameInput.value.trim();
			if (id && newName) {
				const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
				const index = glossaries.findIndex(g => g.id === id);
				if (index !== -1) {
					glossaries[index].name = newName;
					GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
					const currentSelection = localGlossarySelect.value;
					populateLocalGlossarySelect();
					localGlossarySelect.value = currentSelection;
				}
			}
		});

		const saveLocalContent = (field, inputElement) => {
			const id = localGlossarySelect.value;
			const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
			const index = glossaries.findIndex(g => g.id === id);
			if (index !== -1) {
				glossaries[index][field] = inputElement.value;
				GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
				SettingsSyncManager.syncGlossary();
			}
		};

		localSensitiveSaveBtn.addEventListener('click', () => saveLocalContent('sensitive', localSensitiveInput));
		localInsensitiveSaveBtn.addEventListener('click', () => saveLocalContent('insensitive', localInsensitiveInput));
		localForbiddenSaveBtn.addEventListener('click', () => saveLocalContent('forbidden', localForbiddenInput));

		glossaryImportSaveBtn.addEventListener('click', async () => {
			const url = glossaryImportUrlInput.value.trim();
			if (url) {
				const result = await importOnlineGlossary(url);
				if (result.success) {
					invalidateGlossaryCache();
					GM_setValue(LAST_SELECTED_GLOSSARY_KEY, url);
					if (glossaryActionsSelect.value === 'online_manage') {
						populateManageGlossary();
					}
				}
			}
		});

		glossaryManageSelect.addEventListener('change', () => {
			const url = glossaryManageSelect.value;
			if (url) {
				GM_setValue(LAST_SELECTED_GLOSSARY_KEY, url);
				const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
				const currentMeta = metadata[url] || {};
				glossaryManageInfo.textContent = `版本号：${currentMeta.version || '未知'} ，维护者：${currentMeta.maintainer || '未知'}`;
				glossaryManageDetailsContainer.style.display = 'flex';
				viewImportedGlossaryContainer.style.display = 'flex';
			} else {
				glossaryManageDetailsContainer.style.display = 'none';
				viewImportedGlossaryContainer.style.display = 'none';
			}
			resetDeleteButton();
		});

		glossaryManageDeleteBtn.addEventListener('click', () => {
			if (glossaryManageDeleteBtn.dataset.confirming) {
				const urlToRemove = glossaryManageSelect.value;
				if (urlToRemove) {
					const allGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
					const allMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
					delete allGlossaries[urlToRemove];
					delete allMetadata[urlToRemove];
					GM_setValue(IMPORTED_GLOSSARY_KEY, allGlossaries);
					GM_setValue(GLOSSARY_METADATA_KEY, allMetadata);

					const rawTextCache = GM_getValue(GLOSSARY_RAW_TEXT_CACHE_KEY, {});
					if (rawTextCache[urlToRemove]) {
						delete rawTextCache[urlToRemove];
						GM_setValue(GLOSSARY_RAW_TEXT_CACHE_KEY, rawTextCache);
					}

					invalidateGlossaryCache();
					populateManageGlossary();
					updateInputLabel(glossaryManageSelect);
				}
			} else {
				glossaryManageDeleteBtn.textContent = '确认删除';
				glossaryManageDeleteBtn.setAttribute('data-confirming', 'true');
			}
		});

		postReplaceSelect.addEventListener('change', () => {
			if (postReplaceSelect.value === 'create_new') {
				const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
				const newId = `replace_${Date.now()}`;
				const newName = generateNewPostReplaceName(rules);
				const newRule = {
					id: newId,
					name: newName,
					content: '',
					enabled: true
				};
				rules.push(newRule);
				GM_setValue(POST_REPLACE_RULES_KEY, rules);
				populatePostReplaceSelect();
				postReplaceSelect.value = newId;
				loadPostReplaceData(newId);
				SettingsSyncManager.syncGlossary();
				GM_setValue(POST_REPLACE_SELECTED_ID_KEY, newId);
				postReplaceEditModeSelect.value = 'name';
				GM_setValue(POST_REPLACE_EDIT_MODE_KEY, 'name');
			} else {
				loadPostReplaceData(postReplaceSelect.value);
				GM_setValue(POST_REPLACE_SELECTED_ID_KEY, postReplaceSelect.value);
			}
			updatePostReplaceEditVisibility();
		});

		postReplaceEditModeSelect.addEventListener('change', () => {
			const mode = postReplaceEditModeSelect.value;
			if (mode === 'delete') {
				const ruleName = postReplaceSelect.options[postReplaceSelect.selectedIndex].text;
				const confirmMessage = `您确定要删除 ${ruleName} 替换规则吗？\n\n注意：此操作无法撤销。</span>`;
				showCustomConfirm(confirmMessage, '提示', { textAlign: 'center' })
					.then(() => {
						handleDeletePostReplaceRule(postReplaceSelect.value);
					})
					.catch(() => {
						const previousMode = GM_getValue(POST_REPLACE_EDIT_MODE_KEY, 'name');
						postReplaceEditModeSelect.value = previousMode;
					});
			} else {
				updatePostReplaceEditVisibility();
				GM_setValue(POST_REPLACE_EDIT_MODE_KEY, mode);
			}
		});

		postReplaceSaveNameBtn.addEventListener('click', () => {
			const id = postReplaceSelect.value;
			const newName = postReplaceNameInput.value.trim();
			if (id && newName) {
				const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
				const index = rules.findIndex(r => r.id === id);
				if (index !== -1) {
					rules[index].name = newName;
					GM_setValue(POST_REPLACE_RULES_KEY, rules);
					const currentSelection = postReplaceSelect.value;
					populatePostReplaceSelect();
					postReplaceSelect.value = currentSelection;
				}
			}
		});

		postReplaceSaveBtn.addEventListener('click', () => {
			const id = postReplaceSelect.value;
			const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
			const index = rules.findIndex(r => r.id === id);
			if (index !== -1) {
				rules[index].content = postReplaceInput.value;
				GM_setValue(POST_REPLACE_RULES_KEY, rules);
				SettingsSyncManager.syncGlossary();
			}
		});

		logLevelSelect.addEventListener('change', () => {
			Logger.setLevel(logLevelSelect.value);
		});

		logAutoClearSelect.addEventListener('change', () => {
			Logger.setAutoClear(parseInt(logAutoClearSelect.value, 10));
		});

		viewLogsBtn.addEventListener('click', () => {
			setTimeout(() => {
				openLogModal();
			}, 10);
		});

		importDataBtn.addEventListener('click', () => handleImport());
		exportDataBtn.addEventListener('click', handleExport);

		openOnlineLibraryBtn.addEventListener('click', () => {
			openOnlineLibraryModal();
		});

		viewImportedGlossaryBtn.addEventListener('click', () => {
			const url = glossaryManageSelect.value;
			if (url) {
				openGlossaryViewModal(url); 
			}
		});

		closeBtn.addEventListener('click', togglePanel);

		header.addEventListener('dblclick', (e) => {
			if (e.target.closest('.settings-panel-close-btn')) return;
			toggleTranslationMode();
		});
		header.addEventListener('mousedown', (e) => {
			if (isMobile()) return;
			isDragging = true;
			panel.classList.add('dragging');
			origin = { x: e.clientX, y: e.clientY };
			startPosition = { x: panel.offsetLeft, y: panel.offsetTop };
		});
		document.addEventListener('mousemove', (e) => {
			if (!isDragging) return;
			const newPos = {
				x: startPosition.x + e.clientX - origin.x,
				y: startPosition.y + e.clientY - origin.y
			};
			const correctedPos = ensureOnScreen(newPos, panel.getBoundingClientRect());
			panel.style.left = `${correctedPos.x}px`;
			panel.style.top = `${correctedPos.y}px`;
			repositionActiveDropdown();
		});
		document.addEventListener('mouseup', () => {
			if (!isDragging) return;
			isDragging = false;
			panel.classList.remove('dragging');
			const finalPos = { x: panel.offsetLeft, y: panel.offsetTop };
			GM_setValue(PANEL_POSITION_KEY, finalPos);
		});

		const debouncedResizeHandler = debounce(() => {
			updatePanelPosition();
		}, 150);
		window.addEventListener('resize', debouncedResizeHandler);

        const handleClickOutside = (event) => {
			if (panel.style.display !== 'flex') return;
			if (Date.now() - ignoreNextOutsideClickTime < 500) return;
			
			// 使用 composedPath 穿透 Shadow DOM 获取真实的点击路径
			const path = event.composedPath();
			
			// 忽略点击面板本身或悬浮球
			const fabContainer = shadowWrapper.querySelector('#ao3-trans-fab-container');
			if (path.includes(panel) || (fabContainer && path.includes(fabContainer))) {
				return;
			}
			
			// 忽略点击任何弹窗或下拉菜单遮罩
			if (shadowWrapper.querySelector('.ao3-overlay') || shadowWrapper.querySelector('.custom-dropdown-backdrop')) {
				return;
			}
			
			togglePanel();
		};

		document.addEventListener('mousedown', handleClickOutside, true);

		let isPanelSyncPending = false;
		document.addEventListener(CUSTOM_EVENTS.PANEL_STATE_SYNC, () => {
			if (panel.style.display !== 'flex') return;
			if (isPanelSyncPending) return;
			
			isPanelSyncPending = true;
			requestAnimationFrame(() => {
				syncPanelState();
				isPanelSyncPending = false;
			});
		});

		const populateLangSelects = () => {
			const fromOptions = [
				{ value: 'script_auto', text: '自动检测' },
				{ value: 'auto', text: '自主判断' },
				...ALL_LANG_OPTIONS.map(([value, text]) => ({ value, text }))
			];
			const toOptions = ALL_LANG_OPTIONS.map(([value, text]) => ({ value, text }));
			const createOptions = (select, options) => {
				select.innerHTML = '';
				options.forEach(({ value, text }) => {
					const option = document.createElement('option');
					option.value = value;
					option.textContent = text;
					select.appendChild(option);
				});
			};
			createOptions(fromLangSelect, fromOptions);
			createOptions(toLangSelect, toOptions);
		};

		populateLangSelects();
		populateEngineSelect();
		syncPanelState();

		const repositionActiveDropdown = () => {
			if (!activeDropdown || !activeDropdown.menu || !activeDropdown.trigger) {
				return;
			}
			const { menu, trigger } = activeDropdown;

			const rect = trigger.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			const actualMenuWidth = rect.width;
			const actualMenuHeight = menu.offsetHeight; 

			requestAnimationFrame(() => {
				menu.style.width = `${actualMenuWidth}px`;
				
				let left = rect.left;
				let top = rect.bottom + 4;
				let transformOrigin = 'top center';

				if (left + actualMenuWidth > viewportWidth - 10) {
					left = viewportWidth - actualMenuWidth - 10;
				}

				if (top + actualMenuHeight > viewportHeight - 10) {
					top = rect.top - actualMenuHeight - 4;
					transformOrigin = 'bottom center';
				}

				menu.style.left = `${left}px`;
				menu.style.top = `${top}px`;
				menu.style.transformOrigin = transformOrigin;
			});
		};

		function enableDragSort(ulElement, onOrderChange) {
			let dragTimer = null;
			let isDragging = false;
			let dragItem = null;
			let ghostItem = null;
			let startY = 0;
			let ghostHeight = 0;
			let touchId = null;

			let containerRect = null;

			const clearTimer = () => {
				if (dragTimer) {
					clearTimeout(dragTimer);
					dragTimer = null;
				}
			};

			const handleStart = (e) => {
				if (e.target.tagName === 'BUTTON') return;

				const li = e.target.closest('li');
				if (!li || li.dataset.value === 'create_new' || li.classList.contains('disabled')) return;

				const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
				touchId = e.type.startsWith('touch') ? e.touches[0].identifier : null;

				startY = clientY;

				clearTimer();
				dragTimer = setTimeout(() => {
					startDrag(li, clientY);
				}, 300);

				if (e.type.startsWith('touch')) {
					li.addEventListener('touchmove', checkMoveTolerance, { passive: false });
					li.addEventListener('touchend', cancelDrag);
				} else {
					li.addEventListener('mousemove', checkMoveTolerance);
					li.addEventListener('mouseup', cancelDrag);
					li.addEventListener('mouseleave', cancelDrag);
				}
			};

			const checkMoveTolerance = (e) => {
				const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
				if (Math.abs(clientY - startY) > 5) {
					cancelDrag(e);
				}
			};

			const cancelDrag = (e) => {
				clearTimer();
				const li = e.target.closest('li');
				if (li) {
					li.removeEventListener('touchmove', checkMoveTolerance);
					li.removeEventListener('touchend', cancelDrag);
					li.removeEventListener('mousemove', checkMoveTolerance);
					li.removeEventListener('mouseup', cancelDrag);
					li.removeEventListener('mouseleave', cancelDrag);
				}
			};

			const startDrag = (li) => {
				isDragging = true;
				dragItem = li;

				ulElement.classList.add('is-sorting');

				containerRect = ulElement.getBoundingClientRect();
				const itemRect = dragItem.getBoundingClientRect();
				ghostHeight = itemRect.height;

				if (navigator.vibrate) navigator.vibrate(50);

				const computedStyle = window.getComputedStyle(dragItem);
				let bgColor = computedStyle.backgroundColor;
				if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
					bgColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#252525' : '#ffffff';
				}

				ghostItem = dragItem.cloneNode(true);
				ghostItem.classList.add('drag-ghost');
				ghostItem.classList.remove('drag-placeholder');

				ghostItem.style.width = `${itemRect.width}px`;
				ghostItem.style.height = `${itemRect.height}px`;
				ghostItem.style.top = `${itemRect.top}px`;
				ghostItem.style.left = `${itemRect.left}px`;
				ghostItem.style.backgroundColor = bgColor;

				document.body.appendChild(ghostItem);

				dragItem.classList.add('drag-placeholder');

				document.body.classList.add('ao3-dragging-active');

				document.addEventListener('mousemove', handleMove, { passive: false });
				document.addEventListener('mouseup', handleEnd);
				document.addEventListener('touchmove', handleMove, { passive: false });
				document.addEventListener('touchend', handleEnd);
			};

			const handleMove = (e) => {
				if (!isDragging || !ghostItem) return;
				e.preventDefault();

				let clientY;
				if (e.type.startsWith('touch')) {
					const touch = Array.from(e.touches).find(t => t.identifier === touchId);
					if (!touch) return;
					clientY = touch.clientY;
				} else {
					clientY = e.clientY;
				}

				let ghostTop = clientY - (ghostHeight / 2);
				const minTop = containerRect.top;
				const maxTop = containerRect.bottom - ghostHeight;

				if (ghostTop < minTop) ghostTop = minTop;
				if (ghostTop > maxTop) ghostTop = maxTop;

				ghostItem.style.top = `${ghostTop}px`;

				const ghostCenterY = ghostTop + (ghostHeight / 2);

				const siblings = Array.from(ulElement.children).filter(el =>
					el !== dragItem &&
					el !== ghostItem &&
					el.dataset.value !== 'create_new' &&
					!el.classList.contains('disabled')
				);

				const hitSibling = siblings.find(sibling => {
					const rect = sibling.getBoundingClientRect();
					return ghostCenterY >= rect.top && ghostCenterY <= rect.bottom;
				});

				if (hitSibling) {
					const rect = hitSibling.getBoundingClientRect();
					const siblingCenterY = rect.top + (rect.height / 2);

					if (ghostCenterY < siblingCenterY) {
						if (dragItem.nextElementSibling !== hitSibling) {
							ulElement.insertBefore(dragItem, hitSibling);
						}
					} else {
						if (dragItem.previousElementSibling !== hitSibling) {
							ulElement.insertBefore(dragItem, hitSibling.nextElementSibling);
						}
					}
				} else {
					if (siblings.length > 0) {
						const firstRect = siblings[0].getBoundingClientRect();
						const lastRect = siblings[siblings.length - 1].getBoundingClientRect();

						if (ghostCenterY < firstRect.top) {
							ulElement.insertBefore(dragItem, siblings[0]);
						} else if (ghostCenterY > lastRect.bottom) {
							ulElement.insertBefore(dragItem, siblings[siblings.length - 1].nextElementSibling);
						}
					}
				}
			};

			const handleEnd = () => {
				if (!isDragging) return;
				isDragging = false;

				ulElement.classList.remove('is-sorting');

				if (ghostItem) ghostItem.remove();

				if (dragItem) {
					dragItem.style.transition = 'none';
					dragItem.classList.remove('drag-placeholder');
					setTimeout(() => {
						dragItem.style.transition = '';
					}, 50);
				}

				document.body.classList.remove('ao3-dragging-active');

				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleEnd);
				document.removeEventListener('touchmove', handleMove);
				document.removeEventListener('touchend', handleEnd);

				const newOrder = Array.from(ulElement.children)
					.map(li => li.dataset.value)
					.filter(val => val && val !== 'create_new');

				if (onOrderChange) onOrderChange(newOrder);
			};

			ulElement.addEventListener('mousedown', handleStart);
			ulElement.addEventListener('touchstart', handleStart, { passive: false });
		}

		function createCustomDropdown(triggerElement) {
			if (shadowWrapper.querySelector('.custom-dropdown-backdrop')) {
				return;
			}
			if (triggerElement.disabled || triggerElement.options.length === 0 || (triggerElement.options.length === 1 && triggerElement.options[0].disabled)) {
				return;
			}
			if (triggerElement.parentElement) {
				triggerElement.parentElement.classList.add('dropdown-active');
			}

			const backdrop = document.createElement('div');
			backdrop.className = 'custom-dropdown-backdrop';
			shadowWrapper.appendChild(backdrop);
			
			const menu = document.createElement('div');
			menu.className = 'custom-styled-dropdown-menu custom-dropdown-menu';
			
			if (triggerElement.classList.contains('small-select')) {
				menu.classList.add('small-menu');
			}

			const list = document.createElement('ul');
			menu.appendChild(list);
			const metadata = (triggerElement.id === 'setting-select-glossary-manage') ? GM_getValue(GLOSSARY_METADATA_KEY, {}) : null;

			const createListItem = (option) => {
				if (option.disabled) {
					const separatorItem = document.createElement('li');
					separatorItem.style.textAlign = 'center';
					separatorItem.style.color = '#ccc';
					separatorItem.style.cursor = 'default';
					separatorItem.classList.add('disabled');
					separatorItem.textContent = option.textContent;
					return separatorItem;
				}
				const listItem = document.createElement('li');
				listItem.dataset.value = option.value;
				if (option.selected) {
					listItem.classList.add('selected');
				}
				const textSpan = document.createElement('span');
				textSpan.className = 'item-text';
				textSpan.textContent = option.textContent;
				textSpan.title = option.textContent;
				if (option.style.color) {
					textSpan.style.color = option.style.color;
				}
				listItem.appendChild(textSpan);
				const actionsDiv = document.createElement('div');
				actionsDiv.className = 'item-actions';
				if (triggerElement.id === 'setting-select-glossary-manage' && metadata && metadata[option.value]) {
					const toggleBtn = document.createElement('button');
					toggleBtn.className = 'item-action-btn toggle-glossary';
					const isEnabled = metadata[option.value].enabled !== false;

					toggleBtn.innerHTML = isEnabled ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
					
					toggleBtn.title = isEnabled ? '点击禁用' : '点击启用';
					if (!isEnabled) toggleBtn.classList.add('is-disabled');
					toggleBtn.dataset.url = option.value;
					actionsDiv.appendChild(toggleBtn);
				}
				if (option.dataset.isCustom === 'true') {
					const deleteBtn = document.createElement('button');
					deleteBtn.className = 'item-action-btn delete';
					deleteBtn.title = '删除';
					deleteBtn.innerHTML = SVG_ICONS.delete;
					deleteBtn.dataset.value = option.value;
					actionsDiv.appendChild(deleteBtn);
				} else if (option.dataset.isLocalGlossary === 'true') {
					const toggleBtn = document.createElement('button');
					toggleBtn.className = 'item-action-btn toggle-local';
					const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY,[]);
					const glossary = glossaries.find(g => g.id === option.value);
					const isEnabled = glossary ? (glossary.enabled !== false) : true;
					toggleBtn.innerHTML = isEnabled ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
					toggleBtn.title = isEnabled ? '点击禁用' : '点击启用';
					if (!isEnabled) toggleBtn.classList.add('is-disabled');
					toggleBtn.dataset.value = option.value;
					actionsDiv.appendChild(toggleBtn);
				} else if (option.dataset.isPostReplaceRule === 'true') {
					const toggleBtn = document.createElement('button');
					toggleBtn.className = 'item-action-btn toggle-post-replace';
					const rules = GM_getValue(POST_REPLACE_RULES_KEY,[]);
					const rule = rules.find(r => r.id === option.value);
					const isEnabled = rule ? (rule.enabled !== false) : true;
					toggleBtn.innerHTML = isEnabled ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
					toggleBtn.title = isEnabled ? '点击禁用' : '点击启用';
					if (!isEnabled) toggleBtn.classList.add('is-disabled');
					toggleBtn.dataset.value = option.value;
					actionsDiv.appendChild(toggleBtn);
				}
				listItem.appendChild(actionsDiv);
				return listItem;
			};

			Array.from(triggerElement.options).forEach(option => {
				const item = createListItem(option);
				if (item) list.appendChild(item);
			});

			shadowWrapper.appendChild(menu);

			if (triggerElement.id === 'setting-local-glossary-select') {
				enableDragSort(list, (newOrderIds) => {
					const currentGlossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
					const glossaryMap = new Map(currentGlossaries.map(g => [g.id, g]));
					const newGlossaries = newOrderIds.map(id => glossaryMap.get(id)).filter(Boolean);

					if (newGlossaries.length === currentGlossaries.length) {

						GM_setValue(CUSTOM_GLOSSARIES_KEY, newGlossaries);

						const select = document.getElementById('setting-local-glossary-select');
						if (select) {
							const savedValue = select.value;

							const createOption = select.querySelector('option[value="create_new"]');
							select.innerHTML = '';
							newGlossaries.forEach(g => {
								const opt = document.createElement('option');
								opt.value = g.id;
								opt.textContent = g.name;
								opt.dataset.isLocalGlossary = 'true';
								select.appendChild(opt);
							});
							if (createOption) select.appendChild(createOption);

							select.value = savedValue;
						}
						SettingsSyncManager.syncGlossary();
					}
				});
			} else if (triggerElement.id === 'setting-select-glossary-manage') {
				enableDragSort(list, (newOrderUrls) => {
					GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, newOrderUrls);

					const select = document.getElementById('setting-select-glossary-manage');
					if (select) {
						const savedValue = select.value;

						select.innerHTML = '';
						newOrderUrls.forEach(url => {
							const filename = url.split('/').pop();
							const lastDotIndex = filename.lastIndexOf('.');
							const baseName = (lastDotIndex > 0) ? filename.substring(0, lastDotIndex) : filename;
							const name = decodeURIComponent(baseName);
							const opt = document.createElement('option');
							opt.value = url;
							opt.textContent = name;
							opt.title = name;
							select.appendChild(opt);
						});

						select.value = savedValue;
					}
					SettingsSyncManager.syncGlossary();
				});
			} else if (triggerElement.id === 'setting-post-replace-select') {
				enableDragSort(list, (newOrderIds) => {
					const currentRules = GM_getValue(POST_REPLACE_RULES_KEY, []);
					const ruleMap = new Map(currentRules.map(r => [r.id, r]));
					const newRules = newOrderIds.map(id => ruleMap.get(id)).filter(Boolean);

					if (newRules.length === currentRules.length) {
						GM_setValue(POST_REPLACE_RULES_KEY, newRules);

						const select = document.getElementById('setting-post-replace-select');
						if (select) {
							const savedValue = select.value;
							const createOption = select.querySelector('option[value="create_new"]');
							select.innerHTML = '';
							newRules.forEach(r => {
								const opt = document.createElement('option');
								opt.value = r.id;
								opt.textContent = r.name;
								opt.dataset.isPostReplaceRule = 'true';
								select.appendChild(opt);
							});
							if (createOption) select.appendChild(createOption);
							select.value = savedValue;
						}
						SettingsSyncManager.syncGlossary();
					}
				});
			}

			activeDropdown = { menu: menu, trigger: triggerElement };
			repositionActiveDropdown();
			const selectedItem = list.querySelector('.selected');
			if (selectedItem) {
				selectedItem.scrollIntoView({ block: 'center', behavior: 'instant' });
			}
			requestAnimationFrame(() => {
				menu.classList.add('visible');
			});
			const closeMenu = () => {
				if (triggerElement.parentElement) {
					triggerElement.parentElement.classList.remove('dropdown-active');
				}
				menu.classList.remove('visible');
				backdrop.remove();
				setTimeout(() => menu.remove(), 200);
				activeDropdown = null;
			};
			list.addEventListener('click', (e) => {
				const targetBtn = e.target.closest('.item-action-btn');
				
				if (targetBtn) {
					e.stopPropagation();
					if (targetBtn.classList.contains('toggle-glossary')) {
						const url = targetBtn.dataset.url;
						const currentMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
						if (currentMetadata[url]) {
							const currentState = currentMetadata[url].enabled !== false;
							currentMetadata[url].enabled = !currentState;
							GM_setValue(GLOSSARY_METADATA_KEY, currentMetadata);
							invalidateGlossaryCache();
							targetBtn.innerHTML = !currentState ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
							targetBtn.title = !currentState ? '点击禁用' : '点击启用';
							targetBtn.classList.toggle('is-disabled', currentState);
						}
					} else if (targetBtn.classList.contains('toggle-local')) {
						const id = targetBtn.dataset.value;
						const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY,[]);
						const index = glossaries.findIndex(g => g.id === id);
						if (index !== -1) {
							const currentState = glossaries[index].enabled !== false;
							glossaries[index].enabled = !currentState;
							GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
							SettingsSyncManager.syncGlossary();
							targetBtn.innerHTML = !currentState ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
							targetBtn.title = !currentState ? '点击禁用' : '点击启用';
							targetBtn.classList.toggle('is-disabled', currentState);
						}
					} else if (targetBtn.classList.contains('toggle-post-replace')) {
						const id = targetBtn.dataset.value;
						const rules = GM_getValue(POST_REPLACE_RULES_KEY,[]);
						const index = rules.findIndex(r => r.id === id);
						if (index !== -1) {
							const currentState = rules[index].enabled !== false;
							rules[index].enabled = !currentState;
							GM_setValue(POST_REPLACE_RULES_KEY, rules);
							SettingsSyncManager.syncGlossary();
							targetBtn.innerHTML = !currentState ? SVG_ICONS.toggleOn : SVG_ICONS.toggleOff;
							targetBtn.title = !currentState ? '点击禁用' : '点击启用';
							targetBtn.classList.toggle('is-disabled', currentState);
						}
					} else if (targetBtn.classList.contains('delete')) {
						if (targetBtn.dataset.confirming) {
							const value = targetBtn.dataset.value;
							if (triggerElement.id === 'setting-trans-engine') {
								if (typeof customServiceManager !== 'undefined') {
									customServiceManager.deleteService(value);
								}
							}
							closeMenu();
						} else {
							list.querySelectorAll('.delete[data-confirming]').forEach(btn => {
								btn.title = '删除';
								delete btn.dataset.confirming;
							});
							targetBtn.title = '确认删除';
							targetBtn.dataset.confirming = 'true';
						}
					}
					return;
				}

				// 处理列表项的选择逻辑
				const li = e.target.closest('li');
				if (li && typeof li.dataset.value !== 'undefined') {
					triggerElement.value = li.dataset.value;
					triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
					closeMenu();
				}
			});
			backdrop.addEventListener('mousedown', closeMenu);
		}

		document.addEventListener('mousedown', (e) => {
			const path = e.composedPath();
			const select = path.find(el => el.classList && el.classList.contains('settings-select') && el.classList.contains('custom-styled-select'));
			
			if (select) {
				if (path.includes(panel) || path.find(el => el.id === 'ao3-log-modal')) {
					e.preventDefault();
					setTimeout(() => createCustomDropdown(select), 10);
				}
			}
		}, true);

		customServiceContainer.addEventListener('change', (e) => {
			if (e.target.id === 'custom-service-action-select') {
				const serviceId = engineSelect.value;
				const newAction = e.target.value;
				if (serviceId && serviceId.startsWith('custom_')) {
					const lastActionKey = `custom_service_last_action_${serviceId}`;
					GM_setValue(lastActionKey, newAction);
					customServiceManager.enterEditMode(serviceId);
				} else if (customServiceManager.isPending()) {
					customServiceManager.updatePendingSection(newAction);
				}
			}
		});

		blockerDimensionSelect.addEventListener('change', () => {
			GM_setValue(BLOCKER_VIEW_KEY, blockerDimensionSelect.value);
			renderBlockerSubDimensions();
		});

		blockerSubDimensionSelect.addEventListener('change', () => {
			GM_setValue(BLOCKER_SUB_VIEW_KEY, blockerSubDimensionSelect.value);
			renderBlockerInput();
		});

		toggleBlockerBtn.addEventListener('click', () => {
			const newState = !GM_getValue('ao3_blocker_enabled', DEFAULT_CONFIG.BLOCKER.enabled);
			saveSetting('ao3_blocker_enabled', newState, DEFAULT_CONFIG.BLOCKER.enabled);
			updateBlockerButtonText();
			SettingsSyncManager.syncBlocker('full');
		});

		toggleReasonsBtn.addEventListener('click', () => {
			const newState = !GM_getValue('ao3_blocker_show_reasons', DEFAULT_CONFIG.BLOCKER.show_reasons);
			saveSetting('ao3_blocker_show_reasons', newState, DEFAULT_CONFIG.BLOCKER.show_reasons);
			updateBlockerButtonText();
			SettingsSyncManager.syncBlocker('full');
		});

		document.addEventListener(CUSTOM_EVENTS.GLOSSARY_IMPORTED, () => {
			if (glossaryActionsSelect.value === 'online_manage') {
				populateManageGlossary();
			}
		});

		const updateCacheCountDisplay = async () => {
			cacheCountDisplay.textContent = '已缓存：计算中...';
			try {
				const count = await TranslationCacheDB.count();
				const lastCleanup = GM_getValue('ao3_cache_last_cleanup_time', 0);
				
				let lastCleanupStr = '从未';
				if (lastCleanup > 0) {
					const date = new Date(lastCleanup);
					const year = date.getFullYear();
					const month = String(date.getMonth() + 1).padStart(2, '0');
					const day = String(date.getDate()).padStart(2, '0');
					lastCleanupStr = `${year}-${month}-${day}`;
				}
				
				cacheCountDisplay.textContent = `已缓存：${count.toLocaleString()} 项，上次清理：${lastCleanupStr}`;
			} catch (e) {
				Logger.error('System', '获取缓存统计失败', e);
				cacheCountDisplay.textContent = '已缓存：统计失败';
			}
		};

			cacheModeSelect.addEventListener('change', () => {
			GM_setValue(CACHE_MANAGE_MODE_KEY, cacheModeSelect.value);
			if (cacheModeSelect.value === 'manual') {
				cacheManualContainer.style.display = 'flex';
				cacheAutoContainer.style.display = 'none';
			} else {
				cacheManualContainer.style.display = 'none';
				cacheAutoContainer.style.display = 'flex';
				cacheAutoCleanupSelect.value = GM_getValue('ao3_cache_auto_cleanup_enabled', true) ? 'true' : 'false';
				inputCacheMaxItems.value = GM_getValue('ao3_cache_max_items', 100000);
				inputCacheMaxDays.value = GM_getValue('ao3_cache_max_days', 30);
				updateInputLabel(inputCacheMaxItems);
				updateInputLabel(inputCacheMaxDays);
			}
		});

		cacheAutoCleanupSelect.addEventListener('change', () => {
			const isEnabled = cacheAutoCleanupSelect.value === 'true';
			GM_setValue('ao3_cache_auto_cleanup_enabled', isEnabled);
		});

		document.addEventListener(CUSTOM_EVENTS.CACHE_UPDATED, () => {
			if (panel.style.display === 'flex' && cacheManageSection.style.display !== 'none') {
				updateCacheCountDisplay();
			}
		});

		btnClearCurrentPage.addEventListener('click', async () => {
			const originalText = btnClearCurrentPage.textContent;
			btnClearCurrentPage.textContent = '清理中...';

			const texts = new Set();
			document.querySelectorAll('.ao3-original-title').forEach(el => {
				const clone = el.cloneNode(true);
				clone.querySelectorAll('img, svg').forEach(e => e.remove());
				texts.add(clone.textContent.trim());
			});
			document.querySelectorAll('.ao3-original-content, .ao3-tag-original').forEach(el => {
				texts.add(el.innerHTML);
			});
			
			TRANSLATION_TARGET_RULES.universal.forEach(rule => {
				document.querySelectorAll(rule.selector).forEach(el => {
					if (!el.dataset.translationState) {
						if (rule.isTitle) {
							const { titleTempDiv } = extractTitleForTranslation(el);
							if (titleTempDiv) texts.add(titleTempDiv.innerHTML);
						} else if (rule.isTags) {
							extractTagsToTranslate(el).forEach(tag => texts.add(tag.innerHTML));
						} else {
							const normalizer = new DOMNormalizer();
							const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
								acceptNode: (node) => {
									if (normalizer._isHidden(node)) return NodeFilter.FILTER_REJECT;
									return NodeFilter.FILTER_ACCEPT;
								}
							});
							let node;
							while ((node = walker.nextNode())) {
								if (node.classList.contains('ao3-text-block') || node.tagName === 'HR' || (normalizer._isBlockNode(node) && !normalizer._hasBlockChild(node))) {
									const content = node.textContent.trim();
									if (content && !['Summary', 'Notes', 'Work Text', 'Chapter Text'].includes(content)) {
										texts.add(node.innerHTML);
									}
								}
							}
						}
					}
				});
			});

			if (texts.size === 0) {
				Logger.info('System', '当前页面没有找到可清除的缓存条目。');
				btnClearCurrentPage.textContent = '无缓存可清理';
				setTimeout(() => btnClearCurrentPage.textContent = originalText, 2000);
				return;
			}

			const textHashes = await Promise.all(Array.from(texts).map(t => sha256(t)));
			const deletedCount = await TranslationCacheDB.deleteByTextHashes(textHashes);
			
			if (deletedCount > 0) {
				Logger.info('System', `已清除当前页面的 ${deletedCount} 项缓存。`);
				GM_setValue('ao3_cache_last_cleanup_time', Date.now());
				btnClearCurrentPage.textContent = `成功清除 ${deletedCount} 项缓存`;
			} else {
				Logger.info('System', '当前页面条目尚未被缓存，无需清理。');
				btnClearCurrentPage.textContent = '无缓存可清理';
			}
			
			document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
			setTimeout(() => btnClearCurrentPage.textContent = originalText, 2000);
		});

		btnClearAllCache.addEventListener('click', () => {
			showCustomConfirm('您确定要清除所有翻译缓存吗？\n注意：此操作无法撤销。', '提示', { textAlign: 'center' })
				.then(async () => {
					const originalText = btnClearAllCache.textContent;
					btnClearAllCache.textContent = '清理中...';
					
					await TranslationCacheDB.clear();
					Logger.info('System', '所有翻译缓存已清除。');
					GM_setValue('ao3_cache_last_cleanup_time', Date.now());
					
					btnClearAllCache.textContent = '清理成功';
					document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.CACHE_UPDATED));
					setTimeout(() => btnClearAllCache.textContent = originalText, 2000);
				}).catch(() => {});
		});

		btnCacheMaxItemsSave.addEventListener('click', () => {
			const val = parseInt(inputCacheMaxItems.value, 10);
			if (!isNaN(val) && val > 0) {
				GM_setValue('ao3_cache_max_items', val);
			}
		});

		btnCacheMaxDaysSave.addEventListener('click', () => {
			const val = parseInt(inputCacheMaxDays.value, 10);
			if (!isNaN(val) && val > 0) {
				GM_setValue('ao3_cache_max_days', val);
			}
		});

		return { togglePanel, panel, setIgnoreOutsideClick };
	}

	/**************************************************************************
	 * 内容屏蔽功能系统
	 **************************************************************************/

	/**
	 * 辅助函数：向指定 Key 追加屏蔽规则
	 */
	function addBlockRule(key, value) {
		if (!value) return;
		const currentStr = GM_getValue(key, '');
		const currentRules = currentStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
		if (!currentRules.includes(value)) {
			currentRules.push(value);
			GM_setValue(key, currentRules.join(', '));
		}
	}

	/**
	 * 屏蔽规则符号标准化
	 */
	function normalizeBlockerInput(str) {
		if (!str) return '';
		return str.replace(/[，]/g, ",")
			.replace(/[＋]/g, "+")
			.replace(/[－—]/g, "-")
			.replace(/[“”｛｝]/g, '"')
			.replace(/[‘’]/g, "'");
	}

	/**
	 * 智能去引号工具
	 */
	function smartUnquote(s) {
		if (!s) return '';
		s = s.trim();
		const len = s.length;
		if (len < 2) return s;

		const first = s[0];
		const last = s[len - 1];

		if ((first === '"' && last === '"') ||
			(first === "'" && last === "'") ||
			(first === '“' && last === '”') ||
			(first === '‘' && last === '’')) {
			return s.slice(1, -1);
		}

		return s;
	}

	/**
	 * 通用引用感知分词引擎
	 */
	function tokenizeQuoteAware(str, separators = [',', '+', '-']) {
		const tokens = [];
		let current = "";
		let inQuote = false;
		let expectedCloseQuote = "";
		let lastOp = null;

		const quotePairs = {
			'"': '"',
			"'": "'",
			'“': '”',
			'‘': '’'
		};

		for (let i = 0; i < str.length; i++) {
			let char = str[i];

			if (char === '\\' && i + 1 < str.length) {
				current += char + str[i + 1];
				i++;
				continue;
			}

			if (inQuote) {
				current += char;
				if (char === expectedCloseQuote) {
					let nextNonSpaceChar = null;
					for (let k = i + 1; k < str.length; k++) {
						if (!/\s/.test(str[k])) {
							nextNonSpaceChar = str[k];
							break;
						}
					}

					if (nextNonSpaceChar === null || separators.includes(nextNonSpaceChar) || [':', '：', '=', '＝'].includes(nextNonSpaceChar)) {
						inQuote = false;
						expectedCloseQuote = "";
					}
				}
			} else {
				if (quotePairs.hasOwnProperty(char)) {
					inQuote = true;
					expectedCloseQuote = quotePairs[char];
					current += char;
				} else if (separators.includes(char)) {
					if (current.trim() || lastOp !== null) {
						tokens.push({ value: current.trim(), op: lastOp });
					}
					lastOp = char;
					current = "";
				} else {
					current += char;
				}
			}
		}

		if (current.trim() || lastOp !== null) {
			tokens.push({ value: current.trim(), op: lastOp });
		}
		return tokens;
	}

	/**
	 * 屏蔽规则模式匹配
	 */
	function matchBlockerPattern(text, pattern) {
		if (!text || !pattern) return false;
		const normalizedText = text.toLowerCase().trim();
		const normalizedPattern = pattern.toLowerCase().trim();
		if (normalizedPattern.includes('*')) {
			const regexStr = '^' + normalizedPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
			return new RegExp(regexStr).test(normalizedText);
		}
		return normalizedText === normalizedPattern;
	}

	/**
	 * 解析屏蔽规则字符串
	 */
	function parseBlockerRules(input) {
		const normalized = normalizeBlockerInput(input);
		const rules = [];
		const tokens = tokenizeQuoteAware(normalized, [',', '+', '-']);

		let currentRule = null;
		tokens.forEach(token => {
			if (token.op === ',' || !currentRule) {
				if (currentRule) rules.push(currentRule);
				currentRule = {
					base: smartUnquote(token.value),
					conditions: []
				};
			} else {
				currentRule.conditions.push({
					type: token.op,
					value: smartUnquote(token.value)
				});
			}
		});
		if (currentRule) rules.push(currentRule);
		return rules;
	}

	/**
	 * 解析章节状态字符串
	 */
	function parseChaptersStatus(text) {
		if (!text) return { current: 0, total: 0 };
		const match = text.match(/(\d+)\s*\/\s*(\d+|\?)/);
		if (!match) return { current: 0, total: 0 };
		return {
			current: parseInt(match[1], 10),
			total: match[2] === '?' ? null : parseInt(match[2], 10)
		};
	}

	/**
	 * 计算距离上次更新的月数
	 */
	function getMonthsSinceUpdate(dateStr) {
		if (!dateStr) return 0;
		const cleanStr = dateStr.trim();
		let updateDate = new Date(cleanStr);
		if (isNaN(updateDate.getTime())) {
			const normalized = cleanStr.replace(/年|月/g, '-').replace(/日/g, '');
			updateDate = new Date(normalized);
		}
		if (isNaN(updateDate.getTime())) return 0;
		const now = new Date();
		const diffTime = Math.abs(now - updateDate);
		const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);

		return diffMonths;
	}

	/**
	 * 提取并分类标签
	 */
	function getCategorizedTags(blurb) {
		const result = {
			fandoms: [],
			relationships: [],
			characters: [],
			freeforms: [],
			warnings: [],
			all: []
		};

		blurb.querySelectorAll('a.tag').forEach(tag => {
			const text = tag.textContent.trim();
			result.all.push(text);
			const li = tag.closest('li');
			if (li) {
				if (li.classList.contains('fandoms')) result.fandoms.push(text);
				else if (li.classList.contains('relationships')) result.relationships.push(text);
				else if (li.classList.contains('characters')) result.characters.push(text);
				else if (li.classList.contains('freeforms')) result.freeforms.push(text);
				else if (li.classList.contains('warnings')) result.warnings.push(text);
			} else if (tag.closest('h5.fandoms')) {
				result.fandoms.push(text);
			}
		});

		blurb.querySelectorAll('.required-tags span.text').forEach(span => {
			const rawText = span.textContent.trim();
			if (rawText) {
				const parts = rawText.split(/[,，]/).map(s => s.trim()).filter(Boolean);
				result.all.push(...parts);
			}
		});

		return result;
	}

	/**
	 * 提取作品卡片中的元数据
	 */
	function extractWorkData(blurb) {
		const isWork = blurb.classList.contains('work');
		const isSeries = blurb.classList.contains('series');
		const isCollection = blurb.classList.contains('collection');

		const titleLink = blurb.querySelector('.header .heading a:first-child');

		let authors = Array.from(blurb.querySelectorAll('a[rel="author"]')).map(a => a.textContent.trim());

		if (authors.length === 0) {
			const heading = blurb.querySelector('.header .heading');
			if (heading) {
				const clone = heading.cloneNode(true);
				const tLink = clone.querySelector('a');
				if (tLink) tLink.remove();
				let authorText = clone.textContent.replace(/\s+/g, ' ').trim();
				authorText = authorText.replace(/^by\s+/i, '').trim();
				if (authorText) {
					authors = [authorText];
				}
			}
		}

		const summaryNode = blurb.querySelector('blockquote.summary');
		const summary = summaryNode ? summaryNode.textContent.trim() : '';
		const wordsNode = blurb.querySelector('dd.words');
		const wordCount = wordsNode ? parseInt(wordsNode.textContent.replace(/,/g, ''), 10) : 0;
		const chaptersNode = blurb.querySelector('dd.chapters');
		const chapterInfo = parseChaptersStatus(chaptersNode ? chaptersNode.textContent : '');
		const dateNode = blurb.querySelector('p.datetime');
		const monthsSinceUpdate = getMonthsSinceUpdate(dateNode ? dateNode.textContent : '');
		const languageNode = blurb.querySelector('dd.language');
		const language = languageNode ? languageNode.textContent.trim() : '';
		const workId = titleLink ? titleLink.href.match(/\/works\/(\d+)/)?.[1] : null;
		const categorizedTags = getCategorizedTags(blurb);
		const explicitFandoms = blurb.querySelectorAll('h5.fandoms a.tag');
		const fandomCount = explicitFandoms.length;

		return {
			isWork,
			isSeries,
			isCollection,
			title: titleLink ? titleLink.textContent.trim() : '',
			authors,
			summary,
			wordCount,
			chapterInfo,
			monthsSinceUpdate,
			language,
			workId,
			tags: categorizedTags.all,
			categorizedTags,
			fandomCount
		};
	}

	/**
	 * 字符串标准化缓存
	 */
	const NormalizationCache = new Map();

	/**
	 * 标签判定结果缓存
	 */
	const TagCheckCache = new Map();

	/**
	 * 全局屏蔽规则缓存对象
	 */
	const BlockerCache = {
		enabled: false,
		showReasons: true,
		rules: {
			tags: {
				black: { exact: new Set(), fuzzy: [] },
				white: { exact: new Set(), fuzzy: [] }
			},
			content: {
				author: new Set(),
				title: [],
				summary: [],
				id: new Set()
			},
			stats: {
				minWords: NaN,
				maxWords: NaN,
				minChapters: NaN,
				maxChapters: NaN,
				update: NaN,
				crossover: NaN
			},
			adv: {
				pairing: [],
				char: [],
				lang: []
			}
		}
	};

	/**
	 * 辅助函数：编译并分类屏蔽规则
	 */
	function compileBlockerRule(input, targetExact, targetFuzzy) {
		if (!input) return;
		const rules = parseBlockerRules(input);
		for (const rule of rules) {
			if (rule.base.includes('*') || (rule.conditions && rule.conditions.length > 0)) {
				targetFuzzy.push(rule);
			} else {
				targetExact.add(rule.base.toLowerCase());
			}
		}
	}

	/**
	 * 更新屏蔽规则缓存
	 */
	function updateBlockerCache() {
		TagCheckCache.clear();

		BlockerCache.enabled = GM_getValue('ao3_blocker_enabled', DEFAULT_CONFIG.BLOCKER.enabled);
		BlockerCache.showReasons = GM_getValue('ao3_blocker_show_reasons', DEFAULT_CONFIG.BLOCKER.show_reasons);

		const rules = BlockerCache.rules;

		rules.tags.black.exact.clear();
		rules.tags.black.fuzzy.length = 0;
		rules.tags.white.exact.clear();
		rules.tags.white.fuzzy.length = 0;

		compileBlockerRule(GM_getValue('ao3_blocker_tags_black', DEFAULT_CONFIG.BLOCKER.tags_black), rules.tags.black.exact, rules.tags.black.fuzzy);
		compileBlockerRule(GM_getValue('ao3_blocker_tags_white', DEFAULT_CONFIG.BLOCKER.tags_white), rules.tags.white.exact, rules.tags.white.fuzzy);

		const parseList = (key, defaultVal, toLowerCase = false) => {
			const raw = GM_getValue(key, defaultVal);
			if (!raw) return [];

			const normalized = normalizeBlockerInput(raw);
			return tokenizeQuoteAware(normalized, [',']).map(token => {
				let clean = smartUnquote(token.value);
				return toLowerCase ? clean.toLowerCase() : clean;
			}).filter(Boolean);
		};

		const parseIntVal = (key, defaultVal) => {
			let val = GM_getValue(key, defaultVal);
			if (typeof val === 'string') {
				val = normalizeBlockerInput(val).trim().replace(/^['"]|['"]$/g, '');
			}
			return parseInt(val, 10);
		};

		rules.content.author = new Set(parseList('ao3_blocker_content_author', DEFAULT_CONFIG.BLOCKER.content_author, true));
		rules.content.id = new Set(parseList('ao3_blocker_content_id', DEFAULT_CONFIG.BLOCKER.content_id, true));
		rules.content.title = parseList('ao3_blocker_content_title', DEFAULT_CONFIG.BLOCKER.content_title, true);
		rules.content.summary = parseList('ao3_blocker_content_summary', DEFAULT_CONFIG.BLOCKER.content_summary, true);

		rules.stats.minWords = parseIntVal('ao3_blocker_stats_min_words', DEFAULT_CONFIG.BLOCKER.stats_min_words);
		rules.stats.maxWords = parseIntVal('ao3_blocker_stats_max_words', DEFAULT_CONFIG.BLOCKER.stats_max_words);
		rules.stats.minChapters = parseIntVal('ao3_blocker_stats_min_chapters', DEFAULT_CONFIG.BLOCKER.stats_min_chapters);
		rules.stats.maxChapters = parseIntVal('ao3_blocker_stats_max_chapters', DEFAULT_CONFIG.BLOCKER.stats_max_chapters);
		rules.stats.update = parseIntVal('ao3_blocker_stats_update', DEFAULT_CONFIG.BLOCKER.stats_update);

		const crossoverRaw = GM_getValue('ao3_blocker_stats_crossover', DEFAULT_CONFIG.BLOCKER.stats_crossover).toString();
		rules.stats.crossover = parseInt(crossoverRaw.replace(/[^\d]/g, ''), 10);

		rules.adv.lang = parseList('ao3_blocker_adv_lang', DEFAULT_CONFIG.BLOCKER.adv_lang, true);
		rules.adv.pairing = parseList('ao3_blocker_adv_pairing', DEFAULT_CONFIG.BLOCKER.adv_pairing);
		rules.adv.char = parseList('ao3_blocker_adv_char', DEFAULT_CONFIG.BLOCKER.adv_char);

		rules.adv.scopeRel = parseIntVal('ao3_blocker_adv_scope_rel', DEFAULT_CONFIG.BLOCKER.adv_scope_rel) || 1;
		rules.adv.scopeChar = parseIntVal('ao3_blocker_adv_scope_char', DEFAULT_CONFIG.BLOCKER.adv_scope_char) || 5;
	}

	/**
	 * 获取标准化文本
	 */
	function getNormalizedText(text) {
		if (!text) return '';
		let normalized = NormalizationCache.get(text);
		if (normalized === undefined) {
			normalized = text.toLowerCase().trim();
			NormalizationCache.set(text, normalized);
		}
		return normalized;
	}

	/**
	 * 综合判定作品是否应被屏蔽
	 */
	function getBlockReason(workData) {
		if (!BlockerCache.enabled) return null;

		const { rules } = BlockerCache;
		const reasons = [];
		const workTags = workData.tags || [];

		// 1. 白名单判定
		const isWhitelisted = workTags.some(tag => {
			const normalized = getNormalizedText(tag);
			if (rules.tags.white.exact.has(normalized)) return true;

			return rules.tags.white.fuzzy.some(rule => {
				if (!matchBlockerPattern(normalized, rule.base)) return false;
				if (!rule.conditions || rule.conditions.length === 0) return true;
				return rule.conditions.every(cond => {
					const isPresent = workTags.some(t => matchBlockerPattern(getNormalizedText(t), cond.value));
					return cond.type === '+' ? isPresent : !isPresent;
				});
			});
		});
		if (isWhitelisted) return null;

		// 2. 标签黑名单判定
		const tagReasons = [];
		for (const tag of workTags) {
			const normalized = getNormalizedText(tag);

			if (rules.tags.black.exact.has(normalized)) {
				tagReasons.push({ text: `标签 '${tag}'`, weight: 1 });
			}

			rules.tags.black.fuzzy.forEach(rule => {
				if (!matchBlockerPattern(normalized, rule.base)) return;

				const isChainMatched = !rule.conditions || rule.conditions.length === 0 || rule.conditions.every(cond => {
					const isPresent = workTags.some(t => matchBlockerPattern(getNormalizedText(t), cond.value));
					return cond.type === '+' ? isPresent : !isPresent;
				});

				if (isChainMatched) {
					let fullReasonText = `标签 '${rule.base}'`;
					if (rule.conditions && rule.conditions.length > 0) {
						fullReasonText += rule.conditions.map(c => ` ${c.type} '${c.value}'`).join('');
					}
					const weight = (rule.conditions ? rule.conditions.length : 0) + 2;
					tagReasons.push({ text: fullReasonText, weight: weight });
				}
			});
		}

		if (tagReasons.length > 0) {
			tagReasons.sort((a, b) => b.weight - a.weight);
			const bestReason = [...new Set(tagReasons.map(r => r.text))][0];
			reasons.push(bestReason);
		}

		// 3. 内容黑名单判定
		const hitAuthor = workData.authors.find(a => rules.content.author.has(getNormalizedText(a)));
		if (hitAuthor) reasons.push(`作者 '${hitAuthor}'`);

		if (rules.content.id.has(workData.workId)) reasons.push(`作品 ID '${workData.workId}'`);

		const normalizedTitle = getNormalizedText(workData.title);
		const hitTitle = rules.content.title.find(p => normalizedTitle.includes(p));
		if (hitTitle) reasons.push(`标题关键词 '${hitTitle}'`);

		const normalizedSummary = getNormalizedText(workData.summary);
		const hitSummary = rules.content.summary.find(p => normalizedSummary.includes(p));
		if (hitSummary) reasons.push(`简介关键词 '${hitSummary}'`);

		// 4. 统计数据过滤
		if (workData.isWork) {
			if (!isNaN(rules.stats.minWords) && workData.wordCount < rules.stats.minWords) reasons.push(`字数少于 ${rules.stats.minWords}`);
			if (!isNaN(rules.stats.maxWords) && workData.wordCount > rules.stats.maxWords) reasons.push(`字数多于 ${rules.stats.maxWords}`);
			if (!isNaN(rules.stats.minChapters) && workData.chapterInfo.current < rules.stats.minChapters) reasons.push(`章节少于 ${rules.stats.minChapters}`);
			if (!isNaN(rules.stats.maxChapters) && workData.chapterInfo.current > rules.stats.maxChapters) reasons.push(`章节多于 ${rules.stats.maxChapters}`);

			const isOngoing = workData.chapterInfo.total === null || workData.chapterInfo.current !== workData.chapterInfo.total;
			if (!isNaN(rules.stats.update) && isOngoing && workData.monthsSinceUpdate > rules.stats.update) {
				reasons.push(`未更新超过 ${rules.stats.update} 个月`);
			}
		}

		// 5. 跨圈判定
		if (!isNaN(rules.stats.crossover) && workData.fandomCount > rules.stats.crossover) reasons.push(`同人圈超过 ${rules.stats.crossover} 个`);

		// 6. 高级筛选
		if (workData.isWork) {
			if (rules.adv.lang.length > 0) {
				const normalizedLang = getNormalizedText(workData.language);
				if (!rules.adv.lang.some(l => normalizedLang.includes(l))) {
					reasons.push(`语言不匹配`);
				}
			}

			if (rules.adv.pairing.length > 0) {
				const scope = rules.adv.scopeRel || 1;
				const relsToCheck = workData.categorizedTags.relationships.slice(0, scope);
				const hasMatch = relsToCheck.some(tag => rules.adv.pairing.some(p => matchBlockerPattern(tag, p)));
				if (!hasMatch) {
					reasons.push(`主要关系不匹配`);
				}
			}

			if (rules.adv.char.length > 0) {
				const scope = rules.adv.scopeChar || 5;
				const charsToCheck = workData.categorizedTags.characters.slice(0, scope);
				const hasMatch = charsToCheck.some(tag => rules.adv.char.some(c => matchBlockerPattern(tag, c)));
				if (!hasMatch) {
					reasons.push(`主要角色不匹配`);
				}
			}
		}

		return reasons.length > 0 ? reasons.join('；') : null;
	}

	/**
	 * 执行屏蔽视觉处理
	 */
	function executeBlocking(blurb, reason) {
		if (window.getComputedStyle(blurb).display === 'none') {
			return;
		}

		if (!BlockerCache.showReasons) {
			blurb.classList.add('ao3-blocker-hidden');
			return;
		}

		if (blurb.classList.contains('ao3-blocker-work')) return;

		const ICON_VISIBILITY = SVG_ICONS.visibilityOn;
		const ICON_VISIBILITY_OFF = SVG_ICONS.visibilityOff;

		const originalContent = Array.from(blurb.childNodes);
		const cut = document.createElement('div');
		cut.className = 'ao3-blocker-cut';
		originalContent.forEach(node => cut.appendChild(node));

		const fold = document.createElement('div');
		fold.className = 'ao3-blocker-fold';

		const note = document.createElement('span');
		note.className = 'ao3-blocker-note';
		note.textContent = `屏蔽原因: ${reason}`;

		const toggle = document.createElement('div');
		toggle.className = 'ao3-blocker-toggle';
		toggle.innerHTML = ICON_VISIBILITY;

		toggle.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (blurb.classList.contains('ao3-blocker-unhide')) {
				blurb.classList.remove('ao3-blocker-unhide');
				toggle.innerHTML = ICON_VISIBILITY;
			} else {
				blurb.classList.add('ao3-blocker-unhide');
				toggle.innerHTML = ICON_VISIBILITY_OFF;
			}
		});

		fold.appendChild(note);
		fold.appendChild(toggle);

		blurb.innerHTML = '';
		blurb.classList.add('ao3-blocker-work');
		blurb.appendChild(fold);
		blurb.appendChild(cut);
	}

	/**
	 * 处理单个作品卡片的还原
	 */
	function unblockSingleBlurb(blurb) {
		if (blurb.classList.contains('ao3-blocker-work')) {
			const cut = blurb.querySelector('.ao3-blocker-cut');
			if (cut) {
				const fragment = document.createDocumentFragment();
				while (cut.firstChild) {
					fragment.appendChild(cut.firstChild);
				}
				blurb.textContent = '';
				blurb.appendChild(fragment);
			}
		}
		blurb.classList.remove('ao3-blocker-work', 'ao3-blocker-hidden', 'ao3-blocker-unhide', 'ao3-blocker-processed');
	}


	/**
	 * 同步扫描所有作品
	 */
	function checkWorksSynchronously() {
		if (!BlockerCache.enabled) return;
		const blurbs = document.querySelectorAll('li.blurb');
		for (let i = 0; i < blurbs.length; i++) {
			const blurb = blurbs[i];
			if (
				blurb.classList.contains('ao3-blocker-work') ||
				blurb.classList.contains('ao3-blocker-hidden') ||
				blurb.classList.contains('ao3-blocker-processed')
			) {
				continue;
			}
			const workData = extractWorkData(blurb);
			const reason = getBlockReason(workData);
			if (reason) {
				executeBlocking(blurb, reason);
			} else {
				blurb.classList.add('ao3-blocker-processed');
			}
		}
	}

	/**
	 * 全量扫描页面作品
	 */
	function scanAllWorks() {
		if (!BlockerCache.enabled) return;
		checkWorksSynchronously();
	}

	/**
	 * 刷新页面屏蔽状态
	 */
	function refreshBlocker(mode = 'full') {
		updateBlockerCache();
		if (mode === 'full') {
			NormalizationCache.clear();
			const blockedWorks = document.querySelectorAll('.ao3-blocker-work, .ao3-blocker-hidden');
			blockedWorks.forEach(unblockSingleBlurb);
			const processedWorks = document.querySelectorAll('.ao3-blocker-processed');
			processedWorks.forEach(el => el.classList.remove('ao3-blocker-processed'));
		} else if (mode === 'incremental') {
			const processedWorks = document.querySelectorAll('.ao3-blocker-processed');
			processedWorks.forEach(el => el.classList.remove('ao3-blocker-processed'));
		}
		checkWorksSynchronously();
	}

	/**************************************************************************
	 * 翻译核心引擎与 API 调用
	 **************************************************************************/

	/**
	 * 设置面板的模型 UI 配置
	 */
	const engineMenuConfig = {
		'google_translate': {
			displayName: '谷歌翻译',
			modelGmKey: null,
			requiresApiKey: false
		},
		'bing_translator': {
			displayName: '微软翻译',
			modelGmKey: null,
			requiresApiKey: false
		},
		'anthropic': {
			displayName: 'Anthropic',
			modelGmKey: 'anthropic_model',
			modelMapping: {
				"claude-opus-4-7": "Claude Opus 4.7",
				"claude-sonnet-4-6": "Claude Sonnet 4.6",
				"claude-opus-4-6": "Claude Opus 4.6",
				"claude-opus-4-5-20251101": "Claude Opus 4.5 2025-11-01",
				"claude-haiku-4-5-20251001": "Claude Haiku 4.5 2025-10-01",
				"claude-sonnet-4-5-20250929": "Claude Sonnet 4.5 2025-09-29",
				"claude-opus-4-1-20250805": "Claude Opus 4.1 2025-08-05"
			},
			requiresApiKey: true
		},
		'cerebras_ai': {
			displayName: 'Cerebras',
			modelGmKey: 'cerebras_model',
			modelMapping: {
				'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B',
				'llama3.1-8b': 'Llama 3 8B'
			},
			requiresApiKey: true
		},
		'deepseek_ai': {
			displayName: 'DeepSeek',
			modelGmKey: 'deepseek_model',
			modelMapping: {
				'deepseek-v4-flash': 'DeepSeek V4 Flash',
				'deepseek-v4-pro': 'DeepSeek V4 Pro'
			},
			requiresApiKey: true
		},
		'google_ai': {
			displayName: 'Google AI',
			modelGmKey: 'google_ai_model',
			modelMapping: {
				"gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview",
				"gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
				"gemini-3.1-flash-lite-preview": "Gemini 3.1 Flash Lite Preview",
				"gemini-3-pro-preview": "Gemini 3 Pro Preview",
				"gemini-3-flash-preview": "Gemini 3 Flash Preview",
				"gemini-2.5-pro": "Gemini 2.5 Pro",
				"gemini-2.5-flash": "Gemini 2.5 Flash",
				"gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
				"gemini-2.0-flash": "Gemini 2.0 Flash",
				"gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
				"gemma-4-26b-a4b-it": "Gemma 4 26B A4B IT",
				"gemini-pro-latest": "Gemini Pro Latest",
				"gemini-flash-latest": "Gemini Flash Latest",
				"gemini-flash-lite-latest": "Gemini Flash Lite Latest"
			},
			requiresApiKey: true
		},
		'groq_ai': {
			displayName: 'Groq AI',
			modelGmKey: 'groq_model',
			modelMapping: {
				"meta-llama/llama-4-scout-17b-16e-instruct": "Llama 4 Scout 17B 16E Instruct",
				"llama-3.3-70b-versatile": "Llama 3.3 70B Versatile",
				"llama-3.1-8b-instant": "Llama 3.1 8B Instant",
				"openai/gpt-oss-120b": "GPT OSS 120B",
				"openai/gpt-oss-20b": "GPT OSS 20B",
				"groq/compound": "Compound",
				"groq/compound-mini": "Compound Mini",
				"allam-2-7b": "Allam 2 7B",
			},
			requiresApiKey: true
		},
		'modelscope_ai': {
			displayName: 'ModelScope',
			modelGmKey: 'modelscope_model',
			modelMapping: {
				"MiniMax/MiniMax-M2.5": "MiniMax M2.5",
				"moonshotai/Kimi-K2.5": "Kimi K2.5",
				"Qwen/Qwen3.5-397B-A17B": "Qwen 3.5 397B A17B",
				"Qwen/Qwen3.5-122B-A10B": "Qwen 3.5 122B A10B",
				"Qwen/Qwen3.5-35B-A3B": "Qwen 3.5 35B A3B",
				"Qwen/Qwen3.5-27B": "Qwen 3.5 27B",
				"Qwen/Qwen3-235B-A22B-Thinking-2507": "Qwen 3 235B A22B Thinking 2025-07",
				"Qwen/Qwen3-235B-A22B-Instruct-2507": "Qwen 3 235B A22B Instruct 2025-07",
				"Qwen/Qwen3-30B-A3B-Thinking-2507": "Qwen 3 30B A3B Thinking 2025-07",
				"Qwen/Qwen3-Next-80B-A3B-Thinking": "Qwen 3 Next 80B A3B Thinking",
				"Qwen/Qwen3-Next-80B-A3B-Instruct": "Qwen 3 Next 80B A3B Instruct",
				"Qwen/Qwen3-235B-A22B": "Qwen 3 235B A22B",
				"Qwen/QwQ-32B-Preview": "QwQ 32B Preview",
				"deepseek-ai/DeepSeek-V4-Flash": "DeepSeek V4 Flash",
				"deepseek-ai/DeepSeek-V3.2": "DeepSeek V3.2",
				"deepseek-ai/DeepSeek-R1-0528": "DeepSeek R1 2025-05-28",
				"deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": "DeepSeek R1 Distill Qwen 32B",
				"deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": "DeepSeek R1 Distill Qwen 14B",
				"ZhipuAI/GLM-5.1": "GLM 5.1",
				"ZhipuAI/GLM-5": "GLM 5",
				"mistralai/Mistral-Small-Instruct-2409": "Mistral Small Instruct 2024-09",
				"mistralai/Mistral-Large-Instruct-2407": "Mistral Large Instruct 2024-07",
				"stepfun-ai/Step-3.5-Flash": "Step 3.5 Flash"
			},
			requiresApiKey: true
		},
		'openai': {
			displayName: 'OpenAI',
			modelGmKey: 'openai_model',
			modelMapping: {
				"gpt-5.5-pro-2026-04-23": "GPT 5.5 Pro 2026-04-23",
				"gpt-5.5-pro": "GPT 5.5 Pro",
				"gpt-5.5-2026-04-23": "GPT 5.5 2026-04-23",
				"gpt-5.5": "GPT 5.5",
				"gpt-5.4-pro-2026-03-05": "GPT 5.4 Pro 2026-03-05",
				"gpt-5.4-pro": "GPT 5.4 Pro",
				"gpt-5.4-2026-03-05": "GPT 5.4 2026-03-05",
				"gpt-5.4": "GPT 5.4",
				"gpt-5.4-mini-2026-03-17": "GPT 5.4 Mini 2026-03-17",
				"gpt-5.4-mini": "GPT 5.4 Mini",
				"gpt-5.3-chat-latest": "GPT 5.3 Chat Latest",
				"gpt-5.2-pro-2025-12-11": "GPT 5.2 Pro 2025-12-11",
				"gpt-5.2-pro": "GPT 5.2 Pro",
				"gpt-5.2-chat-latest": "GPT 5.2 Chat Latest",
				"gpt-5.2-2025-12-11": "GPT 5.2 2025-12-11",
				"gpt-5.2": "GPT 5.2",
				"gpt-5.1-chat-latest": "GPT 5.1 Chat Latest",
				"gpt-5.1-2025-11-13": "GPT 5.1 2025-11-13",
				"gpt-5.1": "GPT 5.1",
				"gpt-5-pro-2025-10-06": "GPT 5 Pro 2025-10-06",
				"gpt-5-pro": "GPT 5 Pro",
				"gpt-5-chat-latest": "GPT 5 Chat Latest",
				"gpt-5-2025-08-07": "GPT 5 2025-08-07",
				"gpt-5": "GPT 5",
				"gpt-5-mini-2025-08-07": "GPT 5 Mini 2025-08-07",
				"gpt-5-mini": "GPT 5 Mini",
				"o4-mini-2025-04-16": "o4 Mini 2025-04-16",
				"o4-mini": "o4 Mini",
				"o3-2025-04-16": "o3 2025-04-16",
				"o3": "o3",
				"o3-mini-2025-01-31": "o3 Mini 2025-01-31",
				"o3-mini": "o3 Mini",
				"o1-2024-12-17": "o1 2024-12-17",
				"o1": "o1",
				"gpt-4.1-2025-04-14": "GPT 4.1 2025-04-14",
				"gpt-4.1": "GPT 4.1",
				"gpt-4.1-mini-2025-04-14": "GPT 4.1 Mini 2025-04-14",
				"gpt-4.1-mini": "GPT 4.1 Mini",
				"gpt-4o-2024-11-20": "GPT 4o 2024-11-20",
				"gpt-4o-2024-08-06": "GPT 4o 2024-08-06",
				"gpt-4o-2024-05-13": "GPT 4o 2024-05-13",
				"gpt-4o": "GPT 4o",
				"gpt-4o-mini-2024-07-18": "GPT 4o Mini 2024-07-18",
				"gpt-4o-mini": "GPT 4o Mini",
				"gpt-3.5-turbo-0125": "GPT 3.5 Turbo 0125",
				"gpt-3.5-turbo-1106": "GPT 3.5 Turbo 1106",
				"gpt-3.5-turbo": "GPT 3.5 Turbo",
				"gpt-3.5-turbo-16k": "GPT 3.5 Turbo 16k",
				"gpt-3.5-turbo-instruct-0914": "GPT 3.5 Turbo Instruct 0914",
				"gpt-3.5-turbo-instruct": "GPT 3.5 Turbo Instruct",
			},
			requiresApiKey: true
		},
		'siliconflow': {
			displayName: 'SiliconFlow',
			modelGmKey: 'siliconflow_model',
			modelMapping: {
				"Qwen/Qwen3.6-35B-A3B": "Qwen 3.6 35B A3B",
				"Qwen/Qwen3.6-27B": "Qwen 3.6 27B",
				"Qwen/Qwen3.5-397B-A17B": "Qwen 3.5 397B A17B",
				"Qwen/Qwen3.5-122B-A10B": "Qwen 3.5 122B A10B",
				"Qwen/Qwen3.5-35B-A3B": "Qwen 3.5 35B A3B",
				"Qwen/Qwen3.5-27B": "Qwen 3.5 27B",
				"Qwen/Qwen3.5-9B": "Qwen 3.5 9B",
				"Qwen/Qwen3-235B-A22B-Instruct-2507": "Qwen 3 235B A22B Instruct 2025-07",
				"Qwen/Qwen3-30B-A3B-Thinking-2507": "Qwen 3 30B A3B Thinking 2025-07",
				"Qwen/Qwen3-30B-A3B-Instruct-2507": "Qwen 3 30B A3B Instruct 2025-07",
				"Qwen/Qwen3-32B": "Qwen 3 32B",
				"Qwen/Qwen3-14B": "Qwen 3 14B",
				"Qwen/Qwen3-8B": "Qwen 3 8B",
				"Qwen/Qwen2.5-72B-Instruct-128K": "Qwen 2.5 72B Instruct 128K",
				"Qwen/Qwen2.5-72B-Instruct": "Qwen 2.5 72B Instruct",
				"Qwen/Qwen2.5-32B-Instruct": "Qwen 2.5 32B Instruct",
				"Qwen/Qwen2.5-14B-Instruct": "Qwen 2.5 14B Instruct",
				"Qwen/Qwen2.5-7B-Instruct": "Qwen 2.5 7B Instruct",
				"Pro/Qwen/Qwen2.5-7B-Instruct": "Pro Qwen 2.5 7B Instruct",
				"LoRA/Qwen/Qwen2.5-72B-Instruct": "LoRA Qwen 2.5 72B Instruct",
				"LoRA/Qwen/Qwen2.5-32B-Instruct": "LoRA Qwen 2.5 32B Instruct",
				"LoRA/Qwen/Qwen2.5-14B-Instruct": "LoRA Qwen 2.5 14B Instruct",
				"LoRA/Qwen/Qwen2.5-7B-Instruct": "LoRA Qwen 2.5 7B Instruct",
				"deepseek-ai/DeepSeek-V4-Flash": "DeepSeek V4 Flash",
				"Pro/deepseek-ai/DeepSeek-V3.2": "Pro DeepSeek V3.2",
				"deepseek-ai/DeepSeek-V3.2": "DeepSeek V3.2",
				"Pro/deepseek-ai/DeepSeek-V3.1-Terminus": "Pro DeepSeek V3.1 Terminus",
				"deepseek-ai/DeepSeek-V3.1-Terminus": "DeepSeek V3.1 Terminus",
				"Pro/deepseek-ai/DeepSeek-R1": "Pro DeepSeek R1",
				"deepseek-ai/DeepSeek-R1": "DeepSeek R1",
				"deepseek-ai/DeepSeek-R1-0528-Qwen3-8B": "DeepSeek R1 2025-05-28 Qwen3 8B",
				"Pro/deepseek-ai/DeepSeek-V3": "Pro DeepSeek V3",
				"deepseek-ai/DeepSeek-V3": "DeepSeek V3",
				"Pro/moonshotai/Kimi-K2.6": "Pro Kimi K2.6",
				"Pro/moonshotai/Kimi-K2.5": "Pro Kimi K2.5",
				"Pro/moonshotai/Kimi-K2-Thinking": "Pro Kimi K2 Thinking",
				"moonshotai/Kimi-K2-Thinking": "Kimi K2 Thinking",
				"Pro/moonshotai/Kimi-K2-Instruct-0905": "Pro Kimi K2 Instruct 2025-09-05",
				"moonshotai/Kimi-K2-Instruct-0905": "Kimi K2 Instruct 2025-09-05",
				"Pro/zai-org/GLM-5.1": "Pro GLM 5.1",
				"Pro/zai-org/GLM-5": "Pro GLM 5",
				"Pro/zai-org/GLM-4.7": "Pro GLM 4.7",
				"zai-org/GLM-4.6": "GLM 4.6",
				"zai-org/GLM-4.5-Air": "GLM 4.5 Air",
				"THUDM/GLM-Z1-32B-0414": "GLM Z1 32B 2024-04-14",
				"THUDM/GLM-4-32B-0414": "GLM 4 32B 2024-04-14",
				"THUDM/GLM-Z1-9B-0414": "GLM Z1 9B 2024-04-14",
				"THUDM/GLM-4-9B-0414": "GLM 4 9B 2024-04-14",
				"Pro/MiniMaxAI/MiniMax-M2.5": "Pro MiniMax M2.5",
				"MiniMaxAI/MiniMax-M2.5": "MiniMax M2.5",
				"tencent/Hunyuan-A13B-Instruct": "Hunyuan A13B Instruct",
				"tencent/Hunyuan-MT-7B": "Hunyuan MT 7B",
				"inclusionAI/Ring-flash-2.0": "Ring Flash 2.0",
				"inclusionAI/Ling-flash-2.0": "Ling Flash 2.0",
				"inclusionAI/Ling-mini-2.0": "Ling Mini 2.0",
				"ByteDance-Seed/Seed-OSS-36B-Instruct": "Seed OSS 36B Instruct",
				"stepfun-ai/Step-3.5-Flash": "Step 3.5 Flash"
			},
			requiresApiKey: true
		},
		'together_ai': {
			displayName: 'Together AI',
			modelGmKey: 'together_model',
			modelMapping: {
				"Qwen/Qwen3.6-Plus": "Qwen 3.6 Plus",
				"Qwen/Qwen3.6-35B-A3B": "Qwen 3.6 35B A3B",
				"Qwen/Qwen3.6-35B-A3B-FP8": "Qwen 3.6 35B A3B FP8",
				"Qwen/Qwen3.6-27B": "Qwen 3.6 27B",
				"Qwen/Qwen3.5-397B-A17B": "Qwen 3.5 397B A17B",
				"Qwen/Qwen3.5-122B-A10B": "Qwen 3.5 122B A10B",
				"Qwen/Qwen3.5-122B-A10B-FP8": "Qwen 3.5 122B A10B FP8",
				"Qwen/Qwen3.5-35B-A3B": "Qwen 3.5 35B A3B",
				"Qwen/Qwen3.5-27B": "Qwen 3.5 27B",
				"Qwen/Qwen3.5-9B": "Qwen 3.5 9B",
				"Qwen/Qwen3.5-9B-FP8": "Qwen 3.5 9B FP8",
				"Qwen/QwQ-32B": "QwQ 32B",
				"Qwen/Qwen3-Next-80B-A3B-Thinking": "Qwen 3 Next 80B A3B Thinking",
				"Qwen/Qwen3-Next-80B-A3B-Instruct": "Qwen 3 Next 80B A3B Instruct",
				"Qwen/Qwen3-Next-80B-A3B-Instruct-FP8": "Qwen 3 Next 80B A3B Instruct FP8",
				"Qwen/Qwen3-235B-A22B-Instruct-2507-tput": "Qwen 3 235B A22B Instruct 2025-07",
				"Qwen/Qwen3-30B-A3B-Instruct-2507-Lora": "Qwen 3 30B A3B Instruct 2025-07 LoRA",
				"Qwen/Qwen3-30B-A3B": "Qwen 3 30B A3B",
				"Qwen/Qwen3-30B-A3B-Base": "Qwen 3 30B A3B Base",
				"Qwen/Qwen3-14B-Base": "Qwen 3 14B Base",
				"Qwen/Qwen2.5-72B-Instruct-Turbo": "Qwen 2.5 72B Instruct Turbo",
				"Qwen/Qwen2.5-72B-Instruct": "Qwen 2.5 72B Instruct",
				"Qwen/Qwen2.5-72B": "Qwen 2.5 72B",
				"Qwen/Qwen2.5-32B": "Qwen 2.5 32B",
				"Qwen/Qwen2.5-14B-Instruct": "Qwen 2.5 14B Instruct",
				"Qwen/Qwen2.5-14B": "Qwen 2.5 14B",
				"Qwen/Qwen2-72B": "Qwen 2 72B",
				"deepseek-ai/DeepSeek-V4-Pro": "DeepSeek V4 Pro",
				"deepseek-ai/DeepSeek-V3.1": "DeepSeek V3.1",
				"deepseek-ai/DeepSeek-R1": "DeepSeek R1",
				"deepseek-ai/DeepSeek-R1-Distill-Llama-70B": "DeepSeek R1 Distill Llama 70B",
				"deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": "DeepSeek R1 Distill Qwen 14B",
				"meta-llama/Llama-4-Scout-17B-16E-Instruct": "Llama 4 Scout 17B 16E Instruct",
				"meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": "Llama 4 Maverick 17B 128E Instruct FP8",
				"meta-llama/Llama-3.3-70B-Instruct-Turbo": "Llama 3.3 70B Instruct Turbo",
				"meta-llama/Llama-3.3-70B-Instruct": "Llama 3.3 70B Instruct",
				"meta-llama/Llama-3.3-70B-Instruct-FP8-Lora": "Llama 3.3 70B Instruct FP8 LoRA",
				"meta-llama/Llama-3.1-405B-Instruct": "Llama 3.1 405B Instruct",
				"meta-llama/Llama-3.1-405B": "Llama 3.1 405B",
				"meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": "Llama 3.1 70B Instruct Turbo",
				"meta-llama/Meta-Llama-3.1-70B": "Llama 3.1 70B",
				"meta-llama/Meta-Llama-3-70B-Instruct-Turbo": "Llama 3 70B Instruct Turbo",
				"google/gemma-4-31B-it": "Gemma 4 31B IT",
				"google/gemma-4-26B-A4B-it": "Gemma 4 26B A4B IT",
				"google/gemma-4-E4B-it": "Gemma 4 E4B IT",
				"google/gemma-4-E2B-it": "Gemma 4 E2B IT",
				"google/gemma-3n-E4B-it": "Gemma 3N E4B IT",
				"google/gemma-3-27b-pt": "Gemma 3 27B PT",
				"google/gemma-2-27b-it": "Gemma 2 27B IT",
				"google/gemma-2-9b-it": "Gemma 2 9B IT",
				"zai-org/GLM-5.1": "GLM 5.1",
				"zai-org/GLM-5": "GLM 5",
				"zai-org/GLM-4.7": "GLM 4.7",
				"zai-org/GLM-4.6": "GLM 4.6",
				"moonshotai/Kimi-K2.6": "Kimi K2.6",
				"moonshotai/Kimi-K2.5": "Kimi K2.5",
				"MiniMaxAI/MiniMax-M2.7": "MiniMax M2.7",
				"MiniMaxAI/MiniMax-M2.5": "MiniMax M2.5",
				"MiniMaxAI/MiniMax-M2": "MiniMax M2",
				"MiniMaxAI/MiniMax-M1-80k": "MiniMax M1 80K",
				"MiniMaxAI/MiniMax-M1-40k": "MiniMax M1 40K",
				"mistralai/Ministral-3-14B-Instruct-2512": "Ministral 3 14B Instruct 2025-12",
				"mistralai/Mistral-Small-24B-Instruct-2501": "Mistral Small 24B Instruct 2025-01",
				"mistralai/Magistral-Small-2506": "Magistral Small 2025-06",
				"mistralai/Mixtral-8x22B-Instruct-v0.1": "Mixtral 8x22B Instruct",
				"mistralai/Mixtral-8x7B-Instruct-v0.1": "Mixtral 8x7B Instruct",
				"openai/gpt-oss-120b": "GPT OSS 120B",
				"openai/gpt-oss-20b": "GPT OSS 20B",
				"nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16": "Nemotron 3 Super 120B",
				"nvidia/Llama-3.1-Nemotron-70B-Instruct-HF": "Llama 3.1 Nemotron 70B",
				"nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16": "Nemotron 3 Nano 30B",
				"deepcogito/cogito-v2-1-671b": "Cogito V2.1 671B",
				"deepcogito/cogito-v1-preview-llama-70B": "Cogito V1 Llama 70B",
				"deepcogito/cogito-v1-preview-qwen-32B": "Cogito V1 Qwen 32B",
				"deepcogito/cogito-v1-preview-qwen-14B": "Cogito V1 Qwen 14B",
				"LiquidAI/LFM2-24B-A2B": "Liquid LFM2 24B",
				"Hcompany/Holo3-35B-A3B": "Holo3 35B A3B",
				"ByteDance-Seed/Seed-OSS-36B-Instruct": "Seed OSS 36B Instruct",
				"essentialai/rnj-1-instruct": "Essential AI RNJ-1",
				"NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO": "Nous Hermes 2 Mixtral 8x7B"
			},
			requiresApiKey: true
		},
		'zhipu_ai': {
			displayName: 'Zhipu AI',
			modelGmKey: 'zhipu_ai_model',
			modelMapping: {
				"GLM-4.7-Flash": "GLM 4.7 Flash",
				"glm-4.5-flash": "GLM 4.5 Flash",
				"glm-4-flash-250414": "GLM 4 Flash 2025-04-14"
			},
			requiresApiKey: true
		},
		'add_new_custom': {
			displayName: '自定义',
			modelGmKey: null,
			requiresApiKey: false
		}
	};

	/**
	 * 动态应用翻译显示模式的更改
	 */
	function applyDisplayModeChange(mode) {
		if (mode === 'translation_only') {
			document.body.classList.add('ao3-translation-only');
		} else {
			document.body.classList.remove('ao3-translation-only');
		}
	}

	/****************** 数据模型层 ******************/

	/**
	 * 根据服务 ID 从存储中读取配置，并组装成一个标准化的 Provider 对象
	 */
	function getProviderById(serviceId) {
		if (!serviceId) return null;

		// 处理内置服务
		if (engineMenuConfig[serviceId] && !serviceId.startsWith('custom_')) {
			const menuConfig = engineMenuConfig[serviceId];
			const apiConfig = CONFIG.TRANS_ENGINES[serviceId];

			if (!apiConfig) return null;

			const models = menuConfig.modelMapping ? Object.keys(menuConfig.modelMapping) : [];
			const selectedModel = menuConfig.modelGmKey ? GM_getValue(menuConfig.modelGmKey, models[0]) : null;

			return {
				id: serviceId,
				name: menuConfig.displayName,
				providerType: serviceId,
				apiHost: apiConfig.url_api || apiConfig.url,
				apiKey: GM_getValue(`${serviceId}_keys_string`, ''),
				models: models,
				selectedModel: selectedModel,
				isCustom: false
			};
		}

		// 处理自定义服务
		if (serviceId.startsWith('custom_')) {
			const customServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
			const serviceConfig = customServices.find(s => s.id === serviceId);

			if (!serviceConfig) return null;

			const models = Array.isArray(serviceConfig.models) ? serviceConfig.models : [];
			const selectedModel = GM_getValue(`${ACTIVE_MODEL_PREFIX_KEY}${serviceId}`, models[0]);

			return {
				id: serviceId,
				name: serviceConfig.name,
				providerType: 'openai-compatible',
				apiHost: serviceConfig.url,
				apiKey: GM_getValue(`${serviceId}_keys_string`, ''),
				models: models,
				selectedModel: selectedModel,
				isCustom: true
			};
		}

		return null;
	}

	/**
	 * 全局令牌桶流控类
	 */
	class GlobalTokenBucket {
		constructor(engineName = 'default') {
			this.engineName = engineName;
			this.storageKey = `ao3_token_bucket_${engineName}`;
			this.lockKey = `ao3_rate_limit_lock_${engineName}`;
			this.lockTimeout = 3000;
		}

		getConfig(engineName) {
			const isSpecial =['google_translate', 'bing_translator'].includes(engineName);
			const base = CONFIG.SERVICE_CONFIG[engineName] || CONFIG.SERVICE_CONFIG.default;

			if (isSpecial) {
				return {
					rate: base.REQUEST_RATE,
					capacity: base.REQUEST_CAPACITY
				};
			}

			const params = ProfileManager.getParamsByEngine(engineName);
			return {
				rate: parseFloat(params.request_rate),
				capacity: parseInt(params.request_capacity, 10)
			};
		}

		async acquireLock(lockId) {
			const startTime = Date.now();
			while (Date.now() - startTime < this.lockTimeout) {
				const currentLock = GM_getValue(this.lockKey, null);
				if (!currentLock || (Date.now() - currentLock.timestamp > this.lockTimeout)) {
					GM_setValue(this.lockKey, { id: lockId, timestamp: Date.now() });
					await new Promise(r => setTimeout(r, 20));
					const confirmedLock = GM_getValue(this.lockKey, null);
					if (confirmedLock && confirmedLock.id === lockId) {
						return true;
					}
				}
				await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
			}
			return false;
		}

		releaseLock(lockId) {
			const currentLock = GM_getValue(this.lockKey, null);
			if (currentLock && currentLock.id === lockId) {
				GM_deleteValue(this.lockKey);
			}
		}

		async consume(cost = 1, engineName = 'default') {
			const lockId = Math.random().toString(36).substring(2);
			if (!(await this.acquireLock(lockId))) {
				return { success: false, waitTime: 200 + Math.random() * 100 };
			}
			try {
				const now = Date.now();
				const config = this.getConfig(engineName);
				let state = GM_getValue(this.storageKey, { tokens: config.capacity, lastRefill: now, blockedUntil: 0 });
				if (state.blockedUntil && now < state.blockedUntil) {
					return { success: false, waitTime: state.blockedUntil - now };
				}
				if (now - state.lastRefill > 2000) {
					state.tokens = config.capacity;
					state.lastRefill = now;
				}
				const timePassed = Math.max(0, now - state.lastRefill);
				const tokensToAdd = (timePassed / 1000) * config.rate;
				state.tokens = Math.min(config.capacity, state.tokens + tokensToAdd);
				state.lastRefill = now;
				if (state.tokens >= cost) {
					state.tokens -= cost;
					GM_setValue(this.storageKey, state);
					return { success: true, waitTime: 0 };
				} else {
					const deficit = cost - state.tokens;
					const timeToWait = (deficit / config.rate) * 1000;
					GM_setValue(this.storageKey, state);
					return { success: false, waitTime: timeToWait };
				}
			} finally {
				this.releaseLock(lockId);
			}
		}

		async getAvailableTokens(engineName = 'default') {
			const config = this.getConfig(engineName);
			const state = GM_getValue(this.storageKey, { tokens: config.capacity, lastRefill: Date.now(), blockedUntil: 0 });
			const now = Date.now();
			if (state.blockedUntil && now < state.blockedUntil) {
				return 0;
			}
			const timePassed = Math.max(0, now - state.lastRefill);
			const tokensToAdd = (timePassed / 1000) * config.rate;
			return Math.min(config.capacity, state.tokens + tokensToAdd);
		}

		async fillTokens(engineName = 'default') {
			const lockId = Math.random().toString(36).substring(2);
			if (!(await this.acquireLock(lockId))) return;
			try {
				const config = this.getConfig(engineName);
				const state = GM_getValue(this.storageKey, { tokens: config.capacity, lastRefill: Date.now(), blockedUntil: 0 });
				state.tokens = config.capacity;
				state.lastRefill = Date.now();
				GM_setValue(this.storageKey, state);
			} finally {
				this.releaseLock(lockId);
			}
		}

		async triggerFreeze(durationMs) {
			const lockId = Math.random().toString(36).substring(2);
			if (!(await this.acquireLock(lockId))) return;
			try {
				const state = GM_getValue(this.storageKey, { tokens: 0, lastRefill: Date.now(), blockedUntil: 0 });
				const newBlockedUntil = Date.now() + durationMs;
				if (!state.blockedUntil || newBlockedUntil > state.blockedUntil) {
					state.blockedUntil = newBlockedUntil;
					GM_setValue(this.storageKey, state);
					Logger.warn('Network', `触发全局熔断，暂停请求 ${Math.round(durationMs / 1000)} 秒`);
				}
			} finally {
				this.releaseLock(lockId);
			}
		}
	}

	/****************** API 客户端层 ******************/

	// 定义 API 请求超时常量
	const AI_REQUEST_TIMEOUT = 180000; 
	const TRADITIONAL_REQUEST_TIMEOUT = 30000;

	/**
	 * 提示词构建器
	 */
	const PromptBuilder = {
		build(paragraphs, fromLang, toLang, engineId) {
			const fromLangName = LANG_CODE_TO_NAME[fromLang] || fromLang;
			const toLangName = LANG_CODE_TO_NAME[toLang] || toLang;

			const totalLength = paragraphs.reduce((sum, p) => sum + p.textContent.length, 0);
			const avgLength = paragraphs.length > 0 ? totalLength / paragraphs.length : 0;
			// 仅当平均长度极短，且段落数较多时才使用短模式
			const useShortTextMode = avgLength < 30 && paragraphs.length > 1;

			const params = ProfileManager.getParamsByEngine(engineId);
			
			// 1. 基础 Prompt 替换
			let finalSystemPrompt = params.system_prompt
				.replace(/\{fromLangName\}/g, fromLangName)
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{exampleOutput\}/g, ''); 

			// 2. 动态构建输入文本和强制格式指令
			let numberedText;
			let formatInstruction;
			let exampleOutput = generatePromptExample(toLang, useShortTextMode);

			if (useShortTextMode) {
				numberedText = paragraphs.map((p, i) => `${i}. ${p.innerHTML}`).join('\n');
				formatInstruction = `\n\n[CRITICAL FORMAT INSTRUCTION]\nThe user input is a numbered list (0., 1., 2., etc.). You MUST return the translation in the EXACT same numbered list format. DO NOT use[#0] tags.`;
			} else {
				numberedText = paragraphs.map((p, i) => `[#${i}] ${p.innerHTML}`).join('\n\n');
				formatInstruction = `\n\n[CRITICAL FORMAT INSTRUCTION]\nThe user input is prefixed with ID tags ([#0], [#1], etc.). You MUST prefix each translated segment with its EXACT corresponding ID tag.`;
			}

			// 3. 将格式指令和示例附加在 System Prompt 最末尾
			finalSystemPrompt = `${finalSystemPrompt.trim()}\n${formatInstruction}\n\n${exampleOutput}`;

			let finalUserPrompt = params.user_prompt
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{numberedText\}/g, numberedText);

			return {
				systemPrompt: finalSystemPrompt,
				userPrompt: finalUserPrompt,
				temperature: params.temperature,
				reasoningEffort: params.reasoning_effort,
				useShortTextMode: useShortTextMode
			};
		}
	};

	/**
	 * 所有 LLM API 客户端的基类
	 */
	class BaseApiClient {
		constructor(provider) {
			this.provider = provider;
		}

		async _buildHeaders() {
			throw new Error("'_buildHeaders' must be implemented by subclasses.");
		}

		_buildBody(_payload) {
			throw new Error("'_buildBody' must be implemented by subclasses.");
		}

		_parseResponse(_response) {
			throw new Error("'_parseResponse' must be implemented by subclasses.");
		}

		_normalizeError(response, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || response.statusText || '未知错误';
			const error = new Error();
			let userFriendlyError;
			error.noRetry = false;

			switch (response.status) {
				case 401:
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`;
					error.type = 'auth_error';
					break;
				case 403:
					userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源，或您所在的地区不受支持。`;
					error.type = 'auth_error';
					break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit';
					break;
				case 500:
				case 503:
					userFriendlyError = `服务器错误 (${response.status})：${this.provider.name} 的服务器暂时不可用。`;
					error.type = 'server_overloaded';
					break;
				default:
					userFriendlyError = `发生未知 API 错误 (代码: ${response.status})。`;
					error.type = 'auth_error';
					break;
			}

			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}

		translate(payload, reqId = 'Unknown') {
			return new Promise(async (resolve, reject) => {
				const startTime = Date.now();
				try {
					const headers = await this._buildHeaders();
					const body = this._buildBody(payload);
					const url = this.provider.apiHost;

					if (!url) {
						const error = new Error(`服务 "${this.provider.name}" 未配置接口地址 (API Host)。`);
						error.type = 'auth_error';
						return reject(error);
					}

					Logger.info('Network', `发起请求: ${this.provider.name}`, {
						model: this.provider.selectedModel
					}, reqId);

					safeRequest({
						method: 'POST',
						url: url,
						headers: headers,
						data: body,
						responseType: 'text',
						timeout: AI_REQUEST_TIMEOUT,
						onload: (res) => {
							const durationMs = Date.now() - startTime;
							let responseData;
							try {
								responseData = JSON.parse(res.responseText);
							} catch (e) {
								Logger.error('Network', 'JSON 解析失败', { responseTextSnippet: res.responseText.substring(0, 200) }, reqId);
								const error = new Error('API 响应不是有效的 JSON 格式。这可能由网络防火墙(WAF/CDN)拦截导致。');
								error.type = 'invalid_json';
								return reject(error);
							}

							if (res.status === 200) {
								try {
									const parsed = this._parseResponse(responseData);
									const content = parsed.content || '';
									const reasoning = parsed.reasoning || '';
									const meta = parsed.meta || {};
									
									meta.durationMs = durationMs;
									meta.model = this.provider.selectedModel;

									if (typeof content !== 'string' || !content.trim()) {
										return reject(new Error('API 未返回有效文本。'));
									}
									
									resolve({ content, reasoning, meta });
								} catch (e) {
									reject(new Error(`解析响应失败: ${e.message}`));
								}
							} else {
								const err = this._normalizeError(res, responseData);
								if (this.usedApiKey) err.usedKey = this.usedApiKey;
								reject(err);
							}
						},
						onerror: () => {
							Logger.error('Network', '网络请求发生底层错误', null, reqId);
							reject({ type: 'network', message: '网络请求错误', usedKey: this.usedApiKey });
						},
						ontimeout: () => {
							Logger.error('Network', '请求超时', null, reqId);
							reject({ type: 'timeout', message: '请求超时', usedKey: this.usedApiKey });
						}
					}, reqId);
				} catch (error) {
					reject(error);
				}
			});
		}
	}

	/**
	 * OpenAI 兼容客户端
	 */
	class OpenAICompatibleClient extends BaseApiClient {
		async _buildHeaders() {
			const { key: apiKey } = await _getApiKeyForService(this.provider);
			this.usedApiKey = apiKey;
			return {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			};
		}

		_buildBody(payload) {
			const requestData = {
				model: this.provider.selectedModel,
				messages:[
					{ "role": "system", "content": payload.systemPrompt },
					{ "role": "user", "content": payload.userPrompt }
				],
				stream: false,
				temperature: payload.temperature,
			};

			if (payload.reasoningEffort && payload.reasoningEffort !== 'default') {
				requestData.reasoning_effort = payload.reasoningEffort;
				delete requestData.temperature;
			} else if (this.provider.selectedModel && (this.provider.selectedModel.startsWith('o1') || this.provider.selectedModel.startsWith('o3'))) {
				delete requestData.temperature;
			}

			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			const content = getNestedProperty(response, 'choices[0].message.content');
			const reasoning = getNestedProperty(response, 'choices[0].message.reasoning_content');
			const usage = response.usage || {};
			return { 
				content, 
				reasoning,
				meta: {
					promptTokens: usage.prompt_tokens,
					completionTokens: usage.completion_tokens
				}
			};
		}

		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
			const apiErrorCode = getNestedProperty(responseData, 'error.code');
			let userFriendlyError;
			const error = new Error();
			error.noRetry = false;

			switch (res.status) {
				case 400:
					if (apiErrorCode === 'model_not_found') {
						userFriendlyError = `模型不存在 (400)：您选择的模型当前不可用或您无权访问。请在设置中更换模型。`;
					} else {
						userFriendlyError = `错误的请求 (400)：请求的格式或参数有误。`;
					}
					error.type = 'auth_error';
					break;
				case 401:
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`;
					error.type = 'auth_error';
					break;
				case 403:
					userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源，或您所在的地区不受支持。`;
					error.type = 'auth_error';
					break;
				case 404:
					userFriendlyError = `资源未找到 (404)：请求的 API 端点不存在。`;
					error.type = 'auth_error';
					break;
				case 429:
					if (apiErrorCode === 'insufficient_quota') {
						userFriendlyError = `账户余额不足 (429)：您的 ${this.provider.name} 账户已用尽信用点数或达到支出上限。请前往服务官网检查您的账单详情。`;
						error.type = 'auth_error';
					} else {
						userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
						error.type = 'rate_limit';
					}
					break;
				case 500:
					userFriendlyError = `服务器内部错误 (500)：${this.provider.name} 的服务器遇到问题。`;
					error.type = 'server_overloaded';
					break;
				case 503:
					if (apiErrorMessage && apiErrorMessage.includes('Slow Down')) {
						userFriendlyError = `服务暂时过载 (503 - Slow Down)：由于您的请求速率突然增加，服务暂时受到影响。`;
					} else {
						userFriendlyError = `服务器当前过载 (503)：${this.provider.name} 的服务器正经历高流量。`;
					}
					error.type = 'server_overloaded';
					break;
				default:
					userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
					error.type = 'auth_error';
					break;
			}

			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	/**
	 * Anthropic 客户端
	 */
	class AnthropicClient extends BaseApiClient {
		async _buildHeaders() {
			const { key: apiKey } = await _getApiKeyForService(this.provider);
			this.usedApiKey = apiKey;
			return {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			};
		}

		_buildBody(payload) {
			let maxTokens = 4096;
			const requestData = {
				model: this.provider.selectedModel,
				system: payload.systemPrompt,
				messages:[ { "role": "user", "content": payload.userPrompt } ],
				temperature: payload.temperature,
			};

			if (payload.reasoningEffort && payload.reasoningEffort !== 'default') {
				let budget = 4096;
				if (payload.reasoningEffort === 'low') budget = 2048;
				if (payload.reasoningEffort === 'high') budget = 8192;
				requestData.thinking = { type: 'enabled', budget_tokens: budget };
				maxTokens = budget + 4096;
				delete requestData.temperature;
			}

			requestData.max_tokens = maxTokens;
			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			const contentBlocks = response.content ||[];
			let content = '';
			let reasoning = '';
			for (const block of contentBlocks) {
				if (block.type === 'thinking') reasoning += block.thinking;
				if (block.type === 'text') content += block.text;
			}
			const usage = response.usage || {};
			return { 
				content, 
				reasoning,
				meta: {
					promptTokens: usage.input_tokens,
					completionTokens: usage.output_tokens
				}
			};
		}

		_normalizeError(res, responseData) {
			const apiErrorType = getNestedProperty(responseData, 'error.type');
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
			let userFriendlyError;
			const error = new Error();
			error.noRetry = false;

			switch (apiErrorType) {
				case 'invalid_request_error':
					userFriendlyError = `无效请求 (${res.status})：请求的格式或参数有误。如果问题持续，可能是模型名称不受支持或已更新。`;
					error.type = 'auth_error';
					break;
				case 'authentication_error':
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`;
					error.type = 'auth_error';
					break;
				case 'permission_error':
					userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源。`;
					error.type = 'auth_error';
					break;
				case 'not_found_error':
					userFriendlyError = `资源未找到 (404)：请求的 API 端点或模型不存在。`;
					error.type = 'auth_error';
					break;
				case 'request_too_large':
					userFriendlyError = `请求内容过长 (413)：发送的文本量超过了 API 的单次请求上限。`;
					error.type = 'auth_error';
					break;
				case 'rate_limit_error':
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit';
					break;
				case 'api_error':
					userFriendlyError = `服务器内部错误 (500)：${this.provider.name} 的服务器遇到问题。`;
					error.type = 'server_overloaded';
					break;
				case 'overloaded_error':
					userFriendlyError = `服务器过载 (529)：${this.provider.name} 的服务器当前负载过高。`;
					error.type = 'server_overloaded';
					break;
				default:
					if (res.status === 413) {
						userFriendlyError = `请求内容过长 (413)：发送的文本量超过了 API 的单次请求上限。`;
					} else {
						userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
					}
					error.type = 'auth_error';
					break;
			}

			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	/**
	 * Gemini 客户端
	 */
	class GoogleAIClient extends BaseApiClient {
		async _buildHeaders() {
			return { 'Content-Type': 'application/json' };
		}

		_buildBody(payload) {
			const requestData = {
				systemInstruction: { role: "user", parts:[{ text: payload.systemPrompt }] },
				contents:[{ role: "user", parts:[{ text: payload.userPrompt }] }],
				generationConfig: { temperature: payload.temperature, candidateCount: 1 }
			};

			if (payload.reasoningEffort && payload.reasoningEffort !== 'default') {
				let budget = 4096;
				if (payload.reasoningEffort === 'low') budget = 2048;
				if (payload.reasoningEffort === 'high') budget = 8192;
				requestData.generationConfig.thinkingConfig = {
					includeThoughts: true,
					thinkingBudget: budget
				};
			}
			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			const candidate = response.candidates && response.candidates[0];
			if (candidate && candidate.finishReason === 'SAFETY') {
				const err = new Error('内容触发了 Google Gemini 的安全策略 (SAFETY) 被拦截。');
				err.type = 'fatal_error';
				throw err;
			}
			const parts = getNestedProperty(response, 'candidates[0].content.parts') ||[];
			let content = '';
			let reasoning = '';
			for (const part of parts) {
				if (part.thought) reasoning += part.text;
				else content += part.text;
			}
			if (!reasoning && parts.length > 1) {
				content = parts.map(p => p.text).join('');
			} else if (!content && parts.length === 1) {
				content = parts[0].text;
			}
			const usage = response.usageMetadata || {};
			return { 
				content, 
				reasoning,
				meta: {
					promptTokens: usage.promptTokenCount,
					completionTokens: usage.candidatesTokenCount
				}
			};
		}

		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
			const error = new Error();
			let userFriendlyError;

			switch (res.status) {
				case 400:
					userFriendlyError = `请求格式错误 (400)：您的国家/地区可能不支持 Gemini API 的免费套餐，请在 Google AI Studio 中启用结算。`;
					error.type = 'auth_error';
					break;
				case 401:
				case 403:
					userFriendlyError = `API Key 无效或权限不足 (${res.status})：请在设置面板中检查您的 API Key。`;
					error.type = 'auth_error';
					break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit';
					break;
				default:
					userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
					error.type = 'auth_error';
					break;
			}

			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}

		// 覆写 translate 以处理 URL 动态拼接 Key 的逻辑
		translate(payload, reqId = 'Unknown') {
			return new Promise(async (resolve, reject) => {
				const startTime = Date.now();
				try {
					const { key: apiKey } = await _getApiKeyForService(this.provider);
					this.usedApiKey = apiKey;
					const modelId = this.provider.selectedModel;

					if (!modelId) {
						const error = new Error(`服务 "${this.provider.name}" 未选择任何模型。`);
						error.type = 'auth_error';
						return reject(error);
					}

					const finalUrl = this.provider.apiHost.replace('{model}', modelId) + `?key=${apiKey}`;
					const headers = await this._buildHeaders();
					const body = this._buildBody(payload);

					Logger.info('Network', '发起请求: Google AI', { model: modelId }, reqId);

					safeRequest({
						method: 'POST',
						url: finalUrl,
						headers: headers,
						data: body,
						responseType: 'text',
						timeout: AI_REQUEST_TIMEOUT,
						onload: (res) => {
							const durationMs = Date.now() - startTime;
							let responseData;
							try {
								responseData = JSON.parse(res.responseText);
							} catch (e) {
								Logger.error('Network', 'JSON 解析失败', { responseTextSnippet: res.responseText.substring(0, 200) }, reqId);
								const error = new Error('API 响应不是有效的 JSON 格式。这可能由网络防火墙(WAF/CDN)拦截导致。');
								error.type = 'invalid_json';
								return reject(error);
							}

							if (res.status === 200) {
								try {
									const parsed = this._parseResponse(responseData);
									const content = parsed.content || '';
									const reasoning = parsed.reasoning || '';
									const meta = parsed.meta || {};
									
									meta.durationMs = durationMs;
									meta.model = modelId;

									if (typeof content !== 'string' || !content.trim()) {
										return reject(new Error('API 未返回有效文本。'));
									}
									resolve({ content, reasoning, meta });
								} catch (e) {
									reject(new Error(`解析响应失败: ${e.message}`));
								}
							} else {
								const err = this._normalizeError(res, responseData);
								if (this.usedApiKey) err.usedKey = this.usedApiKey;
								reject(err);
							}
						},
						onerror: () => reject({ type: 'network', message: '网络请求错误', usedKey: this.usedApiKey }),
						ontimeout: () => reject({ type: 'timeout', message: '请求超时', usedKey: this.usedApiKey })
					}, reqId);
				} catch (error) {
					reject(error);
				}
			});
		}
	}

	// 各厂商专属的错误处理子类

	class ZhipuClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const businessErrorCode = getNestedProperty(responseData, 'error.code');
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
			let userFriendlyError;
			const error = new Error();

			if (businessErrorCode) {
				switch (businessErrorCode) {
					case '1001': case '1002': case '1003': case '1004':
						userFriendlyError = `API Key 无效或认证失败 (${businessErrorCode})：请在设置面板中检查您的 ${this.provider.name} API Key 是否正确填写。`;
						error.type = 'auth_error'; break;
					case '1112':
						userFriendlyError = `账户异常 (${businessErrorCode})：您的 ${this.provider.name} 账户已被锁定，请联系平台客服。`;
						error.type = 'auth_error'; break;
					case '1113':
						userFriendlyError = `账户余额不足 (${businessErrorCode})：您的 ${this.provider.name} 账户已欠费，请前往 Zhipu AI 官网充值。`;
						error.type = 'auth_error'; break;
					case '1301':
						userFriendlyError = `内容安全策略阻止 (${businessErrorCode})：因含有敏感内容，请求被 Zhipu AI 安全策略阻止。`;
						error.type = 'auth_error'; error.type = 'content_error'; break;
					case '1302': case '1303':
						error.message = `请求频率过高 (${businessErrorCode})：已超出 API 的速率限制。\n\n原始错误信息：\n${apiErrorMessage}`;
						error.type = 'rate_limit'; return error;
					case '1304':
						userFriendlyError = `调用次数超限 (${businessErrorCode})：已达到当日调用次数限额，请联系 Zhipu AI 客服。`;
						error.type = 'auth_error'; break;
					default:
						userFriendlyError = `发生未知的业务错误 (代码: ${businessErrorCode})。`;
						error.type = 'auth_error'; break;
				}
			} else {
				return super._normalizeError(res, responseData);
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	class DeepseekClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
			let userFriendlyError;
			const error = new Error();

			switch (res.status) {
				case 400: case 422:
					userFriendlyError = `请求格式或参数错误 (${res.status})：请检插件是否为最新版本。如果问题持续，可能是 API 服务端出现问题。`;
					error.type = 'auth_error'; break;
				case 401:
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key 是否正确填写。`;
					error.type = 'auth_error'; break;
				case 402:
					userFriendlyError = `账户余额不足 (402)：您的 ${this.provider.name} 账户余额不足。请前往 DeepSeek 官网充值。`;
					error.type = 'auth_error'; break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit'; break;
				case 500:
					userFriendlyError = `服务器内部故障 (500)：${this.provider.name} 的服务器遇到未知问题。`;
					error.type = 'server_overloaded'; break;
				case 503:
					userFriendlyError = `服务器繁忙 (503)：${this.provider.name} 的服务器当前负载过高。`;
					error.type = 'server_overloaded'; break;
				default:
					return super._normalizeError(res, responseData);
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	class SiliconFlowClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'message') || res.statusText;
			const apiErrorCode = getNestedProperty(responseData, 'code');
			let userFriendlyError;
			const error = new Error();

			switch (res.status) {
				case 400:
					if (apiErrorCode === 20012) {
						userFriendlyError = `模型不存在 (400)：您选择的模型名称无效或已下线。请在设置中更换模型。`;
					} else {
						userFriendlyError = `请求参数错误 (400)：请检查插件版本或配置。`;
					}
					error.type = 'auth_error'; break;
				case 401:
					userFriendlyError = `API Key 无效 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`;
					error.type = 'auth_error'; break;
				case 403:
					userFriendlyError = `权限不足或余额不足 (403)：可能是账户余额不足，或该模型需要实名认证。请前往 SiliconFlow 官网检查账户状态。`;
					error.type = 'auth_error'; break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：触发了速率限制 (RPM/TPM)。`;
					error.type = 'rate_limit'; break;
				case 503: case 504:
					userFriendlyError = `服务系统负载高 (${res.status})：SiliconFlow 服务器暂时繁忙。`;
					error.type = 'server_overloaded'; break;
				case 500:
					userFriendlyError = `服务器内部错误 (500)：服务发生了未知错误。`;
					error.type = 'server_overloaded'; break;
				default:
					userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
					error.type = 'auth_error'; break;
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	class GroqClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
			let userFriendlyError;
			const error = new Error();

			switch (res.status) {
				case 400: userFriendlyError = `请求无效 (400)：请求语法错误。请检查请求格式。`; error.type = 'auth_error'; break;
				case 401: userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`; error.type = 'auth_error'; break;
				case 403: userFriendlyError = `权限被拒绝 (403)：您的网络或 API Key 无权访问所请求的资源。`; error.type = 'auth_error'; break;
				case 404: userFriendlyError = `资源未找到 (404)：请求的模型或端点不存在。请检查模型名称或接口地址。`; error.type = 'auth_error'; break;
				case 413: userFriendlyError = `请求内容过长 (413)：发送的文本量超过了限制。请尝试减少单次翻译的文本量。`; error.type = 'auth_error'; break;
				case 422: userFriendlyError = `无法处理的实体 (422)：请求格式正确但包含语义错误。`; error.type = 'auth_error'; break;
				case 424: userFriendlyError = `依赖失败 (424)：依赖请求失败（可能是 Remote MCP 认证问题）。`; error.type = 'auth_error'; break;
				case 429: userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`; error.type = 'rate_limit'; break;
				case 498: userFriendlyError = `Flex Tier 容量超限 (498)：当前 Flex Tier 已满。`; error.type = 'server_overloaded'; break;
				case 500: userFriendlyError = `服务器内部错误 (500)：${this.provider.name} 服务器发生通用错误。`; error.type = 'server_overloaded'; break;
				case 502: userFriendlyError = `网关错误 (502)：上游服务器响应无效。`; error.type = 'server_overloaded'; break;
				case 503: userFriendlyError = `服务不可用 (503)：服务器正在维护或过载。`; error.type = 'server_overloaded'; break;
				default: userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`; error.type = 'auth_error'; break;
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	class CerebrasClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
			let userFriendlyError;
			const error = new Error();

			switch (res.status) {
				case 400: userFriendlyError = `请求无效 (400)：请求参数有误。请检查模型名称或输入格式。`; error.type = 'auth_error'; break;
				case 401: userFriendlyError = `认证失败 (401)：API Key 无效或缺失。请在设置面板中检查您的 ${this.provider.name} API Key。`; error.type = 'auth_error'; break;
				case 402: userFriendlyError = `需要付款 (402)：账户余额不足或需要充值。`; error.type = 'auth_error'; break;
				case 403: userFriendlyError = `权限被拒绝 (403)：无权访问该资源。`; error.type = 'auth_error'; break;
				case 404: userFriendlyError = `资源未找到 (404)：请求的模型或端点不存在。`; error.type = 'auth_error'; break;
				case 408: userFriendlyError = `请求超时 (408)：服务器处理请求超时。`; error.type = 'timeout'; break;
				case 409: userFriendlyError = `请求冲突 (409)：资源状态冲突。`; error.type = 'server_overloaded'; break;
				case 422: userFriendlyError = `无法处理的实体 (422)：请求格式正确但包含语义错误（如无效的模型参数）。`; error.type = 'auth_error'; break;
				case 429: userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`; error.type = 'rate_limit'; break;
				default:
					if (res.status >= 500) {
						userFriendlyError = `服务器内部错误 (${res.status})：${this.provider.name} 服务器发生错误。`;
						error.type = 'server_overloaded';
					} else {
						userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
						error.type = 'auth_error';
					}
					break;
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	class TogetherClient extends OpenAICompatibleClient {
		_normalizeError(res, responseData) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
			let userFriendlyError;
			const error = new Error();

			switch (res.status) {
				case 400: case 422:
					userFriendlyError = `请求格式或参数错误 (${res.status})：请检查插件是否为最新版本。如果问题持续，可能是 API 服务端出现问题。`;
					error.type = 'auth_error'; break;
				case 401:
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key 是否正确填写。`;
					error.type = 'auth_error'; break;
				case 402:
					userFriendlyError = `需要付费 (402)：您的 ${this.provider.name} 账户已达到消费上限或需要充值。请检查您的账户账单设置。`;
					error.type = 'auth_error'; break;
				case 403: case 413:
					userFriendlyError = `请求内容过长 (${res.status})：发送的文本量超过了模型的上下文长度限制。请尝试翻译更短的文本段落。`;
					error.type = 'auth_error'; break;
				case 404:
					userFriendlyError = `模型或接口地址不存在 (404)：您选择的模型名称可能已失效，或接口地址不正确。请尝试在设置面板中切换至其她模型或检查接口地址。`;
					error.type = 'auth_error'; break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit'; break;
				case 500:
					userFriendlyError = `服务器内部错误 (500)：${this.provider.name} 的服务器遇到问题。`;
					error.type = 'server_overloaded'; break;
				case 502:
					userFriendlyError = `网关错误 (502)：上游服务器响应无效。这通常是临时问题。`;
					error.type = 'server_overloaded'; break;
				case 503:
					userFriendlyError = `服务过载 (503)：${this.provider.name} 的服务器当前流量过高。`;
					error.type = 'server_overloaded'; break;
				default:
					return super._normalizeError(res, responseData);
			}
			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}
	}

	/**
	 * API 客户端工厂
	 */
	const ApiClientFactory = {
		create: function (provider) {
			const clientType = provider.isCustom ? 'openai-compatible' : provider.id;

			switch (clientType) {
				case 'anthropic': return new AnthropicClient(provider);
				case 'google_ai': return new GoogleAIClient(provider);
				case 'zhipu_ai': return new ZhipuClient(provider);
				case 'deepseek_ai': return new DeepseekClient(provider);
				case 'siliconflow': return new SiliconFlowClient(provider);
				case 'groq_ai': return new GroqClient(provider);
				case 'together_ai': return new TogetherClient(provider);
				case 'cerebras_ai': return new CerebrasClient(provider);
				case 'modelscope_ai': return new TogetherClient(provider); // ModelScope 沿用 Together 的错误逻辑
				case 'openai':
				case 'openai-compatible':
					return new OpenAICompatibleClient(provider);
				default:
					Logger.warn('System', `未找到服务类型 "${clientType}" 的特定客户端，回退到 OpenAI 兼容客户端`);
					return new OpenAICompatibleClient(provider);
			}
		}
	};

	/****************** 谷歌翻译模块 ******************/
	// The following GoogleTranslateHelper object incorporates logic adapted from the
	// "Traduzir-paginas-web" project by FilipePS, which is licensed under the MPL-2.0.
	// Original source: https://github.com/FilipePS/Traduzir-paginas-web
	// A copy of the MPL-2.0 license is included in this project's repository.
	//
	// 下方的 GoogleTranslateHelper 对象整合了源自 FilipePS 的“Traduzir-paginas-web”项目的代码逻辑，
	// 该项目使用 MPL-2.0 许可证。
	// 原始项目地址: https://github.com/FilipePS/Traduzir-paginas-web
	// MPL-2.0 许可证的副本已包含在本项目仓库中。
	const GoogleTranslateHelper = {
		lastRequestAuthTime: null,
		translateAuth: null,
		authPromise: null,

		findAuth: async function () {
			if (this.authPromise) return this.authPromise;

			this.authPromise = new Promise((resolve) => {
				let needsUpdate = false;
				if (this.lastRequestAuthTime) {
					const now = new Date();
					const threshold = new Date(this.lastRequestAuthTime);
					threshold.setMinutes(threshold.getMinutes() + 20);
					if (now > threshold) {
						needsUpdate = true;
					}
				} else {
					needsUpdate = true;
				}

				if (needsUpdate) {
					this.lastRequestAuthTime = Date.now();
					GM_xmlhttpRequest({
						method: "GET",
						url: "https://translate.googleapis.com/_/translate_http/_/js/k=translate_http.tr.en_US.YusFYy3P_ro.O/am=AAg/d=1/exm=el_conf/ed=1/rs=AN8SPfq1Hb8iJRleQqQc8zhdzXmF9E56eQ/m=el_main",
						onload: (response) => {
							if (response.status === 200 && response.responseText) {
								const result = response.responseText.match(/['"]x-goog-api-key['"]\s*:\s*['"](\w{39})['"]/i);
								if (result && result[1]) {
									this.translateAuth = result[1];
								}
							}
							resolve();
						},
						onerror: () => resolve(),
						ontimeout: () => resolve()
					});
				} else {
					resolve();
				}
			});

			try {
				await this.authPromise;
			} finally {
				this.authPromise = null;
			}
		}
	};

	/**
	 * 解析 JWT Token 获取过期时间
	 */
	function getJwtExpiration(token) {
		try {
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = atob(base64);
			return JSON.parse(jsonPayload).exp * 1000;
		} catch (e) {
			return 0;
		}
	}

	/**
	 * 微软翻译鉴权辅助对象
	 */
	const BingTranslateHelper = {
		authPromise: null,
		getToken: async function () {
			if (this.authPromise) return this.authPromise;
			const now = Date.now();
			const savedToken = GM_getValue('bing_access_token');
			if (savedToken) {
				const exp = getJwtExpiration(savedToken);
				if (exp > now + 60000) {
					return savedToken;
				}
			}
			this.authPromise = this.fetchToken();
			try {
				const newToken = await this.authPromise;
				return newToken;
			} finally {
				this.authPromise = null;
			}
		},
		fetchToken: function () {
			return new Promise((resolve, reject) => {
				GM_xmlhttpRequest({
					method: "GET",
					url: "https://edge.microsoft.com/translate/auth",
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
					},
					onload: (response) => {
						if (response.status === 200 && response.responseText) {
							const token = response.responseText;
							GM_setValue('bing_access_token', token);
							resolve(token);
						} else {
							reject(new Error("Failed to fetch Bing token"));
						}
					},
					onerror: (err) => reject(err)
				});
			});
		},
		clearToken: function () {
			GM_deleteValue('bing_access_token');
		}
	};

	/**
	 * 获取当前有效翻译引擎的名称
	 */
	function getValidEngineName() {
		const storedEngine = GM_getValue('transEngine');
		if (storedEngine && (engineMenuConfig[storedEngine] || storedEngine.startsWith('custom_'))) {
			return storedEngine;
		}
		return DEFAULT_CONFIG.ENGINE.current;
	}

	/**
	 * 语言代码标准化映射表
	 */
	const LANG_CODE_MAP = {
		// 百度翻译
		'jp': 'ja',
		'kor': 'ko',
		'fra': 'fr',
		'spa': 'es',
		'may': 'ms',
		'rom': 'ro',
		'vie': 'vi',
		'dan': 'da',
		'swe': 'sv',
		'zh': 'zh-CN',

		// 常见 ISO 639-2/3 三字母代码兼容
		'jpn': 'ja', 'deu': 'de', 'ger': 'de', 'rus': 'ru', 'por': 'pt',
		'tha': 'th', 'ara': 'ar', 'ita': 'it', 'ell': 'el', 'nld': 'nl',
		'pol': 'pl', 'bul': 'bg', 'est': 'et', 'fin': 'fi', 'ces': 'cs',
		'slv': 'sl', 'hun': 'hu',

		// 中文变体处理
		'cht': 'zh-TW',
		'yue': 'zh-TW',
		'wyw': 'zh-TW',
		'zh-hk': 'zh-TW',
		'zh-sg': 'zh-CN'
	};

	/**
	 * 标准化语言代码函数
	 * @param {string} lang - 原始语言代码
	 * @returns {string} - 标准化后的 ISO 639-1 代码
	 */
	function normalizeLanguageCode(lang) {
		if (!lang) return "";
		lang = lang.toLowerCase().trim();
		if (LANG_CODE_MAP[lang]) return LANG_CODE_MAP[lang];
		if (lang === 'zh-cn') return 'zh-CN';
		if (lang === 'zh-tw') return 'zh-TW';
		if (lang.length === 2) return lang;
		if (lang.startsWith("zh")) return "zh-CN";
		return lang;
	}

	/**
	 * 简单的内存缓存，用于存储语言检测结果
	 */
	const LanguageDetectionCache = {
		cache: new Map(),
		get(text) {
			return this.cache.get(text);
		},
		set(text, lang) {
			if (this.cache.size > 2000) this.cache.clear();
			this.cache.set(text, lang);
		}
	};

    /**
	 * 通用批处理队列
	 */
	class BatchQueue {
		constructor(processor, options = {}) {
			this.processor = processor;
			this.interval = options.interval || 200;
			this.limit = options.limit || 20;
			this.queue = [];
			this.timer = null;
		}

		add(item) {
			return new Promise((resolve, reject) => {
				this.queue.push({ item, resolve, reject });
				if (this.queue.length >= this.limit) {
					this.flush();
				} else if (!this.timer) {
					this.timer = setTimeout(() => this.flush(), this.interval);
				}
			});
		}

		async flush() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			if (this.queue.length === 0) return;

			const currentBatch = this.queue.splice(0, this.limit);
			const items = currentBatch.map(t => t.item);

			try {
				const results = await this.processor(items);
				currentBatch.forEach((task, index) => { task.resolve(results && results[index] ? results[index] : null); });
			} catch (error) {
				currentBatch.forEach(task => task.reject(error));
			}
		}
	}

	/**
	 * 获取微软翻译 API 的认证 Token
	 */
	async function apiMsAuth() {
		return new Promise((resolve) => {
			GM_xmlhttpRequest({
				method: "GET",
				url: "https://edge.microsoft.com/translate/auth",
				onload: (res) => resolve(res.responseText),
				onerror: () => resolve("")
			});
		});
	}

	/**
	 * 微软语言检测批处理
	 */
	async function handleMicrosoftBatchDetect(texts) {
		Logger.info('Network', `语言检测 (Microsoft): 批量处理 ${texts.length} 段`);
		const token = await apiMsAuth();
		if (!token) return Array(texts.length).fill(null);
		return new Promise((resolve) => {
			GM_xmlhttpRequest({
				method: "POST",
				url: "https://api-edge.cognitive.microsofttranslator.com/detect?api-version=3.0",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				data: JSON.stringify(texts.map(t => ({ Text: t.substring(0, LANG_DETECT_MAX_LENGTH) }))),
				onload: (res) => {
					try {
						const data = JSON.parse(res.responseText);
						if (Array.isArray(data)) {
							const results = data.map(item => item.language);
							resolve(results);
						} else {
							Logger.error('Network', '语言检测 (Microsoft) 解析失败', data);
							resolve(Array(texts.length).fill(null));
						}
					} catch (e) {
						Logger.error('Network', '语言检测 (Microsoft) JSON 错误', e);
						resolve(Array(texts.length).fill(null));
					}
				},
				onerror: (e) => {
					Logger.error('Network', '语言检测 (Microsoft) 网络错误', e);
					resolve(Array(texts.length).fill(null));
				}
			});
		});
	}

	const msBatchQueue = new BatchQueue(handleMicrosoftBatchDetect, { interval: 200, limit: 20 });

	/**
	 * 微软语言检测入口函数
	 */
	async function apiMicrosoftLangdetect(text) {
		return msBatchQueue.add(text);
	}

	/**
	 * Google 语言检测
	 */
	function apiGoogleLangdetect(text) {
		return new Promise((resolve) => {
			const sample = text.substring(0, LANG_DETECT_MAX_LENGTH);
			const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(sample)}`;
			Logger.info('Network', `语言检测 (Google GTX)`);
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: (res) => {
					try {
						const data = JSON.parse(res.responseText);
						const detected = (Array.isArray(data) && data[2]) ? data[2] : "";
						resolve(detected);
					} catch (e) {
						Logger.error('Network', '语言检测 (Google GTX) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('Network', '语言检测 (Google GTX) 网络错误', e);
					resolve("");
				}
			});
		});
	}

	/**
	 * 百度语言检测
	 */
	function apiBaiduLangdetect(text) {
		return new Promise((resolve) => {
			Logger.info('Network', `语言检测 (Baidu)`);
			GM_xmlhttpRequest({
				method: "POST",
				url: "https://fanyi.baidu.com/langdetect",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				data: `query=${encodeURIComponent(text.substring(0, LANG_DETECT_MAX_LENGTH))}`,
				onload: (res) => {
					try {
						const data = JSON.parse(res.responseText);
						const detected = (data.error === 0) ? data.lan : "";
						resolve(detected);
					} catch (e) {
						Logger.error('Network', '语言检测 (Baidu) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('Network', '语言检测 (Baidu) 网络错误', e);
					resolve("");
				}
			});
		});
	}

	/**
	 * 腾讯语言检测
	 */
	function apiTencentLangdetect(text) {
		return new Promise((resolve) => {
			Logger.info('Network', `语言检测 (Tencent)`);
			GM_xmlhttpRequest({
				method: "POST",
				url: "https://transmart.qq.com/api/imt",
				headers: { "Content-Type": "application/json" },
				data: JSON.stringify({
					header: { fn: "text_analysis", client_key: "browser-chrome-110.0.0-Mac OS-df4bd4c5-a65d-44b2-a40f-42f34f3535f2-1677486696487" },
					text: text.substring(0, LANG_DETECT_MAX_LENGTH)
				}),
				onload: (res) => {
					try {
						const data = JSON.parse(res.responseText);
						const detected = (data && data.language) ? data.language : "";
						resolve(detected);
					} catch (e) {
						Logger.error('Network', '语言检测 (Tencent) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('Network', '语言检测 (Tencent) 网络错误', e);
					resolve("");
				}
			});
		});
	}

	/**
	 * 核心语言检测服务，默认使用 Microsoft
	 */
	const FRANC_LANG_MAP = {
		'cmn': 'zh-CN', 'eng': 'en', 'spa': 'es', 'jpn': 'ja', 'kor': 'ko',
		'rus': 'ru', 'fra': 'fr', 'deu': 'de', 'ita': 'it', 'por': 'pt',
		'vie': 'vi', 'tha': 'th', 'ara': 'ar', 'hin': 'hi', 'ben': 'bn',
		'pol': 'pl', 'nld': 'nl', 'tur': 'tr', 'ind': 'id', 'msa': 'ms',
		'swe': 'sv', 'dan': 'da', 'fin': 'fi', 'ell': 'el', 'ces': 'cs',
		'ron': 'ro', 'hun': 'hu', 'ukr': 'uk', 'cat': 'ca', 'hrv': 'hr',
		'srp': 'hr', 'slk': 'sk', 'slv': 'sl', 'bul': 'bg', 'heb': 'he',
		'fas': 'fa', 'urd': 'ur', 'tam': 'ta', 'tel': 'te', 'kan': 'kn',
		'mal': 'ml', 'mar': 'mr', 'pan': 'pa', 'guj': 'gu', 'swh': 'sw',
		'zul': 'zu', 'afr': 'sw', 'sqi': 'hr', 'mkd': 'bg', 'lit': 'lt',
		'lav': 'lv', 'est': 'et', 'isl': 'is', 'gle': 'is', 'mya': 'my',
		'khm': 'my', 'lao': 'my', 'sin': 'si', 'amh': 'my', 'som': 'sw',
		'yue': 'zh-TW', 'wuu': 'zh-CN', 'hak': 'zh-CN', 'nan': 'zh-TW'
	};

    const LanguageDetector = {
		francModule: null,

		async detectWithFranc(text) {
			if (!this.francModule) {
				try {
					this.francModule = await import('https://cdn.jsdelivr.net/npm/franc-min@6.2.0/+esm');
				} catch (e) {
					Logger.warn('System', 'franc 库加载失败', { error: e.message });
					return 'und';
				}
			}

			const franc = this.francModule.franc;
			if (typeof franc !== 'function') return 'und';

			const result = franc(text, { minLength: 3 });
			const mapped = FRANC_LANG_MAP[result] || 'und';
			return mapped;
		},

		async detect(text) {
			if (!text || !text.trim()) return "auto";
			
			const cached = LanguageDetectionCache.get(text);
			if (cached) {
				return cached;
			}

			const strategy = GM_getValue("lang_detector", DEFAULT_CONFIG.GENERAL.lang_detector);

			let detectedLang = "und";

			if (strategy === "franc") {
				detectedLang = await this.detectWithFranc(text);
				if (detectedLang === 'und') {
					Logger.warn('Network', 'Franc 特征不足，触发回退', { fallbackTo: 'microsoft' });
					detectedLang = await apiMicrosoftLangdetect(text);
				}
			} else if (strategy === "google") {
				detectedLang = await apiGoogleLangdetect(text);
			} else if (strategy === "baidu") {
				detectedLang = await apiBaiduLangdetect(text);
			} else if (strategy === "tencent") {
				detectedLang = await apiTencentLangdetect(text);
			} else {
				detectedLang = await apiMicrosoftLangdetect(text);
			}

			const finalLang = normalizeLanguageCode(detectedLang);
			if (finalLang && finalLang !== 'und') {
				LanguageDetectionCache.set(text, finalLang);
				return finalLang;
			}
			return "auto";
		}
	};

	/**
	 * 可中断的睡眠函数
	 */
	async function cancellableSleep(ms, isCancelled) {
		const interval = 200;
		let elapsed = 0;
		while (elapsed < ms) {
			if (isCancelled && isCancelled()) {
				const err = new Error('用户已取消翻译。');
				err.type = 'user_cancelled';
				err.noRetry = true;
				throw err;
			}
			await new Promise(resolve => setTimeout(resolve, Math.min(interval, ms - elapsed)));
			elapsed += interval;
		}
	}

	/**
	 * 统一重试管理器：指数退避、Jitter 抖动、错误上报与中断
	 */
	const RetryManager = {
		async execute(taskFn, options) {
			const { maxRetries = 3, isCancelled, onRetryFailure, engineName, reqId } = options;
			let attempt = 0;
			let keySwitchCount = 0;

			while (true) {
				if (isCancelled && isCancelled()) {
					const err = new Error('用户已取消翻译。');
					err.type = 'user_cancelled';
					throw err;
				}
				
				try {
					return await taskFn(attempt);
				} catch (error) {
					// 1. 处理 Key 状态黑名单
					if (error.usedKey) {
						if (error.type === 'auth_error') {
							KeyBlacklistManager.markDead(error.usedKey);
							keySwitchCount++;
						} else if (error.type === 'rate_limit') {
							KeyBlacklistManager.markRateLimited(error.usedKey);
						}
					}

					// 2. 致命错误直接抛出
					if (error.type === 'fatal_error') throw error;

					// 3. 防止死循环安全阀
					if (keySwitchCount > 20) {
						const err = new Error(`API Key 轮询次数过多，所有 Key 均已失效。`);
						err.type = 'fatal_error';
						throw err;
					}

					// 4. 处理所有 Key 都在冷却的情况
					if (error.type === 'all_keys_cooling') {
						attempt++;
						if (attempt >= maxRetries) throw new Error(`所有 API Key 均频繁触发限流，重试 ${maxRetries} 次后放弃。`);
						Logger.warn('Translation', `[${engineName}] 所有 Key 均在冷却，等待 ${error.retryAfterMs}ms`, null, reqId);
						await cancellableSleep(error.retryAfterMs + 500, isCancelled);
						continue; 
					}

					// 5. 只有非 Key 级错误，才消耗常规的 attempt 计数
					const isKeyError = error.usedKey && (error.type === 'auth_error' || error.type === 'rate_limit');
					if (!isKeyError) attempt++;

					if (attempt >= maxRetries) throw error;

					if (onRetryFailure) onRetryFailure(error, attempt);

					// 6. 动态计算延时
					let finalDelay = 0;
					if (isKeyError) {
						finalDelay = 200 + Math.random() * 300;
					} else {
						const baseDelay = (error.type === 'server_overloaded') ? 10000 : 2000;
						finalDelay = Math.floor(baseDelay * Math.pow(2, attempt) + (Math.random() * 1000));
					}

					Logger.warn('Translation', `[${engineName}] 请求失败，准备重试 (Attempt: ${attempt}/${maxRetries})`, { reason: error.message, delayMs: finalDelay }, reqId);
					
					await cancellableSleep(finalDelay, isCancelled);
				}
			}
		}
	};

	/**
	 * 远程翻译请求函数
	 */
	async function requestRemoteTranslation(paragraphs, { isCancelled = () => false, knownFromLang = null, reqId = 'Unknown', skipRateLimit = false } = {}) {
		const createCancellationError = () => {
			const error = new Error('用户已取消翻译。');
			error.type = 'user_cancelled';
			error.type = 'auth_error';
			return error;
		};
		
		if (isCancelled()) throw createCancellationError();
		
		const engineName = getValidEngineName();
		const toLang = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
		let fromLang = knownFromLang;
		
		if (!fromLang) {
			const userSelectedFromLang = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			if (userSelectedFromLang === 'script_auto') {
				const textToDetect = paragraphs.map(p => p.textContent).join(' ').substring(0, 200);
				fromLang = await LanguageDetector.detect(textToDetect);
			} else {
				fromLang = userSelectedFromLang;
			}
		}
		
		if (isCancelled()) throw createCancellationError();

		const resourceManager = new ResourceManager(engineName);

		// 包装成单次请求任务
		const singleRequestTask = async (attempt) => {
			if (attempt > 0 || !skipRateLimit) {
				while (true) {
					if (isCancelled()) throw createCancellationError();
					const result = await resourceManager.acquireToken();
					if (result.success) break;
					await cancellableSleep(result.waitTime + Math.random() * 50, isCancelled);
				}
			}

			// 传统引擎：Bing
			if (engineName === 'bing_translator') {
				const result = await _handleBingRequest(CONFIG.TRANS_ENGINES.bing_translator, paragraphs, fromLang, toLang, reqId);
				const content = result.snippets.map((c, index) => `[#${index}] ${c}`).join('\n\n');
				return { content, reasoning: '', meta: { durationMs: result.durationMs }, useShortTextMode: false };
			}
			
			// 传统引擎：Google
			if (engineName === 'google_translate') {
				const result = await _handleGoogleRequest(CONFIG.TRANS_ENGINES.google_translate, paragraphs, fromLang, toLang, reqId);
				if (!Array.isArray(result.snippets)) {
					throw new Error('谷歌翻译接口未返回预期的数组格式');
				}
				const innerContents = result.snippets.map(html => {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = html;
					return tempDiv.firstElementChild ? tempDiv.firstElementChild.innerHTML : '';
				});
				const content = innerContents.map((c, index) => `[#${index}] ${c}`).join('\n\n');
				return { content, reasoning: '', meta: { durationMs: result.durationMs }, useShortTextMode: false };
			}
			
			// LLM 引擎
			const provider = getProviderById(engineName);
			if (!provider) {
				const error = new Error(`未能找到服务 "${engineName}" 的配置信息。`);
				error.type = 'auth_error';
				throw error;
			}

			// 1. 构建纯净的 Payload
			const payload = PromptBuilder.build(paragraphs, fromLang, toLang, engineName);
			
			// 2. 实例化 Client 并请求
			const client = ApiClientFactory.create(provider);
			const result = await client.translate(payload, reqId);
			
			// 3. 返回富结果对象
			return { ...result, useShortTextMode: payload.useShortTextMode };
		};

		return await RetryManager.execute(singleRequestTask, {
			maxRetries: 3,
			isCancelled: isCancelled,
			engineName: engineName,
			reqId: reqId,
			onRetryFailure: (err) => resourceManager.reportError(err)
		});
	}

	/**
	 * 段落翻译主函数
	 */
	async function translateParagraphs(paragraphs, { isCancelled = () => false, knownFromLang = null, reqId = 'Unknown', skipRateLimit = false } = {}) {
		const createCancellationError = () => {
			const error = new Error('用户已取消翻译。');
			error.type = 'user_cancelled';
			error.type = 'auth_error';
			return error;
		};

		if (isCancelled()) throw createCancellationError();
		if (!paragraphs || paragraphs.length === 0) return new Map();

		const indexedParagraphs = paragraphs.map((p, index) => ({
			original: p,
			id: index,
			isSeparator: p.tagName === 'HR' || /^\s*[-—*~<>=.]{3,}\s*$/.test(p.textContent),
			content: p.innerHTML
		}));

		const contentToTranslate = indexedParagraphs.filter(p => !p.isSeparator);

		if (contentToTranslate.length === 0) {
			const results = new Map();
			indexedParagraphs.forEach(p => results.set(p.original, { status: 'success', content: p.content }));
			return results;
		}

		// 1. 语言检测
		let fromLang = knownFromLang;
		if (!fromLang) {
			const userSelectedFromLang = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			if (userSelectedFromLang === 'script_auto') {
				const textToDetect = paragraphs.map(p => p.textContent).join(' ').substring(0, 200);
				fromLang = await LanguageDetector.detect(textToDetect);
			} else {
				fromLang = userSelectedFromLang;
			}
		}
		if (isCancelled()) throw createCancellationError();

		const toLang = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
		const engineName = getValidEngineName();

		// 2. 缓存查询
		const cacheKeys = await Promise.all(contentToTranslate.map(p => buildCacheKey(p.content, fromLang, toLang)));
		const cachedResults = await TranslationCacheDB.get(cacheKeys);

		const misses =[];
		const hits = new Map();
		const hitKeysToUpdate =[];
		const now = Date.now();

		for (let i = 0; i < contentToTranslate.length; i++) {
			const p = contentToTranslate[i];
			const key = cacheKeys[i];
			const cached = cachedResults[i];

			if (cached) {
				hits.set(p.id, cached.translatedText);
				if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
					hitKeysToUpdate.push(key);
				}
			} else {
				misses.push({ p, key, index: i });
			}
		}

		if (hitKeysToUpdate.length > 0) {
			TranslationCacheDB.updateTimestamps(hitKeysToUpdate);
		}

		const resultsMap = new Map();
		for (const [id, text] of hits.entries()) {
			resultsMap.set(id, text);
		}

		// 3. 处理未命中的段落
		if (misses.length > 0) {
			const preparedRules = await getPreparedGlossaryRules();
			const pm = new PlaceholderManager();
			const preprocessedMisses =[];

			TimeSlicer.reset();
			for (let i = 0; i < misses.length; i++) {
				if (isCancelled()) throw createCancellationError();
				const p = misses[i].p;
				const processedNode = _preprocessParagraph(p.original, preparedRules, pm, engineName);
				TextNormalizer.normalizeNode(processedNode);
				preprocessedMisses.push(processedNode);
				await TimeSlicer.yieldIfNeeded();
			}

			Logger.info('Translation', '任务开始', {
				engine: engineName,
				paragraphs: misses.length,
				placeholders: pm.placeholders.size,
				cacheHits: hits.size
			}, reqId);

			// 获取富结果对象
			const { content: combinedTranslationRaw, reasoning: reasoningText, meta, useShortTextMode } = await requestRemoteTranslation(preprocessedMisses, {
				isCancelled,
				knownFromLang: fromLang,
				reqId,
				skipRateLimit
			});

			// 统一日志打印
			Logger.info('Translation', '翻译解析成功', { 
				duration: `${meta.durationMs || 0}ms`, 
				model: meta.model || 'N/A',
				usage: meta.promptTokens ? `${meta.promptTokens} -> ${meta.completionTokens}` : 'N/A'
			}, reqId);

			if (reasoningText && reasoningText.trim()) {
				console.groupCollapsed(`%c[Reasoning] [${reqId}] Thought Process`, 'color: #9c27b0; font-weight: bold;');
				console.log('%cBasic Info:\n\n', 'color: #2196F3; font-weight: bold;', JSON.stringify({
					reqId, engine: engineName, model: meta.model, paragraphs: misses.length, durationMs: meta.durationMs
				}, null, 2));
				console.log('%cThought Content:\n\n%c' + reasoningText, 'color: #FFC107; font-weight: bold;', 'color: inherit;');
				console.groupEnd();
			}

			let combinedTranslation = combinedTranslationRaw.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
			combinedTranslation = pm.normalize(combinedTranslation);
			
			const parsedMisses = new Map();

			// 解析逻辑
			if (misses.length === 1) {
				let cleanText = combinedTranslation.trim();
				cleanText = cleanText.replace(/^\[#0\]\s*/, '').replace(/^0\.\s*/, '');
				parsedMisses.set(0, cleanText);
			} 
			else if (!useShortTextMode && /\[#\d+\]/.test(combinedTranslation)) {
				const idRegex = /(?:^|\n)\[#(\d+)\][\s\t]*([\s\S]*?)(?=\n\s*\[#\d+\]|$)/g;
				let idMatch;
				while ((idMatch = idRegex.exec(combinedTranslation)) !== null) {
					const id = parseInt(idMatch[1], 10);
					const content = idMatch[2].trim();
					if (content) parsedMisses.set(id, content);
				}
			} 
			else if (useShortTextMode && /(?:^|\n)\d+\.\s/.test(combinedTranslation)) {
				const listRegex = /(?:^|\n)(\d+)\.\s+([\s\S]*?)(?=\n\d+\.\s|$)/g;
				let listMatch;
				while ((listMatch = listRegex.exec(combinedTranslation)) !== null) {
					const id = parseInt(listMatch[1], 10);
					const content = listMatch[2].trim();

					if (id >= misses.length) {
						Logger.warn('Translation', `短文本解析异常：检测到越界 ID ${id}，可能发生内容碰撞`, null, reqId);
						continue;
					}
					
					if (content) parsedMisses.set(id, content);
				}
			}
			else {
				if (engineName !== 'google_translate' && engineName !== 'bing_translator') {
					const err = new Error('AI 未返回可识别的分隔符');
					err.type = 'validation_failed';
					throw err;
				}
			}

			if (parsedMisses.size !== misses.length && engineName !== 'google_translate' && engineName !== 'bing_translator') {
				const err = new Error(`AI 响应格式不一致，检测到段落合并或缺失 (预期: ${misses.length}, 实际: ${parsedMisses.size})`);
				err.type = 'validation_failed';
				throw err;
			}

			// 校验占位符
			let baseThresholds, currentChunkSize, currentParaLimit;
			const defaults = CONFIG.SERVICE_CONFIG[engineName]?.VALIDATION || CONFIG.SERVICE_CONFIG.default.VALIDATION;

			if (engineName === 'google_translate' || engineName === 'bing_translator') {
				baseThresholds = defaults;
				currentChunkSize = CONFIG.SERVICE_CONFIG[engineName].CHUNK_SIZE;
				currentParaLimit = CONFIG.SERVICE_CONFIG[engineName].PARAGRAPH_LIMIT;
			} else {
				const params = ProfileManager.getParamsByEngine(engineName);
				const parts = (params.validation_thresholds || '').split(/[,，]/).map(s => parseFloat(s.trim()));
				const isValid = parts.length >= 4 && !parts.some(isNaN);
				baseThresholds = {
					absolute_loss: isValid ? parts[0] : defaults.absolute_loss,
					proportional_loss: isValid ? parts[1] : defaults.proportional_loss,
					proportional_trigger_count: isValid ? parts[2] : defaults.proportional_trigger_count,
					catastrophic_loss: isValid ? parts[3] : defaults.catastrophic_loss
				};
				currentChunkSize = params.chunk_size;
				currentParaLimit = params.para_limit;
			}

			const preprocessedText = preprocessedMisses.map(p => p.innerHTML).join(' ');
			const validation = pm.validate(preprocessedText, combinedTranslation, baseThresholds, currentChunkSize, currentParaLimit);

			if (!validation.isValid) {
				Logger.warn('Translation', `占位符校验失败: ${validation.errorReason}`, { totalLoss: validation.totalLoss }, reqId);
				const err = new Error(`占位符校验失败 (${validation.errorReason})`);
				err.type = 'validation_failed';
				throw err;
			}

			// 还原、清理并存入缓存
			const entriesToSave =[];
			TimeSlicer.reset();
			for (let i = 0; i < misses.length; i++) {
				if (isCancelled()) throw createCancellationError();
				const miss = misses[i];
				let translatedContent = parsedMisses.get(i);
				
				if (translatedContent) {
					translatedContent = pm.restore(translatedContent);
					let cleaned = AdvancedTranslationCleaner.clean(translatedContent || miss.p.content);
					cleaned = applyPostTranslationReplacements(cleaned);
					
					resultsMap.set(miss.p.id, cleaned);
					
					entriesToSave.push({
						hashKey: miss.key,
						textHash: await sha256(miss.p.content),
						translatedText: cleaned,
						timestamp: Date.now()
					});
				}
				await TimeSlicer.yieldIfNeeded();
			}

			if (entriesToSave.length > 0) {
				TranslationCacheDB.put(entriesToSave);
			}
		}

		// 4. 合并最终结果
		const finalResults = new Map();
		for (const p of indexedParagraphs) {
			if (isCancelled()) throw createCancellationError();

			if (p.isSeparator) {
				finalResults.set(p.original, { status: 'success', content: p.content });
			} else {
				const translatedContent = resultsMap.get(p.id);
				if (translatedContent) {
					finalResults.set(p.original, { status: 'success', content: translatedContent });
				} else {
					finalResults.set(p.original, { status: 'error', content: '底层异常：翻译结果丢失' });
				}
			}
		}

		return finalResults;
	}

	/**
	 * API Key 黑名单管理器（页面生命周期内有效）
	 */
	const KeyBlacklistManager = {
		blacklist: new Map(),
		BAN_DURATION_429: 10000,

		markDead(key) {
			this.blacklist.set(key, { dead: true });
			Logger.warn('Network', `API Key 已失效 (401/402/403)，本次页面生命周期内不再使用`, { keyMasked: key.substring(0, 8) + '...' });
		},
		markRateLimited(key) {
			this.blacklist.set(key, { banUntil: Date.now() + this.BAN_DURATION_429 });
			Logger.warn('Network', `API Key 触发限流 (429)，冻结 10 秒`, { keyMasked: key.substring(0, 8) + '...' });
		},
		getStatus(key) {
			const status = this.blacklist.get(key);
			if (!status) return 'ACTIVE';
			if (status.dead) return 'DEAD';
			if (status.banUntil && Date.now() < status.banUntil) return 'COOLING';
			return 'ACTIVE';
		}
	};

	/**
	 * 为指定服务获取下一个可用的 API Key
	 */
	async function _getApiKeyForService(provider) {
		const serviceId = provider.id;
		const arrayKey = `${serviceId}_keys_array`;
		const keys = GM_getValue(arrayKey,[]);

		if (keys.length === 0) {
			const error = new Error(`请在设置面板中为 ${provider.name} 设置至少一个 API Key。`);
			error.type = 'auth_error';
			throw error;
		}

		const lockKey = `${serviceId}_key_lock`;
		const LOCK_TIMEOUT = 5000;
		const myLockId = `lock_${Date.now()}_${Math.random()}`;

		async function acquireLock() {
			const startTime = Date.now();
			while (Date.now() - startTime < LOCK_TIMEOUT) {
				const currentLock = GM_getValue(lockKey, null);
				if (!currentLock || (Date.now() - currentLock.timestamp > LOCK_TIMEOUT)) {
					GM_setValue(lockKey, { id: myLockId, timestamp: Date.now() });
					await sleep(50);
					const confirmedLock = GM_getValue(lockKey, null);
					if (confirmedLock && confirmedLock.id === myLockId) return true;
				}
				await sleep(100 + Math.random() * 100);
			}
			return false;
		}

		function releaseLock() {
			const currentLock = GM_getValue(lockKey, null);
			if (currentLock && currentLock.id === myLockId) GM_deleteValue(lockKey);
		}

		if (!(await acquireLock())) {
			throw new Error(`获取 ${provider.name} API Key 的操作锁超时，请稍后重试。`);
		}

		try {
			const indexKey = `${serviceId}_key_index`;
			const startIndex = GM_getValue(indexKey, 0);
			let currentIndex = startIndex;
			let attempts = 0;
			let minWaitTime = Infinity;

			// 轮询寻找可用 Key
			while (attempts < keys.length) {
				const candidateKey = keys[currentIndex];
				const status = KeyBlacklistManager.getStatus(candidateKey);

				if (status === 'ACTIVE') {
					GM_setValue(indexKey, (currentIndex + 1) % keys.length);
					Logger.info('Network', `API Key 调度: ${provider.name}`, { keyIndex: currentIndex + 1 });
					return { key: candidateKey, index: currentIndex };
				}

				if (status === 'COOLING') {
					const remaining = KeyBlacklistManager.blacklist.get(candidateKey).banUntil - Date.now();
					if (remaining < minWaitTime) minWaitTime = remaining;
				}

				currentIndex = (currentIndex + 1) % keys.length;
				attempts++;
			}

			// 所有 Key 都不可用
			const allDead = keys.every(k => KeyBlacklistManager.getStatus(k) === 'DEAD');
			if (allDead) {
				const error = new Error(`所有 ${provider.name} 的 API Key 均已失效（欠费/无效/无权限），请检查更新。`);
				error.type = 'auth_error';
				throw error;
			}

			// 都在冷却中
			const error = new Error(`所有 API Key 均处于限流冷却中`);
			error.type = 'all_keys_cooling';
			error.retryAfterMs = minWaitTime; 
			throw error;

		} finally {
			releaseLock();
		}
	}

	/**
	 * 伪装受保护的 HTML 标签以绕过翻译引擎的忽略机制
	 */
	function maskProtectedTags(html) {
		if (!html) return html;
		return html
			.replace(/<code\b([^>]*)>/gi, '<v-tr-code$1>')
			.replace(/<\/code>/gi, '</v-tr-code>')
			.replace(/<pre\b([^>]*)>/gi, '<v-tr-pre$1>')
			.replace(/<\/pre>/gi, '</v-tr-pre>')
			.replace(/<kbd\b([^>]*)>/gi, '<v-tr-kbd$1>')
			.replace(/<\/kbd>/gi, '</v-tr-kbd>');
	}

	/**
	 * 还原被伪装的 HTML 标签
	 */
	function unmaskProtectedTags(html) {
		if (!html) return html;
		return html
			.replace(/<v-tr-code\b([^>]*)>/gi, '<code$1>')
			.replace(/<\/v-tr-code>/gi, '</code>')
			.replace(/<v-tr-pre\b([^>]*)>/gi, '<pre$1>')
			.replace(/<\/pre>/gi, '</pre>')
			.replace(/<v-tr-kbd\b([^>]*)>/gi, '<kbd$1>')
			.replace(/<\/v-tr-kbd>/gi, '</kbd>');
	}

	/**
	 * 处理对谷歌翻译接口的特定请求流程
	 */
	async function _handleGoogleRequest(engineConfig, paragraphs, fromLang, toLang, reqId = 'Unknown') {
		await GoogleTranslateHelper.findAuth();
		if (!GoogleTranslateHelper.translateAuth) {
			throw new Error('无法获取谷歌翻译的授权凭证');
		}
		const headers = {
			...engineConfig.headers,
			'X-goog-api-key': GoogleTranslateHelper.translateAuth
		};
		const sourceTexts = paragraphs.map(p => maskProtectedTags(p.outerHTML));
		const requestData = JSON.stringify([
			[sourceTexts, fromLang, toLang], "te"
		]);

		Logger.info('Network', '发起请求: 谷歌翻译', {
			url: engineConfig.url_api,
			from: fromLang,
			to: toLang,
			paragraphs: paragraphs.length
		}, reqId);

		const startTime = Date.now();
		const res = await new Promise((resolve, reject) => {
			safeRequest({
				method: engineConfig.method,
				url: engineConfig.url_api,
				headers: headers,
				data: requestData,
				responseType: 'json',
				timeout: TRADITIONAL_REQUEST_TIMEOUT,
				onload: resolve,
				onerror: () => reject(new Error('网络请求错误')),
				ontimeout: () => reject(new Error('请求超时'))
			}, reqId);
		});

		const duration = Date.now() - startTime;
		if (res.status !== 200) {
			throw new Error(`谷歌翻译 API 错误 (代码: ${res.status}): ${res.statusText}`);
		}
		const translatedHtmlSnippets = getNestedProperty(res.response, '0');
		if (!translatedHtmlSnippets || !Array.isArray(translatedHtmlSnippets)) {
			throw new Error('从谷歌翻译接口返回的响应结构无效');
		}

		return {
			snippets: translatedHtmlSnippets.map(html => unmaskProtectedTags(html)),
			durationMs: duration
		};
	}

	/**
	 * 处理对微软翻译接口的特定请求流程
	 */
	async function _handleBingRequest(engineConfig, paragraphs, fromLang, toLang, reqId = 'Unknown') {
		const token = await BingTranslateHelper.getToken();
		const bingFrom = BING_LANG_CODE_MAP[fromLang] || fromLang;
		const bingTo = BING_LANG_CODE_MAP[toLang] || toLang;
		let url = `${engineConfig.url_api}&to=${bingTo}`;
		if (bingFrom !== 'auto-detect') {
			url += `&from=${bingFrom}`;
		}
		const requestBody = JSON.stringify(paragraphs.map(p => ({
			text: p.innerHTML
		})));

		Logger.info('Network', '发起请求: 微软翻译', {
			url: url,
			from: bingFrom,
			to: bingTo,
			paragraphs: paragraphs.length
		}, reqId);

		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			safeRequest({
				method: "POST",
				url: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
				},
				data: requestBody,
				responseType: 'json',
				timeout: TRADITIONAL_REQUEST_TIMEOUT,
				onload: async (res) => {
					const duration = Date.now() - startTime;
					if (res.status === 401) {
						Logger.warn('Network', '微软翻译 Token 过期，清理 Token 并触发重试', null, reqId);
						BingTranslateHelper.clearToken();
						const e = new Error('Bing Token Expired');
						e.type = 'auth_error';
						e.noRetry = false;
						reject(e);
						return;
					}
					if (res.status !== 200) {
						const e = new Error(`Microsoft API Error: ${res.status} ${res.statusText}`);
						e.type = res.status === 429 ? 'rate_limit' : 'api_error';
						reject(e);
						return;
					}
					const responseData = res.response;
					if (!Array.isArray(responseData)) {
						const e = new Error('Invalid response format');
						e.type = 'invalid_json';
						reject(e);
						return;
					}
					resolve({
						snippets: responseData.map(item => item.translations[0].text),
						durationMs: duration
					});
				},
				onerror: () => {
					const e = new Error('Network Error');
					e.type = 'network';
					reject(e);
				},
				ontimeout: () => {
					const e = new Error('Timeout');
					e.type = 'timeout';
					reject(e);
				}
			}, reqId);
		});
	}

	/**************************************************************************
	 * 术语表系统、工具函数与核心逻辑
	 **************************************************************************/

	/**
	 * 在DOM节点内查找一个由多部分文本组成的、无序但邻近的序列
	 */
	function findUnorderedDOMSequence(rootNode, rule) {
		const { parts: partsWithForms, isGeneral } = rule;
		const HTML_TAG_PLACEHOLDER = '\u0001';
		const ALLOWED_SEPARATORS_REGEX = /^[\s\u0001-－﹣—–]*$/;
		const WORD_CHAR_REGEX = /[a-zA-Z0-9]/;
		const MAX_DISTANCE_FACTOR = 2.5;
		const MAX_DISTANCE_BASE = 30;

		const textMap = [];
		let normalizedText = '';

		const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
			acceptNode: (node) => {
				if (node.parentElement.closest('[data-glossary-applied="true"]')) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});

		let node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === Node.TEXT_NODE) {
				const nodeValue = node.nodeValue;
				for (let i = 0; i < nodeValue.length; i++) {
					textMap.push({ node: node, offset: i });
				}
				normalizedText += nodeValue;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				if (['EM', 'STRONG', 'B', 'I', 'U', 'SPAN', 'CODE'].includes(node.tagName)) {
					textMap.push({ node: node, offset: -1 });
					normalizedText += HTML_TAG_PLACEHOLDER;
				}
			}
		}

		if (!normalizedText.trim()) return null;

		const searchText = isGeneral ? normalizedText.toLowerCase() : normalizedText;
		const originalTermLength = partsWithForms.map(p => p[0]).join(' ').length;
		const maxDistance = Math.max(originalTermLength * MAX_DISTANCE_FACTOR, MAX_DISTANCE_BASE);

		const partPositions = partsWithForms.map(partSet => {
			const positions = [];
			for (const form of partSet) {
				const term = isGeneral ? form.toLowerCase() : form;
				let lastIndex = -1;
				while ((lastIndex = searchText.indexOf(term, lastIndex + 1)) !== -1) {
					positions.push({ start: lastIndex, end: lastIndex + term.length });
				}
			}
			return positions;
		});

		if (partPositions.some(p => p.length === 0)) {
			return null;
		}

		function getCombinations(arr) {
			if (arr.length === 1) {
				return arr[0].map(item => [item]);
			}
			const result = [];
			const allCasesOfRest = getCombinations(arr.slice(1));
			for (let i = 0; i < allCasesOfRest.length; i++) {
				for (let j = 0; j < arr[0].length; j++) {
					result.push([arr[0][j]].concat(allCasesOfRest[i]));
				}
			}
			return result;
		}

		const allCombinations = getCombinations(partPositions);

		for (const combination of allCombinations) {
			combination.sort((a, b) => a.start - b.start);

			const overallStart = combination[0].start;
			const overallEnd = combination[combination.length - 1].end;

			if (overallEnd - overallStart > maxDistance) {
				continue;
			}

			let isValid = true;
			for (let i = 0; i < combination.length - 1; i++) {
				const betweenText = normalizedText.substring(combination[i].end, combination[i + 1].start);
				if (!ALLOWED_SEPARATORS_REGEX.test(betweenText)) {
					isValid = false;
					break;
				}
			}

			if (isValid) {
				const prevChar = normalizedText[overallStart - 1];
				const nextChar = normalizedText[overallEnd];

				let startBoundaryOK = !prevChar || !WORD_CHAR_REGEX.test(prevChar);
				if (!startBoundaryOK) {
					const strBefore = normalizedText.substring(0, overallStart);
					if (PlaceholderConfig.endBoundaryRegex.test(strBefore)) {
						startBoundaryOK = true;
					}
				}

				let endBoundaryOK = !nextChar || !WORD_CHAR_REGEX.test(nextChar);
				if (!endBoundaryOK) {
					const remainingStr = normalizedText.substring(overallEnd);
					if (PlaceholderConfig.startBoundaryRegex.test(remainingStr)) {
						endBoundaryOK = true;
					}
				}

				if (startBoundaryOK && endBoundaryOK) {
					const startMapping = textMap[overallStart];
					const endMapping = textMap[overallEnd - 1];
					if (startMapping && endMapping) {
						return {
							startNode: startMapping.node,
							startOffset: startMapping.offset,
							endNode: endMapping.node,
							endOffset: endMapping.offset + 1
						};
					}
				}
			}
		}

		return null;
	}

	/**
	 * 预处理单个段落 DOM 节点，应用所有术语表规则并替换为占位符
	 */
	function _preprocessParagraph(p, preparedRules, pm, engineName) {
		const clone = p.cloneNode(true);
		const { domRules, executionPlan } = preparedRules;

		// 1. 正则规则处理
		if (executionPlan && executionPlan.length > 0) {
			const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
				acceptNode: (node) => {
					if (node.parentElement.closest('[data-glossary-applied="true"]')) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			});
			const nodesToProcess =[];
			let n;
			while (n = walker.nextNode()) {
				nodesToProcess.push(n);
			}

			while (nodesToProcess.length > 0) {
				const currentNode = nodesToProcess.shift();
				if (!currentNode.parentNode) continue;
				const text = currentNode.nodeValue;
				if (!text) continue;

				for (const planItem of executionPlan) {
					const regex = planItem.regex || planItem.rule.regex;
					regex.lastIndex = 0;
					const match = regex.exec(text);
					if (match) {
						const fragment = document.createDocumentFragment();
						const matchedText = match[0];
						const matchIndex = match.index;

						if (matchIndex > 0) {
							fragment.appendChild(document.createTextNode(text.substring(0, matchIndex)));
						}

						let rule, finalValue;
						if (planItem.type === 'combined') {
							const captureIndex = match.slice(1).findIndex(m => m !== undefined);
							rule = planItem.rules[captureIndex];
							finalValue = rule.type === 'forbidden' ? matchedText : rule.replacement;
						} else {
							rule = planItem.rule;
							if (rule.type === 'forbidden') {
								finalValue = matchedText;
							} else {
								finalValue = matchedText.replace(regex, rule.replacement);
							}
						}

						const placeholder = pm.create(finalValue, rule, matchedText);
						fragment.appendChild(document.createTextNode(placeholder));

						if (matchIndex + matchedText.length < text.length) {
							fragment.appendChild(document.createTextNode(text.substring(matchIndex + matchedText.length)));
						}

						const newNodes = Array.from(fragment.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.nodeValue);
						if (newNodes.length > 0) {
							nodesToProcess.unshift(...newNodes);
						}

						currentNode.parentNode.replaceChild(fragment, currentNode);
						break;
					}
				}
			}
		}

		// 2. DOM 规则处理
		if (domRules.length > 0) {
			let plainText = '';
			const textMap =[];
			const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
				acceptNode: (node) => {
					if (node.parentElement && node.parentElement.closest('[data-glossary-applied="true"]')) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			});

			let node;
			while ((node = walker.nextNode())) {
				if (node.nodeType === Node.TEXT_NODE) {
					const val = node.nodeValue;
					for (let i = 0; i < val.length; i++) {
						textMap.push({ node, offset: i });
					}
					plainText += val;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					if (['EM', 'STRONG', 'B', 'I', 'U', 'SPAN', 'CODE', 'A', 'KBD', 'SAMP', 'VAR', 'SUB', 'SUP', 'MARK', 'RUBY', 'RT', 'RP', 'BDI', 'BDO', 'WBR'].includes(node.tagName.toUpperCase())) {
						textMap.push({ node, offset: -1, isTag: true });
						plainText += '\u0001';
					} else {
						textMap.push({ node, offset: -1, isBoundary: true });
						plainText += '\u0002';
					}
				}
			}

			if (plainText.length > 0) {
				const used = new Uint8Array(plainText.length);
				const allMatches =[];

				for (const rule of domRules) {
					const searchText = rule.isGeneral ? plainText.toLowerCase() : plainText;
					
					if (rule.isUnordered) {
						const numParts = rule.parts.length;
						const instances =[];
						let missingPart = false;
						
						for (let pIdx = 0; pIdx < numParts; pIdx++) {
							const forms = Array.from(rule.parts[pIdx]).sort((a, b) => b.length - a.length);
							let foundAny = false;
							for (const form of forms) {
								const formStr = rule.isGeneral ? form.toLowerCase() : form;
								let pos = 0;
								while ((pos = searchText.indexOf(formStr, pos)) !== -1) {
									instances.push({ start: pos, end: pos + formStr.length, partIndex: pIdx });
									pos += formStr.length;
									foundAny = true;
								}
							}
							if (!foundAny) { missingPart = true; break; }
						}
						
						if (missingPart) continue;
						
						instances.sort((a, b) => a.start - b.start);
						
						for (let i = 0; i < instances.length; i++) {
							const startInst = instances[i];
							if (used[startInst.start]) continue;
							
							const chain =[startInst];
							const seenParts = new Set([startInst.partIndex]);
							let currentEnd = startInst.end;
							
							for (let j = i + 1; j < instances.length; j++) {
								if (seenParts.size === numParts) break;
								const nextInst = instances[j];
								if (seenParts.has(nextInst.partIndex)) continue;
								if (nextInst.start < currentEnd) continue;
								
								const gap = plainText.substring(currentEnd, nextInst.start);
								if (!/^[\s\u0001-－﹣—–]*$/.test(gap)) break;
								
								chain.push(nextInst);
								seenParts.add(nextInst.partIndex);
								currentEnd = nextInst.end;
							}
							
							if (seenParts.size === numParts) {
								const matchStart = chain[0].start;
								const matchEnd = chain[chain.length - 1].end;
								const prevChar = matchStart === 0 ? ' ' : plainText[matchStart - 1];
								const nextChar = matchEnd < plainText.length ? plainText[matchEnd] : ' ';
								
								if (!/[a-zA-Z0-9]/.test(prevChar) && !/[a-zA-Z0-9]/.test(nextChar)) {
									let isOverlap = false;
									for(let k = matchStart; k < matchEnd; k++) { if(used[k]) { isOverlap = true; break; } }
									if (!isOverlap) {
										allMatches.push({ start: matchStart, end: matchEnd, rule });
										for(let k = matchStart; k < matchEnd; k++) used[k] = 1;
									}
								}
							}
						}
					} else {
						const firstForms = Array.from(rule.parts[0]).sort((a, b) => b.length - a.length);
						
						for (const firstForm of firstForms) {
							const formStr = rule.isGeneral ? firstForm.toLowerCase() : firstForm;
							let pos = 0;
							while ((pos = searchText.indexOf(formStr, pos)) !== -1) {
								if (used[pos]) {
									pos++;
									continue;
								}
								
								let currentI = pos;
								let matchStart = pos;
								let matchEnd = -1;
								let matchedAll = true;
								
								const prevChar = currentI === 0 ? ' ' : plainText[currentI - 1];
								if (/[a-zA-Z0-9]/.test(prevChar)) {
									pos++;
									continue;
								}
								
								currentI += formStr.length;
								if (rule.parts.length === 1) {
									matchEnd = currentI;
									const nextChar = currentI < plainText.length ? plainText[currentI] : ' ';
									if (/[a-zA-Z0-9]/.test(nextChar)) {
										matchedAll = false;
									}
								} else {
									for (let pIdx = 1; pIdx < rule.parts.length; pIdx++) {
										let sepLen = 0;
										while (currentI + sepLen < plainText.length) {
											const c = plainText[currentI + sepLen];
											if (/[\s\u0001-－﹣—–]/.test(c)) sepLen++;
											else break;
										}
										if (sepLen === 0) { matchedAll = false; break; }
										currentI += sepLen;
										
										const forms = Array.from(rule.parts[pIdx]).sort((a, b) => b.length - a.length);
										let foundForm = null;
										for (const form of forms) {
											const fStr = rule.isGeneral ? form.toLowerCase() : form;
											if (searchText.startsWith(fStr, currentI)) {
												foundForm = fStr;
												break;
											}
										}
										
										if (foundForm) {
											currentI += foundForm.length;
											if (pIdx === rule.parts.length - 1) {
												matchEnd = currentI;
												const nextChar = currentI < plainText.length ? plainText[currentI] : ' ';
												if (/[a-zA-Z0-9]/.test(nextChar)) { matchedAll = false; break; }
											}
										} else {
											matchedAll = false;
											break;
										}
									}
								}
								
								if (matchedAll && matchStart !== -1 && matchEnd !== -1) {
									let isOverlap = false;
									for(let k = matchStart; k < matchEnd; k++) { if(used[k]) { isOverlap = true; break; } }
									if (!isOverlap) {
										allMatches.push({ start: matchStart, end: matchEnd, rule });
										for(let k = matchStart; k < matchEnd; k++) used[k] = 1;
									}
								}
								pos++;
							}
						}
					}
				}

				allMatches.sort((a, b) => b.start - a.start);

				for (const match of allMatches) {
					let startIdx = match.start;
					while (startIdx < match.end && textMap[startIdx].offset === -1) startIdx++;
					let endIdx = match.end - 1;
					while (endIdx >= match.start && textMap[endIdx].offset === -1) endIdx--;
					
					if (startIdx <= endIdx) {
						const startMap = textMap[startIdx];
						const endMap = textMap[endIdx];
						
						if (startMap && endMap && startMap.node && endMap.node) {
							const range = document.createRange();
							range.setStart(startMap.node, startMap.offset);
							range.setEnd(endMap.node, endMap.offset + 1);
							
							const contents = range.extractContents();
							const tempDiv = document.createElement('div');
							tempDiv.appendChild(contents);
							const originalHTML = tempDiv.innerHTML;
							
							const finalValue = match.rule.type === 'forbidden' ? originalHTML : match.rule.replacement;
							const placeholder = pm.create(finalValue, match.rule, originalHTML);
							
							range.insertNode(document.createTextNode(placeholder));
						}
					}
				}
				clone.normalize();
			}
		}

		return clone;
	}

	/**
	 * 占位符生命周期管理器
	 */
	class PlaceholderManager {
		constructor() {
			this.placeholders = new Map();
			this.placeholderCache = new Map();
			this.BASE_CHUNK = 1600;
			this.BASE_PARA = 8;
		}

		create(finalValue, rule, originalHTML) {
			if (this.placeholderCache.has(finalValue)) {
				return this.placeholderCache.get(finalValue);
			}
			let placeholder;
			do {
				placeholder = PlaceholderConfig.generate();
			} while (this.placeholders.has(placeholder));

			this.placeholderCache.set(finalValue, placeholder);
			this.placeholders.set(placeholder, { value: finalValue, rule, originalHTML });
			return placeholder;
		}

		normalize(translatedText) {
			if (this.placeholders.size === 0) return translatedText;
			try {
				const fuzzyRegex = PlaceholderConfig.fuzzyRegex;
				return translatedText.replace(fuzzyRegex, (match, digits) => {
					const standardPlaceholder = PlaceholderConfig.prefix + digits;
					return this.placeholders.has(standardPlaceholder) ? standardPlaceholder : match;
				});
			} catch (e) {
				Logger.warn('Translation', '占位符模糊还原出错', e);
				return translatedText;
			}
		}

		validate(preprocessedText, normalizedTranslatedText, baseThresholds, currentChunkSize, currentParaLimit) {
			if (this.placeholders.size === 0) return { isValid: true, errorReason: null, totalLoss: 0 };

			// 计算动态缩放因子
			const chunkScale = currentChunkSize / this.BASE_CHUNK;
			const paraScale = currentParaLimit / this.BASE_PARA;
			const scale = Math.max(chunkScale, paraScale);

			// 计算动态阈值
			const dynamicThresholds = {
				absoluteLoss: Math.max(3, Math.round(baseThresholds.absolute_loss * scale)),
				proportionalLoss: baseThresholds.proportional_loss,
				proportionalTrigger: Math.max(3, Math.round(baseThresholds.proportional_trigger_count * scale)),
				catastrophicLoss: Math.max(2, Math.round(baseThresholds.catastrophic_loss * scale))
			};

			// 统计实际存在的占位符
			const actualCounts = {};
			const legalPlaceholders = Array.from(this.placeholders.keys());
			legalPlaceholders.forEach(key => actualCounts[key] = 0);

			let hasUnknownPlaceholders = false;
			const fuzzyRegex = PlaceholderConfig.fuzzyRegex;
			fuzzyRegex.lastIndex = 0;
			let match;
			while ((match = fuzzyRegex.exec(normalizedTranslatedText)) !== null) {
				const suspected = PlaceholderConfig.prefix + match[1];
				if (this.placeholders.has(suspected)) {
					actualCounts[suspected]++;
				} else {
					hasUnknownPlaceholders = true;
				}
			}

			if (hasUnknownPlaceholders) {
				return { isValid: false, errorReason: "检测到未知占位符", totalLoss: 0 };
			}

			// 校验丢失量
			let totalLoss = 0;
			for (const key of legalPlaceholders) {
				const expected = preprocessedText.split(key).length - 1;
				const actual = actualCounts[key];
				const loss = expected - actual;

				if (loss > 0) {
					totalLoss += loss;
					const isCatastrophic = expected > dynamicThresholds.catastrophicLoss && actual === 0;
					const isAbsolute = loss >= dynamicThresholds.absoluteLoss;
					const isProportional = expected >= dynamicThresholds.proportionalTrigger && (loss / expected) >= dynamicThresholds.proportionalLoss;

					if (isCatastrophic || isAbsolute || isProportional) {
						return {
							isValid: false,
							errorReason: `占位符大量缺失 (预期:${expected}, 实际:${actual}, 动态Abs阈值:${dynamicThresholds.absoluteLoss})`,
							totalLoss
						};
					}
				}
			}

			return { isValid: true, errorReason: null, totalLoss };
		}

		restore(normalizedTranslatedText) {
			if (this.placeholders.size === 0) return normalizedTranslatedText;

			let processedText = normalizedTranslatedText;
			for (const[placeholder, data] of this.placeholders.entries()) {
				const { value: replacement, originalHTML, rule } = data;
				const escapedPlaceholder = placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
				const regex = new RegExp(escapedPlaceholder, 'g');

				if (rule.matchStrategy === 'dom' && originalHTML) {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = originalHTML;

					const htmlChunks = Array.from(tempDiv.childNodes).filter(node =>
						!(node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim())
					);

					let finalHTML = '';

					if (htmlChunks.length === 1) {
						const singleChunk = htmlChunks[0];
						replaceTextInNode(singleChunk, replacement);
						finalHTML = singleChunk.nodeType === Node.ELEMENT_NODE ? singleChunk.outerHTML : singleChunk.nodeValue;
					} else {
						const separator = replacement.includes('·') || replacement.includes('・') ? /[·・]/ : /[\s-－﹣—–]+/;
						const joinSeparator = replacement.includes('·') || replacement.includes('・') ? '·' : ' ';
						const translationParts = replacement.split(separator);

                        if (htmlChunks.length === translationParts.length) {
                            htmlChunks.forEach((chunk, index) => {
                                const part = translationParts[index];
                                replaceTextInNode(chunk, part);
                            });

                            finalHTML = htmlChunks.map(chunk => {
                                return chunk.nodeType === Node.ELEMENT_NODE ? chunk.outerHTML : chunk.nodeValue;
                            }).join(joinSeparator);
                        } else {
                            tempDiv.innerHTML = originalHTML;
                            tempDiv.textContent = replacement;
                            finalHTML = tempDiv.innerHTML;
                        }
					}
					processedText = processedText.replace(regex, finalHTML);
				} else {
					processedText = processedText.replace(regex, replacement);
				}
			}
			return processedText;
		}
	}

	/**
	 * 替换一个 DOM 节点并完整保留所有 HTML 标签结构
	 */
	function replaceTextInNode(node, newText) {
		if (node.nodeType === Node.TEXT_NODE) {
			node.nodeValue = newText;
			return;
		}

		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
		const textNodes = [];
		let currentNode;
		while ((currentNode = walker.nextNode())) {
			textNodes.push(currentNode);
		}

		if (textNodes.length > 0) {
			textNodes[0].nodeValue = newText;
			for (let i = 1; i < textNodes.length; i++) {
				textNodes[i].nodeValue = '';
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			node.textContent = newText;
		}
	}

	/**
	 * 特殊字符标准化工具
	 */
	const TextNormalizer = {
		smallCapsMap: {
			'ᴀ': 'A', 'ʙ': 'B', 'ᴄ': 'C', 'ᴅ': 'D', 'ᴇ': 'E', 'ғ': 'F', 'ɢ': 'G', 'ʜ': 'H', 'ɪ': 'I',
			'ᴊ': 'J', 'ᴋ': 'K', 'ʟ': 'L', 'ᴍ': 'M', 'ɴ': 'N', 'ᴏ': 'O', 'ᴘ': 'P', 'ǫ': 'Q', 'ʀ': 'R',
			'ꜱ': 'S', 'ᴛ': 'T', 'ᴜ': 'U', 'ᴠ': 'V', 'ᴡ': 'W', 'ʏ': 'Y', 'ᴢ': 'Z',
			'Ɪ': 'I', 'Ɡ': 'G', 'Ʞ': 'K', 'Ɬ': 'L', 'Ɜ': 'E', 'Ꞷ': 'W'
		},
		regex: null,
		init() {
			if (this.regex) return;
			const chars = Object.keys(this.smallCapsMap).join('');
			this.regex = new RegExp(`[${chars}]`, 'g');
		},
		normalizeNode(rootNode) {
			this.init();
			const walker = document.createTreeWalker(
				rootNode,
				NodeFilter.SHOW_TEXT,
				null,
				false
			);
			let node;
			const nodes = [];
			while (node = walker.nextNode()) {
				nodes.push(node);
			}
			nodes.forEach(textNode => {
				const text = textNode.nodeValue;
				if (!text) return;
				if (this.regex.test(text)) {
					this.regex.lastIndex = 0;
					const newText = text.replace(this.regex, (char) => this.smallCapsMap[char] || char);
					textNode.nodeValue = newText;
				}
			});
		}
	};

	/**
	 * DOM 处理与遍历器
	 */
	class DOMNormalizer {
		constructor() {
			this.elementState = new WeakMap();
			this.displayCache = new WeakMap();
		}

		/**
		 * 判断元素是否在视觉上被隐藏或对屏幕阅读器隐藏
		 */
		_isHidden(el) {
			if (el.hasAttribute('aria-hidden') && el.getAttribute('aria-hidden') === 'true') return true;
			if (el.classList.contains('sr-only') || el.classList.contains('visually-hidden')) return true;
			if (el.style.display === 'none' || el.style.visibility === 'hidden') return true;

			const style = window.getComputedStyle(el);
			return style.display === 'none' || style.visibility === 'hidden';
		}

		/**
		 * 动态判断是否为块级元素
		 */
		_isBlockNode(el) {
			if (this.displayCache.has(el)) return this.displayCache.get(el);

			const blockTags = new Set([
				'P', 'DIV', 'BLOCKQUOTE', 'LI', 'DD', 'DT', 'DL', 'UL', 'OL',
				'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'CENTER', 'PRE',
				'ARTICLE', 'SECTION', 'MAIN', 'ASIDE', 'HEADER', 'FOOTER', 'NAV',
				'FIGURE', 'FIGCAPTION', 'ADDRESS', 'TABLE', 'FORM', 'FIELDSET'
			]);
			if (blockTags.has(el.tagName)) {
				this.displayCache.set(el, true);
				return true;
			}

			const inlineTags = new Set([
				'SPAN', 'A', 'STRONG', 'EM', 'B', 'I', 'U', 'CODE', 'KBD', 'SAMP',
				'VAR', 'SUB', 'SUP', 'MARK', 'RUBY', 'RT', 'RP', 'BDI', 'BDO', 'WBR', 'BR', 'IMG', 'SVG'
			]);
			if (inlineTags.has(el.tagName) && !el.classList.contains('ao3-text-block')) {
				this.displayCache.set(el, false);
				return false;
			}

			const style = window.getComputedStyle(el);
			const isBlock = !style.display.startsWith('inline') && style.display !== 'contents';
			this.displayCache.set(el, isBlock);
			return isBlock;
		}

		/**
		 * 判断是否包含块级子元素
		 */
		_hasBlockChild(el) {
			for (let i = 0; i < el.children.length; i++) {
				const child = el.children[i];
				if (child.classList.contains('ao3-text-block') || this._isBlockNode(child)) {
					return true;
				}
			}
			return false;
		}

		async *generateUnits(container) {
			const skipHeaders =['Summary', 'Notes', 'Work Text', 'Chapter Text'];
			let yieldedAny = false;
			let hasTranslatedChildren = false;

			const elementsToSplit = Array.from(container.querySelectorAll('p, blockquote'))
				.filter(el => !this._isTranslated(el));

			TimeSlicer.reset();
			for (let i = 0; i < elementsToSplit.length; i++) {
				const el = elementsToSplit[i];
				
				if (!this.elementState.has(el)) {
					splitBrParagraphs(el);
					this.elementState.set(el, { preprocessed: true });
				}
				
				if (i % 100 === 0) await TimeSlicer.yieldIfNeeded();
			}

			const liElements = Array.from(container.querySelectorAll('li'));
			for (let i = 0; i < liElements.length; i++) {
				this._wrapListContent(liElements[i]);
				if (i % 100 === 0) await TimeSlicer.yieldIfNeeded();
			}

			const walker = document.createTreeWalker(
				container,
				NodeFilter.SHOW_ELEMENT,
				{
					acceptNode: (node) => {
						if (this._isTranslated(node)) {
							hasTranslatedChildren = true;
							return NodeFilter.FILTER_REJECT;
						}
						if (this._isHidden(node)) return NodeFilter.FILTER_REJECT;
						return NodeFilter.FILTER_ACCEPT;
					}
				}
			);

			let node;
			let count = 0;
			while ((node = walker.nextNode())) {
				if (node.parentElement && node.parentElement.closest('.ao3-text-block')) {
					continue;
				}

				if (node.classList.contains('ao3-text-block') ||
					node.tagName === 'HR' ||
					(this._isBlockNode(node) && !this._hasBlockChild(node))) {
					
					const content = node.textContent.trim();
					if (!content && node.tagName !== 'HR') continue;
					if (skipHeaders.includes(content)) continue;

					yieldedAny = true;
					yield node;
				}
				
				count++;
				if (count % 50 === 0) await TimeSlicer.yieldIfNeeded();
			}

			if (!yieldedAny && !hasTranslatedChildren && container.textContent.trim().length > 0) {
				if (!this._isTranslated(container) && !this._isHidden(container)) {
					yield container;
				}
			}
		}

		_isTranslated(el) {
			const state = el.getAttribute('data-translation-state');
			if (state === 'translated' || state === 'translated-title' || state === 'skipped') return true;
			if (el.closest('.ao3-translated-content, .ao3-translated-title, .ao3-tag-translation, .translate-me-ao3-wrapper, .translated-by-ao3-translator-error')) return true;
			return false;
		}

		_wrapListContent(li) {
			if (li.querySelector('ul, ol')) {
				const childNodes = Array.from(li.childNodes);
				let contentBuffer =[];
				const flushBuffer = () => {
					if (contentBuffer.length === 0) return;
					if (contentBuffer.some(n => (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 0) || (n.nodeType === Node.ELEMENT_NODE && n.textContent.trim().length > 0))) {
						const p = document.createElement('p');
						p.style.margin = '0'; p.style.padding = '0'; p.style.display = 'block'; p.style.width = '100%';
						contentBuffer[0].parentNode.insertBefore(p, contentBuffer[0]);
						contentBuffer.forEach(n => p.appendChild(n));
						this.elementState.set(p, { preprocessed: true });
					}
					contentBuffer =[];
				};
				childNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'UL' || node.tagName === 'OL')) flushBuffer();
					else contentBuffer.push(node);
				});
				flushBuffer();
			}
		}
	}

	/**
	 * DOM 顺序队列管理器
	 */
	class DomOrderedQueueManager {
		constructor() {
			this.viewportQueue =[];
			this.backgroundQueue =[];
			this.unitMap = new Map();
		}

		add(unit, retryCount = 0, unshift = false, priority = 1) {
			if (unit.dataset.translationState && unit.dataset.translationState !== 'queued') return;
			if (this.unitMap.has(unit)) return;

			unit.dataset.translationState = 'queued';
			
			const domIndex = parseInt(unit.dataset.domIndex || '0', 10);
			const node = { unit, retryCount, domIndex, priority };
			
			const targetQueue = priority === 0 ? this.viewportQueue : this.backgroundQueue;

			if (unshift) {
				node.domIndex = -Date.now();
				targetQueue.unshift(node);
			} else {
				targetQueue.push(node);
				targetQueue.sort((a, b) => a.domIndex - b.domIndex);
			}
			this.unitMap.set(unit, node);
		}

		updatePriority(unit, priority) {
			const node = this.unitMap.get(unit);
			if (!node || node.priority === priority) return;

			const oldQueue = node.priority === 0 ? this.viewportQueue : this.backgroundQueue;
			const idx = oldQueue.indexOf(node);
			if (idx > -1) oldQueue.splice(idx, 1);

			node.priority = priority;
			const newQueue = priority === 0 ? this.viewportQueue : this.backgroundQueue;
			newQueue.push(node);
			newQueue.sort((a, b) => a.domIndex - b.domIndex);
		}

		remove(unit) {
			const node = this.unitMap.get(unit);
			if (node) {
				const targetQueue = node.priority === 0 ? this.viewportQueue : this.backgroundQueue;
				const idx = targetQueue.indexOf(node);
				if (idx > -1) targetQueue.splice(idx, 1);
				this.unitMap.delete(unit);
			}
		}

		get size() { return this.viewportQueue.length + this.backgroundQueue.length; }
		
		peek() {
			if (this.viewportQueue.length > 0) return this.viewportQueue[0];
			if (this.backgroundQueue.length > 0) return this.backgroundQueue[0];
			return null;
		}
		
		pop() {
			let node = null;
			if (this.viewportQueue.length > 0) {
				node = this.viewportQueue.shift();
			} else if (this.backgroundQueue.length > 0) {
				node = this.backgroundQueue.shift();
			}
			if (node) this.unitMap.delete(node.unit);
			return node;
		}
	}

	/**
	 * 分包策略
	 */
	class BatchStrategy {
		constructor(configProvider) {
			this.config = configProvider;
		}

		createBatch(queueManager) {
			if (queueManager.size === 0) return { batchNodes:[], reason: 'empty', batchLang: 'auto' };

			const { chunkSize, paragraphLimit } = this.config.getLimits();
			const batchNodes =[];
			let currentChars = 0;
			let reason = 'underfilled';
			
			const firstNode = queueManager.peek();
			const batchLang = firstNode.unit.dataset.detectedLang || 'auto';

			while (queueManager.size > 0) {
				const node = queueManager.peek();
				const unitLang = node.unit.dataset.detectedLang || 'auto';

				if (batchNodes.length > 0 && unitLang !== batchLang) {
					reason = 'language_boundary';
					break;
				}

				const isSeparator = node.unit.tagName === 'HR' || /^\s*[-—*~<>=.]{3,}\s*$/.test(node.unit.textContent);
				if (isSeparator) {
					if (batchNodes.length > 0) {
						reason = 'separator_cut';
						break;
					} else {
						batchNodes.push(queueManager.pop());
						reason = 'separator_single';
						break;
					}
				}

				batchNodes.push(queueManager.pop());
				currentChars += node.unit.textContent.length;

				if (batchNodes.length >= paragraphLimit || currentChars >= chunkSize) {
					reason = 'full';
					break;
				}
			}

			return { batchNodes, reason, batchLang };
		}
	}

	/**
	 * 渲染代理：负责将翻译结果写入 DOM
	 */
	class RenderDelegate {
		constructor(customRenderersMap, displayModeGetter) {
			this.customRenderers = customRenderersMap || new Map();
			this.getDisplayMode = displayModeGetter;
		}

		applyResult(unit, result, onRetry) {
			if (this.customRenderers.has(unit)) {
				try {
					this.customRenderers.get(unit)(unit, result);
				} catch (e) {
					Logger.error('Translation', '自定义渲染失败', e);
					unit.dataset.translationState = 'error';
				}
				return;
			}

			let originalWrapper = unit.querySelector(':scope > .ao3-original-content');

			if (!originalWrapper) {
				originalWrapper = document.createElement('span');
				originalWrapper.className = 'ao3-original-content';
				if (unit.firstChild) {
					originalWrapper.append(...unit.childNodes);
				}

				unit.appendChild(originalWrapper);
			}

			let translatedWrapper = unit.querySelector(':scope > .ao3-translated-content');
			if (translatedWrapper) translatedWrapper.remove();

			translatedWrapper = document.createElement('span');
			translatedWrapper.className = 'ao3-translated-content';

			if (result.status === 'success') {
				let cleanContent = result.content;
				if (cleanContent.includes('ao3-original-content')) {
					const temp = document.createElement('div');
					temp.innerHTML = cleanContent;
					const inner = temp.querySelector('.ao3-original-content, .ao3-translated-content');
					if (inner) cleanContent = inner.innerHTML;
				}
				
				translatedWrapper.innerHTML = cleanContent;
				unit.dataset.translationState = 'translated';
			} else {
				translatedWrapper.classList.add('ao3-translation-error');
				translatedWrapper.innerHTML = `翻译失败：${result.content.replace('翻译失败：', '')}`;
				unit.dataset.translationState = 'error';
				const retryBtn = this._createRetryButton(unit, onRetry);
				translatedWrapper.appendChild(retryBtn);
			}
			unit.appendChild(translatedWrapper);
		}

		/**
		 * 创建重试按钮
		 */
		_createRetryButton(unit, onRetry) {
			const span = document.createElement('span');
			span.className = 'retry-translation-button';
			span.title = '重试';
			span.innerHTML = TranslationDOMUtils.RETRY_ICON_SVG;
			span.addEventListener('click', (e) => {
				e.stopPropagation();
				onRetry(unit);
			});
			return span;
		}
	}

	/**
	 * 资源管理器
	 */
	class ResourceManager {
		constructor(engineName) {
			this.engineName = engineName;
			this.tokenBucket = new GlobalTokenBucket(engineName);
			this.consecutiveErrors = 0;
		}

		async acquireToken() {
			const result = await this.tokenBucket.consume(1, this.engineName);
			if (result.success) {
				this.consecutiveErrors = Math.max(0, this.consecutiveErrors - 1);
			}
			return result;
		}

		async getAvailableTokens() {
			return await this.tokenBucket.getAvailableTokens(this.engineName);
		}

		async getCapacity() {
			return this.tokenBucket.getConfig(this.engineName).capacity;
		}

			reportError(error) {
				if (error.type === 'rate_limit' || error.type === 'auth_error') return;
				
				if (error.type === 'server_overloaded' || (error.message && error.message.includes('503'))) {
				this.consecutiveErrors++;
				let baseFreezeTime = 15000;
				const multiplier = Math.pow(1.5, this.consecutiveErrors - 1);
				const freezeTime = Math.min(baseFreezeTime * multiplier, 60000);
				const jitter = Math.random() * 2000;
				const finalFreezeTime = Math.floor(freezeTime + jitter);

				Logger.warn('Network', `[${this.engineName}] 触发动态全局熔断`, {
					errorType: error.type,
					consecutiveErrors: this.consecutiveErrors,
					freezeTimeMs: finalFreezeTime
				});

				this.tokenBucket.triggerFreeze(finalFreezeTime);
			}
		}
	}

	/**
	 * 通用翻译调度引擎
	 */
	class UniversalEngine {
		constructor(options) {
			this.container = options.containerElement;
			this.isCancelled = options.isCancelled;
			this.onComplete = options.onComplete;
			this.onProgress = options.onProgress;
			this.onRetryCallback = options.onRetry;
			this.containerLang = options.containerLang || "auto";
			this.useObserver = options.useObserver !== false;

			this.normalizer = new DOMNormalizer();
			this.queueManager = new DomOrderedQueueManager();

			const engine = getValidEngineName();

			this.batchStrategy = new BatchStrategy({
				getLimits: () => {
					const isSpecial =['google_translate', 'bing_translator'].includes(engine);
					const base = CONFIG.SERVICE_CONFIG[engine] || CONFIG.SERVICE_CONFIG.default;
					if (isSpecial) {
						return {
							chunkSize: base.CHUNK_SIZE,
							paragraphLimit: base.PARAGRAPH_LIMIT
						};
					}
					const params = ProfileManager.getParamsByEngine(engine);
					return {
						chunkSize: params.chunk_size,
						paragraphLimit: params.para_limit
					};
				}
			});

			this.renderer = new RenderDelegate(options.customRenderers, () => GM_getValue('translation_display_mode'));
			this.resourceManager = new ResourceManager(engine);

			this.preloadObserver = null;
			this.viewportObserver = null;
			this.dwellTimers = new Map();

			if (this.useObserver) {
				const rootMargin = this._getRootMargin();
				
				// 1. 预加载观察者：负责将进入懒加载范围的节点加入后台队列 (优先级 1)
				this.preloadObserver = new IntersectionObserver((entries) => {
					if (this.isCancelled()) return;
					let addedOrRemoved = false;
					entries.forEach(entry => {
						const unit = entry.target;
						if (entry.isIntersecting) {
							// 进入懒加载范围：启动 200ms 防抖定时器
							if (!this.dwellTimers.has(unit) && (!unit.dataset.translationState || unit.dataset.translationState === 'queued')) {
								const timer = setTimeout(() => {
									this.dwellTimers.delete(unit);
									// 默认加入后台队列 (优先级 1)
									this.queueManager.add(unit, 0, false, 1);
									this.schedule(false);
								}, 200);
								this.dwellTimers.set(unit, timer);
							}
						} else {
							// 离开懒加载范围：清除定时器
							if (this.dwellTimers.has(unit)) {
								clearTimeout(this.dwellTimers.get(unit));
								this.dwellTimers.delete(unit);
							}
							// 如果节点还在队列中（未开始翻译），直接将其移出队列
							if (unit.dataset.translationState === 'queued') {
								this.queueManager.remove(unit);
								delete unit.dataset.translationState;
								addedOrRemoved = true;
							}
						}
					});
					if (addedOrRemoved) this.schedule(false);
				}, { rootMargin });

				// 2. 视口观察者：负责精确追踪当前屏幕可见的节点，动态提升/降低其优先级
				this.viewportObserver = new IntersectionObserver((entries) => {
					if (this.isCancelled()) return;
					let changed = false;
					entries.forEach(entry => {
						const unit = entry.target;
						// 仅当节点还在队列中时，才更新其优先级
						if (this.queueManager.unitMap.has(unit)) {
							const priority = entry.isIntersecting ? 0 : 1;
							this.queueManager.updatePriority(unit, priority);
							changed = true;
						}
					});
					if (changed) this.schedule(false);
				}, { rootMargin: '200px 0px 200px 0px' });
			}

			this.timer = null;
			this.detectedLang = null;
			this.prependNodes = options.prependNodes ||[];
			this.totalUnits = 0;
			this.processedUnits = 0;
			this.currentDomIndex = 0;
			this.hasError = false;
			this.prependNodes.forEach((n, i) => {
				if (!n.dataset.translationState || n.dataset.translationState === 'queued') {
					n.dataset.domIndex = -(this.prependNodes.length - i);
					this.queueManager.add(n, 0, false, 0);
					this.totalUnits++;
				}
			});
		}

		async start() {
			try {
				const unitGenerator = this.normalizer.generateUnits(this.container);
				let sampleBatch =[];
				let detectionAttempted = false;

				for await (const unit of unitGenerator) {
					if (this.isCancelled()) break;
					if (unit.dataset.translationState && unit.dataset.translationState !== 'queued') continue;

					this.totalUnits++;
					unit.dataset.domIndex = this.currentDomIndex++;

					if (!this.detectedLang && !detectionAttempted && !this.prependNodes.includes(unit)) {
						sampleBatch.push(unit);
						if (sampleBatch.length >= 5) {
							await this._detectLanguage(sampleBatch);
							detectionAttempted = true;
							sampleBatch =[];
						}
					}

					if (this.useObserver) {
						this.preloadObserver.observe(unit);
						this.viewportObserver.observe(unit);
					} else {
						this.queueManager.add(unit, 0, false, 0);
					}

					// 防抖调度：每加入一个节点，重置 50ms 定时器
					this.schedule(false);
				}

				if (!this.detectedLang && !detectionAttempted && sampleBatch.length > 0) {
					await this._detectLanguage(sampleBatch);
				}

				this.schedule(true);

				if (this.totalUnits === 0) {
					this._finish();
				}
			} catch (e) {
				Logger.error('Translation', '通用引擎启动失败', e);
				this._finish();
			}
		}

		schedule(force = false) {
			if (this.isCancelled()) return;
			clearTimeout(this.timer);
			this.timer = setTimeout(() => this.runLoop(force), 50);
		}

		async runLoop(force) {
			if (this.isCancelled()) return;
			
			if (this.queueManager.size === 0) {
				if (this.processedUnits >= this.totalUnits) this._finish();
				return;
			}

			const nextNode = this.queueManager.peek();
			if (nextNode && nextNode.priority === 1) {
				const availableTokens = await this.resourceManager.getAvailableTokens();
				const capacity = await this.resourceManager.getCapacity();
				const threshold = Math.max(1, capacity * 0.3);
				if (availableTokens < threshold) {
					this.timer = setTimeout(() => this.runLoop(force), 1000);
					return;
				}
			}

			const { batchNodes, reason, batchLang } = this.batchStrategy.createBatch(this.queueManager);

			if (!batchNodes || batchNodes.length === 0) return;

			const tokenResult = await this.resourceManager.acquireToken();
			if (!tokenResult.success) {
				batchNodes.reverse().forEach(node => this.queueManager.add(node.unit, node.retryCount, true, node.priority));
				this.timer = setTimeout(() => this.runLoop(force), tokenResult.waitTime + 50);
				return;
			}

			this._executeBatch(batchNodes, batchLang);

			if (this.queueManager.size > 0) {
				this.schedule(false);
			}
		}

		async _executeBatch(batchNodes, batchLang) {
			const batch = batchNodes.map(n => n.unit);
			batch.forEach(el => {
				el.dataset.translationState = 'translating';
			});

			try {
				const validUnits = batch.filter(el => el.tagName !== 'HR' && el.textContent.trim());
				const reqId = `Batch-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

				let results = new Map();

				if (validUnits.length > 0) {
					results = await translateParagraphs(validUnits, {
						isCancelled: this.isCancelled,
						knownFromLang: batchLang,
						reqId: reqId,
						skipRateLimit: true
					});
				}

				TimeSlicer.reset();
				for (const el of batch) {
					if (this.viewportObserver) this.viewportObserver.unobserve(el);

					if (el.dataset.translationState !== 'translating') continue;
					this.processedUnits++;

					if (el.tagName === 'HR') {
						el.dataset.translationState = 'translated';
						continue;
					}

					const res = results.get(el);
					if (res) {
						this.renderer.applyResult(el, res, this.onRetryCallback);
					} else {
						this.renderer.applyResult(el, { status: 'error', content: '底层异常：翻译结果丢失' }, this.onRetryCallback);
					}
					await TimeSlicer.yieldIfNeeded();
				}

			} catch (e) {
				if (this.isCancelled() || e.type === 'user_cancelled') return;

				// 二分降级策略
				if (batchNodes.length > 1 && e.type !== 'fatal_error' && e.type !== 'auth_error') {
					Logger.warn('Translation', `批次重试耗尽或校验失败，触发二分降级策略`, { batchSize: batchNodes.length });
					const mid = Math.ceil(batchNodes.length / 2);
					const batchA = batchNodes.slice(0, mid);
					const batchB = batchNodes.slice(mid);[batchB, batchA].forEach(subBatch => {
						subBatch.reverse().forEach(node => {
							node.unit.dataset.translationState = 'queued';
							this.queueManager.add(node.unit, node.retryCount, true, node.priority); 
						});
					});
					this.schedule(true);
					return;
				}

				// 彻底失败，渲染错误 UI
				Logger.error('Translation', `重试与降级耗尽，任务彻底失败: ${e.message}`);
				this.hasError = true;
				for (const node of batchNodes) {
					if (node.unit.dataset.translationState !== 'translating') continue;
					this.processedUnits++;
					this.renderer.applyResult(node.unit, { status: 'error', content: e.message }, this.onRetryCallback);
				}
			} finally {
				if (this.onProgress) this.onProgress(this.processedUnits, this.totalUnits);
				this.schedule(false);
			}
		}

		async _detectLanguage(samples) {
			const userSelectedFromLang = GM_getValue('from_lang', 'auto');
			if (userSelectedFromLang === 'script_auto') {
				const textToDetect = samples.map(p => p.textContent).join(' ').substring(0, 200);
				this.detectedLang = await LanguageDetector.detect(textToDetect);
				Logger.info('Translation', `自动检测源语言: ${this.detectedLang}`);
			} else {
				this.detectedLang = userSelectedFromLang;
			}
		}

		_getRootMargin() {
			const engineName = getValidEngineName();
			const isSpecial =['google_translate', 'bing_translator'].includes(engineName);
			const base = CONFIG.SERVICE_CONFIG[engineName] || CONFIG.SERVICE_CONFIG.default;
			if (isSpecial) {
				return base.LAZY_LOAD_ROOT_MARGIN;
			}
			const params = ProfileManager.getParamsByEngine(engineName);
			return params.lazy_load_margin;
		}

		_finish() {
			if (this.preloadObserver) this.preloadObserver.disconnect();
			if (this.viewportObserver) this.viewportObserver.disconnect();
			if (this.onComplete) this.onComplete(this.hasError);
		}

		disconnect() {
			clearTimeout(this.timer);
			if (this.preloadObserver) this.preloadObserver.disconnect();
			if (this.viewportObserver) this.viewportObserver.disconnect();
			if (this.dwellTimers) {
				this.dwellTimers.forEach(timer => clearTimeout(timer));
				this.dwellTimers.clear();
			}
		}

		addUnits(units) {
			let addedCount = 0;
			units.forEach(u => {
				if (u.dataset.translationState && u.dataset.translationState !== 'queued') return;
				
				if (u.dataset.domIndex === undefined) {
					u.dataset.domIndex = this.currentDomIndex++;
				}
				if (this.useObserver && !u.classList.contains('ao3-title-translatable-temp')) {
					this.preloadObserver.observe(u);
					this.viewportObserver.observe(u);
				} else {
					this.queueManager.add(u, 0, false, 0);
				}
				addedCount++;
			});
			this.totalUnits += addedCount;
			this.schedule(false);
		}

		scheduleProcessing(force) {
			this.schedule(force);
		}
	}

	/**
	 * 通用翻译引擎启动入口
	 */
	function runUniversalTranslationEngine(options) {
		const engine = new UniversalEngine(options);
		engine.start();
		return {
			disconnect: () => engine.disconnect(),
			addUnits: (units) => engine.addUnits(units),
			scheduleProcessing: (force) => engine.scheduleProcessing(force),
			get queueSize() { return engine.queueManager.size; }
		};
	}

	/**
	 * 翻译 DOM 操作助手：统一管理包装、还原与清理逻辑
	 */
	const TranslationDOMUtils = {
		RETRY_ICON_SVG: SVG_ICONS.retry,

		createErrorDisplay(message, onRetry) {
			const errorDiv = document.createElement('div');
			errorDiv.className = 'translated-by-ao3-translator-error';
			errorDiv.style.margin = '15px 0';
			const cleanMsg = message.replace(/^翻译失败：/, '');
			errorDiv.innerHTML = `翻译失败：${cleanMsg}`;

			const retryBtn = document.createElement('span');
			retryBtn.className = 'retry-translation-button';
			retryBtn.title = '重试';
			retryBtn.innerHTML = this.RETRY_ICON_SVG;
			retryBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				onRetry();
			});
			errorDiv.appendChild(retryBtn);
			return errorDiv;
		},

		unwrapUnit(unit) {
			if (!unit) return;

			const originalWrapper = unit.querySelector(':scope > .ao3-original-content');
			const translatedWrapper = unit.querySelector(':scope > .ao3-translated-content');

			if (translatedWrapper) translatedWrapper.remove();

			if (originalWrapper) {
				while (originalWrapper.firstChild) {
					unit.insertBefore(originalWrapper.firstChild, originalWrapper);
				}
				originalWrapper.remove();
			}

			delete unit.dataset.translationState;
			delete unit.dataset.brSplit;
			delete unit.dataset.indentCleaned;
		},

		resetFailedUnits(container) {
			const units = Array.from(container.querySelectorAll('[data-translation-state]'))
				.filter(u => {
					const s = u.dataset.translationState;
					return s === 'error' || s === 'translating' || s === 'queued';
				});
			
			units.forEach(unit => this.unwrapUnit(unit));
			return units;
		},

		deepCleanup(container) {
			if (!container) return;
			// 1. 移除所有错误提示和按钮包装器
			container.querySelectorAll('.translated-by-ao3-translator-error, .translate-me-ao3-wrapper').forEach(el => el.remove());
			
			// 2. 还原所有带有翻译状态的单元
			container.querySelectorAll('[data-translation-state]').forEach(unit => this.unwrapUnit(unit));
			
			// 3. 移除所有译文容器
			container.querySelectorAll('.ao3-translated-content, .ao3-translated-title, .ao3-tag-translation, .translated-tags-container').forEach(el => el.remove());

			// 4. 还原被拆分的文本块
			container.querySelectorAll('.ao3-text-block').forEach(block => {
				block.replaceWith(...block.childNodes);
			});

			// 5. 还原标签结构
			container.querySelectorAll('.ao3-tag-original').forEach(el => {
				const parent = el.parentElement;
				if (parent) {
					el.replaceWith(...el.childNodes);
					delete parent.dataset.translationState;
				}
			});

			// 6. 重置单元模式的逻辑锁标记，允许重新扫描
			container.querySelectorAll('[data-translation-handled]').forEach(el => {
				delete el.dataset.translationHandled;
			});
		}
	};

	/**
	 * 统一的翻译目标容器规则配置
	 */
	const TRANSLATION_TARGET_RULES = {
		universal:[
			{ selector: 'blockquote.userstuff.summary', text: '翻译简介' },
			{ selector: '.summary > blockquote.userstuff', text: '翻译简介' },
			{ selector: 'blockquote.userstuff.notes', text: '翻译注释' },
			{ selector: '.notes > blockquote.userstuff', text: '翻译注释' },
			{ selector: '.comment blockquote.userstuff', text: '翻译评论' },
			{ selector: 'div.bio > div.userstuff', text: '翻译简介' },
			{ selector: '.pseud blockquote.userstuff', text: '翻译简介' },
			{ selector: '.latest.news .post.group > blockquote.userstuff', text: '翻译概述' },
			{ selector: 'dl.work.meta.group', text: '翻译标签', above: false, isTags: true },
			{ selector: 'ul.tags.commas', text: '翻译标签', above: false, isTags: true },
			{ selector: 'ul.tags.cloud', text: '翻译标签', above: false, isTags: true },
			{ selector: 'ol.tags.index.group, ol.tag.index.group', text: '翻译标签', above: false, isTags: true },
			{ selector: 'ul.tags.index.group, ul.tag.index.group', text: '翻译标签', above: false, isTags: true },
			{ selector: '#admin-banner blockquote.userstuff', text: '翻译公告', insertInside: true },
			{ selector: '#chapters > .userstuff', text: '翻译正文', above: true, isLazyLoad: true },
			{ selector: '#chapters > .chapter > .userstuff[role="article"]', text: '翻译正文', above: true, isLazyLoad: true },
			{ selector: '.preface.group h2.title.heading', text: '翻译标题', isTitle: true },
			{ selector: '.chapter.preface.group h3.title', text: '翻译标题', isTitle: true }
		],
		specific: {
			'collections_dashboard_common':[
				{ selector: '.primary.header.module blockquote.userstuff', text: '翻译概述', above: false, isLazyLoad: false },
				{ selector: '#intro blockquote.userstuff', text: '翻译简介', above: false, isLazyLoad: false },
				{ selector: '#rules blockquote.userstuff', text: '翻译规则', above: false, isLazyLoad: false }
			],
			'admin_posts_show': [
				{ selector: 'div[role="article"] > .userstuff', text: '翻译动态', above: true, isLazyLoad: true },
				{ selector: '.news.module .header h3.heading', text: '翻译标题', isTitle: true },
				{ selector: 'dd.tags > ul.tags.commas', text: '翻译标签', above: false, isTags: true, fullPageOnly: true }
			],
			'tos_page':[
				{ selector: '#tos.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'content_policy_page':[
				{ selector: '#content.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'privacy_policy_page':[
				{ selector: '#privacy.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'dmca_policy_page':[
				{ selector: '#DMCA.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'tos_faq_page':[
				{ selector: 'div.admin.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'wrangling_guidelines_page':[
				{ selector: 'div.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'faq_page':[
				{ selector: 'div.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'known_issues_page':[
				{ selector: 'div.admin.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'report_and_support_page':[
				{ selector: 'div.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			]
		}
	};

	/**
	 * 提取标题节点用于翻译
	 */
	function extractTitleForTranslation(containerElement) {
		let titleNode = null;
		let titleTempDiv = null;
		let isChapterTitle = false;
		let originalTitleText = '';

		// 1. 定位标题节点
		if (containerElement.matches('h2.title.heading, h3.title, .news.module .header h3.heading')) {
			titleNode = containerElement;
		}
		else {
			let prefaceGroup = containerElement.previousElementSibling;
			while (prefaceGroup && !prefaceGroup.classList.contains('preface')) {
				prefaceGroup = prefaceGroup.previousElementSibling;
			}
			if (!prefaceGroup && containerElement.parentElement && containerElement.parentElement.classList.contains('chapter')) {
				prefaceGroup = Array.from(containerElement.parentElement.children).find(c => c.classList.contains('preface'));
			}
			if (prefaceGroup) {
				titleNode = prefaceGroup.querySelector('h3.title');
			}
			if (!titleNode) {
				const workPreface = containerElement.closest('.preface.group') || document.querySelector('.preface.group');
				if (workPreface) {
					titleNode = workPreface.querySelector('h2.title.heading');
				}
			}
		}

		if (!titleNode || titleNode.querySelector('.ao3-translated-title')) {
			return { titleNode: null, titleTempDiv: null, originalTitleText: '', isChapterTitle: false };
		}

		// 2. 判断标题类型
		isChapterTitle = titleNode.matches('h3.title');

		// 检查是否已经存在 temp div，如果存在则直接复用并清除状态
		titleTempDiv = titleNode.querySelector('.ao3-title-translatable-temp');
		if (titleTempDiv) {
			delete titleTempDiv.dataset.translationState;
			return { titleNode, titleTempDiv, originalTitleText: titleTempDiv.textContent, isChapterTitle };
		}

		// 3. 提取需要翻译的纯文本
		let textToTranslate = '';
		let isValid = true;

		if (isChapterTitle) {
			const fullText = titleNode.textContent.trim();
			const simpleChapterRegex = /^(?:Chapter|第)\s*\d+\s*(?:章)?$/i;
			const link = titleNode.querySelector('a');

			if (link) {
				const linkText = link.textContent;
				const remaining = fullText.replace(linkText, '').trim();
				if (!remaining || /^[:：]\s*$/.test(remaining)) {
					isValid = false;
				} else {
					textToTranslate = remaining.replace(/^[:：]\s*/, '');
				}
			} else if (simpleChapterRegex.test(fullText)) {
				isValid = false;
			} else {
				textToTranslate = fullText;
			}
		} else {
			const clone = titleNode.cloneNode(true);
			// 在克隆节点中移除可能残留的 temp div，确保文本纯净
			clone.querySelectorAll('img, svg, .ao3-title-translatable-temp').forEach(el => el.remove());
			textToTranslate = clone.textContent.trim();
		}

		// 4. 组装返回结果
		if (isValid && textToTranslate) {
			titleTempDiv = document.createElement('span');
			titleTempDiv.className = 'ao3-title-translatable-temp';
			titleTempDiv.style.display = 'none';
			titleTempDiv.textContent = textToTranslate;
			originalTitleText = textToTranslate;
			titleNode.appendChild(titleTempDiv);
		} else {
			titleNode = null; 
		}

		return { titleNode, titleTempDiv, originalTitleText, isChapterTitle };
	}

	/**
	 * 通用翻译控制器基座：管理状态切换、RunID 校验及 UI 更新
	 */
	function createBaseController(config) {
		const { buttonWrapper, originalButtonText, onStart, onPause, onClear } = config;

		const controller = {
			state: 'idle',
			currentRunId: 0,

			updateButtonState: function (text, stateClass = '') {
				if (buttonWrapper) {
					const button = buttonWrapper.querySelector('div');
					if (button) button.textContent = text;
					buttonWrapper.className = `translate-me-ao3-wrapper ${stateClass}`;
				}
			},

			getCancelChecker: function (runId) {
				return () => this.state !== 'running' || this.currentRunId !== runId;
			},

			start: async function () {
				if (this.state === 'running') return;

				this.currentRunId++;
				const myRunId = this.currentRunId;
				this.state = 'running';
				this.updateButtonState('翻译中…', 'state-running');

				await sleep(10);

				const isCancelled = this.getCancelChecker(myRunId);
				const onDone = () => {
					if (!isCancelled()) {
						this.state = 'complete';
						this.updateButtonState('清除译文', 'state-complete');
					}
				};

				await onStart(isCancelled, onDone);
			},

			pause: function () {
				if (this.state !== 'running') return;
				this.state = 'paused';
				this.currentRunId++;
				if (onPause) onPause();
				this.updateButtonState('暂停中…', 'state-paused');
			},

			resume: function () {
				if (this.state !== 'paused') return;
				this.start();
			},

			clear: function () {
				this.state = 'idle';
				this.currentRunId++;
				if (onPause) onPause();
				onClear();
				this.updateButtonState(originalButtonText, 'state-idle');
			},

			handleClick: function () {
				switch (this.state) {
					case 'idle':
						this.start();
						break;
					case 'running':
						this.pause();
						break;
					case 'paused':
						this.resume();
						break;
					case 'complete':
						this.clear();
						break;
				}
			}
		};

		return controller;
	}

	/**
	 * 块级文本翻译控制器（支持正文、评论、动态等）
	 */
	function createTranslationController(options) {
		const { containerElement, buttonWrapper, originalButtonText, isLazyLoad } = options;
		let activeTask = null;
		let translatedTitleElement = null;
		let errorElement = null;

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				try {
					const { titleNode, titleTempDiv, originalTitleText, isChapterTitle } = extractTitleForTranslation(containerElement);

					const customRenderers = new Map();
					if (titleTempDiv) {
						customRenderers.set(titleTempDiv, (_node, result) => {
							if (result.status === 'success') {
								const finalTitleContent = AdvancedTranslationCleaner.cleanTitle(result.content, originalTitleText);
								titleNode.dataset.translationState = 'translated-title';

								let originalWrapper = Array.from(titleNode.children).find(c => c.classList.contains('ao3-original-title'));
								if (!originalWrapper) {
									originalWrapper = document.createElement('span');
									originalWrapper.className = 'ao3-original-title';
									while (titleNode.firstChild) originalWrapper.appendChild(titleNode.firstChild);
									titleNode.appendChild(originalWrapper);
								}

								let translatedWrapper = Array.from(titleNode.children).find(c => c.classList.contains('ao3-translated-title'));
								if (translatedWrapper) translatedWrapper.remove();

								translatedWrapper = document.createElement('span');
								translatedWrapper.className = 'ao3-translated-title';

                                if (isChapterTitle) {
									const translatedContent = originalWrapper.cloneNode(true);
									translatedContent.className = '';
									const link = translatedContent.querySelector('a');
									if (link) {
										let next = link.nextSibling;
										while (next) { const toRemove = next; next = next.nextSibling; toRemove.remove(); }
										translatedContent.appendChild(document.createTextNode(`: ${finalTitleContent}`));
									} else {
										translatedContent.textContent = finalTitleContent;
									}
									while (translatedContent.firstChild) translatedWrapper.appendChild(translatedContent.firstChild);
								} else {
									translatedWrapper.textContent = finalTitleContent;
								}

								titleNode.appendChild(translatedWrapper);
								translatedTitleElement = translatedWrapper;
								_node.remove();
							} else {
								titleNode.dataset.translationState = 'error';
								const errEl = TranslationDOMUtils.createErrorDisplay(result.content, () => {
									errEl.remove();
									titleNode.dataset.translationState = 'queued';
									delete titleTempDiv.dataset.translationState;
									if (activeTask) {
										if (controller.state === 'complete') {
											controller.state = 'running';
											controller.updateButtonState('翻译中…', 'state-running');
										}
										activeTask.addUnits([titleTempDiv]);
										activeTask.scheduleProcessing(true);
									}
								});
								titleNode.after(errEl);
							}
						});
					}

					activeTask = runUniversalTranslationEngine({
						containerElement, isCancelled, onComplete: onDone, useObserver: isLazyLoad,
						prependNodes: titleTempDiv ? [titleTempDiv] :[],
						customRenderers: customRenderers,
						onRetry: () => {
							const failed = TranslationDOMUtils.resetFailedUnits(containerElement);
							if (failed.length > 0 && activeTask) {
								if (controller.state === 'complete') {
									controller.state = 'running';
									controller.updateButtonState('翻译中…', 'state-running');
								}
								activeTask.addUnits(failed);
								activeTask.scheduleProcessing(true);
							}
						}
					});
				} catch (error) {
					if (isCancelled()) return;
					onDone();
					errorElement = TranslationDOMUtils.createErrorDisplay(error.message, () => {
						if (errorElement) { errorElement.remove(); errorElement = null; }
						controller.start();
					});
					buttonWrapper.before(errorElement);
				}
			},
			onPause: () => {
				if (activeTask) activeTask.disconnect();
				activeTask = null;
				containerElement.querySelectorAll('[data-translation-state="translating"]').forEach(unit => {
					delete unit.dataset.translationState;
				});
			},
			onClear: () => {
				TranslationDOMUtils.deepCleanup(containerElement);
				if (translatedTitleElement) {
					const titleNode = translatedTitleElement.parentElement;
					if (titleNode) {
						delete titleNode.dataset.translationState;
						const originalWrapper = Array.from(titleNode.children).find(c => c.classList.contains('ao3-original-title'));
						if (originalWrapper) {
							while (originalWrapper.firstChild) titleNode.insertBefore(originalWrapper.firstChild, originalWrapper);
							originalWrapper.remove();
						}
					}
					translatedTitleElement.remove();
					translatedTitleElement = null;
				}
				if (errorElement) { errorElement.remove(); errorElement = null; }
			}
		});

		return controller;
	}

	/**
	 * 混合作品卡片（Blurb）翻译控制器，同步管理简介与标签的翻译任务
	 */
	function createBlurbTranslationController(options) {
		const { summaryElement, tagsElement, buttonWrapper, originalButtonText } = options;
		let activeSummaryTask = null;

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				summaryElement.parentElement?.querySelectorAll('.translated-by-ao3-translator-error').forEach(el => el.remove());
				TranslationDOMUtils.resetFailedUnits(summaryElement);

				tagsElement.querySelectorAll('.ao3-tag-translation').forEach(el => el.remove());
				tagsElement.querySelectorAll('[data-translation-state]').forEach(el => {
					if (el.dataset.translationState !== 'translated') delete el.dataset.translationState;
				});

				let tagsFinished = false;
				let summaryFinished = false;

				const checkAllDone = () => {
					if (tagsFinished && summaryFinished && !isCancelled()) {
						onDone();
					}
				};

				runTagsTranslationEngine(tagsElement, isCancelled)
					.then(() => {
						tagsFinished = true;
					})
					.catch((err) => {
						tagsFinished = true;
						Logger.error('Translation', '标签翻译最终失败', err);
					})
					.finally(() => {
						checkAllDone();
					});

				activeSummaryTask = runUniversalTranslationEngine({
					containerElement: summaryElement,
					isCancelled,
					onComplete: () => {
						summaryFinished = true;
						checkAllDone();
					},
					onRetry: (unit) => {
						if (!activeSummaryTask) return;
						if (controller.state === 'complete') {
							controller.state = 'running';
							controller.updateButtonState('翻译中…', 'state-running');
						}
						summaryFinished = false;
						TranslationDOMUtils.unwrapUnit(unit);
						activeSummaryTask.addUnits([unit]);
						activeSummaryTask.scheduleProcessing(true);

						const hasFailedTags = tagsElement.querySelector('[data-translation-state="error"]');
						if (hasFailedTags) {
							tagsFinished = false;
							runTagsTranslationEngine(tagsElement, isCancelled)
								.then(() => {
									tagsFinished = true;
								})
								.catch((err) => {
									tagsFinished = true;
									Logger.error('Translation', '标签翻译重试最终失败', err);
								})
								.finally(() => {
									checkAllDone();
								});
						}
					}
				});
			},
			onPause: () => {
				if (activeSummaryTask) activeSummaryTask.disconnect();
				activeSummaryTask = null;
			},
			onClear: () => {
				TranslationDOMUtils.deepCleanup(summaryElement);
				TranslationDOMUtils.deepCleanup(tagsElement);
			}
		});

		return controller;
	}

	/**
	 * 标签区域翻译控制器
	 */
	function createTagsTranslationController(options) {
		const { containerElement, buttonWrapper, originalButtonText } = options;
		let errorElement = null;

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				try {
					await runTagsTranslationEngine(containerElement, isCancelled);
					if (isCancelled()) return;
					onDone();
				} catch (error) {
					if (isCancelled()) return;
					onDone();
					errorElement = TranslationDOMUtils.createErrorDisplay(error.message, () => {
						if (errorElement) { errorElement.remove(); errorElement = null; }
						controller.start();
					});
					buttonWrapper.before(errorElement);
				}
			},
			onClear: () => {
				TranslationDOMUtils.deepCleanup(containerElement);
				if (errorElement) { errorElement.remove(); errorElement = null; }
			}
		});

		return controller;
	}

	/**
	 * 提取需要翻译的标签节点 (DOM 查询与过滤)
	 */
	function extractTagsToTranslate(containerElement) {
		const targetSelectors =[
			'dd.fandom a.tag', 'dd.relationship a.tag', 'dd.character a.tag', 'dd.freeform a.tag',
			'dd.series a:not(.previous):not(.next)',
			'dd.collections a','li.fandoms a.tag',
			'li.relationships a.tag', 'li.characters a.tag', 'li.freeforms a.tag',
			'a.tag:not(.rating):not(.warning):not(.category)',
			'a[class^="cloud"]'
		];

		const nodesToTranslate =[];
		const processedElements = new Set();
		const fullDictionary = { ...pageConfig.staticDict, ...pageConfig.globalFlexibleDict, ...pageConfig.pageFlexibleDict };

		targetSelectors.forEach(selector => {
			containerElement.querySelectorAll(selector).forEach(el => {
				if (processedElements.has(el)) return;
				processedElements.add(el);

				if (el.closest('.rating, .warnings, .category, .warning, h5.fandoms')) return;
				if (el.querySelector('.ao3-tag-translation')) return;
				const cut = el.closest('.ao3-blocker-cut');
				if (cut && !cut.parentElement.classList.contains('ao3-blocker-unhide')) return;
				const originalSpan = el.querySelector('.ao3-tag-original');
				const text = (originalSpan ? originalSpan.textContent : el.textContent).trim();
				if (text && !/^\d+$/.test(text) && !fullDictionary[text]) {
					nodesToTranslate.push(el);
				}
			});
		});
		return nodesToTranslate;
	}

	/**
	 * 准备标签的 DOM 结构 (DOM 预处理)
	 */
	function prepareTagDOM(el) {
		let originalSpan = el.querySelector('.ao3-tag-original');
		if (!originalSpan) {
			originalSpan = document.createElement('span');
			originalSpan.className = 'ao3-tag-original';
			while (el.firstChild) originalSpan.appendChild(el.firstChild);
			el.appendChild(originalSpan);
		}
		return originalSpan;
	}

	/**
	 * 渲染标签的翻译结果 (DOM 渲染)
	 */
	function renderTagTranslation(parentLink, result) {
		if (parentLink.querySelector('.ao3-tag-translation')) return;
		const translationSpan = document.createElement('span');
		translationSpan.className = 'ao3-tag-translation';
		translationSpan.textContent = AdvancedTranslationCleaner.smartStripPunctuation(result.content);
		parentLink.appendChild(translationSpan);
		parentLink.dataset.translationState = 'translated';
	}

	/**
	 * 标签区域翻译引擎协调者 (流程编排与 API 调度)
	 */
	async function runTagsTranslationEngine(containerElement, isCancelled, knownFromLang = 'auto', skipTargetLanguage = false) {
		if (isCancelled()) return null;

		const targetLang = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
		if (skipTargetLanguage && knownFromLang === targetLang) {
			containerElement.dataset.translationState = 'skipped';
			return containerElement;
		}

		const tagElements = extractTagsToTranslate(containerElement);
		if (tagElements.length === 0) return containerElement;

		const nodesToTranslate = [];
		const wrapperMap = new Map();

		tagElements.forEach(el => {
			const originalSpan = prepareTagDOM(el);
			nodesToTranslate.push(originalSpan);
			wrapperMap.set(originalSpan, el);
			el.dataset.translationState = 'translating';
		});

		try {
			const reqId = 'Tags-' + Math.random().toString(36).substring(2, 6).toUpperCase();
			const translationResults = await translateParagraphs(nodesToTranslate, { 
				isCancelled, 
				reqId, 
				knownFromLang 
			});

			if (isCancelled()) return null;

			nodesToTranslate.forEach(originalSpan => {
				const result = translationResults.get(originalSpan);
				const parentLink = wrapperMap.get(originalSpan);
				if (result && result.status === 'success' && parentLink) {
					renderTagTranslation(parentLink, result);
				}
			});
			return containerElement;

		} catch (error) {
			if (isCancelled() || error.type === 'user_cancelled') return null;
			tagElements.forEach(el => el.dataset.translationState = 'error');
			throw error; 
		}
	}

	/**
	 * 状态灯 UI 控制器
	 */
	class FabStatusLight {
		constructor(fabContainer, lightElement) {
			this.fabContainer = fabContainer;
			this.lightElement = lightElement;
			this.currentState = 'idle';
			
			// 初始化时读取状态
			this.updateVisibility(GM_getValue('show_status_light', true));

			// 监听来自菜单的切换事件
			document.addEventListener(CUSTOM_EVENTS.STATUS_LIGHT_TOGGLED, (e) => {
				this.updateVisibility(e.detail.show);
			});
		}

		updateVisibility(show) {
			if (this.lightElement) {
				if (show) {
					this.lightElement.classList.remove('hide-status-light');
				} else {
					this.lightElement.classList.add('hide-status-light');
				}
			}
		}

		setState(state) {
			if (this.currentState === state) return;
			this.currentState = state;
			if (this.lightElement) {
				const isHidden = this.lightElement.classList.contains('hide-status-light');
				this.lightElement.className = `fab-status-light status-${state} ${isHidden ? 'hide-status-light' : ''}`.trim();
			}
		}

		updateDirection() {
			if (!this.lightElement || !document.body.classList.contains('ao3-full-page-mode')) return;
			const rect = this.fabContainer.getBoundingClientRect();
			const fabCenterX = rect.left + rect.width / 2;
			const fabCenterY = rect.top + rect.height / 2;
			const screenCenterX = window.innerWidth / 2;
			const screenCenterY = window.innerHeight / 2;

			let angle = Math.atan2(screenCenterY - fabCenterY, screenCenterX - fabCenterX) * (180 / Math.PI);
			this.lightElement.style.setProperty('--light-angle', `${angle + 90}deg`);
		}
	}

	/**
	 * 翻译任务状态管理器
	 */
	class TranslationTaskManager {
		constructor(onStateChange) {
			this.activeTasks = new Set();
			this.hasError = false;
			this.isRetrying = false;
			this.onStateChange = onStateChange;
		}

		addTask(taskId) {
			this.activeTasks.add(taskId);
			this.evaluateState();
		}

		removeTask(taskId) {
			this.activeTasks.delete(taskId);
			this.evaluateState();
		}

		setError(hasError) {
			this.hasError = hasError;
			this.evaluateState();
		}

		setRetrying(isRetrying) {
			this.isRetrying = isRetrying;
			this.evaluateState();
		}

		clearAll() {
			this.activeTasks.clear();
			this.hasError = false;
			this.isRetrying = false;
			this.evaluateState();
		}

		evaluateState() {
			if (this.hasError) {
				this.onStateChange('error');
			} else if (this.isRetrying) {
				this.onStateChange('retrying');
			} else if (this.activeTasks.size > 0) {
				this.onStateChange('translating');
			} else {
				this.onStateChange('idle');
			}
		}
	}

	/**
	 * 整页翻译控制器
	 */
	function createFullPageTranslationController(options) {
		const { statusLightController } = options;

		// 1. 状态管理器
		const STATE = {
			IDLE: 'idle',
			TRANSLATING: 'translating',
			PAUSED: 'paused',
			STOPPED: 'stopped'
		};

		const stateManager = {
			current: STATE.IDLE,
			get isActive() { return this.current === STATE.TRANSLATING; },
			get isPaused() { return this.current === STATE.PAUSED; },
			start() { this.current = STATE.TRANSLATING; },
			pause() { this.current = STATE.PAUSED; },
			stop() { this.current = STATE.STOPPED; }
		};

		// 2. 核心依赖与变量
		const taskManager = new TranslationTaskManager((newState) => {
			if (statusLightController) statusLightController.setState(newState);
		});

		let globalEngine = null;
		let containerObserver = null;
		const customRenderers = new Map();

		// 3. 翻译调度器：负责 DOM 监听与翻译策略路由分发
		const scheduler = {
			init() {
				// 获取根边距，如果引擎未初始化则使用默认值
				const rootMargin = globalEngine ? globalEngine._getRootMargin() : '1200px 0px 10000px 0px';
				
				containerObserver = new IntersectionObserver(async (entries) => {
					if (!stateManager.isActive) return;

					for (const entry of entries) {
						if (entry.isIntersecting) {
							const container = entry.target;
							if (container.dataset.translationState) continue;

							container.dataset.translationState = 'processing';
							containerObserver.unobserve(container);

							const rule = JSON.parse(container.dataset.translationRule || '{}');
							
							// 1. 语言检测
							const detectionTaskId = Symbol('container-detection');
							taskManager.addTask(detectionTaskId);
							const { detectedLang, shouldSkip } = await LanguageDetectionManager.processContainer(container, rule, 'full_page');
							container.dataset.detectedLang = detectedLang;
							taskManager.removeTask(detectionTaskId);

							if (!stateManager.isActive) return;

							if (shouldSkip) {
								container.dataset.translationState = 'skipped';
								Logger.info('Translation', `容器语言检测为 ${detectedLang}，跳过翻译。`);
								continue;
							}

							// 2. 策略路由分发
							if (rule.isTags) {
								this.processTags(container, detectedLang);
							} else if (rule.isTitle) {
								this.processTitle(container, detectedLang);
							} else {
								this.processContent(container, detectedLang);
							}
						}
					}
				}, { rootMargin });
			},

			observe(element) {
				if (containerObserver) containerObserver.observe(element);
			},

			disconnect() {
				if (containerObserver) {
					containerObserver.disconnect();
					containerObserver = null;
				}
			},

			// 策略：处理标签
			processTags(container, detectedLang) {
				const taskId = Symbol('tag-task');
				taskManager.addTask(taskId);
				
				runTagsTranslationEngine(container, () => !stateManager.isActive, detectedLang, true)
					.then(() => { if (stateManager.isActive) container.dataset.translationState = 'translated'; })
					.catch(e => { 
						if (stateManager.isActive) { 
							container.dataset.translationState = 'error'; 
							taskManager.setError(true); 
						} 
					})
					.finally(() => { taskManager.removeTask(taskId); });
			},

			// 策略：处理标题
			processTitle(container, detectedLang) {
				const { titleNode, titleTempDiv, originalTitleText, isChapterTitle } = extractTitleForTranslation(container);
				
				if (titleTempDiv) {
					titleTempDiv.dataset.detectedLang = detectedLang;
					
					// 注册自定义渲染逻辑
					customRenderers.set(titleTempDiv, (_node, result) => {
						if (result.status === 'success') {
							const finalTitleContent = AdvancedTranslationCleaner.cleanTitle(result.content, originalTitleText);
							container.dataset.translationState = 'translated-title';

							let originalWrapper = Array.from(container.children).find(c => c.classList.contains('ao3-original-title'));
							if (!originalWrapper) {
								originalWrapper = document.createElement('span');
								originalWrapper.className = 'ao3-original-title';
								while (container.firstChild) originalWrapper.appendChild(container.firstChild);
								container.appendChild(originalWrapper);
							}

							let translatedWrapper = Array.from(container.children).find(c => c.classList.contains('ao3-translated-title'));
							if (translatedWrapper) translatedWrapper.remove();

							translatedWrapper = document.createElement('span');
							translatedWrapper.className = 'ao3-translated-title';

							if (isChapterTitle) {
								const translatedContent = originalWrapper.cloneNode(true);
								translatedContent.className = '';
								const aLink = translatedContent.querySelector('a');
								if (aLink) {
									let next = aLink.nextSibling;
									while (next) { const toRemove = next; next = next.nextSibling; toRemove.remove(); }
									translatedContent.appendChild(document.createTextNode(`: ${finalTitleContent}`));
								} else {
									translatedContent.textContent = finalTitleContent;
								}
								while (translatedContent.firstChild) translatedWrapper.appendChild(translatedContent.firstChild);
							} else {
								translatedWrapper.textContent = finalTitleContent;
							}

							container.appendChild(translatedWrapper);
							_node.remove();
						} else {
							container.dataset.translationState = 'error';
							const errEl = TranslationDOMUtils.createErrorDisplay(result.content, () => {
								errEl.remove();
								container.dataset.translationState = 'queued';
								delete titleTempDiv.dataset.translationState;
								if (globalEngine) {
									taskManager.addTask('main-engine');
									globalEngine.addUnits([titleTempDiv]);
								}
							});
							container.after(errEl);
						}
					});

					if (globalEngine) {
						taskManager.addTask('main-engine');
						globalEngine.addUnits([titleTempDiv]);
					}
					container.dataset.translationState = 'queued';
				} else {
					container.dataset.translationState = 'skipped';
				}
			},

			// 策略：处理正文/普通内容
			async processContent(container, detectedLang) {
				try {
					let unitsBatch = [];
					if (!globalEngine) return;

					for await (const unit of globalEngine.normalizer.generateUnits(container)) {
						if (!stateManager.isActive) return;
						unit.dataset.detectedLang = detectedLang;
						unitsBatch.push(unit);
						
						if (unitsBatch.length >= 50) {
							taskManager.addTask('main-engine');
							globalEngine.addUnits(unitsBatch);
							unitsBatch = [];
						}
					}

					if (unitsBatch.length > 0 && globalEngine) {
						taskManager.addTask('main-engine');
						globalEngine.addUnits(unitsBatch);
					}
					container.dataset.translationState = 'queued';
				} catch (e) {
					Logger.error('Translation', '提取翻译单元失败', e);
					container.dataset.translationState = 'error';
				}
			}
		};

		// 4. 内部辅助方法
		const scanAndObserveContainers = (rootNode = document) => {
			if (!stateManager.isActive) return;

			const rules = [...TRANSLATION_TARGET_RULES.universal];
			const specific = TRANSLATION_TARGET_RULES.specific[pageConfig.currentPageType];
			if (specific) rules.push(...specific);

			rules.forEach(rule => {
				if (rule.selector === 'ul.tags.commas' && ['admin_posts_show', 'admin_posts_index', 'collections_dashboard_common'].includes(pageConfig.currentPageType)) return;

				rootNode.querySelectorAll(rule.selector).forEach(el => {
					if (el.dataset.translationState) return;
					if (el.textContent.trim() === '') return;
					if (el.classList.contains('translated-tags-container') || el.closest('.translated-tags-container')) return;

					el.dataset.translationRule = JSON.stringify(rule);
					scheduler.observe(el);
				});
			});
		};

		// 5. 对外暴露的 API (Facade)
		const clearAllTranslations = () => {
			stateManager.stop();
			if (globalEngine) {
				globalEngine.disconnect();
				globalEngine = null;
			}
			scheduler.disconnect();
			taskManager.clearAll();
			customRenderers.clear();
			
			TranslationDOMUtils.deepCleanup(document.body);
			document.querySelectorAll('[data-translation-state]').forEach(el => delete el.dataset.translationState);
			document.querySelectorAll('[data-detected-lang]').forEach(el => delete el.dataset.detectedLang);
			document.querySelectorAll('.ao3-translated-title').forEach(el => {
				const titleNode = el.parentElement;
				if (titleNode) {
					delete titleNode.dataset.translationState;
					const originalWrapper = Array.from(titleNode.children).find(c => c.classList.contains('ao3-original-title'));
					if (originalWrapper) {
						while (originalWrapper.firstChild) titleNode.insertBefore(originalWrapper.firstChild, originalWrapper);
						originalWrapper.remove();
					}
				}
				el.remove();
			});
		};

		const startFullPageTranslation = async () => {
			if (stateManager.isActive) return;
			
			stateManager.start();
			taskManager.clearAll();
			customRenderers.clear();

			const initTaskId = Symbol('init-detection');
			taskManager.addTask(initTaskId);

			// 初始化全局翻译引擎
			globalEngine = new UniversalEngine({
				containerElement: document.body,
				isCancelled: () => !stateManager.isActive,
				onComplete: (hasErrors) => {
					taskManager.removeTask('main-engine');
					if (hasErrors) {
						taskManager.setError(true);
					}
				},
				onRetry: (unit) => {
					taskManager.setRetrying(true);
					setTimeout(() => {
						if (stateManager.isActive) taskManager.setRetrying(false);
					}, 2000);
					
					if (unit) {
						const translatedWrapper = unit.querySelector(':scope > .ao3-translated-content');
						if (translatedWrapper) translatedWrapper.remove();
						delete unit.dataset.translationState;
						if (globalEngine) {
							taskManager.addTask('main-engine');
							globalEngine.addUnits([unit]);
							globalEngine.scheduleProcessing(true);
						}
					}
				},
				customRenderers: customRenderers,
				useObserver: true 
			});

			scheduler.init();
			scanAndObserveContainers();
			
			taskManager.removeTask(initTaskId);
		};

		const handleFabClick = () => {
			if (stateManager.isActive) {
				clearAllTranslations();
				stateManager.pause();

				const autoTranslateEnabled = GM_getValue('ao3_auto_translate', false);
				if (autoTranslateEnabled) {
					Logger.info('Translation', '用户主动中断翻译或清除译文，当前页面已暂停自动翻译。');
				} else {
					Logger.info('Translation', '用户主动中断翻译或清除译文。');
				}
			} else {
				startFullPageTranslation();
			}
		};

		const checkAutoTranslate = () => {
			const autoTranslateEnabled = GM_getValue('ao3_auto_translate', false);
			if (autoTranslateEnabled && !stateManager.isPaused) {
				startFullPageTranslation();
			}
		};

		const handleNewNodes = (rootNode = document) => {
			if (stateManager.isActive) {
				scanAndObserveContainers(rootNode);

				if (globalEngine && rootNode !== document && rootNode.closest) {
					if (rootNode.closest('.ao3-original-content, .ao3-translated-content, .ao3-original-title, .ao3-translated-title, .ao3-tag-original, .ao3-tag-translation')) {
						return;
					}

					if (globalEngine.normalizer._isHidden(rootNode)) {
						return;
					}

					const container = rootNode.closest('[data-translation-state]');
					if (container && container !== rootNode) {
						const state = container.dataset.translationState;
						if (state === 'translated' || state === 'queued') {
							const extractAndAdd = async () => {
								try {
									let unitsBatch = [];
									for await (const unit of globalEngine.normalizer.generateUnits(rootNode)) {
										if (!stateManager.isActive) return;
										unit.dataset.detectedLang = container.dataset.detectedLang || 'auto';
										unitsBatch.push(unit);
										if (unitsBatch.length >= 30) {
											taskManager.addTask('main-engine');
											globalEngine.addUnits(unitsBatch);
											unitsBatch = [];
										}
									}
									if (unitsBatch.length > 0) {
										taskManager.addTask('main-engine');
										globalEngine.addUnits(unitsBatch);
									}
								} catch (e) {
									Logger.error('Translation', '动态追加翻译单元失败', e);
								}
							};
							extractAndAdd();
						}
					}
				}
			}
		};

		return {
			handleFabClick,
			checkAutoTranslate,
			clearAllTranslations,
			handleNewNodes,
			get isPseudoOff() { return stateManager.isPaused; },
			set isPseudoOff(val) { 
				if (val) stateManager.pause(); 
				else if (stateManager.isPaused) stateManager.stop(); 
			}
		};
	}

	/**
	 * 各种术语表变量
	 */
	const CUSTOM_GLOSSARIES_KEY = 'ao3_custom_glossaries';
	const IMPORTED_GLOSSARY_KEY = 'ao3_imported_glossary';
	const GLOSSARY_METADATA_KEY = 'ao3_glossary_metadata';
	const ONLINE_GLOSSARY_ORDER_KEY = 'ao3_online_glossary_order';
	const POST_REPLACE_STRING_KEY = 'ao3_post_replace_string';
	const POST_REPLACE_MAP_KEY = 'ao3_post_replace_map';
	const POST_REPLACE_RULES_KEY = 'ao3_post_replace_rules';
	const POST_REPLACE_SELECTED_ID_KEY = 'ao3_post_replace_selected_id';
	const POST_REPLACE_EDIT_MODE_KEY = 'ao3_post_replace_edit_mode';
	const LAST_SELECTED_GLOSSARY_KEY = 'ao3_last_selected_glossary_url';
	const GLOSSARY_RULES_CACHE_KEY = 'ao3_glossary_rules_cache';
	const GLOSSARY_STATE_VERSION_KEY = 'ao3_glossary_state_version';
	const GLOSSARY_RAW_TEXT_CACHE_KEY = 'ao3_glossary_raw_text_cache';

	/**
	 * 术语表引擎版本号
	 * 仅在修改了术语表底层解析逻辑（如分词算法、正则生成规则等）时，才手动递增此常量
	 */
	const GLOSSARY_ENGINE_VERSION = 1;

	/**
	 * 解析自定义的、非 JSON 格式的术语表文本
	 */
	function parseCustomGlossaryFormat(text) {
		const result = {
			metadata: {},
			terms: {},
			generalTerms: {},
			multiPartTerms: {},
			multiPartGeneralTerms: {},
			forbiddenTerms: [],
			regexTerms:[]
		};
		const lines = text.split('\n');

		const sectionHeaders = {
			TERMS:['terms', '词条'],
			GENERAL_TERMS: ['general terms', '通用词条'],
			FORBIDDEN_TERMS: ['forbidden terms', '禁翻词条'],
			REGEX_TERMS:['regex', '正则表达式']
		};

		const sections = [];
		let metadataLines =[];
		let inMetadata = true;

		for (let i = 0; i < lines.length; i++) {
			const trimmedLine = lines[i].trim().toLowerCase().replace(/[:：\s]*$/, '');
			let isHeader = false;
			for (const key in sectionHeaders) {
				if (sectionHeaders[key].includes(trimmedLine)) {
					sections.push({ type: key, start: i + 1 });
					isHeader = true;
					inMetadata = false;
					break;
				}
			}
			if (inMetadata && lines[i].trim()) {
				metadataLines.push(lines[i]);
			}
		}

		const metadataRegex = /^\s*(maintainer|version|last_updated|visibility|feedback|contact|维护者|版本号|更新时间|可见性|反馈方式|联系方式)\s*[:：]\s*(.*?)\s*[,，]?\s*$/i;
		for (const line of metadataLines) {
			const metadataMatch = line.match(metadataRegex);
			if (metadataMatch) {
				let key = metadataMatch[1].trim().toLowerCase();
				let value = metadataMatch[2].trim();
				const keyMap = { 
					'维护者': 'maintainer', '版本号': 'version', '更新时间': 'last_updated',
					'可见性': 'visibility', '反馈方式': 'feedback', '联系方式': 'feedback', 'contact': 'feedback'
				};
				const mappedKey = keyMap[key] || key;
				
				if (mappedKey === 'visibility') {
					result.metadata[mappedKey] = !/^(否|no|false|0)$/i.test(value);
				} else {
					result.metadata[mappedKey] = value;
				}
			}
		}

		const processLine = (line, target, multiPartTarget) => {
			const trimmedLine = line.trim();
			if (!trimmedLine || trimmedLine.startsWith('//')) return;

			const multiPartParts = trimmedLine.split(/[=＝]/, 2);
			if (multiPartParts.length === 2) {
				const key = multiPartParts[0].trim();
				const value = multiPartParts[1].trim().replace(/[,，]$/, '');
				if (key && value) multiPartTarget[key] = value;
				return;
			}

			const singleParts = trimmedLine.split(/[:：]/, 2);
			if (singleParts.length === 2) {
				const key = singleParts[0].trim();
				const value = singleParts[1].trim().replace(/[,，]$/, '');
				if (key && value) target[key] = value;
			}
		};

		for (let i = 0; i < sections.length; i++) {
			const section = sections[i];
			const end = (i + 1 < sections.length) ? sections[i + 1].start - 1 : lines.length;
			const sectionLines = lines.slice(section.start, end);

			for (const line of sectionLines) {
				const trimmedLine = line.trim();
				if (!trimmedLine || trimmedLine.startsWith('//')) continue;

				switch (section.type) {
					case 'TERMS':
						processLine(line, result.terms, result.multiPartTerms);
						break;
					case 'GENERAL_TERMS':
						processLine(line, result.generalTerms, result.multiPartGeneralTerms);
						break;
					case 'FORBIDDEN_TERMS':
						const term = trimmedLine.replace(/[,，]$/, '');
						if (term) result.forbiddenTerms.push(term);
						break;
					case 'REGEX_TERMS':
						const match = trimmedLine.match(/^(.+?)\s*[:：]\s*(.*)$/s);
						if (match) {
							const pattern = match[1].trim();
							const replacement = match[2].trim().replace(/[,，]$/, '');
							if (pattern) {
								result.regexTerms.push({ pattern, replacement });
							}
						}
						break;
				}
			}
		}

		if (!result.metadata.version) {
			throw new Error('文件格式错误：必须在文件头部包含 "版本号" 或 "version" 字段。');
		}
		if (Object.keys(result.terms).length === 0 && Object.keys(result.generalTerms).length === 0 &&
			Object.keys(result.multiPartTerms).length === 0 && Object.keys(result.multiPartGeneralTerms).length === 0 &&
			result.forbiddenTerms.length === 0 && result.regexTerms.length === 0) {
			throw new Error('文件格式错误：必须包含至少一个有效词条区域 (词条, 通用词条, 禁翻词条, 正则表达式)。');
		}

		return result;
	}

	/**
	 * 解析术语表 URL，提取仓库信息
	 */
	function parseGlossaryUrl(url) {
		let owner, repo, branch, filePath;
		let match = url.match(/^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(?:refs\/heads\/)?([^\/]+)\/(.+)$/);
		if (match) {
			owner = match[1]; repo = match[2]; branch = match[3]; filePath = match[4];
		} else {
			match = url.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@\/]+)@([^\/]+)\/(.+)$/);
			if (match) {
				owner = match[1]; repo = match[2]; branch = match[3]; filePath = match[4];
			}
		}
		
		if (owner && repo && branch && filePath) {
			const glossaryName = decodeURIComponent(filePath.split('/').pop().replace(/\.[^/.]+$/, ''));
			return {
				owner, repo, glossaryName,
				visitUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`,
				feedbackUrl: `https://github.com/${owner}/${repo}/issues/new?title=${encodeURIComponent(`[术语表反馈] ${glossaryName}`)}`
			};
		}
		return null;
	}

	/**
	 * 获取在线术语表的备用链接 (GitHub Raw <-> jsDelivr 双向转换)
	 */
	function getFallbackUrl(url) {
		try {
			const urlObj = new URL(url);
			const baseUrl = urlObj.origin + urlObj.pathname;
			const search = urlObj.search;

			let match;
			// GitHub Raw -> jsDelivr
			match = baseUrl.match(/^https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(?:refs\/heads\/)?([^\/]+)\/(.+)$/);
			if (match) {
				return `https://cdn.jsdelivr.net/gh/${match[1]}/${match[2]}@${match[3]}/${match[4]}${search}`;
			}
			// jsDelivr -> GitHub Raw
			match = baseUrl.match(/^https:\/\/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@\/]+)@([^\/]+)\/(.+)$/);
			if (match) {
				return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}${search}`;
			}
		} catch (e) {
			return null;
		}
		return null;
	}

	/**
	 * 带有超时控制和自动备用链接重试的网络请求包装器
	 */
	function fetchWithFallback(primaryUrl, options = {}) {
		const { timeout = 5000, method = 'GET', headers = {} } = options;
		const fallbackUrl = getFallbackUrl(primaryUrl);

		return new Promise((resolve, reject) => {
			const makeRequest = (url, isFallback) => {
				GM_xmlhttpRequest({
					method: method,
					url: url,
					headers: headers,
					timeout: timeout,
					onload: (res) => {
						if (res.status === 200) {
							resolve({ responseText: res.responseText, status: res.status, usedUrl: url, isFallback });
						} else {
							handleError(`HTTP ${res.status}`, isFallback);
						}
					},
					onerror: () => handleError('Network Error', isFallback),
					ontimeout: () => handleError('Timeout', isFallback)
				});
			};

			const handleError = (reason, isFallback) => {
				if (!isFallback && fallbackUrl) {
					Logger.warn('Network', `请求失败 (${reason}): ${primaryUrl}，正在尝试备用链接: ${fallbackUrl}`);
					makeRequest(fallbackUrl, true);
				} else {
					reject(new Error(reason));
				}
			};

			makeRequest(primaryUrl, false);
		});
	}

	/**
	 * GitHub 议题状态管理器
	 */
	const GitHubStatusManager = {
		CACHE_KEY: 'ao3_github_status_cache',
		EXPIRATION: 24 * 60 * 60 * 1000,
		pendingChecks: new Map(),

		async check(owner, repo, force = false) {
			const cache = GM_getValue(this.CACHE_KEY, {});
			const key = `${owner}/${repo}`;
			const now = Date.now();

			// 缓存有效且不强制刷新时，直接返回
			if (!force && cache[key] && (now - cache[key].timestamp < this.EXPIRATION)) {
				return cache[key].canUseIssues;
			}

			// 防止同一仓库并发发起多个请求
			if (this.pendingChecks.has(key)) {
				return this.pendingChecks.get(key);
			}

			const checkPromise = new Promise((resolve) => {
				GM_xmlhttpRequest({
					method: 'GET',
					url: `https://github.com/${owner}/${repo}/issues/new`,
					onload: (res) => {
						let canUse = false;
						// 状态 200 且未被重定向到登录页，说明已登录且启用了议题
						if (res.status === 200 && !(res.finalUrl && res.finalUrl.includes('/login'))) {
							canUse = true;
						}
						cache[key] = { canUseIssues: canUse, timestamp: Date.now() };
						GM_setValue(this.CACHE_KEY, cache);
						resolve(canUse);
					},
					onerror: () => resolve(false),
					ontimeout: () => resolve(false)
				});
			});

			this.pendingChecks.set(key, checkPromise);
			const result = await checkPromise;
			this.pendingChecks.delete(key);
			return result;
		},

		getSync(owner, repo) {
			const cache = GM_getValue(this.CACHE_KEY, {});
			const key = `${owner}/${repo}`;
			if (cache[key] && (Date.now() - cache[key].timestamp < this.EXPIRATION)) {
				return cache[key].canUseIssues;
			}
			return null;
		}
	};

	/**
	 * 从 GitHub 或 jsDelivr 导入在线术语表文件
	 */
	function importOnlineGlossary(url, options = {}) {
		const { silent = false } = options;

		return new Promise((resolve) => {
			if (!url || !url.trim()) {
				return resolve({ success: false, name: '未知', message: 'URL 不能为空。' });
			}

			const glossaryUrlRegex = /^(https:\/\/(raw\.githubusercontent\.com\/[^\/]+\/[^\/]+\/(?:refs\/heads\/)?[^\/]+|cdn\.jsdelivr\.net\/gh\/[^\/]+\/[^\/]+@[^\/]+)\/.+)$/;
			if (!glossaryUrlRegex.test(url)) {
				const message = "链接格式不正确。请输入一个有效的 GitHub Raw 或 jsDelivr 链接。";
				if (!silent) alert(message);
				return resolve({ success: false, name: url, message });
			}

			const filename = url.split('/').pop();
			const lastDotIndex = filename.lastIndexOf('.');
			const baseName = (lastDotIndex > 0) ? filename.substring(0, lastDotIndex) : filename;
			const glossaryName = decodeURIComponent(baseName);

			fetchWithFallback(url, { timeout: 5000 })
				.then(({ responseText, isFallback }) => {
					try {
						const onlineData = parseCustomGlossaryFormat(responseText);

						const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
						allImportedGlossaries[url] = {
							terms: onlineData.terms,
							generalTerms: onlineData.generalTerms,
							multiPartTerms: onlineData.multiPartTerms,
							multiPartGeneralTerms: onlineData.multiPartGeneralTerms,
							forbiddenTerms: onlineData.forbiddenTerms,
							regexTerms: onlineData.regexTerms
						};
						GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);

						const rawTextCache = GM_getValue(GLOSSARY_RAW_TEXT_CACHE_KEY, {});
						rawTextCache[url] = responseText;
						GM_setValue(GLOSSARY_RAW_TEXT_CACHE_KEY, rawTextCache);

						const parsedUrls = parseGlossaryUrl(url);
						if (parsedUrls) {
							GitHubStatusManager.check(parsedUrls.owner, parsedUrls.repo);
						}

						const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
						const existingMetadata = metadata[url] || {};
						metadata[url] = { ...existingMetadata, ...onlineData.metadata, last_imported: getShanghaiTimeString() };
						if (typeof metadata[url].enabled !== 'boolean') {
							metadata[url].enabled = true;
						}
						GM_setValue(GLOSSARY_METADATA_KEY, metadata);
						invalidateGlossaryCache();

						const importedCount = Object.keys(onlineData.terms).length + Object.keys(onlineData.generalTerms).length +
							Object.keys(onlineData.multiPartTerms).length + Object.keys(onlineData.multiPartGeneralTerms).length +
							onlineData.regexTerms.length;
						
						let message = `已成功导入 ${glossaryName} 术语表，共 ${importedCount} 个词条。版本号：v${onlineData.metadata.version || '未知'}，维护者：${onlineData.metadata.maintainer || '未知'}。`;
						if (isFallback) message += ' (通过备用链接下载)';

						if (!silent) {
							notifyAndLog(message, '导入成功');
						}

						GM_setValue(LAST_SELECTED_GLOSSARY_KEY, url);
						document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.GLOSSARY_IMPORTED));

						resolve({ success: true, name: glossaryName, message });

					} catch (e) {
						const message = `导入 ${glossaryName} 术语表失败：${e.message}`;
						if (!silent) notifyAndLog(message, '处理错误', 'error');
						resolve({ success: false, name: glossaryName, message });
					}
				})
				.catch((err) => {
					const message = `下载 ${glossaryName} 术语表失败！请检查网络连接或链接。(${err.message})`;
					if (!silent) notifyAndLog(message, '网络错误', 'error');
					resolve({ success: false, name: glossaryName, message });
				});
		});
	}

	/**
	 * 比较版本号的函数
	 */
	function compareVersions(v1, v2) {
		const cleanV1 = String(v1).replace(/[^\d.]/g, '');
		const cleanV2 = String(v2).replace(/[^\d.]/g, '');
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
	 * 检查术语表更新
	 */
	async function checkForGlossaryUpdates() {
		const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
		const urls = Object.keys(metadata);

		if (urls.length === 0) {
			return;
		}

		const updatePromises = urls.map(async (url) => {
			try {
				const separator = url.includes('?') ? '&' : '?';
				const urlWithCacheBust = url + separator + 't=' + Date.now();

				const { responseText } = await fetchWithFallback(urlWithCacheBust, { timeout: 5000 });

				const onlineData = parseCustomGlossaryFormat(responseText);
				const currentMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
				const localVersion = currentMetadata[url]?.version;
				const onlineVersion = onlineData.metadata.version;
				const glossaryName = decodeURIComponent(url.split('/').pop().replace(/\.[^/.]+$/, ''));

				if (!localVersion || compareVersions(onlineVersion, localVersion) > 0) {
					const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
					allImportedGlossaries[url] = {
						terms: onlineData.terms,
						generalTerms: onlineData.generalTerms,
						multiPartTerms: onlineData.multiPartTerms,
						multiPartGeneralTerms: onlineData.multiPartGeneralTerms,
						forbiddenTerms: onlineData.forbiddenTerms,
						regexTerms: onlineData.regexTerms
					};
					
					const rawTextCache = GM_getValue(GLOSSARY_RAW_TEXT_CACHE_KEY, {});
					rawTextCache[url] = responseText;
					GM_setValue(GLOSSARY_RAW_TEXT_CACHE_KEY, rawTextCache);

					currentMetadata[url] = { ...onlineData.metadata, last_updated: getShanghaiTimeString() };

					GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
					GM_setValue(GLOSSARY_METADATA_KEY, currentMetadata);
					invalidateGlossaryCache();

					Logger.info('Data', `术语表 ${glossaryName} 更新成功: v${localVersion} -> v${onlineVersion}`);
					GM_notification(`检测到术语表 ${glossaryName} 新版本，已自动更新至 v${onlineVersion} 。`, 'AO3 Translator');
				} else {
					Logger.info('Data', `术语表 ${glossaryName} 已是最新版本 (v${localVersion})`);
				}
			} catch (e) {
				Logger.warn('Data', `检查术语表更新失败 (${url})`, e.message);
			}
		});

		await Promise.allSettled(updatePromises);
	}

	/**
	 * 获取术语表规则，优先从缓存读取
	 */
	function getGlossaryRules() {
		const cache = GM_getValue(GLOSSARY_RULES_CACHE_KEY, null);
		const currentStateVersion = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);

		if (cache &&
			cache.version === currentStateVersion &&
			cache.engineVersion === GLOSSARY_ENGINE_VERSION &&
			cache.rules) {

			return cache.rules.map(rule => {
				if (rule.regex && typeof rule.regex === 'object' && rule.regex.source) {
					try {
						return { ...rule, regex: new RegExp(rule.regex.source, rule.regex.flags) };
					} catch (e) {
						return null;
					}
				}
				return rule;
			}).filter(Boolean);
		}

		Logger.info('Data', '缓存未命中、已失效或术语表引擎已更新，正在重建规则');
		return buildPrioritizedGlossaryMaps();
	}

	/**
	 * 获取已预处理并编译完成的术语表规则
	 */
	async function getPreparedGlossaryRules() {
		let currentStateVersion = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);
		if (runtimePreparedGlossaryCache && runtimePreparedGlossaryCache.version === currentStateVersion) {
			return runtimePreparedGlossaryCache.preparedRules;
		}
		Logger.info('Data', '二级缓存未命中，正在构建术语匹配策略');
		const rules = getGlossaryRules();
		currentStateVersion = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);
		const domRules = rules.filter(r => r.matchStrategy === 'dom');
		const regexStrategyRules = rules.filter(r => r.matchStrategy === 'regex');
		const executionPlan = [];
		let currentBatch = {
			flags: null,
			rules: []
		};
		const flushBatch = () => {
			if (currentBatch.rules.length === 0) return;
			const flags = currentBatch.flags;
			const combinedPattern = currentBatch.rules.map(r => {
				const source = r.regex.source;
				return `(${source})`;
			}).join('|');
			try {
				const combinedRegex = new RegExp(combinedPattern, flags);
				executionPlan.push({
					type: 'combined',
					regex: combinedRegex,
					rules: [...currentBatch.rules]
				});
			} catch (e) {
				Logger.error('Data', `合并正则失败: ${e.message}`);
			}
			currentBatch.rules = [];
			currentBatch.flags = null;
		};
		for (const rule of regexStrategyRules) {
			if (rule.type === 'regex') {
				flushBatch();
				executionPlan.push({
					type: 'single',
					rule: rule
				});
			} else {
				const flags = rule.regex.flags;
				if (currentBatch.rules.length > 0 && currentBatch.flags !== flags) {
					flushBatch();
				}
				currentBatch.flags = flags;
				currentBatch.rules.push(rule);
			}
		}
		flushBatch();
		const preparedRules = {
			domRules,
			executionPlan
		};
		runtimePreparedGlossaryCache = {
			version: currentStateVersion,
			preparedRules
		};
		return preparedRules;
	}

	/**
	 * 安全解析术语表键值对
	 */
	function parseGlossaryKeyValuePair(entry) {
		if (!entry) return null;
		let inQuote = false;
		let expectedCloseQuote = '';
		let splitIndex = -1;
		let separator = '';

		const quotePairs = {
			'"': '"',
			"'": "'",
			'“': '”',
			'‘': '’'
		};

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
				if (quotePairs.hasOwnProperty(char)) {
					inQuote = true;
					expectedCloseQuote = quotePairs[char];
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
	 * 构建并排序所有术语表规则
	 */
	function buildPrioritizedGlossaryMaps() {
		const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
		const glossaryMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
		const glossaryErrors = [];
		const localGlossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
		const onlineOrder = GM_getValue(ONLINE_GLOSSARY_ORDER_KEY, []);
		const orderedGlossaries = [];

		localGlossaries.forEach(g => {
			if (g.enabled !== false) {
				orderedGlossaries.push({ ...g, type: 'LOCAL', sourceName: g.name });
			}
		});

		const onlineUrls = Object.keys(allImportedGlossaries);
		const onlineUrlSet = new Set(onlineUrls);
		onlineOrder.forEach(url => {
			if (onlineUrlSet.has(url) && glossaryMetadata[url]?.enabled !== false) {
				orderedGlossaries.push({ ...allImportedGlossaries[url], type: 'ONLINE', sourceName: decodeURIComponent(url.split('/').pop()) });
				onlineUrlSet.delete(url);
			}
		});
		onlineUrlSet.forEach(url => {
			if (glossaryMetadata[url]?.enabled !== false) {
				orderedGlossaries.push({ ...allImportedGlossaries[url], type: 'ONLINE', sourceName: decodeURIComponent(url.split('/').pop()) });
			}
		});

		const validRules = [];
		const processedInsensitiveTerms = new Set();
		const processedSensitiveTerms = new Set();
		const termSeparatorRegex = /[\s-－﹣—–]+/;
		const translationSeparatorRegex = /[\s·・]+/;
		const quoteRegex = /["“‘'”’]/;

		const smartSplit = (str, regex) => {
			if (!quoteRegex.test(str)) return str.split(regex);
			const parts = [];
			let current = '';
			let inQuote = false;
			let currentQuote = '';
			for (let i = 0; i < str.length; i++) {
				const char = str[i];
				if (quoteRegex.test(char)) {
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
		};

		const sanitizeTranslation = (term, trans) => {
			if (!trans || !quoteRegex.test(term)) return trans;
			const match = trans.match(/^["“‘'](.*)["”’']$/);
			if (match) return match[1].trim();
			return trans;
		};

		const tryAddRule = (term, translation, glossaryIndex, sourceName, isSensitive, isForbidden, isRegex = false, isUnordered = false) => {
			let normalizedTerm = term.trim();
			if (!normalizedTerm) return;

			let isLiteral = false;

			const unquoted = smartUnquote(normalizedTerm);

			if (unquoted !== normalizedTerm) {
				isLiteral = true;
				normalizedTerm = unquoted.trim();
			}

			const sanitizedTrans = sanitizeTranslation(normalizedTerm, translation);

			const lowerTerm = normalizedTerm.toLowerCase();
			if (processedInsensitiveTerms.has(lowerTerm)) {
				return;
			}
			if (isSensitive) {
				if (processedSensitiveTerms.has(normalizedTerm)) {
					return;
				}
				processedSensitiveTerms.add(normalizedTerm);
			} else {
				processedInsensitiveTerms.add(lowerTerm);
			}
			let ruleObject;
			const lengthBonus = normalizedTerm.length;
			if (isRegex) {
				try {
					const testRegex = new RegExp(normalizedTerm);
					if (testRegex.test("")) {
						const msg = `术语表 "${sourceName}" 中的正则 "${normalizedTerm}" 匹配空字符串，已跳过以防止死循环。`;
						Logger.error('Data', msg);
						glossaryErrors.push(msg);
						return;
					}
				} catch (e) {
					const msg = `术语表 "${sourceName}" 中的正则 "${normalizedTerm}" 非法: ${e.message}`;
					Logger.error('Data', msg);
					glossaryErrors.push(msg);
					return;
				}
				ruleObject = {
					type: 'regex', matchStrategy: 'regex',
					regex: new RegExp(normalizedTerm, 'g'),
					replacement: translation,
					glossaryIndex, source: sourceName, originalTerm: `${normalizedTerm}:${translation}`,
					sortLength: lengthBonus, isSensitive
				};
			} else if (isLiteral) {
				const escaped = normalizedTerm.replace(/([.*+?^${}()|[\]\\])/g, '\\$&');
				const prefix = /^[a-zA-Z0-9]/.test(normalizedTerm) ? '\\b' : '';
				const suffix = /[a-zA-Z0-9]$/.test(normalizedTerm) ? '\\b' : '';
				const pattern = prefix + escaped + suffix;
				const flags = isSensitive ? 'g' : 'gi';
				ruleObject = {
					type: isForbidden ? 'forbidden' : 'term', matchStrategy: 'regex',
					regex: new RegExp(pattern, flags),
					replacement: isForbidden ? normalizedTerm : sanitizedTrans,
					glossaryIndex, source: sourceName, originalTerm: normalizedTerm,
					sortLength: lengthBonus, isSensitive
				};
			} else {
				const termParts = smartSplit(normalizedTerm, termSeparatorRegex);

				const termForms = termParts.map(part => {
					const partLiteralMatch = part.match(/^["“‘'](.*)["”’']$/);
					if (partLiteralMatch) {
						return new Set([partLiteralMatch[1].trim()]);
					}
					return Array.from(generateWordForms(part, { preserveCase: isForbidden, forceLowerCase: !isSensitive }));
				});

				ruleObject = {
					type: isForbidden ? 'forbidden' : 'term', matchStrategy: 'dom',
					parts: termForms,
					replacement: isForbidden ? termForms.map(partForms => Array.from(partForms)[0]).join(' ') : sanitizedTrans,
					glossaryIndex, isGeneral: !isSensitive, source: sourceName, originalTerm: normalizedTerm,
					isUnordered: isUnordered,
					sortLength: lengthBonus, isSensitive
				};
			}
			validRules.push(ruleObject);
		};

		const processEqualsSyntax = (term, translation, glossaryIndex, sourceName, isSensitive) => {
			tryAddRule(term, translation, glossaryIndex, sourceName, isSensitive, false, false, true);
			if (term.match(/^["“‘'](.*)["”’']$/)) return;
			const termParts = smartSplit(term, termSeparatorRegex);
			const transParts = smartSplit(translation, translationSeparatorRegex);
			if (termParts.length > 1 && termParts.length === transParts.length) {
				for (let i = 0; i < termParts.length; i++) {
					tryAddRule(termParts[i], transParts[i], glossaryIndex, sourceName, isSensitive, false, false, false);
				}
			}
		};

		const processStringRules = (rawString, glossaryIndex, sourceName, isSensitive, isForbidden) => {
			if (!rawString) return;
			const tokens = tokenizeQuoteAware(rawString, [',', '，']);

			tokens.forEach(token => {
				const entry = token.value.trim();
				if (!entry) return;

				if (isForbidden) {
					tryAddRule(entry, null, glossaryIndex, sourceName, isSensitive, true);
					return;
				}

				const parsed = parseGlossaryKeyValuePair(entry);
				if (parsed) {
					if (parsed.separator === '=') {
						processEqualsSyntax(parsed.key, parsed.value, glossaryIndex, sourceName, isSensitive);
					} else {
						tryAddRule(parsed.key, parsed.value, glossaryIndex, sourceName, isSensitive, false);
					}
				} else {
					const msg = `术语表 "${sourceName}" 中发现格式错误的词条: "${entry}"，请检查是否缺少冒号或等号。`;
					Logger.warn('Data', msg);
					glossaryErrors.push(msg);
				}
			});
		};

		orderedGlossaries.forEach((glossary, index) => {
			const sourceName = glossary.sourceName;

			if (glossary.forbidden) {
				processStringRules(glossary.forbidden, index, sourceName, true, true);
			}
			(glossary.forbiddenTerms || []).forEach(term => {
				tryAddRule(term, null, index, sourceName, true, true);
			});

			if (glossary.sensitive) {
				processStringRules(glossary.sensitive, index, sourceName, true, false);
			}
			Object.entries(glossary.terms || {}).forEach(([k, v]) => tryAddRule(k, v, index, sourceName, true, false));
			Object.entries(glossary.multiPartTerms || {}).forEach(([k, v]) => processEqualsSyntax(k, v, index, sourceName, true));

			if (glossary.insensitive) {
				processStringRules(glossary.insensitive, index, sourceName, false, false);
			}
			Object.entries(glossary.generalTerms || {}).forEach(([k, v]) => tryAddRule(k, v, index, sourceName, false, false));
			Object.entries(glossary.multiPartGeneralTerms || {}).forEach(([k, v]) => processEqualsSyntax(k, v, index, sourceName, false));

			(glossary.regexTerms || []).forEach(({ pattern, replacement }) => {
				tryAddRule(pattern, replacement, index, sourceName, true, false, true);
			});
		});

		validRules.sort((a, b) => {
			if (a.glossaryIndex !== b.glossaryIndex) {
				return a.glossaryIndex - b.glossaryIndex;
			}
			const typeScore = { 'forbidden': 100, 'term': 50, 'regex': 50 };
			const scoreA = typeScore[a.type] || 0;
			const scoreB = typeScore[b.type] || 0;
			if (scoreB !== scoreA) {
				return scoreB - scoreA;
			}
			if (b.sortLength !== a.sortLength) {
				return b.sortLength - a.sortLength;
			}
			return (b.isSensitive ? 1 : 0) - (a.isSensitive ? 1 : 0);
		});

		const currentStateVersion = generateGlossaryStateVersion();
		const serializedRules = validRules.map(rule => {
			if (rule.regex instanceof RegExp) {
				return { ...rule, regex: { source: rule.regex.source, flags: rule.regex.flags } };
			}
			return rule;
		});
		GM_setValue(GLOSSARY_RULES_CACHE_KEY, {
			version: currentStateVersion,
			engineVersion: GLOSSARY_ENGINE_VERSION,
			rules: serializedRules
		});
		Logger.info('Data', `术语表规则重建完成，当前版本: v${currentStateVersion}`);

		if (glossaryErrors.length > 0) {
			const summaryMsg = `术语表解析完成，发现 ${glossaryErrors.length} 处错误，请前往“调试模式与日志”查看详情。`;
			notifyAndLog(summaryMsg, 'AO3 Translator', 'error');
		}

		return validRules;
	}

	/**
	 * 为单个英文单词生成其常见词形变体
	 */
	function generateWordForms(baseTerm, options = {}) {
		const { preserveCase = false, forceLowerCase = false } = options;
		const forms = new Set();
		if (!baseTerm || typeof baseTerm !== 'string') {
			return forms;
		}
		forms.add(baseTerm);
		if (!/[a-zA-Z]$/.test(baseTerm)) {
			if (forceLowerCase) {
				forms.add(baseTerm.toLowerCase());
			}
			return forms;
		}
		const lowerBase = baseTerm.toLowerCase();
		let pluralEnding;
		let baseWithoutEnding = baseTerm;
		if (lowerBase.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lowerBase.slice(-2, -1))) {
			pluralEnding = 'ies';
			baseWithoutEnding = baseTerm.slice(0, -1);
		} else if (/[sxz]$/i.test(lowerBase) || /(ch|sh)$/i.test(lowerBase)) {
			pluralEnding = 'es';
		} else {
			pluralEnding = 's';
		}
		let pluralForm;
		if (preserveCase) {
			if (baseTerm === lowerBase) {
				pluralForm = baseWithoutEnding + pluralEnding;
			} else if (baseTerm === baseTerm.toUpperCase()) {
				pluralForm = (baseWithoutEnding + pluralEnding).toUpperCase();
			} else if (baseTerm.length > 0 && baseTerm[0] === baseTerm[0].toUpperCase() && baseTerm.slice(1) === baseTerm.slice(1).toLowerCase()) {
				const pluralBase = baseWithoutEnding + pluralEnding;
				pluralForm = pluralBase.charAt(0).toUpperCase() + pluralBase.slice(1).toLowerCase();
			} else {
				pluralForm = baseWithoutEnding + pluralEnding.toLowerCase();
			}
		} else {
			pluralForm = baseWithoutEnding + pluralEnding;
		}
		forms.add(pluralForm);
		if (forceLowerCase) {
			const lowerCaseForms = new Set();
			forms.forEach(form => lowerCaseForms.add(form.toLowerCase()));
			return lowerCaseForms;
		}
		return forms;
	}

	/**
	 * 解析“译文后处理替换”规则字符串为对象
	 */
	function parsePostReplaceString(rawInput) {
		const rules = {
			singleRules: {},
			multiPartRules: []
		};

		if (typeof rawInput !== 'string' || !rawInput.trim()) {
			return rules;
		}

		const internalSeparatorRegex = /[\s-－﹣—–]+/;
		const internalSeparatorGlobalRegex = /[\s-－﹣—–]+/g;

		rawInput.split(/[，,]/).forEach(entry => {
			const trimmedEntry = entry.trim();
			if (!trimmedEntry) return;

			const multiPartMatch = trimmedEntry.match(/^(.*?)\s*[=＝]\s*(.*?)$/);
			if (multiPartMatch) {
				const source = multiPartMatch[1].trim();
				const target = multiPartMatch[2].trim();

				if (source && target) {
					const sourceParts = source.split(internalSeparatorRegex);
					const targetParts = target.split(internalSeparatorRegex);
					const multiPartRule = {
						source: source.replace(internalSeparatorGlobalRegex, ' '),
						target: target.replace(internalSeparatorGlobalRegex, ' '),
						subRules: {}
					};

					if (sourceParts.length === targetParts.length && sourceParts.length > 1) {
						for (let i = 0; i < sourceParts.length; i++) {
							multiPartRule.subRules[sourceParts[i]] = targetParts[i];
						}
					}
					rules.multiPartRules.push(multiPartRule);
				}
			} else {
				const singlePartMatch = trimmedEntry.match(/^(.*?)\s*[:：]\s*(.+?)\s*$/);
				if (singlePartMatch) {
					const key = singlePartMatch[1].trim();
					const value = singlePartMatch[2].trim();
					if (key) {
						rules.singleRules[key] = value;
					}
				}
			}
		});

		return rules;
	}

	/**
	 * 译文后处理替换
	 */
	function applyPostTranslationReplacements(text) {
		const rulesList = GM_getValue(POST_REPLACE_RULES_KEY, []);

		if (!rulesList || rulesList.length === 0) {
			return text;
		}

		let processedText = text;

		for (const ruleConfig of rulesList) {
			if (!ruleConfig.enabled) continue;

			const rulesData = parsePostReplaceString(ruleConfig.content);
			const { singleRules = {}, multiPartRules = [] } = rulesData;
			const finalReplacementMap = {};

			multiPartRules.forEach(rule => {
				Object.assign(finalReplacementMap, rule.subRules);
			});

			Object.assign(finalReplacementMap, singleRules);

			multiPartRules.forEach(rule => {
				finalReplacementMap[rule.source] = rule.target;
			});

			const keys = Object.keys(finalReplacementMap);
			if (keys.length === 0) {
				continue;
			}

			const sortedKeys = keys.sort((a, b) => b.length - a.length);
			const regex = new RegExp(sortedKeys.map(key => key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'g');

			processedText = processedText.replace(regex, (matched) => finalReplacementMap[matched]);
		}

		return processedText;
	}

	/**
	 * 通用通知与日志函数
	 */
	function notifyAndLog(message, title = 'AO3 Translator', logType = 'info') {
		GM_notification(message, title);
		if (logType === 'error') {
			Logger.error('System', message);
		} else {
			Logger.info('System', message);
		}
	}

	/**
	 * sleepms 函数：延时。
	 */
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * 时间切片工具：用于在长耗时同步任务中主动让出主线程，避免阻塞 UI
	 */
	const TimeSlicer = {
		lastYieldTime: Date.now(),
		async yieldIfNeeded(maxExecutionTime = 15) {
			const now = Date.now();
			if (now - this.lastYieldTime > maxExecutionTime) {
				await new Promise(resolve => setTimeout(resolve, 0));
				this.lastYieldTime = Date.now();
			}
		},
		reset() {
			this.lastYieldTime = Date.now();
		}
	};

	/**
	 * 获取当前时间的上海时区格式化字符串
	 */
	function getShanghaiTimeString() {
		const now = new Date();
		const year = now.toLocaleString('en-US', { year: 'numeric', timeZone: 'Asia/Shanghai' });
		const month = now.toLocaleString('en-US', { month: '2-digit', timeZone: 'Asia/Shanghai' });
		const day = now.toLocaleString('en-US', { day: '2-digit', timeZone: 'Asia/Shanghai' });
		const time = now.toLocaleString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
			timeZone: 'Asia/Shanghai'
		});
		return `${year}-${month}-${day} ${time}`;
	}

	/**
	 * 根据术语表内容生成一个状态哈希
	 */
	function generateGlossaryStateVersion() {
		const current = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);
		const next = current + 1;
		GM_setValue(GLOSSARY_STATE_VERSION_KEY, next);
		return next;
	}

	/**
	 * 使术语表规则缓存失效
	 */
	function invalidateGlossaryCache() {
		GM_deleteValue(GLOSSARY_RULES_CACHE_KEY);
		generateGlossaryStateVersion();
		runtimePreparedGlossaryCache = null;
		Logger.info('Data', '术语表规则缓存已失效');
	}

	/**
	 * getNestedProperty 函数：获取嵌套属性的安全函数。
	 * @param {Object} obj - 需要查询的对象
	 * @param {string} path - 属性路径
	 * @returns {*} - 返回嵌套属性的值
	 */
	function getNestedProperty(obj, path) {
		if (!obj) return undefined;
		return path.split('.').reduce((acc, part) => {
			const match = part.match(/(\w+)(?:\[(\d+)\])?/);
			if (!match) return undefined;
			const key = match[1];
			const index = match[2];
			if (acc && typeof acc === 'object' && acc[key] !== undefined && acc[key] !== null) {
				return index !== undefined ? acc[key][index] : acc[key];
			}
			return undefined;
		}, obj);
	}

	/**
	 * 翻译文本处理函数：负责译文的净化、格式修复及标点守护
	 */
	const AdvancedTranslationCleaner = new (class {
		constructor() {
			this.metaKeywords = [
				'原文', '输出', '说明', '润色', '语境', '遵守', '指令',
				'Original text', 'Output', 'Note', 'Stage', 'Strategy', 'Polish', 'Retain', 'Glossary', 'Adherence'
			];
			this.junkLineRegex = new RegExp(`^\\s*(\\d+\\.\\s*)?(${this.metaKeywords.join('|')})[:：\\s]`, 'i');
			this.lineNumbersRegex = /^\d+\.\s*/;
			this.aiGenericExplanationRegex = /\s*[\uff08(](?:原文|译文|说明|保留|注释|译注|注)[:：\s][^\uff08\uff09()]*?[\uff09)]\s*/g;

			this.cjkIdeographs = '\\u4e00-\\u9fff\\u3400-\\u4dbf\\u2e80-\\u2eff\\uf900-\\ufaff';
			this.cjkSymbols = '\\u3000-\\u303f\\uff00-\\uffef\\u30fb';
			this.cjkTypoQuotes = '\\u2018-\\u201d\\u2026';
			this.cjkBoundaryChars = this.cjkIdeographs + this.cjkTypoQuotes;
			this.cjkAll = this.cjkBoundaryChars + this.cjkSymbols;

			this.trailingPunctuationRegex = /[.!?。！？\s]+$/;
		}

		smartStripPunctuation(translatedText, originalText = '') {
			if (!translatedText) return '';
			let cleaned = translatedText.trim();
			const origTrimmed = originalText ? originalText.trim() : '';
			if (!origTrimmed || !/[.!?。！？]$/.test(origTrimmed)) {
				cleaned = cleaned.replace(this.trailingPunctuationRegex, '');
			}
			return cleaned;
		}

		clean(text) {
			if (!text || typeof text !== 'string') return '';

			let cleanedText = text
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/\u00a0/g, ' ');

			cleanedText = cleanedText.split('\n').filter(line => !this.junkLineRegex.test(line)).join('\n');
			cleanedText = cleanedText.replace(this.lineNumbersRegex, '');
			cleanedText = cleanedText.replace(this.aiGenericExplanationRegex, '');
			cleanedText = cleanedText.replace(/(<(em|strong|span|b|i|u)[^>]*>)([\s\S]*?)(<\/\2>)/g, (_match, openTag, _tagName, content, closeTag) => {
				return openTag + content.trim() + closeTag;
			});

			const cjkBoundaryBlock = `[${this.cjkBoundaryChars}]`;
			const latinChar = `[a-zA-Z0-9_.-]`;
			const simpleFormattingTags = `</?(?:em|strong|span|b|i|u)>`;
			const cjkContext = `(?:[${this.cjkAll}]|${simpleFormattingTags})`;

			cleanedText = cleanedText.replace(new RegExp(`(${cjkBoundaryBlock})((?:${simpleFormattingTags})*)(${latinChar}+)`, 'g'), '$1$2 $3');
			cleanedText = cleanedText.replace(new RegExp(`(${latinChar}+)((?:${simpleFormattingTags})*)(${cjkBoundaryBlock})`, 'g'), '$1 $2$3');
			cleanedText = cleanedText.replace(/(“|‘|「|『)\s+/g, '$1');
			cleanedText = cleanedText.replace(/\s+(”|’|」|』)/g, '$1');
			cleanedText = cleanedText.replace(/\s+/g, ' ');

			const cjkSpaceRegex = new RegExp(`(${cjkContext})\\s+(?=${cjkContext})`, 'g');
			let prevText;
			do {
				prevText = cleanedText;
				cleanedText = cleanedText.replace(cjkSpaceRegex, '$1');
			} while (cleanedText !== prevText);

			return cleanedText.trim();
		}


		cleanTitle(translatedText, originalText) {
			if (!translatedText || typeof translatedText !== 'string') return '';
			let cleaned = this.smartStripPunctuation(translatedText, originalText);
			const origTrimmed = originalText ? originalText.trim() : '';
			if (!/^["'“‘「『]/.test(origTrimmed) && !/["'”’」』]$/.test(origTrimmed)) {
				cleaned = cleaned.replace(/^["'“‘「『]+|["'”’」』]+$/g, '');
			}

			return cleaned;
		}
	})();

	/**
	 * 通用后处理函数：处理块级元素末尾的孤立标点
	 */
	function handleTrailingPunctuation(rootElement = document) {
		const selectors = 'p, li, dd, blockquote, h1, h2, h3, h4, h5, h6, .summary, .notes';
		const punctuationMap = { '.': ' 。', '?': ' ？', '!': ' ！' };

		const elements = rootElement.querySelectorAll(`${selectors}:not([data-translated-by-custom-function])`);

		elements.forEach(el => {
			let lastMeaningfulNode = el.lastChild;

			while (lastMeaningfulNode) {
				if (lastMeaningfulNode.nodeType === Node.COMMENT_NODE ||
					(lastMeaningfulNode.nodeType === Node.TEXT_NODE && lastMeaningfulNode.nodeValue.trim() === '')) {
					lastMeaningfulNode = lastMeaningfulNode.previousSibling;
				} else {
					break;
				}
			}
			if (
				lastMeaningfulNode &&
				lastMeaningfulNode.nodeType === Node.TEXT_NODE
			) {
				const trimmedText = lastMeaningfulNode.nodeValue.trim();

				if (punctuationMap[trimmedText]) {
					lastMeaningfulNode.nodeValue = lastMeaningfulNode.nodeValue.replace(trimmedText, punctuationMap[trimmedText]);
					el.setAttribute('data-translated-by-custom-function', 'true');
				}
			}
		});
	}

	/**
	 * 通用函数：对页面上所有“分类”复选框区域进行重新排序。
	 */
	function reorderCategoryCheckboxes() {
		const containers = document.querySelectorAll('div[id$="_category_tagnames_checkboxes"]');

		containers.forEach(container => {
			if (container.dataset.reordered === 'true') {
				return;
			}

			const list = container.querySelector('ul.options');
			if (!list) return;

			const desiredOrder = ['F/F', 'F/M', 'Gen', 'M/M', 'Multi', 'Other'];
			const itemsMap = new Map();

			list.querySelectorAll('li').forEach(item => {
				const checkbox = item.querySelector('input[type="checkbox"]');
				if (checkbox) {
					itemsMap.set(checkbox.value, item);
				}
			});

			desiredOrder.forEach(value => {
				const itemToMove = itemsMap.get(value);
				if (itemToMove) {
					list.appendChild(itemToMove);
				}
			});

			container.dataset.reordered = 'true';
		});
	}

	/**
	 * 通用函数：重新格式化包含标准日期组件的元素。
	 * @param {Element} containerElement - 直接包含日期组件的元素
	 */
	function reformatDateInElement(containerElement) {
		if (!containerElement || containerElement.hasAttribute('data-reformatted')) {
			return;
		}
		const dayEl = containerElement.querySelector('abbr.day');
		const dateEl = containerElement.querySelector('span.date');
		const monthEl = containerElement.querySelector('abbr.month');
		const yearEl = containerElement.querySelector('span.year');

		if (!dayEl || !dateEl || !monthEl || !yearEl) {
			return;
		}

		// 翻译星期
		let dayFull = dayEl.getAttribute('title');
		dayFull = fetchTranslatedText(dayFull) || dayFull;

		// 翻译月份
		const monthText = monthEl.textContent;
		const translatedMonth = fetchTranslatedText(monthText) || monthText;

		// 格式化时间
		const timeEl = containerElement.querySelector('span.time');
		let formattedTime = '';
		if (timeEl) {
			const timeText = timeEl.textContent;
			const T = timeText.slice(0, -2);
			const ampm = timeText.slice(-2);
			if (ampm === 'PM') {
				formattedTime = '下午 ' + T;
			} else if (ampm === 'AM') {
				formattedTime = (T.startsWith('12') ? '凌晨 ' : '上午 ') + T;
			} else {
				formattedTime = timeText;
			}
		}

		// 提取时区
		const timezoneEl = containerElement.querySelector('abbr.timezone');
		const timezoneText = timezoneEl ? timezoneEl.textContent : 'UTC';

		// 替换内容
		const prefixNode = containerElement.firstChild;
		let prefixText = '';
		if (prefixNode && prefixNode.nodeType === Node.TEXT_NODE) {
			prefixText = prefixNode.nodeValue;
		}
		containerElement.innerHTML = '';
		if (prefixText) {
			containerElement.appendChild(document.createTextNode(prefixText));
		}
		containerElement.appendChild(document.createTextNode(`${yearEl.textContent}年${translatedMonth}${dateEl.textContent}日 ${dayFull} ${formattedTime} ${timezoneText}`));

		containerElement.setAttribute('data-reformatted', 'true');
	}

	/**
	 * 执行数据迁移，将旧版存储格式更新为新版
	 * 采用线性任务队列模式，确保迁移的顺序性、容错性和可扩展性
	 */
	function runDataMigration() {
		const CURRENT_MIGRATION_VERSION = 3;
		let savedVersion = GM_getValue('ao3_migration_version', 0);

		if (savedVersion >= CURRENT_MIGRATION_VERSION) {
			routineCleanup();
			return;
		}

		// 定义各版本的迁移任务
		const migrations =[
			{
				version: 1,
				name: 'V1 基础数据结构规范化',
				migrate: () => {
					// 1. 替换规则迁移
					const newRules = GM_getValue(POST_REPLACE_RULES_KEY, null);
					if (newRules === null) {
						const oldString = GM_getValue(POST_REPLACE_STRING_KEY, '');
						if (oldString) {
							const defaultRule = { id: `replace_${Date.now()}`, name: '默认', content: oldString, enabled: true };
							GM_setValue(POST_REPLACE_RULES_KEY,[defaultRule]);
							GM_setValue(POST_REPLACE_SELECTED_ID_KEY, defaultRule.id);
							GM_setValue(POST_REPLACE_EDIT_MODE_KEY, 'settings');
						} else {
							const postReplaceData = GM_getValue(POST_REPLACE_MAP_KEY, null);
							if (postReplaceData && typeof postReplaceData === 'object' && !postReplaceData.hasOwnProperty('singleRules')) {
								GM_setValue(POST_REPLACE_MAP_KEY, { singleRules: postReplaceData, multiPartRules:[] });
							}
						}
					}

					// 2. 本地术语表迁移
					const newGlossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, null);
					if (newGlossaries !== null) {
						let changed = false;
						newGlossaries.forEach(g => {
							if (typeof g.enabled === 'undefined') { g.enabled = true; changed = true; }
						});
						if (changed) GM_setValue(CUSTOM_GLOSSARIES_KEY, newGlossaries);
					} else {
						const oldGlossaryStr = GM_getValue('ao3_local_glossary_string', '');
						const oldForbiddenStr = GM_getValue('ao3_local_forbidden_string', '');
						let finalSensitive = oldGlossaryStr;
						if (!finalSensitive) {
							const oldGlossaryObj = GM_getValue('ao3_local_glossary') || GM_getValue('ao3_translation_glossary');
							if (oldGlossaryObj && typeof oldGlossaryObj === 'object') {
								finalSensitive = Object.entries(oldGlossaryObj).map(([k, v]) => `${k}:${v}`).join(', ');
							}
						}
						let finalForbidden = oldForbiddenStr;
						if (!finalForbidden) {
							const oldForbiddenArray = GM_getValue('ao3_local_forbidden_terms');
							if (Array.isArray(oldForbiddenArray)) finalForbidden = oldForbiddenArray.join(', ');
						}
						if (finalSensitive || finalForbidden) {
							const defaultGlossary = { id: `local_${Date.now()}`, name: '默认', sensitive: finalSensitive || '', insensitive: '', forbidden: finalForbidden || '', enabled: true };
							GM_setValue(CUSTOM_GLOSSARIES_KEY, [defaultGlossary]);
						}['ao3_local_glossary_string', 'ao3_local_forbidden_string', 'ao3_local_glossary', 'ao3_translation_glossary', 'ao3_local_forbidden_terms'].forEach(key => GM_deleteValue(key));
					}

					// 3. API Key 格式迁移
					const servicesToMigrate =['zhipu_ai', 'deepseek_ai', 'groq_ai', 'together_ai', 'cerebras_ai', 'modelscope_ai'];
					servicesToMigrate.forEach(serviceName => {
						const oldKeyName = `${serviceName.split('_')[0]}_api_key`;
						const newStringKey = `${serviceName}_keys_string`;
						const newArrayKey = `${serviceName}_keys_array`;
						const oldKeyValue = GM_getValue(oldKeyName);
						if (oldKeyValue && GM_getValue(newStringKey) === undefined) {
							GM_setValue(newStringKey, oldKeyValue);
							GM_setValue(newArrayKey, oldKeyValue.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean));
							GM_deleteValue(oldKeyName);
						}
					});

					const oldChatglmKey = GM_getValue('chatglm_api_key');
					if (oldChatglmKey && GM_getValue('zhipu_ai_keys_string') === undefined) {
						GM_setValue('zhipu_ai_keys_string', oldChatglmKey);
						GM_setValue('zhipu_ai_keys_array', [oldChatglmKey]);
						GM_deleteValue('chatglm_api_key');
					}

					const oldKeysArray = GM_getValue('google_ai_keys_array');
					const newKeysString = GM_getValue('google_ai_keys_string');
					if (Array.isArray(oldKeysArray) && !newKeysString) {
						GM_setValue('google_ai_keys_string', oldKeysArray.join(', '));
					}

					// 4. 模型名称迁移
					const modelKey = 'google_ai_model';
					const currentModel = GM_getValue(modelKey);
					const migrationMap = { 'gemini-2.5-flash': 'gemini-flash-latest', 'gemini-2.5-flash-lite': 'gemini-flash-lite-latest' };
					if (currentModel && migrationMap[currentModel]) {
						GM_setValue(modelKey, migrationMap[currentModel]);
					}
				}
			},
			{
				version: 2,
				name: 'V2 AI 参数与占位符规则升级',
				migrate: () => {
					// 1. 迁移旧版散装 AI 参数到 profile_default
					const oldKeys = {
						'custom_ai_system_prompt': 'system_prompt', 'custom_ai_user_prompt': 'user_prompt',
						'custom_ai_temperature': 'temperature', 'custom_ai_chunk_size': 'chunk_size',
						'custom_ai_para_limit': 'para_limit', 'custom_ai_request_rate': 'request_rate',
						'custom_ai_request_capacity': 'request_capacity', 'custom_ai_lazy_load_margin': 'lazy_load_margin',
						'custom_ai_validation_thresholds': 'validation_thresholds'
					};

					let profiles = GM_getValue(AI_PROFILES_KEY);
					if (Array.isArray(profiles)) {
						const defaultProfile = profiles.find(p => p.id === 'profile_default');
						let profilesChanged = false;
						if (defaultProfile) {
							for (const [oldKey, paramKey] of Object.entries(oldKeys)) {
								const oldVal = GM_getValue(oldKey);
								if (oldVal !== undefined && oldVal !== null) {
									defaultProfile.params[paramKey] = oldVal;
									profilesChanged = true;
									GM_deleteValue(oldKey);
								}
							}
						}
						if (profilesChanged) GM_setValue(AI_PROFILES_KEY, profiles);
					}

					// 2. 占位符规则迁移 (ph_ -> vtr_)
					const migratePrompt = (prompt) => {
						if (!prompt) return prompt;
						const numWord = PlaceholderConfig.length === 5 ? 'five' : (PlaceholderConfig.length === 6 ? 'six' : PlaceholderConfig.length);
						return prompt
							.replace(/ph_/g, PlaceholderConfig.prefix)
							.replace(/Ph_/g, PlaceholderConfig.prefix.charAt(0).toUpperCase() + PlaceholderConfig.prefix.slice(1))
							.replace(/P_/g, PlaceholderConfig.prefix.toUpperCase())
							.replace(/six digits/gi, `${numWord} digits`)
							.replace(/6 digits/gi, `${PlaceholderConfig.length} digits`)
							.replace(/123456/g, PlaceholderConfig.exampleString.replace(PlaceholderConfig.prefix, ''));
					};

					profiles = GM_getValue(AI_PROFILES_KEY);
					if (Array.isArray(profiles)) {
						let changed = false;
						profiles.forEach(p => {
							if (p.params) {
								if (p.params.system_prompt) { p.params.system_prompt = migratePrompt(p.params.system_prompt); changed = true; }
								if (p.params.user_prompt) { p.params.user_prompt = migratePrompt(p.params.user_prompt); changed = true; }
							}
						});
						if (changed) GM_setValue(AI_PROFILES_KEY, profiles);
					}
				}
			},
			{
				version: 3,
				name: 'V3 提示词格式、日志系统与新参数适配',
				migrate: () => {
					// 1. 迁移 System Prompt 格式 ([#id] 模式) 与 占位符校验阈值更新，补齐 reasoning_effort
					const oldDefaultThresholds = '10, 0.8, 10, 5';
					const newDefaultThresholds = '6, 0.5, 6, 3';

					const globalKey = 'custom_ai_validation_thresholds';
					if (GM_getValue(globalKey) === oldDefaultThresholds || GM_getValue(globalKey) === undefined) {
						GM_setValue(globalKey, newDefaultThresholds);
					}

					let profiles = GM_getValue(AI_PROFILES_KEY);
					if (Array.isArray(profiles)) {
						let profilesChanged = false;
						profiles.forEach(p => {
							if (p.params) {
								// 迁移 System Prompt 格式
								if (p.params.system_prompt) {
									let sp = p.params.system_prompt;
									
									// A. 替换任务描述
									const oldTaskDesc = /translate a numbered list of text segments provided by the user\. These segments can be anything from full paragraphs to single phrases or words\./gi;
									const newTaskDesc = 'translate multiple text segments provided by the user. For each segment,';
									sp = sp.replace(oldTaskDesc, newTaskDesc);

									// B. 替换输出格式指令
									const oldFormatInst = /- Your entire response MUST consist of \*only\* the polished translation from Stage 3, formatted as a numbered list that exactly matches the input's numbering\./gi;
									const newFormatInst = '- The input consists of multiple segments, each prefixed with an ID tag like [#0], [#1], etc.\n\t\t- Your entire response MUST consist of *only* the polished translations from Stage 3.\n\t\t- You MUST prefix each translated segment with its EXACT corresponding ID tag (e.g., [#0] Translated text...).';
									sp = sp.replace(oldFormatInst, newFormatInst);

									// C. 替换 Example Input 块
									const oldExampleBlock = /### Example Input:\s*1\. This is the <em>first<\/em> sentence\.\s*2\. ---\s*3\. Her name is (.*?)\.\s*4\. This is the fourth sentence\./gi;
									const newExampleBlock = '### Example Input:\n\t\t[#0] This is the <em>first</em> sentence.\n\t\t[#1] ---\n\t\t[#2] Her name is $1.';
									sp = sp.replace(oldExampleBlock, newExampleBlock);

									if (sp !== p.params.system_prompt) {
										p.params.system_prompt = sp;
										profilesChanged = true;
									}
								}

								// 更新校验阈值
								if (p.params.validation_thresholds === oldDefaultThresholds || p.params.validation_thresholds === undefined) {
									p.params.validation_thresholds = newDefaultThresholds;
									profilesChanged = true;
								}

								// 补齐 reasoning_effort
								if (p.params.reasoning_effort === undefined) {
									p.params.reasoning_effort = 'default';
									profilesChanged = true;
								}
							}
						});
						if (profilesChanged) GM_setValue(AI_PROFILES_KEY, profiles);
					}

					// 2. 迁移旧版调试模式开关到新的日志级别
					const oldDebugMode = GM_getValue('enable_debug_mode');
					if (oldDebugMode !== undefined) {
						GM_setValue('ao3_log_level', oldDebugMode ? 'INFO' : 'OFF');
						GM_deleteValue('enable_debug_mode');
					}

					// 3. 补齐历史日志缺少 timestampMs
					let logHistory = GM_getValue('ao3_log_history');
					if (Array.isArray(logHistory)) {
						let logsChanged = false;
						logHistory.forEach(entry => {
							if (entry.timestampMs === undefined) {
								const parsedTime = new Date(entry.timestamp).getTime();
								entry.timestampMs = isNaN(parsedTime) ? Date.now() : parsedTime;
								logsChanged = true;
							}
						});
						if (logsChanged) GM_setValue('ao3_log_history', logHistory);
					}

					// 4. 迁移 from_lang 的 'auto' 值为 'script_auto'
					if (GM_getValue('from_lang') === 'auto') {
						GM_setValue('from_lang', 'script_auto');
					}
				}
			}
		];

		// 线性执行迁移任务
		for (const task of migrations) {
			if (savedVersion < task.version) {
				try {
					task.migrate();
					savedVersion = task.version;
					GM_setValue('ao3_migration_version', savedVersion);
					Logger.info('System', `数据迁移成功: [v${task.version}] ${task.name}`);
				} catch (e) {
					Logger.error('System', `数据迁移失败: [v${task.version}] ${task.name}，已中断后续迁移`, e);
					break;
				}
			}
		}

		// 执行日常清理
		routineCleanup();
	}

	/**
	 * 日常清理逻辑：移除与默认值完全相同的冗余配置，保持存储干净
	 */
	function routineCleanup() {
		const keysToCheck =[
			{ key: 'enable_RegExp', default: DEFAULT_CONFIG.GENERAL.enable_RegExp },
			{ key: 'enable_transDesc', default: DEFAULT_CONFIG.GENERAL.enable_transDesc },
			{ key: 'enable_ui_trans', default: DEFAULT_CONFIG.GENERAL.enable_ui_trans },
			{ key: 'show_fab', default: DEFAULT_CONFIG.GENERAL.show_fab },
			{ key: 'ao3_log_level', default: DEFAULT_CONFIG.GENERAL.log_level },
			{ key: 'ao3_log_auto_clear', default: DEFAULT_CONFIG.GENERAL.log_auto_clear },
			{ key: 'translation_display_mode', default: DEFAULT_CONFIG.GENERAL.translation_display_mode },
			{ key: 'from_lang', default: DEFAULT_CONFIG.GENERAL.from_lang },
			{ key: 'to_lang', default: DEFAULT_CONFIG.GENERAL.to_lang },
			{ key: 'lang_detector', default: DEFAULT_CONFIG.GENERAL.lang_detector },
			{ key: 'transEngine', default: DEFAULT_CONFIG.ENGINE.current },
			{ key: 'custom_url_first_save_done', default: DEFAULT_CONFIG.GENERAL.custom_url_first_save_done },
			{ key: 'ao3_fab_actions', default: DEFAULT_CONFIG.GENERAL.fab_actions },
			{ key: 'ao3_cache_auto_cleanup_enabled', default: true }
		];

		let cleanedCount = 0;
		keysToCheck.forEach(item => {
			const currentValue = GM_getValue(item.key);
			if (currentValue !== undefined) {
				const isSame = typeof currentValue === 'object' 
					? JSON.stringify(currentValue) === JSON.stringify(item.default)
					: currentValue === item.default;
				
				if (isSame) {
					GM_deleteValue(item.key);
					cleanedCount++;
				}
			}
		});

		if (cleanedCount > 0) {
			Logger.info('System', `日常配置清理完成，移除了 ${cleanedCount} 个未修改的默认设置`);
		}
	}

	/**
	 * 获取统一的 Shadow DOM CSS 组件库
	 */
	function getUnifiedShadowCSS() {
		return `
			:host {
				--ao3-bg: #ffffff;
				--ao3-text: #000000DE;
				--ao3-text-secondary: #666666;
				--ao3-text-placeholder: #757575;
				--ao3-border: rgba(0, 0, 0, 0.20);
				--ao3-border-hover: rgba(0, 0, 0, 0.5);
				--ao3-primary: #1976d2;
				--ao3-danger: #d32f2f;
				--ao3-hover-bg: #f5f5f5;
				--ao3-selected-bg: #e3f2fd;
				--ao3-shadow: 0 8px 24px rgba(0,0,0,0.12);
				--ao3-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			}
			
			/* 1. 统一滚动条 */
			.ao3-custom-scrollbar::-webkit-scrollbar,
			.settings-panel-body::-webkit-scrollbar,
			.custom-dropdown-menu ul::-webkit-scrollbar,
			.settings-group textarea.settings-control::-webkit-scrollbar,
			.ao3-modal-body::-webkit-scrollbar { width: 4px; height: 4px; }
			
			.ao3-custom-scrollbar::-webkit-scrollbar-track,
			.settings-panel-body::-webkit-scrollbar-track,
			.custom-dropdown-menu ul::-webkit-scrollbar-track,
			.settings-group textarea.settings-control::-webkit-scrollbar-track,
			.ao3-modal-body::-webkit-scrollbar-track { background: transparent; }
			
			.ao3-custom-scrollbar::-webkit-scrollbar-thumb,
			.settings-panel-body::-webkit-scrollbar-thumb,
			.custom-dropdown-menu ul::-webkit-scrollbar-thumb,
			.settings-group textarea.settings-control::-webkit-scrollbar-thumb,
			.ao3-modal-body::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 3px; }

			/* 2. 统一弹窗组件 */
			.ao3-overlay {
				position: fixed; top: 0; left: 0; width: 100%; height: 100%;
				background-color: rgba(0, 0, 0, 0.5);
				z-index: 1000; 
				display: flex; align-items: center; justify-content: center;
				font-family: var(--ao3-font);
			}
			.ao3-modal {
				background-color: var(--ao3-bg); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
				width: 85%; max-width: 300px; overflow: hidden; display: flex; flex-direction: column;
				max-height: 85vh; color: var(--ao3-text);
			}
			
			/* 确认提示框 */
			#ao3-custom-confirm-modal {
				max-width: 360px !important;
			}
			#ao3-custom-confirm-modal.whitelist-auth-modal {
				max-width: 300px !important;
			}
			.ao3-modal-header {
				padding: 0 16px; border-bottom: none !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
				z-index: 5; background-color: var(--ao3-bg); display: flex; justify-content: center; align-items: center;
				position: relative; height: 42px; box-sizing: border-box; flex-shrink: 0;
			}
			.ao3-modal-header h3 { 
				margin: 0; font-size: 16px; font-weight: 600; color: var(--ao3-text); 
				font-family: Georgia, serif; 
			}
			.ao3-modal-body { padding: 8px 0; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
			
			/* 全局 footer 的阴影 */
			.ao3-modal-footer {
				padding: 0 16px; border-top: none !important; 
				box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
				z-index: 5; background-color: var(--ao3-bg); display: flex; flex-direction: row; justify-content: space-between; align-items: center;
				gap: 8px; height: 42px; box-sizing: border-box; flex-shrink: 0;
			}
			
			.ao3-modal-btn {
				flex: 1 1 0; padding: 6px 0; border-radius: 4px; 
				font-size: 14px;
				font-family: var(--ao3-font); 
				cursor: pointer; border: none; background: transparent !important; color: var(--ao3-text);
				transition: opacity 0.2s; white-space: nowrap; display: flex; justify-content: center; align-items: center;
				line-height: 1; -webkit-tap-highlight-color: transparent !important; outline: none !important; box-shadow: none !important;
			}
			
			.ao3-modal-btn:hover { opacity: 0.7; }

			/* 为“确认模态框”移除底栏阴影 */
			#ao3-custom-confirm-modal .ao3-modal-footer {
				box-shadow: none !important;
			}

			/* 3. 统一图标按钮 */
			.ao3-icon-btn {
				background: transparent !important; border: none !important; padding: 0; cursor: pointer;
				display: flex; align-items: center; justify-content: center; color: var(--ao3-primary);
				-webkit-tap-highlight-color: transparent !important; outline: none !important; box-shadow: none !important;
			}
			.ao3-icon-btn svg { width: 22px; height: 22px; fill: currentColor; opacity: 0.85; transition: opacity 0.2s; }
			.ao3-icon-btn:hover svg { opacity: 1; }
			.ao3-icon-btn:disabled { opacity: 0.5 !important; cursor: default; }
			.ao3-icon-btn.danger { color: var(--ao3-danger); }

			/* 4. 悬浮球样式 */
			#ao3-trans-fab-container { position: fixed; top: 0; left: 0; z-index: 100; touch-action: none; cursor: grab; user-select: none; }
			#ao3-trans-fab-container.dragging { cursor: grabbing; }
			#ao3-trans-fab { width: 42px; height: 42px; border-radius: 50%; background-color: #990000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); transition: all 0.3s ease; position: relative; }
			#ao3-trans-fab.christmas-mode::after { content: ''; position: absolute; top: 5px; left: 18px; width: 14px; height: 14px; background-image: var(--santa-hat-url); background-size: contain; background-repeat: no-repeat; transform: rotate(-3deg); filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.4)); pointer-events: none; z-index: 10; }
			#ao3-trans-fab-container.snapped:not(.is-active) #ao3-trans-fab { opacity: 0.3; }
			#ao3-trans-fab-container:hover #ao3-trans-fab { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25); }
			.fab-icon { width: 26px; height: 26px; background-image: var(--fab-icon-url); background-size: contain; background-repeat: no-repeat; background-position: center; filter: brightness(0) invert(1); }
			.fab-status-light { position: absolute; width: 6px; height: 6px; border-radius: 50%; border: 1px solid #ffffff; top: 50%; left: 50%; margin-top: -4px; margin-left: -4px; transform-origin: center; transition: background-color 0.3s ease; z-index: 11; pointer-events: none; display: none; transform: rotate(var(--light-angle, 0deg)) translateY(-21px) scale(1); }
			:host-context(.ao3-full-page-mode) .fab-status-light { display: block; }
			.fab-status-light.status-idle { background-color: #2196F3; }
			.fab-status-light.status-translating { background-color: #4CAF50; animation: fab-breathe 2.5s infinite ease-in-out; }
			.fab-status-light.status-retrying { background-color: #FFC107; animation: fab-breathe 2.5s infinite ease-in-out; }
			.fab-status-light.status-error { background-color: #F44336; }
			/* 隐藏状态灯 */
			.fab-status-light.hide-status-light { display: none !important; }

			/* 5. 设置面板样式 */
			#ao3-trans-settings-panel { display: none; position: fixed; z-index: 200; width: 300px; border-radius: 12px; overflow: hidden; flex-direction: column; max-height: 85vh; background-color: var(--ao3-bg); color: var(--ao3-text); border: none; box-shadow: var(--ao3-shadow); font-family: var(--ao3-font); }
			#ao3-trans-settings-panel.dragging { opacity: 0.8; transition: opacity 0.2s ease-in-out; }
			#ao3-trans-settings-panel.mobile-fixed-center { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; max-height: 90vh !important; }
			.settings-panel-header { padding: 0px 4px 0px 16px; border-bottom: none !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); z-index: 10; cursor: move; user-select: none; display: flex; justify-content: space-between; align-items: center; height: 42px; box-sizing: border-box; flex-shrink: 0; background-color: var(--ao3-bg); }
			.settings-panel-header-title { display: flex; align-items: center; gap: 8px; }
			.settings-panel-header-title h2 { margin: 0; font-size: 16px; font-weight: bold; font-family: inherit; }
			.settings-panel-header-title .home-icon-link { display: flex; align-items: center; justify-content: center; text-decoration: none; margin: 0 !important; padding: 0 !important; height: 24px !important; width: 24px !important; min-width: 24px !important; }
			.settings-panel-header-title .home-icon-link svg { width: 24px; height: 24px; fill: var(--ao3-text) !important; display: block !important; margin: 0 !important; padding: 0 !important; }
			.settings-panel-close-btn { cursor: pointer; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: rgba(0, 0, 0, 0.54); outline: none !important; box-shadow: none !important; -webkit-tap-highlight-color: transparent; }
			.settings-panel-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; min-height: 0; }
			.editable-section { display: none; flex-direction: column; gap: 16px; width: 100%; }
			#local-edit-container-translation { display: flex; flex-direction: column; gap: 16px; }
			.settings-switch-group { display: flex; justify-content: space-between; align-items: center; padding: 0; }
			.settings-panel-body > .settings-switch-group:first-child { padding-left: 14px; padding-right: 7px; }
			.settings-panel-body > .settings-switch-group:first-child .settings-label { font-size: 15px; }
			.settings-switch-group .settings-label { font-size: 13px; font-weight: 400; color: var(--ao3-text); }
			.settings-switch { position: relative; display: inline-block; width: 44px; height: 24px; -webkit-tap-highlight-color: transparent; outline: none; }
			.settings-switch input { opacity: 0; width: 0; height: 0; }
			.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; -webkit-tap-highlight-color: transparent; outline: none; }
			.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
			input:checked + .slider { background-color: #209CEE; }
			input:checked + .slider:before { transform: translateX(20px); }
			.settings-group { position: relative; }
			.settings-group.ao3-trans-control-disabled { pointer-events: none; opacity: 1 !important; }
			.settings-group .settings-control { -webkit-appearance: none; appearance: none; width: 100%; height: 40px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--ao3-border); font-size: 15px; font-family: inherit; box-sizing: border-box; line-height: 40px; min-width: 0; transition: border-color 0.2s ease; background-color: var(--ao3-bg); color: var(--ao3-text); outline: none; }
			.settings-group textarea.settings-control { height: 72px !important; min-height: 72px !important; max-height: 72px !important; line-height: 1.5; padding-top: 8px; padding-bottom: 8px; resize: none; }
			.settings-group .settings-control:hover:not(:disabled) { border-color: var(--ao3-border-hover); }
			.settings-group .settings-control:focus { border-color: var(--ao3-border-hover); border-width: 1px; }
			.settings-group .settings-control:disabled { opacity: 1; border-color: var(--ao3-border); color: var(--ao3-text-secondary); -webkit-text-fill-color: var(--ao3-text-secondary); }
			.settings-group .settings-control::placeholder { color: var(--ao3-text-placeholder); -webkit-text-fill-color: var(--ao3-text-placeholder); }
			.settings-group .settings-label { position: absolute; top: 50%; transform: translateY(-50%); left: 12px; font-size: 14px; color: var(--ao3-text-secondary); pointer-events: none; transition: all 0.2s ease; padding: 0 4px; background-color: var(--ao3-bg); }
			.settings-group .settings-control:focus + .settings-label, .settings-group .settings-control.has-value + .settings-label { top: 0; left: 10px; font-size: 12px; color: var(--ao3-text-secondary); }
			.settings-group .settings-control:not(:focus).has-value + .settings-label { color: var(--ao3-text-secondary); }
			.settings-group.static-label .settings-label { top: 0; left: 10px; font-size: 12px; transform: translateY(-50%); color: var(--ao3-text-secondary); }
			.settings-group.static-label .settings-control { line-height: normal; padding-top: 4px; padding-bottom: 4px; height: 40px; }
			.settings-group.settings-group-select .settings-control.settings-select { padding-right: 40px; }
			.settings-group.settings-group-select::after { content: ''; position: absolute; right: 14px; top: 20px; transform: translateY(-50%) rotate(0deg); width: .65em; height: .65em; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-5-1.9-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: center; background-size: contain; pointer-events: none; }
			.settings-group.settings-group-select.dropdown-active::after { transform: translateY(-50%) rotate(180deg); }
			.input-wrapper { position: relative; }
			.input-wrapper .settings-input { padding-right: 52px; }
			#ai-param-input-area .input-wrapper textarea.settings-input { padding-right: 12px; }
			input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
			input[type=number] { -moz-appearance: textfield; }
			.settings-action-button-inline { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--ao3-primary); font-size: 14px; font-weight: 500; cursor: pointer; padding: 4px; display: flex; align-items: center; outline: none; -webkit-tap-highlight-color: transparent; }
			.data-sync-actions-container { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; margin-top: -10px; margin-bottom: -10px; overflow: visible; }
			.data-sync-action-btn { background: none; border: none; color: var(--ao3-primary); font-size: 13px; font-weight: 500; cursor: pointer; padding: 2px 4px; text-align: center; outline: none; -webkit-tap-highlight-color: transparent; }
			.language-swap-container { display: flex; align-items: center; gap: 2px; }
			.language-swap-container .settings-group { flex: 1; min-width: 0; }
			#swap-lang-btn { background: transparent; border: none; cursor: pointer; font-size: 14px; color: var(--ao3-text-secondary); opacity: 0.7; padding: 0 4px; line-height: 1; transition: all 0.2s ease; flex-shrink: 0; outline: none; -webkit-tap-highlight-color: transparent; }
			#swap-lang-btn:hover:not(:disabled) { opacity: 1; color: var(--ao3-primary); }
			#swap-lang-btn:disabled { color: var(--ao3-text-secondary); opacity: 0.3; cursor: default; }
			.service-details-toggle-container { display: flex; justify-content: center; align-items: center; height: 0; width: 12.5%; margin: -8px auto; z-index: 10; overflow: visible; cursor: pointer; position: relative; outline: none; -webkit-tap-highlight-color: transparent; }
			.service-details-toggle-container::before { content: ""; position: absolute; top: -15px; bottom: -15px; left: 0; right: 0; }
			.service-details-toggle-btn { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid var(--ao3-primary); border-top: 0; transition: transform 0.3s ease; }
			.service-details-toggle-btn.collapsed { transform: rotate(180deg); }
			.pseudo-select { cursor: pointer; height: 40px; line-height: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none; display: flex; align-items: center; outline: none; -webkit-tap-highlight-color: transparent; }
			
			/* 6. 下拉菜单 */
			.custom-dropdown-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; z-index: 2000; }
			.custom-dropdown-menu { position: fixed; border-radius: 8px; border: none; z-index: 2001; overflow: hidden; opacity: 0; transform: scale(0.95) translateY(-10px); transform-origin: top center; transition: opacity 0.15s ease-out, transform 0.15s ease-out; box-sizing: border-box; background-color: var(--ao3-bg); color: var(--ao3-text); box-shadow: var(--ao3-shadow); }
			.custom-dropdown-menu.visible { opacity: 1; transform: scale(1) translateY(0); }
			.custom-dropdown-menu ul { list-style: none; margin: 0; padding: 8px 0; max-height: 250px; overflow-y: auto; }
			.custom-dropdown-menu li { padding: 8px 16px; margin: 10px 0; border-radius: 4px; min-height: 34px; height: 34px; box-sizing: border-box; cursor: pointer; font-size: 15px; transition: background-color 0.2s ease; display: flex; justify-content: space-between; align-items: center; gap: 8px; background: transparent; color: var(--ao3-text); border: none; }
			.custom-dropdown-menu li:hover { background-color: var(--ao3-hover-bg); }
			.custom-dropdown-menu li.selected { background-color: var(--ao3-selected-bg); }
			.custom-dropdown-menu li .item-text { white-space: nowrap; overflow: hidden; text-overflow: clip; flex-grow: 1; line-height: 1; }
			.custom-dropdown-menu li .item-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
			.item-action-btn { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: transparent !important; border: none !important; padding: 0; cursor: pointer; outline: none !important; box-shadow: none !important; -webkit-tap-highlight-color: transparent; }
			.item-action-btn svg { width: 22px !important; height: 22px !important; fill: var(--ao3-primary) !important; opacity: 0.8; transition: all 0.2s ease; display: block; }
			.item-action-btn.is-disabled svg { fill: var(--ao3-text-placeholder) !important; opacity: 0.5; }
			.item-action-btn.delete[data-confirming="true"] svg { fill: var(--ao3-danger) !important; opacity: 1; }
			.custom-dropdown-menu li.drag-placeholder { opacity: 0.3 !important; background: var(--ao3-border) !important; border: 1px dashed var(--ao3-text-secondary) !important; color: transparent !important; }
			.custom-dropdown-menu li.drag-placeholder * { visibility: hidden !important; }
			.custom-dropdown-menu.small-menu ul { padding: 0; }
			.custom-dropdown-menu.small-menu li { padding: 2px 8px; font-size: 11px; min-height: 18px; height: 18px; }
			.custom-dropdown-menu.small-menu li .item-text { font-size: 11px; line-height: 1.2; }
			.custom-dropdown-menu.small-menu li .ao3-icon-btn svg { width: 14px; height: 14px; }

			/* 7. 拖拽占位符 */
			.drag-ghost { position: fixed !important; z-index: 2002 !important; box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important; opacity: 1 !important; pointer-events: none !important; transition: none !important; list-style: none !important; border-radius: 4px !important; cursor: grabbing !important; white-space: nowrap !important; overflow: hidden !important; box-sizing: border-box !important; margin: 0 !important; border: none !important; display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 8px 16px !important; font-size: 15px !important; font-family: var(--ao3-font) !important; background-color: var(--ao3-bg) !important; color: var(--ao3-text) !important; }
			.drag-ghost .item-text { flex-grow: 1 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: clip !important; }
			.drag-ghost .item-actions { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; }
			:host-context(body.ao3-dragging-active) { cursor: grabbing !important; user-select: none !important; }
			:host-context(body.ao3-dragging-active) .custom-dropdown-menu { pointer-events: none !important; }

			/* 8. 底栏详情信息 (在线术语表、缓存管理) */
			.online-glossary-details { width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--ao3-text); padding: 4px 12px; min-height: 32px; overflow: hidden; box-sizing: border-box; }
			#online-glossary-details-container, #cache-manage-details-container { margin-top: -10px; margin-bottom: -10px; }
			#online-glossary-info { flex-grow: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; min-width: 0; }
			.online-glossary-delete-btn { flex-shrink: 0; background: none; border: none; color: var(--ao3-primary); font-size: 13px; font-weight: 500; cursor: pointer; padding: 2px 4px; text-align: right; outline: none; -webkit-tap-highlight-color: transparent; }
			.online-glossary-delete-btn[data-confirming="true"] { color: var(--ao3-danger) !important; }

			/* 9. 数据选择与服务关联模态框 */
			#ai-service-modal, 
			#ao3-data-selection-modal, 
			#ao3-library-modal, 
			#ao3-glossary-view-modal {
				max-width: 300px !important; 
			}
			#ai-service-list, #ao3-data-selection-modal .ao3-modal-body {
				max-height: 300px;
				padding: 4px 0;
			}
			.ai-service-item, .data-selection-item {
				height: 32px;
				box-sizing: border-box;
				padding: 0 16px;
				display: flex; 
				align-items: center;
				gap: 12px;
				cursor: pointer; 
				transition: background-color 0.2s;
				-webkit-tap-highlight-color: transparent;
				justify-content: flex-start;
			}
			.ai-service-item:hover, .data-selection-item:hover { background-color: var(--ao3-hover-bg); }
			.ai-service-label, .data-item-label { font-size: 14px; font-weight: 400; color: var(--ao3-text); margin: 0; }
			.ai-service-item input, .data-selection-item input { margin: 0; cursor: pointer; width: 16px; height: 16px; }
			
			.ai-select-all-btn, .data-select-all-wrapper {
				font-size: 13px; color: var(--ao3-primary); cursor: pointer; user-select: none;
				position: absolute; right: 16px;
				-webkit-tap-highlight-color: transparent !important;
				outline: none !important; box-shadow: none !important;
			}

			/* 10. 导出功能 */
			.export-format-item { height: 32px; box-sizing: border-box; padding: 0 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background-color 0.2s; }
			.export-format-item:hover { background-color: var(--ao3-hover-bg); }
			.export-format-item input { width: 18px; height: 18px; cursor: pointer; margin: 0; }
			.export-format-item span { font-size: 15px; color: var(--ao3-text); }
			
			#ao3-export-style-modal { max-width: 360px !important; width: 85%; height: 80vh; }
			.style-editor-textarea { width: 100%; height: 100%; resize: none; border: none; outline: none; padding: 12px; font-family: monospace; font-size: 13px; background: var(--ao3-bg); color: var(--ao3-text); box-sizing: border-box; }

			/* 深色模式 */
			@media (prefers-color-scheme: dark) {
				/* 全局变量 */
				:host {
					--ao3-bg: #1e1e1e;
					--ao3-text: #e0e0e0;
					--ao3-text-secondary: #a0a0a0;
					--ao3-text-placeholder: #666666;
					--ao3-border: rgba(255, 255, 255, 0.20);
					--ao3-border-hover: rgba(255, 255, 255, 0.5);
					--ao3-primary: #64b5f6;
					--ao3-danger: #e57373;
					--ao3-hover-bg: rgba(255, 255, 255, 0.08);
					--ao3-selected-bg: rgba(100, 181, 246, 0.16);
					--ao3-shadow: 0 8px 24px rgba(0,0,0,0.5);
				}

				/* 1. 滚动条 */
				.ao3-custom-scrollbar::-webkit-scrollbar-thumb,
				.settings-panel-body::-webkit-scrollbar-thumb,
				.custom-dropdown-menu ul::-webkit-scrollbar-thumb,
				.settings-group textarea.settings-control::-webkit-scrollbar-thumb,
				.ao3-modal-body::-webkit-scrollbar-thumb { 
					background: rgba(255, 255, 255, 0.15); 
				}

				/* 2. 弹窗组件 */
				.ao3-modal-header { 
					box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) !important; 
				}
				.ao3-modal-footer { 
					box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.05) !important; 
				}
				.ao3-modal-btn { 
					color: #ffffff; 
				}

				/* 5. 设置面板 */
				.settings-panel-header { 
					box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) !important; 
				}
				.settings-panel-close-btn { 
					color: rgba(255, 255, 255, 0.7) !important; 
				}

				/* 表单控件 */
				.settings-group.settings-group-select::after { 
					background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-5-1.9-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E'); 
				}
			}
		`;
	}

	/**
	 * 初始化 Shadow DOM
	 */
	function initShadowDOM() {
		if (shadowHost) return;

		shadowHost = document.createElement('div');
		shadowHost.id = 'ao3-translator-host';
		shadowHost.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; overflow: visible; pointer-events: none;';
		document.body.appendChild(shadowHost);

		shadowRoot = shadowHost.attachShadow({ mode: 'open' });

		const style = document.createElement('style');
		style.textContent = getUnifiedShadowCSS();
		shadowRoot.appendChild(style);

		shadowWrapper = document.createElement('div');
		shadowWrapper.id = 'ao3-translator-ui-wrapper';
		shadowWrapper.className = 'notranslate';
		shadowWrapper.style.pointerEvents = 'auto';
		shadowRoot.appendChild(shadowWrapper);

		protectSelectAllShadowRoot(shadowHost, shadowWrapper);
	}

	/**
	 * 保护 Shadow DOM 全选逻辑
	 */
	function protectSelectAllShadowRoot(host, wrapper) {
		let pointerInside = false;
		host.addEventListener("pointerenter", () => pointerInside = true);
		host.addEventListener("pointerleave", () => pointerInside = false);

		window.addEventListener("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && !e.shiftKey) {
				const active = document.activeElement;

				if (host.contains(active)) return;
				if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
				if (active && active.shadowRoot) return;

				if (pointerInside) {
					e.preventDefault();
					e.stopPropagation();
					requestAnimationFrame(() => {
						const sel = window.getSelection();
						if (!sel) return;
						sel.removeAllRanges();
						const range = document.createRange();
						range.selectNodeContents(wrapper);
						sel.addRange(range);
					});
					return;
				}

				if (active === document.body || !active) {
					e.preventDefault();
					e.stopPropagation();
					requestAnimationFrame(() => {
						const sel = window.getSelection();
						if (!sel) return;
						sel.removeAllRanges();
						const before = document.createRange();
						before.setStart(document.body, 0);
						before.setEndBefore(host);
						const after = document.createRange();
						after.setStartAfter(host);
						after.setEnd(document.body, document.body.childNodes.length);
						sel.addRange(before);
						sel.addRange(after);
					});
				}
			}
		}, true);
	}

	/**
	 * 注入全局样式
	 */
	function initGlobalStyles() {
		const styles = `
            .autocomplete.dropdown p.notice { margin-bottom: 0; }
            .ao3-text-block, .ao3-original-content { display: inline; }
            .ao3-translated-content { display: block; color: inherit; margin-top: 1.5em; margin-bottom: 0; }
            body.ao3-translation-only .ao3-original-content { display: none !important; }
            body.ao3-translation-only .ao3-translated-content { margin-top: 0 !important; }
            .ao3-text-block:has(> .ao3-translated-content) + br { display: none; }
            body:not(.ao3-translation-only) .ao3-text-block:has(> .ao3-translated-content):has(+ br) .ao3-translated-content { margin-bottom: 1.5em; }
            body:not(.ao3-translation-only) .ao3-text-block:has(> .ao3-translated-content):has(+ br + br) .ao3-translated-content { margin-bottom: 0; }
            .ao3-tag-translation { margin-left: 6px; opacity: 0.9; display: inline; color: inherit; }
            body.ao3-translation-only .ao3-tag-translation { margin-left: 0; }
            .ao3-tag-original { display: inline; }
			body.ao3-translation-only [data-translation-state="translated"] > .ao3-tag-original { display: none !important; }
            .ao3-translated-title { display: block; margin-top: 0.5em; }
			body.ao3-translation-only [data-translation-state="translated-title"] > .ao3-original-title { display: none !important; }
            body.ao3-translation-only .ao3-translated-title { margin-top: 0 !important; }
            li.post .userstuff { margin-bottom: 15px; }
            li.post .userstuff .ao3-translated-content { margin-bottom: 0; }
            .translate-me-ao3-wrapper { border: none; background: transparent; box-shadow: none; margin-top: 15px; margin-bottom: 5px; clear: both; display: block; }
            .translate-me-ao3-button { color: #1b95e0; font-size: small; cursor: pointer; display: inline-block; margin-left: 10px; }
            .translated-tags-container { margin-top: 15px; margin-bottom: 10px; }
            .collection.profile .primary.header.module .translate-me-ao3-wrapper, .collection.home .primary.header.module .translate-me-ao3-wrapper { clear: none !important; margin-left: 120px !important; margin-top: 15px !important; width: auto !important; }
            p.kudos { line-height: 1.5; }
            .retry-translation-button { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; margin-left: 8px; cursor: pointer; color: #1b95e0; -webkit-tap-highlight-color: transparent; user-select: none; }
            .retry-translation-button:hover { color: #0d8bd9; }
            .retry-translation-button:active { opacity: 0.7; }
            .retry-translation-button svg { width: 18px; height: 18px; fill: currentColor; }
            li.blurb ul.tags li, dl.meta dd ul.tags li, ul.tags.commas li { display: inline; }
            
            /* 屏蔽器样式 */
            .ao3-blocker-hidden { display: none !important; }
            .ao3-blocker-work { padding: 0 !important; min-height: auto !important; }
            .ao3-blocker-fold {
                display: flex !important; flex-direction: row !important;
                justify-content: space-between !important; align-items: center !important;
                padding: 0.6em 1em !important; background: transparent !important;
                border: none !important; box-shadow: none !important; opacity: 1 !important;
                width: 100% !important; box-sizing: border-box !important;
            }
            .ao3-blocker-note {
                font-size: 13px !important; color: inherit !important;
                font-style: normal !important; font-weight: normal !important;
                flex: 1 !important; margin-right: 10px !important; word-break: break-all !important;
            }
            .ao3-blocker-toggle {
                padding: 4px !important; margin: 0 !important; background: transparent !important;
                border: none !important; box-shadow: none !important; color: inherit !important;
                cursor: pointer !important; display: flex !important; align-items: center !important;
                justify-content: center !important; user-select: none !important; flex-shrink: 0 !important;
                outline: none !important;
            }
            .ao3-blocker-toggle svg { width: 20px; height: 20px; fill: currentColor; cursor: pointer; }
            .ao3-blocker-cut { display: none !important; }
            .ao3-blocker-unhide > .ao3-blocker-fold {
                border-bottom: 1px solid currentColor !important;
                border-bottom-color: rgba(127, 127, 127, 0.25) !important; margin-bottom: 0 !important;
            }
            .ao3-blocker-unhide > .ao3-blocker-cut { display: block !important; padding: 10px !important; }
        `;
		GM_addStyle(styles);
	}

	/**
	 * 初始化快速屏蔽功能 (Alt + Click)
	 */
	function initQuickBlockFeature() {
		document.addEventListener('click', (e) => {
			if (!e.altKey || e.button !== 0) return;

			const link = e.target.closest('a');
			if (!link) return;

			let added = false;
			const href = link.getAttribute('href');
			const text = link.textContent.trim();

			if (href && /\/works\/\d+$/.test(href)) {
				const idMatch = href.match(/\/works\/(\d+)$/);
				if (idMatch) {
					addBlockRule('ao3_blocker_content_id', idMatch[1]);
					added = true;
				}
			} else if (link.rel && link.rel.includes('author')) {
				addBlockRule('ao3_blocker_content_author', text);
				added = true;
			} else if (link.classList.contains('tag')) {
				addBlockRule('ao3_blocker_tags_black', `'${text}'`);
				added = true;
			}

			if (added) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				link.style.pointerEvents = 'none';
				setTimeout(() => { link.style.pointerEvents = ''; }, 100);
				SettingsSyncManager.syncBlocker('incremental');
			}
		}, true);
	}

	/**
	 * 脚本主入口
	 */
	function main() {
		// 环境检查
		if (window.top !== window.self) return;
		if (window.ao3_translator_running) {
			Logger.warn('System', '检测到脚本重复执行，已拦截');
			return;
		}
		window.ao3_translator_running = true;

		// 全局异常捕获
		window.addEventListener('error', (event) => {
			Logger.error('System', '未捕获的全局异常', {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				stack: event.error ? event.error.stack : null
			});
		});

		window.addEventListener('unhandledrejection', (event) => {
			Logger.error('System', '未处理的 Promise 拒绝', {
				reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unknown'
			});
		});

		// 基础数据与样式初始化
		Logger.init(); 
		Logger.info('System', `插件初始化开始，版本：v${GM_info.script.version}`);
		normalizeAllApiKeys();
		// 初始化 Shadow DOM
		initShadowDOM();
		ProfileManager.init();
		FormattingManager.init();
		// 初始化翻译缓存数据库，并在后台触发自动清理
		TranslationCacheDB.init().then(() => {
			TranslationCacheDB.autoCleanup();
		});
		runDataMigration();
		updateBlockerCache();
		checkForGlossaryUpdates();
		initGlobalStyles();

		// UI 组件初始化
		const fabElements = createFabUI();
		const statusLightController = new FabStatusLight(fabElements.fabContainer, fabElements.statusLight);
		const panelElements = createSettingsPanelUI();
		const handlePanelClose = () => fabLogic?.retractFab();
		const panelLogic = initializeSettingsPanelLogic(panelElements, () => rerenderMenu(), handlePanelClose);
		const fabLogic = initializeFabInteraction(fabElements, panelLogic, statusLightController);

		// 交互功能初始化
		initQuickBlockFeature();

		// 初始化整页翻译控制器
		const fullPageController = createFullPageTranslationController({ statusLightController });

		// 翻译业务调度
		updatePageConfig('初始载入');
		if (pageConfig.currentPageType) {
			if (FeatureSet.enable_ui_trans) {
				transTitle();
				transBySelector();
				traverseNode(document.body);
				runHighPriorityFunctions();
			}
			scanAllWorks();
			fabLogic.toggleFabVisibility();

			// 根据当前模式决定执行哪种翻译逻辑
			const currentMode = GM_getValue('ao3_translation_mode', 'unit');
			if (currentMode === 'full_page') {
				fullPageController.checkAutoTranslate();
			} else if (FeatureSet.enable_transDesc) {
				setTimeout(transDesc, 1000);
			}
		}

		// 菜单与监听器启动
		const rerenderMenu = setupMenuCommands(fabLogic, panelLogic);
		rerenderMenu();
		watchUpdate(fabLogic, fullPageController);

		// 监听自定义事件
		document.addEventListener(CUSTOM_EVENTS.MODE_CHANGED, (e) => {
			const newMode = e.detail.mode;
			FeatureSet.enable_transDesc = GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
			fullPageController.clearAllTranslations();

			if (newMode === 'full_page') {
				fullPageController.checkAutoTranslate();
			} else {
				if (FeatureSet.enable_transDesc) {
					transDesc();
				}
			}
		});

		document.addEventListener(CUSTOM_EVENTS.AUTO_TRANSLATE_CHANGED, (e) => {
			const isEnabled = e.detail.enabled;
			if (isEnabled) {
				fullPageController.checkAutoTranslate();
			} else {
				fullPageController.clearAllTranslations();
			}
		});

		document.addEventListener(CUSTOM_EVENTS.FAB_CLICKED, () => {
			if (fullPageController) {
				fullPageController.handleFabClick();
			}
		});
	}

	/**
	 * 监视页面变化
	 */
	function watchUpdate(fabLogic, fullPageController) {
		let previousURL = window.location.href;

		const handleUrlChange = () => {
			const currentURL = window.location.href;
			if (currentURL !== previousURL) {
				previousURL = currentURL;
				updatePageConfig('URL变化');

				if (FeatureSet.enable_ui_trans) {
					transTitle();
					transBySelector();
					traverseNode(document.body);
					runHighPriorityFunctions();
				}

				scanAllWorks();
				fabLogic.toggleFabVisibility();

				const currentMode = GM_getValue('ao3_translation_mode', 'unit');
				if (currentMode === 'full_page') {
					fullPageController.isPseudoOff = false;
					fullPageController.checkAutoTranslate();
				} else if (FeatureSet.enable_transDesc) {
					transDesc();
				}
			}
		};

		const dirtyNodes = new Set();
		let hasNewBlurbs = false;
		let isUiUpdateScheduled = false;

		const processBlockerQueue = debounce(() => {
			if (BlockerCache.enabled && hasNewBlurbs) {
				checkWorksSynchronously();
				hasNewBlurbs = false;
			}
		}, 200);

		const processUiQueue = async () => {
			if (dirtyNodes.size === 0) return;

			const rawNodes =[...dirtyNodes];
			dirtyNodes.clear();
			isUiUpdateScheduled = false;

			// 1. 提取有效的 Element 节点
			const scopeNodes = new Set();
			rawNodes.forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					scopeNodes.add(node);
				} else if (node.parentElement) {
					scopeNodes.add(node.parentElement);
				}
			});

			// 2. 过滤嵌套节点，只保留最外层
			const rootNodes =[];
			const scopeArray =[...scopeNodes].filter(el => document.documentElement.contains(el));
			
			for (let i = 0; i < scopeArray.length; i++) {
				let isChild = false;
				for (let j = 0; j < scopeArray.length; j++) {
					if (i !== j && scopeArray[j].contains(scopeArray[i])) {
						isChild = true;
						break;
					}
				}
				if (!isChild) {
					rootNodes.push(scopeArray[i]);
				}
			}

			const currentMode = GM_getValue('ao3_translation_mode', 'unit');
			
			// 获取当前格式化配置，判断是否需要清理缩进
			const currentProfile = FormattingManager.getCurrentProfile();

			TimeSlicer.reset();

			// 3. 仅对最外层节点执行处理
			for (let i = 0; i < rootNodes.length; i++) {
				const scopeNode = rootNodes[i];

				splitBrParagraphs(scopeNode);
				cleanManualIndents(scopeNode);

				if (FeatureSet.enable_ui_trans) {
					traverseNode(scopeNode);
					transBySelector(scopeNode);
					runHighPriorityFunctions(scopeNode);
				}

				if (currentMode === 'full_page') {
					fullPageController.handleNewNodes(scopeNode);
				} else if (FeatureSet.enable_transDesc) {
					transDesc(scopeNode);
				}

				await TimeSlicer.yieldIfNeeded(15);
			}

			fabLogic.toggleFabVisibility();
		};

		const observer = new MutationObserver(mutations => {
			handleUrlChange();
			if (window.location.href !== previousURL) return;

			let needsUiUpdate = false;

			for (const mutation of mutations) {

				if (mutation.target.nodeType === Node.ELEMENT_NODE) {
					const el = mutation.target;
					if (
						el.classList.contains('ao3-translated-content') ||
						el.classList.contains('translate-me-ao3-wrapper') ||
						el.classList.contains('ao3-tag-translation')
					) {
						continue;
					}
				}

				if (BlockerCache.enabled && mutation.type === 'childList') {
					for (const node of mutation.addedNodes) {
						if (node.nodeType === 1 && (node.classList.contains('blurb') || node.querySelector('li.blurb'))) {
							hasNewBlurbs = true;
							processBlockerQueue();
							break;
						}
					}
				}

				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach(node => {
						// 获取用于判断的 Element 节点
						const checkNode = node.nodeType === 1 ? node : node.parentElement;
						
						if (checkNode) {
							// 将所有插件生成的包裹类名加入忽略列表
							if (checkNode.classList && (
								checkNode.classList.contains('ao3-translated-content') ||
								checkNode.classList.contains('ao3-original-content') ||
								checkNode.classList.contains('ao3-translated-title') ||
								checkNode.classList.contains('ao3-original-title') ||
								checkNode.classList.contains('ao3-tag-translation') ||
								checkNode.classList.contains('ao3-tag-original'))) return;
								
							// 忽略插件自身 UI 元素的 DOM 插入
							if (checkNode.closest && checkNode.closest('#ao3-trans-settings-panel, #ao3-trans-fab-container, .custom-dropdown-menu, .custom-dropdown-backdrop, #ao3-data-selection-overlay, #ao3-custom-confirm-overlay, #ai-service-overlay, .translated-by-ao3-translator-error')) {
								return;
							}
						}
						dirtyNodes.add(node);
					});
					if (dirtyNodes.size > 0) needsUiUpdate = true; 
				} else if (
					mutation.type === 'attributes' ||
					(mutation.type === 'characterData' && pageConfig.characterData)
				) {
					if (mutation.target === document.body && mutation.attributeName === 'class') {
						return; 
					}

					if (mutation.target.nodeType === 1 && mutation.target.closest && mutation.target.closest('#ao3-trans-settings-panel, #ao3-trans-fab-container')) {
						continue;
					}
					dirtyNodes.add(mutation.target);
					needsUiUpdate = true;
				}
			}

			if (needsUiUpdate && !isUiUpdateScheduled) {
				isUiUpdateScheduled = true;
				queueMicrotask(processUiQueue);
			}
		});

		observer.observe(document.documentElement, {
			...CONFIG.OBSERVER_CONFIG,
			subtree: true
		});
	}

	/**
	 * 辅助函数：集中调用所有高优先级专用函数
	 * @param {HTMLElement} [rootElement=document] - 扫描范围
	 */
	function runHighPriorityFunctions(rootElement = document) {
		if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
			return;
		}

		// 1. 局部可执行的规则
		const innerHTMLRules = pageConfig.innerHTMLRules ||[];
		if (innerHTMLRules.length > 0) {
			innerHTMLRules.forEach(rule => {
				if (!Array.isArray(rule) || rule.length !== 3) return;
				const [selector, regex, replacement] = rule;
				try {
					rootElement.querySelectorAll(selector).forEach(el => {
						if (el.hasAttribute('data-translated-by-custom-function')) return;
						if (pageConfig.ignoreSelectors && el.closest(pageConfig.ignoreSelectors)) return;
						if (regex.test(el.innerHTML)) {
							el.innerHTML = el.innerHTML.replace(regex, replacement);
							el.setAttribute('data-translated-by-custom-function', 'true');
						}
					});
				} catch (e) { /* 忽略无效的选择器 */ }
			});
		}

		const kudosDiv = rootElement.querySelector('#kudos');
		if (kudosDiv && !kudosDiv.dataset.kudosObserverAttached) {
			translateKudosSection();
		}

		handleTrailingPunctuation(rootElement);
		translateHeadingTags();

		// 统一寻找并重新格式化所有日期容器
		const dateSelectors =[
			'.header.module .meta span.published',
			'li.collection .summary p:has(abbr.day)',
			'.comment .posted.datetime',
			'.comment .edited.datetime',
			'dd.datetime',
			'p:has(> span.datetime)',
			'p.caution.notice > span:has(abbr.day)',
			'p.notice > span:has(abbr.day)',
			'div.flash.notice span.datetime',
		];
		rootElement.querySelectorAll(dateSelectors.join(', ')).forEach(reformatDateInElement);

		// 2. 拦截全局查询
		const isGlobal = rootElement === document;
		const isModal = rootElement.id === 'modal' || (rootElement.closest && rootElement.closest('#modal'));
		const isMain = rootElement.id === 'main' || (rootElement.closest && rootElement.closest('#main'));
		const isTosPrompt = rootElement.id === 'tos_prompt' || (rootElement.closest && rootElement.closest('#tos_prompt'));
		
		if (!isGlobal && !isModal && !isMain && !isTosPrompt) {
			return; 
		}

		// 仅在页面初次加载或弹窗打开时执行
		translateSymbolsKeyModal();
		translateFirstLoginBanner();
		translateBookmarkSymbolsKeyModal();
		translateRatingHelpModal();
		translateCategoriesHelp();
		translateRelationshipsHelp();
		translateCharactersHelp();
		translateAdditionalTagsHelp();
		translateCollectionsHelp();
		translateRecipientsHelp();
		translateParentWorksHelp();
		translateChoosingSeriesHelp();
		translateBackdatingHelp();
		translateLanguagesHelp();
		translateWorkSkins();
		translateRegisteredUsers();
		translateCommentsModerated();
		translateFandomHelpModal();
		translateWhoCanComment();
		translateWorkImportTroubleshooting();
		translateEncodingHelp();
		translatePrivacyPreferences();
		translateDisplayPreferences();
		translateSkinsBasics();
		translateWorkTitleFormat();
		translateCommentPreferences();
		translateCollectionPreferences();
		translateMiscPreferences();
		translateTagFiltersIncludeTags();
		translateTagFiltersExcludeTags();
		translateBookmarkFiltersIncludeTags();
		translateWorkSearchTips();
		translateChapterTitleHelpModal();
		translateActionButtons();
		translateSortButtons();
		translateBookmarkFiltersExcludeTags();
		translateSearchResultsHeader();
		translateWorkSearchResultsHelp();
		translateSkinsApprovalModal();
		translateSkinsCreatingModal();
		translateSkinsConditionsModal();
		translateSkinsParentsModal();
		translateSkinsWizardFontModal();
		translateSkinsWizardFontSizeModal();
		translateSkinsWizardVerticalGapModal();
		translateSkinsWizardAccentColorModal();
		translateCollectionNameHelpModal();
		translateIconAltTextHelpModal();
		translatePseudIconCommentHelpModal();
		translateCollectionModeratedHelpModal();
		translateCollectionClosedHelpModal();
		translateTagSearchResultsHelp();
		translateChallengeAnyTips();
		translateOptionalTagsHelp();
		translateBookmarkSearchTips();
		translateWarningHelpModal();
		translateHtmlHelpModal();
		translateRteHelpModal();
		translateBookmarkSearchResultsHelpModal();
		translateTagsetAboutModal();
		translateFlashMessages();
		translateTagSetsHeading();
		translateFoundResultsHeading();
		translateTOSPrompt();

		// 根据当前页面类型，调用页面专属的翻译和处理函数
		const pageType = pageConfig.currentPageType;

		if (pageType === 'about_page') translateAboutPage();
		if (pageType === 'diversity_statement') translateDiversityStatement();
		if (pageType === 'donate_page') translateDonatePage();
		if (pageType === 'tag_sets_new' || pageType === 'collections_dashboard_common') reorderCategoryCheckboxes();
		if (pageType === 'front_page') translateFrontPageIntro();
		if (pageType === 'invite_requests_index') translateInvitationRequestsPage();
		if (pageType === 'error_too_many_requests') translateTooManyRequestsPage();
		if (pageType === 'works_search') {
			translateWorkSearchDateTips();
			translateWorkSearchCrossoverTips();
			translateWorkSearchNumericalTips();
			translateWorkSearchLanguageTips();
			translateWorkSearchTagsTips();
		}
		if (pageType === 'people_search') translatePeopleSearchTips();
		if (pageType === 'bookmarks_search') {
			translateBookmarkSearchWorkTagsTips();
			translateBookmarkSearchTypeTips();
			translateBookmarkSearchDateUpdatedTips();
			translateBookmarkSearchBookmarkerTagsTips();
			translateBookmarkSearchRecTips();
			translateBookmarkSearchNotesTips();
			translateBookmarkSearchDateBookmarkedTips();
		}
		if (pageType === 'tags_search') translateTagSearchTips();
		if (pageType === 'users_stats') translateStatsChart();
	}

	/**
	 * 更新页面设置
	 */
	function updatePageConfig() {
		const newType = detectPageType();
		if (newType && newType !== pageConfig.currentPageType) {
			pageConfig = buildPageConfig(newType);
		} else if (!pageConfig.currentPageType && newType) {
			pageConfig = buildPageConfig(newType);
		}
	}

	const TranslationMemory = new Map();

	/**
	 * 构建页面设置 pageConfig 对象
	 */
	function buildPageConfig(pageType = pageConfig.currentPageType) {
		const inheritanceMap = {
			'admin_posts_index': 'admin_posts_show'
		};
		const effectivePageType = inheritanceMap[pageType] || pageType;

		const baseStatic = I18N[CONFIG.LANG]?.public?.static || {};
		const baseRegexp = I18N[CONFIG.LANG]?.public?.regexp || [];
		const baseSelector = I18N[CONFIG.LANG]?.public?.selector || [];
		const baseInnerHTMLRegexp = I18N[CONFIG.LANG]?.public?.innerHTML_regexp || [];
		const globalFlexible = (effectivePageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.flexible || {});

		const usersCommonStatic = (pageType.startsWith('users_') || pageType === 'profile' || pageType === 'dashboard')
			? I18N[CONFIG.LANG]?.users_common?.static || {}
			: {};

		const pageStatic = I18N[CONFIG.LANG]?.[effectivePageType]?.static || {};
		const pageRegexp = I18N[CONFIG.LANG]?.[effectivePageType]?.regexp || [];
		const pageSelector = I18N[CONFIG.LANG]?.[effectivePageType]?.selector || [];
		const pageInnerHTMLRegexp = I18N[CONFIG.LANG]?.[effectivePageType]?.innerHTML_regexp || [];
		let pageFlexible = (effectivePageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.[effectivePageType]?.flexible || {});

		const parentPageMap = {
			'works_edit': 'works_new',
			'works_edit_tags': 'works_new',
			'chapters_new': 'works_new',
			'chapters_edit': 'chapters_new',
			'works_edit_multiple': 'works_new',
			'skins_edit': 'skins'
		};

		const parentPageType = parentPageMap[pageType];
		let extraStatic = {}, extraRegexp = [], extraSelector = [], extraInnerHTMLRegexp = [], extraFlexible = {};

		if (parentPageType) {
			const parentConfig = I18N[CONFIG.LANG]?.[parentPageType];
			if (parentConfig) {
				const parentFullConfig = buildPageConfig(parentPageType);
				extraStatic = parentFullConfig.staticDict;
				extraRegexp = parentFullConfig.regexpRules;
				extraSelector = parentFullConfig.tranSelectors;
				extraInnerHTMLRegexp = parentFullConfig.innerHTMLRules;
				extraFlexible = { ...parentFullConfig.globalFlexibleDict, ...parentFullConfig.pageFlexibleDict };
			}
		}

		const mergedStatic = { ...baseStatic, ...usersCommonStatic, ...extraStatic, ...pageStatic };
		const mergedRegexp = [...pageRegexp, ...extraRegexp, ...baseRegexp];
		const mergedSelector = [...pageSelector, ...extraSelector, ...baseSelector];

		const mergedInnerHTMLRegexp = [...pageInnerHTMLRegexp, ...extraInnerHTMLRegexp, ...baseInnerHTMLRegexp].sort((a, b) => {
			const getLength = (r) => {
				return (r[1] instanceof RegExp) ? r[1].source.length : String(r[1]).length;
			};
			return getLength(b) - getLength(a);
		});

		const mergedPageFlexible = { ...extraFlexible, ...pageFlexible };

		const compileFlexibleRegex = (dict) => {
			const keys = Object.keys(dict);
			if (keys.length === 0) return null;
			const regexParts = keys.map(key => {
				const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				return /^[\w\s]+$/.test(key) ? `\\b${escapedKey}\\b` : escapedKey;
			});
			return new RegExp(`(${regexParts.join('|')})`, 'g');
		};

		if (typeof TranslationMemory !== 'undefined') {
			TranslationMemory.clear();
		}

		return {
			currentPageType: pageType,
			staticDict: mergedStatic,
			regexpRules: mergedRegexp,
			innerHTMLRules: mergedInnerHTMLRegexp,
			globalFlexibleDict: globalFlexible,
			globalFlexibleRegex: compileFlexibleRegex(globalFlexible),
			pageFlexibleDict: mergedPageFlexible,
			pageFlexibleRegex: compileFlexibleRegex(mergedPageFlexible),
			ignoreMutationSelectors: [
				...(I18N.conf.ignoreMutationSelectorPage['*'] || []),
				...(I18N.conf.ignoreMutationSelectorPage[pageType] || [])
			].join(', ') || ' ',
			ignoreSelectors: [
				...(I18N.conf.ignoreSelectorPage['*'] || []),
				...(I18N.conf.ignoreSelectorPage[pageType] || [])
			].join(', ') || ' ',
			characterData: I18N.conf.characterDataPage.includes(pageType),
			tranSelectors: mergedSelector,
		};
	}

	/**
	 * 页面类型检测
	 */
	function detectPageType() {
		if (document.title.includes("You're clicking too fast!")) {
			const h2 = document.querySelector('main h2');
			if (h2 && h2.textContent.includes('Too many page requests too quickly')) {
				return 'error_too_many_requests';
			}
		}

		if (document.querySelector('ul.media.fandom.index.group')) return 'media_index';
		if (document.querySelector('div#main.owned_tag_sets-show')) return 'owned_tag_sets_show';
		const { pathname } = window.location;
		if (pathname.startsWith('/first_login_help')) {
			return false;
		}
		if (pathname === '/abuse_reports/new' || pathname === '/support') return 'report_and_support_page';
		if (pathname === '/known_issues') return 'known_issues_page';
		if (pathname === '/tos') return 'tos_page';
		if (pathname === '/content') return 'content_policy_page';
		if (pathname === '/privacy') return 'privacy_policy_page';
		if (pathname === '/dmca') return 'dmca_policy_page';
		if (pathname === '/tos_faq') return 'tos_faq_page';
		if (pathname === '/abuse_reports/new') return 'abuse_reports_new';
		if (pathname === '/support') return 'support_page';
		if (pathname === '/diversity') return 'diversity_statement';
		if (pathname === '/site_map') return 'site_map';
		if (pathname.startsWith('/wrangling_guidelines')) return 'wrangling_guidelines_page';
		if (pathname === '/donate') return 'donate_page';
		if (pathname.startsWith('/faq')) return 'faq_page';
		if (pathname === '/help/skins-basics.html') return 'help_skins_basics';
		if (pathname === '/help/tagset-about.html') return 'help_tagset_about';
		if (pathname === '/tag_sets') return 'tag_sets_index';
		if (pathname === '/external_works/new') return 'external_works_new';

		if (pathname === '/invite_requests' || pathname === '/invite_requests/status') return 'invite_requests_index';

		const isSearchResultsPage = document.querySelector('h2.heading')?.textContent.trim() === 'Search Results';
		if (pathname === '/works/search') {
			return isSearchResultsPage ? 'works_search_results' : 'works_search';
		}
		if (pathname === '/people/search') {
			return isSearchResultsPage ? 'people_search_results' : 'people_search';
		}
		if (pathname === '/bookmarks/search') {
			return isSearchResultsPage ? 'bookmarks_search_results' : 'bookmarks_search';
		}
		if (pathname === '/tags/search') {
			return isSearchResultsPage ? 'tags_search_results' : 'tags_search';
		}
		if (pathname === '/about') return 'about_page';

		const pathSegments = pathname.substring(1).split('/').filter(Boolean);
		if (pathname === '/users/login') return 'session_login';
		if (pathname === '/users/logout') return 'session_logout';
		if (pathname === '/') {
			return document.body.classList.contains('logged-in') ? 'dashboard' : 'front_page';
		}
		if (pathSegments.length > 0) {
			const p1 = pathSegments[0];
			const p2 = pathSegments[1];
			const p3 = pathSegments[2];
			const p4 = pathSegments[3];
			const p5 = pathSegments[4];
			switch (p1) {
				case 'admin_posts':
					if (p2 && /^\d+$/.test(p2)) {
						return 'admin_posts_show';
					}
					return 'admin_posts_index';

				case 'comments':
					if (document.querySelector('a[href="/admin_posts"]')) {
						return 'admin_posts_show';
					}
					break;

				case 'media':
					return 'media_index';
				case 'users':
					if (p2 && p3 === 'pseuds') {
						if (p4 === 'new') return 'users_settings';
						if (p4) {
							if (p5 === 'works') return 'users_works_index';
							if (p5 === 'bookmarks') return 'users_bookmarks_index';
							if (p5 === 'series') return 'users_series_index';
							if (p5 === 'gifts') return 'users_gifts_index';
							if (p5 === 'edit') return 'users_settings';
							if (p5 === 'orphan') return 'orphans_new';
							if (!p5) return 'profile';
						}
						if (!p4) return 'users_settings';
					}
					if (p2 && p3 === 'pseuds' && p5 === 'works') return 'users_works_index';
					if (p2 && (p3 === 'blocked' || p3 === 'muted') && p4 === 'users') return 'users_block_mute_list';
					if (p2 && p3 === 'dashboard') return 'dashboard';
					if (p2 && p3 === 'profile' && p4 === 'edit') return 'users_settings';
					if (p2 && p3 === 'profile') return 'profile';
					if (p2 && p3 === 'stats') return 'users_stats';
					if (p2 && p3 === 'readings') return 'users_history';
					if (p2 && p3 === 'preferences') return 'preferences';
					if (p2 && p3 === 'edit') return 'users_settings';
					if (p2 && p3 === 'change_username') return 'users_settings';
					if (p2 && p3 === 'change_password') return 'users_settings';
					if (p2 && p3 === 'change_email') return 'users_settings';
					if (p2 && p3 === 'works' && p4 === 'drafts') return 'users_drafts_index';
					if (p2 && p3 === 'series') return 'users_series_index';
					if (p2 && p3 === 'works' && p4 === 'show_multiple') return 'works_show_multiple';
					if (p2 && p3 === 'works' && p4 === 'edit_multiple') return 'works_edit_multiple';
					if (p2 && p3 === 'works') return 'users_works_index';
					if (p2 && p3 === 'bookmarks') return 'users_bookmarks_index';
					if (p2 && p3 === 'collections') return 'users_collections_index';
					if (p2 && p3 === 'subscriptions') return 'users_subscriptions_index';
					if (p2 && p3 === 'related_works') return 'users_related_works_index';
					if (p2 && p3 === 'gifts') return 'users_gifts_index';
					if (p2 && p3 === 'history') return 'users_history';
					if (p2 && p3 === 'inbox') return 'users_inbox';
					if (p2 && p3 === 'signups') return 'users_signups';
					if (p2 && p3 === 'assignments') return 'users_assignments';
					if (p2 && p3 === 'claims') return 'users_claims';
					if (p2 && p3 === 'invitations') return 'users_invitations';
					if (p2 && !p3) return 'profile';
					break;
				case 'works':
					if (document.querySelector('div#main.works-update')) return 'works_edit';
					if (p2 === 'new') {
						const searchParams = new URLSearchParams(window.location.search);
						if (searchParams.get('import') === 'true') {
							return 'works_import';
						}
						return 'works_new';
					}
					if (p2 === 'search') return isSearchResultsPage ? 'works_search_results' : 'works_search';
					if (p2 && /^\d+$/.test(p2)) {
						if (p3 === 'chapters' && p4 === 'new') return 'chapters_new';
						if (p3 === 'chapters' && p4 && /^\d+$/.test(p4) && p5 === 'edit') return 'chapters_edit';
						if (p3 === 'edit_tags') return 'works_edit_tags';
						if (p3 === 'edit') return 'works_edit';
						if (!p3 || p3 === 'navigate' || (p3 === 'chapters' && p4)) return 'works_chapters_show';
					}
					if (!p2) return 'works_index';
					break;
				case 'chapters':
					if (p2 && /^\d+$/.test(p2)) {
						return 'works_chapters_show';
					}
					break;
				case 'series':
					if (p2 && /^\d+$/.test(p2)) return 'series_show';
					if (!p2) return 'series_index';
					break;
				case 'orphans':
					return 'orphans_new';
				case 'collections':
					if (p2 === 'new') {
						return 'collections_new';
					}
					if (p3 === 'works' && p4 && /^\d+$/.test(p4)) {
						if (p5 === 'chapters' && pathSegments[5] === 'new') return 'chapters_new';
						if (p5 === 'chapters' && pathSegments[5] && /^\d+$/.test(pathSegments[5]) && pathSegments[6] === 'edit') return 'chapters_edit';
						if (p5 === 'edit_tags') return 'works_edit_tags';
						if (p5 === 'edit') return 'works_edit';
						if (!p5 || p5 === 'navigate' || (p5 === 'chapters' && pathSegments[5])) return 'works_chapters_show';
					}
					return 'collections_dashboard_common';
				case 'tags':
					if (p2) {
						if (pathSegments.slice(-1)[0] === 'works') return 'tags_works_index';
						return 'tags_show';
					}
					if (!p2) return 'tags_index';
					break;
				case 'tag_sets':
					if (p2 === 'new') {
						return 'tag_sets_new';
					}
					if (p3 === 'nominations' && p4 === 'new') {
						return 'tag_sets_nominations_new';
					}
					break;
				case 'skins':
					if (p2 === 'new') return 'skins';
					if (p2 && /^\d+$/.test(p2) && p3 === 'edit') return 'skins_edit';
					if (p2 && /^\d+$/.test(p2)) return 'skins_show';
					return 'skins';
				case 'bookmarks':
					if (p2 && /^\d+$/.test(p2) && p3 === 'new') return 'bookmarks_new_for_work';
					if (p2 && /^\d+$/.test(p2)) return 'bookmarks_show';
					if (!p2) return 'bookmarks_index';
					break;
			}
		}
		if (document.body.classList.contains('dashboard')) return 'dashboard';
		if (document.querySelector('body.works.index')) return 'works_index';
		if (document.querySelector('body.works.show, body.chapters.show')) return 'works_chapters_show';
		const pathMatch = pathname.match(I18N.conf.rePagePath);
		if (pathMatch && pathMatch[1]) {
			let derivedType = pathMatch[1];
			if (pathMatch[2]) derivedType += `_${pathMatch[2]}`;
			if (I18N[CONFIG.LANG]?.[derivedType]) {
				return derivedType;
			}
		}
		return 'common';
	}

	/**
	 * traverseNode 函数：遍历指定的节点，并对节点进行翻译。
	 * @param {Node} rootNode - 需要遍历的节点。
	 */
	function traverseNode(rootNode) {
		if (rootNode.nodeType === Node.ELEMENT_NODE && rootNode.matches(pageConfig.ignoreSelectors)) {
			return;
		}

		const processNode = node => {
			if (node.nodeType === Node.TEXT_NODE) {
				if (node.nodeValue && node.nodeValue.length <= 1000) {
					transElement(node, 'nodeValue');
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				if (node.hasAttribute('title')) transElement(node, 'title');
				if (node.hasAttribute('aria-label')) transElement(node, 'ariaLabel');

				const tag = node.tagName;

				if (tag === 'INPUT' || tag === 'TEXTAREA') {
					if (['button', 'submit', 'reset'].includes(node.type)) {
						transElement(node, 'value');
						transElement(node.dataset, 'confirm');
					} else {
						transElement(node, 'placeholder');
					}
				} else if (tag === 'BUTTON') {
					['confirm', 'confirmText', 'confirmCancelText', 'disableWith']
						.forEach(k => transElement(node.dataset, k));
				} else if (tag === 'A') {
					transElement(node.dataset, 'confirm');
				} else if (tag === 'OPTGROUP') {
					transElement(node, 'label');
				} else if (tag === 'IMG') {
					transElement(node, 'alt');
				}
			}
		};

		processNode(rootNode);

		if (rootNode.nodeType === Node.ELEMENT_NODE) {
			const treeWalker = document.createTreeWalker(
				rootNode,
				NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
				node => {
					if (node.parentElement && node.parentElement.closest(pageConfig.ignoreSelectors)) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			);

			let currentNode;
			while ((currentNode = treeWalker.nextNode())) {
				processNode(currentNode);
			}
		}
	}

	/**
	 * transTitle 函数：翻译页面标题。
	 */
	function transTitle() {
		const text = document.title;
		let translatedText = pageConfig.staticDict?.[text] || I18N[CONFIG.LANG]?.public?.static?.[text] || I18N[CONFIG.LANG]?.title?.static?.[text] || '';
		if (!translatedText) {
			const titleRegexRules = [
				...(I18N[CONFIG.LANG]?.title?.regexp || []),
				...(pageConfig.regexpRules || [])
			];
			for (const rule of titleRegexRules) {
				if (!Array.isArray(rule) || rule.length !== 2) continue;
				const [pattern, replacement] = rule;
				if (pattern.test(text)) {
					translatedText = text.replace(pattern, replacement);
					if (translatedText !== text) break;
				}
			}
		}
		if (translatedText && translatedText !== text) {
			document.title = translatedText;
		}
	}

	/**
	 * transElement 函数：翻译指定元素的文本内容或属性。
	 */
	function transElement(el, field) {
		if (!el || !el[field]) return false;
		const text = el[field];
		if (typeof text !== 'string' || !text.trim()) return false;
		const translatedText = transText(text, el);
		if (translatedText && translatedText !== text) {
			try {
				el[field] = translatedText;
			} catch (e) {
			}
		}
	}

	/**
	 * transText 函数：翻译文本内容。
	 */
	function transText(text, el) {
		if (!text || typeof text !== 'string') return false;
		if (TranslationMemory.has(text)) {
			return TranslationMemory.get(text);
		}

		const originalText = text;
		let translatedText = text;

		const applyFlexibleDict = (targetText, dict, precompiledRegex) => {
			if (!dict || !precompiledRegex) return targetText;

			if (el && el.nodeType === Node.TEXT_NODE && el.parentElement && el.parentElement.matches('h2.heading a.tag')) {
				const fullTagText = el.parentElement.textContent.trim();
				if (dict[fullTagText]) {
					return targetText.replace(fullTagText, dict[fullTagText]);
				} else {
					return targetText;
				}
			}

			return targetText.replace(precompiledRegex, (matched) => dict[matched] || matched);
		};

		translatedText = applyFlexibleDict(translatedText, pageConfig.pageFlexibleDict, pageConfig.pageFlexibleRegex);
		translatedText = applyFlexibleDict(translatedText, pageConfig.globalFlexibleDict, pageConfig.globalFlexibleRegex);

		const staticDict = pageConfig.staticDict || {};
		const trimmedText = translatedText.trim();
		if (staticDict[trimmedText]) {
			translatedText = translatedText.replace(trimmedText, staticDict[trimmedText]);
		}

		if (FeatureSet.enable_RegExp && pageConfig.regexpRules) {
			for (const rule of pageConfig.regexpRules) {
				if (!Array.isArray(rule) || rule.length !== 2) continue;
				const [pattern, replacement] = rule;
				if (pattern.test(translatedText)) {
					translatedText = translatedText.replace(pattern, replacement);
				}
			}
		}

		const finalResult = translatedText !== originalText ? translatedText : false;

		if (TranslationMemory.size > 5000) TranslationMemory.clear();
		TranslationMemory.set(originalText, finalResult);

		return finalResult;
	}

	/**
	 * transBySelector 函数：通过 CSS 选择器找到页面上的元素，并将其文本内容替换为预定义的翻译。
	 */
	function transBySelector(rootNode = document) {
		if (!pageConfig.tranSelectors) return;
		pageConfig.tranSelectors.forEach(rule => {
			if (!Array.isArray(rule) || rule.length !== 2) return;
			const [selector, translatedText] = rule;
			try {
				const elements = rootNode.querySelectorAll(selector);
				elements.forEach(element => {
					if (element && element.textContent !== translatedText) {
						element.textContent = translatedText;
					}
				});
			} catch (e) {
			}
		});
	}

	/**
	 * 主翻译入口函数 (单元模式)
	 */
	function transDesc(rootNode = document) {
		if (!FeatureSet.enable_transDesc) {
			return;
		}

		const applyRules = (rules) => {
			rules.forEach(rule => {
				if (rule.isTitle) return;
                if (rule.fullPageOnly) return;

				if (rule.selector === 'ul.tags.commas' && (pageConfig.currentPageType === 'admin_posts_show' || pageConfig.currentPageType === 'admin_posts_index' || pageConfig.currentPageType === 'collections_dashboard_common')) {
					return;
				}

				rootNode.querySelectorAll(rule.selector).forEach(element => {
					if (element.dataset.translationHandled) return;
					if (element.textContent.trim() === '') return;
					if (rule.isLazyLoad && element.closest('.summary, .notes, .comment')) return;
					if (element.classList.contains('translated-tags-container') || element.closest('.translated-tags-container')) return;

					const blurbContainer = element.closest('.blurb.group');

					if (rule.selector === 'ul.tags.commas' && blurbContainer) {
						const hasSummary = blurbContainer.querySelector('blockquote.userstuff.summary, .summary > blockquote.userstuff');
						if (hasSummary) return;
					}

					let linkedTagsNode = null;
					if (blurbContainer && !element.classList.contains('tags') && (element.classList.contains('summary') || element.closest('.summary'))) {
						linkedTagsNode = blurbContainer.querySelector('ul.tags.commas');
					}

					addTranslationButton(element, rule.text, rule.above || false, rule.isLazyLoad || false, rule.isTags || false, linkedTagsNode, rule.insertInside || false);
				});
			});
		};

		applyRules(TRANSLATION_TARGET_RULES.universal);

		const currentSpecificRules = TRANSLATION_TARGET_RULES.specific[pageConfig.currentPageType];
		if (currentSpecificRules) {
			applyRules(currentSpecificRules);
		}
	}

	/**
	 * 为指定元素添加翻译按钮
	 */
	function addTranslationButton(element, originalButtonText, isAbove, isLazyLoad, isTags, linkedTagsNode = null, insertInside = false) {
		element.dataset.translationHandled = 'true';

		const wrapper = document.createElement('div');
		wrapper.className = 'translate-me-ao3-wrapper state-idle';
		wrapper.dataset.translationState = 'skipped';

		if (isTags) {
			wrapper.classList.add('type-tags');
		}

		const buttonLink = document.createElement('div');
		buttonLink.className = 'translate-me-ao3-button';
		buttonLink.textContent = originalButtonText;
		wrapper.appendChild(buttonLink);

		if (isTags && element.tagName === 'DL' && element.classList.contains('meta') && element.parentElement.classList.contains('wrapper')) {
			if (isAbove) {
				element.parentElement.prepend(wrapper);
			} else {
				element.parentElement.after(wrapper);
			}
		} else {
			if (insertInside) {
				element.appendChild(wrapper);
			} else if (isAbove) {
				element.prepend(wrapper);
			} else {
				element.after(wrapper);
			}
		}

		let controller;
		if (linkedTagsNode) {
			controller = createBlurbTranslationController({
				summaryElement: element,
				tagsElement: linkedTagsNode,
				buttonWrapper: wrapper,
				originalButtonText: originalButtonText
			});
		} else if (isTags) {
			controller = createTagsTranslationController({
				containerElement: element,
				buttonWrapper: wrapper,
				originalButtonText: originalButtonText
			});
		} else {
			controller = createTranslationController({
				containerElement: element,
				buttonWrapper: wrapper,
				originalButtonText: originalButtonText,
				isLazyLoad: isLazyLoad
			});
		}

		buttonLink.addEventListener('click', () => controller.handleClick());
	}

	/**
	 * fetchTranslatedText 函数：从特定页面的词库中获得翻译文本内容。
	 * @param {string} text - 需要翻译的文本内容
	 * @returns {string|boolean} 翻译后的文本内容
	 */
	function fetchTranslatedText(text) {
		if (pageConfig.staticDict && pageConfig.staticDict[text] !== undefined) {
			return pageConfig.staticDict[text];
		}
		if (FeatureSet.enable_RegExp && pageConfig.regexpRules) {
			for (const rule of pageConfig.regexpRules) {
				if (!Array.isArray(rule) || rule.length !== 2) continue;
				const [pattern, replacement] = rule;
				if (pattern instanceof RegExp && pattern.test(text)) {
					const translated = text.replace(pattern, replacement);
					if (translated !== text) return translated;
				} else if (typeof pattern === 'string' && text.includes(pattern)) {
					const translated = text.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
					if (translated !== text) return translated;
				}
			}
		}
		return false;
	}

	/**
	 * 翻译标题中的标签
	 */
	function translateHeadingTags() {
		const headingTags = document.querySelectorAll('h2.heading a.tag');
		if (headingTags.length === 0) return;
		const fullDictionary = {
			...pageConfig.staticDict,
			...pageConfig.globalFlexibleDict,
			...pageConfig.pageFlexibleDict
		};
		headingTags.forEach(tagElement => {
			if (tagElement.hasAttribute('data-translated-by-custom-function')) {
				return;
			}
			const originalText = tagElement.textContent.trim();
			if (fullDictionary[originalText]) {
				tagElement.textContent = fullDictionary[originalText];
			}
			tagElement.setAttribute('data-translated-by-custom-function', 'true');
		});
	}

	/**
	 * 脚本主入口检查
	 */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', main);
	} else {
		main();
	}

})(window, document);