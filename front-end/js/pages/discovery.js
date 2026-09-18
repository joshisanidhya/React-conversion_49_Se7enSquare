/**
 * Gameunity — Discovery Page
 * Fully backend-driven: fetches communities from GET /api/communities
 */

// --- 1. STATE ---
let activeCategory = 'all';
let searchQuery    = '';
let currentSort    = 'active';
let _communities   = []; // in-memory cache from backend

// --- 2. LOAD FROM BACKEND ---
async function loadCommunities() {
    try {
        _communities = await window.API.communities.getAll();
    } catch (err) {
        console.error('[Discovery] Failed to load communities:', err);
        _communities = [];
        const grid = document.getElementById('commGrid');
        if (grid) grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3)">
            ⚠️ Could not reach backend. Is the NestJS server running on port 3000?
        </div>`;
    }
}

// --- 3. DYNAMIC RENDERING ---
function renderCommunities() {
    updateHeroStats();
    renderFeaturedCommunity();

    const grid = document.getElementById('commGrid');
    if (!grid) return;

    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');

    let filtered = _communities.filter(c => {
        const matchesCat = activeCategory === 'all' ||
            (c.category || '').toLowerCase() === activeCategory ||
            (c.tags || []).some(t => t.toLowerCase() === activeCategory);
        const matchesSearch = !searchQuery ||
            c.name.toLowerCase().includes(searchQuery) ||
            (c.description || '').toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    filtered = applySortingLogic(filtered);

    const countDisplay = document.getElementById('gridCount');
    if (countDisplay) countDisplay.textContent = `Showing ${filtered.length} of ${_communities.length}`;

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3)">No communities found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = filtered.map((c, index) => {
        const isJoined = joinedList.includes(String(c.id));
        const icon = escapeHTML(c.icon) || '🏘️';
        const grad = c.grad || 'grad-purple';
        const bannerClass = grad.replace('grad-', 'banner-');

        return `
            <div class="c-card delay-${(index % 10) * 5}" onclick="navigateToCommunity(event, '${c.id}')">
                <div class="c-banner ${bannerClass}">
                    <div class="c-banner-inner">${icon}${icon}${icon}</div>
                </div>
                <div class="c-card-body">
                    <div class="c-top">
                        <div class="c-icon ${grad}">${icon}</div>
                        <div class="c-badges">
                            ${(c.memberCount || 0) > 15000 ? '<span class="c-badge badge-trending">🔥 Trending</span>' : ''}
                            ${(c.onlineCount  || 0) >  1000 ? '<span class="c-badge badge-hot">⭐ Hot</span>'      : ''}
                        </div>
                    </div>
                    <div>
                        <div class="c-name">${escapeHTML(c.name)}</div>
                        <div class="c-cat">${escapeHTML(c.category) || 'Gaming'} · ${(c.tags || []).map(escapeHTML).join(', ') || 'Community'}</div>
                    </div>
                    <div class="c-desc">${escapeHTML(c.description)}</div>
                    <div class="c-footer">
                        <div class="c-stats">
                            <span class="c-stat">👥 ${(c.memberCount || 0).toLocaleString()}</span>
                            <span class="c-stat">🟢 ${(c.onlineCount  || 0).toLocaleString()} online</span>
                        </div>
                        <button class="btn-join ${isJoined ? 'joined' : ''}" onclick="toggleJoin(event, '${c.id}')">
                            ${isJoined ? '✓ Joined' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderFeaturedCommunity() {
    const container = document.getElementById('featuredSection');
    if (!container || _communities.length === 0) {
        if (container) container.style.display = 'none';
        return;
    }

    const feat = [..._communities].sort((a, b) => (b.onlineCount || 0) - (a.onlineCount || 0))[0];
    const joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isJoined = joinedList.includes(String(feat.id));

    container.innerHTML = `
        <div class="featured-banner" onclick="navigateToCommunity(event, '${feat.id}')">
            <div class="feat-icon ${feat.grad || 'grad-purple'}">${escapeHTML(feat.icon) || '🏘️'}</div>
            <div class="feat-info">
                <div class="feat-name">${escapeHTML(feat.name)}</div>
                <div class="feat-desc">${escapeHTML(feat.description)}</div>
                <div class="feat-meta">
                    <div class="feat-tag"><span class="dot"></span> ${(feat.onlineCount || 0).toLocaleString()} online</div>
                    <div class="feat-tag">👥 ${(feat.memberCount || 0).toLocaleString()} members</div>
                    <div class="feat-tag">📍 ${escapeHTML(feat.category) || 'Gaming'}</div>
                </div>
            </div>
            <button class="btn-join-feat ${isJoined ? 'joined' : ''}" onclick="toggleJoin(event, '${feat.id}')">
                ${isJoined ? '✓ Joined' : 'Join Community'}
            </button>
        </div>
    `;
}

function applySortingLogic(list) {
    switch (currentSort) {
        case 'active':  return [...list].sort((a, b) => (b.onlineCount  || 0) - (a.onlineCount  || 0));
        case 'members': return [...list].sort((a, b) => (b.memberCount  || 0) - (a.memberCount  || 0));
        case 'trending':return [...list].sort((a, b) =>
            ((b.onlineCount || 0) / Math.max(b.memberCount || 1, 1)) -
            ((a.onlineCount || 0) / Math.max(a.memberCount || 1, 1)));
        case 'newest':  return [...list].sort((a, b) => b.id - a.id);
        default:        return list;
    }
}

function updateHeroStats() {
    const totalMembers = _communities.reduce((s, c) => s + (c.memberCount || 0), 0);
    const totalOnline  = _communities.reduce((s, c) => s + (c.onlineCount  || 0), 0);
    const stats = document.querySelectorAll('.h-stat strong');
    if (stats.length >= 3) {
        stats[0].textContent = _communities.length.toLocaleString();
        stats[1].textContent = totalMembers > 1000 ? (totalMembers / 1000).toFixed(1) + 'k' : totalMembers;
        stats[2].textContent = totalOnline.toLocaleString();
    }
}

// --- 4. EVENT HANDLERS ---
window.toggleSortDropdown = function () {
    document.getElementById('sortDropdown')?.classList.toggle('show');
};

window.applySort = function (type, label) {
    currentSort = type;
    document.getElementById('sortBtn').textContent = `⇅ Sort: ${label}`;
    document.getElementById('sortDropdown')?.classList.remove('show');
    renderCommunities();
};

window.setChip = function (el, category) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    activeCategory = category.toLowerCase();
    renderCommunities();
};

window.filterCards = function () {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    renderCommunities();
};

window.toggleJoin = async function (event, communityId) {
    event.stopPropagation();
    let joinedList = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const id = String(communityId);
    const isJoined = joinedList.includes(id);
    const role = JSON.parse(localStorage.getItem('nexus_user') || '{}').role || 'user';
    const userId = JSON.parse(localStorage.getItem('nexus_user') || '{}').id || 3;

    if (isJoined) {
        // Find & delete the membership
        try {
            const all = await window.API.memberships.getAll();
            const match = all.find(m => String(m.communityId) === id && String(m.userId) === String(userId));
            if (match) await window.API.memberships.delete(match.id);
        } catch (e) { /* ignore */ }
        joinedList = joinedList.filter(s => s !== id);
        if (window.toast) window.toast('Left community.');
    } else {
        try {
            await window.API.memberships.create({ userId: Number(userId), communityId: Number(communityId) });
        } catch (e) { /* duplicate is OK */ }
        joinedList.push(id);
        const comm = _communities.find(c => String(c.id) === id);
        if (window.toast && comm) window.toast(`Welcome to ${comm.name}! ⚡`);
    }

    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedList));
    renderCommunities();
};

