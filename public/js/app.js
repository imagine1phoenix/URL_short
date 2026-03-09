/* =========================================================
   URL Shortener — Frontend Application Logic
   ========================================================= */

(function () {
    'use strict';

    // ----- DOM References -----
    const form = document.getElementById('shorten-form');
    const urlInput = document.getElementById('url-input');
    const shortenButton = document.getElementById('shorten-button');
    const buttonText = document.getElementById('button-text');
    const inputValidation = document.getElementById('input-validation');

    const resultSection = document.getElementById('result-section');
    const resultShortUrl = document.getElementById('result-short-url');
    const resultCopyBtn = document.getElementById('result-copy-btn');
    const resultCopyText = document.getElementById('result-copy-text');
    const resultOriginalUrl = document.getElementById('result-original-url');

    const linksCount = document.getElementById('links-count');
    const emptyState = document.getElementById('empty-state');
    const linksList = document.getElementById('links-list');

    const toastContainer = document.getElementById('toast-container');

    // ----- State -----
    let allLinks = [];

    // ----- Initialize -----
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        fetchLinks();
        form.addEventListener('submit', handleSubmit);
        resultCopyBtn.addEventListener('click', handleResultCopy);

        // Event delegation for copy buttons in link cards
        linksList.addEventListener('click', handleCardCopyClick);
    }

    // =========================================================
    // API CALLS
    // =========================================================

    async function fetchLinks() {
        try {
            const res = await fetch('/api/links');
            if (!res.ok) throw new Error('Failed to fetch links');
            allLinks = await res.json();
            renderLinks(allLinks);
        } catch (err) {
            console.error('Error fetching links:', err);
            showToast('Failed to load links.', 'error');
        }
    }

    async function shortenUrl(url) {
        const res = await fetch('/api/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Something went wrong.');
        }

        return data;
    }

    // =========================================================
    // FORM HANDLING
    // =========================================================

    async function handleSubmit(e) {
        e.preventDefault();

        const url = urlInput.value.trim();

        // Client-side validation
        if (!url) {
            showInputError('Please enter a URL.');
            return;
        }

        if (!isValidUrl(url)) {
            showInputError('Please enter a valid URL (e.g., https://example.com).');
            return;
        }

        clearInputError();
        setLoading(true);

        try {
            const link = await shortenUrl(url);

            // Show result card
            showResult(link);

            // Add to top of dashboard
            allLinks.unshift(link);
            prependLinkCard(link);
            updateCount();

            // Clear input
            urlInput.value = '';

            showToast('Link created successfully!', 'success');
        } catch (err) {
            showInputError(err.message);
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function setLoading(loading) {
        if (loading) {
            shortenButton.classList.add('is-loading');
            shortenButton.disabled = true;
        } else {
            shortenButton.classList.remove('is-loading');
            shortenButton.disabled = false;
        }
    }

    function showInputError(message) {
        urlInput.classList.add('input--error');
        inputValidation.textContent = message;

        // Remove error state after animation
        setTimeout(() => {
            urlInput.classList.remove('input--error');
        }, 400);
    }

    function clearInputError() {
        urlInput.classList.remove('input--error');
        inputValidation.textContent = '';
    }

    // =========================================================
    // RESULT DISPLAY
    // =========================================================

    function showResult(link) {
        resultShortUrl.href = link.shortUrl;
        resultShortUrl.textContent = link.shortUrl;
        resultOriginalUrl.textContent = link.originalUrl;

        // Store the short URL for copying
        resultCopyBtn.dataset.url = link.shortUrl;

        // Reset copy button
        resultCopyText.textContent = '📋 Copy';
        resultCopyBtn.classList.remove('is-copied');

        // Animate in
        resultSection.classList.add('is-visible');
        resultSection.setAttribute('aria-hidden', 'false');
    }

    function handleResultCopy() {
        const url = resultCopyBtn.dataset.url;
        copyToClipboard(url).then(() => {
            resultCopyText.textContent = 'Copied! ✓';
            resultCopyBtn.classList.add('is-copied');
            showToast('Copied to clipboard!', 'success');

            setTimeout(() => {
                resultCopyText.textContent = '📋 Copy';
                resultCopyBtn.classList.remove('is-copied');
            }, 2000);
        });
    }

    // =========================================================
    // LINK CARDS RENDERING
    // =========================================================

    function renderLinks(links) {
        linksList.innerHTML = '';

        if (links.length === 0) {
            emptyState.style.display = 'block';
            linksCount.textContent = '';
            return;
        }

        emptyState.style.display = 'none';
        updateCount();

        links.forEach((link, index) => {
            const card = createLinkCard(link);
            // Staggered entrance animation delay
            card.style.animationDelay = `${index * 50}ms`;
            linksList.appendChild(card);
        });
    }

    function prependLinkCard(link) {
        emptyState.style.display = 'none';

        const card = createLinkCard(link);
        card.classList.add('link-card--new');

        if (linksList.firstChild) {
            linksList.insertBefore(card, linksList.firstChild);
        } else {
            linksList.appendChild(card);
        }
    }

    function createLinkCard(link) {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.dataset.shortCode = link.shortCode;

        // Left side: URLs and date
        const info = document.createElement('div');
        info.className = 'link-card__info';

        const shortUrlEl = document.createElement('a');
        shortUrlEl.className = 'link-card__short-url';
        shortUrlEl.href = link.shortUrl;
        shortUrlEl.target = '_blank';
        shortUrlEl.rel = 'noopener noreferrer';
        shortUrlEl.textContent = link.shortUrl;

        const originalUrlEl = document.createElement('span');
        originalUrlEl.className = 'link-card__original-url';
        originalUrlEl.textContent = truncateUrl(link.originalUrl, 60);
        originalUrlEl.title = link.originalUrl;

        const dateEl = document.createElement('span');
        dateEl.className = 'link-card__date';
        dateEl.textContent = 'Created ' + timeAgo(link.createdAt);

        info.appendChild(shortUrlEl);
        info.appendChild(originalUrlEl);
        info.appendChild(dateEl);

        // Right side: clicks and copy
        const right = document.createElement('div');
        right.className = 'link-card__right';

        const clicks = document.createElement('div');
        clicks.className = 'link-card__clicks';

        const clickCount = document.createElement('span');
        clickCount.className = 'link-card__click-count';
        clickCount.textContent = formatNumber(link.clicks);

        const clickLabel = document.createElement('span');
        clickLabel.className = 'link-card__click-label';
        clickLabel.textContent = 'clicks';

        clicks.appendChild(clickCount);
        clicks.appendChild(clickLabel);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'link-card__copy-btn';
        copyBtn.type = 'button';
        copyBtn.title = 'Copy short URL';
        copyBtn.dataset.url = link.shortUrl;
        copyBtn.textContent = '📋';

        right.appendChild(clicks);
        right.appendChild(copyBtn);

        card.appendChild(info);
        card.appendChild(right);

        return card;
    }

    function updateCount() {
        linksCount.textContent = allLinks.length;
    }

    // =========================================================
    // CARD COPY (Event Delegation)
    // =========================================================

    function handleCardCopyClick(e) {
        const btn = e.target.closest('.link-card__copy-btn');
        if (!btn) return;

        const url = btn.dataset.url;
        copyToClipboard(url).then(() => {
            btn.textContent = '✓';
            btn.classList.add('is-copied');
            showToast('Copied to clipboard!', 'success');

            setTimeout(() => {
                btn.textContent = '📋';
                btn.classList.remove('is-copied');
            }, 2000);
        });
    }

    // =========================================================
    // CLIPBOARD
    // =========================================================

    async function copyToClipboard(text) {
        try {
            // Modern Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return;
            }
            // Fallback for older browsers
            fallbackCopy(text);
        } catch (err) {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textarea);
    }

    // =========================================================
    // TOAST NOTIFICATIONS
    // =========================================================

    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        const icon = type === 'success' ? '✓' : '✕';
        toast.textContent = `${icon}  ${message}`;

        toastContainer.appendChild(toast);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            toast.classList.add('is-leaving');
            toast.addEventListener('animationend', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }, 3000);
    }

    // =========================================================
    // UTILITY FUNCTIONS
    // =========================================================

    /**
     * Format a date string into a relative time string
     * e.g., "just now", "5 min ago", "2 hours ago", "3 days ago"
     */
    function timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString + 'Z'); // SQLite dates are UTC
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

        const years = Math.floor(months / 12);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }

    /**
     * Truncate a URL to a max length with ellipsis
     */
    function truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '…';
    }

    /**
     * Format large numbers with commas
     */
    function formatNumber(num) {
        return num.toLocaleString();
    }

})();
