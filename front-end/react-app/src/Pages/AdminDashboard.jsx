import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'admin', firstName: raw.firstName || 'Rajat', username: raw.username || 'rajat' };
  } catch { return { role: 'admin', firstName: 'Rajat', username: 'rajat' }; }
}

const PAGES = [
  { id: 'overview', icon: '⚡', title: 'System Overview' },
  { id: 'users', icon: '👤', title: 'User Management' },
  { id: 'communities', icon: '🏘️', title: 'Communities' },
  { id: 'moderation', icon: '🚩', title: 'Moderation' },
  { id: 'events-mgmt', icon: '📅', title: 'Events' },
  { id: 'appeals', icon: '⚖️', title: 'Appeals' },
  { id: 'audit', icon: '📋', title: 'Audit Log' },
];

const DEFAULT_STATS = { users: 0, comms: 0, reports: 0, events: 0, appeals: 0, messages: 0 };
const DEFAULT_USERS = [
  { id: 1, name: 'Rajat Jain', username: 'rajat', email: 'rajat@gameunity.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Karmanya', username: 'karmanya', email: 'karmanya@gameunity.com', role: 'moderator', status: 'active' },
  { id: 3, name: 'Awadhesh', username: 'awadhesh', email: 'awadhesh@gameunity.com', role: 'user', status: 'active' },
  { id: 4, name: 'Anant', username: 'anant', email: 'anant@gameunity.com', role: 'community_manager', status: 'active' },
  { id: 5, name: 'Sanidhya', username: 'sanidhya', email: 'sanidhya@gameunity.com', role: 'owner', status: 'active' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [activePage, setActivePage] = useState('overview');
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [communities, setCommunities] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        const [usersRes, commsRes, reportsRes, eventsRes, appealsRes] = await Promise.all([
          fetch(`${API_BASE}/users`, { headers: { 'x-role': user.role } }),
          fetch(`${API_BASE}/communities`, { headers: { 'x-role': user.role } }),
          fetch(`${API_BASE}/reports`, { headers: { 'x-role': user.role } }),
          fetch(`${API_BASE}/events`, { headers: { 'x-role': user.role } }),
          fetch(`${API_BASE}/appeals`, { headers: { 'x-role': user.role } }),
        ]);
        if (usersRes.ok) { const d = await usersRes.json(); if (Array.isArray(d) && d.length > 0) setUsers(d); }
        if (commsRes.ok) { const d = await commsRes.json(); if (Array.isArray(d)) setCommunities(d); }
        if (reportsRes.ok) { const d = await reportsRes.json(); if (Array.isArray(d)) setReports(d); }
        if (eventsRes.ok) { const d = await eventsRes.json(); if (Array.isArray(d)) setEvents(d); }
        if (appealsRes.ok) { const d = await appealsRes.json(); if (Array.isArray(d)) setAppeals(d); }
      } catch {}
      setLoading(false);
    }
    fetchAll();
  }, [user.role]);

  useEffect(() => {
    setStats({
      users: users.length,
      comms: communities.length || 3,
      reports: reports.filter(r => r.status === 'pending').length || 1,
      events: events.filter(e => e.status === 'approved').length || 2,
      appeals: appeals.filter(a => a.status === 'pending').length || 1,
      messages: 48000,
    });
  }, [users, communities, reports, events, appeals]);

  const navTo = (pageId) => {
    setActivePage(pageId);
  };

  const updateUserRole = async (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUser(null);
    showToast(`✅ Role updated to ${newRole}`);
    try {
      await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify({ role: newRole }),
      });
    } catch {}
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Suspend this user? They will be locked out until the suspension is lifted.')) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' } : u));
    showToast('⚠️ User suspended');
    try {
      await fetch(`${API_BASE}/users/${userId}/suspend`, { method: 'POST', headers: { 'x-role': user.role } });
    } catch {}
  };

  const deleteCommunity = async (commId) => {
    if (!window.confirm('Delete this community? This cannot be undone.')) return;
    setCommunities(prev => prev.filter(c => c.id !== commId));
    showToast('🗑️ Community deleted');
    try {
      await fetch(`${API_BASE}/communities/${commId}`, { method: 'DELETE', headers: { 'x-role': user.role } });
    } catch {}
  };

  const filteredUsers = users.filter(u => {
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchSearch = !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  const currentPage = PAGES.find(p => p.id === activePage);

  const STAT_CARDS = [
    { label: 'Total Users', val: stats.users, icon: '👤', bg: 'bg-purple', page: 'users', trend: '↑ 12.4%' },
    { label: 'Communities', val: stats.comms, icon: '🏘️', bg: 'bg-cyan', page: 'communities', trend: '↑ 8.2%' },
    { label: 'Open Reports', val: stats.reports, icon: '🚩', bg: 'bg-orange', page: 'moderation', trend: '↓ 3.1%' },
    { label: 'Active Events', val: stats.events, icon: '📅', bg: 'bg-green', page: 'events-mgmt', trend: '↑ 15.7%' },
    { label: 'Open Appeals', val: stats.appeals, icon: '⚖️', bg: 'bg-purple', page: 'appeals', trend: '↑ 2.1%' },
    { label: 'Messages', val: stats.messages.toLocaleString(), icon: '💬', bg: 'bg-cyan', page: 'overview', trend: '↑ 22.3%' },
  ];

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="header-icon" id="page-icon">{currentPage?.icon || '⚡'}</div>
            <h1 className="header-title" id="page-title">{currentPage?.title || 'System Overview'}</h1>
            <span className="header-badge">ADMIN</span>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search anything..."
                id="globalSearch"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
              />
            </div>
            <div className="header-avatar user-avatar" id="su-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')}>
              {user.firstName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Sub-Nav */}
        <div className="su-nav" style={{ display: 'flex', gap: '4px', padding: '0 24px', borderBottom: '1px solid var(--border,rgba(255,255,255,0.06))', marginBottom: '0', overflowX: 'auto' }}>
          {PAGES.map(p => (
            <button
              key={p.id}
              className={`su-nav-btn${activePage === p.id ? ' active' : ''}`}
              onClick={() => navTo(p.id)}
              style={{
                padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                color: activePage === p.id ? '#818cf8' : 'var(--text-3,#666)',
                fontWeight: activePage === p.id ? 700 : 400, fontSize: '13px',
                borderBottom: activePage === p.id ? '2px solid #6366f1' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}
            >
              {p.icon} {p.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* Overview Page */}
          {activePage === 'overview' && (
            <div className="page active" id="page-overview">
              <div className="stats-grid">
                {STAT_CARDS.map(card => (
                  <div
                    key={card.label}
                    className="stat-card"
                    onClick={() => navTo(card.page)}
                    style={{ cursor: 'pointer' }}
                    title={`Go to ${card.label}`}
                  >
                    <div className={`stat-icon ${card.bg}`}>{card.icon}</div>
                    <div className="stat-data">
                      <div className="stat-value">{loading ? '…' : card.val}</div>
                      <div className="stat-label">{card.label}</div>
                    </div>
                    <div className={`stat-trend ${card.trend.startsWith('↑') ? 'up' : 'down'}`}>{card.trend}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="card" style={{ marginTop: '24px' }}>
                <div className="card-header"><h3>Recent Activity</h3></div>
                <div>
                  {[
                    { icon: '👤', text: 'New user registered: awadhesh', time: '5 min ago' },
                    { icon: '🏘️', text: 'New community created: React Devs', time: '23 min ago' },
                    { icon: '🚩', text: 'Report RPT-4821 submitted for review', time: '1 hr ago' },
                    { icon: '📅', text: 'Gaming Hackathon approved', time: '2 hr ago' },
                    { icon: '⚖️', text: 'Appeal APL-001 submitted', time: '3 hr ago' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary,#ccc)' }}>{item.text}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3,#666)' }}>{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Page */}
          {activePage === 'users' && (
            <div className="page active" id="page-users">
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search users…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '9px 14px', background: 'var(--bg-card,#151d2f)', border: '1px solid var(--border,rgba(255,255,255,0.08))', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  style={{ padding: '9px 14px', background: 'var(--bg-card,#151d2f)', border: '1px solid var(--border,rgba(255,255,255,0.08))', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="community_manager">Community Manager</option>
                  <option value="organizer">Organizer</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.06))' }}>
                      {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-3,#666)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                              {(u.name || u.username).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{u.name || u.username}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-3,#666)' }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-3,#aaa)' }}>{u.email}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {editingUser === u.id ? (
                            <select
                              defaultValue={u.role}
                              onChange={e => updateUserRole(u.id, e.target.value)}
                              style={{ padding: '4px 8px', background: 'var(--bg-card,#151d2f)', border: '1px solid #6366f1', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                            >
                              {['user', 'moderator', 'community_manager', 'organizer', 'admin', 'owner'].map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                              {u.role?.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: u.status === 'suspended' ? 'rgba(255,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: u.status === 'suspended' ? '#f87171' : '#34d399', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                            {(u.status || 'active').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingUser(editingUser === u.id ? null : u.id)} style={{ padding: '5px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: '#818cf8', fontSize: '12px', cursor: 'pointer' }}>
                              {editingUser === u.id ? 'Cancel' : 'Edit Role'}
                            </button>
                            {u.status !== 'suspended' && u.id !== 1 && (
                              <button onClick={() => suspendUser(u.id)} style={{ padding: '5px 10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Communities Page */}
          {activePage === 'communities' && (
            <div className="page active" id="page-communities">
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-icon bg-cyan">🏘️</div>
                  <div className="stat-data">
                    <div className="stat-value">{communities.length || 3}</div>
                    <div className="stat-label">Total Communities</div>
                  </div>
                </div>
              </div>
              {(communities.length > 0 ? communities : [
                { id: 1, name: 'Pro Gamers', icon: '⚡', members: 2451, category: 'Gaming', status: 'active' },
                { id: 2, name: 'Dev Nexus', icon: '💻', members: 12400, category: 'Technology', status: 'active' },
                { id: 3, name: 'Design Studio', icon: '🎨', members: 8200, category: 'Design', status: 'active' },
              ]).map(comm => (
                <div key={comm.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '32px' }}>{comm.icon || '🏘️'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>{comm.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-3,#666)', marginTop: '3px' }}>
                      {(comm.members || 0).toLocaleString()} members · {comm.category}
                    </div>
                  </div>
                  <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                    {(comm.status || 'ACTIVE').toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => navigate(`/community/${comm.id}`)} style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: '#818cf8', fontSize: '12px', cursor: 'pointer' }}>View</button>
                    <button onClick={() => deleteCommunity(comm.id)} style={{ padding: '6px 12px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Moderation Page */}
          {activePage === 'moderation' && (
            <div className="page active">
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif" }}>Open Reports</h3>
                <button onClick={() => navigate('/mod-panel')} style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Go to Mod Panel →</button>
              </div>
              {(reports.length > 0 ? reports : [
                { id: 1, ref: 'RPT-4821', reportedUser: { username: 'BadActor_X' }, reason: 'Hate Speech', status: 'pending', createdAt: new Date().toISOString() },
              ]).map((r, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🚩</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{r.ref || `RPT-${r.id}`}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '3px' }}>{r.reason} · @{r.reportedUser?.username || r.reportedUser}</div>
                  </div>
                  <span style={{ background: r.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)', color: r.status === 'pending' ? '#f59e0b' : '#34d399', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                    {(r.status || 'PENDING').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Events Management */}
          {activePage === 'events-mgmt' && (
            <div className="page active">
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif" }}>Events Management</h3>
                <button onClick={() => navigate('/event-approval')} style={{ padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Event Approval →</button>
              </div>
              {(events.length > 0 ? events : [
                { id: 1, title: 'Gaming Hackathon', community: 'Pro Gamers', status: 'approved', date: '2025-03-07' },
                { id: 2, title: 'Frontend Workshop', community: 'Dev Nexus', status: 'approved', date: '2025-03-09' },
              ]).map(ev => (
                <div key={ev.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📅</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{ev.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '3px' }}>{ev.community} · {ev.date}</div>
                  </div>
                  <span style={{ background: ev.status === 'approved' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)', color: ev.status === 'approved' ? '#34d399' : '#f59e0b', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                    {(ev.status || 'PENDING').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Appeals */}
          {activePage === 'appeals' && (
            <div className="page active">
              <h3 style={{ fontFamily: "'Syne',sans-serif", marginBottom: '16px' }}>Open Appeals</h3>
              {(appeals.length > 0 ? appeals : [
                { id: 1, appealType: 'Misunderstanding', status: 'pending', userId: 3 },
              ]).map((ap, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⚖️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Appeal #{ap.id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '3px' }}>{ap.appealType || 'General Appeal'}</div>
                  </div>
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
                    {(ap.status || 'PENDING').toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={async () => { await fetch(`${API_BASE}/appeals/${ap.id}/approve`, { method: 'POST', headers: { 'x-role': user.role } }); showToast('✅ Appeal approved'); }} style={{ padding: '6px 12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', color: '#34d399', fontSize: '12px', cursor: 'pointer' }}>Approve</button>
                    <button onClick={async () => { await fetch(`${API_BASE}/appeals/${ap.id}/reject`, { method: 'POST', headers: { 'x-role': user.role } }); showToast('❌ Appeal rejected'); }} style={{ padding: '6px 12px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Log */}
          {activePage === 'audit' && (
            <div className="page active">
              <h3 style={{ fontFamily: "'Syne',sans-serif", marginBottom: '16px' }}>Audit Log</h3>
              {[
                { time: '10:32 AM', admin: 'rajat', action: 'Updated user role: karmanya → moderator', type: 'role' },
                { time: '10:15 AM', admin: 'rajat', action: 'Approved event: Gaming Hackathon', type: 'event' },
                { time: '09:47 AM', admin: 'rajat', action: 'Suspended user: spambot99', type: 'moderation' },
                { time: '09:30 AM', admin: 'rajat', action: 'Deleted community: Test Community', type: 'community' },
                { time: '09:10 AM', admin: 'rajat', action: 'Approved appeal: APL-001', type: 'appeal' },
              ].map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary,#ccc)', fontWeight: 600 }}>{entry.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '3px' }}>by @{entry.admin} · {entry.time}</div>
                  </div>
                  <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '3px 8px', borderRadius: '5px', fontSize: '11px' }}>{entry.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`toast${toast.show ? ' show' : ''}`} id="toast">
          <span>{toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
