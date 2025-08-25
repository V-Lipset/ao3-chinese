// ==UserScript==
// @name         AO3 Trans Script
// @namespace    https://github.com/V-Lipset/ao3-chinese
// @description  中文化 AO3 界面，可调用 AI 实现简介、注释、评论以及全文翻译。
// @version      1.0.6-custom-2025-08-25
// @author       V-Lipset
// @license      GPL-3.0
// @match        https://archiveofourown.org/*
// @match        https://xn--iao3-lw4b.ws/*
// @icon         https://raw.githubusercontent.com/V-Lipset/ao3-chinese/custom/assets/icon.png
// @resource     vIcon https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@custom/assets/icon.png
// @supportURL   https://github.com/V-Lipset/ao3-chinese/issues
// @downloadURL  https://raw.githubusercontent.com/V-Lipset/ao3-chinese/custom/main.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@custom/main.user.js
// @require      https://cdn.jsdelivr.net/gh/V-Lipset/ao3-chinese@custom/zh-cn.js
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @connect      translate.googleapis.com
// @connect      translate-pa.googleapis.com
// @connect      open.bigmodel.cn
// @connect      api.deepseek.com
// @connect      generativelanguage.googleapis.com
// @connect      api.groq.com
// @connect      api.together.xyz
// @connect      api.cerebras.ai
// @connect      api-inference.modelscope.cn
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
// ==/UserScript==

