import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/mod-panel.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'moderator', firstName: raw.firstName || 'Karmanya', username: raw.username || 'karmanya' };
  } catch { return { role: 'moderator', firstName: 'Karmanya', username: 'karmanya' }; }
}

const DEFAULT_REPORTS = [
  { id: 1, ref: 'RPT-4821', type: 'message', reportedUser: 'BadActor_X', channel: '#general', reason: 'Hate Speech or Discrimination', status: 'pending', date: 'March 11, 2026 · 10:32 AM', context: 'This user has been going after new members all morning. This isn\'t the first time.', severity: 'high' },
  { id: 2, ref: 'RPT-4820', type: 'user', reportedUser: 'SpammerBot', channel: '#announcements', reason: 'Spam or Unsolicited Promotion', status: 'review', date: 'March 11, 2026 · 09:14 AM', context: 'Repeated self-promotion of external links.', severity: 'medium' },
  { id: 3, ref: 'RPT-4819', type: 'message', reportedUser: 'ToxicPlayer99', channel: '#gaming', reason: 'Harassment or Bullying', status: 'resolved', date: 'March 10, 2026 · 06:51 PM', context: 'Targeted harassment towards new members.', severity: 'high', action: 'Temp ban (3 days)' },
];

const QUEUE_TABS = ['pending', 'review', 'resolved'];

