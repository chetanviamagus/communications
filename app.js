// Search index service - responsible for indexing and searching data
class SearchIndexService {
  constructor(data) {
    this.data = data;
    this.titleIndex = new Map();
    this.indexData();
  }

  indexData() {
    // Create an index of words to items for faster search
    this.data.forEach(item => {
      // Tokenize the title into words
      const words = item.title.toLowerCase().split(/\s+/);

      // Add each word to the index
      words.forEach(word => {
        if (!this.titleIndex.has(word)) {
          this.titleIndex.set(word, []);
        }
        if (!this.titleIndex.get(word).includes(item)) {
          this.titleIndex.get(word).push(item);
        }
      });
    });
  }

  search(query) {
    if (!query || query.trim() === "") {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    // Get exact matches
    const exactMatches = this.titleIndex.get(searchTerm) || [];

    // Get suggestions (words that start with the search term)
    const suggestions = [];
    this.titleIndex.forEach((items, word) => {
      if (word.startsWith(searchTerm) && word !== searchTerm) {
        items.forEach(item => {
          if (!suggestions.includes(item) && !exactMatches.includes(item)) {
            suggestions.push(item);
          }
        });
      }
    });

    // Combine exact matches and suggestions
    return [...exactMatches, ...suggestions];
  }

  getSuggestions(prefix, limit = 5) {
    if (!prefix || prefix.trim() === "") {
      return [];
    }

    const searchTerm = prefix.toLowerCase().trim();
    const suggestions = new Set();

    // Find words that start with the prefix
    this.titleIndex.forEach((_, word) => {
      if (word.startsWith(searchTerm)) {
        suggestions.add(word);
      }
    });

    // Convert set to array, sort alphabetically and limit results
    return Array.from(suggestions).sort().slice(0, limit);
  }
}

// Data layer - responsible for managing and filtering data
class CommunicationDataService {
  constructor(rawData) {
    this.data = rawData;
    this.filteredData = [...rawData];
    this.activeFilters = {
      topics: [],
      "product-categories": [],
      "communication-type": []
    };
    this.searchTerm = "";
    this.searchIndex = new SearchIndexService(rawData);
  }

  getUniqueValues(property) {
    return [...new Set(this.data.map(item => item[property]))];
  }

  updateFilter(filterType, value, isActive) {
    if (isActive) {
      if (!this.activeFilters[filterType].includes(value)) {
        this.activeFilters[filterType].push(value);
      }
    } else {
      const index = this.activeFilters[filterType].indexOf(value);
      if (index !== -1) {
        this.activeFilters[filterType].splice(index, 1);
      }
    }
    this.applyFilters();
  }

  updateSearch(searchTerm) {
    this.searchTerm = searchTerm;
    this.applyFilters();
  }

  getSuggestions(prefix) {
    return this.searchIndex.getSuggestions(prefix);
  }

  applyFilters() {
    // Start with all data
    let result = [...this.data];

    // Apply search if there is a search term
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      const searchResults = this.searchIndex.search(this.searchTerm);
      result = result.filter(item => searchResults.includes(item));
    }

    // Apply category filters
    // If no filters are active, keep all data after search
    if (!Object.values(this.activeFilters).every(filters => filters.length === 0)) {
      result = result.filter(item => {
        // Check if item matches all filter categories
        return Object.entries(this.activeFilters).every(([filterType, selectedValues]) => {
          // If no filters of this type are selected, this filter passes
          if (selectedValues.length === 0) {
            return true;
          }

          // Map filter type to item property
          let itemProperty;
          switch (filterType) {
            case "topics":
              itemProperty = item.topic;
              break;
            case "product-categories":
              itemProperty = item.productCategory;
              break;
            case "communication-type":
              itemProperty = item.communication;
              break;
          }

          // Check if the item's property is in the selected values
          return selectedValues.includes(itemProperty);
        });
      });
    }

    this.filteredData = result;
  }

  getFilteredData() {
    return this.filteredData;
  }
}

// UI Components - responsible for rendering and UI interactions
class FilterComponent {
  constructor(filterType, options, container, changeCallback) {
    this.filterType = filterType;
    this.options = options;
    this.container = container;
    this.changeCallback = changeCallback;
    this.initialVisibleCount = 2;
  }

