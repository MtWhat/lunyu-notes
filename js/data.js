// js/data.js

// 資料設定：難字表 & 人物資料庫
let rareWordsMap = {};
let rarePhrasesMap = {};
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
        const [rWords, rPhrases, chars] = await Promise.all([
            fetch('rareWords.json').then(r => r.json()),
            fetch('rarePhrases.json').then(r => r.json()),
            fetch('characters.json').then(r => r.json())
        ]);
        rareWordsMap = rWords;
        rarePhrasesMap = rPhrases;
        charactersDB = chars;
        // initApp() is in app.js, make sure it's available or we handle initialization differently.
        if (typeof initApp === 'function') {
            initApp();
        } else {
            console.error("initApp function not found. Ensure app.js is loaded.");
        }
    } catch (e) {
        console.error("Failed to load data:", e);
        const contentList = document.getElementById('contentList');
        if (contentList) {
             contentList.innerHTML = '<div class="text-center text-red-500 py-10">資料載入失敗，請檢查網路連線或檔案路徑。</div>';
        }
    }
}

function processTextWithRuby(text) {
    let processed = text;

    // 1. 處理詞組 (優先)
    for (const [phrase, parts] of Object.entries(rarePhrasesMap)) {
        if (processed.includes(phrase)) {
            let rubyHtml = "<ruby>";
            for(let i=0; i<parts.length; i+=2) {
                rubyHtml += `${parts[i]}<rt>${parts[i+1]}</rt>`;
            }
            rubyHtml += "</ruby>";
            processed = processed.split(phrase).join(rubyHtml);
        }
    }

    // 2. 處理單字 (排除已經在 ruby 標籤內的字)
    for (const [char, info] of Object.entries(rareWordsMap)) {
         // 簡單的正則：替換不在 < > 內的字
         const regex = new RegExp(`(?<!<[^>]*)(${char})(?![^<]*>)`, 'g');

        const zhuyin = info.zhuyin || "";
        const definition = info.definition ? info.definition.replace(/'/g, "\\'") : "";

        let replacement = "";
        if (zhuyin) {
            replacement = `<ruby class="rare-char" onclick="showTooltip(event, this, '${char}', '${zhuyin}', '${definition}')">${char}<rt>${zhuyin}</rt></ruby>`;
        } else {
            replacement = `<span class="rare-char" onclick="showTooltip(event, this, '${char}', '', '${definition}')">${char}</span>`;
        }

         processed = processed.replace(regex, replacement);
    }

    return processed;
}

function identifyCharacters(text) {
    const tags = new Set();
    charactersDB.forEach(char => {
        const searchKeys = [...char.searchKeys];
        for (const alias of searchKeys) {
            if (text.includes(alias)) {
                tags.add(char.goBy);
                break;
            }
        }
    });
    return Array.from(tags);
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
        // 1. Split into two groups
        const withTags = [];
        const withoutTags = [];

        data.forEach(item => {
            if (item.manualTags && item.manualTags.length > 0) {
                withTags.push(item);
            } else {
                withoutTags.push(item);
            }
        });

        // 2. Shuffle both groups (Fisher-Yates)
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        shuffle(withTags);
        shuffle(withoutTags);

        // 3. Combine and update original array
        const sorted = [...withTags, ...withoutTags];

        // Update the input array in-place
        for (let i = 0; i < data.length; i++) {
            data[i] = sorted[i];
        }
    }
}
