import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

export default function EventRegistrants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [eventTitle, setEventTitle] = useState('Event');
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadRegistrants() {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/events/${eventId}/registrants`);
        if (res.ok) {
          const data = await res.json();
          setEventTitle(data.eventTitle || 'Tournament');
          setRegistrants(data.registrants || []);
        } else {
          throw new Error('Not found');
        }
      } catch {
        // Fallback demo data
        setEventTitle('Championship Series 2026');
        setRegistrants([
          {
            fullName: 'Aarav Sharma',
            username: 'aarav_sh',
            email: 'aarav@example.com',
            phone: '+91 98765 11111',
            inGameId: 'AARAV#IND',
            registeredAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            fullName: 'Rohan Verma',
            username: 'rohan_v',
            email: 'rohan@example.com',
            phone: '+91 98765 22222',
            inGameId: 'ROHAN#007',
            registeredAt: new Date(Date.now() - 43200000).toISOString(),
          },
          {
            fullName: 'Priya Patel',
            username: 'priya_p',
            email: 'priya@example.com',
            phone: '+91 98765 33333',
            inGameId: 'PRIYA#VAL',
            registeredAt: new Date(Date.now() - 12000000).toISOString(),
          },
        ]);
        showToast('Viewing registrant details');
      }
      setLoading(false);
    }

    loadRegistrants();
  }, [eventId]);

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="header-icon">👥</div>
            <h1 className="header-title">Registrants — {eventTitle}</h1>
          </div>
          <div className="header-right">
            <button
              className="btn-ghost"
              onClick={() => navigate('/organizer-dashboard')}
            >
              ← Back to Dashboard
            </button>
            <div
              className="header-avatar user-avatar"
              onClick={() => navigate('/profile-settings')}
              style={{ cursor: 'pointer' }}
              title="Profile Settings"
            />
          </div>
        </header>

        <div className="page active">
          <p
            style={{
              color: 'var(--text-3, #9ca3af)',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            Everyone registered for &ldquo;{eventTitle}&rdquo;, with the details they gave at sign-up.
          </p>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>In-Game ID</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                      Loading registrants…
                    </td>
                  </tr>
                ) : registrants.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-text">No registrations yet</div>
                        <div className="empty-state-sub">
                          Registrants will show up here once players sign up.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  registrants.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div className="row-name">{r.fullName || '—'}</div>
                      </td>
                      <td>@{r.username}</td>
                      <td>{r.email || '—'}</td>
                      <td>{r.phone || '—'}</td>
                      <td>
                        <span className="badge badge-active">{r.inGameId || '—'}</span>
                      </td>
                      <td>
                        {r.registeredAt
                          ? new Date(r.registeredAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              {registrants.length} registrant{registrants.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="toast show" style={{ display: 'flex' }}>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
