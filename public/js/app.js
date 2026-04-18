/**
 * app.js — Shared Utilities
 * API helper, auth state, navbar, toasts, and common functions
 */

// ============================================
// API Configuration
// ============================================
const API_BASE = '/api';

// ============================================
// Auth State Management
// ============================================
const Auth = {
    getToken() {
        return localStorage.getItem('token');
    },
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    requireAuth() {
        if (!this.isLoggedIn()) {
            Toast.warning('Please login to access this page.');
            setTimeout(() => window.location.href = '/login.html', 1000);
            return false;
        }
        return true;
    },
    requireAdmin() {
        if (!this.isAdmin()) {
            Toast.error('Admin access required.');
            setTimeout(() => window.location.href = '/', 1000);
            return false;
        }
        return true;
    }
};

// ============================================
// API Helper (Fetch wrapper with JWT)
// ============================================
const API = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = options.headers || {};

        // Add auth token if available
        const token = Auth.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add JSON content type for non-FormData requests
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            // Handle auth errors
            if (response.status === 401) {
                Auth.logout();
                return data;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        const options = { method: 'POST' };
        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
        return options.body instanceof FormData 
            ? this.request(endpoint, { method: 'POST', body: options.body, headers: {} })
            : this.request(endpoint, options);
    },

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// ============================================
// Toast Notification System
// ============================================
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info') {
        this.init();

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        this.container.appendChild(toast);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 4000);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// ============================================
// Navbar Rendering
// ============================================
function renderNavbar() {
    const user = Auth.getUser();
    const isLoggedIn = Auth.isLoggedIn();
    const isAdmin = Auth.isAdmin();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = isLoggedIn ? `
        <a href="/index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">🏠 Home</a>
        <a href="/search.html" class="nav-link ${currentPage === 'search.html' ? 'active' : ''}">🔍 Search</a>
        <a href="/upload.html" class="nav-link ${currentPage === 'upload.html' ? 'active' : ''}">📤 Upload</a>
        <a href="/dashboard.html" class="nav-link ${currentPage === 'dashboard.html' ? 'active' : ''}">📊 Dashboard</a>
        ${isAdmin ? `<a href="/admin.html" class="nav-link ${currentPage === 'admin.html' ? 'active' : ''}">⚙️ Admin</a>` : ''}
    ` : `
        <a href="/index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">🏠 Home</a>
        <a href="/search.html" class="nav-link ${currentPage === 'search.html' ? 'active' : ''}">🔍 Search</a>
    `;

    const navActions = isLoggedIn ? `
        <div class="navbar-actions">
            <!-- Notification Bell -->
            <div class="notif-wrapper" style="position: relative;">
                <button class="btn-icon btn-secondary" id="notifBell" onclick="toggleNotifPanel()" title="Notifications" style="position: relative; font-size: 1.15rem;">
                    🔔
                    <span id="notifBadge" class="notif-badge" style="display: none;">0</span>
                </button>
                <div class="notif-panel" id="notifPanel" style="display: none;">
                    <div class="notif-panel-header">
                        <strong>Notifications</strong>
                        <button class="comment-action" onclick="markAllNotifRead()">Mark all read</button>
                    </div>
                    <div class="notif-panel-body" id="notifList">
                        <div class="empty-state" style="padding: 1.5rem;"><p class="text-sm text-muted">No notifications</p></div>
                    </div>
                </div>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${user.name}</span>
            <div class="nav-avatar" title="Logout" onclick="Auth.logout()">${user.name.charAt(0).toUpperCase()}</div>
        </div>
    ` : `
        <div class="navbar-actions">
            <a href="/login.html" class="btn btn-primary btn-sm">Login</a>
        </div>
    `;

    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.innerHTML = `
            <a href="/index.html" class="navbar-brand">
                <div class="brand-icon">🎓</div>
                <span>AcadHub</span>
            </a>
            <button class="navbar-toggle" onclick="toggleMobileNav()">
                <span></span><span></span><span></span>
            </button>
            <nav class="navbar-nav" id="navbarMenu">
                ${navLinks}
            </nav>
            ${navActions}
        `;
    }

    // Start polling for notifications if logged in
    if (isLoggedIn) {
        loadNotifCount();
        setInterval(loadNotifCount, 30000); // poll every 30s
    }
}

