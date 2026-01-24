// js/data.js

// 資料設定：難字表 & 人物資料庫
let rareWordsMap = {};
let synonymsMap = {};
let charactersDB = [];

// 羅馬數字轉換表
const romanNumerals = [
    "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"
];

// 論語數據結構 (精簡版，包含完整20篇的核心內容結構)
// LUNYU_DATA is defined in lunyu_data.js which must be loaded before this script
const lunyuData = typeof LUNYU_DATA !== 'undefined' ? LUNYU_DATA : [];

// 扁平化資料結構以利搜尋
let flatIndex = [];
let globalCounter = 0;

async function loadData() {
    try {
        const [rWords, synonyms, chars] = await Promise.all([
            fetch('data/rareWords.json').then(r => r.json()),
            fetch('data/synonyms.json').then(r => r.json()),
            fetch('data/characters.json').then(r => r.json())
        ]);
        rareWordsMap = rWords;
        synonymsMap = synonyms;
        charactersDB = chars;
        // initApp() is in app.js, make sure it's available or we handle initialization differently.
        if (typeof initApp === 'function') {
            initApp();
        } else {
            console.error("initApp function not found. Ensure app.js is loaded.");
        }
    } catch (e) {
        console.error("Failed to load data from data/ directory:", e);
        // More detailed logging to identify the culprit
        console.error("Error details:", {
            message: e.message,
            stack: e.stack
        });
        const contentList = document.getElementById('contentList');
        if (contentList) {
            contentList.innerHTML = `<div class="text-center text-red-500 py-10">資料載入失敗：${e.message}<br>請檢查網路連線或 data/ 目錄下的 JSON 檔案。</div>`;
        }
    }
}

function processTextWithRuby(text) {
    if (!text) return "";
    let processed = text;

    // 1. 處理刪除線 (~~文字~~)
    processed = processed.replace(/~~([\s\S]*?)~~/g, '<s>$1</s>');

    // 2. 將文本分割為 HTML 標籤和純文本段
    // 這能防止在已經替換好的 HTML 屬性或標籤內容中進行二次替換
    const tokens = processed.split(/(<[^>]+>)/g);

    // 預先準備所有要替換的模式，按長度降序排列 (確保「盍徹乎」優先於「盍」)
    const allPatterns = [
        ...Object.keys(synonymsMap),
        ...Object.keys(rareWordsMap)
    ].sort((a, b) => b.length - a.length);

    if (allPatterns.length === 0) return processed;

    // 構建正則表達式，對特殊字符進行轉義
    const escapedPatterns = allPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\?]/g, '\\$&'));
    const regex = new RegExp(escapedPatterns.join('|'), 'g');

    const result = tokens.map(token => {
        if (token.startsWith('<') && token.endsWith('>')) {
            return token; // 標籤不處理
        }

        // 僅處理純文本段
        // 使用 replace 的回調函數確保每個部分只被替換一次
        return token.replace(regex, (match) => {
            // 優先檢查詞組
            if (synonymsMap[match]) {
                const parts = synonymsMap[match];
                let rubyHtml = "<ruby>";
                for(let i=0; i<parts.length; i+=2) {
                    const char = parts[i];
                    const rb = parts[i+1];
                    rubyHtml += `${char}<rt>${rb}</rt>`;
                }
                rubyHtml += "</ruby>";
                return rubyHtml;
            }

            // 否則檢查難字
            if (rareWordsMap[match]) {
                const info = rareWordsMap[match];
                const zhuyin = info.zhuyin || "";

                // 徹底轉義屬性值，防止單引號或反斜槓破壞 JS 字串
                const escapeJS = (str) => str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
                const safeMatch = escapeJS(match);
                const safeZhuyin = escapeJS(zhuyin);
                const safeDefinition = info.definition ? escapeJS(info.definition) : "";

                if (zhuyin) {
                    return `<ruby class="rare-char" onclick="showTooltip(event, this, '${safeMatch}', '${safeZhuyin}')">${match}<rt>${zhuyin}</rt></ruby>`;
                } else {
                    return `<span class="rare-char" onclick="showTooltip(event, this, '${safeMatch}', '')">${match}</span>`;
                }
            }

            return match; //  fallback
        });
    });

    return result.join('');
}

function identifyCharacters(text) {
    const tags = new Map();
    charactersDB.forEach(char => {
        const searchKeys = char.searchKeys || [];
        for (const alias of searchKeys) {
            if (text.includes(alias)) {
                if (!tags.has(char.goBy)) {
                    tags.set(char.goBy, alias);
                }
                break;
            }
        }
    });
    return Array.from(tags.entries()).map(([goBy, matched]) => ({ goBy, matched }));
}

function sortData(data, sortType) {
    if (sortType === 'random') {
        // Fisher-Yates Shuffle
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }
    } else if (sortType === 'sequential') {
        data.sort((a, b) => a.globalId - b.globalId);
    } else if (sortType === 'hashtag') {
        const withTranslation = [];
        const withTags = [];
        const withIdioms = [];
        const others = [];

        data.forEach(item => {
            if (item.translation && item.translation.trim().length > 0) {
                withTranslation.push(item);
            } else if (item.manualTags && item.manualTags.length > 0) {
                withTags.push(item);
            } else if (item.idioms && item.idioms.length > 0) {
                withIdioms.push(item);
            } else {
                others.push(item);
            }
        });

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        shuffle(withTranslation);
        shuffle(withTags);
        shuffle(withIdioms);
        shuffle(others);

        const sorted = [...withTranslation, ...withTags, ...withIdioms, ...others];
        for (let i = 0; i < data.length; i++) {
            data[i] = sorted[i];
        }
    }
}

