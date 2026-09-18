/**
 * Gameunity — Report Submission Page
 * Submits reports to POST /api/reports on the NestJS backend.
 *
 * Target resolution:
 *   ?targetType=post&targetId=<id>&channelId=<id>   — from a chat message's "Report Message"
 *   ?targetType=community&targetId=<id>              — from a Community Page's "Report an Issue"
 *   ?targetType=user&targetId=<id>                   — from a member row's "Report" action
 *   (no params)                                       — generic entry (sidebar) — search for a user below
 */

let currentReportStep      = 1;
let selectedViolationReason = 'Hate Speech';
let resolvedTarget = null; // { type: 'post'|'user'|'community', id, label, recap? }
let allUsersCache = null;

const reportParams = new URLSearchParams(window.location.search);
const urlTargetType = reportParams.get('targetType');
const urlTargetId   = reportParams.get('targetId');
const urlChannelId  = reportParams.get('channelId');

// ── Step navigation ───────────────────────────────────────────────────────────
window.goStep = function (step) {
    if (step > 1 && !resolvedTarget) {
        if (window.toast) window.toast('⚠️ Select who or what you\'re reporting first.');
        return;
    }

    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel' + step)?.classList.add('active');

    [1, 2, 3].forEach(i => {
        const el = document.getElementById('s' + i);
        if (!el) return;
        el.classList.remove('active', 'done');
        if (i < step)  el.classList.add('done');
        if (i === step) el.classList.add('active');
    });

    if (step === 3) buildReportSummary();
    currentReportStep = step;
};

// ── Target resolution ─────────────────────────────────────────────────────────
async function resolveContextTarget() {
    if (!urlTargetType || !urlTargetId) {
        document.getElementById('userSearchWrap').style.display = '';
        return;
    }

    document.getElementById('contextTargetWrap').style.display = '';
    document.getElementById('userSearchWrap').style.display = 'none';

    try {
        if (urlTargetType === 'post') {
            document.getElementById('msgPreviewWrap').style.display = '';
            let message = null;
            if (urlChannelId && window.API?.messages) {
                const messages = await window.API.messages.getByChannel(urlChannelId);
                message = messages.find(m => String(m.id) === String(urlTargetId));
            }
            if (message) {
                document.getElementById('ctxMsgAuthor').textContent = message.authorName || 'Unknown';
                document.getElementById('ctxMsgChannel').textContent = `#${message.channelId}`;
                document.getElementById('ctxMsgTime').textContent = new Date(message.createdAt).toLocaleString();
                document.getElementById('ctxMsgText').textContent = message.content || '(no text — attachment only)';
                resolvedTarget = { type: 'post', id: Number(urlTargetId), label: `Message from ${message.authorName} in #${message.channelId}`, recap: message };
            } else {
                document.getElementById('ctxMsgText').textContent = 'Could not load this message — it may have been deleted.';
                resolvedTarget = { type: 'post', id: Number(urlTargetId), label: `Message #${urlTargetId}` };
            }
        } else if (urlTargetType === 'user') {
            document.getElementById('userPreviewWrap').style.display = '';
            let user = null;
            try { user = await window.API.users.getOne(urlTargetId); } catch (e) { /* ignore */ }
            if (user) {
                document.getElementById('ctxUserAv').textContent = (user.username || 'U').slice(0, 2).toUpperCase();
                document.getElementById('ctxUserName').textContent = user.username;
                document.getElementById('ctxUserMeta').textContent = user.email || '';
                resolvedTarget = { type: 'user', id: Number(urlTargetId), label: user.username };
            } else {
                document.getElementById('ctxUserName').textContent = `User #${urlTargetId}`;
                resolvedTarget = { type: 'user', id: Number(urlTargetId), label: `User #${urlTargetId}` };
            }
        } else if (urlTargetType === 'community') {
            document.getElementById('commPreviewWrap').style.display = '';
            let community = null;
            try { community = await window.API.communities.getOne(urlTargetId); } catch (e) { /* ignore */ }
            if (community) {
                document.getElementById('ctxCommIcon').textContent = community.icon || '🏘️';
                document.getElementById('ctxCommName').textContent = community.name;
                resolvedTarget = { type: 'community', id: Number(urlTargetId), label: community.name };
            } else {
                document.getElementById('ctxCommName').textContent = `Community #${urlTargetId}`;
                resolvedTarget = { type: 'community', id: Number(urlTargetId), label: `Community #${urlTargetId}` };
            }
        }
    } catch (err) {
        console.warn('[Report] Could not resolve target context:', err.message);
    }
}

// ── User search (generic entry point, no context provided) ──────────────────
window.handleUserSearch = async function (query) {
    const results = document.getElementById('userSearchResults');
    const q = query.trim();
    if (!q) { results.innerHTML = ''; return; }

    // A pure number is treated as a direct User ID lookup.
    if (/^\d+$/.test(q)) {
        results.innerHTML = `
            <div class="reason-opt" onclick="selectUserTarget(${Number(q)}, 'User #${q}')">
                <div class="reason-body"><div class="reason-title">Report User ID ${q} directly</div></div>
            </div>`;
        return;
    }

    try {
        if (!allUsersCache) allUsersCache = await window.API.users.getAll();
    } catch (err) {
        results.innerHTML = '<div style="padding:10px;color:var(--text-3);font-size:13px;">⚠️ Could not load users.</div>';
        return;
    }

    const matches = allUsersCache
        .filter(u => u.username?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8);

    if (matches.length === 0) {
        results.innerHTML = '<div style="padding:10px;color:var(--text-3);font-size:13px;">No matching users. Try their exact User ID instead.</div>';
        return;
    }

    results.innerHTML = matches.map(u => `
        <div class="reason-opt" onclick="selectUserTarget(${u.id}, '${(u.username || '').replace(/'/g, "\\'")}')">
            <div class="reason-body">
                <div class="reason-title">${u.username}</div>
                <div class="reason-desc">${u.email || ''}</div>
            </div>
        </div>
    `).join('');
};

