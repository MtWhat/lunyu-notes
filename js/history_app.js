// js/history_app.js

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
        hlSearchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim().toLowerCase();
            const filtered = HISTORY_DATA.filter(item =>
                item.content.toLowerCase().includes(keyword) ||
                (item.age && String(item.age).includes(keyword)) ||
                (item.year && String(item.year).includes(keyword))
            );
            renderHistory(filtered, keyword);
        });
    }

    // Scroll listener for floating age
    window.addEventListener('scroll', updateFloatingAge);
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
                📖 參照論語 ${link.ref}
            </a>`;
        }).join('');

        // Identify characters and filter out "孔子"
        const charTags = identifyCharacters(item.content).filter(tag => tag !== "孔子");
        const charTagsHtml = charTags.map(tag => {
            const charData = charactersDB.find(c => c.goBy === tag);
            let categoryClass = '';
            if (charData) {
                if (charData.category === '孔門諸賢') categoryClass = 'tag-confucian';
                else if (charData.category === '其他') categoryClass = 'tag-other';
                else if (charData.category === '古人') categoryClass = 'tag-ancient';
                else if (charData.category === '魯國人') categoryClass = 'tag-lu';
                else if (charData.category === '外國人') categoryClass = 'tag-foreign';
            }
            return `<span class="char-tag ${categoryClass}" onclick="filterByChar('${tag}')">${tag}</span>`;
        }).join(' ');

        itemDiv.innerHTML = `
            <div class="timeline-dot"></div>
            ${markerHtml}
            <div class="verse-card bg-white p-6 rounded shadow-sm border-l-4 border-stone-300 hover:shadow-md transition-shadow relative">
                <div class="flex flex-wrap items-center gap-3 mb-3">
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
                <div class="mt-4 p-3 bg-amber-50 border-l-2 border-amber-200 text-sm text-stone-600 italic font-sans">
                    ${processTextWithRuby(item.note)}
                </div>` : ''}
            </div>
        `;
        fragment.appendChild(itemDiv);
    });

    hlContentList.appendChild(fragment);
    updateFloatingAge();
}

function filterByChar(charName) {
    hlActiveCharFilter = charName;
    if (hlSearchInput) hlSearchInput.value = '';

    const filtered = HISTORY_DATA.filter(item => identifyCharacters(item.content).includes(charName));
    renderHistory(filtered);

    const charData = charactersDB.find(c => c.goBy === charName);
    if (charData && charData.relation && hlCharacterBio) {
        hlCharacterBio.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-lg text-stone-800">${charData.goBy}</span>
            </div>
            <div>${charData.relation}</div>
        `;
        hlCharacterBio.classList.remove('hidden');
    } else if (hlCharacterBio) {
        hlCharacterBio.classList.add('hidden');
    }

    closeCharacterModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const container = document.getElementById('characterCardContainer');
    if (!container) return;

    container.innerHTML = filteredChars.map(char => {
        return `
        <div class="pokemon-card bg-white border-2 border-stone-200">
            <div class="card-header">
                <span class="font-bold text-xl text-stone-800 font-serif">${char.goBy}</span>
            </div>
            ${char.picture ? `<div class="card-image-container"><img src="${char.picture}" class="w-full h-full object-cover"></div>` : ''}
            <div class="card-content">
                <p class="text-stone-700 text-sm">${char.relation || "暫無簡介"}</p>
            </div>
            <div class="card-footer">
                <button onclick="filterByChar('${char.goBy}')" class="text-xs bg-stone-800 text-white px-3 py-1 rounded-full">查看年表及條目</button>
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
