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
        if (data.isNotVerified) {
            sessionStorage.setItem('verifyEmail', data.email);
            Toast.info(data.message);
            setTimeout(() => window.location.href = '/verify.html', 1500);
            return;
        }
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
        sessionStorage.setItem('verifyEmail', email);
        Toast.success(data.message);
        setTimeout(() => window.location.href = '/verify.html', 1500);
    } else {
        Toast.error(data.message || 'Registration failed.');
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

/**
 * Toggle password visibility
 */
const ICONS = {
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
};

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = ICONS.eyeOff;
    } else {
        input.type = 'password';
        button.innerHTML = ICONS.eye;
    }
}