  render() {
    const filterId = this.filterType.toLowerCase().replace(/\s+/g, "-");
    const hasMoreOptions = this.options.length > this.initialVisibleCount;

    const filterHTML = `
        <section class="filter-section" id="${filterId}-section">
          <h2>${this.filterType}</h2>
          <ul class="filter-list" role="group" aria-label="${this.filterType} filters">
            ${this.options
              .map(
                (option, index) => `
              <li ${index >= this.initialVisibleCount ? `class="hidden-option ${filterId}-hidden" style="display: none;"` : ""}>
                <input type="checkbox" id="${option.toLowerCase().replace(/\s+/g, "-")}" name="${filterId}">
                <label for="${option.toLowerCase().replace(/\s+/g, "-")}">${option}</label>
              </li>
            `
              )
              .join("")}
          </ul>
          ${
            hasMoreOptions
              ? `<button class="view-more-btn" data-filter-type="${filterId}">
              View More</button>`
              : ""
          }
        </section>
      `;

    this.container.insertAdjacentHTML("beforeend", filterHTML);
    this.attachEventListeners();
  }

  attachEventListeners() {
    const filterId = this.filterType.toLowerCase().replace(/\s+/g, "-");

    // Add checkbox event listeners
    document.querySelectorAll(`#${filterId}-section input[type="checkbox"]`).forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        const value = checkbox.nextElementSibling.textContent.trim();
        this.changeCallback(filterId, value, checkbox.checked);
      });
    });

    // Add view more/less event listener
    const viewMoreBtn = document.querySelector(`#${filterId}-section .view-more-btn`);
    if (viewMoreBtn) {
      viewMoreBtn.addEventListener("click", () => {
        const hiddenOptions = document.querySelectorAll(`.${filterId}-hidden`);
        const isShowingMore = viewMoreBtn.textContent.trim() === "View More";

        hiddenOptions.forEach(option => {
          option.style.display = isShowingMore ? "block" : "none";
        });

        viewMoreBtn.textContent = isShowingMore ? "View Less" : "View More";
      });
    }
  }
}

class SearchComponent {
  constructor(container, searchCallback, suggestCallback) {
    this.container = container;
    this.searchCallback = searchCallback;
    this.suggestCallback = suggestCallback;
    this.debounceTimeout = null;
  }

  render() {
    // No need to render HTML elements as they are now included in the HTML file
    this.attachEventListeners();
  }

  attachEventListeners() {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const suggestionsContainer = document.getElementById("search-suggestions");

    // Search input event
    searchInput.addEventListener("input", () => {
      const value = searchInput.value;

      // Clear previous timeout
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      // Debounce search to avoid too many updates
      this.debounceTimeout = setTimeout(() => {
        // Update search results
        this.searchCallback(value);

        // Show suggestions if input has value
        if (value.trim()) {
          const suggestions = this.suggestCallback(value);
          this.renderSuggestions(suggestions);
        } else {
          // Clear suggestions if input is empty
          suggestionsContainer.innerHTML = "";
          suggestionsContainer.style.display = "none";
        }
      }, 300);
    });

    // Search button click
    searchButton.addEventListener("click", () => {
      this.searchCallback(searchInput.value);
      suggestionsContainer.innerHTML = "";
      suggestionsContainer.style.display = "none";
    });

    // Handle Enter key
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        this.searchCallback(searchInput.value);
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener("click", e => {
      if (!this.container.contains(e.target)) {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
      }
    });
  }

  renderSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById("search-suggestions");

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = "";
      suggestionsContainer.style.display = "none";
      return;
    }

    const suggestionHTML = suggestions
      .map(suggestion => `<div class="suggestion-item">${suggestion}</div>`)
      .join("");

    suggestionsContainer.innerHTML = suggestionHTML;
    suggestionsContainer.style.display = "block";

    // Add click event to suggestions
    document.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        document.getElementById("search-input").value = item.textContent;
        this.searchCallback(item.textContent);
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
      });
    });
  }
}

