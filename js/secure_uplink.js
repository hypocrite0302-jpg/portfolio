document.addEventListener('DOMContentLoaded', () => {
    initUplinkToggle();
    loadBlogFeed();
    initSignalForm();
});

function initUplinkToggle() {
    const uplinkRoot = document.getElementById('uplink-toggle');
    if (!uplinkRoot) return;

    const header = uplinkRoot.querySelector('.uplink-header');
    const menu = document.getElementById('uplink-menu');
    if (!header || !menu) return;

    const setState = (expanded) => {
        header.setAttribute('aria-expanded', String(expanded));
        menu.classList.toggle('hidden', !expanded);
    };

    setState(false);

    header.addEventListener('click', () => {
        const expanded = header.getAttribute('aria-expanded') === 'true';
        setState(!expanded);
    });

    document.addEventListener('click', (event) => {
        if (!uplinkRoot.contains(event.target)) {
            setState(false);
        }
    });
}

async function loadBlogFeed() {
    const list = document.getElementById('blog-posts');
    if (!list) return;

    const renderMessage = (message, className = 'dimmed') => {
        list.innerHTML = '';
        const p = document.createElement('p');
        p.className = className;
        p.textContent = message;
        list.appendChild(p);
    };

    try {
        const response = await fetch('data/feed.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Feed request failed with status ${response.status}`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload) || payload.length === 0) {
            renderMessage('No intel entries are published yet. Check back soon.');
            return;
        }

        list.innerHTML = '';

        payload.slice(0, 4).forEach((item) => {
            const article = document.createElement('article');
            article.className = 'blog-card';

            const dateNode = document.createElement('p');
            dateNode.className = 'blog-date';
            dateNode.textContent = formatDate(item.date);

            const titleNode = document.createElement('h3');
            titleNode.textContent = safeText(item.title, 'Untitled intel update');

            const summaryNode = document.createElement('p');
            summaryNode.textContent = safeText(item.summary, 'Summary unavailable for this entry.');

            const linkNode = document.createElement('a');
            linkNode.className = 'read-more';
            linkNode.textContent = 'Read Full Report';
            linkNode.href = safeUrl(item.url);

            if (linkNode.href.startsWith('http')) {
                linkNode.target = '_blank';
                linkNode.rel = 'noopener noreferrer';
            }

            article.append(dateNode, titleNode, summaryNode, linkNode);
            list.appendChild(article);
        });
    } catch (_error) {
        renderMessage('Secure feed is temporarily unavailable. Please refresh shortly.', 'error');
    }
}

function initSignalForm() {
    const form = document.getElementById('signal-form');
    const messageInput = document.getElementById('signal-message');
    const contactInput = document.getElementById('signal-contact');
    const responseNode = document.getElementById('signal-response');
    const slotsNode = document.getElementById('slots');

    if (!form || !messageInput || !contactInput || !responseNode || !slotsNode) {
        return;
    }

    let slots = clampSlots(localStorage.getItem('signal_slots'));
    updateSlotsUI(slotsNode, slots);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        responseNode.className = '';

        const message = messageInput.value.trim();
        const contact = contactInput.value.trim();

        if (!message || !contact) {
            setResponse(responseNode, 'Please provide both challenge summary and return channel.', true);
            return;
        }

        if (slots <= 0) {
            setResponse(responseNode, 'Current contact capacity is full. Please try again later.', true);
            return;
        }

        const submitButton = form.querySelector('#send-signal-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Transmitting...';
        }

        try {
            const endpoint = (window.PORTFOLIO_SIGNAL_ENDPOINT || '').trim();
            const payload = {
                message,
                contact,
                source: 'imayank.online portfolio',
                timestamp: new Date().toISOString()
            };

            if (endpoint) {
                if (!isSafeSignalEndpoint(endpoint)) {
                    throw new Error('Unsafe endpoint configuration detected.');
                }

                const request = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!request.ok) {
                    throw new Error(`Signal endpoint rejected request (${request.status})`);
                }
            } else {
                const subject = encodeURIComponent('Portfolio inquiry from imayank.online');
                const body = encodeURIComponent(`Contact: ${contact}\n\nChallenge:\n${message}`);
                window.location.href = `mailto:mayank@imayank.online?subject=${subject}&body=${body}`;
            }

            slots = Math.max(0, slots - 1);
            localStorage.setItem('signal_slots', String(slots));
            updateSlotsUI(slotsNode, slots);

            messageInput.value = '';
            contactInput.value = '';
            setResponse(responseNode, 'Signal acknowledged. You can expect a response shortly.', false);
        } catch (_error) {
            setResponse(responseNode, 'Transmission failed. Please retry or connect via LinkedIn from Uplink.', true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Transmit Signal';
            }
        }
    });
}

function clampSlots(value) {
    const numericValue = Number.parseInt(value || '10', 10);
    if (Number.isNaN(numericValue)) return 10;
    return Math.min(10, Math.max(0, numericValue));
}

function updateSlotsUI(node, slots) {
    node.textContent = `${slots}/10`;
}

function setResponse(node, message, isError) {
    node.textContent = message;
    node.classList.add(isError ? 'error' : 'success');
}

function safeText(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const text = value.trim();
    return text || fallback;
}

function safeUrl(value) {
    if (typeof value !== 'string') return '#';
    const candidate = value.trim();
    if (!candidate) return '#';

    if (candidate.startsWith('#')) return candidate;

    try {
        const parsed = new URL(candidate, window.location.origin);
        return parsed.toString();
    } catch (_error) {
        return '#';
    }
}

function isSafeSignalEndpoint(value) {
    try {
        const url = new URL(value, window.location.origin);

        if (url.protocol !== 'https:') return false;

        const blockedHosts = ['discord.com', 'discordapp.com', 'hooks.slack.com'];
        const isBlockedHost = blockedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
        if (isBlockedHost) return false;

        const normalizedPath = url.pathname.toLowerCase();
        const looksLikeWebhookPath =
            normalizedPath.includes('/api/webhooks/') ||
            normalizedPath.includes('/services/');
        if (looksLikeWebhookPath) return false;

        return true;
    } catch (_error) {
        return false;
    }
}

function formatDate(value) {
    if (typeof value !== 'string') return 'Date unavailable';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
