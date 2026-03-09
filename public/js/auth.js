document.addEventListener('DOMContentLoaded', () => {
    // Check if configured user exists and redirect
    checkAuthStatus();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Toggle views
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loginId = document.getElementById('login-id').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');

        setLoading(btn, true, 'AUTHORIZE ACCESS');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('AUTHORIZATION SUCCESSFUL', 'success');
                setTimeout(() => window.location.href = '/dashboard.html', 500);
            } else {
                showToast(data.error || 'AUTHORIZATION FAILED', 'error');
            }
        } catch (error) {
            showToast('NETWORK ANOMALY', 'error');
        } finally {
            setLoading(btn, false, 'AUTHORIZE ACCESS');
        }
    });

    // Handle Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('register-btn');

        setLoading(btn, true, 'ESTABLISH IDENTITY');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('IDENTITY ESTABLISHED', 'success');
                setTimeout(() => window.location.href = '/dashboard.html', 500);
            } else {
                showToast(data.error || 'REGISTRATION FAILED', 'error');
            }
        } catch (error) {
            showToast('NETWORK ANOMALY', 'error');
        } finally {
            setLoading(btn, false, 'ESTABLISH IDENTITY');
        }
    });
});

async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.isAuthenticated) {
            window.location.href = '/dashboard.html';
        }
    } catch (err) {
        console.error('Auth verification failed', err);
    }
}

// UI Utilities
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message.toUpperCase();
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}

function setLoading(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = 'PROCESSING...';
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
