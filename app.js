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
              <li ${index >= this.initialVisibleCount ? `class="hidden-option ${filterId}-hidden" style="display: none;"` : "flex"}>
                <input type="checkbox" id="${option.toLowerCase().replace(/\s+/g, "-")}" name="${filterId}">
                <label for="${option.toLowerCase().replace(/\s+/g, "-")}">${option}</label>
              </li>
            `
              )
              .join("")}
          </ul>
          ${
            hasMoreOptions
              ? `<button type="button" class="view-more" data-filter-type="${filterId}"><i class="fas fa-chevron-down"></i> View More</button>`
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
    const viewMoreBtn = document.querySelector(`#${filterId}-section .view-more`);
    if (viewMoreBtn) {
      viewMoreBtn.addEventListener("click", () => {
        const hiddenOptions = document.querySelectorAll(`.${filterId}-hidden`);
        const isShowingMore = viewMoreBtn.textContent.trim() === "View More";

        hiddenOptions.forEach(option => {
          option.style.display = isShowingMore ? "flex" : "none";
        });

        viewMoreBtn.innerHTML = isShowingMore
          ? "<i class='fas fa-chevron-up'></i> View Less"
          : "<i class='fas fa-chevron-down'></i> View More";
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
    this.selectedIndex = -1; // Track which suggestion is currently selected
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
      this.selectedIndex = -1; // Reset selected index when input changes

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

    // Handle keyboard navigation
    searchInput.addEventListener("keydown", e => {
      const suggestionItems = document.querySelectorAll(".suggestion-item");

      // If no suggestions are visible, don't do anything
      if (suggestionsContainer.style.display === "none" || suggestionItems.length === 0) {
        return;
      }

      // Handle Up Arrow
      if (e.key === "ArrowUp") {
        e.preventDefault(); // Prevent cursor from moving to beginning of input
        this.selectedIndex =
          this.selectedIndex <= 0 ? suggestionItems.length - 1 : this.selectedIndex - 1;
        this.highlightSuggestion(suggestionItems);
      }

      // Handle Down Arrow
      else if (e.key === "ArrowDown") {
        e.preventDefault(); // Prevent cursor from moving to end of input
        this.selectedIndex =
          this.selectedIndex >= suggestionItems.length - 1 ? 0 : this.selectedIndex + 1;
        this.highlightSuggestion(suggestionItems);
      }

      // Handle Enter key
      else if (e.key === "Enter") {
        // If a suggestion is selected, use that
        if (this.selectedIndex >= 0 && this.selectedIndex < suggestionItems.length) {
          e.preventDefault();
          searchInput.value = suggestionItems[this.selectedIndex].textContent;
          this.searchCallback(searchInput.value);
          suggestionsContainer.innerHTML = "";
          suggestionsContainer.style.display = "none";
        } else {
          // Otherwise perform search with current input value
          this.searchCallback(searchInput.value);
          suggestionsContainer.innerHTML = "";
          suggestionsContainer.style.display = "none";
        }
      }

      // Handle Escape key
      else if (e.key === "Escape") {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        searchInput.focus();
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

  highlightSuggestion(suggestionItems) {
    // Remove highlighting from all items
    suggestionItems.forEach(item => {
      item.classList.remove("selected");
    });

    // Add highlighting to selected item
    if (this.selectedIndex >= 0 && this.selectedIndex < suggestionItems.length) {
      suggestionItems[this.selectedIndex].classList.add("selected");
    }
  }

  renderSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById("search-suggestions");
    this.selectedIndex = -1; // Reset selection when rendering new suggestions

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
          class="product-card"
          data-id="${item.id}"
          data-topic="${item.topic}"
          data-product-category="${item.productCategory}"
          data-communication="${item.communication}"
        >
          <div class="product-image">
            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
          </div>
          <div class="product-info">
          <h3 class="product-title">${item.title}</h3>
            <div class="product-meta-body">
              <div class="product-meta-info">
                <time datetime="${item.date}">${this.formatDate(item.date)}</time>,
                <span class="issue-number">${item.issueNumber}</span>
              </div>
              <div class="product-category-info">
                <span>${item.productCategory}</span> |
                <span>${item.topic}</span>
              </div>
            </div>
            <div class="product-footer">
                <div class="product-meta">
                    <img src="./imgs/${item.communication.toLowerCase()}-icon.svg" alt="CAPS Update icon" class="communication-icon">
                    <span class="communication-type">${item.communication}</span>
                </div>
                <a href="${item.url}" class="prd-btn" aria-label="View ${item.title}"> VIEW </a>
            </div>
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
        title: "Models Sp-A50-90VG and SP A90-130-VG Production Pause",
        imageUrl: "https://picsum.photos/400/300?1",
        url: "https://www.greenheck.com/products",
        date: "2025-03-27",
        issueNumber: "Issue #2",
        productCategory: "Louvers",
        topic: "Diffusers",
        communication: "Bulletin"
      },
      {
        id: "2",
        title: "Energy Recovery Ventilators: Enhancing Indoor Air Quality",
        imageUrl: "https://picsum.photos/400/300?2",
        url: "https://www.greenheck.com/products/air-conditioning/energy-recovery-ventilators",
        date: "2025-03-15",
        issueNumber: "Issue #3",
        productCategory: "Energy Recovery Ventilators",
        topic: "Indoor Air Quality",
        communication: "Insights"
      },
      {
        id: "3",
        title: "Understanding Fan Energy Index (FEI) Standards",
        imageUrl: "https://picsum.photos/400/300?3",
        url: "https://www.greenheck.com/resources/education/fei",
        date: "2025-03-10",
        issueNumber: "Issue #4",
        productCategory: "Fans",
        topic: "Fan Energy Index",
        communication: "Bulletin"
      },
      {
        id: "4",
        title: "Fire and Smoke Dampers: Safety Measures in HVAC Systems",
        imageUrl: "https://picsum.photos/400/300?4",
        url: "https://www.greenheck.com/products/air-control/dampers/fire-smoke-dampers",
        date: "2025-03- 5",
        issueNumber: "Issue #5",
        productCategory: "Dampers",
        topic: "Fire and Smoke Dampers",
        communication: "Rep Update"
      },
      {
        id: "5",
        title: "Ventilation Strategies for Modern Buildings",
        imageUrl: "https://picsum.photos/400/300?5",
        url: "https://www.greenheck.com/resources/education/ventilation-strategies",
        date: "2025-03-20",
        issueNumber: "Issue #6",
        productCategory: "Dedicated Outdoor Air Systems (DOAS)",
        topic: "Ventilation Strategies",
        communication: "Insights"
      },
      {
        id: "6",
        title: "System Balancing: Ensuring Optimal HVAC Performance",
        imageUrl: "https://picsum.photos/400/300?6",
        url: "https://www.greenheck.com/resources/education/system-balancing",
        date: "2025-03-15",
        issueNumber: "Issue #7",
        productCategory: "Airflow Measurement",
        topic: "System Balancing",
        communication: "Bulletin"
      },
      {
        id: "7",
        title: "Sound and Vibration Control in HVAC Systems",
        imageUrl: "https://picsum.photos/400/300?7",
        url: "https://www.greenheck.com/resources/education/sound-vibration-control",
        date: "2025-03-10",
        issueNumber: "Issue #8",
        productCategory: "Fans",
        topic: "Sound and Vibration Control",
        communication: "Rep Update"
      },
      {
        id: "8",
        title: "Codes & Standards: Staying Compliant in HVAC Installations",
        imageUrl: "https://picsum.photos/400/300?8",
        url: "https://www.greenheck.com/resources/education/codes-standards",
        date: "2025-03- 5",
        issueNumber: "Issue #9",
        productCategory: "Louvers",
        topic: "Codes & Standards",
        communication: "Insights"
      },
      {
        id: "9",
        title: "Greenheck-India: Advancements in Air Control Products",
        imageUrl: "https://picsum.photos/400/300?9",
        url: "https://www.greenheck.com/products/greenheck-india",
        date: "2025-03- 1",
        issueNumber: "Issue #10",
        productCategory: "Greenheck-India",
        topic: "Air Control Products",
        communication: "Bulletin"
      },
      {
        id: "10",
        title: "Grilles, Registers & Diffusers: Enhancing Air Distribution",
        imageUrl: "https://picsum.photos/400/300?10",
        url: "https://www.greenheck.com/products/air-distribution/grd",
        date: "2025-03-25",
        issueNumber: "Issue #11",
        productCategory: "Grilles, Registers & Diffusers",
        topic: "Air Distribution",
        communication: "Rep Update"
      },
      {
        id: "11",
        title: "Air Terminal Units: Precision in Airflow Control",
        imageUrl: "https://picsum.photos/400/300?11",
        url: "https://www.greenheck.com/products/air-distribution/air-terminal-units",
        date: "2025-03-10",
        issueNumber: "Issue #12",
        productCategory: "Air Terminal Units",
        topic: "System Balancing",
        communication: "Insights"
      },
      {
        id: "12",
        title: "Make-Up Air Units: Maintaining Building Pressurization",
        imageUrl: "https://picsum.photos/400/300?12",
        url: "https://www.greenheck.com/products/air-conditioning/make-up-air-units",
        date: "2025-03-25",
        issueNumber: "Issue #13",
        productCategory: "Greenheck-IndiaMake-Up Air Units",
        topic: "Ventilation Strategies",
        communication: "Bulletin"
      },
      {
        id: "13",
        title: "Model GB-7 Belt Drive Centrifugal Roof Exhaust Fan",
        imageUrl: "https://picsum.photos/400/300?13",
        url: "https://www.greenheck.com/shop/browse-by-product-model/centrifugal-exhaust-fans/gb/gb-7",
        date: "2025-03-13",
        issueNumber: "Issue #13",
        productCategory: "Fans",
        topic: "Ventilation Strategies",
        communication: "Bulletin"
      },
      {
        id: "14",
        title: "SP and CSP Ceiling Exhaust Fans",
        imageUrl: "https://picsum.photos/400/300?14",
        url: "https://content.greenheck.com/public/DAMProd/Original/10002/SPCSP_catalog.pdf",
        date: "2025-03-14",
        issueNumber: "Issue #14",
        productCategory: "Fans",
        topic: "Indoor Air Quality",
        communication: "Insights"
      },
      {
        id: "15",
        title: "Inline Fans for Industrial Applications",
        imageUrl: "https://picsum.photos/400/300?15",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-15",
        issueNumber: "Issue #15",
        productCategory: "Fans",
        topic: "System Balancing",
        communication: "Rep Update"
      },
      {
        id: "16",
        title: "Overhead HVLS Fans for Large Spaces",
        imageUrl: "https://picsum.photos/400/300?16",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-16",
        issueNumber: "Issue #16",
        productCategory: "Fans",
        topic: "Energy Recovery Systems",
        communication: "Bulletin"
      },
      {
        id: "17",
        title: "Directional Destratification Fans",
        imageUrl: "https://picsum.photos/400/300?17",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-17",
        issueNumber: "Issue #17",
        productCategory: "Fans",
        topic: "Ventilation Strategies",
        communication: "CAPS Update"
      },
      {
        id: "18",
        title: "Wall Mounted Fans for Exhaust Applications",
        imageUrl: "https://picsum.photos/400/300?18",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-18",
        issueNumber: "Issue #18",
        productCategory: "Fans",
        topic: "Fire and Smoke Dampers",
        communication: "Insights"
      },
      {
        id: "19",
        title: "Blowers for High-Pressure Air Movement",
        imageUrl: "https://picsum.photos/400/300?19",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-19",
        issueNumber: "Issue #19",
        productCategory: "Fans",
        topic: "Sound and Vibration Control",
        communication: "Bulletin"
      },
      {
        id: "20",
        title: "Axial Condenser Fans for HVAC Systems",
        imageUrl: "https://picsum.photos/400/300?20",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-20",
        issueNumber: "Issue #20",
        productCategory: "Fans",
        topic: "Codes & Standards",
        communication: "Rep Update"
      },
      {
        id: "21",
        title: "Jet Fans for Parking Garage Ventilation",
        imageUrl: "https://picsum.photos/400/300?21",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-21",
        issueNumber: "Issue #21",
        productCategory: "Fans",
        topic: "Ventilation Strategies",
        communication: "CAPS Update"
      },
      {
        id: "22",
        title: "Ceiling Exhaust Fans for Quiet Operation",
        imageUrl: "https://picsum.photos/400/300?22",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-22",
        issueNumber: "Issue #22",
        productCategory: "Fans",
        topic: "Indoor Air Quality",
        communication: "Insights"
      },
      {
        id: "23",
        title: "Laboratory Exhaust Fans for Safety",
        imageUrl: "https://picsum.photos/400/300?23",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-23",
        issueNumber: "Issue #23",
        productCategory: "Fans",
        topic: "Fire and Smoke Dampers",
        communication: "Bulletin"
      },
      {
        id: "24",
        title: "Fume Exhaust Fans for Corrosive Environments",
        imageUrl: "https://picsum.photos/400/300?24",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-24",
        issueNumber: "Issue #24",
        productCategory: "Fans",
        topic: "Indoor Air Quality",
        communication: "Rep Update"
      },
      {
        id: "25",
        title: "Plenum Fans for HVAC Systems",
        imageUrl: "https://picsum.photos/400/300?25",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-25",
        issueNumber: "Issue #25",
        productCategory: "Fans",
        topic: "System Balancing",
        communication: "CAPS Update"
      },
      {
        id: "26",
        title: "Fan Arrays for Redundancy and Efficiency",
        imageUrl: "https://picsum.photos/400/300?26",
        url: "https://www.greenheck.com/products/air-movement/fans",
        date: "2025-03-26",
        issueNumber: "Issue #26",
        productCategory: "Fans",
        topic: "Energy Recovery Systems",
        communication: "Bulletin"
      },
      {
        id: "27",
        title: "Energy Recovery Ventilators for Efficient Ventilation",
        imageUrl: "https://picsum.photos/400/300?27",
        url: "https://www.greenheck.com/products/energy-recovery-ventilators",
        date: "2025-03-27",
        issueNumber: "Issue #27",
        productCategory: "Energy Recovery Ventilators",
        topic: "Energy Recovery Systems",
        communication: "Insights"
      },
      {
        id: "28",
        title: "Louvers for Enhanced Airflow and Protection",
        imageUrl: "https://picsum.photos/400/300?28",
        url: "https://www.greenheck.com/products/air-control/louvers",
        date: "2025-03-28",
        issueNumber: "Issue #28",
        productCategory: "Louvers",
        topic: "Ventilation Strategies",
        communication: "Rep Update"
      },
      {
        id: "29",
        title: "Dampers for Precise Airflow Control",
        imageUrl: "https://picsum.photos/400/300?29",
        url: "https://www.greenheck.com/products/air-control/dampers",
        date: "2025-03-29",
        issueNumber: "Issue #29",
        productCategory: "Dampers",
        topic: "System Balancing",
        communication: "CAPS Update"
      },
      {
        id: "30",
        title: "Grilles and Registers for Aesthetic Air Distribution",
        imageUrl: "https://picsum.photos/400/300?30",
        url: "https://www.greenheck.com/products/air-distribution/grilles-registers-diffusers",
        date: "2025-03-30",
        issueNumber: "Issue #30",
        productCategory: "Grilles, Registers & Diffusers",
        topic: "Indoor Air Quality",
        communication: "Bulletin"
      },
      {
        id: "31",
        title: "Air Terminal Units for Zonal Temperature Control",
        imageUrl: "https://picsum.photos/400/300?31",
        url: "https://www.greenheck.com/products/air-distribution/air-terminal-units",
        date: "2025-03-31",
        issueNumber: "Issue #31",
        productCategory: "Air Terminal Units",
        topic: "Codes & Standards",
        communication: "Insights"
      },
      {
        id: "32",
        title: "Make-Up Air Units for Balanced Ventilation",
        imageUrl: "https://picsum.photos/400/300?32",
        url: "https://www.greenheck.com/products/air-conditioning/make-up-air",
        date: "2025-03- 1",
        issueNumber: "Issue #32",
        productCategory: "Make-Up Air Units",
        topic: "Ventilation Strategies",
        communication: "Rep Update"
      },
      {
        id: "33",
        title: "Dedicated Outdoor Air Systems for Fresh Air Supply",
        imageUrl: "https://picsum.photos/400/300?33",
        url: "https://www.greenheck.com/products/air-conditioning/dedicated-outdoor-air-systems",
        date: "2025-03- 2",
        issueNumber: "Issue #33",
        productCategory: "Dedicated Outdoor Air Systems (DOAS)",
        topic: "Indoor Air Quality",
        communication: "CAPS Update"
      },
      {
        id: "34",
        title: "Duct Heaters for Efficient Air Heating",
        imageUrl: "https://picsum.photos/400/300?34",
        url: "https://www.greenheck.com/products/air-conditioning/duct-heaters",
        date: "2025-03- 3",
        issueNumber: "Issue #34",
        productCategory: "Duct Heaters",
        topic: "Codes & Standards",
        communication: "Bulletin"
      },
      {
        id: "35",
        title: "Gravity Ventilators for Passive Airflow",
        imageUrl: "https://picsum.photos/400/300?35",
        url: "https://www.greenheck.com/products/air-control/gravity-ventilators",
        date: "2025-03- 4",
        issueNumber: "Issue #35",
        productCategory: "Gravity Ventilators",
        topic: "Ventilation Strategies",
        communication: "Insights"
      },
      {
        id: "36",
        title: "Airflow Measurement Devices for Accurate Monitoring",
        imageUrl: "https://picsum.photos/400/300?36",
        url: "https://www.greenheck.com/products/controls/airflow-measurement",
        date: "2025-03- 5",
        issueNumber: "Issue #36",
        productCategory: "Airflow Measurement",
        topic: "System Balancing",
        communication: "Rep Update"
      },
      {
        id: "37",
        title: "Curbs and Mounting Accessories for Secure Installations",
        imageUrl: "https://picsum.photos/400/300?37",
        url: "https://www.greenheck.com/products/air-control/curbs-mounting-accessories",
        date: "2025-03- 6",
        issueNumber: "Issue #37",
        productCategory: "Curbs & Mounting Accessories",
        topic: "Codes & Standards",
        communication: "CAPS Update"
      },
      {
        id: "38",
        title: "Motor Starters for Reliable Fan Operation",
        imageUrl: "https://picsum.photos/400/300?38",
        url: "https://www.greenheck.com/products/controls/motor-starters",
        date: "2025-03- 7",
        issueNumber: "Issue #38",
        productCategory: "Motor Starters",
        topic: "Fan Energy Index",
        communication: "Bulletin"
      },
      {
        id: "39",
        title: "High-Efficiency Air Terminal Units for Large Spaces",
        imageUrl: "https://picsum.photos/400/300?39",
        url: "https://www.greenheck.com/products",
        date: "2025-03- 9",
        issueNumber: "Issue #39",
        productCategory: "Air Terminal Units",
        topic: "System Balancing",
        communication: "Insights"
      },
      {
        id: "40",
        title: "Upgraded Vari-Green® Motor Drives for Enhanced Performance",
        imageUrl: "https://picsum.photos/400/300?40",
        url: "https://www.greenheck.com/products",
        date: "2025-03-10",
        issueNumber: "Issue #40",
        productCategory: "Vari-Green® Controls, Motors, and Drives",
        topic: "Energy Recovery Systems",
        communication: "Bulletin"
      },
      {
        id: "41",
        title: "New Fire-Rated Louvers for High-Security Applications",
        imageUrl: "https://picsum.photos/400/300?41",
        url: "https://www.greenheck.com/products",
        date: "2025-03-11",
        issueNumber: "Issue #41",
        productCategory: "Louvers",
        topic: "Fire and Smoke Dampers",
        communication: "CAPS Update"
      },
      {
        id: "42",
        title: "Innovative Sound and Vibration Control Techniques",
        imageUrl: "https://picsum.photos/400/300?42",
        url: "https://www.greenheck.com/products",
        date: "2025-03-12",
        issueNumber: "Issue #42",
        productCategory: "Dampers",
        topic: "Sound and Vibration Control",
        communication: "Rep Update"
      },
      {
        id: "43",
        title: "Efficient Energy Recovery Ventilators for Modern Buildings",
        imageUrl: "https://picsum.photos/400/300?43",
        url: "https://www.greenheck.com/products",
        date: "2025-03-13",
        issueNumber: "Issue #43",
        productCategory: "Energy Recovery Ventilators",
        topic: "Energy Recovery Systems",
        communication: "Insights"
      },
      {
        id: "44",
        title: "Optimized Kitchen Ventilation Systems for Commercial Use",
        imageUrl: "https://picsum.photos/400/300?44",
        url: "https://www.greenheck.com/products",
        date: "2025-03-14",
        issueNumber: "Issue #44",
        productCategory: "Kitchen Ventilation Systems",
        topic: "Ventilation Strategies",
        communication: "Bulletin"
      },
      {
        id: "45",
        title: "Enhanced Airflow Measurement Tools for Accurate Readings",
        imageUrl: "https://picsum.photos/400/300?45",
        url: "https://www.greenheck.com/products",
        date: "2025-03-15",
        issueNumber: "Issue #45",
        productCategory: "Airflow Measurement",
        topic: "Codes & Standards",
        communication: "CAPS Update"
      },
      {
        id: "46",
        title: "Dedicated Outdoor Air Systems for Large Facilities",
        imageUrl: "https://picsum.photos/400/300?46",
        url: "https://www.greenheck.com/products",
        date: "2025-03-16",
        issueNumber: "Issue #46",
        productCategory: "Dedicated Outdoor Air Systems (DOAS)",
        topic: "Indoor Air Quality",
        communication: "Rep Update"
      },
      {
        id: "47",
        title: "Advanced Motor Starters for HVAC Applications",
        imageUrl: "https://picsum.photos/400/300?47",
        url: "https://www.greenheck.com/products",
        date: "2025-03-17",
        issueNumber: "Issue #47",
        productCategory: "Motor Starters",
        topic: "Fan Energy Index",
        communication: "Insights"
      },
      {
        id: "48",
        title: "State-of-the-Art Gravity Ventilators for Optimal Airflow",
        imageUrl: "https://picsum.photos/400/300?48",
        url: "https://www.greenheck.com/products",
        date: "2025-03-18",
        issueNumber: "Issue #48",
        productCategory: "Gravity Ventilators",
        topic: "System Balancing",
        communication: "Bulletin"
      },
      {
        id: "49",
        title: "New Duct Heaters for Energy-Efficient Heating Solutions",
        imageUrl: "https://picsum.photos/400/300?49",
        url: "https://www.greenheck.com/products",
        date: "2025-03-19",
        issueNumber: "Issue #49",
        productCategory: "Duct Heaters",
        topic: "Energy Recovery Systems",
        communication: "CAPS Update"
      },
      {
        id: "50",
        title: "Greenheck-India's Latest Air Control Products",
        imageUrl: "https://picsum.photos/400/300?50",
        url: "https://www.greenheck.com/products",
        date: "2025-03-20",
        issueNumber: "Issue #50",
        productCategory: "Greenheck-India",
        topic: "Codes & Standards",
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
