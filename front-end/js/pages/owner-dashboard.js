/**
 * Gameunity — Owner Statistics View
 * Read-only. Pulls GET /api/dashboard/stats + /api/dashboard/revenue for the
 * top-line numbers, and drills into the real underlying data (communities,
 * events, memberships, payments, subscriptions, organisers) on click — no
 * user/community/report management actions live here on purpose.
 */

function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof enforcePageAccess === 'function' && !enforcePageAccess()) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    try {
        const stats = await window.API.dashboard.stats();
        set('ow-comms', stats.totalCommunities);
        set('ow-events', stats.totalEvents);

        set('ow-health-backend', 'Reachable');
        set('ow-health-reports', stats.pendingReportsCount);
        set('ow-health-events', stats.pendingEventsCount);
        set('ow-health-appeals', stats.pendingAppealsCount);
    } catch (err) {
        console.error('[OwnerDashboard] Could not load stats:', err.message);
        set('ow-health-backend', '⚠️ Unreachable');
        if (window.toast) window.toast('⚠️ Could not reach the backend.');
    }

    try {
        const revenue = await window.API.dashboard.revenue();
        set('ow-rev-total', `₹${revenue.totalRevenue.toLocaleString()}`);
        set('ow-rev-monthly', `₹${revenue.monthlyRevenue.toLocaleString()}`);
        set('ow-rev-subs', `₹${revenue.subscriptionRevenue.toLocaleString()}`);
        set('ow-rev-organiser', `₹${revenue.organiserRevenue.toLocaleString()}`);
        set('ow-rev-featured', `₹${revenue.featuredEventRevenue.toLocaleString()}`);
        set('ow-rev-premium-users', revenue.premiumUsers);
        set('ow-rev-verified-organisers', revenue.verifiedOrganisers);
        set('ow-rev-pending-organisers', revenue.pendingOrganiserApplications);
    } catch (err) {
        console.error('[OwnerDashboard] Could not load revenue stats:', err.message);
    }
});

// ── Drill-down modal ─────────────────────────────────────────────────────────
const DRILL_TITLES = {
    communities: 'Communities',
    events: 'Events',
    revenue: 'Revenue — All Transactions',
    subscriptions: 'Subscriptions',
    organisers: { verified: 'Verified Organizers', pending: 'Pending Organizer Applications' },
};

window.openDrill = async function (kind, filter) {
    const modal = document.getElementById('drillModal');
    const titleEl = document.getElementById('drill-title');
    const bodyEl = document.getElementById('drill-body');
    if (!modal || !bodyEl) return;

    const title = kind === 'organisers' ? DRILL_TITLES.organisers[filter] : DRILL_TITLES[kind];
    titleEl.textContent = title || 'Details';
    bodyEl.innerHTML = `<div class="empty-state" style="padding:30px;"><div class="empty-state-text">Loading…</div></div>`;
    modal.style.display = 'flex';

    try {
        const html = await DRILL_RENDERERS[kind](filter);
        bodyEl.innerHTML = html;
    } catch (err) {
        bodyEl.innerHTML = `<div class="empty-state" style="padding:30px;"><div class="empty-state-text">⚠️ Could not load: ${esc(err.message)}</div></div>`;
    }
};

window.closeDrill = function () {
    const modal = document.getElementById('drillModal');
    if (modal) modal.style.display = 'none';
};

document.addEventListener('click', (e) => {
    const modal = document.getElementById('drillModal');
    if (modal && e.target === modal) closeDrill();
});

function emptyRow(colspan, text) {
    return `<tr><td colspan="${colspan}"><div class="empty-state" style="padding:20px;"><div class="empty-state-text">${esc(text)}</div></div></td></tr>`;
}

