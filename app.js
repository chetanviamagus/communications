// Search index service - responsible for indexing and searching data
class SearchIndexService {
  constructor(data, indexSummary = false) {
    this.data = data;
    this.titleIndex = new Map();
    this.summaryIndex = new Map();
    this.indexSummary = indexSummary;
    this.indexData();
  }

  indexData() {
    // Create an index of words to items for faster search
    this.data.forEach(item => {
      // Index title
      const titleWords = item.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (!this.titleIndex.has(word)) {
          this.titleIndex.set(word, []);
        }
        if (!this.titleIndex.get(word).includes(item)) {
          this.titleIndex.get(word).push(item);
        }
      });

      // Index summary if enabled and it exists
      if (this.indexSummary && item.summary) {
        const summaryWords = item.summary.toLowerCase().split(/\s+/);
        summaryWords.forEach(word => {
          if (!this.summaryIndex.has(word)) {
            this.summaryIndex.set(word, []);
          }
          if (!this.summaryIndex.get(word).includes(item)) {
            this.summaryIndex.get(word).push(item);
          }
        });
      }
    });
  }

  search(query) {
    if (!query || query.trim() === "") {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results = new Set();

    // Search in titles
    this.titleIndex.forEach((items, word) => {
      if (word.includes(searchTerm)) {
        items.forEach(item => results.add(item));
      }
    });

    // Search in summaries if enabled
    if (this.indexSummary) {
      this.summaryIndex.forEach((items, word) => {
        if (word.includes(searchTerm)) {
          items.forEach(item => results.add(item));
        }
      });
    }

    return Array.from(results);
  }

  getSuggestions(prefix, limit = 5) {
    if (!prefix || prefix.trim() === "") {
      return [];
    }

    const searchTerm = prefix.toLowerCase().trim();
    const suggestions = new Set();

    // Get title suggestions
    this.titleIndex.forEach((_, word) => {
      if (word.startsWith(searchTerm)) {
        // Remove colon from the suggestion
        const cleanWord = word.replace(/:/g, "");
        suggestions.add(cleanWord);
      }
    });

    // Get summary suggestions if enabled
    if (this.indexSummary) {
      this.summaryIndex.forEach((_, word) => {
        if (word.startsWith(searchTerm)) {
          // Remove colon from the suggestion
          const cleanWord = word.replace(/:/g, "");
          suggestions.add(cleanWord);
        }
      });
    }

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
      "communication-type": [],
      timeframe: "All Time"
    };
    this.searchTerm = "";
    this.searchIndex = new SearchIndexService(rawData);
    this.timeframes = [
      "All Time",
      "Last Year",
      "Last 9 Months",
      "Last 6 Months",
      "Last 3 Months",
      "Last Month",
      "Last Week"
    ];
    this.sortOrder = "newest"; // Default sort order
  }

  getUniqueValues(property) {
    // Handle array properties
    if (property === "topic" || property === "productCategory") {
      const allValues = new Set();
      this.data.forEach(item => {
        if (Array.isArray(item[property])) {
          item[property].forEach(value => allValues.add(value));
        }
      });
      return Array.from(allValues);
    }
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

  getTimeframes() {
    return this.timeframes;
  }

  setSortOrder(order) {
    this.sortOrder = order;
    this.applyFilters();
  }

  applyFilters() {
    // Start with all data
    let result = [...this.data];

    // Apply timeframe filter first
    if (this.activeFilters.timeframe !== "All Time") {
      const now = new Date();
      const filterDate = new Date();

      switch (this.activeFilters.timeframe) {
        case "Last Week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "Last Month":
          filterDate.setMonth(now.getMonth() - 1);
          filterDate.setDate(now.getDate());
          break;
        case "Last 3 Months":
          filterDate.setMonth(now.getMonth() - 3);
          filterDate.setDate(now.getDate());
          break;
        case "Last 6 Months":
          filterDate.setMonth(now.getMonth() - 6);
          filterDate.setDate(now.getDate());
          break;
        case "Last 9 Months":
          filterDate.setMonth(now.getMonth() - 9);
          filterDate.setDate(now.getDate());
          break;
        case "Last Year":
          filterDate.setFullYear(now.getFullYear() - 1);
          filterDate.setDate(now.getDate());
          break;
      }

      result = result.filter(item => {
        // Parse the ISO date string (YYYY-MM-DD)
        const itemDate = new Date(item.date);

        // Set times to midnight for accurate day comparison
        const compareDate = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate()
        );
        const compareFilterDate = new Date(
          filterDate.getFullYear(),
          filterDate.getMonth(),
          filterDate.getDate()
        );
        const compareNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // For future dates, use the item's date as the reference point
        if (compareDate > compareNow) {
          const futureFilterDate = new Date(itemDate);
          switch (this.activeFilters.timeframe) {
            case "Last Week":
              futureFilterDate.setDate(itemDate.getDate() - 7);
              break;
            case "Last Month":
              futureFilterDate.setMonth(itemDate.getMonth() - 1);
              break;
            case "Last 3 Months":
              futureFilterDate.setMonth(itemDate.getMonth() - 3);
              break;
            case "Last 6 Months":
              futureFilterDate.setMonth(itemDate.getMonth() - 6);
              break;
            case "Last 9 Months":
              futureFilterDate.setMonth(itemDate.getMonth() - 9);
              break;
            case "Last Year":
              futureFilterDate.setFullYear(itemDate.getFullYear() - 1);
              break;
          }
          return compareDate >= futureFilterDate;
        }

        // For past dates, use the current date as the reference point
        return compareDate >= compareFilterDate && compareDate <= compareNow;
      });
    }

    // Apply search if there is a search term
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      const searchResults = this.searchIndex.search(this.searchTerm);
      result = result.filter(item => searchResults.includes(item));
    }

    // Apply other category filters
    const activeFilterTypes = Object.entries(this.activeFilters).filter(
      ([type, values]) => type !== "timeframe" && values.length > 0
    );

    if (activeFilterTypes.length > 0) {
      result = result.filter(item => {
        return activeFilterTypes.every(([filterType, selectedValues]) => {
          let itemProperty;
          switch (filterType) {
            case "topics":
              itemProperty = item.topic;
              break;
            case "product-categories":
              itemProperty = item.productCategory;
              break;
            case "communication-type":
              itemProperty = item.communicationType;
              break;
          }

          if (Array.isArray(itemProperty)) {
            return selectedValues.some(value => itemProperty.includes(value));
          }
          return selectedValues.includes(itemProperty);
        });
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return this.sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    this.filteredData = result;
  }

  getFilteredData() {
    return this.filteredData;
  }

  convertToISO(dateString) {
    // If it's already in ISO format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateString;
    }

    // Try different date formats
    const formats = [
      // Month Day, Year (e.g., "February 5, 2025")
      /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/,
      // Day Month Year (e.g., "5 February 2025")
      /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
      // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;

        if (format === formats[0]) {
          // Month Day, Year
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          month = (monthNames.indexOf(match[1]) + 1).toString().padStart(2, "0");
          day = match[2].padStart(2, "0");
          year = match[3];
        } else if (format === formats[1]) {
          // Day Month Year
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          month = (monthNames.indexOf(match[2]) + 1).toString().padStart(2, "0");
          day = match[1].padStart(2, "0");
          year = match[3];
        } else if (format === formats[2]) {
          // MM/DD/YYYY or DD/MM/YYYY
          // Try both formats
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
            month = (date.getMonth() + 1).toString().padStart(2, "0");
            day = date.getDate().toString().padStart(2, "0");
          } else {
            continue;
          }
        } else if (format === formats[3]) {
          // YYYY/MM/DD
          year = match[1];
          month = match[2].padStart(2, "0");
          day = match[3].padStart(2, "0");
        }

        return `${year}-${month}-${day}`;
      }
    }

    // If no format matches, return the original string
    return dateString;
  }

  getActiveFilters() {
    const filters = [];

    // Add non-timeframe filters
    Object.entries(this.activeFilters).forEach(([type, values]) => {
      if (type !== "timeframe" && Array.isArray(values)) {
        values.forEach(value => {
          filters.push({
            type,
            value,
            displayValue: value
          });
        });
      }
    });

    // Add timeframe filter if it's not "All Time"
    if (this.activeFilters.timeframe !== "All Time") {
      filters.push({
        type: "timeframe",
        value: this.activeFilters.timeframe,
        displayValue: this.activeFilters.timeframe
      });
    }

    return filters;
  }

  removeFilter(type, value) {
    if (type === "timeframe") {
      this.activeFilters.timeframe = "All Time";
    } else {
      const index = this.activeFilters[type].indexOf(value);
      if (index !== -1) {
        this.activeFilters[type].splice(index, 1);
      }
    }
    this.applyFilters();
  }
}

