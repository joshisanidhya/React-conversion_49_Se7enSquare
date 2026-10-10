import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

const DEFAULT_USERS = [
  { id: 1, username: 'rajat', email: 'rajat@gameunity.com', role: 'admin' },
  { id: 2, username: 'karmanya', email: 'karmanya@gameunity.com', role: 'moderator' },
  { id: 3, username: 'awadhesh', email: 'awadhesh@gameunity.com', role: 'user' },
  { id: 4, username: 'anant', email: 'anant@gameunity.com', role: 'community_manager' },
  { id: 5, username: 'sanidhya', email: 'sanidhya@gameunity.com', role: 'owner' },
  { id: 6, username: 'sofia_p', email: 'sofia@gameunity.com', role: 'organizer' },
  { id: 7, username: 'maya_k', email: 'maya@gameunity.com', role: 'moderator' },
];

export default function User() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE}/users`, {
      headers: {
        'x-role': 'admin',
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        } else {
          setUsers(DEFAULT_USERS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log('Fetch Error:', err);
        setUsers(DEFAULT_USERS);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        <header className="header">
          <div className="header-left">
            <div className="header-icon">👤</div>
            <h1 className="header-title">User Management</h1>
            <span className="header-badge">ADMIN</span>
          </div>
          <div className="header-right">
            <button
              className="btn-ghost"
              onClick={() => navigate('/admin-dashboard')}
            >
              Admin Dashboard
            </button>
            <div
              className="header-avatar user-avatar"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile-settings')}
              title="Profile & Settings"
            >
              AD
            </div>
          </div>
        </header>

        <div className="page active" style={{ padding: '24px 32px' }}>
          {/* Toolbar */}
          <div
            className="page-toolbar"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="🔍 Search by username or email…"
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  maxWidth: '360px',
                  padding: '9px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '9px 14px',
                  background: 'var(--bg-card, #111118)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="community_manager">Community Manager</option>
                <option value="organizer">Organizer</option>
                <option value="user">User</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-3, #888)' }}>
              Showing {filteredUsers.length} of {users.length} registered accounts
            </div>
          </div>

          <div className="table-wrap" style={{ background: 'var(--bg-2, #111118)', borderRadius: '14px', border: '1px solid var(--border, rgba(255,255,255,0.06))', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody id="userTable">
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-3, #888)' }}>
                      Loading users…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-3, #888)' }}>
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-3, #666)', fontFamily: 'monospace' }}>#{u.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #5b6ef5, #8b5cf6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '12px',
                              flexShrink: 0,
                            }}
                          >
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="row-name">@{u.username}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2, #aaa)' }}>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin'
                              ? 'badge-admin'
                              : u.role === 'moderator'
                              ? 'badge-moderator'
                              : u.role === 'owner'
                              ? 'badge-warned'
                              : u.role === 'organizer'
                              ? 'badge-review'
                              : 'badge-active'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="act-btn act-view"
                            onClick={() => navigate('/admin-dashboard')}
                            title="Inspect in Admin Overview"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
