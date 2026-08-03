// API Configuration
const API_BASE = 'https://use.apiindonesia.id/api/v1/alkitab';
const API_KEY = 'aip_live_UGZSgCyINkIm3hvebYKmIJ51tg89ny0u';

// DOM Elements
const bookDropdown = document.getElementById('bookDropdown');
const chapterDropdown = document.getElementById('chapterDropdown');
const verseDropdown = document.getElementById('verseDropdown');
const searchInput = document.getElementById('searchInput');
const loadingState = document.getElementById('loadingState');
const chapterTitle = document.getElementById('chapterTitle');
const versesContainer = document.getElementById('versesContainer');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const emptyState = document.getElementById('emptyState');
const readingContainer = document.getElementById('readingContainer');
const decreaseFontBtn = document.getElementById('decreaseFont');
const increaseFontBtn = document.getElementById('increaseFont');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// State
let booksData = [];
let currentBook = null;
let currentChapter = null;
let selectedBook = null;
let selectedChapter = null;
let currentVerses = []; // Store current verses for navigation
let currentFontSize = 1; // Current font size in rem
const MIN_FONT_SIZE = 0.875; // 14px
const MAX_FONT_SIZE = 1.5; // 24px
const FONT_SIZE_STEP = 0.125; // 2px
let isFullscreen = false;

// API Helper Function
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'x-api-key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Custom Dropdown Functionality
class CustomDropdown {
    constructor(dropdownElement, options = [], enableAutoSelect = false, onSelectCallback = null) {
        this.dropdown = dropdownElement;
        this.trigger = dropdownElement.querySelector('.dropdown-trigger');
        this.menu = dropdownElement.querySelector('.dropdown-menu');
        this.searchInput = dropdownElement.querySelector('.dropdown-search');
        this.optionsContainer = dropdownElement.querySelector('.dropdown-options');
        this.textDisplay = dropdownElement.querySelector('.dropdown-text');
        this.options = options;
        this.filteredOptions = [...options];
        this.isOpen = false;
        this.selectedValue = null;
        this.enableAutoSelect = enableAutoSelect;
        this.onSelectCallback = onSelectCallback;
        
        this.init();
    }
    
