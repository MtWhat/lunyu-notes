// js/ui.js

// function toggleTranslations removed

function toggleEntryTranslation(btn) {
    const card = btn.closest('.verse-card');
    const translationDiv = card.querySelector('.translation-text');

    if (translationDiv) {
        if (translationDiv.style.display === 'block') {
            translationDiv.style.display = 'none';
            btn.innerHTML = '📖 顯示註解';
            btn.classList.remove('bg-stone-800', 'text-white');
            btn.classList.add('bg-stone-100', 'text-stone-600');
        } else {
            translationDiv.style.display = 'block';
            btn.innerHTML = '📖 隱藏註解';
            btn.classList.remove('bg-stone-100', 'text-stone-600');
            btn.classList.add('bg-stone-800', 'text-white');
        }
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
    searchContainer.classList.add('flex-grow'); // Allows container to take available space
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
    const navMenu = document.getElementById('mobileNavMenu');
    navMenu.classList.toggle('hidden');
}

// Modals
const characterModal = document.getElementById('characterModal');
const askModal = document.getElementById('askModal');
const hashtagModal = document.getElementById('hashtagModal');
const idiomModal = document.getElementById('idiomModal');
const aboutModal = document.getElementById('aboutModal');
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

function closeIdiomModal() {
    idiomModal.classList.add('hidden');
}

function openAboutModal() {
    aboutModal.classList.remove('hidden');
}

function closeAboutModal() {
    aboutModal.classList.add('hidden');
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

aboutModal.addEventListener('click', function(e) {
    if (e.target === aboutModal) {
        closeAboutModal();
    }
});

idiomModal.addEventListener('click', function(e) {
    if (e.target === idiomModal) {
        closeIdiomModal();
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
        closeIdiomModal();
        closeAboutModal();
    }
});

// Header Auto-Hide on Scroll
let lastScrollY = window.scrollY;
const header = document.getElementById('mainHeader');

window.addEventListener('scroll', () => {
    if (!header) return;

    const currentScrollY = window.scrollY;

    // Always show at top or if scrolling up
    if (currentScrollY < lastScrollY || currentScrollY < 50) {
        header.classList.remove('header-hidden');
    }
    // Hide if scrolling down and not at top
    else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        header.classList.add('header-hidden');
    }

    lastScrollY = currentScrollY;
}, { passive: true });

// Dictionary Lookup Logic
const dictPopup = document.getElementById('dictPopup');

function handleSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && selectedText.length < 10) { // Limit length for sane lookups
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        const popupHeight = dictPopup.offsetHeight || 34; // Approx height if not visible yet
        const popupWidth = dictPopup.offsetWidth || 80;

        let top = rect.top + scrollTop - popupHeight - 10;
        let left = rect.left + scrollLeft + (rect.width / 2) - (popupWidth / 2);

        // Prevent going off screen
        if (left < 10) left = 10;
        if (left + popupWidth > window.innerWidth - 10) {
            left = window.innerWidth - popupWidth - 10;
        }

        dictPopup.style.top = `${top}px`;
        dictPopup.style.left = `${left}px`;
        dictPopup.style.display = 'block';

        // Store the word for lookup
        dictPopup.dataset.word = selectedText;
    } else {
        dictPopup.style.display = 'none';
    }
}

// document.addEventListener('selectionchange', () => {
//     // Optional: Hide immediately if selection is lost?
//     // Often better to handle on mouseup to avoid flickering while selecting
//     if (!window.getSelection().toString().trim()) {
//          dictPopup.style.display = 'none';
//     }
// });

document.addEventListener('mouseup', (e) => {
    // Wait a brief moment to ensure selection is processed
    setTimeout(handleSelection, 10);
});

// For mobile touch selection
document.addEventListener('touchend', (e) => {
    setTimeout(handleSelection, 10);
});

// Close popup when clicking elsewhere (handled by selection clearing usually, but just in case)
document.addEventListener('mousedown', (e) => {
    if (e.target !== dictPopup) {
         // If we click anywhere else, and we aren't selecting text, the selection usually clears.
         // But if we click the popup itself, we don't want to clear immediately or hide it before action.
         // dictPopup has onmousedown="event.preventDefault()" to prevent focus loss/selection clear on click.
    }
});

dictPopup.addEventListener('click', (e) => {
    const word = dictPopup.dataset.word;
    if (word) {
        const encodedWord = encodeURIComponent(word);
        const url = `https://www.moedict.tw/${encodedWord}`;
        window.open(url, '_blank');
        dictPopup.style.display = 'none';
        window.getSelection().removeAllRanges(); // Clear selection after lookup
    }
});