class CardListComponent {
  constructor(container, countElement) {
    this.container = container;
    this.countElement = countElement;
    this.currentPage = 1;
    this.cardsPerPage = 24;
    this.isShowingAll = false;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  renderCards(data) {
    const startIndex = 0;
    const endIndex = this.currentPage * this.cardsPerPage;
    const visibleData = this.isShowingAll ? data : data.slice(startIndex, endIndex);

    this.container.innerHTML = this.constructCardHTML(visibleData);

    if (this.countElement) {
      this.countElement.textContent = data.length;
    }

    return data.length;
  }

  constructCardHTML(items) {
    if (items.length === 0) {
      return '<div class="no-results">No matching communications found. Try adjusting your filters or search term.</div>';
    }

    return items
      .map(
        item => `
        <article
          class="communication-card"
          data-id="${item.id}"
          data-topic="${item.topic}"
          data-product-category="${item.productCategory}"
          data-communication="${item.communication}"
        >
          <div class="card-image">
            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
          </div>
          <div class="card-content">
            <h3><a href="${item.url}">${item.title}</a></h3>
            <div class="card-metadata">
              <time datetime="${item.date}">${this.formatDate(item.date)}</time>
              <span class="issue-number">Issue #${item.issueNumber}</span>
            </div>
            <div class="card-tags">
              <span class="tag product-category">${item.productCategory}</span>
              <span class="tag topic">${item.topic}</span>
            </div>
            <div class="card-type">
              <span class="icon-${item.communication.toLowerCase()}" aria-hidden="true"></span>
              <span>${item.communication}</span>
            </div>
            <a href="${item.url}" class="view-button" aria-label="View ${item.title}"> VIEW </a>
          </div>
        </article>
        `
      )
      .join("");
  }

  resetPagination() {
    this.currentPage = 1;
    this.isShowingAll = false;
  }

  loadMore() {
    this.currentPage++;
  }

  showAll() {
    this.isShowingAll = true;
  }

  showLess() {
    this.isShowingAll = false;
    this.currentPage = 1;
  }

  toggleShowAll() {
    if (this.isShowingAll) {
      this.showLess();
    } else {
      this.showAll();
    }
    return this.isShowingAll;
  }
}

// Application Controller - coordinates between data and UI components
class CommunicationApp {
  constructor() {
    // Data array is initialized here
    this.data = [
      {
        id: "1",
        title: "Models 5V-400-WVG and GF ARG-150-TK Production Panels",
        imageUrl: "https://picsum.photos/400/300?1",
        url: "https://www.greenheck.com/products",
        date: "July 27th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "2",
        title: "Square Ceiling Diffuser 24x24 Models Size Option Now Available",
        imageUrl: "https://picsum.photos/400/300?2",
        url: "https://www.greenheck.com/products",
        date: "July 23rd 2024",
        issueNumber: "Issue #1",
        productCategory: "Diffusers",
        topic: "Indoor Air Quality",
        communication: "No Update"
      },
      {
        id: "3",
        title: "CAPS-IAQ Announcement",
        imageUrl: "https://picsum.photos/400/300?3",
        url: "https://www.greenheck.com/products",
        date: "August 8th 2024",
        issueNumber: "Issue #3",
        productCategory: "Software",
        topic: "User Update",
        communication: "Rep Update"
      },
      {
        id: "4",
        title: "RSQ - New Product Release",
        imageUrl: "https://picsum.photos/400/300?4",
        url: "https://www.greenheck.com/products",
        date: "July 29th 2024",
        issueNumber: "Bulletin #1-24",
        productCategory: "RSQ",
        topic: "Louvers",
        communication: "Bulletin"
      },
      {
        id: "5",
        title: "Square Ceiling Diffuser 24x24 Models Size Option Now Available",
        imageUrl: "https://picsum.photos/400/300?5",
        url: "https://www.greenheck.com/products",
        date: "July 23rd 2024",
        issueNumber: "Issue #1",
        productCategory: "Diffusers",
        topic: "Indoor Air Quality",
        communication: "No Update"
      },
      {
        id: "6",
        title: "CAPS-IAQ Announcement",
        imageUrl: "https://picsum.photos/400/300?6",
        url: "https://www.greenheck.com/products",
        date: "August 8th 2024",
        issueNumber: "Issue #3",
        productCategory: "Software",
        topic: "User Update",
        communication: "Rep Update"
      },
      {
        id: "7",
        title: "Models 5V-400-WVG and GF ARG-150-TK Production Panels",
        imageUrl: "https://picsum.photos/400/300?7",
        url: "https://www.greenheck.com/products",
        date: "July 27th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "8",
        title: "Square Ceiling Diffuser 24x24 Models Size Option Now Available",
        imageUrl: "https://picsum.photos/400/300?8",
        url: "https://www.greenheck.com/products",
        date: "July 23rd 2024",
        issueNumber: "Issue #1",
        productCategory: "Diffusers",
        topic: "Indoor Air Quality",
        communication: "No Update"
      },
      {
        id: "9",
        title: "CAPS-IAQ Announcement",
        imageUrl: "https://picsum.photos/400/300?9",
        url: "https://www.greenheck.com/products",
        date: "August 8th 2024",
        issueNumber: "Issue #3",
        productCategory: "Software",
        topic: "User Update",
        communication: "Rep Update"
      },
      {
        id: "10",
        title: "Sample Title 10",
        imageUrl: "https://picsum.photos/400/300?10",
        url: "0https://www.greenheck.com/products",
        date: "August 10th 2024",
        issueNumber: "Issue #5",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "11",
        title: "Sample Title 11",
        imageUrl: "https://picsum.photos/400/300?11",
        url: "1https://www.greenheck.com/products",
        date: "August 11th 2024",
        issueNumber: "Issue #1",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "12",
        title: "Sample Title 12",
        imageUrl: "https://picsum.photos/400/300?12",
        url: "2https://www.greenheck.com/products",
        date: "August 12th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "13",
        title: "Sample Title 13",
        imageUrl: "https://picsum.photos/400/300?13",
        url: "3https://www.greenheck.com/products",
        date: "August 13th 2024",
        issueNumber: "Issue #3",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "14",
        title: "Sample Title 14",
        imageUrl: "https://picsum.photos/400/300?14",
        url: "4https://www.greenheck.com/products",
        date: "August 14th 2024",
        issueNumber: "Issue #4",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "15",
        title: "Sample Title 15",
        imageUrl: "https://picsum.photos/400/300?15",
        url: "5https://www.greenheck.com/products",
        date: "August 15th 2024",
        issueNumber: "Issue #5",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "16",
        title: "Sample Title 16",
        imageUrl: "https://picsum.photos/400/300?16",
        url: "6https://www.greenheck.com/products",
        date: "August 16th 2024",
        issueNumber: "Issue #1",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "17",
        title: "Sample Title 17",
        imageUrl: "https://picsum.photos/400/300?17",
        url: "7https://www.greenheck.com/products",
        date: "August 17th 2024",
        issueNumber: "Issue #2",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "18",
        title: "Sample Title 18",
        imageUrl: "https://picsum.photos/400/300?18",
        url: "8https://www.greenheck.com/products",
        date: "August 18th 2024",
        issueNumber: "Issue #3",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "19",
        title: "Sample Title 19",
        imageUrl: "https://picsum.photos/400/300?19",
        url: "9https://www.greenheck.com/products",
        date: "August 19th 2024",
        issueNumber: "Issue #4",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "20",
        title: "Sample Title 20",
        imageUrl: "https://picsum.photos/400/300?20",
        url: "0https://www.greenheck.com/products",
        date: "August 20th 2024",
        issueNumber: "Issue #5",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "21",
        title: "Sample Title 21",
        imageUrl: "https://picsum.photos/400/300?21",
        url: "1https://www.greenheck.com/products",
        date: "August 21th 2024",
        issueNumber: "Issue #1",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "22",
        title: "Sample Title 22",
        imageUrl: "https://picsum.photos/400/300?22",
        url: "2https://www.greenheck.com/products",
        date: "August 22th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "23",
        title: "Sample Title 23",
        imageUrl: "https://picsum.photos/400/300?23",
        url: "3https://www.greenheck.com/products",
        date: "August 23th 2024",
        issueNumber: "Issue #3",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "24",
        title: "Sample Title 24",
        imageUrl: "https://picsum.photos/400/300?24",
        url: "4https://www.greenheck.com/products",
        date: "August 24th 2024",
        issueNumber: "Issue #4",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "25",
        title: "Sample Title 25",
        imageUrl: "https://picsum.photos/400/300?25",
        url: "5https://www.greenheck.com/products",
        date: "August 25th 2024",
        issueNumber: "Issue #5",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "26",
        title: "Sample Title 26",
        imageUrl: "https://picsum.photos/400/300?26",
        url: "6https://www.greenheck.com/products",
        date: "August 26th 2024",
        issueNumber: "Issue #1",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "27",
        title: "Sample Title 27",
        imageUrl: "https://picsum.photos/400/300?27",
        url: "7https://www.greenheck.com/products",
        date: "August 27th 2024",
        issueNumber: "Issue #2",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "28",
        title: "Sample Title 28",
        imageUrl: "https://picsum.photos/400/300?28",
        url: "8https://www.greenheck.com/products",
        date: "August 28th 2024",
        issueNumber: "Issue #3",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "29",
        title: "Sample Title 29",
        imageUrl: "https://picsum.photos/400/300?29",
        url: "9https://www.greenheck.com/products",
        date: "August 29th 2024",
        issueNumber: "Issue #4",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "30",
        title: "Sample Title 30",
        imageUrl: "https://picsum.photos/400/300?30",
        url: "0https://www.greenheck.com/products",
        date: "August 30th 2024",
        issueNumber: "Issue #5",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "31",
        title: "Sample Title 31",
        imageUrl: "https://picsum.photos/400/300?31",
        url: "1https://www.greenheck.com/products",
        date: "August 31th 2024",
        issueNumber: "Issue #1",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "32",
        title: "Sample Title 32",
        imageUrl: "https://picsum.photos/400/300?32",
        url: "2https://www.greenheck.com/products",
        date: "August 32th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "33",
        title: "Sample Title 33",
        imageUrl: "https://picsum.photos/400/300?33",
        url: "3https://www.greenheck.com/products",
        date: "August 33th 2024",
        issueNumber: "Issue #3",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "34",
        title: "Sample Title 34",
        imageUrl: "https://picsum.photos/400/300?34",
        url: "4https://www.greenheck.com/products",
        date: "August 34th 2024",
        issueNumber: "Issue #4",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "35",
        title: "Sample Title 35",
        imageUrl: "https://picsum.photos/400/300?35",
        url: "5https://www.greenheck.com/products",
        date: "August 35th 2024",
        issueNumber: "Issue #5",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "36",
        title: "Sample Title 36",
        imageUrl: "https://picsum.photos/400/300?36",
        url: "6https://www.greenheck.com/products",
        date: "August 36th 2024",
        issueNumber: "Issue #1",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "37",
        title: "Sample Title 37",
        imageUrl: "https://picsum.photos/400/300?37",
        url: "7https://www.greenheck.com/products",
        date: "August 37th 2024",
        issueNumber: "Issue #2",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "38",
        title: "Sample Title 38",
        imageUrl: "https://picsum.photos/400/300?38",
        url: "8https://www.greenheck.com/products",
        date: "August 38th 2024",
        issueNumber: "Issue #3",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "39",
        title: "Sample Title 39",
        imageUrl: "https://picsum.photos/400/300?39",
        url: "9https://www.greenheck.com/products",
        date: "August 39th 2024",
        issueNumber: "Issue #4",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "40",
        title: "Sample Title 40",
        imageUrl: "https://picsum.photos/400/300?40",
        url: "0https://www.greenheck.com/products",
        date: "August 40th 2024",
        issueNumber: "Issue #5",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "41",
        title: "Sample Title 41",
        imageUrl: "https://picsum.photos/400/300?41",
        url: "1https://www.greenheck.com/products",
        date: "August 41th 2024",
        issueNumber: "Issue #1",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "42",
        title: "Sample Title 42",
        imageUrl: "https://picsum.photos/400/300?42",
        url: "2https://www.greenheck.com/products",
        date: "August 42th 2024",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "43",
        title: "Sample Title 43",
        imageUrl: "https://picsum.photos/400/300?43",
        url: "3https://www.greenheck.com/products",
        date: "August 43th 2024",
        issueNumber: "Issue #3",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "44",
        title: "Sample Title 44",
        imageUrl: "https://picsum.photos/400/300?44",
        url: "4https://www.greenheck.com/products",
        date: "August 44th 2024",
        issueNumber: "Issue #4",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "45",
        title: "Sample Title 45",
        imageUrl: "https://picsum.photos/400/300?45",
        url: "5https://www.greenheck.com/products",
        date: "August 45th 2024",
        issueNumber: "Issue #5",
        productCategory: "Indoor Air Quality",
        topic: "Software",
        communication: "Bulletin"
      },
      {
        id: "46",
        title: "Sample Title 46",
        imageUrl: "https://picsum.photos/400/300?46",
        url: "6https://www.greenheck.com/products",
        date: "August 46th 2024",
        issueNumber: "Issue #1",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Rep Update"
      },
      {
        id: "47",
        title: "Sample Title 47",
        imageUrl: "https://picsum.photos/400/300?47",
        url: "7https://www.greenheck.com/products",
        date: "August 47th 2024",
        issueNumber: "Issue #2",
        productCategory: "Indoor Air Quality",
        topic: "RSQ",
        communication: "Bulletin"
      },
      {
        id: "48",
        title: "Sample Title 48",
        imageUrl: "https://picsum.photos/400/300?48",
        url: "8https://www.greenheck.com/products",
        date: "August 48th 2024",
        issueNumber: "Issue #3",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      },
      {
        id: "49",
        title: "Sample Title 49",
        imageUrl: "https://picsum.photos/400/300?49",
        url: "9https://www.greenheck.com/products",
        date: "August 49th 2024",
        issueNumber: "Issue #4",
        productCategory: "Indoor Air Quality",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "50",
        title: "Sample Title 50",
        imageUrl: "https://picsum.photos/400/300?50",
        url: "0https://www.greenheck.com/products",
        date: "August 50th 2024",
        issueNumber: "Issue #5",
        productCategory: "Louvers",
        topic: "RSQ",
        communication: "Rep Update"
      }
    ];

    this.dataService = new CommunicationDataService(this.data);
    this.filtersContainer = document.querySelector("#filters-container");
    this.searchContainer = document.querySelector("#search-container");
    this.cardsContainer = document.querySelector("#communications-container");
    this.countElement = document.querySelector("#communication-count");
    this.loadMoreButton = document.querySelector(".load-more");

    this.cardList = new CardListComponent(this.cardsContainer, this.countElement);

    this.initialize();
  }

