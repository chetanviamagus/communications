document.addEventListener("DOMContentLoaded", () => {
  const data = [
    {
      id: "1",
      title: "Sample Title 1",
      imageUrl: "https://picsum.photos/400/300?1",
      url: "https://www.greenheck.com/products",
      date: "August 1th 2024",
      issueNumber: "Issue #1",
      productCategory: "Indoor Air Quality",
      topic: "Diffusers",
      communication: "Bulletin"
    },
    {
      id: "2",
      title: "Sample Title 2",
      imageUrl: "https://picsum.photos/400/300?2",
      url: "https://www.greenheck.com/products",
      date: "August 2th 2024",
      issueNumber: "Issue #2",
      productCategory: "Louvers",
      topic: "RSQ",
      communication: "Rep Update"
    },
    {
      id: "3",
      title: "Sample Title 3",
      imageUrl: "https://picsum.photos/400/300?3",
      url: "https://www.greenheck.com/products",
      date: "August 3th 2024",
      issueNumber: "Issue #3",
      productCategory: "Indoor Air Quality",
      topic: "RSQ",
      communication: "Bulletin"
    },
    {
      id: "4",
      title: "Sample Title 4",
      imageUrl: "https://picsum.photos/400/300?4",
      url: "https://www.greenheck.com/products",
      date: "August 4th 2024",
      issueNumber: "Issue #4",
      productCategory: "Louvers",
      topic: "Diffusers",
      communication: "Rep Update"
    },
    {
      id: "5",
      title: "Sample Title 5",
      imageUrl: "https://picsum.photos/400/300?5",
      url: "https://www.greenheck.com/products",
      date: "August 5th 2024",
      issueNumber: "Issue #5",
      productCategory: "Indoor Air Quality",
      topic: "Software",
      communication: "Bulletin"
    },
    {
      id: "6",
      title: "Sample Title 6",
      imageUrl: "https://picsum.photos/400/300?6",
      url: "https://www.greenheck.com/products",
      date: "August 6th 2024",
      issueNumber: "Issue #1",
      productCategory: "Louvers",
      topic: "RSQ",
      communication: "Rep Update"
    },
    {
      id: "7",
      title: "Sample Title 7",
      imageUrl: "https://picsum.photos/400/300?7",
      url: "https://www.greenheck.com/products",
      date: "August 7th 2024",
      issueNumber: "Issue #2",
      productCategory: "Indoor Air Quality",
      topic: "Diffusers",
      communication: "Bulletin"
    },
    {
      id: "8",
      title: "Sample Title 8",
      imageUrl: "https://picsum.photos/400/300?8",
      url: "https://www.greenheck.com/products",
      date: "August 8th 2024",
      issueNumber: "Issue #3",
      productCategory: "Louvers",
      topic: "RSQ",
      communication: "Rep Update"
    },
    {
      id: "9",
      title: "Sample Title 9",
      imageUrl: "https://picsum.photos/400/300?9",
      url: "https://www.greenheck.com/products",
      date: "August 9th 2024",
      issueNumber: "Issue #4",
      productCategory: "Indoor Air Quality",
      topic: "Software",
      communication: "Bulletin"
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
  // extract the unique topics from the above data
  const topics = [...new Set(data.map(item => item.topic))];
  // extract the unique product categories from the above data
  const productCategories = [...new Set(data.map(item => item.productCategory))];
  // extract the unique communication types from the above data
  const communicationTypes = [...new Set(data.map(item => item.communication))];

  // create a function to construct the filter options for topics, productCategories, and communicationTypes
  function constructFilterOptions(options, filterType) {
    const initialVisibleCount = 2;
    const hasMoreOptions = options.length > initialVisibleCount;
    const filterId = filterType.toLowerCase().replace(/\s+/g, "-");

    return `
    <section class="filter-section" id="${filterId}-section">
      <h2>${filterType}</h2>
      <ul class="filter-list" role="group" aria-label="${filterType} filters">
        ${options
          .map(
            (option, index) => `
          <li ${index >= initialVisibleCount ? `class="hidden-option ${filterId}-hidden" style="display: none;"` : ""}>
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
  }
  const topicsFilter = constructFilterOptions(topics, "Topics");
  const categoriesFilter = constructFilterOptions(productCategories, "Product Categories");
  const communicationFilter = constructFilterOptions(communicationTypes, "Communication Type");
  // Then insert these into your page where needed
  document.querySelector("#filters-container").innerHTML =
    topicsFilter + categoriesFilter + communicationFilter;
  // Track active filters
  const activeFilters = {
    topics: [],
    "product-categories": [],
    "communication-type": []
  };
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  // Function to construct communication cards
  function constructCommunicationCards(items) {
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
          <time datetime="${item.date}">${formatDate(item.date)}</time>
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
  // Insert communication cards into the page
  document.querySelector("#communications-container").innerHTML = constructCommunicationCards(data);
  // Pagination variables
  let currentPage = 1;
  const cardsPerPage = 24;
  let isShowingAll = false;
  // Function to filter data based on active filters
  function filterData(data) {
    // If no filters are active, return all data
    if (Object.values(activeFilters).every(filters => filters.length === 0)) {
      return data;
    }

    return data.filter(item => {
      // Check if item matches all filter categories
      return Object.entries(activeFilters).every(([filterType, selectedValues]) => {
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

  // Function to display cards with pagination
  function displayCards() {
    // Filter data first
    const filteredData = filterData(data);

    const startIndex = 0;
    const endIndex = currentPage * cardsPerPage;
    const visibleData = isShowingAll ? filteredData : filteredData.slice(startIndex, endIndex);

    document.querySelector("#communications-container").innerHTML =
      constructCommunicationCards(visibleData);

    // Update the results count
    document.querySelector("#communication-count").textContent = filteredData.length;

    // Update "Load More" button text and functionality
    const loadMoreButton = document.querySelector(".load-more");

    if (isShowingAll || endIndex >= filteredData.length) {
      loadMoreButton.textContent = "SHOW LESS";
      isShowingAll = true;
    } else {
      loadMoreButton.textContent = "LOAD MORE";
    }

    // Hide load more button if no results
    loadMoreButton.style.display = filteredData.length > 0 ? "block" : "none";
  }

  // Add event listeners for filter checkboxes
  document.querySelectorAll('#filters-container input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener("change", function () {
      const filterType = this.name;
      const value = this.nextElementSibling.textContent.trim();

      if (this.checked) {
        // Add to active filters
        if (!activeFilters[filterType].includes(value)) {
          activeFilters[filterType].push(value);
        }
      } else {
        // Remove from active filters
        const index = activeFilters[filterType].indexOf(value);
        if (index !== -1) {
          activeFilters[filterType].splice(index, 1);
        }
      }

      // Reset pagination when filters change
      currentPage = 1;
      isShowingAll = false;

      // Update display
      displayCards();
    });
  });

  // Initial display of cards
  displayCards();
  // Add event listeners for "View More" buttons
  document.querySelectorAll(".view-more-btn").forEach(button => {
    button.addEventListener("click", function () {
      const filterType = this.getAttribute("data-filter-type");
      const hiddenOptions = document.querySelectorAll(`.${filterType}-hidden`);
      const isShowingMore = this.textContent.trim() === "View More";

      hiddenOptions.forEach(option => {
        option.style.display = isShowingMore ? "block" : "none";
      });

      this.textContent = isShowingMore ? "View Less" : "View More";
    });
  });
});
