/**
 * Gameunity — Event Registrants
 * Read-only page: everyone registered for one tournament, with the contact
 * details they gave at registration time. Reached from organizer-dashboard.js
 * ("Registrants" action per tournament row) — replaces the earlier CSV export.
 */

let toastTimer;

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

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof enforcePageAccess === 'function' && !enforcePageAccess()) return;

    const params = new URLSearchParams(window.location.search);
    const eventId = Number(params.get('eventId'));
    if (!eventId) {
        document.getElementById('registrants-count').textContent = 'No event specified.';
        return;
    }

    try {
        const { eventTitle, registrants } = await window.API.events.registrants(eventId);
        document.getElementById('pageTitle').textContent = `Registrants — ${eventTitle || 'Event'}`;
        document.getElementById('pageSub').textContent = `Everyone registered for "${eventTitle || 'this event'}", with the details they gave at sign-up.`;
        renderTable(registrants || []);
    } catch (err) {
        toast('⚠️ ' + err.message);
        document.getElementById('registrants-count').textContent = 'Could not load registrants.';
    }
});

function renderTable(registrants) {
    const tbody = document.getElementById('registrants-tbody');
    document.getElementById('registrants-count').textContent =
        `${registrants.length} registrant${registrants.length === 1 ? '' : 's'}`;

    if (registrants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">No registrations yet</div><div class="empty-state-sub">Registrants will show up here once people sign up.</div></div></td></tr>`;
        return;
    }

    tbody.innerHTML = registrants.map(r => `
        <tr>
            <td>${esc(r.fullName) || '<span style="color:var(--text-3,#666)">—</span>'}</td>
            <td>${esc(r.username)}</td>
            <td>${esc(r.email) || '<span style="color:var(--text-3,#666)">—</span>'}</td>
            <td>${esc(r.phone) || '<span style="color:var(--text-3,#666)">—</span>'}</td>
            <td>${esc(r.inGameId) || '<span style="color:var(--text-3,#666)">—</span>'}</td>
            <td>${r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '—'}</td>
        </tr>`).join('');
}