  initialize() {
    // Create and render search component
    this.createSearchComponent();

    // Create and render filter components
    this.createFilters();

    // Initial render of cards
    this.updateDisplay();

    // Setup load more button
    this.setupLoadMoreButton();
  }

  createSearchComponent() {
    const searchComponent = new SearchComponent(
      this.searchContainer,
      this.handleSearch.bind(this),
      this.handleSuggestions.bind(this)
    );
    searchComponent.render();
  }

  createFilters() {
    const topics = this.dataService.getUniqueValues("topic");
    const productCategories = this.dataService.getUniqueValues("productCategory");
    const communicationTypes = this.dataService.getUniqueValues("communication");

    // Clear filters container
    this.filtersContainer.innerHTML = "";

    // Create filter components
    new FilterComponent(
      "Topics",
      topics,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();

    new FilterComponent(
      "Product Categories",
      productCategories,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();

    new FilterComponent(
      "Communication Type",
      communicationTypes,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();
  }

  handleFilterChange(filterType, value, isChecked) {
    this.dataService.updateFilter(filterType, value, isChecked);
    this.cardList.resetPagination();
    this.updateDisplay();
  }

  handleSearch(searchTerm) {
    this.dataService.updateSearch(searchTerm);
    this.cardList.resetPagination();
    this.updateDisplay();
  }

  handleSuggestions(prefix) {
    return this.dataService.getSuggestions(prefix);
  }

  updateDisplay() {
    const filteredData = this.dataService.getFilteredData();
    const totalCount = this.cardList.renderCards(filteredData);

    // Update load more button visibility
    if (this.loadMoreButton) {
      const shouldShowButton = totalCount > 0;
      this.loadMoreButton.style.display = shouldShowButton ? "block" : "none";

      if (this.cardList.isShowingAll || totalCount <= this.cardList.cardsPerPage) {
        this.loadMoreButton.textContent = "SHOW LESS";
      } else {
        this.loadMoreButton.textContent = "LOAD MORE";
      }
    }
  }

  setupLoadMoreButton() {
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener("click", () => {
        const isShowingAll = this.cardList.toggleShowAll();
        this.loadMoreButton.textContent = isShowingAll ? "SHOW LESS" : "LOAD MORE";
        this.updateDisplay();
      });
    }
  }
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CommunicationApp();
});
