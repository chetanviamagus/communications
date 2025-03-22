document.addEventListener('DOMContentLoaded', () => {
    // State management
    let state = {
        view: 'grid',
        sort: 'newest',
        filters: {
            topics: new Set(),
            categories: new Set(),
            types: new Set(),
            timeframe: 'all',
            keyword: ''
        },
        currentPage: 1,
        itemsPerPage: 24,
        loadMoreCount: 6
    };

    // DOM Elements
    const viewControls = document.querySelectorAll('.view-controls button');
    const sortSelect = document.getElementById('sort-select');
    const keywordSearch = document.getElementById('keyword-search');
    const timeframeSelect = document.getElementById('timeframe-select');
    const filterCheckboxes = document.querySelectorAll('.filter-list input[type="checkbox"]');
    const communicationsGrid = document.querySelector('.communications-grid');
    const loadMoreButton = document.querySelector('.load-more');
    const viewMoreButtons = document.querySelectorAll('.view-more');

    // Event Listeners
    viewControls.forEach(button => {
        button.addEventListener('click', () => {
            viewControls.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            state.view = button.getAttribute('aria-label').toLowerCase().includes('grid') ? 'grid' : 'list';
            updateView();
        });
    });

    sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        updateCommunications();
    });

    keywordSearch.addEventListener('input', debounce(() => {
        state.filters.keyword = keywordSearch.value;
        updateCommunications();
    }, 300));

    timeframeSelect.addEventListener('change', () => {
        state.filters.timeframe = timeframeSelect.value;
        updateCommunications();
    });

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const filterType = checkbox.name;
            const filterSet = state.filters[filterType === 'topic' ? 'topics' :
                             filterType === 'category' ? 'categories' : 'types'];

            if (checkbox.checked) {
                filterSet.add(checkbox.id);
            } else {
                filterSet.delete(checkbox.id);
            }

            updateCommunications();
        });
    });

    loadMoreButton.addEventListener('click', () => {
        state.itemsPerPage += state.loadMoreCount;
        updateCommunications();
    });

    viewMoreButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterSection = button.closest('.filter-section');
            const filterList = filterSection.querySelector('.filter-list');
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            filterList.style.maxHeight = isExpanded ? null : filterList.scrollHeight + 'px';
            button.setAttribute('aria-expanded', !isExpanded);
            button.textContent = isExpanded ? 'View More' : 'View Less';
        });
    });

    // Utility Functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function updateView() {
        communicationsGrid.className = state.view === 'grid' ? 
            'communications-grid' : 'communications-list';
    }

    async function fetchCommunications() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const allData = await response.json();
            
            // Apply filters and sorting
            let filteredItems = allData.items.filter(item => {
                // Keyword filter
                const matchesKeyword = !state.filters.keyword || 
                    item.title.toLowerCase().includes(state.filters.keyword.toLowerCase()) ||
                    item.tags.some(tag => tag.toLowerCase().includes(state.filters.keyword.toLowerCase()));

                // Topic filter - match against tags
                const matchesTopics = state.filters.topics.size === 0 || 
                    Array.from(state.filters.topics).every(topic => 
                        item.tags.some(tag => 
                            tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') === topic.replace('fan-energy', 'fan-energy-index')
                        )
                    );

                // Type filter - match against item.type
                const matchesTypes = state.filters.types.size === 0 ||
                    Array.from(state.filters.types).some(type => 
                        item.type.toLowerCase().replace(/[^a-z0-9]+/g, '-') === type
                    );

                // Category filter - match against tags
                const matchesCategories = state.filters.categories.size === 0 ||
                    Array.from(state.filters.categories).every(category =>
                        item.tags.some(tag => 
                            tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') === category
                        )
                    );

                return matchesKeyword && matchesTopics && matchesTypes && matchesCategories;
            });
            
            // Sort items
            filteredItems.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return state.sort === 'newest' ? dateB - dateA : dateA - dateB;
            });
            
            // Paginate
            const start = (state.currentPage - 1) * state.itemsPerPage;
            const paginatedItems = filteredItems.slice(start, start + state.itemsPerPage);
            
            return {
                items: paginatedItems,
                total: filteredItems.length,
                hasMore: start + state.itemsPerPage < filteredItems.length
            };
        } catch (error) {
            console.error('Error fetching communications:', error);
            return null;
        }
    }

    function createCommunicationCard(item) {
        const article = document.createElement('article');
        article.className = 'communication-card';
        article.setAttribute('role', 'article');

        article.innerHTML = `
            <div class="card-image">
                <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
            </div>
            <div class="card-content">
                <h3><a href="${item.url}">${item.title}</a></h3>
                <div class="card-metadata">
                    <time datetime="${item.date}">${formatDate(item.date)}</time>
                    <span class="issue-number">Issue #${item.issueNumber}</span>
                </div>
                <div class="card-tags">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-type">
                    <span class="icon-${item.type.toLowerCase()}" aria-hidden="true"></span>
                    <span>${item.type}</span>
                </div>
                <a href="${item.url}" class="view-button" 
                   aria-label="View ${item.title}">
                    VIEW
                </a>
            </div>
        `;

        return article;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async function updateCommunications() {
        state.currentPage = 1;
        communicationsGrid.setAttribute('aria-busy', 'true');
        const data = await fetchCommunications();
    
        if (data) {
            communicationsGrid.innerHTML = '';
            data.items.forEach(item => {
                communicationsGrid.appendChild(createCommunicationCard(item));
            });
    
            loadMoreButton.style.display = data.hasMore ? 'block' : 'none';
            communicationsGrid.setAttribute('aria-busy', 'false');
        }
    }

    async function loadMoreCommunications() {
        loadMoreButton.disabled = true;
        const data = await fetchCommunications();

        if (data) {
            data.items.forEach(item => {
                communicationsGrid.appendChild(createCommunicationCard(item));
            });
            loadMoreButton.style.display = data.hasMore ? 'block' : 'none';
        }

        loadMoreButton.disabled = false;
    }

    // Initial load
    updateCommunications();
});