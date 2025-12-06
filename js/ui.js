// js/ui.js

let showTranslations = false;

function toggleTranslations() {
    showTranslations = !showTranslations;
    const btn = document.getElementById('translationToggleBtn');
    const contentList = document.getElementById('contentList');

    if (showTranslations) {
        contentList.classList.add('show-translations');
        btn.innerHTML = '📖 隱藏翻譯';
        btn.classList.remove('bg-stone-200', 'text-stone-700');
        btn.classList.add('bg-stone-800', 'text-white');
    } else {
        contentList.classList.remove('show-translations');
        btn.innerHTML = '📖 顯示翻譯';
        btn.classList.remove('bg-stone-800', 'text-white');
        btn.classList.add('bg-stone-200', 'text-stone-700');
    }
}

// Tooltip Logic
const tooltip = document.getElementById('tooltip');

function showTooltip(event, element, char, zhuyin, definition) {
    event.stopPropagation(); // Prevent bubbling

    let zhuyinHtml = "";
    if (zhuyin && zhuyin !== "undefined") {
        zhuyinHtml = `<span class="text-sm text-stone-400 font-normal font-sans">${zhuyin}</span>`;
    }

    tooltip.innerHTML = `
        <div class="font-bold text-yellow-400 mb-1 flex items-baseline gap-2">
            <span class="text-lg">${char}</span>
            ${zhuyinHtml}
        </div>
        <div class="text-stone-200">${definition}</div>
    `;

    tooltip.style.display = 'block';

    // Positioning
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position above the character
    let top = rect.top + scrollTop - tooltipRect.height - 8;
    let left = rect.left + scrollLeft + (rect.width / 2) - (tooltipRect.width / 2);

    // Prevent going off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < scrollTop) {
        // If not enough space above, show below
        top = rect.bottom + scrollTop + 8;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

function hideTooltip() {
    if(tooltip) tooltip.style.display = 'none';
}

// Close tooltip when clicking anywhere else
document.addEventListener('click', hideTooltip);
window.addEventListener('scroll', hideTooltip);

// Search Bar Expansion Logic
const searchContainer = document.getElementById('searchContainer');
const searchInputWrapper = document.getElementById('searchInputWrapper');
const searchInput = document.getElementById('searchInput'); // Used here for focus

function toggleSearch() {
    const isExpanded = searchInputWrapper.classList.contains('w-full');

    if (isExpanded) {
        if (!searchInput.value.trim()) {
            collapseSearch();
        } else {
            searchInput.focus();
        }
    } else {
        expandSearch();
    }
}

function expandSearch() {
    searchInputWrapper.classList.remove('w-0', 'opacity-0');
    searchInputWrapper.classList.add('w-full', 'opacity-100');
    searchContainer.classList.add('flex-grow');
    setTimeout(() => searchInput.focus(), 50);
}

function collapseSearch() {
    searchInputWrapper.classList.remove('w-full', 'opacity-100');
    searchInputWrapper.classList.add('w-0', 'opacity-0');
    searchContainer.classList.remove('flex-grow');
}

function checkCollapseSearch() {
    setTimeout(() => {
        if (!searchInput.value.trim() && document.activeElement !== searchInput) {
            collapseSearch();
        }
    }, 200);
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('hidden');
}

// Modals
const characterModal = document.getElementById('characterModal');
const askModal = document.getElementById('askModal');
const hashtagModal = document.getElementById('hashtagModal');
const aiChatResponse = document.getElementById('aiChatResponse');
const askInput = document.getElementById('askInput');

function closeCharacterModal() {
    characterModal.classList.add('hidden');
}

function openAskModal() {
    askModal.classList.remove('hidden');
    askInput.focus();
}

function closeAskModal() {
    askModal.classList.add('hidden');
}

function closeHashtagModal() {
    hashtagModal.classList.add('hidden');
}

// Card Scrolling
function scrollCards(direction) {
    const container = document.getElementById('characterCardContainer');
    const scrollAmount = 340;

    if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// Mouse Wheel Horizontal Scroll
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('characterCardContainer');
    if (container) {
        container.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                const multiplier = 3;
                container.scrollLeft += e.deltaY * multiplier;
            }
        }, { passive: false });
    }
});

// Event Listeners for closing modals
askModal.addEventListener('click', function(e) {
    if (e.target === askModal) {
        closeAskModal();
    }
});

characterModal.addEventListener('click', function(e) {
    if (e.target === characterModal) {
        closeCharacterModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        if (document.activeElement === searchInput) {
            searchInput.blur();
            collapseSearch();
        }
        closeCharacterModal();
        closeAskModal();
        closeHashtagModal();
    }
});
