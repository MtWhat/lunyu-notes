// js/app.js

let activeCharFilter = null;
let activeHashtagFilter = null;
let currentSortType = 'hashtag';
let activeCategoryFilter = 'all';

// DOM Elements
const contentList = document.getElementById('contentList');
const resultCount = document.getElementById('resultCount');
const mainFilterIndicator = document.getElementById('mainFilterIndicator');
const mainFilterText = document.getElementById('mainFilterText');
const characterBio = document.getElementById('characterBio');
const searchClearBtn = document.getElementById('searchClearBtn');
const hashtagListContainer = document.getElementById('hashtagListContainer');

// Note: searchInput is defined in ui.js scope if we used modules, but in raw scripts it shares global scope.
// However, I will use document.getElementById inside functions to be safe and avoid relying on load order for variable assignment (though functions render fine).

function initApp() {
    lunyuData.forEach(chapterData => {
        chapterData.verses.forEach((verseData, index) => {
            globalCounter++;

            let verseText = "";
            let manualTags = [];
            let translation = "";

            if (typeof verseData === 'string') {
                verseText = verseData;
            } else {
                verseText = verseData.text;
                manualTags = verseData.tags || [];
                translation = verseData.translation || "";
            }

            const charTags = identifyCharacters(verseText);
            const rubyText = processTextWithRuby(verseText);

            flatIndex.push({
                globalId: globalCounter,
                citation: `${chapterData.chapter} ${chapterData.roman}-${index + 1}`,
                shortCitation: `${chapterData.roman}-${index + 1}`,
                fullCitation: `${globalCounter} ${chapterData.chapter} ${chapterData.roman}-${index + 1}`,
                rawText: verseText,
                rubyText: rubyText,
                charTags: charTags,
                manualTags: manualTags,
                translation: translation,
                tags: [...charTags]
            });
        });
    });

    // Initial sort
    sortData(flatIndex, currentSortType);
    render(flatIndex);
}

function handleSortChange(sortType) {
    currentSortType = sortType;
    sortData(flatIndex, currentSortType);

    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
        searchInput.dispatchEvent(new Event('input'));
    } else if (activeCharFilter) {
        filterByChar(activeCharFilter);
    } else if (activeHashtagFilter) {
        filterByHashtag(activeHashtagFilter);
    } else {
        render(flatIndex);
    }
}

function updateMainIndicator() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    const hasCharFilter = !!activeCharFilter;
    const hasHashtagFilter = !!activeHashtagFilter;
    const hasSearch = !!keyword;

    if (!hasCharFilter && !hasHashtagFilter && !hasSearch) {
        mainFilterIndicator.classList.add('hidden');
        return;
    }

    mainFilterIndicator.classList.remove('hidden');

    let text = '';
    let parts = [];
    if (hasSearch) parts.push(`搜尋: ${keyword}`);
    if (hasCharFilter) parts.push(`人物: ${activeCharFilter}`);
    if (hasHashtagFilter) parts.push(`標籤: #${activeHashtagFilter}`);

    text = parts.join(' + ');

    mainFilterText.textContent = text;
}

// Search Logic Listeners
const searchInputRef = document.getElementById('searchInput');
searchInputRef.addEventListener('input', (e) => {
    const keyword = e.target.value.trim();

    if (keyword) {
        searchClearBtn.classList.remove('hidden');
    } else {
        searchClearBtn.classList.add('hidden');
    }

    updateMainIndicator();

    let baseList = activeCharFilter
        ? flatIndex.filter(item => item.tags.includes(activeCharFilter))
        : flatIndex;

    if (!keyword) {
        render(baseList);
        return;
    }

    const filtered = baseList.filter(item => item.rawText.includes(keyword) || item.shortCitation.includes(keyword));
    render(filtered, keyword);
});

searchClearBtn.addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    searchClearBtn.classList.add('hidden');
    searchInput.focus();

    updateMainIndicator();

    let baseList = activeCharFilter
        ? flatIndex.filter(item => item.tags.includes(activeCharFilter))
        : flatIndex;
    render(baseList);
});