(function (window, document, undefined) {
    'use strict';
    /****************** 全局配置区 ******************/

    // 功能开关
    const FeatureSet = {
        enable_RegExp: GM_getValue('enable_RegExp', true),
        enable_transDesc: GM_getValue('enable_transDesc', false),
    };

    // AI 翻译指令
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

    // AI 请求数据构建
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

    // 底层实现配置
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

        // 默认及储存翻译服务
        transEngine: GM_getValue('transEngine', 'google_translate'),

        // 默认文本分块、懒加载边距
		CHUNK_SIZE: 1600,
        PARAGRAPH_LIMIT: 8,
		SUBSEQUENT_CHUNK_SIZE: 2400,
        SUBSEQUENT_PARAGRAPH_LIMIT: 12,
        LAZY_LOAD_ROOT_MARGIN: '400px 0px 1000px 0px',

        // 特殊引擎/模型分块、懒加载
        MODEL_SPECIFIC_LIMITS: {
            'google_translate': {
                first: {
                    CHUNK_SIZE: 4000,
                    PARAGRAPH_LIMIT: 20,
                },
                subsequent: {
                    CHUNK_SIZE: 6000,
                    PARAGRAPH_LIMIT: 30,
                },
                LAZY_LOAD_ROOT_MARGIN: '1200px 0px 3000px 0px',
            },
            'gemini-2.5-pro': {
                first: {
                    CHUNK_SIZE: 2400,
                    PARAGRAPH_LIMIT: 12,
                },
                subsequent: {
                    CHUNK_SIZE: 3000,
                    PARAGRAPH_LIMIT: 15,
                }
            },
            'deepseek-reasoner': {
                first: {
                    CHUNK_SIZE: 2400,
                    PARAGRAPH_LIMIT: 12,
                },
                subsequent: {
                    CHUNK_SIZE: 3000,
                    PARAGRAPH_LIMIT: 15,
                }
            }
        },

        // 翻译服务配置
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
                responseIdentifier: (response) => {
                    try {
                        const translatedHtmlSnippets = response[0];
                        if (!translatedHtmlSnippets || !Array.isArray(translatedHtmlSnippets)) {
                            throw new Error('从谷歌翻译接口返回的响应结构无效');
                        }
                        const parser = new DOMParser();
                        return translatedHtmlSnippets.map((snippet, index) => {
                            const doc = parser.parseFromString(snippet, 'text/html');
                            const textContent = (doc.body.textContent || '').replace(/\n/g, ' ').trim();
                            return `${index + 1}. ${textContent}`;
                        }).join('\n\n');
                    } catch (e) {
                        console.error("解析谷歌翻译响应时出错:", e, "响应内容:", response);
                        throw new Error('解析谷歌翻译接口的响应失败。');
                    }
                },
            },
            zhipu_ai: {
                name: 'Zhipu AI',
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
                    return createRequestData(
                        model,
                        sharedSystemPrompt,
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
            groq_ai: {
                name: 'Groq AI',
                url_api: 'https://api.groq.com/openai/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs, glossary) => {
                    const model = GM_getValue('groq_model', 'meta-llama/llama-4-maverick-17b-128e-instruct');
                    return createRequestData(
                        model,
                        sharedSystemPrompt,
                        paragraphs,
                        glossary
                    );
                },
                responseIdentifier: 'choices[0].message.content',
            },
            together_ai: {
                name: 'Together AI',
                url_api: 'https://api.together.xyz/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                getRequestData: (paragraphs) => {
                    const model = GM_getValue('together_model', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8');
                    return createRequestData( 
                        model,
                        sharedSystemPrompt,
                        paragraphs
                    );
                },
                responseIdentifier: 'choices[0].message.content',
            },
            cerebras_ai: {
                name: 'Cerebras',
                url_api: 'https://api.cerebras.ai/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs) => {
                    const model = GM_getValue('cerebras_model', 'llama-4-scout-17b-16e-instruct');
                    return createRequestData(
                        model,
                        sharedSystemPrompt,
                        paragraphs
                    );
                },
                responseIdentifier: 'choices[0].message.content',
            },
            modelscope_ai: {
                name: 'ModelScope',
                url_api: 'https://api-inference.modelscope.cn/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                getRequestData: (paragraphs) => {
                    const model = GM_getValue('modelscope_model', 'LLM-Research/Llama-4-Maverick-17B-128E-Instruct');
                    
                    const numberedText = paragraphs
                        .map((p, i) => `${i + 1}. ${p.innerHTML}`)
                        .join('\n\n');
                    
                    const messages = [
                        { "role": "system", "content": sharedSystemPrompt },
                        { "role": "user", "content": `Translate the following numbered list to Simplified Chinese（简体中文）:\n\n${numberedText}` }
                    ];

                    if (model === 'deepseek-ai/DeepSeek-V3.1') {
                        messages.push({ "role": "assistant", "content": "</think>" });
                    }
                    
                    return {
                        model: model,
                        messages: messages,
                        stream: false,
                        temperature: 0,
                    };
                },
                responseIdentifier: 'choices[0].message.content',
            },
        }
    };

    // 标记是否为首次翻译区块
    let isFirstTranslationChunk = true;
    // 页面配置缓存
    let pageConfig = {};
    // 术语表缓存
    let glossaryCache = null;

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

            const showFab = GM_getValue('show_fab', true);
            register(showFab ? '隐藏悬浮球' : '显示悬浮球', () => {
                const newState = !showFab;
                GM_setValue('show_fab', newState);
                fabLogic.toggleFabVisibility();
                render(); 
            });

            const isPanelOpen = panelLogic.panel.style.display === 'block';
            const panelToggleText = isPanelOpen ? '关闭设置面板' : '打开设置面板';
            register(panelToggleText, () => {
                panelLogic.togglePanel();
            });
        };
        return render;
    }

    /**
     * 悬浮球的结构与样式
     */
    function createFabUI() {
        const iconUrl = GM_getResourceURL('vIcon');

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

        const settingsIcon = document.createElement('div');
        settingsIcon.className = 'fab-icon';

        fabButton.appendChild(settingsIcon);
        fabContainer.appendChild(fabButton);
        document.body.appendChild(fabContainer);

        return { fabContainer };
    }

    /**
     * 悬浮球的交互事件
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
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        const limitNumber = (num, min, max) => Math.max(min, Math.min(num, max));
        const debounce = (func, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };
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
            const winH = window.innerHeight;
            const currentPos = { x: parseFloat(fabContainer.style.left || 0), y: parseFloat(fabContainer.style.top || 0) };
            
            const dist = {
                left: currentPos.x,
                right: winW - (currentPos.x + fabSize.width),
                top: currentPos.y,
                bottom: winH - (currentPos.y + fabSize.height)
            };

            const isNearLeft = dist.left < SNAP_THRESHOLD;
            const isNearRight = dist.right < SNAP_THRESHOLD;
            const isNearTop = dist.top < SNAP_THRESHOLD;
            const isNearBottom = dist.bottom < SNAP_THRESHOLD;

            let finalPos = { ...currentPos };
            let shouldSnap = true;

            if ((isNearLeft && isNearTop) || (isNearLeft && isNearBottom) || (isNearRight && isNearTop) || (isNearRight && isNearBottom)) {
                finalPos.x = isNearLeft ? SAFE_MARGIN : winW - fabSize.width - SAFE_MARGIN;
                finalPos.y = isNearTop ? SAFE_MARGIN : winH - fabSize.height - SAFE_MARGIN;
                fabContainer.classList.remove('snapped', 'is-active');
            } else if (isNearLeft || isNearRight || isNearTop || isNearBottom) {
                const minVertical = Math.min(dist.top, dist.bottom);
                const minHorizontal = Math.min(dist.left, dist.right);

                if (minHorizontal < minVertical) {
                    finalPos.x = isNearLeft ? -fabSize.width / 2 : winW - fabSize.width / 2;
                } else {
                    finalPos.y = isNearTop ? -fabSize.height / 2 : winH - fabSize.height / 2;
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
                if (panelLogic.panel.style.display !== 'block') {
                    snapDecision(true);
                }
            }
        };

        const onResize = debounce(() => {
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
                if (panelLogic.panel.style.display !== 'block') {
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
     * 设置面板的结构与样式
     */
    function createSettingsPanelUI() {
        GM_addStyle(`
            #ao3-trans-settings-panel {
                display: none;
                position: fixed;
                z-index: 2147483647;
                width: 300px;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                color: #000000DE;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.12);
                --ao3-trans-primary-color: #1976d2;
                --ao3-trans-border-color: rgba(0, 0, 0, 0.23);
                --ao3-trans-border-hover: rgba(0, 0, 0, 0.87);
                --ao3-trans-label-color: rgba(0, 0, 0, 0.6);
                --ao3-trans-danger-color: #ff0000;
            }
            #ao3-trans-settings-panel.dragging {
                opacity: 0.8;
                transition: opacity 0.2s ease-in-out;
			}
            #ao3-trans-settings-panel.mobile-fixed-center {
                top: 50%; left: 50%; transform: translate(-50%, -50%); max-height: 85vh;
            }
            .settings-panel-header {
                padding: 0px 4px 0px 16px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.12);
                cursor: move;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f5f5f5;
            }
            .settings-panel-header-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .settings-panel-header-title .home-icon-link {
                display: flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                border-bottom: none;
            }
            .settings-panel-header-title .home-icon-link:focus {
                outline: none;
            }
            .settings-panel-header-title .home-icon-link svg {
                width: 24px;
                height: 24px;
                fill: rgba(0, 0, 0, 0.54);
            }
            .settings-panel-header-title h2 {
                margin: 0; font-size: 16px; font-weight: bold;
                font-family: inherit;
            }
            .settings-panel-close-btn {
                cursor: pointer; width: 40px; height: 40px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 24px; color: rgba(0, 0, 0, 0.54);
            }
            .settings-panel-body { padding: 18px 16px 16px; display: flex; flex-direction: column; gap: 16px; max-height: 70vh; overflow-y: auto; }

            .settings-switch-group { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
            .settings-panel-body > .settings-switch-group:first-child {
                padding-left: 14px;
            }
            .settings-panel-body > .settings-switch-group:first-child .settings-label {
                font-size: 15px;
            }
            .settings-switch-group .settings-label { font-size: 13px; font-weight: 400; color: #000000DE; }
            .settings-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .settings-switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
            .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: #209CEE; }
            input:checked + .slider:before { transform: translateX(20px); }

            .settings-group { position: relative; }
            .settings-group.ao3-trans-control-disabled {
                pointer-events: none;
            }
            .settings-group.ao3-trans-control-disabled .settings-control[disabled] {
                color: #000000DE !important;
                -webkit-text-fill-color: #000000DE !important;
                opacity: 1 !important;
                background-color: #fff !important;
            }
            .settings-group .settings-control::placeholder {
                color: #a9a9a9 !important;
                -webkit-text-fill-color: #a9a9a9 !important;
                opacity: 1 !important;
            }
            .settings-group .settings-control {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 40px;
                padding: 0 12px;
                border-radius: 6px;
                border: 1px solid #ccc;
                background-color: #fff;
                font-size: 15px;
                font-family: inherit;
                box-sizing: border-box;
                line-height: 40px;
                color: #000000DE;
                box-shadow: none;
            }
            .settings-group .settings-control:hover { border-color: var(--ao3-trans-border-hover); }
            .settings-group .settings-control:focus { 
                border-color: var(--ao3-trans-primary-color); 
                border-width: 1px; 
                outline: none; 
            }
            .settings-group .settings-label {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                left: 12px;
                font-size: 14px;
                color: var(--ao3-trans-label-color);
                pointer-events: none;
                transition: all 0.2s ease;
                background-color: #ffffff;
                padding: 0 4px;
            }
            .settings-group .settings-control:focus + .settings-label,
            .settings-group .settings-control.has-value + .settings-label {
                top: 0;
                left: 10px;
                font-size: 12px;
                color: var(--ao3-trans-primary-color);
            }
            .settings-group .settings-control:not(:focus).has-value + .settings-label {
                color: var(--ao3-trans-label-color);
            }
            .settings-group.static-label .settings-label {
                top: 0; left: 10px; font-size: 12px; transform: translateY(-50%); color: var(--ao3-trans-label-color);
            }
            .settings-group.static-label .settings-control {
                line-height: normal;
                padding-top: 4px;
                padding-bottom: 4px;
                height: 40px;
            }
            .settings-group.settings-group-select .settings-control.settings-select {
                padding-right: 40px;
            }
            .settings-group.settings-group-select::after {
                content: '';
                position: absolute;
                right: 14px;
                top: 20px;
                transform: translateY(-50%) rotate(0deg);
                width: .65em;
                height: .65em;
                background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-13%200-5-1.9-9.4-5.4-13z%22%2F%3E%3C%2Fsvg%3E');
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
                pointer-events: none;
            }
            .settings-group.settings-group-select.dropdown-active::after {
                transform: translateY(-50%) rotate(180deg);
            }
			.settings-action-button-inline:focus,
				.online-glossary-delete-btn:focus {
					outline: none;
				}

            .input-wrapper { position: relative; }
            .input-wrapper .settings-input { padding-right: 52px !important; }
            .settings-action-button-inline {
                position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
                background: none; border: none; color: var(--ao3-trans-primary-color);
                font-size: 14px; font-weight: 500; cursor: pointer; padding: 4px;
                display: flex; align-items: center;
            }

            .editable-section { display: none; }
            .online-glossary-manager { display: flex; flex-direction: column; gap: 0px; }
            .online-glossary-details {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #666;
                padding: 4px 12px;
            }
            #online-glossary-details-container {
                margin-top: 8px;
            }
            #online-glossary-info {
                flex-grow: 1;
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-right: 8px;
            }
            .online-glossary-delete-btn {
                flex-shrink: 0;
                background: none;
                border: none;
                color: var(--ao3-trans-primary-color);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                padding: 2px 4px;
                text-align: right;
            }
            .online-glossary-delete-btn[data-confirming="true"] {
                color: var(--ao3-trans-danger-color);
            }

            .custom-dropdown-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                z-index: 2147483647;
            }
            .custom-dropdown-menu {
                position: fixed;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                border: 1px solid rgba(0, 0, 0, 0.08);
                z-index: 2147483647;
                overflow: hidden;
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
                transform-origin: top center;
                transition: opacity 0.15s ease-out, transform 0.15s ease-out;
                box-sizing: border-box;
            }
            .custom-dropdown-menu.visible {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            .custom-dropdown-menu ul {
                list-style: none;
                margin: 0;
                padding: 8px 0;
                max-height: 250px;
                overflow-y: auto;
            }
            .custom-dropdown-menu li {
                padding: 8px 16px;
                cursor: pointer;
                font-size: 15px;
                transition: background-color 0.2s ease;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .custom-dropdown-menu li:hover {
                background-color: #f5f5f5;
            }
            .custom-dropdown-menu li.selected {
                background-color: #e3f2fd;
            }
            .custom-dropdown-menu ul::-webkit-scrollbar {
                width: 5px;
            }
            .custom-dropdown-menu ul::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-dropdown-menu ul::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
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
                    <h2>AO3 Trans Script v${scriptVersion}</h2>
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

                <div class="settings-group settings-group-select">
                    <select id="setting-trans-engine" class="settings-control settings-select"></select>
                    <label for="setting-trans-engine" class="settings-label">翻译服务</label>
                </div>

                <div class="settings-group settings-group-select" id="setting-model-group" style="display: none;">
                    <select id="setting-trans-model" class="settings-control settings-select"></select>
                    <label for="setting-trans-model" class="settings-label">使用模型</label>
                </div>

                <div class="settings-group settings-group-select">
                    <select id="setting-display-mode" class="settings-control settings-select">
                        <option value="bilingual">双语对照</option>
                        <option value="translation_only">仅译文</option>
                    </select>
                    <label for="setting-display-mode" class="settings-label">显示模式</label>
                </div>

                <div class="settings-group static-label" id="api-key-group">
                    <div class="input-wrapper">
                        <input type="text" id="setting-input-apikey" class="settings-control settings-input" spellcheck="false">
                        <label for="setting-input-apikey" class="settings-label">设置 API Key</label>
                        <button id="setting-btn-apikey-save" class="settings-action-button-inline">保存</button>
                    </div>
                </div>

                <div class="settings-group static-label settings-group-select">
                    <select id="setting-glossary-actions" class="settings-control settings-select">
                        <option value="">请选择一个功能</option>
                        <option value="local">设置本地术语表</option>
                        <option value="forbidden">设置禁翻术语表</option>
                        <option value="import">导入在线术语表</option>
                        <option value="manage">管理在线术语表</option>
                        <option value="post_replace">译文后处理替换</option>
                    </select>
                    <label for="setting-glossary-actions" class="settings-label">管理 AI 翻译术语表</label>
                </div>

                <div id="editable-section-glossary-local" class="settings-group static-label editable-section">
                    <div class="input-wrapper">
                        <input type="text" id="setting-input-glossary-local" class="settings-control settings-input" placeholder="原文1：译文1，原文2：译文2" spellcheck="false">
                        <label for="setting-input-glossary-local" class="settings-label">本地术语表</label>
                        <button id="setting-btn-glossary-local-save" class="settings-action-button-inline">保存</button>
                    </div>
                </div>
                <div id="editable-section-glossary-forbidden" class="settings-group static-label editable-section">
                    <div class="input-wrapper">
                        <input type="text" id="setting-input-glossary-forbidden" class="settings-control settings-input" placeholder="原文1，原文2" spellcheck="false">
                        <label for="setting-input-glossary-forbidden" class="settings-label">禁翻术语表</label>
                        <button id="setting-btn-glossary-forbidden-save" class="settings-action-button-inline">保存</button>
                    </div>
                </div>
                <div id="editable-section-glossary-import" class="settings-group static-label editable-section">
                    <div class="input-wrapper">
                        <input type="text" id="setting-input-glossary-import-url" class="settings-control settings-input" placeholder="请输入 GitHub/jsDelivr 链接" spellcheck="false">
                        <label for="setting-input-glossary-import-url" class="settings-label">在线术语表</label>
                        <button id="setting-btn-glossary-import-save" class="settings-action-button-inline">导入</button>
                    </div>
                </div>
                <div id="editable-section-glossary-manage" class="settings-group static-label editable-section online-glossary-manager">
                    <div class="settings-group settings-group-select">
                        <select id="setting-select-glossary-manage" class="settings-control settings-select"></select>
                        <label for="setting-select-glossary-manage" class="settings-label">已导入的术语表</label>
                    </div>
                    <div id="online-glossary-details-container" style="display: none;">
                        <div class="online-glossary-details">
                            <span id="online-glossary-info"></span>
                            <button id="online-glossary-delete-btn" class="online-glossary-delete-btn">删除</button>
                        </div>
                    </div>
                </div>
                <div id="editable-section-post-replace" class="settings-group static-label editable-section">
                    <div class="input-wrapper">
                        <input type="text" id="setting-input-post-replace" class="settings-control settings-input" placeholder="译文1：替换1，译文2：替换2" spellcheck="false">
                        <label for="setting-input-post-replace" class="settings-label">译文后处理替换</label>
                        <button id="setting-btn-post-replace-save" class="settings-action-button-inline">保存</button>
                    </div>
                </div>
            </div>
        `;

        panel.querySelectorAll('.settings-select').forEach(sel => {
            sel.parentElement.classList.add('settings-group-select');
        });

        document.body.appendChild(panel);

        return {
            panel,
            closeBtn: panel.querySelector('.settings-panel-close-btn'),
            header: panel.querySelector('.settings-panel-header'),
            masterSwitch: panel.querySelector('#setting-master-switch'),
            engineSelect: panel.querySelector('#setting-trans-engine'),
            modelGroup: panel.querySelector('#setting-model-group'),
            modelSelect: panel.querySelector('#setting-trans-model'),
            displayModeSelect: panel.querySelector('#setting-display-mode'),
            apiKeyGroup: panel.querySelector('#api-key-group'),
            apiKeyInput: panel.querySelector('#setting-input-apikey'),
            apiKeySaveBtn: panel.querySelector('#setting-btn-apikey-save'),
            glossaryActionsSelect: panel.querySelector('#setting-glossary-actions'),
            editableSections: panel.querySelectorAll('.editable-section'),
            glossaryLocalSection: panel.querySelector('#editable-section-glossary-local'),
            glossaryLocalInput: panel.querySelector('#setting-input-glossary-local'),
            glossaryLocalSaveBtn: panel.querySelector('#setting-btn-glossary-local-save'),
            glossaryForbiddenSection: panel.querySelector('#editable-section-glossary-forbidden'),
            glossaryForbiddenInput: panel.querySelector('#setting-input-glossary-forbidden'),
            glossaryForbiddenSaveBtn: panel.querySelector('#setting-btn-glossary-forbidden-save'),
            glossaryImportSection: panel.querySelector('#editable-section-glossary-import'),
            glossaryImportUrlInput: panel.querySelector('#setting-input-glossary-import-url'),
            glossaryImportSaveBtn: panel.querySelector('#setting-btn-glossary-import-save'),
            glossaryManageSection: panel.querySelector('#editable-section-glossary-manage'),
            glossaryManageSelect: panel.querySelector('#setting-select-glossary-manage'),
            glossaryManageDetailsContainer: panel.querySelector('#online-glossary-details-container'),
            glossaryManageInfo: panel.querySelector('#online-glossary-info'),
            glossaryManageDeleteBtn: panel.querySelector('#online-glossary-delete-btn'),
            postReplaceSection: panel.querySelector('#editable-section-post-replace'),
            postReplaceInput: panel.querySelector('#setting-input-post-replace'),
            postReplaceSaveBtn: panel.querySelector('#setting-btn-post-replace-save'),
        };
    }

    /**
     * 设置面板的内部逻辑
     */
    function initializeSettingsPanelLogic(panelElements, rerenderMenuCallback, onPanelCloseCallback) {
        const {
            panel, closeBtn, header, masterSwitch, engineSelect, modelGroup, modelSelect, displayModeSelect,
            apiKeyGroup, apiKeyInput, apiKeySaveBtn,
            glossaryActionsSelect, editableSections,
            glossaryLocalSection, glossaryLocalInput, glossaryLocalSaveBtn,
            glossaryForbiddenSection, glossaryForbiddenInput, glossaryForbiddenSaveBtn,
            glossaryImportSection, glossaryImportUrlInput, glossaryImportSaveBtn,
            glossaryManageSection, glossaryManageSelect, glossaryManageDetailsContainer,
            glossaryManageInfo, glossaryManageDeleteBtn,
            postReplaceSection, postReplaceInput, postReplaceSaveBtn
        } = panelElements;

        const PANEL_POSITION_KEY = 'ao3_panel_position';
        const GLOSSARY_ACTION_KEY = 'ao3_glossary_last_action';
        let isDragging = false;
        let origin = { x: 0, y: 0 }, startPosition = { x: 0, y: 0 };

        const isMobile = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        const ensureOnScreen = (pos, size) => {
            const newPos = { ...pos };
            const winW = document.documentElement.clientWidth;
            const winH = window.innerHeight;
            const margin = 10;

            newPos.x = Math.max(margin, Math.min(newPos.x, winW - size.width - margin));
            newPos.y = Math.max(margin, Math.min(newPos.y, winH - size.height - margin));
            return newPos;
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

        const toggleEditableSection = (sectionToShow) => {
            const isAlreadyActive = sectionToShow && (sectionToShow.style.display === 'flex' || sectionToShow.style.display === 'block');
            editableSections.forEach(s => s.style.display = 'none');
            if (sectionToShow && !isAlreadyActive) {
                if (sectionToShow.id === 'editable-section-glossary-manage') {
                    sectionToShow.style.display = 'flex';
                } else {
                    sectionToShow.style.display = 'block';
                }
                const input = sectionToShow.querySelector('.settings-control');
                if (input) updateInputLabel(input);
            }
        };

        const populateEngineSelect = () => {
            engineSelect.innerHTML = '';
            Object.keys(engineMenuConfig).forEach(engineId => {
                const option = document.createElement('option');
                option.value = engineId;
                option.textContent = engineMenuConfig[engineId].displayName;
                engineSelect.appendChild(option);
            });
        };

        const updateModelSelect = (engineId) => {
            const config = engineMenuConfig[engineId];
            if (config && config.modelMapping) {
                modelSelect.innerHTML = '';
                Object.keys(config.modelMapping).forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = config.modelMapping[modelId];
                    modelSelect.appendChild(option);
                });
                modelGroup.style.display = 'block';
                modelSelect.value = GM_getValue(config.modelGmKey, Object.keys(config.modelMapping)[0]);
            } else {
                modelGroup.style.display = 'none';
            }
        };

        const updateApiKeySection = (engineId) => {
            const config = engineMenuConfig[engineId];

            if (config && config.requiresApiKey) {
                apiKeyGroup.style.display = 'block';
                apiKeyInput.disabled = false;
                apiKeySaveBtn.disabled = false;
                const label = apiKeyGroup.querySelector('.settings-label');
                if (label) label.textContent = `设置 ${config.displayName} API Key`;

                const isArray = engineId === 'google_ai';
                const keyName = `${engineId.split('_')[0]}_api_key`;
                const gmKey = isArray ? 'google_ai_keys_array' : keyName;

                const storedValue = GM_getValue(gmKey, isArray ? [] : '');
                apiKeyInput.value = isArray ? storedValue.join(', ') : storedValue;
            } else {
                apiKeyGroup.style.display = 'none';
            }
        };

        const saveApiKey = () => {
            const engineId = engineSelect.value;
            const isArray = engineId === 'google_ai';
            const keyName = `${engineId.split('_')[0]}_api_key`;
            const gmKey = isArray ? 'google_ai_keys_array' : keyName;
            const value = apiKeyInput.value.trim();
            if (isArray) {
                const keys = value.split(/[，,]/).map(k => k.trim()).filter(Boolean);
                GM_setValue(gmKey, keys);
                if (keys.length > 0) GM_setValue('google_ai_key_index', 0);
                notifyAndLog(`已保存 ${keys.length} 个 Google AI API Key！`);
            } else {
                GM_setValue(gmKey, value);
                notifyAndLog(`${engineMenuConfig[engineId].displayName} API Key 已${value ? '保存' : '清除'}！`);
            }
        };

        const resetDeleteButton = () => {
            glossaryManageDeleteBtn.textContent = '删除';
            glossaryManageDeleteBtn.removeAttribute('data-confirming');
        };

        const populateManageGlossary = () => {
            const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
            const urls = Object.keys(metadata);
            if (urls.length === 0) {
                glossaryManageSelect.innerHTML = '<option value="" disabled selected>暂无术语表</option>';
                glossaryManageSelect.disabled = true;
                glossaryManageDetailsContainer.style.display = 'none';
            } else {
                glossaryManageSelect.innerHTML = '';
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
                glossaryManageSelect.selectedIndex = 0;
                glossaryManageSelect.dispatchEvent(new Event('change'));
            }
            resetDeleteButton();
        };

        const syncPanelState = () => {
            const isEnabled = GM_getValue('enable_transDesc', false);
            masterSwitch.checked = isEnabled;

            const currentEngine = getValidEngineName();
            engineSelect.value = currentEngine;
            updateModelSelect(currentEngine);
            updateApiKeySection(currentEngine);
            displayModeSelect.value = GM_getValue('translation_display_mode', 'bilingual');

            panel.querySelectorAll('.settings-group').forEach(group => {
                group.classList.toggle('ao3-trans-control-disabled', !isEnabled);
            });
            panel.querySelectorAll('.settings-control, .settings-input, .settings-action-button-inline, .online-glossary-delete-btn').forEach(el => {
                el.disabled = !isEnabled;
            });
            
            updateAllLabels();
        };

        const togglePanel = () => {
            const isOpening = panel.style.display !== 'block';
            if (isOpening) {
                editableSections.forEach(s => s.style.display = 'none');
                syncPanelState();
                
                const lastAction = GM_getValue(GLOSSARY_ACTION_KEY, '');
                glossaryActionsSelect.value = lastAction;
                if (lastAction) {
                    glossaryActionsSelect.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    glossaryActionsSelect.value = "";
                }

                if (isMobile()) {
                    panel.classList.add('mobile-fixed-center');
                    panel.style.left = '';
                    panel.style.top = '';
                } else {
                    panel.classList.remove('mobile-fixed-center');
                    const panelWidth = 320;
                    panel.style.visibility = 'hidden';
                    panel.style.display = 'block';
                    const panelHeight = panel.offsetHeight;
                    panel.style.display = 'none';
                    panel.style.visibility = 'visible';

                    let savedPos = GM_getValue(PANEL_POSITION_KEY);
                    if (!savedPos) {
                        savedPos = {
                            x: (document.documentElement.clientWidth - panelWidth) / 2,
                            y: (window.innerHeight - panelHeight) / 2
                        };
                    }
                    const correctedPos = ensureOnScreen(savedPos, { width: panelWidth, height: panelHeight });
                    panel.style.left = `${correctedPos.x}px`;
                    panel.style.top = `${correctedPos.y}px`;
                }
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
                if (onPanelCloseCallback) onPanelCloseCallback();
            }
            if (rerenderMenuCallback) rerenderMenuCallback();
        };

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
            GM_setValue('enable_transDesc', isEnabled);
            FeatureSet.enable_transDesc = isEnabled;
            syncPanelState();
            if (typeof fabLogic !== 'undefined' && fabLogic.toggleFabVisibility) {
                fabLogic.toggleFabVisibility();
            }
            if (isEnabled) transDesc();
            else {
                document.querySelectorAll('.translate-me-ao3-wrapper, .translated-by-ao3-script, .translated-by-ao3-script-error').forEach(el => el.remove());
                document.querySelectorAll('[data-translation-handled="true"], [data-state="translated"]').forEach(el => {
                    delete el.dataset.translationHandled;
                    delete el.dataset.state;
                });
            }
        });

        engineSelect.addEventListener('change', () => {
            const newEngine = engineSelect.value;
            GM_setValue('transEngine', newEngine);
            updateModelSelect(newEngine);
            updateApiKeySection(newEngine);
            updateAllLabels();
        });

        modelSelect.addEventListener('change', () => {
            const config = engineMenuConfig[engineSelect.value];
            if (config && config.modelGmKey) {
                GM_setValue(config.modelGmKey, modelSelect.value);
            }
        });

        displayModeSelect.addEventListener('change', () => {
            const newMode = displayModeSelect.value;
            GM_setValue('translation_display_mode', newMode);
            applyDisplayModeChange(newMode);
        });

        apiKeySaveBtn.addEventListener('click', saveApiKey);

        glossaryActionsSelect.addEventListener('change', () => {
            const action = glossaryActionsSelect.value;
            GM_setValue(GLOSSARY_ACTION_KEY, action);
            if (!action) {
                toggleEditableSection(null);
                return;
            }
            switch (action) {
                case 'local':
                    glossaryLocalInput.value = GM_getValue(LOCAL_GLOSSARY_STRING_KEY, '');
                    toggleEditableSection(glossaryLocalSection);
                    break;
                case 'forbidden':
                    glossaryForbiddenInput.value = GM_getValue(LOCAL_FORBIDDEN_STRING_KEY, '');
                    toggleEditableSection(glossaryForbiddenSection);
                    break;
                case 'import':
                    glossaryImportUrlInput.value = '';
                    toggleEditableSection(glossaryImportSection);
                    break;
                case 'manage':
                    populateManageGlossary();
                    toggleEditableSection(glossaryManageSection);
                    break;
                case 'post_replace':
                    postReplaceInput.value = GM_getValue(POST_REPLACE_STRING_KEY, '');
                    toggleEditableSection(postReplaceSection);
                    break;
                default:
                    toggleEditableSection(null);
                    break;
            }
        });

        glossaryLocalSaveBtn.addEventListener('click', () => {
            GM_setValue(LOCAL_GLOSSARY_STRING_KEY, glossaryLocalInput.value);
            invalidateGlossaryCache();
            notifyAndLog('本地术语表已更新。');
        });

        glossaryForbiddenSaveBtn.addEventListener('click', () => {
            const rawInput = glossaryForbiddenInput.value;
            const newTerms = rawInput.split(/[，,]/).map(t => t.trim()).filter(Boolean);
            GM_setValue(LOCAL_FORBIDDEN_TERMS_KEY, newTerms);
            GM_setValue(LOCAL_FORBIDDEN_STRING_KEY, rawInput);
            invalidateGlossaryCache();
            notifyAndLog('禁翻术语表已更新。');
        });

        glossaryImportSaveBtn.addEventListener('click', () => {
            const url = glossaryImportUrlInput.value.trim();
            if (url) {
                importOnlineGlossary(url, () => {
                    populateManageGlossary();
                    updateInputLabel(glossaryManageSelect);
                    invalidateGlossaryCache();
                });
            }
        });

        glossaryManageSelect.addEventListener('change', () => {
            const url = glossaryManageSelect.value;
            if (url) {
                const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {})[url];
                glossaryManageInfo.textContent = `版本号：${metadata.version} ，维护者：${metadata.maintainer || '未知'}`;
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
                    notifyAndLog(`已删除术语表: ${decodeURIComponent(urlToRemove.split('/').pop())}`);
                    populateManageGlossary();
                    updateInputLabel(glossaryManageSelect);
                }
            } else {
                glossaryManageDeleteBtn.textContent = '确认删除';
                glossaryManageDeleteBtn.setAttribute('data-confirming', 'true');
            }
        });

        postReplaceSaveBtn.addEventListener('click', () => {
            const rawInput = postReplaceInput.value;
            const replacementMap = {};
            rawInput.split(/[，,]/).forEach(entry => {
                const parts = entry.split(/[:：=＝]/);
                if (parts.length >= 2) {
                    const key = parts.shift().trim();
                    const value = parts.join(':').trim();
                    if (key) {
                        replacementMap[key] = value;
                    }
                }
            });
            GM_setValue(POST_REPLACE_STRING_KEY, rawInput);
            GM_setValue(POST_REPLACE_MAP_KEY, replacementMap);
            notifyAndLog('译文后处理替换规则已更新。');
        });

        closeBtn.addEventListener('click', togglePanel);

        if (!isMobile()) {
            header.addEventListener('mousedown', (e) => {
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
            });
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                panel.classList.remove('dragging');
                const finalPos = { x: panel.offsetLeft, y: panel.offsetTop };
                GM_setValue(PANEL_POSITION_KEY, finalPos);
            });
        }

        window.addEventListener('resize', () => {
            if (panel.style.display === 'block' && !isMobile()) {
                const correctedPos = ensureOnScreen({ x: panel.offsetLeft, y: panel.offsetTop }, panel.getBoundingClientRect());
                panel.style.left = `${correctedPos.x}px`;
                panel.style.top = `${correctedPos.y}px`;
            }
        });

        const handleClickOutside = (event) => {
            if (panel.style.display !== 'block') {
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

        populateEngineSelect();
        syncPanelState();

        function createCustomDropdown(triggerElement) {
            if (document.querySelector('.custom-dropdown-backdrop')) {
                return;
            }
            if (triggerElement.disabled || triggerElement.options.length === 0 || (triggerElement.options.length === 1 && triggerElement.options[0].disabled)) {
                return;
            }

            triggerElement.parentElement.classList.add('dropdown-active');

            const backdrop = document.createElement('div');
            backdrop.className = 'custom-dropdown-backdrop';
            document.body.appendChild(backdrop);

            const menu = document.createElement('div');
            menu.className = 'custom-dropdown-menu';
            const list = document.createElement('ul');
            menu.appendChild(list);

            const options = triggerElement.querySelectorAll('option');
            options.forEach(option => {
                if (option.disabled && option.value === "") return;
                const listItem = document.createElement('li');
                listItem.textContent = option.textContent;
                listItem.dataset.value = option.value;
                listItem.title = option.title || option.textContent;
                if (option.selected) {
                    listItem.classList.add('selected');
                }
                list.appendChild(listItem);
            });

            document.body.appendChild(menu);

            const rect = triggerElement.getBoundingClientRect();
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
            }

            requestAnimationFrame(() => {
                menu.classList.add('visible');
            });

            const closeMenu = () => {
                triggerElement.parentElement.classList.remove('dropdown-active');
                menu.classList.remove('visible');
                backdrop.remove();
                setTimeout(() => menu.remove(), 200);
            };

            list.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    const value = e.target.dataset.value;
                    triggerElement.value = value;
                    triggerElement.dispatchEvent(new Event('change', { bubbles: true }));
                    closeMenu();
                }
            });

            backdrop.addEventListener('mousedown', closeMenu);
        }

        panel.addEventListener('mousedown', (e) => {
            const select = e.target.closest('.settings-select');
            if (select) {
                e.preventDefault();
                createCustomDropdown(select);
            }
        });

        return { togglePanel, panel };
    }

    /**
     * 设置面板的 UI 配置
     */
    const engineMenuConfig = {
        'google_translate': {
            displayName: '谷歌翻译',
            modelGmKey: null,
            requiresApiKey: false
        },
        'zhipu_ai': {
            displayName: 'Zhipu AI',
            modelGmKey: null,
            requiresApiKey: true
        },
        'deepseek_ai': {
            displayName: 'DeepSeek',
            modelGmKey: 'deepseek_model',
            modelMapping: {
                'deepseek-reasoner': 'DeepSeek R1',
                'deepseek-chat': 'DeepSeek V3'
            },
            requiresApiKey: true
        },
        'google_ai': {
            displayName: 'Google AI',
            modelGmKey: 'google_ai_model',
            modelMapping: {
                'gemini-2.5-pro': 'Gemini 2.5 Pro',
                'gemini-2.5-flash': 'Gemini 2.5 Flash',
                'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite'
            },
            requiresApiKey: true
        },
        'groq_ai': {
            displayName: 'Groq AI',
            modelGmKey: 'groq_model',
            modelMapping: {
                'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4',
                'moonshotai/kimi-k2-instruct': 'Kimi K2',
                'deepseek-r1-distill-llama-70b': 'DeepSeek 70B',
                'openai/gpt-oss-120b': 'GPT-OSS 120B'
            },
            requiresApiKey: true
        },
        'together_ai': {
            displayName: 'Together AI',
            modelGmKey: 'together_model',
            modelMapping: {
                'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': 'Llama 4',
                'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
                'Qwen/Qwen3-235B-A22B-Instruct-2507-tput': 'Qwen3 235B'
            },
            requiresApiKey: true
        },
        'cerebras_ai': {
            displayName: 'Cerebras',
            modelGmKey: 'cerebras_model',
            modelMapping: {
                'llama-4-maverick-17b-128e-instruct': 'Llama 4',
                'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B',
                'gpt-oss-120b': 'GPT-OSS 120B'
            },
            requiresApiKey: true
        },
        'modelscope_ai': {
            displayName: 'ModelScope',
            modelGmKey: 'modelscope_model',
            modelMapping: {
                'LLM-Research/Llama-4-Maverick-17B-128E-Instruct': 'Llama 4',
                'deepseek-ai/DeepSeek-V3.1': 'DeepSeek V3.1',
                'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
                'ZhipuAI/GLM-4.5': 'GLM 4.5',
                'moonshotai/Kimi-K2-Instruct': 'Kimi K2',
                'Qwen/Qwen3-235B-A22B-Instruct-2507': 'Qwen3 235B'
            },
            requiresApiKey: true
        }
    };

    /**
     * 动态应用翻译显示模式
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
    const GoogleTranslateHelper  = {
        lastRequestAuthTime: null,
        translateAuth: null,
        authPromise: null,

        unescapeHTML: function(unsafe) {
            return unsafe
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        },

        findAuth: async function() {
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
     * 获取当前有效翻译引擎的名称
     */
	function getValidEngineName() {
		const storedEngine = GM_getValue('transEngine');
		if (storedEngine && CONFIG.TRANS_ENGINES[storedEngine]) {
			return storedEngine;
		}
		return CONFIG.transEngine;
	}

    /**
     * 远程翻译请求函数
     */
	async function requestRemoteTranslation(paragraphs, { retryCount = 0, maxRetries = 5 } = {}) {
		const engineName = getValidEngineName();
		const engineConfig = CONFIG.TRANS_ENGINES[engineName];
		if (!engineConfig) {
			throw new Error(`服务 ${engineName} 未配置`);
		}

		try {
			let translatedText;
			if (engineName === 'google_translate') {
                translatedText = await _handleGoogleRequest(engineConfig, paragraphs);
            } else if (engineName === 'google_ai') {
				translatedText = await _handleGoogleAiRequest(engineConfig, paragraphs);
			} else {
				translatedText = await _handleStandardApiRequest(engineConfig, paragraphs, engineName);
			}
			
			if (typeof translatedText !== 'string' || !translatedText.trim()) {
				throw new Error('API 未返回有效文本');
			}
			
			return translatedText;

		} catch (error) {
            if (error.noRetry) {
                throw error;
            }

			const isRetriable = (error.type === 'server_overloaded' || error.type === 'rate_limit' || error.type === 'network' || error.type === 'timeout') ||
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
	}

    /**
     * 处理 Google AI 的 API 请求，包含 Key 轮询机制
     */
    async function _handleGoogleAiRequest(engineConfig, paragraphs) {
        const keys = GM_getValue('google_ai_keys_array', []);
        if (keys.length === 0) {
            const error = new Error('请先在菜单中设置至少一个 Google AI API Key');
            error.noRetry = true;
            throw error;
        }

        let keyIndex = GM_getValue('google_ai_key_index', 0) % keys.length;
        const modelId = getCurrentModelId();

        for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[keyIndex];
            console.log(`正在尝试使用 Google AI API Key #${keyIndex + 1}...`);
            
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
                            
                            console.debug("Google AI 响应详情：", { requestPayload: requestData, response: responseData, status: res.status });

                            const candidate = getNestedProperty(responseData, 'candidates[0]');
                            const translatedText = getNestedProperty(candidate, 'content.parts[0].text');
                            const finishReason = getNestedProperty(candidate, 'finishReason');
                            const errorMessage = getNestedProperty(responseData, 'error.message') || res.statusText || '未知错误';

                            if (res.status === 200 && translatedText) {
                                resolve(responseData);
                            } else {
                                let errorType = 'api_error';
                                let message = `Key #${keyIndex + 1} 遇到错误（代码：${res.status}）：${errorMessage}`;

                                if (res.status === 200) {
                                    if (['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT'].includes(finishReason)) {
                                        errorType = 'content_error';
                                        message = `因 ${finishReason} 原因，请求被 Google AI 安全策略阻止`;
                                    } else {
                                        errorType = 'empty_response';
                                        message = `Key #${keyIndex + 1} 失败：API 返回了空内容 (FinishReason: ${finishReason})`;
                                    }
                                } else if (res.status === 400 && errorMessage.toLowerCase().includes('api key not valid')) {
                                    errorType = 'key_invalid';
                                    message = `Key #${keyIndex + 1} 无效`;
                                }
                                
                                reject({ type: errorType, message: message, res: res });
                            }
                        },
                        onerror: () => reject({ type: 'network', message: `Key #${keyIndex + 1} 网络错误` }),
                        ontimeout: () => reject({ type: 'network', message: `Key #${keyIndex + 1} 请求超时` })
                    });
                });
                
                const translatedText = getNestedProperty(result, engineConfig.responseIdentifier);
                GM_setValue('google_ai_key_index', (keyIndex + 1) % keys.length);
                return translatedText;

            } catch (errorData) {
                const finalError = _handleGoogleAiError({ ...errorData, name: engineConfig.name });
                
                if (errorData.type === 'key_invalid' || getNestedProperty(errorData, 'res.status') === 403) {
                    keyIndex = (keyIndex + 1) % keys.length;
                    GM_setValue('google_ai_key_index', keyIndex);
                    if (i === keys.length - 1) {
                        const allKeysFailedError = new Error('所有 Google AI API Key 均已失效、权限不足或用尽额度。');
                        allKeysFailedError.noRetry = true;
                        throw allKeysFailedError;
                    }
                } else {
                    throw finalError;
                }
            }
        }
    }

    /**
     * 处理对谷歌翻译接口的特定请求流程
     */
    async function _handleGoogleRequest(engineConfig, paragraphs) {
        await GoogleTranslateHelper .findAuth();
        if (!GoogleTranslateHelper .translateAuth) {
            throw new Error('无法获取谷歌翻译的授权凭证');
        }

        const headers = {
            ...engineConfig.headers,
            'X-goog-api-key': GoogleTranslateHelper .translateAuth
        };
        const requestData = engineConfig.getRequestData(paragraphs);

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
            console.debug(`谷歌翻译 异常响应详情：`, { requestPayload: requestData, response: res.response, status: res.status });
            throw new Error(`谷歌翻译 API 错误 (代码: ${res.status}): ${res.statusText}`);
        }

        if (typeof engineConfig.responseIdentifier === 'function') {
            return engineConfig.responseIdentifier(res.response);
        }
        return getNestedProperty(res.response, engineConfig.responseIdentifier);
    }

    /**
     * 处理标准 Bearer Token 认证的 API 请求
     */
	async function _handleStandardApiRequest(engineConfig, paragraphs, engineName) {
		const { name, url_api, method, responseIdentifier, getRequestData } = engineConfig;

		let headers = { ...engineConfig.headers };
        const apiKey = GM_getValue(`${engineName.split('_')[0]}_api_key`);
        if (!apiKey) {
            const error = new Error(`请先在菜单中设置 ${name} API Key`);
            error.noRetry = true;
            throw error;
        }
        headers['Authorization'] = `Bearer ${apiKey}`;

		const requestData = getRequestData(paragraphs);
		
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
			let responseData = res.response;
			if (typeof responseData === 'string') try { responseData = JSON.parse(responseData); } catch (e) {}

            const errorHandler = API_ERROR_HANDLERS[engineName] || _handleDefaultApiError;
            const error = errorHandler(res, name, responseData);

            console.debug(`${name} 异常响应详情：`, { requestPayload: requestData, response: res.response, status: res.status });
			throw error;
		}
		
		return getNestedProperty(res.response, responseIdentifier);
	}

    // API 错误处理策略注册表
    const API_ERROR_HANDLERS = {};

    /**
     * 默认 API 错误处理策略
     */
    function _handleDefaultApiError(res, name, responseData) {
        const apiErrorMessage = getNestedProperty(responseData, 'error.message') || getNestedProperty(responseData, 'message') || res.statusText;
        let userFriendlyError;
        const error = new Error();

        switch (res.status) {
            case 401:
                userFriendlyError = `API Key 无效或缺失 (401)：请在菜单中检查您的 ${name} API Key 是否正确填写。`;
                error.noRetry = true;
                break;
            case 429:
                userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                error.type = 'rate_limit';
                break;
            case 500:
            case 503:
                userFriendlyError = `服务器错误 (${res.status})：${name} 的服务器暂时不可用，脚本将在稍后自动重试。`;
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
                    userFriendlyError = `API Key 无效或认证失败 (${businessErrorCode})：请在菜单中检查您的 ${name} API Key 是否正确填写。`;
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
                    userFriendlyError = `请求频率过高 (${businessErrorCode})：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                    error.type = 'rate_limit';
                    break;
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
            switch (res.status) {
                case 401:
                    userFriendlyError = `API Key 无效或认证失败 (401)：请在菜单中检查您的 ${name} API Key 是否正确填写。`;
                    error.noRetry = true;
                    break;
                case 429:
                    userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                    error.type = 'rate_limit';
                    break;
                case 500:
                    userFriendlyError = `服务器内部错误 (500)：${name} 的服务器遇到未知问题，脚本将在稍后自动重试。`;
                    error.type = 'server_overloaded';
                    break;
                default:
                    userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
                    error.noRetry = true;
                    break;
            }
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
                userFriendlyError = `API Key 无效或认证失败 (401)：请在菜单中检查您的 ${name} API Key 是否正确填写。`;
                error.noRetry = true;
                break;
            case 402:
                userFriendlyError = `账户余额不足 (402)：您的 ${name} 账户余额不足。请前往 DeepSeek 官网充值。`;
                error.noRetry = true;
                break;
            case 429:
                userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                error.type = 'rate_limit';
                break;
            case 500:
                userFriendlyError = `服务器内部故障 (500)：${name} 的服务器遇到未知问题，脚本将在稍后自动重试。`;
                error.type = 'server_overloaded';
                break;
            case 503:
                userFriendlyError = `服务器繁忙 (503)：${name} 的服务器当前负载过高，脚本将在稍后自动重试。`;
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
            userFriendlyError = `API Key 无效或认证失败：${message}。请在菜单中检查您的 API Key。`;
            error.noRetry = true;
        } else if (res) {
            switch (res.status) {
                case 400:
                    userFriendlyError = `请求格式错误 (400)：您的国家/地区可能不支持 Gemini API 的免费套餐，请在 Google AI Studio 中启用结算。`;
                    error.noRetry = true;
                    break;
                case 403:
                    userFriendlyError = `权限被拒绝 (403)：您的 API Key 没有所需权限。请检查您的 API Key 设置。`;
                    error.noRetry = true;
                    break;
                case 404:
                    userFriendlyError = `资源未找到 (404)：请求中引用的资源（如模型名称）不存在。`;
                    error.noRetry = true;
                    break;
                case 429:
                    userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                    error.type = 'rate_limit';
                    break;
                case 500:
                    userFriendlyError = `服务器内部错误 (500)：Google 服务器遇到意外错误，脚本将在稍后自动重试。`;
                    error.type = 'server_overloaded';
                    break;
                case 503:
                    userFriendlyError = `服务不可用 (503)：${name} 的服务器暂时过载或不可用，脚本将在稍后自动重试。`;
                    error.type = 'server_overloaded';
                    break;
                default:
                    userFriendlyError = `发生未知 API 错误 (代码: ${res.status})。`;
                    error.noRetry = true;
                    break;
            }
        } else {
            userFriendlyError = `发生未知错误：${message}`;
            error.noRetry = (type !== 'network' && type !== 'timeout');
        }

        error.message = userFriendlyError + `\n\n原始错误信息：\n${message}`;
        return error;
    }

    /**
     * Together AI、Groq AI 的错误处理策略
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
                userFriendlyError = `API Key 无效或认证失败 (401)：请在菜单中检查您的 ${name} API Key 是否正确填写。`;
                error.noRetry = true;
                break;
            case 402:
                userFriendlyError = `需要付费 (402)：您的 ${name} 账户已达到消费上限或需要充值。请检查您的账户账单设置。`;
                error.noRetry = true;
                break;
            case 403:
            case 413:
                userFriendlyError = `请求被拒绝 (${res.status})：这通常意味着输入内容过长，超过了模型的上下文长度限制。请尝试翻译更短的文本段落。`;
                error.noRetry = true;
                break;
            case 404:
                userFriendlyError = `模型或终结点不存在 (404)：您选择的模型名称可能已失效。请尝试在菜单中切换至其她模型。`;
                error.noRetry = true;
                break;
            case 429:
                userFriendlyError = `请求频率过高 (429)：已超出 API 的速率限制，脚本将在稍后自动重试。`;
                error.type = 'rate_limit';
                break;
            case 500:
            case 502:
            case 503:
                userFriendlyError = `服务器错误 (${res.status})：${name} 的服务器暂时不可用，脚本将在稍后自动重试。`;
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

    API_ERROR_HANDLERS['zhipu_ai'] = _handleZhipuAiError;
    API_ERROR_HANDLERS['deepseek_ai'] = _handleDeepseekAiError;
    API_ERROR_HANDLERS['groq_ai'] = _handleTogetherAiError;
    API_ERROR_HANDLERS['together_ai'] = _handleTogetherAiError;
    API_ERROR_HANDLERS['cerebras_ai'] = _handleTogetherAiError;

    /**
     * 段落翻译函数，集成了术语表、禁翻和后处理替换逻辑
     */
    async function translateParagraphs(paragraphs, { retryCount = 0, maxRetries = 3 } = {}) {
        if (!paragraphs || paragraphs.length === 0) {
            return new Map();
        }

        const indexedParagraphs = paragraphs.map((p, index) => ({
            original: p,
            index: index,
            isSeparator: p.tagName === 'HR' || /^\s*[-—*~<>#.=_\s]{3,}\s*$/.test(p.textContent),
            content: p.innerHTML
        }));

        const contentToTranslate = indexedParagraphs.filter(p => !p.isSeparator);
        if (contentToTranslate.length === 0) {
            const results = new Map();
            indexedParagraphs.forEach(p => {
                results.set(p.original, { status: 'success', content: p.content });
            });
            return results;
        }

        try {
            const maps = getGlossaryMaps();
            const allTermKeys = [
                ...maps.localForbidden.keys(), ...maps.localCaseSensitiveTerms.keys(),
                ...maps.onlineForbidden.keys(), ...maps.onlineCaseSensitiveTerms.keys(), ...maps.onlineCaseInsensitiveTerms.keys()
            ];
            const sortedKeys = [...new Set(allTermKeys)].sort((a, b) => b.length - a.length);

            const placeholders = new Map();
            const replacementToPlaceholderMap = new Map();
            let placeholderIndex = 0;
            const usePlaceholders = getValidEngineName() === 'google_translate';

            const preprocessedParagraphs = contentToTranslate.map(p => {
                const clone = p.original.cloneNode(true);
                if (sortedKeys.length > 0) {
                    const regex = new RegExp(`\\b(${sortedKeys.map(k => k.replace(/([.*+?^${}()|[\]\\])/g, '\\$&')).join('|')})\\b`, 'gi');
                    const treeWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
                    let currentNode;
                    while (currentNode = treeWalker.nextNode()) {
                        currentNode.nodeValue = currentNode.nodeValue.replace(regex, (match) => {
                            const lowerMatch = match.toLowerCase();
                            let rule, replacement;

                            if (maps.localForbidden.has(match)) {
                                replacement = match;
                            } else if (rule = maps.localCaseSensitiveTerms.get(match)) {
                                replacement = rule.translation;
                            } else if (maps.onlineForbidden.has(match)) {
                                replacement = match;
                            } else if ((rule = maps.onlineCaseSensitiveTerms.get(match)) || (rule = maps.onlineCaseInsensitiveTerms.get(lowerMatch))) {
                                replacement = rule.translation;
                            }

                            if (replacement !== undefined) {
                                let placeholder = replacementToPlaceholderMap.get(replacement);
                                if (!placeholder) {
                                    placeholder = `__P_${placeholderIndex}__`;
                                    replacementToPlaceholderMap.set(replacement, placeholder);
                                    placeholders.set(placeholder, replacement);
                                    placeholderIndex++;
                                }
                                return placeholder;
                            }
                            return match;
                        });
                    }
                }
                return clone;
            });

            const paragraphsForAI = preprocessedParagraphs.map(p => {
                if (usePlaceholders) return p;
                const clone = p.cloneNode(true);
                const treeWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
                let node;
                while (node = treeWalker.nextNode()) {
                    node.nodeValue = node.nodeValue.replace(/__P_\d+__/g, (ph) => placeholders.get(ph));
                }
                return clone;
            });

            const combinedTranslation = await requestRemoteTranslation(paragraphsForAI);

            let restoredTranslation = combinedTranslation;
            for (const [placeholder, value] of placeholders) {
                restoredTranslation = restoredTranslation.replace(new RegExp(placeholder, 'g'), value);
            }

            restoredTranslation = applyPostTranslationReplacements(restoredTranslation);

            let translatedParts = [];
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

            if (translatedParts.length !== contentToTranslate.length) {
                throw new Error('AI 响应格式不一致，分段数量不匹配');
            }

            contentToTranslate.forEach((p, i) => {
                p.translatedContent = AdvancedTranslationCleaner.clean(translatedParts[i] || p.content);
            });

            const finalResults = new Map();
            indexedParagraphs.forEach(p => {
                if (p.isSeparator) {
                    finalResults.set(p.original, { status: 'success', content: p.content });
                } else {
                    finalResults.set(p.original, { status: 'success', content: p.translatedContent });
                }
            });
            
            return finalResults;

        } catch (e) {
            if (e.noRetry || retryCount >= maxRetries) {
                console.error(`翻译失败: ${e.message}`);
                if (e.message.includes('分段数量不匹配') && paragraphs.length > 1) {
                    console.warn("批量翻译失败，自动切换到逐段翻译模式...");
                    const fallbackResults = new Map();
                    for (const p of paragraphs) {
                        const singleResultMap = await translateParagraphs([p], { maxRetries: 0 });
                        const singleResult = singleResultMap.get(p);
                        if (singleResult?.status === 'success') {
                            fallbackResults.set(p, singleResult);
                        } else {
                            const errorMessage = singleResult?.content || e.message || '未知错误';
                            console.error(`逐段翻译失败: ${errorMessage}`);
                            fallbackResults.set(p, { status: 'error', content: errorMessage });
                        }
                    }
                    return fallbackResults;
                } else {
                    const results = new Map();
                    const finalErrorMessage = `翻译失败：${e.message}`;
                    paragraphs.forEach(p => {
                        results.set(p, { status: 'error', content: finalErrorMessage });
                    });
                    return results;
                }
            } else {
                console.warn(`翻译失败 (尝试 ${retryCount + 1}/${maxRetries + 1}): ${e.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return await translateParagraphs(paragraphs, { retryCount: retryCount + 1, maxRetries });
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
        let allPotentialUnits = Array.from(containerElement.querySelectorAll(translatableSelectors));

        if (allPotentialUnits.length === 0 && containerElement.textContent.trim()) {
            allPotentialUnits = [containerElement];
        }

        const skippableHeaders = ['Summary', 'Notes', 'Work Text'];
        const candidateUnits = allPotentialUnits.filter(p => !skippableHeaders.includes(p.textContent.trim()));

        const units = [];
        for (const unit of candidateUnits) {
            if (!unit.querySelector(translatableSelectors)) {
                units.push(unit);
            }
        }

        if (units.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        units.forEach(unit => unit.dataset.translationState = 'translating');

        const translationResults = await translateParagraphs(units);

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

        if (onComplete) onComplete();
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
                const hasBrSeparators = (el.innerHTML.match(/(?:<br\s*\/?>\s*)+/i));
                if (hasBrSeparators) {
                    elementsToModify.push(el);
                }
                elementState.set(el, { preprocessed: true });
            });

            elementsToModify.forEach(el => {
                const separatorRegex = /(?:\s*<br\s*\/?>\s*)+/ig;
                const fragmentsHTML = el.innerHTML.split(separatorRegex);
                
                const newElements = fragmentsHTML
                    .map(fragment => fragment.trim())
                    .filter(fragment => fragment)
                    .map(fragment => {
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
            const allPotentialUnits = Array.from(container.querySelectorAll(translatableSelectors));
            
            const skippableHeaders = ['Summary', 'Notes', 'Work Text', 'Chapter Text'];
            const candidateUnits = allPotentialUnits.filter(p => !skippableHeaders.includes(p.textContent.trim()));

            const finalUnits = [];
            for (const unit of candidateUnits) {
                if (!unit.querySelector(translatableSelectors)) {
                    finalUnits.push(unit);
                }
            }
            
            return finalUnits;
        }
        
        const allUnits = preProcessAndGetUnits(containerElement);
        let isProcessing = false;
        const translationQueue = new Set();
        let scheduleTimeout = null;
        let flushTimeout = null;

        const isInViewport = (el) => {
            const rect = el.getBoundingClientRect();
            return ( rect.top < window.innerHeight && rect.bottom >= 0 );
        };

        const processQueue = async (observer, forceFlush = false) => {
            if (isProcessing || translationQueue.size === 0) return;
            
            clearTimeout(flushTimeout);

            const allQueuedUnits = [...translationQueue];
            if (allQueuedUnits.length === 0) return;

            const visibleInQueue = allQueuedUnits.filter(isInViewport);
            const offscreenInQueue = allQueuedUnits.filter(p => !visibleInQueue.includes(p));
            const prioritizedUnits = [...visibleInQueue, ...offscreenInQueue];

            const runType = isFirstTranslationChunk ? 'first' : 'subsequent';
            
            const engineName = getValidEngineName();
            const modelId = getCurrentModelId();

            let paragraphLimit = CONFIG[runType === 'first' ? 'PARAGRAPH_LIMIT' : 'SUBSEQUENT_PARAGRAPH_LIMIT'];
            let chunkSize = CONFIG[runType === 'first' ? 'CHUNK_SIZE' : 'SUBSEQUENT_CHUNK_SIZE'];

            const priorityKeys = [modelId, engineName].filter(Boolean);
            for (const key of priorityKeys) {
                const specificLimits = getNestedProperty(CONFIG.MODEL_SPECIFIC_LIMITS, `${key}.${runType}`);
                if (specificLimits) {
                    paragraphLimit = specificLimits.PARAGRAPH_LIMIT || paragraphLimit;
                    chunkSize = specificLimits.CHUNK_SIZE || chunkSize;
                    break; 
                }
            }

            let currentChars = 0;
            let chunkToSend = [];

            for (const unit of prioritizedUnits) {
                const isSeparator = unit.tagName === 'HR' || /^\s*[-—*~<>#.=_\s]{3,}\s*$/.test(unit.textContent);
                if (isSeparator) {
                    if (chunkToSend.length > 0) break;
                    chunkToSend.push(unit);
                    break;
                }
                chunkToSend.push(unit);
                currentChars += unit.textContent.length;
                if (chunkToSend.length >= paragraphLimit || currentChars >= chunkSize) {
                    break;
                }
            }

            const isChunkBigEnough = chunkToSend.length >= paragraphLimit || currentChars >= chunkSize;
            const isChunkSeparator = chunkToSend.length > 0 && (chunkToSend[0].tagName === 'HR' || /^\s*[-—*~<>#.=_\s]{3,}\s*$/.test(chunkToSend[0].textContent));

            if (!isChunkBigEnough && !isChunkSeparator && !forceFlush) {
                if (translationQueue.size > 0) {
                    flushTimeout = setTimeout(() => scheduleProcessing(observer, true), 2000);
                }
                return;
            }
            
            if (chunkToSend.length === 0) return;

            isProcessing = true;
            if (isFirstTranslationChunk) isFirstTranslationChunk = false;
            chunkToSend.forEach(p => translationQueue.delete(p));

            const paragraphsToTranslate = chunkToSend.filter(p => p.tagName !== 'HR' && p.textContent.trim().length > 0);
            const translationResults = paragraphsToTranslate.length > 0 ? await translateParagraphs(paragraphsToTranslate) : new Map();

            for (const p of chunkToSend) {
                if (p.tagName === 'HR' || p.textContent.trim().length === 0 || /^\s*[-—*~<>#.=_\s]{3,}\s*$/.test(p.textContent)) {
                    elementState.set(p, { ...elementState.get(p), status: 'translated' });
                    p.dataset.translationState = 'translated';
                    if (observer) observer.unobserve(p);
                    continue;
                }
                const result = translationResults.get(p);
                if (result) {
                    const transNode = document.createElement('div');
                    if (result.status === 'success') {
                        transNode.className = 'translated-by-ao3-script';
                        transNode.innerHTML = `<${p.tagName.toLowerCase()}>${result.content}</${p.tagName.toLowerCase()}>`;
                        const currentMode = GM_getValue('translation_display_mode', 'bilingual');
                        if (currentMode === 'translation_only') p.style.display = 'none';
                        elementState.set(p, { ...elementState.get(p), status: 'translated' });
                        p.dataset.translationState = 'translated';
                        if (observer) observer.unobserve(p);
                    } else {
                        transNode.className = 'translated-by-ao3-script-error';
                        transNode.innerHTML = `<${p.tagName.toLowerCase()}>翻译失败：${result.content.replace('翻译失败：', '')}</${p.tagName.toLowerCase()}>`;
                        elementState.delete(p);
                    }
                    transNode.style.cssText = 'margin-top: 0.25em; margin-bottom: 1em;';
                    p.after(transNode);
                } else {
                    elementState.delete(p);
                }
            }

            isProcessing = false;

            if (translationQueue.size > 0) {
                scheduleProcessing(observer, false);
            }
        };

        const scheduleProcessing = (observer, force = false) => {
            clearTimeout(scheduleTimeout);
            scheduleTimeout = setTimeout(() => processQueue(observer, force), 300);
        };
        
        let effectiveRootMargin = CONFIG.LAZY_LOAD_ROOT_MARGIN;
        const engineName = getValidEngineName();
        const modelId = getCurrentModelId();
        const priorityKeys = [modelId, engineName].filter(Boolean);
        for (const key of priorityKeys) {
            const specificMargin = getNestedProperty(CONFIG.MODEL_SPECIFIC_LIMITS, `${key}.LAZY_LOAD_ROOT_MARGIN`);
            if (specificMargin) {
                effectiveRootMargin = specificMargin;
                break;
            }
        }

        const observer = new IntersectionObserver((entries, obs) => {
            let addedToQueue = false;
            entries.forEach(entry => {
                const state = elementState.get(entry.target);
                if (entry.isIntersecting && (!state || !state.status)) {
                    elementState.set(entry.target, { ...state, status: 'queued' });
                    translationQueue.add(entry.target);
                    addedToQueue = true;
                }
            });

            if (addedToQueue) {
                scheduleProcessing(obs, false);
            }
        }, { rootMargin: effectiveRootMargin });

        allUnits.forEach(unit => {
            if (!elementState.get(unit)?.status) {
                observer.observe(unit);
            }
        });
    }

    /**
     * 各种术语表变量
     */
    const LOCAL_GLOSSARY_KEY = 'ao3_local_glossary';
    const LOCAL_GLOSSARY_STRING_KEY = 'ao3_local_glossary_string';
    const LOCAL_FORBIDDEN_TERMS_KEY = 'ao3_local_forbidden_terms';
    const LOCAL_FORBIDDEN_STRING_KEY = 'ao3_local_forbidden_string';
    const IMPORTED_GLOSSARY_KEY = 'ao3_imported_glossary';
    const GLOSSARY_METADATA_KEY = 'ao3_glossary_metadata';
    const POST_REPLACE_STRING_KEY = 'ao3_post_replace_string';
    const POST_REPLACE_MAP_KEY = 'ao3_post_replace_map';

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
            forbiddenTerms: []
        };
        const lines = text.split('\n');

        const sectionHeaders = {
            TERMS: ['terms', '词条'],
            GENERAL_TERMS: ['general terms', '通用词条'],
            FORBIDDEN_TERMS: ['forbidden terms', '禁翻词条']
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
            if (inMetadata && !isHeader) {
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
            
            const multiPartParts = line.split(/[=＝]/, 2);
            if (multiPartParts.length === 2) {
                const key = multiPartParts[0].trim();
                const value = multiPartParts[1].trim().replace(/[,，]$/, '');
                if (key && value) multiPartTarget[key] = value;
                return;
            }
            
            const singleParts = line.split(/[:：]/, 2);
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
                switch (section.type) {
                    case 'TERMS':
                        processLine(line, result.terms, result.multiPartTerms);
                        break;
                    case 'GENERAL_TERMS':
                        processLine(line, result.generalTerms, result.multiPartGeneralTerms);
                        break;
                    case 'FORBIDDEN_TERMS':
                        const term = line.trim().replace(/[,，]$/, '');
                        if (term && !term.startsWith('//')) result.forbiddenTerms.push(term);
                        break;
                }
            }
        }

        if (!result.metadata.version) {
            throw new Error('文件格式错误：必须在文件头部包含 "版本号" 或 "version" 字段。');
        }
        if (Object.keys(result.terms).length === 0 && Object.keys(result.generalTerms).length === 0 && Object.keys(result.multiPartTerms).length === 0 && Object.keys(result.multiPartGeneralTerms).length === 0 && result.forbiddenTerms.length === 0) {
            throw new Error('文件格式错误：必须包含 "词条"、"通用词条" 或 "禁翻词条" 部分，且至少有一个有效词条。');
        }
        
        return result;
    }

    /**
     * 处理并解析不规范的 JSON 字符串
     */
    function sanitizeAndParseJson(jsonString) {
        if (typeof jsonString !== 'string') {
            throw new TypeError('输入内容无效，必须为字符串。');
        }
        const trimmedString = jsonString.trim();
        if (trimmedString === '') {
            throw new Error('输入内容无效，不能为空字符串。');
        }
        const sanitizedString = trimmedString
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
            .replace(/,\s*([}\]])/g, '$1');
        try {
            return JSON.parse(sanitizedString);
        } catch (error) {
            console.error("JSON 净化后解析失败:", error);
            console.error("净化后的内容:", sanitizedString);
            throw new Error(`JSON 格式严重错误，自动净化未能修复此问题: ${error.message}`);
        }
    }

    /**
     * 从 GitHub 或 jsDelivr 导入在线术语表文件
     */
    function importOnlineGlossary(url, onCompleteCallback) {
        if (!url || !url.trim()) { return; }

        const glossaryUrlRegex = /^(https:\/\/(raw\.githubusercontent\.com\/[^\/]+\/[^\/]+\/(?:refs\/heads\/)?[^\/]+|cdn\.jsdelivr\.net\/gh\/[^\/]+\/[^\/]+@[^\/]+)\/.+)$/;
        if (!glossaryUrlRegex.test(url)) {
            alert("链接格式不正确。请输入一个有效的 GitHub Raw 或 jsDelivr 链接。");
            return;
        }

        const filename = url.split('/').pop();
        const lastDotIndex = filename.lastIndexOf('.');
        const baseName = (lastDotIndex > 0) ? filename.substring(0, lastDotIndex) : filename;
        const glossaryName = decodeURIComponent(baseName);
        notifyAndLog(`正在下载并导入 “${glossaryName}”...`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
                if (response.status !== 200) {
                    notifyAndLog(`下载 “${glossaryName}” 失败！\n服务器返回状态码: ${response.status}`, '导入错误', 'error');
                    return;
                }
                try {
                    let onlineData;
                    try {
                        onlineData = parseCustomGlossaryFormat(response.responseText);
                    } catch (customError) {
                        const jsonData = sanitizeAndParseJson(response.responseText);
                        if (!jsonData.version || typeof jsonData.terms !== 'object') {
                            throw new Error('JSON 格式不规范，缺少 "version" 或 "terms" 字段。');
                        }
                        onlineData = {
                            metadata: {
                                maintainer: jsonData.maintainer || '未知',
                                version: jsonData.version,
                                last_updated: jsonData.last_updated || new Date().toISOString()
                            },
                            terms: jsonData.terms, generalTerms: {}, multiPartTerms: {},
                            multiPartGeneralTerms: {}, forbiddenTerms: []
                        };
                    }

                    const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
                    allImportedGlossaries[url] = {
                        terms: onlineData.terms, generalTerms: onlineData.generalTerms,
                        multiPartTerms: onlineData.multiPartTerms, multiPartGeneralTerms: onlineData.multiPartGeneralTerms,
                        forbiddenTerms: onlineData.forbiddenTerms
                    };
                    GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);

                    const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
                    metadata[url] = { ...onlineData.metadata, last_imported: new Date().toISOString() };
                    GM_setValue(GLOSSARY_METADATA_KEY, metadata);

                    const importedCount = Object.keys(onlineData.terms).length + Object.keys(onlineData.generalTerms).length + Object.keys(onlineData.multiPartTerms).length + Object.keys(onlineData.multiPartGeneralTerms).length;
                    notifyAndLog(`已成功导入 “${glossaryName}” 术语表（v${onlineData.metadata.version}），共 ${importedCount} 个词条。`, '导入成功');

                    if (typeof onCompleteCallback === 'function') {
                        onCompleteCallback();
                    }

                } catch (e) {
                    notifyAndLog(`导入 “${glossaryName}” 失败：${e.message}`, '处理错误', 'error');
                }
            },
            onerror: function(error) {
                notifyAndLog(`下载 “${glossaryName}” 失败！请检查网络连接或链接。`, '网络错误', 'error');
            }
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
	 * 检查并更新所有已导入的在线术语表
	 */
    async function checkForGlossaryUpdates() {
        const metadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
        const urls = Object.keys(metadata);
        const LOG_PREFIX = '[术语表更新]';

        if (urls.length === 0) {
            return;
        }
        
        console.log(`${LOG_PREFIX} 开始检查 ${urls.length} 个在线术语表...`);

        let updatedCount = 0;
        let failedCount = 0;

        for (const url of urls) {
            const glossaryName = decodeURIComponent(url.split('/').pop().replace(/\.[^/.]+$/, ''));
            console.log(`${LOG_PREFIX} 正在处理: “${glossaryName}”`);

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

                if (!localVersion || compareVersions(onlineVersion, localVersion) > 0) {
                    const versionInfo = localVersion ? `v${localVersion} -> v${onlineVersion}` : `至 v${onlineVersion}`;
                    console.log(`${LOG_PREFIX} 检测到“${glossaryName}”新版本，已成功更新：${versionInfo}`);

                    const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
                    allImportedGlossaries[url] = {
                        terms: onlineData.terms,
                        generalTerms: onlineData.generalTerms,
                        multiPartTerms: onlineData.multiPartTerms,
                        multiPartGeneralTerms: onlineData.multiPartGeneralTerms,
                        forbiddenTerms: onlineData.forbiddenTerms
                    };
                    currentMetadata[url] = { ...onlineData.metadata, last_updated: new Date().toISOString() };
                    
                    GM_setValue(IMPORTED_GLOSSARY_KEY, allImportedGlossaries);
                    GM_setValue(GLOSSARY_METADATA_KEY, currentMetadata);
                    
                    invalidateGlossaryCache();
                    updatedCount++;

                    GM_notification(`检测到术语表“${glossaryName}”新版本，已自动更新至 v${onlineVersion} 。`, 'AO3 汉化插件');

                } else {
                    console.log(`${LOG_PREFIX} “${glossaryName}”已是最新版本 (v${localVersion})`);
                }
            } catch (e) {
                failedCount++;
                console.error(`${LOG_PREFIX} 检查“${glossaryName}”失败：${e.message}`);
            }
        }

        const summaryMessage = `后台检查完成！总计 ${urls.length} 个，更新 ${updatedCount} 个，失败 ${failedCount} 个。`;
        console.log(`${LOG_PREFIX} ${summaryMessage}`);
    }

    /**
     * 获取数组元素的所有排列组合
     */
    function getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const permsOfRemaining = getPermutations(remaining);
            for (const perm of permsOfRemaining) {
                result.push([current, ...perm]);
            }
        }
        return result;
    }

    /**
     * 使术语表缓存失效，强制下次调用时重新构建
     */
    function invalidateGlossaryCache() {
        glossaryCache = null;
        console.log('[缓存管理] 术语表缓存已失效。');
    }

    /**
     * 获取、构建并缓存已处理的术语表映射
     */
    function getGlossaryMaps() {
        if (glossaryCache) {
            return glossaryCache;
        }
        console.log('[缓存管理] 缓存未命中，正在构建新的术语表映射...');
        glossaryCache = buildPrioritizedGlossaryMaps();
        console.log('[缓存管理] 新的术语表映射已构建并缓存。');
        return glossaryCache;
    }

    /**
     * 构建术语替换规则映射表
     */
    function buildPrioritizedGlossaryMaps() {
        const allImportedGlossaries = GM_getValue(IMPORTED_GLOSSARY_KEY, {});
        const glossaryMetadata = GM_getValue(GLOSSARY_METADATA_KEY, {});
        const localGlossaryString = GM_getValue(LOCAL_GLOSSARY_STRING_KEY, '');
        const localForbiddenTerms = new Set(GM_getValue(LOCAL_FORBIDDEN_TERMS_KEY, []));

        const maps = {
            localForbidden: new Map(),
            localCaseSensitiveTerms: new Map(),
            onlineForbidden: new Map(),
            onlineCaseSensitiveTerms: new Map(),
            onlineCaseInsensitiveTerms: new Map()
        };

        const processTerm = (term, translation, targetMap, isGeneral, isMultiPart = false) => {
            const forms = generateWordForms(term);
            forms.forEach(form => {
                const key = isGeneral ? form.toLowerCase() : form;
                let finalTranslation;

                if (form.endsWith("'s") || form.endsWith("'")) {
                    finalTranslation = translation + '的';
                } else {
                    finalTranslation = translation;
                }

                const newRule = {
                    translation: finalTranslation,
                    priority: (isMultiPart ? 1 : 0)
                };
                
                targetMap.set(key, newRule);
            });
        };

        const processMultiPartTerm = (term, translation, targetMap, isGeneral) => {
            const termParts = term.split(/[-\s·　]+/).filter(p => p);
            const translationParts = translation.split(/[-\s·•．　]+/).filter(p => p);
            if (termParts.length === 0 || translationParts.length === 0) return;

            let joiner = ['•', '·', '．', '　', ' '].find(j => translation.includes(j)) || ' ';
            const fullTranslation = translationParts.join(joiner);

            const addPermutation = (parts) => {
                const original = parts.join(' ');
                const key = isGeneral ? original.toLowerCase() : original;
                const newRule = { translation: fullTranslation, priority: 2 };
                targetMap.set(key, newRule);
            };

            addPermutation(termParts);
            if (termParts.length > 1) getPermutations(termParts).forEach(addPermutation);
            if (termParts.length === translationParts.length) {
                termParts.forEach((part, i) => processTerm(part, translationParts[i], targetMap, isGeneral, true));
            }
        };

        const processedLocalKeys = new Set();

        localForbiddenTerms.forEach(term => {
            generateWordForms(term).forEach(form => {
                if (form.endsWith("'s") || form.endsWith("'")) {
                    const base = form.slice(0, -1);
                    maps.localCaseSensitiveTerms.set(form, { translation: base + '的', priority: 10 });
                } else {
                    maps.localForbidden.set(form, true);
                }
                processedLocalKeys.add(form.toLowerCase());
            });
        });

        if (localGlossaryString.trim()) {
            localGlossaryString.split(/[，,]/).forEach(entry => {
                const parts = entry.split(/[:：=＝]/);
                if (parts.length < 2) return;
                const key = parts.shift().trim();
                const value = parts.join(':').trim();
                if (!key) return;

                if (/[=\s·　-]/.test(entry)) {
                    processMultiPartTerm(key, value, maps.localCaseSensitiveTerms, false);
                } else {
                    processTerm(key, value, maps.localCaseSensitiveTerms, false);
                }
                generateWordForms(key).forEach(form => processedLocalKeys.add(form.toLowerCase()));
            });
        }

        const sortedOnlineGlossaryUrls = Object.keys(allImportedGlossaries)
            .sort((a, b) => {
                const timeA = new Date(glossaryMetadata[a]?.last_imported || 0).getTime();
                const timeB = new Date(glossaryMetadata[b]?.last_imported || 0).getTime();
                return timeA - timeB;
            });

        sortedOnlineGlossaryUrls.forEach(url => {
            const g = allImportedGlossaries[url];
            if (!g) return;

            (g.forbiddenTerms || []).forEach(term => {
                generateWordForms(term).forEach(form => {
                    if (processedLocalKeys.has(form.toLowerCase())) return;
                    if (form.endsWith("'s") || form.endsWith("'")) {
                        const base = form.slice(0, -1);
                        maps.onlineCaseSensitiveTerms.set(form, { translation: base + '的', priority: 9 });
                    } else {
                        maps.onlineForbidden.set(form, true);
                    }
                });
            });

            const processOnlineGlossarySection = (terms, isGeneral, isMulti) => {
                for (const term in terms) {
                    if (processedLocalKeys.has(term.toLowerCase())) continue;
                    const translation = terms[term];
                    const targetMap = isGeneral ? maps.onlineCaseInsensitiveTerms : maps.onlineCaseSensitiveTerms;
                    if (isMulti) {
                        processMultiPartTerm(term, translation, targetMap, isGeneral);
                    } else {
                        processTerm(term, translation, targetMap, isGeneral);
                    }
                }
            };

            processOnlineGlossarySection(g.terms || {}, false, false);
            processOnlineGlossarySection(g.generalTerms || {}, true, false);
            processOnlineGlossarySection(g.multiPartTerms || {}, false, true);
            processOnlineGlossarySection(g.multiPartGeneralTerms || {}, true, true);
        });

        return maps;
    }

    /**
     * 为单个英文单词生成其所有格、复数等常见变体
     */
    function generateWordForms(baseTerm) {
        const forms = new Set();
        if (!baseTerm || typeof baseTerm !== 'string') return forms;

        const lowerBase = baseTerm.toLowerCase();
        forms.add(baseTerm);

        let plural;
        if (lowerBase.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lowerBase.slice(-2, -1))) {
            plural = baseTerm.slice(0, -1) + 'ies';
        } else if (/[sxz]$/i.test(lowerBase) || /(ch|sh)$/i.test(lowerBase)) {
            plural = baseTerm + 'es';
        } else {
            plural = baseTerm + 's';
        }
        forms.add(plural);

        forms.add(baseTerm + "'s");
        if (plural.endsWith('s')) {
            forms.add(plural + "'");
        } else {
            forms.add(plural + "'s");
        }

        const capitalizedBase = baseTerm.charAt(0).toUpperCase() + baseTerm.slice(1);
        if (capitalizedBase !== baseTerm) {
            const capitalizedPlural = plural.charAt(0).toUpperCase() + plural.slice(1);
            forms.add(capitalizedBase);
            forms.add(capitalizedPlural);
            forms.add(capitalizedBase + "'s");
            if (capitalizedPlural.endsWith('s')) {
                forms.add(capitalizedPlural + "'");
            } else {
                forms.add(capitalizedPlural + "'s");
            }
        }

        return forms;
    }

    /**
     * 译文后处理替换
     */
    function applyPostTranslationReplacements(text) {
        const replacementMap = GM_getValue(POST_REPLACE_MAP_KEY, {});
        const keys = Object.keys(replacementMap);

        if (keys.length === 0) {
            return text;
        }

        const regex = new RegExp(keys.map(key => key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'g');
        
        return text.replace(regex, (matched) => replacementMap[matched] || matched);
    }

    /**
     * 显示通知时打印到控制台
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

    /**
     * sleepms 函数：延时。
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * 辅助函数：获取当前选择的 AI 服务的具体模型ID
     */
    function getCurrentModelId() {
        const engine = getValidEngineName();
        switch (engine) {
            case 'deepseek_ai':
                return GM_getValue('deepseek_model', 'deepseek-chat');
            case 'google_ai':
                return GM_getValue('google_ai_model', 'gemini-2.5-pro');
            case 'groq_ai':
                return GM_getValue('groq_model', 'meta-llama/llama-4-maverick-17b-128e-instruct');
            case 'together_ai':
                return GM_getValue('together_model', 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8');
            case 'cerebras_ai':
                return GM_getValue('cerebras_model', 'llama-4-maverick-17b-128e-instruct');
            default:
                return '';
        }
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
			this.aiGenericExplanationRegex = /\s*\uff08[\u4e00-\u9fa5]{1,10}\uff1a[^\uff08\uff09]*?\uff09\s*/g;
            this.fillerWordsRegex = /(?<![a-zA-Z])(emm|hmm|ah|uh|er|um|uhm)(?![a-zA-Z])/gi;
            this.cjkCharsAndPunctuation = '\\u4e00-\\u9fa5\\u3000-\\u303f\\uff00-\\uffef';
		}
		clean(text) {
			if (!text || typeof text !== 'string') {
				return '';
			}
			let cleanedText = text.split('\n').filter(line => !this.junkLineRegex.test(line)).join('\n');
			cleanedText = cleanedText.replace(this.lineNumbersRegex, '');
            cleanedText = cleanedText.replace(this.aiGenericExplanationRegex, '');
            cleanedText = cleanedText.replace(this.fillerWordsRegex, ' ');
            cleanedText = cleanedText.replace(/的\s*的/g, '的');

			cleanedText = cleanedText.replace(/(<(em|strong|span)[^>]*>)([\s\S]*?)(<\/\2>)/g, (_match, openTag, _tagName, content, closeTag) => {
				return openTag + content.trim() + closeTag;
			});

            let previousText;
            do {
                previousText = cleanedText;
                cleanedText = cleanedText.replace(/(<\/[a-zA-Z0-9]+>)\s+(<[a-zA-Z0-9]+[^>]*>)/g, '$1$2');
            } while (previousText !== cleanedText);

			cleanedText = cleanedText.replace(/\s+/g, ' ');

			cleanedText = cleanedText.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
			cleanedText = cleanedText.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');

            do {
                previousText = cleanedText;
                cleanedText = cleanedText.replace(new RegExp(`([${this.cjkCharsAndPunctuation}])\\s([${this.cjkCharsAndPunctuation}])`, 'g'), '$1$2');
            } while (previousText !== cleanedText);

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
     * 脚本主入口，初始化所有功能
     */
    function main() {
		(function() {
			const veryOldGlossaryKey = 'ao3_translation_glossary';
			const oldGlossaryObject = GM_getValue(LOCAL_GLOSSARY_KEY, null);
			const veryOldGlossaryObject = GM_getValue(veryOldGlossaryKey, null);

			if (oldGlossaryObject && typeof oldGlossaryObject === 'object') {
				console.log('AO3 汉化插件：检测到本地术语表数据，正在迁移至新版本...');
				const newGlossaryString = Object.entries(oldGlossaryObject).map(([k, v]) => `${k}:${v}`).join(', ');
				GM_setValue(LOCAL_GLOSSARY_STRING_KEY, newGlossaryString);
				GM_deleteValue(LOCAL_GLOSSARY_KEY);
				console.log('AO3 汉化插件：本地术语表迁移成功！');
			} else if (veryOldGlossaryObject && typeof veryOldGlossaryObject === 'object') {
				console.log('AO3 汉化插件：检测到本地术语表数据，正在迁移至新版本...');
				const newGlossaryString = Object.entries(veryOldGlossaryObject).map(([k, v]) => `${k}:${v}`).join(', ');
				GM_setValue(LOCAL_GLOSSARY_STRING_KEY, newGlossaryString);
				GM_deleteValue(veryOldGlossaryKey);
				console.log('AO3 汉化插件：本地术语表迁移成功！');
			}
		})();
		(function() {
			const oldChatglmKey = GM_getValue('chatglm_api_key', null);
			if (oldChatglmKey) {
				console.log('AO3 汉化插件：检测到 ChatGLM API Key 数据，正在迁移至新版本...');
				GM_setValue('zhipu_api_key', oldChatglmKey);
				GM_deleteValue('chatglm_api_key');
				console.log('AO3 汉化插件：API Key 迁移成功！');
				GM_notification('您的 ChatGLM API Key 已成功迁移为 Zhipu AI API Key！', 'AO3 汉化插件');
			}
			else {
				const oldZhipuAiKey = GM_getValue('zhipu_ai_api_key', null);
				if (oldZhipuAiKey) {
					console.log('AO3 汉化插件：检测到 Zhipu AI API Key 数据，正在迁移至新版本...');
					GM_setValue('zhipu_api_key', oldZhipuAiKey);
					GM_deleteValue('zhipu_ai_api_key');
					console.log('AO3 汉化插件：API Key 迁移成功！');
					GM_notification('您的 Zhipu AI API Key 已成功更新至最新标准！', 'AO3 汉化插件');
				}
			}
		})();
        (function() {
            const oldForbiddenTermsKey = 'ao3_local_forbidden_terms';
            const newForbiddenStringKey = 'ao3_local_forbidden_string';

            const oldDataArray = GM_getValue(oldForbiddenTermsKey, null);
            const newDataExists = GM_getValue(newForbiddenStringKey, null) !== null;

            if (oldDataArray && Array.isArray(oldDataArray) && !newDataExists) {
                console.log('AO3 汉化插件：检测到禁翻术语表数据，正在迁移至新版本...');
                const newStringData = oldDataArray.join(', ');
                GM_setValue(newForbiddenStringKey, newStringData);
                console.log('AO3 汉化插件：禁翻术语表迁移成功！');
            }
        })();
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
     * watchUpdate 函数：监视页面变化，根据变化的节点进行翻译。
     */
    function watchUpdate(fabLogic) {
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
				fabLogic.toggleFabVisibility();
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
        const baseRegexp = I18N[CONFIG.LANG]?.public?.regexp || [];
        const baseSelector = I18N[CONFIG.LANG]?.public?.selector || [];
        const baseInnerHTMLRegexp = I18N[CONFIG.LANG]?.public?.innerHTML_regexp || [];
        const globalFlexible = (pageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.flexible || {});

        const usersCommonStatic = (pageType.startsWith('users_') || pageType === 'profile' || pageType === 'dashboard')
            ? I18N[CONFIG.LANG]?.users_common?.static || {}
            : {};

        const pageStatic = I18N[CONFIG.LANG]?.[pageType]?.static || {};
        const pageRegexp = I18N[CONFIG.LANG]?.[pageType]?.regexp || [];
        const pageSelector = I18N[CONFIG.LANG]?.[pageType]?.selector || [];
        const pageInnerHTMLRegexp = I18N[CONFIG.LANG]?.[pageType]?.innerHTML_regexp || [];
        let pageFlexible = (pageType === 'admin_posts_show') ? {} : (I18N[CONFIG.LANG]?.[pageType]?.flexible || {});

        const parentPageMap = {
            'works_edit': 'works_new',
            'works_edit_tags': 'works_new',
            'chapters_new': 'works_new',
            'chapters_edit': 'chapters_new'
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
        const mergedInnerHTMLRegexp = [...pageInnerHTMLRegexp, ...extraInnerHTMLRegexp, ...baseInnerHTMLRegexp];
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
        const { pathname, search } = window.location;
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
                        if (p3 === 'chapters' && p4 === 'new') {
                            return 'chapters_new';
                        }
                        if (p3 === 'chapters' && p4 && /^\d+$/.test(p4) && p5 === 'edit') {
                            return 'chapters_edit';
                        }
                        if (p3 === 'edit_tags') {
                        return 'works_edit_tags';
                        }
                        const heading = document.querySelector('h2.heading');
                            if (heading && heading.textContent.trim() === 'Edit Work') {
                                return 'works_edit';
                            }
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