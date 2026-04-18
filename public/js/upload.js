/**
 * upload.js — Upload Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAuth()) return;
});

/**
 * Update file label after selection
 */
function updateFileLabel(input) {
    const label = document.getElementById('fileLabelArea');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        label.innerHTML = `
            <span class="upload-icon">✅</span>
            <span class="upload-text" style="color: var(--accent-green);">${file.name}</span>
            <span class="upload-hint">Size: ${sizeMB} MB</span>
        `;
    }
}

/**
 * Handle upload form submission
 */
async function handleUpload(e) {
    e.preventDefault();
    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';

    const title = document.getElementById('uploadTitle').value.trim();
    const description = document.getElementById('uploadDescription').value.trim();
    const subject = document.getElementById('uploadSubject').value;
    const topic = document.getElementById('uploadTopic').value.trim();
    const fileInput = document.getElementById('uploadFile');

    if (!fileInput.files || !fileInput.files[0]) {
        Toast.error('Please select a file to upload.');
        btn.disabled = false;
        btn.textContent = '📤 Upload Resource';
        return;
    }

    // Check file size (50MB)
    if (fileInput.files[0].size > 50 * 1024 * 1024) {
        Toast.error('File size exceeds 50MB limit.');
        btn.disabled = false;
        btn.textContent = '📤 Upload Resource';
        return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('topic', topic);
    formData.append('file', fileInput.files[0]);

    const data = await API.post('/resources/upload', formData);

    if (data.success) {
        Toast.success(data.message || 'Resource uploaded successfully!');
        setTimeout(() => {
            window.location.href = `/resource.html?id=${data.resource._id}`;
        }, 1000);
    } else {
        Toast.error(data.message || 'Upload failed.');
        btn.disabled = false;
        btn.textContent = '📤 Upload Resource';
    }
}