// UI Components - responsible for rendering and UI interactions
class FilterComponent {
  constructor(filterType, options, container, changeCallback, filterStyle = "checkbox") {
    this.filterType = filterType;
    this.options = options || [];
    this.container = container;
    this.changeCallback = changeCallback;
    this.filterStyle = filterStyle; // 'checkbox' or 'dropdown'
    this.initialVisibleCount = 2;
  }

  render() {
    const filterId = this.filterType.toLowerCase().replace(/\s+/g, "-");

    let filterHTML;
    if (this.filterStyle === "dropdown") {
      filterHTML = `
        <section class="filter-section" id="${filterId}-section">
          <h2>${this.filterType}</h2>
          <select class="filter-dropdown" id="${filterId}-select">
            ${this.options.map(option => `<option value="${option}">${option}</option>`).join("")}
          </select>
        </section>
      `;
    } else {
      // Existing checkbox filter HTML
      const hasMoreOptions = this.options.length > this.initialVisibleCount;
      filterHTML = `
        <section class="filter-section" id="${filterId}-section">
          <h2>${this.filterType}</h2>
          <ul class="filter-list" role="group" aria-label="${this.filterType} filters">
            ${this.options
              .filter(option => option)
              .map(
                (option, index) => `
                <li ${index >= this.initialVisibleCount ? `class="hidden-option ${filterId}-hidden" style="display: none;"` : 'class="flex"'}>
                  <input type="checkbox" id="${String(option).toLowerCase().replace(/\s+/g, "-")}" name="${filterId}">
                  <label for="${String(option).toLowerCase().replace(/\s+/g, "-")}">${option}</label>
                </li>
              `
              )
              .join("")}
          </ul>
          ${
            hasMoreOptions
              ? `<button type="button" class="view-more" data-filter-type="${filterId}">
              <i class="fas fa-chevron-down"></i> View More
            </button>`
              : ""
          }
        </section>
      `;
    }

    this.container.insertAdjacentHTML("beforeend", filterHTML);
    this.attachEventListeners();
  }