function table(headers, rows) {
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

const DRILL_RENDERERS = {
    communities: async () => {
        const [communities, users] = await Promise.all([
            window.API.communities.getAll(),
            window.API.users.getAll().catch(() => []),
        ]);
        const usersById = new Map((users || []).map(u => [String(u.id), u]));
        if (!communities.length) return table(['Name', 'Owner', 'Members', 'Category'], emptyRow(4, 'No communities yet.'));
        const rows = communities.map(c => {
            const owner = usersById.get(String(c.ownerId));
            return `<tr>
                <td><div class="row-name">${esc(c.icon || '🏘️')} ${esc(c.name)}</div></td>
                <td>${esc(owner?.username || `user#${c.ownerId}`)}</td>
                <td>${(c.memberCount || 0).toLocaleString()}</td>
                <td>${esc(c.category || 'Gaming')}</td>
            </tr>`;
        }).join('');
        return table(['Name', 'Owner', 'Members', 'Category'], rows);
    },

    events: async () => {
        const [events, communities] = await Promise.all([
            window.API.events.getAll(),
            window.API.communities.getAll().catch(() => []),
        ]);
        const commsById = new Map((communities || []).map(c => [String(c.id), c]));
        if (!events.length) return table(['Title', 'Community', 'Date', 'Status'], emptyRow(4, 'No events yet.'));
        const sorted = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
        const rows = sorted.map(e => `<tr>
            <td><div class="row-name">${esc(e.title)}</div><div class="row-sub">${esc(e.type || 'event')}${e.entryFee ? ` · ₹${e.entryFee} entry` : ''}</div></td>
            <td>${esc(commsById.get(String(e.communityId))?.name || `Community #${e.communityId}`)}</td>
            <td>${esc(e.date)}${e.time ? ' · ' + esc(e.time) : ''}</td>
            <td><span class="badge badge-${esc(e.status || 'pending')}">${esc(e.status || 'pending')}</span></td>
        </tr>`).join('');
        return table(['Title', 'Community', 'Date', 'Status'], rows);
    },

    revenue: async () => {
        const payments = await window.API.payments.history();
        if (!payments.length) return table(['Type', 'Amount', 'Description', 'Date'], emptyRow(4, 'No transactions yet.'));

        const byType = {};
        payments.forEach(p => { byType[p.type] = (byType[p.type] || 0) + p.amount; });
        const breakdown = Object.entries(byType).map(([type, amt]) =>
            `<div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:18px;">₹${amt.toLocaleString()}</div><div class="stat-label">${esc(type.replace(/_/g, ' '))}</div></div>`
        ).join('');

        const sorted = [...payments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
        const rows = sorted.map(p => `<tr>
            <td><span class="badge badge-active">${esc(p.type.replace(/_/g, ' '))}</span></td>
            <td>₹${p.amount.toLocaleString()}</td>
            <td>${esc(p.description || '')}</td>
            <td>${new Date(p.createdAt).toLocaleString()}</td>
        </tr>`).join('');

        return `<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));margin-bottom:18px;">${breakdown}</div>` +
            table(['Type', 'Amount', 'Description', 'Date'], rows) +
            (payments.length > 50 ? `<div class="table-footer">Showing 50 most recent of ${payments.length} transactions</div>` : '');
    },

    subscriptions: async () => {
        const data = await window.API.subscriptions.findAll();
        const byPlan = data.byPlan || {};
        const planCards = ['free', 'plus', 'ultra_pro'].map(plan =>
            `<div class="stat-card" style="padding:12px;"><div class="stat-value" style="font-size:18px;">${byPlan[plan] || 0}</div><div class="stat-label">${plan === 'ultra_pro' ? 'Ultra Pro' : esc(plan[0].toUpperCase() + plan.slice(1))}</div></div>`
        ).join('');

        const subscribers = data.subscribers || [];
        const rows = subscribers.length
            ? subscribers.map(s => `<tr>
                <td>${esc(s.username)}</td>
                <td><span class="badge badge-active">${s.plan === 'ultra_pro' ? 'Ultra Pro' : esc(s.plan[0].toUpperCase() + s.plan.slice(1))}</span></td>
                <td>${new Date(s.startedAt).toLocaleDateString()}</td>
            </tr>`).join('')
            : emptyRow(3, 'No paid subscribers right now.');

        return `<p style="font-size:12px;color:var(--text-3,#888);margin-bottom:14px;line-height:1.6;">
                "Active Premium Users" below is a live snapshot — how many people are on a paid plan <em>right now</em>.
                "Subscription Revenue" on the main dashboard is cumulative — every upgrade payment ever collected, which
                a later downgrade or cancellation doesn't reverse. The two numbers measure different things and won't
                always move together; that's expected, not a bug.
            </p>` +
            `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px;">${planCards}</div>` +
            table(['User', 'Plan', 'Since'], rows);
    },

    organisers: async (status) => {
        const list = await window.API.organisers.getAll(status);
        if (!list.length) return table(['User', 'Plan', 'Applied'], emptyRow(3, `No ${status} organisers.`));
        const rows = list.map(o => `<tr>
            <td>${esc(o.username || `user#${o.userId}`)}</td>
            <td><span class="badge badge-active">${o.plan === 'premium' ? 'Premium' : 'Free'}</span></td>
            <td>${o.appliedAt ? new Date(o.appliedAt).toLocaleDateString() : '—'}</td>
        </tr>`).join('');
        return table(['User', 'Plan', 'Applied'], rows);
    },
};
