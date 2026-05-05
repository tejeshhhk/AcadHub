/**
 * admin.js — Admin Panel Logic
 * Manages users, resources, and reports with admin privileges
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAuth()) return;
    if (!Auth.requireAdmin()) return;
    loadAdminStats();
});

/**
 * Switch admin tabs
 */
function switchAdminTab(tab) {
    // Update sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    // Switch tab content
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tab}`);
    if (targetTab) targetTab.classList.add('active');

    // Load data
    switch (tab) {
        case 'stats': loadAdminStats(); break;
        case 'users': loadUsers(); break;
        case 'resources': loadAdminResources(); break;
        case 'resources': loadAdminResources(); break;
    }
}

/**
 * Load admin dashboard stats
 */
async function loadAdminStats() {
    const data = await API.get('/admin/stats');

    if (data.success) {
        const s = data.stats;
        document.getElementById('aStatUsers').textContent = s.totalUsers;
        document.getElementById('aStatResources').textContent = s.totalResources;
        document.getElementById('aStatComments').textContent = s.totalComments;
        document.getElementById('aStatNewUsers').textContent = s.newUsersThisWeek;
        document.getElementById('aStatNewResources').textContent = s.newResourcesThisWeek;

        // Top subjects
        const container = document.getElementById('topSubjects');
        if (s.topSubjects && s.topSubjects.length > 0) {
            const maxCount = s.topSubjects[0].count;
            container.innerHTML = s.topSubjects.map(sub => `
                <div class="flex items-center gap-3 mb-2">
                    <span style="width: 140px; font-size: 0.9rem; font-weight: 500;">${sub._id}</span>
                    <div style="flex: 1; height: 28px; background: var(--bg-glass); border-radius: 14px; overflow: hidden;">
                        <div style="height: 100%; width: ${(sub.count / maxCount) * 100}%; background: var(--accent-gradient); border-radius: 14px; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.75rem;">
                            <span style="font-size: 0.75rem; font-weight: 600; color: white;">${sub.count}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-sm">No subject data yet.</p>';
        }
    }
}

/**
 * Load all users
 */
async function loadUsers() {
    const data = await API.get('/admin/users');
    const container = document.getElementById('usersTable');

    if (data.success && data.users && data.users.length > 0) {
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.users.map(u => `
                        <tr>
                            <td style="font-weight: 600;">${u.name}</td>
                            <td style="color: var(--text-secondary);">${u.email}</td>
                            <td>
                                <span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}">
                                    ${u.role}
                                </span>
                            </td>
                            <td class="text-muted">${formatDate(u.createdAt)}</td>
                            <td>
                                <div class="flex gap-1">
                                    ${u.role === 'user' 
                                        ? `<button class="btn btn-outline btn-sm" onclick="changeRole('${u._id}', 'admin')">Make Admin</button>`
                                        : `<button class="btn btn-secondary btn-sm" onclick="changeRole('${u._id}', 'user')">Demote</button>`
                                    }
                                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = '<div class="empty-state"><h3>No users found.</h3></div>';
    }
}

/**
 * Change user role
 */
async function changeRole(userId, newRole) {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;

    const data = await API.patch(`/admin/users/${userId}/role`, { role: newRole });
    if (data.success) {
        Toast.success(data.message);
        loadUsers();
    } else {
        Toast.error(data.message);
    }
}

/**
 * Delete a user
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    const data = await API.delete(`/admin/users/${userId}`);
    if (data.success) {
        Toast.success(data.message);
        loadUsers();
        loadAdminStats();
    } else {
        Toast.error(data.message);
    }
}

/**
 * Load all resources for admin
 */
async function loadAdminResources() {
    const data = await API.get('/admin/resources');
    const container = document.getElementById('resourcesTable');

    if (data.success && data.resources && data.resources.length > 0) {
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Subject</th>
                        <th>Uploaded By</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.resources.map(r => `
                        <tr>
                            <td>
                                <a href="/resource.html?id=${r._id}" style="font-weight: 600; color: var(--text-primary);">
                                    ${truncateText(r.title, 40)}
                                </a>
                            </td>
                            <td><span class="badge badge-purple">${r.subject}</span></td>
                            <td style="color: var(--text-secondary);">${r.uploadedBy?.name || 'Unknown'}</td>
                            <td style="color: var(--accent-orange); font-weight: 600;">${r.score?.toFixed(1) || '0.0'}</td>
                            <td>
                                <span class="badge ${r.isHidden ? 'badge-red' : 'badge-green'}">
                                    ${r.isHidden ? 'Hidden' : 'Visible'}
                                </span>
                            </td>
                            <td>
                                <div class="flex gap-1">
                                    <button class="btn btn-secondary btn-sm" onclick="toggleHide('${r._id}')">
                                        ${r.isHidden ? '👁️ Show' : '🙈 Hide'}
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="forceDelete('${r._id}')">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = '<div class="empty-state"><h3>No resources found.</h3></div>';
    }
}

/**
 * Toggle resource visibility
 */
async function toggleHide(resourceId) {
    const data = await API.patch(`/admin/resources/${resourceId}/hide`, {});
    if (data.success) {
        Toast.success(data.message);
        loadAdminResources();
    } else {
        Toast.error(data.message);
    }
}

/**
 * Force delete a resource
 */
async function forceDelete(resourceId) {
    if (!confirm('Permanently delete this resource and all associated data?')) return;

    const data = await API.delete(`/admin/resources/${resourceId}`);
    if (data.success) {
        Toast.success(data.message);
        loadAdminResources();
        loadAdminStats();
    } else {
        Toast.error(data.message);
    }
}

// Report management functions removed
