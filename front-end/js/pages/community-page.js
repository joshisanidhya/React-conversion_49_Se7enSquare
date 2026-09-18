/**
 * Gameunity — Community Page
 * Fetches community data from GET /api/communities/:id and events from GET /api/events
 */

let _comm   = null;
let _events = [];

function getCommunityPageId() {
    return new URLSearchParams(window.location.search).get('id');
}

// ── Load from URL param ───────────────────────────────────────────────────────
async function loadCommunityData() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        // Fallback: load first community
        try {
            const all = await window.API.communities.getAll();
            _comm = all[0] || null;
        } catch (e) { _comm = null; }
    } else {
        try {
            _comm = await window.API.communities.getOne(id);
        } catch (e) {
            console.error('[CommunityPage] Could not load community id:', id, e);
            _comm = null;
        }
    }

    if (_comm) {
        try {
            const all = await window.API.events.getAll();
            _events = all.filter(e =>
                String(e.communityId) === String(_comm.id) &&
                e.status === 'approved'
            );
        } catch (e) { _events = []; }
    }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderCommunityData() {
    if (!_comm) {
        document.body.innerHTML += '<div style="padding:40px;text-align:center;color:var(--text-3)">Community not found.</div>';
        return;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('comm-icon',         _comm.icon  || '🏘️');
    set('comm-name-title',   _comm.name);
    set('breadcrumbCommunityName', _comm.name);
    set('comm-online-count', (_comm.onlineCount  || 0).toLocaleString());
    set('comm-member-count', (_comm.memberCount  || 0).toLocaleString());
    set('comm-category',     `💻 ${_comm.category || 'Gaming'} · Community`);
    set('comm-description',  _comm.description);
    set('stat-total-members', (_comm.memberCount  || 0).toLocaleString());
    set('stat-online-now',   (_comm.onlineCount  || 0).toLocaleString());

    const bigIcon = document.querySelector('.comm-big-icon');
    if (bigIcon) bigIcon.textContent = _comm.icon || '🏘️';

    document.querySelectorAll('.comm-name-text').forEach(el => el.textContent = _comm.name);

    const founded = document.getElementById('comm-founded');
    if (founded && _comm.createdAt) {
        founded.textContent = `📅 Founded ${new Date(_comm.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }

    // Channels count
    const channelSource = (_comm.channels && _comm.channels.length > 0)
        ? _comm.channels
        : (_comm.tags || []);
    const tabs = document.getElementById('tab-count-channels');
    if (tabs) tabs.textContent = channelSource.length;
    const tabMembers = document.getElementById('tab-count-members');
    if (tabMembers) tabMembers.textContent = (_comm.memberCount || 0).toLocaleString();

    // Use explicitly-created channels first, then fall back to tags
    renderChannelsFromTags(channelSource);
    renderCommunityEvents();
    renderCommunityMembers();
    renderRules();
    initJoinState(_comm.id);
    initCommunityNavigation(_comm.id);
}

// Generic defaults shown until the owner sets real rules via
// community-settings.html — was previously hardcoded straight into this
// page's HTML (identical for every community, and not editable anywhere).
const DEFAULT_RULES = [
    'Treat every member with kindness and respect. Personal attacks, harassment, hate speech, and discriminatory language of any kind are strictly prohibited.',
    "Keep discussions relevant to each channel's purpose. Use an off-topic channel for casual conversations.",
    'Unsolicited advertisements, excessive self-promotion, and repetitive posting are not allowed.',
    'When answering questions, be thorough and patient. Encourage learning at every level.',
    'Always credit the original author when sharing code, articles, or other content.',
    'Sharing pirated software, cracked licenses, or any illegal content is grounds for immediate permanent ban.',
    'Moderator decisions are final. If you disagree with an action, use the appeal process rather than arguing in public channels.',
];

function renderRules() {
    const container = document.getElementById('rulesMain');
    if (!container) return;

    const rules = (_comm.rules && _comm.rules.length) ? _comm.rules : DEFAULT_RULES;
    container.innerHTML = rules.map((text, i) => `
        <div class="rule-card">
            <div class="rule-num">${i + 1}</div>
            <div class="rule-body">
                <div class="rule-desc">${escapeHTML(text)}</div>
            </div>
        </div>
    `).join('');
}

// ── Members ───────────────────────────────────────────────────────────────────
let _members = []; // raw joined membership+user records for the current community

function initialsFromName(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

async function renderCommunityMembers() {
    const container = document.getElementById('membersContainer');
    if (!container || !_comm) return;

    container.innerHTML = '<div class="empty-state" style="padding:20px;color:var(--text-muted);font-size:13px;">Loading members…</div>';

    try {
        const [memberships, users] = await Promise.all([
            window.API.memberships.getAll({ communityId: _comm.id }),
            window.API.users.getAll(),
        ]);
        const usersById = new Map(users.map(u => [String(u.id), u]));
        _members = memberships.map(m => {
            const user = usersById.get(String(m.userId));
            const isOwner = user && String(user.id) === String(_comm.ownerId);
            const isMod = !isOwner && (user?.role === 'moderator' || user?.role === 'community_manager');
            return {
                userId: m.userId,
                name: user ? (user.username || user.email) : `User #${m.userId}`,
                role: isOwner ? 'owner' : (isMod ? 'moderator' : 'member'),
            };
        });
    } catch (err) {
        console.warn('[CommunityPage] Could not load real members:', err.message);
        _members = [];
    }

    renderMembersList('');
}

