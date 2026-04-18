/**
 * dashboard.js — User Dashboard Logic
 * Loads user stats, bookmarks, study history, downloads, and uploads
 */

let dashboardUser = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAuth()) return;
    loadDashboard();
});

/**
 * Load dashboard data
 */
async function loadDashboard() {
    const data = await API.get('/auth/me');

    if (!data.success) {
        Toast.error('Failed to load dashboard.');
        return;
    }

    dashboardUser = data.user;

    // Update greeting
    const greeting = document.getElementById('dashGreeting');
    const hour = new Date().getHours();
    let greetText = 'Good evening';
    if (hour < 12) greetText = 'Good morning';
    else if (hour < 17) greetText = 'Good afternoon';
    greeting.textContent = `${greetText}, ${dashboardUser.name}! 👋`;

    // Update stats
    document.getElementById('statStudied').textContent = dashboardUser.studyHistory?.length || 0;
    document.getElementById('statBookmarks').textContent = dashboardUser.bookmarks?.length || 0;
    document.getElementById('statDownloads').textContent = dashboardUser.downloads?.length || 0;

    // Load uploads count
    loadMyUploadsCount();

    // Load recent activity
    loadRecentActivity();
}

/**
 * Load recent study activity for overview tab
 */
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    const history = dashboardUser.studyHistory || [];

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h3>No study activity yet</h3>
                <p>Start exploring resources to build your study history.</p>
            </div>
        `;
        return;
    }

    // Show last 10 entries in reverse order
    const recent = [...history].reverse().slice(0, 10);

    container.innerHTML = `
        <div class="card" style="padding: 0;">
            ${recent.map(entry => {
                const resource = entry.resourceId;
                if (!resource) return '';
                return `
                    <div class="flex items-center gap-3" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;"
                         onclick="window.location.href='/resource.html?id=${resource._id}'">
                        <span style="font-size: 1.5rem;">${getFileIcon(resource.fileType || 'document')}</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${resource.title || 'Untitled Resource'}
                            </div>
                            <div class="text-sm text-muted">${resource.subject || ''}</div>
                        </div>
                        <span class="text-sm text-muted">${formatDate(entry.viewedAt)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Switch between dashboard tabs
 */
function switchDashboardTab(tab) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    // Switch tab content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.add('active');

    // Load tab data
    switch (tab) {
        case 'bookmarks': loadBookmarks(); break;
        case 'history': loadStudyHistory(); break;
        case 'downloads': loadDownloads(); break;
        case 'myuploads': loadMyUploads(); break;
    }
}

/**
 * Load user's bookmarked resources
 */
async function loadBookmarks() {
    const grid = document.getElementById('bookmarksGrid');
    const data = await API.get('/auth/me');

    if (!data.success || !data.user.bookmarks || data.user.bookmarks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔖</div>
                <h3>No bookmarks yet</h3>
                <p>Save resources you want to revisit later.</p>
            </div>
        `;
        return;
    }

    // Fetch full details for bookmarked resources
    const bookmarks = data.user.bookmarks;
    let cardsHtml = '';
    for (const bookmark of bookmarks) {
        const resData = await API.get(`/resources/${bookmark._id || bookmark}`);
        if (resData.success && resData.resource) {
            cardsHtml += renderResourceCard(resData.resource);
        }
    }

    grid.innerHTML = cardsHtml || `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Save resources you want to revisit later.</p>
        </div>
    `;
}

/**
 * Load study history
 */
function loadStudyHistory() {
    const container = document.getElementById('historyList');
    const history = dashboardUser.studyHistory || [];

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h3>No study history</h3>
                <p>Resources you view will appear here.</p>
            </div>
        `;
        return;
    }

    const reversed = [...history].reverse();

    container.innerHTML = `
        <div class="card" style="padding: 0;">
            ${reversed.map(entry => {
                const resource = entry.resourceId;
                if (!resource) return '';
                return `
                    <div class="flex items-center gap-3" style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;"
                         onclick="window.location.href='/resource.html?id=${resource._id}'">
                        <span style="font-size: 1.5rem;">📄</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${resource.title || 'Untitled Resource'}
                            </div>
                            <div class="text-sm text-muted">${resource.subject || ''}</div>
                        </div>
                        <span class="text-sm text-muted">${formatDate(entry.viewedAt)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Load downloaded resources
 */
async function loadDownloads() {
    const grid = document.getElementById('downloadsGrid');

    if (!dashboardUser.downloads || dashboardUser.downloads.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⬇️</div>
                <h3>No downloads yet</h3>
                <p>Download resources to see them here.</p>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    for (const dlId of dashboardUser.downloads) {
        const resData = await API.get(`/resources/${dlId._id || dlId}`);
        if (resData.success && resData.resource) {
            cardsHtml += renderResourceCard(resData.resource);
        }
    }

    grid.innerHTML = cardsHtml || `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">⬇️</div>
            <h3>No downloads yet</h3>
        </div>
    `;
}

/**
 * Load user's uploaded resources
 */
async function loadMyUploads() {
    const grid = document.getElementById('myUploadsGrid');

    const data = await API.get(`/resources?limit=50`);
    if (data.success && data.resources) {
        const myResources = data.resources.filter(
            r => r.uploadedBy?._id === dashboardUser._id || r.uploadedBy === dashboardUser._id
        );

        if (myResources.length > 0) {
            grid.innerHTML = myResources.map(r => renderResourceCard(r)).join('');
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">📤</div>
                    <h3>No uploads yet</h3>
                    <p><a href="/upload.html">Upload your first resource!</a></p>
                </div>
            `;
        }
    }
}

/**
 * Load upload count for stats 
 */
async function loadMyUploadsCount() {
    const data = await API.get(`/resources?limit=100`);
    if (data.success && data.resources) {
        const count = data.resources.filter(
            r => r.uploadedBy?._id === dashboardUser._id || r.uploadedBy === dashboardUser._id
        ).length;
        document.getElementById('statUploads').textContent = count;
    }
}