    init() {
        // Toggle dropdown on trigger click
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Handle search input
        this.searchInput.addEventListener('input', (e) => {
            this.filterOptions(e.target.value);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target)) {
                this.close();
            }
        });
        
        // Prevent closing when clicking inside dropdown
        this.menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Initial render
        this.renderOptions();
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.menu.classList.remove('hidden');
        this.searchInput.value = '';
        this.filterOptions('');
        this.searchInput.focus();
    }
    
    openAndFocus() {
        this.open();
        // Small delay to ensure the dropdown is fully open before focusing
        setTimeout(() => {
            this.searchInput.focus();
        }, 50);
    }
    
    close() {
        this.isOpen = false;
        this.menu.classList.add('hidden');
    }
    
    setOptions(options) {
        this.options = options;
        this.filteredOptions = [...options];
        this.renderOptions();
    }
    
    filterOptions(query) {
        const searchTerm = query.toLowerCase();
        this.filteredOptions = this.options.filter(option => {
            const label = option.label || option.text || String(option);
            return label.toLowerCase().includes(searchTerm);
        });
        this.renderOptions();
        
        // Auto-select if exactly 1 option remains (only if enabled)
        if (this.enableAutoSelect && this.filteredOptions.length === 1 && query.length > 0) {
            // Small delay to allow the user to see the filtering
            setTimeout(() => {
                if (this.filteredOptions.length === 1) { // Double-check still 1 option
                    this.selectOption(this.filteredOptions[0]);
                }
            }, 200);
        }
    }
    
    renderOptions() {
        this.optionsContainer.innerHTML = '';
        
        if (this.filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'dropdown-option no-results';
            noResults.textContent = 'Tidak ada hasil';
            this.optionsContainer.appendChild(noResults);
            return;
        }
        
        this.filteredOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'dropdown-option';
            if (this.selectedValue === (option.value || option)) {
                optionElement.classList.add('selected');
            }
            
            const label = option.label || option.text || String(option);
            optionElement.textContent = label;
            
            optionElement.addEventListener('click', () => {
                this.selectOption(option);
            });
            
            this.optionsContainer.appendChild(optionElement);
        });
    }
    
    selectOption(option) {
        this.selectedValue = option.value || option;
        const label = option.label || option.text || String(option);
        this.textDisplay.textContent = label;
        this.close();
        
        // Trigger change event
        const event = new CustomEvent('change', {
            detail: { value: this.selectedValue, option }
        });
        this.dropdown.dispatchEvent(event);
        
        // Call custom callback if provided
        if (this.onSelectCallback) {
            this.onSelectCallback(this.selectedValue, option);
        }
    }
    
    setValue(value) {
        this.selectedValue = value;
        if (value === null || value === undefined) {
            const placeholder = this.trigger.dataset.placeholder || 'Pilih';
            this.textDisplay.textContent = placeholder;
        } else {
            const option = this.options.find(opt => (opt.value || opt) === value);
            if (option) {
                const label = option.label || option.text || String(option);
                this.textDisplay.textContent = label;
            } else {
                const placeholder = this.trigger.dataset.placeholder || 'Pilih';
                this.textDisplay.textContent = placeholder;
            }
        }
        this.renderOptions();
    }
    
    getValue() {
        return this.selectedValue;
    }
    
    setDisabled(disabled) {
        if (disabled) {
            this.trigger.classList.add('disabled');
            this.trigger.setAttribute('disabled', 'true');
        } else {
            this.trigger.classList.remove('disabled');
            this.trigger.removeAttribute('disabled');
        }
    }
    
    reset() {
        this.selectedValue = null;
        const placeholder = this.trigger.dataset.placeholder || 'Pilih';
        this.textDisplay.textContent = placeholder;
        this.renderOptions();
        this.close();
    }
}

// Initialize Custom Dropdowns
let bookDropdownInstance = null;
let chapterDropdownInstance = null;
let verseDropdownInstance = null;

function initCustomDropdowns() {
    // Book dropdown: enable auto-select
    bookDropdownInstance = new CustomDropdown(bookDropdown, [], true, null);
    
    // Chapter dropdown: enable auto-select
    chapterDropdownInstance = new CustomDropdown(chapterDropdown, [], true, null);
    
    // Verse dropdown: enable auto-select and scroll to verse when selected
    verseDropdownInstance = new CustomDropdown(verseDropdown, [], true, (value) => {
        setTimeout(() => {
            scrollToVerse(value);
        }, 100);
    });
    
    chapterDropdownInstance.setDisabled(true);
    verseDropdownInstance.setDisabled(true);
}