function render(results, keyword = '') {
    contentList.innerHTML = '';

    if (results.length === 0) {
        contentList.innerHTML = '<div class="text-center text-gray-500 py-10 font-sans">找不到相關條目。</div>';
        resultCount.textContent = '無搜尋結果';
        return;
    }

    resultCount.textContent = `共 ${results.length} 條`;

    const fragment = document.createDocumentFragment();

    results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'verse-card bg-white p-6 rounded shadow-md border-l-4 border-stone-400 hover:shadow-lg transition-shadow relative';

        let displayText = item.rubyText;

        if (keyword) {
            try {
                const regex = new RegExp(`(?![^<]+>)(${keyword})`, 'gi');
                displayText = displayText.replace(regex, `<span class="highlight">$1</span>`);
            } catch(e) {}
        }

        const charTagsHtml = item.charTags.map(tag => {
            const charData = charactersDB.find(c => c.goBy === tag);
            let categoryClass = '';
            if (charData) {
                if (charData.category === '孔門諸賢') categoryClass = 'tag-confucian';
                else if (charData.category === '其他') categoryClass = 'tag-other';
                else if (charData.category === '古人') categoryClass = 'tag-ancient';
                else if (charData.category === '魯國人') categoryClass = 'tag-lu';
                else if (charData.category === '外國人') categoryClass = 'tag-foreign';
            }

            return `<span class="char-tag ${categoryClass} ${activeCharFilter === tag ? 'active' : ''}" onclick="filterByChar('${tag}')">${tag}</span>`;
        }).join(' ');

        const hashtagsHtml = item.manualTags.map(tag => {
            return `<span class="hashtag ${activeHashtagFilter === tag ? 'active' : ''}" onclick="filterByHashtag('${tag}')">#${tag}</span>`;
        }).join(' ');

        card.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                <div class="flex flex-col gap-1 w-full">
                    <div class="text-sm font-bold text-stone-600 font-sans tracking-wide select-all">
                        <span class="serial-num mr-2">#${item.globalId}</span> ${item.citation}
                    </div>
                    <div class="flex flex-wrap gap-2 mt-1">
                        ${charTagsHtml}
                        ${hashtagsHtml}
                    </div>
                </div>
            <div class="flex gap-2 self-start sm:self-auto flex-shrink-0">
                    ${item.translation ? `
                    <button onclick="toggleEntryTranslation(this)" class="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1 font-sans border border-stone-200 whitespace-nowrap">
                        📖 顯示註解
                    </button>` : ''}
                    <button onclick="explainVerse(this, '${item.citation}', '${item.rawText.replace(/'/g, "\\'")}')" class="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded transition-colors flex items-center gap-1 font-sans border border-stone-200 whitespace-nowrap">
                        ✨ AI 白話解讀
                    </button>
                </div>
            </div>
            <div class="text-xl leading-loose text-gray-800 tracking-wide mt-2 pl-1 border-l-2 border-stone-100 break-words text-justify">${displayText}</div>
            ${item.translation ? `<div class="translation-text">${item.translation}</div>` : ''}
        `;
        fragment.appendChild(card);
    });

    contentList.appendChild(fragment);
}

async function explainVerse(btn, citation, text) {
    const card = btn.closest('.verse-card');
    let explanationDiv = card.querySelector('.ai-explanation');

    if (!explanationDiv) {
        explanationDiv = document.createElement('div');
        explanationDiv.className = 'ai-explanation mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 text-base font-sans';
        explanationDiv.style.display = 'none';
        card.appendChild(explanationDiv);
    }

    if (explanationDiv.style.display !== 'none') {
        explanationDiv.style.display = 'none';
        btn.innerHTML = '✨ AI 白話解讀';
        return;
    }

    explanationDiv.style.display = 'block';
    explanationDiv.innerHTML = '<div class="flex items-center gap-2"><div class="animate-spin h-4 w-4 border-2 border-stone-500 rounded-full border-t-transparent"></div> 正在請教 AI 夫子...</div>';
    btn.innerHTML = '收起解讀';

    try {
        const prompt = `請用平易近人的現代繁體中文解釋這句論語：「${text}」。\n1. 先給出白話翻譯。\n2. 再簡要說明這句話的現代應用或核心哲理。`;
        const systemPrompt = "你是一位精通國學的現代講師，擅長將論語智慧應用於現代生活。";

        const result = await callGemini(prompt, systemPrompt);
        explanationDiv.innerHTML = marked.parse(result);
    } catch (error) {
        explanationDiv.innerHTML = `<span class="text-red-500">發生錯誤：${error.message}。請確認下方的 API Key 設定。</span>`;
        console.error(error);
    }
}

// Filtering functions
function filterByChar(charName) {
    activeCharFilter = charName;
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';

    updateMainIndicator();

    // Show Character Bio
    const charData = charactersDB.find(c => c.goBy === charName);
    if (charData && charData.relation) {
        const wikiLink = charData.wikipedia ? `<a href="${charData.wikipedia}" target="_blank" class="text-stone-500 hover:text-stone-700 ml-2" title="維基百科"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>` : '';

        characterBio.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-lg text-stone-800">${charData.goBy}</span>
                ${wikiLink}
            </div>
            <div>${charData.relation}</div>
        `;
        characterBio.classList.remove('hidden');
    } else {
        characterBio.classList.add('hidden');
    }

    const filtered = flatIndex.filter(item => item.charTags.includes(charName));
    render(filtered);

    closeCharacterModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterByHashtag(tag) {
    activeHashtagFilter = tag;
    activeCharFilter = null;
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';

    updateMainIndicator();

    const filtered = flatIndex.filter(item => item.manualTags.includes(tag));
    render(filtered);

    closeHashtagModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilter() {
    activeCharFilter = null;
    activeHashtagFilter = null;
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';

    characterBio.classList.add('hidden');

    updateMainIndicator();
    render(flatIndex);
}

function resetSearch() {
    clearFilter();
    render(flatIndex);
}

// Character Modal Logic
function openCharacterModal() {
    filterCharacterList('all');
    const characterModal = document.getElementById('characterModal');
    characterModal.classList.remove('hidden');
}

function filterCharacterList(category) {
    activeCategoryFilter = category;

    // Update button styles
    const buttons = document.querySelectorAll('#categoryFilterContainer button');
    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-stone-200', 'text-stone-600');
            btn.classList.add('bg-stone-800', 'text-white');
        } else {
            btn.classList.add('bg-stone-200', 'text-stone-600');
            btn.classList.remove('bg-stone-800', 'text-white');
        }
    });

    renderCharacterCards();
}

