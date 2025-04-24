// Direct pagination implementation
document.addEventListener("DOMContentLoaded", function () {
  // Apply with delay to ensure cards are loaded
  setTimeout(function () {
    // Get DOM elements
    var container = document.getElementById("communications-container");
    var cards = container ? container.querySelectorAll(".product-card") : [];
    var prevBtn = document.getElementById("prev-page");
    var nextBtn = document.getElementById("next-page");
    var pageNumbers = document.getElementById("pagination-numbers");

    // Check if elements exist
    if (!container || cards.length === 0 || !prevBtn || !nextBtn || !pageNumbers) {
      console.error("Pagination elements not found");
      return;
    }

    console.log("Setting up pagination for", cards.length, "cards");

    // Configuration
    var itemsPerPage = window.innerWidth >= 1024 ? 24 : 9;
    var currentPage = 1;
    var totalPages = Math.ceil(cards.length / itemsPerPage);

    // Make pagination container visible
    var paginationContainer = document.querySelector(".pagination-container");
    if (paginationContainer) {
      paginationContainer.style.display = "flex";
    }

    // Hide load more button on mobile
    if (window.innerWidth < 1024) {
      var loadMoreContainer = document.querySelector(".load-more-container");
      if (loadMoreContainer) {
        loadMoreContainer.style.display = "none";
      }
    }

    // Function to display a specific page
    function showPage(page) {
      // Hide all cards
      for (var i = 0; i < cards.length; i++) {
        cards[i].style.display = "none";
      }

      // Show only cards for current page
      var start = (page - 1) * itemsPerPage;
      var end = Math.min(start + itemsPerPage, cards.length);

      for (var i = start; i < end; i++) {
        cards[i].style.display = "";
      }

      // Update UI state
      currentPage = page;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;

      // Update pagination numbers
      updatePageNumbers();
    }

    // Update page number buttons
    function updatePageNumbers() {
      // Clear existing content
      pageNumbers.innerHTML = "";

      // Create buttons for each page
      for (var i = 1; i <= totalPages; i++) {
        var button = document.createElement("button");
        button.className = "pagination-button number" + (i === currentPage ? " active" : "");
        button.textContent = i;
        button.setAttribute("data-page", i);

        if (i === currentPage) {
          button.disabled = true;
        } else {
          // Add click handler using closure to capture page number
          (function (pageNum) {
            button.onclick = function () {
              showPage(pageNum);
            };
          })(i);
        }

        pageNumbers.appendChild(button);
      }
    }

    // Set up event handlers
    prevBtn.onclick = function () {
      if (currentPage > 1) {
        showPage(currentPage - 1);
      }
    };

    nextBtn.onclick = function () {
      if (currentPage < totalPages) {
        showPage(currentPage + 1);
      }
    };

    // Initialize first page
    showPage(1);
  }, 1000);
});