  attachEventListeners() {
    const filterId = this.filterType.toLowerCase().replace(/\s+/g, "-");

    if (this.filterStyle === "dropdown") {
      const select = document.getElementById(`${filterId}-select`);

      // Set initial value if it's the timeframe dropdown
      if (filterId === "timeframe" && this.options.includes("All Time")) {
        select.value = "All Time";
      }

      select.addEventListener("change", e => {
        this.changeCallback(filterId, e.target.value);
      });
    } else {
      // Existing checkbox event listeners
      document.querySelectorAll(`#${filterId}-section input[type="checkbox"]`).forEach(checkbox => {
        checkbox.addEventListener("change", () => {
          const value = checkbox.nextElementSibling.textContent.trim();
          this.changeCallback(filterId, value, checkbox.checked);
        });
      });

      const viewMoreBtn = document.querySelector(`#${filterId}-section .view-more`);
      if (viewMoreBtn) {
        viewMoreBtn.addEventListener("click", () => {
          const hiddenOptions = document.querySelectorAll(`.${filterId}-hidden`);
          const isShowingMore = viewMoreBtn.textContent.includes("View More");

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

  getIconPath(communicationType) {
    switch (communicationType.toLowerCase()) {
      case "bulletin":
        return "./imgs/bulletin-icon.svg";
      case "caps update":
        return "./imgs/caps-update-icon.svg";
      case "insights":
        return "./imgs/insights-icon.svg";
      case "rep update":
        return "./imgs/rep-update-icon.svg";
      default:
        return "./imgs/bulletin-icon.svg"; // Default icon for unknown types
    }
  }

  convertToISO(dateString) {
    // If it's already in ISO format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateString;
    }

    // Try different date formats
    const formats = [
      // Month Day, Year (e.g., "February 5, 2025")
      /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/,
      // Day Month Year (e.g., "5 February 2025")
      /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
      // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;

        if (format === formats[0]) {
          // Month Day, Year
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          month = (monthNames.indexOf(match[1]) + 1).toString().padStart(2, "0");
          day = match[2].padStart(2, "0");
          year = match[3];
        } else if (format === formats[1]) {
          // Day Month Year
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ];
          month = (monthNames.indexOf(match[2]) + 1).toString().padStart(2, "0");
          day = match[1].padStart(2, "0");
          year = match[3];
        } else if (format === formats[2]) {
          // MM/DD/YYYY or DD/MM/YYYY
          // Try both formats
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
            month = (date.getMonth() + 1).toString().padStart(2, "0");
            day = date.getDate().toString().padStart(2, "0");
          } else {
            continue;
          }
        } else if (format === formats[3]) {
          // YYYY/MM/DD
          year = match[1];
          month = match[2].padStart(2, "0");
          day = match[3].padStart(2, "0");
        }

        return `${year}-${month}-${day}`;
      }
    }

    // If no format matches, return the original string
    return dateString;
  }

  formatDate(dateString) {
    const isoDate = this.convertToISO(dateString);
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      return dateString; // Return original if conversion failed
    }

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
          data-id="${item.id || ""}"
          data-topic="${Array.isArray(item.topic) ? item.topic.join(",") : item.topic}"
          data-product-category="${Array.isArray(item.productCategory) ? item.productCategory.join(",") : item.productCategory}"
          data-communication="${item.communicationType}"
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
                <span>${Array.isArray(item.productCategory) ? item.productCategory.join(", ") : item.productCategory}</span> |
                <span>${Array.isArray(item.topic) ? item.topic.join(", ") : item.topic}</span>
              </div>
            </div>
            <div class="product-footer">
              <div class="product-meta">
                <img src="${this.getIconPath(item.communicationType)}" alt="${item.communicationType} icon" class="communication-icon">
                <span class="communication-type">${item.communicationType}</span>
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
    // Get current date for relative date calculations
    const now = new Date();

    // Calculate dates for each timeframe
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(now.getDate() - 3); // 3 days ago (within last week)

    const lastMonthDate = new Date(now);
    lastMonthDate.setDate(now.getDate() - 20); // 20 days ago (within last month)

    const last3MonthsDate = new Date(now);
    last3MonthsDate.setMonth(now.getMonth() - 2); // 2 months ago (within last 3 months)

    const last6MonthsDate = new Date(now);
    last6MonthsDate.setMonth(now.getMonth() - 5); // 5 months ago (within last 6 months)

    const last9MonthsDate = new Date(now);
    last9MonthsDate.setMonth(now.getMonth() - 8); // 8 months ago (within last 9 months)

    const lastYearDate = new Date(now);
    lastYearDate.setMonth(now.getMonth() - 11); // 11 months ago (within last year)

    this.data = [
      {
        title: "Motor Application Guide for Ventilation Products",
        communicationType: "Technical Guide",
        summary:
          "Comprehensive guide for selecting proper motors to prevent common fan application issues",
        issueNumber: "Issue# GH-2025-01",
        AuthorName: "Greenheck Engineering Team",
        date: "2025-03-15",
        url: "https://www.greenheck.com/resources/motor-application-guide",
        topic: ["HVAC Engineering", "Fan Design"],
        productCategory: ["Fans", "Motors"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["Motors", "Application Guide", "HVAC"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Ceiling Radiation Dampers: 2025 Compliance Update",
        communicationType: "Regulatory Bulletin",
        summary: "Latest updates on UL and IBC requirements for ceiling radiation dampers",
        issueNumber: "Issue# GH-2025-02",
        AuthorName: "Regulatory Compliance Team",
        date: "2025-03-10",
        url: "https://www.greenheck.com/resources/damper-compliance-2025",
        topic: ["Life Safety", "Building Codes"],
        productCategory: ["Dampers", "Fire Protection"],
        Category: [
          {
            Id: "reg-002",
            Title: "Compliance Updates"
          }
        ],
        Tags: ["UL", "IBC", "Fire Safety"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "AFL-601 Louver Nominated for CSE Product of the Year",
        communicationType: "Award Announcement",
        summary: "Our wind-driven rain louver recognized in Consulting-Specifying Engineer awards",
        issueNumber: "Issue# GH-2025-03",
        AuthorName: "Marketing Communications",
        date: "2025-02-28",
        url: "https://www.greenheck.com/news/afl-601-nomination",
        topic: ["Product Recognition", "Industry Awards"],
        productCategory: ["Louvers", "FEMA Products"],
        Category: [
          {
            Id: "news-003",
            Title: "Company News"
          }
        ],
        Tags: ["Awards", "HVAC", "FEMA"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Fan Energy Index State Adoption Tracker",
        communicationType: "Regulatory Update",
        summary: "Interactive map showing FEI requirements by state with compliance resources",
        issueNumber: "Issue# GH-2025-04",
        AuthorName: "Energy Compliance Team",
        date: "2025-02-20",
        url: "https://www.greenheck.com/resources/fei-tracker",
        topic: ["Energy Codes", "Compliance"],
        productCategory: ["Fans", "Regulatory Updates"],
        Category: [
          {
            Id: "reg-002",
            Title: "Compliance Updates"
          }
        ],
        Tags: ["ASHRAE 90.1", "FEI", "Energy Codes"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "VFD Overspeeding Technical White Paper",
        communicationType: "Technical Report",
        summary: "Research findings on the benefits of overspeeding with variable frequency drives",
        issueNumber: "Issue# GH-2025-05",
        AuthorName: "Dr. Robert Henderson",
        date: "2025-02-15",
        url: "https://www.greenheck.com/resources/vfd-overspeeding",
        topic: ["Motor Control", "Technical Research"],
        productCategory: ["VFDs", "Fan Motors"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["Engineering", "HVAC", "Motors"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "eCAPS 5.2 Release Notes",
        communicationType: "Software Update",
        summary: "New FEI calculation tools and enhanced fan selection capabilities",
        issueNumber: "Issue# GH-2025-06",
        AuthorName: "Software Development Team",
        date: "2025-02-10",
        url: "https://www.greenheck.com/resources/ecaps-5.2",
        topic: ["Software Tools", "Energy Compliance"],
        productCategory: ["Selection Software", "Fans"],
        Category: [
          {
            Id: "soft-004",
            Title: "Software Updates"
          }
        ],
        Tags: ["eCAPS", "FEI", "ASHRAE"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "FEI Application Guide 2025 Edition",
        communicationType: "Technical Guide",
        summary: "Complete reference for Fan Energy Index calculations and selection methodology",
        issueNumber: "Issue# GH-2025-07",
        AuthorName: "Energy Efficiency Team",
        date: "2025-02-05",
        url: "https://www.greenheck.com/resources/fei-guide",
        topic: ["Technical Research", "Engineering Resources"],
        productCategory: ["Technical Guides", "Fans"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["FEI", "AMCA", "Energy Savings"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Understanding Fan Energy Index (Webinar Recap)",
        communicationType: "Educational Resource",
        summary: "Recording and slides from our popular FEI educational webinar",
        issueNumber: "Issue# GH-2025-08",
        AuthorName: "Educational Outreach",
        date: "2025-01-30",
        url: "https://www.greenheck.com/resources/fei-webinar",
        topic: ["Educational Content", "HVAC Basics"],
        productCategory: ["Educational Resources", "Fans"],
        Category: [
          {
            Id: "edu-005",
            Title: "Educational Content"
          }
        ],
        Tags: ["FEI", "ASHRAE", "AHRI"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "2025 Engineers Week Spotlight: Jordan Locher",
        communicationType: "Employee Feature",
        summary: "Celebrating our engineers during National Engineers Week 2025",
        issueNumber: "Issue# GH-2025-09",
        AuthorName: "HR Communications",
        date: "2025-02-18",
        url: "https://www.greenheck.com/careers/engineer-spotlight",
        topic: ["Engineering", "Company Culture"],
        productCategory: [],
        Category: [
          {
            Id: "news-003",
            Title: "Company News"
          }
        ],
        Tags: ["Eweek2025", "Engineering", "Design"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Vari-Green Drive Technology Update",
        communicationType: "Product Update",
        summary: "Next-generation energy saving technology for ventilation systems",
        issueNumber: "Issue# GH-2025-15",
        AuthorName: "Product Development",
        date: "2025-01-25",
        url: "https://www.greenheck.com/products/vari-green-update",
        topic: ["Energy Efficiency", "Product Innovation"],
        productCategory: ["Drives", "Energy Saving Products"],
        Category: [
          {
            Id: "prod-006",
            Title: "Product Updates"
          }
        ],
        Tags: ["VFD", "Motors", "Energy Savings"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "New AER Sidewall Propeller Fan Launch",
        communicationType: "Product Launch",
        summary:
          "Introducing our most advanced small direct drive fan with 15% efficiency improvement",
        issueNumber: "Issue# GH-2025-11",
        AuthorName: "Product Development Team",
        date: "2025-01-20",
        url: "https://www.greenheck.com/products/aer-fan",
        topic: ["Product Innovation", "Fan Technology"],
        productCategory: ["Propeller Fans", "Direct Drive Fans"],
        Category: [
          {
            Id: "prod-006",
            Title: "Product Updates"
          }
        ],
        Tags: ["Innovation", "HVAC", "Fans"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "EQD Mixed Flow Fan with Vari-Green Motor",
        communicationType: "Product Bulletin",
        summary: "New energy-saving model featuring patent-pending octagonal housing design",
        issueNumber: "Issue# GH-2025-12",
        AuthorName: "Engineering Department",
        date: "2025-01-15",
        url: "https://www.greenheck.com/products/eqd-mixed-flow",
        topic: ["Product Innovation", "Energy Efficiency"],
        productCategory: ["Inline Fans", "Mixed Flow Fans"],
        Category: [
          {
            Id: "prod-006",
            Title: "Product Updates"
          }
        ],
        Tags: ["Direct Drive", "Energy Efficient", "HVAC"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Global Manufacturing Expansion Update Q1 2025",
        communicationType: "Corporate Update",
        summary: "Progress report on new facilities in Wisconsin, North Carolina, Mexico and India",
        issueNumber: "Issue# GH-2025-13",
        AuthorName: "Corporate Communications",
        date: "2025-01-10",
        url: "https://www.greenheck.com/about/expansion",
        topic: ["Company Growth", "Manufacturing"],
        productCategory: [],
        Category: [
          {
            Id: "corp-007",
            Title: "Corporate News"
          }
        ],
        Tags: ["Global", "Manufacturing", "Expansion"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Schofield Facility Community Impact Report",
        communicationType: "Community Update",
        summary: "2024 annual review of local partnerships and workforce development initiatives",
        issueNumber: "Issue# GH-2025-14",
        AuthorName: "Community Relations",
        date: "2025-01-05",
        url: "https://www.greenheck.com/community/schofield",
        topic: ["Community Engagement", "Corporate Responsibility"],
        productCategory: [],
        Category: [
          {
            Id: "corp-007",
            Title: "Corporate News"
          }
        ],
        Tags: ["Wisconsin", "Community", "Partnerships"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Fire Damper Installation Best Practices",
        communicationType: "Technical Bulletin",
        summary: "Updated guidelines for proper fire damper installation per 2025 IBC requirements",
        issueNumber: "Issue# GH-2025-15",
        AuthorName: "Technical Services",
        date: "2024-12-15",
        url: "https://www.greenheck.com/resources/fire-damper-install",
        topic: ["Life Safety", "Installation Guidelines"],
        productCategory: ["Fire Dampers", "Building Safety"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["UL", "IBC", "Fire Protection"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Energy Recovery Ventilator Maintenance Guide",
        communicationType: "Technical Manual",
        summary: "Comprehensive maintenance procedures for maximizing ERV system performance",
        issueNumber: "Issue# GH-2025-16",
        AuthorName: "Technical Publications",
        date: "2024-12-10",
        url: "https://www.greenheck.com/resources/erv-maintenance",
        topic: ["Preventive Maintenance"],
        productCategory: ["ERVs", "Ventilation Systems"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["Maintenance", "Filters", "Heat Exchangers"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Commercial Kitchen Ventilation Design Webinar",
        communicationType: "Educational Event",
        summary: "Recording available: Best practices for commercial kitchen HVAC system design",
        issueNumber: "Issue# GH-2025-17",
        AuthorName: "Educational Services",
        date: "2024-12-05",
        url: "https://www.greenheck.com/resources/kitchen-vent-webinar",
        topic: ["Commercial Kitchens", "Ventilation Design"],
        productCategory: ["Kitchen Hoods", "Exhaust Systems"],
        Category: [
          {
            Id: "edu-005",
            Title: "Educational Content"
          }
        ],
        Tags: ["NFPA 96", "Design", "Webinar"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "2025 ASHRAE Winter Conference Recap",
        communicationType: "Event Summary",
        summary: "Key takeaways from new research presented at ASHRAE's annual winter meeting",
        issueNumber: "Issue# GH-2025-18",
        AuthorName: "Technical Marketing",
        date: "2024-11-30",
        url: "https://www.greenheck.com/news/ashrae-2025-recap",
        topic: ["Industry Events", "Research Updates"],
        productCategory: [],
        Category: [
          {
            Id: "news-003",
            Title: "Company News"
          }
        ],
        Tags: ["ASHRAE", "Conference", "Research"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Laboratory Exhaust System Case Study",
        communicationType: "Application Note",
        summary: "University research lab retrofit with energy-saving exhaust system design",
        issueNumber: "Issue# GH-2025-19",
        AuthorName: "Applications Engineering",
        date: "2024-11-20",
        url: "https://www.greenheck.com/resources/lab-exhaust-case-study",
        topic: ["Case Studies", "Laboratory Ventilation"],
        productCategory: ["Lab Exhaust", "Energy Recovery"],
        Category: [
          {
            Id: "app-008",
            Title: "Application Notes"
          }
        ],
        Tags: ["University", "Retrofit", "Energy Savings"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "New UL Listing for Smoke Damper Series",
        communicationType: "Certification Update",
        summary: "Five new models added to UL 555S listed smoke damper product line",
        issueNumber: "Issue# GH-2025-20",
        AuthorName: "Regulatory Affairs",
        date: "2024-11-15",
        url: "https://www.greenheck.com/products/smoke-dampers-ul",
        topic: ["Certifications", "Life Safety"],
        productCategory: ["Smoke Dampers", "Fire Protection"],
        Category: [
          {
            Id: "reg-002",
            Title: "Compliance Updates"
          }
        ],
        Tags: ["UL 555S", "Listing", "Fire Safety"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Make-Up Air Unit Winter Operation Guide",
        communicationType: "Seasonal Bulletin",
        summary: "Recommended settings and maintenance for cold weather MAU operation",
        issueNumber: "Issue# GH-2025-21",
        AuthorName: "Technical Support",
        date: "2024-11-10",
        url: "https://www.greenheck.com/resources/mau-winter-guide",
        topic: ["Seasonal Maintenance", "Make-Up Air"],
        productCategory: ["MAUs", "Heating Systems"],
        Category: [
          {
            Id: "tech-001",
            Title: "Technical Resources"
          }
        ],
        Tags: ["Winter", "Freeze Protection", "HVAC"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Indoor Air Quality White Paper 2025",
        communicationType: "Research Report",
        summary: "Latest findings on IAQ improvements through advanced ventilation strategies",
        issueNumber: "Issue# GH-2025-22",
        AuthorName: "Research Team",
        date: "2024-11-05",
        url: "https://www.greenheck.com/resources/iaq-white-paper",
        topic: ["IAQ", "Ventilation Research"],
        productCategory: ["Ventilation Systems", "Air Quality"],
        Category: [
          {
            Id: "res-009",
            Title: "Research Publications"
          }
        ],
        Tags: ["IAQ", "Study", "Ventilation"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Fan Array System Design Guide",
        communicationType: "Application Manual",
        summary: "Comprehensive guide to designing and specifying fan array systems",
        issueNumber: "Issue# GH-2025-23",
        AuthorName: "Applications Engineering",
        date: "2024-10-28",
        url: "https://www.greenheck.com/resources/fan-array-guide",
        topic: ["System Design", "HVAC Applications"],
        productCategory: ["Fan Systems", "HVAC Systems"],
        Category: [
          {
            Id: "app-008",
            Title: "Application Notes"
          }
        ],
        Tags: ["Design", "Redundancy", "VFD"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Sustainability Report 2024",
        communicationType: "Corporate Report",
        summary: "Annual sustainability report detailing environmental initiatives and progress",
        issueNumber: "Issue# GH-2025-24",
        AuthorName: "Sustainability Office",
        date: "2024-10-20",
        url: "https://www.greenheck.com/about/sustainability-2024",
        topic: ["Sustainability", "Corporate Responsibility"],
        productCategory: [],
        Category: [
          {
            Id: "corp-007",
            Title: "Corporate News"
          }
        ],
        Tags: ["ESG", "Recycling", "Energy Efficiency"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "New BIM Files for Vane Axial Fans",
        communicationType: "Design Resource",
        summary: "Updated Revit families for complete vane axial fan product line",
        issueNumber: "Issue# GH-2025-25",
        AuthorName: "BIM Team",
        date: "2024-10-15",
        url: "https://www.greenheck.com/resources/bim-vane-axial",
        topic: ["BIM", "Design Tools"],
        productCategory: ["Vane Axial Fans", "BIM Objects"],
        Category: [
          {
            Id: "des-010",
            Title: "Design Resources"
          }
        ],
        Tags: ["Revit", "BIM", "CAD"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Acoustical Performance Testing Results",
        communicationType: "Test Report",
        summary: "2025 AMCA-certified sound performance data for centrifugal fan series",
        issueNumber: "Issue# GH-2025-26",
        AuthorName: "Testing Laboratory",
        date: "2024-10-10",
        url: "https://www.greenheck.com/resources/acoustical-testing",
        topic: ["Acoustics", "Performance Data"],
        productCategory: ["Centrifugal Fans", "Sound Ratings"],
        Category: [
          {
            Id: "test-011",
            Title: "Test Reports"
          }
        ],
        Tags: ["AMCA", "Sound Power", "dB"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Hurricane Rated Louver Certification",
        communicationType: "Product Update",
        summary: "New Miami-Dade County approval for wind-driven rain louver series",
        issueNumber: "Issue# GH-2025-27",
        AuthorName: "Product Management",
        date: "2024-10-05",
        url: "https://www.greenheck.com/products/hurricane-louver",
        topic: ["Certifications", "Storm Protection"],
        productCategory: ["Louvers", "FEMA Products"],
        Category: [
          {
            Id: "prod-006",
            Title: "Product Updates"
          }
        ],
        Tags: ["Miami-Dade", "Wind Rating", "NOAA"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Data Center Ventilation Strategies",
        communicationType: "Application Guide",
        summary: "Optimized cooling approaches for modern high-density data centers",
        issueNumber: "Issue# GH-2025-28",
        AuthorName: "Critical Environments Team",
        date: "2024-09-28",
        url: "https://www.greenheck.com/resources/data-center-ventilation",
        topic: ["Data Centers", "Cooling Strategies"],
        productCategory: ["Critical HVAC", "Ventilation Systems"],
        Category: [
          {
            Id: "app-008",
            Title: "Application Notes"
          }
        ],
        Tags: ["PUE", "Cooling", "Server Rooms"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "LEED v4.1 Contribution Guidelines",
        communicationType: "Sustainability Guide",
        summary: "How Greenheck products contribute to LEED v4.1 certification projects",
        issueNumber: "Issue# GH-2025-29",
        AuthorName: "Sustainability Office",
        date: "2024-09-20",
        url: "https://www.greenheck.com/resources/leed-guidelines",
        topic: ["LEED Certification", "Green Building"],
        productCategory: ["Sustainable Products"],
        Category: [
          {
            Id: "sus-012",
            Title: "Sustainability Resources"
          }
        ],
        Tags: ["USGBC", "LEED", "Green Building"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "2025 Product Catalog Now Available",
        communicationType: "Marketing Publication",
        summary: "Digital and print versions of our complete 2025 product catalog",
        issueNumber: "Issue# GH-2025-30",
        AuthorName: "Marketing Communications",
        date: "2024-09-15",
        url: "https://www.greenheck.com/resources/2025-catalog",
        topic: ["Product Information", "Resources"],
        productCategory: [],
        Category: [
          {
            Id: "mar-013",
            Title: "Marketing Materials"
          }
        ],
        Tags: ["Catalog", "Product Guide", "Reference"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      }
    ];

    this.dataService = new CommunicationDataService(this.data);
    this.filtersContainer = document.querySelector("#filters-container");
    this.searchContainer = document.querySelector("#search-container");
    this.cardsContainer = document.querySelector("#communications-container");
    this.countElement = document.querySelector("#communication-count");
    this.loadMoreButton = document.querySelector(".load-more");
    this.selectedFiltersContainer = document.getElementById("filtered-tags");

    this.cardList = new CardListComponent(this.cardsContainer, this.countElement);

    this.initialize();
  }

  initialize() {
    // Create and render search component
    this.createSearchComponent();

    // Create and render filter components
    this.createFilters();

    // Setup sort dropdown
    this.setupSortDropdown();

    // Initial render of cards
    this.updateDisplay();

    // Setup load more button
    this.setupLoadMoreButton();

    // Setup view toggle buttons
    this.setupViewToggle();

    // Update selected filters
    this.updateSelectedFilters();
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
    // Clear filters container
    this.filtersContainer.innerHTML = "";

    // Create timeframe filter
    new FilterComponent(
      "Timeframe",
      this.dataService.getTimeframes(),
      this.filtersContainer,
      this.handleFilterChange.bind(this),
      "dropdown" // Specify dropdown style
    ).render();

    // Create existing filter components
    const topics = this.dataService.getUniqueValues("topic");
    new FilterComponent(
      "Topics",
      topics,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();

    const productCategories = this.dataService.getUniqueValues("productCategory");
    new FilterComponent(
      "Product Categories",
      productCategories,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();

    const communicationTypes = this.dataService.getUniqueValues("communicationType");
    new FilterComponent(
      "Communication Type",
      communicationTypes,
      this.filtersContainer,
      this.handleFilterChange.bind(this)
    ).render();
  }

  handleFilterChange(filterType, value, isActive) {
    // For dropdown filters like timeframe, isActive is undefined and value contains the selected option
    if (filterType.toLowerCase() === "timeframe") {
      this.dataService.activeFilters.timeframe = value;
      this.dataService.applyFilters();
    } else {
      // For checkbox filters, use the existing updateFilter method
      this.dataService.updateFilter(filterType, value, isActive);
    }
    this.cardList.resetPagination();
    this.updateDisplay();
    this.updateSelectedFilters();
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

    // Update selected filters
    this.updateSelectedFilters();
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

  setupViewToggle() {
    // View toggle buttons
    const gridViewBtn = document.querySelector(".grid-view");
    const listViewBtn = document.querySelector(".list-view");

    if (gridViewBtn && listViewBtn && this.cardsContainer) {
      gridViewBtn.addEventListener("click", () => {
        gridViewBtn.classList.add("active");
        listViewBtn.classList.remove("active");
        this.cardsContainer.classList.remove("list-view");
        this.updateDisplay();
      });

      listViewBtn.addEventListener("click", () => {
        listViewBtn.classList.add("active");
        gridViewBtn.classList.remove("active");
        this.cardsContainer.classList.add("list-view");
        this.updateDisplay();
      });
    }
  }

  setupSortDropdown() {
    const sortDropdown = document.getElementById("sort-by");
    if (sortDropdown) {
      sortDropdown.addEventListener("change", e => {
        this.dataService.setSortOrder(e.target.value);
        this.cardList.resetPagination();
        this.updateDisplay();
      });
    }
  }

  updateSelectedFilters() {
    if (!this.selectedFiltersContainer) return;

    const activeFilters = this.dataService.getActiveFilters();
    this.selectedFiltersContainer.innerHTML = activeFilters
      .map(
        filter => `
        <div class="selected-filter" data-type="${filter.type}" data-value="${filter.value}">
          ${filter.displayValue}
          <button class="remove-filter" aria-label="Remove filter">×</button>
        </div>
      `
      )
      .join("");

    // Add click handlers for remove buttons
    this.selectedFiltersContainer.querySelectorAll(".remove-filter").forEach(button => {
      button.addEventListener("click", e => {
        const filterElement = e.target.closest(".selected-filter");
        const type = filterElement.dataset.type;
        const value = filterElement.dataset.value;

        // Remove the filter
        this.dataService.removeFilter(type, value);

        // Update UI
        this.updateSelectedFilters();
        this.cardList.resetPagination();
        this.updateDisplay();

        // Update checkbox/dropdown UI
        if (type === "timeframe") {
          const select = document.querySelector(`#timeframe-select`);
          if (select) select.value = "All Time";
        } else {
          const checkbox = document.querySelector(`#${value.toLowerCase().replace(/\s+/g, "-")}`);
          if (checkbox) checkbox.checked = false;
        }
      });
    });
  }
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CommunicationApp();
});