function renderMembersList(query) {
    const container = document.getElementById('membersContainer');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();
    const filtered = q ? _members.filter(m => m.name.toLowerCase().includes(q)) : _members;

    if (!filtered.length) {
        container.innerHTML = `<div class="empty-state" style="padding:20px;color:var(--text-muted);font-size:13px;">${_members.length ? 'No members match your search.' : 'No members yet.'}</div>`;
        return;
    }

    const groups = [
        { key: 'owner', label: '👑 Owner', roleClass: 'role-owner', roleLabel: 'Owner' },
        { key: 'moderator', label: '🛡 Moderators', roleClass: 'role-moderator', roleLabel: 'Moderator' },
        { key: 'member', label: '🟢 Members', roleClass: 'role-member', roleLabel: 'Member' },
    ];

    container.innerHTML = groups.map(g => {
        const members = filtered.filter(m => m.role === g.key);
        if (!members.length) return '';
        return `
            <div>
              <div class="member-group-title">${g.label} — ${members.length}</div>
              <div class="member-grid">
                ${members.map(m => `
                  <div class="member-card">
                    <div class="m-avatar grad-purple">
                      ${escapeHTML(initialsFromName(m.name))}
                      <div class="m-status bg-dot-green"></div>
                    </div>
                    <div class="m-name">${escapeHTML(m.name)}</div>
                    <span class="m-role ${g.roleClass}">${g.roleLabel}</span>
                    <button class="report-btn" style="margin-top:6px;" onclick="reportMember(${m.userId})">Report</button>
                  </div>
                `).join('')}
              </div>
            </div>
        `;
    }).join('') || `<div class="empty-state" style="padding:20px;color:var(--text-muted);font-size:13px;">No members match your search.</div>`;
}

window.filterMembers = function (query) {
    renderMembersList(query);
};

window.reportMember = function (userId) {
    window.location.href = `report.html?targetType=user&targetId=${encodeURIComponent(userId)}`;
};

