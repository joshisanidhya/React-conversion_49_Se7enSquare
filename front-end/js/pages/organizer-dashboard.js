/**
 * Gameunity — Organizer Dashboard
 * Certified Organizer view: create/manage tournaments this organizer hosts
 * (events whose createdBy === this user's username), track registrations,
 * and view each tournament's registrant list. All data from live backend API.
 *
 * Scope note: this is deliberately narrower than the System Admin's Events
 * page — an organizer manages ONLY the tournaments they created, not every
 * community's events. Approving other communities' submitted events stays
 * a community_manager/admin job (event-approval.html).
 */

let _myEvents        = [];
let _allCommunities  = [];
let _regCountByEvent = {};
let currentFilter    = 'all';
let modalAction       = null;
let toastTimer;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof enforcePageAccess === 'function' && !enforcePageAccess()) return;
    await loadAll();
    loadPlanCard();
    loadEarningsStat();
});

// Doc §16 revenue sharing — estimated 15% organiser earnings from paid tournaments'
// collected entry fees (informational; only the platform's cut is ever actually paid out).
async function loadEarningsStat() {
    const userId = currentUserId();
    if (!userId) return;
    try {
        const analytics = await window.API.organisers.analytics(userId);
        set('org-earnings', `₹${(analytics.estimatedOrganiserEarnings || 0).toLocaleString()}`);
    } catch (err) {
        console.error('[OrganizerDash] Could not load earnings:', err.message);
    }
}

function currentUsername() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return user?.username || '';
}

function currentUserId() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return user?.id;
}

// ── Organizer plan (Free / Premium) ──────────────────────────────────────────
async function loadPlanCard() {
    const userId = currentUserId();
    const el = document.getElementById('org-plan-card');
    if (!userId || !el) return;
    try {
        const profile = await window.API.organisers.profile(userId);
        const isPremium = profile.plan === 'premium';
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;">${isPremium ? '🏆 Premium Organizer' : '🆓 Free Organizer'}</div>
                    <div style="font-size:12px;color:var(--text-3,#888);margin-top:2px;">${isPremium ? 'Unlimited tournaments & participants.' : `Limited to ${profile.limits.maxActiveTournaments} active tournament, ${profile.limits.maxParticipants} participants.`}</div>
                </div>
                ${isPremium ? '' : '<button class="btn-primary" onclick="upgradeOrganiserPlan()">Upgrade to Premium</button>'}
            </div>`;
    } catch (err) {
        console.error('[OrganizerDash] Could not load plan:', err.message);
        el.innerHTML = '';
    }
}

window.upgradeOrganiserPlan = async function () {
    const userId = currentUserId();
    if (!userId) { toast('⚠️ No signed-in user id — please log back in'); return; }
    try {
        await window.API.organisers.upgradePlan(userId, 'premium');
        toast('🏆 Upgraded to Premium Organizer');
        loadPlanCard();
    } catch (err) {
        toast('⚠️ ' + err.message);
    }
};

// ── Promote (Featured Event) ─────────────────────────────────────────────────
window.promoteEvent = async function (eventId) {
    const userId = currentUserId();
    if (!userId) { toast('⚠️ No signed-in user id — please log back in'); return; }
    try {
        await window.API.featuredEvents.create(eventId, userId, 7);
        toast('📣 Promoted to the Discover carousel for 7 days');
    } catch (err) {
        toast('⚠️ ' + err.message);
    }
};

// ── Load ─────────────────────────────────────────────────────────────────────
async function loadAll() {
    try {
        const [events, communities, registrations] = await Promise.all([
            window.API.events.getAll(),
            window.API.communities.getAll(),
            window.API.eventRegistrations.getAll(),
        ]);
        _allCommunities = communities || [];
        const username = currentUsername();
        const userId = currentUserId();
        // Match by organiserId (new events) or createdBy username (legacy events created
        // before organiserId existed) — see the CreateEventDto.organiserId doc comment.
        _myEvents = (events || []).filter(e => e.organiserId === userId || e.createdBy === username);

        _regCountByEvent = {};
        (registrations || []).forEach(r => {
            _regCountByEvent[r.eventId] = (_regCountByEvent[r.eventId] || 0) + 1;
        });
    } catch (err) {
        console.error('[OrganizerDash] Failed to load data:', err);
        toast('⚠️ Backend unreachable. Is NestJS running?');
        _myEvents = [];
        _allCommunities = [];
        _regCountByEvent = {};
    }
    renderStats();
    renderTable();
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderStats() {
    const today = new Date().toISOString().slice(0, 10);
    set('org-total', _myEvents.length);
    set('org-pending', _myEvents.filter(e => e.status === 'pending').length);
    set('org-upcoming', _myEvents.filter(e => e.status === 'approved' && e.date >= today).length);
    set('org-regs', _myEvents.reduce((sum, e) => sum + (_regCountByEvent[e.id] || 0), 0));
}

function communityName(id) {
    const c = _allCommunities.find(item => Number(item.id) === Number(id));
    return c ? c.name : `Community #${id}`;
}

// ── Table ────────────────────────────────────────────────────────────────────
window.filterOrgEvents = function (status, btn) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
    renderTable();
};

