document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadData();

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/index.html';
        } catch (err) {
            console.error(err);
        }
    });

    // Create Link
    document.getElementById('create-link-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const urlInput = document.getElementById('url-input');
        const maxClicksInput = document.getElementById('max-clicks');
        const btn = document.getElementById('create-btn');

        const original_url = urlInput.value.trim();
        const max_clicks = maxClicksInput.value ? parseInt(maxClicksInput.value) : null;

        setLoading(btn, true, 'SHORTEN');

        try {
            const res = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_url, max_clicks })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('LINK PUBLISHED');
                urlInput.value = '';
                maxClicksInput.value = '';
                fetchLinks(); // Reload links
            } else {
                showToast(data.error || 'PUBLISH FAILED', 'error');
            }
        } catch (error) {
            showToast('NETWORK ANOMALY', 'error');
        } finally {
            setLoading(btn, false, 'SHORTEN');
        }
    });

    // Modal behavior
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-modal').classList.remove('active');
    });

    document.getElementById('edit-link-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-link-id').value;
        const newUrl = document.getElementById('edit-url-input').value.trim();

        try {
            const res = await fetch(`/api/links/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_url: newUrl })
            });

            if (res.ok) {
                showToast('ROUTE AMENDED');
                document.getElementById('edit-modal').classList.remove('active');
                fetchLinks();
            } else {
                const data = await res.json();
                showToast(data.error || 'AMENDMENT FAILED', 'error');
            }
        } catch (err) {
            showToast('NETWORK ANOMALY', 'error');
        }
    });
});

async function checkAuthAndLoadData() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.isAuthenticated) {
            window.location.href = '/index.html';
            return;
        }

        document.getElementById('username-display').textContent = data.user.username.toUpperCase();
        fetchLinks();
    } catch (err) {
        window.location.href = '/index.html';
    }
}

async function fetchLinks() {
    try {
        const res = await fetch('/api/links');
        const links = await res.json();
        renderLinks(links);
    } catch (err) {
        showToast('FAILED TO RETRIEVE ARCHIVES', 'error');
    }
}

function renderLinks(links) {
    const container = document.getElementById('links-container');
    container.innerHTML = '';

    if (links.length === 0) {
        container.innerHTML = '<p class="ui-text" style="grid-column: 1 / -1; padding: 2rem;">No circulars currently in print. Formulate a new direction above.</p>';
        return;
    }

    const currentOrigin = window.location.origin;

    links.forEach(link => {
        const card = document.createElement('div');
        const isExpired = link.max_clicks !== null && link.clicks >= link.max_clicks;

        card.className = `link-card ${link.is_active ? '' : 'inactive'}`;

        let statusBadge = '';
        if (link.is_active === 0) {
            statusBadge = '<span class="badge badge-inactive">PAUSED</span>';
        } else if (isExpired) {
            statusBadge = '<span class="badge badge-expired">CONCLUDED</span>';
        } else {
            statusBadge = '<span class="badge badge-active">CIRCULATING</span>';
        }

        const dateCreated = new Date(link.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        const lastAccess = link.last_accessed_at ?
            new Date(link.last_accessed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) :
            'NEVER';

        const shortUrlFull = `${currentOrigin}/${link.short_code}`;

        card.innerHTML = `
            <div class="card-header">
                <a href="${shortUrlFull}" target="_blank" class="short-url">/${link.short_code}</a>
                ${statusBadge}
            </div>
            <div class="original-url" title="${link.original_url}">${link.original_url}</div>
            
            <div class="grid-stats">
                <div class="stat">
                    <span class="stat-label">IMPRESSIONS</span>
                    <span class="stat-value">${link.clicks}</span>
                </div>
                <div class="stat" style="text-align: right; align-items: flex-end;">
                    <span class="stat-label">LIMIT</span>
                    <span class="stat-value">${link.max_clicks === null ? '∞' : link.max_clicks}</span>
                </div>
            </div>

            <div class="link-meta">
                <span>ESTABLISHED: ${dateCreated.toUpperCase()}</span>
                <span>LATEST ACCESS: ${lastAccess.toUpperCase()}</span>
            </div>

            <div class="link-actions">
                <button class="btn-secondary btn-sm copy-btn" data-url="${shortUrlFull}">DUPLICATE</button>
                <button class="btn-secondary btn-sm edit-btn" data-id="${link.id}" data-url="${link.original_url}">AMEND</button>
                <button class="btn-${link.is_active ? 'invert' : 'secondary'} btn-sm toggle-status-btn" data-id="${link.id}" data-active="${link.is_active}">
                    ${link.is_active ? 'PAUSE' : 'UNPAUSE'}
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    // Attach Event Listeners to dynamic buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            navigator.clipboard.writeText(e.target.dataset.url);
            const originalText = e.target.textContent;
            e.target.textContent = 'ACQUIRED';
            setTimeout(() => e.target.textContent = originalText, 2000);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const url = e.target.dataset.url;

            document.getElementById('edit-link-id').value = id;
            document.getElementById('edit-url-input').value = url;
            document.getElementById('edit-modal').classList.add('active');
        });
    });

    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const currentStatus = parseInt(e.target.dataset.active);
            const newStatus = currentStatus === 1 ? 0 : 1;

            try {
                const res = await fetch(`/api/links/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: newStatus })
                });

                if (res.ok) {
                    fetchLinks();
                }
            } catch (err) {
                showToast('STATUS ALTERATION FAILED', 'error');
            }
        });
    });
}

// UI Utilities
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 3000);
}

function setLoading(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '...';
    } else {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