function renderChannelsFromTags(tags) {
    const container = document.getElementById('channelsList');
    if (!container) return;

    // Determine if current user is a member
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isMember  = _comm ? joinedIds.includes(String(_comm.id)) : false;

    if (tags.length === 0) {
        container.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-3);">No channels yet.</div>';
        return;
    }

    const html = ['<div class="ch-group-title">💬 Channels</div>'];
    tags.forEach(item => {
        const rawName = typeof item === 'object' ? item.name : item;
        const chanName = escapeHTML(rawName);
        const chanType = typeof item === 'object' && item.type === 'Voice' ? 'VC' : '#';
        if (isMember) {
            // Member: clickable channel
            html.push(`
                <div class="ch-row" onclick="selectChannel(this, '${chanName}', '${chanType}')">
                    <span class='ch-icon'>${chanType}</span>
                    <span class='ch-name'>${chanName}</span>
                </div>
            `);
        } else {
            // Non-member: locked channel — shows join prompt on click
            html.push(`
                <div class="ch-row ch-locked" onclick="showJoinPrompt()" title="Join to access">
                    <span class='ch-icon'>🔒</span>
                    <span class='ch-name'>${chanName}</span>
                </div>
            `);
        }
    });

    container.innerHTML = html.join('');

    // Do not auto-click channels; let the user browse the community page first.
    if (!isMember) {
        // Show a join hint in the chat area
        const activeCh = document.getElementById('activeCh');
        const activeChDesc = document.getElementById('activeChDesc');
        if (activeCh)     activeCh.textContent     = 'Members Only';
        if (activeChDesc) activeChDesc.textContent = '🔒 Join this community to read and send messages.';
    }
}

function renderCommunityEvents() {
    const container = document.getElementById('activeEventsList');
    if (!container) return;

    if (_events.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px;">No active events yet</div>';
        return;
    }

    container.innerHTML = _events.map(ev => {
        const date  = new Date(ev.date);
        const day   = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });

        return `
            <div class="event-mini" onclick="window.location.href='events.html'">
                <div class="ev-date">
                    <div class="ev-mon">${month}</div>
                    <div class="ev-day">${day}</div>
                </div>
                <div class="ev-info">
                    <div class="ev-name">${escapeHTML(ev.title)}</div>
                    <div class="ev-meta">${escapeHTML(ev.time) || '—'} · ${ev.attendees || 0} attending</div>
                </div>
                <span class="ev-badge">${ev.status}</span>
            </div>
        `;
    }).join('');
}

// ── Actions ───────────────────────────────────────────────────────────────────
window.selectChannel = function (row, channelName, description) {
    // Highlight active row briefly for visual feedback
    document.querySelectorAll('.ch-row').forEach(r => r.classList.remove('active-ch'));
    if (row) row.classList.add('active-ch');

    // Navigate to chat.html with community + channel context
    const communityId = _comm?.id || new URLSearchParams(window.location.search).get('id') || '';
    const communityName = encodeURIComponent(_comm?.name || 'Community');
    const channel = encodeURIComponent(channelName);
    sessionStorage.setItem('currentCommunityId', String(communityId));
    sessionStorage.setItem('selectedChannel', channelName);
    sessionStorage.setItem('fromCommunityPage', 'true');

    setTimeout(() => {
        window.location.href = `chat.html?community=${communityId}&cname=${communityName}&channel=${channel}`;
    }, 150); // brief delay so active state is visible
};

window.toggleMainJoin = async function () {
    if (!_comm) return;
    const btn = document.getElementById('joinMainBtn');
    let joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const id = String(_comm.id);
    const isJoined = joinedIds.includes(id);
    const userId = JSON.parse(localStorage.getItem('nexus_user') || '{}').id || 3;

    if (isJoined) {
        try {
            const all = await window.API.memberships.getAll();
            const match = all.find(m => String(m.communityId) === id && String(m.userId) === String(userId));
            if (match) await window.API.memberships.delete(match.id);
        } catch (e) { /* ignore */ }
        joinedIds = joinedIds.filter(s => s !== id);
        if (btn) { btn.classList.remove('joined'); btn.textContent = '+ Join Community'; }
        if (window.toast) window.toast('Left community.');
    } else {
        try {
            await window.API.memberships.create({ userId: Number(userId), communityId: Number(_comm.id) });
        } catch (e) { /* duplicate is OK */ }
        joinedIds.push(id);
        if (btn) { btn.classList.add('joined'); btn.textContent = '✓ Joined'; }
        if (window.toast) window.toast(`Welcome to ${_comm.name}! 🚀`);
    }

    localStorage.setItem('nexus_joined_communities', JSON.stringify(joinedIds));
};

