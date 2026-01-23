// ==UserScript==
// @name         AO3 Translator
// @namespace    https://github.com/V-Lipset/ao3-chinese
// @description  中文化 AO3 界面，可调用 AI 实现简介、注释、评论以及全文翻译。
// @version      1.6.1-2026-01-23
// @author       V-Lipset
// @license      GPL-3.0
// @include      http*://archiveofourown.org/*
// @include      http*://archiveofourown.gay/*
// @match        https://archiveofourown.site/*
// @match        https://ao3mirror.site/*
// @match        https://ao1s.top/*
// @match        https://xn--iao3-lw4b.ws/*
// @match        https://ao3sg.hyf9588.tech/*
// @match        https://ao3rc.hyf9588.tech/*
// @icon         https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/assets/icon.png
// @resource     vIcon https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/assets/icon.png
// @resource     santaHat https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/assets/santa%20hat.png
// @supportURL   https://github.com/V-Lipset/ao3-chinese/issues
// @downloadURL  https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/local.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@main/local.user.js
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

	/**************************************************************************
	 * 全局常量与配置
	 **************************************************************************/

	const monthMap = {
		'Jan': '1', 'Feb': '2', 'Mar': '3', 'Apr': '4', 'May': '5', 'Jun': '6',
		'Jul': '7', 'Aug': '8', 'Sep': '9', 'Oct': '10', 'Nov': '11', 'Dec': '12'
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
			enable_debug_mode: true,
			translation_display_mode: 'bilingual',
			from_lang: 'auto',
			to_lang: 'zh-CN',
			lang_detector: 'microsoft',
			custom_url_first_save_done: false
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

	/**
	 * 针对不同目标语言的输出示例数据
	 */
	const PROMPT_EXAMPLE_OUTPUTS = {
		'zh-CN': `1. 这是<em>第一个</em>句子。\n2. ---\n3. 她的名字是 ph_123456。\n4. 这是第四个句子。`,
		'zh-TW': `1. 這是<em>第一個</em>句子。\n2. ---\n3. 她的名字是 ph_123456。\n4. 這是第四個句子。`,
		'ar': `1. هذه هي الجملة <em>الأولى</em>.\n2. ---\n3. اسمها هو ph_123456.\n4. هذه هي الجملة الرابعة.`,
		'bg': `1. Това е <em>първото</em> изречение.\n2. ---\n3. Нейното име е ph_123456.\n4. Това е четвъртото изречение.`,
		'bn': `1. এটি <em>প্রথম</em> বাক্য।\n2. ---\n3. তার নাম ph_123456।\n4. এটি চতুর্থ বাক্য।`,
		'ca': `1. Aquesta és la <em>primera</em> frase.\n2. ---\n3. El seu nom és ph_123456.\n4. Aquesta és la quarta frase.`,
		'cs': `1. Toto je <em>první</em> věta.\n2. ---\n3. Jmenuje se ph_123456.\n4. Toto je čtvrtá věta.`,
		'da': `1. Dette er den <em>første</em> sætning.\n2. ---\n3. Hendes navn er ph_123456.\n4. Dette er den fjerde sætning.`,
		'de': `1. Das ist der <em>erste</em> Satz.\n2. ---\n3. Ihr Name ist ph_123456.\n4. Das ist der vierte Satz.`,
		'el': `1. Αυτή είναι η <em>πρώτη</em> πρόταση.\n2. ---\n3. Το όνομά της είναι ph_123456.\n4. Αυτή είναι η τέταρτη πρόταση.`,
		'es': `1. Esta es la <em>primera</em> frase.\n2. ---\n3. Su nombre es ph_123456.\n4. Esta es la cuarta frase.`,
		'et': `1. See on <em>esimene</em> lause.\n2. ---\n3. Tema nimi on ph_123456.\n4. See on neljas lause.`,
		'fa': `1. این <em>اولین</em> جمله است.\n2. ---\n3. نام او ph_123456 است.\n4. این چهارمین جمله است.`,
		'fi': `1. Tämä on <em>ensimmäinen</em> lause.\n2. ---\n3. Hänen nimensä on ph_123456.\n4. Tämä on neljäs lause.`,
		'fr': `1. C'est la <em>première</em> phrase.\n2. ---\n3. Son nom est ph_123456.\n4. C'est la quatrième phrase.`,
		'gu': `1. આ <em>પહેલું</em> વાક્ય છે।\n2. ---\n3. તેનું નામ ph_123456 છે।\n4. આ ચોથું વાક્ય છે।`,
		'he': `1. זהו המשפט ה<em>ראשון</em>.\n2. ---\n3. שמה הוא ph_123456.\n4. זהו המשפט הרביעי.`,
		'hi': `1. यह <em>पहला</em> वाक्य है।\n2. ---\n3. उसका नाम ph_123456 है।\n4. यह चौथा वाक्य है।`,
		'hr': `1. Ovo je <em>prva</em> rečenica.\n2. ---\n3. Njeno ime je ph_123456.\n4. Ovo je četvrta rečenica.`,
		'hu': `1. Ez az <em>első</em> mondat.\n2. ---\n3. A neve ph_123456.\n4. Ez a negyedik mondat.`,
		'id': `1. Ini adalah kalimat <em>pertama</em>.\n2. ---\n3. Namanya adalah ph_123456.\n4. Ini adalah kalimat keempat.`,
		'is': `1. Þetta er <em>fyrsta</em> setningin.\n2. ---\n3. Hún heitir ph_123456.\n4. Þetta er fjórða setningin.`,
		'it': `1. Questa è la <em>prima</em> frase.\n2. ---\n3. Il suo nome è ph_123456.\n4. Questa è la quarta frase.`,
		'ja': `1. これは<em>最初の</em>文です。\n2. ---\n3. 彼女の名前は ph_123456 です。\n4. これは4番目の文です。`,
		'kn': `1. ಇದು <em>ಮೊದಲ</em> ವಾಕ್ಯ।\n2. ---\n3. ಅವಳ ಹೆಸರು ph_123456।\n4. ಇದು ನಾಲ್ಕನೇ ವಾಕ್ಯ।`,
		'ko': `1. 이것은 <em>첫 번째</em> 문장입니다。\n2. ---\n3. 그녀의 이름은 ph_123456 입니다。\n4. 이것은 네 번째 문장입니다。`,
		'lt': `1. Tai yra <em>pirmas</em> sakinys.\n2. ---\n3. Jos vardas yra ph_123456.\n4. Tai yra ketvirtas sakinys.`,
		'lv': `1. Šis ir <em>pirmais</em> teikums.\n2. ---\n3. Viņas vārds ir ph_123456.\n4. Šis ir ceturtais teikums.`,
		'ml': `1. ഇതാണ് <em>ഒന്നാമത്തെ</em> വാക്യം।\n2. ---\n3. അവളുടെ പേര് ph_123456 എന്നാണ്।\n4. ഇതാണ് നാലാമത്തെ വാക്യം।`,
		'mr': `1. हे <em>पहिले</em> वाक्य आहे।\n2. ---\n3. तिचे नाव ph_123456 आहे।\n4. हे चौथे वाक्य आहे।`,
		'ms': `1. Ini adalah ayat <em>pertama</em>.\n2. ---\n3. Namanya ialah ph_123456.\n4. Ini adalah ayat keempat.`,
		'mt': `1. Din hija l-<em>ewwel</em> sentenza.\n2. ---\n3. Jisimha hu ph_123456.\n4. Din hija r-raba' sentenza.`,
		'nl': `1. Dit is de <em>eerste</em> zin.\n2. ---\n3. Haar naam is ph_123456.\n4. Dit is de vierde zin.`,
		'no': `1. Dette er den <em>første</em> setningen.\n2. ---\n3. Hennes navn er ph_123456.\n4. Dette er den fjerde setningen.`,
		'pa': `1. ਇਹ <em>ਪਹਿਲਾ</em> ਵਾਕ ਹੈ।\n2. ---\n3. ਉਸਦਾ ਨਾਮ ph_123456 ਹੈ।\n4. ਇਹ ਚੌਥਾ ਵਾਕ ਹੈ।`,
		'pl': `1. To jest <em>pierwsze</em> zdanie.\n2. ---\n3. Nazywa się ph_123456.\n4. To jest czwarte zdanie.`,
		'pt': `1. Esta é a <em>primeira</em> frase.\n2. ---\n3. O nome dela é ph_123456.\n4. Esta é a quarta frase.`,
		'ro': `1. Aceasta este <em>prima</em> propoziție.\n2. ---\n3. Numele ei este ph_123456.\n4. Aceasta este a patra propoziție.`,
		'ru': `1. Это <em>первое</em> предложение.\n2. ---\n3. Её зовут ph_123456.\n4. Это четвёртое предложение.`,
		'sk': `1. Toto je <em>prvá</em> veta.\n2. ---\n3. Volá sa ph_123456.\n4. Toto je štvrtá veta.`,
		'sl': `1. To je <em>prvi</em> stavek.\n2. ---\n3. Ime ji je ph_123456.\n4. To je četrti stavek.`,
		'sv': `1. Detta är den <em>första</em> meningen.\n2. ---\n3. Hennes namn är ph_123456.\n4. Detta är den fjärde meningen.`,
		'sw': `1. Hii ni sentensi ya <em>kwanza</em>.\n2. ---\n3. Jina lake ni ph_123456.\n4. Hii ni sentensi ya nne.`,
		'ta': `1. இது <em>முதல்</em> வாக்கியம்.\n2. ---\n3. அவள் பெயர் ph_123456.\n4. இது நான்காவது வாக்கியம்.`,
		'te': `1. ఇది <em>మొదటి</em> వాక్యం.\n2. ---\n3. ఆమె పేరు ph_123456.\n4. ఇది నాల్గవ వాక్యం.`,
		'th': `1. นี่คือประโยค<em>แรก</em>\n2. ---\n3. ชื่อของเธอคือ ph_123456\n4. นี่คือประโยคที่สี่`,
		'tr': `1. Bu <em>birinci</em> cümledir.\n2. ---\n3. Onun adı ph_123456.\n4. Bu dördüncü cümledir.`,
		'uk': `1. Це <em>перше</em> речення.\n2. ---\n3. Її звати ph_123456.\n4. Це четверте речення.`,
		'ur': `1. یہ <em>پہلا</em> جملہ ہے۔\n2. ---\n3. اس کا نام ph_123456 ہے۔\n4. یہ چوتھا جملہ ہے۔`,
		'vi': `1. Đây là câu <em>đầu tiên</em>.\n2. ---\n3. Tên cô ấy là ph_123456.\n4. Đây là câu thứ tư.`,
		'zu': `1. Lona umusho <em>wokuqala</em>.\n2. ---\n3. Igama lakhe ngu-ph_123456.\n4. Lona umusho wesine.`,
		'default': `1. This is the <em>first</em> sentence.\n2. ---\n3. Her name is ph_123456.\n4. This is the fourth sentence.`
	};

	/**
	 * 根据目标语言动态生成完整的提示示例
	 */
	function generatePromptExample(toLang) {
		const exampleOutputText = PROMPT_EXAMPLE_OUTPUTS[toLang] || PROMPT_EXAMPLE_OUTPUTS['zh-CN'];
		return `### Example Output:\n${exampleOutputText}`;
	}

	/**
	 * 获取 AI 翻译系统提示词模板
	 */
	function getSharedSystemPrompt() {
		return `You are a professional translator fluent in {toLangName}, with particular expertise in translating web novels and online fanfiction from {fromLangName}.

		Your task is to translate a numbered list of text segments provided by the user. These segments can be anything from full paragraphs to single phrases or words. For each numbered item, you will follow an internal three-stage strategy to produce the final, polished translation.

		### Internal Translation Strategy (for each item):
		1.  **Stage 1 (Internal Thought Process):** Produce a literal, word-for-word translation of the original content.
		2.  **Stage 2 (Internal Thought Process):** Based on the literal translation, identify any phrasing that is unnatural or does not flow well in the target language.
		3.  **Stage 3 (Final Output):** Produce a polished, idiomatic translation that fully preserves the original meaning, tone, cultural nuances, and any specialized fandom terminology. The final translation must be natural-sounding, readable, and conform to standard usage in {toLangName}.

		### CRITICAL OUTPUT INSTRUCTIONS:
		- Your entire response MUST consist of *only* the polished translation from Stage 3, formatted as a numbered list that exactly matches the input's numbering.
		- Do NOT include any stage numbers, headers (e.g., "Polished Translation"), notes, or explanations in your final output.
		- **HTML Tag Preservation:** If an item contains HTML tags (e.g., \`<em>\`, \`<strong>\`), you MUST preserve these tags exactly as they are in the original, including their positions around the translated text.
		- **Placeholder Preservation:** If an item contains special placeholders in the format \`ph_\` followed by six digits (e.g., \`ph_123456\`), you MUST preserve these placeholders exactly as they are.
		- **DO NOT** change \`ph_\` to \`P_\`, \`Ph_\`, or any other variation.
		- **DO NOT** add spaces inside the placeholder (e.g., \`ph_ 123456\` is WRONG).
		- **DO NOT** translate, modify, or delete them.
		- **Untranslatable Content:** If an item is a separator, a meaningless symbol, or otherwise untranslatable, you MUST return the original item exactly as it is, preserving its number.

		### Example Input:
		1. This is the <em>first</em> sentence.
		2. ---
		3. Her name is ph_123456.
		4. This is the fourth sentence.

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
			attributeFilter: ['value', 'placeholder', 'aria-label', 'data-confirm', 'title']
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
					absolute_loss: 10,
					proportional_loss: 0.8,
					proportional_trigger_count: 10,
					catastrophic_loss: 5
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
					absolute_loss: 4,
					proportional_loss: 0.8,
					proportional_trigger_count: 5,
					catastrophic_loss: 5
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
					absolute_loss: 4,
					proportional_loss: 0.8,
					proportional_trigger_count: 5,
					catastrophic_loss: 5
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
		validation_thresholds: `${CONFIG.SERVICE_CONFIG.default.VALIDATION.absolute_loss}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.proportional_loss}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.proportional_trigger_count}, ${CONFIG.SERVICE_CONFIG.default.VALIDATION.catastrophic_loss}`
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

				// 迁移旧数据
				const oldKeys = {
					'custom_ai_system_prompt': 'system_prompt',
					'custom_ai_user_prompt': 'user_prompt',
					'custom_ai_temperature': 'temperature',
					'custom_ai_chunk_size': 'chunk_size',
					'custom_ai_para_limit': 'para_limit',
					'custom_ai_request_rate': 'request_rate',
					'custom_ai_request_capacity': 'request_capacity',
					'custom_ai_lazy_load_margin': 'lazy_load_margin',
					'custom_ai_validation_thresholds': 'validation_thresholds'
				};

				for (const [oldKey, paramKey] of Object.entries(oldKeys)) {
					const oldVal = GM_getValue(oldKey);
					if (oldVal !== undefined && oldVal !== null) {
						defaultProfile.params[paramKey] = oldVal;
					}
				}

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
				Logger.info('配置', '翻译参数配置已初始化并迁移旧数据');
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
			enabled: GM_getValue('enable_debug_mode', DEFAULT_CONFIG.GENERAL.enable_debug_mode),
			history: [],
			maxHistory: 2000
		},

		_sanitize(data) {
			if (!data) return data;
			if (typeof data !== 'object') return data;

			try {
				const cleanData = JSON.parse(JSON.stringify(data));
				const sensitiveKeys = ['apikey', 'key', 'token', 'auth', 'authorization', 'x-api-key', 'user_prompt', 'system_prompt'];

				const mask = (obj) => {
					for (const key in obj) {
						if (Object.prototype.hasOwnProperty.call(obj, key)) {
							const lowerKey = key.toLowerCase();
							if (typeof obj[key] === 'object' && obj[key] !== null) {
								mask(obj[key]);
							} else if (sensitiveKeys.some(k => lowerKey.includes(k))) {
								obj[key] = '****** (已隐藏)';
							} else if (key === 'url') {
								const urlStr = String(obj[key]);
								if (!urlStr.includes('microsoft') && !urlStr.includes('googleapis') && !urlStr.includes('qq.com') && !urlStr.includes('baidu.com')) {
									obj[key] = 'Custom URL (已隐藏)';
								}
							} else if (key === 'originalHTML' || key === 'content') {
								if (String(obj[key]).length > 100) {
									obj[key] = String(obj[key]).substring(0, 100) + '... (内容过长已截断)';
								}
							}
						}
					}
				};
				mask(cleanData);
				return cleanData;
			} catch (e) {
				return '[数据清洗失败]';
			}
		},

		_record(level, module, message, data) {
			const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
			const logEntry = { timestamp, level, module, message, data };

			if (this.config.history.length >= this.config.maxHistory) {
				this.config.history.shift();
			}
			this.config.history.push(logEntry);

			if (this.config.enabled) {
				const prefix = `[${timestamp}] %c[${module}]`;
				let style = 'font-weight: bold;';
				if (level === 'INFO') style += 'color: #2196F3;';
				else if (level === 'WARN') style += 'color: #FF9800;';
				else if (level === 'ERROR') style += 'color: #F44336;';

				if (data) {
					console.log(prefix, style, message, data);
				} else {
					console.log(prefix, style, message);
				}
			}
		},

		info(module, message, data = null) {
			this._record('INFO', module, message, this._sanitize(data));
		},

		warn(module, message, data = null) {
			this._record('WARN', module, message, this._sanitize(data));
		},

		error(module, message, error = null) {
			let errorData = error;
			if (error instanceof Error) {
				errorData = { message: error.message, stack: error.stack, ...error };
			}
			this._record('ERROR', module, message, this._sanitize(errorData));
		},

		toggle() {
			this.config.enabled = !this.config.enabled;
			GM_setValue('enable_debug_mode', this.config.enabled);
			return this.config.enabled;
		},

		export() {
			const logText = this.config.history.map(entry => {
				const dataStr = entry.data ? `\nData: ${JSON.stringify(entry.data, null, 2)}` : '';
				return `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}${dataStr}`;
			}).join('\n——\n');

			const dateStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })
				.replace(/:/g, '-')
				.replace(' ', '_');
			saveFile(logText, `AO3-Translator-Log-${dateStr}.log`, 'text/plain;charset=utf-8');
		}
	};

	/**************************************************************************
	 * 特殊翻译函数与 DOM 操作
	 **************************************************************************/

	/**
	 * 专用翻译函数：翻译首次登录的帮助横幅
	 */
	function translateFirstLoginBanner() {
		const banner = document.querySelector('#first-login-help-banner');
		if (!banner || banner.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		const translatedHTML = `
	        <p>
	        嗨！看起来这是您首次登录 AO3 。如需了解如何使用 AO3 ，请查看一些<a href="/first_login_help">新用户实用技巧</a>，或浏览<a href="/faq">我们的常见问题解答</a>。
	        </p>
	        <p>
	        如果您需要技术支持，请<a href="/support">联系我们的支持团队</a>；如果您遇到骚扰或对我们的<a href="/tos">服务条款</a>（包括<a href="/content">内容政策</a>和<a href="/privacy">隐私政策</a>）有疑问，请<a href="/abuse_reports/new">联系我们的政策与滥用团队</a>。
	        </p>
	        <form action="${banner.querySelector('form')?.action || ''}" accept-charset="UTF-8" data-remote="true" method="post">
	            <input type="hidden" name="authenticity_token" value="${banner.querySelector('input[name=authenticity_token]')?.value || ''}" autocomplete="off">
	            <p class="submit actions">
	                <input type="submit" name="commit" value="永久关闭此信息">
	                <a id="hide-first-login-help" title="隐藏首次登录帮助横幅" data-remote="true" href="${banner.querySelector('a#hide-first-login-help')?.href || ''}">×</a>
	            </p>
	        </form>
	    `;
		banner.innerHTML = translatedHTML;
		banner.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译未登录时首页的介绍模块
	 */
	function translateFrontPageIntro() {
		const introDiv = document.querySelector('div.intro.module.odd');
		if (!introDiv || introDiv.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		const h2 = introDiv.querySelector('h2.heading');
		if (h2) {
			h2.textContent = '一个由同人爱好者创建、由同人爱好者运营的非营利、非商业存档，收录再创作同人作品，如同人小说、同人画作、同人视频和同人有声作品';
		}

		const statsP = introDiv.querySelector('p.stats');
		if (statsP) {
			const counts = statsP.querySelectorAll('span.count');
			if (counts.length === 3) {
				statsP.innerHTML = `超过 <span class="count">${counts[0].textContent}</span> 个同人圈 | <span class="count">${counts[1].textContent}</span> 名用户 | <span class="count">${counts[2].textContent}</span> 篇作品`;
			}
		}

		const parentP = introDiv.querySelector('p.parent');
		if (parentP) {
			const link = parentP.querySelector('a');
			if (link) {
				link.textContent = '再创作组织';
				parentP.innerHTML = `Archive of Our Own 是隶属于${link.outerHTML}的一个项目。`;
			}
		}

		const accountDiv = introDiv.querySelector('div.account.module');
		if (accountDiv) {
			const h4 = accountDiv.querySelector('h4.heading');
			if (h4) {
				h4.textContent = '拥有 AO3 账户，您可以：';
			}

			const listItems = accountDiv.querySelectorAll('ul li');
			const translations = [
				'分享您自己的同人作品',
				'在您喜欢的作品、系列或用户更新时收到通知',
				'参与各种活动',
				'记录您已浏览以及想要稍后查看的作品'
			];
			listItems.forEach((item, index) => {
				if (translations[index]) {
					item.textContent = translations[index];
				}
			});
			const paragraphs = accountDiv.querySelectorAll('p');
			paragraphs.forEach(p => {
				if (p.textContent.includes('You can join by getting an invitation')) {
					p.textContent = '您可以通过我们的自动邀请队列获取邀请。所有同人爱好者和同人作品均受欢迎！';
				} else if (p.classList.contains('actions')) {
					const inviteLink = p.querySelector('a');
					if (inviteLink) {
						inviteLink.textContent = '获取邀请！';
					}
				}
			});
		}
		introDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译邀请请求页面
	 */
	function translateInvitationRequestsPage() {
		function translateEnglishDate(englishDate) {
			const monthFullNameMap = {
				'January': '1', 'February': '2', 'March': '3', 'April': '4', 'May': '5', 'June': '6',
				'July': '7', 'August': '8', 'September': '9', 'October': '10', 'November': '11', 'December': '12'
			};
			const dateParts = englishDate.trim().match(/(\w+)\s(\d{1,2}),\s(\d{4})/);
			if (dateParts && dateParts.length === 4) {
				const monthName = dateParts[1];
				const day = dateParts[2];
				const year = dateParts[3];
				if (monthFullNameMap[monthName]) {
					const paddedDay = day.padStart(2, '0');
					return `${year} 年 ${monthFullNameMap[monthName]} 月 ${paddedDay} 日`;
				}
			}
			return englishDate;
		}

		const mainDiv = document.querySelector('div#main[class*="invite_requests-"]');

		if (!mainDiv) {
			return;
		}
		const isAlreadyHandled = mainDiv.hasAttribute('data-translated-by-custom-function');
		const inviteStatusDiv = mainDiv.querySelector('#invite-status');
		const statusHasContent = inviteStatusDiv && inviteStatusDiv.innerHTML.trim() !== '';

		if (isAlreadyHandled && !statusHasContent) {
			return;
		}

		if (!isAlreadyHandled) {
			const h2 = mainDiv.querySelector('h2.heading');
			if (h2) {
				const h2Text = h2.textContent.trim();
				if (h2Text === 'Invitation Requests') {
					h2.textContent = '邀请请求';
				} else if (h2Text === 'Invitation Request Status') {
					h2.textContent = '邀请请求状态';
				}
			}

			const firstP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('To get a free Archive of Our Own account'));
			if (firstP) {
				const tosLink = firstP.querySelector('a[href="/tos"]');
				const contentLink = firstP.querySelector('a[href="/content"]');
				const privacyLink = firstP.querySelector('a[href="/privacy"]');
				if (tosLink && contentLink && privacyLink) {
					tosLink.textContent = '服务条款';
					contentLink.textContent = '内容政策';
					privacyLink.textContent = '隐私政策';
					firstP.innerHTML = `要获得免费的 AO3 账户，您需要一份邀请。将您的电子邮箱地址提交到我们的邀请队列，即表示您确认自己已年满 13 周岁；如果您所在国家或地区要求居民/公民需超过 13 周岁才能同意您的个人数据处理，您也已达到该年龄，无需我们获取母父或法定监护人的书面许可。我们仅会使用您提交的电子邮箱地址发送邀请，并处理/管理您的账户激活。请在阅读并同意我们的${tosLink.outerHTML}（包括${contentLink.outerHTML}和${privacyLink.outerHTML}）后再申请邀请。`;
				}
			}

			const h3 = mainDiv.querySelector('h3.heading');
			if (h3 && h3.textContent.trim() === 'Request an invitation') {
				h3.textContent = '申请邀请';
			}

			const newRequestForm = mainDiv.querySelector('form#new_invite_request');
			if (newRequestForm) {
				const label = newRequestForm.querySelector('label[for="invite_request_email"]');
				if (label) {
					label.textContent = '电子邮箱';
				}
				const submitButton = newRequestForm.querySelector('input[type="submit"]');
				if (submitButton) {
					submitButton.value = '添加到列表';
				}
			}

			const listInfoP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('check your position on the waiting list'));
			if (listInfoP) {
				const statusLink = listInfoP.querySelector('a');
				if (statusLink) {
					statusLink.textContent = '查看自己在等待名单中的位置';
					const originalText = listInfoP.textContent;
					const peopleCountMatch = originalText.match(/currently ([\d,]+) people/);
					const peopleCount = peopleCountMatch ? peopleCountMatch[1] : 'some';
					const sendingCountMatch = originalText.match(/sending out ([\d,]+) invitations/);
					const sendingCount = sendingCountMatch ? sendingCountMatch[1] : 'some';
					const hoursMatch = originalText.match(/every ([\d]+) hours/);
					const hours = hoursMatch ? hoursMatch[1] : 'some';
					listInfoP.innerHTML = `如果您已提交邀请请求，可${statusLink.outerHTML}。目前等待名单上有 ${peopleCount} 人。我们每 ${hours} 小时发送 ${sendingCount} 份邀请。`;
				}
			}

			const statusP = Array.from(mainDiv.querySelectorAll('p')).find(p => p.textContent.includes('people on the waiting list'));
			if (statusP) {
				const originalText = statusP.textContent;
				const match = originalText.match(/There are currently ([\d,]+) people on the waiting list\.\s*We are sending out ([\d,]+) invitations every ([\d,]+) hours\./);
				if (match) {
					statusP.textContent = `当前等待名单上有 ${match[1]} 人。我们每 ${match[3]} 小时发送 ${match[2]} 个邀请。`;
				}
			}

			const statusForm = mainDiv.querySelector('form[action="/invite_requests/show"]');
			if (statusForm) {
				const label = statusForm.querySelector('label[for="email"]');
				if (label) {
					label.textContent = '电子邮箱';
				}
				const submitButton = statusForm.querySelector('input[type="submit"][value="Look me up"]');
				if (submitButton) {
					submitButton.value = '查找';
				}
			}
			mainDiv.setAttribute('data-translated-by-custom-function', 'true');
		}

		if (statusHasContent) {
			const statusH2 = inviteStatusDiv.querySelector('h2.heading');
			if (statusH2 && !statusH2.hasAttribute('data-translated-by-custom-function')) {
				const match = statusH2.textContent.match(/Invitation Status for\s+(.+)/);
				if (match && match[1]) {
					statusH2.textContent = `${match[1].trim()} 的邀请状态`;
					statusH2.setAttribute('data-translated-by-custom-function', 'true');
				}
			}

			const statusH3 = inviteStatusDiv.querySelector('h3.heading');
			if (statusH3 && !statusH3.hasAttribute('data-translated-by-custom-function')) {
				const match = statusH3.textContent.match(/Invitation Status for\s+(.+)/);
				if (match && match[1]) {
					statusH3.textContent = `${match[1].trim()} 的邀请状态`;
					statusH3.setAttribute('data-translated-by-custom-function', 'true');
				}
			}

			const paragraphs = inviteStatusDiv.querySelectorAll('p');
			paragraphs.forEach(p => {
				if (p.hasAttribute('data-translated-by-custom-function')) return;
				const text = p.textContent.trim();

				const sentMatch = text.match(/Your invitation was emailed to this address on\s+([\d-]+)\.\s*If you can't find it, please check your email spam folder as your spam filters may have placed it there\./);
				if (sentMatch) {
					p.textContent = `您的邀请已于 ${sentMatch[1]} 发送至此邮箱地址。如果您无法找到它，请检查您的垃圾邮件文件夹，因为它可能被误判为垃圾邮件。`;
					p.setAttribute('data-translated-by-custom-function', 'true');
					return;
				}

				if (text.includes('Because your invitation was sent more than 24 hours ago, you can have your invitation resent.')) {
					p.textContent = '由于您的邀请已发送超过 24 小时，您可以申请重新发送。';
					p.setAttribute('data-translated-by-custom-function', 'true');
					return;
				}

				const resentMatch = text.match(/Your invitation was emailed to this address on\s+([\d-]+)\s+and resent on\s+([\d-]+)\.\s*If you can't find it/);
				if (resentMatch) {
					p.textContent = `您的邀请已于 ${resentMatch[1]} 发送至此邮箱地址，并于 ${resentMatch[2]} 重新发送。如果您无法找到它，请检查您的垃圾邮件文件夹，因为它可能被误判为垃圾邮件。`;
					p.setAttribute('data-translated-by-custom-function', 'true');
					return;
				}

				if (text.includes('If it has been more than 24 hours since you should have received your invitation')) {
					p.textContent = '如果距离您应该收到邀请的时间已超过 24 小时，且检查垃圾邮件文件夹后仍未找到，您可以访问此页面重新发送邀请。';
					p.setAttribute('data-translated-by-custom-function', 'true');
					return;
				}
			});

			const resendBtn = inviteStatusDiv.querySelector('form button[type="submit"]');
			if (resendBtn && resendBtn.textContent.trim() === 'Resend Invitation') {
				resendBtn.textContent = '重新发送邀请';
			}

			const statusResultP = inviteStatusDiv.querySelector('p');
			if (statusResultP && !statusResultP.hasAttribute('data-translated-by-custom-function')) {
				const match = statusResultP.innerHTML.match(/You are currently number <strong>([\d,]+)<\/strong> on our waiting list!\s*At our current rate, you should receive an invitation on or around:\s*(.+)\./s);
				if (match) {
					const englishDate = match[2].trim();
					const translatedDate = translateEnglishDate(englishDate);
					statusResultP.innerHTML = `您目前在等待名单上的位置是第 <strong>${match[1]}</strong> 位！按照当前速度，您应在 ${translatedDate} 前后收到邀请。`;
					statusResultP.setAttribute('data-translated-by-custom-function', 'true');
				} else if (/Sorry, we can't find the email address you entered/.test(statusResultP.textContent)) {
					statusResultP.textContent = '抱歉，我们无法找到您输入的电子邮箱地址。';
					statusResultP.setAttribute('data-translated-by-custom-function', 'true');
				}
			}
		}

		const successNotice = mainDiv.querySelector('div.flash.notice');
		if (successNotice && successNotice.textContent.includes("You've been added to our queue!")) {
			const match = successNotice.innerHTML.match(/around (.+?)\. We strongly recommend/);
			if (match && match[1]) {
				const englishDate = match[1];
				const translatedDate = translateEnglishDate(englishDate);
				successNotice.innerHTML = `您已进入排队列表！我们预计您将在 ${translatedDate} 前后收到邀请。我们强烈建议您将 do-not-reply@archiveofourown.org 添加到您的通讯录，以防邀请邮件被您的邮件服务商误判为垃圾邮件。`;
			}
		}

		const errorDiv = mainDiv.querySelector('div#error.error');
		if (errorDiv) {
			const errorH4 = errorDiv.querySelector('h4');
			if (errorH4) {
				errorH4.textContent = '抱歉！我们无法保存此邀请请求，因为：';
			}

			const errorMessages = {
				"Email can't be blank": "电子邮箱 不能为空。",
				"Email should look like an email address.": "电子邮箱 格式不正确。",
				"Email is already being used by an account holder.": "该电子邮箱地址已被其她账户使用。",
			};

			const errorLis = errorDiv.querySelectorAll('ul li');
			errorLis.forEach(li => {
				const originalError = li.textContent.trim();
				if (errorMessages[originalError]) {
					li.textContent = errorMessages[originalError];
				}
			});
		}
	}

	/**
	 * 专用翻译函数：翻译“请求过于频繁”的错误页面
	 */
	function translateTooManyRequestsPage() {
		const body = document.body;
		if (body.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		document.title = "请求过于频繁！ | AO3 作品库";
		const headerH1 = document.querySelector('header h1');
		if (headerH1) {
			headerH1.innerHTML = 'AO3 作品库 <sup>beta</sup>';
		}

		const mainH2 = document.querySelector('main h2');
		if (mainH2) {
			const logoImg = mainH2.querySelector('img.logo');
			if (logoImg) {
				mainH2.innerHTML = `${logoImg.outerHTML} 请求页面过于频繁。`;
			}
		}

		const paragraphs = document.querySelectorAll('main p');
		if (paragraphs.length >= 2) {
			paragraphs[0].textContent = '我们已阻止此操作以保护系统安全。请一次加载较少页面或放慢浏览速度，并在几分钟后重试。';

			const supportLink = paragraphs[1].querySelector('a');
			if (supportLink) {
				supportLink.textContent = '联系支持团队';
				paragraphs[1].innerHTML = `如果问题依旧存在，请 ${supportLink.outerHTML} 。`;
			}
		}

		const footerSmall = document.querySelector('footer small');
		if (footerSmall) {
			const bTags = footerSmall.querySelectorAll('b');
			if (bTags.length === 2) {
				bTags[0].textContent = 'Ray ID：';
				bTags[1].textContent = '您的 IP：';
			}
			const showIpLink = footerSmall.querySelector('#client-ip-reveal');
			if (showIpLink) {
				showIpLink.textContent = '显示 IP';
			}
		}
		body.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专门用于翻译 /works/search 页面上的“作品搜索”帮助文本。
	 */
	function translateWorkSearchTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search text help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：任意字段</h4>
	            <p>搜索数据库中与作品相关的所有字段，包括简介、注释和标签，但不包括作品全文。</p>
	            <p>字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。就像在“标题”和“作者/画师”字段中，您可以使用以下运算符来组合搜索词：</p>
	            <dl>
	                <dt>*: 匹配任意字符</dt>
	                <dd><kbd>book*</kbd> 将匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
	                <dt>空格：在同一字段中，相当于 AND 操作</dt>
	                <dd><kbd>Harry Potter</kbd> 会匹配任何字段中包含 “<samp>Harry Potter</samp>” 或 “<samp>Harry James Potter</samp>” 的作品，但不会匹配创作者名为 <samp>Harry</samp> 且角色标签为 <samp>Sherman Potter</samp> 的作品。</dd>
	                <dt>AND：在任何字段中同时包含这两个词的作品</dt>
	                <dd><kbd>Harry AND Potter</kbd> 会匹配创作者名为 <samp>Harry</samp> 且角色标签为 <samp>Sherman Potter</samp> 的作品。</dd>
	                <dt>||: OR（非排她性）</dt>
	                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
	                <dt>"": 精确匹配词组</dt>
	                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
	                <dt>-: NOT（排除）</dt>
	                <dd><kbd>Harry -Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
	            </dl>
	            <h5>示例</h5>
	            <dl>
	                <dt><kbd>"Fandom X" "F/F" -Explicit</kbd></dt>
	                <dd>会匹配出所有标记为 女/女 的 同人圈 X 的作品，并排除标记为 限制级 的作品。</dd>
	                <dt><kbd>"Character A" OR "Character B" -"Character Death"</kbd></dt>
	                <dd>会匹配出包含 Character A 或 Character B（或两者皆有）的所有作品，并排除在预警或附加标签中标记有 “角色死亡” 的作品。</dd>
	                <dt><kbd>"Character A/Character B" "Underage Sex" (Mature OR Explicit)</kbd></dt>
	                <dd>会匹配出所有包含 未成年性行为 预警且分级为 成人向 或 限制级的该配对作品。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：文本 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“日期”相关的帮助文本框。
	 */
	function translateWorkSearchDateTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search date help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：日期</h4>
	            <p>创建一个时间范围。如果未提供范围，将根据指定的时间段自动计算。</p>
	            <p>可用时间段：year, month, week, day, hour（年、月、周、天、小时）</p>
	            <ul>
	                <li>x days ago：从该天开始到结束的 24 小时区间</li>
	                <li>x weeks ago：从该周周一开始到周日结束的 7 天区间</li>
	                <li>x months ago：从该月第一天开始到最后一天结束的 1 个月区间</li>
	                <li>x years ago：从该年年初开始到年末结束的 1 年区间</li>
	            </ul>
	            <p>示例（以 2012 年 4 月 25 日 星期三 为当前日期）：</p>
	            <ul>
	                <li>7 days ago：匹配出 2012 年 4 月 18 日当天发布或更新的所有作品</li>
	                <li>1 week ago：匹配出 2012 年 4 月 16 日（周一）至 4 月 22 日（周日）这一周内发布或更新的所有作品</li>
	                <li>2 months ago：匹配出 2012 年 2 月内发布或更新的所有作品</li>
	                <li>3 years ago：匹配出 2010 年内发布或更新的所有作品</li>
	                <li>< 7 days：匹配出过去七天内发布或更新的所有作品</li>
	                <li>> 8 weeks：匹配出八周之前发布或更新的所有作品</li>
	                <li>13-21 months：匹配出十三到二十一个月之前发布或更新的所有作品</li>
	            </ul>
	            <p>请注意，“ago”（之前/前）一词是可选的。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：日期 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“跨圈作品”相关的帮助文本框。
	 */
	function translateWorkSearchCrossoverTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search crossover help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：跨圈作品</h4>
	            <p>
	                一般来说，<a href="https://fanlore.org/wiki/Crossover">跨圈作品</a>指包含多个同人圈的作品。在筛选时，如果一篇作品被标注为两个或更多<em> 不相关的 </em>同人圈，就被视为跨圈作品（我们使用标签整理系统来做出此判定）。
	            </p>
	            <p>
	                想要查找两个特定同人圈之间的跨圈作品？请在搜索表单中的“同人圈”字段输入它们的名称，或在筛选器中选择/输入这两个同人圈。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '搜索：跨圈作品 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“数值”相关的帮助文本框。
	 */
	function translateWorkSearchNumericalTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search numerical help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：数值</h4>
	            <p>在查找具有特定字数、点击量、点赞数、评论或书签数量的作品时，请使用以下指南。注意句号和逗号会被忽略：1.000 = 1,000 = 1000。</p>
	            <dl>
	                <dt>10</dt>
	                <dd>单个数字将查找具有该确切数值的作品。</dd>
	                <dt><100</dt>
	                <dd>查找数值小于该数的作品。</dd>
	                <dt>>100</dt>
	                <dd>查找数值大于该数的作品。</dd>
	                <dt>100–1000</dt>
	                <dd>查找数值在 100 到 1000 范围内的作品。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：数值 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“语言”相关的帮助文本框。
	 */
	function translateWorkSearchLanguageTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search language help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：语言</h4>
	            <p>从此下拉菜单中选择一种语言即可搜索该语言的作品。请注意，此列表包含我们当前支持的所有语言，并非所有选项都能返回结果。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：语言 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“标签”相关的帮助文本框。
	 */
	function translateWorkSearchTagsTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search tags help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：标签</h4>
	            <p>
	                “同人圈”、“角色”、“关系”以及“附加标签”字段在输入搜索词时会提供标签建议。选择“规范”或常用标签（即自动补全列表中出现的标签）将匹配出所有包含该标签、本标签的同义标签以及与之关联的子标签的结果。例如，选中规范关系标签 <samp>Erika Mustermann/Juan Pérez</samp> 后，系统也会匹配出被标注为 <samp>Juan Pérez/Erika Mustermann</samp> 的作品，前提是这些标签已由标签管理员在后台关联完成。更多信息可参阅<a href="/faq/tags#whatcanonical">“什么是‘规范’标签？”</a>。
	            </p>
	            <p>
	                如果某个标签未出现在自动补全列表中，并不代表该标签在 Archive 中不存在；它可能仅尚未被标签管理员标记为常用标签。您可以在此字段输入任意词语或短语。如果您的短语未精确匹配某个常用标签，搜索则会检索所有包含该短语中词语的标签。例如，输入 <kbd>People Doing Things</kbd> 同时也会匹配 <samp>Nice People Doing Things</samp>、<samp>People Doing Shady Things</samp> 和 <samp>People Doing Things with Spoons</samp> 等标签。但在这种情况下，搜索结果可能会比较不可预测。
	            </p>
	            <p>
	                输入的搜索词越多、选项越多，搜索结果就越精确。默认情况下，所有搜索条件之间是 AND 关系：输入两个同人圈时，只会匹配出同时包含这两个同人圈标签的作品，而不是两个同人圈<em>任意一个</em>的所有作品；同理，输入两个角色时，只会匹配出同时包含这两个角色的作品；同时选中 <samp>女/男</samp> 和 <samp>男/男</samp> 关系标签，则仅会匹配出同时包含这两种关系标签的作品，依此类推。
	            </p>
	            <p>
	                更多关于标签的内容请参阅我们的<a href="/faq/tags">标签常见问题（Tags FAQ）</a>，更多关于标签搜索的说明请参阅<a href="/faq/search-and-browse/">搜索与浏览常见问题（Search and Browse FAQ）</a>。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：标签 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /people/search 页面上“用户搜索”相关的帮助文本框。
	 */
	function translatePeopleSearchTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'People search all fields') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>用户搜索：搜索所有字段</h4>
	            <p>
	                在“搜索所有字段”中输入文本，以查找用户名、笔名或笔名描述中包含搜索词的用户。
	            </p>
	            <p>
	                字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。
	            </p>
	            <dl>
	                <dt>*: 匹配任意字符</dt>
	                <dd><kbd>User*</kbd> 将匹配 <samp>User</samp>、<samp>Users</samp> 和 <samp>Username </samp>。</dd>
	                <dt>空格: 相当于 AND</dt>
	                <dd><kbd>A. User</kbd> 将匹配 <samp>A. User</samp> 和 <samp>A. Test User</samp>，但不会匹配 <samp>User </samp>。</dd>
	                <dt>|: OR (非排她性)</dt>
	                <dd><kbd>A. | User</kbd> 将匹配 <samp>A.</samp>、<samp>A. User</samp> 和 <samp>User </samp>。</dd>
	                <dt>"": 精确匹配词组</dt>
	                <dd><kbd>"A. User"</kbd> 将匹配 <samp>"A. User"</samp>，但不会匹配 <samp>A. Test User </samp>。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '用户搜索：所有字段 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“文本”相关的帮助文本框。
	 */
	function translateBookmarkSearchTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search text help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：文本</h4>
	            <p>使用以下指南输入搜索词和搜索运算符。“任意字段”会组合搜索表单中的所有文本字段（包括标签）。“书签创建者”可让您搜索由特定用户创建的书签。“注释”会在所有书签创建者的注释中搜索词条。</p>
	            <p>字符“:”和“@”具有特殊含义。请不要在搜索中使用它们，否则会得到意想不到的结果。</p>
	            <dl>
	                <dt>*: 匹配任意字符</dt>
	                <dd><kbd>book*</kbd> 会匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
	                <dt>空格: 相当于 AND</dt>
	                <dd><kbd>Harry Potter</kbd> 会匹配 <samp>Harry Potter</samp> 和 <samp>Harry James Potter</samp>，但不会匹配 <samp>Harry</samp>。</dd>
	                <dt>||: OR (非排她性)</dt>
	                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
	                <dt>"": 精确匹配词组</dt>
	                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
	                <dt>-: NOT (排除)</dt>
	                <dd><kbd>Harry -Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：文本 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“作品标签”相关的帮助文本框。
	 */
	function translateBookmarkSearchWorkTagsTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search work tag') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：作品标签</h4>
	            <p>
	                “作品标签”字段会搜索条目创建者为已创建书签作品添加的所有标签，不包括书签创建者自己添加的标签。标签类型可为：分级、预警、分类、同人圈、角色、关系、附加标签。该字段在您输入搜索关键词时会建议规范标签。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：作品标签 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“类型”相关的帮助文本框。
	 */
	function translateBookmarkSearchTypeTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search type help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：类型</h4>
	            <p>
	                选择已创建书签条目的类型，以将搜索结果限制为“作品”、“系列”或“外部作品”。请注意，选择“外部作品”时，将匹配出所有托管于 Archive 之外的作品的书签。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：类型 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“更新日期”相关的帮助文本框。
	 */
	function translateBookmarkSearchDateUpdatedTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search date updated help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：更新日期</h4>
	            <p>指定一个时间范围，以查找在该时间段内发布或更新的已创建书签条目，例如有新章节的作品或有新作品的系列。如果作品被创作者自定义发布日期（即上传时设置了与实际上传日期不同的发布日期），则该自定义发布日期将用于本次搜索。</p>
	            <p>您可以按 year, month, week, day, hour（年、月、周、天或小时）进行搜索。</p>
	            <h5>示例：</h5>
	            <dl>
	                <dt>< 3 days ago</dt>
	                <dd>查找过去 3 天内发布或更新的书签条目。</dd>
	                <dt>> 3 years ago</dt>
	                <dd>查找 3 年之前发布或更新的书签条目。</dd>
	                <dt>3-9 months ago</dt>
	                <dd>查找 3 到 9 个月前发布或更新的书签条目。</dd>
	            </dl>
	            <p>“ago”（之前/前）一词是可选的。请注意，“ 1 天前”并不是一个范围，只会查找恰好在昨天此时更新的条目。如有需要，应当创建一个区间来搜索。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：更新日期 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“书签创建者的标签”相关的帮助文本框。
	 */
	function translateBookmarkSearchBookmarkerTagsTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search bookmarker tag') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：书签创建者标签</h4>
	            <p>
	                “书签创建者的标签”字段会搜索书签创建者为该书签添加的所有标签，不包括作品或系列本身的标签。标签类型可为：分级、预警、分类、同人圈、角色、关系、附加标签。该字段在您输入搜索词时会建议规范标签。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：书签创建者标签 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“推荐”相关的帮助文本框。
	 */
	function translateBookmarkSearchRecTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search rec help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：推荐</h4>
	            <p>
	                选择此选项可将搜索范围限定为书签创建者标记为“推荐”的书签。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：推荐 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“含注释”相关的帮助文本框。
	 */
	function translateBookmarkSearchNotesTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search notes help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：含注释</h4>
	            <p>
	                选择此选项可将搜索范围限定为带有书签创建者添加注释的书签。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：注释 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“添加日期”相关的帮助文本框。
	 */
	function translateBookmarkSearchDateBookmarkedTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark search date bookmarked help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>书签搜索：添加日期</h4>
	            <p>指定一个时间范围，以查找在该时间段内创建的书签。这可能与已创建书签条目的发布或更新时间不同。</p>
	            <p>您可以按 year, month, week, day, hour（年、月、周、天或小时）进行搜索。</p>
	            <h5>示例：</h5>
	            <dl>
	                <dt>< 3 days ago</dt>
	                <dd>查找过去 3 天内创建的书签。</dd>
	                <dt>> 3 years ago</dt>
	                <dd>查找 3 年之前创建的书签。</dd>
	                <dt>3-9 months ago</dt>
	                <dd>查找 3 到 9 个月前创建的书签。</dd>
	            </dl>
	            <p>“ago”（之前/前）一词是可选的。请注意，“ 1 天前”并不是一个范围，只会查找恰好在昨天此时创建的书签。如有需要，应当创建一个区间来搜索。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签搜索：添加日期 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /tags/search 页面上“文本搜索”相关的帮助文本框。
	 */
	function translateTagSearchTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Tag search text help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签搜索：文本</h4>
	            <dl>
	                <dt>*: 匹配任意字符</dt>
	                <dd><kbd>book*</kbd> 会匹配 <samp>book</samp>、<samp>books</samp> 和 <samp>booking</samp>。</dd>
	                <dt>空格: 相当于 AND</dt>
	                <dd><kbd>Harry Potter</kbd> 会匹配 <samp>Harry Potter</samp> 和 <samp>Harry James Potter</samp>，但不会匹配 <samp>Harry</samp>。</dd>
	                <dt>||: OR (非排她性)</dt>
	                <dd><kbd>Harry || Potter</kbd> 会匹配 <samp>Harry</samp>、<samp>Harry Potter</samp> 和 <samp>Potter</samp>。</dd>
	                <dt>"": 精确匹配词组</dt>
	                <dd><kbd>"Harry Lockhart"</kbd> 会匹配 <samp>Harry Lockhart</samp>，但不会匹配 <samp>Harry Potter/Gilderoy Lockhart</samp>。</dd>
	                <dt>NOT: 排除</dt>
	                <dd><kbd>Harry NOT Lockhart</kbd> 会匹配 <samp>Harry Potter</samp>，但不会匹配 <samp>Harry Lockhart</samp> 或 <samp>Gilderoy Lockhart/Harry Potter</samp>。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '标签搜索：文本 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“图标说明”弹窗
	 */
	function translateSymbolsKeyModal() {
		const footerTitle = document.querySelector('#modal div.footer span.title');
		if (!footerTitle || footerTitle.textContent !== 'Symbols key') {
			return;
		}
		const modal = footerTitle.closest('#modal');
		if (!modal) {
			return;
		}
		const mainTitle = modal.querySelector('div.content.userstuff > h4');
		if (mainTitle) {
			mainTitle.textContent = '在 AO3 上使用的图标';
		}
		const sections = modal.querySelectorAll('#symbols-key > dd');
		if (sections.length === 4) {
			const ratingDefs = sections[0].querySelectorAll('dl > dd');
			if (sections[0].querySelector('h4')) sections[0].querySelector('h4').textContent = '内容分级';
			if (ratingDefs.length === 5) {
				ratingDefs[0].textContent = '全年龄';
				ratingDefs[1].textContent = '青少年及以上';
				ratingDefs[2].textContent = '成人向';
				ratingDefs[3].textContent = '限制级：仅适合成年人';
				ratingDefs[4].textContent = '该作品未设定任何分级';
			}
			const relDefs = sections[1].querySelectorAll('dl > dd');
			if (sections[1].querySelector('h4')) sections[1].querySelector('h4').textContent = '关系、配对与性向';
			if (relDefs.length === 7) {
				relDefs[0].textContent = '女/女：女性/女性配对';
				relDefs[1].textContent = '女/男：女性/男性配对';
				relDefs[2].innerHTML = '无CP：无恋爱关系或性关系, 或者恋爱关系并非作品重点';
				relDefs[3].textContent = '男/男：男性/男性配对';
				relDefs[4].innerHTML = '多配对：含有一种以上的配对，或者含有数个伴侣的配对';
				relDefs[5].textContent = '其她关系';
				relDefs[6].textContent = '该作品未被归入任何分类';
			}
			const warnDefs = sections[2].querySelectorAll('dl > dd');
			if (sections[2].querySelector('h4')) sections[2].querySelector('h4').textContent = '内容预警';
			if (warnDefs.length === 4) {
				warnDefs[0].innerHTML = '作者选择不标注预警，或 Archive 预警<em>可能 </em>适用，但作者未具体说明。';
				warnDefs[1].innerHTML = '至少包含以下预警之一：暴力场景描写、主要角色死亡、强暴/<acronym title="非自愿性行为">非自愿性行为</acronym>、未成年性爱。具体预警请参阅 Archive 预警标签。';
				warnDefs[2].innerHTML = '该作品未标注任何 Archive 预警。请注意，作者可能在“附加标签”（类型、预警、其她信息）部分提供了有关作品的其她信息。';
				warnDefs[3].innerHTML = '这是外部作品；请查看该作品本身以获知预警。';
			}
			const statusDefs = sections[3].querySelectorAll('dl > dd');
			if (sections[3].querySelector('h4')) sections[3].querySelector('h4').textContent = '作品是否完结或同人梗是否实现？';
			if (statusDefs.length === 3) {
				statusDefs[0].textContent = '该作品正在连载或尚未完成/同人梗尚未实现。';
				statusDefs[1].textContent = '该作品已完结/该同人梗已实现！';
				statusDefs[2].textContent = '该作品状态未知。';
			}
		}
		footerTitle.textContent = '图标说明';
		const closeButton = modal.querySelector('div.footer a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
		modal.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专门用于翻译“富文本”帮助弹窗。
	 */
	function translateRteHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Rte help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h2>富文本</h2>
	            <p>富文本编辑器（<abbr title="富文本编辑器">RTE</abbr>）的具体行为取决于您的设备、浏览器、操作系统以及您粘贴内容的来源。但是，从一个格式规范的文档开始，将有助于您最大程度地利用 <abbr>RTE</abbr> 。以下是一些通用技巧，以确保您的格式尽可能被保留：</p>
	            <ul>
	                <li><p><strong>在段落之间按<em>一次</em> <kbd>Enter</kbd> 键。</strong>按两次 <kbd>Enter</kbd> 会插入一个空段落，当您粘贴到 <abbr>RTE</abbr> 时，会在段落之间产生额外的、可能不需要的空格。Archive 使用顶部和底部边距来制造段落间的空行效果；您可以使用文本编辑器中的段落格式选项来达到类似效果，而无需添加额外的 <code>&lt;p&gt;</code> 标签。</p></li>
	                <li><p><strong>为标题、块引用、代码等使用预设样式。</strong>通常在文本编辑器的 “格式” 菜单中找到的 “样式” 选项，在粘贴到 <abbr>RTE</abbr> 时通常会转换为 <abbr title="超文本标记语言">HTML</abbr> 标签。仅仅通过改变字体大小、字体名称或文本缩进来模拟标题或块引用的视觉效果，通常是不会起作用的。</p></li>
	            </ul>
	            <h3>从特定文本编辑器粘贴</h3>
	            <h4>Google Drive</h4>
	            <p>Google Drive 使用内联 <abbr title="层叠样式表">CSS</abbr> 来改变文本对齐方式以及产生粗体、斜体、下划线和删除线格式。遗憾的是，我们不允许在 Archive 上使用内联样式，因此只有纯 <abbr>HTML</abbr> 格式（如标题、列表、链接和表格）会被保留。</p>
	            <p>在某些浏览器中，格式在粘贴到 <abbr>RTE</abbr> 时可能看起来被保留了，但在预览或发布您的作品时，它将被我们的 <abbr>HTML</abbr> 清理程序移除。</p>
	            <h4>Scrivener</h4>
	            <p>Scrivener 用户通常通过粘贴到 <abbr>HTML</abbr> 编辑器，然后切换到 <abbr>RTE</abbr> 进行修改，可以获得更好的效果。要从 Scrivener 复制 HTML，请执行以下操作：</p>
	            <ol>
	                <li>转到 “编辑” 菜单</li>
	                <li>选择 “特殊复制”</li>
	                <li>选择 “以 HTML 格式复制” 或 “以 HTML 格式复制（基础，使用 &lt;p&gt; 和 &lt;span&gt;）”</li>
	            </ol>
	            <h3>粘贴特定类型的格式</h3>
	            <h4>下划线和删除线</h4>
	            <p>下划线和删除线通常由 <abbr>CSS</abbr> 产生。因为 Archive 不允许使用内联 <abbr>CSS</abbr>，这些文本样式在粘贴时经常会丢失。</p>
	            <p>从使用 <code>&lt;u&gt;</code>、<code>&lt;del&gt;</code>、<code>&lt;strike&gt;</code> 或 <code>&lt;s&gt;</code> 标签的网页粘贴将可以正常工作。</p>
	            <h4>对齐</h4>
	            <p>文本对齐现在通常通过 <abbr>CSS</abbr> 实现，并且因为 Archive 不允许内联 <abbr>CSS</abbr>，对齐方式在粘贴时通常会丢失。</p>
	            <p>从使用 <code>align</code> 属性和 <code>&lt;center&gt;</code> 元素的来源粘贴将保持格式完整，但请注意，<abbr>RTE</abbr> 中的对齐按钮无法修改用 <code>&lt;center&gt;</code> 标签创建的居中对齐。</p>
	            <h4>标题</h4>
	            <p>文本编辑器为其标题预设使用许多不同的样式。例如，在 OpenOffice 中选择 “标题 4” 会产生斜体的无衬线文本。即使成功将标题粘贴到 <abbr>RTE</abbr> 中，这种视觉格式也<em>不会</em>被保留——只有 <code>&lt;h4&gt;</code> 标签会被保留。这不是 bug 。<abbr>HTML</abbr> 旨在告诉浏览器文本的含义（例如：“这是一个标题” ），而不是它应该如何显示（例如：“这应该是 Arial 字体” ）。如果您希望修改标题或作品任何其她部分的样式，请使用作品界面。</p>
	            <h4>缩进文本</h4>
	            <p>缩进文本是一种纯粹的视觉效果，没有等效的 <abbr>HTML</abbr>，并且不会被保留。请使用作品界面来缩进文本。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '富文本 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“HTML帮助”弹窗
	 */
	function translateHtmlHelpModal() {
		const modal = document.querySelector('#modal');
		if (!modal) return;
		const h2 = modal.querySelector('h2');
		if (!h2 || !h2.textContent.includes('HTML on the Archive')) {
			return;
		}
		const contentDiv = modal.querySelector('.content.userstuff');
		if (!contentDiv) return;
		contentDiv.innerHTML = `
	        <h2>Archive 上的 HTML</h2>
	        <h3>允许的 HTML</h3>
	        <p>
	            <code>a, abbr, acronym, address, [align], [alt], [axis], b, big, blockquote, br, caption, center, cite, [class], code, col, colgroup, dd, del, details, dfn, div, dl, dt, em, figcaption, figure, h1, h2, h3, h4, h5, h6, [height], hr, [href], i, img, ins, kbd, li, [name], ol, p, pre, q, rp, rt, ruby, s, samp, small, span, [src], strike, strong, sub, summary, sup, table, tbody, td, tfoot, th, thead, [title], tr, tt, u, ul, var, [width]</code>
	        </p>
	        <h3>我们如何格式化您的 HTML？</h3>
	        <p>当您在 Archive 上输入 HTML 时，我们会对其进行清理，以确保安全（防止垃圾邮件发送者和黑客上传恶意内容），并为方便您和提高可访问性做一些基本格式化。我们采取的格式化步骤如下：</p>
	        <ul>
	            <li>如果您在两段文字间留有空行，我们会为您自动在这两段文字外加上 &lt;p&gt; 段落标签。</li>
	            <li>如果您在两行文字间只有一个换行符，我们会为您插入 &lt;br /&gt; 换行标签。</li>
	            <li>如果您连续使用两个换行标签（&lt;br /&gt;&lt;br /&gt;）且中间没有内容，我们会将其转换为段落标签。</li>
	            <li>如果您连续留有两个空行，我们会为您插入额外的空白（使用 &lt;p&gt;&nbsp;&lt;/p&gt;）。</li>
	            <li>如果您有错误嵌套的标签，例如：&lt;em&gt;&lt;strong&gt;<em><strong>text!</em></strong>&lt;/em&gt;&lt;/strong&gt; ，我们会自动修正嵌套顺序（调整为：&lt;em&gt;&lt;strong&gt;<em><strong>text!</em></strong>&lt;/strong&gt;&lt;/em&gt; ）。</li>
	            <li>如果您忘记关闭某个格式化标签，该标签会在段落末尾自动关闭。</li>
	            <li>如果您在一段中打开了格式化标签但在几段之后才关闭，我们会在每个段落内重新打开并关闭该标签。</li>
	            <li>如果您插入了自定义 HTML（例如在 &lt;ul&gt; 中的项目列表），且不希望我们自动插入换行或段落标签，只需将所有内容写在同一行即可（这是为了自动段落/换行标签与自定义 HTML 兼容所做的不便折衷）。</li>
	            <li>如果某段文字显示得比其她文字大，可能是我们的格式化程序无法识别段落边界。您可以手动为该段文字添加段落标签来修复。</li>
	        </ul>
	        <p class="note">当您第一次输入 HTML 后再次编辑时，您将看到我们格式化的结果，以便纠正任何我们的格式化程序可能造成的错误。请注意，获得良好效果的最佳方式是输入规范的 HTML——这样您的作品在各浏览器、屏幕阅读器、移动设备和下载时都会正确显示。</p>
	        <p class="note">“良好 HTML” 意味着能准确标注文本含义的 HTML——如果是段落，应使用段落标签，而不仅仅是使用换行标签分隔。如果是强调文字，应使用 &lt;em&gt; 标签。如果是项目列表，每个项目都应放在列表标签内。如果&lt;em&gt;不是&lt;/em&gt;一个项目列表，您就不应该使用列表标签。:)</p>
	        <p class="note">如果您发现自己为了达到某种视觉效果而输入了不符合语义的 HTML，请尽量避免！“作品界面”功能允许您对作品应用自定义 CSS，让它们呈现您想要的任何样式（前提是从“良好 HTML”开始会更容易）。</p>
	        <p>一些具体建议：</p>
	        <dl id="help">
	            <dt>标题，使用标题标签： <code>h1、h2、h3、h4、h5、h6</code></dt>
	            <dd id="headings">
	            <ul>
	                <li><h1>&lt;h1&gt;标题&lt;h1&gt;<h1></li>
	                <li><h2>&lt;h2&gt;副标题&lt;h2&gt;<h2></li>
	                <li><h3>&lt;h3&gt;章节标题&lt;h3&gt;</li>
	                <li><h4>&lt;h4&gt;场景标题&lt;h4&gt;<h4></li>
	                <li><h5>&lt;h5&gt;小标题&lt;h5&gt;<h5></li>
	                <li><h6>&lt;h6&gt;脚注标题&lt;h6&gt;</li>
	            </ul>
	            </dd>
	            <dt>强调，使用强调标签： <code>em、strong</code></dt>
	            <dd id="emphasis">
	            <ul>
	                <li><p>&lt;em&gt;<em>Rodney</em>&lt;/em&gt;Mckay</p></li>
	                <li><p>我 &lt;strong&gt;<strong>永远都不会</strong>&lt;/strong&gt;理解你！</p></li>
	            </ul>
	            </dd>
	            <dt>引用诗歌、短句或书名，使用引用标签： <code>blockquote、q、cite</code></dt>
	            <dd id="quotes">
	            <ul>
	                <li>&lt;blockquote&gt;<blockquote><p>引用一段文字</p></blockquote>&lt;/blockquote&gt;</li>
	                <li><p>使用 q 来&lt;q&gt;<q>引用短句</q>&lt;/q&gt;</p></li>
	                <li><p>使用 cite 来引用&lt;cite&gt;<cite>书名或文章名</cite>&lt;/cite&gt;</p></li>
	            </ul>
	            </dd>
	        </dl>`;

		const footer = modal.querySelector('div.footer');
		if (footer) {
			footer.querySelector('.title').textContent = 'Html 帮助';
			footer.querySelector('.action').textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“书签搜索结果”帮助弹窗
	 */
	function translateBookmarkSearchResultsHelpModal() {
		const modal = document.querySelector('#modal');
		if (!modal) {
			return;
		}
		const footerTitle = modal.querySelector('.footer .title');
		if (!footerTitle || footerTitle.textContent.trim() !== 'Bookmark search results help') {
			return;
		}
		const h4 = modal.querySelector('.content.userstuff h4');
		if (h4) {
			h4.textContent = '书签搜索：结果';
		}
		const p = modal.querySelector('.content.userstuff p');
		if (p) {
			const workSearchLink = p.querySelector('a[href="/works/search"]');
			if (workSearchLink) {
				workSearchLink.textContent = '“作品搜索”';
				p.innerHTML = `结果按相关性排序。请注意，列表会包含某个作品的所有书签，因为每条书签都会单独计入结果。要搜索作品而非书签，请使用 ${workSearchLink.outerHTML} 。`;
			}
		}
		footerTitle.textContent = '书签搜索：结果 帮助';
		const closeButton = modal.querySelector('.footer a.action');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
		modal.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译“关于标签集”弹窗
	 */
	function translateTagsetAboutModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Tagset about') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>关于标签集</h4>
	            <p>如果您曾想在 Archive 举办挑战活动，就可以使用标签集。您可以创建一个标签集，列出所有应当出现在报名表单中的标签，即使这些标签此前在 Archive 上尚未使用过，然后将此标签集添加到您的挑战活动中。报名表单将自动显示标签集中包含的标签。</p>
	            <p>您可以添加任意数量的管理员协助管理标签集（无需开放活动设置权限），还可以允许活动参与者提名要添加到标签集的新标签。您及管理员可审核这些提名，并选择批准或拒绝。您可以为标签集中的新标签添加同人圈关联，或交由标签管理员处理（这可能需要一些时间）。</p>
	            <p>所有标签集均展示于“标签集主页面”，浏览它们有助于您更深入理解其运作机制。</p>
	            <p>部分用户可能会选择将自己的标签集公开共享，供她人在活动中使用。请注意，标签集的所有者可以随时<strong>删除或修改标签集而不另行通知</strong>，因此在使用她人标签集举办挑战活动前，请务必确认该标签集所有者不会对其进行变更。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '关于标签集';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门翻译“标签提名”页面的提名规则说明。
	 * @param {string} originalText - 匹配到的原始英文句子。
	 * @returns {string} - 动态构建的中文翻译。
	 */
	function translateNominationRule(originalText) {
		const componentRules = {
			fandoms: {
				regex: /([\d,]+) fandoms/,
				template: "$1 个同人圈"
			},
			characters: {
				regex: /([\d,]+) characters/,
				template: "$1 个角色"
			},
			relationships: {
				regex: /([\d,]+) relationships/,
				template: "$1 对关系"
			},
			additionalTags: {
				regex: /([\d,]+) additional tags/,
				template: "$1 个附加标签"
			}
		};
		const parts = {};
		for (const key in componentRules) {
			const match = originalText.match(componentRules[key].regex);
			if (match) {
				parts[key] = match[1];
			}
		}
		if (Object.keys(parts).length === 0) {
			return originalText;
		}
		const mainClauses = [];
		const perFandomClauses = [];
		let additionalTagClause = '';
		const hasFandomContext = !!parts.fandoms || originalText.includes('for each one');
		if (parts.fandoms) {
			mainClauses.push(componentRules.fandoms.template.replace('$1', parts.fandoms));
		}
		if (!hasFandomContext) {
			if (parts.characters) mainClauses.push(componentRules.characters.template.replace('$1', parts.characters));
			if (parts.relationships) mainClauses.push(componentRules.relationships.template.replace('$1', parts.relationships));
			if (parts.additionalTags && !originalText.includes('You can also nominate')) {
				mainClauses.push(componentRules.additionalTags.template.replace('$1', parts.additionalTags));
			}
		}
		if (hasFandomContext) {
			if (parts.characters) perFandomClauses.push(componentRules.characters.template.replace('$1', parts.characters));
			if (parts.relationships) perFandomClauses.push(componentRules.relationships.template.replace('$1', parts.relationships));
		}
		if (parts.additionalTags && originalText.includes('You can also nominate')) {
			additionalTagClause = ` 您也可以最多提名 ${componentRules.additionalTags.template.replace('$1', parts.additionalTags)}。`;
		}
		let finalTranslation = '';
		if (mainClauses.length > 0) {
			finalTranslation = `您最多可提名 ${mainClauses.join('和 ')}`;
		}
		if (perFandomClauses.length > 0) {
			if (finalTranslation === '') {
				finalTranslation = `您最多可为每个同人圈提名 ${perFandomClauses.join('和 ')}。`;
			} else {
				finalTranslation += `，最多可为每个同人圈提名 ${perFandomClauses.join('和 ')}。`;
			}
		} else if (finalTranslation !== '') {
			finalTranslation += '。';
		}
		finalTranslation += additionalTagClause;
		return finalTranslation.trim() || originalText;
	}

	/**
	 * 专用翻译函数：翻译“预警”相关的帮助文本框
	 */
	function translateWarningHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Warning help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>预警标签</h4>
	            <p>由于法律及其她原因，AO3 要求用户必须为一组常见预警（血腥暴力描写、主要角色死亡、强暴/非自愿性行为、未成年性行为）选择是否预警。创作者可在此框架内选择不预警其中某些内容，或添加额外预警。</p>
	            <dl>
	                <dt>不使用 Archive 预警：</dt>
	                <dd>如果您不想为任何内容添加预警，或不知道应当预警什么，或不喜欢对特定话题或预警本身进行标注，或想避免部分剧透，可选择此项。</dd>
	                <dt>暴力场景描写：</dt>
	                <dd>用于描述血腥、露骨的暴力场面。具体界限由您自行判断。</dd>
	                <dt>主要角色死亡：</dt>
	                <dd>请自行判断哪些角色属于“主要角色”。</dd>
	                <dt>Archive 预警不适用：</dt>
	                <dd>如果您的内容不包含血腥暴力描写、主要角色死亡、强暴/非自愿性行为或未成年性行为，请选择此项。</dd>
	                <dt>强暴/非自愿性行为：</dt>
	                <dd>如您认为内容可能涉及非自愿性行为，但不确定或不想使用此预警，可选择“不使用 Archive 预警”。</dd>
	                <dt>未成年性行为：</dt>
	                <dd>用于描述或描绘十八岁以下角色的性行为（不包括亲吻等约会行为或无具体描写的模糊提及）。此预警一般适用于人类；如涉外星人或千年吸血鬼等特殊设定，请酌情判断。您也可注明角色年龄或选择“不使用 Archive 预警”。</dd>
	            </dl>
	            <p>您还可以使用“附加标签”字段添加其她或更详细的预警。有关预警的政策请参阅<a href="/content#II.J">服务条款</a>及<a href="/tos_faq#ratings_warnings_faq">服务条款常见问题</a>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '预警 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“同人圈”相关的帮助文本框
	 */
	function translateFandomHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Fandom help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>同人圈标签</h4>
	            <p>您的作品所属的同人圈名称。请使用全称，而非缩写。您可以列出多个同人圈，使用逗号分隔（例如，您的作品是跨圈同人文）。</p>
	            <p>要了解有关标签的更多信息，包括如何添加 Archive 上尚不存在的标签，请参阅我们的<a href="/faq/tags">标签常见问题解答</a>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '同人圈 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“书签图标”说明弹窗
	 */
	function translateBookmarkSymbolsKeyModal() {
		const footerTitle = document.querySelector('#modal div.footer span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark symbols key') {
			return;
		}
		const modal = footerTitle.closest('#modal');
		if (!modal) {
			return;
		}
		const mainTitle = modal.querySelector('div.content.userstuff > h4');
		if (mainTitle) {
			mainTitle.textContent = '书签图标';
		}
		const definitions = modal.querySelectorAll('#bookmark-symbols-key > dd');
		const translations = [
			'推荐',
			'公开书签',
			'私人书签',
			'此书签已被管理员隐藏'
		];
		if (definitions.length === translations.length) {
			definitions.forEach((dd, index) => {
				dd.textContent = translations[index];
			});
		}
		footerTitle.textContent = '书签图标说明';
		const closeButton = modal.querySelector('div.footer a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
		modal.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译“分级”相关的帮助文本框
	 */
	function translateRatingHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Rating help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>分级标签</h4>
	            <p>（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）</p>
	            <dl id="help">
	                <dt>未分级 (Adult!)</dt>
	                <dd>
	                    在搜索、筛选及其她 Archive 功能中，未分级内容可能与限制级内容受到同等处理。实际上，其内容可能涵盖色情至完全适合家庭观看的各类作品。若您不想为内容评级（例如不喜欢评级、避免剧透等），请选择此项。
	                </dd>
	                <dt>全年龄</dt>
	                <dd>
	                    内容适合所有读者。
	                </dd>
	                <dt>青少年及以上</dt>
	                <dd>
	                    内容可能不适合 13 岁以下读者。
	                </dd>
	                <dt>成人向 (Adult!)</dt>
	                <dd>
	                    适用于含有成人主题（性、暴力等），但描写不如“限制级”血腥的作品。
	                </dd>
	                <dt>限制级 (Adult!)</dt>
	                <dd>
	                    适用于含有色情、血腥暴力等内容的作品。
	                </dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '分级 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译分类标签帮助弹窗。
	 */
	function translateCategoriesHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Categories help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>分类标签</h4>
	            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
	            <p>Archive 上的作品分为 6 类。以下为各缩写含义，具体定义因同人圈和用户而异；请选择最适用的分类，或留空：</p>
	            <dl>
	                <dt>女/女</dt>
	                <dd>女性/女性配对</dd>
	                <dt>女/男</dt>
	                <dd>女性/男性配对</dd>
	                <dt>无CP</dt>
	                <dd>无恋爱关系或性关系, 或者恋爱关系并非作品重点</dd>
	                <dt>男/男</dt>
	                <dd>男性/男性配对</dd>
	                <dt>多配对</dt>
	                <dd>含有一种以上的配对，或者含有数个伴侣的配对</dd>
	                <dt>其她</dt>
	                <dd>其她关系</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '分类 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译关系标签帮助弹窗。
	 */
	function translateRelationshipsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Relationships help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>关系标签</h4>
	            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
	            <p>对于您作品中存在的关系，请尽可能使用全名（例如"Mickey Mouse/Minnie Mouse"或"Rodney McKay &amp; John Sheppard"），可通过逗号分隔列出多个关系。请注意，所有用户创建的标签均不得超过 150 字符；若作品包含大型多角关系或名称较长的多名角色，建议将名称缩短为仅有名字或带首字母的姓氏，以避免超过字符限制且保持可识别性。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '关系 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译角色标签帮助弹窗。
	 */
	function translateCharactersHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Characters help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>角色标签</h4>
	            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
	            <p>您作品中的主要角色，请使用全名并以逗号分隔。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '角色 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Additional Tags"帮助弹窗的文本。
	 */
	function translateAdditionalTagsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Additional tags help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>附加标签</h4>
	            <p>（要了解更多信息，请参阅 <a href="/faq/tags">Archive 标签常见问题</a>。）</p>
	            <p>您希望为作品添加的其她标签（例如："虐心"、"跨圈"或"触手"）。您也可以用此字段来标注 Archive 预警中未涵盖的内容。请不要在此填写同人圈、关系或角色名称。多个标签请用逗号分隔。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '附加标签 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Adding To Collections"帮助弹窗的文本。
	 */
	function translateCollectionsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Add collectible to collection') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>添加到合集</h4>
	            <p>
	                以逗号分隔输入合集名称，您正在编辑的作品将被添加到您指定的所有合集中。
	            </p>
	            <p>
	                请注意，您需要使用合集的名称（用于生成合集网址），而非其展示标题（因为不同合集允许重名）。合集名称与您的用户登录名相同。若启用 JavaScript ，名称会自动补全。
	            </p>
	            <p>
	                另请注意，如果您提交的合集受管理员审核，且您不是成员，您的作品不会自动添加——必须等待管理员批准后才会加入。如果这是匿名和/或未公开的合集，则作品发布后立即以匿名和/或隐藏状态展示，包括在等待审核期间。若作品被拒，则会保持匿名和/或未公开状态，直到您将其从合集中移除或管理员取消关联。
	            </p>
	            <p>
	                如果您改变主意想将作品从合集中移除，可在编辑时修改合集列表，或在账户的"我的合集"页面管理所有已创建书签作品。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '将作品添加到合集';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Recipients"帮助弹窗的文本。
	 */
	function translateRecipientsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Recipients') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>赠文对象</h4>
	            <p>
	                请输入赠文对象的名称，以逗号分隔！
	            </p>
	            <p>
	                如果您的作品是送给某人的礼物或为她们而作，您可以在此输入她们的姓名，作品署名下方会显示这些信息。
	                赠文对象<strong>无需</strong>是 Archive 的注册用户，但如果有匹配的笔名，自动补全会提供建议。我们会通知被选为赠文对象的注册用户。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '赠文对象';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Parent Works Help"帮助弹窗的文本。
	 */
	function translateParentWorksHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Parent works help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>母作品帮助</h4>
	            <p>
	                如果您正在创建新作品，目前只能添加一个灵感来源。
	                若要添加更多，请先保存您的作品，然后在已发布作品页面点击"编辑"按钮，再像之前那样添加新的灵感来源。
	            </p>
	            <p>
	                您添加为灵感来源的所有作品将显示在此表单下方，标题为"当前母作品"。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '母作品 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Choosing Series"帮助弹窗的文本。
	 */
	function translateChoosingSeriesHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Choosing series') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>选择系列</h4>
	            <p>
	                系列是一组相关的故事，每个故事独立完整。
	                您可以随时在个人中心中创建新系列或将作品添加到系列中。
	            </p>
	            <p>
	                如果您想发布正在创作中的作品或分章节故事，请选择多章节作品功能。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '选择系列';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Publication Date Options"帮助弹窗的文本。
	 */
	function translateBackdatingHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Backdating help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>发布日期选项</h4>
	            <p>
	                发布作品时，您可以选择设置不同的发布日期——也就是为作品回溯日期。您也可以为各单独章节设置发布日期。请注意，这两种情况下都会影响作品在个人中心和作品页面中的显示顺序和位置。这些页面显示的更新日期，将取您作品或任一章节的发布日期，以较晚者为准。
	            </p>
	            <p>
	                您添加的后续章节将在表单中预填此日期，您仍可手动覆盖该日期。这意味着如果您不清楚或不在意章节的实际发布日期，也能方便地为作品回溯日期。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '回溯日期 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译"Languages"帮助弹窗的文本。
	 */
	function translateLanguagesHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Languages help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>语言</h4>
	            <p>列表中没有您的语言？请<a href="/support">通过支持表单告诉我们</a>，我们会很高兴将其添加！（请放心，您现在可以发布作品，并在稍后更改语言。）外部作品无需选择语言。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '语言 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 Work Skins 弹窗页面的帮助文本。
	 */
	function translateWorkSkins() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work skins') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品界面</h4>
	            <p>
	            您可以像为 Archive 创建界面一样，为您的作品创建自定义样式表或"界面"。主要区别在于，作品界面会改变<strong>其她用户</strong>查看作品的方式，而不仅仅是您自己看到的效果。
	            </p>
	            <p>
	            作品界面<strong>仅</strong>影响所应用作品的正文——无法通过它们更改 Archive 的导航或背景。不过，您可以创建自定义类。例如，您可以更改部分文字的颜色，对某些段落进行特定方式的缩进，等等。
	            </p>
	            <p>
	            例如，假设您希望将文中某个单词设置为亮蓝色，可以按以下步骤操作：
	            </p>
	            <ul>
	            <li>
	                <a href="/skins/new?skin_type=WorkSkin">创建一个作品界面</a>，内容如下：<code>.bluetext {color: blue;}</code>
	            </li>
	            <li>
	                发布作品时选择此界面。
	            </li>
	            <li>
	                在作品的 HTML 中为该单词添加此样式类：<code>I want &lt;span class="bluetext"&gt;house&lt;/span&gt; to be in blue</code>
	            </li>
	            </ul>
	            <p>
	            要了解更多信息，请参阅<a href="/faq/tutorial-creating-a-work-skin">教程：创建作品界面</a>和<a href="/faq/skins-and-archive-interface">界面与 Archive 界面常见问题</a>。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品界面';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 Registered Users 弹窗页面的帮助文本。
	 */
	function translateRegisteredUsers() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Registered users') {
			return;
		}
		if (container) {

			container.innerHTML = `
	            <h4>注册用户</h4>
	            <p>
	            注册用户是拥有 Archive 账号的用户。勾选此选项后，您的作品仅限已登录用户查看。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '注册用户';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 Comments Moderated 弹窗页面的帮助文本。
	 */
	function translateCommentsModerated() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Comments moderated') {
			return;
		}
		if (container) {

			container.innerHTML = `
	            <h4>评论需审核</h4>
	            <p>启用此功能后，您必须审核并批准所有评论，评论才会在作品上公开显示。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '评论需审核';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 Who can comment on this work 弹窗页面的帮助文本。
	 */
	function translateWhoCanComment() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Who can comment on this work') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>谁可以评论此作品？</h4>
	            <dl>
	            <dt>注册用户及访客可评论</dt>
	            <dd>所有用户均可评论（无论是否登录）。</dd>
	            <dt>仅注册用户可评论</dt>
	            <dd><strong>默认选项</strong>，仅登录用户可评论此作品。</dd>
	            <dt>禁止评论</dt>
	            <dd>此选项将禁用所有新的评论。</dd>
	            </dl>
	            <p>更改设置不会影响现有评论。如需删除已有评论，请参阅<a href="/faq/comments-and-kudos#commentother">我能编辑或删除她人留下的评论吗？</a>以了解详情。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '谁可以评论此作品';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译导入疑难解答弹窗的帮助文本。
	 */
	function translateWorkImportTroubleshooting() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work import') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>导入疑难解答</h4>
	            <p>
	            如果您的文本在出现破折号或带重音字符处被截断，您可能需要使用下方的"设置自定义编码"菜单手动设置编码，才能成功导入作品。有效的编码类型可能有所不同；您可能需要尝试多个选项以找到正确的编码。有关更多信息，请参阅<a href="/help/encoding-help.html">编码帮助页面</a>。
	            </p>
	            <p>
	            如果您要从 e-fiction 网站导入带章节的作品，您需要分别输入每一章的 URL ，每行一个。一次最多可以导入 200 个章节。有关从其她网站导入作品的更多信息，请参阅<a href="/faq/posting-and-editing#importwork">"我如何从其她网站导入作品？"</a>
	            </p>
	            <p>
	            如果您想将已发布在 AO3 上的作品从一个用户账户转移到另一个账户，您必须编辑现有作品，将新账户添加为共同创作者，然后移除旧账户。不能使用导入工具处理 AO3 上托管的作品。
	            </p>
	            <p>
	            除非您勾选"覆盖标签和说明"选项框，否则您在"标签"下输入的信息仅在导入工具无法从作品中识别标签时才会使用。
	            </p>
	            <p>
	            导入完成后，您将可以编辑并完善标准的作品信息。有关发布和编辑的更多信息，请参阅<a href="/faq/posting-and-editing">发布与编辑常见问题</a>。
	            </p>
	            <p>
	            如果上述信息都无法解决您的问题，您也许可以在<a href="/known_issues#importing">已知问题</a>页面中找到答案。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品导入';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译编码帮助弹窗的帮助文本。
	 */
	function translateEncodingHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Encoding help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>编码帮助</h4>
	            <p>如果导入工具剥离了作品中的特殊字符（例如变音符号或弯引号），或未能导入整段文本，可能是由于自动检测您作品编码时出现了问题。UTF-8 是常见的编码，但也有其她编码需要您手动指定，以帮助导入工具正确处理您的作品。</p>
	            <p>如果不确定文本使用的编码，可以尝试 ISO-8859-1（通常称为 Latin-1）或 Windows-1252（有时被误称为 ANSI），这两种编码在 Windows 程序的输出中非常常见。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '编码 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /users/edit 页面上“隐私偏好”弹窗的帮助文本。
	 */
	function translatePrivacyPreferences() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Privacy preferences') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>隐私偏好</h4>
	            <dl id="help">
	                <dt>向其她人显示我的邮箱地址</dt>
	                <dd>
	                    启用此选项后，与您的账户关联的电子邮箱地址将在您的用户资料页面公开可见。
	                </dd>
	                <dt>向其她人显示我的出生日期</dt>
	                <dd>
	                    启用此选项后，与您的账户关联的出生日期将在您的用户资料页面公开可见。
	                </dd>
	                <dt>尽可能地对搜索引擎隐藏我的作品</dt>
	                <dd>
	                    启用此选项将告知搜索引擎不要索引您的用户页面、作品或系列。请注意，并非所有搜索引擎都会遵守此设置。列出您作品或系列的页面----例如作品主页面----可能仍会被索引。如果您希望在任何情况下都避免作品或系列被索引，建议将它们仅限 Archive 注册用户可见。
	                </dd>
	                <dt>隐藏我作品中的分享按钮</dt>
	                <dd>
	                    <p>
	                        此偏好设置允许您禁用一键分享按钮。该按钮可让她人将您的作品推荐到 Twitter、Tumblr 等外部网站。
	                    </p>
	                    <p>
	                        请注意，一旦您在线发布了作品，读者仍可复制并粘贴链接到任何位置----如果您想限制对作品的访问，最佳方法是将作品锁定，仅限 Archive 注册用户查看。
	                    </p>
	                </dd>
	                <dt>允许其她人邀请我成为共同创作者</dt>
	                <dd>
	                    <p>
	                        启用此选项将允许其她 AO3 用户邀请您以共创者的身份列在作品、章节或系列中。在您接受邀请前，您不会在网站上任何地方以共创者身份出现。如果启用此选项，您可以在个人中心的“共创者请求”中查看收到的请求，并会收到一封通知邮件。
	                    </p>
	                    <p>
	                        禁用此选项将阻止其她用户邀请您成为作品、章节或系列的共创者，您也不会收到任何通知。
	                    </p>
	                    <p>
	                        更改此设置不会影响任何现有的共创作品。
	                    </p>
	                </dd>
	            </dl>
	            <p>要了解有关偏好设置及其含义的更多信息，请参阅我们的<a href="/faq/preferences">偏好常见问题</a>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '隐私偏好';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“显示偏好”弹窗的内容。
	 */
	function translateDisplayPreferences() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Display preferences') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>显示偏好</h4>
	            <dl id="help">
	            <dt>无需确认即可显示成人内容</dt>
	            <dd>
	                启用此选项后，在显示作品前不会提示您确认是否访问“成人向”、“限制级”或“未分级”作品。
	            </dd>
	            <dt>默认显示全文</dt>
	            <dd>
	                启用此选项后，多章节作品将作为单页显示。
	            </dd>
	            <dt>隐藏内容预警（仍可手动显示）</dt>
	            <dd>
	                启用此选项后，作品上的 Archive 预警标签将默认隐藏。您可以点击“显示预警”查看个别作品的内容预警。此功能需启用 JavaScript 。
	            </dd>
	            <dt>隐藏附加标签（仍可手动显示）</dt>
	            <dd>
	                启用此选项后，作品上的附加标签将默认隐藏。您可以点击“显示附加标签”查看个别作品的附加标签。此功能需启用 JavaScript 。
	            </dd>
	            <dt>隐藏她人作品界面</dt>
	            <dd>
	                启用此选项后，其她用户为其作品设定的自定义界面将不会显示，系统将使用您的默认站点界面。
	            </dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '显示偏好';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“界面基础”弹窗的内容。
	 */
	function translateSkinsBasics() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins basics') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>
	            站点界面可让您在登录账户时自定义浏览体验。不喜欢 Archive 的字体？您可以更改它们！不喜欢红色页眉？换成蓝色！请记住，在创建站点界面时，您只是在为自己更改 Archive ——其她用户将按照她们各自的界面看到 Archive 。换言之，站点界面可帮助您打造理想的个人浏览体验，而不会影响她人查看作品的方式。
	            </p>
	            <p>
	            作品界面可让您更改一个或多个作品在她人眼中的显示方式。作品界面仅影响作品正文——您无法更改 Archive 的导航或背景在其她用户那里显示的样式。但您可以创建自定义样式类，例如更改部分文字的颜色，或以特定方式缩进段落，等等。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面基础';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“作品标题格式”帮助弹窗。
	 */
	function translateWorkTitleFormat() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work_title_format') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品标题格式</h4>
	            <p>指定在阅读作品时浏览器标签页标题的显示方式。示例：</p>
	            <dl>
	            <dt>标题 - 作者 - 同人圈</dt>
	            <dd>这是默认格式</dd>
	            <dt>标题 - 作者</dt>
	            <dd>不包含同人圈</dd>
	            <dt>同人圈_作者_标题</dt>
	            <dd>以同人圈、作者、标题的顺序显示，并用下划线替代连字符。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品标题格式';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“评论偏好”帮助弹窗。
	 */
	function translateCommentPreferences() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Comment preferences') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>评论偏好</h4>
	            <dl id="help">
	            <dt>关闭评论邮件通知</dt>
	            <dd>启用此选项后，当有人在您的作品上发表评论或回复您发表的评论时，您将不会收到电子邮箱提醒。评论通知仍会发送到您的 AO3 收件箱，除非您已选择禁用收件箱通知。</dd>
	            <dt>关闭评论消息通知</dt>
	            <dd>启用此选项后，当有人在您的作品上发表评论或回复您发表的评论时，您将不会在 AO3 收件箱中收到通知。评论通知仍会通过电子邮箱发送给您，除非您已选择禁用电子邮箱通知。</dd>
	            <dt>关闭自己评论的副本通知</dt>
	            <dd>启用此选项后，您将不会收到针对自己发表评论（例如回复自己作品评论）的电子邮箱通知。</dd>
	            <dt>关闭点赞邮件通知</dt>
	            <dd>启用此选项后，当有人对您的作品点赞时，您将不会收到电子邮箱通知。</dd>
	            <dt>不允许游客回复我在动态帖或其她用户作品中的评论</dt>
	            <dd>启用此选项后，未登录 AO3 账户的用户将无法回复您在动态贴或其她用户作品中留下的评论。此设置不适用于您自己的作品评论；如需了解如何控制其她用户与您作品的互动，请参阅<a href="/faq/posting-and-editing#controlaccess">发布与编辑常见问题</a>。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '评论偏好';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“合集、挑战与赠文偏好”帮助弹窗。
	 */
	function translateCollectionPreferences() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Collection preferences') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>合集、活动与赠文偏好</h4>
	            <dl id="help">
	            <dt>允许其她人将我的作品加入合集</dt>
	            <dd>
	                <p>启用此选项后，其她 AO3 用户可邀请您的作品加入其合集。在您接受邀请前，作品不会被添加。要了解有关接受合集邀请的更多信息，请参阅<a href="/faq/collections#collectionitems">如何批准或拒绝包含我的作品的合集邀请</a>。</p>
	                <p>禁用此选项将完全阻止她人邀请您的作品加入其合集，且您不会收到任何通知。</p>
	                <p>更改此设置不会影响已在合集中的现有作品。</p>
	            </dd>

	            <dt>允许任何人向我赠送作品</dt>
	            <dd>若禁用此选项，用户仅可在完成赠文活动分配或满足征稿活动要求时赠送作品给您。若希望允许用户在无分配或征稿要求的情况下赠送作品，请启用此选项。请注意，您随时可以单独拒绝赠文。要了解有关拒绝赠文的操作，请参阅<a href="/faq/your-account#refusegift">如何拒绝赠文</a>。</dd>

	            <dt>关闭来自合集的电子邮箱</dt>
	            <dd>启用此选项后，您将不会收到来自合集的电子邮箱提醒，如作者或作品的揭晓通知。但若您的用户名或作品在加入合集后被隐藏，仍会收到电子邮箱。除非您禁用收件箱通知，合集通知仍会发送到您的 AO3 收件箱。</dd>

	            <dt>关闭来自合集的消息通知</dt>
	            <dd>启用此选项后，您将不会在 AO3 收件箱中收到来自合集的通知，例如隐藏作品揭晓通知。但除非您禁用电子邮箱通知，这些通知仍会以电子邮箱形式发送给您。</dd>

	            <dt>关闭有关赠文的邮件通知</dt>
	            <dd>启用此选项后，当有人赠送作品给您时，您将不会收到电子邮箱提醒。通知仍会显示在您的“接收赠文”页面。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '合集偏好';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“其她偏好”帮助弹窗。
	 */
	function translateMiscPreferences() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Misc preferences') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>其她偏好</h4>
	            <dl id="help">
	            <dt>启用历史记录</dt>
	            <dd>启用后，历史记录会保留您登录时访问的每个作品日志。您可以删除单个作品或清除整个历史记录。如果先启用后再禁用，此前访问的作品仍会保留（但需再次启用历史记录才能查看）。</dd>
	            <dt>重新显示新用户帮助横幅</dt>
	            <dd>启用此选项将重新显示提供入门信息和提示的新用户帮助横幅！</dd>
	            <dt>关闭每个页面的提示横幅</dt>
	            <dd>AO3 可能会通过提示横幅通知用户重要事件或站点变更。如要在登录时隐藏横幅，请启用此选项。请注意，这仅会隐藏您启用时显示的横幅。如横幅内容更换，新横幅将继续显示，直到您再次启用此选项。</dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '其她偏好';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译筛选侧边栏中的“包含标签”帮助文本。
	 */
	function translateTagFiltersIncludeTags() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work filters include tags') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签筛选：包含标签</h4>
	            <p>筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要包括的其她标签”字段。</p>
	            <p>如果您感兴趣的标签不在前十个中，请在“要包括的其她标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本。可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。</p>
	            <p>您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。</p>
	            <p>从类别中选择任意标签,或在“要包括的其她标签”字段中输入标签，将与您选择的所有标签进行 AND 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/works">女/女类别标签的作品</a>，选择 <samp>青少年及以上</samp> 分级，在附加标签类别中选择规范的 <samp>Romance（爱情）</samp> 标签，并在“要包括的其她标签”字段中输入或选择规范的<samp> Drama（剧情） </samp>标签，则结果中只会包含<a href="/works?utf8=%E2%9C%93&work_search[sort_column]=revised_at&work_search[rating_ids][]=11&work_search[freeform_ids][]=60&work_search[other_tag_names]=Drama&work_search[query]=&work_search[language_id]=&work_search[complete]=0&commit=Sort+and+Filter&tag_id=F%2FF">同时带有所有这些标签的作品</a>。</p>
	            <p>若要获取包含 标签A 或 标签B 的结果，请使用“在结果中搜索”字段。</p>
	            <p>要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。</p>
	            <p>要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品筛选：包括标签';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译筛选侧边栏中的“排除标签”帮助文本。
	 */
	function translateTagFiltersExcludeTags() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work filters exclude tags') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签筛选：排除标签</h4>
	            <p>筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要排除的其她标签”字段。</p>
	            <p>如果您想排除的标签不在前十个中，请在“要排除的其她标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。</p>
	            <p>您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。</p>
	            <p>从类别中选择任意标签,或在“要排除的其她标签”字段中输入标签，将与您选择的所有标签进行 OR 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/works">女/女类别标签的作品</a>，选择 <samp>主要角色死亡</samp> 预警，在附加标签类别中选择规范的 <samp>Alternate Universe（平行世界）</samp> 标签，并在“要排除的其她标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，则结果中只会包含<a href="/works?utf8=%E2%9C%93&work_search%5Bsort_column%5D=revised_at&work_search%5Bother_tag_names%5D=&exclude_work_search%5Bwarning_ids%5D%5B%5D=18&exclude_work_search%5Bfreeform_ids%5D%5B%5D=968&work_search%5Bexcluded_tag_names%5D=Drama&work_search%5Bquery%5D=&work_search%5Blanguage_id%5D=&work_search%5Bcomplete%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">不带有<em>任何</em>这些标签的作品</a>。</p>
	            <p>要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。</p>
	            <p>要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品筛选：排除标签';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“包含标签”筛选帮助的文本。
	 */
	function translateBookmarkFiltersIncludeTags() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark filters include tags') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签筛选：包含标签</h4>
	            <p>
	                筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要包括的其她作品标签”和“要包括的其她书签创建者标签”字段。
	            </p>
	            <p>
	                如果您感兴趣的标签不在前十个中，请在“要包括的其她作品标签”或“要包括的其她书签创建者标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。
	            </p>
	            <p>
	                您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”和“搜索书签创建者标签和注释”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。
	            </p>
	            <p>
	                从类别中选择任意标签,或在“要包括的其她作品标签”或“要包括的其她书签创建者标签”字段中输入标签，将与您选择的所有标签进行 AND 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/bookmarks">女/女类别标签的书签</a>，选择 <samp>青少年及以上</samp> 分级，在附加标签类别中选择规范的 <samp>Romance（爱情）</samp> 标签，并在“要包括的其她作品标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，结果中只会包含<a href="/bookmarks?utf8=✓&bookmark_search%5Bsort_column%5D=created_at&include_bookmark_search%5Brating_ids%5D%5B%5D=11&include_bookmark_search%5Bfreeform_ids%5D%5B%5D=60&bookmark_search%5Bother_tag_names%5D=Drama&bookmark_search%5Bother_bookmark_tag_names%5D=&bookmark_search%5Bexcluded_tag_names%5D=&bookmark_search%5Bexcluded_bookmark_tag_names%5D=&bookmark_search%5Bbookmarkable_query%5D=&bookmark_search%5Bbookmark_query%5D=&bookmark_search%5Brec%5D=0&bookmark_search%5Bwith_notes%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">同时带有所有这些标签的作品或系列的书签</a>。
	            </p>
	            <p>
	                若要获取包含标签 A 或 标签 B 的结果，请使用“在结果中搜索”或“搜索书签创建者标签和注释”字段。
	            </p>
	            <p>
	                要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。
	            </p>
	            <p>
	                要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签筛选：包括标签';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /bookmarks/search 页面上“排除标签”筛选帮助的文本。
	 */
	function translateBookmarkFiltersExcludeTags() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Bookmark filters exclude tags') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签筛选：排除标签</h4>
	            <p>
	                筛选器列出了每个标签类别中最常用的十个标签。要使用其她标签进行筛选，请使用“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段。
	            </p>
	            <p>
	                如果您想排除的标签不在前十个中，请在“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段中开始输入所需标签——此处可使用所有标签类别，且可添加任意数量的标签。自动补全列表将帮助您找到标签的<em>规范</em>版本，可充分利用标签规范化结构排除所有关联作品（含子标签及同义标签）。
	            </p>
	            <p>
	                您也可以输入不在自动补全列表中的标签。如果您输入的标签已在 AO3 上使用但未标记为规范标签，则筛选器将查找使用您输入的确切标签的作品。如果您输入的标签在 AO3 上从未被使用，则筛选器将进行简单的文本匹配，可能会带来意想不到的结果。“在结果中搜索”和“搜索书签创建者标签和注释”字段将更准确地进行文本匹配，尤其是在关系标签和其她包含“/”或其她非文字字符的标签的情况下。
	            </p>
	            <p>
	                从类别中选择任意标签，或在“要排除的其她作品标签”或“要排除的其她书签创建者标签”字段中输入标签，将对您选择的所有标签执行 OR 搜索。这意味着，如果您筛选<a href="/tags/F*s*F/bookmarks">女/女类别标签的书签</a>，选择 <samp>主要角色死亡</samp> 预警，在附加标签类别中选择规范的 <samp>Alternate Universe（平行世界）</samp> 标签，并在“要排除的其她作品标签”字段中输入或选择规范的 <samp>Drama（剧情）</samp> 标签，则结果中只会包含<a href="/bookmarks?utf8=✓&bookmark_search%5Bsort_column%5D=created_at&bookmark_search%5Bother_tag_names%5D=&bookmark_search%5Bother_bookmark_tag_names%5D=&exclude_bookmark_search%5Bwarning_ids%5D%5B%5D=18&exclude_bookmark_search%5Bfreeform_ids%5D%5B%5D=968&bookmark_search%5Bexcluded_tag_names%5D=Drama&bookmark_search%5Bexcluded_bookmark_tag_names%5D=&bookmark_search%5Bbookmarkable_query%5D=&bookmark_search%5Bbookmark_query%5D=&bookmark_search%5Brec%5D=0&bookmark_search%5Bwith_notes%5D=0&commit=Sort+and+Filter&tag_id=F*s*F">不带任何这些标签的书签</a>。
	            </p>
	            <p>
	                要查看哪些标签为规范标签，请使用<a href="/tags/search">标签搜索</a>。
	            </p>
	            <p>
	                要了解有关标签的更多信息，请参阅我们的<a href="/faq/tags">标签常见问题</a>。要查看标签整理者用于标记规范标签的指南或更好地理解 AO3 特有的标签术语，请阅读<a href="/wrangling_guidelines">整理指南</a>。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '书签筛选：排除标签';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /works/search 页面上“结果”相关的帮助文本。
	 */
	function translateWorkSearchResultsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Work search results help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>作品搜索：结果</h4>
	            <p>符合条件的最新作品将显示在列表顶部。否则，列表将按相关性排序。如果作品数量众多，您可能需要更改搜索词而非翻页浏览结果。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '作品搜索：结果 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins approval”弹窗的提示信息。
	 */
	function translateSkinsApprovalModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins approval') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>公共界面</h4>
	            <p>
	                AO3 不再将新用户创建的界面添加到公共界面列表，因此您目前无法申请公开您的界面。此复选框仅供站点管理员将新的公共站点界面添加到列表中使用。但是，您仍然可以在<a href="/skins?skin_type=Site">公共站点界面</a>和<a href="/skins?skin_type=WorkSkin">公共作品界面</a>中使用用户创建的界面，也可以继续创建供个人使用的界面。
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面审核';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins creating”弹窗中的 CSS 帮助文本。
	 */
	function translateSkinsCreatingModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins creating') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <dl id="help">
	                <dt>您可以使用我们的向导或编写自己的 CSS（层叠样式表）代码为 Archive 创建新的界面</dt>
	                <dd>
	                    <p>请注意，出于安全原因，您只能使用有限的 CSS 代码集：所有其她声明和注释都将被移除！</p>
	                </dd>

	                <dt>我们允许使用以下属性及其所有变体（包括简写）</dt>
	                <dd>
	                    <p><code>background, border, column, cue, flex, font, layer-background, layout-grid, list-style, margin, marker, outline, overflow, padding, page-break, pause, scrollbar, text, transform, transition</code></p>
	                </dd>

	                <dt>我们还允许以下特定属性</dt>
	                <dd>
	                    <p><code>-replace, -use-link-source, accelerator, align-content, align-items, align-self, alignment-adjust, alignment-baseline, appearance, azimuth, baseline-shift, behavior, binding, bookmark-label, bookmark-level, bookmark-target, bottom, box-align, box-direction, box-flex, box-flex-group, box-lines, box-orient, box-pack, box-shadow, box-sizing, caption-side, clear, clip, color, color-profile, color-scheme, content, counter-increment, counter-reset, crop, cue, cue-after, cue-before, cursor, direction, display, dominant-baseline, drop-initial-after-adjust, drop-initial-after-align, drop-initial-before-adjust, drop-initial-before-align, drop-initial-size, drop-initial-value, elevation, empty-cells, filter, fit, fit-position, float, float-offset, font, font-effect, font-emphasize, font-emphasize-position, font-emphasize-style, font-family, font-size, font-size-adjust, font-smooth, font-stretch, font-style, font-variant, font-weight, grid-columns, grid-rows, hanging-punctuation, height, hyphenate-after, hyphenate-before, hyphenate-character, hyphenate-lines, hyphenate-resource, hyphens, icon, image-orientation, image-resolution, ime-mode, include-source, inline-box-align, justify-content, layout-flow, left, letter-spacing, line-break, line-height, line-stacking, line-stacking-ruby, line-stacking-shift, line-stacking-strategy, mark, mark-after, mark-before, marks, marquee-direction, marquee-play-count, marquee-speed, marquee-style, max-height, max-width, min-height, min-width, move-to, nav-down, nav-index, nav-left, nav-right, nav-up, opacity, order, orphans, page, page-policy, phonemes, pitch, pitch-range, play-during, position, presentation-level, punctuation-trim, quotes, rendering-intent, resize, rest, rest-after, rest-before, richness, right, rotation, rotation-point, ruby-align, ruby-overhang, ruby-position, ruby-span, size, speak, speak-header, speak-numeral, speak-punctuation, speech-rate, stress, string-set, tab-side, table-layout, target, target-name, target-new, target-position, top, unicode-bibi, unicode-bidi, user-select, vertical-align, visibility, voice-balance, voice-duration, oice-family, voice-pitch, voice-pitch-range, voice-rate, voice-stress, voice-volume, volume, white-space, white-space-collapse, widows, width, word-break, word-spacing, word-wrap, writing-mode, z-index</code></p>
	                </dd>

	                <dt>查看其她公共界面示例</dt>
	                <dd>
	                    <p><a href="/skins">所有已批准的公共界面</a>均可查看其代码，您可复制并编辑以供个人使用。</p>
	                </dd>

	                <dt>每条规则集中每个属性只使用一个声明</dt>
	                <dd>
	                    <p>我们使用的 CSS 解析器仅保留每个属性的一个声明，这意味着像<br></p>
	                    <pre><code>.my-class {
	background: -moz-linear-gradient(top, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%);
	background: -o-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%);
	background: -webkit-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%);
	}</code></pre>
	                    <p>这样的规则集将只保留最后一个 <code>background</code> 声明（因此您的渐变效果仅在 WebKit 浏览器中显示）。为避免丢失重复属性的声明，请将每个声明拆分到独立的规则集中，如：</p>
	                    <pre><code>.my-class { background: -moz-linear-gradient(top, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%); }
	.my-class { background: -o-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); }
	.my-class { background: -webkit-linear-gradient(top, #1e5799 0%,#2989d8 50%,#207cca 51%,#7db9e8 100%); }</code></pre>
	                </dd>

	                <dt>字体与字体族</dt>
	                <dd>
	                    <p>遗憾的是，您不能在 CSS 中使用 <code>font</code> 简写。所有 font 属性必须分别指定，例如：<code>font-size: 1.1em; font-weight: bold; font-family: Cambria, Constantia, Palatino, Georgia, serif;</code></p>
	                    <p>在 <code>font-family</code> 属性中，我们允许您使用字母数字名称指定任何字体。您可以（但不必）使用单引号或双引号将名称括起，只需确保引号成对匹配。（例如，'Gill Sans' 和 "Gill Sans" 都可；'Gill Sans" 则不可。）请记住，字体必须安装在用户的操作系统中才能生效。建议在指定字体时添加备用字体，以防首选字体不可用。请参阅<a href="https://www.w3schools.com/cssref/css_fonts_fallbacks.asp">包含备用字体的网页安全字体集</a>。</p>
	                    <p>抱歉，我们<strong>不允许</strong>使用 <code>@font-face</code> 属性。如果您想在要分享的界面中使用不常见字体，建议在“描述”字段中添加注释，提供用户自行下载该字体的链接，并使用网页安全字体作为备用。</p>
	                </dd>

	                <dt>URLs</dt>
	                <dd>
	                    <p>我们允许使用 JPG 、GIF 和 PNG 格式的外部图像 URL（格式如 <code>url('https://example.com/my_awesome_image.jpg')</code>）。但请注意，使用外部图像的界面将不会被批准为公共界面。</p>
	                </dd>

	                <dt>关键词</dt>
	                <dd>
	                    <p>我们允许所有标准 CSS 关键词值（例如 <code>absolute</code>、<code>bottom</code>、<code>center</code>、<code>underline</code> 等）。</p>
	                </dd>

	                <dt>数值</dt>
	                <dd>
	                    <p>您可以指定最多两位小数的数值，作为百分比或<a href="https://w3schools.com/css/css_units.asp">各种单位</a>：<br><code>cm, em, ex, in, mm, pc, pt, px</code></p>
	                    <p>PS：我们强烈建议学习并使用 <code>em</code>，它可以让您根据查看者当前的字体大小设置布局！这将使您的布局更加灵活，并响应不同的浏览器/字体设置。</p>
	                </dd>

	                <dt>颜色</dt>
	                <dd>
	                    <p>您可以使用十六进制值（例如，<code>#000000</code> 表示十六进制黑色）或 RGB 、RGBA 值（例如 <code>rgb(0,0,0)</code> 和 <code>rgba(0,0,0,0)</code> 都表示黑色）指定颜色。这可能更安全，因为并非所有浏览器都一定支持所有颜色名称。但是，颜色名称更具可读性且易于记忆，因此我们也允许使用颜色名称。（建议您坚持使用<a href="https://www.w3schools.com/colors/colors_names.asp">常见支持的颜色名称集</a>。）</p>
	                </dd>

	                <dt>缩放</dt>
	                <dd>
	                    <p>您可以为 <code>transform</code> 属性指定 <code>scale(数值)</code> 形式的缩放，其中数值最多可指定两位小数。</p>
	                </dd>

	                <dt>注释</dt>
	                <dd>
	                    <p>CSS 中的注释会被移除。</p>
	                </dd>

	                <dt>如果您是 CSS 新手，以下是基础知识：</dt>
	                <dd>
	                    <p>一行 CSS 代码的格式类似：<code>selector {property: value;}</code></p>
	                    <p><strong>selector</strong> 是要更改的 HTML 标签名称（如 <code>body</code> 或 <code>h1</code>），或已在标签上设置的 id 或 class。<strong>property</strong> 是您要更改的属性（例如字体大小），<strong>value</strong> 是您要设置的值。</p>
	                    <p>示例：</p>
	                    <ul>
	                        <li>设置 <code>body</code> 标签内的字体大小略大于基线：<code>body {font-size: 1.1em;}</code></li>
	                        <li>设置 id 为 <code>#header</code> 的标签背景色为紫色：<code>#header {background-color: purple}</code></li>
	                        <li>设置 class 为 <code>.meta</code> 的标签文本闪烁（不建议使用）：<code>.meta {font-style: blink}</code></li>
	                    </ul>
	                    <p>一些有用的 CSS 教程：</p>
	                    <ul>
	                        <li><a href="https://www.w3schools.com/css/css_intro.asp">CSS 入门教程</a></li>
	                        <li><a href="http://developer.mozilla.org/docs/CSS/Getting_Started">MDN 上的 CSS 入门教程</a></li>
	                    </ul>
	                </dd>
	            </dl>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面创建';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skin Conditions”弹窗的帮助文本。
	 */
	function translateSkinsConditionsModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins conditions') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h3>界面条件</h3>
	            <p>如果您希望在特定情况下仅加载某段 CSS ，可以为界面创建一组特定的条件。只有满足条件时，我们才会加载该界面。可用的条件有：</p>
	            <ul>
	                <li>
	                    <h4>作用方式</h4>
	                    <dl>
	                        <dt>添加到 Archive 样式之后</dt>
	                        <dd>95% 的情况下使用此选项。将在官方 Archive 样式之后加载。</dd>
	                        <dt>完全替换 Archive 样式</dt>
	                        <dd>适用于复杂界面，不想保留大部分默认样式时使用。（可将需要保留的部分设为母级界面。）</dd>
	                    </dl>
	                </li>
	                <li>
	                    <h4>仅限母级</h4>
	                    <p class="note">此选项主要用于保持界面列表整洁。如果选择此项，您（及其她用户）将无法直接使用该界面：它仅作为母级被引用。即使公开，其也不会出现在主界面列表中，只会在引用它作为母级的界面说明中列出。这样可以方便地提供组件供她人使用，而不会因无法独立使用而在列表中产生混乱。:)</p>
	                </li>
	                <li>
	                    <h4>媒体类型</h4>
	                    <p class="note">您可选择多个媒体类型。仅当所用设备支持该媒体类型时，才会加载对应样式表。例如，并非所有屏幕阅读器都会加载“speech”样式表。如果您的设备未加载界面，请改用“all”或“screen”，或提交支持请求以获取帮助。</p>
	                    <dl>
	                        <dt>all</dt>
	                        <dd>大多数情况下使用。适用于所有设备。（某些极老的浏览器不识别“all”，需使用“screen”。）</dd>
	                        <dt>screen</dt>
	                        <dd>适用于电脑屏幕。（通常也适用于不支持其她媒体类别的设备。）</dd>
	                        <dt>handheld</dt>
	                        <dd>仅在移动设备和/或小屏幕上加载。</dd>
	                        <dt>speech</dt>
	                        <dd>仅在屏幕阅读器上加载。</dd>
	                        <dt>print</dt>
	                        <dd>仅在打印页面时加载。</dd>
	                        <dt>braille, embossed, projection, tty, tv</dt>
	                        <dd>详见 <a href="http://www.w3.org/TR/CSS2/media.html">W3C 媒体规范</a>。</dd>
	                        <dt>only screen and (max-width: 450px)</dt>
	                        <dd>适用于 iPhone（否则不会加载 handheld 样式表）。</dd>
	                    </dl>
	                </li>
	                <li>
	                    <h4>仅限 IE</h4>
	                    <p class="note">留空则在所有浏览器上加载界面。选择后，仅在 Internet Explorer 浏览器中加载，可添加 IE 专用覆盖样式。</p>
	                    <dl>
	                        <dt>IE</dt>
	                        <dd>适用于任何版本的 IE 浏览器。</dd>
	                        <dt>IE5, IE6, IE7, IE8, IE9</dt>
	                        <dd>仅适用于对应版本的 IE 浏览器。</dd>
	                        <dt>IE8_or_lower</dt>
	                        <dd>适用于 IE8 及以下版本。</dd>
	                    </dl>
	                </li>
	            </ul>
	            <h4>与母级界面交互</h4>
	            <p>如果您同时使用母级界面，可为特定母级设置条件，然后创建针对不同浏览器表现不同的界面。例如，您可将大部分 CSS 放在一个母级界面，将 IE 专用样式放在另一个母级界面，将 handheld 媒体样式放在第三个母级界面，将 print 媒体样式放在第四个母级界面。最终界面将根据用户浏览器分别加载各母级！</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面条件';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins parents”弹窗的帮助文本。
	 */
	function translateSkinsParentsModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins parents') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h3>界面母级</h3>
	            <p>您可以通过将一个站点界面设为另一个的母级来组合和分层多个站点界面。母级界面按顺序加载，以便按该顺序显示所有界面样式。要了解有关界面更多信息，请参阅<a href="/faq/skins-and-archive-interface">界面与界面常见问题</a>。</p>
	            <p>默认情况下，界面将在 Archive 默认样式之后加载。如果您不想如此，可以在“作用方式”菜单中指定将您的界面替换而不是添加到 Archive 默认样式。</p>
	            <h4>加载 Archive 样式组件</h4>
	            <p>如果您创建了替换界面，可能希望将组成当前默认 Archive 站点的所有界面作为母级一并加载。此选项仅在您从“作用方式”菜单中选择“完全替换 Archive 样式”时可用。之后，您可以编辑您的界面并删除不需要的部分。如果您要保留大部分内容，这将更容易操作，因为默认界面数量众多！</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面母级';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins wizard font”弹窗的帮助文本。
	 */
	function translateSkinsWizardFontModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins wizard font') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>默认值为：<code>'Lucida Grande'、'Lucida Sans Unicode'、Verdana、Helvetica、sans-serif、'GNU Unifont'</code></p>
	            <p>在此处输入任意字体名称，如果它已安装在您的计算机上，则可使用。如果您使用多种设备，请指定一些备用字体，名称之间用逗号分隔，以防某设备没有首选字体。</p>
	            <p>对于含有空格的字体名称，可使用单引号或双引号括起，例如 <kbd>"Lucida Grande"</kbd> 或 <kbd>'Lucida Sans Unicode'</kbd>。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面向导 字体';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins wizard font size”弹窗的帮助文本。
	 */
	function translateSkinsWizardFontSizeModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins wizard font size') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>默认值为：<code>100%</code></p>
	            <p>Archive 上的字体大小基于浏览器默认字体大小的百分比。使用小于 100 的数字可缩小 Archive 文本，使用大于 100 的数字可放大文本。输入 100 可保持 Archive 的默认字体大小。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面向导 字体大小';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins wizard vertical gap”弹窗的帮助文本。
	 */
	function translateSkinsWizardVerticalGapModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins wizard vertical gap') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>默认值为：<code>1.1286em</code></p>
	            <p>在此处输入任意数字，该数字将作为作品字体大小的倍数生效。数字越大，段落垂直间距越宽。</p>
	            <p>例如，大多数用户以 15 像素的字体大小查看作品。输入 <kbd>2</kbd> 将生成 30 像素的垂直间距，输入 <kbd>0.5</kbd> 则会产生约 8 像素的垂直间距。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面向导 垂直间距';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“Skins wizard accent color”弹窗的帮助文本。
	 */
	function translateSkinsWizardAccentColorModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Skins wizard accent color') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>默认值为：<code>#ddd</code></p>
	            <p>替换 Archive 中多个位置使用的灰色，包括表单背景、主导航中的下拉菜单，以及个人中心页面的“同人圈”和“最近作品”部分。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '界面向导 强调色';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用于翻译“合集名称”帮助弹窗
	 */
	function translateCollectionNameHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Collection name') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>合集名称</h4>
	            <p>合集名称可以在以后更改，但这样会破坏指向该合集的链接。</p>
	            <p>名称只能由 ASCII 字母（a-z、A-Z）、数字和下划线组成，且不能包含空格。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '合集名称';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 "Icon Alt Text" 弹窗。
	 */
	function translateIconAltTextHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const header = container?.querySelector('h4');
		if (!header || header.textContent !== 'Icon Alt Text') {
			return;
		}
		container.innerHTML = `
	        <h4>图标替代文本</h4>
	        <p>替代文本的作用是在图像无法显示时解释其含义。该功能供关闭图像显示或使用屏幕阅读器的视障用户使用。请勿将替代文本用于标注图片来源！</p>
	        <p>例如，AO3 标志的替代文本为：“Archive of Our Own”。</p>
	    `;
		container.setAttribute('data-translated-by-custom-function', 'true');
		const footer = container.nextElementSibling;
		if (footer) {
			const footerTitle = footer.querySelector('span.title');
			if (footerTitle) {
				footerTitle.textContent = '图标替代文本';
			}

			const closeButton = footer.querySelector('a.modal-closer');
			if (closeButton) {
				closeButton.textContent = '关闭';
			}
		}
	}

	/**
	 * 专用于翻译“笔名图标注释”帮助弹窗
	 */
	function translatePseudIconCommentHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Pseud icon comment') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <p>您可以在此处填写关于您的图标的额外信息，例如图标制作者的署名。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '笔名图标注释文本';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用于翻译“审核制合集”帮助弹窗
	 */
	function translateCollectionModeratedHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Collection moderated') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>审核制合集</h4>
	            <p>默认情况下，合集非审核制，这意味着任何注册用户都可以将其作品添加到合集。合集的所有者/管理员仍可在作品发布后拒绝不适当的作品。</p>
	            <p>如果您将合集设置为审核制，所有注册用户仍可发布作品，但在获得管理员或所有者批准之前，作品不会出现在合集内。认证成员投稿将自动通过审核（无需人工操作）。</p>
	            <p>合集的所有者可编辑合集偏好和数据，也可完全删除合集。合集的管理员可批准/邀请成员并添加或拒绝作品。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '合集审核制';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用于翻译“关闭的合集”帮助弹窗
	 */
	function translateCollectionClosedHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Collection closed') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>关闭的合集</h4>
	            <p>一旦合集关闭，除维护者（所有者和管理员）外，无法再添加作品或书签。如果这是赠文交换或其她活动，请注意，这不会自动根据您在活动设置中设定的任何截止日期触发，必须在此手动设置。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '合集已关闭';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译 /tags/search 页面上“标签搜索结果”帮助文本。
	 */
	function translateTagSearchResultsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Tag search results help') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>标签搜索结果</h4>
	            <p><span class="canonical">高亮</span>标签为规范标签。</p>
	            <p>最新标签将显示在列表顶部。其余标签按类型和名称字母顺序排序。</p>
	            <p>如果标签过多，请尝试优化搜索，而不是翻页浏览结果。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '标签搜索:结果 帮助';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译挑战注册页面上“选择任意”的帮助弹窗。
	 */
	function translateChallengeAnyTips() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Challenge any') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>选择“任意”</h4>
	            <p>如果您在报名时为某个字段选择“任意”，即表示您同意在该字段上进行无条件匹配——此操作存在潜在风险！请务必确保您真正接受任意内容！即使您在该字段填写了具体选项，“任意”也将覆盖所有已填写内容。</p>
	            <h5>示例</h5>
	            <p>提供“任意”：</p>
	            <ul>
	                <li>您承诺为同人圈“Twin Peaks”提供作品，并为关系字段选择“任意”。</li>
	                <li>用户 Mary Sue 请求创作同人圈“Twin Peaks”，并在关系字段选择“Log Lady/Llama”。</li>
	                <li>您将被匹配，并需创作关于 Llama 和 Log Lady 的史诗般的爱情故事。</li>
	            </ul>
	            <p>请求“任意”（此情况常易混淆！）：</p>
	            <ul>
	                <li>用户 Mary Sue 承诺为同人圈“Twin Peaks”提供作品，并在关系字段选择“Log Lady/Llama”。</li>
	                <li>您请求创作同人圈“Twin Peaks”，并为关系字段选择“任意”。</li>
	                <li>Mary Sue 可能会被分配到您的请求，<strong>且只会为您创作</strong>关于 Log Lady 和 Llama 的史诗故事。</li>
	            </ul>
	            <p>挑战活动管理员可能会选择仅允许在“提供”中使用“任意”选项，或仅开放特定字段使用。</p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '挑战活动 任意';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译挑战注册页面上“可选标签”的帮助弹窗。
	 */
	function translateOptionalTagsHelp() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');
		if (!footerTitle || footerTitle.textContent !== 'Challenge optional tags user') {
			return;
		}
		if (container) {
			container.innerHTML = `
	            <h4>可选标签</h4>
	            <p>
	            管理员将使用可选标签尝试优化匹配，但必要时可能完全忽略这些标签以完成匹配。此处适合添加冷门或特定标签。
	            请注意：您添加的标签越多，可选标签被忽略的可能性越大，且匹配运行速度越慢，因此请谨慎添加！
	            </p>
	        `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}
		footerTitle.textContent = '挑战活动可选标签 用户';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专门用于翻译“章节标题”帮助弹窗。
	 */
	function translateChapterTitleHelpModal() {
		const container = document.querySelector('#modal div.content.userstuff');
		const footer = container?.nextElementSibling;
		const footerTitle = footer?.querySelector('span.title');

		if (!footerTitle || footerTitle.textContent !== 'Chapter title') {
			return;
		}

		if (container) {
			container.innerHTML = `
                <h4>章节标题</h4>
                <p>您可以为章节添加标题，但这不是必填项。</p>
            `;
			container.setAttribute('data-translated-by-custom-function', 'true');
		}

		footerTitle.textContent = '章节标题';
		const closeButton = footer.querySelector('a.modal-closer');
		if (closeButton) {
			closeButton.textContent = '关闭';
		}
	}

	/**
	 * 专用翻译函数：翻译“关于 OTW”页面
	 */
	function translateAboutPage() {
		const mainDiv = document.querySelector('div#main.about');
		if (!mainDiv) return;
		const titleElement = mainDiv.querySelector('h2.heading');
		if (!titleElement || !titleElement.textContent.includes('About the OTW')) {
			return;
		}
		mainDiv.innerHTML = `
	        <h2 class="heading">关于 OTW</h2>
	        <div class="userstuff">
	            <p>再创作组织（OTW）是一个由同人爱好者于 2007 年创立的非营利组织，旨在通过提供多种形式的同人作品和同人文化的访问权限并保存其历史，来服务同人爱好者的利益。我们相信，同人作品具有再创作性，而再创作作品具有合法地位。</p>
	            <p>我们积极且富有创新精神，致力于保护和捍卫我们的作品免受商业剥削和法律挑战。我们通过保护和培育同人爱好者社群、作品、评论、历史及身份认同，同时为所有同人爱好者提供尽可能广泛的同人活动参与途径，从而维护我们的同人经济、价值观和创作表达。</p>
	            <p>Archive of Our Own 采用开源归档技术，为同人作品提供一个非商业、非营利的集中托管平台。欢迎您为我们的 <a href="https://github.com/otwcode/otwarchive">GitHub 代码库</a>做出贡献，相关开放任务清单可在我们的 <a href="https://otwarchive.atlassian.net/browse/AO3">Jira 项目</a>页面查阅。</p>
	            <p>我们的其她主要项目包括：</p>
	            <ul>
	                <li><a href="https://fanlore.org">Fanlore</a>：一个致力于保存再创作同人作品及其衍生同人圈历史的同人维基。</li>
	                <li><a href="https://transformativeworks.org/projects/legal">Legal Advocacy</a>：法律倡导，致力于保护同人作品免受商业剥削和法律挑战，并为其进行辩护。</li>
	                <li><a href="https://opendoors.transformativeworks.org">Open Doors</a>：为面临风险的同人项目提供庇护。</li>
	                <li><a href="https://journal.transformativeworks.org/index.php/twc">Transformative Works and Cultures</a>：再创作作品与文化，一份经同行评审的学术期刊，旨在促进有关同人作品及其实践的学术研究。</li>
	            </ul>
	            <p>您可通过官网 <a href="https://www.transformativeworks.org">transformativeworks.org</a> 了解更多关于 OTW 及其项目的信息，也可以在<a href="https://www.transformativeworks.org/faq">常见问题页面</a>上了解您的资助对 OTW 持续发展和扩展的重要性。如果您有媒体或研究方面的问题，请联系<a href="https://www.transformativeworks.org/contact_us/">通讯团队</a>。</p>
	        </div>
	    `;
		mainDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译“捐赠”页面
	 */
	function translateDonatePage() {
		const mainDiv = document.querySelector('div#main.donate');
		if (!mainDiv) return;
		const titleElement = mainDiv.querySelector('h2.heading');
		if (!titleElement || !titleElement.textContent.includes('Donations')) {
			return;
		}
		mainDiv.innerHTML = `
	        <h2 class="heading">捐赠</h2>
	        <h3 class="heading">支持 AO3 主要有两种方式：捐赠您的时间或资金。</h3>
	        <div class="userstuff">
	            <h3>捐赠时间</h3>
	            <p>
	                <a href="https://www.transformativeworks.org">再创作组织（OTW）</a>是 Archive of Our Own（AO3）的上级组织。我们持续招募志愿者参与<a href="https://www.transformativeworks.org/our-projects">项目开发</a>。若您有意为 AO3 提供志愿服务，可关注以下委员会：无障碍、设计与技术委员会（AD&T）；AO3 文档委员会；政策与滥用委员会；支持团队；标签管理委员会；以及翻译委员会。
	            </p>
	            <p>
	                同时诚邀您为我们的 <a href="https://github.com/otwcode/otwarchive">GitHub 代码库</a>贡献代码，开放任务详见 <a href="https://otwarchive.atlassian.net/browse/AO3">Jira 项目</a>。欢迎浏览我们的<a href="https://www.transformativeworks.org/volunteer">志愿者职位列表</a>，<a href="https://www.transformativeworks.org/you-can-now-subscribe-to-otw-news-by-email">订阅邮件</a>以获取含志愿者招募的全面资讯，并申请符合您资历和兴趣的任何志愿者职位。
	            </p>
	            <h3>捐赠资金</h3>
	            <p>
	                AO3 的日常运营需要持续支出——服务器的电力和带宽——以及随着用户和作品数量的增加，不时购买新服务器等一次性支出。任何<a href="https://donate.transformativeworks.org/otwgive">向 OTW 的捐赠</a>都至关重要。（请放心，我们绝不会将您的 AO3 用户名与财务信息关联。）
	            </p>
	        </div>
	    `;
		mainDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用翻译函数：翻译“多元化声明”页面
	 */
	function translateDiversityStatement() {
		const mainDiv = document.querySelector('div#main.diversity');
		if (!mainDiv) {
			return;
		}
		const titleElement = mainDiv.querySelector('h2.heading');
		if (!titleElement || !titleElement.textContent.includes('You are welcome at the Archive of Our Own.')) {
			return;
		}
		mainDiv.innerHTML = `
	        <h2 class="heading">欢迎来到 Archive of Our Own 。</h2>
	        <div class="userstuff">
	            <p>无论您的外表、境遇、立场或世界观如何：只要您喜欢欣赏、创作或评论同人作品，AO3 即为您而建。</p>
	            <p>本站是一个由同人爱好者为同人爱好者打造的永久性全同人圈作品托管平台。无论您以何种方式使用本站，您都是其中的一份子，通过您的使用和<a href="/support">反馈</a>为其注入活力并塑造未来。</p>
	            <p>我们——<a href="/admin_posts">AO3 团队</a>——深知无法在初次尝试时就尽善尽美，也无法让所有人都满意。但我们会努力寻求平衡，郑重考虑并认真对待您的每一条反馈。</p>
	            <p>您可以自由发挥创意，但必须遵守一些<a href="/content">必要的限制</a>，以便为其她用户提供可行性服务。本站致力于保护您的自由表达权及隐私权；详情请阅读我们的<a href="/tos">服务条款</a>。</p>
	            <p>我们明白，要让 AO3 真正实现全同人圈愿景，仍需完善<a href="/admin_posts/295">关键功能</a>：如托管文本形式以外的同人作品、提供多语言界面、增加用户互动方式等。但有了您的支持，我们终将实现目标。</p>
	            <p>我们之所以构建这座档案馆，是因为我们相信持不同观点与主张的人可以齐聚一堂，彼此分享。</p>
	            <p>我们为您而建，期待您成为其中的一员。</p>
	            <br>
	            <p>本文是对 <a href="http://www.dreamwidth.org">Dreamwidth</a> <a href="http://www.dreamwidth.org/legal/diversity">多元化声明</a>的再创作。</p>
	            <p>
	                <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/3.0/88x31.png"></a>
	                <br>
	                本作品采用<a href="http://creativecommons.org/licenses/by-sa/3.0/">知识共享署名-相同方式共享 3.0 未本地化版本</a>许可协议进行许可。
	            </p>
	        </div>
	    `;
		mainDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专门用于翻译服务条款（TOS）同意提示弹窗。
	 */
	function translateTOSPrompt() {
		const promptDiv = document.querySelector('div#tos_prompt');
		if (!promptDiv || promptDiv.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		const h2Span = promptDiv.querySelector('h2.heading span');
		if (h2Span) {
			h2Span.textContent = 'Archive of Our Own';
		}
		const firstP = promptDiv.querySelector('.agreement p:first-of-type');
		if (firstP) {
			firstP.innerHTML = '在 Archive of Our Own（AO3）上，用户可以创建作品、书签、评论、标签及其她<a href="/tos_faq#define_content">内容</a>。您在 AO3 发布的任何信息均可能对公众、AO3 用户及 AO3 工作人员可见。请谨慎分享个人信息，包括但不限于您的姓名、电子邮箱、年龄、所在地、个人关系、性别或性取向、种族或民族背景、宗教或政治观点及其她网站的账户用户名。';
		}
		const secondP = promptDiv.querySelector('.agreement p:nth-of-type(2)');
		if (secondP) {
			secondP.innerHTML = '想了解更多信息，请查看我们的<a href="/tos">服务条款</a>（包括<a href="/content">内容政策</a>和<a href="/privacy">隐私政策</a>）。';
		}
		const tosLabel = promptDiv.querySelector('label[for="tos_agree"]');
		if (tosLabel) {
			const originalText = tosLabel.textContent;
			const yearMatch = originalText.match(/(\d{4})/);
			if (yearMatch && originalText.includes('I have read & understood the')) {
				const year = yearMatch[1];
				tosLabel.textContent = `我已阅读并理解 ${year} 年服务条款，包括内容政策和隐私政策。`;
			}
		}
		const dataLabel = promptDiv.querySelector('label[for="data_processing_agree"]');
		if (dataLabel) {
			dataLabel.textContent = '勾选此项即表示您同意在美国及其她司法管辖区为向您提供 AO3 及其相关服务而处理您的个人数据。您确认该司法管辖区的数据隐私法律可能与您所在司法管辖区存在差异。有关您的个人数据将如何被处理的更多信息，请参阅我们的隐私政策。';
		}
		const button = promptDiv.querySelector('button#accept_tos');
		if (button) {
			button.textContent = '我同意/认可上述条款';
		}
		promptDiv.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 翻译各种操作按钮
	 */
	function translateActionButtons() {
		// Please wait 状态按钮
		const buttonsToTranslateDisableText = document.querySelectorAll('[data-disable-with="Please wait..."]');
		buttonsToTranslateDisableText.forEach(button => {
			button.setAttribute('data-disable-with', '请稍等…');
		});
		// 订阅/取消订阅按钮
		const subscribeButton = document.querySelector('input[name="commit"][value="Subscribe"]');
		if (subscribeButton) {
			subscribeButton.value = '订阅';
		}

		const unsubscribeButton = document.querySelector('input[name="commit"][value="Unsubscribe"]');
		if (unsubscribeButton) {
			unsubscribeButton.value = '取消订阅';
		}
		// 收藏标签/取消收藏按钮
		const favoriteTagButton = document.querySelector('input[name="commit"][value="Favorite Tag"]');
		if (favoriteTagButton) {
			favoriteTagButton.value = '收藏标签';
		}

		const unfavoriteTagButton = document.querySelector('input[name="commit"][value="Unfavorite Tag"]');
		if (unfavoriteTagButton) {
			unfavoriteTagButton.value = '取消收藏';
		}
		const ajaxForms = document.querySelectorAll('form.ajax-create-destroy');
		ajaxForms.forEach(form => {
			// 订阅功能
			if (form.getAttribute('data-create-value') === 'Subscribe') {
				form.setAttribute('data-create-value', '订阅');
			}
			if (form.getAttribute('data-destroy-value') === 'Unsubscribe') {
				form.setAttribute('data-destroy-value', '取消订阅');
			}
			// 收藏标签功能
			if (form.getAttribute('data-create-value') === 'Favorite Tag') {
				form.setAttribute('data-create-value', '收藏标签');
			}
			if (form.getAttribute('data-destroy-value') === 'Unfavorite Tag') {
				form.setAttribute('data-destroy-value', '取消收藏');
			}
		});
	}

	/**
	 * 专用于翻译按钮
	 */
	function translateSortButtons() {
		const translations = {
			'Bookmarks': '书签',
			'Comment Threads': '评论串',
			'Date': '日期',
			'Fandom': '同人圈',
			'Hits': '点击',
			'Kudos ♥': '点赞',
			'Prompter': '梗提供者',
			'Subscriptions': '订阅列表',
			'Word Count': '字数统计'
		};
		const sortButtons = document.querySelectorAll('a[title="sort up"], a[title="sort down"]');
		sortButtons.forEach(button => {
			if (button.hasAttribute('data-translated-by-custom-function')) {
				return;
			}

			let currentHTML = button.innerHTML;
			let isTranslated = false;
			for (const key in translations) {
				if (currentHTML.includes(key)) {
					currentHTML = currentHTML.replace(key, translations[key]);
					isTranslated = true;
				}
			}

			const title = button.getAttribute('title');
			if (title === 'sort up') {
				button.setAttribute('title', '升序');
				isTranslated = true;
			} else if (title === 'sort down') {
				button.setAttribute('title', '降序');
				isTranslated = true;
			}

			if (isTranslated) {
				button.innerHTML = currentHTML;
				button.setAttribute('data-translated-by-custom-function', 'true');
			}
		});
	}

	/**
	 * 专用于翻译 /tag_sets 页面上带有“?”弹窗链接的标题。
	 */
	function translateTagSetsHeading() {
		const h2 = document.querySelector('h2.heading:has(a[href="/help/tagset-about.html"])');
		if (!h2 || h2.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		if (h2.firstChild && h2.firstChild.nodeType === Node.TEXT_NODE) {
			h2.firstChild.nodeValue = ' AO3 中的标签集 ';
		}
		if (h2.lastChild && h2.lastChild.nodeType === Node.TEXT_NODE) {
			h2.lastChild.nodeValue = '';
		}
		h2.setAttribute('data-translated-by-custom-function', 'true');
	}

	/**
	 * 专用于翻译搜索结果页面上带有“?”弹窗链接的“找到”标题。
	 */
	function translateFoundResultsHeading() {
		const h3s = document.querySelectorAll('h3.heading:has(a[href*="-search-results-help.html"])');
		h3s.forEach(h3 => {
			if (h3.hasAttribute('data-translated-by-custom-function')) {
				return;
			}
			const textNode = h3.firstChild;
			if (textNode && textNode.nodeType === Node.TEXT_NODE) {
				const match = textNode.nodeValue.match(/\s*([\d,]+)\s+Found\s*/);
				if (match) {
					const number = match[1];
					textNode.nodeValue = `找到 ${number} 条结果 `;
				}
			}
			h3.setAttribute('data-translated-by-custom-function', 'true');
		});
	}

	/**
	 * 专门用于翻译作品与书签搜索结果页面上的 H4 标题。
	 */
	function translateSearchResultsHeader() {
		const h4 = document.querySelector('h2.heading + h4.heading');

		if (!h4 || h4.hasAttribute('data-translated-by-custom-function')) {
			return;
		}
		const originalText = h4.textContent.trim();
		// 翻译字典
		const translations = {
			'title': '标题',
			'author/artist': '作者/画师',
			'tags': '标签',
			'fandoms': '同人圈',
			'rating': '分级',
			'archive warnings': 'Archive 预警',
			'categories': '分类',
			'characters': '角色',
			'relationships': '关系',
			'language': '语言',
			'word count': '字数',
			'hits': '点击',
			'kudos count': '点赞数',
			'comments count': '评论数',
			'bookmarks count': '书签数',
			'revised at': '更新于',
			'sort by': '排序方式',
			'bookmarker': '书签创建者',
			'notes': '注释',
			'type': '类型',
			'work language': '作品语言',
			'date bookmarked': '书签创建日期',
			'date updated': '更新日期',

			'general audiences': '全年龄',
			'teen and up audiences': '青少年及以上',
			'mature': '成人向',
			'explicit': '限制级',
			'not rated': '未分级',
			'creator chose not to use archive warnings': '不使用 Archive 预警',
			'no archive warnings apply': 'Archive 预警不适用',
			'graphic depictions of violence': '暴力场景描写',
			'major character death': '主要角色死亡',
			'rape/non-con': '强暴/非自愿性行为',
			'underage sex': '未成年性行为',
			'f/f': '女/女',
			'f/m': '女/男',
			'm/m': '男/男',
			'gen': '无CP',
			'multi': '多配对',
			'other': '其她',
			'work': '作品',
			'series': '系列',
			'external work': '外部作品',
			'rec': '推荐',
			'with notes': '含注释',
			'complete': '已完结',
			'Complete': '已完结',
			'in progress': '连载中',
			'incomplete': '连载中',
			'no crossovers': '排除跨圈作品',
			'only crossovers': '仅限跨圈作品',
			'single chapter': '单个章节',

			'best match': '最佳匹配',
			'author': '作者',
			'date posted': '发布日期',
			'kudos': '点赞',
			'comments': '评论',
			'bookmarks': '书签',

			'descending': '降序',
			'ascending': '升序',
		};

		const translationKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
		const translationRegex = new RegExp(`\\b(${translationKeys.join('|').replace(/\//g, '\\/')})\\b`, 'gi');

		let processedText = originalText.replace(translationRegex, (match) => {
			return translations[match.toLowerCase()] || match;
		});

		processedText = processedText.replace(/(排序方式：)\s*(.+?)\s*(升序|降序)\s*$/g, '$1$2（$3）');
		processedText = processedText
			.replace(/You searched for:/i, '您搜索了：')
			.replace(/\s*:\s*/g, '：')
			.replace(/, /g, '，')
			.replace(/，/g, '，')
			.replace(/ \/ /g, '/')
			.replace(/\s*：\s*/g, '：')
			.replace(/\s*，\s*/g, '，')
			.replace(/：，/g, '：')
			.replace(/^您搜索了：，/, '您搜索了：')
			.trim();

		h4.textContent = processedText;
		h4.setAttribute('data-translated-by-custom-function', 'true');

		const subnavLink = document.querySelector('ul.navigation.actions a[href*="edit_search=true"]');
		if (subnavLink) {
			subnavLink.textContent = '修改搜索设置';
		}

		const noResultsP = Array.from(document.querySelectorAll('#main > p')).find(p => p.textContent.includes('No results found.'));
		if (noResultsP) {
			noResultsP.textContent = '未找到结果。您可以尝试修改搜索设置，使其不那么精确。';
		}
	}

	/**
	 * 翻译 flash notice 提示消息
	 */
	function translateFlashMessages() {
		document.querySelectorAll('div.flash.notice').forEach(flash => {
			const originalHTML = flash.innerHTML;
			const originalText = flash.textContent;

			let newHTML = originalHTML;

			const subscribeMatch = originalHTML.match(/^You are now following (.+?)\. If you'd like to stop receiving email updates, you can unsubscribe from (<a href=".*?">your Subscriptions page<\/a>)\.$/);
			if (subscribeMatch) {
				const workTitle = subscribeMatch[1];
				const linkTag = subscribeMatch[2].replace('>your Subscriptions page<', '>订阅列表<');
				newHTML = `您已订阅 ${workTitle} 。如果您想停止接收邮件更新提醒，可以在${linkTag}页面取消订阅。`;
			}
			else {
				const unsubscribeMatch = originalHTML.match(/^You have successfully unsubscribed from (.+?)\.$/);
				if (unsubscribeMatch) {
					const workTitle = unsubscribeMatch[1];
					newHTML = `您已成功取消对 ${workTitle} 的订阅。`;
				}
			}
			if (originalText.startsWith('You have successfully removed')) {
				const match = originalText.match(/You have successfully removed (.+?) from your favorite tags\./);
				if (match && match[1]) {
					newHTML = `您已成功将 ${match[1].trim()} 从收藏的标签中移除。`;
				}
			}
			else if (originalHTML.startsWith('You have successfully added')) {
				const match = originalHTML.match(/^You have successfully added (.+?) to your favorite tags\. You can find them on the <a href="\/">Archive homepage<\/a>\.$/);
				if (match && match[1]) {
					newHTML = `您已成功将 ${match[1].trim()} 添加到收藏标签列表。您可以在 <a href="/">Archive 首页</a>上找到它们。`;
				}
			}
			if (newHTML !== originalHTML) {
				flash.innerHTML = newHTML;
			}
		});
	}

	/**
	 * 翻译点赞区域
	 */
	function translateKudosSection() {
		const kudosDiv = document.getElementById('kudos');
		if (!kudosDiv || kudosDiv.dataset.kudosObserverAttached === 'true') {
			return;
		}
		const translateParagraphContent = (pElement) => {
			let html = pElement.innerHTML;
			const originalHtml = html;
			html = html.replace(/(<a[^>]*>)([\d,]+)\s+more\s+users(<\/a>)/g, '$1$2 位用户$3');
			html = html.replace(/([\d,]+)\s+guest(s)?/g, '$1 位访客');
			html = html.replace(/\s+as well as\s+/g, ' ，以及 ');
			html = html.replace(/(<span id="kudos_more_connector">), and (<\/span>)/g, '$1，和 $2');
			html = html.replace(/\s+and\s+/g, ' 和 ');
			html = html.replace(/, /g, '，');
			html = html.replace(/\s+left kudos on this work!/g, '点赞了此作品！');

			if (html !== originalHtml) {
				pElement.innerHTML = html;
			}
		};
		const observer = new MutationObserver(() => {
			const currentP = kudosDiv.querySelector('p.kudos');
			if (currentP) {
				translateParagraphContent(currentP);
			}
		});
		observer.observe(kudosDiv, {
			childList: true,
			subtree: true
		});
		kudosDiv.dataset.kudosObserverAttached = 'true';
		const initialP = kudosDiv.querySelector('p.kudos');
		if (initialP) {
			translateParagraphContent(initialP);
		}
	}

	/**
	 * 翻译统计图表
	 */
	function translateStatsChart() {
		const chartContainer = document.getElementById('stat_chart');
		if (!chartContainer || chartContainer.dataset.chartObserverAttached === 'true') {
			return;
		}

		const translateSVGText = (svg) => {
			const textElements = svg.querySelectorAll('text');
			if (textElements.length === 0) {
				return false;
			}

			const translations = {
				'Hits': '点击量',
				'Kudos': '点赞数',
				'Comment Threads': '评论串',
				'Comment Thread Count': '评论串数',
				'Bookmarks': '书签',
				'Subscriptions': '订阅列表',
				'Word Count': '字数',
				'Most Recent': '最近发布',
				'Oldest': '最早发布'
			};

			const titleRegex = /^(Top|Bottom) Five By (.+)$/;
			let wordCountElements = [];

			textElements.forEach(textEl => {
				const originalText = textEl.textContent.trim();
				if (!originalText) return;

				if (originalText === 'Word') {
					wordCountElements.push(textEl);
					return;
				}

				if (wordCountElements.length > 0) {
					const cleanedCountText = originalText.replace(/\u2026|\.\.\.$/, '');
					if ('Count'.startsWith(cleanedCountText)) {
						const wordEl = wordCountElements.pop();
						const wordY = parseFloat(wordEl.getAttribute('y'));
						const countY = parseFloat(textEl.getAttribute('y'));
						if (Math.abs(wordY - countY) < 20) {
							wordEl.textContent = '字数';
							textEl.textContent = '';
						}
						return;
					}
				}

				const titleMatch = originalText.match(titleRegex);
				if (titleMatch) {
					const direction = titleMatch[1] === 'Top' ? '前五' : '后五';
					const categoryKey = titleMatch[2];
					const category = translations[categoryKey] || categoryKey;
					textEl.textContent = `按${category}排名${direction}`;
					return;
				}

				if (translations[originalText]) {
					textEl.textContent = translations[originalText];
					return;
				}

				const cleanedText = originalText.replace(/\u2026|\.\.\.$/, '');
				if (cleanedText === '') {
					return;
				}

				if (cleanedText !== originalText) {
					for (const fullWord in translations) {
						if (fullWord.startsWith(cleanedText)) {
							textEl.textContent = translations[fullWord];
							return;
						}
					}
				}
			});
			return true;
		};

		const observer = new MutationObserver((mutationsList, obs) => {
			for (const mutation of mutationsList) {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					const svg = chartContainer.querySelector('svg');
					if (svg) {
						if (translateSVGText(svg)) {
							obs.disconnect();
							return;
						}
					}
				}
			}
		});

		observer.observe(chartContainer, { childList: true, subtree: true });
		chartContainer.dataset.chartObserverAttached = 'true';

		const initialSvg = chartContainer.querySelector('svg');
		if (initialSvg) {
			if (translateSVGText(initialSvg)) {
				observer.disconnect();
			}
		}
	}

	/**************************************************************************
	 * UI 面板逻辑与用户设置
	 **************************************************************************/

	/**
	 * 应用文章格式样式至页面
	 */
	function applyFormatting(profile = null) {
		if (!profile) {
			profile = FormattingManager.getCurrentProfile();
		}

		if (!profile || !profile.params) return;

		const opts = profile.params;

		const indent = opts.indent === 'true' ? '2em' : '0';
		const fontSize = opts.fontSize + '%';
		const letterSpacing = opts.letterSpacing + 'px';
		const lineHeight = opts.lineHeight;
		const margins = opts.margins + '%';

		const cssParts = [];

		if (opts.margins !== '0') {
			cssParts.push(`#workskin { padding: 0 ${margins} !important; margin: 0 auto !important; }`);
		}

		if (opts.fontSize !== '100') {
			const containerSelectors = '#workskin > .preface, #workskin > #chapters, #workskin > .userstuff';
			cssParts.push(`${containerSelectors} { font-size: ${fontSize} !important; }`);
		}

		if (opts.lineHeight !== '1.5' || opts.letterSpacing !== '0') {
			const textSelectors = `
				#workskin p, #workskin li, #workskin dd, #workskin blockquote,
				#workskin .userstuff p, #workskin .userstuff li, #workskin .userstuff dd, #workskin .userstuff blockquote
			`;

			let textRules = [];
			if (opts.lineHeight !== '1.5') textRules.push(`line-height: ${lineHeight} !important;`);
			if (opts.letterSpacing !== '0') textRules.push(`letter-spacing: ${letterSpacing} !important;`);

			if (textRules.length > 0) {
				cssParts.push(`${textSelectors} { ${textRules.join(' ')} }`);
			}
		}

		if (opts.indent === 'true') {
			cssParts.push(`#workskin .userstuff p { text-indent: ${indent} !important; }`);
		}

		const css = cssParts.join('\n');

		let styleEl = document.getElementById('ao3-format-style');
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
	const DATA_CATEGORIES = [
		{ id: 'staticKeys', label: '通用设置' },
		{ id: 'uiState', label: '界面位置' },
		{ id: 'apiKeys', label: 'API Key' },
		{ id: 'modelSelections', label: '内置模型偏好' },
		{ id: 'customServices', label: '自定义服务配置' },
		{ id: 'glossaries', label: '术语及替换规则' },
		{ id: 'aiParameters', label: '翻译参数配置' },
		{ id: 'blockerSettings', label: '作品屏蔽设置' },
		{ id: 'formatting', label: '文章格式方案' }
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

			const uiTransEnabled = GM_getValue('enable_ui_trans', true);
			register(uiTransEnabled ? '禁用界面翻译' : '启用界面翻译', () => {
				const newState = !uiTransEnabled;
				GM_setValue('enable_ui_trans', newState);
				FeatureSet.enable_ui_trans = newState;
				location.reload();
			});

			const showFab = GM_getValue('show_fab', true);
			register(showFab ? '隐藏悬浮按钮' : '显示悬浮按钮', () => {
				const newState = !showFab;
				GM_setValue('show_fab', newState);
				fabLogic.toggleFabVisibility();
				render();
			});

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
		const existing = document.getElementById('ao3-trans-fab-container');
		if (existing) {
			return { fabContainer: existing };
		}

		const iconUrl = GM_getResourceURL('vIcon');
		const santaHatUrl = GM_getResourceURL('santaHat');

		GM_addStyle(`
            #ao3-trans-fab-container {
                position: fixed;
                top: 0;
                left: 0;
                z-index: 2147483646;
                touch-action: none;
                cursor: grab;
                user-select: none;
            }
            #ao3-trans-fab-container.dragging {
                cursor: grabbing;
            }
            #ao3-trans-fab {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                background-color: #990000;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
                position: relative;
            }
            #ao3-trans-fab.christmas-mode::after {
                content: '';
                position: absolute;
                top: 5px;
                left: 18px;
                width: 14px;
                height: 14px;
                background-image: url(${santaHatUrl});
                background-size: contain;
                background-repeat: no-repeat;
                transform: rotate(-3deg);
                filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.4));
                pointer-events: none;
                z-index: 10;
            }
            #ao3-trans-fab-container.snapped:not(.is-active) #ao3-trans-fab {
                opacity: 0.3;
            }
            #ao3-trans-fab-container:hover #ao3-trans-fab {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
            }
            .fab-icon {
                width: 26px;
                height: 26px;
                background-image: url(${iconUrl});
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                filter: brightness(0) invert(1);
            }
        `);

		const fabContainer = document.createElement('div');
		fabContainer.id = 'ao3-trans-fab-container';

		const fabButton = document.createElement('div');
		fabButton.id = 'ao3-trans-fab';

		if (checkChristmas()) {
			fabButton.classList.add('christmas-mode');
		}

		const settingsIcon = document.createElement('div');
		settingsIcon.className = 'fab-icon';

		fabButton.appendChild(settingsIcon);
		fabContainer.appendChild(fabButton);
		document.body.appendChild(fabContainer);

		return { fabContainer };
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
	function initializeFabInteraction(fabElements, panelLogic) {
		const { fabContainer } = fabElements;
		const FAB_POSITION_KEY = 'ao3_fab_position';
		const DRAG_THRESHOLD = 5;
		const SAFE_MARGIN = 16;
		const RETRACT_MARGIN = 10;
		const SNAP_THRESHOLD = 40;

		let isPointerDown = false;
		let isDragging = false;
		let startCoords = { x: 0, y: 0 };
		let startPosition = { x: 0, y: 0 };
		let fabSize = { width: 0, height: 0 };

		let lastWinWidth = document.documentElement.clientWidth;
		let maxWinHeight = window.innerHeight;

		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
		};

		const snapDecision = (forceRetract = false) => {
			if (isDragging) return;
			window.removeEventListener('mousemove', checkMouseLeave);

			const winW = document.documentElement.clientWidth;
			const currentH = window.innerHeight;

			if (currentH > maxWinHeight) maxWinHeight = currentH;

			const isKeyboardState = isTouchDevice &&
				(Math.abs(winW - lastWinWidth) < 5) &&
				(currentH < maxWinHeight * 0.80);

			const effectiveH = isKeyboardState ? maxWinHeight : currentH;

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

			if ((isNearLeft && isNearTop) || (isNearLeft && isNearBottom) || (isNearRight && isNearTop) || (isNearRight && isNearBottom)) {
				finalPos.x = isNearLeft ? SAFE_MARGIN : winW - fabSize.width - SAFE_MARGIN;
				finalPos.y = isNearTop ? SAFE_MARGIN : effectiveH - fabSize.height - SAFE_MARGIN;
				fabContainer.classList.remove('snapped', 'is-active');
			} else if (isNearLeft || isNearRight || isNearTop || isNearBottom) {
				const minVertical = Math.min(dist.top, dist.bottom);
				const minHorizontal = Math.min(dist.left, dist.right);

				if (minHorizontal < minVertical) {
					finalPos.x = isNearLeft ? -fabSize.width / 2 : winW - fabSize.width / 2;
				} else {
					finalPos.y = isNearTop ? -fabSize.height / 2 : effectiveH - fabSize.height / 2;
				}
				fabContainer.classList.add('snapped');
				fabContainer.classList.remove('is-active');
			} else {
				shouldSnap = false;
				fabContainer.classList.remove('snapped', 'is-active');
			}

			if (shouldSnap || forceRetract) {
				setPosition(finalPos, true);
				savePosition(finalPos);
			}
		};

		const activateFab = () => {
			if (isDragging || !fabContainer.classList.contains('snapped')) return;

			window.removeEventListener('mousemove', checkMouseLeave);
			fabContainer.classList.add('is-active');

			const winW = document.documentElement.clientWidth;
			const winH = window.innerHeight;
			const currentPos = { x: parseFloat(fabContainer.style.left), y: parseFloat(fabContainer.style.top) };
			let newPos = { ...currentPos };

			if (currentPos.x < 0) newPos.x = RETRACT_MARGIN;
			else if (currentPos.x > winW - fabSize.width) newPos.x = winW - fabSize.width - RETRACT_MARGIN;

			if (currentPos.y < 0) newPos.y = RETRACT_MARGIN;
			else if (currentPos.y > winH - fabSize.height) newPos.y = winH - fabSize.height - RETRACT_MARGIN;

			setPosition(newPos, true);
		};

		const onPointerDown = (e) => {
			if (e.button !== 0 && e.pointerType !== 'touch') return;
			fabContainer.setPointerCapture(e.pointerId);
			isPointerDown = true;
			isDragging = false;
			startCoords = { x: e.clientX, y: e.clientY };
			startPosition = { x: parseFloat(fabContainer.style.left || 0), y: parseFloat(fabContainer.style.top || 0) };
			fabContainer.style.transition = 'none';
		};

		const onPointerMove = (e) => {
			if (!isPointerDown) return;
			const dx = e.clientX - startCoords.x;
			const dy = e.clientY - startCoords.y;

			if (!isDragging && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
				isDragging = true;
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
			} else {
				if (fabContainer.classList.contains('snapped') && !fabContainer.classList.contains('is-active')) {
					activateFab();
				}
				panelLogic.togglePanel();
			}
		};

		const checkMouseLeave = (e) => {
			const rect = fabContainer.getBoundingClientRect();
			const extendedRect = {
				left: rect.left - SAFE_MARGIN, top: rect.top - SAFE_MARGIN,
				right: rect.right + SAFE_MARGIN, bottom: rect.bottom + SAFE_MARGIN
			};
			if (e.clientX < extendedRect.left || e.clientX > extendedRect.right || e.clientY < extendedRect.top || e.clientY > extendedRect.bottom) {
				if (panelLogic.panel.style.display !== 'flex') {
					snapDecision(true);
				}
			}
		};

		const onResize = debounce(() => {
			const currentWidth = document.documentElement.clientWidth;
			const currentHeight = window.innerHeight;

			if (currentHeight > maxWinHeight) {
				maxWinHeight = currentHeight;
			}

			const isKeyboardState = isTouchDevice &&
				(Math.abs(currentWidth - lastWinWidth) < 5) &&
				(currentHeight < maxWinHeight * 0.80);

			lastWinWidth = currentWidth;

			if (isKeyboardState) {
				return;
			}

			updateFabSize();
			snapDecision(true);
		}, 200);

		fabContainer.addEventListener('pointerdown', onPointerDown);
		fabContainer.addEventListener('pointermove', onPointerMove);
		fabContainer.addEventListener('pointerup', onPointerUp);
		fabContainer.addEventListener('contextmenu', (e) => { e.preventDefault(); panelLogic.togglePanel(); });

		if (!isTouchDevice) {
			fabContainer.addEventListener('mouseenter', activateFab);
			fabContainer.addEventListener('mouseleave', () => {
				if (panelLogic.panel.style.display !== 'flex') {
					window.addEventListener('mousemove', checkMouseLeave);
				}
			});
		}

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
			toggleFabVisibility: () => {
				const showFab = GM_getValue('show_fab', true);
				fabContainer.style.display = showFab ? 'block' : 'none';
			},
			retractFab: () => snapDecision(true)
		};
	}

	/**
	 * 创建数据选择模态框
	 */
	function createSelectionModal(title, items, mode = 'import', storageKey = null) {
		return new Promise((resolve, reject) => {
			if (document.getElementById('ao3-data-selection-overlay')) {
				return reject(new Error('已有模态框正在显示'));
			}

			GM_addStyle(`
				#ao3-data-selection-overlay {
					position: fixed; top: 0; left: 0; width: 100%; height: 100%;
					background-color: rgba(0, 0, 0, 0.5);
					z-index: 2147483648; display: flex; align-items: center; justify-content: center;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
				}
				#ao3-data-selection-modal {
					background-color: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
					width: 85%; max-width: 300px; overflow: hidden; display: flex; flex-direction: column;
					max-height: 80vh; color: #000000DE;
				}
				.data-modal-header {
					padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.12);
					display: flex; justify-content: center; align-items: center;
					position: relative;
				}
				.data-modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
				.data-modal-body { padding: 8px 0; overflow-y: auto; flex: 1; }
				.data-selection-item {
					padding: 8px 16px; display: flex; align-items: center; gap: 12px;
					cursor: pointer; transition: background-color 0.2s;
					-webkit-tap-highlight-color: transparent;
				}
				.data-selection-item:hover { background-color: rgba(0,0,0,0.04); }
				.data-selection-item.disabled {
					opacity: 0.5; cursor: default; background-color: transparent;
				}
				.data-selection-item input { margin: 0; cursor: pointer; width: 16px; height: 16px; }
				.data-selection-item.disabled input { cursor: default; }

				.data-item-content { display: flex; flex-direction: column; }
				.data-item-label { font-size: 14px; font-weight: 400; color: #333; margin-left: 8px; }

				.data-modal-footer {
					padding: 8px 16px; border-top: 1px solid rgba(0,0,0,0.12);
					display: flex; flex-direction: row; justify-content: space-between; align-items: center;
					background-color: #fff; gap: 8px;
				}
				.data-modal-btn {
					flex: 1;
					padding: 6px 0; border-radius: 4px; font-size: 13px; font-weight: 500;
					cursor: pointer; border: none; background: transparent !important;
					color: #333;
					transition: opacity 0.2s;
					white-space: nowrap;
					display: flex;
					justify-content: center;
					align-items: center;
					line-height: 1;
					-webkit-tap-highlight-color: transparent;
					outline: none;
				}
				.data-modal-btn:focus { outline: none; }
				.data-modal-btn:hover { opacity: 0.7; }

				.data-select-all-wrapper {
					font-size: 13px; color: #1976d2; cursor: pointer; user-select: none;
					position: absolute; right: 16px;
					-webkit-tap-highlight-color: transparent;
					outline: none;
				}

				@media (prefers-color-scheme: dark) {
					#ao3-data-selection-modal { background-color: #1e1e1e; color: #e0e0e0; }
					.data-modal-header, .data-modal-footer { border-color: rgba(255,255,255,0.12); background-color: #1e1e1e; }
					.data-selection-item:hover { background-color: rgba(255,255,255,0.08); }
					.data-item-label { color: #e0e0e0; }
					.data-modal-btn { color: #e0e0e0; }
					.data-select-all-wrapper { color: #64b5f6; }
				}
			`);

			const overlay = document.createElement('div');
			overlay.id = 'ao3-data-selection-overlay';

			const savedSelection = storageKey ? GM_getValue(storageKey, []) : [];
			const hasSavedSelection = savedSelection.length > 0;

			let html = `
                <div id="ao3-data-selection-modal">
                    <div class="data-modal-header">
                        <h3>${title}</h3>
                        <div class="data-select-all-wrapper">全选</div>
                    </div>
                    <div class="data-modal-body">
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
                    <div class="data-modal-footer">
            `;

			if (mode === 'export') {
				html += `
                        <button class="data-modal-btn cancel">取消</button>
                        <button class="data-modal-btn confirm">确认</button>
                `;
			} else {
				html += `
                        <button class="data-modal-btn cancel">取消导入</button>
                        <button class="data-modal-btn merge">数据合并</button>
                        <button class="data-modal-btn overwrite">数据覆盖</button>
                `;
			}

			html += `
                    </div>
                </div>
            `;

			overlay.innerHTML = html;
			document.body.appendChild(overlay);

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
			const keys = [
				'enable_RegExp', 'enable_transDesc', 'show_fab', 'transEngine',
				'translation_display_mode', 'ao3_glossary_last_action',
				'from_lang', 'to_lang', 'lang_detector', 'enable_ui_trans',
				'enable_debug_mode', 'custom_url_first_save_done'
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
			const postReplaceRules = GM_getValue(POST_REPLACE_RULES_KEY, []);

			allData.data.glossaries = {
				customGlossaries: GM_getValue(CUSTOM_GLOSSARIES_KEY),
				importedGlossaries: GM_getValue(IMPORTED_GLOSSARY_KEY),
				metadata: GM_getValue(GLOSSARY_METADATA_KEY),
				onlineOrder: GM_getValue(ONLINE_GLOSSARY_ORDER_KEY, []),
				postReplaceRules: postReplaceRules,
				lastSelected: GM_getValue(LAST_SELECTED_GLOSSARY_KEY)
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

		return allData;
	}

    /**
	 * 导入用户配置数据，支持按需导入及合并/覆盖模式
	 */
	async function importAllData(jsonData, selectedCategories, importMode, syncPanelStateCallback) {
		if (!jsonData || typeof jsonData !== 'object' || !jsonData.data || typeof jsonData.data !== 'object') {
			return { success: false, message: "文件格式无效或文件已损坏：缺少核心 'data' 模块。" };
		}

		const fileMetadata = jsonData.metadata || {};
		const fileFormatVersion = parseFloat(fileMetadata.exportFormatVersion || "1.0");
		const currentScriptSupportedVersion = 1.3;

		if (fileFormatVersion > currentScriptSupportedVersion) {
			try {
				await showCustomConfirm(
					`该备份文件的格式版本 (${fileFormatVersion}) 高于当前脚本支持的版本 (${currentScriptSupportedVersion})。\n\n强制导入可能会导致部分设置丢失或功能异常。\n是否仍要继续？`,
					'提示'
				);
			} catch (e) {
				return { success: false, message: "用户取消导入：版本不兼容。" };
			}
		}

		const data = jsonData.data;
		const isSelected = (id) => selectedCategories.includes(id);
		const isOverwrite = importMode === 'overwrite';
		let importLog = [];

		const serviceIdMap = new Map();

		if (isSelected('customServices')) {
			if (isOverwrite) {
				GM_setValue(CUSTOM_SERVICES_LIST_KEY, []);
			}

			if (Array.isArray(data.customServices)) {
				const existingServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
				let addedCount = 0;

				for (const importedService of data.customServices) {
					if (!importedService || typeof importedService.id !== 'string') continue;

					const newServiceId = `custom_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
					serviceIdMap.set(importedService.id, newServiceId);

					let models = importedService.models || [];
					if (models.length === 0 && importedService.modelsRaw) {
						models = importedService.modelsRaw.replace(/[，]/g, ',').split(',').map(m => m.trim()).filter(Boolean);
					}

					const newServiceConfig = {
						id: newServiceId,
						name: importedService.name,
						url: importedService.url,
						modelsRaw: importedService.modelsRaw,
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
				GM_setValue(CUSTOM_SERVICES_LIST_KEY, existingServices);
				if (addedCount > 0) importLog.push(`导入 ${addedCount} 个自定义服务`);
			}
		}

		if (isSelected('staticKeys') && data.staticKeys) {
			for (const [key, value] of Object.entries(data.staticKeys)) {
				if (value !== undefined) {
					let finalValue = value;
					if (key === 'transEngine' && serviceIdMap.has(value)) {
						finalValue = serviceIdMap.get(value);
					}
					if (key === 'from_lang' && (value === 'auto' || value === 'script_auto')) {
						finalValue = 'auto';
					}
					GM_setValue(key, finalValue);
				}
			}
			if (data.staticKeys.enable_debug_mode !== undefined) {
				Logger.config.enabled = data.staticKeys.enable_debug_mode;
			}
			importLog.push("基础设置已更新");
		}

		if (isSelected('apiKeys') && data.apiKeys) {
			if (isOverwrite) {
				const builtInServices = Object.keys(engineMenuConfig).filter(id => !id.startsWith('custom_') && id !== 'add_new_custom');
				builtInServices.forEach(id => {
					GM_deleteValue(`${id}_keys_string`);
					GM_deleteValue(`${id}_keys_array`);
					GM_deleteValue(`${id}_key_index`);
				});
			}

			const builtInServices = Object.keys(engineMenuConfig).filter(id => !id.startsWith('custom_') && id !== 'add_new_custom');
			for (const [key, value] of Object.entries(data.apiKeys)) {
				const isBuiltInKey = builtInServices.some(id => key.startsWith(id));
				if (value !== undefined && isBuiltInKey) {
					GM_setValue(key, value);
				}
			}
			importLog.push("内置服务 API Key 已更新");
		}

		if (isSelected('modelSelections') && data.modelSelections) {
			let hasCustomMappings = false;
			for (const [key, value] of Object.entries(data.modelSelections)) {
				if (value !== undefined) {
					GM_setValue(key, value);
					if (key.endsWith('_custom_model_mapping')) hasCustomMappings = true;
				}
			}
			if (hasCustomMappings) importLog.push("内置服务自定义模型已导入");
		}

		if (isSelected('glossaries') && data.glossaries) {
			const g = data.glossaries;

			if (isOverwrite) {
				GM_setValue(CUSTOM_GLOSSARIES_KEY, []);
				GM_setValue(IMPORTED_GLOSSARY_KEY, {});
				GM_setValue(GLOSSARY_METADATA_KEY, {});
				GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, []);
				GM_setValue(POST_REPLACE_RULES_KEY, []);
			}

			if (g.local || g.forbidden) {
				const existingLocal = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
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
				const existingLocal = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
				let localAdded = 0;
				g.customGlossaries.forEach(importedLocal => {
					const newId = `local_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
					if (data.uiState && data.uiState.localGlossarySelectedId === importedLocal.id) {
						data.uiState._mappedLocalId = newId;
					}
					existingLocal.push({
						...importedLocal,
						id: newId,
						name: importedLocal.name
					});
					localAdded++;
				});
				GM_setValue(CUSTOM_GLOSSARIES_KEY, existingLocal);
				if (localAdded > 0) importLog.push(`导入 ${localAdded} 个本地术语表`);
			}

			if (g.importedGlossaries) {
				const existingImported = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
				const mergedImported = { ...existingImported, ...g.importedGlossaries };
				GM_setValue(IMPORTED_GLOSSARY_KEY, mergedImported);
			}

			if (g.metadata) {
				const existingMeta = GM_getValue(GLOSSARY_METADATA_KEY, {});
				const mergedMeta = { ...existingMeta, ...g.metadata };
				GM_setValue(GLOSSARY_METADATA_KEY, mergedMeta);
			} else if (g.onlineMetadata) {
				const existingMeta = GM_getValue(GLOSSARY_METADATA_KEY, {});
				const mergedMeta = { ...existingMeta, ...g.onlineMetadata };
				GM_setValue(GLOSSARY_METADATA_KEY, mergedMeta);
			}

			if (g.onlineOrder && Array.isArray(g.onlineOrder)) {
				if (isOverwrite) {
					GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, g.onlineOrder);
				} else {
					const currentOrder = GM_getValue(ONLINE_GLOSSARY_ORDER_KEY, []);
					const currentSet = new Set(currentOrder);
					const newItems = g.onlineOrder.filter(url => !currentSet.has(url));
					GM_setValue(ONLINE_GLOSSARY_ORDER_KEY, [...currentOrder, ...newItems]);
				}
			}

			if (g.postReplaceRules && Array.isArray(g.postReplaceRules)) {
				const existingRules = GM_getValue(POST_REPLACE_RULES_KEY, []);
				let rulesAdded = 0;
				g.postReplaceRules.forEach(importedRule => {
					const newId = `replace_imp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
					if (data.uiState && data.uiState.postReplaceSelectedId === importedRule.id) {
						data.uiState._mappedReplaceId = newId;
					}
					existingRules.push({
						...importedRule,
						id: newId
					});
					rulesAdded++;
				});
				GM_setValue(POST_REPLACE_RULES_KEY, existingRules);
				if (rulesAdded > 0) importLog.push(`导入 ${rulesAdded} 个替换规则`);
			}

			let importedPostReplaceString = '';
			if (typeof g.postReplaceString === 'string' && g.postReplaceString.trim()) {
				importedPostReplaceString = g.postReplaceString;
			} else if (g.postReplace && typeof g.postReplace === 'object') {
				const parts = [];
				if (g.postReplace.singleRules) {
					Object.entries(g.postReplace.singleRules).forEach(([k, v]) => parts.push(`${k}:${v}`));
				}
				if (Array.isArray(g.postReplace.multiPartRules)) {
					g.postReplace.multiPartRules.forEach(r => {
						if (r.source && r.target) parts.push(`${r.source}=${r.target}`);
					});
				}
				importedPostReplaceString = parts.join('，');
			} else if (typeof g.postReplace === 'string') {
				importedPostReplaceString = g.postReplace;
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

		if (isSelected('aiParameters') && data.aiParameters) {

			const legacyKeys = [
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
				} else {
					const currentProfiles = GM_getValue(AI_PROFILES_KEY, []);
					const existingIds = new Set(currentProfiles.map(p => p.id));

					let addedCount = 0;
					importedProfiles.forEach(p => {
						if (existingIds.has(p.id)) {
							p.id = `profile_imp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
							p.name = `${p.name}`;
						}
						currentProfiles.push(p);
						addedCount++;
					});
					GM_setValue(AI_PROFILES_KEY, currentProfiles);
				}
				importLog.push("AI 参数配置已更新");
			}
		}

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

		if (isSelected('blockerSettings') && data.blockerSettings) {
			const bData = data.blockerSettings;
			const listKeys = [
				'ao3_blocker_tags_black', 'ao3_blocker_tags_white',
				'ao3_blocker_content_author', 'ao3_blocker_content_title',
				'ao3_blocker_content_summary', 'ao3_blocker_content_id',
				'ao3_blocker_adv_pairing', 'ao3_blocker_adv_char',
				'ao3_blocker_adv_lang'
			];

			for (const [key, value] of Object.entries(bData)) {
				if (!BLOCKER_KEYS.includes(key)) continue;

				if (isOverwrite) {
					GM_setValue(key, value);
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
						}
					} else {
						GM_setValue(key, value);
					}
				}
			}
			importLog.push("屏蔽规则已更新");
		}

		if (isSelected('formatting') && data.formatting) {
			const fData = data.formatting;
			if (fData[FORMATTING_PROFILES_KEY] !== undefined) {
				GM_setValue(FORMATTING_PROFILES_KEY, fData[FORMATTING_PROFILES_KEY]);
			}
			if (fData[FORMATTING_SELECTED_ID_KEY] !== undefined) {
				GM_setValue(FORMATTING_SELECTED_ID_KEY, fData[FORMATTING_SELECTED_ID_KEY]);
			}
			importLog.push("文章格式设置已更新");
		}

		synchronizeAllSettings(syncPanelStateCallback);

		let syncSummary = "";
		if (isSelected('glossaries')) {
			const importedUrls = (data.glossaries?.importedGlossaries) ? Object.keys(data.glossaries.importedGlossaries) :
				(data.glossaries?.onlineMetadata ? Object.keys(data.glossaries.onlineMetadata) : []);
			if (importedUrls.length > 0) {
				const downloadPromises = importedUrls.map(url => importOnlineGlossary(url, { silent: true }));
				Promise.allSettled(downloadPromises).then(results => {
					const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
					if (successful.length > 0) {
						Logger.info('数据', `后台同步了 ${successful.length} 个在线术语表`);
					}
				});
				syncSummary = `\n已触发 ${importedUrls.length} 个在线术语表的后台同步。`;
			}
		}

		const modeText = isOverwrite ? "覆盖" : "合并";
		const finalMessage = importLog.length > 0 ? `${modeText}导入完成：${importLog.join('，')}。` : "数据导入完成。";
		return { success: true, message: finalMessage + syncSummary };
	}

	/**
	 * 同步函数，用于在设置变更后激活所有数据和状态
	 */
	function synchronizeAllSettings(syncPanelStateCallback) {
		const allServiceIds = [
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

		invalidateGlossaryCache();

		if (typeof syncPanelStateCallback === 'function') {
			syncPanelStateCallback();
		}

		const displayMode = GM_getValue('translation_display_mode', 'bilingual');
		applyDisplayModeChange(displayMode);
		if (typeof refreshBlocker === 'function') {
			refreshBlocker('full');
		}
		if (typeof applyFormatting === 'function') {
			applyFormatting();
		}
	}

    /**
	 * 设置面板的结构与样式
	 */
	function createSettingsPanelUI() {
		const existing = document.getElementById('ao3-trans-settings-panel');
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
				debugActionsContainer: existing.querySelector('#debug-actions-container'),
				toggleDebugBtn: existing.querySelector('#btn-toggle-debug'),
				exportLogBtn: existing.querySelector('#btn-export-log'),
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

		const BLOCKER_STYLE = `
            .ao3-blocker-hidden {
                display: none !important;
            }
            .ao3-blocker-work {
                padding: 0 !important;
                min-height: auto !important;
            }
            .ao3-blocker-fold {
                display: flex !important;
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: center !important;
                padding: 0.6em 1em !important;

                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                opacity: 1 !important;

                width: 100% !important;
                box-sizing: border-box !important;
            }
            .ao3-blocker-note {
                font-size: 13px !important;
                color: inherit !important;
                font-style: normal !important;
                font-weight: normal !important;
                flex: 1 !important;
                margin-right: 10px !important;
                word-break: break-all !important;
            }
            .ao3-blocker-toggle {
                padding: 4px !important;
                margin: 0 !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                color: inherit !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                user-select: none !important;
                flex-shrink: 0 !important;
                -webkit-tap-highlight-color: transparent !important;
                outline: none !important;
            }
            .ao3-blocker-toggle svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }
            .ao3-blocker-cut {
                display: none !important;
            }
            .ao3-blocker-unhide > .ao3-blocker-fold {
                border-bottom: 1px solid currentColor !important;
                border-bottom-color: rgba(127, 127, 127, 0.25) !important;
                margin-bottom: 0 !important;
            }
            .ao3-blocker-unhide > .ao3-blocker-cut {
                display: block !important;
                padding: 10px !important;
            }
        `;

		const SERVICE_MODAL_STYLE = `
            #ai-service-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2147483648; display: flex; align-items: center; justify-content: center;
                font-family: var(--ao3-font);
            }
            #ai-service-modal {
                background-color: var(--ao3-bg); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                width: 85%; max-width: 300px; overflow: hidden; display: flex; flex-direction: column;
                max-height: 80vh; color: var(--ao3-text);
            }
            .ai-modal-header {
                padding: 12px 16px; border-bottom: 1px solid var(--ao3-border);
                display: flex; justify-content: center; align-items: center;
                position: relative;
            }
            .ai-modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
            .ai-select-all-btn {
                font-size: 13px; color: var(--ao3-primary); cursor: pointer; user-select: none;
                position: absolute; right: 16px;
            }
            .ai-modal-body {
                padding: 8px 0;
                overflow-y: auto;
                flex: 1;
                max-height: 40vh;
            }

            .ai-service-item {
                padding: 8px 16px; display: flex; align-items: center; gap: 12px;
                cursor: pointer; transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                justify-content: flex-start;
            }
            .ai-service-item:hover { background-color: var(--ao3-hover-bg); }
            .ai-service-label { font-size: 14px; font-weight: 400; color: var(--ao3-text); }
            .ai-service-item input { margin: 0; cursor: pointer; width: 16px; height: 16px; }

            .ai-modal-footer {
                padding: 8px 16px; border-top: 1px solid var(--ao3-border);
                display: flex; flex-direction: row; justify-content: space-between; align-items: center;
                background-color: var(--ao3-bg); gap: 8px;
            }
            .ai-modal-btn {
                flex: 1;
                padding: 6px 0; border-radius: 4px; font-size: 13px; font-weight: 500;
                cursor: pointer; border: none; background: transparent !important;
                color: var(--ao3-text);
                transition: opacity 0.2s;
                white-space: nowrap;
                display: flex;
                justify-content: center;
                align-items: center;
                line-height: 1;
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }
            .ai-modal-btn:focus { outline: none !important; }
            .ai-modal-btn:hover { opacity: 0.7; }

            .pseudo-select {
                cursor: pointer;
                height: 40px;
                line-height: normal;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                user-select: none;
                display: flex;
                align-items: center;
            }
        `;

		GM_addStyle(`
            /* 变量定义 */
            #ao3-trans-settings-panel, .custom-dropdown-menu, .drag-ghost, #ai-service-modal {
                --ao3-bg: #ffffff;
                --ao3-text: #000000DE;
                --ao3-text-secondary: #666666;
                --ao3-text-placeholder: #757575;
                --ao3-border: rgba(0, 0, 0, 0.12);
                --ao3-border-hover: rgba(0, 0, 0, 0.87);
                --ao3-primary: #1976d2;
                --ao3-danger: #d32f2f;
                --ao3-hover-bg: #f5f5f5;
                --ao3-selected-bg: #e3f2fd;
                --ao3-shadow: 0 8px 24px rgba(0,0,0,0.12);
                --ao3-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            /* 基础布局 */
            #ao3-trans-settings-panel {
                display: none;
                position: fixed;
                z-index: 2147483647;
                width: 300px;
                border-radius: 12px;
                font-family: var(--ao3-font);
                overflow: hidden;
                flex-direction: column;
                max-height: 85vh;
            }
            #ao3-trans-settings-panel.dragging {
                opacity: 0.8;
                transition: opacity 0.2s ease-in-out;
            }
            #ao3-trans-settings-panel.mobile-fixed-center {
                top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%;
                max-height: 90vh !important;
            }
            .settings-panel-header {
                padding: 0px 4px 0px 16px;
                border-bottom: 1px solid var(--ao3-border);
                cursor: move;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 40px;
                flex-shrink: 0;
            }
            .settings-panel-header-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .settings-panel-header-title h2 {
                margin: 0; font-size: 16px; font-weight: bold; font-family: inherit;
            }
            .settings-panel-header-title .home-icon-link {
                display: flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                border-bottom: none;
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1 !important;
                height: 24px !important;
                width: 24px !important;
                min-width: 24px !important;
            }
            .settings-panel-header-title .home-icon-link svg {
                width: 24px;
                height: 24px;
                fill: var(--ao3-text) !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .settings-panel-close-btn {
                cursor: pointer; width: 40px; height: 40px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 24px; color: rgba(0, 0, 0, 0.54);
            }
            .settings-panel-body {
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                overflow-y: auto;
                flex: 1;
                min-height: 0;
            }

            /* 滚动条样式 */
            .settings-panel-body::-webkit-scrollbar,
            .custom-dropdown-menu ul::-webkit-scrollbar,
            .settings-group textarea.settings-control::-webkit-scrollbar,
            .ai-modal-body::-webkit-scrollbar,
            .data-modal-body::-webkit-scrollbar {
                width: 4px;
            }
            .settings-panel-body::-webkit-scrollbar-track,
            .custom-dropdown-menu ul::-webkit-scrollbar-track,
            .settings-group textarea.settings-control::-webkit-scrollbar-track,
            .ai-modal-body::-webkit-scrollbar-track,
            .data-modal-body::-webkit-scrollbar-track {
                background: transparent;
            }
            .settings-panel-body::-webkit-scrollbar-thumb,
            .custom-dropdown-menu ul::-webkit-scrollbar-thumb,
            .settings-group textarea.settings-control::-webkit-scrollbar-thumb,
            .ai-modal-body::-webkit-scrollbar-thumb,
            .data-modal-body::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.15);
                border-radius: 3px;
            }
            .editable-section {
                display: none;
                flex-direction: column;
                gap: 16px;
                width: 100%;
            }
            #local-edit-container-translation {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* 组件：开关 */
            .settings-switch-group { display: flex; justify-content: space-between; align-items: center; padding: 0; }
            .settings-panel-body > .settings-switch-group:first-child { padding-left: 14px; }
            .settings-panel-body > .settings-switch-group:first-child .settings-label { font-size: 15px; }
            .settings-switch-group .settings-label { font-size: 13px; font-weight: 400; }
            .settings-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .settings-switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
            .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: #209CEE; }
            input:checked + .slider:before { transform: translateX(20px); }

            /* 组件：输入框与选择框 */
            .settings-group { position: relative; }
            .settings-group.ao3-trans-control-disabled {
                pointer-events: none;
                opacity: 1 !important;
            }

            .settings-group .settings-control {
                -webkit-appearance: none; appearance: none;
                width: 100%; height: 40px; padding: 0 12px;
                border-radius: 6px; border: 1px solid #ccc;
                font-size: 15px; font-family: inherit;
                box-sizing: border-box; line-height: 40px;
                min-width: 0;
                transition: border-color 0.2s ease;
            }
            .settings-group textarea.settings-control {
                height: 72px !important; min-height: 72px !important; max-height: 72px !important;
                line-height: 1.5; padding-top: 8px; padding-bottom: 8px; resize: none;
            }

            .settings-group .settings-control:hover:not(:disabled) {
                border-color: var(--ao3-border-hover) !important;
            }
            .settings-group .settings-control:focus {
                border-color: var(--ao3-primary) !important;
                border-width: 1px;
                outline: none;
            }

            .settings-group .settings-label {
                position: absolute; top: 50%; transform: translateY(-50%); left: 12px;
                font-size: 14px; color: var(--ao3-text-secondary);
                pointer-events: none; transition: all 0.2s ease;
                padding: 0 4px;
            }
            .settings-group .settings-control:focus + .settings-label,
            .settings-group .settings-control.has-value + .settings-label {
                top: 0; left: 10px; font-size: 12px; color: var(--ao3-primary);
            }
            .settings-group .settings-control:not(:focus).has-value + .settings-label {
                color: var(--ao3-text-secondary);
            }
            .settings-group.static-label .settings-label {
                top: 0; left: 10px; font-size: 12px; transform: translateY(-50%); color: var(--ao3-text-secondary);
            }
            .settings-group.static-label .settings-control {
                line-height: normal; padding-top: 4px; padding-bottom: 4px; height: 40px;
            }
            .settings-group.settings-group-select .settings-control.settings-select { padding-right: 40px; }
            .settings-group.settings-group-select::after {
                content: ''; position: absolute; right: 14px; top: 20px;
                transform: translateY(-50%) rotate(0deg); width: .65em; height: .65em;
                background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-5-1.9-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E');
                background-repeat: no-repeat; background-position: center; background-size: contain;
                pointer-events: none;
            }
            .settings-group.settings-group-select.dropdown-active::after { transform: translateY(-50%) rotate(180deg); }
            .input-wrapper { position: relative; }
            .input-wrapper .settings-input { padding-right: 52px !important; }
            #ai-param-input-area .input-wrapper textarea.settings-input { padding-right: 12px !important; }

            /* 隐藏数值输入框的调节按钮 */
            #ao3-trans-settings-panel input[type=number]::-webkit-outer-spin-button,
            #ao3-trans-settings-panel input[type=number]::-webkit-inner-spin-button {
                -webkit-appearance: none !important;
                margin: 0 !important;
            }
            #ao3-trans-settings-panel input[type=number] {
                -moz-appearance: textfield !important;
            }

            /* 组件：按钮 */
            .settings-action-button-inline {
                position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                background: none; border: none; color: var(--ao3-primary);
                font-size: 14px; font-weight: 500; cursor: pointer; padding: 4px;
                display: flex; align-items: center;
            }
            .data-sync-actions-container {
                display: flex; justify-content: space-between; align-items: center;
                padding: 8px 12px 0; margin-top: -8px;
            }
            .data-sync-action-btn {
                background: none; border: none; color: var(--ao3-primary);
                font-size: 13px; font-weight: 500; cursor: pointer;
                padding: 2px 4px; text-align: center;
            }
            .language-swap-container { display: flex; align-items: center; gap: 2px; }
            .language-swap-container .settings-group { flex: 1; min-width: 0; }
            #swap-lang-btn {
                background: transparent; border: none; cursor: pointer;
                font-size: 18px; color: #555; padding: 0 4px; line-height: 1;
                transition: color 0.2s ease; flex-shrink: 0;
            }
            #swap-lang-btn:disabled { color: #a9a9a9; cursor: default; }
            .service-details-toggle-container {
                display: flex; justify-content: center; align-items: center;
                height: 0; width: 12.5%; margin: -8px auto; z-index: 10;
                overflow: visible; cursor: pointer; position: relative;
            }
            .service-details-toggle-container::before {
                content: ""; position: absolute; top: -15px; bottom: -15px; left: 0; right: 0;
            }
            .service-details-toggle-container::after {
                content: none !important;
            }
            .service-details-toggle-btn {
                width: 0; height: 0;
                border-left: 6px solid transparent; border-right: 6px solid transparent;
                border-bottom: 8px solid var(--ao3-primary); border-top: 0;
                transition: transform 0.3s ease;
            }
            .service-details-toggle-btn.collapsed { transform: rotate(180deg); }

			/* 隐藏折叠按钮的多余箭头 */
            .service-details-toggle-btn::after,
            .service-details-toggle-btn::before {
                content: none !important;
                display: none !important;
            }

            /* 功能模块：下拉菜单 */
            .custom-dropdown-backdrop {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: transparent; z-index: 2147483647;
            }
            .custom-dropdown-menu {
                position: fixed; border-radius: 8px;
                border: 1px solid rgba(0, 0, 0, 0.08);
                z-index: 2147483647; overflow: hidden; opacity: 0;
                transform: scale(0.95) translateY(-10px); transform-origin: top center;
                transition: opacity 0.15s ease-out, transform 0.15s ease-out;
                box-sizing: border-box;
            }
            .custom-dropdown-menu.visible { opacity: 1; transform: scale(1) translateY(0); }
            .custom-dropdown-menu ul {
                list-style: none; margin: 0; padding: 8px 0;
                max-height: 250px; overflow-y: auto;
            }
            .custom-dropdown-menu li {
                padding: 8px 16px; cursor: pointer; font-size: 15px;
                transition: background-color 0.2s ease;
                display: flex; justify-content: space-between; align-items: center; gap: 8px;
            }
            .custom-dropdown-menu li .item-text {
                white-space: nowrap; overflow: hidden; text-overflow: clip; flex-grow: 1;
            }
            .custom-dropdown-menu li .item-actions { display: flex; gap: 8px; flex-shrink: 0; }
            .custom-dropdown-menu li .item-action-btn {
                font-size: 13px; font-weight: 500; background: none; border: none;
                padding: 0; cursor: pointer; color: var(--ao3-primary);
            }
            .custom-dropdown-menu li .item-action-btn.delete[data-confirming="true"] {
                color: var(--ao3-danger);
            }
            .custom-dropdown-menu li.drag-placeholder {
                opacity: 0.3 !important; background: #e0e0e0 !important;
                border: 1px dashed #999 !important; color: transparent !important;
            }
            .custom-dropdown-menu li.drag-placeholder * { visibility: hidden !important; }

            /* 功能模块：拖拽排序 */
            .drag-ghost {
                position: fixed !important; z-index: 2147483648 !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
                opacity: 1 !important; pointer-events: none !important;
                transition: none !important; list-style: none !important;
                border-radius: 4px !important; cursor: grabbing !important;
                white-space: nowrap !important; overflow: hidden !important;
                box-sizing: border-box !important; margin: 0 !important; border: none !important;
                display: flex !important; justify-content: space-between !important;
                align-items: center !important; padding: 8px 16px !important;
                font-size: 15px !important; font-family: var(--ao3-font) !important;
            }
            .drag-ghost .item-text { flex-grow: 1 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: clip !important; }
            .drag-ghost .item-actions { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; }
            .drag-ghost .item-action-btn {
                font-size: 13px !important; font-weight: 500 !important;
                background: none !important; border: none !important; padding: 0 !important;
                color: var(--ao3-primary) !important; -webkit-text-fill-color: var(--ao3-primary) !important;
            }
            .drag-ghost .item-action-btn[data-confirming="true"] {
                color: var(--ao3-danger) !important; -webkit-text-fill-color: var(--ao3-danger) !important;
            }
            body.ao3-dragging-active { cursor: grabbing !important; user-select: none !important; }
            body.ao3-dragging-active .custom-dropdown-menu { pointer-events: none !important; }

            /* 功能模块：在线术语表管理 */
            .online-glossary-details {
                width: 100%; display: flex; justify-content: space-between; align-items: center;
                font-size: 12px; color: var(--ao3-text-secondary); padding: 4px 12px; overflow: hidden;
            }
            #online-glossary-details-container { margin-top: -10px; margin-bottom: -10px; }
            #online-glossary-info {
                flex-grow: 1; text-align: left; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis; padding-right: 8px; min-width: 0;
            }
            .online-glossary-delete-btn {
                flex-shrink: 0; background: none; border: none; color: var(--ao3-primary);
                font-size: 13px; font-weight: 500; cursor: pointer; padding: 2px 4px; text-align: right;
            }
            .online-glossary-delete-btn[data-confirming="true"] { color: var(--ao3-danger); }

            /* 功能模块：屏蔽器 */
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
            .ao3-blocker-toggle svg { width: 20px; height: 20px; fill: currentColor; }
            .ao3-blocker-cut { display: none !important; }
            .ao3-blocker-unhide > .ao3-blocker-fold {
                border-bottom: 1px solid currentColor !important;
                border-bottom-color: rgba(127, 127, 127, 0.25) !important; margin-bottom: 0 !important;
            }
            .ao3-blocker-unhide > .ao3-blocker-cut { display: block !important; padding: 10px !important; }

            /* 通用：移除点击高亮和聚焦状态 */
            .settings-action-button-inline, .online-glossary-delete-btn,
            .custom-dropdown-menu li .item-action-btn, .data-sync-action-btn,
            #swap-lang-btn, div.translate-me-ao3-wrapper > div,
            .service-details-toggle-container, .settings-switch, .slider,
            .settings-panel-close-btn, .home-icon-link, .custom-dropdown-menu li,
            .settings-control, .settings-label, .settings-switch input {
                -webkit-tap-highlight-color: transparent !important;
                outline: none !important;
                box-shadow: none !important;
            }
            .settings-action-button-inline:focus,
            .online-glossary-delete-btn:focus,
            .custom-dropdown-menu li .item-action-btn:focus,
            .data-sync-action-btn:focus,
            #swap-lang-btn:focus,
            .service-details-toggle-container:focus,
            .settings-switch input:focus,
            .settings-panel-close-btn:focus,
            .home-icon-link:focus {
                outline: none !important;
                box-shadow: none !important;
                border: none !important;
            }

            /* 站点主题隔离 */
            #ao3-trans-settings-panel, .custom-dropdown-menu, .drag-ghost, #ai-service-modal {
                color: var(--ao3-text) !important;
                background-color: var(--ao3-bg) !important;
                border-color: var(--ao3-border) !important;
                box-shadow: var(--ao3-shadow) !important;
            }
            .settings-panel-header { border-bottom-color: var(--ao3-border) !important; }
            .settings-panel-close-btn { color: rgba(0, 0, 0, 0.54) !important; }
            #ao3-trans-settings-panel .settings-switch-group .settings-label,
            #ao3-trans-settings-panel .online-glossary-details {
                color: var(--ao3-text) !important;
            }

            /* 重置按钮样式 */
            #ao3-trans-settings-panel button,
            #ao3-trans-settings-panel .settings-action-button-inline,
            #ao3-trans-settings-panel .data-sync-action-btn,
            #ao3-trans-settings-panel .online-glossary-delete-btn,
            #ao3-trans-settings-panel #swap-lang-btn,
            .custom-dropdown-menu button,
            .custom-dropdown-menu .item-action-btn {
                background: transparent !important;
                background-image: none !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
                text-shadow: none !important;
            }

            /* 重置输入框样式 */
            #ao3-trans-settings-panel input.settings-control,
            #ao3-trans-settings-panel select.settings-control,
            #ao3-trans-settings-panel textarea.settings-control,
            #ao3-trans-settings-panel div.settings-control {
                background-color: var(--ao3-bg) !important;
                color: var(--ao3-text) !important;
                border: 1px solid #ccc;
                background-image: none !important;
                box-shadow: none !important;
                text-shadow: none !important;
                border-radius: 6px !important;
            }

            /* 禁用状态下的输入框样式强制覆盖 */
            #ao3-trans-settings-panel .settings-control:disabled {
                background-color: var(--ao3-bg) !important;
                color: var(--ao3-text) !important;
                -webkit-text-fill-color: var(--ao3-text) !important;
                opacity: 1 !important;
                border-color: #ccc !important;
            }
            #ao3-trans-settings-panel .settings-control:disabled::placeholder {
                color: var(--ao3-text-placeholder) !important;
                -webkit-text-fill-color: var(--ao3-text-placeholder) !important;
                opacity: 1 !important;
            }

            #ao3-trans-settings-panel .settings-control::placeholder {
                color: var(--ao3-text-placeholder) !important;
                -webkit-text-fill-color: var(--ao3-text-placeholder) !important;
            }
            #ao3-trans-settings-panel .settings-label {
                background-color: var(--ao3-bg) !important;
                color: var(--ao3-text-secondary) !important;
            }

            /* 重置下拉菜单样式 */
            .custom-dropdown-menu li {
                background: transparent !important;
                color: var(--ao3-text) !important;
                border: none !important;
                text-shadow: none !important;
            }
            .custom-dropdown-menu li:hover {
                background-color: var(--ao3-hover-bg) !important;
                color: #000000 !important;
            }
            .custom-dropdown-menu li.selected {
                background-color: var(--ao3-selected-bg) !important;
            }

            /* 深色模式适配 */
            @media (prefers-color-scheme: dark) {
                #ao3-trans-settings-panel, .custom-dropdown-menu, .drag-ghost, #ai-service-modal {
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
                .settings-panel-close-btn { color: rgba(255, 255, 255, 0.7) !important; }

                /* 深色模式输入框 */
                #ao3-trans-settings-panel input.settings-control,
                #ao3-trans-settings-panel select.settings-control,
                #ao3-trans-settings-panel textarea.settings-control,
                #ao3-trans-settings-panel div.settings-control {
                    border-color: var(--ao3-border);
                    background-color: #252525 !important;
                    color: #e0e0e0 !important;
                }
                #ao3-trans-settings-panel .settings-control:disabled {
                    background-color: #252525 !important;
                    border-color: var(--ao3-border) !important;
                    opacity: 1 !important;
                }

                /* 深色模式下拉菜单 */
                .custom-dropdown-menu {
                    background-color: #252525 !important;
                }

                .settings-group.settings-group-select::after {
                    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-5-1.9-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E');
                }
                #custom-service-url-notice { background-color: #2d2d2d; color: #a0a0a0; }
                #swap-lang-btn { color: #a0a0a0 !important; }
                #swap-lang-btn:disabled { color: #444 !important; }
                .settings-panel-body::-webkit-scrollbar-thumb,
                .custom-dropdown-menu ul::-webkit-scrollbar-thumb,
                .settings-group textarea.settings-control::-webkit-scrollbar-thumb,
                .ai-modal-body::-webkit-scrollbar-thumb,
                .data-modal-body::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                }
                .custom-dropdown-menu li:hover { color: #ffffff !important; }
                .custom-dropdown-menu li.drag-placeholder {
                    background: #444 !important; border-color: #666 !important;
                }
                .ai-modal-header, .ai-modal-footer { border-color: rgba(255,255,255,0.12); background-color: #1e1e1e; }
                .ai-service-item:hover { background-color: rgba(255,255,255,0.08); }
                .ai-modal-btn { color: #e0e0e0; }
                .ai-select-all-btn { color: #64b5f6; }
            }
            ${BLOCKER_STYLE}
            ${SERVICE_MODAL_STYLE}
        `);

		const panel = document.createElement('div');
		panel.id = 'ao3-trans-settings-panel';
		const scriptVersion = GM_info.script.version.split('-')[0];

		panel.innerHTML = `
                <div class="settings-panel-header">
                    <div class="settings-panel-header-title">
                        <a href="https://github.com/V-Lipset/ao3-chinese" target="_blank" class="home-icon-link" title="访问项目主页">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
                        </a>
                        <h2>AO3 Translator v${scriptVersion}</h2>
                    </div>
                    <span class="settings-panel-close-btn" title="关闭">&times;</span>
                </div>
                <div class="settings-panel-body">
                    <div class="settings-switch-group">
                        <span class="settings-label">启用翻译功能</span>
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
                            <option value="data_sync">数据导入与导出</option>
                            <option value="debug_mode">调试模式与日志</option>
                        </select>
                        <label for="setting-glossary-actions" class="settings-label">更多功能</label>
                    </div>

                    <div id="debug-actions-container" class="data-sync-actions-container" style="display: none;">
                        <button id="btn-toggle-debug" class="data-sync-action-btn"></button>
                        <button id="btn-export-log" class="data-sync-action-btn">导出运行日志</button>
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

                    <div id="editable-section-lang-detect" class="settings-group static-label editable-section">
                        <div class="settings-group settings-group-select">
                            <select id="setting-lang-detector" class="settings-control settings-select custom-styled-select">
                                <option value="microsoft">Microsoft</option>
                                <option value="google">Google</option>
                                <option value="tencent">Tencent</option>
                                <option value="baidu">Baidu</option>
                            </select>
                            <label for="setting-lang-detector" class="settings-label">语言检测引擎</label>
                        </div>
                    </div>

                    <div id="editable-section-local-manage" class="editable-section" style="display: none;">
                        <div class="settings-group settings-group-select static-label"">
                            <select id="setting-local-glossary-select" class="settings-control settings-select custom-styled-select"></select>
                            <label for="setting-local-glossary-select" class="settings-label">当前术语表</label>
                        </div>
                        <div class="settings-group settings-group-select static-label"">
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
                        <div class="settings-group static-label"">
                            <div class="input-wrapper">
                                <input type="text" id="setting-input-glossary-import-url" class="settings-control settings-input" placeholder="请输入 GitHub/jsDelivr 链接" spellcheck="false">
                                <label for="setting-input-glossary-import-url" class="settings-label">导入在线术语表</label>
                                <button id="setting-btn-glossary-import-save" class="settings-action-button-inline">导入</button>
                            </div>
                        </div>
                        <div class="settings-group settings-group-select static-label">
                            <select id="setting-select-glossary-manage" class="settings-control settings-select custom-styled-select"></select>
                            <label for="setting-select-glossary-manage" class="settings-label">已导入的术语表</label>
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

		document.body.appendChild(panel);

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
			debugActionsContainer: panel.querySelector('#debug-actions-container'),
			toggleDebugBtn: panel.querySelector('#btn-toggle-debug'),
			exportLogBtn: panel.querySelector('#btn-export-log'),
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
		};
	}

	/**
	 * 显示一个自定义的确认模态框
	 */
	function showCustomConfirm(message, title = '提示', options = {}) {
		const { textAlign = 'left', useTextIndent = false } = options;
		return new Promise((resolve, reject) => {
			if (document.getElementById('ao3-custom-confirm-overlay')) {
				return reject(new Error('已有提示框正在显示中。'));
			}

			GM_addStyle(`
				#ao3-custom-confirm-overlay {
					position: fixed; top: 0; left: 0; width: 100%; height: 100%;
					background-color: rgba(0, 0, 0, 0.5);
					z-index: 2147483647; display: flex; align-items: center; justify-content: center;
				}
				#ao3-custom-confirm-modal {
					background-color: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
					width: 90%; max-width: 360px; overflow: hidden;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
					display: flex; flex-direction: column;
				}
				.ao3-custom-confirm-header {
					padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.12);
					text-align: center;
				}
				.ao3-custom-confirm-header h3 {
					margin: 0; font-size: 16px; font-weight: 600; color: #000000DE;
				}
				.ao3-custom-confirm-body {
					padding: 20px 16px; font-size: 14px; line-height: 1.6; color: #000000DE;
					white-space: pre-wrap;
				}
				.ao3-custom-confirm-body p {
					margin: 0;
				}
				.ao3-custom-confirm-body.with-indent p {
					text-indent: 2em;
				}
				.ao3-custom-confirm-footer {
					padding: 12px 16px; background-color: #fff;
					display: flex; flex-direction: row; justify-content: space-between; align-items: center; gap: 8px;
				}
				.ao3-custom-confirm-btn {
					flex: 1;
					padding: 6px 0; border: none; border-radius: 4px;
					font-size: 14px; font-weight: 500; cursor: pointer;
					background: transparent !important;
					color: #333; text-align: center;
					transition: opacity 0.2s;
					-webkit-tap-highlight-color: transparent;
					outline: none;
				}
				.ao3-custom-confirm-btn:focus { outline: none; }
				.ao3-custom-confirm-btn:hover { opacity: 0.7; }

				@media (prefers-color-scheme: dark) {
					#ao3-custom-confirm-modal { background-color: #1e1e1e; color: #e0e0e0; }
					.ao3-custom-confirm-header { border-bottom-color: rgba(255,255,255,0.12); }
					.ao3-custom-confirm-header h3 { color: #e0e0e0; }
					.ao3-custom-confirm-body { color: #e0e0e0; }
					.ao3-custom-confirm-footer { background-color: #1e1e1e; }
					.ao3-custom-confirm-btn { color: #e0e0e0; }
				}
			`);

			const overlay = document.createElement('div');
			overlay.id = 'ao3-custom-confirm-overlay';

			const modal = document.createElement('div');
			modal.id = 'ao3-custom-confirm-modal';

			const indentClass = useTextIndent ? ' with-indent' : '';

			modal.innerHTML = `
                <div class="ao3-custom-confirm-header"><h3>${title}</h3></div>
                <div class="ao3-custom-confirm-body${indentClass}" style="text-align: ${textAlign};">${message.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
                <div class="ao3-custom-confirm-footer">
                    <button class="ao3-custom-confirm-btn cancel">取消</button>
                    <button class="ao3-custom-confirm-btn confirm">确定</button>
                </div>
            `;

			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			const cleanup = () => {
				overlay.remove();
			};

			const confirmBtn = modal.querySelector('.confirm');
			const cancelBtn = modal.querySelector('.cancel');

			confirmBtn.addEventListener('click', () => {
				cleanup();
				resolve(true);
			});

			cancelBtn.addEventListener('click', () => {
				cleanup();
				reject(new Error('User cancelled.'));
			});

			overlay.addEventListener('click', (e) => {
				if (e.target === overlay) {
					cleanup();
					reject(new Error('User cancelled by clicking overlay.'));
				}
			});
		});
	}

	/**
	 * 创建并管理自定义翻译服务的 UI 和逻辑
	 */
	function createCustomServiceManager(panelElements, syncPanelStateCallback) {
		const { customServiceContainer, modelGroup, modelSelect, apiKeyGroup } = panelElements;
		let currentServiceId = null;
		let currentEditSection = 'name';
		let isPendingCreation = false;
		let pendingServiceData = {};
		const CUSTOM_URL_FIRST_SAVE_DONE = 'custom_url_first_save_done';

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
			synchronizeAllSettings(syncPanelStateCallback);
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
				Logger.info('网络', `成功为自定义服务 ${serviceName} 获取 ${modelIds.length} 个模型`);

				const actionSelect = customServiceContainer.querySelector('#custom-service-action-select');
				if (actionSelect) {
					actionSelect.value = 'models';
					actionSelect.dispatchEvent(new Event('change', { bubbles: true }));
				}

				if (syncPanelStateCallback) {
					syncPanelStateCallback();
				}

			} catch (error) {
				Logger.error('网络', `自动获取模型失败: ${error.message}`);
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
						const isFirstSaveEver = !GM_getValue(CUSTOM_URL_FIRST_SAVE_DONE, DEFAULT_CONFIG.GENERAL.custom_url_first_save_done);
						if (isFirstSaveEver) {
							GM_setValue(CUSTOM_URL_FIRST_SAVE_DONE, true);
							const confirmationMessage = `您正在添加一个自定义翻译服务接口地址。\n为了保护您的浏览器安全，油猴脚本要求您为这个新地址手动授权。\n您需要将刚才输入的接口地址域名添加到脚本的 “域名白名单” 中。这是一个首次设置时必须进行的一次性操作。\n点击 “确定” ，将跳转到一份图文版操作教程；点击 “取消” ，则不会进行跳转。\n此提示仅显示一次，是否跳转到教程页面？`;
							try {
								await showCustomConfirm(confirmationMessage, '安全授权', { useTextIndent: true });
								window.open('https://v-lipset.github.io/docs/guides/whitelist', '_blank');
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
					saveAndSyncCustomServiceField('models', normalizedModels);
					saveAndSyncCustomServiceField('modelsRaw', rawValue);
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

				if (syncPanelStateCallback) {
					syncPanelStateCallback();
				}
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
		if (document.getElementById('ai-service-overlay')) return;

		const overlay = document.createElement('div');
		overlay.id = 'ai-service-overlay';

		const modal = document.createElement('div');
		modal.id = 'ai-service-modal';

		const builtInServices = Object.keys(engineMenuConfig).filter(id =>
			id !== 'google_translate' && id !== 'bing_translator' && id !== 'add_new_custom'
		);
		const customServices = GM_getValue(CUSTOM_SERVICES_LIST_KEY, []);
		const allServices = [
			...builtInServices.map(id => ({ id, name: engineMenuConfig[id].displayName })),
			...customServices.map(s => ({ id: s.id, name: s.name }))
		];

		const profile = ProfileManager.getProfile(currentProfileId);
		const associatedServices = new Set(profile ? profile.services : []);

		let html = `
            <div class="ai-modal-header">
                <h3>翻译服务</h3>
                <div class="ai-select-all-btn">全选</div>
            </div>
            <div class="ai-modal-body">
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
            <div class="ai-modal-footer">
                <button class="ai-modal-btn cancel">取消</button>
                <button class="ai-modal-btn confirm">确认</button>
            </div>
        `;

		modal.innerHTML = html;
		overlay.appendChild(modal);
		document.body.appendChild(overlay);

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
						const currentId = refreshProfileSelect();
						aiProfileSelect.value = currentId;
					}
				});
				aiParamInputArea.appendChild(section);
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
				validation_thresholds: { type: 'text', label: '占位符校验阈值', hint: ' (Abs, Ratio, Base, Zero)'}
			};

			const config = paramConfig[paramType];
			if (!config) return;

			const section = document.createElement('div');
			section.className = 'settings-group static-label';
			const inputWrapper = document.createElement('div');
			inputWrapper.className = 'input-wrapper';

			const inputId = `ai-param-input-${paramType}`;

			const inputElement = document.createElement(config.type === 'textarea' ? 'textarea' : 'input');
			inputElement.className = 'settings-control settings-input';
			inputElement.id = inputId;
			inputElement.name = paramType;

			inputElement.setAttribute('spellcheck', 'false');
			if (config.type !== 'textarea') inputElement.type = config.type;
			if (config.attrs) Object.entries(config.attrs).forEach(([k, v]) => inputElement.setAttribute(k, v));

			inputElement.value = profile.params[paramType];

			const label = document.createElement('label');
			label.className = 'settings-label';
			label.htmlFor = inputId;
			label.textContent = config.label + (config.hint || '');

			inputWrapper.appendChild(inputElement);
			inputWrapper.appendChild(label);

			const saveValue = () => {
				let val = inputElement.value;
				const validationResult = validateAiParam(val, config);

				if (!validationResult.valid) {
					const defaultValue = BASE_AI_PARAMS[config.defaultKey];
					GM_notification({
						title: '参数设置错误',
						text: `${validationResult.message}\n已自动重置为默认值：${defaultValue}。`
					});
					val = defaultValue;
					inputElement.value = val;
					profile.params[paramType] = val;
				} else {
					val = validationResult.value;
					profile.params[paramType] = val;
				}

				ProfileManager.saveProfile(profile);

				if (inputElement.classList) {
					if (inputElement.value) inputElement.classList.add('has-value');
					else inputElement.classList.remove('has-value');
				}
			};

			if (!config.autoSave) {
				const saveBtn = document.createElement('button');
				saveBtn.className = 'settings-action-button-inline';
				saveBtn.textContent = '保存';
				saveBtn.addEventListener('click', saveValue);
				inputWrapper.appendChild(saveBtn);
			} else {
				inputElement.addEventListener('blur', saveValue);
			}

			section.appendChild(inputWrapper);
			aiParamInputArea.appendChild(section);
			if (inputElement.value) inputElement.classList.add('has-value');
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
			glossaryManageSelect, glossaryManageDetailsContainer, glossaryManageInfo, glossaryManageDeleteBtn,
			postReplaceSection, postReplaceSelect, postReplaceEditModeSelect,
			postReplaceContainerName, postReplaceContainerSettings,
			postReplaceNameInput, postReplaceSaveNameBtn,
			postReplaceInput, postReplaceSaveBtn,
			dataSyncActionsContainer, importDataBtn, exportDataBtn,
			debugActionsContainer, toggleDebugBtn, exportLogBtn,
			blockerSection, blockerDimensionSelect, blockerSubDimensionSelect, blockerInputArea, blockerActionsContainer, toggleBlockerBtn, toggleReasonsBtn,
			formattingSection, fmtProfileSelect, fmtPropertySelect, fmtValueContainer
		} = panelElements;

		const PANEL_POSITION_KEY = 'ao3_panel_position';
		const GLOSSARY_ACTION_KEY = 'ao3_glossary_last_action';
		const LOCAL_GLOSSARY_SELECTED_ID_KEY = 'ao3_local_glossary_selected_id';
		const LOCAL_GLOSSARY_EDIT_MODE_KEY = 'ao3_local_glossary_edit_mode';
		const BLOCKER_VIEW_KEY = 'ao3_blocker_current_view';
		const BLOCKER_SUB_VIEW_KEY = 'ao3_blocker_current_sub_view';

		let isDragging = false;
		let origin = { x: 0, y: 0 }, startPosition = { x: 0, y: 0 };
		let activeDropdown = null;
		let isEditingBuiltInModel = false;

		const customServiceManager = createCustomServiceManager(panelElements, syncPanelState);
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
					label: '调整检索范围',
					isDual: true,
					keys: ['ao3_blocker_adv_scope_rel', 'ao3_blocker_adv_scope_char'],
					labels: ['主要关系检索范围', '主要角色检索范围'],
					phs: ['1', '5']
				}
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
					if (select.value === 'EDIT_MODELS_INLINE') {
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
			const isEnabled = GM_getValue('enable_transDesc', DEFAULT_CONFIG.GENERAL.enable_transDesc);
			masterSwitch.checked = isEnabled;
			populateEngineSelect();
			const currentEngine = getValidEngineName();
			engineSelect.value = currentEngine;
			updateUiForEngine(currentEngine);
			fromLangSelect.value = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			toLangSelect.value = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
			updateSwapButtonState();
			displayModeSelect.value = GM_getValue('translation_display_mode', DEFAULT_CONFIG.GENERAL.translation_display_mode);

			masterSwitch.disabled = false;
			glossaryActionsSelect.disabled = false;

			const translationControls = [
				fromLangSelect, toLangSelect, swapLangBtn,
				displayModeSelect, engineSelect, modelSelect,
				apiKeyInput, apiKeySaveBtn
			];

			const currentAction = glossaryActionsSelect.value;
			const independentActions = ['formatting', 'blocker_manage', 'debug_mode', 'data_sync'];
			const isIndependent = independentActions.includes(currentAction);

			panel.querySelectorAll('.settings-control, .settings-input, .settings-action-button-inline, .online-glossary-delete-btn, .data-sync-action-btn').forEach(el => {
				if (el === masterSwitch || el === glossaryActionsSelect) {
					el.disabled = false;
					return;
				}

				if (translationControls.includes(el)) {
					el.disabled = !isEnabled;
					return;
				}

				if (isIndependent) {
					el.disabled = false;
				} else {
					el.disabled = !isEnabled;
				}
			});

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
				panel.style.visibility = 'hidden';
				const panelRect = panel.getBoundingClientRect();
				panel.style.visibility = 'visible';
				let savedPos = GM_getValue(PANEL_POSITION_KEY);
				const hasBeenOpened = GM_getValue('panel_has_been_opened_once', false);
				if (!hasBeenOpened) {
					const winW = document.documentElement.clientWidth;
					const winH = window.innerHeight;
					savedPos = {
						x: (winW - panelRect.width) / 2,
						y: (winH - panelRect.height) / 2
					};
					GM_setValue(PANEL_POSITION_KEY, savedPos);
					GM_setValue('panel_has_been_opened_once', true);
				} else if (!savedPos || isDragging) {
					savedPos = { x: panel.offsetLeft, y: panel.offsetTop };
				}
				const correctedPos = ensureOnScreen(savedPos, { width: panelRect.width, height: panelRect.height });
				panel.style.left = `${correctedPos.x}px`;
				panel.style.top = `${correctedPos.y}px`;
			}
			repositionActiveDropdown();
		};
		const updateInputLabel = (input) => {
			if (!input) return;
			if (input.value && (input.tagName !== 'SELECT' || input.options[input.selectedIndex]?.disabled !== true)) {
				input.classList.add('has-value');
			} else {
				input.classList.remove('has-value');
			}
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

			synchronizeAllSettings();
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

			synchronizeAllSettings();
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
			debugActionsContainer.style.display = 'none';
			blockerActionsContainer.style.display = 'none';
			if (sectionToShow) {
				sectionToShow.style.display = 'flex';
				if (sectionToShow.id === 'editable-section-blocker') {
					blockerActionsContainer.style.display = 'flex';
				}
				const input = sectionToShow.querySelector('.settings-control');
				if (input) updateInputLabel(input);
			}
		};

		const updateDebugButtonText = () => {
			toggleDebugBtn.textContent = Logger.config.enabled ? '禁用调试模式' : '启用调试模式';
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
						refreshBlocker('full'); 
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
					refreshBlocker();
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

						const hasData = (catId, data) => {
							if (!data) return false;
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
									return Object.keys(data).length > 0;
								case 'uiState':
									return !!(data.fabPosition || data.panelPosition);
								case 'customServices':
									return Array.isArray(data) && data.length > 0;
								case 'glossaries':
									return hasContent(data.customGlossaries) ||
										hasContent(data.importedGlossaries) ||
										hasContent(data.postReplaceString) ||
										hasContent(data.postReplace) ||
										hasContent(data.local) ||
										hasContent(data.forbidden) ||
										hasContent(data.onlineMetadata);
								case 'formatting':
									return Object.keys(data).length > 0;
								default:
									return false;
							}
						};

						const availableItems = DATA_CATEGORIES.map(cat => {
							const dataExists = hasData(cat.id, jsonData.data[cat.id]);
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
							const result = await importAllData(jsonData, selectionResult.ids, selectionResult.mode, syncPanelState);
							Logger.info('数据', result.message);
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
				debugActionsContainer.style.display = 'none';
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
				return;
			}

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
				applyFormatting(currentProfile);
			});

			const label = document.createElement('label');
			label.htmlFor = 'fmt-value-select';
			label.className = 'settings-label';
			label.textContent = labelText;

			wrapper.appendChild(select);
			wrapper.appendChild(label);
			fmtValueContainer.appendChild(wrapper);
			updateInputLabel(select);
		};

        fmtProfileSelect.addEventListener('change', (e) => {
			if (e.target.value === 'create_new') {
				const newId = FormattingManager.createProfile();
				FormattingManager.setCurrentId(newId);
				applyFormatting();
				fmtPropertySelect.value = 'profileName';
				GM_setValue('formatting_last_prop', 'profileName');
				renderFormattingEditor();
			} else {
				FormattingManager.setCurrentId(e.target.value);
				applyFormatting();
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
						applyFormatting();
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
			saveSetting('enable_transDesc', isEnabled, DEFAULT_CONFIG.GENERAL.enable_transDesc);
			FeatureSet.enable_transDesc = isEnabled;
			syncPanelState();
			if (typeof fabLogic !== 'undefined' && fabLogic.toggleFabVisibility) {
				fabLogic.toggleFabVisibility();
			}
			if (isEnabled) transDesc();
			else {
				document.querySelectorAll('.translate-me-ao3-wrapper, .translated-by-ao3-translator, .translated-by-ao3-translator-error, .translated-tags-container').forEach(el => el.remove());
				document.querySelectorAll('[data-translation-handled="true"], [data-state="translated"]').forEach(el => {
					delete el.dataset.translationHandled;
					delete el.dataset.state;
					el.style.display = '';
				});
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
				if (modelSelect.value === 'EDIT_MODELS_INLINE') {
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
			if (!masterSwitch.checked) return;
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
					updateDebugButtonText();
					debugActionsContainer.style.display = 'flex';
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
				synchronizeAllSettings();
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
				synchronizeAllSettings();
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
			} else {
				glossaryManageDetailsContainer.style.display = 'none';
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
				synchronizeAllSettings();
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
				synchronizeAllSettings();
			}
		});

		toggleDebugBtn.addEventListener('click', () => {
			Logger.toggle();
			updateDebugButtonText();
		});

		exportLogBtn.addEventListener('click', () => {
			Logger.export();
		});

		importDataBtn.addEventListener('click', () => handleImport());
		exportDataBtn.addEventListener('click', handleExport);

		closeBtn.addEventListener('click', togglePanel);

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
			if (panel.style.display !== 'flex') {
				return;
			}
			if (document.getElementById('ao3-custom-confirm-overlay')) {
				return;
			}
			if (document.getElementById('ao3-data-selection-overlay')) {
				return;
			}
			if (document.getElementById('ai-service-overlay')) {
				return;
			}
			if (document.querySelector('.custom-dropdown-backdrop')) {
				return;
			}
			const fabContainer = document.getElementById('ao3-trans-fab-container');
			if (!panel.contains(event.target) && !(fabContainer && fabContainer.contains(event.target))) {
				togglePanel();
			}
		};

		document.addEventListener('mousedown', handleClickOutside, true);

		const populateLangSelects = () => {
			const fromOptions = [
				{ value: 'auto', text: '自主判断' },
				{ value: 'script_auto', text: '自动检测' },
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
			menu.style.width = `${rect.width}px`;
			menu.style.top = `${rect.bottom + 4}px`;
			menu.style.left = `${rect.left}px`;
			const menuRect = menu.getBoundingClientRect();
			if (menuRect.right > window.innerWidth - 10) {
				menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
			}
			if (menuRect.bottom > window.innerHeight - 10) {
				menu.style.top = `${rect.top - menuRect.height - 4}px`;
				menu.style.transformOrigin = 'bottom center';
			} else {
				menu.style.transformOrigin = 'top center';
			}
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

			const startDrag = (li, clientY) => {
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
			if (document.querySelector('.custom-dropdown-backdrop')) {
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
			document.body.appendChild(backdrop);
			const menu = document.createElement('div');
			menu.className = 'custom-dropdown-menu';
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
					toggleBtn.textContent = isEnabled ? '禁用' : '启用';
					toggleBtn.dataset.url = option.value;
					actionsDiv.appendChild(toggleBtn);
				}
				if (option.dataset.isCustom === 'true') {
					const deleteBtn = document.createElement('button');
					deleteBtn.className = 'item-action-btn delete';
					deleteBtn.textContent = '删除';
					deleteBtn.dataset.value = option.value;
					actionsDiv.appendChild(deleteBtn);
				} else if (option.dataset.isLocalGlossary === 'true') {
					const toggleBtn = document.createElement('button');
					toggleBtn.className = 'item-action-btn toggle-local';
					const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
					const glossary = glossaries.find(g => g.id === option.value);
					const isEnabled = glossary ? (glossary.enabled !== false) : true;
					toggleBtn.textContent = isEnabled ? '禁用' : '启用';
					toggleBtn.dataset.value = option.value;
					actionsDiv.appendChild(toggleBtn);
				} else if (option.dataset.isPostReplaceRule === 'true') {
					const toggleBtn = document.createElement('button');
					toggleBtn.className = 'item-action-btn toggle-post-replace';
					const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
					const rule = rules.find(r => r.id === option.value);
					const isEnabled = rule ? (rule.enabled !== false) : true;
					toggleBtn.textContent = isEnabled ? '禁用' : '启用';
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

			document.body.appendChild(menu);

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
						synchronizeAllSettings();
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
					synchronizeAllSettings();
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
						synchronizeAllSettings();
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
				const target = e.target;
				e.stopPropagation();
				if (target.classList.contains('toggle-glossary')) {
					const url = target.dataset.url;
					const currentMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
					if (currentMetadata[url]) {
						const currentState = currentMetadata[url].enabled !== false;
						currentMetadata[url].enabled = !currentState;
						GM_setValue(GLOSSARY_METADATA_KEY, currentMetadata);
						invalidateGlossaryCache();
						target.textContent = !currentState ? '禁用' : '启用';
					}
				} else if (target.classList.contains('toggle-local')) {
					const id = target.dataset.value;
					const glossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, []);
					const index = glossaries.findIndex(g => g.id === id);
					if (index !== -1) {
						const currentState = glossaries[index].enabled !== false;
						glossaries[index].enabled = !currentState;
						GM_setValue(CUSTOM_GLOSSARIES_KEY, glossaries);
						synchronizeAllSettings();
						target.textContent = !currentState ? '禁用' : '启用';
					}
				} else if (target.classList.contains('toggle-post-replace')) {
					const id = target.dataset.value;
					const rules = GM_getValue(POST_REPLACE_RULES_KEY, []);
					const index = rules.findIndex(r => r.id === id);
					if (index !== -1) {
						const currentState = rules[index].enabled !== false;
						rules[index].enabled = !currentState;
						GM_setValue(POST_REPLACE_RULES_KEY, rules);
						synchronizeAllSettings();
						target.textContent = !currentState ? '禁用' : '启用';
					}
				} else if (target.classList.contains('delete')) {
					if (target.dataset.confirming) {
						const value = target.dataset.value;
						if (triggerElement.id === 'setting-trans-engine') {
							if (typeof customServiceManager !== 'undefined') {
								customServiceManager.deleteService(value);
							}
						}
						closeMenu();
					} else {
						list.querySelectorAll('.delete[data-confirming]').forEach(btn => {
							btn.textContent = '删除';
							delete btn.dataset.confirming;
						});
						target.textContent = '确认删除';
						target.dataset.confirming = 'true';
					}
				} else {
					const li = target.closest('li');
					if (li && typeof li.dataset.value !== 'undefined') {
						triggerElement.value = li.dataset.value;
						triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
						closeMenu();
					}
				}
			});
			backdrop.addEventListener('mousedown', closeMenu);
		}

		panel.addEventListener('mousedown', (e) => {
			const select = e.target.closest('.settings-select.custom-styled-select');
			if (select) {
				e.preventDefault();
				createCustomDropdown(select);
			}
		});

		customServiceContainer.addEventListener('mousedown', (e) => {
			const select = e.target.closest('.settings-select.custom-styled-select');
			if (select) {
				e.preventDefault();
				createCustomDropdown(select);
			}
		});

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
			refreshBlocker('full');
		});

		toggleReasonsBtn.addEventListener('click', () => {
			const newState = !GM_getValue('ao3_blocker_show_reasons', DEFAULT_CONFIG.BLOCKER.show_reasons);
			saveSetting('ao3_blocker_show_reasons', newState, DEFAULT_CONFIG.BLOCKER.show_reasons);
			updateBlockerButtonText();
			refreshBlocker('full');
		});

		return { togglePanel, panel };
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
		if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
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
		let quoteChar = "";
		let lastOp = null; 

		for (let i = 0; i < str.length; i++) {
			let char = str[i];

			if (char === '\\' && i + 1 < str.length) {
				const nextChar = str[i + 1];
				const escapedTargets = ['"', "'", '\\', ...separators];
				
				if (escapedTargets.includes(nextChar)) {
					current += nextChar;
					i++;
					continue;
				}
			}

			if ((char === '"' || char === "'")) {
				if (!inQuote) {
					inQuote = true;
					quoteChar = char;
				} else if (char === quoteChar) {
					inQuote = false;
				}
				current += char;
			}
			else if (separators.includes(char) && !inQuote) {
				if (current.trim() || lastOp !== null) {
					tokens.push({ value: current.trim(), op: lastOp });
				}
				lastOp = char;
				current = "";
			}
			else {
				current += char;
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
		const titleLink = blurb.querySelector('.header .heading a:first-child');
		const authors = Array.from(blurb.querySelectorAll('a[rel="author"]')).map(a => a.textContent.trim());
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

		const hitAuthor = workData.authors.find(a => rules.content.author.has(getNormalizedText(a)));
		if (hitAuthor) reasons.push(`作者 '${hitAuthor}'`);

		if (rules.content.id.has(workData.workId)) reasons.push(`作品 ID '${workData.workId}'`);

		const normalizedTitle = getNormalizedText(workData.title);
		const hitTitle = rules.content.title.find(p => normalizedTitle.includes(p));
		if (hitTitle) reasons.push(`标题关键词 '${hitTitle}'`);

		const normalizedSummary = getNormalizedText(workData.summary);
		const hitSummary = rules.content.summary.find(p => normalizedSummary.includes(p));
		if (hitSummary) reasons.push(`简介关键词 '${hitSummary}'`);

		if (!isNaN(rules.stats.minWords) && workData.wordCount < rules.stats.minWords) reasons.push(`字数少于 ${rules.stats.minWords}`);
		if (!isNaN(rules.stats.maxWords) && workData.wordCount > rules.stats.maxWords) reasons.push(`字数多于 ${rules.stats.maxWords}`);
		if (!isNaN(rules.stats.minChapters) && workData.chapterInfo.current < rules.stats.minChapters) reasons.push(`章节少于 ${rules.stats.minChapters}`);
		if (!isNaN(rules.stats.maxChapters) && workData.chapterInfo.current > rules.stats.maxChapters) reasons.push(`章节多于 ${rules.stats.maxChapters}`);

		const isOngoing = workData.chapterInfo.total === null || workData.chapterInfo.current !== workData.chapterInfo.total;
		if (!isNaN(rules.stats.update) && isOngoing && workData.monthsSinceUpdate > rules.stats.update) {
			reasons.push(`未更新超过 ${rules.stats.update} 个月`);
		}

		if (!isNaN(rules.stats.crossover) && workData.fandomCount > rules.stats.crossover) reasons.push(`同人圈超过 ${rules.stats.crossover} 个`);

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

		const ICON_VISIBILITY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';

		const ICON_VISIBILITY_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';

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
	 * 扫描并屏蔽单个作品卡片
	 */
	function processSingleBlurb(blurb) {
		if (blurb.classList.contains('ao3-blocker-processed') || blurb.classList.contains('muted')) return;

		const data = extractWorkData(blurb);
		const reason = getBlockReason(data);
		if (reason) {
			executeBlocking(blurb, reason);
		}
		blurb.classList.add('ao3-blocker-processed');
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
				"claude-sonnet-4-5-20250929": "Claude 4.5 Sonnet-2025-09-29",
				"claude-sonnet-4-5": "Claude 4.5 Sonnet-Latest",
				"claude-opus-4-5-20251101": "Claude 4.5 Opus-2025-11-01",
				"claude-opus-4-5": "Claude 4.5 Opus-Latest",
				"claude-haiku-4-5-20251001": "Claude 4.5 Haiku-2025-10-01",
				"claude-haiku-4-5": "Claude 4.5 Haiku-Latest",
				"claude-opus-4-1-20250805": "Claude 4.1 Opus-2025-08-05",
				"claude-opus-4-1": "Claude 4.1 Opus-Latest",
				"claude-sonnet-4-20250514": "Claude 4 Sonnet-2025-05-14",
				"claude-sonnet-4-0": "Claude 4 Sonnet-Latest",
				"claude-opus-4-20250514": "Claude 4 Opus-2025-05-14",
				"claude-opus-4-0": "Claude 4 Opus-Latest",
				"claude-3-7-sonnet-20250219": "Claude 3.7 Sonnet-2025-02-19",
				"claude-3-7-sonnet-latest": "Claude 3.7 Sonnet-Latest",
				"claude-3-5-haiku-20241022": "Claude 3.5 Haiku-2024-10-22",
				"claude-3-5-haiku-latest": "Claude 3.5 Haiku-Latest",
				"claude-3-opus-20240229": "Claude 3 Opus-2024-02-29",
				"claude-3-haiku-20240307": "Claude 3 Haiku"
			},
			requiresApiKey: true
		},
		'cerebras_ai': {
			displayName: 'Cerebras',
			modelGmKey: 'cerebras_model',
			modelMapping: {
				'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B',
				'gpt-oss-120b': 'GPT-OSS 120B',
				'zai-glm-4.7': 'GLM 4.7'
			},
			requiresApiKey: true
		},
		'deepseek_ai': {
			displayName: 'DeepSeek',
			modelGmKey: 'deepseek_model',
			modelMapping: {
				'deepseek-reasoner': 'DeepSeek V3.2 Think',
				'deepseek-chat': 'DeepSeek V3.2 Non-Think'
			},
			requiresApiKey: true
		},
		'google_ai': {
			displayName: 'Google AI',
			modelGmKey: 'google_ai_model',
			modelMapping: {
				'gemini-2.5-pro': 'Gemini 2.5 Pro',
				'gemini-flash-latest': 'Gemini 2.5 Flash',
				'gemini-flash-lite-latest': 'Gemini 2.5 Flash-Lite'
			},
			requiresApiKey: true
		},
		'groq_ai': {
			displayName: 'Groq AI',
			modelGmKey: 'groq_model',
			modelMapping: {
                'moonshotai/kimi-k2-instruct-0905': 'Kimi K2',
				'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4 Maverick',
				'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout',
				'openai/gpt-oss-120b': 'GPT-OSS 120B'
			},
			requiresApiKey: true
		},
		'modelscope_ai': {
			displayName: 'ModelScope',
			modelGmKey: 'modelscope_model',
			modelMapping: {
				'deepseek-ai/DeepSeek-V3.2': 'DeepSeek V3.2',
				'ZhipuAI/GLM-4.7': 'GLM 4.7',
				'Qwen/Qwen3-235B-A22B-Instruct-2507': 'Qwen3 235B',
				'MiniMax/MiniMax-M1-80k': 'MiniMax M1-80k'
			},
			requiresApiKey: true
		},
		'openai': {
			displayName: 'OpenAI',
			modelGmKey: 'openai_model',
			modelMapping: {
				"gpt-5.2": "GPT-5.2",
				"gpt-5.1": "GPT-5.1",
				"gpt-5": "GPT-5",
				"gpt-5-mini": "GPT-5 Mini",
				"gpt-5-nano": "GPT-5 Nano",
				"gpt-5.2-chat-latest": "GPT-5.2 Chat Latest",
				"gpt-5.1-chat-latest": "GPT-5.1 Chat Latest",
				"gpt-5-chat-latest": "GPT-5 Chat Latest",
				"gpt-5.1-codex-max": "GPT-5.1 Codex Max",
				"gpt-5.1-codex": "GPT-5.1 Codex",
				"gpt-5-codex": "GPT-5 Codex",
				"gpt-5.2-pro": "GPT-5.2 Pro",
				"gpt-5-pro": "GPT-5 Pro",
				"gpt-4.1": "GPT-4.1",
				"gpt-4.1-mini": "GPT-4.1 Mini",
				"gpt-4.1-nano": "GPT-4.1 Nano",
				"gpt-4o": "GPT-4o",
				"gpt-4o-2024-05-13": "GPT-4o-2024-05-13",
				"gpt-4o-mini": "GPT-4o Mini",
				"o1": "o1",
				"o1-pro": "o1 Pro",
				"o3-pro": "o3 Pro",
				"o3": "o3",
				"o3-deep-research": "o3 Deep Research",
				"o4-mini": "o4 Mini",
				"o4-mini-deep-research": "o4 Mini Deep Research",
				"o3-mini": "o3 Mini",
				"o1-mini": "o1 Mini",
				"gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
				"codex-mini-latest": "Codex Mini Latest",
				"gpt-5-search-api": "GPT-5 Search API",
				"gpt-4o-mini-search-preview": "GPT-4o Mini Search Preview",
				"gpt-4o-search-preview": "GPT-4o Search Preview",
				"chatgpt-4o-latest": "ChatGPT-4o Latest",
				"gpt-4-turbo": "GPT-4 Turbo",
				"gpt-4": "GPT-4",
				"gpt-3.5-turbo": "GPT-3.5 Turbo",
				"gpt-oss-120b": "GPT-OSS 120B",
				"gpt-oss-20b": "GPT-OSS 20B"
			},
			requiresApiKey: true
		},
		'siliconflow': {
			displayName: 'SiliconFlow',
			modelGmKey: 'siliconflow_model',
			modelMapping: {
				'ascend-tribe/pangu-pro-moe': 'Pangu Pro MoE',
				'baidu/ERNIE-4.5-300B-A47B': 'ERNIE 4.5 300B',
				'ByteDance-Seed/Seed-OSS-36B-Instruct': 'Seed OSS 36B',
				'deepseek-ai/DeepSeek-V3.2': 'DeepSeek V3.2',
				'Pro/deepseek-ai/DeepSeek-V3.2': 'DeepSeek V3.2 (Pro)',
				'deepseek-ai/DeepSeek-V3.1-Terminus': 'DeepSeek V3.1 Terminus',
				'Pro/deepseek-ai/DeepSeek-V3.1-Terminus': 'DeepSeek V3.1 Terminus (Pro)',
				'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
				'Pro/deepseek-ai/DeepSeek-V3': 'DeepSeek V3 (Pro)',
				'deepseek-ai/DeepSeek-R1': 'DeepSeek R1',
				'Pro/deepseek-ai/DeepSeek-R1': 'DeepSeek R1 (Pro)',
				'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B': 'DeepSeek R1 Distill (Qwen 32B)',
				'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B': 'DeepSeek R1 Distill (Qwen 14B)',
				'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B': 'DeepSeek R1 Distill (Qwen 7B)',
				'Pro/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B': 'DeepSeek R1 Distill (Qwen 7B) (Pro)',
				'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B': 'DeepSeek R1 (Qwen3 8B)',
				'deepseek-ai/DeepSeek-V2.5': 'DeepSeek V2.5',
				'inclusionAI/Ring-flash-2.0': 'Ring Flash 2.0',
				'inclusionAI/Ling-flash-2.0': 'Ling Flash 2.0',
				'inclusionAI/Ling-mini-2.0': 'Ling Mini 2.0',
				'internlm/internlm2_5-7b-chat': 'InternLM 2.5 7B',
				'Kwaipilot/KAT-Dev': 'KAT Dev',
				'MiniMaxAI/MiniMax-M2': 'MiniMax M2',
				'MiniMaxAI/MiniMax-M1-80k': 'MiniMax M1 80k',
				'moonshotai/Kimi-K2-Thinking': 'Kimi K2 Thinking',
				'Pro/moonshotai/Kimi-K2-Thinking': 'Kimi K2 Thinking (Pro)',
				'moonshotai/Kimi-K2-Instruct-0905': 'Kimi K2 Instruct',
				'Pro/moonshotai/Kimi-K2-Instruct-0905': 'Kimi K2 Instruct (Pro)',
				'moonshotai/Kimi-Dev-72B': 'Kimi Dev 72B',
				'Qwen/Qwen3-Next-80B-A3B-Thinking': 'Qwen3 Next 80B Thinking',
				'Qwen/Qwen3-Next-80B-A3B-Instruct': 'Qwen3 Next 80B Instruct',
				'Qwen/Qwen3-30B-A3B-Thinking-2507': 'Qwen3 30B Thinking',
				'Qwen/Qwen3-30B-A3B-Instruct-2507': 'Qwen3 30B Instruct',
				'Qwen/Qwen3-235B-A22B-Thinking-2507': 'Qwen3 235B Thinking',
				'Qwen/Qwen3-235B-A22B-Instruct-2507': 'Qwen3 235B Instruct',
				'Qwen/Qwen3-30B-A3B': 'Qwen3 30B',
				'Qwen/Qwen3-32B': 'Qwen3 32B',
				'Qwen/Qwen3-14B': 'Qwen3 14B',
				'Qwen/Qwen3-8B': 'Qwen3 8B',
				'Qwen/Qwen3-Coder-480B-A35B-Instruct': 'Qwen3 Coder 480B',
				'Qwen/Qwen3-Coder-30B-A3B-Instruct': 'Qwen3 Coder 30B',
				'Qwen/Qwen3-Omni-30B-A3B-Thinking': 'Qwen3 Omni 30B Thinking',
				'Qwen/Qwen3-Omni-30B-A3B-Instruct': 'Qwen3 Omni 30B Instruct',
				'Qwen/QwQ-32B': 'QwQ 32B',
				'Qwen/QVQ-72B-Preview': 'QVQ 72B Preview',
				'Qwen/Qwen2.5-72B-Instruct-128K': 'Qwen 2.5 72B (128K)',
				'Qwen/Qwen2.5-72B-Instruct': 'Qwen 2.5 72B',
				'LoRA/Qwen/Qwen2.5-72B-Instruct': 'Qwen 2.5 72B (LoRA)',
				'Qwen/Qwen2.5-32B-Instruct': 'Qwen 2.5 32B',
				'LoRA/Qwen/Qwen2.5-32B-Instruct': 'Qwen 2.5 32B (LoRA)',
				'Qwen/Qwen2.5-14B-Instruct': 'Qwen 2.5 14B',
				'LoRA/Qwen/Qwen2.5-14B-Instruct': 'Qwen 2.5 14B (LoRA)',
				'Qwen/Qwen2.5-7B-Instruct': 'Qwen 2.5 7B',
				'Pro/Qwen/Qwen2.5-7B-Instruct': 'Qwen 2.5 7B (Pro)',
				'LoRA/Qwen/Qwen2.5-7B-Instruct': 'Qwen 2.5 7B (LoRA)',
				'Qwen/Qwen2.5-Coder-32B-Instruct': 'Qwen 2.5 Coder 32B',
				'Qwen/Qwen2.5-Coder-7B-Instruct': 'Qwen 2.5 Coder 7B',
				'Pro/Qwen/Qwen2.5-Coder-7B-Instruct': 'Qwen 2.5 Coder 7B (Pro)',
				'Qwen/Qwen2-7B-Instruct': 'Qwen 2 7B',
				'Pro/Qwen/Qwen2-7B-Instruct': 'Qwen 2 7B (Pro)',
				'Tongyi-Zhiwen/QwenLong-L1-32B': 'QwenLong L1 32B',
				'stepfun-ai/step3': 'Step-3',
				'tencent/Hunyuan-A13B-Instruct': 'Hunyuan A13B',
				'tencent/Hunyuan-MT-7B': 'Hunyuan MT 7B',
				'Pro/zai-org/GLM-4.7': 'GLM 4.7 (Pro)',
				'zai-org/GLM-4.6': 'GLM 4.6',
				'zai-org/GLM-4.5': 'GLM 4.5',
				'zai-org/GLM-4.5-Air': 'GLM 4.5 Air',
				'THUDM/GLM-4-32B-0414': 'GLM-4 32B',
				'THUDM/GLM-4-9B-0414': 'GLM-4 9B',
				'THUDM/glm-4-9b-chat': 'GLM-4 9B Chat',
				'Pro/THUDM/glm-4-9b-chat': 'GLM-4 9B Chat (Pro)',
				'THUDM/GLM-Z1-32B-0414': 'GLM Z1 32B',
				'THUDM/GLM-Z1-Rumination-32B-0414': 'GLM Z1 Rumination 32B',
				'THUDM/GLM-Z1-9B-0414': 'GLM Z1 9B'
			},
			requiresApiKey: true
		},
		'together_ai': {
			displayName: 'Together AI',
			modelGmKey: 'together_model',
			modelMapping: {
				'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': 'Llama 4 Maverick',
				'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
				'moonshotai/Kimi-K2-Instruct': 'Kimi K2',
				'zai-org/GLM-4.6': 'GLM 4.6',
				'Qwen/Qwen3-235B-A22B-Instruct-2507-tput': 'Qwen3 235B',
				'openai/gpt-oss-120b': 'GPT-OSS 120B'
			},
			requiresApiKey: true
		},
		'zhipu_ai': {
			displayName: 'Zhipu AI',
			modelGmKey: 'zhipu_ai_model',
			modelMapping: {
				'glm-4-flash-250414': 'GLM 4-Flash',
				'glm-4.5-flash': 'GLM 4.5-Flash',
				'GLM-4.7-Flash': 'GLM 4.7-Flash',
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
		const originalUnits = document.querySelectorAll('[data-translation-state="translated"]');
		originalUnits.forEach(unit => {
			const nextSibling = unit.nextElementSibling;
			if (nextSibling && (nextSibling.classList.contains('translated-by-ao3-translator') || nextSibling.classList.contains('translated-by-ao3-translator-error'))) {
				unit.style.display = (mode === 'translation_only') ? 'none' : '';
			}
		});

		const translatedTagContainers = document.querySelectorAll('.translated-tags-container');
		translatedTagContainers.forEach(container => {
			let targetToHide;

			if (container.parentElement.classList.contains('translated-tags-wrapper')) {
				let wrapper = container.parentElement;
				let prev = wrapper.previousElementSibling;
				while (prev && prev.classList.contains('translate-me-ao3-wrapper')) {
					prev = prev.previousElementSibling;
				}
				targetToHide = prev;
			} else {
				let prev = container.previousElementSibling;
				while (prev && prev.classList.contains('translate-me-ao3-wrapper')) {
					prev = prev.previousElementSibling;
				}
				targetToHide = prev;
			}

			if (targetToHide) {
				if (mode === 'translation_only') {
					targetToHide.style.display = 'none';
				} else {
					targetToHide.style.display = '';
				}
			}
		});

		const translatedTitles = document.querySelectorAll('.translated-title-element');
		translatedTitles.forEach(title => {
			const originalTitle = title.previousElementSibling;
			if (originalTitle) {
				originalTitle.style.display = (mode === 'translation_only') ? 'none' : '';
			}
		});
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
		constructor() {
			this.storageKey = 'ao3_global_token_bucket';
			this.lockKey = 'ao3_rate_limit_lock';
			this.lockTimeout = 3000;
		}

		getConfig(engineName) {
			const isSpecial = ['google_translate', 'bing_translator'].includes(engineName);
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
					Logger.warn('网络', `触发全局熔断，暂停请求 ${Math.round(durationMs / 1000)} 秒`);
				}
			} finally {
				this.releaseLock(lockId);
			}
		}
	}

	/****************** API 客户端层 ******************/

	/**
	 * 所有 API 客户端的基类，定义了标准接口和通用翻译流程
	 */
	class BaseApiClient {
		constructor(provider) {
			this.provider = provider;
		}

		_buildHeaders() {
			throw new Error("'_buildHeaders' must be implemented by subclasses.");
		}

		_buildBody(_paragraphs, _fromLang) {
			throw new Error("'_buildBody' must be implemented by subclasses.");
		}

		_parseResponse(_response) {
			throw new Error("'_parseResponse' must be implemented by subclasses.");
		}

		_handleError(response, responseData, reqId) {
			const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || response.statusText || '未知错误';
			const error = new Error();
			let userFriendlyError;
			error.noRetry = false;

			Logger.error('网络', `[${reqId}] API 请求失败: ${this.provider.name}`, {
				status: response.status,
				statusText: response.statusText,
				apiError: apiErrorMessage
			});

			switch (response.status) {
				case 401:
					userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${this.provider.name} API Key。`;
					error.noRetry = true;
					break;
				case 403:
					userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源，或您所在的地区不受支持。`;
					error.noRetry = true;
					break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
					error.type = 'rate_limit';
					break;
				case 500:
				case 503:
					userFriendlyError = `服务器错误 (${response.status})：${this.provider.name} 的服务器暂时不可用，脚本将在稍后自动重试。`;
					error.type = 'server_overloaded';
					break;
				default:
					userFriendlyError = `发生未知 API 错误 (代码: ${response.status})。`;
					error.noRetry = true;
					break;
			}

			error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
			return error;
		}

		translate(paragraphs, fromLang = 'auto', toLang = 'zh-CN', reqId = 'Unknown') {
			return new Promise(async (resolve, reject) => {
				const startTime = Date.now();
				try {
					const headers = await this._buildHeaders();
					const body = this._buildBody(paragraphs, fromLang, toLang);
					const url = this.provider.apiHost;

					if (!url) {
						const error = new Error(`服务 "${this.provider.name}" 未配置接口地址 (API Host)。`);
						error.noRetry = true;
						return reject(error);
					}

					Logger.info('网络', `[${reqId}] 发起请求: ${this.provider.name}`, {
						model: this.provider.selectedModel,
						paragraphs: paragraphs.length,
						from: fromLang,
						to: toLang
					});

					GM_xmlhttpRequest({
						method: 'POST',
						url: url,
						headers: headers,
						data: body,
						responseType: 'text',
						timeout: 120000,
						onload: (res) => {
							const duration = Date.now() - startTime;
							let responseData;
							try {
								responseData = JSON.parse(res.responseText);
							} catch (e) {
								Logger.error('网络', `[${reqId}] JSON 解析失败`, { responseTextSnippet: res.responseText.substring(0, 200) });
								const error = new Error('API 响应不是有效的 JSON 格式。这可能由网络防火墙(WAF/CDN)拦截导致。');
								error.type = 'invalid_json';
								return reject(error);
							}

							if (res.status === 200) {
								try {
									const translatedText = this._parseResponse(responseData);
									if (typeof translatedText !== 'string' || !translatedText.trim()) {
										return reject(new Error('API 未返回有效文本。'));
									}
									Logger.info('网络', `[${reqId}] 请求成功`, { duration: `${duration}ms` });
									resolve(translatedText);
								} catch (e) {
									reject(new Error(`解析响应失败: ${e.message}`));
								}
							} else {
								reject(this._handleError(res, responseData, reqId));
							}
						},
						onerror: () => {
							Logger.error('网络', `[${reqId}] 网络请求发生底层错误`);
							reject({ type: 'network', message: '网络请求错误' });
						},
						ontimeout: () => {
							Logger.error('网络', `[${reqId}] 请求超时`);
							reject({ type: 'timeout', message: '请求超时' });
						}
					});
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
		constructor(provider) {
			super(provider);
		}

		async _buildHeaders() {
			const { key: apiKey } = await _getApiKeyForService(this.provider);
			return {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			};
		}

		_buildBody(paragraphs, fromLang, toLang) {
			const fromLangName = LANG_CODE_TO_NAME[fromLang] || fromLang;
			const toLangName = LANG_CODE_TO_NAME[toLang] || toLang;
			const exampleOutput = generatePromptExample(toLang);
			const numberedText = paragraphs
				.map((p, i) => `${i + 1}. ${p.innerHTML}`)
				.join('\n\n');

            const params = ProfileManager.getParamsByEngine(this.provider.id);
			const systemPromptTemplate = params.system_prompt;
			const userPromptTemplate = params.user_prompt;
            const temperature = params.temperature;

			const finalSystemPrompt = systemPromptTemplate
				.replace(/\{fromLangName\}/g, fromLangName)
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{exampleOutput\}/g, exampleOutput);

			const finalUserPrompt = userPromptTemplate
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{numberedText\}/g, numberedText);

			const requestData = {
				model: this.provider.selectedModel,
				messages: [
					{ "role": "system", "content": finalSystemPrompt },
					{ "role": "user", "content": finalUserPrompt }
				],
				stream: false,
				temperature: temperature,
			};
			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			return getNestedProperty(response, 'choices[0].message.content');
		}

		_handleError(response, responseData, reqId) {
			const handler = API_ERROR_HANDLERS[this.provider.id] || API_ERROR_HANDLERS['openai'] || super._handleError;
			return handler(response, this.provider.name, responseData, reqId);
		}

		translate(paragraphs, fromLang, toLang, reqId) {
			return super.translate(paragraphs, fromLang, toLang, reqId);
		}
	}

	/**
	 * API 客户端工厂
	 */
	const ApiClientFactory = {
		create: function (provider) {
			const clientType = provider.isCustom ? 'openai-compatible' : provider.id;

			switch (clientType) {
				case 'anthropic':
					return new AnthropicClient(provider);
				case 'google_ai':
					return new GoogleAIClient(provider);
				case 'openai':
				case 'siliconflow':
				case 'zhipu_ai':
				case 'deepseek_ai':
				case 'groq_ai':
				case 'together_ai':
				case 'cerebras_ai':
				case 'modelscope_ai':
				case 'openai-compatible':
					return new OpenAICompatibleClient(provider);
				default:
					Logger.warn('系统', `未找到服务类型 "${clientType}" 的特定客户端，回退到 OpenAI 兼容客户端`);
					return new OpenAICompatibleClient(provider);
			}
		}
	};

	/**
	 * Anthropic 客户端
	 */
	class AnthropicClient extends BaseApiClient {
		constructor(provider) {
			super(provider);
		}

		async _buildHeaders() {
			const { key: apiKey } = await _getApiKeyForService(this.provider);
			return {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			};
		}

		_buildBody(paragraphs, fromLang, toLang) {
			const fromLangName = LANG_CODE_TO_NAME[fromLang] || fromLang;
			const toLangName = LANG_CODE_TO_NAME[toLang] || toLang;
			const exampleOutput = generatePromptExample(toLang);
			const numberedText = paragraphs
				.map((p, i) => `${i + 1}. ${p.innerHTML}`)
				.join('\n\n');

            const params = ProfileManager.getParamsByEngine(this.provider.id);
			const systemPromptTemplate = params.system_prompt;
			const userPromptTemplate = params.user_prompt;
            const temperature = params.temperature;

			const finalSystemPrompt = systemPromptTemplate
				.replace(/\{fromLangName\}/g, fromLangName)
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{exampleOutput\}/g, exampleOutput);

			const finalUserPrompt = userPromptTemplate
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{numberedText\}/g, numberedText);

			const requestData = {
				model: this.provider.selectedModel,
				system: finalSystemPrompt,
				max_tokens: 4096,
				messages: [
					{
						"role": "user",
						"content": finalUserPrompt
					}
				],
				temperature: temperature,
			};
			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			return getNestedProperty(response, 'content[0].text');
		}
	}

	/**
	 * Gemini 客户端
	 */
	class GoogleAIClient extends BaseApiClient {
		constructor(provider) {
			super(provider);
		}

		_buildHeaders() {
			return {
				'Content-Type': 'application/json'
			};
		}

		_buildBody(paragraphs, fromLang, toLang) {
			const fromLangName = LANG_CODE_TO_NAME[fromLang] || fromLang;
			const toLangName = LANG_CODE_TO_NAME[toLang] || toLang;
			const exampleOutput = generatePromptExample(toLang);
			const numberedText = paragraphs
				.map((p, i) => `${i + 1}. ${p.innerHTML}`)
				.join('\n\n');

            const params = ProfileManager.getParamsByEngine(this.provider.id);
			const systemPromptTemplate = params.system_prompt;
			const userPromptTemplate = params.user_prompt;
            const temperature = params.temperature;

			const finalSystemPrompt = systemPromptTemplate
				.replace(/\{fromLangName\}/g, fromLangName)
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{exampleOutput\}/g, exampleOutput);

			const finalUserPrompt = userPromptTemplate
				.replace(/\{toLangName\}/g, toLangName)
				.replace(/\{numberedText\}/g, numberedText);

			const requestData = {
				systemInstruction: {
					role: "user",
					parts: [{ text: finalSystemPrompt }]
				},
				contents: [{
					role: "user",
					parts: [{ text: finalUserPrompt }]
				}],
				generationConfig: {
					temperature: temperature,
					candidateCount: 1,
				}
			};
			return JSON.stringify(requestData);
		}

		_parseResponse(response) {
			return getNestedProperty(response, 'candidates[0].content.parts[0].text');
		}

		translate(paragraphs, fromLang, toLang, reqId = 'Unknown') {
			return new Promise(async (resolve, reject) => {
				const startTime = Date.now();
				try {
					const { key: apiKey } = await _getApiKeyForService(this.provider);
					const modelId = this.provider.selectedModel;

					if (!modelId) {
						const error = new Error(`服务 "${this.provider.name}" 未选择任何模型。`);
						error.noRetry = true;
						return reject(error);
					}

					const finalUrl = this.provider.apiHost.replace('{model}', modelId) + `?key=${apiKey}`;
					const headers = this._buildHeaders();
					const body = this._buildBody(paragraphs, fromLang, toLang);

					Logger.info('网络', `[${reqId}] 发起请求: Google AI`, {
						model: modelId,
						paragraphs: paragraphs.length,
						from: fromLang,
						to: toLang
					});

					GM_xmlhttpRequest({
						method: 'POST',
						url: finalUrl,
						headers: headers,
						data: body,
						responseType: 'text',
						timeout: 120000,
						onload: (res) => {
							const duration = Date.now() - startTime;
							let responseData;
							try {
								responseData = JSON.parse(res.responseText);
							} catch (e) {
								Logger.error('网络', `[${reqId}] JSON 解析失败`, { responseTextSnippet: res.responseText.substring(0, 200) });
								const error = new Error('API 响应不是有效的 JSON 格式。这可能由网络防火墙(WAF/CDN)拦截导致。');
								error.type = 'invalid_json';
								return reject(error);
							}

							if (res.status === 200) {
								try {
									const translatedText = this._parseResponse(responseData);
									if (typeof translatedText !== 'string' || !translatedText.trim()) {
										return reject(new Error('API 未返回有效文本。'));
									}
									Logger.info('网络', `[${reqId}] 请求成功`, { duration: `${duration}ms` });
									resolve(translatedText);
								} catch (e) {
									reject(new Error(`解析响应失败: ${e.message}`));
								}
							} else {
								reject(this._handleError(res, responseData, reqId));
							}
						},
						onerror: () => {
							Logger.error('网络', `[${reqId}] 网络请求发生底层错误`);
							reject({ type: 'network', message: '网络请求错误' });
						},
						ontimeout: () => {
							Logger.error('网络', `[${reqId}] 请求超时`);
							reject({ type: 'timeout', message: '请求超时' });
						}
					});
				} catch (error) {
					reject(error);
				}
			});
		}
	}

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
	 * 通用批处理队列，用于合并高频请求
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
				this.queue.push({
					item,
					resolve,
					reject
				});
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
				currentBatch.forEach((task, index) => {
					task.resolve(results && results[index] ? results[index] : null);
				});
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
		Logger.info('网络', `语言检测 (Microsoft): 批量处理 ${texts.length} 段`);
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
							Logger.error('网络', '语言检测 (Microsoft) 解析失败', data);
							resolve(Array(texts.length).fill(null));
						}
					} catch (e) {
						Logger.error('网络', '语言检测 (Microsoft) JSON 错误', e);
						resolve(Array(texts.length).fill(null));
					}
				},
				onerror: (e) => {
					Logger.error('网络', '语言检测 (Microsoft) 网络错误', e);
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
			Logger.info('网络', `语言检测 (Google GTX)`);
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: (res) => {
					try {
						const data = JSON.parse(res.responseText);
						const detected = (Array.isArray(data) && data[2]) ? data[2] : "";
						resolve(detected);
					} catch (e) {
						Logger.error('网络', '语言检测 (Google GTX) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('网络', '语言检测 (Google GTX) 网络错误', e);
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
			Logger.info('网络', `语言检测 (Baidu)`);
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
						Logger.error('网络', '语言检测 (Baidu) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('网络', '语言检测 (Baidu) 网络错误', e);
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
			Logger.info('网络', `语言检测 (Tencent)`);
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
						Logger.error('网络', '语言检测 (Tencent) 解析失败', e);
						resolve("");
					}
				},
				onerror: (e) => {
					Logger.error('网络', '语言检测 (Tencent) 网络错误', e);
					resolve("");
				}
			});
		});
	}

	/**
	 * 核心语言检测服务，默认使用 Microsoft
	 */
	const LanguageDetectService = {
		async detect(text) {
			if (!text || !text.trim()) return "auto";
			const cached = LanguageDetectionCache.get(text);
			if (cached) return cached;
			const strategy = GM_getValue("lang_detector", DEFAULT_CONFIG.GENERAL.lang_detector);
			let detectedLang = "";
			if (strategy === "google") {
				detectedLang = await apiGoogleLangdetect(text);
			} else if (strategy === "baidu") {
				detectedLang = await apiBaiduLangdetect(text);
			} else if (strategy === "tencent") {
				detectedLang = await apiTencentLangdetect(text);
			} else {
				detectedLang = await apiMicrosoftLangdetect(text);
			}
			const finalLang = normalizeLanguageCode(detectedLang);
			if (finalLang) {
				LanguageDetectionCache.set(text, finalLang);
				return finalLang;
			}
			return "auto";
		}
	};

    /**
	 * 远程翻译请求函数
	 */
	async function requestRemoteTranslation(paragraphs, { isCancelled = () => false, knownFromLang = null, reqId = 'Unknown', skipRateLimit = false } = {}) {
		const createCancellationError = () => {
			const error = new Error('用户已取消翻译。');
			error.type = 'user_cancelled';
			error.noRetry = true;
			return error;
		};
		if (isCancelled()) throw createCancellationError();
		const engineName = getValidEngineName();
		if (!skipRateLimit) {
			const tokenBucket = new GlobalTokenBucket();
			while (true) {
				if (isCancelled()) throw createCancellationError();
				const result = await tokenBucket.consume(1, engineName);
				if (result.success) {
					break;
				} else {
					const waitTime = result.waitTime + (Math.random() * 50);
					Logger.info('网络', `[${reqId}] 流控等待: ${Math.round(waitTime)}ms`);
					await sleep(waitTime);
				}
			}
		}
		const toLang = GM_getValue('to_lang', DEFAULT_CONFIG.GENERAL.to_lang);
		let fromLang;
		if (knownFromLang) {
			fromLang = knownFromLang;
		} else {
			const userSelectedFromLang = GM_getValue('from_lang', DEFAULT_CONFIG.GENERAL.from_lang);
			if (userSelectedFromLang === 'script_auto') {
				const textToDetect = paragraphs.map(p => p.textContent).join(' ').substring(0, 200);
				fromLang = await LanguageDetectService.detect(textToDetect);
			} else {
				fromLang = userSelectedFromLang;
			}
		}
		if (isCancelled()) throw createCancellationError();
		if (engineName === 'bing_translator') {
			try {
				const translatedTexts = await _handleBingRequest(CONFIG.TRANS_ENGINES.bing_translator, paragraphs, fromLang, toLang);
				return translatedTexts.map((content, index) => `${index + 1}. ${content}`).join('\n\n');
			} catch (error) {
				Logger.error('网络', `[${reqId}] 微软翻译错误`, error);
				throw error;
			}
		}
		if (engineName === 'google_translate') {
			try {
				const translatedHtmlSnippets = await _handleGoogleRequest(CONFIG.TRANS_ENGINES.google_translate, paragraphs, fromLang, toLang);
				if (!Array.isArray(translatedHtmlSnippets)) {
					throw new Error('谷歌翻译接口未返回预期的数组格式');
				}
				const innerContents = translatedHtmlSnippets.map(html => {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = html;
					return tempDiv.firstElementChild ? tempDiv.firstElementChild.innerHTML : '';
				});
				return innerContents.map((content, index) => `${index + 1}. ${content}`).join('\n\n');
			} catch (error) {
				Logger.error('网络', `[${reqId}] 谷歌翻译错误`, error);
				throw error;
			}
		}
		try {
			const provider = getProviderById(engineName);
			if (!provider) {
				const error = new Error(`未能找到服务 "${engineName}" 的配置信息。`);
				error.noRetry = true;
				throw error;
			}
			const client = ApiClientFactory.create(provider);
			const translatedText = await client.translate(paragraphs, fromLang, toLang, reqId);
			if (typeof translatedText !== 'string' || !translatedText.trim()) {
				throw new Error('API 未返回有效文本。');
			}
			return translatedText;
		} catch (error) {
			throw error;
		}
	}

    /**
	 * 为指定服务获取下一个可用的 API Key
	 */
	async function _getApiKeyForService(provider) {
		const serviceId = provider.id;
		const arrayKey = `${serviceId}_keys_array`;
		const keys = GM_getValue(arrayKey, []);

		if (keys.length === 0) {
			const error = new Error(`请在设置面板中为 ${provider.name} 设置至少一个 API Key 。各项翻译服务的 API Key 获取地址：<a href="https://v-lipset.github.io/docs/support/service" target="_blank" style="word-break: break-all;">https://v-lipset.github.io/docs/support/service</a>`);
			error.noRetry = true;
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
					if (confirmedLock && confirmedLock.id === myLockId) {
						return true;
					}
				}
				await sleep(100 + Math.random() * 100);
			}
			return false;
		}

		function releaseLock() {
			const currentLock = GM_getValue(lockKey, null);
			if (currentLock && currentLock.id === myLockId) {
				GM_deleteValue(lockKey);
			}
		}

		if (!(await acquireLock())) {
			throw new Error(`获取 ${provider.name} API Key 的操作锁超时，请稍后重试。`);
		}

		try {
			const indexKey = `${serviceId}_key_index`;
			const startIndex = GM_getValue(indexKey, 0);
			const currentIndex = startIndex % keys.length;
			GM_setValue(indexKey, (startIndex + 1) % keys.length);

			const currentKey = keys[currentIndex];
			Logger.info('网络', `API Key 调度: ${provider.name}`, { keyIndex: currentIndex + 1, keyMasked: currentKey });
			return { key: currentKey, index: currentIndex };
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
	async function _handleGoogleRequest(engineConfig, paragraphs, fromLang, toLang) {
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
		Logger.info('网络', '发起请求: 谷歌翻译', {
			url: engineConfig.url_api,
			from: fromLang,
			to: toLang,
			paragraphs: paragraphs.length
		});
		const res = await new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: engineConfig.method,
				url: engineConfig.url_api,
				headers: headers,
				data: requestData,
				responseType: 'json',
				timeout: 45000,
				onload: resolve,
				onerror: () => reject(new Error('网络请求错误')),
				ontimeout: () => reject(new Error('请求超时'))
			});
		});
		if (res.status !== 200) {
			throw new Error(`谷歌翻译 API 错误 (代码: ${res.status}): ${res.statusText}`);
		}
		const translatedHtmlSnippets = getNestedProperty(res.response, '0');
		if (!translatedHtmlSnippets || !Array.isArray(translatedHtmlSnippets)) {
			throw new Error('从谷歌翻译接口返回的响应结构无效');
		}
		return translatedHtmlSnippets.map(html => unmaskProtectedTags(html));
	}

	/**
	 * 处理对微软翻译接口的特定请求流程
	 */
	async function _handleBingRequest(engineConfig, paragraphs, fromLang, toLang, isRetry = false) {
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

		if (!isRetry) {
			Logger.info('网络', '发起请求: 微软翻译', {
				url: url,
				from: bingFrom,
				to: bingTo,
				paragraphs: paragraphs.length
			});
		}

		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: "POST",
				url: url,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
				},
				data: requestBody,
				responseType: 'json',
				timeout: 45000,
				onload: async (res) => {
					if (res.status === 401 && !isRetry) {
						Logger.warn('网络', '微软翻译 Token 过期，正在重试');
						BingTranslateHelper.clearToken();
						try {
							const retryResult = await _handleBingRequest(engineConfig, paragraphs, fromLang, toLang, true);
							resolve(retryResult);
						} catch (retryError) {
							reject(retryError);
						}
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
					resolve(responseData.map(item => item.translations[0].text));
				},
				onerror: (err) => {
					const e = new Error('Network Error');
					e.type = 'network';
					reject(e);
				},
				ontimeout: () => {
					const e = new Error('Timeout');
					e.type = 'timeout';
					reject(e);
				}
			});
		});
	}

	/**
	 * OpenAI 的专属错误处理策略
	 */
	function _handleOpenaiError(res, name, responseData) {
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
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${name} API Key。`;
				error.noRetry = true;
				break;
			case 403:
				userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源，或您所在的地区不受支持。`;
				error.noRetry = true;
				break;
			case 404:
				userFriendlyError = `资源未找到 (404)：请求的 API 端点不存在。`;
				error.noRetry = true;
				break;
			case 429:
				if (apiErrorCode === 'insufficient_quota') {
					userFriendlyError = `账户余额不足 (429)：您的 ${name} 账户已用尽信用点数或达到支出上限。请前往服务官网检查您的账单详情。`;
					error.noRetry = true;
					error.type = 'billing_error';
				} else {
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit';
				}
				break;
			case 500:
				userFriendlyError = `服务器内部错误 (500)：${name} 的服务器遇到问题。`;
				error.type = 'server_overloaded';
				break;
			case 503:
				if (apiErrorMessage && apiErrorMessage.includes('Slow Down')) {
					userFriendlyError = `服务暂时过载 (503 - Slow Down)：由于您的请求速率突然增加，服务暂时受到影响。`;
				} else {
					userFriendlyError = `服务器当前过载 (503)：${name} 的服务器正经历高流量。`;
				}
				error.type = 'server_overloaded';
				break;
			default:
				userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
				error.noRetry = true;
				break;
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Anthropic 的专属错误处理策略
	 */
	function _handleAnthropicError(res, name, responseData) {
		const apiErrorType = getNestedProperty(responseData, 'error.type');
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
		let userFriendlyError;
		const error = new Error();
		error.noRetry = false;

		switch (apiErrorType) {
			case 'invalid_request_error':
				userFriendlyError = `无效请求 (${res.status})：请求的格式或参数有误。如果问题持续，可能是模型名称不受支持或已更新。`;
				error.noRetry = true;
				break;
			case 'authentication_error':
				userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${name} API Key。`;
				error.noRetry = true;
				break;
			case 'permission_error':
				userFriendlyError = `权限被拒绝 (403)：您的 API Key 无权访问所请求的资源。`;
				error.noRetry = true;
				break;
			case 'not_found_error':
				userFriendlyError = `资源未找到 (404)：请求的 API 端点或模型不存在。`;
				error.noRetry = true;
				break;
			case 'request_too_large':
				userFriendlyError = `请求内容过长 (413)：发送的文本量超过了 API 的单次请求上限。`;
				error.noRetry = true;
				break;
			case 'rate_limit_error':
				userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
				error.type = 'rate_limit';
				break;
			case 'api_error':
				userFriendlyError = `服务器内部错误 (500)：${name} 的服务器遇到问题。`;
				error.type = 'server_overloaded';
				break;
			case 'overloaded_error':
				userFriendlyError = `服务器过载 (529)：${name} 的服务器当前负载过高。`;
				error.type = 'server_overloaded';
				break;
			default:
				if (res.status === 413) {
					userFriendlyError = `请求内容过长 (413)：发送的文本量超过了 API 的单次请求上限。`;
				} else {
					userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
				}
				error.noRetry = true;
				break;
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Zhipu AI 的专属错误处理策略
	 */
	function _handleZhipuAiError(res, name, responseData) {
		const businessErrorCode = getNestedProperty(responseData, 'error.code');
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || res.statusText;
		let userFriendlyError;
		const error = new Error();

		if (businessErrorCode) {
			switch (businessErrorCode) {
				case '1001':
				case '1002':
				case '1003':
				case '1004':
					userFriendlyError = `API Key 无效或认证失败 (${businessErrorCode})：请在设置面板中检查您的 ${name} API Key 是否正确填写。`;
					error.noRetry = true;
					break;
				case '1112':
					userFriendlyError = `账户异常 (${businessErrorCode})：您的 ${name} 账户已被锁定，请联系平台客服。`;
					error.noRetry = true;
					break;
				case '1113':
					userFriendlyError = `账户余额不足 (${businessErrorCode})：您的 ${name} 账户已欠费，请前往 Zhipu AI 官网充值。`;
					error.noRetry = true;
					break;
				case '1301':
					userFriendlyError = `内容安全策略阻止 (${businessErrorCode})：因含有敏感内容，请求被 Zhipu AI 安全策略阻止。`;
					error.noRetry = true;
					error.type = 'content_error';
					break;
				case '1302':
				case '1303':
					error.message = `请求频率过高 (${businessErrorCode})：已超出 API 的速率限制。\n\n原始错误信息：\n${apiErrorMessage}`;
					error.type = 'rate_limit';
					return error;
				case '1304':
					userFriendlyError = `调用次数超限 (${businessErrorCode})：已达到当日调用次数限额，请联系 Zhipu AI 客服。`;
					error.noRetry = true;
					break;
				default:
					userFriendlyError = `发生未知的业务错误 (代码: ${businessErrorCode})。`;
					error.noRetry = true;
					break;
			}
		} else {
			return new BaseApiClient({ name })._handleError(res, responseData);
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * DeepSeek AI 的专属错误处理策略
	 */
	function _handleDeepseekAiError(res, name, responseData) {
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
		let userFriendlyError;
		const error = new Error();

		switch (res.status) {
			case 400:
			case 422:
				userFriendlyError = `请求格式或参数错误 (${res.status})：请检查脚本是否为最新版本。如果问题持续，可能是 API 服务端出现问题。`;
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${name} API Key 是否正确填写。`;
				error.noRetry = true;
				break;
			case 402:
				userFriendlyError = `账户余额不足 (402)：您的 ${name} 账户余额不足。请前往 DeepSeek 官网充值。`;
				error.noRetry = true;
				break;
			case 429:
				userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
				error.type = 'rate_limit';
				break;
			case 500:
				userFriendlyError = `服务器内部故障 (500)：${name} 的服务器遇到未知问题。`;
				error.type = 'server_overloaded';
				break;
			case 503:
				userFriendlyError = `服务器繁忙 (503)：${name} 的服务器当前负载过高。`;
				error.type = 'server_overloaded';
				break;
			default:
				return new BaseApiClient({ name })._handleError(res, responseData);
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Google AI 的专属错误处理策略
	 */
	function _handleGoogleAiError(errorData) {
		const { type, message, res, name } = errorData;
		const error = new Error();
		let userFriendlyError;

		if (type === 'content_error') {
			userFriendlyError = `内容安全策略阻止：${message}。请尝试修改原文内容。`;
			error.noRetry = true;
		} else if (type === 'key_invalid') {
			userFriendlyError = `API Key 无效或认证失败：${message}。请在设置面板中检查您的 API Key。`;
			error.noRetry = true;
		} else if (res) {
			switch (res.status) {
				case 400:
					userFriendlyError = `请求格式错误 (400)：您的国家/地区可能不支持 Gemini API 的免费套餐，请在 Google AI Studio 中启用结算。`;
					error.noRetry = true;
					break;
				case 429:
					userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
					error.type = 'rate_limit';
					break;
				default:
					return new BaseApiClient({ name })._handleError(res, res.response);
			}
		} else {
			userFriendlyError = `发生未知错误：${message}`;
			error.noRetry = (type !== 'network' && type !== 'timeout');
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${message}`;
		return error;
	}

	/**
	 * SiliconFlow 的专属错误处理策略
	 */
	function _handleSiliconFlowError(res, name, responseData) {
		const apiErrorMessage = getNestedProperty(responseData, 'message') || res.statusText;
		const apiErrorCode = getNestedProperty(responseData, 'code');
		let userFriendlyError;
		const error = new Error();

		switch (res.status) {
			case 400:
				if (apiErrorCode === 20012) {
					userFriendlyError = `模型不存在 (400)：您选择的模型名称无效或已下线。请在设置中更换模型。`;
				} else {
					userFriendlyError = `请求参数错误 (400)：请检查脚本版本或配置。`;
				}
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `API Key 无效 (401)：请在设置面板中检查您的 ${name} API Key。`;
				error.noRetry = true;
				break;
			case 403:
				userFriendlyError = `权限不足或余额不足 (403)：可能是账户余额不足，或该模型需要实名认证。请前往 SiliconFlow 官网检查账户状态。`;
				error.noRetry = true;
				break;
			case 429:
				userFriendlyError = `请求频率过高 (429)：触发了速率限制 (RPM/TPM)。`;
				error.type = 'rate_limit';
				break;
			case 503:
			case 504:
				userFriendlyError = `服务系统负载高 (${res.status})：SiliconFlow 服务器暂时繁忙。`;
				error.type = 'server_overloaded';
				break;
			case 500:
				userFriendlyError = `服务器内部错误 (500)：服务发生了未知错误。`;
				error.type = 'server_overloaded';
				break;
			default:
				userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
				error.noRetry = true;
				break;
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Groq AI 的专属错误处理策略
	 */
	function _handleGroqAiError(res, name, responseData) {
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
		let userFriendlyError;
		const error = new Error();

		switch (res.status) {
			case 400:
				userFriendlyError = `请求无效 (400)：请求语法错误。请检查请求格式。`;
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${name} API Key。`;
				error.noRetry = true;
				break;
			case 403:
				userFriendlyError = `权限被拒绝 (403)：您的网络或 API Key 无权访问所请求的资源。`;
				error.noRetry = true;
				break;
			case 404:
				userFriendlyError = `资源未找到 (404)：请求的模型或端点不存在。请检查模型名称或接口地址。`;
				error.noRetry = true;
				break;
			case 413:
				userFriendlyError = `请求内容过长 (413)：发送的文本量超过了限制。请尝试减少单次翻译的文本量。`;
				error.noRetry = true;
				break;
			case 422:
				userFriendlyError = `无法处理的实体 (422)：请求格式正确但包含语义错误。`;
				error.noRetry = true;
				break;
			case 424:
				userFriendlyError = `依赖失败 (424)：依赖请求失败（可能是 Remote MCP 认证问题）。`;
				error.noRetry = true;
				break;
			case 429:
				userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
				error.type = 'rate_limit';
				break;
			case 498:
				userFriendlyError = `Flex Tier 容量超限 (498)：当前 Flex Tier 已满。`;
				error.type = 'server_overloaded';
				break;
			case 500:
				userFriendlyError = `服务器内部错误 (500)：${name} 服务器发生通用错误。`;
				error.type = 'server_overloaded';
				break;
			case 502:
				userFriendlyError = `网关错误 (502)：上游服务器响应无效。`;
				error.type = 'server_overloaded';
				break;
			case 503:
				userFriendlyError = `服务不可用 (503)：服务器正在维护或过载。`;
				error.type = 'server_overloaded';
				break;
			default:
				userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
				error.noRetry = true;
				break;
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Cerebras AI 的专属错误处理策略
	 */
	function _handleCerebrasAiError(res, name, responseData) {
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
		let userFriendlyError;
		const error = new Error();

		switch (res.status) {
			case 400:
				userFriendlyError = `请求无效 (400)：请求参数有误。请检查模型名称或输入格式。`;
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `认证失败 (401)：API Key 无效或缺失。请在设置面板中检查您的 ${name} API Key。`;
				error.noRetry = true;
				break;
			case 402:
				userFriendlyError = `需要付款 (402)：账户余额不足或需要充值。`;
				error.noRetry = true;
				break;
			case 403:
				userFriendlyError = `权限被拒绝 (403)：无权访问该资源。`;
				error.noRetry = true;
				break;
			case 404:
				userFriendlyError = `资源未找到 (404)：请求的模型或端点不存在。`;
				error.noRetry = true;
				break;
			case 408:
				userFriendlyError = `请求超时 (408)：服务器处理请求超时。`;
				error.type = 'timeout';
				break;
			case 409:
				userFriendlyError = `请求冲突 (409)：资源状态冲突。`;
				error.type = 'server_overloaded';
				break;
			case 422:
				userFriendlyError = `无法处理的实体 (422)：请求格式正确但包含语义错误（如无效的模型参数）。`;
				error.noRetry = true;
				break;
			case 429:
				userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
				error.type = 'rate_limit';
				break;
			default:
				if (res.status >= 500) {
					userFriendlyError = `服务器内部错误 (${res.status})：${name} 服务器发生错误。`;
					error.type = 'server_overloaded';
				} else {
					userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
					error.noRetry = true;
				}
				break;
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * Together AI 的专用错误处理策略
	 */
	function _handleTogetherAiError(res, name, responseData) {
		const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
		let userFriendlyError;
		const error = new Error();

		switch (res.status) {
			case 400:
			case 422:
				userFriendlyError = `请求格式或参数错误 (${res.status})：请检查脚本是否为最新版本。如果问题持续，可能是 API 服务端出现问题。`;
				error.noRetry = true;
				break;
			case 401:
				userFriendlyError = `API Key 无效或认证失败 (401)：请在设置面板中检查您的 ${name} API Key 是否正确填写。`;
				error.noRetry = true;
				break;
			case 402:
				userFriendlyError = `需要付费 (402)：您的 ${name} 账户已达到消费上限或需要充值。请检查您的账户账单设置。`;
				error.noRetry = true;
				break;
			case 403:
			case 413:
				userFriendlyError = `请求内容过长 (${res.status})：发送的文本量超过了模型的上下文长度限制。请尝试翻译更短的文本段落。`;
				error.noRetry = true;
				break;
			case 404:
				userFriendlyError = `模型或接口地址不存在 (404)：您选择的模型名称可能已失效，或接口地址不正确。请尝试在设置面板中切换至其她模型或检查接口地址。`;
				error.noRetry = true;
				break;
			case 429:
				userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制。`;
				error.type = 'rate_limit';
				break;
			case 500:
				userFriendlyError = `服务器内部错误 (500)：${name} 的服务器遇到问题。`;
				error.type = 'server_overloaded';
				break;
			case 502:
				userFriendlyError = `网关错误 (502)：上游服务器响应无效。这通常是临时问题。`;
				error.type = 'server_overloaded';
				break;
			case 503:
				userFriendlyError = `服务过载 (503)：${name} 的服务器当前流量过高。`;
				error.type = 'server_overloaded';
				break;
			default:
				return new BaseApiClient({ name })._handleError(res, responseData);
		}

		error.message = userFriendlyError + `\n\n原始错误信息：\n${apiErrorMessage}`;
		return error;
	}

	/**
	 * API 错误处理策略注册表
	 */
	const API_ERROR_HANDLERS = {
		'openai': _handleOpenaiError,
		'siliconflow': _handleSiliconFlowError,
		'anthropic': _handleAnthropicError,
		'zhipu_ai': _handleZhipuAiError,
		'deepseek_ai': _handleDeepseekAiError,
		'google_ai': _handleGoogleAiError,
		'groq_ai': _handleGroqAiError,
		'together_ai': _handleTogetherAiError,
		'cerebras_ai': _handleCerebrasAiError,
		'modelscope_ai': _handleTogetherAiError
	};

	/**************************************************************************
	 * 术语表系统、工具函数与核心逻辑
	 **************************************************************************/

	/**
	 * 为词形变体创建正则表达式
	 */
	function createSmartRegexPattern(forms) {
		if (!forms || forms.size === 0) {
			return '';
		}

		const sortedForms = Array.from(forms).sort((a, b) => b.length - a.length);

		const escapedForms = sortedForms.map(form =>
			form.replace(/([.*+?^${}()|[\]\\])/g, '\\$&')
		);

		const pattern = escapedForms.join('|');

		const longestForm = sortedForms[0];
		const startsWithWordChar = /^[a-zA-Z0-9_]/.test(longestForm);
		const endsWithWordChar = /[a-zA-Z0-9_]$/.test(longestForm);

		const prefix = startsWithWordChar ? '\\b' : '';
		const suffix = endsWithWordChar ? '\\b' : '';

		return `${prefix}(?:${pattern})${suffix}`;
	}

	/**
	 * 生成一个随机的6位数字字符串
	 */
	function generateRandomPlaceholder() {
		const chars = '0123456789';
		let result = '';
		for (let i = 0; i < 6; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	/**
	 * 在DOM节点内查找一个由多部分文本组成的、有序的邻近序列
	 */
	function findOrderedDOMSequence(rootNode, rule) {
		const { parts: partsWithForms, isGeneral } = rule;

		const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
			acceptNode: (node) => {
				if (node.parentElement.closest('[data-glossary-applied="true"]')) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});

		const textNodes = [];
		let node;
		while ((node = walker.nextNode())) {
			textNodes.push(node);
		}

		if (textNodes.length === 0) return null;

		for (let i = 0; i < textNodes.length; i++) {
			for (let j = 0; j < textNodes[i].nodeValue.length; j++) {
				const matchResult = findSequenceFromPosition(i, j);
				if (matchResult) {
					return matchResult;
				}
			}
		}

		return null;

		function findSequenceFromPosition(startNodeIndex, startOffset) {
			let currentNodeIndex = startNodeIndex;
			let currentOffset = startOffset;
			const matchedWords = [];
			const endPoints = [];

			for (let partIndex = 0; partIndex < partsWithForms.length; partIndex++) {
				const currentPartForms = partsWithForms[partIndex].sort((a, b) => b.length - a.length);
				let bestMatch = null;

				let searchStr = textNodes[currentNodeIndex].nodeValue.substring(currentOffset);
				let lookaheadIndex = currentNodeIndex + 1;
				while (lookaheadIndex < textNodes.length && searchStr.length < 200) {
					searchStr += textNodes[lookaheadIndex].nodeValue;
					lookaheadIndex++;
				}

				const textToSearch = isGeneral ? searchStr.toLowerCase() : searchStr;

				for (const form of currentPartForms) {
					const formToMatch = isGeneral ? form.toLowerCase() : form;
					if (textToSearch.startsWith(formToMatch)) {
						const prevChar = (startNodeIndex === 0 && startOffset === 0) ? ' ' : textNodes[startNodeIndex].nodeValue[startOffset - 1] || ' ';
						if (partIndex === 0 && /[a-zA-Z0-9]/.test(prevChar)) {
							continue;
						}
						bestMatch = form;
						break;
					}
				}

				if (bestMatch) {
					matchedWords.push(bestMatch);
					let consumedLength = bestMatch.length;
					currentOffset += consumedLength;

					while (currentOffset >= textNodes[currentNodeIndex].nodeValue.length && currentNodeIndex < textNodes.length - 1) {
						currentOffset -= textNodes[currentNodeIndex].nodeValue.length;
						currentNodeIndex++;
					}
					endPoints.push({ nodeIndex: currentNodeIndex, offset: currentOffset });

					if (partIndex < partsWithForms.length - 1) {
						let separatorFound = false;

						while (currentNodeIndex < textNodes.length) {
							const remainingInNode = textNodes[currentNodeIndex].nodeValue.substring(currentOffset);
							const separatorMatch = remainingInNode.match(/^[\s-－﹣—–]+/);

							if (separatorMatch) {
								currentOffset += separatorMatch[0].length;
								separatorFound = true;
								break;
							}

							if (remainingInNode.trim() !== '') {
								return null;
							}

							currentNodeIndex++;
							currentOffset = 0;
							if (currentNodeIndex < textNodes.length) {
								separatorFound = true;
							} else {
								return null;
							}
						}
						if (!separatorFound) return null;
					}
				} else {
					return null;
				}
			}

			const finalEndPoint = endPoints[endPoints.length - 1];
			const nextChar = textNodes[finalEndPoint.nodeIndex].nodeValue[finalEndPoint.offset] || ' ';
			if (/[a-zA-Z0-9]/.test(nextChar)) {
				return null;
			}

			return {
				startNode: textNodes[startNodeIndex],
				startOffset: startOffset,
				endNode: textNodes[finalEndPoint.nodeIndex],
				endOffset: finalEndPoint.offset,
				matchedWords: matchedWords
			};
		}
	}

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
				const startBoundaryOK = !prevChar || !WORD_CHAR_REGEX.test(prevChar);
				const endBoundaryOK = !nextChar || !WORD_CHAR_REGEX.test(nextChar);

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
	function _preprocessParagraph(p, preparedRules, placeholders, placeholderCache, engineName) {
		const clone = p.cloneNode(true);
		const { domRules, executionPlan } = preparedRules;

		if (executionPlan && executionPlan.length > 0) {
			const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
				acceptNode: (node) => {
					if (node.parentElement.closest('[data-glossary-applied="true"]')) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				}
			});
			const nodesToProcess = [];
			let n;
			while (n = walker.nextNode()) {
				nodesToProcess.push(n);
			}

			while (nodesToProcess.length > 0) {
				const currentNode = nodesToProcess.shift();
				if (!currentNode.parentNode) continue;
				const text = currentNode.nodeValue;
				if (!text) continue;

				let matchFound = false;
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

						let placeholder;
						if (placeholderCache.has(finalValue)) {
							placeholder = placeholderCache.get(finalValue);
						} else {
							do {
								placeholder = `ph_${generateRandomPlaceholder()}`;
							} while (placeholders.has(placeholder));
							placeholderCache.set(finalValue, placeholder);
							placeholders.set(placeholder, { value: finalValue, rule: rule, originalHTML: matchedText });
						}

						fragment.appendChild(document.createTextNode(placeholder));

						if (matchIndex + matchedText.length < text.length) {
							fragment.appendChild(document.createTextNode(text.substring(matchIndex + matchedText.length)));
						}

						const newNodes = Array.from(fragment.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.nodeValue);
						if (newNodes.length > 0) {
							nodesToProcess.unshift(...newNodes);
						}

						currentNode.parentNode.replaceChild(fragment, currentNode);
						matchFound = true;
						break;
					}
				}
			}
		}

		if (domRules.length > 0) {
			let domReplaced;
			do {
				domReplaced = false;
				for (const rule of domRules) {
					let match;
					if (rule.isUnordered) {
						match = findUnorderedDOMSequence(clone, rule);
					} else {
						match = findOrderedDOMSequence(clone, rule);
					}
					if (match) {
						const range = document.createRange();
						range.setStart(match.startNode, match.startOffset);
						range.setEnd(match.endNode, match.endOffset);
						const contents = range.extractContents();
						const tempDiv = document.createElement('div');
						tempDiv.appendChild(contents);
						const originalHTML = tempDiv.innerHTML;
						const finalValue = rule.type === 'forbidden' ? originalHTML : rule.replacement;
						let placeholder;
						if (placeholderCache.has(finalValue)) {
							placeholder = placeholderCache.get(finalValue);
						} else {
							do {
								placeholder = `ph_${generateRandomPlaceholder()}`;
							} while (placeholders.has(placeholder));
							placeholderCache.set(finalValue, placeholder);
							placeholders.set(placeholder, { value: finalValue, rule: rule, originalHTML: originalHTML });
						}
						const placeholderNode = document.createTextNode(placeholder);
						range.insertNode(placeholderNode);
						clone.normalize();
						domReplaced = true;
						break;
					}
				}
			} while (domReplaced);
		}

		return clone;
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
	 * 译文后处理与占位符还原
	 */
	function _postprocessAndRestoreText(translatedText, placeholders) {
		let processedText = translatedText;

		try {
			const fuzzyPlaceholderRegex = /(?:ph|p)[\s_\-－＿—:：]*(\d{6})/gi;
			processedText = processedText.replace(fuzzyPlaceholderRegex, (match, digits) => {
				const standardPlaceholder = `ph_${digits}`;
				if (placeholders.has(standardPlaceholder)) {
					return standardPlaceholder;
				}
				return match;
			});
		} catch (e) {
			Logger.warn('翻译', '占位符模糊还原出错', e);
		}

		if (placeholders.size === 0) {
			return applyPostTranslationReplacements(processedText);
		}

		for (const [placeholder, data] of placeholders.entries()) {
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

		return applyPostTranslationReplacements(processedText);
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
	 * 段落翻译主函数
	 */
    async function translateParagraphs(paragraphs, { maxRetries = 3, isCancelled = () => false, knownFromLang = null, reqId = 'Unknown', skipRateLimit = false } = {}) {
		const createCancellationError = () => {
			const error = new Error('用户已取消翻译。');
			error.type = 'user_cancelled';
			error.noRetry = true;
			return error;
		};

		if (isCancelled()) throw createCancellationError();
		if (!paragraphs || paragraphs.length === 0) return new Map();

		const indexedParagraphs = paragraphs.map((p, index) => ({
			original: p,
			index: index,
			isSeparator: p.tagName === 'HR' || /^\s*[-—*~<>=.]{3,}\s*$/.test(p.textContent),
			content: p.innerHTML
		}));

		const contentToTranslate = indexedParagraphs.filter(p => !p.isSeparator);

		if (contentToTranslate.length === 0) {
			const results = new Map();
			indexedParagraphs.forEach(p => results.set(p.original, { status: 'success', content: p.content }));
			return results;
		}

		const engineName = getValidEngineName();
		const preparedRules = await getPreparedGlossaryRules();

		const placeholders = new Map();
		const placeholderCache = new Map();
		const preprocessedParagraphs = [];

		for (let i = 0; i < contentToTranslate.length; i++) {
			if (isCancelled()) throw createCancellationError();
			const p = contentToTranslate[i];
			const processedNode = _preprocessParagraph(p.original, preparedRules, placeholders, placeholderCache, engineName);
			TextNormalizer.normalizeNode(processedNode);
			preprocessedParagraphs.push(processedNode);
		}

        Logger.info('翻译', `[${reqId}] 任务开始`, {
            engine: engineName,
            paragraphs: contentToTranslate.length,
            placeholders: placeholders.size
        });

		for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
			try {
				let combinedTranslation = await requestRemoteTranslation(preprocessedParagraphs, {
					isCancelled,
					knownFromLang,
					reqId,
					skipRateLimit
				});

				combinedTranslation = combinedTranslation.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

				const fuzzyPlaceholderRegex = /(?:ph|p)[\s\-_]*(\d{6})/gi;
				const suspectedPlaceholders = [];
				let match;
				while ((match = fuzzyPlaceholderRegex.exec(combinedTranslation)) !== null) {
					suspectedPlaceholders.push(`ph_${match[1]}`);
				}

				const legalPlaceholders = new Set(placeholders.keys());
				const actualCounts = {};
				legalPlaceholders.forEach(key => actualCounts[key] = 0);
				let hasUnknownPlaceholders = false;

				for (const suspected of suspectedPlaceholders) {
					if (legalPlaceholders.has(suspected)) {
						actualCounts[suspected]++;
					} else {
						hasUnknownPlaceholders = true;
					}
				}

				let absoluteLossThreshold, proportionalLossThreshold, proportionalTriggerCount, catastrophicLossThreshold;
				const defaults = CONFIG.SERVICE_CONFIG[engineName]?.VALIDATION || CONFIG.SERVICE_CONFIG.default.VALIDATION;

				if (engineName === 'google_translate' || engineName === 'bing_translator') {
					absoluteLossThreshold = defaults.absolute_loss;
					proportionalLossThreshold = defaults.proportional_loss;
					proportionalTriggerCount = defaults.proportional_trigger_count;
					catastrophicLossThreshold = defaults.catastrophic_loss || 5;
				} else {
					const params = ProfileManager.getParamsByEngine(engineName);
					const parts = (params.validation_thresholds || '').split(/[,，]/).map(s => parseFloat(s.trim()));
					const isValid = parts.length >= 3 && !parts.slice(0, 3).some(isNaN);
					absoluteLossThreshold = isValid ? parts[0] : defaults.absolute_loss;
					proportionalLossThreshold = isValid ? parts[1] : defaults.proportional_loss;
					proportionalTriggerCount = isValid ? parts[2] : defaults.proportional_trigger_count;
					catastrophicLossThreshold = (isValid && !isNaN(parts[3])) ? parts[3] : (defaults.catastrophic_loss || 5);
				}

				let hasMissingPlaceholders = false;
				let totalLoss = 0;
				const expectedCounts = {};
				const preprocessedText = preprocessedParagraphs.map(p => p.innerHTML).join(' ');

				for (const key of placeholders.keys()) {
					expectedCounts[key] = (preprocessedText.match(new RegExp(key, 'g')) || []).length;
				}

				for (const key of legalPlaceholders) {
					const expected = expectedCounts[key];
					const actual = actualCounts[key];
					const loss = expected - actual;
					if (loss > 0) {
						totalLoss += loss;
						const isCatastrophicLoss = expected > catastrophicLossThreshold && actual === 0;
						const isAbsoluteLoss = loss >= absoluteLossThreshold;
						const isProportionalLoss = expected >= proportionalTriggerCount && (loss / expected) >= proportionalLossThreshold;

						if (isCatastrophicLoss || isAbsoluteLoss || isProportionalLoss) {
							hasMissingPlaceholders = true;
							break;
						}
					}
				}

				if (hasMissingPlaceholders || hasUnknownPlaceholders) {
					const errorReason = hasUnknownPlaceholders ? "检测到未知占位符" : "占位符大量缺失";
					Logger.warn('翻译', `[${reqId}] 占位符校验失败: ${errorReason}`, { totalLoss });
					const err = new Error(`占位符校验失败 (${errorReason})`);
					err.type = 'validation_failed';
					throw err;
				}

				const restoredTranslation = _postprocessAndRestoreText(combinedTranslation, placeholders, engineName);

				let translatedParts = [];
				if (contentToTranslate.length === 1 && !restoredTranslation.trim().startsWith('1.')) {
					translatedParts.push(restoredTranslation.trim());
				} else {
					const regex = /\d+\.\s*([\s\S]*?)(?=\n\d+\.|$)/g;
					let match;
					while ((match = regex.exec(restoredTranslation)) !== null) {
						translatedParts.push(match[1].trim());
					}
					if (translatedParts.length !== contentToTranslate.length && restoredTranslation.includes('\n')) {
						const potentialParts = restoredTranslation.split('\n').filter(p => p.trim().length > 0);
						if (potentialParts.length === contentToTranslate.length) {
							translatedParts = potentialParts.map(p => p.replace(/^\d+\.\s*/, '').trim());
						}
					}
				}

				if (translatedParts.length !== contentToTranslate.length) {
					throw new Error('AI 响应格式不一致，分段数量不匹配');
				}

				const finalResults = new Map();
				indexedParagraphs.forEach(p => {
					if (p.isSeparator) {
						finalResults.set(p.original, { status: 'success', content: p.content });
					} else {
						const originalPara = contentToTranslate.find(item => item.index === p.index);
						if (originalPara) {
							const transIndex = contentToTranslate.indexOf(originalPara);
							const cleanedContent = AdvancedTranslationCleaner.clean(translatedParts[transIndex] || p.content);
							finalResults.set(p.original, { status: 'success', content: cleanedContent });
						}
					}
				});
				return finalResults;

			} catch (e) {
				if (isCancelled() || e.type === 'user_cancelled') {
					throw createCancellationError();
				}

				if (e.noRetry) {
					Logger.error('翻译', `[${reqId}] 发生不可重试错误`, e.message);
					throw e;
				}

				if (retryCount < maxRetries) {
					let baseDelay = 5000;
					if (e.type === 'rate_limit' || e.type === 'server_overloaded') {
						baseDelay = 10000;
					} else if (e.type === 'validation_failed') {
						baseDelay = 2000;
					}

					const delay = baseDelay * Math.pow(2, retryCount);
					const jitter = delay * 0.2 * (Math.random() * 2 - 1);
					const finalDelay = Math.floor(delay + jitter);

					Logger.warn('翻译', `[${reqId}] 任务重试 (${retryCount + 1}/${maxRetries})`, {
						reason: e.message,
						waitingFor: `${Math.round(finalDelay / 1000)}s`
					});

					await sleep(finalDelay);

					if (isCancelled()) throw createCancellationError();
					continue;
				}

				Logger.error('翻译', `[${reqId}] 重试次数耗尽，任务失败: ${e.message}`);

				if (e.message.includes('分段数量不匹配') && paragraphs.length > 1) {
					Logger.warn('翻译', `[${reqId}] 触发逐段回退策略`);
					if (isCancelled()) throw createCancellationError();

					const fallbackResults = new Map();
					for (const p of paragraphs) {
						if (isCancelled()) break;
						const singleResultMap = await translateParagraphs([p], {
							maxRetries: 1,
							isCancelled,
							knownFromLang,
							reqId: `${reqId}-FB`,
							skipRateLimit
						});
						const singleResult = singleResultMap.get(p);
						fallbackResults.set(p, singleResult || { status: 'error', content: '逐段翻译失败' });
					}
					return fallbackResults;
				}

				const finalResults = new Map();
				indexedParagraphs.forEach(p => {
					if (p.isSeparator) {
						finalResults.set(p.original, { status: 'success', content: p.content });
					} else {
						finalResults.set(p.original, { status: 'error', content: `翻译失败：${e.message}` });
					}
				});
				return finalResults;
			}
		}
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

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				let titleNode = null;
				let titleTempDiv = null;
				let isChapterTitle = false;

				let prefaceGroup = containerElement.previousElementSibling;
				while (prefaceGroup && !prefaceGroup.classList.contains('preface')) {
					prefaceGroup = prefaceGroup.previousElementSibling;
				}
				if (!prefaceGroup && containerElement.parentElement.classList.contains('chapter')) {
					prefaceGroup = containerElement.parentElement.querySelector('.chapter.preface.group');
				}

				if (prefaceGroup) {
					const titleEl = prefaceGroup.querySelector('h3.title');
					if (titleEl && !titleEl.nextElementSibling?.classList.contains('translated-title-element')) {
						const fullText = titleEl.textContent.trim();
						const simpleChapterRegex = /^(?:Chapter|第)\s*\d+\s*(?:章)?$/i;
						const link = titleEl.querySelector('a');
						let textToTranslate = fullText;
						let isValid = true;

						if (link) {
							const linkText = link.textContent;
							const remaining = fullText.replace(linkText, '').trim();
							if (!remaining || /^[:：]\s*$/.test(remaining)) {
								isValid = false;
							} else {
								textToTranslate = remaining.replace(/^[:：]\s*/, '');
							}
						} else {
							if (simpleChapterRegex.test(fullText)) {
								isValid = false;
							}
						}

						if (isValid && textToTranslate) {
							titleNode = titleEl;
							titleTempDiv = document.createElement('div');
							titleTempDiv.textContent = textToTranslate;
							isChapterTitle = true;
						}
					}
				}

				if (!titleNode) {
					const workPreface = containerElement.closest('.preface.group');
					if (workPreface) {
						const workTitleEl = workPreface.querySelector('h2.title.heading');
						if (workTitleEl && !workTitleEl.nextElementSibling?.classList.contains('translated-title-element')) {
							const clone = workTitleEl.cloneNode(true);
							clone.querySelectorAll('img, svg').forEach(el => el.remove());
							const textContent = clone.textContent.trim();

							if (textContent) {
								titleNode = workTitleEl;
								titleTempDiv = document.createElement('div');
								titleTempDiv.textContent = textContent;
								isChapterTitle = false;
							}
						}
					}
				}

				const customRenderers = new Map();
				if (titleTempDiv) {
					customRenderers.set(titleTempDiv, (_node, result) => {
						if (result.status === 'success') {
							const translatedTitle = titleNode.cloneNode(true);
							translatedTitle.classList.add('translated-title-element');
							translatedTitle.removeAttribute('id');

							if (isChapterTitle) {
								const link = translatedTitle.querySelector('a');
								if (link) {
									let next = link.nextSibling;
									while (next) {
										const toRemove = next;
										next = next.nextSibling;
										toRemove.remove();
									}
									translatedTitle.appendChild(document.createTextNode(`: ${result.content}`));
								} else {
									translatedTitle.textContent = result.content;
								}
							} else {
								let textNodeFound = false;
								Array.from(translatedTitle.childNodes).forEach(child => {
									if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) {
										if (!textNodeFound) {
											child.nodeValue = ` ${result.content} `;
											textNodeFound = true;
										} else {
											child.nodeValue = '';
										}
									}
								});
								if (!textNodeFound) {
									translatedTitle.appendChild(document.createTextNode(result.content));
								}
							}

							titleNode.after(translatedTitle);
							translatedTitleElement = translatedTitle;

							const currentMode = GM_getValue('translation_display_mode', 'bilingual');
							if (currentMode === 'translation_only') {
								titleNode.style.display = 'none';
							}
						}
					});
				}

				const instanceState = {
					elementState: new WeakMap(),
					isFirstTranslationChunk: true,
				};

				activeTask = runUniversalTranslationEngine({
					containerElement,
					isCancelled,
					onComplete: onDone,
					instanceState,
					useObserver: isLazyLoad,
					prependNodes: titleTempDiv ? [titleTempDiv] : [],
					customRenderers: customRenderers,
					onRetry: () => {
                        const failedUnits = Array.from(containerElement.querySelectorAll('[data-translation-state="error"]'));
                        if (failedUnits.length === 0) return;

                        failedUnits.forEach(unit => {
                            const errorNode = unit.nextElementSibling;
                            if (errorNode && errorNode.classList.contains('translated-by-ao3-translator-error')) {
                                errorNode.remove();
                            }
                            delete unit.dataset.translationState;
                        });

						if (controller.state === 'complete') {
							controller.state = 'running';
							controller.updateButtonState('翻译中…', 'state-running');
						}

                        if (activeTask) {
                            activeTask.addUnits(failedUnits);
                            activeTask.scheduleProcessing(true);
                        }
					}
				});
			},
			onPause: () => {
				if (activeTask && activeTask.disconnect) {
					activeTask.disconnect();
				}
				activeTask = null;
				containerElement.querySelectorAll('[data-translation-state="translating"]').forEach(unit => {
					delete unit.dataset.translationState;
				});
			},
			onClear: () => {
				const internalNodes = containerElement.querySelectorAll('.translated-by-ao3-translator, .translated-by-ao3-translator-error');
				internalNodes.forEach(node => node.remove());
				let nextNode = containerElement.nextElementSibling;
				while (nextNode && nextNode !== buttonWrapper) {
					if (nextNode.classList.contains('translated-by-ao3-translator') || nextNode.classList.contains('translated-by-ao3-translator-error')) {
						const nodeToRemove = nextNode;
						nextNode = nextNode.nextElementSibling;
						nodeToRemove.remove();
					} else {
						nextNode = nextNode.nextElementSibling;
					}
				}
				containerElement.querySelectorAll('[data-translation-state]').forEach(unit => {
					unit.style.display = '';
					delete unit.dataset.translationState;
				});
				if (containerElement.dataset.translationState) {
					containerElement.style.display = '';
					delete containerElement.dataset.translationState;
				}
				if (translatedTitleElement) {
					const originalTitle = translatedTitleElement.previousElementSibling;
					if (originalTitle) originalTitle.style.display = '';
					translatedTitleElement.remove();
					translatedTitleElement = null;
				}
			}
		});

		return controller;
	}

    /**
	 * 标签区域翻译控制器
	 */
	function createTagsTranslationController(options) {
		const { containerElement, buttonWrapper, originalButtonText } = options;
		let translatedElement = null;
		let errorElement = null;

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				try {
					const resultEl = await runTagsTranslationEngine(containerElement, isCancelled);
					if (isCancelled()) return;

					translatedElement = resultEl;
					onDone();
				} catch (error) {
					if (isCancelled()) return;
					onDone();

					const errorDiv = document.createElement('div');
					errorDiv.className = 'translated-by-ao3-translator-error';
					errorDiv.style.margin = '15px 0';
					errorDiv.innerHTML = `翻译失败：${error.message}`;

					const retryBtn = document.createElement('span');
					retryBtn.className = 'retry-translation-button';
					retryBtn.title = '重试';
					retryBtn.innerHTML = `<svg viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-694v-106h80v240H560v-80h136q-34-45-84.5-72.5T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q88 0 151.5-54T713-440h82q-19 127-115 203.5T480-160Z"/></svg>`;
					retryBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						if (errorElement) {
							errorElement.remove();
							errorElement = null;
						}
						controller.start();
					});
					errorDiv.appendChild(retryBtn);

					buttonWrapper.before(errorDiv);
					errorElement = errorDiv;

					Logger.error('翻译', '标签翻译失败', error);
				}
			},
			onClear: () => {
				if (translatedElement) {
					translatedElement.remove();
					translatedElement = null;
				} else {
					let nextNode = containerElement.nextElementSibling;
					while (nextNode && !nextNode.classList.contains('translate-me-ao3-wrapper')) {
						if (nextNode.classList.contains('translated-tags-container')) {
							const nodeToRemove = nextNode;
							nextNode = nextNode.nextElementSibling;
							nodeToRemove.remove();
						} else {
							nextNode = nextNode.nextElementSibling;
						}
					}
				}

				if (errorElement) {
					errorElement.remove();
					errorElement = null;
				}

				containerElement.style.display = '';
				if (containerElement.parentElement.classList.contains('wrapper') && containerElement.tagName === 'DL') {
					containerElement.parentElement.style.display = '';
				}
			}
		});

		return controller;
	}

    /**
	 * 混合作品卡片（Blurb）翻译控制器，同步管理简介与标签的翻译任务
	 */
	function createBlurbTranslationController(options) {
		const { summaryElement, tagsElement, buttonWrapper, originalButtonText } = options;
		let translatedTagsElement = null;
		let errorElement = null;
		let activeSummaryTask = null;

		const controller = createBaseController({
			buttonWrapper,
			originalButtonText,
			onStart: async (isCancelled, onDone) => {
				try {
					const tagsPromise = runTagsTranslationEngine(tagsElement, isCancelled);

					const summaryPromise = new Promise((resolve) => {
						const instanceState = {
							elementState: new WeakMap(),
							isFirstTranslationChunk: true,
						};
						activeSummaryTask = runUniversalTranslationEngine({
							containerElement: summaryElement,
							isCancelled,
							onComplete: resolve,
							instanceState,
							useObserver: false,
							onRetry: () => {
                                const failedUnits = Array.from(summaryElement.querySelectorAll('[data-translation-state="error"]'));
                                if (failedUnits.length === 0) return;

                                failedUnits.forEach(unit => {
                                    const errorNode = unit.nextElementSibling;
                                    if (errorNode && errorNode.classList.contains('translated-by-ao3-translator-error')) {
                                        errorNode.remove();
                                    }
                                    delete unit.dataset.translationState;
                                });

								if (controller.state === 'complete') {
									controller.state = 'running';
									controller.updateButtonState('翻译中…', 'state-running');
								}

                                if (activeSummaryTask) {
                                    activeSummaryTask.addUnits(failedUnits);
                                    activeSummaryTask.scheduleProcessing(true);
                                }
							}
						});
					});

					const [tagsResult] = await Promise.all([tagsPromise, summaryPromise]);
					if (isCancelled()) return;

					translatedTagsElement = tagsResult;
					onDone();
				} catch (error) {
					if (isCancelled()) return;
					onDone();

					const errorDiv = document.createElement('div');
					errorDiv.className = 'translated-by-ao3-translator-error';
					errorDiv.style.margin = '15px 0';
					errorDiv.innerHTML = `翻译失败：${error.message}`;

					const retryBtn = document.createElement('span');
					retryBtn.className = 'retry-translation-button';
					retryBtn.title = '重试';
					retryBtn.innerHTML = `<svg viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-694v-106h80v240H560v-80h136q-34-45-84.5-72.5T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q88 0 151.5-54T713-440h82q-19 127-115 203.5T480-160Z"/></svg>`;
					retryBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						if (errorElement) {
							errorElement.remove();
							errorElement = null;
						}
						controller.start();
					});
					errorDiv.appendChild(retryBtn);

					buttonWrapper.before(errorDiv);
					errorElement = errorDiv;

					Logger.error('翻译', 'Blurb 翻译失败', error);
				}
			},
			onPause: () => {
				if (activeSummaryTask && activeSummaryTask.disconnect) {
					activeSummaryTask.disconnect();
				}
				activeSummaryTask = null;
				summaryElement.querySelectorAll('[data-translation-state="translating"]').forEach(unit => {
					delete unit.dataset.translationState;
				});
			},
			onClear: () => {
				const internalTranslationNodes = summaryElement.querySelectorAll('.translated-by-ao3-translator, .translated-by-ao3-translator-error');
				internalTranslationNodes.forEach(node => node.remove());

				let nextNode = summaryElement.nextSibling;
				while (nextNode && (nextNode.classList?.contains('translated-by-ao3-translator') || nextNode.classList?.contains('translated-by-ao3-translator-error'))) {
					const nodeToRemove = nextNode;
					nextNode = nextNode.nextSibling;
					nodeToRemove.remove();
				}

				summaryElement.querySelectorAll('[data-translation-state]').forEach(unit => {
					unit.style.display = '';
					delete unit.dataset.translationState;
				});

				if (translatedTagsElement) {
					translatedTagsElement.remove();
					translatedTagsElement = null;
				} else {
					let nextTagNode = tagsElement.nextElementSibling;
					if (nextTagNode && nextTagNode.classList.contains('translated-tags-container')) {
						nextTagNode.remove();
					}
				}

				if (errorElement) {
					errorElement.remove();
					errorElement = null;
				}

				tagsElement.style.display = '';
				if (tagsElement.parentElement.classList.contains('wrapper') && tagsElement.tagName === 'DL') {
					tagsElement.parentElement.style.display = '';
				}
			}
		});

		return controller;
	}

	/**
	 * 标签区域翻译引擎
	 */
	async function runTagsTranslationEngine(containerElement, isCancelled) {
		if (isCancelled()) return null;

		const clone = containerElement.cloneNode(true);
		clone.classList.add('translated-tags-container');
		clone.removeAttribute('id');
		clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
		clone.style.background = '';
		clone.style.border = '';
		clone.style.boxShadow = '';

		const nodesToTranslate = [];
		const targetSelectors = [
			'dd.fandom a.tag', 'dd.relationship a.tag', 'dd.character a.tag', 'dd.freeform a.tag',
			'dd.series a', 'dd.collections a', 'dd.language', 'li.fandoms a.tag',
			'li.relationships a.tag', 'li.characters a.tag', 'li.freeforms a.tag',
			'a.tag:not(.rating):not(.warning):not(.category)'
		];

		const selectedElements = new Set();
		const fullDictionary = {
			...pageConfig.staticDict,
			...pageConfig.globalFlexibleDict,
			...pageConfig.pageFlexibleDict
		};

		targetSelectors.forEach(selector => {
			clone.querySelectorAll(selector).forEach(el => {
				if (el.closest('.rating, .warnings, .category, .warning')) return;
				const text = el.textContent.trim();
				if (text && !/^\d+$/.test(text) && !fullDictionary[text]) {
					selectedElements.add(el);
				}
			});
		});

		nodesToTranslate.push(...selectedElements);

		if (nodesToTranslate.length > 0) {
			try {
				const reqId = 'Tags-' + Math.random().toString(36).substring(2, 6).toUpperCase();
				const translationResults = await translateParagraphs(nodesToTranslate, { isCancelled, reqId });
				if (isCancelled()) return null;

				nodesToTranslate.forEach(el => {
					const result = translationResults.get(el);
					if (result && result.status === 'success') {
						el.textContent = result.content;
					}
				});
			} catch (error) {
				if (isCancelled()) return null;
				throw error;
			}
		}

		if (isCancelled()) return null;

		const currentMode = GM_getValue('translation_display_mode', 'bilingual');
		let insertedElement;

		if (containerElement.tagName === 'DL' && containerElement.classList.contains('meta') && containerElement.parentElement.classList.contains('wrapper')) {
			const parentWrapper = containerElement.parentElement;
			const wrapperClone = parentWrapper.cloneNode(false);
			wrapperClone.removeAttribute('id');
			wrapperClone.classList.add('translated-tags-wrapper');
			wrapperClone.appendChild(clone);
			parentWrapper.after(wrapperClone);
			insertedElement = wrapperClone;
			if (currentMode === 'translation_only') parentWrapper.style.display = 'none';
		} else {
			containerElement.after(clone);
			insertedElement = clone;
			if (currentMode === 'translation_only') containerElement.style.display = 'none';
		}

		return insertedElement;
	}

	/**
	 * DOM 处理与遍历器
	 */
	class DOMNormalizer {
		constructor() {
			this.elementState = new WeakMap();
			this.splitThreshold = 200;
			this.yieldInterval = 30;
		}

		async *generateUnits(container) {
			const splitSelectors = 'p, blockquote';
			const elementsToSplit = Array.from(container.querySelectorAll(splitSelectors))
				.filter(el => !this._isTranslated(el));

			for (let i = 0; i < elementsToSplit.length; i++) {
				const el = elementsToSplit[i];
				if (!this.elementState.has(el) && el.textContent.length > this.splitThreshold && el.querySelector('br')) {
					const newElements = this._splitElement(el);
					if (newElements.length > 0) el.replaceWith(...newElements);
				} else {
					this.elementState.set(el, { preprocessed: true });
				}
				if ((i + 1) % this.yieldInterval === 0) await sleep(0);
			}

			const liElements = Array.from(container.querySelectorAll('li'));
			for (let i = 0; i < liElements.length; i++) {
				this._wrapListContent(liElements[i]);
				if ((i + 1) % this.yieldInterval === 0) await sleep(0);
			}

			const selectors = 'p, blockquote, li, h1, h2, h3, h4, h5, h6, hr, center';
			const skipHeaders = ['Summary', 'Notes', 'Work Text', 'Chapter Text'];
			const candidates = Array.from(container.querySelectorAll(selectors))
				.filter(el => !this._isTranslated(el));

			let yieldedAny = false;
			for (let i = 0; i < candidates.length; i++) {
				const unit = candidates[i];
				const content = unit.textContent.trim();

				if (!content && unit.tagName !== 'HR') continue;
				if (skipHeaders.includes(content)) continue;
				if (unit.querySelector(selectors)) continue;

				yieldedAny = true;
				yield unit;

				if ((i + 1) % this.yieldInterval === 0) await sleep(0);
			}

			if (!yieldedAny && container.textContent.trim().length > 0) {
				yield container;
			}
		}

		_isTranslated(el) {
			return el.closest('.translated-by-ao3-translator, .translated-by-ao3-translator-error');
		}

		_splitElement(el) {
			const newElements = [];
			let contentBuffer = [];
			const flushBuffer = () => {
				if (contentBuffer.length === 0) return;
				const hasContent = contentBuffer.some(node =>
					(node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) ||
					(node.nodeType === Node.ELEMENT_NODE)
				);
				if (hasContent) {
					const newEl = document.createElement(el.tagName);
					if (el.className) newEl.className = el.className;
					contentBuffer.forEach(node => newEl.appendChild(node));
					this.elementState.set(newEl, { preprocessed: true });
					newElements.push(newEl);
				}
				contentBuffer = [];
			};
			Array.from(el.childNodes).forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') flushBuffer();
				else contentBuffer.push(node);
			});
			flushBuffer();
			return newElements;
		}

		_wrapListContent(li) {
			if (li.querySelector('ul, ol')) {
				const childNodes = Array.from(li.childNodes);
				let contentBuffer = [];
				const flushBuffer = () => {
					if (contentBuffer.length === 0) return;
					if (contentBuffer.some(n => (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 0) || (n.nodeType === Node.ELEMENT_NODE && n.textContent.trim().length > 0))) {
						const p = document.createElement('p');
						p.style.margin = '0'; p.style.padding = '0'; p.style.display = 'inline-block'; p.style.width = '100%';
						contentBuffer[0].parentNode.insertBefore(p, contentBuffer[0]);
						contentBuffer.forEach(n => p.appendChild(n));
						this.elementState.set(p, { preprocessed: true });
					}
					contentBuffer = [];
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
     * 优先级队列管理器
     */
    class PriorityQueueManager {
        constructor(prependNodes = []) {
            this.queue = new Set();
            this.prependSet = new Set(prependNodes);
            prependNodes.forEach(n => this.queue.add(n));
        }

        add(unit, delay = 0) {
            if (!unit.dataset.translationState) {
                if (delay > 0) {
                    unit.dataset.readyAt = Date.now() + delay;
                } else {
                    delete unit.dataset.readyAt;
                }
                this.queue.add(unit);
            }
        }

        remove(unit) {
            this.queue.delete(unit);
            delete unit.dataset.readyAt;
        }

        get size() {
            return this.queue.size;
        }

        getSortedList() {
            if (this.queue.size === 0) return [];

            const high = [];
            const medium = [];
            const low = [];

            const viewportHeight = window.innerHeight;
            const now = Date.now();

            for (const unit of this.queue) {
                if (unit.dataset.readyAt) {
                    const readyAt = parseInt(unit.dataset.readyAt, 10);
                    if (now < readyAt) {
                        continue;
                    }
                }

                if (this.prependSet.has(unit)) {
                    high.push(unit);
                    continue;
                }

                const rect = unit.getBoundingClientRect();
                const isVisible = (rect.top < viewportHeight && rect.bottom >= 0);

                if (isVisible) {
                    medium.push(unit);
                } else {
                    low.push(unit);
                }
            }

            return [...high, ...medium, ...low];
        }
    }

	/**
	 * 分包策略
	 */
	class BatchStrategy {
		constructor(configProvider) {
			this.config = configProvider;
		}

		createBatch(sortedList) {
			if (sortedList.length === 0) return { batch: [], reason: 'empty' };

			const { chunkSize, paragraphLimit } = this.config.getLimits();
			const batch = [];
			let currentChars = 0;
			let reason = 'underfilled';

			for (const unit of sortedList) {
				const isSeparator = unit.tagName === 'HR' || /^\s*[-—*~<>=.]{3,}\s*$/.test(unit.textContent);

				if (isSeparator) {
					if (batch.length > 0) {
						reason = 'separator_cut';
						break;
					} else {
						batch.push(unit);
						reason = 'separator_single';
						break;
					}
				}

				batch.push(unit);
				currentChars += unit.textContent.length;

				if (batch.length >= paragraphLimit || currentChars >= chunkSize) {
					reason = 'full';
					break;
				}
			}

			return { batch, reason };
		}
	}

    /**
	 * 渲染代理
	 */
	class RenderDelegate {
		constructor(customRenderersMap, displayModeGetter) {
			this.customRenderers = customRenderersMap || new Map();
			this.getDisplayMode = displayModeGetter;
		}

		applyResult(unit, result, onRetry) {
			if (this.customRenderers.has(unit)) {
				try {
					const renderer = this.customRenderers.get(unit);
					renderer(unit, result);
					unit.dataset.translationState = 'translated';
				} catch (e) {
					Logger.error('翻译', '自定义渲染失败', e);
					unit.dataset.translationState = 'error';
				}
				return;
			}

			const transNode = document.createElement('div');
			const newTranslatedElement = unit.cloneNode(false);
			newTranslatedElement.removeAttribute('data-translation-state');

			if (result.status === 'success') {
				delete unit.dataset.batchRetryCount;

				transNode.className = 'translated-by-ao3-translator';
				newTranslatedElement.innerHTML = result.content;

				if (this.getDisplayMode() === 'translation_only') {
					unit.style.display = 'none';
				}
				unit.dataset.translationState = 'translated';
			} else {
				transNode.className = 'translated-by-ao3-translator-error';
				newTranslatedElement.innerHTML = `翻译失败：${result.content.replace('翻译失败：', '')}`;
				unit.dataset.translationState = 'error';

				const retryBtn = this._createRetryButton(unit, onRetry);
				newTranslatedElement.appendChild(retryBtn);
			}

			transNode.appendChild(newTranslatedElement);
			unit.after(transNode);
		}

		_createRetryButton(_unit, onRetry) {
			const span = document.createElement('span');
			span.className = 'retry-translation-button';
			span.title = '重试';
			span.innerHTML = `<svg viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-694v-106h80v240H560v-80h136q-34-45-84.5-72.5T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q88 0 151.5-54T713-440h82q-19 127-115 203.5T480-160Z"/></svg>`;
			span.addEventListener('click', (e) => {
				e.stopPropagation();
				onRetry();
			});
			return span;
		}
	}

    /**
	 * 资源管理器
	 */
	class ResourceManager {
		constructor(engineName, maxConcurrency = 5) {
			this.engineName = engineName;
			this.maxConcurrency = maxConcurrency;
			this.activeCount = 0;
			this.tokenBucket = new GlobalTokenBucket();
		}

		canSchedule() {
			return this.activeCount < this.maxConcurrency;
		}

		async acquireToken() {
			if (!this.canSchedule()) {
				return { success: false, waitTime: 1000 };
			}
			const result = await this.tokenBucket.consume(1, this.engineName);
			if (result.success) {
				this.activeCount++;
			}
			return result;
		}

		release() {
			this.activeCount = Math.max(0, this.activeCount - 1);
		}

		reportError(error) {
			if (error.type === 'rate_limit' || error.type === 'server_overloaded' || (error.message && (error.message.includes('429') || error.message.includes('503')))) {
				const freezeTime = 10000;
				this.tokenBucket.triggerFreeze(freezeTime);
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

            this.normalizer = new DOMNormalizer();
            this.queueManager = new PriorityQueueManager(options.prependNodes);

            const engine = getValidEngineName();

            this.batchStrategy = new BatchStrategy({
                getLimits: () => {
                    const isSpecial = ['google_translate', 'bing_translator'].includes(engine);
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

            this.observer = null;
            this.timer = null;
            this.detectedLang = null;
            this.totalUnits = 0;
            this.processedUnits = 0;
            this.prependNodes = options.prependNodes || [];
            this.hasSkippedFirstLimit = false;
        }

        async start(useObserver = true) {
            const unitGenerator = this.normalizer.generateUnits(this.container);

            if (useObserver) {
                const rootMargin = this._getRootMargin();
                this.observer = new IntersectionObserver((entries) => {
                    if (this.isCancelled()) return;
                    let added = false;
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !entry.target.dataset.translationState) {
                            this.queueManager.add(entry.target);
                            added = true;
                        }
                    });
                    if (added) this.schedule(false);
                }, { rootMargin });
            }

            let sampleBatch = [];
            let detectionAttempted = false;

            for await (const unit of unitGenerator) {
                if (this.isCancelled()) break;
                if (unit.dataset.translationState) continue;

                this.totalUnits++;

                if (!this.detectedLang && !detectionAttempted && !this.prependNodes.includes(unit)) {
                    sampleBatch.push(unit);
                    if (sampleBatch.length >= 5) {
                        await this._detectLanguage(sampleBatch);
                        detectionAttempted = true;
                        sampleBatch = [];
                    }
                }

                if (useObserver) {
                    this.observer.observe(unit);
                    if (this._isInViewport(unit)) this.queueManager.add(unit);
                } else {
                    this.queueManager.add(unit);
                }

                if (this.totalUnits <= 10 || this.totalUnits % 50 === 0) {
                    this.schedule(this.totalUnits <= 10);
                }
            }

            if (!this.detectedLang && !detectionAttempted && sampleBatch.length > 0) {
                await this._detectLanguage(sampleBatch);
            }

            if (!useObserver) {
                this.schedule(true);
            }

            if (this.totalUnits === 0) {
                this._finish();
            }
        }

        schedule(force = false) {
            if (this.isCancelled()) return;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.runLoop(force), 100);
        }

        async runLoop(force) {
            if (this.isCancelled()) return;

            if (!this.resourceManager.canSchedule()) return;
            if (this.queueManager.size === 0) {
                if (this.processedUnits >= this.totalUnits) this._finish();
                return;
            }

            const sortedList = this.queueManager.getSortedList();
            const { batch, reason } = this.batchStrategy.createBatch(sortedList);

            if (batch.length === 0) {
                if (this.queueManager.size > 0) {
                    this.timer = setTimeout(() => this.schedule(true), 1000);
                }
                return;
            }

            const isFull = reason === 'full';
            const isSeparatorAction = reason.startsWith('separator');

            if (!force && !isFull && !isSeparatorAction) {
                this.timer = setTimeout(() => this.schedule(true), 4000);
                return;
            }

            const tokenResult = await this.resourceManager.acquireToken();
            if (!tokenResult.success) {
                setTimeout(() => this.schedule(force), tokenResult.waitTime + 50);
                return;
            }

            this._executeBatch(batch);

            if (this.resourceManager.canSchedule() && this.queueManager.size > 0) {
                this.schedule(false);
            }
        }

        async _executeBatch(batch) {
            batch.forEach(el => {
                this.queueManager.remove(el);
                if (this.observer) this.observer.unobserve(el);
                el.dataset.translationState = 'translating';
            });

            try {
                const validUnits = batch.filter(el => el.tagName !== 'HR' && el.textContent.trim());
                const reqId = `Batch-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                let results = new Map();

                if (validUnits.length > 0) {
                    const isFirstBatch = !this.hasSkippedFirstLimit;
                    if (isFirstBatch) {
                        this.hasSkippedFirstLimit = true;
                    }

                    results = await translateParagraphs(validUnits, {
                        isCancelled: this.isCancelled,
                        knownFromLang: this.detectedLang,
                        reqId: reqId,
                        maxRetries: 3,
                        skipRateLimit: isFirstBatch
                    });
                }

                batch.forEach(el => {
                    this.processedUnits++;
                    if (el.tagName === 'HR') {
                        el.dataset.translationState = 'translated';
                        return;
                    }

                    const res = results.get(el) || { status: 'error', content: 'Unknown error' };
                    this.renderer.applyResult(el, res, this.onRetryCallback);
                });

            } catch (e) {
                if (!this.isCancelled() && e.type !== 'user_cancelled') {
                    Logger.error('翻译', '批次执行发生未捕获错误', e);
                    batch.forEach(el => {
                        this.processedUnits++;
                        this.renderer.applyResult(el, { status: 'error', content: e.message }, this.onRetryCallback);
                    });
                }
            } finally {
                this.resourceManager.release();
                if (this.onProgress) this.onProgress(this.processedUnits, this.totalUnits);
                this.schedule(false);
            }
        }

        async _detectLanguage(samples) {
            const userSelectedFromLang = GM_getValue('from_lang', 'auto');
            if (userSelectedFromLang === 'script_auto') {
                const textToDetect = samples.map(p => p.textContent).join(' ').substring(0, 200);
                this.detectedLang = await LanguageDetectService.detect(textToDetect);
                Logger.info('翻译', `自动检测源语言: ${this.detectedLang}`);
            } else {
                this.detectedLang = userSelectedFromLang;
            }
        }

        _getRootMargin() {
            const engineName = getValidEngineName();
            const isSpecial = ['google_translate', 'bing_translator'].includes(engineName);
            const base = CONFIG.SERVICE_CONFIG[engineName] || CONFIG.SERVICE_CONFIG.default;
            if (isSpecial) {
                return base.LAZY_LOAD_ROOT_MARGIN;
            }
            const params = ProfileManager.getParamsByEngine(engineName);
            return params.lazy_load_margin;
        }

        _isInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (rect.top < window.innerHeight && rect.bottom >= 0);
        }

        _finish() {
            if (this.observer) this.observer.disconnect();
            if (this.onComplete) this.onComplete();
        }

        disconnect() {
            if (this.observer) this.observer.disconnect();
        }

        addUnits(units) {
            units.forEach(u => this.queueManager.add(u));
            this.processedUnits = Math.max(0, this.processedUnits - units.length);
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
		const useObserver = options.useObserver !== false;
		engine.start(useObserver);
		return {
			disconnect: () => engine.disconnect(),
			addUnits: (units) => engine.addUnits(units),
			scheduleProcessing: (force) => engine.scheduleProcessing(force)
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
			regexTerms: []
		};
		const lines = text.split('\n');

		const sectionHeaders = {
			TERMS: ['terms', '词条'],
			GENERAL_TERMS: ['general terms', '通用词条'],
			FORBIDDEN_TERMS: ['forbidden terms', '禁翻词条'],
			REGEX_TERMS: ['regex', '正则表达式']
		};

		const sections = [];
		let metadataLines = [];
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

		const metadataRegex = /^\s*(maintainer|version|last_updated|维护者|版本号|更新时间)\s*[:：]\s*(.*?)\s*[,，]?\s*$/;
		for (const line of metadataLines) {
			const metadataMatch = line.match(metadataRegex);
			if (metadataMatch) {
				let key = metadataMatch[1].trim();
				let value = metadataMatch[2].trim();
				const keyMap = { '维护者': 'maintainer', '版本号': 'version', '更新时间': 'last_updated' };
				result.metadata[keyMap[key] || key] = value;
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

			GM_xmlhttpRequest({
				method: 'GET',
				url: url,
				onload: function (response) {
					if (response.status !== 200) {
						const message = `下载 ${glossaryName} 术语表失败！服务器返回状态码: ${response.status}`;
						if (!silent) notifyAndLog(message, '导入错误', 'error');
						return resolve({ success: false, name: glossaryName, message });
					}
					try {
						const onlineData = parseCustomGlossaryFormat(response.responseText);

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
						const message = `已成功导入 ${glossaryName} 术语表，共 ${importedCount} 个词条。版本号：v${onlineData.metadata.version || '未知'}，维护者：${onlineData.metadata.maintainer || '未知'}。`;

						if (!silent) {
							notifyAndLog(message, '导入成功');
						}

						resolve({ success: true, name: glossaryName, message });

					} catch (e) {
						const message = `导入 ${glossaryName} 术语表失败：${e.message}`;
						if (!silent) notifyAndLog(message, '处理错误', 'error');
						resolve({ success: false, name: glossaryName, message });
					}
				},
				onerror: function () {
					const message = `下载 ${glossaryName} 术语表失败！请检查网络连接或链接。`;
					if (!silent) notifyAndLog(message, '网络错误', 'error');
					resolve({ success: false, name: glossaryName, message });
				}
			});
		});
	}

	/**
	 * 比较版本号的函数
	 */
	function compareVersions(v1, v2) {
		const parts1 = v1.split('.').map(Number);
		const parts2 = v2.split('.').map(Number);
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

		for (const url of urls) {
			try {
				const response = await new Promise((resolve, reject) => {
					const urlWithCacheBust = url + '?t=' + new Date().getTime();
					GM_xmlhttpRequest({ method: 'GET', url: urlWithCacheBust, onload: resolve, onerror: reject, ontimeout: reject });
				});

				if (response.status !== 200) {
					throw new Error(`服务器返回状态码: ${response.status}`);
				}

				const onlineData = parseCustomGlossaryFormat(response.responseText);
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
					currentMetadata[url] = { ...onlineData.metadata, last_updated: getShanghaiTimeString() };

					GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
					GM_setValue(GLOSSARY_METADATA_KEY, currentMetadata);
					invalidateGlossaryCache();

					Logger.info('数据', `术语表 ${glossaryName} 更新成功: v${localVersion} -> v${onlineVersion}`);
					GM_notification(`检测到术语表 ${glossaryName} 新版本，已自动更新至 v${onlineVersion} 。`, 'AO3 Translator');
				} else {
					Logger.info('数据', `术语表 ${glossaryName} 已是最新版本 (v${localVersion})`);
				}
			} catch (e) {
				Logger.warn('数据', `检查术语表更新失败 (${url})`, e.message);
			}
		}
	}

	/**
	 * 获取术语表规则，优先从缓存读取
	 */
	function getGlossaryRules() {
		const cache = GM_getValue(GLOSSARY_RULES_CACHE_KEY, null);
		const currentStateVersion = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);

		if (cache && cache.version === currentStateVersion && cache.rules) {
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

		Logger.info('数据', '缓存未命中或已失效，正在重建规则');
		return buildPrioritizedGlossaryMaps();
	}

	/**
	 * 获取已预处理并编译完成的术语表规则
	 */
	async function getPreparedGlossaryRules() {
		let currentStateVersion = GM_getValue(GLOSSARY_STATE_VERSION_KEY, 0);
		if (runtimePreparedGlossaryCache && runtimePreparedGlossaryCache.version === currentStateVersion) {
			Logger.info('数据', '命中术语表正则二级缓存');
			return runtimePreparedGlossaryCache.preparedRules;
		}
		Logger.info('数据', '二级缓存未命中，正在构建术语匹配策略');
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
				Logger.error('数据', `合并正则失败: ${e.message}`);
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
	 * 构建并排序所有术语表规则
	 */
	function buildPrioritizedGlossaryMaps() {
		const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
		const glossaryMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
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
			const sanitizedTrans = sanitizeTranslation(normalizedTerm, translation);
			let isLiteral = false;
			const literalMatch = normalizedTerm.match(/^["“‘'](.*)["”’']$/);
			if (literalMatch) {
				isLiteral = true;
				normalizedTerm = literalMatch[1].trim();
			} else if (quoteRegex.test(normalizedTerm)) {
				isLiteral = true;
				normalizedTerm = normalizedTerm.replace(/["“‘'”’]/g, '').trim();
			}
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
						Logger.warn('数据', `术语表 ${sourceName} 中的正则 "${normalizedTerm}" 匹配空字符串，已跳过以防止死循环`);
						return;
					}
				} catch (e) {
					Logger.error('数据', `术语表 ${sourceName} 中的正则 "${normalizedTerm}" 非法: ${e.message}`);
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
				if (termParts.length > 1) {
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
				} else {
					if (quoteRegex.test(normalizedTerm)) {
						const cleaned = normalizedTerm.replace(/["“‘'”’]/g, '').trim();
						const escaped = cleaned.replace(/([.*+?^${}()|[\]\\])/g, '\\$&');
						const prefix = /^[a-zA-Z0-9]/.test(cleaned) ? '\\b' : '';
						const suffix = /[a-zA-Z0-9]$/.test(cleaned) ? '\\b' : '';
						const flags = isSensitive ? 'g' : 'gi';
						ruleObject = {
							type: isForbidden ? 'forbidden' : 'term', matchStrategy: 'regex',
							regex: new RegExp(prefix + escaped + suffix, flags),
							replacement: isForbidden ? cleaned : sanitizedTrans,
							glossaryIndex, source: sourceName, originalTerm: normalizedTerm,
							sortLength: lengthBonus, isSensitive
						};
					} else {
						const forms = generateWordForms(normalizedTerm, { preserveCase: isForbidden, forceLowerCase: !isSensitive });
						const pattern = createSmartRegexPattern(forms);
						const flags = isSensitive ? 'g' : 'gi';
						ruleObject = {
							type: isForbidden ? 'forbidden' : 'term', matchStrategy: 'regex',
							regex: new RegExp(pattern, flags),
							replacement: isForbidden ? Array.from(forms)[0] : sanitizedTrans,
							glossaryIndex, source: sourceName, originalTerm: normalizedTerm,
							sortLength: lengthBonus, isSensitive
						};
					}
				}
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
		orderedGlossaries.forEach((glossary, index) => {
			const sourceName = glossary.sourceName;
			if (glossary.forbidden) {
				glossary.forbidden.split(/[,，]/).forEach(term => {
					tryAddRule(term, null, index, sourceName, true, true);
				});
			}
			(glossary.forbiddenTerms || []).forEach(term => {
				tryAddRule(term, null, index, sourceName, true, true);
			});
			if (glossary.sensitive) {
				glossary.sensitive.replace(/[，,]/g, '|||').split('|||').forEach(entry => {
					const normalizedEntry = entry.replace(/[：＝]/g, (match) => ({ '：': ':', '＝': '=' }[match]));
					const multiPartMatch = normalizedEntry.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
					if (multiPartMatch) {
						processEqualsSyntax(multiPartMatch[1], multiPartMatch[2], index, sourceName, true);
					} else {
						const singlePartMatch = normalizedEntry.match(/^\s*(.+?)\s*:\s*(.+?)\s*$/);
						if (singlePartMatch) {
							tryAddRule(singlePartMatch[1], singlePartMatch[2], index, sourceName, true, false);
						}
					}
				});
			}
			Object.entries(glossary.terms || {}).forEach(([k, v]) => tryAddRule(k, v, index, sourceName, true, false));
			Object.entries(glossary.multiPartTerms || {}).forEach(([k, v]) => processEqualsSyntax(k, v, index, sourceName, true));
			if (glossary.insensitive) {
				glossary.insensitive.replace(/[，,]/g, '|||').split('|||').forEach(entry => {
					const normalizedEntry = entry.replace(/[：＝]/g, (match) => ({ '：': ':', '＝': '=' }[match]));
					const multiPartMatch = normalizedEntry.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
					if (multiPartMatch) {
						processEqualsSyntax(multiPartMatch[1], multiPartMatch[2], index, sourceName, false);
					} else {
						const singlePartMatch = normalizedEntry.match(/^\s*(.+?)\s*:\s*(.+?)\s*$/);
						if (singlePartMatch) {
							tryAddRule(singlePartMatch[1], singlePartMatch[2], index, sourceName, false, false);
						}
					}
				});
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
			rules: serializedRules
		});
		Logger.info('数据', `术语表规则重建完成，当前版本: v${currentStateVersion}`);
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
			Logger.error('系统', message);
		} else {
			Logger.info('系统', message);
		}
	}

	/**
	 * sleepms 函数：延时。
	 */
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

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
		Logger.info('数据', '术语表规则缓存已失效');
	}

	/**
	 * getNestedProperty 函数：获取嵌套属性的安全函数。
	 * @param {Object} obj - 需要查询的对象
	 * @param {string} path - 属性路径
	 * @returns {*} - 返回嵌套属性的值
	 */
	function getNestedProperty(obj, path) {
		return path.split('.').reduce((acc, part) => {
			const match = part.match(/(\w+)(?:\[(\d+)\])?/);
			if (!match) return undefined;
			const key = match[1];
			const index = match[2];
			if (acc && typeof acc === 'object' && acc[key] !== undefined) {
				return index !== undefined ? acc[key][index] : acc[key];
			}
			return undefined;
		}, obj);
	}

	/**
	 * 翻译文本处理函数
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
		}

		clean(text) {
			if (!text || typeof text !== 'string') {
				return '';
			}

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
	 */
	function runDataMigration() {
		const CURRENT_MIGRATION_VERSION = 1;
		const savedVersion = GM_getValue('ao3_migration_version', 0);

		if (savedVersion >= CURRENT_MIGRATION_VERSION) {
			return;
		}

        {
            const newRules = GM_getValue(POST_REPLACE_RULES_KEY, null);
            if (newRules === null) {
                const oldString = GM_getValue(POST_REPLACE_STRING_KEY, '');
                if (oldString) {
                    const defaultRule = {
                        id: `replace_${Date.now()}`,
                        name: '默认',
                        content: oldString,
                        enabled: true
                    };
                    GM_setValue(POST_REPLACE_RULES_KEY, [defaultRule]);
                    GM_setValue(POST_REPLACE_SELECTED_ID_KEY, defaultRule.id);
                    GM_setValue(POST_REPLACE_EDIT_MODE_KEY, 'settings');
                } else {
                    const postReplaceData = GM_getValue(POST_REPLACE_MAP_KEY, null);
                    if (postReplaceData && typeof postReplaceData === 'object' && !postReplaceData.hasOwnProperty('singleRules')) {
                        GM_setValue(POST_REPLACE_MAP_KEY, {
                            singleRules: postReplaceData,
                            multiPartRules: []
                        });
                    }
                }
            }
        }

        {
            const newGlossaries = GM_getValue(CUSTOM_GLOSSARIES_KEY, null);
            if (newGlossaries !== null) {
                let changed = false;
                newGlossaries.forEach(g => {
                    if (typeof g.enabled === 'undefined') {
                        g.enabled = true;
                        changed = true;
                    }
                });
                if (changed) {
                    GM_setValue(CUSTOM_GLOSSARIES_KEY, newGlossaries);
                }
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
                    if (Array.isArray(oldForbiddenArray)) {
                        finalForbidden = oldForbiddenArray.join(', ');
                    }
                }

                if (finalSensitive || finalForbidden) {
                    const defaultGlossary = {
                        id: `local_${Date.now()}`,
                        name: '默认',
                        sensitive: finalSensitive || '',
                        insensitive: '',
                        forbidden: finalForbidden || '',
                        enabled: true
                    };
                    GM_setValue(CUSTOM_GLOSSARIES_KEY, [defaultGlossary]);
                }

                ['ao3_local_glossary_string', 'ao3_local_forbidden_string', 'ao3_local_glossary',
                    'ao3_translation_glossary', 'ao3_local_forbidden_terms'].forEach(key => GM_deleteValue(key));
            }
        }

        {
            const servicesToMigrate = ['zhipu_ai', 'deepseek_ai', 'groq_ai', 'together_ai', 'cerebras_ai', 'modelscope_ai'];
            servicesToMigrate.forEach(serviceName => {
                const oldKeyName = `${serviceName.split('_')[0]}_api_key`;
                const newStringKey = `${serviceName}_keys_string`;
                const newArrayKey = `${serviceName}_keys_array`;

                const oldKeyValue = GM_getValue(oldKeyName);
                if (oldKeyValue && GM_getValue(newStringKey) === undefined) {
                    GM_setValue(newStringKey, oldKeyValue);
                    const keysArray = oldKeyValue.replace(/[，]/g, ',').split(',').map(k => k.trim()).filter(Boolean);
                    GM_setValue(newArrayKey, keysArray);
                    GM_deleteValue(oldKeyName);
                }
            });

            const oldChatglmKey = GM_getValue('chatglm_api_key');
            if (oldChatglmKey && GM_getValue('zhipu_ai_keys_string') === undefined) {
                GM_setValue('zhipu_ai_keys_string', oldChatglmKey);
                GM_setValue('zhipu_ai_keys_array', [oldChatglmKey]);
                GM_deleteValue('chatglm_api_key');
            }
        }

        {
            const oldKeysArray = GM_getValue('google_ai_keys_array');
            const newKeysString = GM_getValue('google_ai_keys_string');
            if (Array.isArray(oldKeysArray) && !newKeysString) {
                GM_setValue('google_ai_keys_string', oldKeysArray.join(', '));
            }
        }

        {
            const modelKey = 'google_ai_model';
            const currentModel = GM_getValue(modelKey);
            const migrationMap = {
                'gemini-2.5-flash': 'gemini-flash-latest',
                'gemini-2.5-flash-lite': 'gemini-flash-lite-latest'
            };
            if (currentModel && migrationMap[currentModel]) {
                GM_setValue(modelKey, migrationMap[currentModel]);
            }
        }

        {
            const sysPrompt = GM_getValue('custom_ai_system_prompt');
            if (typeof sysPrompt === 'string' && sysPrompt.includes('${')) {
                GM_setValue('custom_ai_system_prompt', sysPrompt.replace(/\$\{/g, '{'));
            }
        }

        {
            const targetThresholds = '10, 0.8, 10, 5';
            const globalKey = 'custom_ai_validation_thresholds';
            GM_setValue(globalKey, targetThresholds);

            const profiles = GM_getValue(AI_PROFILES_KEY);
            if (Array.isArray(profiles)) {
                let changed = false;
                profiles.forEach(p => {
                    if (p.params) {
                        p.params.validation_thresholds = targetThresholds;
                        changed = true;
                    }
                });
                if (changed) {
                    GM_setValue(AI_PROFILES_KEY, profiles);
                }
            }
        }

        const keysToCheck = [
            { key: 'enable_RegExp', default: DEFAULT_CONFIG.GENERAL.enable_RegExp },
            { key: 'enable_transDesc', default: DEFAULT_CONFIG.GENERAL.enable_transDesc },
            { key: 'enable_ui_trans', default: DEFAULT_CONFIG.GENERAL.enable_ui_trans },
            { key: 'show_fab', default: DEFAULT_CONFIG.GENERAL.show_fab },
            { key: 'enable_debug_mode', default: DEFAULT_CONFIG.GENERAL.enable_debug_mode },
            { key: 'translation_display_mode', default: DEFAULT_CONFIG.GENERAL.translation_display_mode },
            { key: 'from_lang', default: DEFAULT_CONFIG.GENERAL.from_lang },
            { key: 'to_lang', default: DEFAULT_CONFIG.GENERAL.to_lang },
            { key: 'lang_detector', default: DEFAULT_CONFIG.GENERAL.lang_detector },
            { key: 'transEngine', default: DEFAULT_CONFIG.ENGINE.current },
            { key: 'custom_url_first_save_done', default: DEFAULT_CONFIG.GENERAL.custom_url_first_save_done }
        ];

        let cleanedCount = 0;
        keysToCheck.forEach(item => {
            const currentValue = GM_getValue(item.key);
            if (currentValue === item.default) {
                GM_deleteValue(item.key);
                cleanedCount++;
            }
        });
        Logger.info('系统', `配置清理完成，移除了 ${cleanedCount} 个未修改的默认设置`);

		GM_setValue('ao3_migration_version', CURRENT_MIGRATION_VERSION);
	}

	/**
	 * 脚本主入口
	 */
	function main() {
		if (window.top !== window.self) {
			return;
		}
		if (window.ao3_translator_running) {
			Logger.warn('系统', '检测到脚本重复执行，已拦截');
			return;
		}
		window.ao3_translator_running = true;

		Logger.info('系统', `插件初始化完成，当前版本：v${GM_info.script.version}`);

		ProfileManager.init();
		FormattingManager.init();
		runDataMigration();
		updateBlockerCache();
		checkForGlossaryUpdates();

		const fabElements = createFabUI();
		const panelElements = createSettingsPanelUI();
		let rerenderMenu;
		let fabLogic;

		const handlePanelClose = () => {
			if (fabLogic) {
				fabLogic.retractFab();
			}
		};

		const panelLogic = initializeSettingsPanelLogic(panelElements, () => rerenderMenu(), handlePanelClose);
		fabLogic = initializeFabInteraction(fabElements, panelLogic);

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
			}
			else if (link.rel && link.rel.includes('author')) {
				addBlockRule('ao3_blocker_content_author', text);
				added = true;
			}
			else if (link.classList.contains('tag')) {
				addBlockRule('ao3_blocker_tags_black', `'${text}'`);
				added = true;
			}

			if (added) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				link.style.pointerEvents = 'none';
				setTimeout(() => { link.style.pointerEvents = ''; }, 100);
				refreshBlocker('incremental');
			}
		}, true);

		const globalStyles = document.createElement('style');
		globalStyles.textContent = `
            .autocomplete.dropdown p.notice {
                margin-bottom: 0;
            }
            .translated-by-ao3-translator, .translated-by-ao3-translator-error {
                margin-top: 15px;
                margin-bottom: 15px;
            }
            li.post .userstuff {
                margin-bottom: 15px;
            }
            li.post .userstuff .translated-by-ao3-translator {
                margin-bottom: 0;
            }
            .translate-me-ao3-wrapper {
                border: none;
                background: transparent;
                box-shadow: none;
                margin-top: 15px;
                margin-bottom: 5px;
                clear: both;
                display: block;
            }
            .translate-me-ao3-button {
                color: #1b95e0;
                font-size: small;
                cursor: pointer;
                display: inline-block;
                margin-left: 10px;
            }
            .translated-tags-container {
                margin-top: 15px;
                margin-bottom: 10px;
            }
            p.kudos {
                line-height: 1.5;
            }
            .retry-translation-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                vertical-align: middle;
                margin-left: 8px;
                cursor: pointer;
                color: #1b95e0;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
            }
            .retry-translation-button:hover {
                color: #0d8bd9;
            }
            .retry-translation-button:active {
                opacity: 0.7;
            }
            .retry-translation-button svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
        `;
		document.head.appendChild(globalStyles);
		if (document.documentElement.lang !== CONFIG.LANG) {
			document.documentElement.lang = CONFIG.LANG;
		}
		new MutationObserver(() => {
			if (document.documentElement.lang !== CONFIG.LANG && document.documentElement.lang.toLowerCase().startsWith('en')) {
				document.documentElement.lang = CONFIG.LANG;
			}
		}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
		updatePageConfig('初始载入');

		scanAllWorks();

		if (pageConfig.currentPageType) {
			if (FeatureSet.enable_ui_trans) {
				transTitle();
				transBySelector();
				traverseNode(document.body);
				runHighPriorityFunctions();
			}
			fabLogic.toggleFabVisibility();
			if (FeatureSet.enable_transDesc) {
				setTimeout(transDesc, 1000);
			}
		}
		rerenderMenu = setupMenuCommands(fabLogic, panelLogic);
		rerenderMenu();
		watchUpdate(fabLogic);
	}

	/**
	 * 监视页面变化
	 */
	function watchUpdate(fabLogic) {
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
				if (FeatureSet.enable_transDesc) {
					transDesc();
				}
			}
		};

		const processMutations = mutations => {
			if (BlockerCache.enabled) {
				let hasNewBlurbs = false;
				for (const mutation of mutations) {
					if (mutation.type === 'childList') {
						for (const node of mutation.addedNodes) {
							if (node.nodeType === 1) {
								if (node.classList.contains('blurb') || node.querySelector('li.blurb')) {
									hasNewBlurbs = true;
									break;
								}
							}
						}
					}
					if (hasNewBlurbs) break;
				}
				if (hasNewBlurbs) {
					checkWorksSynchronously();
				}
			}

			const nodesToProcess = mutations.flatMap(({ target, addedNodes, type }) => {
				if (type === 'childList' && addedNodes.length > 0) {
					return Array.from(addedNodes);
				}
				if (type === 'attributes' || (type === 'characterData' && pageConfig.characterData)) {
					return [target];
				}
				return [];
			});

			if (nodesToProcess.length === 0) return;

			const uniqueNodes = [...new Set(nodesToProcess)];
			uniqueNodes.forEach(node => {
				if (node.nodeType === Node.ELEMENT_NODE || node.parentElement) {
					if (FeatureSet.enable_ui_trans) {
						traverseNode(node);
						runHighPriorityFunctions(node.parentElement || node);
					}
				}
			});

			fabLogic.toggleFabVisibility();
			if (FeatureSet.enable_transDesc) {
				transDesc();
			}
		};

		const observer = new MutationObserver(mutations => {
			handleUrlChange();
			if (window.location.href === previousURL) {
				processMutations(mutations);
			}
		});

		observer.observe(document.documentElement, { ...CONFIG.OBSERVER_CONFIG, subtree: true });
	}

	/**
	 * 辅助函数：集中调用所有高优先级专用函数
	 * @param {HTMLElement} [rootElement=document] - 扫描范围
	 */
	function runHighPriorityFunctions(rootElement = document) {
		if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
			return;
		}
		const innerHTMLRules = pageConfig.innerHTMLRules || [];
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

		// 通用的后处理和格式化函数
		handleTrailingPunctuation(rootElement);
		translateSymbolsKeyModal(rootElement);
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
		translateHeadingTags();
		// 统一寻找并重新格式化所有日期容器
		const dateSelectors = [
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
		rootElement.querySelectorAll(dateSelectors.join(', '))
			.forEach(reformatDateInElement);
		// 根据当前页面类型，调用页面专属的翻译和处理函数
		const pageType = pageConfig.currentPageType;

		if (pageType === 'about_page') {
			translateAboutPage();
		}

		if (pageType === 'diversity_statement') {
			translateDiversityStatement();
		}

		if (pageType === 'donate_page') {
			translateDonatePage();
		}

		if (pageType === 'tag_sets_new' || pageType === 'collections_dashboard_common') {
			reorderCategoryCheckboxes();
		}

		if (pageType === 'front_page') {
			translateFrontPageIntro();
		}

		if (pageType === 'invite_requests_index') {
			translateInvitationRequestsPage();
		}

		if (pageType === 'error_too_many_requests') {
			translateTooManyRequestsPage();
		}

		if (pageType === 'works_search') {
			translateWorkSearchDateTips();
			translateWorkSearchCrossoverTips();
			translateWorkSearchNumericalTips();
			translateWorkSearchLanguageTips();
			translateWorkSearchTagsTips();
		}

		if (pageType === 'people_search') {
			translatePeopleSearchTips();
		}

		if (pageType === 'bookmarks_search') {
			translateBookmarkSearchWorkTagsTips();
			translateBookmarkSearchTypeTips();
			translateBookmarkSearchDateUpdatedTips();
			translateBookmarkSearchBookmarkerTagsTips();
			translateBookmarkSearchRecTips();
			translateBookmarkSearchNotesTips();
			translateBookmarkSearchDateBookmarkedTips();
		}

		if (pageType === 'tags_search') {
			translateTagSearchTips();
		}

		if (pageType === 'users_stats') {
			translateStatsChart();
		}
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

		return {
			currentPageType: pageType,
			staticDict: mergedStatic,
			regexpRules: mergedRegexp,
			innerHTMLRules: mergedInnerHTMLRegexp,
			globalFlexibleDict: globalFlexible,
			pageFlexibleDict: mergedPageFlexible,
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

		if (rootNode.nodeType === Node.TEXT_NODE) {
			if (rootNode.nodeValue && rootNode.nodeValue.length <= 1000) {
				if (rootNode.parentElement && rootNode.parentElement.closest(pageConfig.ignoreSelectors)) {
					return;
				}
				transElement(rootNode, 'nodeValue');
			}
			return;
		}

		if (rootNode.nodeType === Node.ELEMENT_NODE && rootNode.closest(pageConfig.ignoreSelectors)) {
			return;
		}

		const treeWalker = document.createTreeWalker(
			rootNode,
			NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
			node => {
				if (node.nodeType === Node.ELEMENT_NODE && node.closest(pageConfig.ignoreSelectors)) {
					return NodeFilter.FILTER_REJECT;
				}
				if (node.nodeType === Node.TEXT_NODE && node.parentElement && node.parentElement.closest(pageConfig.ignoreSelectors)) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		);

		const handleElement = node => {
			switch (node.tagName) {
				case 'INPUT':
				case 'TEXTAREA':
					if (['button', 'submit', 'reset'].includes(node.type)) {
						transElement(node.dataset, 'confirm');
						transElement(node, 'value');
					} else {
						transElement(node, 'placeholder');
						transElement(node, 'title');
					}
					break;
				case 'OPTGROUP':
					transElement(node, 'label');
					break;
				case 'BUTTON':
					transElement(node, 'title');
					transElement(node.dataset, 'confirm');
					transElement(node.dataset, 'confirmText');
					transElement(node.dataset, 'confirmCancelText');
					transElement(node.dataset, 'disableWith');
					break;
				case 'A':
					transElement(node, 'title');
					transElement(node.dataset, 'confirm');
					break;
				case 'SPAN':
				case 'DIV':
				case 'P':
				case 'LI':
				case 'DD':
				case 'DT':
				case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
					transElement(node, 'title');
					break;
				case 'IMG':
					transElement(node, 'alt');
					break;
				default:
					if (node.hasAttribute('aria-label')) transElement(node, 'ariaLabel');
					if (node.hasAttribute('title')) transElement(node, 'title');
					break;
			}
		};

		const handleTextNode = node => {
			if (node.nodeValue && node.nodeValue.length <= 1000) {
				transElement(node, 'nodeValue');
			}
		};

		const handlers = {
			[Node.ELEMENT_NODE]: handleElement,
			[Node.TEXT_NODE]: handleTextNode
		};

		let currentNode;
		while ((currentNode = treeWalker.nextNode())) {
			handlers[currentNode.nodeType]?.(currentNode);
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
		const originalText = text;
		let translatedText = text;

		const applyFlexibleDict = (targetText, dict) => {
			if (!dict) return targetText;
			const keys = Object.keys(dict);
			if (keys.length === 0) return targetText;

			const regexParts = keys.map(key => {
				const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				if (/^[\w\s]+$/.test(key)) {
					return `\\b${escapedKey}\\b`;
				} else {
					return escapedKey;
				}
			});
			const flexibleRegex = new RegExp(`(${regexParts.join('|')})`, 'g');

			if (el && el.nodeType === Node.TEXT_NODE && el.parentElement && el.parentElement.matches('h2.heading a.tag')) {
				const fullTagText = el.parentElement.textContent.trim();
				if (dict[fullTagText]) {
					return targetText.replace(fullTagText, dict[fullTagText]);
				} else {
					return targetText;
				}
			}

			return targetText.replace(flexibleRegex, (matched) => dict[matched] || matched);
		};

		translatedText = applyFlexibleDict(translatedText, pageConfig.pageFlexibleDict);
		translatedText = applyFlexibleDict(translatedText, pageConfig.globalFlexibleDict);

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
					if (typeof replacement === 'function') {
						translatedText = translatedText.replace(pattern, replacement);
					} else {
						translatedText = translatedText.replace(pattern, replacement);
					}
				}
			}
		}
		return translatedText !== originalText ? translatedText : false;
	}

	/**
	 * transBySelector 函数：通过 CSS 选择器找到页面上的元素，并将其文本内容替换为预定义的翻译。
	 */
	function transBySelector() {
		if (!pageConfig.tranSelectors) return;
		pageConfig.tranSelectors.forEach(rule => {
			if (!Array.isArray(rule) || rule.length !== 2) return;
			const [selector, translatedText] = rule;
			try {
				const elements = document.querySelectorAll(selector);
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
	 * 主翻译入口函数
	 */
	function transDesc() {
		if (!FeatureSet.enable_transDesc) {
			return;
		}

		const universalRules = [
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
            { selector: '#admin-banner blockquote.userstuff', text: '翻译公告', insertInside: true },
		];

		const pageSpecificRules = {
			'works_show': [
				{ selector: '#chapters > .userstuff', text: '翻译正文', above: true, isLazyLoad: true },
				{ selector: '#chapters > .chapter > .userstuff[role="article"]', text: '翻译正文', above: true, isLazyLoad: true }
			],
			'works_chapters_show': [
				{ selector: '#chapters > .userstuff', text: '翻译正文', above: true, isLazyLoad: true },
				{ selector: '#chapters > .chapter > .userstuff[role="article"]', text: '翻译正文', above: true, isLazyLoad: true }
			],
			'admin_posts_show': [
				{ selector: 'div[role="article"] > .userstuff', text: '翻译动态', above: true, isLazyLoad: false }
			],
			'admin_posts_index': [
				{ selector: '.admin_posts-index div[role="article"] > .userstuff', text: '翻译动态', above: true, isLazyLoad: false }
			],
			'tos_page': [
				{ selector: '#tos.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'content_policy_page': [
				{ selector: '#content.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'privacy_policy_page': [
				{ selector: '#privacy.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'dmca_policy_page': [
				{ selector: '#DMCA.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'tos_faq_page': [
				{ selector: '.admin.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'wrangling_guidelines_page': [
				{ selector: '.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'faq_page': [
				{ selector: '.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'known_issues_page': [
				{ selector: '.admin.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			],
			'report_and_support_page': [
				{ selector: '.userstuff', text: '翻译内容', above: true, isLazyLoad: true }
			]
		};

		const applyRules = (rules) => {
			rules.forEach(rule => {
				if (rule.selector === 'ul.tags.commas' && (pageConfig.currentPageType === 'admin_posts_show' || pageConfig.currentPageType === 'admin_posts_index')) {
					return;
				}

				document.querySelectorAll(rule.selector).forEach(element => {
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

		applyRules(universalRules);

		const currentSpecificRules = pageSpecificRules[pageConfig.currentPageType];
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

	/**************************************************************************
	 * I18N 翻译数据区
	 **************************************************************************/

	const I18N = {
		'conf': {
			ignoreMutationSelectorPage: {
				'*': ['.userstuff .revised.at', '.kudos_count', '.bookmark_count', '.comment_count', '.hit_count', '.view_count'],
				'works_show': ['.stats .hits', '.stats .kudos'],
			},
			ignoreSelectorPage: {
				'*': ['script', 'style', 'noscript', 'iframe', 'canvas', 'video', 'audio', 'img', 'svg', 'pre', 'code', '.userstuff.workskin', '.workskin', 'div.autocomplete.dropdown ul', 'dd.freeform.tags', '[data-translated-by-custom-function]', 'li.freeforms', 'blockquote.userstuff.summary', 'textarea#embed_code', '.header.module h4.heading a[href^="/series/"]', '.header.module h4.heading a[href^="/works/"]', '.header.module h4.heading a[rel="author"]', '.header.module h5.fandoms a.tag', 'ul.series a[href^="/series/"]', 'dd.series a[href^="/series/"]'],
				'works_show': ['.dropdown.actions-menu ul', '#main .userstuff'],
				'works_chapters_show': ['#main .userstuff'],
				'series_show': ['h2.heading'],
				'admin_posts_show': ['.userstuff'],
				'tag_sets_index': ['h2.heading', 'dl.stats'],
				'tag_sets_new': ['h4.heading > label[for*="freeform"]'],
				'faq_page': ['.userstuff', '.faq.index.group'],
				'wrangling_guidelines_page': ['.userstuff'],
				'tos_page': ['#tos.userstuff'],
				'content_policy_page': ['#content.userstuff'],
				'privacy_policy_page': ['#privacy.userstuff'],
				'dmca_policy_page': ['#DMCA.userstuff'],
				'tos_faq_page': ['.admin.userstuff'],
				'abuse_reports_new': ['.userstuff'],
				'support_page': ['.userstuff'],
				'known_issues_page': ['.admin.userstuff'],
				'report_and_support_page': ['.userstuff'],
			},
			characterDataPage: ['common', 'works_show', 'users_dashboard'],
			rePagePath: /^\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/
		},
		'zh-CN': {
			'title': {
				'static': {},
				'regexp': []
			},
			'public': {
				'static': {

					// 基本
					'Archive of Our Own': 'AO3 作品库',
					'Fandoms': '同人圈', 'All Fandoms': '所有同人圈',
					'Browse': '浏览', 'Works': '作品', 'Bookmarks': '书签', 'Tags': '标签', 'Collection': '合集', 'Collections': '合集',
					'Search': '搜索', 'People': '用户',
					'About': '关于', 'About Us': '关于我们', 'News': '新的动态', 'FAQ': '常见问题', 'Wrangling Guidelines': '整理指南', 'Donate or Volunteer': '捐赠/志愿',
					'Recent Works': '最近作品',
					'Recent Series': '最近系列',
					'Recent Bookmarks': '最近书签', 'Collections:': '合集:',
					'Bookmarker\'s Tags:': '书签创建者的标签：', 'Bookmarker\'s Collections:': '书签创建者的合集：', 'Completed': '已完结',
					'Bookmark Tags:': '书签标签：', 'Complete Work': '已完结', 'Work in Progress': '连载中', 'Public Bookmark': '公开书签',
					'Most Popular': '最常用', 'Tag Sets': '标签集',
					'Warnings': '预警',
					'Find your favorites': '寻找喜欢的内容',

					// 登录
					'Log In': '登录',
					'Log in': '登录',
					'Sign Up': '注册',
					'User': '用户',
					'Username or email:': '用户名或邮箱:',
					'Password:': '密码:',
					'Remember Me': '记住我',
					'Remember me': '记住我',
					'Forgot password?': '忘记密码?',
					'Get an Invitation': '获取邀请',

					// 忘记密码
					'Forgotten your password?': '忘记您的密码了吗？',
					'If you\'ve forgotten your password, we can send instructions that will allow you to reset it. Please tell us the username or email address you used when you signed up for your Archive account.': '如果您忘记了密码，我们可以发送允许您重置密码的邮件说明。请输入您注册 AO3 帐户时使用的用户名或电子邮箱地址。',
					'Reset Password': '重置密码',

					// 星期
					'Mon': '周一',
					'Tue': '周二',
					'Wed': '周三',
					'Thu': '周四',
					'Fri': '周五',
					'Sat': '周六',
					'Sun': '周日',
					'Monday': '星期一',
					'Tuesday': '星期二',
					'Wednesday': '星期三',
					'Thursday': '星期四',
					'Friday': '星期五',
					'Saturday': '星期六',
					'Sunday': '星期日',

					// 月份
					'Jan': '1月',
					'Feb': '2月',
					'Mar': '3月',
					'Apr': '4月',
					'May': '5月',
					'Jun': '6月',
					'Jul': '7月',
					'Aug': '8月',
					'Sep': '9月',
					'Oct': '10月',
					'Nov': '11月',
					'Dec': '12月',
					'January': '1月',
					'February': '2月',
					'March': '3月',
					'April': '4月',
					'May': '5月',
					'June': '6月',
					'July': '7月',
					'August': '8月',
					'September': '9月',
					'October': '10月',
					'November': '11月',
					'December': '12月',

					// 页脚
					'Footer': '页脚',
					'Customize': '自定义',
					'Default': '默认界面',
					'Low Vision Default': '低视力默认界面',
					'Reversi': 'Reversi 界面',
					'Snow Blue': 'Snow Blue 界面',
					'About the Archive': '关于 Archive',
					'Site Map': '站点地图',
					'Diversity Statement': '多元化声明',
					'Terms of Service': '服务条款',
					'Content Policy': '内容政策',
					'Privacy Policy': '隐私政策',
					'DMCA Policy': 'DMCA 政策',
					'Site Status': '站点状态',
					'TOS FAQ': '服务条款常见问题',
					'↑ Top': '↑ 回到顶部',
					'Frequently Asked Questions': '常见问题',
					'Contact Us': '联系我们',
					'Policy Questions & Abuse Reports': '政策咨询与滥用举报',
					'Technical Support & Feedback': '技术支持与反馈',
					'Development': '开发',
					'Known Issues': '已知问题',
					'View License': '查看许可证',
					'OTW': 'OTW',
					'Organization for Transformative Works': '再创作组织',

					// 反馈
					'Support and Feedback': '支持与反馈',
					'FAQs & Tutorials': '常见问题与教程',
					'Release Notes': '更新日志',

					// 动态
					'News': '最新动态',
					'All News': '全部动态',
					'Published': '发布于',
					'Comments': '评论',
					'Read more...': '更多',
					'Tag:': '标签：',
					'Go': '确定',
					'RSS Feed': 'RSS 订阅',
					'Follow us': '关注我们',
					'What\'s New': '新增内容',
					'Enter Comment': '输入评论',
					'Last Edited': '最后编辑',

					// 同人圈
					'Anime & Manga': '动漫及漫画', 'Books & Literature': '书籍及文学', 'Cartoons & Comics & Graphic Novels': '卡通，漫画及图像小说', 'Celebrities & Real People': '明星及真人', 'Movies': '电影', 'Music & Bands': '音乐及乐队', 'Other Media': '其她媒体', 'Theater': '戏剧', 'TV Shows': '电视剧', 'Video Games': '电子游戏', 'Uncategorized Fandoms': '未分类的同人圈',
					'> Anime & Manga': ' > 动漫及漫画', '> Books & Literature': ' > 书籍及文学', '> Cartoons & Comics & Graphic Novels': ' > 卡通，漫画及图像小说', '> Celebrities & Real People': ' > 明星及真人', '> Movies': ' > 电影', '> Music & Bands': ' > 音乐及乐队', '> Other Media': ' > 其她媒体', '> Theater': ' > 戏剧', '> TV Shows': ' > 电视剧', '> Video Games': ' > 电子游戏', '> Uncategorized Fandoms': ' > 未分类的同人圈',

					// 个人中心
					'My Dashboard': '个人中心',
					'My Subscriptions': '订阅列表',
					'My History': '历史记录',
					'My Preferences': '偏好设置',
					'Dashboard': '仪表盘',
					'Preferences': '偏好设置',
					'Skins': '站点界面',
					'Works in Collections': '合集中的作品',
					'Drafts': '草稿',
					'Please note:': '注意：',
					'Unposted drafts are only saved for a month from the day they are first created, and then deleted from the Archive.': '未发布的草稿自创建日起仅保留一个月，之后将被从 Archive 中删除。',
					'Series': '系列',
					'Bookmark External Work': '为外部作品创建书签',
					'Sorry, there were no collections found.': '抱歉，未找到任何合集。',
					'Manage Collection Items': '管理合集',
					'New Collection': '新建合集',
					'Works in Challenges/Collections': '参与挑战/合集的作品',
					'Awaiting Collection Approval': '等待合集方审核',
					'Awaiting User Approval': '等待用户确认',
					'Rejected by Collection': '合集方已拒绝',
					'Rejected by User': '用户已拒绝',
					'Approved': '已通过',
					'Nothing to review here!': '当前无待审内容！',
					'Inbox': '消息中心',
					'Filter by read': '按阅读状态筛选',
					'Show all': '显示全部',
					'Show unread': '显示未读',
					'Show read': '显示已读',
					'Filter by replied to': '按回复状态筛选',
					'Show all': '显示全部',
					'Show without replies': '显示未回复',
					'Show replied to': '显示已回复',
					'Sort by date': '按日期排序',
					'Newest first': '最新优先',
					'Oldest first': '最早优先',
					'Filter': '筛选',
					'Statistics': '数据统计',
					'History': '历史记录',
					'Full History': '全部历史记录',
					'Marked for Later': '稍后阅读',
					'Is it later already?': '到“稍后”了吗？',
					'Some works you\'ve marked for later.': '这里是您标记为稍后阅读的作品。',
					'Clear History': '清空历史记录',
					'Delete from History': '删除历史记录',
					'Subscriptions': '订阅列表',
					'All Subscriptions': '所有订阅',
					'Series Subscriptions': '系列订阅',
					'User Subscriptions': '用户订阅',
					'Work Subscriptions': '作品订阅',
					'My Series Subscriptions': '系列订阅',
					'My User Subscriptions': '用户订阅',
					'My Work Subscriptions': '作品订阅',
					'Delete All Work Subscriptions': '删除所有作品订阅',
					'Delete All Series Subscriptions': '删除所有系列订阅',
					'Delete All User Subscriptions': '删除所有用户订阅',
					'Yes, Delete All Subscriptions': '是的，删除所有订阅',
					'Yes, Delete All Work Subscriptions': '是的，删除所有作品订阅',
					'Yes, Delete All Series Subscriptions': '是的，删除所有系列订阅',
					'Yes, Delete All User Subscriptions': '是的，删除所有用户订阅',
					'Your subscriptions have been deleted.': '您的订阅已成功删除。',
					'Unsubscribe': '取消订阅',
					'Delete All Subscriptions': '删除所有订阅',
					'Sign-ups': '报名挑战',
					'Assignments': '任务中心',
					'Unfulfilled Claims': '未完成的认领',
					'Fulfilled Claims': '已完成的认领',
					'Claims': '我的认领',
					'Related Works': '相关作品',
					'Gifts': '赠文',
					'Accepted Gifts': '已接受的赠文',
					'Refused Gifts': '已拒绝的赠文',
					'Choices': '用户选项',
					'Pitch': '创作与发布',
					'Catch': '互动与追踪',
					'Switch': '活动与交换',
					'My Works': '我的作品',
					'My Series': '我的系列',
					'My Bookmarks': '我的书签',
					'My Collections': '我的合集',
					'History': '历史记录',
					'Log Out': '登出',
					'Post New': '发布新作',
					'Edit Works': '编辑作品',
					'Subscribe': '订阅',
					'Invitations': '邀请',
					'My pseuds:': '笔名：',
					'Name (required)': '名称（必填）',
					'Create Pseud': '创建笔名',
					'Edit Pseud': '编辑笔名',
					'Back To Pseuds': '返回笔名列表',
					'Pseuds': '笔名',
					'Pseud was successfully created.': '笔名已成功创建。',
					'I joined on:': '加入于：',
					'My user ID is:': '用户ID：',
					'Edit My Works': '编辑作品',
					'Edit My Profile': '编辑资料',
					'Set My Preferences': '设置偏好',
					'Manage My Pseuds': '管理笔名',
					'Delete My Account': '删除账号',
					'Blocked Users': '已屏蔽用户',
					'Muted Users': '已静音用户',
					'Change Username': '修改用户名',
					'Change Password': '修改密码',
					'Email address': '邮箱地址',
					'Change Email': '修改邮箱',
					'Privacy': '隐私设置',
					'Show my email address to other people.': '向其她人显示我的邮箱地址',
					'Show my date of birth to other people.': '向其她人显示我的出生日期',
					'Hide my work from search engines when possible.': '尽可能地对搜索引擎隐藏我的作品',
					'Hide the share buttons on my work.': '隐藏我作品中的分享按钮',
					'Allow others to invite me to be a co-creator.': '允许其她人邀请我成为共同创作者',
					'Display': '显示设置',
					'Show me adult content without checking.': '无需确认即可显示成人内容',
					'Show the whole work by default.': '默认显示全文',
					'Hide warnings (you can still choose to show them).': '隐藏内容预警（仍可手动显示）',
					'Hide additional tags (you can still choose to show them).': '隐藏附加标签（仍可手动显示）',
					'Hide work skins (you can still choose to show them).': '隐藏作品界面（仍可手动显示）',
					'Your site skin': '您的站点界面',
					'Public Site Skins': '公共站点界面',
					'Your time zone': '您所在的时区',
					'Browser page title format': '浏览页面标题格式',
					'Turn off emails about comments.': '关闭评论邮件通知',
					'Turn off messages to your inbox about comments.': '关闭评论消息通知',
					'Turn off copies of your own comments.': '关闭自己评论的副本通知',
					'Turn off emails about kudos.': '关闭点赞邮件通知',
					'Do not allow guests to reply to my comments on news posts or other users\' works (you can still control the comment settings for your works separately).': '不允许游客回复我在动态帖或其她用户作品中的评论（仍可单独调整自己作品的评论权限）',
					'Collections, Challenges and Gifts': '合集、挑战与赠文设置',
					'Allow others to invite my works to collections.': '允许其她人将我的作品加入合集',
					'Allow anyone to gift me works.': '允许任何人向我赠送作品',
					'Turn off emails from collections.': '关闭来自合集的邮件通知',
					'Turn off inbox messages from collections.': '关闭来自合集的消息通知',
					'Turn off emails about gift works.': '关闭有关赠文的邮件通知',
					'Misc': '其她偏好设置',
					'Turn on History.': '启用历史记录',
					'Turn the new user help banner back on.': '重新显示新用户帮助横幅',
					'Turn off the banner showing on every page.': '关闭每个页面的提示横幅',
					'Update': '确定',
					'My Site Skins': '我的站点界面',
					'Create Site Skin': '创建站点界面',
					'A site skin lets you change the way the Archive is presented when you are logged in to your account. You can use work skins to customize the way your own works are shown to others.': '站点界面可让您在登录账户后更改 Archive 的呈现方式。您也可以使用作品界面来自定义其她人查看您作品时的展示样式。',
					'My Site Skins': '我的站点界面',
					'My Work Skins': '我的作品界面',
					'Public Work Skins': '公共作品界面',
					'Create Work Skin': '创建作品界面',
					'No site skins here yet!': '还没有站点界面！',
					'No work skins here yet!': '还没有作品界面！',
					'Why not try making one?': '为什么不试着去创建一个呢？',
					'Inbox': '收件箱',
					'Subscribed Works': '已订阅作品',
					'Subscribed Series': '已订阅系列',
					'Unposted Assignments': '未发布的任务',
					'Completed Assignments': '已完成的任务',

					// 合集管理与设置
					'Creator/Pseud(s)': '创作者/笔名',
					'Details ↓': '详情 ↓',
					'Close Details ↑': '收起详情 ↑',
					'Bookmarker approval status': '书签创建者审核状态',
					'Unreviewed by bookmarker': '书签创建者未审核',
					'Approved by bookmarker': '书签创建者已通过',
					'Rejected by bookmarker': '书签创建者已拒绝',
					'Collection approval status': '合集审核状态',
					'Unreviewed by collection moderators': '合集管理员未审核',
					'Approved by collection moderators': '合集管理员已通过',
					'Rejected by collection moderators': '合集管理员已拒绝',
					'Remove': '移除',
					'Owner pseud(s)': '所有者笔名',
					'Collection Tags': '合集标签',
					'Enter up to 10 tags to describe the content of your collection.': '最多输入 10 个标签来描述您的合集内容。',
					'Use this if your collection is not fandom-specific.': '如果您的合集不针对特定同人圈，请使用此项。',

					// 作品搜索页
					'Work Info': '作品信息',
					'Date Posted': '发布日期',
					'Date Updated': '更新日期',
					'Completion status': '完成状态',
					'All works': '所有作品',
					'Complete works only': '仅完结作品',
					'Works in progress only': '仅连载作品',
					'Include crossovers': '包含跨圈作品',
					'Exclude crossovers': '排除跨圈作品',
					'Only crossovers': '仅限跨圈作品',
					'Single Chapter': '单个章节',
					'Rating': '分级',
					'Categories': '分类',
					'Other': '其她',
					'Work Stats': '作品统计',
					'Hits': '点击',
					'Kudos': '点赞',
					'Kudos ♥': '点赞 ♥',
					'Sort by': '排序方式',
					'Best Match': '最佳匹配',
					'Sort direction': '排序方向',
					'Descending': '降序',
					'Ascending': '升序',
					'Filter by title': '按标题筛选',
					'Filter by tag': '按标签筛选',
					'Work Search': '作品搜索',
					'Any Field': '任意字段',
					'Date': '日期',
					'Crossovers': '跨圈作品',
					'Language': '语言',
					'Characters': '角色',
					'Relationships': '关系',
					'Additional Tags': '附加标签',

					// 用户搜索页
					'Search all fields': '搜索所有字段',
					'Name': '名称',
					'Fandom': '同人圈',
					'Search People': '搜索用户',

					// 标签搜索页
					'Tag name': '标签名称',
					'Find tags wrangled to specific canonical fandoms.': '查找已整理至特定规范同人圈的标签。',
					'Type': '类型',
					'Fandom': '同人圈',
					'Character': '角色',
					'Relationship': '关系',
					'Freeform': '自由标签',
					'Any type': '任意类型',
					'Wrangling status': '整理状态',
					'Canonical': '规范',
					'Non-canonical': '非规范',
					'Synonymous': '同义',
					'Canonical or synonymous': '规范或同义',
					'Non-canonical and non-synonymous': '非规范且非同义',
					'Any status': '任意状态',
					'Name': '名称',
					'Date Created': '创建日期',
					'Uses': '使用次数',
					'Search Tags': '搜索标签',
					'Title': '标题',
					'Author': '作者',
					'Artist': '画师',
					'Author/Artist': '作者/画师',
					'People Search': '用户搜索',
					'Tag Search': '标签搜索',
					'Work Tags': '作品标签',

					// 浏览
					'Expand Fandoms List': '展开同人圈列表',
					'Collapse Fandoms List': '收起同人圈列表',
					'Recent works': '最近作品',
					'Recent series': '最近系列',
					'Recent bookmarks': '最近书签',
					'Expand Works List': '展开作品列表',
					'Collapse Works List': '收起作品列表',
					'Expand Bookmarks List': '展开书签列表',
					'Collapse Booksmarks List': '收起书签列表',

					// 个人资料
					'Edit My Profile': '编辑简介',
					'Edit Profile': '编辑简介',
					'Edit Default Pseud and Icon': '编辑笔名和头像',
					'Change Username': '更改用户名',
					'Change My Username': '更改用户名',
					'Change Password': '更改密码',
					'Change My Password': '更改密码',
					'Change Email': '更改邮箱',
					'Title': '标题',
					'Location': '位置',
					'Date of Birth': '出生日期',
					'About Me': '关于我',
					'Plain text with limited HTML': '纯文本，支持有限 HTML',
					'Embedded images (<img> tags) will be displayed as HTML, including the image\'s source link and any alt text.': '嵌入的图像（<img> 标签）将显示为 HTML，包括图像的源链接和任何替代文本。',
					'Update': '更新',
					'Editing pseud': '编辑笔名',
					'Name': '名称',
					'Make this name default': '将此笔名设为默认',
					'Description': '简介',
					'Icon': '头像',
					'This is your icon.': '这是您的头像。',
					'You can have one icon for each pseud.': '每个笔名可设置一个头像。',
					'Icons can be in png, jpeg or gif form.': '头像格式支持 PNG、JPEG 和 GIF。',
					'Icons should be sized 100x100 pixels for best results.': '建议头像尺寸为 100×100 像素以获得最佳效果。',
					'Upload a new icon': '上传新头像',
					'Icon alt text': '头像替代文本',
					'Icon comment text': '头像注释文本',
					'New Pseud': '新建笔名',
					'Default Pseud': '默认笔名',
					'Edit Pseud': '编辑笔名',
					'Edit': '编辑',
					'Current username': '当前用户名',
					'New username': '新用户名',
					'Your username has been successfully updated.': '您的用户名已成功更新。',
					'Password': '密码',
					'New password': '新密码',
					'Confirm new password': '确认新密码',
					'Old password': '旧密码',
					'Current email': '当前邮箱',
					'New email': '新邮箱',
					'Enter new email again': '再次输入新邮箱',
					'Confirm New Email': '确认新邮箱',
					'Submit': '提交',
					'Create': '创建',

					// 作品
					'Rating:': '分级:',
					'Archive Warning:': 'Archive 预警:',
					'Archive Warnings:': 'Archive 预警:',
					'Archive Warning': 'Archive 预警',
					'Archive Warnings': 'Archive 预警',
					'Category:': '分类:',
					'Categories:': '分类:',
					'Fandom:': '同人圈:',
					'Fandoms:': '同人圈:',
					'Relationship:': '关系:',
					'Relationships:': '关系:',
					'Character:': '角色:',
					'Characters:': '角色:',
					'Additional Tag:': '附加标签:',
					'Additional Tags:': '附加标签:',
					'Language:': '语言:',
					'Series': '系列',
					'Series:': '系列:',
					'Stats:': '统计:',
					'Published:': '发布于:',
					'Completed:': '完结于:',
					'Updated:': '更新于:',
					'Words:': '字数:',
					'Chapters:': '章节:',
					'Comments:': '评论:',
					'Kudos:': '点赞:',
					'Bookmarks:': '书签:',
					'Hits:': '点击:',
					'Complete?': '已完结？',
					'Word Count:': '字数:',
					'Date Updated:': '更新日期:',
					'Post': '发布',
					'New Work': '新作品',
					'Edit Work': '编辑作品',
					'Import Work': '导入作品',
					'From Draft': '从草稿',
					'Edit': '编辑',
					'Edit Tags': '编辑标签',
					'Add Chapter': '添加章节',
					'Post Draft': '发布草稿',
					'Delete Draft': '删除草稿',
					'Post Chapter': '发布章节',
					'Edit Chapter': '编辑章节',
					'Delete Chapter': '删除章节',
					'Manage Chapters': '管理章节',
					'Drag chapters to change their order.': '拖动章节以更改顺序。',
					'Enter new chapter numbers.': '输入新的章节编号。',
					'Update Positions': '更新顺序',
					'Update': '更新',
					'Delete': '删除',
					'Cancel': '取消',
					'Save': '保存',
					'Saved': '已保存',
					'Submit': '提交',
					'Orphan Work': '匿名化作品',
					'Orphan Works': '匿名化作品',
					'Filters': '筛选器',
					'Sort By': '排序方式',
					'Random': '随机',
					'Creator': '创作者',
					'Date Updated': '更新日期',
					'Word Count': '字数统计',
					'Summary': '简介',
					'Summary:': '简介:',
					'Notes': '注释',
					'Work Text': '作品正文',
					'Chapter Index': '章节索引',
					'Full-page index': '整页索引',
					'Full-Page Index': '整页索引',
					'Entire Work': '完整作品',
					'Next Chapter': '下一章',
					'Previous Chapter': '上一章',
					'kudos': ' 个赞',
					'bookmark': ' 条书签',
					'comment': ' 条评论',
					'← Previous': '← 上一页',
					'Next →': '下一页 →',
					'All fields are required. Your email address will not be published.': '所有字段均为必填。您的电子邮箱地址不会被公开。',
					'Guest name': '访客名称',
					'Guest email': '访客邮箱',
					'Please enter your name.': '请输入您的名称',
					'Please enter your email address.': '请输入您的电子邮箱地址',
					'Hide Creator\'s Style': '隐藏创作者样式',
					'Show Creator\'s Style': '显示创作者样式',
					'top level comment': '主评论',
					'Share Work': '分享作品',
					'Restore From Last Unposted Draft?': '从上次未发布的草稿继续',
					'Delete Work': '删除作品',
					'Save As Draft': '存为草稿',
					'Save Draft': '保存草稿',
					'Post Work': '发布作品',


					// 合集
					'Collections in the Archive of Our Own': ' AO3 中的合集',
					'Profile': '简介',
					'Join': '加入',
					'Leave': '退出',
					'Open Challenges': '开放中的挑战',
					'Open Collections': '开放中的合集',
					'Closed Collections': '已截止的合集',
					'Moderated Collections': '审核制合集',
					'Unmoderated Collections': '非审核制合集',
					'Unrevealed Collections': '未公开合集',
					'Anonymous Collections': '匿名合集',
					'Sort and Filter': '排序及筛选',
					'Filter collections:': '筛选合集:',
					'Filter by title or name': '按标题或名称筛选',
					'Filter by fandom': '按同人圈筛选',
					'Closed': '已截止',
					'Multifandom': '跨圈',
					'Yes': '是',
					'No': '否',
					'Either': '皆可',
					'Collection Type': '合集类型',
					'No Challenge': '无挑战',
					'Any': '任意',
					'Clear Filters': '清除筛选',

					// 书签
					'Bookmark Search': '书签搜索',
					'Edit Bookmark': '编辑书签',
					'Start typing for suggestions!': '开始输入以获取建议',
					'Searching...': '搜索中…',
					'(No suggestions found)': '未找到建议',
					'Any field on work': '作品任意字段', 'Work tags': '作品标签', 'Type': '类型', 'Work': '作品', 'Work language': '作品语言', 'External Work': '外部作品', 'Date updated': '更新日期', 'Bookmark': '书签', 'Any field on bookmark': '书签任意字段', 'Bookmarker\'s tags': '书签创建者的标签', 'Bookmarker': '书签创建者', 'Bookmark type': '书签类型', 'Rec': '推荐', 'With notes': '含注释', 'Date Bookmarked': '书签创建日期', 'Date bookmarked': '书签创建日期', 'Search Bookmarks': '搜索书签',
					'Search Results': '搜索结果', 'Edit Your Search': '修改搜索设置',
					'Ratings': '分级',
					'Include': '包括',
					'Include Ratings': '包括分级',
					'Other tags to include': '要包括的其她标签',
					'Exclude': '排除',
					'Other tags to exclude': '要排除的其她标签',
					'More Options': '更多选项',
					'Show only crossovers': '仅显示跨圈作品',
					'Completion Status': '完成状态',
					'Search within results': '在结果中搜索',
					'Bookmarker\'s Tags': '书签创建者标签',
					'Other work tags to include': '要包括的其她作品标签',
					'Other bookmarker\'s tags to include': '要包括的其她书签创建者标签',
					'Search bookmarker\'s tags and notes': '搜索书签创建者标签和注释',
					'Other work tags to exclude': '要排除的其她作品标签',
					'Other bookmarker\'s tags to exclude': '要排除的其她书签创建者标签',
					'Bookmark types': '书签类型',
					'Recs only': '仅推荐',
					'Only bookmarks with notes': '仅含注释',
					'All Bookmarks': '所有书签',
					'Add To Collection': '添加到合集',
					'Share': '分享',
					'Private Bookmark': '私人书签',
					'Your tags': '标签',
					'Plain text with limited HTML': '纯文本，支持有限 HTML',
					'The creator\'s tags are added automatically.': '创建者的标签会自动添加',
					'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
					'Add to collections': '添加到合集',
					'Private bookmark': '私人书签',
					'Create': '创建',
					'Bookmark was successfully deleted.': '书签已成功删除。',
					'Add Bookmark to collections': '将书签添加到合集',
					'Collection name(s):': '合集名称：',
					'collection name': '合集名称',
					'Add': '添加',
					'Back': '返回',
					'Bookmark was successfully updated.': '书签已成功更新。',
					'Share Bookmark': '分享书签',
					'Close': '关闭',
					'Show': '展示',
					'Bookmark Collections:': '书签合集:',

					// 系列
					'Creators:': '创建者:',
					'Creator:': '创建者:',
					'Series Begun:': '系列开始于:',
					'Series Updated:': '系列更新于:',
					'Description:': '描述:',
					'Notes:': '注释:',
					'Works:': '作品:',
					'Complete:': '完结:',

					// 语言
					'Work Languages': '作品语言',
					'Suggest a Language': '建议语言',

					// 界面
					'You are now using the default Archive skin again!': '您已重新切换至 Archive 默认界面！',
					'Revert to Default Skin': '恢复默认界面',
					'Role:': '功能:',
					'user': '用户',
					'Media:': '媒体:',
					'all': '全部',
					'Condition:': '状态:',
					'Normal': '正常',
					'(No Description Provided)': '（未提供描述）',
					'Parent Skins': '母级界面',
					'Use': '使用',
					'Stop Using': '停用',
					'Preview': '预览',
					'Set For Session': '为当前会话设置',
					'override': '覆盖',

					// 屏蔽与静音
					'Block': '屏蔽',
					'Unblock': '取消屏蔽',
					'Mute': '静音',
					'Unmute': '取消静音',
					'Yes, Unmute User': '是的，取消静音',
					'Yes, Mute User': '是的，静音用户',
					'Yes, Unblock User': '是的，取消屏蔽',
					'Yes, Block User': '是的，屏蔽用户',

					// 提示信息
					'Your profile has been successfully updated': '您的个人资料已成功更新。',
					'Your edits were put through! Please check over the works to make sure everything is right.': '您的编辑已生效！请检查相关作品，确保所有更改都已正确应用。',
					'We\'re sorry! Something went wrong.': '非常抱歉！操作未完成，请稍后重试。',
					'Your preferences were successfully updated.': '您的偏好设置已成功更新。',
					'Works and bookmarks listed here have been added to a collection but need approval from a collection moderator before they are listed in the collection.': '此处列出的作品和书签已添加至合集中，但需经合集管理员批准后才会在合集内显示。',
					'Successfully logged out.': '已成功登出。',
					'Successfully logged in.': '已成功登录。',
					'Bookmark was successfully created. It should appear in bookmark listings within the next few minutes.': '书签已创建成功。它将在接下来的几分钟内出现在书签列表中。',
					'Browse fandoms by media or favorite up to 20 tags to have them listed here!': '可按媒体浏览同人圈，或收藏最多 20 个标签以在此展示。',
					'You can search this page by pressing': '按', 'ctrl F': ' Ctrl + F ', 'cmd F': ' Cmd + F ，', '': '', 'and typing in what you are looking for.': '输入关键词即可在本页搜索。',
					'Sorry! We couldn\'t save this bookmark because:': '抱歉！我们无法保存此书签，因为', 'Pseud can\'t be blank': '笔名不能为空',
					'The following challenges are currently open for sign-ups! Those closing soonest are at the top.': '以下挑战现已开放报名！即将截止的挑战排在最前面。',
					'You currently have no works posted to the Archive. If you add some, you\'ll find information on this page about hits, kudos, comments, and bookmarks of your works.': '您当前没有任何已发布的作品。添加作品后，您可以在此页面查看作品的访问量、点赞、评论和书签情况。',
					'Users can also see how many subscribers they have, but not the names of their subscribers or identifying information about other users who have viewed or downloaded their works.': '用户还可以查看自己的订阅者数量，但无法看到订阅者的姓名，也无法获取浏览或下载其作品的其她用户的任何身份信息。',
					'This work could have adult content. If you continue, you have agreed that you are willing to see such content.': '此作品可能含有成人内容。若您选择“继续”，即表示您同意查看此类内容。',
					'Yes, Continue': '是，继续',
					'No, Go Back': '否，返回',
					'Set your preferences now': '设置偏好',
					'Work successfully deleted from your history.': '该作品已成功从您的历史记录中删除。',
					'Your history is now cleared.': '您的历史记录已清除。',
					'You are already signed in.': '您已登录。',
					'There are no works or bookmarks under this name yet.': '此名称下尚无作品或书签。',
					'Sorry, you don\'t have permission to access the page you were trying to reach. Please log in.': '抱歉，您无权访问目标页面。请先登录。',
					'Are you sure you want to delete this draft?': '您确定要删除此草稿吗？',
					'Work was successfully updated.': '作品已成功更新。',
					'The work was not updated.': '作品没有更新。',
					'Your changes have not been saved. Please post your work or save as draft if you want to keep them.': '您的更改尚未保存。如果您想保留，请发布作品或将其保存为草稿。',
					'Work was successfully posted. It should appear in work listings within the next few minutes.': '作品已成功发布。它将在接下来的几分钟内出现在作品列表中。',
					'Are you sure you want to delete this work? This will destroy all comments and kudos on this work as well and CANNOT BE UNDONE!': '您确定要删除这篇作品吗？此操作将一并删除该作品收到的所有评论和点赞，且无法撤销！',
					'Chapter has been posted!': '章节已成功发布！',
					'Chapter was successfully updated.': '章节已成功更新。',
					'Are you sure?': '您确定吗？',
					'The chapter was successfully deleted.': '已成功删除此章节。',
					'Chapter order has been successfully updated.': '章节顺序已成功更新。',
					'This is a draft chapter in a posted work. It will be kept unless the work is deleted.': '这是已发布作品中的一篇草稿章节。除非作品被删除，否则该草稿将一直保留。',
					'This chapter is a draft and hasn\'t been posted yet!': '本章节为草稿，尚未发布！',
					'Are you sure you want to delete this bookmark?': '您确定要删除此书签吗？',
					'This is part of an ongoing challenge and will be revealed soon!': '本作品正在参与一项开放中的挑战，内容将很快揭晓！',
					'Your search failed because of a syntax error. Please try again.': '搜索失败，您的查询存在语法错误。请修改后重试。',
					'Type or paste formatted text.': '输入或粘贴带有格式的文本',
					'Comment created!': '评论已发布！',
					'Are you sure you want to delete this comment?': '您确定要删除这条评论吗？',
					'Yes, delete!': '是的，删除！',
					'Comment deleted.': '评论已删除。',
					'(Previous comment deleted.)': '（原评论已删除）',
					'Freeze Thread': '锁定评论串',
					'Comment thread successfully frozen!': '已成功锁定评论串！',
					'Unfreeze Thread': '解锁评论串',
					'Comment thread successfully unfrozen!': '已成功解锁评论串！',
					'Frozen': '已锁定',
					'Comment was successfully updated.': '评论已成功更新。',
					'Sorry! We couldn\'t save this skin because:': '抱歉！我们无法保存此界面，因为：',
					'Title must be unique': '标题必须唯一',
					'We couldn\'t find any valid CSS rules in that code.': '代码中不存在任何有效的 CSS 规则',
					'Skin was successfully created.': '界面已成功创建。',
					'Skin was successfully updated.': '界面已成功删除。',
					'Are you sure you want to delete this skin?': '您确定要删除此界面吗？',
					'The skin was deleted.': '界面已删除。',
					'Your changes have not been saved. Please post your work or save the draft if you want to keep them.': '您的更改尚未保存。如果您想保留，请发布作品或保存草稿。',
					'Are you sure you want to change your username?': '您确定要更改用户名吗？',
					'This has been deleted, sorry!': '抱歉，此内容已被删除！',
					'Collection status updated!': '合集状态已更新！',
					'The pseud was successfully deleted.': '笔名已成功删除。',
					'Pseud was successfully deleted.': '笔名已成功删除。',
					'You can only see your own drafts, sorry!': '抱歉！您只可以查看您自己的草稿。',

					// 标签说明
					'This tag indicates adult content.': '此标签涉及成人内容。',
					'Parent tags (more general):': '母级标签（更通用）：',
					'Tags with the same meaning:': '同义标签：',
					'Metatags:': '元标签：',
					'Subtags:': '子标签：',
					'Child tags (displaying the first 300 of each type):': '子标签（每种类型显示前 300 个）：',
					'and more': '以及更多',
					'Relationships by Character': '关系按角色分类'
				},
				'innerHTML_regexp': [

					['h4.heading', /^\s*Hi,\s+(.+?)!\s*$/s, '您好，$1！'],
					[
						'li.dropdown a.dropdown-toggle',
						/^\s*Hi,\s+(.+?)!\s*$/s,
						'您好，$1！'
					],

					// 用户主页
					['li a, li span.current', /^\s*Works\s*\((\d+)\)\s*$/s, '作品（$1）'],
					['li a, li span.current', /^\s*Drafts\s*\((\d+)\)\s*$/s, '草稿（$1）'],
					['li a, li span.current', /^\s*Series\s*\((\d+)\)\s*$/s, '系列（$1）'],
					['li a, li span.current', /^\s*Bookmarks\s*\((\d+)\)\s*$/s, '书签（$1）'],
					['li a, li span.current', /^\s*Collections\s*\((\d+)\)\s*$/s, '合集（$1）'],
					['li a, li span.current', /^\s*Inbox\s*\((\d+)\)\s*$/s, '消息中心（$1）'],
					['li a, li span.current', /^\s*Sign-ups\s*\((\d+)\)\s*$/s, '报名挑战（$1）'],
					['li a, li span.current', /^\s*Assignments\s*\((\d+)\)\s*$/s, '任务中心（$1）'],
					['li a, li span.current', /^\s*Claims\s*\((\d+)\)\s*$/s, '我的认领（$1）'],
					['li a, li span.current', /^\s*Related Works\s*\((\d+)\)\s*$/s, '相关作品（$1）'],
					['li a, li span.current', /^\s*Gifts\s*\((\d+)\)\s*$/s, '接收赠文（$1）'],
					['li a, li span.current', /^\s*Challenge Sign-ups\s*$/s, '挑战活动报名'],
					['li a, li span.current', /^\s*Gifts\s*$/s, '接收赠文'],
					['a', /^\s*Unsubscribe from (.+?)\s*$/s, '取消订阅 $1'],
					['h2.heading', /^\s*Works by\s+(.+?)\s*$/s, '$1 的作品'],
					['h2.heading', /^\s*Series by\s+(.+?)\s*$/s, '$1 的系列'],
					['h2.heading', /^\s*Bookmarks by\s+(.+?)\s*$/s, '$1 的书签'],
					['h2.heading', /^\s*Collections by\s+(.+?)\s*$/s, '$1 的合集'],
					['h2.heading', /^\s*Gifts for\s+(.+?)\s*$/s, '$1 收到的赠文'],
					['h2.heading', /^\s*(.+?)'s Related Works\s*$/s, '$1 的相关作品'],
					['h2.heading', /^\s*(.+?)'s Collections\s*$/s, '$1 的合集'],
					['h2.heading', /^\s*Challenge Sign-ups for\s+(.+?)\s*$/s, '$1 参加的挑战'],
					[
						'h2.heading',
						/^\s*(\d+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
						'$3（$2）：$1 篇作品'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
						'$5（$4）：$3 篇作品，第 $1 - $2 篇'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
						'$4：$3 篇作品，第 $1 - $2 篇'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s*$/s,
						'$4：$3 篇作品，第 $1 - $2 篇'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Series\s+by\s+(.+?)\s*$/s,
						'$4：$3 个系列，第 $1 - $2 个'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Bookmarks?\s+by\s+(.+?)\s*$/s,
						'$4：$3 条书签，第 $1 - $2 条'
					],
					['h2.heading', /^\s*(\d+)\s+Works?\s+by\s+(.+?)\s*$/s, '$2：$1 篇作品'],
					['h2.heading', /^\s*(\d+)\s+Series\s+by\s+(.+?)\s*$/s, '$2：$1 个系列'],
					['h2.heading', /^\s*(\d+)\s+Bookmarks?\s+by\s+(.+?)\s*$/s, '$2：$1 条书签'],
					['h2.heading', /^\s*(\d+)\s+Collections?\s+by\s+(.+?)\s*$/s, '$2：$1 个合集'],
					['h2.heading', /^\s*(\d+)\s+Unposted\s+Drafts?\s*$/s, '未发布的草稿：$1'],

					// 浏览
					[
						'p',
						/^\s*These are some of the latest works posted to the Archive\. To find more works, <a href="\/media">choose a fandom<\/a> or <a href="\/works\/search">try our advanced search<\/a>\.\s*(?:<!--[\s\S]*?-->)?\s*$/s,
						'这里展示了一些最新发布的作品。若要查看更多作品，请<a href="/media">选择一个同人圈</a>或<a href="/works/search">尝试高级搜索</a>。'
					],
					[
						'p',
						/^\s*These are some of the latest bookmarks created on the Archive\. To find more bookmarks,\s*<a href="\/media">choose a fandom<\/a>\s*or\s*<a href="\/bookmarks\/search">try our advanced search<\/a>\.\s*(?:<!--[\s\S]*?-->)?\s*$/s,
						'这里展示了一些最新创建的书签。若要查看更多书签，请<a href="/media">选择一个同人圈</a>或<a href="/bookmarks/search">尝试高级搜索</a>。'
					],
					[
						'p',
						/^\s*These are some of the most popular tags used on the Archive\. To find more tags,\s*<a href="\/tags\/search">try our tag search<\/a>\.\s*$/s,
						'这里展示了一些最常用的标签。若要查看更多标签，请<a href="/tags/search">尝试标签搜索</a>。'
					],
					[
						'h2.heading',
						/^\s*Chapter Index for\s+(<a href="\/works\/\d+">.+?<\/a>)\s+by\s+(<a rel="author" href="\/users\/.+?">.+?<\/a>)\s*$/s,
						'章节索引：$1 by $2'
					],
					['p', /^\s*<strong>([\d,]+)\s+Found<\/strong>\s*$/, '找到 $1 条结果'],
					['h2.heading', /^\s*([\d,]+)\s+Works?\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s, '$2：$1 篇作品'],
					['dd.expandable dl.range dt label', /^From$/s, '从'],
					['dd.expandable dl.range dt label', /^To$/s, '到'],
					['label[for*="_work_search_category_ids_"] span:last-of-type', /^(Other)(\s*\(\d+\))$/s, '其她$2'],
					['label[for*="_bookmark_search_category_ids_"] span:last-of-type', /^(Other)(\s*\(\d+\))$/s, '其她$2'],
					['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s*of\s*([0-9,]+)\s*Bookmarks by\s*(.+)\s*$/s, '$4：$3 条书签，第 $1 - $2 条'],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+?)\s+in\s+(<a[^>]+>.+?<\/a>)\s*$/s,
						'$5（$4）：$3 篇作品，第 $1 - $2 篇'
					],
					['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Works?\s+by\s+(.+)\s*$/s, '$4：$3 篇作品，第 $1 - $2 篇'],
					['h2.heading', /^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+(?:Bookmarked Items|已创建书签作品) in\s+(<a[^>]+>.+?<\/a>)\s*$/s, '$4：$3 篇已创建书签作品，第 $1 - $2 篇'],
					['h2.heading', /^\s*Gifts for\s+(.+)\s*$/s, '$1 收到的赠文'],
					['h2.heading', /^\s*(.+)'s Collections\s*$/s, '$1：合集'],
					['h5.byline.heading', /^\s*Bookmarked by\s*(<a .*?<\/a>)/s, '创建者：$1'],
					['li', /^\s*Part (<strong>\d+<\/strong>) of (<a .*?<\/a>)/, '$2 第 $1 部分'],
					['h2.heading', /^New bookmark for (<a href="\/works\/\d+">.*?<\/a>)/, '为 $1 创建新书签'],
					['h5.heading a', /^(\d+)\s+works?$/s, '$1 篇作品'],
					['h5.heading a', /^(\d+)\s+recs?$/s, '$1 条推荐'],
					['h2.heading', /^\s*Items\s+by\s+(.+?)\s+in\s+Collections\s*$/s, '$1 在合集中的作品'],
					['dd a', /^([\d,]+)\s+works?$/s, '$1 篇作品'],
					['h2.heading', /^\s*([\d,]+)\s+Works?\s*$/s, '$1 篇作品'],
					['h2.heading', /^\s*([\d,]+)\s+Collections?\s*$/s, '$1 个合集'],
					[
						'dt',
						/(<\/a>)\s*\(Work\)\s+by\s*(<a\s+rel="author".*?>.*?<\/a>|[^<]+)/s,
						'$1（作品）by $2'
					],
					[
						'dt',
						/(<\/a>)\s*\(Series\)\s+by\s*(<a\s+rel="author".*)/s,
						'$1（系列）by $2'
					],
					[
						'h4.heading',
						/<img alt="\(Restricted\)" title="Restricted" src="\/images\/lockblue\.png"[^>]*>/g,
						'<img alt="(访问受限)" title="访问受限" src="/images/lockblue.png" width="15" height="15">'
					],
					['li.pseud ul a[href$="/pseuds"], li.pseud ul span.current', /^\s*All Pseuds\s*\((\d+)\)\s*$/s, '所有笔名 ($1)'],

					// 个人资料
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/g, '剩余 $1 字符'],
					['p#password-field-description', /^\s*6 to 40 characters\s*$/, '6 到 40 字符'],
					['p.notice', /Any personal information you post on your public AO3 profile[\s\S]*?<a href="\/privacy">(?:Privacy Policy|隐私政策)<\/a>[\s\S]*?\./s, '您在公开 AO3 个人资料中发布的任何个人信息（包括但不限于您的姓名、电子邮箱、年龄、位置、个人关系、性别或性取向认同、种族或族裔背景、宗教或政治观点，以及/或其她网站的账户用户名）都会对公众可见。要了解 AO3 在您使用网站时收集哪些数据以及我们如何使用这些数据，请查看我们的<a href="/privacy">隐私政策</a>。'],
					['div.caution.notice', /<p>\s*<strong>Please use this feature with caution\.<\/strong>[\s\S]*?<\/p>/s, '<p><strong>请谨慎使用此功能。</strong>用户名每 7 天仅能更改一次。</p>'],
					['div.notice', /Changing your email will send a request for confirmation[\s\S]*?will <strong>invalidate any pending email change requests<\/strong>\./s, '更改电子邮箱将向您的新邮箱发送确认请求，并向当前邮箱发送通知。<br>您必须使用确认邮件中的链接完成邮箱更改。如在 7 天内未确认，请求链接将失效，邮箱不会更改。<br>重新提交新邮箱请求将使<strong>任何未完成的更改请求失效</strong>。'],
					['p.footnote', /You cannot change the pseud that matches your username\. However, you can <a href="([^"]*change_username[^"]*)">change your username<\/a> instead\./g, '无法修改与用户名相同的笔名。如需修改，请<a href="$1">更改您的用户名</a>。'],
					['h2.heading', /^Pseuds for (.+)$/, '$1 的笔名'],
					['div.caution.notice p:last-child', /For information on how changing your username will affect your account.*?contact Support.*?\./s, '要了解更改用户名对账户的影响，请参阅<a href="/faq/your-account#namechange">账户常见问题</a>。用户名变更可能需要数天或更长时间才会生效。如果一周后您的作品、书签、系列或合集中仍显示旧用户名，请<a href="/support">联系支持团队</a>。'],
					['p.note', /If that is not what you want.*?create a new Pseud.*?instead\./s, '如果您不想更改用户名，也可以<a href="/users/Ubifo/pseuds/new">创建一个新的笔名</a>。'],
					['p.footnote', /3 to 40 characters.*?underscore.*?\)/s, '3 至 40 个字符（仅限 A–Z、a–z、_、0–9），禁止使用空格，且不能以下划线开头或结尾'],
					[
						'div.caution.notice p',
						/For information on how changing your username will affect your account[\s\S]*?<a href="\/support">contact Support<\/a>[.。]?/s,
						'有关更改用户名如何影响账户的详情，请参阅<a href="/faq/your-account#namechange">账户常见问题</a>。用户名更改可能需要数天或更长时间才会生效。如果一周后您的作品、书签、系列或合集中仍显示旧用户名，请<a href="/support">联系支持团队</a>。'
					],
					[
						'div.flash.notice',
						/^\s*Your password has been changed\. To protect your account, you have been logged out of all active sessions\. Please log in with your new password\.\s*$/s,
						'您的密码已更改。为了保护您的账户，您已从所有活动会话中登出。请使用新密码登录。'
					],

					// 作品
					[
						'span.role',
						/^\s*\(Guest\)\s*$/i,
						' (访客)'
					],
					[
						'span.parent',
						/^\s*on\s+(<a[^>]+>)Chapter\s+(\d+)(<\/a>)\s*$/is,
						'：$1第 $2 章$3'
					],
					[
						'span.parent',
						/^\s*on\s+(<a[^>]+>)Chapter\s+(\d+)\s+of\s+(\d+)(<\/a>)\s*$/is,
						'：$1第 $2 章 / 共 $3 章$4'
					],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Series\s+by\s+(.+?)\s*$/s,
						'$4：$3 个系列，第 $1 - $2 个'
					],
					[
						'h3.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Collections\s*$/s,
						'$3 个合集，第 $1 - $2 个'
					],
					[
						'p.type',
						/^\s*\((Open|Closed)(.*)\)\s*$/s,
						(_match, status, rest) => {
							const map = { 'Open': '开放中', 'Closed': '已截止' };
							return `(${map[status]}${rest})`;
						}
					],
					[
						'h2.heading',
						/^\s*Collections including\s+(.+?)\s*$/s,
						'包含 $1 的合集'
					],
					[
						'h3.heading',
						/^\s*(\d+)\s+Collections?\s*$/s,
						'$1 个合集'
					],
					// 书签
					[
						'h4.heading',
						/^\s*<span class="byline">\s*(.+?),\s*(<input[^>]+>)\s*<\/span>\s*save a bookmark!\s*$/s,
						'保存书签（<span class="byline">$1$2</span>）'
					],
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
					['div.flash.notice', /^Added to collection\(s\):\s+(.*)\.$/s, '已添加到合集：$1 。'],
					[
						'p.note',
						/^\s*Copy and paste the following code to link back to this work \((<kbd>CTRL A<\/kbd>\/<kbd>CMD A<\/kbd>) will select all\), or use the Tweet or Tumblr links to share the work on your Twitter or Tumblr account\.\s*$/s,
						'请复制以下代码以添加指向此作品的链接（按 $1 可全选），或使用 Tweet / Tumblr 链接在您的 Twitter / Tumblr 账户上分享此作品。'
					],
					['h2.heading', /^\s*([\d,]+)\s+Bookmarks?\s*$/s, '$1 条书签'],
					[
						'h2.heading',
						/^\s*(\d+)\s*-\s*(\d+)\s+of\s+([0-9,]+)\s+Bookmarks?\s*$/s,
						'$3 条书签，第 $1 - $2 条'
					],
					[
						'h6.landmark.heading',
						/^Bookmarker's Notes$/,
						'书签创建者的注释'
					],
					[
						'h4.heading',
						/^Mystery Work$/,
						'神秘作品'
					],
					[
						'h5.heading',
						/^Part of (<a href="\/collections\/.*?">.+?<\/a>)$/,
						'属于合集：$1'
					],
					[
						'p.notes',
						/^\s*Looking for prompts you claimed in a prompt meme\? Try\s+(<a href="[^"]+">)My Claims(<\/a>)\.?\s*$/s,
						'想查看您在“接梗挑战”中认领的同人梗？请前往$1我的认领$2。'
					],
					[
						'h2.heading',
						/^\s*My Claims\s*$/i,
						'我的认领'
					],
					[
						'p.notes',
						/^\s*Looking for assignments you were given for a gift exchange\? Try\s+(<a[^>]+>)My Assignments(<\/a>)\.?\s*$/is,
						'想查看您在赠文交换活动中被分配的任务？请前往$1任务中心$2。'
					],
					[
						'h2.heading',
						/^\s*My Assignments\s*$/i,
						'任务中心'
					],
					[
						'h4.heading a',
						/^Bookmark for (.*)$/,
						'书签：$1'
					],
					[
						'h5.heading',
						/^\s*in\s+(<span class="collection">.*?<\/span>)\s*$/s,
						'$1'
					],

					// 界面
					['div.flash.notice', /^The skin (.+) has been set\. This will last for your current session\.$/s, '$1 界面已启用，此设置将在当前会话期间持续生效。'],
					['h2.heading', /^\s*(.+?)\s+skin by\s+(.+?)\s*$/s, '$1 界面，提供者：$2'],

					// 笔名
					[
						'dd',
						/^\s*<ul class="notes">\s*<li>You can have one icon for each pseud\.<\/li>\s*<li>Icons can be in png, jpeg or gif form\.<\/li>\s*<li>Icons should be sized 100x100 pixels for best results\.<\/li>\s*<\/ul>\s*$/s,
						'<ul class="notes"><li>每个笔名可设置一个头像。</li><li>头像格式支持 PNG、JPEG 和 GIF。</li><li>建议头像尺寸为 100×100 像素以获得最佳效果。</li></ul>'
					],

					// 匿名化作品
					[
						'h2.heading',
						/^\s*Orphan All Works by (.*?)\s*$/s,
						'匿名化 $1 的所有作品'
					],
					[
						'p.caution.notice',
						/^\s*Orphaning all works by (.*?) will\s*<strong>permanently<\/strong>\s*remove the pseud \1 from the following work\(s\), their chapters, associated series, and any feedback replies you may have left on them\.\s*$/s,
						'匿名化 $1 的所有作品将从以下作品、其章节、关联系列以及您可能留下的任何反馈回复中<strong>永久</strong>移除笔名 $1 。'
					],
					[
						'p.caution.notice',
						/^\s*Unless another one of your pseuds is listed as a creator on the work\(s\) below, orphaning them will remove them from your account and re-attach them to the specially created orphan_account\. Please note that this is\s*<strong>permanent and irreversible\.<\/strong>\s*You are giving up control over the work\(s\),\s*<strong>including the ability to edit or delete them\.<\/strong>\s*$/s,
						'除非以下作品的创作者名单中包含您的其她笔名，否则匿名化操作会将这些作品从您的账户中移除，并重新关联至专门创建的 orphan_account（匿名帐户）。请注意，此操作是<strong>永久且不可逆的。</strong>您将放弃对这些作品的控制权，<strong>包括编辑或删除它们的能力。</strong>'
					],

					// 屏蔽与静音
					['h2.heading',
						/^Mute (.*)$/s,
						'静音 $1'
					],
					['div.caution.notice',
						/^\s*<p>\s*Are you sure you want to <strong>mute<\/strong> ([^<]+)\?\s*Muting a user:\s*<\/p>[\s\S]*?<li>completely hides their works, series, bookmarks, and comments from you; there will be no empty space, placeholder text, or other indication something has been removed<\/li>[\s\S]*?<p>Muting a user will not:<\/p>[\s\S]*?<li>prevent you from receiving comment or subscription emails from this user<\/li>\s*<li>hide their works, series, bookmarks, and comments from anyone else<\/li>[\s\S]*?<p>\s*To prevent a user from commenting on your works or replying to your comments elsewhere on the site, visit <a href="([^"]+)">your Blocked Users page<\/a>\.\s*<\/p>[\s\S]*?<p>[\s\S]*?<a href="([^"]+)">instructions for reverting to the default site skin<\/a>\.\s*<\/p>\s*$/s,
						`<p>您确定要静音 <strong>$1</strong> 吗？静音用户后：</p>
	                    <ul><li>她们的作品、系列、书签和评论将完全对您隐藏；不会留下空白空间、占位文本或其她任何提示</li></ul>
	                    <p>静音用户不会：</p>
	                    <ul>
	                    <li>阻止您接收来自该用户的评论或订阅邮件</li>
	                    <li>将她们的内容隐藏给其她任何人</li>
	                    </ul>
	                    <p>如需阻止某用户在您的作品上发表评论或在站点其她地方回复您的评论，请访问<a href="$2">已屏蔽用户页面</a>。</p>
	                    <p>请注意，如果您未使用默认站点界面，静音功能可能无法正常工作。要了解有关<a href="$3">如何恢复默认站点界面</a>的说明，请参阅界面与 Archive 界面常见问题。</p>`
					],
					['div.flash.notice',
						/^You have muted the user ([^<]+)\.$/s,
						'您已静音用户 $1 。'
					],
					['h2.heading',
						/^Block (.*)$/s,
						'屏蔽 $1'
					],
					['div.caution.notice',
						/^\s*<p>\s*Are you sure you want to <strong>block<\/strong> ([^<]+)\?\s*Blocking a user prevents them from:\s*<\/p>[\s\S]*?<ul>\s*<li>commenting or leaving kudos on your works<\/li>\s*<li>replying to your comments anywhere on the site<\/li>\s*<li>giving you gift works outside of challenge assignments and claimed prompts<\/li>\s*<\/ul>[\s\S]*?<p>Blocking a user will not:<\/p>[\s\S]*?<ul>\s*<li>hide their works or bookmarks from you<\/li>\s*<li>delete or hide comments they previously left on your works; you can delete these individually<\/li>\s*<li>hide their comments elsewhere on the site<\/li>\s*<\/ul>[\s\S]*?<p>To hide a user's works, bookmarks, series, and comments from you, visit <a href="([^"]+)">your Muted Users page<\/a>\.<\/p>\s*$/s,
						`<p>您确定要屏蔽 <strong>$1</strong> 吗？屏蔽用户后，她们将无法：</p>
	                    <ul>
	                    <li>在您的作品上发表评论或留下点赞</li>
	                    <li>在站点任何地方回复您的评论</li>
	                    <li>在挑战分配和认领同人梗之外赠送作品给您</li>
	                    </ul>
	                    <p>屏蔽用户不会：</p>
	                    <ul>
	                    <li>隐藏您所屏蔽用户的作品或书签</li>
	                    <li>删除或隐藏她们之前在您作品上留下的评论；您可以逐条删除</li>
	                    <li>隐藏她们在站点其她地方的评论</li>
	                    </ul>
	                    <p>如需隐藏某用户的作品、书签、系列和评论，请访问<a href="$2">已静音用户页面</a>。</p>`
					],
					['p.actions',
						/<a href="([^"]+)">Cancel<\/a>\s*<input type="submit" name="commit" value="Yes, Block User">/s,
						'<a href="$1">取消</a> <input type="submit" name="commit" value="是的，屏蔽用户">'
					],
					['div.flash.notice',
						/^You have blocked the user ([^<]+)\.$/s,
						'您已屏蔽用户 $1 。'
					],
					['h2.heading',
						/^Unblock (.*)$/s,
						'取消屏蔽 $1'
					],
					['div.caution.notice',
						/^\s*<p>\s*Are you sure you want to <strong>unblock<\/strong> ([^<]+)\?\s*Unblocking a user allows them to resume:\s*<\/p>[\s\S]*?<ul>\s*<li>commenting or leaving kudos on your works<\/li>\s*<li>replying to your comments anywhere on the site<\/li>\s*<li>giving you gift works outside of challenge assignments and claimed prompts<\/li>\s*<\/ul>\s*$/s,
						`<p>您确定要取消屏蔽 <strong>$1</strong> 吗？取消屏蔽后对方将恢复以下权限：</p>
	                    <ul>
	                    <li>在您的作品上发表评论或留下点赞</li>
	                    <li>在站点任何地方回复您的评论</li>
	                    <li>在挑战分配和认领同人梗之外赠送作品给您</li>
	                    </ul>`
					],
					['div.flash.notice',
						/^You have unblocked the user ([^<]+)\.$/s,
						'您已取消屏蔽用户 $1 。'
					],
					['h2.heading',
						/^Unmute (.*)$/s,
						'取消静音 $1'
					],
					['div.caution.notice',
						/^\s*<p>\s*Are you sure you want to <strong>unmute<\/strong> ([^<]+)\?\s*Unmuting a user allows you to:\s*<\/p>[\s\S]*?<ul>\s*<li>see their works, series, bookmarks, and comments on the site<\/li>\s*<\/ul>\s*$/s,
						`<p>您确定要取消静音 <strong>$1</strong> 吗？取消静音后，您将可以：</p>
	                    <ul>
	                    <li>在站点上查看她们的作品、系列、书签和评论</li>
	                    </ul>`
					],
					['div.flash.notice',
						/^You have unmuted the user ([^<]+)\.$/s,
						'您已取消静音用户 $1 。'
					],

					// 历史记录
					[
						'h4.viewed.heading',
						/^\s*<span>Last visited:<\/span>\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+\((.*?)\)\s+Visited\s+(once|(\d+)\s+times)(?:\s+\((Marked for Later\.)\))?\s*$/s,
						(_match, day, monthAbbr, year, statusText, visitText, visitCount, markedForLaterText) => {
							const statusMap = {
								'Latest version.': '已是最新版',
								'Minor edits made since then.': '有微小修订',
								'Update available.': '作品有更新'
							};
							const translatedDate = `${year}年${monthMap[monthAbbr]}月${day}日`;
							const translatedStatus = statusMap[statusText.trim()] || statusText.trim();
							const translatedVisit = visitText === 'once' ? '阅读 1 次' : `共阅读 ${visitCount} 次`;
							const translatedMarked = markedForLaterText ? '（已标记为稍后阅读）' : '';

							let result = `上次阅读：${translatedDate}（${translatedStatus}）。${translatedVisit}`;
							if (translatedMarked) {
								result += `${translatedMarked}`;
							}
							result += '。';
							return result;
						}
					],

					// 提示信息
					[
						'#modal .content p:has(a[href*="content#II.J"])',
						/\(For more information, see the <a href="\/content#II.J">Ratings and Warnings section of the AO3 Terms of Service<\/a>\.\)/s,
						'（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）'
					],
					['div.flash.error', /Sorry, additional invitations are unavailable\. Please <a href="\/invite_requests">use the queue<\/a>! If you are the mod of a challenge currently being run on the Archive, please <a href="\/support">contact Support<\/a>\. If you are the maintainer of an at-risk archive, please <a href="http:\/\/opendoors\.transformativeworks\.org\/contact-open-doors\/">contact Open Doors<\/a>\./s, '抱歉，暂时无法提供更多邀请。请<a href="/invite_requests">使用排队系统</a>！<br>如果您是正在 Archive 举办挑战活动的管理员，请<a href="/support">联系支持</a>。<br>如果您是处于风险 Archive 站点的维护者，请<a href="http://opendoors.transformativeworks.org/contact-open-doors/">联系 Open Doors</a>。'],
					['div.flash.error', /^\s*Password resets are disabled for that user\.\s*For more information, please\s*<a href="\/abuse_reports\/new">\s*contact our Policy & Abuse team\s*<\/a>\.\s*$/s, '此用户的密码重置功能已被禁用。要了解更多信息，请<a href="/abuse_reports/new">联系我们的策略与滥用团队</a>。'],
					[
						'div.flash.error',
						/^\s*Your current session has expired and we can't authenticate your request\. Try logging in again, refreshing the page, or <a href="http:\/\/kb\.iu\.edu\/data\/ahic\.html">clearing your cache<\/a> if you continue to experience problems\.\s*$/s,
						'您当前的会话已过期，无法验证您的请求。如问题持续存在，请重新登录、刷新页面，或清除缓存。'
					],
					['h2.heading', /^Error 404$/, '错误 404'],
					['h3.heading', /^The page you were looking for doesn't exist\.$/, '您查找的页面不存在。'],
					['div.error-404 p', /^You may have mistyped the address or the page may have been deleted\.$/, '您可能输入了错误的地址或该页面已被删除。'],
					[
						'h2.heading',
						/^\s*Error 503\s*$/s,
						'错误 503'
					],
					[
						'h3.heading',
						/^\s*The page was responding too slowly\.\s*$/s,
						'页面响应过慢。'
					],
					[
						'div[class*="error-"] p',
						/^\s*Check our <a href="(https:\/\/www\.otwstatus\.org)">status page<\/a> and follow (<a href="[^"]+">@status\.archiveofourown\.org<\/a>) on Bluesky or (<a href="[^"]+">ao3org<\/a>) on Tumblr for updates if this keeps happening\.\s*$/s,
						'如果此情况持续存在，请查看我们的<a href="$1">站点状态页面</a>，或在 Bluesky 上关注 $2 、在 Tumblr 上关注 $3 以获取最新动态。'
					],
					[
						'p.message.footnote',
						/^\s*If you accept cookies from our site and you choose "Yes, Continue", you will not be asked again during this session \(that is, until you close your browser\)\. If you log in you can store your preference and never be asked again\.\s*$/s,
						'若您接受本站 Cookie 并选择“是，继续”，在本次会话期间（即关闭浏览器之前）将不再弹出此提示。登录账户后可保存您的偏好设置，从而永久免除此询问。'
					],
					[
						'p.notice',
						/^\s*Sorry, this work doesn't allow non-Archive users to comment\.\s+You can however still leave Kudos!\s*$/s,
						'抱歉，此作品仅限 Archive 用户评论。不过您可以留下点赞！'
					],
					[
						'h4.heading',
						/^\s*Comment as\s+(<span class="byline">.*?<\/span>)\s*(<input[^>]*>)\s*$/is,
						'发表评论（$1）$2'
					],
					[
						'h4.heading',
						/^\s*Comment as\s+(<select[^>]*>[\s\S]*?<\/select>)\s*$/is,
						'发表评论 $1'
					],
					[
						'h4.heading',
						/^\s*(<span class="byline">\s*.+?),\s*(<input[^>]+>)\s*<\/span>\s*save a bookmark!\s*$/is,
						'保存书签（$1$2</span>）'
					],
					[
						'h4.heading',
						/^\s*(<select[^>]*>[\s\S]*?<\/select>)\s*save a bookmark!\s*$/is,
						'保存书签 $1'
					],
					[
						'p',
						/^\s*<strong>Reminder:<\/strong>\s*This site is in beta\. Things may break or crash without notice\.\s*Please report any pesky bugs and <a href="(\/support)">give us your feedback<\/a>!\s*$/s,
						'<strong>提示：</strong>本站处于测试阶段。功能可能会无预警地出现故障或崩溃。欢迎报告任何烦人的 Bug 以及<a href="$1">提交您的反馈</a>！'
					],
					[
						'p',
						/^\s*Forgot your password or username\?\s*<a href="(\/users\/password\/new)">Reset (?:your )?password<\/a>\.\s*<br.*?>\s*Don't have an account\?\s*<a href="(\/invite_requests)">Request an invitation to join<\/a>\.?\s*$/s,
						'忘记了您的密码或用户名？<a href="$1">重置密码</a>。<br>还没有帐户？<a href="$2">获取邀请</a>。'
					],
					[
						'label[for="reset_login"]',
						/^\s*Email address\s*<strong>or<\/strong>\s*username\s*$/s,
						'电子邮箱地址 <strong>或</strong> 用户名'
					],
					[
						'p.muted.notice',
						/^\s*You have muted some users on the Archive\.\s*Some items may not be shown, and any counts may be inaccurate\.\s*You can mute or unmute users on\s*<a href="(\/users\/[^\/]+\/muted\/users)">your Muted Users page<\/a>\s*[.。]?\s*$/s,
						'您已在 Archive 上静音了部分用户。部分内容可能因此不予显示，相关计数也可能并不准确。您可在<a href="$1">已静音用户</a>页面静音或取消静音用户。'
					],
					[
						'p.caution.notice',
						/^\s*This draft will be <strong>scheduled for deletion<\/strong> on\s*(<abbr class="day".*?<\/span>)\s*\.\s*$/s,
						'此草稿将于 <span>$1</span> <strong>预定删除</strong>。'
					],
					[
						'p:has(a[href="/content"]):has(a[href="/tos_faq#content_faq"])',
						/All\s+works\s+you\s+post\s+on\s+AO3\s+must\s+comply\s+with\s+our\s+<a\s+href="\/content"[^>]*>(?:Content Policy|内容政策)<\/a>\.\s*For\s+more\s+information,\s+please\s+refer\s+to\s+our\s+<a\s+href="\/tos_faq#content_faq"[^>]*>(?:Terms of Service FAQ|服务条款常见问题)<\/a>[\.。]?/s,
						'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
					],
					[
						'p.notice',
						/^\s*This work is a draft and has not been posted\. The draft will be <strong>scheduled for deletion<\/strong> on\s*(<abbr class="day".*?<\/span>)\s*\.\s*$/s,
						'此作品是尚未发布的草稿。将于 <span>$1</span> <strong>预定删除</strong>。'
					],
					[
						'p.notice',
						/^\s*Sorry, this work doesn't allow comments\.\s*$/s,
						'抱歉，此作品不允许评论。'
					],
					[
						'h4.heading.byline',
						/^\s*Chapter by (<a\s+rel="author".*?<\/a>)\s*$/s,
						'章节作者：$1'
					],
					[
						'div.flash.notice',
						/^Draft was successfully created\. It will be <strong>scheduled for deletion<\/strong>\s+on\s+(.*)\.$/s,
						'草稿已成功创建。它将于 <span class="datetime">$1</span> <strong>预定删除</strong>。'
					],
					[
						'p',
						/^\s*This tag belongs to the Character Category\.\s*$/,
						'此标签属于“角色”分类。'
					],
					[
						'p',
						/^\s*This tag has not been marked common and can't be filtered on \(yet\)\.\s*$/,
						'此标签尚未被标记为常用，（目前）无法用于筛选。'
					],
					[
						'h3.heading',
						/^\s*Works which have used it as a tag:\s*$/,
						'使用此标签的作品：'
					],
					[
						'div.flash.error',
						/^We couldn't add your submission to the following collections: (.*?) does not exist\.$/s,
						'我们无法将您的提交添加到以下合集：$1 不存在。'
					],
					[
						'h2.heading',
						/^\s*Editing bookmark for (<a href="\/works\/\d+">.*?<\/a>)\s*$/s,
						'编辑书签：$1'
					],
					[
						'div.flash.notice',
						/^\s*Bookmark was successfully updated\.\s+Added to collection\(s\):\s*(.*?)\.\s*$/s,
						'书签已成功更新。已添加到合集：$1。'
					],
					[
						'li',
						/^\s*Translation into\s+(<span lang="[^"]+">[^<]+<\/span>)\s+available:\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
						'已有 $1 译本：$2 ，译者：$3'
					],
					[
						'li',
						/^\s*A translation of\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
						'翻译自：$1 ，作者：$2'
					],
					[
						'li',
						/^\s*Inspired by\s+(<a href="[^"]+">.*?<\/a>)\s+by\s+(<a rel="author" href="[^"]+">.*?<\/a>)\s*$/,
						'衍生自：$1 ，作者：$2'
					],
					[
						'li',
						/^\s*For\s+(<a href="\/users\/[^"]+\/gifts">.*?<\/a>)\s*[.。]?\s*$/,
						'赠送给：$1'
					],
					[
						'p.jump',
						/^\s*\(See the end of the work for\s*(<a[^>]+>)notes(<\/a>)\s+and\s+(<a[^>]+>)other works inspired by this one(<\/a>)\.\)\s*$/s,
						'（在作品结尾查看$1注释$2和$3相关衍生作品$4。）'
					],
					[
						'main',
						/^\s*<h2>The archive is down for maintenance\.<\/h2>\s*<p>Check our (<a href="https:\/\/www\.otwstatus\.org">status page<\/a>), (<a href="https:\/\/bsky\.app\/profile\/status\.archiveofourown\.org">@status\.archiveofourown\.org<\/a>) on Bluesky or (<a href="https:\/\/ao3org\.tumblr\.com\/">ao3org<\/a>) on Tumblr for updates\.<\/p>\s*$/s,
						'<h2> Archive 正在进行维护。</h2><p>请查看我们的 $1、Bluesky 上的 $2 或 Tumblr 上的 $3，以获取最新动态。</p>'
					],
					[
						'h3.heading',
						/^\s*Sorry!\s*$/s,
						'抱歉！'
					],
					[
						'h3.heading + p',
						/^\s*This work is only available to registered users of the Archive\.\s*If you already have an Archive of Our Own account, log in now\.\s*If you don't have an account, you can\s*<a href="\/invite_requests">.*?<\/a>\s*[.。]?\s*$/s,
						'此作品仅对 Archive 的注册用户开放。如果您已有 AO3 帐户，请立即登录。如果您还没有帐户，可以<a href="/invite_requests">获取邀请</a>。'
					],
					[
						'div#error.error ul',
						/<li>(.+?) does not accept gifts\.<\/li>/g,
						(_match, username) => `<li>${username} 不接受赠文。</li>`
					],
					[
						'div.flash.error',
						/^We couldn't add your submission to the following collection\(s\): <br><ul><li>(.*?), because this item has already been submitted\.<\/li><\/ul>$/s,
						'我们无法将您的提交添加到以下合集：<br><ul><li>$1，因为该项目已被提交。</li></ul>'
					],
					[
						'p.note',
						/^\s*Follow AO3 on Bluesky or Tumblr for status updates, and don't forget to check out the <a href="https:\/\/www\.transformativeworks\.org\/where-find-us\/">Organization for Transformative Works' news outlets<\/a> for updates on our other projects!\s*$/s,
						'在 Bluesky 或 Tumblr 上关注 AO3 以获取最新动态；同时别忘了查看<a href="https://www.transformativeworks.org/where-find-us/">再创作组织的动态发布渠道</a>，了解我们其她项目的进展！'
					],
					[
						'p.jump',
						/^\s*\(See the end of the work for\s*(<a[^>]+>)(more )?notes(<\/a>)\s+and\s+(<a[^>]+>)other works inspired by this one(<\/a>)\.\)\s*$/s,
						(_match, p1, p2, p3, p4, p5) => `（在作品结尾查看${p1}${p2 ? '更多' : ''}注释${p3}和${p4}相关衍生作品${p5}。）`
					],
					[
						'div.flash.notice',
						/^\s*This work was added to your <a href="([^"]*)">Marked for Later list<\/a>\.\s*$/s,
						'已将此作品添加至<a href="$1">稍后阅读列表</a>。'
					],
					[
						'h4.viewed.heading',
						/^\s*\(Deleted work, last visited (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\)\s*$/s,
						(_match, day, month, year) => `作品已删除，上次阅读：${year}年${monthMap[month]}月${day}日`
					],
					[
						'div.flash.notice li',
						/^\s*You are previewing the skin (.*?)\. This is a randomly chosen page\.\s*$/,
						'您正在预览界面：$1。这是一个随机选择的页面。'
					],
					[
						'div.flash.notice li',
						/^\s*Go back or click any link to remove the skin\.\s*$/,
						'返回或点击任意链接以移除此界面。'
					],
					[
						'div.flash.notice li',
						/^\s*Tip: You can preview any archive page you want by tacking on '\?site_skin=\[skin_id\]' like you can see in the url above\.\s*$/,
						'提示：您可以通过在 URL 末尾添加 “?site_skin=[skin_id]” 来预览任意 Archive 页面，如上方地址栏所示。'
					],
					[
						'div.flash.notice li a',
						/^\s*Return To Skin To Use\s*$/,
						'返回界面以使用'
					],
					[
						'div.flash.alert',
						/^You are already logged in to an account\. Please log out and try again\.$/,
						'您已登录账户，请登出后重试。'
					],
					[
						'p',
						/^\s*The creator's summary is added automatically\.\s*$/s,
						'创作者的简介会自动添加'
					],
					[
						'p',
						/^\s*If you've forgotten your password, we can send you an email with instructions to reset your password\.\s*$/s,
						'如果您忘记了密码，我们可以发送包含重置密码说明的邮件。'
					],
					[
						'p',
						/^\s*Please enter the email address associated with your AO3 account\. You may only request a password reset a limited number of times per day\.\s*$/s,
						'请输入与您的 AO3 账户关联的电子邮箱地址。您每天只能请求有限次数的密码重置。'
					],
					[
						'div.caution.notice',
						/<p>\s*<strong>Please use this feature with caution\.<\/strong>\s*You can change your username once every 7 days\.\s*<\/p>/s,
						'<p><strong>请谨慎使用此功能。</strong>用户名每 7 天仅能更改一次。</p>'
					],
					[
						'span#more_pseuds_connector',
						/^\s*,\s+and\s*$/s,
						'，和 '
					],
					[
						'dd.pseuds',
						/(<\/a>),\s+(<a)/g,
						'$1，$2'
					],
					[
						'dd.pseuds',
						/(<a[^>]+>.*?<\/a>)\s+and\s+(<a[^>]+>.*?<\/a>)/i,
						'$1 和 $2'
					],
					[
						'div.flash.error',
						/^\s*Your password was incorrect\. Please try again or, if you've forgotten your password, log out and reset your password via the link on the login form\. If you are still having trouble, <a href="\/support">contact Support<\/a> for help\.\s*$/s,
						'您的密码不正确。请重试，如果您忘记了密码，请登出并通过登录表单上的链接重置密码。如果问题仍然存在，请<a href="/support">联系支持团队</a>寻求帮助。'
					],
					[
						'p.notice',
						/^\s*Sorry, you can't comment on a draft\.\s*$/s,
						'抱歉，您无法评论草稿。'
					],
					[
						'div.flash.alert',
						/^\s*The password or username you entered doesn't match our records\. Please try again or <a href="([^"]+)">reset your password<\/a>\. If you still can't log in, please visit <a href="([^"]+)">Problems When Logging In<\/a> for help\.\s*$/s,
						'您输入的用户名或密码与我们的记录不符。请重试或<a href="$1">重置密码</a>。若仍无法登录，请访问<a href="$2">登录问题</a>寻求帮助。'
					],
					['h2', /Shields are up!/, '安全防御已启动！'],
					['p', /We apologize for the interruption, please prove that you are not a robot:/, '很抱歉打扰您，请证明您不是机器人：'],
					['small', /<b>Your IP:<\/b>\s*<a([^>]+)>Show IP<\/a>/, '<b>您的 IP:</b> <a$1>显示 IP</a>'],
					['div.flash.notice', /^Invitation resent to (.+?)\.$/, '邀请已重新发送至 $1 。'],

					// 标签说明
					[
						'p',
						/^\s*This tag belongs to the (Fandom|Relationship|Character|Category|Archive Warning|Rating|Additional Tags) Category\.(\s*It's a <a href="\/faq\/glossary#canonicaldef">(?:canonical tag|规范标签)<\/a>[\.。]\s*You can use it to <a href="([^"]+)">(?:filter works|筛选作品)<\/a> and to <a href="([^"]+)">(?:filter bookmarks|筛选书签)<\/a>[\.。]\s*(\s*You can also access a list of <a href="([^"]+)">(?:Relationship tags in this fandom|此同人圈中的关系标签)<\/a>\s*)?[\.。]?)?\s*$/s,
						(_match, category, canonicalPart, worksLink, bookmarksLink, relationshipPart, relationshipLink) => {
							const categoryMap = {
								'Fandom': '同人圈',
								'Relationship': '关系',
								'Character': '角色',
								'Category': '分类',
								'Archive Warning': 'Archive 预警',
								'Rating': '分级',
								'Additional Tags': '附加标签'
							};
							const translatedCategory = categoryMap[category] || category;
							let result = `此标签属于“${translatedCategory}”类别。`;
							if (canonicalPart) {
								result += `这是一个<a href="/faq/glossary#canonicaldef">规范标签</a>。您可以用它来<a href="${worksLink}">筛选作品</a>和<a href="${bookmarksLink}">筛选书签</a>。`;
								if (relationshipPart && relationshipLink) {
									result += `您也可以访问<a href="${relationshipLink}">此同人圈中的关系标签</a>列表。`;
								}
							}
							return result;
						}
					],
					[
						'div.merger > h3.heading',
						/^Mergers$/,
						'合并'
					],
					[
						'div.merger p',
						/^\s*(')?([^'<]+)(')?\s+has been made a synonym of (<a class="tag"[^>]*>.*<\/a>)\.\s*Works and bookmarks tagged with ('?)([^'<]+)(')?\s+will show up in (.*)'s filter\.\s*$/s,
						(_match, quote1, tag1, _quote2, tag2Link, quote3, tag3, _quote4, tag4) => {
							const displayTag1 = quote1 ? `'${tag1}'` : tag1;
							const displayTag3 = quote3 ? `'${tag3}'` : tag3;
							return `${displayTag1} 已被设为 ${tag2Link} 的同义标签。使用 ${displayTag3} 标签的作品和书签将会在 ${tag4} 的筛选结果中显示。`;
						}
					],
					[
						'p.caution.notice',
						/^\s*Are you sure you want to <strong><em>delete<\/em><\/strong> all your subscriptions\? This <strong>cannot be undone<\/strong>\s*[.。]?\s*$/s,
						'您确定要<strong>删除</strong>所有订阅吗？此操作<strong>无法撤销</strong>。'
					]
				],
				'regexp': [
					[/^(\d+) kudos$/, '$1 个赞'],
					[/^(\d+) bookmark(?:s)?$/, '$1 条书签'],
					[/^(\d+) comment(?:s)?$/, '$1 条评论'],
					[/^(\d+) hit(?:s)?$/, '$1 次点击'],
					[/^(\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/,
						(match, p1, p2, p3) => `${p3}年${monthMap[p2]}月${p1}日`
					],
					[/^Your work (.*) was deleted\.$/, '您的作品 $1 已被删除。'],
					[/^Unsubscribe from (.*)$/, '取消订阅 $1']
				],
				'selector': [
					['#tos_prompt button[name=commit]', '我同意并已阅读服务条款'],
					['.actions a.comment_form_placement_open', '评论'],
					['#main .comment_error', '评论不能为空白。'],
					['.post.comment .submit input[type=submit]', '评论'],
					['form#new_comment .actions input[name=commit]', '评论'],
					['#kudo_submit', '点赞'],
					[/^Chapter (\d+)$/, '第 $1 章']
				]
			},

			'flexible': {

				'You searched for:': '您搜索了：',
				'Moderated': '审核制',
				'Unmoderated': '非审核制',
				'Unrevealed': '未揭晓',
				'Anonymous': '匿名',
				'Gift Exchange Challenges': '赠文交换活动',
				'Gift Exchange Challenge': '赠文交换活动',
				'Prompt Meme Challenges': '接梗挑战',
				'Prompt Meme Challenge': '接梗挑战',
				'Bookmarked Items': '已创建书签作品',

				'Not Rated': '未分级',
				'No rating': '未分级',
				'No category': '未分类',
				'General Audiences': '全年龄',
				'Teen And Up Audiences': '青少年及以上',
				'Mature': '成人向',
				'Explicit': '限制级',

				'F/F': '女/女',
				'F/M': '女/男',
				'Gen': '无CP',
				'M/M': '男/男',
				'Multi-Fandom': '跨圈',
				'Original Work': '原创作品',
				'Multi': '多配对',
				'Choose Not To Use Archive Warnings': '不使用 Archive 预警',
				'Creator Chose Not To Use Archive Warnings': '不使用 Archive 预警',
				'No Archive Warnings Apply': ' Archive 预警不适用',
				'Graphic Depictions Of Violence': '暴力场景描写',
				'Major Character Death': '主要角色死亡',
				'Underage Sex': '未成年性行为',
				'Rape/Non-Con': '强暴/非自愿性行为',

			},
			'common': {
				'static': {},
				'regexp': [],
				'selector': []
			},
			'front_page': {
				'static': {
					'What is AO3?': 'AO3 是什么？',
					'Follow @AO3_Status on Twitter for news and updates!': '在 Twitter 上关注 @AO3_Status 获取新闻和更新！',
				},
				'regexp': [],
				'selector': [
					['.front.home-banner .heading a', '进入 AO3'],
				]
			},
			// 作品搜索
			'works_search': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'works_search_results': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			// 用户搜索
			'people_search': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'people_search_results': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			// 书签搜索
			'bookmarks_search': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'bookmarks_search_results': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			// 标签搜索
			'tags_search': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'tags_search_results': {
				'static': {}, 'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'dashboard': {
				'static': {
				},
				'regexp': [],
				'selector': []
			},
			'profile': {
				'static': {
					'User Profile': '用户资料',
					'My Pseud': '我的笔名',
					'Pseuds': '笔名',
					'Joined': '加入日期',
					'Bio': '个人简介',
					'Dismiss permanently': '永久关闭此信息',
					'Hide first login help banner': '隐藏首次登录帮助横幅',
					'×': '×',
				},
				'innerHTML_regexp': [
					['p.alt.message',
						/^\s*You don't have anything posted under this name yet\.\s*Would you like to\s*<a (href="\/works\/new")>post a new work<\/a>\s*or maybe\s*<a (href="\/external_works\/new")>a new bookmark<\/a>\s*\?\s*$/s,
						'您还没有以这个笔名发布任何作品。您想要<a $1>发布新作品</a>或者创建<a $2>一个新的书签</a>吗？'
					]
				],
				'regexp': [],
				'selector': []
			},
			'works_edit': {
				'static': {
					'Edit Work': '编辑作品',
					'Add Chapter': '添加章节',
					'Edit Chapter:': '编辑章节:',
				},
				'regexp': [], 'selector': [], 'innerHTML_regexp': []
			},
			'works_new': {
				'static': {
					'Post New Work': '发布新作品',
					'Import From An Existing URL Instead?': '从现有 URL 导入',
					'* Required information': '* 处为必填信息',
					'Tags are comma separated, 150 characters per tag. Fandom, relationship, character, and additional tags must not add up to more than 75. Archive warning, category, and rating tags do not count toward this limit.': '标签以逗号分隔，每个标签最多 150 字符。同人圈、关系、角色及附加标签总计不得超过 75 字符。Archive 预警、分类及分级标签不计入此限制。',
					'Rating*': '分级*',
					'Archive Warnings*': 'Archive 预警*',
					'Fandoms*': '同人圈*',
					'If this is the first work for a fandom, it may not show up in the fandoms page for a day or two.': '如果这是该同人圈的第一篇作品，可能需要一两天才会出现在同人圈页面。',
					'Preface': '前言',
					'Work Title*': '作品标题*',
					'We need a title! (At least 1 character long, please.)': '需要一个标题！(请至少输入 1 个字符)',
					'Add co-creators?': '添加共创者？',
					'at the beginning': '在开头',
					'at the end': '在结尾',
					'End Notes': '尾注',
					'Associations': '关联',
					'Post to Collections / Challenges': '发布到合集/挑战',
					'Gift this work to': '将此作品赠送给',
					'This work is a remix, a translation, a podfic, or was inspired by another work': '此作品为改编、译作、有声读物或衍生自另一作品',
					'This work is part of a series': '此作品为一个系列的一部分',
					'This work has multiple chapters': '此作品包含多个章节',
					'Set a different publication date': '设置一个不同的发布日期',
					'Choose a language *': '选择语言*',
					'Please select a language': '请选择语言',
					'Select work skin': '选择作品界面',
					'Basic Formatting': '基本界面',
					'Homestuck Skin': 'Homestuck 界面',
					'Undertale Work Skin': 'Undertale 界面',
					'Only show your work to registered users': '仅向注册用户展示',
					'Enable comment moderation': '启用评论审核',
					'Registered users and guests can comment': '注册用户及游客可评论',
					'Only registered users can comment': '仅注册用户可评论',
					'No one can comment': '禁止评论',
					'Work Text*': '作品正文*',
					'Rich Text': '富文本',
					'Preview': '预览',
					'Brevity is the soul of wit, but your content does have to be at least 10 characters long.': '简洁乃智慧之魂，但您的内容长度必须至少 10 个字符。',
					'Sorry! We couldn\'t save this work because:': '抱歉！我们无法保存此作品，因为：', 'Language cannot be blank.': '语言不能为空。', 'Please fill in at least one fandom.': '请至少填写一个同人圈。', 'Please select at least one warning.': '请至少选择一个预警。',
					'For a work in the Archive, only the URL is required.': '对于 Archive 站内的作品，仅需填写 URL。',
					'This is a translation': '这是一个译本',
					'Choose one of your existing series:': '选择一个您已有的系列：',
					'Please select': '请选择',
					'Or create and use a new one:': '或创建并使用一个新系列：',
					'Chapter Title:': '章节标题：',
					'Set publication date': '设置发布日期',
				},
				'innerHTML_regexp': [
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
					['fieldset.work.text p.notice', /<strong>Note:<\/strong> Text entered in the posting form is <strong>not<\/strong> automatically saved\. Always keep a backup copy of your work\./s, '<strong>注意：</strong>在发布表单中输入的文本<strong>不会</strong>自动保存。请务必保留作品的备份。'],
					[
						'fieldset.create p.notice',
						/All works you post on AO3 must comply with our <a href="\/content">(Content Policy|内容政策)<\/a>\. For more information, please refer to our <a href="\/tos_faq#content_faq">(?:Terms of Service FAQ|服务条款常见问题)<\/a>\./s,
						'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
					],
				],
				'regexp': [],
				'selector': [
					['dt.permissions.comments', '谁可以评论此作品'],
					['#chapters-options label[for="work_wip_length"]', '第 1 章 / 共']
				]
			},
			'works_import': {
				'static': {
					'Import New Work': '导入新作品',
					'Please note! Fanfiction.net, Wattpad.com, and Quotev.com do not allow imports from their sites.': '请注意！FanFiction.net、Wattpad.com 和 Quotev.com 不允许从其站点导入内容。',
					'Post New Work Instead?': '改为发布新作品',
					'Works URLs': '作品 URL',
					'Rating*': '分级*',
					'Archive Warnings*': 'Archive 预警*',
					'Fandoms*': '同人圈*',
					'Choose a language*': '选择语言*',
					'Please select a language': '请选择语言',
					'Set custom encoding': '设置自定义编码',
					'Import as': '作为以下内容导入',
					'Works (limit of 25)': '作品（限 25 个）',
					'Chapters in a single work (limit of 200)': '单部作品的多个章节（限 200 个）',
					'Preferences': '偏好设置',
					'Post without previewing.': '不预览直接发布。',
					'Override tags and notes': '覆盖标签和说明',
					'Enable comment moderation': '启用评论审核',
					'Registered users and guests can comment': '注册用户及游客可评论',
					'Only registered users can comment': '仅注册用户可评论',
					'No one can comment': '禁止评论',
					'Set the following tags and/or notes on all works, overriding whatever the importer finds in the content.': '对所有导入的作品设置以下标签和/或说明，覆盖导入工具从内容中提取的信息。',
					'Use values extracted from the content for blank fields if possible': '如果可能，对空白字段使用从内容中提取的值',
					'Do not use values extracted from the content at all; use Archive defaults for blank fields': '完全不使用从内容中提取的值；对空白字段使用 Archive 默认值',
					'Only show imported works to registered users': '仅向注册用户展示导入的作品',
					'Notes at the beginning': '将注释放在开头',
					'Submit': '提交',
					'Import': '导入'
				},
				'innerHTML_regexp': [
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
					[
						'div.notice p',
						/You might find the <a href="\/faq\/posting-and-editing#importwork">Import FAQ<\/a> useful\./s,
						'<a href="/faq/posting-and-editing#importwork">导入常见问题</a>可能会对您有所帮助。'
					],
					[
						'p.footnote#url-field-description',
						/URLs for existing work\(s\) or for the chapters of a single work; <strong>one URL per line\.<\/strong>/s,
						'现有作品或单部作品各章节的 URL ；<strong>每行一个 URL 。</strong>'
					],
					[
						'p.note',
						/Tags are comma separated, 150 characters per tag\. Fandom, relationship, character, and additional tags must not add up to more than 75\. Archive warning, category, and rating tags do not count toward this limit\./s,
						'标签以逗号分隔，每个标签最多 150 字符。同人圈、关系、角色及附加标签总计不得超过 75 字符。Archive 预警、分类及分级标签不计入此限制。'
					],
					[
						'p.footnote',
						/If this is the first work for a fandom, it may not show up in the fandoms page for a day or two\./s,
						'如果这是该同人圈的第一篇作品，可能需要一两天才会出现在同人圈页面。'
					],
					[
						'fieldset p.notice',
						/All works you post on AO3 must comply with our <a href="\/content">(Content Policy|内容政策)<\/a>\. For more information, please refer to our <a href="\/tos_faq#content_faq">(?:Terms of Service FAQ|服务条款常见问题)<\/a>\./s,
						'您在 AO3 发布的所有作品均必须遵守我们的<a href="/content">内容政策</a>。更多信息请参阅我们的<a href="/tos_faq#content_faq">服务条款常见问题</a>。'
					],
				],
				'regexp': [],
				'selector': [
					['dt.permissions.comments', '谁可以评论此作品']
				]
			},
			'chapters_new': {
				'static': {
					'Post New Chapter': '发布新章节',
					'Name, Order and Date': '名称、顺序和日期',
					'Chapter Title': '章节标题',
					'Chapter Number': '章节编号',
					'Chapter Publication Date': '章节发布日期',
					'Chapter Preface': '章节前言',
					'Chapter Summary': '章节简介',
					'Chapter Notes': '章节注释',
					'End Notes': '尾注',
					'Chapter Text*': '章节正文*',
					'Post Chapter': '发布章节',
					'Warning: Unchecking this box will delete the existing beginning note.': '警告：取消勾选此框将删除已有的开头注释。',
					'Warning: Unchecking this box will delete the existing end note.': '警告：取消勾选此框将删除已有的结尾注释。'
				},
				'selector': [
					['label[for="chapter_wip_length"]', '共']
				]
			},
			'works_edit_tags': {
				'static': {
					'Post Work': '发布作品',
					'Update': '更新'
				},
				'innerHTML_regexp': [
					[
						'h2.heading',
						/^\s*Edit Work Tags for (.*)\s*$/s,
						'编辑作品标签：$1 '
					]
				],
				'selector': []
			},
			'chapters_edit': {
				'static': {}
			},
			'orphans_new': {
				'static': {
					'Take my pseud off as well': '同时移除我的笔名',
					'Leave a copy of my pseud on': '保留我的笔名副本',
					'Read More About The Orphaning Process': '阅读更多关于匿名流程的信息',
					'Yes, I\'m sure': '是的，我确定'
				},
				'innerHTML_regexp': [
					[
						'p.caution.notice',
						/Orphaning will\s*<strong>permanently<\/strong>\s*remove all identifying data from the following work\(s\), their chapters, associated series, and any feedback replies you may have left on them\./s,
						'匿名化操作将<strong>永久</strong>移除以下作品、其章节、关联系列以及您可能留下的任何反馈回复中的所有身份识别信息。'
					],
					[
						'p.caution.notice',
						/Orphaning a work removes it from your account and re-attaches it to the specially created orphan_account\. Please note that this is\s*<strong>permanent and irreversible\.<\/strong>\s*You are giving up control over the work,\s*<strong>including the ability to edit or delete it\.<\/strong>/s,
						'匿名化作品会将其从您的账户中移除，并重新关联至专门创建的 orphan_account（匿名帐户）。请注意，此操作是<strong>永久且不可逆的。</strong>您将放弃对该作品的控制权，<strong>包括编辑或删除它的能力。</strong>'
					],
					[
						'p.caution.notice',
						/Are you\s*<strong>really<\/strong>\s*sure you want to do this\?/s,
						'您<strong>真的</strong>确定要这样做吗？'
					]
				],
				'selector': []
			},
			'works_show_multiple': {
				'static': {
					'Edit Multiple Works': '编辑多个作品',
					'You have no works or drafts to edit.': '您没有可编辑的作品或草稿。',
					'All': '全选',
					'None': '取消勾选',
					'Actions': '操作',
					'Orphan': '匿名化'
				},
				'innerHTML_regexp': [
					[
						'fieldset.fandom.listbox > legend',
						/^Select (.*) works$/s,
						'选择 $1 的作品'
					]
				],
				'regexp': [
					[/\(Draft\)$/, '（草稿）']
				]
			},
			'works_edit_multiple': {
				'static': {
					'Edit Multiple Works': '编辑多个作品',
					'Visibility': '可见性',
					'Keep current visibility settings': '保持当前可见性设置',
					'Show to all': '对所有人可见',
					'Only show to registered users': '仅向注册用户展示',
					'Comment moderation': '评论审核',
					'Keep current comment moderation settings': '保持当前评论审核设置',
					'Disable comment moderation': '禁用评论审核',
					'Who can comment on these works': '谁可以评论这些作品',
					'Keep current comment settings': '保持当前评论设置',
					'Add co-creators': '添加共创者',
					'Choose a language': '选择语言',
					'Update All Works': '更新所有作品',
					'Are you sure? Remember this will replace all existing values!': '您确定吗？请记住，此操作将替换所有现有值！'
				},
				'innerHTML_regexp': [
					[
						'p.caution.notice',
						/^\s*Your edits will be applied to <strong>.*?<\/strong> of the following works:\s*$/s,
						'您的编辑将应用于以下<strong>全部</strong>作品：'
					],
					[
						'p.caution.notice',
						/^\s*Your edits will <strong>replace<\/strong> the existing values!\s*\(If you leave a field blank it will remain unchanged\.\)\s*$/s,
						'您的编辑将<strong>替换</strong>现有值（如果将字段留空，则不会进行更改）。'
					]
				]
			},
			'users_invitations': {
				'flexible': {
					'Unsent': '未发送',
					'Sent But Unused': '已发送但未使用',
					'Used': '已使用',

				},
				'static': {
					'Invite a friend': '邀请好友',
					'Invitations': '邀请',
					'Manage Invitations': '管理邀请',
					'Request Invitations': '获取邀请',
					'Your Invitations': '您的邀请',
					'Manage:': '管理：',
					'All': '全部'
				},
				'innerHTML_regexp': [
					['div.module p', /Sorry, you have no unsent invitations right now\. <a href="\/user_invite_requests\/new">Request invitations<\/a>/s, '抱歉，您当前没有未发送的邀请。<a href="/user_invite_requests/new">获取邀请</a>']
				]
			},
			'users_common': {
				'static': {
					'Profile': '个人资料',
				},
			},
			'users_settings': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
			},
			'users_block_mute_list': {
				'static': {
					'Blocked Users': '已屏蔽用户',
					'Muted Users': '已静音用户',
					'Block a user': '屏蔽用户',
					'Mute a user': '静音用户',
					'Block': '屏蔽',
					'Mute': '静音',
					'Unblock': '取消屏蔽',
					'Unmute': '取消静音',
					'You have not muted any users.': '您尚未静音任何用户。',
					'You have not blocked any users.': '您尚未屏蔽任何用户。'
				},
				'innerHTML_regexp': [
					[
						'div.notice',
						/^\s*<p>You can block up to 2,000 users\. Blocking a user prevents them from:<\/p>[\s\S]*?<a href="(\/users\/[^\/]+\/muted\/users)">your Muted Users page<\/a>\.<\/p>\s*$/s,
						`<p>您最多可以屏蔽 2,000 位用户。屏蔽用户后，她们将无法：</p>
	                        <ul>
	                        <li>在您的作品上发表评论或留下点赞</li>
	                        <li>在站点任何地方回复您的评论</li>
	                        <li>在活动分配和认领同人梗之外赠送作品给您</li>
	                        </ul>
	                        <p>屏蔽用户不会：</p>
	                        <ul>
	                        <li>隐藏您所屏蔽用户的作品或书签</li>
	                        <li>删除或隐藏她们之前在您作品上留下的评论；您可以逐条删除</li>
	                        <li>隐藏她们在站点其她地方的评论</li>
	                        </ul>
	                        <p>如需隐藏某用户的作品、书签、系列和评论，请访问<a href="$1">已静音用户页面</a>。</p>`
					],
					[
						'div.notice',
						/^\s*<p>You can mute up to 2,000 users\. Muting a user:<\/p>[\s\S]*?<a href="(\/users\/[^\/]+\/blocked\/users)">your Blocked Users page<\/a>\.[\s\S]*?<a href="(\/faq\/skins-and-archive-interface#restoresiteskin)">instructions for reverting to the default site skin<\/a>\.\s*<\/p>\s*$/s,
						`<p>您最多可静音 2,000 位用户。静音用户后：</p>
	                        <ul>
	                        <li>她们的作品、系列、书签和评论将完全对您隐藏；不会留下空白空间、占位文本或其她任何提示</li>
	                        </ul>
	                        <p>静音用户不会：</p>
	                        <ul>
	                        <li>阻止您接收来自该用户的评论或订阅邮件</li>
	                        <li>将她们的内容隐藏给其她任何人</li>
	                        </ul>
	                        <p>如需阻止某用户在您的作品上发表评论或在站点其她地方回复您的评论，请访问<a href="$1">已屏蔽用户页面</a>。</p>
	                        <p>请注意，如果您未使用默认站点界面，静音功能可能无法正常工作。要了解有关<a href="$2">如何恢复默认站点界面</a>的说明，请参阅界面与 Archive 界面常见问题 。</p>`
					]
				],
				'regexp': [],
				'selector': []
			},
			'preferences': {
				'static': {
					'Edit My Preferences': '编辑我的偏好设置',
					'Privacy': '隐私设置',
					'Interface': '界面设置',
					'Work Display': '作品显示',
					'Site Skins': '站点界面',
					'When I post a work, credit me as:': '当我发布作品时，署名方式：',
					'Show': '显示',
					'Hide': '隐藏',
					'Turn on Creator Styles': '启用创作者界面样式',
					'Update': '确定',
				},
				'regexp': [],
				'selector': []
			},
			'skins': {
				'static': {
					'Public Site Skins': '公共站点界面',
					'Create Site Skin': '创建新界面',
					'Edit Skin': '编辑界面',
					'Description': '描述',
					'Use': '使用',
					'Preview': '预览',
					'Set For Session': '为本次会话设置',
					'Create New Skin': '创建新界面',
					'Write Custom CSS': '编写自定义 CSS',
					'Use Wizard': '使用向导',
					'* Required information': '* 处为必填信息',
					'Type*': '类型*',
					'Title*': '标题*',
					'Site Skin': '站点界面',
					'Work Skin': '作品界面',
					'Upload a preview (png, jpeg or gif)': '上传预览（PNG、JPEG 或 GIF）',
					'Apply to make public': '应用并公开',
					'Advanced': '高级',
					'Show ↓': '显示 ↓',
					'Hide ↑': '隐藏 ↑',
					'Conditions': '条件',
					'What it does:': '作用：',
					'add on to archive skin': '添加到 Archive 界面',
					'replace archive skin entirely': '完全替换 Archive 界面',
					'IE Only:': '仅限 IE：',
					'Parent Only:': '仅限母级：',
					'Media:': '媒体：',
					'Choose @media': '选择 @media',
					'Parent Skins': '母级界面',
					'Add parent skin': '添加母级界面',
					'Actions': '操作',
					'Submit': '提交',
					'Site Skin Wizard': '站点界面向导',
					'Fonts and Whitespace': '字体与留白',
					'Font': '字体',
					'Colors': '颜色设置',
					'Percent of browser font size': '浏览器字体大小百分比',
					'Work margin width': '作品页边距宽度',
					'Vertical gap between paragraphs': '段落垂直间距',
					'Background color': '背景色',
					'Text color': '文字颜色',
					'Header color': '页眉颜色',
					'Accent color': '强调色',
					'This form allows you to create a new site or work skin. Select "Work Skin" or "Site Skin" in the Type option list to choose which type of skin you are creating.': '此表单允许您创建新的站点或作品界面。在“类型”选项列表中选择“作品界面”或“站点界面”以指定创建的界面类型。',
				},
				'innerHTML_regexp': [
					['p.notes', /^\s*This wizard only creates site skins\.\s*You can also <a href="\/skins\/new\?skin_type=WorkSkin">create a work skin<\/a> which can be used to add styling to works that you post\.\s*<a[^>]*><span class="symbol question"><span>\?<\/span><\/span><\/a>\s*$/, '此向导仅创建站点界面。您也可以<a href="/skins/new?skin_type=WorkSkin">创建作品界面</a>，用于为您发布的作品添加样式。<a class="help symbol question modal modal-attached" title="Skins basics" href="/help/skins-basics.html" aria-controls="modal"><span class="symbol question"><span>?</span></span></a>'],
					['p.notes', /^\s*You may wish to refer to this <a href="https:\/\/www\.w3schools\.com\/colors\/colors_names\.asp">handy list of colors<\/a>\.\s*$/, '您可以参考这份<a href="https://www.w3schools.com/colors/colors_names.asp">实用的颜色列表</a>。'],
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
					['p.footnote#font-field-notes', /^\s*Comma-separated list of font names\.\s*$/, '以逗号分隔的字体名称列表。'],
					['p.footnote#base-em-field-notes', /^\s*Numbers only, treated as a percentage of the browser's default font size\. Default: <code>100<\/code>\s*$/, '仅限数字，表示相对于浏览器默认字体大小的百分比。默认值：<code>100</code>'],
					['p.footnote#margin-field-notes', /^\s*Numbers only, treated as a percentage of the page width\.\s*$/, '仅限数字，表示相对于页面宽度的百分比。'],
					['p.footnote#paragraph-margin-field-notes', /^\s*Numbers only, treated as a multipler of the paragraph font size\. Default: <code>1\.286<\/code>\s*$/, '仅限数字，表示相对于段落字体大小的倍数。默认值：<code>1.286</code>'],
					['p.footnote#background-color-field-notes', /^\s*Name or hex code\. Default: <code>#fff<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#fff</code>'],
					['p.footnote#foreground-color-field-notes', /^\s*Name or hex code\. Default: <code>#2a2a2a<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#2a2a2a</code>'],
					['p.footnote#header-color-field-notes', /^\s*Name or hex code\. Default: <code>#900<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#900</code>'],
					['p.footnote#accent-color-field-notes', /^\s*Name or hex code\. Default: <code>#ddd<\/code>\s*$/, '名称或十六进制代码。默认值：<code>#ddd</code>']
				],
				'regexp': [
					[/^Must be present\.$/, '必须提供']
				],
				'selector': []
			},
			'users_works_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_drafts_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_series_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_bookmarks_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_collections_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_subscriptions_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_related_works_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_gifts_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': [],
			},
			'users_signups': {
				'static': {
					'Challenge Sign-ups': '挑战活动报名'
				},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'users_stats': {
				'static': {
					'Navigation and Sorting': '导航与排序',
					'Stats': '数据统计',
					'All Years': '所有年份',
					'Totals': '总计',
					'User Subscriptions:': '用户订阅:',
					'Comment Threads:': '评论串:',
					'Subscriptions:': '作品订阅:',
					'View Sorting and Actions': '视图排序与操作',
					'Fandoms View': '同人圈视图',
					'Flat View': '平铺视图',
					'Listing Statistics': '列表统计',
					'Comment Threads': '评论串',
					'Subscriptions': '订阅列表'
				},
				'innerHTML_regexp': [
					['span.words', /^\(([\d,]+)\s+words\)$/s, '（$1 字）']
				],
				'regexp': [],
				'selector': []
			},
			'works_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'works_show': {
				'static': {
					'Download': '下载',
					'Subscribe': '订阅',
					'Unsubscribe': '取消订阅',
					'kudos': ' 个赞',
					'Comments': '评论',
					'Chapter Notes': '章节注释',
					'Work Notes': '作品注释',
					'End Notes': '章节尾注',
					'Inspired by': '灵感来源于',
				},
				'innerHTML_regexp': [],
				'regexp': [
					[/^Chapter (\d+) of (\d+)$/, '第 $1 章 / 共 $2 章'],
					[/^Chapter (\d+)$/, '第 $1 章'],
				],
				'selector': [
					['#workskin .preface .notes .landmark', '注释'],
				]
			},
			'series_index': {
				'static': {}, 'innerHTML_regexp': [], 'regexp': [], 'selector': []
			},
			'series_show': {
				'static': {
					'Works in Series': '系列中的作品',
					'Series Begun': '系列开始于',
					'Series Updated': '系列更新于',
					'Words': '总字数',
					'Description': '系列描述',
				},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'tags_index': {
				'static': {
					'Canonical Tags': '规范标签',
					'Uncategorized Tags': '未分类标签',
					'Browse Tags': '浏览标签',
				},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'tags_show': {
				'static': {
					'Works in Tag': '此标签下的作品',
					'Filter': '筛选',
					'Related Tags': '相关标签',
					'Meta Tag': '元标签',
					'Sub Tag': '子标签',
					'Synonymous Tag': '同义标签',
				},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'tag_sets_index': {
				'static': {
					'New Tag Set': '新建标签集',
					'Nominate': '提名',

				},
				'innerHTML_regexp': [
					['dl.stats', /(Fandoms:|Characters:|Relationships:|Additional Tags:)/g, (match) => {
						const translationMap = {
							'Fandoms:': '同人圈：',
							'Characters:': '角色：',
							'Relationships:': '关系：',
							'Additional Tags:': '附加标签：'
						};
						return translationMap[match] || match;
					}]
				],
				'regexp': [],
				'selector': []
			},
			'tag_sets_nominations_new': {
				'flexible': {
					'Relationship': '关系',
				},
				'static': {
					// 表单区域标题
					'Basic Information': '基本信息',
					'Submit': '提交',
					'Tag Nominations': '标签提名',
					'Nominate Tags Form': '提名标签表单',
					'Fandom?': '同人圈？',

					// 标签与提示
					'Nominating For:': '提名对象：',
					'Pseud:': '笔名：',

					// 页面说明文字
					'The autocomplete lists canonical tags for you. Please choose the canonical version of your tag if there is one.': '自动补全列表会为您列出规范标签。如存在规范版本，请选择。',
					'The tag set moderators might change or leave out your nominations (sometimes just because a different form of your nomination was included).': '标签集管理员可能会更改或忽略您的提名（有时仅因已收录了另一种形式）。',
					'Nominations are not forever! Don\'t be confused if you come back in a few months and they are gone: they may have been cleaned up.': '提名并非永久保留！几个月后回来如发现提名消失，请勿感到困惑：可能已被清理。',
					'If crossover relationships are allowed, you can enter them under either fandom.': '若允许跨圈关系，可在任一同人圈下输入。',

					'Specifying Fandom': '指定同人圈',
					'Tagset fandom for child': '子标签集同人圈',
					'Close': '关闭'
				},
				'innerHTML_regexp': [
					['h2.heading', /^Tag Nominations for (.*?)$/, '为 “$1” 提名标签'],
					['ul.navigation.actions a[href*="/tag_sets/"]', /^Back To (.*?)$/, '返回 “$1”'],
					['#modal .content.userstuff p',
						/^\s*You only need to specify the fandom if your nomination is new or not in the fandom already -- for instance, if you're\s*submitting a character who has just appeared in the fandom\.\s*This information is just used to help the moderators sort out new tags\.\s*$/s,
						'仅当您的提名为新标签或尚未存在于该同人圈时才需指定同人圈——例如，您提交的角色刚出现在该同人圈中。此信息仅用于帮助管理员整理新标签。'
					]
				],
				'regexp': [
					[/^You can nominate up to .*$/, translateNominationRule],

					[/^Fandom (\d+)$/, '同人圈 $1'],
					[/^Additional Tag (\d+)$/, '附加标签 $1']
				],
				'selector': []
			},
			'owned_tag_sets_show': {
				'flexible': {
					'Ratings': '分级',
					'Additional Tags': '附加标签',
					'Categories': '分类',
					'Warnings': '预警',
					'No Media': '无媒体',
					'Unassociated Characters & Relationships': '未关联的角色与关系',
				},
				'static': {
					'Nominate': '提名',
					'All Tag Sets': '所有标签集',
					'Created on:': '创建日期：',
					'Maintainers:': '维护者：',
					'Description:': '简介：',
					'Status:': '状态：',
					'Stats:': '统计数据：',
					'Nominations allowed per person:': '每人可提名数量：',
					'Expand All': '展开全部',
					'Contract All': '收起全部',
					'Medium: Fanfiction': '媒介：同人文',
					'The following characters and relationships don\'t seem to be associated with any fandom in the tagset. You might need to add the fandom, or set up associations for them.': '以下角色与关系似乎尚未与标签集中的任何同人圈关联。您可能需要添加所属同人圈，或为其建立关联。',
					'The moderators have chosen not to make the tags in this set visible to the public (possibly while nominations are underway).': '标签集管理员已选择暂不向公众展示此标签集中的标签（可能是因为提名正在进行中）。',
					'Metadata': '元数据',
					'Listing Tags': '标签列表',
				},
				'innerHTML_regexp': [
					['h2.heading', /^About (.*)$/, '关于 “$1”'],
					['dd', /<strong>Open<\/strong> to the public\./, '对公众开放。'],
					['dl.stats', /(Fandoms:|Characters:|Relationships:|Freeforms:)/g, (match) => {
						const translationMap = {
							'Fandoms:': '同人圈：',
							'Characters:': '角色：',
							'Relationships:': '关系：',
							'Freeforms:': '自由形式：'
						};
						return translationMap[match] || match;
					}],
				],
				'regexp': [
					[/^Medium: Art - Character$/, '媒介：画作-角色'],
					[/^Medium: Fanvid - Character$/, '媒介：同人视频-角色'],
					[/^Medium: Other - Character$/, '媒介：其她-角色'],
				],
				'selector': []
			},
			'tag_sets_new': {
				'static': {
					'Create A Tag Set': '创建标签集',
					'Back to Tag Sets': '返回标签集',
					'Management': '管理',
					'Description': '简介',
					'Nomination Limits': '提名限制',
					'Tags In Set': '标签集内标签',
					'Tags in Set': '标签集内标签',
					'Tag Associations': '标签关联',
					'Actions': '操作',
					'Ratings': '评级',
					'Tag sets are used for running a challenge.': '标签集用于举办挑战活动。',
					'"Visible" tag sets are shown to all users.': '“可见”标签集会向所有用户展示。',
					'"Usable" tag sets can be used by others in their challenges.': '“可用”标签集可供她人在其挑战中使用。',
					'Tag sets that are open to nominations can take nominations from the public.': '开放提名的标签集可接受公众提名。',
					'Tag names have to be unique. If necessary the archive may add on the tag type. (For instance, if you entered a character "Firefly", you\'d see "Firefly - Character" in your tag set instead since the tag Firefly is already used for the show.': '标签名称必须唯一。如有必要，Archive 会自动添加标签类型后缀。（例如，若您输入角色名“Firefly”，由于已有同名标签用于剧集，该标签会在您的标签集中显示为“Firefly - Character”。）',
					'Current Owners': '当前所有者',
					'Add/Remove Owners:': '添加/移除所有者：',
					'Current Moderators': '当前管理员',
					'Add/Remove Moderators:': '添加/移除管理员：',
					'Title* (text only)': '标题*（仅限文本）',
					'Brief Description': '简要描述',
					'Visible tag list?': '可见标签列表？',
					'Usable by others?': '可被她人使用？',
					'Currently taking nominations?': '当前接受提名？',
					'Fandom nomination limit': '同人圈提名限制',
					'Character nomination limit': '角色提名限制',
					'Relationship nomination limit': '关系提名限制',
					'Freeform nomination limit': '自由标签提名限制',
					'Add Fandoms:': '添加同人圈：',
					'Add Characters:': '添加角色：',
					'Add Relationships:': '添加关系：',
					'All': '全选',
					'None': '取消勾选',
					'Tag Set Associations': '标签集关联',
					'Tagset tag associations': '标签集：标签关联 帮助',
					'Close': '关闭'
				},
				'innerHTML_regexp': [
					['h4.heading > label[for*="freeform"]', /Add Additional Tags:/, '添加附加标签：'],
					['form > fieldset:nth-of-type(1) > p.notes', /^\s*To add or remove an owner or moderator, enter their name\. If they are already on the list they will be removed; if not, they will be added\.\s*You can't remove the sole owner of a tag set\.\s*$/, '要添加或移除所有者或管理员，请输入其用户名。若已在列表中则移除，否则将被添加。无法移除唯一所有者。'],
					['#nomination_limits .notes li:nth-of-type(1)', /If you allow <em>both<\/em> fandoms and characters\/relationships in the same tag set,\s*the number of characters\/relationships is <strong>per fandom<\/strong> 。/s, '如果您在同一标签集中同时允许提名同人圈和角色/关系，那么角色/关系的数量是<strong>按每个同人圈计算</strong>的。'],
					['#nomination_limits .notes li:nth-of-type(2)', /If that's not what you want, you\s*can have users nominate fandoms in one tag set, and characters\/relationships in another tag set\. Then use both tag sets in your challenge settings\./s, '如果这不是您想要的效果，您可以让用户在一个标签集中提名同人圈，在另一个标签集中提名角色/关系。然后在您的挑战设置中同时使用这两个标签集。'],
					['#modal .content.userstuff p:nth-of-type(1)', /Tag associations let you set up associations between the fandoms, characters, and relationships in your tag set, which then\s+lets your participants pick from only the characters and relationships in a given fandom\./s, '标签关联功能允许您在所选同人圈、角色和关系之间建立关联，从而让参与者仅从指定同人圈中的角色和关系中进行选择。'],
					['#modal .content.userstuff p:nth-of-type(2)', /Note: if the wranglers have already set up these associations, then you can just add the additional\s+ones that you would like -- you don't have to \(and in fact aren't allowed\) to create copies of canonical\s+associations\. You can still limit your participants' choices to tags actually in your set\./s, '注意：如果标签管理员已经建立了这些关联，您只需添加想要的关联即可——无需（且实际上也不被允许）复制已有的规范关联。您仍可将参与者的选项限制在标签集中已有的标签范围内。'],
					['#modal .content.userstuff p:nth-of-type(3)', /If you're not sure how this might work, try adding a few fandoms and characters and setting up some associations,\s+and then set up your challenge and try out the sign-up form!/s, '如果不确定此功能如何运作，请尝试添加一些同人圈和角色并建立关联，然后创建您的挑战活动并在报名表中进行测试！']
				],
				'regexp': [],
				'selector': []
			},
			'collections_index': {
				'flexible': {
					'Moderated': '审核制',
					'Fandoms': '同人圈',
					'Works': '作品',
					'Open,': '开放中,',
					'Closed,': '已截止,',
				},
				'static': {
					'Sign Up': '报名',
				},
				'innerHTML_regexp': [
					['h3.heading', /(\d+\s*-\s*\d+)\s+of\s+([\d,]+)\s+Collections/s, '第 $1 个，共 $2 个合集']
				],
				'regexp': [
					[/^You have applied to join (.*)\.$/, '您已申请加入 $1。'],
					[/^Removed (\w+) from collection\.$/, '已将 $1 从合集中移除。']
				],
				'selector': []
			},
			'bookmarks_index': {
				'static': {
					'My Bookmarks': '我的书签',
					'Recs': '推荐',
					'Private': '私密',
					'Public': '公开',
					'Notes & Tags': '笔记和标签',
					'Your tags': '标签',
					'The creator\'s tags are added automatically.': '创建者的标签会自动添加',
					'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
					'Add to collections': '添加到合集',
					'Private bookmark': '私人书签',
					'Create': '创建',
				},
				'innerHTML_regexp': [
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
				],
				'regexp': [],
				'selector': []
			},
			'bookmarks_show': {
				'static': {
					'Bookmark by': '书签创建者：',
					'Bookmarker\'s Tags': '书签创建者的标签',
					'Bookmarker\'s Notes': '书签创建者的注释',
				},
				'regexp': [],
				'selector': []
			},
			'collections_show': {
				'static': {
					'Collection by': '合集创建者',
					'Maintainers': '维护者',
					'Challenge': '挑战',
					'Gift Exchange': '赠文交换',
					'Prompt Meme': '接梗挑战',
					'Rules': '规则',
					'FAQ': '常见问题',
					'Sign-up': '报名',
					'Assignments': '任务中心',
					'Post to Collection': '发布到此合集',
				},
				'regexp': [],
				'selector': []
			},
			'collections_new': {
				'static': {
					'New Collection': '新建合集',
					'Suggestions': '建议',
					'New Collection Form': '新建合集表单',
					'* Required information': '* 处为必填信息',
					'Header': '页眉',
					'Collection name*': '合集名称*',
					'Display title*': '显示标题*',
					'Parent collection (that you maintain)': '母合集（由您维护）',
					'Collection email': '合集电子邮箱',
					'Custom header URL': '自定义页眉 URL',
					'Icon': '图标',
					'Upload a new icon': '上传新图标',
					'Icon alt text': '图标替代文本',
					'Icon comment text': '图标注释文本',
					'Brief description': '简要描述',
					'Preferences': '偏好设置',
					'This collection is moderated': '此合集需审核',
					'This collection is closed': '此合集为关闭状态',
					'This collection is unrevealed': '此合集为未公开状态',
					'This collection is anonymous': '此合集为匿名状态',
					'Show random works on the front page instead of the most recent': '在主页随机显示作品，而不是最新作品',
					'Send a message to the collection email when a work is added': '作品添加时向合集电子邮箱发送通知',
					'Type of challenge, if any': '活动类型（如有）',
					'Gift Exchange': '赠文交换',
					'Prompt Meme': '接梗挑战',
					'Notice to challenge creators': '活动创建者须知',
					'Profile': '概述',
					'Plain text with limited HTML': '纯文本，支持有限 HTML',
					'Introduction': '介绍',
					'FAQ': '常见问题',
					'Rules': '规则',
					'Assignment notification message': '分配通知信息',
					'Gift notification message': '赠文通知信息',
					'Actions': '操作',
				},
				'innerHTML_regexp': [
					['h3.heading + ul.notes li:nth-of-type(1)', /^\s*Only registered users can post, so you don't need to worry about spam: you can leave your collection unmoderated\. You can always reject works afterwards if there <em>is<\/em> a mistaken submission\.\s*$/, '只有注册用户可以发布，因此您无需担心垃圾信息：您可以让您的合集不受审核。如有误提交，您随时可以事后拒绝作品。'],
					['h3.heading + ul.notes li:nth-of-type(2)', /^\s*The best way to set up a regular challenge \(e\.g\., an annual challenge like Yuletide,\s*or a weekly one like sga_flashfic\) is to create a closed parent collection and then add a new, open, subcollection for each challenge\.\s*$/, '设置常规活动（例如年度活动 Yuletide 或每周活动 sga_flashfic ）的最佳方式是创建一个封闭的母合集，然后为每次活动添加一个新的开放的子合集。'],
					['h3.heading + ul.notes li:nth-of-type(3)', /^\s*If you limit membership for each challenge \(e\.g\., for a gift exchange\), people can sign\s*up for each subcollection separately\. If you just want the whole thing moderated, have people sign up as members of the parent collection; they'll then be able to post in every subcollection\.\s*$/, '如果您为每次活动限制成员资格（例如赠文交换），用户可以分别报名加入每个子合集。如果您只想对整个活动进行审核，请让用户报名成为母合集的成员；这样她们就可以在所有子合集中发布内容。'],
					['p.footnote#name-field-notes', /^\s*1 to 255 characters \(A-Z, a-z, _, 0-9 only\), no spaces, cannot begin or end with underscore \(_\)\s*$/, '1 到 255 个字符（仅限 A–Z、a–z、_、0–9），禁止使用空格，且不能以下划线开头或结尾'],
					['p.footnote#title-field-notes', /^\s*\(text only\)\s*$/, '（仅限文本）'],
					['p.footnote#header-image-field-description', /^\s*JPG, GIF, PNG\s*$/, 'JPG、GIF、PNG'],
					['fieldset > legend + p', /^\s*You can also individually\s+Manage Items\s+in your collection\.\s*$/, '您也可以单独管理合集中的作品。'],
					['dd',
						/^\s*<ul class="notes">\s*<li>Each collection can have one icon<\/li>\s*<li>Icons can be in png, jpeg or gif form<\/li>\s*<li>Icons should be sized 100x100 pixels for best results<\/li>\s*<\/ul>\s*$/,
						'<ul class="notes"><li>每个合集可设置一个图标</li><li>图标可为 PNG、JPEG 或 GIF 格式</li><li>建议图标尺寸为 100×100 像素以获得最佳效果</li></ul>'],
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/g, '剩余 $1 字符'],
					['dd',
						/^\s*<ul class="notes">\s*<li>As a challenge owner, you may have access to challenge participants' email addresses\.<\/li>\s*<li>Use of those email addresses for any purpose other than running the challenge will lead to the termination of your account\.<\/li>\s*<\/ul>\s*$/,
						'<ul class="notes"><li>作为活动主办方，您可能可以获得参与者的邮箱地址。</li><li>将这些邮箱用于除活动运营以外的其她任何用途，将导致您的账户被永久停用。</li></ul>'],
					['fieldset.profile > p:first-of-type', /Plain text with limited HTML\s*(<a.*?<\/a>)/, '纯文本，支持有限 HTML $1'],
					['fieldset.profile > p.note', /^\s*Tip: if this is a subcollection or challenge, you don't need to repeat yourself: fields left blank will copy from your parent collection\.\s*$/, '提示：如果这是子合集或活动，您无需重复填写：留空字段将从母合集复制。'],
					['p#assignment-notification-field-description', /^\s*This will be sent out with assignments in a gift exchange challenge\. Plain text only\.\s*$/, '在赠文交换活动中，此信息将随分配一起发送。仅限纯文本。'],
					['p#gift-notification-field-description', /^\s*This will be sent out with each work notification when you "reveal" a gift exchange or prompt meme\. Plain text only\.\s*$/, '当您“揭晓”赠文交换或接梗挑战时，此信息将随每个作品通知发送。仅限纯文本。'],
				],
				'selector': [
					['input[name="commit"][value="Submit"]', '提交'],
				],
			},
			'collections_dashboard_common': {
				'flexible': {
					'Open,': '开放中,',
					'Closed,': '已截止,',
				},
				'static': {
					'Open': '开放中',
					'Sign Up': '报名',
					'Post to Collection': '发布到此合集',
					'Dashboard': '仪表盘',
					'Profile': '概述',
					'Sign-up Form': '报名表',
					'Sign-up Summary': '报名概览',
					'Random Items': '随机作品',
					'People': '用户',
					'Tags': '标签',
					'Any Character': '任意角色',
					'Any Relationship': '任意关系',
					'Any Additional Tag': '任意附加标签',
					'Any Category': '任意类别',
					'Any Rating': '任意分级',
					'Any Archive Warning': '任意 Archive 预警',
					'Description:': '描述：',
					'Optional Tags:': '可选标签：',
					'Submit': '提交',
					'Active since:': '活动开始于：',
					'Maintainers:': '维护者：',
					'Sign-up:': '报名状态：',
					'Sign-up Closes:': '报名截止：',
					'Assignments Due:': '分配截止：',
					'Works Revealed:': '作品揭晓：',
					'Signed up:': '已报名：',
					'The summary is being generated. Please try again in a few minutes.': '概览正在生成，请几分钟后重试。',
					'All Media Types': '所有媒体类型',
					'Show': '显示',
					'No fandoms found': '未找到同人圈',
					'Find gifts for:': '查找赠文',
					'There are no works or bookmarks in this collection yet.': '此合集尚无作品或书签。',
					'These are some of the most popular tags used in the collection.': '以下是此合集中最常用的一些标签。',
					'* Required information': '* 处为必填信息',
					'Rules': '规则',
					'Rules:': '规则:',
					'Prompts:': '同人梗:',
					'Intro': '简介',
					'Intro:': '简介:',
					'FAQ:': '常见问题:',
					'Prompt Form': '同人梗表单',
					'Semi-anonymous Prompt?': '半匿名同人梗？',
					'(Note: This is not totally secure, and is still guessable in some places.)': '（注：此模式并非绝对安全，某些情况下仍可能被推测身份）',
					'choose fandoms from canonical archive tags': '从规范 Archive 标签中选择同人圈',
					'choose characters from canonical archive tags': '从规范 Archive 标签中选择角色',
					'choose relationships from canonical archive tags': '从规范 Archive 标签中选择关系',
					'choose additional tags from canonical archive tags': '从规范 Archive 标签中选择附加标签',
					'(no time specified)': '（未设定具体时间）',
					'Creators Revealed:': '创作者揭晓：',
					'Claim': '认领',
					'Request Fulfilled': '请求已完成',
					'Request Unfulfilled': '请求未完成',
					'Fulfilled By': '完成者',
					'Claimed By': '认领者',
					'> Fandoms': '> 同人圈',
					'Random works': '随机作品',
					'All Challenges': '所有活动',
					'Top-Level Collections': '顶级合集',
					'Sign-ups close at:': '报名截止于：',
					'Requests Summary': '请求概览',
					'Requested Fandoms': '请求的同人圈',
					'Last generated at:': '最后生成于:',
					'(Generated hourly on request while sign-ups are open.)': '（在报名开放期间，可按需每小时生成）',
					'Requests': '请求',
					'Offers': '提供',
					'Fandoms:': '同人圈:',
					'Works:': '作品:',
					'Challenges/Subcollections:': '活动合集/子合集:',
					'Listed by fewest offers and most requests.': '按提供最少、请求最多排序。',
					'Contact:': '联系方式：',
					'(See all...)': '（查看全部...）',
					'(See fewer...)': '（收起...）',
					'Title:': '标题：',
					'Prompt URL:': '同人梗 URL：',
					'Sign-ups close at: (no time specified)': '报名截止于：（未指定时间）',
					'Remove?': '移除此项？',
				},
				'innerHTML_regexp': [
					['h2.heading', /^Sign Up for (.+)$/, '报名 $1'],
					['dd', /^\s*(\d+)\s+Too few sign-ups to display names\s*$/, '$1 人。报名人数过少，无法显示名称'],
					['p.notes.notice', /^Challenge maintainers will have access to the email address associated with your AO3 account for the purpose of communicating with you about the challenge\.$/, '活动维护者将可使用与您 AO3 账户相关联的电子邮箱与您沟通活动相关事宜。'],
					['h3.heading', /^Sign Up as\s*(<span class="byline">.*<\/span>)/, '作为 $1 报名'],
					['dt > label.fandom', /^Fandoms? \(([\d\s-]+)\):(?:\s*\*)*$/, '同人圈（$1）：*'],
					['dt > label.character', /^Characters? \(([\d\s-]+)\):(?:\s*\*)*$/, '角色（$1）：*'],
					['dt > label.relationship', /^Relationships? \(([\d\s-]+)\):(?:\s*\*)*$/, '关系（$1）：*'],
					['dt > label.freeform', /^Additional Tags \(([\d\s-]+)\):(?:\s*\*)*$/, '附加标签（$1）：*'],
					['dt > label.category', /^Categories \(([\d\s-]+)\):(?:\s*\*)*$/, '类别（$1）：*'],
					['dt > label.rating', /^Ratings \(([\d\s-]+)\):(?:\s*\*)*$/, '分级（$1）：*'],
					['dt > label.warning', /^Archive Warnings \(([\d\s-]+)\):(?:\s*\*)*$/, 'Archive 预警（$1）：*'],
					['h4.heading', /^Archive Warnings$/, 'Archive 预警'],
					['div.flash.notice', /^Summary does not appear until at least 5 sign-ups have been made!$/, '至少 5 人报名后才会显示概览！'],
					['h2.heading', /^Sign-up Summary for (.+)/, '$1 报名概览'],
					['h2.heading', /^(<a href="\/collections\/.*?">.+<\/a>) > Fandoms$/, '$1 > 同人圈'],
					['h2.heading', /^(\d+)\s+Works? in (<a href="\/collections\/.*?">.+<\/a>)/, '$2 中的作品：$1'],
					['h2.heading', /^\s*(\d+)\s+(?:Bookmarked Items|已创建书签作品) in\s+(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2 的已创建书签作品：$1'],
					['h2.heading', /^Participants in (.+)/, '$1 的参与者'],
					['h5.heading', /(\d+)\s*works?,\s*(\d+)\s*recs?/, '$1 篇作品，$2 条推荐'],
					['h3.heading', /(\d+\s*-\s*\d+)\s+of\s+([\d,]+)\s+Collections/s, '第 $1 个，共 $2 个合集'],
					['li a, li span.current', /^Prompts\s*\((\d+)\)$/, '同人梗 ($1)'],
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/s, '剩余 $1 字符'],
					['h2.heading', /^\s*Challenges\/Subcollections in\s*(.+?)\s*$/s, '$1 中的挑战/子合集'],
					['h2.heading', /^\s*Prompts for\s+(.+?)\s*$/, '$1 的同人梗'],
					['h3.heading', /^\s*Requests?(.*)\s*$/, '请求$1'],
					['h3.heading', /^\s*Offers?(.*)\s*$/, '提供$1'],
					['ul.commas.index.group', /^\s*(\d+)\s+anonymous\s+claimant(s?)\s*$/, '$1 位匿名认领者'],
					['h4.heading', /^\s*Request\s+by\s+(?:Anonymous|匿名)\s*$/s, '请求 by 匿名'],
					['p.actions a.showme', /^\s*Add another request\?\s*\(Up to (\d+) allowed\.\)\s*$/, '添加另一个请求项？（最多可添加 $1 个）'],
					['p.actions a.showme', /^\s*Add another offer\?\s*\(Up to (\d+) allowed\.\)\s*$/, '添加另一个提供项？（最多可添加 $1 个）'],
					['h2.heading', /^\s*(\d+)\s+Works? in\s*(<a href="\/collections\/.*?">.+?<\/a>)\s*$/s, '$2 中的 $1 篇作品'],
					['h2.heading', /^\s*Participants in\s+(.+?)\s*$/s, '$1 的参与者'],
					['h4.heading', /^\s*Request\s+by\s+(.+?)\s*$/s, '请求 by $1'],
				],
				'regexp': [
					[/^Subcollections \((\d+)\)$/, '子合集（$1）'],
					[/^Fandoms \((\d+)\)$/, '同人圈（$1）'],
					[/^Works \((\d+)\)$/, '作品（$1）'],
					[/^Bookmarked Items \((\d+)\)$/, '已创建书签作品（$1）'],
				],
				'selector': []
			},
			'external_works_new': {
				'static': {
					'Bookmark an external work': '为外部作品创建书签',
					'Bookmark': '书签',
					'External Work': '外部作品',
					'Creator\'s Tags': '创建者标签',
					'Write Comments': '撰写评论',
					'Choose Type and Post': '选择类型并发布',
					'URL*': 'URL *',
					'Creator*': '作者 *',
					'Title*': '标题 *',
					'Creator\'s Summary': '作者简介',
					'(please copy and paste from original work)': '(请从原作复制并粘贴)',
					'Fandoms*': '同人圈 *',
					'Rating': '分级',
					'Categories': '分类',
					'Relationships': '关系',
					'Characters': '角色',
					'Your tags': '标签',
					'Add to collections': '添加到合集',
					'Private bookmark': '私人书签',
					'Rec': '推荐',
					'* Required information': '* 处为必填信息',
					'If this URL has been bookmarked before, the work information will be filled in automatically.': '如果此 URL 之前已被创建书签，作品信息将自动填充。',
					'Creator\'s Tags (comma separated, 150 characters per tag). Only a fandom is required. Fandom, relationship, and character tags must not add up to more than 75. Category and rating tags do not count toward this limit.': '创建者标签（逗号分隔，每个标签最多 150 字符）。仅需填写同人圈标签。同人圈、关系和角色标签总字符数不得超过 75 字符。分类和分级标签不计入此限制。',
					'Plain text with limited HTML': '纯文本，支持有限 HTML',
					'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
					'Create': '创建',
					'My Bookmarks': '我的书签',
				},
				'innerHTML_regexp': [
					[
						'div.post.bookmark > p:first-of-type',
						/Bookmark external works with the <a href="([^"]*)"[^>]*>AO3 External Bookmarklet<\/a>\. This is a simple bookmarklet that should work in any browser, if you have JavaScript enabled\. Just right-click and select <cite>Bookmark This Link<\/cite> \(or <cite>Bookmark Link<\/cite>\)\./s,
						'使用 <a href="$1" title="右键单击并为此链接添加书签">AO3 外部书签工具</a>对外部作品创建书签。这个简单的书签工具只要启用 JavaScript 即可在任何浏览器中使用。只需右键单击并选择 <cite>将此链接加入书签</cite>（或 <cite>书签链接</cite> ）。'
					],
					[
						'p.character_counter',
						/(<span[^>]*>\d+<\/span>)\s*characters left/s,
						'剩余 $1 字符'
					],
					[
						'#modal .content p:has(a[href*="content#II.J"])',
						/\(For more information, see the <a href="\/content#II.J">Ratings and Warnings section of the AO3 Terms of Service<\/a>\.\)/s,
						'（要了解更多信息，请参阅 <a href="/content#II.J">AO3 服务条款的分级与预警部分</a>。）'
					],
				],
				'regexp': [],
				'selector': []
			},

			'media_index': {
				'static': {},
				'regexp': [],
				'selector': [
					['.media.fandom.index.group p.actions a', '全部']
				]
			},

			'users_inbox': {
				'static': {
					'My Inbox': '收件箱'
				},
				'regexp': [
					[/^My Inbox \((\d+) comment(?:s)?, (\d+) unread\)$/, '收件箱：$1 条评论, $2 条未读']
				],
				'selector': []
			},

			'session_login': {
				'static': {
					'Log In': '用户登录',
					'User name or email': '用户名或邮箱',
					'Password': '密码',
					'Remember Me': '记住我',
					'Forgot password?': '忘记密码?',
					'It seems you\'re using an ad blocker.': '您似乎使用了广告拦截器。',
				},
				'regexp': [],
				'selector': []
			},
			'session_logout': {
				'static': {
					'You have been logged out.': '您已成功登出。',
					'Log back in?': '重新登录？'
				},
				'regexp': [],
				'selector': []
			},
			'admin_posts_show': {
				'static': {
					'AO3 News': 'AO3 最新动态',
					'Previous Post': '上一篇',
					'Next Post': '下一篇',
					'Published:': '发布于：',
					'Original:': '原文：',
					'Tags:': '标签：',
					'Translations:': '翻译版本：',
					'↑ Top': '↑ 返回顶部',
					'Back to AO3 News Index': '返回 AO3 动态总览',
					'Reply': '回复',
					'Thread': '评论串',
					'Parent Thread': '主评论串',
					'Block': '屏蔽',
					'RSS Feed': 'RSS 订阅',
					'Edit': '编辑',
					'Comment': '评论',
					'Comment on': '评论于：',
					'Last Edited': '最后编辑',
					'(Plain text with limited HTML': '(纯文本，支持有限 HTML',
					'Sorry, this news post doesn\'t allow comments.': '抱歉，此动态帖不允许评论。',
					'Sorry, comments are disabled for this post.': '抱歉，此动态贴不允许评论。',
					'Comments on this news post are moderated. Your comment will not appear until it has been approved.': '此动态帖的评论需审核。您的评论在获得批准前不会显示。',
					'Brevity is the soul of wit, but we need your comment to have text in it.': '简洁乃智慧之魂，但您的评论必须包含文字内容。',
				},
				'innerHTML_regexp': [
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/, '剩余 $1 字符'],
					[
						'ul.actions a',
						/^Read (\d+) Comments$/,
						'阅读 $1 条评论'
					],
					[
						'p.notice',
						/^\s*Sorry, this news post doesn't allow non-Archive users to comment\.\s*You can however <a href="\/support">contact Support<\/a> with any feedback or questions\.\s*$/s,
						'抱歉，此动态贴不允许非 Archive 用户发表评论。您可通过<a href="/support">联系支持团队</a>提供反馈或咨询。'
					],
				],
				'regexp': [
					[/^Comments \((\d+)\)$/, '评论（$1）'],
					[/^Hide Comments \((\d+)\)$/, '收起评论（$1）'],
					[/^View all (\d+) comments$/, '查看全部 $1 条评论']
				],
				'selector': [
					[['input[name="commit"][value="Comment"]', '评论']]
				]
			},
			'admin_posts_index': {
				'static': {},
				'innerHTML_regexp': [],
				'regexp': [],
				'selector': []
			},
			'works_chapters_show': {
				'static': {
					'Chapter by Chapter': '逐章阅读',
					'Mark for Later': '稍后阅读',
					'Mark as Read': '标记已读',
					'Cancel Bookmark': '取消创建书签',
					'Share': '分享',
					'↑ Top': '↑ 回到顶部',
					'Kudos': '点赞',
					'Reply': '回复',
					'Thread': '评论串',
					'Parent Thread': '主评论串',
					'←Previous Chapter': '← 上一章',
					'← Previous Chapter': '← 上一章',
					'Next Chapter →': '下一章 →',
					'Next Chapter→': '下一章 →',
					'← Previous Work': '← 上一作品',
					'Next Work →': '下一作品 →',
					'Download': '下载',
					'Comment': '评论',
					'Hide Comments': '隐藏评论',
					'(Plain text with limited HTML': '(纯文本，支持有限 HTML',
					'Brevity is the soul of wit, but we need your comment to have text in it.': '简洁乃智慧之魂，但您的评论需要包含文字内容。',
					'Thank you for leaving kudos!': '感谢您的点赞！',
					'You have already left kudos here. :)': '您已经点赞过了 :)',
					'Your tags': '标签',
					'The creator\'s tags are added automatically.': '创作者的标签会自动添加',
					'Comma separated, 150 characters per tag': '以逗号分隔，每个标签最多 150 字符',
					'Add to collections': '添加到合集',
					'Private bookmark': '私人书签',
					'Create': '创建',
					'Series this work belongs to:': '所属系列：',
					'Works inspired by this one:': '衍生作品：',
				},
				'innerHTML_regexp': [
					[
						'div.flash.notice',
						/^\s*This work was removed from your <a href="([^"]*)">Marked for Later list<\/a>\.\s*$/s,
						'已将此作品移出<a href="$1">稍后阅读列表</a>。'
					],
					['p.character_counter', /(<span[^>]*>\d+<\/span>)\s*characters left/, '剩余 $1 字符'],
					['h3.title', /<a (.*?)>Chapter (\d+)<\/a>:\s*(.*)/s, '<a $1>第 $2 章</a>: $3'],
					['h3.title', /<a (.*?)>Chapter (\d+)<\/a>/s, '<a $1>第 $2 章</a>'],
					['p.jump', /\(See the end of the work for (<a.*?>)(more )?notes(<\/a>)\.\)/, (_match, p1, p2, p3) => `（在作品结尾查看${p1}${p2 ? '更多' : ''}注释${p3}。）`],
					['div.chapter div.notes > p', /\(See the end of the chapter for\s*(<a.*?>)(more )?notes(<\/a>)\.\)/, (_match, p1, p2, p3) => `（在本章结尾查看${p1}${p2 ? '更多' : ''}注释${p3}。）`],
					['p.jump', /\(See the end of the work for (<a href="[^"]*#children">)other works inspired by this one(<\/a>)\.\)/, '（在作品结尾查看$1相关衍生作品$2。）'],
					[
						'div.series span.position, dd.series span.position',
						/^\s*Part (\d+) of (<a href="\/series\/.*?">.*?<\/a>)(.*)$/si,
						'$2 第 $1 部分$3'
					],
					[
						'p.notice',
						/^\s*This work's creator has chosen to moderate comments on the work\.\s*Your comment will not appear until it has been approved by the creator\.\s*$/s,
						'此作品的创作者已选择审核评论。您的评论将在创作者批准后显示。'
					],
					[
						'p#notes-field-description',
						/^\s*The creator's summary is added automatically\.\s*Plain text with limited HTML\s*(<a[^>]+>[\s\S]*?<\/a>)\s*$/s,
						'创作者的简介会自动添加。纯文本，支持有限 HTML $1'
					]
				],
				'regexp': [
					[/^Comments \((\d+)\)$/, '评论（$1）'],
					[/^Hide Comments \((\d+)\)$/, '隐藏评论（$1）']
				],
				'selector': []
			},
			'faq_page': {
				'static': {
					'Expand Categories': '展开分类',
					'Collapse Categories': '折叠分类'
				},
				'innerHTML_regexp': [
					['h2.heading', /^\s*Archive FAQ\s*$/, 'Archive 常见问题'],
					[
						'p.notice',
						/^\s*The FAQs are currently being updated and translated by our volunteers\.\s*This is a work in progress and not all information will be up to date or available in languages other than English at this time\.\s*If your language doesn't list all FAQs yet, please consult the English list and check back later for updates\.\s*$/s,
						'常见问题目前正在由我们的志愿者更新和翻译。此工作仍在进行中，目前并非所有信息都已更新或提供非英文版本。如果您的语言尚未列出所有常见问题，请查阅英文列表，并稍后回来查看更新。'
					],
					[
						'p.notes',
						/^\s*Some commonly asked questions about the Archive are answered here\.\s*Questions and answers about our Terms of Service can be found in the <a href="\/tos_faq\?language_id=[\w-]+">(?:TOS FAQ|服务条款常见问题)<\/a>\.\s*You may also like to check out our <a href="\/known_issues\?language_id=[\w-]+">(?:Known Issues|已知问题)<\/a>\.\s*If you need more help, please\s*<a href="\/support\?language_id=[\w-]+">(?:contact Support|联系支持团队)<\/a>[\.。]\s*$/s,
						'此处解答了一些关于 Archive 的常见问题。有关我们服务条款的问题和答案，请查阅<a href="/tos_faq?language_id=en">服务条款常见问题</a>。您也可以查看我们的<a href="/known_issues?language_id=en">已知问题</a>。如果需要更多帮助，请<a href="/support?language_id=en">联系支持团队</a>。'
					],
					[
						'h3.heading',
						/^\s*Available Categories\s*(<ul class="showme hidden actions"[\s\S]*?<\/ul>)\s*$/s,
						'可用分类 $1'
					],
				],
				'regexp': [],
				'selector': []
			},
			'site_map': {
				'static': {
					'Explore': '探索',
					'Homepage': '主页',
					'Additional Tags Cloud': '附加标签集',
					'Languages': '语言',
					'Collections and Challenges': '合集与挑战',
					'About the Archive of Our Own': '关于 Archive of Our Own',
					'Terms of Service FAQ': '服务条款常见问题',
					'Archive FAQ': 'Archive 常见问题',
					'AO3 News': 'AO3 最新动态',
					'Access your account': '访问您的帐户',
					'My Home': '我的主页',
					'My Collections and Challenges': '我的合集与挑战',
					'My Inbox': '我的收件箱',
					'Change your account settings': '更改您的账户设置',
					'My Profile': '个人资料',
					'Donations': '捐赠',
				},
				'innerHTML_regexp': [
					['li', /^\s*The Archive of Our Own is a project of the <a href="https:\/\/transformativeworks\.org"><acronym title="[^"]+">OTW<\/acronym><\/a>\s*$/s, 'Archive of Our Own 是再创作组织（OTW）旗下项目'],
				],
				'regexp': [],
				'selector': []
			},
			'report_and_support_page': {
				'static': {
					'Your name or username (optional)': '您的姓名或用户名（可选）',
					'Your name (optional)': '您的姓名（可选）',
					'Your email (required)': '您的电子邮箱（必填）',
					'We cannot contact you if the email address you provide is invalid.': '如果您提供的电子邮箱地址无效，我们将无法与您联系。',
					'Select language (required)': '选择语言（必填）',
					'Link to the page you are reporting (required)': '您要举报的页面链接（必填）',
					'Please enter the link to the page you are reporting.': '请输入您要举报的页面链接。',
					'Please ensure this link leads to the page you intend to report. Enter only one URL here and include any other links in the description field below.': '请确保该链接确实指向您希望举报的页面。此处仅填写一个网址，其她链接请填写在下方描述栏中。',
					'Brief summary of Terms of Service violation (required)': '违反服务条款简述（必填）',
					'Please enter a subject line for your report.': '请输入举报主题',
					'Please specify why you are contacting us and/or what part of the Terms of Service is relevant to your complaint. (For example, "harassment", "not a fanwork", "commercial activities", etc.)': '请说明您联系我们的原因及/或涉及服务条款的相关内容。（例如：“骚扰行为”、“非同人作品”、“商业活动”等）',
					'Description of the content you are reporting (required)': '举报内容描述（必填）',
					'Please describe what you are reporting and why you are reporting it.': '请描述您要举报的内容及举报原因',
					'Brief summary of your question or problem (required)': '问题简述（必填）',
					'Please enter a brief summary of your message': '请输入您信息的简要说明',
					'Your question or problem (required)': '您的问题或疑问（必填）',
					'Please be as specific as possible, including error messages and/or links': '请尽可能具体，包括错误信息和/或相关链接',
					'Please enter your feedback': '请输入您的反馈',
					'Send': '发送',
					'Submit': '提交',
				},
				'innerHTML_regexp': [
					['p#comment-field-description', /Explain how the content you are reporting violates the <a href="\/content">(?:Content Policy|内容政策)<\/a> or other parts of the <a href="\/tos">(?:Terms of Service|服务条款)<\/a>\. Please be as specific as possible and <a href="\/abuse_reports\/new#reporthow">include all relevant links and other information in your report<\/a>\. All information provided will remain confidential\./s, '说明您所举报的内容如何违反了<a href="/content">内容政策</a>或<a href="/tos">服务条款</a>的其她部分。请尽可能具体，并在<a href="/abuse_reports/new#reporthow">反馈中包含所有相关链接及信息</a>。您提供的所有信息都将保密。'],
					[
						'h3.heading',
						/^\s*Please use this form for questions about how to use the Archive and for reporting any technical problems\.\s*$/s,
						'请使用此表单咨询有关如何使用 Archive 的问题，或报告任何技术问题。'
					]
				]
			},
		}
	};

	/**
	 * 脚本主入口检查
	 */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', main);
	} else {
		main();
	}

})(window, document);