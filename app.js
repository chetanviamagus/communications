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
        title: "Last Week Test Communication",
        communicationType: "Bulletin",
        summary: "This is a test communication from last week",
        issueNumber: "Issue# 1",
        date: "2025-04-4",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Last Month Test Communication",
        communicationType: "CAPS Update",
        summary: "This is a test communication from last month",
        issueNumber: "Issue# 2",
        date: "2025-03-01",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Last 3 Months Test Communication",
        communicationType: "Technical Update",
        summary: "This is a test communication from 3 months ago",
        issueNumber: "Issue# 3",
        date: "2025-01-15",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Last 6 Months Test Communication",
        communicationType: "REP Update",
        summary: "This is a test communication from 6 months ago",
        issueNumber: "Issue# 4",
        date: "2024-10-15",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Last 9 Months Test Communication",
        communicationType: "Insights",
        summary: "This is a test communication from 9 months ago",
        issueNumber: "Issue# 5",
        date: "2024-07-10",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Last Year Test Communication",
        communicationType: "Bulletin",
        summary: "This is a test communication from last year",
        issueNumber: "Issue# 6",
        date: "2024-04-15",
        topic: ["Test Topic"],
        productCategory: ["Test Category"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Consulting-Specifying Engineer Product of the Year: AFL-601 Nomination",
        communicationType: "Bulletin",
        summary:
          "The AFL-601 Wind-Driven Rain FEMA Louver is a nominee for the Consulting-Specifying Engineer (CSE) Product of the Year awards in the HVAC category—and we need your vote to win!",
        issueNumber: "Issue# 1",
        AuthorName: "John Smith",
        date: "2024-02-05",
        url: "https://cms-test.greenheck.com/resources/communications/consulting-specifying-engineer-product-of-the-year--afl-601-nomination",
        topic: ["Industry Awards", "Product Recognition"],
        productCategory: ["AFL-601", "Louvers"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["FEMA", "HVAC", "Awards"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "New Energy Recovery Ventilator Series Launch",
        communicationType: "CAPS Update",
        summary:
          "Introducing our new line of Energy Recovery Ventilators featuring advanced heat exchange technology.",
        issueNumber: "Issue# 2",
        AuthorName: "Sarah Johnson",
        date: "2023-12-10",
        url: "https://cms-test.greenheck.com/resources/communications/new-energy-recovery-ventilator-series",
        topic: ["Product Innovation", "Energy Solutions"],
        productCategory: ["ERV", "Ventilation Systems"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["HVAC", "Sustainability", "Innovation"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Technical Bulletin: Fan Performance Optimization",
        communicationType: "Technical Update",
        summary: "Latest findings on fan performance optimization techniques and best practices.",
        issueNumber: "Issue# 3",
        AuthorName: "Michael Chen",
        date: "2022-06-15",
        url: "https://cms-test.greenheck.com/resources/communications/fan-performance-optimization",
        topic: ["Technical Research", "System Optimization"],
        productCategory: ["Fans", "Performance Equipment"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Technical", "Performance", "Maintenance"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg"
      },
      {
        title: "Industry Standards Update: ASHRAE 2024",
        communicationType: "REP Update",
        summary: "Overview of the latest ASHRAE standards and their impact.",
        issueNumber: "Issue# 4",
        AuthorName: "Emily Rodriguez",
        date: "2022-03-20",
        url: "https://cms-test.greenheck.com/resources/communications/ashrae-2024-update",
        topic: ["Industry Standards", "Regulatory Updates"],
        productCategory: ["Compliance Systems", "Standards Implementation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["ASHRAE", "Standards", "Compliance"],
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
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CommunicationApp();
});