function renderCharacterCards() {
    const filteredChars = activeCategoryFilter === 'all'
        ? charactersDB
        : charactersDB.filter(char => char.category === activeCategoryFilter);

    const container = document.getElementById('characterCardContainer');

    if (filteredChars.length === 0) {
        container.innerHTML = '<div class="text-white text-xl w-full text-center">沒有找到相關人物</div>';
        return;
    }

    container.innerHTML = filteredChars.map(char => {
        const categoryColors = {
            '孔門諸賢': 'bg-amber-100 text-amber-800',
            '魯國人': 'bg-lime-100 text-lime-800',
            '外國人': 'bg-sky-100 text-sky-800',
            '古人': 'bg-slate-100 text-slate-800',
            '其他': 'bg-stone-100 text-stone-800'
        };
        const colorClass = categoryColors[char.category] || 'bg-stone-200 text-stone-600';

        const wikiLink = char.wikipedia ?
            `<a href="${char.wikipedia}" target="_blank" class="text-stone-500 hover:text-stone-800 transition-colors" title="維基百科" onclick="event.stopPropagation()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>` : '';

        const hasBoth = char.surname && char.cadet;
        const surnameClass = hasBoth ? "text-stone-400" : "";

        const surnameStr = char.surname ? `<span class="mr-0.5 ${surnameClass}">${char.surname}</span><span class="text-stone-400 text-[0.7rem] mr-2">姓</span>` : '';
        const cadetStr = char.cadet ? `<span class="mr-0.5">${char.cadet}</span><span class="text-stone-400 text-[0.7rem] mr-2">氏</span>` : '';
        const nameStr = char.name ? `<span class="text-stone-400 text-[0.7rem] mr-0.5">名</span><span class="mr-2">${char.name}</span>` : '';
        const styleStr = char.style ? `<span class="text-stone-400 text-[0.7rem] mr-0.5">字</span><span>${char.style}</span>` : '';

        const nameDisplayHtml = `<div class="flex flex-wrap items-baseline text-sm font-bold text-stone-700 mt-1">
            ${surnameStr}${cadetStr}${nameStr}${styleStr}
        </div>`;

        const aliasesHtml = (char.aliases && char.aliases.length > 0)
            ? `<div class="text-xs text-stone-500 mt-1">又稱: ${char.aliases.join('、')}</div>`
            : '';

        const imageHtml = char.picture ? `
            <div class="card-image-container">
                <div class="w-full h-full flex flex-col justify-center items-center ${colorClass} opacity-80">
                    <img src="${char.picture}" alt="${char.goBy}" class="w-full h-full object-cover">
                </div>
            </div>` : '';

        return `
        <div class="pokemon-card">
            <div class="card-header flex-col items-start !pb-2">
                <div class="flex justify-between w-full items-center">
                    <span class="font-bold text-xl text-stone-800 font-serif">${char.goBy}</span>
                    ${wikiLink}
                </div>
                ${nameDisplayHtml}
                ${aliasesHtml}
            </div>

            ${imageHtml}

            <div class="card-content scrollbar-hide pt-2">
                <p class="text-stone-700 text-sm leading-relaxed text-justify">
                    ${char.relation || "暫無簡介"}
                </p>
            </div>

            <div class="card-footer mt-auto">
                <span class="text-xs font-mono text-stone-400">NO.${String(filteredChars.indexOf(char) + 1).padStart(3, '0')}</span>
                <button onclick="filterByChar('${char.goBy}')" class="text-xs bg-stone-800 text-white px-3 py-1 rounded-full hover:bg-stone-600 transition-colors">
                    查看條目
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function calculateRareness(description) {
    const len = description.length;
    if (len < 10) return 1;
    if (len < 30) return 2;
    if (len < 60) return 3;
    if (len < 100) return 4;
    return 5;
}

// Hashtag Modal Logic
function openHashtagModal() {
    const allTags = new Set();
    flatIndex.forEach(item => {
        item.manualTags.forEach(tag => allTags.add(tag));
    });

    if (allTags.size === 0) {
        hashtagListContainer.innerHTML = '<div class="text-stone-500 w-full text-center">目前沒有任何標籤。</div>';
    } else {
        hashtagListContainer.innerHTML = Array.from(allTags).map(tag => `
            <button onclick="filterByHashtag('${tag}')"
                class="px-4 py-2 rounded-full text-base font-sans bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm">
                #${tag}
            </button>
        `).join('');
    }

    const hashtagModal = document.getElementById('hashtagModal');
    hashtagModal.classList.remove('hidden');
}

// Ask AI Logic
async function askConfucius() {
    const askInput = document.getElementById('askInput');
    const aiChatResponse = document.getElementById('aiChatResponse');

    const question = askInput.value.trim();
    if (!question) return;

    aiChatResponse.classList.remove('hidden');
    aiChatResponse.innerHTML = '<div class="flex justify-center py-8"><div class="animate-spin h-8 w-8 border-4 border-stone-800 rounded-full border-t-transparent"></div></div>';

    try {
        const prompt = `使用者問題：「${question}」\n\n請根據論語的智慧回答這個問題。請引用至少一句相關的論語原文來佐證你的回答。回答語氣要溫和、有智慧，並以繁體中文回答。`;
        const systemPrompt = "你是一位充滿智慧的儒家導師，熟悉《論語》全文。請用現代人的語言，結合《論語》的原文智慧來回答使用者的生活疑惑。";

        const result = await callGemini(prompt, systemPrompt);
        aiChatResponse.innerHTML = marked.parse(result);
    } catch (error) {
        aiChatResponse.innerHTML = `<div class="text-red-500 p-4 text-center">發生錯誤：${error.message}</div>`;
    }
}

const askInputRef = document.getElementById('askInput');
askInputRef.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        askConfucius();
    }
});

// Load the data happens in data.js which calls initApp
loadData();