// Show/Hide UI States
function showLoading() {
    loadingState.classList.remove('hidden');
    chapterTitle.classList.add('hidden');
    versesContainer.classList.add('hidden');
    searchResultsContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showChapterView() {
    chapterTitle.classList.remove('hidden');
    versesContainer.classList.remove('hidden');
    searchResultsContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function showSearchResults() {
    chapterTitle.classList.add('hidden');
    versesContainer.classList.add('hidden');
    searchResultsContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function showEmptyState() {
    chapterTitle.classList.add('hidden');
    versesContainer.classList.add('hidden');
    searchResultsContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
}

// Fetch Books
async function fetchBooks() {
    try {
        showLoading();
        const data = await fetchAPI('/books');
        
        // Handle different response structures
        booksData = data.data || data.books || data;
        
        // Populate book dropdown
        const bookOptions = booksData.map(book => ({
            value: book.abbr,
            label: `${book.name} (${book.abbr})`,
            data: book
        }));
        
        bookDropdownInstance.setOptions(bookOptions);
        
        hideLoading();
    } catch (error) {
        console.error('Error fetching books:', error);
        hideLoading();
        showEmptyState();
    }
}

// Populate Chapter Dropdown
function populateChapters(book) {
    if (book && book.chapter_count) {
        const chapterOptions = [];
        for (let i = 1; i <= book.chapter_count; i++) {
            chapterOptions.push({
                value: i,
                label: String(i)
            });
        }
        chapterDropdownInstance.setOptions(chapterOptions);
        chapterDropdownInstance.setDisabled(false);
    } else {
        chapterDropdownInstance.setOptions([]);
        chapterDropdownInstance.setDisabled(true);
    }
    
    // Reset verse dropdown when chapter changes
    verseDropdownInstance.setOptions([]);
    verseDropdownInstance.setDisabled(true);
}

// Populate Verse Dropdown
function populateVerses(verses) {
    if (!verses || verses.length === 0) {
        verseDropdownInstance.setOptions([]);
        verseDropdownInstance.setDisabled(true);
        return;
    }
    
    const verseOptions = verses.map(verse => ({
        value: verse.verse_number || verse.verse || verse.ayat,
        label: String(verse.verse_number || verse.verse || verse.ayat)
    }));
    
    verseDropdownInstance.setOptions(verseOptions);
    verseDropdownInstance.setDisabled(false);
}

// Scroll to specific verse with perikop detection
function scrollToVerse(verseNumber) {
    const verseElements = versesContainer.querySelectorAll('.verse');
    let targetElement = null;
    let targetPerikop = null;
    
    // Find the target verse element
    for (const verseElement of verseElements) {
        if (verseElement.dataset.verseNumber == verseNumber) {
            targetElement = verseElement;
            break;
        }
    }
    
    if (!targetElement) return;
    
    // Check if there's a perikop title immediately before this verse
    const previousSibling = targetElement.previousElementSibling;
    if (previousSibling && previousSibling.dataset.isPerikop === 'true') {
        targetPerikop = previousSibling;
    }
    
    // Scroll to the element (prefer perikop if exists)
    const scrollToElement = targetPerikop || targetElement;
    
    // Calculate offset for navbar (120px) + additional spacing (20px)
    const navbarOffset = 120;
    const additionalOffset = 20;
    const totalOffset = navbarOffset + additionalOffset;
    
    // Get element position and calculate scroll position
    const y = scrollToElement.getBoundingClientRect().top + window.scrollY - totalOffset;
    
    // Smooth scroll to calculated position
    window.scrollTo({
        top: y,
        behavior: 'smooth'
    });
}

// Fetch and Display Chapter
async function fetchChapter(bookAbbr, chapter, autoFocusVerse = true) {
    try {
        showLoading();
        const data = await fetchAPI(`/passage/${bookAbbr}/${chapter}`);
        
        currentBook = bookAbbr;
        currentChapter = chapter;
        
        // Find book name
        const book = booksData.find(b => b.abbr === bookAbbr);
        const bookName = book ? book.name : bookAbbr;
        
        // Set title
        chapterTitle.querySelector('h2').textContent = `${bookName} ${chapter}`;
        
        // Handle different response structures - specifically target data.verses
        const verses = data.data?.verses || data.verses || data.data || data;
        
        // Store current verses for navigation
        currentVerses = verses;
        
        // Render verses
        renderVerses(verses);
        
        // Populate verse dropdown (this must complete before we can set verse value)
        populateVerses(verses);
        
        showChapterView();
        hideLoading();
        
        // Auto-focus verse dropdown after chapter loads (only if requested and not disabled)
        if (autoFocusVerse) {
            setTimeout(() => {
                if (verseDropdownInstance && !verseDropdownInstance.trigger.classList.contains('disabled')) {
                    verseDropdownInstance.openAndFocus();
                }
            }, 400);
        }
    } catch (error) {
        console.error('Error fetching chapter:', error);
        hideLoading();
        showEmptyState();
    }
}

// Render Verses with Formatting
function renderVerses(verses) {
    versesContainer.innerHTML = '';
    
    if (!verses || verses.length === 0) {
        versesContainer.innerHTML = '<p class="text-center text-[#27272A]/50">Tidak ada ayat ditemukan</p>';
        return;
    }
    
    verses.forEach((verse, index) => {
        const verseElement = document.createElement('div');
        verseElement.className = 'verse fade-in';
        verseElement.style.animationDelay = `${index * 0.05}s`;
        
        // Add data attribute for verse number to enable scrolling
        const verseNum = verse.verse_number || verse.verse || verse.ayat || index + 1;
        verseElement.dataset.verseNumber = verseNum;
        
        // Add section title if present
        if (verse.title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'perikop-title';
            titleElement.textContent = verse.title;
            titleElement.dataset.isPerikop = 'true';
            versesContainer.appendChild(titleElement);
        }
        
        // Create verse number as superscript (handle different property names)
        const verseNumber = document.createElement('sup');
        verseNumber.className = 'verse-number';
        verseNumber.textContent = verseNum;
        
        // Create verse text (handle different property names)
        const verseText = document.createElement('span');
        verseText.textContent = verse.text || verse.teks || verse.content || '';
        
        verseElement.appendChild(verseNumber);
        verseElement.appendChild(verseText);
        
        versesContainer.appendChild(verseElement);
    });
}

// Search Functionality
async function searchBible(query) {
    if (!query || query.trim().length < 2) {
        showEmptyState();
        return;
    }
    
    // Clean the query - remove special characters that might cause API errors
    const cleanQuery = query.trim().replace(/[^\w\s\u0590-\u05FF\u0600-\u06FF]/g, '');
    
    if (cleanQuery.length < 2) {
        showEmptyState();
        return;
    }
    
    try {
        showLoading();
        // Reset chapter and verse dropdowns when search is executed
        chapterDropdownInstance.reset();
        chapterDropdownInstance.setDisabled(true);
        verseDropdownInstance.reset();
        verseDropdownInstance.setDisabled(true);
        
        // Use strict endpoint as requested
        const data = await fetchAPI(`/search?q=${encodeURIComponent(cleanQuery)}`);
        
        // Handle different response structures
        const results = data.data || data.results || data;
        
        renderSearchResults(results, query);
        
        showSearchResults();
        hideLoading();
    } catch (error) {
        console.error('Error searching:', error);
        hideLoading();
        showEmptyState();
    }
}

// Render Search Results
function renderSearchResults(results, query) {
    searchResultsContainer.innerHTML = '';
    
    if (!results || results.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="font-serif text-[#27272A]/50 text-lg">
                    Tidak ada hasil untuk "${query}"
                </p>
            </div>
        `;
        return;
    }
    
    // Filter by selected book if a book is selected
    const selectedBookValue = bookDropdownInstance?.getValue();
    let filteredResults = results;
    
    if (selectedBookValue) {
        const selectedBookData = booksData.find(b => b.abbr === selectedBookValue);
        if (selectedBookData) {
            filteredResults = results.filter(result => {
                const resultBookId = result.book_id || result.book?.id;
                const resultBookName = (result.book || result.kitab || result.book_name || '').toLowerCase();
                const resultBookAbbr = (result.abbr || result.book_abbr || result.singkatan_kitab || '').toLowerCase();
                const selectedBookName = selectedBookData.name.toLowerCase();
                const selectedBookAbbr = selectedBookData.abbr.toLowerCase();
                
                // Match by ID, name, or abbreviation (case-insensitive)
                return resultBookId === selectedBookData.id || 
                       resultBookName === selectedBookName || 
                       resultBookName === selectedBookAbbr ||
                       resultBookAbbr === selectedBookAbbr ||
                       resultBookAbbr === selectedBookName;
            });
        }
    }
    
    if (filteredResults.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="font-serif text-[#27272A]/50 text-lg">
                    Tidak ada hasil untuk "${query}" dalam kitab yang dipilih
                </p>
            </div>
        `;
        return;
    }
    
    filteredResults.forEach((result, index) => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result fade-in cursor-pointer';
        resultElement.style.animationDelay = `${index * 0.05}s`;
        
        // Handle different property names for search results
        let bookName = result.book || result.kitab || result.book_name || '';
        const chapter = result.chapter || result.pasal || '';
        const verse = result.verse || result.ayat || result.verse_number || '';
        let abbr = result.abbr || result.book_abbr || result.singkatan_kitab || '';
        
        // If book name is missing, try to find it from booksData using abbr or book_id
        if (!bookName && abbr) {
            const book = booksData.find(b => b.abbr.toLowerCase() === abbr.toLowerCase());
            if (book) {
                bookName = book.name;
                abbr = book.abbr; // Use the correct abbreviation from booksData
            }
        } else if (!bookName && result.book_id) {
            const book = booksData.find(b => b.id === result.book_id);
            if (book) {
                bookName = book.name;
                abbr = book.abbr;
            }
        } else if (bookName && !abbr) {
            // If we have book name but no abbr, try to find abbr from booksData
            const book = booksData.find(b => b.name.toLowerCase() === bookName.toLowerCase());
            if (book) {
                abbr = book.abbr;
            }
        }
        
        // Store the reference data for click handling
        const referenceData = {
            abbr: abbr,
            chapter: chapter,
            verse: verse,
            bookName: bookName
        };
        
        // Create reference link
        const reference = document.createElement('div');
        reference.className = 'search-reference';
        reference.textContent = `${bookName} ${chapter}:${verse}`;
        
        // Create verse text with highlight (handle different property names)
        const verseText = document.createElement('div');
        verseText.className = 'search-verse';
        const text = result.text || result.teks || result.content || result.verse_text || '';
        verseText.innerHTML = highlightText(text, query);
        
        resultElement.appendChild(reference);
        resultElement.appendChild(verseText);
        
        // Make the entire result clickable
        resultElement.addEventListener('click', async () => {
            if (referenceData.abbr && referenceData.chapter) {
                // Update dropdowns to match the clicked result
                bookDropdownInstance.setValue(referenceData.abbr);
                const book = booksData.find(b => b.abbr === referenceData.abbr);
                selectedBook = book;
                populateChapters(book);
                chapterDropdownInstance.setValue(referenceData.chapter);
                
                // Load the full chapter and wait for completion (disable auto-focus verse dropdown)
                await fetchChapter(referenceData.abbr, referenceData.chapter, false);
                
                // After chapter is fully loaded and verse dropdown is populated, update verse dropdown
                if (referenceData.verse) {
                    verseDropdownInstance.setValue(referenceData.verse);
                    // Scroll to the verse after UI is updated
                    setTimeout(() => {
                        scrollToVerse(referenceData.verse);
                    }, 100);
                }
            }
        });
        
        searchResultsContainer.appendChild(resultElement);
    });
}

// Highlight Search Terms
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Event Listeners
bookDropdown.addEventListener('change', (e) => {
    if (!e.detail || e.detail.value === undefined) return;
    
    const bookAbbr = e.detail.value;
    const book = booksData.find(b => b.abbr === bookAbbr);
    selectedBook = book;
    
    // Clear content area
    versesContainer.innerHTML = '';
    chapterTitle.classList.add('hidden');
    searchResultsContainer.classList.add('hidden');
    
    // Reset chapter dropdown
    chapterDropdownInstance.reset();
    chapterDropdownInstance.setDisabled(true);
    
    // Reset verse dropdown
    verseDropdownInstance.reset();
    verseDropdownInstance.setDisabled(true);
    
    // Populate chapters for the new book
    populateChapters(book);
    
    // Show empty state since no chapter is selected yet
    showEmptyState();
    
    // Clear search input when book is selected
    searchInput.value = '';
    
    // Auto-focus chapter dropdown after population (only if not disabled)
    setTimeout(() => {
        if (chapterDropdownInstance && !chapterDropdownInstance.trigger.classList.contains('disabled')) {
            chapterDropdownInstance.openAndFocus();
        }
    }, 300);
});

chapterDropdown.addEventListener('change', (e) => {
    if (!e.detail || e.detail.value === undefined) return;
    
    const chapter = e.detail.value;
    const bookAbbr = bookDropdownInstance?.getValue();
    
    // Reset verse dropdown when chapter changes
    verseDropdownInstance.reset();
    verseDropdownInstance.setDisabled(true);
    
    // Clear content area
    versesContainer.innerHTML = '';
    
    if (bookAbbr && chapter) {
        fetchChapter(bookAbbr, chapter);
    }
    
    // Clear search input when chapter is selected
    searchInput.value = '';
});

verseDropdown.addEventListener('change', (e) => {
    if (!e.detail || e.detail.value === undefined) return;
    
    const verseNumber = e.detail.value;
    scrollToVerse(verseNumber);
});

// Search with debounce
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    const query = e.target.value.trim();
    
    if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
            searchBible(query);
        }, 500);
    } else if (query.length === 0) {
        // If search is cleared, return to empty state
        showEmptyState();
        // Reset verse dropdown when search is cleared
        verseDropdownInstance.setOptions([]);
        verseDropdownInstance.setDisabled(true);
    }
});