export default function ModPanel() {
  const navigate = useNavigate();
  const user = getUser();

  const [reports, setReports] = useState(DEFAULT_REPORTS);
  const [activeQTab, setActiveQTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(DEFAULT_REPORTS[0]);
  const [queueSearch, setQueueSearch] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(`${API_BASE}/reports`, { headers: { 'x-role': user.role } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setReports(data.map(r => ({
              id: r.id,
              ref: r.ref || `RPT-${r.id}`,
              type: r.targetType || 'message',
              reportedUser: r.reportedUser?.username || r.targetId || 'Unknown',
              channel: r.channel || '#general',
              reason: r.reason || 'Violation',
              status: r.status || 'pending',
              date: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
              context: r.context || '',
              severity: r.severity || 'medium',
              action: r.action,
            })));
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchReports();
  }, [user.role]);

  const filteredReports = reports.filter(r =>
    r.status === activeQTab &&
    (!queueSearch || r.reportedUser?.toLowerCase().includes(queueSearch.toLowerCase()) || r.ref?.toLowerCase().includes(queueSearch.toLowerCase()) || r.reason?.toLowerCase().includes(queueSearch.toLowerCase()))
  );

  const takeAction = async (action, reportId) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify({ action, note: actionNote }),
      });
    } catch {}

    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, status: 'resolved', action: `${action}${actionNote ? ` — ${actionNote}` : ''}` }
        : r
    ));
    setSelectedReport(prev => prev ? { ...prev, status: 'resolved', action } : prev);
    setActionNote('');
    showToast(`✅ Action taken: ${action}`);
    setProcessing(false);
  };

  const moveToReview = async (reportId) => {
    try {
      await fetch(`${API_BASE}/reports/${reportId}/review`, { method: 'POST', headers: { 'x-role': user.role } });
    } catch {}
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'review' } : r));
    showToast('📋 Moved to In Review');
  };

  const ACTIONS = [
    { label: '⚠️ Warn User', action: 'warn' },
    { label: '🔇 Mute (24h)', action: 'mute_24h' },
    { label: '🔇 Mute (7d)', action: 'mute_7d' },
    { label: '🚫 Temp Ban (3d)', action: 'ban_3d' },
    { label: '🚫 Temp Ban (7d)', action: 'ban_7d' },
    { label: '⛔ Permanent Ban', action: 'ban_perm' },
    { label: '🗑️ Delete Message', action: 'delete_msg' },
    { label: '✅ Dismiss', action: 'dismiss' },
  ];

  const queueCounts = QUEUE_TABS.reduce((acc, tab) => {
    acc[tab] = reports.filter(r => r.status === tab).length;
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-title">Mod Panel</div>
          <div className="mod-badge">MOD PANEL</div>
          <div className="comm-chip" id="activeCommChip">
            <span id="activeCommIcon">⚡</span>
            <span id="activeCommName">Pro Gamers</span>
          </div>
          <div className="header-actions">
            <div className="icon-btn">🔔</div>
            <div className="header-avatar user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')}>
              {user.firstName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* 3-Column Layout */}
        <div className="panel-layout">
          {/* Left: Queue */}
          <div className="queue-panel">
            <div className="qp-header">
              <div className="qp-title">
                Report Queue <span className="qp-count" id="queueCount">{queueCounts[activeQTab] || 0}</span>
              </div>
              <div className="qp-tabs">
                {QUEUE_TABS.map(tab => (
                  <div
                    key={tab}
                    className={`qp-tab${activeQTab === tab ? ' on' : ''}`}
                    onClick={() => setActiveQTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')} {queueCounts[tab] > 0 && `(${queueCounts[tab]})`}
                  </div>
                ))}
              </div>
            </div>
            <div className="qp-search">
              <input
                type="text"
                placeholder="🔍 Search reports…"
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
            </div>
            <div className="queue-list" id="queueList">
              {loading ? (
                <div style={{ padding: '20px', color: 'var(--text-3,#666)', fontSize: '13px' }}>Loading reports…</div>
              ) : filteredReports.length === 0 ? (
                <div style={{ padding: '20px', color: 'var(--text-3,#666)', fontSize: '13px', textAlign: 'center' }}>
                  {activeQTab === 'pending' ? '✅ All clear! No pending reports.' : `No ${activeQTab} reports.`}
                </div>
              ) : (
                filteredReports.map(report => (
                  <div
                    key={report.id}
                    className={`queue-item${selectedReport?.id === report.id ? ' active' : ''}`}
                    onClick={() => setSelectedReport(report)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="qi-top">
                      <span className="qi-ref">{report.ref}</span>
                      <span className={`qi-sev sev-${report.severity}`}>{report.severity}</span>
                    </div>
                    <div className="qi-user">@{report.reportedUser} in {report.channel}</div>
                    <div className="qi-reason">{report.reason}</div>
                    <div className="qi-time">{report.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center: Detail */}
          <div className="detail-panel">
            {selectedReport ? (
              <>
                <div className="dp-header">
                  <div className="dp-title" id="dpTitle">
                    {selectedReport.ref} — @{selectedReport.reportedUser} in {selectedReport.channel}
                  </div>
                  <div className="dp-action" id="dpAction">
                    {selectedReport.action ? `Last action: ${selectedReport.action}` : 'Last action: None'}
                  </div>
                </div>
                <div className="dp-body">
                  <div id="tabContent">
                    <div className="reporter-row">
                      <div className="reporter-av grad-violet" style={{ background: '#6366f1', color: '#fff', fontWeight: 700, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>AM</div>
                      <div className="reporter-info">
                        <div className="reporter-name">Reported by: Anonymous</div>
                        <div className="reporter-sub">{selectedReport.date} · via {selectedReport.type === 'message' ? 'Message' : 'Profile'} Report</div>
                      </div>
                      <span className="reporter-anon">🔒 Anonymous</span>
                    </div>

                    <div className="reason-card">
                      <div className="rc-header">
                        <div className="rc-icon">🚫</div>
                        <div className="rc-title">{selectedReport.reason}</div>
                      </div>
                      <div className="rc-desc">
                        {selectedReport.type === 'message'
                          ? 'Content that violates community guidelines.'
                          : 'User behavior that violates community standards.'}
                      </div>
                      {selectedReport.context && (
                        <div className="rc-note">"{selectedReport.context}"</div>
                      )}
                    </div>

                    {/* Action Notes */}
                    {selectedReport.status !== 'resolved' && (
                      <div className="action-note-field" style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-3,#666)', marginBottom: '8px', display: 'block' }}>Moderator Note (Optional)</label>
                        <textarea
                          rows={3}
                          placeholder="Add a note explaining your moderation action…"
                          value={actionNote}
                          onChange={e => setActionNote(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card,#151d2f)', border: '1px solid var(--border,rgba(255,255,255,0.08))', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                {selectedReport.status !== 'resolved' && (
                  <div className="actions-panel">
                    <div className="ap-title">Take Action</div>
                    {selectedReport.status === 'pending' && (
                      <button
                        className="ap-btn ap-btn-review"
                        onClick={() => moveToReview(selectedReport.id)}
                        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginBottom: '12px', width: '100%' }}
                      >
                        📋 Move to In Review
                      </button>
                    )}
                    <div className="actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {ACTIONS.map(({ label, action }) => (
                        <button
                          key={action}
                          className={`ap-btn${action === 'ban_perm' ? ' ap-btn-danger' : action === 'dismiss' ? ' ap-btn-dismiss' : ''}`}
                          onClick={() => takeAction(label, selectedReport.id)}
                          disabled={processing}
                          style={{
                            padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border,rgba(255,255,255,0.08))',
                            background: action === 'ban_perm' ? 'rgba(255,68,68,0.1)' : action === 'dismiss' ? 'rgba(52,211,153,0.1)' : 'var(--bg-card,#151d2f)',
                            color: action === 'ban_perm' ? '#f87171' : action === 'dismiss' ? '#34d399' : 'var(--text-secondary,#ccc)',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.status === 'resolved' && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#34d399' }}>
                    ✅ This report has been resolved.
                    {selectedReport.action && <div style={{ fontSize: '13px', color: 'var(--text-3,#666)', marginTop: '8px' }}>Action taken: {selectedReport.action}</div>}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3,#666)', fontSize: '14px' }}>
                Select a report from the queue to review.
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="stats-panel">
            <div className="sp-title">Queue Overview</div>
            {[
              { label: 'Pending', count: queueCounts.pending || 0, color: '#f59e0b' },
              { label: 'In Review', count: queueCounts.review || 0, color: '#6366f1' },
              { label: 'Resolved', count: queueCounts.resolved || 0, color: '#34d399' },
            ].map(stat => (
              <div key={stat.label} className="sp-stat">
                <div className="sp-stat-label">{stat.label}</div>
                <div className="sp-stat-val" style={{ color: stat.color, fontWeight: 700, fontSize: '24px' }}>{stat.count}</div>
              </div>
            ))}

            <div className="sp-title" style={{ marginTop: '24px' }}>Recent Actions</div>
            {reports.filter(r => r.status === 'resolved' && r.action).slice(0, 3).map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary,#ccc)' }}>{r.action}</div>
                <div style={{ color: 'var(--text-3,#666)', marginTop: '2px' }}>@{r.reportedUser} · {r.ref}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`toast${toast.show ? ' show' : ''}`} id="toast">
          <span>{toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
