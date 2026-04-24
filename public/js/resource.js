/**
 * resource.js — Resource Detail Page Logic
 * Loads resource details, AI summary, rating, bookmarks, comments
 */

let currentResource = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        window.location.href = '/search.html';
        return;
    }
    loadResource(id);
});

/**
 * Load resource details
 */
async function loadResource(id) {
    const data = await API.get(`/resources/${id}`);

    if (!data.success || !data.resource) {
        document.getElementById('resourceContent').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔍</div>
                <h3>Resource not found</h3>
                <p><a href="/search.html">Back to search</a></p>
            </div>
        `;
        return;
    }

    currentResource = data.resource;
    document.title = `${currentResource.title} — Acudhb`;
    renderResource();
    loadComments(id);
}

/**
 * Render resource detail page
 */
function renderResource() {
    const r = currentResource;
    const isOwner = Auth.isLoggedIn() && Auth.getUser()?.id === r.uploadedBy?._id;
    const user = Auth.getUser();

    // Check if bookmarked (we'll check via API)
    const isLoggedIn = Auth.isLoggedIn();

    // Find user's existing rating
    let userRating = 0;
    if (isLoggedIn && r.ratings) {
        const found = r.ratings.find(rt => rt.userId === user?.id);
        if (found) userRating = found.rating;
    }

    const container = document.getElementById('resourceContent');
    container.innerHTML = `
        <!-- Main Content -->
        <div class="resource-main">
            <!-- Breadcrumb -->
            <div class="flex items-center gap-1 text-sm text-muted">
                <a href="/">Home</a> <span>›</span>
                <a href="/search.html?subject=${encodeURIComponent(r.subject)}">${r.subject}</a> <span>›</span>
                <span style="color: var(--text-secondary);">${truncateText(r.title, 40)}</span>
            </div>

            <!-- Title & Meta -->
            <div class="card" style="padding: 2rem;">
                <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span class="badge badge-purple">${getFileIcon(r.fileType)} ${r.fileType?.toUpperCase() || 'FILE'}</span>
                    ${isOwner ? `<button class="btn btn-danger btn-sm" onclick="deleteResource('${r._id}')">🗑️ Delete</button>` : ''}
                </div>
                <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem;">${r.title}</h1>
                <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.25rem;">${r.description}</p>
                
                <!-- Media Preview if applicable -->
                ${r.fileType === 'image' ? `<div style="margin-bottom: 1.5rem; text-align: center;"><img src="${r.fileUrl}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--border-color);" alt="Media Preview"></div>` : ''}
                ${r.fileType === 'video' ? `<div style="margin-bottom: 1.5rem; text-align: center;"><video src="${r.fileUrl}" controls style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--border-color);"></video></div>` : ''}
                ${r.fileType === 'pdf' ? `<div style="margin-bottom: 1.5rem;"><iframe src="${r.fileUrl.endsWith('.pdf') ? r.fileUrl : r.fileUrl + '.pdf'}" type="application/pdf" width="100%" height="500px" style="border: 1px solid var(--border-color); border-radius: 8px;"></iframe></div>` : ''}

                <div class="flex items-center gap-3 flex-wrap" style="color: var(--text-muted); font-size: 0.85rem;">

                    <span>📚 ${r.subject}</span>
                    ${r.topic ? `<span>📌 ${r.topic}</span>` : ''}
                    <span>👁️ ${r.views} views</span>
                    <span>⬇️ ${r.downloads} downloads</span>
                    <span>📅 ${formatDate(r.createdAt)}</span>
                    <span>by <strong style="color: var(--text-secondary);">${r.uploadedBy?.name || 'Unknown'}</strong></span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-wrap">
                <button class="btn btn-primary btn-lg" onclick="downloadResource('${r._id}', '${r.fileUrl}')">
                    ⬇️ Download File
                </button>
                ${isLoggedIn ? `
                    <button class="btn btn-secondary btn-lg" id="bookmarkBtn" onclick="toggleBookmark('${r._id}')">
                        🔖 Bookmark
                    </button>
                    <button class="btn btn-outline btn-lg" onclick="openReportModal()">
                        🚩 Report
                    </button>
                ` : ''}
            </div>

            <!-- Rating Section -->
            <div class="card">
                <h3 style="margin-bottom: 1rem;">⭐ Rate this Resource</h3>
                <div class="flex items-center gap-3">
                    <div class="star-rating" style="font-size: 1.5rem;">
                        ${[1,2,3,4,5].map(i => `
                            <span class="star ${i <= userRating ? 'filled' : ''} ${i <= Math.round(r.averageRating) && !userRating ? 'filled' : ''}" 
                                ${isLoggedIn ? `onclick="rateResource('${r._id}', ${i})" style="cursor: pointer;"` : 'style="cursor: default;"'}>★</span>
                        `).join('')}
                    </div>
                    <span style="color: var(--text-secondary);">${r.averageRating?.toFixed(1) || '0.0'} (${r.ratings?.length || 0} ratings)</span>
                </div>
                ${!isLoggedIn ? '<p class="text-sm text-muted mt-1">Login to rate this resource.</p>' : ''}
            </div>

            <!-- Comments Section -->
            <div class="card" style="padding: 0;">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
                    <h3>💬 Discussion</h3>
                </div>
                
                ${isLoggedIn ? `
                    <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                        <div class="flex gap-2">
                            <input type="text" class="form-input" id="commentInput" 
                                placeholder="Share your thoughts..." 
                                onkeydown="if(event.key==='Enter') addComment('${r._id}')">
                            <button class="btn btn-primary" onclick="addComment('${r._id}')">Post</button>
                        </div>
                    </div>
                ` : `
                    <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);">
                        <p class="text-sm text-muted"><a href="/login.html">Login</a> to join the discussion.</p>
                    </div>
                `}

                <div id="commentsContainer">
                    <div class="spinner-overlay"><div class="spinner spinner-sm"></div></div>
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="resource-sidebar-detail">
            <!-- AI Summary -->
            <div class="resource-summary">
                <h3>🤖 AI Summary</h3>
                <p id="aiSummary">${r.summary || 'Generating AI summary...'}</p>
                ${!r.summary && isLoggedIn ? `
                    <button class="btn btn-outline btn-sm mt-2" onclick="generateSummary('${r._id}')">
                        ✨ Generate Summary
                    </button>
                ` : ''}
            </div>

            <!-- Resource Score -->
            <div class="card">
                <h4 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">📊 Resource Score</h4>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        ${r.score?.toFixed(1) || '0.0'}
                    </div>
                    <p class="text-sm text-muted mt-1">Based on rating, views & downloads</p>
                </div>
            </div>

            <!-- Subject Tag -->
            <div class="card">
                <h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">📚 Subject</h4>
                <span class="badge badge-purple" style="font-size: 0.85rem; padding: 0.4rem 1rem;">${r.subject}</span>
                ${r.topic ? `<span class="badge badge-blue mt-1" style="font-size: 0.85rem; padding: 0.4rem 1rem; margin-left: 0.5rem;">${r.topic}</span>` : ''}
            </div>
        </div>
    `;

    // Check bookmark status
    if (isLoggedIn) {
        checkBookmarkStatus(r._id);
    }
}

/**
 * Check if resource is bookmarked
 */
async function checkBookmarkStatus(resourceId) {
    const data = await API.get('/auth/me');
    if (data.success && data.user.bookmarks) {
        const isBookmarked = data.user.bookmarks.some(b => (b._id || b) === resourceId);
        const btn = document.getElementById('bookmarkBtn');
        if (btn) {
            btn.textContent = isBookmarked ? '💜 Bookmarked' : '🔖 Bookmark';
        }
    }
}

/**
 * Rate a resource
 */
async function rateResource(resourceId, rating) {
    if (!Auth.isLoggedIn()) {
        Toast.warning('Please login to rate resources.');
        return;
    }

    const data = await API.post(`/resources/${resourceId}/rate`, { rating });
    if (data.success) {
        Toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''}!`);
        // Reload to update UI
        loadResource(resourceId);
    } else {
        Toast.error(data.message);
    }
}

