/**
 * Business List Component
 *
 * Renders a searchable, filterable list of businesses in a side pane.
 * Features:
 * - Display businesses as cards or list items
 * - Search by name and industry
 * - Filter by type (vendor, service provider, partner)
 * - Sort options (name, rating, relevance)
 * - Row click emits selection event
 * - Highlight selected business
 * - Responsive scrolling on mobile
 * - Pagination support for large lists
 *
 * Exported function: initBusinessList(container, options)
 */

import { request } from "../../core/api.js";
import { showToast } from "../../core/toast.js";

/**
 * Initialize business list component
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Configuration options
 * @param {Function} options.onSelectBusiness - Callback when business selected (businessId)
 */
export function initBusinessList(container, options = {}) {
  const { onSelectBusiness = () => {} } = options;

  // State
  const state = {
    businesses: [],
    filteredBusinesses: [],
    selectedBusinessId: null,
    loading: true,
    error: null,
    searchTerm: "",
    filterType: null,
    sortBy: "name", // name, rating, relevance
    page: 1,
    pageSize: 20
  };

  // Load initial data
  loadBusinesses();

  /**
   * Load businesses from API
   */
  async function loadBusinesses() {
    state.loading = true;
    state.error = null;
    render();

    try {
      const response = await request("GET", "/api/business-listings");
      state.businesses = response.data || [];
      state.filteredBusinesses = [...state.businesses];
      applyFiltersAndSort();
    } catch (error) {
      console.error("Failed to load businesses:", error);
      state.error = "Failed to load businesses";
      showToast("Failed to load businesses", "error");
    } finally {
      state.loading = false;
      render();
    }
  }

  /**
   * Apply search, filters, and sorting
   */
  function applyFiltersAndSort() {
    let result = [...state.businesses];

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      result = result.filter((biz) =>
        biz.name?.toLowerCase().includes(term) ||
        biz.category?.toLowerCase().includes(term)
      );
    }

    // Apply type filter
    if (state.filterType) {
      result = result.filter((biz) => biz.businessType === state.filterType);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (state.sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "relevance":
          return state.searchTerm
            ? b.relevanceScore - a.relevanceScore
            : 0;
        case "name":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

    state.filteredBusinesses = result;
    state.page = 1; // Reset pagination
    render();
  }

  /**
   * Handle search input
   */
  function handleSearch(event) {
    state.searchTerm = event.target.value;
    applyFiltersAndSort();
  }

  /**
   * Handle filter change
   */
  function handleFilter(event) {
    state.filterType = event.target.value || null;
    applyFiltersAndSort();
  }

  /**
   * Handle sort change
   */
  function handleSort(event) {
    state.sortBy = event.target.value;
    applyFiltersAndSort();
  }

  /**
   * Handle business selection
   */
  function handleSelectBusiness(businessId) {
    state.selectedBusinessId = businessId;
    render();
    onSelectBusiness(businessId);
  }

  /**
   * Render the list component
   */
  function render() {
    container.innerHTML = `
      <div class="business-list-wrapper">
        <div class="business-list-controls">
          <div class="search-box">
            <input
              type="text"
              id="bizSearch"
              class="search-input"
              placeholder="Search businesses..."
              value="${state.searchTerm}"
              aria-label="Search businesses"
            />
          </div>

          <div class="filter-controls">
            <div class="control-group">
              <label for="bizFilterType" class="control-label">Type:</label>
              <select
                id="bizFilterType"
                class="filter-select"
                aria-label="Filter by business type"
              >
                <option value="">All Types</option>
                <option value="vendor">Vendor</option>
                <option value="service_provider">Service Provider</option>
                <option value="partner">Partner</option>
              </select>
            </div>

            <div class="control-group">
              <label for="bizSortBy" class="control-label">Sort:</label>
              <select
                id="bizSortBy"
                class="filter-select"
                aria-label="Sort businesses"
              >
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rating</option>
                ${state.searchTerm ? '<option value="relevance">Relevance</option>' : ''}
              </select>
            </div>
          </div>
        </div>

        <div class="business-list-content">
          ${renderContent()}
        </div>
      </div>
    `;

    // Attach event listeners
    const searchInput = container.querySelector("#bizSearch");
    const filterSelect = container.querySelector("#bizFilterType");
    const sortSelect = container.querySelector("#bizSortBy");

    if (searchInput) searchInput.addEventListener("input", handleSearch);
    if (filterSelect) filterSelect.addEventListener("change", handleFilter);
    if (sortSelect) sortSelect.addEventListener("change", handleSort);

    // Attach business selection handlers
    container.querySelectorAll(".business-list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const bizId = item.dataset.businessId;
        handleSelectBusiness(bizId);
      });
    });
  }

  /**
   * Render list content (loading, error, or list)
   */
  function renderContent() {
    if (state.loading) {
      return '<div class="loading-message">Loading businesses...</div>';
    }

    if (state.error) {
      return `<div class="error-message">${state.error}</div>`;
    }

    if (state.filteredBusinesses.length === 0) {
      return '<div class="empty-message">No businesses found</div>';
    }

    return `
      <ul class="business-list" role="list">
        ${state.filteredBusinesses
          .map(
            (biz) => `
          <li
            class="business-list-item ${
              biz.id === state.selectedBusinessId ? "active" : ""
            }"
            data-business-id="${biz.id}"
            role="button"
            tabindex="0"
            aria-selected="${biz.id === state.selectedBusinessId}"
          >
            <div class="business-item-content">
              <div class="business-item-name">${biz.name}</div>
              <div class="business-item-category">${biz.category || "N/A"}</div>
              ${
                biz.rating
                  ? `<div class="business-item-rating">⭐ ${biz.rating.toFixed(1)}</div>`
                  : ""
              }
            </div>
          </li>
        `
          )
          .join("")}
      </ul>
    `;
  }

  // Initial render
  render();
}
