/**
 * auth.js — Login/Register Page Logic
 */

// Redirect if already logged in
if (Auth.isLoggedIn()) {
    window.location.href = '/';
}

/**
 * Switch between login and register tabs
 */
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const data = await API.post('/auth/login', { email, password });

    if (data.success) {
        Auth.setAuth(data.token, data.user);
        Toast.success(data.message);
        setTimeout(() => window.location.href = '/', 800);
    } else {
        Toast.error(data.message || 'Login failed.');
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;

    // Validate passwords match
    if (password !== confirm) {
        Toast.error('Passwords do not match.');
        btn.disabled = false;
        btn.textContent = 'Create Account';
        return;
    }

    const data = await API.post('/auth/register', { name, email, password });

    if (data.success) {
        Auth.setAuth(data.token, data.user);
        Toast.success(data.message);
        setTimeout(() => window.location.href = '/', 800);
    } else {
        Toast.error(data.message || 'Registration failed.');
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}
