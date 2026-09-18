/**
 * Gameunity — Dashboard Page
 * Fetches communities and events from the live NestJS backend.
 */

let _communities = [];
let _events      = [];
let _dashUsers   = [];

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadDashboardData() {
    try {
        [_communities, _events] = await Promise.all([
            window.API.communities.getAll(),
            window.API.events.getAll(),
        ]);
    } catch (err) {
        console.warn('[Dashboard] Backend unreachable, running in offline mode:', err.message);
        _communities = [];
        _events = [];
    }
    try {
        _dashUsers = await window.API.users.getAll();
    } catch (err) {
        _dashUsers = [];
    }
}

// ── Search ────────────────────────────────────────────────────────────────────
window.handleDashboardSearch = function (query) {
    const results = document.getElementById('dashSearchResults');
    if (!results) return;

    const q = query.trim().toLowerCase();
    if (!q) { results.style.display = 'none'; results.innerHTML = ''; return; }

    const communities = _communities
        .filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({ icon: c.icon || '🏘️', label: c.name, sub: 'Community', href: `community-page.html?id=${c.id}` }));

    const events = _events
        .filter(e => e.title?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(e => ({ icon: '📅', label: e.title, sub: 'Event', href: 'events.html' }));

    const people = _dashUsers
        .filter(u => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(u => ({ icon: '👤', label: u.username, sub: 'Person', href: null }));

    const all = [...communities, ...events, ...people];

    if (all.length === 0) {
        results.innerHTML = '<div style="padding:14px;font-size:13px;color:var(--text-3,#9ca3af);">No matches.</div>';
    } else {
        results.innerHTML = all.map(r => `
            <div class="dash-search-row" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;" ${r.href ? `onclick="window.location.href='${r.href}'"` : ''}>
                <span>${r.icon}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13.5px;">${escapeHTML(r.label)}</div>
                    <div style="font-size:11px;color:var(--text-3,#9ca3af);">${r.sub}</div>
                </div>
            </div>
        `).join('');
    }
    results.style.display = 'block';
};

document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.header-search');
    const results = document.getElementById('dashSearchResults');
    if (results && wrap && !wrap.contains(e.target)) results.style.display = 'none';
});

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    renderGreeting();
    renderJoinedCommunities();
    renderUpcomingEvents();
    renderRecentNotifications();
    updateStatsBanner();
}

async function renderRecentNotifications() {
    const container = document.getElementById('notif-list-container');
    if (!container) return;

    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user?.id || !window.API?.notifications) {
        container.innerHTML = '<div style="padding:16px;color:var(--text-3);font-size:13px;">No notifications yet.</div>';
        return;
    }

    let notifs = [];
    try {
        notifs = await window.API.notifications.getAll(user.id);
    } catch (err) {
        container.innerHTML = '<div style="padding:16px;color:var(--text-3);font-size:13px;">⚠️ Could not load notifications.</div>';
        return;
    }

    if (notifs.length === 0) {
        container.innerHTML = '<div style="padding:16px;color:var(--text-3);font-size:13px;">No notifications yet.</div>';
        return;
    }

    const icons = { reaction: '💬', report_status: '🛡', system: 'ℹ️' };
    container.innerHTML = notifs.slice(0, 5).map(n => `
        <div class="notif-row${n.read ? '' : ' unread'}" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border,rgba(255,255,255,0.06));">
            <span>${icons[n.type] || '🔔'}</span>
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;">${escapeHTML(n.text)}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${typeof formatRelativeTime === 'function' ? formatRelativeTime(n.createdAt) : ''}</div>
            </div>
        </div>
    `).join('');
}

window.markAllRead = async function () {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (user?.id && window.API?.notifications) {
        try { await window.API.notifications.markAllRead(user.id); } catch (err) { /* ignore */ }
    }
    await renderRecentNotifications();
    if (window.toast) window.toast('All notifications marked as read.');
};