function initJoinState(communityId) {
    const btn = document.getElementById('joinMainBtn');
    if (!btn) return;
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    const isJoined = joinedIds.includes(String(communityId));
    if (isJoined) { btn.classList.add('joined'); btn.textContent = '✓ Joined'; }
    else { btn.classList.remove('joined'); btn.textContent = '+ Join Community'; }
}

window.switchTab = function (tabName, btn) {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('tab-' + tabName)?.classList.add('active');
};

function initCommunityNavigation(communityId) {
    const manageBtn = document.getElementById('rbacManageBtn');
    const deleteBtn = document.getElementById('rbacDeleteBtn');

    const user     = typeof getCurrentUser === 'function' ? getCurrentUser() : {};
    const ownedIds = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');

    // Single source of truth for "am I the owner" — this is the one real check
    // on this page; there used to be a second, disagreeing one keyed off a
    // different localStorage key that only the (now-removed) inline script used.
    const isOwner = ownedIds.includes(String(communityId))
        || (user?.id && String(_comm?.ownerId) === String(user.id))
        || user?.role === 'admin';

    // NOTE: the "hidden" class on these buttons in the HTML has no matching CSS
    // rule anywhere — it does nothing. Visibility is controlled entirely by the
    // inline style set here, for both buttons, so a non-owner never sees either.
    if (manageBtn) {
        manageBtn.href = `community-settings.html?id=${encodeURIComponent(communityId)}`;
        manageBtn.style.display = isOwner ? '' : 'none';
    }
    if (deleteBtn) {
        deleteBtn.style.display = isOwner ? '' : 'none';
    }
}

window.requestDeleteCommunity = async function () {
    if (!_comm) return;
    const confirmed = confirm(
        `Are you sure you want to permanently delete "${_comm.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
        await window.API.communities.delete(_comm.id);
    } catch (err) {
        if (window.toast) window.toast('⚠️ Could not delete community: ' + err.message);
        else alert('Could not delete community: ' + err.message);
        return;
    }

    const ownedIds = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');
    localStorage.setItem(
        'nexus_owned_community_ids',
        JSON.stringify(ownedIds.filter((id) => String(id) !== String(_comm.id))),
    );
    const joinedIds = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
    localStorage.setItem(
        'nexus_joined_communities',
        JSON.stringify(joinedIds.filter((id) => String(id) !== String(_comm.id))),
    );

    if (window.toast) window.toast('🗑️ Community deleted.');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
};

window.reportThisCommunity = function () {
    const targetId = _comm?.id || new URLSearchParams(window.location.search).get('id') || '';
    window.location.href = `report.html?targetType=community&targetId=${encodeURIComponent(targetId)}`;
};

window.showJoinPrompt = function () {
    if (window.toast) window.toast('🔒 Join this community first to access channels!');
    const btn = document.getElementById('joinMainBtn');
    if (btn) btn.classList.add('pulse-hint');
    setTimeout(() => btn?.classList.remove('pulse-hint'), 2000);
};

window.goBackFromCommunity = function () {
    const referrerPage = document.referrer.split('/').pop();
    const internalReferrer = ['discovery.html', 'dashboard.html', 'events.html'].some(page =>
        referrerPage.startsWith(page)
    );

    if (internalReferrer && window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = 'discovery.html';
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadCommunityData();
    renderCommunityData();
    console.log('%c[CommunityPage] %cLive backend data loaded.', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