function toggleMobileNav() {
    const menu = document.getElementById('navbarMenu');
    if (menu) menu.classList.toggle('open');
}

// ============================================
// Notification System
// ============================================
async function loadNotifCount() {
    const data = await API.get('/notifications/unread-count');
    if (data.success) {
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

async function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;

    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        await loadNotifications();
    } else {
        panel.style.display = 'none';
    }
}

async function loadNotifications() {
    const data = await API.get('/notifications');
    const list = document.getElementById('notifList');
    if (!list) return;

    if (data.success && data.notifications && data.notifications.length > 0) {
        list.innerHTML = data.notifications.slice(0, 20).map(n => {
            const typeIcons = {
                comment: '💬', reply: '↩️', rating: '⭐', download: '⬇️',
                report: '🚩', bookmark: '🔖', upload: '📤', admin: '⚙️', system: '🔔'
            };
            const icon = typeIcons[n.type] || '🔔';
            const unreadClass = n.isRead ? '' : 'notif-unread';
            const link = n.resourceId ? `/resource.html?id=${n.resourceId._id || n.resourceId}` : '#';

            return `
                <div class="notif-item ${unreadClass}" onclick="window.location.href='${link}'; markNotifRead('${n._id}')">
                    <span class="notif-icon">${icon}</span>
                    <div class="notif-content">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-msg">${n.message}</div>
                        <div class="notif-time">${formatDate(n.createdAt)}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        list.innerHTML = `<div class="empty-state" style="padding: 1.5rem;"><p class="text-sm text-muted">No notifications yet</p></div>`;
    }
}

async function markNotifRead(id) {
    await API.patch(`/notifications/${id}/read`, {});
}

async function markAllNotifRead() {
    await API.patch('/notifications/read-all', {});
    await loadNotifications();
    loadNotifCount();
    Toast.success('All notifications marked as read.');
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifPanel');
    const bell = document.getElementById('notifBell');
    if (panel && panel.style.display === 'block' && !panel.contains(e.target) && e.target !== bell && !bell.contains(e.target)) {
        panel.style.display = 'none';
    }
});

// ============================================
// Utility Functions
// ============================================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(fileType) {
    const icons = {
        pdf: '📄',
        document: '📝',
        image: '🖼️',
        video: '🎬',
        presentation: '📊',
        default: '📁'
    };
    return icons[fileType] || icons.default;
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function renderStars(rating, interactive = false, resourceId = null) {
    let html = '<div class="star-rating">';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= Math.round(rating) ? 'filled' : '';
        const clickHandler = interactive && resourceId 
            ? `onclick="rateResource('${resourceId}', ${i})"` 
            : '';
        html += `<span class="star ${filled}" ${clickHandler}>★</span>`;
    }
    html += '</div>';
    return html;
}

function renderResourceCard(resource) {
    const icon = getFileIcon(resource.fileType);
    const uploaderName = resource.uploadedBy?.name || 'Unknown';
    
    return `
        <div class="card resource-card" onclick="window.location.href='/resource.html?id=${resource._id}'">
            <div class="flex items-center justify-between">
                <span class="card-badge">${icon} ${resource.subject}</span>
                <span class="card-score">⭐ ${resource.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
            <h3 class="card-title">${resource.title}</h3>
            <p class="card-desc">${truncateText(resource.description, 120)}</p>
            <div class="card-meta">
                <span>👁️ ${resource.views || 0}</span>
                <span>⬇️ ${resource.downloads || 0}</span>
                <span>💬 ${resource.totalComments || 0}</span>
            </div>
            <div class="card-footer">
                <span class="card-author">by ${uploaderName}</span>
                <span class="text-muted text-sm">${formatDate(resource.createdAt)}</span>
            </div>
        </div>
    `;
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="spinner-overlay">
                <div class="spinner"></div>
            </div>
        `;
    }
}

function showEmpty(containerId, message = 'No items found', icon = '📭') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3>${message}</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
    }
}

// ============================================
// Initialize Navbar on DOM Load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
});