function renderGreeting() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || '{}');
    const greetingNameEl = document.querySelector('.greeting-name');

    if (user && greetingNameEl) {
        const hour = new Date().getHours();
        let prefix = 'Good morning';
        if (hour >= 12) prefix = 'Good afternoon';
        if (hour >= 18) prefix = 'Good evening';
        const name = typeof getUserFullName === 'function' ? getUserFullName(user) : user.username;
        greetingNameEl.innerHTML = `${prefix}, <span class="user-name">${escapeHTML(name)}</span> 👋`;
    }

    if (typeof renderUserUI === 'function') renderUserUI();
}
function renderJoinedCommunities() {
    const container = document.querySelector('.communities-scroll');
    if (!container) return;

    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const hasJoined = joinedIds.length > 0;
    const joined = hasJoined
        ? _communities.filter(c => joinedIds.includes(String(c.id)))
        : _communities.slice(0, 3); // nothing joined yet — suggest a few instead

    const heading = container.parentElement?.querySelector('.section-title');
    if (heading && !hasJoined && !heading.dataset.suggestedLabel) {
        heading.dataset.originalText = heading.dataset.originalText || heading.textContent;
        heading.textContent = 'Suggested for you';
        heading.dataset.suggestedLabel = 'true';
    } else if (heading && hasJoined && heading.dataset.suggestedLabel) {
        heading.textContent = heading.dataset.originalText || heading.textContent;
        delete heading.dataset.suggestedLabel;
    }

    const commCards = joined.map(c => {
        const grad = c.grad || 'grad-purple';
        const bannerClass = grad.replace('grad-', 'banner-');
        return `
            <div class="community-card-link" onclick="window.location.href='community-page.html?id=${c.id}'">
              <div class="comm-card">
                <div class="comm-card-banner ${bannerClass}"></div>
                <div class="comm-card-icon ${grad}">${escapeHTML(c.icon) || '🏘️'}</div>
                <div class="comm-card-name">${escapeHTML(c.name)}</div>
                <div class="comm-card-meta">
                    <span>${(c.memberCount || 0).toLocaleString()} members</span>
                </div>
              </div>
            </div>
        `;
    });

    commCards.push(`
        <div class="community-card-link" onclick="window.location.href='create-community.html'">
          <div class="comm-card create-card">
            <div class="plus">+</div>
            <div class="comm-card-name" style="margin-top: 0;">Create Community</div>
            <div class="comm-card-meta">Start your journey</div>
          </div>
        </div>
    `);

    container.innerHTML = commCards.join('');
}

function renderUpcomingEvents() {
    const container = document.querySelector('.event-list');
    if (!container) return;

    const upcoming = _events.filter(e => e.status === 'approved').slice(0, 3);

    if (upcoming.length === 0) {
        container.innerHTML = '<div style="padding:20px; color:var(--text-3);">No upcoming events.</div>';
        return;
    }

    container.innerHTML = upcoming.map(ev => {
        const date  = new Date(ev.date);
        const day   = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-card" onclick="window.location.href='events.html'">
                <div class="event-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="event-info">
                    <h4>${escapeHTML(ev.title)}</h4>
                    <p>${escapeHTML(ev.time) || '—'} • ${ev.attendees || 0} attending</p>
                </div>
                <div class="event-action">→</div>
            </div>
        `;
    }).join('');
}

function updateStatsBanner() {
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const stats = document.querySelectorAll('.g-stat');
    stats.forEach(stat => {
        const label = stat.querySelector('.g-stat-label')?.textContent.toLowerCase();
        const valEl = stat.querySelector('.g-stat-val');
        if (label?.includes('communities') && valEl) {
            valEl.textContent = joinedIds.length;
        }
    });
}

// ── Header nav ────────────────────────────────────────────────────────────────
function initHeaderNavigation() {
    document.getElementById('headerProfile')?.addEventListener('click', () => {
        window.location.href = 'profile-settings.html';
    });
}

function initHorizontalScroll() {
    const sc = document.querySelector('.communities-scroll');
    if (!sc) return;
    sc.addEventListener('wheel', evt => { evt.preventDefault(); sc.scrollLeft += evt.deltaY; });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    renderDashboard();
    initHorizontalScroll();
    initHeaderNavigation();
    console.log('%c[Dashboard] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