function renderTable() {
    const tbody = document.getElementById('org-events-tbody');
    if (!tbody) return;

    let rows = [..._myEvents];
    if (currentFilter !== 'all') rows = rows.filter(e => e.status === currentFilter);
    rows.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = rows.map(e => `
        <tr>
            <td><div class="row-name">${esc(e.title)}</div><div class="row-sub">${esc(e.type || 'tournament')}${e.entryFee ? ` · ₹${e.entryFee} entry` : ' · free entry'}</div></td>
            <td>${esc(communityName(e.communityId))}</td>
            <td>${esc(e.date)}${e.time ? ' · ' + esc(e.time) : ''}</td>
            <td><span class="badge badge-${esc(e.status || 'pending')}">${esc(e.status || 'pending')}</span></td>
            <td>${_regCountByEvent[e.id] || 0}${e.maxAttendees ? ' / ' + e.maxAttendees : ''}</td>
            <td><div class="btn-row">
                <button class="act-btn act-edit" onclick="openEditModal(${e.id})">Edit</button>
                ${e.status === 'approved' ? `<button class="act-btn act-view" onclick="promoteEvent(${e.id})">Promote</button>` : ''}
                <button class="act-btn act-view" onclick="viewRegistrants(${e.id})">Registrants</button>
                <button class="act-btn act-delete" onclick="deleteMyEvent(${e.id})">Delete</button>
            </div></td>
        </tr>`).join('');

    set('org-events-count', `Showing ${rows.length} tournament${rows.length === 1 ? '' : 's'}`);

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">No tournaments ${currentFilter === 'all' ? 'yet' : 'in this filter'}</div><div class="empty-state-sub">Click "+ Host Tournament" to create one.</div></div></td></tr>`;
    }
}

// ── Create / Edit modal ──────────────────────────────────────────────────────
window.openCreateModal = function () {
    if (_allCommunities.length === 0) { toast('⚠️ No communities available — join or create one first'); return; }
    modalAction = 'create';
    document.getElementById('modal-title').textContent = 'Host a Tournament';
    document.getElementById('modal-body').innerHTML = eventFormHtml();
    document.getElementById('modal-confirm').textContent = 'Create Tournament';
    document.getElementById('modal').style.display = 'flex';
};

window.openEditModal = function (id) {
    const event = _myEvents.find(e => e.id === id);
    if (!event) return;
    modalAction = 'edit:' + id;
    document.getElementById('modal-title').textContent = 'Edit Tournament';
    document.getElementById('modal-body').innerHTML = eventFormHtml(event);
    document.getElementById('modal-confirm').textContent = 'Save Changes';
    document.getElementById('modal').style.display = 'flex';
};