// Handle Enter key in search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        searchBible(e.target.value.trim());
    }
});

// Font Size Functions
function loadFontSize() {
    const savedFontSize = localStorage.getItem('alkitabFontSize');
    if (savedFontSize) {
        currentFontSize = parseFloat(savedFontSize);
        applyFontSize();
    }
}

function saveFontSize() {
    localStorage.setItem('alkitabFontSize', currentFontSize.toString());
}

function applyFontSize() {
    readingContainer.style.fontSize = `${currentFontSize}rem`;
    updateFontButtons();
}

function increaseFontSize() {
    if (currentFontSize < MAX_FONT_SIZE) {
        currentFontSize = Math.min(currentFontSize + FONT_SIZE_STEP, MAX_FONT_SIZE);
        applyFontSize();
        saveFontSize();
    }
}

function decreaseFontSize() {
    if (currentFontSize > MIN_FONT_SIZE) {
        currentFontSize = Math.max(currentFontSize - FONT_SIZE_STEP, MIN_FONT_SIZE);
        applyFontSize();
        saveFontSize();
    }
}

function updateFontButtons() {
    decreaseFontBtn.disabled = currentFontSize <= MIN_FONT_SIZE;
    increaseFontBtn.disabled = currentFontSize >= MAX_FONT_SIZE;
}

// Fullscreen/Zen Mode Functions
function toggleFullscreen() {
    if (!isFullscreen) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateZenMode() {
    if (isFullscreen) {
        document.body.classList.add('zen-mode');
    } else {
        document.body.classList.remove('zen-mode');
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    updateZenMode();
});

document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen = !!document.webkitFullscreenElement;
    updateZenMode();
});

document.addEventListener('msfullscreenchange', () => {
    isFullscreen = !!document.msFullscreenElement;
    updateZenMode();
});

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Fullscreen: F key
        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Increase font size: = or + key
        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            increaseFontSize();
        }
        
        // Decrease font size: - key
        if (e.key === '-') {
            e.preventDefault();
            decreaseFontSize();
        }
    });
}

// Initialize App
function init() {
    loadFontSize();
    initCustomDropdowns();
    fetchBooks();
    
    // Show empty state by default
    showEmptyState();
    
    // Font size controls (attach after functions are defined)
    decreaseFontBtn.addEventListener('click', decreaseFontSize);
    increaseFontBtn.addEventListener('click', increaseFontSize);
    
    // Fullscreen control
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