window.selectUserTarget = function (userId, label) {
    resolvedTarget = { type: 'user', id: userId, label };
    document.getElementById('userSearchResults').innerHTML = `
        <div style="padding:10px 14px;border-radius:8px;background:var(--surface-2,rgba(255,255,255,0.05));font-size:13.5px;">
            ✓ Selected: <strong>${label}</strong>
        </div>`;
    if (!document.getElementById('userSearchNext')) {
        document.getElementById('userSearchResults').insertAdjacentHTML('afterend', `
            <div class="btn-row" style="margin-top:14px;">
                <button class="btn-next" id="userSearchNext" onclick="goStep(2)">Choose Reason →</button>
            </div>`);
    }
};

window.selectReason = function (el, reason) {
    document.querySelectorAll('.reason-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    selectedViolationReason = reason;
};

// ── Summary & Submission ──────────────────────────────────────────────────────
function buildReportSummary() {
    const targetLabel  = document.getElementById('rvTarget');
    const reasonLabel  = document.getElementById('rvReason');
    const contextLabel = document.getElementById('rvContext');
    const contextInput = document.getElementById('additionalContext');

    if (targetLabel && resolvedTarget) targetLabel.textContent = resolvedTarget.label;

    const activeReasonOpt = document.querySelector('#panel2 .reason-opt.selected');
    if (activeReasonOpt && reasonLabel) {
        const icon  = activeReasonOpt.querySelector('.reason-icon')?.textContent  || '';
        const title = activeReasonOpt.querySelector('.reason-title')?.textContent || selectedViolationReason;
        reasonLabel.textContent = `${icon} ${title}`;
    }

    if (contextInput && contextLabel) {
        const text = contextInput.value.trim();
        contextLabel.textContent = text || 'None provided';
        contextLabel.style.color = text ? 'var(--text-1)' : 'var(--text-3)';
    }

    const recapLabel = document.getElementById('rvContentLabel');
    const recap = document.getElementById('rvContentRecap');
    if (resolvedTarget?.type === 'post' && resolvedTarget.recap) {
        recapLabel.style.display = '';
        recap.style.display = '';
        document.getElementById('rvRecapAuthor').textContent = resolvedTarget.recap.authorName || '';
        document.getElementById('rvRecapChannel').textContent = `#${resolvedTarget.recap.channelId}`;
        document.getElementById('rvRecapText').textContent = resolvedTarget.recap.content || '';
    } else if (recapLabel && recap) {
        recapLabel.style.display = 'none';
        recap.style.display = 'none';
    }
}

window.submitReport = async function () {
    const btn = document.getElementById('submitBtn');
    if (!btn || !resolvedTarget) return;

    btn.textContent = 'Submitting report...';
    btn.disabled    = true;

    const session = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const reporterId = session?.id;
    if (!reporterId) {
        if (window.toast) window.toast('⚠️ Please log in to submit a report.');
        btn.textContent = '🚩 Submit Report';
        btn.disabled = false;
        return;
    }

    const reason = (document.getElementById('rvReason')?.textContent || selectedViolationReason).trim()
        || 'Policy violation';
    const contextText = document.getElementById('additionalContext')?.value?.trim() || '';
    const fullReason  = contextText ? `${reason} — ${contextText}` : reason;

    try {
        const report = await window.API.reports.create({
            reporterId: Number(reporterId),
            targetType: resolvedTarget.type,
            targetId: resolvedTarget.id,
            reason: fullReason.slice(0, 200),   // max 200 chars per DTO
        });

        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel4')?.classList.add('active');
        const stepper = document.getElementById('stepper');
        if (stepper) stepper.style.opacity = '0';

        const refEl = document.getElementById('successRefId');
        if (refEl) refEl.textContent = `RPT-${report.id}`;

        if (window.toast) window.toast(`Report #${report.id} submitted successfully!`);
        console.log('[Report] Created report via API:', report);

    } catch (err) {
        btn.textContent = '🚩 Submit Report';
        btn.disabled    = false;
        if (window.toast) window.toast('Submission failed: ' + err.message, 'error');
    }
};

// ── Reset ─────────────────────────────────────────────────────────────────────
window.resetForm = function () {
    // Simplest correct reset: a fresh report is a fresh target, so drop back to
    // a clean report.html rather than trying to restore in-place state.
    window.location.href = 'report.html';
};

document.addEventListener('DOMContentLoaded', () => {
    resolveContextTarget();
    console.log('%c[Report] %cLive submission via /api/reports', 'color: #5B6EF5; font-weight: bold;', 'color: #10B981;');
});