function eventFormHtml(event = {}) {
    const commOptions = _allCommunities.map(c =>
        `<option value="${c.id}" ${Number(event.communityId) === Number(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`
    ).join('');
    const effectiveStatus = event.status || 'approved';
    return `
        <div class="form-group"><label class="form-label">Tournament Title</label><input class="form-input" id="f-title" value="${esc(event.title || '')}" maxlength="60"/></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="f-desc" value="${esc(event.description || '')}" maxlength="220"/></div>
        <div class="form-group"><label class="form-label">Community</label><select class="form-input" id="f-community">${commOptions}</select></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" id="f-date" value="${esc(event.date || '')}"/></div>
        <div class="form-group"><label class="form-label">Time</label><input class="form-input" id="f-time" value="${esc(event.time || '')}" placeholder="6:00 PM"/></div>
        <div class="form-group"><label class="form-label">Max Participants</label><input class="form-input" type="number" min="1" id="f-max" value="${event.maxAttendees || 100}"/></div>
        <div class="form-group"><label class="form-label">Entry Fee (₹)</label><input class="form-input" type="number" min="0" id="f-entry-fee" value="${event.entryFee || 0}"/>
            <div style="font-size:11px;color:var(--text-3,#666);margin-top:4px;">0 = free tournament. A 15% platform commission is logged per paid registration (doc §16).</div>
        </div>
        <div class="form-group"><label class="form-label">Prize Pool (₹)</label><input class="form-input" type="number" min="0" id="f-prize-pool" value="${event.prizePool || 0}"/></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="f-status">
            <option value="approved" ${effectiveStatus === 'approved' ? 'selected' : ''}>Approved (published)</option>
            <option value="pending" ${effectiveStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="cancelled" ${effectiveStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select></div>`;
}

window.confirmModal = async function () {
    const title         = document.getElementById('f-title')?.value.trim();
    const description   = document.getElementById('f-desc')?.value.trim();
    const communityId   = Number(document.getElementById('f-community')?.value);
    const date           = document.getElementById('f-date')?.value;
    const time           = document.getElementById('f-time')?.value.trim();
    const maxAttendees   = Number(document.getElementById('f-max')?.value) || undefined;
    const entryFee       = Number(document.getElementById('f-entry-fee')?.value) || 0;
    const prizePool      = Number(document.getElementById('f-prize-pool')?.value) || 0;
    const status         = document.getElementById('f-status')?.value;

    if (!title || title.length < 3)             { toast('⚠️ Title must be at least 3 characters'); return; }
    if (!description || description.length < 10) { toast('⚠️ Description must be at least 10 characters'); return; }
    if (!communityId)                             { toast('⚠️ Select a community'); return; }
    if (!date)                                    { toast('⚠️ Select a date'); return; }

    const payload = {
        title, description, communityId, date, time, maxAttendees, status, entryFee, prizePool,
        type: 'tournament',
        createdBy: currentUsername(),
        organiserId: currentUserId(),
    };

    try {
        if (modalAction === 'create') {
            await window.API.events.create(payload);
            toast('🏆 Tournament created');
        } else if (modalAction && modalAction.startsWith('edit:')) {
            const id = Number(modalAction.split(':')[1]);
            await window.API.events.update(id, payload);
            toast('✅ Tournament updated');
        }
    } catch (err) {
        toast('⚠️ ' + err.message);
        return;
    }

    closeModal();
    await loadAll();
};

window.closeModal = function () {
    document.getElementById('modal').style.display = 'none';
    modalAction = null;
};

document.getElementById('modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

window.deleteMyEvent = async function (id) {
    if (!confirm('Delete this tournament? This cannot be undone.')) return;
    try {
        await window.API.events.delete(id);
        toast('🗑️ Tournament deleted');
        await loadAll();
    } catch (err) {
        toast('⚠️ ' + err.message);
    }
};

// ── Registrants ──────────────────────────────────────────────────────────────
// Opens the dedicated registrants page (replaces the earlier CSV export).
window.viewRegistrants = function (eventId) {
    window.location.href = `event-registrants.html?eventId=${eventId}`;
};

// ── Utilities ──────────────────────────────────────────────────────────────
function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
    const t    = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const txt  = document.getElementById('toastMsg');
    if (!t) return;
    const parts = msg.match(/^(\S+)\s(.+)$/);
    if (parts && icon && txt) { icon.textContent = parts[1]; txt.textContent = parts[2]; }
    else if (txt) { if (icon) icon.textContent = '✅'; txt.textContent = msg; }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
