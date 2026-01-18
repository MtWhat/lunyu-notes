// js/history_app.js

function updateHeaderSearchState() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    const hasSearchText = hlSearchInput && hlSearchInput.value.trim().length > 0;
    const isExpanded = document.getElementById('searchInputWrapper')?.classList.contains('w-full');
    const hasCharFilter = !!hlActiveCharFilter;

    if (hasSearchText || isExpanded || hasCharFilter) {
        header.classList.add('is-searching');
    } else {
        header.classList.remove('is-searching');
    }
}

let hlLastEntryId = null;
let hlActiveCharFilter = null;
let hlActiveCategoryFilter = 'all';

// DOM Elements - Using unique names to avoid collision with ui.js/app.js
const hlContentList = document.getElementById('contentList');
const hlResultCount = document.getElementById('resultCount');
const hlSearchInput = document.getElementById('searchInput');
const hlCharacterBio = document.getElementById('characterBio');

const hlFloatingAge = document.getElementById('floatingAge');

function initApp() {
    renderHistory(HISTORY_DATA);

    // Search listener
    if (hlSearchInput) {
        const searchClearBtn = document.getElementById('searchClearBtn');
        hlSearchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();

            if (keyword) {
                if (searchClearBtn) searchClearBtn.classList.remove('hidden');
            } else {
                if (searchClearBtn) searchClearBtn.classList.add('hidden');
            }

            const filtered = HISTORY_DATA.filter(item =>
                item.content.toLowerCase().includes(keyword) ||
                (item.age && String(item.age).includes(keyword)) ||
                (item.year && String(item.year).includes(keyword))
            );
            renderHistory(filtered, keyword);
            updateHeaderSearchState();
        });

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                hlSearchInput.value = '';
                searchClearBtn.classList.add('hidden');
                hlSearchInput.focus();
                renderHistory(HISTORY_DATA);
                updateHeaderSearchState();
            });
        }
    }

    // Scroll listener for floating age
    window.addEventListener('scroll', updateFloatingAge);

    // URL ID Support
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get('id');
    if (entryId) {
        setTimeout(() => {
            const target = document.getElementById(`history-item-${entryId}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const card = target.querySelector('.verse-card');
                if (card) {
                    card.classList.add('ring-2', 'ring-stone-400', 'ring-offset-4');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-stone-400', 'ring-offset-4'), 3000);
                }
            }
        }, 300);
    }
}

function updateFloatingAge() {
    if (!hlFloatingAge) return;

    const items = document.querySelectorAll('.timeline-item');
    let currentAge = null;
    let targetLeft = null;
    const threshold = 150; // Offset from top to trigger the change

    items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const ageEl = item.querySelector('.age-label');
        if (ageEl && rect.top < threshold) {
            currentAge = ageEl.textContent;
            // Get the actual horizontal position of the marker
            const ageRect = ageEl.getBoundingClientRect();
            targetLeft = ageRect.left;
        }
    });

    if (currentAge && targetLeft !== null) {
        hlFloatingAge.textContent = `> ${currentAge}`;
        hlFloatingAge.style.left = `${targetLeft}px`;
        hlFloatingAge.classList.add('visible');
    } else {
        hlFloatingAge.classList.remove('visible');
    }
}

function renderHistory(data, keyword = '') {
    if (!hlContentList) return;
    hlContentList.innerHTML = '';
    if (hlResultCount) hlResultCount.textContent = `共 ${data.length} 條`;

    if (data.length === 0) {
        hlContentList.innerHTML = '<div class="text-center text-gray-500 py-10 font-sans">找不到相關條目。</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.id = `history-item-${item.id}`;
        itemDiv.className = 'timeline-item';

        // Age/Year Marker
        let markerHtml = '';
        if (item.age !== null) {
            markerHtml = `
                <div class="year-label">${item.year}</div>
                <div class="age-label">${item.age}歲</div>
            `;
        }

        // Process content with ruby and highlight
        let displayText = processTextWithRuby(item.content);
        if (keyword) {
            try {
                const regex = new RegExp(`(?![^<]+>)(${keyword})`, 'gi');
                displayText = displayText.replace(regex, `<span class="highlight">$1</span>`);
            } catch(e) {}
        }

        // Links to Lunyu (Remove margin for top-row integration)
        const linksHtml = item.links.map(link => {
            return `<a href="index.html?q=${encodeURIComponent(link.ref)}" class="inline-block text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors">
                📖 ${link.ref}
            </a>`;
        }).join('');

        // Identify characters and filter out "孔子"
        const charTags = identifyCharacters(item.content).filter(t => {
            const name = (typeof t === 'object' && t !== null) ? t.goBy : t;
            return name !== "孔子";
        });
        const charTagsHtml = charTags.map(tag => {
            const name = (typeof tag === 'object' && tag !== null) ? tag.goBy : tag;
            const matchedName = (typeof tag === 'object' && tag !== null) ? tag.matched : tag;

            if (!name) return "";

            const charData = charactersDB.find(c => c.goBy === name);
            let categoryClass = '';
            if (charData) {
                if (charData.category === '孔門諸賢') categoryClass = 'tag-confucian';
                else if (charData.category === '其他') categoryClass = 'tag-other';
                else if (charData.category === '古人') categoryClass = 'tag-ancient';
                else if (charData.category === '魯國人') categoryClass = 'tag-lu';
                else if (charData.category === '外國人') categoryClass = 'tag-foreign';
            }

            const tagDisplay = name === matchedName ? name : `${name} (${matchedName})`;
            return `<span class="char-tag ${categoryClass}" onclick="filterByChar('${name}', ${item.id})">${tagDisplay}</span>`;
        }).join(' ');

        itemDiv.innerHTML = `
            <div class="timeline-dot"></div>
            ${markerHtml}
            <div class="verse-card bg-white p-4 rounded shadow-sm border-l-4 border-stone-300 hover:shadow-md transition-shadow relative">
                <div class="flex flex-wrap items-center gap-3 mb-2">
                    <div class="text-xs font-mono text-stone-400">#${item.id}</div>
                    <div class="flex flex-wrap gap-2 items-center">
                        ${linksHtml}
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                        ${charTagsHtml}
                    </div>
                </div>
                <div class="text-lg leading-relaxed text-gray-800 tracking-wide text-justify">
                    ${displayText}
                </div>
                ${item.note ? `
                <div class="mt-4 p-3 bg-amber-50 border-l-2 border-amber-200 text-sm text-stone-600 font-sans history-note">
                    ${processTextWithRuby(item.note)}
                </div>` : ''}
            </div>
        `;
        fragment.appendChild(itemDiv);
    });

    hlContentList.appendChild(fragment);
    updateFloatingAge();
}

function filterByChar(charName, sourceId = null) {
    if (sourceId) hlLastEntryId = sourceId;
    hlActiveCharFilter = charName;
    if (hlSearchInput) hlSearchInput.value = '';

    const filtered = HISTORY_DATA.filter(item => identifyCharacters(item.content).some(t => {
        const name = (typeof t === 'object' && t !== null) ? t.goBy : t;
        return name === charName;
    }));
    renderHistory(filtered);

    const charData = charactersDB.find(c => c.goBy === charName);
    if (charData && charData.relation && hlCharacterBio) {
        hlCharacterBio.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-lg text-stone-800">${charData.goBy}</span>
                </div>
                <button onclick="clearFilter()" class="text-stone-400 hover:text-stone-600 p-1" title="結束人物過濾">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="max-h-[3rem] overflow-y-auto pr-1 text-sm leading-relaxed">${charData.relation}</div>
        `;
        hlCharacterBio.classList.remove('hidden');
    } else if (hlCharacterBio) {
        hlCharacterBio.classList.add('hidden');
    }

    closeCharacterModal();
    updateHeaderSearchState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilter() {
    hlActiveCharFilter = null;
    if (hlSearchInput) hlSearchInput.value = '';
    if (hlCharacterBio) hlCharacterBio.classList.add('hidden');
    renderHistory(HISTORY_DATA);
    updateHeaderSearchState();

    if (hlLastEntryId) {
        const target = document.getElementById(`history-item-${hlLastEntryId}`);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Note: the card inside the item should probably be highlighted
                const card = target.querySelector('.verse-card');
                if (card) {
                    card.classList.add('ring-2', 'ring-stone-400', 'ring-offset-4');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-stone-400', 'ring-offset-4'), 2000);
                }
            }, 100);
        }
        hlLastEntryId = null;
    }
}