/**
 * Toggle bookmark
 */
async function toggleBookmark(resourceId) {
    const data = await API.post(`/resources/${resourceId}/bookmark`, {});
    if (data.success) {
        Toast.success(data.message);
        const btn = document.getElementById('bookmarkBtn');
        if (btn) {
            btn.textContent = data.isBookmarked ? '💜 Bookmarked' : '🔖 Bookmark';
        }
    } else {
        Toast.error(data.message);
    }
}

/**
 * Download resource — tracks download AND triggers actual file download
 */
async function downloadResource(resourceId, fileUrl) {
    // Track the download on the server
    try {
        await API.post(`/resources/${resourceId}/download`, {}).catch(e => console.error(e));
    } catch(e) {}

    if (fileUrl.startsWith('http')) {
        // Transform Cloudinary URL to force download rather than inline preview
        let downloadUrl = fileUrl;
        if (fileUrl.includes('cloudinary.com') && fileUrl.includes('/upload/')) {
            downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        // Extract filename from fileUrl (fallback for old local files)
        const filename = fileUrl.split('/').pop();
        const link = document.createElement('a');
        link.href = `/api/download/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    Toast.success('Downloading file...');
}

/**
 * Generate AI summary
 */
async function generateSummary(resourceId) {
    Toast.info('Generating AI summary...');
    const data = await API.post('/ai/generate-summary', { resourceId });
    if (data.success) {
        document.getElementById('aiSummary').textContent = data.summary;
        Toast.success('Summary generated!');
    } else {
        Toast.error(data.message);
    }
}

/**
 * Delete resource
 */
async function deleteResource(resourceId) {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    const data = await API.delete(`/resources/${resourceId}`);
    if (data.success) {
        Toast.success('Resource deleted.');
        setTimeout(() => window.location.href = '/', 1000);
    } else {
        Toast.error(data.message);
    }
}

/**
 * Load comments for the resource
 */
async function loadComments(resourceId) {
    const data = await API.get(`/comments/${resourceId}`);
    const container = document.getElementById('commentsContainer');

    if (data.success && data.comments && data.comments.length > 0) {
        container.innerHTML = data.comments.map(c => renderComment(c)).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <div class="empty-icon">💬</div>
                <h3>No comments yet</h3>
                <p>Be the first to share your thoughts!</p>
            </div>
        `;
    }
}

/**
 * Render a single comment with replies
 */
function renderComment(comment) {
    const user = Auth.getUser();
    const isOwner = user && (comment.userId?._id === user.id);
    const isAdmin = Auth.isAdmin();
    const initial = comment.userId?.name?.charAt(0)?.toUpperCase() || '?';

    let repliesHtml = '';
    if (comment.replies && comment.replies.length > 0) {
        repliesHtml = `<div class="reply-list">`;
        repliesHtml += comment.replies.map(r => {
            const rInitial = r.userId?.name?.charAt(0)?.toUpperCase() || '?';
            return `
                <div class="reply-item">
                    <div class="comment-header">
                        <div class="comment-avatar" style="width: 26px; height: 26px; font-size: 0.65rem;">${rInitial}</div>
                        <span class="comment-author" style="font-size: 0.8rem;">${r.userId?.name || 'Unknown'}</span>
                        <span class="comment-time">${formatDate(r.createdAt)}</span>
                    </div>
                    <p class="comment-text" style="margin-left: 2.1rem; font-size: 0.85rem;">${r.reply}</p>
                </div>
            `;
        }).join('');
        repliesHtml += `</div>`;
    }

    return `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-avatar">${initial}</div>
                <span class="comment-author">${comment.userId?.name || 'Unknown'}</span>
                <span class="comment-time">${formatDate(comment.createdAt)}</span>
            </div>
            <p class="comment-text">${comment.comment}</p>
            <div class="comment-actions">
                ${Auth.isLoggedIn() ? `<button class="comment-action" onclick="showReplyForm('${comment._id}')">↩️ Reply</button>` : ''}
                ${isOwner || isAdmin ? `<button class="comment-action" onclick="deleteComment('${comment._id}')">🗑️ Delete</button>` : ''}
            </div>
            ${repliesHtml}
            <div class="reply-form hidden" id="replyForm-${comment._id}">
                <input type="text" class="form-input" id="replyInput-${comment._id}" placeholder="Write a reply..." 
                    onkeydown="if(event.key==='Enter') addReply('${comment._id}')">
                <button class="btn btn-primary btn-sm" onclick="addReply('${comment._id}')">Reply</button>
            </div>
        </div>
    `;
}

/**
 * Show reply form for a comment
 */
function showReplyForm(commentId) {
    const form = document.getElementById(`replyForm-${commentId}`);
    if (form) {
        form.classList.toggle('hidden');
        const input = document.getElementById(`replyInput-${commentId}`);
        if (input) input.focus();
    }
}

/**
 * Add a comment to the resource
 */
async function addComment(resourceId) {
    const input = document.getElementById('commentInput');
    const comment = input.value.trim();
    if (!comment) return;

    const data = await API.post('/comments', { resourceId, comment });
    if (data.success) {
        Toast.success('Comment posted!');
        input.value = '';
        loadComments(resourceId);
    } else {
        Toast.error(data.message);
    }
}

/**
 * Add a reply to a comment
 */
async function addReply(commentId) {
    const input = document.getElementById(`replyInput-${commentId}`);
    const reply = input.value.trim();
    if (!reply) return;

    const data = await API.post(`/comments/${commentId}/reply`, { reply });
    if (data.success) {
        Toast.success('Reply posted!');
        const resourceId = new URLSearchParams(window.location.search).get('id');
        loadComments(resourceId);
    } else {
        Toast.error(data.message);
    }
}

/**
 * Delete a comment
 */
async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return;

    const data = await API.delete(`/comments/${commentId}`);
    if (data.success) {
        Toast.success('Comment deleted.');
        const resourceId = new URLSearchParams(window.location.search).get('id');
        loadComments(resourceId);
    } else {
        Toast.error(data.message);
    }
}

/**
 * Open report modal
 */
function openReportModal() {
    if (!Auth.isLoggedIn()) {
        Toast.warning('Please login to report a resource.');
        return;
    }
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('reportReason').value = '';
    }
}

/**
 * Close report modal
 */
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('reportReason').value = '';
    }
}

/**
 * Submit report from modal
 */
async function submitReportModal() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason) {
        Toast.warning('Please enter a reason for reporting.');
        return;
    }

    const data = await API.post(`/resources/${currentResource._id}/report`, { reason });
    if (data.success) {
        Toast.success(data.message);
        closeReportModal();
    } else {
        Toast.error(data.message);
    }
}
