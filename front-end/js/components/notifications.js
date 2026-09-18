// ─── GLOBAL NOTIFICATIONS CONTROLLER ───
// Backed by the real GET/PATCH /api/notifications endpoints. There are exactly
// two real triggers today: someone reacting to your chat message, and one of
// your reports being resolved/escalated — both created server-side.

const NOTIF_HTML = `
<div class="notif-dropdown" id="globalNotifDropdown">
  <div class="notif-header">
    <span>Notifications</span>
    <span class="notif-mark-read" onclick="markAllNotifRead()">Mark all read</span>
  </div>
  <div class="notif-body" id="notif-body">
    <!-- Dynamic notifications will be injected here -->
  </div>
</div>`;

function escapeNotifText(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function getNotifUserId() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return user?.id || null;
}

function formatNotifTime(iso) {
    if (typeof formatRelativeTime === 'function') return formatRelativeTime(iso);
    try { return new Date(iso).toLocaleString(); } catch (e) { return ''; }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('globalNotifDropdown')) {
        document.body.insertAdjacentHTML('beforeend', NOTIF_HTML);
    }

    // Hook up ALL header bell icons
    document.querySelectorAll('.icon-btn').forEach(btn => {
        if (btn.textContent.trim().startsWith('🔔')) {
            btn.classList.add('notif-trigger');
            if (!btn.getAttribute('onclick')) {
                btn.addEventListener('click', (e) => toggleNotifications(e));
            }
        }
    });

    refreshNotifDot();
});

window.toggleNotifications = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const dropdown = document.getElementById('globalNotifDropdown');
    if (dropdown) {
        const isShowing = dropdown.classList.toggle('show');
        if (isShowing) renderDropdownContent();
    }
};

async function renderDropdownContent() {
    const body = document.getElementById('notif-body');
    if (!body) return;

    const userId = getNotifUserId();
    if (!userId) {
        body.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 13px;">Log in to see notifications.</div>';
        return;
    }
    if (!window.API?.notifications) {
        body.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 13px;">Notifications unavailable right now.</div>';
        return;
    }

    let notifs = [];
    try {
        notifs = await window.API.notifications.getAll(userId);
    } catch (err) {
        body.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 13px;">⚠️ Could not reach the server.</div>';
        return;
    }

    if (notifs.length === 0) {
        body.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-3); font-size: 13px;">No notifications yet.</div>';
        return;
    }

    const icons = { reaction: '💬', report_status: '🛡', system: 'ℹ️' };

    body.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}"
             data-id="${n.id}"
             data-type="${escapeNotifText(n.type)}"
             data-channel="${escapeNotifText(n.channelId || '')}"
             role="button"
             tabindex="0">
            <div class="notif-icon">${icons[n.type] || '🔔'}</div>
            <div class="notif-content">
                <div class="notif-text">${escapeNotifText(n.text)}</div>
                <div class="notif-time">${formatNotifTime(n.createdAt)}</div>
            </div>
        </div>
    `).join('');

    body.querySelectorAll('.notif-item').forEach(item => {
        const handleNavigation = async () => {
            const id = item.getAttribute('data-id');
            const type = item.getAttribute('data-type');
            const channel = item.getAttribute('data-channel');

            try {
                await window.API.notifications.markRead(id, true);
            } catch (err) { /* non-fatal — still navigate */ }
            refreshNotifDot();

            if (type === 'reaction' && channel) {
                window.location.href = `chat.html?channel=${encodeURIComponent(channel)}`;
            } else {
                item.classList.remove('unread');
            }
        };

        item.addEventListener('click', handleNavigation);
        item.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleNavigation(); });
    });
}

window.markAllNotifRead = async function() {
    const userId = getNotifUserId();
    if (userId && window.API?.notifications) {
        try { await window.API.notifications.markAllRead(userId); } catch (err) { /* ignore */ }
    }
    await renderDropdownContent();
    refreshNotifDot();
    if (window.toast) window.toast('All notifications marked as read.');
};

async function refreshNotifDot() {
    const userId = getNotifUserId();
    const dots = document.querySelectorAll('.notif-trigger .notif-dot');
    if (!dots.length) return;
    if (!userId || !window.API?.notifications) {
        dots.forEach(dot => dot.style.display = 'none');
        return;
    }
    try {
        const notifs = await window.API.notifications.getAll(userId);
        const hasUnread = notifs.some(n => !n.read);
        dots.forEach(dot => dot.style.display = hasUnread ? '' : 'none');
    } catch (err) {
        dots.forEach(dot => dot.style.display = 'none');
    }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('globalNotifDropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    if (!e.target.closest('#globalNotifDropdown') && !e.target.closest('.notif-trigger')) {
      dropdown.classList.remove('show');
    }
  }
});