function openCharacterModal() {
    filterCharacterList('all');
    const modal = document.getElementById('characterModal');
    if (modal) modal.classList.remove('hidden');
}

function filterCharacterList(category) {
    hlActiveCategoryFilter = category;
    const buttons = document.querySelectorAll('#categoryFilterContainer button');

    const categoryStyles = {
        '孔門諸賢': { inactive: 'bg-amber-100 text-amber-800', active: 'bg-amber-600 text-white' },
        '魯國人': { inactive: 'bg-lime-100 text-lime-800', active: 'bg-lime-600 text-white' },
        '外國人': { inactive: 'bg-sky-100 text-sky-800', active: 'bg-sky-600 text-white' },
        '古人': { inactive: 'bg-slate-100 text-slate-800', active: 'bg-slate-600 text-white' },
        '其他': { inactive: 'bg-stone-100 text-stone-600', active: 'bg-stone-600 text-white' },
        'all': { inactive: 'bg-stone-200 text-stone-800', active: 'bg-stone-800 text-white' }
    };

    buttons.forEach(btn => {
        const cat = btn.dataset.category;
        const style = categoryStyles[cat] || categoryStyles['all'];
        btn.className = "flex-shrink-0 px-3 py-1 rounded-full text-sm font-sans transition-colors border border-stone-300 shadow-sm " +
                        (cat === category ? style.active : style.inactive);
    });

    renderCharacterCards();
}

