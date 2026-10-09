import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

export default function User() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/users`, {
      headers: {
        'x-role': 'admin',
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Fetch Error:', err);
        // Fallback demo data
        setUsers([
          { id: 1, username: 'rajat', email: 'rajat@gameunity.com', role: 'admin' },
          { id: 2, username: 'karmanya', email: 'karmanya@gameunity.com', role: 'moderator' },
          { id: 3, username: 'awadhesh', email: 'awadhesh@gameunity.com', role: 'user' },
          { id: 4, username: 'anant', email: 'anant@gameunity.com', role: 'community_manager' },
          { id: 5, username: 'sanidhya', email: 'sanidhya@gameunity.com', role: 'owner' },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        <header className="header">
          <div className="header-left">
            <div className="header-icon">👤</div>
            <h1 className="header-title">User Management</h1>
          </div>
          <div className="header-right">
            <button
              className="btn-ghost"
              onClick={() => navigate('/admin-dashboard')}
            >
              Admin Dashboard
            </button>
          </div>
        </header>

        <div className="page active">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody id="userTable">
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading users…
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        <div className="row-name">@{u.username}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-active">{u.role}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {users.length} users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
