// ==UserScript==
// @name         AO3 汉化插件
// @namespace    https://github.com/V-Lipset/ao3-chinese
// @description  中文化 AO3 界面，可调用 AI 实现简介、注释、评论以及全文翻译。
// @version      1.3.1-2025-08-06
// @author       V-Lipset
// @license      GPL-3.0
// @match        https://archiveofourown.org/*
// @icon         https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/assets/icon.png
// @supportURL   https://github.com/V-Lipset/ao3-chinese/issues
// @downloadURL  https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/main.user.js
// @updateURL    https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/main.user.js
// @require      https://raw.githubusercontent.com/V-Lipset/ao3-chinese/main/zh-cn.js
// @connect      raw.githubusercontent.com
// @connect      api.together.xyz
// @connect      www.codegeneration.ai
// @connect      open.bigmodel.cn
// @connect      api.deepseek.com
// @connect      generativelanguage.googleapis.com
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_notification
// ==/UserScript==

(function (window, document, undefined) {
    'use strict';

    /****************** 全局配置区 ******************/
    const FeatureSet = {
        enable_RegExp: GM_getValue('enable_RegExp', true),
        enable_transDesc: GM_getValue('enable_transDesc', false),
    };

    // 翻译指令
    const sharedSystemPrompt = `You are a professional translator fluent in Simplified Chinese (简体中文), with particular expertise in translating web novels and online fanfiction.

    Your task is to translate a numbered list of text segments provided by the user. These segments can be anything from full paragraphs to single phrases or words. For each numbered item, you will follow an internal three-stage strategy to produce the final, polished translation.

    ### Internal Translation Strategy (for each item):
    1.  **Stage 1 (Internal Thought Process):** Produce a literal, word-for-word translation of the English content.
    2.  **Stage 2 (Internal Thought Process):** Based on the literal translation, identify any phrasing that is unnatural or does not flow well in Chinese.
    3.  **Stage 3 (Final Output):** Produce a polished, idiomatic translation that fully preserves the original meaning, tone, cultural nuances, and any specialized fandom terminology. The final translation must be natural-sounding, readable, and conform to standard Chinese usage.

    ### CRITICAL OUTPUT INSTRUCTIONS:
    - Your entire response MUST consist of *only* the polished Chinese translation from Stage 3, formatted as a numbered list that exactly matches the input's numbering.
    - Do NOT include any stage numbers, headers (e.g., "Polished Translation"), notes, or explanations in your final output.
    - **HTML Tag Preservation:** If an item contains HTML tags (e.g., \`<em>\`, \`<strong>\`), you MUST preserve these tags exactly as they are in the original, including their positions around the translated text.
    - **Untranslatable Content:** If an item is a separator, a meaningless symbol, or otherwise untranslatable, you MUST return the original item exactly as it is, preserving its number.

    ### Example Input:
    1. This is the <em>first</em> sentence.
    2. ---
    3. This is the third sentence.

    ### Example Output:
    1. 这是<em>第一个</em>句子。
    2. ---
    3. 这是第三个句子。
    `;

    const deepseekReasonerSystemPrompt = `You are a professional translator fluent in Simplified Chinese (简体中文). Your task is to translate a numbered list of text segments.

    ### CRITICAL OUTPUT FORMATTING:
    - Your response MUST ONLY contain the final Chinese translations.
    - The output MUST be a numbered list that exactly matches the input's numbering.
    - DO NOT include the original English text, notes, headers, or any other explanations.
    - **HTML Tag Preservation:** If an item contains HTML tags (e.g., \`<em>\`, \`<strong>\`), you MUST preserve these tags exactly as they are in the original, including their positions around the translated text.
    - If a numbered item is a separator, you MUST return it unchanged.

    ### Example Input:
    1. This is the <em>first</em> sentence.
    2. ---
    3. This is the third sentence.

    ### Example Output:
    1. 这是<em>第一个</em>句子。
    2. ---
    3. 这是第三个句子。`;

    const createRequestData = (model, systemPrompt, paragraphs) => {
        const numberedText = paragraphs
            .map((p, i) => `${i + 1}. ${p.innerHTML}`)
            .join('\n\n');
        return {
            model: model,
            messages: [
                { "role": "system", "content": systemPrompt },
                { "role": "user", "content": `Translate the following numbered list to Simplified Chinese（简体中文）:\n\n${numberedText}` }
            ],
            stream: false,
            temperature: 0,
        };
    };
    
    const CONFIG = {
        LANG: 'zh-CN',
        PAGE_MAP: { 'archiveofourown.org': 'ao3' },
        SPECIAL_SITES: [],
        OBSERVER_CONFIG: {
            childList: true,
            subtree: true,
            characterData: true,
            attributeFilter: ['value', 'placeholder', 'aria-label', 'data-confirm', 'title']
        },

        // 文本分块与请求限流的默认配置
        CHUNK_SIZE: 1200,
        PARAGRAPH_LIMIT: 5,
        REQUEST_DELAY: 200,

        // 特定模型专属请求限流配置
        MODEL_SPECIFIC_LIMITS: {
            'gemini-2.5-pro': {
                CHUNK_SIZE: 3000,
                PARAGRAPH_LIMIT: 10,
            },
            'deepseek-reasoner': {
                CHUNK_SIZE: 3000,
                PARAGRAPH_LIMIT: 10,
            }
        },

        // 段落分隔
        PARAGRAPH_SEPARATOR: '\n\n[|||]\n\n',

        ACTIVATION_URLS: [
            'https://www.codegeneration.ai/activate-v2',
            'https://web.chatbox.ai/api/config'
        ],

        transEngine: GM_getValue('transEngine', 'together_ai'),
        TRANS_ENGINES: {
            together_ai: {
                name: 'Together AI',
                url_api: 'https://api.together.xyz/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                getRequestData: (paragraphs, glossary) => {
                    const model = GM_getValue('together_ai_model', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8');
                    return createRequestData(
                        model,
                        sharedSystemPrompt,
                        paragraphs,
                        glossary
                    );
                },
                responseIdentifier: 'choices[0].message.content',
            },
            chatglm_official: {
                name: 'ChatGLM',
                url_api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs, glossary) => createRequestData(
                    'glm-4-flash-250414',
                    sharedSystemPrompt,
                    paragraphs,
                    glossary
                ),
                responseIdentifier: 'choices[0].message.content',
            },
            deepseek_ai: {
                name: 'DeepSeek',
                url_api: 'https://api.deepseek.com/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs, glossary) => {
                    const model = GM_getValue('deepseek_model', 'deepseek-chat');
                    const systemPrompt = (model === 'deepseek-reasoner') 
                        ? deepseekReasonerSystemPrompt 
                        : sharedSystemPrompt;

                    return createRequestData(
                        model,
                        systemPrompt,
                        paragraphs,
                        glossary
                    );
                },
                responseIdentifier: 'choices[0].message.content',
            },
            google_ai: {
                name: 'Google AI',
                url_api: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs) => {
                    const numberedText = paragraphs
                        .map((p, i) => `${i + 1}. ${p.innerHTML}`)
                        .join('\n\n');

                    const userPrompt = `Translate the following numbered list to Simplified Chinese（简体中文）:\n\n${numberedText}`;
                    
                    return {
                        systemInstruction: {
                            role: "user",
                            parts: [{ text: sharedSystemPrompt }]
                        },
                        contents: [{
                            role: "user",
                            parts: [{ text: userPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0,
                            candidateCount: 1,
                            thinkingConfig: {
                                thinkingBudget: -1
                            }
                        }
                    };
                },
                responseIdentifier: 'candidates[0].content.parts[0].text',
            },
        }
    };
	
    let pageConfig = {};

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
        const baseStatic = I18N[CONFIG.LANG]?.public?.static || {};

        const usersCommonStatic = (pageType.startsWith('users_') || pageType === 'profile' || pageType === 'dashboard')
            ? I18N[CONFIG.LANG]?.users_common?.static || {}
            : {};

        const pageStatic = I18N[CONFIG.LANG]?.[pageType]?.static || {};

        const mergedStatic = { ...baseStatic, ...usersCommonStatic, ...pageStatic };

        const baseRegexp = I18N[CONFIG.LANG]?.public?.regexp || [];
        const pageRegexp = I18N[CONFIG.LANG]?.[pageType]?.regexp || [];
        const baseSelector = I18N[CONFIG.LANG]?.public?.selector || [];
        const pageSelector = I18N[CONFIG.LANG]?.[pageType]?.selector || [];
        const baseInnerHTMLRegexp = I18N[CONFIG.LANG]?.public?.innerHTML_regexp || [];
        const pageInnerHTMLRegexp = I18N[CONFIG.LANG]?.[pageType]?.innerHTML_regexp || [];

        const globalFlexible = (pageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.flexible || {});
        const pageFlexible = (pageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.[pageType]?.flexible || {});

        const mergedRegexp = [...pageRegexp, ...baseRegexp];
        const mergedSelector = [...pageSelector, ...baseSelector];
        const mergedInnerHTMLRegexp = [...pageInnerHTMLRegexp, ...baseInnerHTMLRegexp];

        return {
            currentPageType: pageType,
            staticDict: mergedStatic,
            regexpRules: mergedRegexp,
            innerHTMLRules: mergedInnerHTMLRegexp,
            globalFlexibleDict: globalFlexible,
            pageFlexibleDict: pageFlexible,
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
     * traverseNode 函数：遍历指定的节点，并对节点进行翻译。
     * @param {Node} node - 需要遍历的节点。
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
     * detectPageType 函数：检测当前页面类型，基于URL。
     * @returns {string|boolean} 页面的类型
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
        const { hostname, pathname, search } = window.location;
        // 忽略 /first_login_help 页面
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
        if (pathname === '/works') return 'works_new';
        
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
                    if (!p2 || (p2 && /^\d+$/.test(p2))) {
                        return 'admin_posts_show';
                    }
                    return 'common';

                case 'comments':
                    if (document.querySelector('a[href="/admin_posts"]')) {
                        return 'admin_posts_show';
                    }
                    break;

                case 'media':
                    return 'media_index';
                case 'users':
                    if (p2 && p3 === 'pseuds' && p5 === 'works') return 'users_common';
                    if (p2 && (p3 === 'blocked' || p3 === 'muted') && p4 === 'users') return 'users_block_mute_list';
                    if (p2 && p3 === 'dashboard') return 'dashboard';
                    if (p2 && p3 === 'profile') return 'profile';
                    if (p2 && p3 === 'preferences') return 'preferences';
                    if (p2 && p3 === 'edit') return 'users_settings';
                    if (p2 && p3 === 'change_username') return 'users_settings';
                    if (p2 && p3 === 'change_password') return 'users_settings';
                    if (p2 && p3 === 'change_email') return 'users_settings';
                    if (p2 && p3 === 'pseuds') {
                        if (p4 && p5 === 'edit') return 'users_settings';
                        if (p4 && !p5) return 'users_settings';
                        if (!p4) return 'users_settings';
                    }
                    if (p2 && p3 === 'works' && p4 === 'drafts') return 'users_drafts_index';
                    if (p2 && p3 === 'series') return 'users_series_index';
                    if (p2 && p3 === 'works' && p4 === 'show_multiple') return 'works_show_multiple';
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
                    if (pathname === '/works/search') return 'works_search';
                    if (p2 === 'new' && search.includes('import=true')) return 'works_import';
                    if (p2 && /^\d+$/.test(p2)) {
                    if ((p3 === 'chapters' && p4) || (!p3 || p3 === 'navigate')) {
                        return 'works_chapters_show';
                    }
                        if (p3 === 'edit') return 'works_edit';
                        if (!p3 || p3 === 'navigate') return 'works_chapters_show';
                        if (p2 === 'new') return 'works_new';
                    }
                    if (p2 === 'new') return 'works_new';
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
     * sleepms 函数：延时。
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 主翻译入口函数
     * 根据当前页面类型，为不同的内容区域添加翻译按钮。
     */
    function transDesc() {

        if (!FeatureSet.enable_transDesc) {
            return;
        }

        const pageTranslationConfig = {
            'works_show': [
                { selector: 'div.summary blockquote.userstuff', text: '翻译简介', above: false, clearable: true },
                { selector: 'div.notes blockquote.userstuff', text: '翻译注释', above: false, clearable: true },
                { selector: '#chapters .userstuff', text: '翻译正文', above: true, clearable: false },
                { selector: 'li.comment blockquote.userstuff', text: '翻译评论', above: false, clearable: true }
            ],
            'works_chapters_show': [
                { selector: 'div.summary blockquote.userstuff', text: '翻译简介', above: false, clearable: true },
                { selector: 'div.notes blockquote.userstuff', text: '翻译注释', above: false, clearable: true },
                { selector: '#chapters .userstuff', text: '翻译正文', above: true, clearable: false },
                { selector: 'li.comment blockquote.userstuff', text: '翻译评论', above: false, clearable: true }
            ],
            'admin_posts_show': [
                { selector: '.comment blockquote.userstuff', text: '翻译评论', above: false, clearable: true }
            ]
        };

        const targetsForCurrentPage = pageTranslationConfig[pageConfig.currentPageType];

        if (!targetsForCurrentPage) {
            return;
        }

        targetsForCurrentPage.forEach(target => {
            document.querySelectorAll(target.selector).forEach(element => {
                if (element.dataset.translationHandled) {
                    return;
                }
                if (pageConfig.currentPageType === 'works_show' && target.selector === '#chapters .userstuff' && element.closest('.notes, .end.notes, .bookmark, .summary')) {
                    return;
                }
                if (pageConfig.currentPageType === 'works_chapters_show' && target.selector === '#chapters .userstuff' && element.closest('.notes, .end.notes, .bookmark, .summary')) {
                    return;
                }

                addTranslationButton(element, target.text, target.above, target.clearable);
            });
        });
    }

    /**
     * 翻译按钮添加函数
     * @param {HTMLElement} element - 目标元素
     * @param {string} originalButtonText - 按钮初始文本
     * @param {boolean} isAbove - 按钮是否在元素上方
     * @param {boolean} canClear - 是否支持“清除”功能
     */
    function addTranslationButton(element, originalButtonText, isAbove, canClear) {
        element.dataset.translationHandled = 'true';

        const wrapper = document.createElement('div');
        wrapper.className = 'translate-me-ao3-wrapper';

        const buttonLink = document.createElement('div');
        buttonLink.style.cssText = 'color: #1b95e0; font-size: small; cursor: pointer; display: inline-block; margin-top: 5px; margin-bottom: 5px; margin-left: 10px;';
        buttonLink.textContent = originalButtonText;
        wrapper.appendChild(buttonLink);

        isAbove ? element.before(wrapper) : element.after(wrapper);

        const handleClick = () => {
            if (wrapper.dataset.state === 'translated') {
                const translationNodes = element.querySelectorAll('.translated-by-ao3-script, .translated-by-ao3-script-error');
                translationNodes.forEach(node => node.remove());

                element.querySelectorAll('[data-translation-state="translated"]').forEach(originalUnit => {
                    delete originalUnit.dataset.translationState;
                });

                buttonLink.textContent = originalButtonText;
                delete wrapper.dataset.state;
                return;
            }

            if (!canClear) {
                buttonLink.removeEventListener('click', handleClick);
                buttonLink.textContent = '翻译已启用...';
                buttonLink.style.cursor = 'default';
                buttonLink.style.color = '#777';
                startTranslationEngine(element, null);
                return;
            }
            
            buttonLink.removeEventListener('click', handleClick);
            buttonLink.textContent = '翻译中…';

            startTranslationEngine(element, () => {
                buttonLink.textContent = '已翻译';
                wrapper.dataset.state = 'translated';
                buttonLink.addEventListener('click', handleClick);
            });
        };

        buttonLink.addEventListener('click', handleClick);
    }

    /**
     * 主分发函数：根据是否有回调，决定是为“区块”还是为“正文”启动翻译。
     */
    function startTranslationEngine(containerElement, onComplete) {
        if (onComplete) {
            runTranslationEngineForBlock(containerElement, onComplete);
        }
        else {
            runTranslationEngineWithObserver(containerElement);
        }
    }

    /**
     * 翻译函数：接收段落数组，返回翻译结果映射。
     * @param {Array<HTMLElement>} paragraphs - 需要翻译的段落元素数组
     * @param {object} [options] - 包含重试配置的对象
     */
    async function translateParagraphs(paragraphs, { retryCount = 0, maxRetries = 2 } = {}) {
        const results = new Map();
        if (paragraphs.length === 0) return results;

        let paragraphsToSend;
        try {
            const glossary = GM_getValue('ao3_translation_glossary', {});
            paragraphsToSend = getGlossaryProcessedParagraphs(paragraphs, glossary);
        } catch (e) {
            console.error("应用术语表时出错:", e);
            paragraphsToSend = paragraphs;
        }

        try {
            const combinedTranslation = await requestRemoteTranslation(paragraphsToSend, { retryCount, maxRetries });
            
            let translatedParts = [];
            const regex = /\d+\.\s*([\s\S]*?)(?=\n\d+\.|$)/g;
            let match;
            while ((match = regex.exec(combinedTranslation)) !== null) {
                translatedParts.push(match[1].trim());
            }

            if (translatedParts.length !== paragraphs.length && combinedTranslation.includes('\n')) {
                const potentialParts = combinedTranslation.split('\n').filter(p => p.trim().length > 0);
                if (potentialParts.length === paragraphs.length) {
                    console.warn('主解析策略失败，启用换行符分割策略。');
                    translatedParts = potentialParts.map(p => p.replace(/^\d+\.\s*/, '').trim());
                }
            }

            if (translatedParts.length === paragraphs.length) {
                paragraphs.forEach((p, index) => {
                    const cleanedHtml = AdvancedTranslationCleaner.clean(translatedParts[index] || p.innerHTML);
                    results.set(p, { status: 'success', content: cleanedHtml });
                });
                return results;
            } else {
                if (retryCount < 1) {
                    console.warn('分段数量不匹配，正在自动重试...');
                    await sleep(1000);
                    return await translateParagraphs(paragraphs, { retryCount: retryCount + 1, maxRetries });
                } else {
                    console.warn('重试后分段数量仍不匹配，将作为整块文本处理（降级方案）。', {
                        expected: paragraphs.length,
                        got: translatedParts.length,
                        response: combinedTranslation
                    });
                    const blockTranslation = AdvancedTranslationCleaner.clean(combinedTranslation);
                    results.set('__BLOCK_TRANSLATION__', { status: 'success_fallback', content: blockTranslation });
                    return results;
                }
            }

        } catch (e) {
            console.error(`翻译失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, e.message);

            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
                console.log(`将在 ${Math.round(delay/1000)} 秒后重试...`);
                await sleep(delay);
                return await translateParagraphs(paragraphs, { retryCount: retryCount + 1, maxRetries });
            } else {
                console.error("所有重试均失败，翻译终止。");
                const finalErrorMessage = `翻译失败：${e.message}`;
                paragraphs.forEach(p => {
                    results.set(p, { status: 'error', content: finalErrorMessage });
                });
                return results;
            }
        }
    }
    
    /**
     * 翻译引擎（可清除译文）
     * @param {HTMLElement} containerElement - 容器元素
     * @param {function} onComplete - 全部翻译完成后的回调
     */
    async function runTranslationEngineForBlock(containerElement, onComplete) {
        const translatableSelectors = 'p, blockquote, li, h1, h2, h3:not(.landmark), h4, h5, h6';
        let units = Array.from(containerElement.querySelectorAll(translatableSelectors));
        if (units.length === 0 && containerElement.textContent.trim()) {
            units = [containerElement];
        }
        const skippableHeaders = ['Summary', 'Notes', 'Work Text'];
        units = units.filter(p => !skippableHeaders.includes(p.textContent.trim()));

        units = units.filter(unit => {
            let parent = unit.parentElement;
            while (parent && parent !== containerElement) {
                if (units.includes(parent)) return false;
                parent = parent.parentElement;
            }
            return true;
        });

        if (units.length === 0) {
            onComplete?.();
            return;
        }

        units.forEach(unit => unit.dataset.translationState = 'translating');

        const translationResults = await translateParagraphs(units);

        if (translationResults.has('__BLOCK_TRANSLATION__')) {
            const result = translationResults.get('__BLOCK_TRANSLATION__');
            const transNode = document.createElement('div');
            transNode.className = 'translated-by-ao3-script';
            transNode.style.cssText = 'margin-top: 0.25em; margin-bottom: 1em;';
            transNode.innerHTML = `<p>${result.content.replace(/\n/g, '<br>')}</p>`;
            containerElement.after(transNode);
            units.forEach(unit => unit.dataset.translationState = 'translated');
        } else {
            units.forEach(unit => {
                const result = translationResults.get(unit);
                if (result) {
                    const transNode = document.createElement('div');
                    const tagName = unit.tagName.toLowerCase();
                    if (result.status === 'success') {
                        transNode.className = 'translated-by-ao3-script';
                        transNode.innerHTML = `<${tagName}>${result.content}</${tagName}>`;
                        unit.dataset.translationState = 'translated';
                    } else {
                        transNode.className = 'translated-by-ao3-script-error';
                        transNode.innerHTML = `<${tagName}>${result.content}</${tagName}>`;
                        unit.dataset.translationState = 'error';
                    }
                    transNode.style.cssText = 'margin-top: 0.25em; margin-bottom: 1em;';
                    unit.after(transNode);
                } else {
                    unit.dataset.translationState = 'error';
                }
            });
        }

        onComplete?.();
    }

    /**
     * 翻译引擎（懒加载模式）
     * @param {HTMLElement} containerElement - 容器元素
     */
    function runTranslationEngineWithObserver(containerElement) {
        const elementState = new WeakMap();

        function preProcessAndGetUnits(container) {
            const elementsToProcess = container.querySelectorAll('p, blockquote');
            const elementsToModify = [];
            elementsToProcess.forEach(el => {
                if (elementState.has(el)) return;
                if ((el.innerHTML.match(/(?:<br\s*\/?>\s*){2,}/i))) {
                    elementsToModify.push(el);
                }
                elementState.set(el, { preprocessed: true });
            });
            elementsToModify.forEach(el => {
                (unsafeWindow.consola || console).info("检测到段落内含<br>分隔，正在进行预处理...");
                const separatorRegex = /(?:\s*<br\s*\/?>\s*){2,}/ig;
                const fragmentsHTML = el.innerHTML.split(separatorRegex);
                const newElements = fragmentsHTML.map(f => f.trim()).filter(Boolean).map(fragment => {
                    const newP = document.createElement(el.tagName);
                    newP.innerHTML = fragment;
                    elementState.set(newP, { preprocessed: true });
                    return newP;
                });
                if (newElements.length > 1) {
                    el.after(...newElements);
                    el.remove();
                }
            });
            const translatableSelectors = 'p, blockquote, li, h1, h2, h3, h4, h5, h6, hr';
            let allUnits = Array.from(container.querySelectorAll(translatableSelectors));
            const skippableHeaders = ['Summary', 'Notes', 'Work Text', 'Chapter Text'];
            allUnits = allUnits.filter(p => !skippableHeaders.includes(p.textContent.trim()));
            return allUnits.filter(unit => {
                let parent = unit.parentElement;
                while (parent && parent !== container) {
                    if (allUnits.includes(parent)) return false;
                    parent = parent.parentElement;
                }
                return true;
            });
        }
        
        const allUnits = preProcessAndGetUnits(containerElement);
        let isProcessing = false;
        const translationQueue = new Set();

        const processQueue = async (observer) => {
            if (isProcessing || translationQueue.size === 0) return;
            isProcessing = true;

            let chunkSize = CONFIG.CHUNK_SIZE;
            let paragraphLimit = CONFIG.PARAGRAPH_LIMIT;
            const engine = GM_getValue('transEngine');
            let modelId = '';
            if (engine === 'google_ai') modelId = GM_getValue('google_ai_model');
            else if (engine === 'deepseek_ai') modelId = GM_getValue('deepseek_model');
            if (modelId && CONFIG.MODEL_SPECIFIC_LIMITS[modelId]) {
                const limits = CONFIG.MODEL_SPECIFIC_LIMITS[modelId];
                chunkSize = limits.CHUNK_SIZE;
                paragraphLimit = limits.PARAGRAPH_LIMIT;
            }

            const unitsToProcess = [...translationQueue];
            translationQueue.clear();

            const processChunk = async (chunk) => {
                if (chunk.length === 0) return;
                chunk.forEach(p => {
                    elementState.set(p, { ...elementState.get(p), status: 'translating' });
                    p.dataset.translationState = 'translating';
                });
                const translationResults = await translateParagraphs(chunk);
                const currentMode = GM_getValue('translation_display_mode', 'bilingual');

                if (translationResults.has('__BLOCK_TRANSLATION__')) {
                    const result = translationResults.get('__BLOCK_TRANSLATION__');
                    const transNode = document.createElement('div');
                    transNode.className = 'translated-by-ao3-script';
                    transNode.style.cssText = 'margin-top: 0.25em; margin-bottom: 1em;';
                    transNode.innerHTML = `<p>${result.content.replace(/\n/g, '<br>')}</p>`;

                    const lastParagraphInChunk = chunk[chunk.length - 1];
                    lastParagraphInChunk.after(transNode);

                    chunk.forEach(p => {
                        elementState.set(p, { ...elementState.get(p), status: 'translated' });
                        p.dataset.translationState = 'translated';
                        if (currentMode === 'translation_only') {
                            p.style.display = 'none';
                        }
                        if (observer) observer.unobserve(p);
                    });
                    return;
                }

                for (const p of chunk) {
                    const existingElement = p.nextElementSibling;
                    if (existingElement && (existingElement.classList.contains('translated-by-ao3-script') || existingElement.classList.contains('translated-by-ao3-script-error'))) {
                        existingElement.remove();
                    }

                    const result = translationResults.get(p);
                    if (result && result.content) {
                        const transNode = document.createElement('div');
                        const tagName = p.tagName.toLowerCase();
                        transNode.style.cssText = 'margin-top: 0.25em; margin-bottom: 1em;';

                        if (result.status === 'success') {
                            transNode.className = 'translated-by-ao3-script';
                            transNode.innerHTML = `<${tagName}>${result.content}</${tagName}>`;
                            p.after(transNode);
                            if (currentMode === 'translation_only') p.style.display = 'none';

                            elementState.set(p, { ...elementState.get(p), status: 'translated' });
                            p.dataset.translationState = 'translated';
                            if (observer) observer.unobserve(p);
                        } else {
                            transNode.className = 'translated-by-ao3-script-error';
                            const errorParagraph = document.createElement(tagName);
                            errorParagraph.textContent = `翻译失败：${result.content.replace('翻译失败：', '')}`;
                            transNode.appendChild(errorParagraph);
                            p.after(transNode);
                            elementState.set(p, { ...elementState.get(p), status: 'error' });
                            p.dataset.translationState = 'error';
                        }
                    } else {
                        elementState.set(p, { ...elementState.get(p), status: 'error' });
                        p.dataset.translationState = 'error';
                    }
                }
            };

            let currentChunk = [];
            for (const p of unitsToProcess) {
                const isSeparator = p.tagName === 'HR' || /^\s*[-—*~<>#.=_\s]{3,}\s*$/.test(p.textContent);

                if (isSeparator) {
                    await processChunk(currentChunk);
                    currentChunk = [];
                    elementState.set(p, { ...elementState.get(p), status: 'translated' });
                    p.dataset.translationState = 'translated';
                    if (observer) observer.unobserve(p);
                } else if (p.textContent.trim().length > 0 || p.querySelector('img')) {
                    currentChunk.push(p);
                    if (currentChunk.reduce((acc, el) => acc + el.textContent.length, 0) >= chunkSize || currentChunk.length >= paragraphLimit) {
                        await processChunk(currentChunk);
                        currentChunk = [];
                    }
                } else {
                    elementState.set(p, { ...elementState.get(p), status: 'translated' });
                    p.dataset.translationState = 'translated';
                    if (observer) observer.unobserve(p);
                }
            }
            if (currentChunk.length > 0) {
                await processChunk(currentChunk);
            }
            
            isProcessing = false;
            if (translationQueue.size > 0) {
                setTimeout(() => processQueue(observer), 250);
            }
        };

        const observer = new IntersectionObserver((entries, obs) => {
            let addedToQueue = false;
            entries.forEach(entry => {
                const state = elementState.get(entry.target);
                if (entry.isIntersecting && (!state || !state.status)) {
                    elementState.set(entry.target, { ...state, status: 'queued' });
                    entry.target.dataset.translationState = 'queued';
                    translationQueue.add(entry.target);
                    addedToQueue = true;
                }
            });
            if (addedToQueue) processQueue(obs);
        }, { rootMargin: '0px 0px 500px 0px' });
        const isInViewport = (el) => {
            const rect = el.getBoundingClientRect();
            return (rect.top < window.innerHeight && rect.bottom >= 0);
        };
        allUnits.forEach(unit => {
            if (isInViewport(unit) && !elementState.get(unit)?.status) {
                elementState.set(unit, { status: 'queued' });
                unit.dataset.translationState = 'queued';
                translationQueue.add(unit);
            } else {
                observer.observe(unit);
            }
        });
        if (translationQueue.size > 0) {
            processQueue(observer);
        }
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
     * 获取并缓存 Together AI 的 API Key
     * @param {boolean} forceRefetch - 如果为 true, 则强制重新获取 Key
     */
    async function getTogetherApiKey(forceRefetch = false) {
        const CACHE_KEY = 'together_api_key_free_cache';
        
        if (!forceRefetch) {
            const cachedKey = GM_getValue(CACHE_KEY, null);
            if (cachedKey) {
                return cachedKey;
            }
        }

        console.log('Fetching new Together AI API Key...');

        for (const url of CONFIG.ACTIVATION_URLS) {
            try {
                const newKey = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        headers: { 'Accept': 'application/json' },
                        onload: (response) => {
                            try {
                                const data = JSON.parse(response.responseText);
                                const key = data?.openAIParams?.apiKey || data?.apiKey;
                                if (key) {
                                    resolve(key);
                                } else {
                                    reject(new Error(`No API Key found in response from ${url}`));
                                }
                            } catch (e) {
                                reject(new Error(`Failed to parse response from ${url}: ${e.message}`));
                            }
                        },
                        onerror: (error) => reject(new Error(`Network error at ${url}`)),
                        ontimeout: () => reject(new Error(`Timeout at ${url}`))
                    });
                });

                if (newKey) {
                    GM_setValue(CACHE_KEY, newKey);
                    console.log('Successfully fetched and cached new API Key.');
                    return newKey;
                }
            } catch (error) {
                console.warn(error.message);
            }
        }

        throw new Error('Failed to retrieve Together AI API Key from all available sources.');
    }

    /**
     * 远程翻译请求函数
     */
    async function requestRemoteTranslation(paragraphs, { retryCount = 0, maxRetries = 3 } = {}) {
        const engineName = GM_getValue('transEngine', 'together_ai');
        const engineConfig = CONFIG.TRANS_ENGINES[engineName];
        if (!engineConfig) {
            throw new Error(`服务 ${engineName} 未配置`);
        }

        let translatedText;

        try {
            if (engineName === 'google_ai') {
                const keys = GM_getValue('google_ai_keys_array', []);
                if (keys.length === 0) {
                    throw new Error('请先在菜单中设置至少一个 Google AI API Key');
                }

                let keyIndex = GM_getValue('google_ai_key_index', 0) % keys.length;

                for (let i = 0; i < keys.length; i++) {
                    const currentKey = keys[keyIndex];
                    let keyHasFailedPermanently = false;
                    console.log(`正在尝试使用 Google AI API Key #${keyIndex + 1}...`);
                    
                    const modelId = GM_getValue('google_ai_model', 'gemini-2.5-pro');
                    const final_url = engineConfig.url_api.replace('{model}', modelId) + `?key=${currentKey}`;
                    const requestData = engineConfig.getRequestData(paragraphs);

                    try {
                        const result = await new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: engineConfig.method, url: final_url, headers: engineConfig.headers,
                                data: JSON.stringify(requestData), responseType: 'json', timeout: 45000,
                                onload: (res) => {
                                    let responseData = res.response;
                                    if (typeof responseData === 'string') try { responseData = JSON.parse(responseData); } catch(e) {}

                                    const candidate = getNestedProperty(responseData, 'candidates[0]');
                                    if (res.status !== 200 || !candidate) {
                                        console.debug("Google AI 异常响应详情：", { requestPayload: requestData, response: responseData, status: res.status });
                                    }

                                    if (res.status === 200) {
                                        if (!candidate) {
                                            return reject({ type: 'empty_response', message: `Key #${keyIndex + 1} 失败：API 返回了无效的内容` });
                                        }
                                        const finishReason = candidate.finishReason;
                                        if (finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'PROHIBITED_CONTENT') {
                                            return reject({ type: 'content_error', message: `因含有敏感内容，请求被 Google AI 安全策略阻止` });
                                        }
                                        const content = getNestedProperty(candidate, 'content.parts[0].text');
                                        if (!content) {
                                            return reject({ type: 'empty_response', message: `Key #${keyIndex + 1} 失败：API 返回了空内容 (FinishReason: ${finishReason})` });
                                        }
                                        return resolve(responseData);
                                    }

                                    const errorMessage = getNestedProperty(responseData, 'error.message') || res.statusText || '未知错误';
                                    if (res.status === 400 && errorMessage.toLowerCase().includes('api_key_invalid')) {
                                        return reject({ type: 'key_invalid', message: `Key #${keyIndex + 1} 无效` });
                                    } else if (res.status === 429) {
                                        return reject({ type: 'rate_limit', message: `Key #${keyIndex + 1} 遇到错误（代码：429）：${errorMessage}` });
                                    } else if (res.status === 503) {
                                        return reject({ type: 'server_overloaded', message: `Key #${keyIndex + 1} 遇到错误（代码：503）：${errorMessage}` });
                                    }
                                    return reject({ type: 'api_error', message: `Key #${keyIndex + 1} 遇到错误（代码：${res.status}）：${errorMessage}` });
                                },
                                onerror: () => reject({ type: 'network', message: `Key #${keyIndex + 1} 网络错误` }),
                                ontimeout: () => reject({ type: 'network', message: `Key #${keyIndex + 1} 请求超时` })
                            });
                        });
                        
                        translatedText = getNestedProperty(result, engineConfig.responseIdentifier);
                        const nextKeyIndex = (keyIndex + 1) % keys.length;
                        GM_setValue('google_ai_key_index', nextKeyIndex);
                        break;

                    } catch (error) {
                        console.warn(error.message);
                        if (error.type === 'key_invalid' || error.type === 'quota_exceeded') {
                            keyHasFailedPermanently = true;
                            keyIndex = (keyIndex + 1) % keys.length;
                            GM_setValue('google_ai_key_index', keyIndex);
                        } else if (['server_overloaded', 'rate_limit', 'network', 'timeout'].includes(error.type)) {
                            throw error;
                        } else {
                            throw new Error(error.message || 'Google AI 请求失败');
                        }
                    }
                    if (i === keys.length - 1 && keyHasFailedPermanently) {
                         throw new Error('所有 Google AI API Key 均已失效或用尽额度');
                    }
                }

            } else {
                const { url_api, method, getRequestData, responseIdentifier } = engineConfig;
                let headers = { ...engineConfig.headers };

                if (engineName === 'chatglm_official' || engineName === 'deepseek_ai') {
                    const apiKey = GM_getValue(`${engineName.split('_')[0]}_api_key`);
                    if (!apiKey) throw new Error(`请先在菜单中设置 ${engineConfig.name} API Key`);
                    headers['Authorization'] = `Bearer ${apiKey}`;
                } else if (engineName === 'together_ai') {
                    headers['Authorization'] = `Bearer ${await getTogetherApiKey()}`;
                }

                const requestData = engineConfig.getRequestData(paragraphs);
                
                const res = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method, url: url_api, headers, data: JSON.stringify(requestData),
                        responseType: 'json', timeout: 45000,
                        onload: resolve,
                        onerror: () => reject(new Error('网络请求错误')),
                        ontimeout: () => reject(new Error('请求超时'))
                    });
                });
                
                if (res.status !== 200) {
                    let errorMessage = res.statusText;
                    let responseData = res.response;
                    if (typeof responseData === 'string') try { responseData = JSON.parse(responseData); } catch (e) {}
                    
                    if (engineName === 'chatglm_official' && getNestedProperty(responseData, 'error.code') === '1301') {
                        throw new Error('因含有敏感内容，请求被 ChatGLM 安全策略阻止');
                    }
                    
                    if (responseData && typeof responseData === 'object' && responseData.error) {
                        errorMessage = responseData.error.message || JSON.stringify(responseData.error);
                    }

                    console.debug(`${engineConfig.name} 异常响应详情：`, { requestPayload: requestData, response: res.response, status: res.status });
                    if (res.status === 503 || res.status === 429 || res.status >= 500) {
                        const error = new Error(`（代码：${res.status}）：${errorMessage}`);
                        error.type = 'server_overloaded';
                        throw error;
                    }
                    throw new Error(`（代码：${res.status}）：${errorMessage}`);
                }
                
                let rawResult = getNestedProperty(res.response, responseIdentifier);

                translatedText = rawResult;
            }
        } catch (error) {
            const isRetriable = ['server_overloaded', 'rate_limit', 'network', 'timeout'].includes(error.type) ||
                                error.message.includes('超时') || 
                                error.message.includes('网络');

            if (retryCount < maxRetries && isRetriable) {
                const delay = Math.pow(2, retryCount) * 1500 + Math.random() * 1000;
                console.warn(`请求遇到可重试错误：${error.message}。将在 ${Math.round(delay/1000)} 秒后重试（第 ${retryCount + 1} 次）...`);
                await sleep(delay);
                return await requestRemoteTranslation(paragraphs, { retryCount: retryCount + 1, maxRetries });
            }
            throw error;
        }
        
        if (typeof translatedText !== 'string' || !translatedText.trim()) {
            throw new Error('API 未返回有效文本');
        }
        
        return translatedText;
    }

    /**
     * 设置用户自己的 ChatGLM API Key
     */
    function setupChatGLMKey() {
        const currentKey = GM_getValue('chatglm_api_key', '');
        const newKey = prompt('请输入您的 ChatGLM API Key：', currentKey);
        if (newKey !== null) {
            GM_setValue('chatglm_api_key', newKey.trim());
            notifyAndLog(newKey.trim() ? 'ChatGLM API Key 已保存！' : 'ChatGLM API Key 已清除！');
        }
    }

    /**
     * 设置用户自己的 DeepSeek API Key
     */
    function setupDeepSeekKey() {
        const currentKey = GM_getValue('deepseek_api_key', '');
        const newKey = prompt('请输入您的 DeepSeek API Key：', currentKey);
        if (newKey !== null) {
            GM_setValue('deepseek_api_key', newKey.trim());
            notifyAndLog(newKey.trim() ? 'DeepSeek API Key 已保存！' : 'DeepSeek API Key 已清除！');
        }
    }

    /**
     * 设置用户自己的 Google AI API Key
     */
    function setupGoogleAiKeys() {
        const storedKeys = GM_getValue('google_ai_keys_array', []);
        const currentKeysString = storedKeys.join(',\n');
        const newKeysString = prompt(
            '请输入一个或多个 Google AI API Key，用英文逗号分隔。脚本将自动轮询这些 API Key 以提高额度。',
            currentKeysString
        );
        if (newKeysString !== null) {
            const newKeysArray = newKeysString.split(',')
                .map(key => key.trim())
                .filter(key => key.length > 0);
            GM_setValue('google_ai_keys_array', newKeysArray);
            if (newKeysArray.length > 0) {
                notifyAndLog(`已保存 ${newKeysArray.length} 个 Google AI API Key！`);
                GM_setValue('google_ai_key_index', 0);
            } else {
                notifyAndLog('Google AI API Key 已全部清除。');
            }
        }
    }

    const LOCAL_GLOSSARY_KEY = 'ao3_local_glossary';// 用于存储用户手动创建的术语
    const IMPORTED_GLOSSARY_KEY = 'ao3_imported_glossary';// 用于存储所有在线导入的术语
    const GLOSSARY_METADATA_KEY = 'ao3_glossary_metadata';// 用于储存导入的术语表的信息

    /**
     * 管理用户手动设置的本地术语表
     */
    function manageGlossary() {
        const currentGlossary = GM_getValue(LOCAL_GLOSSARY_KEY, {});
        const glossaryForDisplay = Object.entries(currentGlossary)
            .map(([key, value]) => `${key}：${value}`)
            .join('，');
        const userInput = prompt(
            '请按 “原文：译文” 格式编辑您的本地术语表，词条间用逗号分隔。\n若本地术语表与导入的在线术语表发生冲突，将以本地术语表的翻译词条为准。\n\n示例\nWakaba：若叶，Mutsumi：睦，Tsukinomori Girls\' Academy：月之森女子学园',
            glossaryForDisplay
        );
        if (userInput === null || userInput.trim() === glossaryForDisplay.trim()) {
            notifyAndLog('本地术语表未更改。');
            return;
        }
        try {
            const newGlossary = {};
            if (userInput.trim() === '') {
                GM_setValue(LOCAL_GLOSSARY_KEY, {});
                notifyAndLog('本地术语表已清空。');
                return;
            }
            const entries = userInput.split(/[，,]/);
            for (const entry of entries) {
                if (entry.trim() === '') continue;
                const parts = entry.split(/[：:]/, 2);
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    const value = parts[1].trim();
                    if (key && value) {
                        newGlossary[key] = value;
                    } else {
                         console.warn(`跳过无效的术语表条目: "${entry}"`);
                    }
                } else {
                    console.warn(`跳过格式不正确的术语表条目: "${entry}"`);
                }
            }
            GM_setValue(LOCAL_GLOSSARY_KEY, newGlossary);
            notifyAndLog('本地术语表已成功更新！');
        } catch (e) {
            alert('保存失败！解析时发生未知错误，请检查您的输入。\n\n错误信息: ' + e.message);
        }
    }

	/**
	 * 解析自定义的、非 JSON 格式的术语表文本
	 */
	function parseCustomGlossaryFormat(text) {
	    const result = { terms: {} };
	    const lines = text.split('\n');

	    const metadataRegex = /^\s*(maintainer|version|last_updated|维护者|版本号|更新时间)\s*[:：]\s*(.*?)\s*[,，]?\s*$/;
	    const termsMarkerRegex = /^\s*(?:terms|词条)\s*[:：]?\s*$/i;
	    let termsStartIndex = -1;

	    for (let i = 0; i < lines.length; i++) {
	        const line = lines[i];

	        if (termsMarkerRegex.test(line.trim())) {
	            termsStartIndex = i;
	            break;
	        }

	        const metadataMatch = line.match(metadataRegex);
	        if (metadataMatch) {
	            let key = metadataMatch[1].trim();
	            let value = metadataMatch[2].trim();

                const keyMap = {
                    '维护者': 'maintainer',
                    '版本号': 'version',
                    '更新时间': 'last_updated'
                };
                const mappedKey = keyMap[key] || key;

	            if (mappedKey === 'last_updated') {
	                const dateObject = new Date(value);
	                if (!isNaN(dateObject.getTime())) {
	                    value = dateObject.toISOString();
	                }
	            }
	            result[mappedKey] = value;
	        }
	    }

	    if (termsStartIndex === -1) {
	        throw new Error('未找到 "terms:" 或 "词条:" 标记，无法解析术语列表。');
	    }

	    const termsLines = lines.slice(termsStartIndex + 1);
	    
	    for (const line of termsLines) {
	        if (!line.trim() || line.trim().startsWith('//')) continue;

	        const parts = line.split(/[:：]/);
	        if (parts.length >= 2) {
	            const key = parts[0].trim();
	            const value = parts.slice(1).join(':').trim().replace(/[,，]$/, '');
	            if (key && value) {
	                result.terms[key] = value;
	            }
	        }
	    }

	    if (Object.keys(result.terms).length === 0) {
	        throw new Error('术语列表为空或解析失败。');
	    }

	    return result;
	}

    /**
     * 处理并解析不规范的 JSON 字符串
     */
    function sanitizeAndParseJson(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('输入内容无效，必须为非空字符串。');
        }
        let sanitizedString = jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        sanitizedString = sanitizedString.replace(/,\s*([}\]])/g, '$1');
        try {
            const parsedObject = JSON.parse(sanitizedString);
            return parsedObject;
        } catch (e) {
            console.error("JSON 净化后解析失败:", e);
            console.error("净化后的内容:", sanitizedString);
            throw new Error(`JSON 格式严重错误，自动修复失败: ${e.message}`);
        }
    }

    /**
     * 从 GitHub 导入在线术语表文件
     */
    function importOnlineGlossary() {
        const exampleUrl = 'https://raw.githubusercontent.com/YourUsername/YourRepo/main/glossary.txt';
        const url = prompt(
            '请输入 Github 术语表文件链接。\n\n示例\n' + exampleUrl,
            ''
        );
        if (!url || !url.trim()) { return; }

        const githubRawRegex = /^https:\/\/raw\.githubusercontent\.com(\/[^\/]+)+$/;
        if (!githubRawRegex.test(url)) {
            alert("链接格式不正确。请输入一个有效的 GitHub Raw 文件链接。");
            return;
        }

        const glossaryName = decodeURIComponent(url.split('/').pop().replace(/\.[^/.]+$/, ''));
        notifyAndLog(`正在下载并导入 “${glossaryName}”...`);
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                if (response.status !== 200) {
                    notifyAndLog(`下载 “${glossaryName}” 失败！\n服务器返回状态码: ${response.status}`, '导入错误', 'error');
                    return;
                }

                const normalizedContent = normalizeContentToPlainText(response.responseText);

                try {
                    let onlineData;
                    try {
                        onlineData = parseCustomGlossaryFormat(normalizedContent);
                        console.log(`“${glossaryName}” 已通过自定义格式成功解析。`);
                    } catch (customError) {
                        console.warn(`自定义格式解析失败，回退至标准 JSON 解析器。原因: ${customError.message}`);
                        onlineData = sanitizeAndParseJson(normalizedContent);
                        console.log(`“${glossaryName}” 已通过标准 JSON 格式成功解析。`);
                    }

                    if (!onlineData.version || typeof onlineData.terms !== 'object' || onlineData.terms === null) {
                        throw new Error('文件内容不规范，缺少 "version" 或 "terms" 字段。');
                    }

                    const onlineTerms = onlineData.terms;
                    const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
                    allImportedGlossaries[url] = onlineTerms;
                    GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
                    
                    const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
                    metadata[url] = { 
                        name: glossaryName,
                        author: onlineData.author || '未知', 
                        version: onlineData.version, 
                        last_imported: new Date().toISOString() 
                    };
                    GM_setValue(GLOSSARY_METADATA_KEY, metadata);

                    const importedCount = Object.keys(onlineTerms).length;
                    const authorName = onlineData.author || '未知';
                    notifyAndLog(`已成功导入 “${glossaryName}” 术语表。\n维护者：${authorName}，版本号：${onlineData.version}。共 ${importedCount} 个词条。`, '导入成功');

                } catch (e) {
                    console.error(`处理 “${glossaryName}” 时发生严重错误:`, e);
                    notifyAndLog(`导入 “${glossaryName}” 失败：${e.message}\n请检查文件格式是否符合要求。`, '处理错误', 'error');
                }
            },
            onerror: function(error) {
                console.error(`下载 “${glossaryName}” 时发生网络错误:`, error);
                notifyAndLog(`下载 “${glossaryName}” 失败！\n请检查网络连接或链接是否正确。`, '网络错误', 'error');
            }
        });
    }

    /**
     * 管理已导入的在线术语表
     */
	function manageImportedGlossaries() {
		const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
		const urls = Object.keys(metadata);
		if (urls.length === 0) {
			alert('您尚未导入任何在线术语表。');
			return;
		}
		const urlListText = urls.map((url, index) => {
			const glossaryName = decodeURIComponent(url.split('/').pop().replace(/\.[^/.]+$/, ''));
			const author = metadata[url].author || '未知';
			const version = metadata[url].version;
			return `${index + 1}. ${glossaryName}\n    版本：v${version}，维护者：${author}`;
		}).join('\n');

		const choice = prompt(
			'若您想要移除某个术语表，请输入对应编号（仅输入数字）。注意，此操作彻底移除该在线术语表及其所有词条。\n\n' + urlListText,
			''
		);
		if (!choice || !choice.trim()) { return; }
		const index = parseInt(choice, 10) - 1;
		if (isNaN(index) || index < 0 || index >= urls.length) {
			alert('输入无效，请输入列表中的正确编号。');
			return;
		}
		const urlToRemove = urls[index];
		const glossaryNameToRemove = decodeURIComponent(urlToRemove.split('/').pop().replace(/\.[^/.]+$/, ''));
		if (!confirm(`您确定要移除 “${glossaryNameToRemove}” 这个术语表吗？`)) {
			return;
		}
		notifyAndLog(`正在移除 “${glossaryNameToRemove}”...`, '请稍候');
		delete metadata[urlToRemove];
		GM_setValue(GLOSSARY_METADATA_KEY, metadata);
		const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
		delete allImportedGlossaries[urlToRemove];
		GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
		notifyAndLog(`已成功移除 “${glossaryNameToRemove}” 术语表。`, '操作完成');
	}

    /**
     * 清空所有术语表
     */
    function clearAllGlossaries() {
        if (confirm('您确定要清空所有术语表吗？\n此操作将删除您手动添加的本地词条及所有在线导入术语表，且无法撤销。')) {
            GM_setValue(LOCAL_GLOSSARY_KEY, {});
            GM_setValue(IMPORTED_GLOSSARY_KEY, {});
            GM_setValue(GLOSSARY_METADATA_KEY, {});
            notifyAndLog('所有术语表已被成功清空。', '操作完成');
        }
    }

    /**
     * 检查并更新所有已导入的在线术语表
     */
    async function checkForGlossaryUpdates(isManual = false) {
        const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
        const urls = Object.keys(metadata);
        if (isManual && urls.length === 0) {
            return { updated: 0, failed: 0, total: 0 };
        }
        if (urls.length === 0) { return; }
        if (!isManual) {
            console.log('AO3 汉化插件：正在后台检查术语表更新...');
        }
        let updatedCount = 0;
        let failedCount = 0;
        const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
        for (const url of urls) {
            const glossaryName = decodeURIComponent(url.split('/').pop().replace(/\.[^/.]+$/, ''));
            try {
                const response = await new Promise((resolve, reject) => {
                    const urlWithCacheBust = url + '?t=' + new Date().getTime();
                    GM_xmlhttpRequest({ method: 'GET', url: urlWithCacheBust, onload: resolve, onerror: reject });
                });
                if (response.status !== 200) {
                    throw new Error(`服务器返回状态码: ${response.status}`);
                }

                let onlineData;
                try {
                    onlineData = parseCustomGlossaryFormat(response.responseText);
                } catch (customError) {
                    onlineData = sanitizeAndParseJson(response.responseText);
                }
                
                const localVersion = metadata[url].version;
                const onlineVersion = onlineData.version;
                if (onlineVersion && compareVersions(onlineVersion, localVersion) > 0) {
                    const authorName = onlineData.author || '未知';
                    console.log(`发现 “${glossaryName}” 的新版本: v${onlineVersion} (本地为 v${localVersion})`);
                    allImportedGlossaries[url] = onlineData.terms || {};
                    metadata[url].author = authorName;
                    metadata[url].version = onlineVersion;
                    metadata[url].last_updated = new Date().toISOString();
                    updatedCount++;
                    if (!isManual) {
                        notifyAndLog(`“${glossaryName}” 术语表已自动更新到 v${onlineVersion}！\n维护者：${authorName}`, '更新成功');
                    }
                }
            } catch (e) {
                failedCount++;
                console.error(`检查 “${glossaryName}” 更新时发生错误:`, e);
            }
        }
        if (updatedCount > 0) {
            GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
            GM_setValue(GLOSSARY_METADATA_KEY, metadata);
        }
        if (isManual) {
            return { updated: updatedCount, failed: failedCount, total: urls.length };
        } else {
            console.log(`AO3 汉化插件：后台术语表检查完成。共检查 ${urls.length} 个，更新 ${updatedCount} 个，失败 ${failedCount} 个。`);
        }
    }

    /**
     * 合并本地与在线术语表
     */
    function getGlossaryProcessedParagraphs(paragraphs) {
        const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
        let combinedImportedTerms = {};
        for (const url in allImportedGlossaries) {
            Object.assign(combinedImportedTerms, allImportedGlossaries[url]);
        }
        const localGlossary = GM_getValue(LOCAL_GLOSSARY_KEY, {});
        const finalGlossary = { ...combinedImportedTerms, ...localGlossary };

        if (Object.keys(finalGlossary).length === 0) {
            return paragraphs;
        }

        const sortedKeys = Object.keys(finalGlossary).sort((a, b) => b.length - a.length);

        return paragraphs.map(p => {
            const clone = p.cloneNode(true);
            const treeWalker = document.createTreeWalker(
                clone,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                let processedText = currentNode.nodeValue;
                for (const key of sortedKeys) {
                    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    const regex = new RegExp(`(?<!\\w)${escapedKey}(?!\\w)`, 'g');
                    
                    processedText = processedText.replace(regex, finalGlossary[key]);
                }
                currentNode.nodeValue = processedText;
            }
            
            return clone;
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
     * 翻译文本处理函数
     */
    const AdvancedTranslationCleaner = new (class {
        constructor() {
            this.metaKeywords = [
                '原文', '输出', '说明', '遵守', '润色', '语境', '保留', '符合', '指令',
                'Original text', 'Output', 'Note', 'Stage', 'Strategy', 'Polish', 'Retain', 'Glossary', 'Adherence'
            ];
            this.junkLineRegex = new RegExp(`^\\s*(\\d+\\.\\s*)?(${this.metaKeywords.join('|')})[:：\\s]`, 'i');
            this.lineNumbersRegex = /^\d+\.\s*/;
        }
        clean(text) {
            if (!text || typeof text !== 'string') {
                return '';
            }
            const lines = text.split('\n');
            const cleanedLines = lines.filter(line => !this.junkLineRegex.test(line));
            let cleanedText = cleanedLines.join('\n');
            cleanedText = cleanedText.replace(this.lineNumbersRegex, '');
            cleanedText = cleanedText.replace(/[\s\u3000]+/g, ' ');
            cleanedText = cleanedText.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');
            cleanedText = cleanedText.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
            cleanedText = cleanedText.replace(/([a-zA-Z0-9])([\u3000-\u303F\uff01-\uff5e])/g, '$1 $2');
            cleanedText = cleanedText.replace(/(?<=[\u4e00-\u9fa5])\s(?=[\u4e00-\u9fa5])/g, '');
            cleanedText = cleanedText.replace(/(?<=[\u4e00-\u9fa5])\s(?=<)/g, '');
            cleanedText = cleanedText.replace(/(?<=>)\s(?=[\u4e00-\u9fa5])/g, '');
            cleanedText = cleanedText.replace(/(?<=[\u4e00-\u9fa5])\s+(?=[\u3000-\u303F\uff01-\uff5e])/g, '');
            cleanedText = cleanedText.replace(/(?<=[\u3000-\u303F\uff01-\uff5e])\s+(?=[\u4e00-\u9fa5])/g, '');
            return cleanedText.trim();
        }
    })();

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
     * 显示通知时打印到控制台
     * @param {string} message - 主要消息内容
     * @param {string} [title='AO3 汉化插件'] - 通知的标题
     * @param {'info'|'warn'|'error'} [logType='info'] - 控制台日志的类型
     */
    function notifyAndLog(message, title = 'AO3 汉化插件', logType = 'info') {
        const logMessage = `[${title}] ${message.replace(/\n/g, ' ')}`;
        
        switch (logType) {
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
            default:
                console.info(logMessage);
                break;
        }

        GM_notification(message, title);
    }

    let menuCommandIds = [];
        let currentMenuView = 'main'; 

    /**
     * 菜单渲染函数
     */
    function renderMenuCommands() {
        menuCommandIds.forEach(id => GM_unregisterMenuCommand(id));
        menuCommandIds = [];

        const register = (text, callback) => {
            menuCommandIds.push(GM_registerMenuCommand(text, callback));
        };

        const isAiTranslationEnabled = GM_getValue('enable_transDesc', false);

        if (currentMenuView === 'main') {
            register(isAiTranslationEnabled ? '禁用 AI 翻译功能' : '启用 AI 翻译功能', () => {
                const newState = !isAiTranslationEnabled;
                GM_setValue('enable_transDesc', newState);
                FeatureSet.enable_transDesc = newState;
                notifyAndLog(`AI 翻译功能已${newState ? '启用' : '禁用'}`);
                if (newState) {
                    transDesc();
                } else {
                    document.querySelectorAll('.translate-me-ao3-wrapper, .translated-by-ao3-script, .translated-by-ao3-script-error').forEach(el => el.remove());
                    document.querySelectorAll('[data-translation-handled="true"], [data-state="translated"]').forEach(el => {
                        delete el.dataset.translationHandled;
                        delete el.dataset.state;
                    });
                }
                renderMenuCommands();
            });

            if (isAiTranslationEnabled) {
                register('管理 AI 翻译术语表', () => {
                    currentMenuView = 'glossary';
                    renderMenuCommands();
                });

                const currentMode = GM_getValue('translation_display_mode', 'bilingual');
                const modeText = currentMode === 'bilingual' ? '双语对照' : '仅译文';
                register(`⇄ 翻译模式：${modeText}`, () => {
                    const newMode = currentMode === 'bilingual' ? 'translation_only' : 'bilingual';
                    GM_setValue('translation_display_mode', newMode);
                    applyDisplayModeChange(newMode);
                    notifyAndLog(`翻译模式已切换为: ${newMode === 'bilingual' ? '双语对照' : '仅译文'}`);
                    renderMenuCommands();
                });

                const currentEngineId = GM_getValue('transEngine', 'together_ai');
                const engineNameMap = {
                    'together_ai': 'Together AI',
                    'chatglm_official': 'ChatGLM', 
                    'deepseek_ai': 'DeepSeek', 
                    'google_ai': 'Google AI'
                };
                const engineMasterOrder = ['together_ai', 'chatglm_official', 'deepseek_ai', 'google_ai'];
                const currentServiceIndex = engineMasterOrder.indexOf(currentEngineId);
                const nextServiceIndex = (currentServiceIndex + 1) % engineMasterOrder.length;
                const nextEngineId = engineMasterOrder[nextServiceIndex];
                register(`⇄ 翻译服务：${engineNameMap[currentEngineId]}`, () => {
                    GM_setValue('transEngine', nextEngineId);
                    notifyAndLog(`翻译服务已切换为: ${engineNameMap[nextEngineId]}`);
                    renderMenuCommands();
                });

                if (currentEngineId === 'together_ai') {
                    const modelMapping = {
                        'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': 'Llama 4 Maverick',
                        'Qwen/Qwen2.5-72B-Instruct-Turbo': 'Qwen 2.5 72B',
                        'deepseek-ai/DeepSeek-V3': 'DeepSeek V3'
                    };
                    const modelOrder = Object.keys(modelMapping);

                    const currentModelId = GM_getValue('together_ai_model', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8');
                    const currentModelIndex = modelOrder.indexOf(currentModelId);
                    const nextModelIndex = (currentModelIndex + 1) % modelOrder.length;
                    const nextModelId = modelOrder[nextModelIndex];
                    
                    const currentModelName = modelMapping[currentModelId] || '未知模型';

                    register(`⇄ 使用模型：${currentModelName}`, () => {
                        GM_setValue('together_ai_model', nextModelId);
                        notifyAndLog(`Together AI 模型已切换为: ${modelMapping[nextModelId]}`);
                        renderMenuCommands();
                    });
                } else if (currentEngineId === 'deepseek_ai') {
                    const modelMapping = { 'deepseek-chat': 'DeepSeek V3', 'deepseek-reasoner': 'DeepSeek R1' };
                    const modelOrder = Object.keys(modelMapping);
                    const currentModelId = GM_getValue('deepseek_model', 'deepseek-chat');
                    const currentModelIndex = modelOrder.indexOf(currentModelId);
                    const nextModelIndex = (currentModelIndex + 1) % modelOrder.length;
                    const nextModelId = modelOrder[nextModelIndex];
                    register(`⇄ 使用模型：${modelMapping[currentModelId]}`, () => {
                        GM_setValue('deepseek_model', nextModelId);
                        notifyAndLog(`DeepSeek 模型已切换为: ${modelMapping[nextModelId]}`);
                        renderMenuCommands();
                    });
                } else if (currentEngineId === 'google_ai') {
                    const modelMapping = {
                        'gemini-2.5-pro': 'Gemini 2.5 Pro',
                        'gemini-2.5-flash': 'Gemini 2.5 Flash',
                        'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite'
                    };
                    const modelOrder = Object.keys(modelMapping);
                    const currentModelId = GM_getValue('google_ai_model', 'gemini-2.5-pro');
                    const currentModelIndex = modelOrder.indexOf(currentModelId);
                    const nextModelIndex = (currentModelIndex + 1) % modelOrder.length;
                    const nextModelId = modelOrder[nextModelIndex];
                    register(`⇄ 使用模型：${modelMapping[currentModelId]}`, () => {
                        GM_setValue('google_ai_model', nextModelId);
                        notifyAndLog(`Google AI 模型已切换为: ${modelMapping[nextModelId]}`);
                        renderMenuCommands();
                    });
                }

                if (currentEngineId === 'chatglm_official') {
                    register('▶ 设置 ChatGLM API Key', setupChatGLMKey);
                } else if (currentEngineId === 'deepseek_ai') {
                    register('▶ 设置 DeepSeek API Key', setupDeepSeekKey);
                } else if (currentEngineId === 'google_ai') {
                    register('▶ 设置 Google AI API Key', setupGoogleAiKeys);
                }
            }
        }
        else if (currentMenuView === 'glossary') {
            register('←返回到主菜单', () => {
                currentMenuView = 'main';
                renderMenuCommands();
            });

            register('设置本地术语表', manageGlossary);
            register('导入在线术语表', importOnlineGlossary);
            register('管理已有术语表', manageImportedGlossaries);
            register('清空所有术语表', clearAllGlossaries);
        }
    }

    /**
     * 动态应用翻译翻译模式的函数
     * @param {string} mode - '双语对照' 或 '仅译文'
     */
    function applyDisplayModeChange(mode) {
        const translatedBlocks = document.querySelectorAll('#chapters .userstuff .translated-by-ao3-script');
        translatedBlocks.forEach(translatedNode => {
            const originalNode = translatedNode.previousElementSibling;
            if (originalNode && originalNode.dataset.translationState === 'translated') {
                originalNode.style.display = (mode === 'translation_only') ? 'none' : '';
            }
        });
    }

    /**
     * 通用后处理函数：处理块级元素末尾的孤立标点
     * @param {HTMLElement} [rootElement=document]
     */
    function handleTrailingPunctuation(rootElement = document) {
        const selectors = 'p, li, dd, blockquote, h1, h2, h3, h4, h5, h6, .summary, .notes';
        const punctuationMap = { '.': ' 。', '?': ' ？', '!': ' ！' };

        const elements = rootElement.querySelectorAll(`${selectors}:not([data-translated-by-custom-function])`);

        elements.forEach(el => {
            let lastMeaningfulNode = el.lastChild;

            while (lastMeaningfulNode) {
                if (lastMeaningfulNode.nodeType === Node.COMMENT_NODE ||
                (lastMeaningfulNode.nodeType === Node.TEXT_NODE && lastMeaningfulNode.nodeValue.trim() === ''))
                {
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
     * 将 HTML 内容转换为纯文本格式
     */
    function normalizeContentToPlainText(content) {
        if (/<[a-z][\s\S]*>/i.test(content)) {
            let plainText = content;
            plainText = plainText.replace(/<br\s*\/?>/gi, '\n');
            plainText = plainText.replace(/<\/p>/gi, '\n');
            plainText = plainText.replace(/<[^>]+>/g, '');
            plainText = plainText.split('\n')
                               .map(line => line.trim())
                               .join('\n')
                               .replace(/\n{3,}/g, '\n\n');
            return plainText.trim();
        }
        return content;
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
     * main 函数，初始化翻译功能。确保在正确时机调用 transDesc
     */
    function main() {
        (function() {
            const oldGlossaryKey = 'ao3_translation_glossary';
            const newLocalGlossaryKey = 'ao3_local_glossary';
            const oldGlossaryData = GM_getValue(oldGlossaryKey, null);
            if (oldGlossaryData && typeof oldGlossaryData === 'object' && Object.keys(oldGlossaryData).length > 0) {
                console.log('AO3 汉化插件：检测到旧版术语表数据，正在迁移...');
                GM_setValue(newLocalGlossaryKey, oldGlossaryData);
                GM_deleteValue(oldGlossaryKey);
                console.log('AO3 汉化插件：术语表数据迁移成功！');
                GM_notification('您的自定义翻译词条已成功迁移到新版本！', 'AO3 汉化插件');
            }
        })();
        checkForGlossaryUpdates(false);
        const globalStyles = document.createElement('style');
        globalStyles.textContent = `
            .autocomplete.dropdown p.notice {
                margin-bottom: 0;
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
        if (pageConfig.currentPageType) {
            transTitle();
            transBySelector();
            traverseNode(document.body);
            runHighPriorityFunctions(); 

            if (FeatureSet.enable_transDesc) {
                setTimeout(transDesc, 1000);
            }
        }
        renderMenuCommands();
        watchUpdate();
    }

    /**
     * watchUpdate 函数：监视页面变化，根据变化的节点进行翻译。
     */
    function watchUpdate() {
        let previousURL = window.location.href;

        const handleUrlChange = () => {
            const currentURL = window.location.href;
            if (currentURL !== previousURL) {
                previousURL = currentURL;
                updatePageConfig('URL变化');
                transTitle();
                transBySelector();
                traverseNode(document.body);
                runHighPriorityFunctions();
                if (FeatureSet.enable_transDesc) {
                    transDesc();
                }
            }
        };

        const processMutations = mutations => {
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
                    traverseNode(node);
                    runHighPriorityFunctions(node.parentElement || node);
                }
            });

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

        // 通用的后处理器和格式化函数
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