window.navigateToCommunity = function (event, id) {
    if (event.target.tagName === 'BUTTON') return;
    window.location.href = `community-page.html?id=${id}`;
};

document.addEventListener('click', e => {
    if (!e.target.closest('.sort-container')) {
        document.getElementById('sortDropdown')?.classList.remove('show');
    }
});

// --- Featured Tournaments carousel (organizer pay-to-promote, doc §18) ---
async function loadAndRenderFeaturedEvents() {
    const container = document.getElementById('featuredEventsSection');
    if (!container) return;
    try {
        const featured = await window.API.featuredEvents.getAll();
        if (!Array.isArray(featured) || featured.length === 0) {
            container.innerHTML = '';
            return;
        }
        container.innerHTML = `
            <div class="featured-events-heading">🏆 Featured Tournaments</div>
            <div class="featured-events-row">
                ${featured.map(item => {
                    const e = item.event || {};
                    return `
                    <div class="fe-card" onclick="window.location.href='events.html'">
                        <span class="fe-tag">FEATURED</span>
                        <div class="fe-title">${escapeHTML(e.title || 'Tournament')}</div>
                        <div class="fe-meta">📅 ${escapeHTML(e.date || '')}${e.time ? ' · ' + escapeHTML(e.time) : ''}</div>
                        <div class="fe-meta">👥 ${e.attendees || 0}/${e.maxAttendees || '∞'}</div>
                    </div>`;
                }).join('')}
            </div>`;
    } catch (err) {
        console.warn('[Discovery] Featured events unavailable:', err.message);
        container.innerHTML = '';
    }
}

// --- 5. STARTUP ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadCommunities();
    renderCommunities();
    loadAndRenderFeaturedEvents();

    window.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }
    });

    console.log('%c[Discovery] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