function renderCharacterCards() {
    const filteredChars = hlActiveCategoryFilter === 'all'
        ? charactersDB
        : charactersDB.filter(char => char.category === hlActiveCategoryFilter);

    const categoryColors = {
        '孔門諸賢': { bg: 'bg-amber-100', text: 'text-amber-800', activeBg: 'bg-amber-600', activeText: 'text-white', border: 'border-amber-200' },
        '魯國人': { bg: 'bg-lime-100', text: 'text-lime-800', activeBg: 'bg-lime-600', activeText: 'text-white', border: 'border-lime-200' },
        '外國人': { bg: 'bg-sky-100', text: 'text-sky-800', activeBg: 'bg-sky-600', activeText: 'text-white', border: 'border-sky-200' },
        '古人': { bg: 'bg-slate-100', text: 'text-slate-800', activeBg: 'bg-slate-600', activeText: 'text-white', border: 'border-slate-200' },
        '其他': { bg: 'bg-stone-100', text: 'text-stone-600', activeBg: 'bg-stone-600', activeText: 'text-white', border: 'border-stone-200' },
        'all': { bg: 'bg-stone-200', text: 'text-stone-800', activeBg: 'bg-stone-800', activeText: 'text-white', border: 'border-stone-300' }
    };

    const container = document.getElementById('characterCardContainer');
    if (!container) return;

    if (filteredChars.length === 0) {
        container.innerHTML = '<div class="text-white text-xl w-full text-center">沒有找到相關人物</div>';
        return;
    }

    container.innerHTML = filteredChars.map(char => {
        const colors = categoryColors[char.category] || categoryColors['其他'];
        const cardBgClass = colors.bg;
        const borderColor = colors.border;
        const colorClass = `${colors.bg} ${colors.text}`;

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
        <div class="pokemon-card ${cardBgClass} border-2 ${borderColor}">
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

            <div class="card-footer mt-auto bg-white/40 border-t ${borderColor}">
                <span class="text-xs font-mono text-stone-500">NO.${String(filteredChars.indexOf(char) + 1).padStart(3, '0')}</span>
                <button onclick="filterByChar('${char.goBy}')" class="text-xs ${colors.activeBg} text-white px-3 py-1 rounded-full hover:opacity-90 transition-opacity">
                    查看年表及條目
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function closeCharacterModal() {
    const modal = document.getElementById('characterModal');
    if (modal) modal.classList.add('hidden');
}

// Initial data load
loadData();
