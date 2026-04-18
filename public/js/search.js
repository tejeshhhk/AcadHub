/**
 * search.js — Search Page Logic
 * Handles search, filtering, smart search, and pagination
 */

let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Check for URL parameters
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const sort = params.get('sort');

    if (query) {
        document.getElementById('searchInput').value = query;
    }
    if (sort) {
        document.getElementById('filterSort').value = sort;
    }

    performSearch();
});

/**
 * Perform search with current filters
 */
async function performSearch(page = 1) {
    currentPage = page;
    const query = document.getElementById('searchInput').value.trim();
    const subject = document.getElementById('filterSubject').value;
    const sort = document.getElementById('filterSort').value;
    const smartSearch = document.getElementById('smartSearchToggle').checked;
    const resultsGrid = document.getElementById('searchResults');

    // Show loading state
    resultsGrid.innerHTML = `<div class="spinner-overlay" style="grid-column: 1 / -1;"><div class="spinner"></div></div>`;

    let data;

    if (smartSearch && query && Auth.isLoggedIn()) {
        // Use Gemini-powered smart search
        data = await API.post('/ai/smart-search', { query });
        if (data.success) {
            // Wrap in standard format
            data = {
                success: true,
                resources: data.resources,
                pagination: { current: 1, pages: 1, total: data.resources.length }
            };
        }
    } else {
        // Standard search with filters
        let endpoint = `/resources?page=${page}&limit=12&sort=${sort}`;
        if (query) endpoint += `&search=${encodeURIComponent(query)}`;
        if (subject) endpoint += `&subject=${encodeURIComponent(subject)}`;
        data = await API.get(endpoint);
    }

    if (data.success && data.resources && data.resources.length > 0) {
        resultsGrid.innerHTML = data.resources.map(r => renderResourceCard(r)).join('');
        document.getElementById('resultCount').textContent = `${data.pagination?.total || data.resources.length} results found`;
        
        if (data.pagination && data.pagination.pages > 1) {
            renderPagination(data.pagination);
        } else {
            document.getElementById('pagination').innerHTML = '';
        }
    } else {
        resultsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔍</div>
                <h3>No resources found</h3>
                <p>Try different keywords or adjust your filters.</p>
            </div>
        `;
        document.getElementById('resultCount').textContent = '0 results';
        document.getElementById('pagination').innerHTML = '';
    }
}

/**
 * Render pagination buttons
 */
function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    let html = '';

    // Previous button
    html += `<button class="pagination-btn" ${pagination.current <= 1 ? 'disabled' : ''} onclick="performSearch(${pagination.current - 1})">←</button>`;

    // Page numbers
    const maxPages = Math.min(pagination.pages, 7);
    let startPage = Math.max(1, pagination.current - 3);
    let endPage = Math.min(pagination.pages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === pagination.current ? 'active' : ''}" onclick="performSearch(${i})">${i}</button>`;
    }

    // Next button
    html += `<button class="pagination-btn" ${pagination.current >= pagination.pages ? 'disabled' : ''} onclick="performSearch(${pagination.current + 1})">→</button>`;

    container.innerHTML = html;
}
