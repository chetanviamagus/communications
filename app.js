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
        suggestions.add(word);
      }
    });

    // Get summary suggestions if enabled
    if (this.indexSummary) {
      this.summaryIndex.forEach((_, word) => {
        if (word.startsWith(searchTerm)) {
          suggestions.add(word);
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
      "communication-type": []
    };
    this.searchTerm = "";
    this.searchIndex = new SearchIndexService(rawData);
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
              itemProperty = item.communicationType;
              break;
          }

          // Handle array properties
          if (Array.isArray(itemProperty)) {
            return selectedValues.some(value => itemProperty.includes(value));
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
    this.options = options || []; // Ensure options is at least an empty array
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
              .filter(option => option) // Filter out any undefined/null options
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
    // Data array is initialized here
    this.data = [
      {
        title: "Consulting-Specifying Engineer Product of the Year: AFL-601 Nomination",
        communicationType: "Bulletin",
        summary:
          "The AFL-601 Wind-Driven Rain FEMA Louver is a nominee for the Consulting-Specifying Engineer (CSE) Product of the Year awards in the HVAC category—and we need your vote to win!",
        issueNumber: "Issue# 1",
        AuthorName: "John Smith",
        date: "February 5, 2025",
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
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg?sfvrsn=ff407117_4"
      },
      {
        title: "New Energy Recovery Ventilator Series Launch",
        communicationType: "CAPS Update",
        summary:
          "Introducing our new line of Energy Recovery Ventilators featuring advanced heat exchange technology and improved energy efficiency ratings.",
        issueNumber: "Issue# 2",
        AuthorName: "Sarah Johnson",
        date: "March 15, 2025",
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
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Technical Bulletin: Fan Performance Optimization",
        communicationType: "Technical Update",
        summary:
          "Latest findings on fan performance optimization techniques and best practices for installation and maintenance.",
        issueNumber: "Issue# 3",
        AuthorName: "Michael Chen",
        date: "April 1, 2025",
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
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg?sfvrsn=ff407117_4"
      },
      {
        title: "Industry Standards Update: ASHRAE 2025",
        communicationType: "REP Update",
        summary:
          "Overview of the latest ASHRAE standards and how they impact HVAC system design and implementation.",
        issueNumber: "Issue# 4",
        AuthorName: "Emily Rodriguez",
        date: "May 10, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/ashrae-2025-update",
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
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Customer Success Story: Hospital Ventilation Upgrade",
        communicationType: "Insights",
        summary:
          "How our ventilation solutions helped a major hospital improve indoor air quality and energy efficiency.",
        issueNumber: "Issue# 5",
        AuthorName: "David Wilson",
        date: "June 20, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/hospital-ventilation-case-study",
        topic: ["Customer Success", "Healthcare Solutions"],
        productCategory: ["Healthcare Systems", "Ventilation Solutions"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Healthcare", "Case Study", "IAQ"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg?sfvrsn=ff407117_4"
      },
      {
        title: "New Product Line: Commercial Kitchen Ventilation",
        communicationType: "CAPS Update",
        summary:
          "Introducing our latest commercial kitchen ventilation solutions with enhanced capture efficiency and reduced energy consumption.",
        issueNumber: "Issue# 6",
        AuthorName: "Robert Taylor",
        date: "July 5, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/commercial-kitchen-ventilation",
        topic: ["Product Launch", "Commercial Solutions"],
        productCategory: ["Kitchen Systems", "Commercial Ventilation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Commercial", "Kitchen", "Ventilation"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Energy Efficiency Webinar Series",
        communicationType: "Insights",
        summary:
          "Join our upcoming webinar series focusing on energy efficiency in HVAC systems and learn about the latest technologies and best practices.",
        issueNumber: "Issue# 7",
        AuthorName: "Lisa Anderson",
        date: "August 12, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/energy-efficiency-webinar",
        topic: ["Educational Events", "Industry Training"],
        productCategory: ["Training Programs"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Webinar", "Energy", "Education"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg?sfvrsn=ff407117_4"
      },
      {
        title: "Technical Service Bulletin: Fan Motor Maintenance",
        communicationType: "Technical Update",
        summary:
          "Important updates regarding fan motor maintenance procedures and recommended service intervals for optimal performance.",
        issueNumber: "Issue# 8",
        AuthorName: "James Wilson",
        date: "September 3, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/fan-motor-maintenance",
        topic: ["Technical Support", "Maintenance Guidelines"],
        productCategory: ["Fan Motors", "Maintenance Parts"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Technical", "Maintenance", "Motors"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Case Study: University Campus Ventilation Upgrade",
        communicationType: "Insights",
        summary:
          "How our ventilation solutions transformed the indoor air quality and energy efficiency of a major university campus.",
        issueNumber: "Issue# 9",
        AuthorName: "Patricia Lee",
        date: "October 15, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/university-ventilation-case-study",
        topic: ["Educational Facilities", "Sustainability Projects"],
        productCategory: ["Campus Systems", "Educational Ventilation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Education", "Case Study", "IAQ"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/featured-categories/gym_vav_system.jpg?sfvrsn=ff407117_4"
      },
      {
        title: "New Product: High-Efficiency Air Terminal Units",
        communicationType: "CAPS Update",
        summary:
          "Introducing our new line of high-efficiency air terminal units with advanced control capabilities and improved energy performance.",
        issueNumber: "Issue# 10",
        AuthorName: "Thomas Brown",
        date: "November 7, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/high-efficiency-air-terminal-units",
        topic: ["Product Innovation", "Energy Solutions"],
        productCategory: ["Air Terminal Units", "Control Systems"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["ATU", "Efficiency", "Controls"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Technical Bulletin: Fire and Smoke Damper Testing",
        communicationType: "Technical Update",
        summary:
          "Updated procedures and requirements for fire and smoke damper testing in accordance with the latest NFPA standards.",
        issueNumber: "Issue# 11",
        AuthorName: "Richard Martinez",
        date: "December 1, 2025",
        url: "https://cms-test.greenheck.com/resources/communications/fire-smoke-damper-testing",
        topic: ["Safety"],
        productCategory: ["Fire Dampers", "Smoke Dampers"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Fire", "Safety", "Testing"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Product Recall Notice: Model XYZ-123 Fans",
        communicationType: "Safety Alert",
        summary:
          "Important safety notice regarding a specific batch of Model XYZ-123 fans. Please review the details and take appropriate action.",
        issueNumber: "Issue# 12",
        AuthorName: "Safety Department",
        date: "January 10, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/xyz-123-recall",
        topic: ["Recall"],
        productCategory: ["Fans", "Safety Gear"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Safety", "Recall", "Fans"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "New Distribution Center Opening",
        communicationType: "Company News",
        summary:
          "Announcing the opening of our new distribution center in the Midwest, improving service and delivery times for our customers.",
        issueNumber: "Issue# 13",
        AuthorName: "Corporate Communications",
        date: "February 15, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/new-distribution-center",
        topic: ["Company News", "Facilities"],
        productCategory: ["Company", "Operations"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Facilities", "Operations", "Company"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Technical Service Bulletin: Control System Update",
        communicationType: "Technical Update",
        summary:
          "Important update regarding our control systems software and recommended upgrade procedures for optimal performance.",
        issueNumber: "Issue# 14",
        AuthorName: "Technical Services",
        date: "March 5, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/control-system-update",
        topic: ["Controls"],
        productCategory: ["Software"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Controls", "Software", "Update"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Case Study: Data Center Cooling Solution",
        communicationType: "Case Study",
        summary:
          "How our innovative cooling solutions helped a major data center achieve optimal temperature control and energy efficiency.",
        issueNumber: "Issue# 15",
        AuthorName: "Technical Solutions Team",
        date: "April 20, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/data-center-cooling",
        topic: ["Case Study", "Data Center"],
        productCategory: ["Cooling", "Software"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Data Center", "Cooling", "Case Study"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "New Product: Smart Ventilation Controls",
        communicationType: "Product Update",
        summary:
          "Introducing our new line of smart ventilation controls with IoT integration and advanced monitoring capabilities.",
        issueNumber: "Issue# 16",
        AuthorName: "Product Development Team",
        date: "May 8, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/smart-ventilation-controls",
        topic: ["Product Launch", "IoT"],
        productCategory: ["Ventilation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["IoT", "Smart Controls", "Ventilation"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Technical Bulletin: Air Quality Monitoring",
        communicationType: "Technical Update",
        summary:
          "Updated guidelines for air quality monitoring in commercial buildings and best practices for maintaining optimal indoor air quality.",
        issueNumber: "Issue# 17",
        AuthorName: "Technical Services",
        date: "June 15, 2026",
        url: "https://cms-test.greenheck.com/resources/communications/air-quality-monitoring",
        topic: ["Technical", "Air Quality"],
        productCategory: ["Monitoring", "Ventilation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["IAQ", "Monitoring", "Technical"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Case Study: Office Building",
        communicationType: "Case Study",
        summary:
          "How our ventilation solutions improved indoor air quality and energy efficiency in a modern office building.",
        issueNumber: "Issue# 48",
        AuthorName: "Commercial Solutions Team",
        date: "January 22, 2029",
        url: "https://cms-test.greenheck.com/resources/communications/office-building",
        topic: ["Technical", "Commissioning"],
        productCategory: ["Performance"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Office", "Ventilation", "Case Study"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "New Product: Energy Recovery Ventilators",
        communicationType: "Product Update",
        summary:
          "Introducing our new line of energy recovery ventilators with enhanced heat exchange efficiency and reduced energy consumption.",
        issueNumber: "Issue# 49",
        AuthorName: "Product Development Team",
        date: "February 10, 2029",
        url: "https://cms-test.greenheck.com/resources/communications/energy-recovery-ventilators",
        topic: ["Case Study", "Commercial"],
        productCategory: ["Ventilation", "Performance"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Energy", "Recovery", "Ventilation"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
      },
      {
        title: "Technical Bulletin: System Maintenance",
        communicationType: "Technical Update",
        summary:
          "Updated guidelines for system maintenance and service intervals to ensure optimal performance and longevity.",
        issueNumber: "Issue# 50",
        AuthorName: "Technical Services",
        date: "March 5, 2029",
        url: "https://cms-test.greenheck.com/resources/communications/system-maintenance",
        topic: ["Product Launch", "Energy Efficiency"],
        productCategory: ["Energy Recovery", "Ventilation"],
        Category: [
          {
            Id: "124b2e5e-5425-401e-a779-1ed158167901",
            Title: "Communications"
          }
        ],
        Tags: ["Maintenance", "Technical", "Service"],
        imageUrl:
          "https://ghsitefinitytesting.blob.core.windows.net/greenheck-cms-test/images/default-source/default-album/cse2020_poylogo_gold.jpg?sfvrsn=bab8c650_4"
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
    const topics = this.dataService.getUniqueValues("topic");
    const productCategories = this.dataService.getUniqueValues("productCategory");
    const communicationTypes = this.dataService.getUniqueValues("communicationType");

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
}

// Initialize the application when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new CommunicationApp();
});
