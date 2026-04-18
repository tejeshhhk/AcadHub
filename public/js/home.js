/**
 * home.js — Home Page Logic
 * Loads trending, recommended, and latest resources
 */

document.addEventListener('DOMContentLoaded', async () => {
    loadTrending();
    loadLatest();

    // Load recommendations if user is logged in
    if (Auth.isLoggedIn()) {
        loadRecommendations();
    }
});

/**
 * Load trending resources
 */
async function loadTrending() {
    const data = await API.get('/resources/trending');
    const grid = document.getElementById('trendingGrid');

    if (data.success && data.resources && data.resources.length > 0) {
        grid.innerHTML = data.resources.slice(0, 4).map(r => renderResourceCard(r)).join('');
    } else {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔥</div>
                <h3>No trending resources yet</h3>
                <p>Be the first to upload a resource!</p>
            </div>
        `;
    }
}

/**
 * Load recommended resources using Gemini AI
 */
async function loadRecommendations() {
    const section = document.getElementById('recommendedSection');
    section.style.display = 'block';

    const data = await API.post('/ai/recommendations', {});
    const grid = document.getElementById('recommendedGrid');

    if (data.success && data.recommendations && data.recommendations.length > 0) {
        grid.innerHTML = data.recommendations.slice(0, 4).map(r => renderResourceCard(r)).join('');
    } else {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">✨</div>
                <h3>Start exploring to get personalized recommendations</h3>
                <p>View and download resources to train your recommendations.</p>
            </div>
        `;
    }
}

/**
 * Load latest resources
 */
async function loadLatest() {
    const data = await API.get('/resources?sort=newest&limit=8');
    const grid = document.getElementById('latestGrid');

    if (data.success && data.resources && data.resources.length > 0) {
        grid.innerHTML = data.resources.map(r => renderResourceCard(r)).join('');
    } else {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">📚</div>
                <h3>No resources yet</h3>
                <p>Be the first to share a resource with the community!</p>
            </div>
        `;
    }
}

/**
 * Search from home page — redirects to search page
 */
function searchFromHome() {
    const query = document.getElementById('homeSearch').value.trim();
    if (query) {
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }
}
