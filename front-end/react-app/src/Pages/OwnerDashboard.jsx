import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCommunities: 0,
    totalEvents: 0,
    pendingReportsCount: 0,
    pendingEventsCount: 0,
    pendingAppealsCount: 0,
    backendStatus: 'Checking…',
  });

  const [revenue, setRevenue] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    subscriptionRevenue: 0,
    organiserRevenue: 0,
    featuredEventRevenue: 0,
    premiumUsers: 0,
    verifiedOrganisers: 0,
    pendingOrganiserApplications: 0,
  });

  // Drilldown Modal
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('Details');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillContent, setDrillContent] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalCommunities: data.totalCommunities || 0,
            totalEvents: data.totalEvents || 0,
            pendingReportsCount: data.pendingReportsCount || 0,
            pendingEventsCount: data.pendingEventsCount || 0,
            pendingAppealsCount: data.pendingAppealsCount || 0,
            backendStatus: 'Reachable',
          });
        } else {
          setStats((prev) => ({ ...prev, backendStatus: '⚠️ Degraded' }));
        }
      } catch {
        setStats({
          totalCommunities: 12,
          totalEvents: 8,
          pendingReportsCount: 3,
          pendingEventsCount: 2,
          pendingAppealsCount: 1,
          backendStatus: 'Local Fallback',
        });
      }

      try {
        const revRes = await fetch(`${API_BASE}/dashboard/revenue`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setRevenue({
            totalRevenue: revData.totalRevenue || 0,
            monthlyRevenue: revData.monthlyRevenue || 0,
            subscriptionRevenue: revData.subscriptionRevenue || 0,
            organiserRevenue: revData.organiserRevenue || 0,
            featuredEventRevenue: revData.featuredEventRevenue || 0,
            premiumUsers: revData.premiumUsers || 0,
            verifiedOrganisers: revData.verifiedOrganisers || 0,
            pendingOrganiserApplications: revData.pendingOrganiserApplications || 0,
          });
        }
      } catch {
        setRevenue({
          totalRevenue: 48500,
          monthlyRevenue: 12400,
          subscriptionRevenue: 32000,
          organiserRevenue: 9500,
          featuredEventRevenue: 7000,
          premiumUsers: 45,
          verifiedOrganisers: 8,
          pendingOrganiserApplications: 3,
        });
      }
    }

    loadStats();
  }, []);

  const openDrill = async (kind, filter) => {
    setDrillModalOpen(true);
    setDrillLoading(true);

    try {
      if (kind === 'communities') {
        setDrillTitle('Communities Breakdown');
        let communities = [];
        try {
          const res = await fetch(`${API_BASE}/communities`);
          communities = res.ok ? await res.json() : [];
        } catch {
          communities = [
            { id: 1, name: 'FPS Arena', icon: '🎯', memberCount: 1420, category: 'FPS', ownerId: 1 },
            { id: 2, name: 'Pro Gamers', icon: '⚡', memberCount: 890, category: 'Gaming', ownerId: 2 },
          ];
        }
        setDrillContent(
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Members</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {communities.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="row-name">
                        {c.icon || '🏘️'} {c.name}
                      </div>
                    </td>
                    <td>{(c.memberCount || 0).toLocaleString()}</td>
                    <td>{c.category || 'Gaming'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else if (kind === 'events') {
        setDrillTitle('Events Overview');
        let events = [];
        try {
          const res = await fetch(`${API_BASE}/events`);
          events = res.ok ? await res.json() : [];
        } catch {
          events = [
            { id: 1, title: 'Summer Valorant Cup', type: 'tournament', entryFee: 150, date: '2026-10-15', status: 'approved' },
            { id: 2, title: 'Apex Community Scrims', type: 'event', entryFee: 0, date: '2026-10-18', status: 'pending' },
          ];
        }
        setDrillContent(
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Entry Fee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td><div className="row-name">{e.title}</div></td>
                    <td>{e.date}</td>
                    <td>{e.entryFee ? `₹${e.entryFee}` : 'Free'}</td>
                    <td><span className={`badge badge-${e.status || 'pending'}`}>{e.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else if (kind === 'revenue') {
        setDrillTitle('Revenue — All Transactions');
        let payments = [];
        try {
          const res = await fetch(`${API_BASE}/payments/history`);
          payments = res.ok ? await res.json() : [];
        } catch {
          payments = [
            { id: 1, type: 'subscription', amount: 499, description: 'Plus Upgrade', createdAt: new Date().toISOString() },
            { id: 2, type: 'tournament_fee', amount: 150, description: 'Tournament Registration', createdAt: new Date().toISOString() },
          ];
        }
        setDrillContent(
          <div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td><span className="badge badge-active">{p.type.replace(/_/g, ' ')}</span></td>
                      <td>₹{p.amount.toLocaleString()}</td>
                      <td>{p.description}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      } else if (kind === 'subscriptions') {
        setDrillTitle('Subscriptions Status');
        let subData = { byPlan: { free: 120, plus: 34, ultra_pro: 11 }, subscribers: [] };
        try {
          const res = await fetch(`${API_BASE}/subscriptions`);
          if (res.ok) subData = await res.json();
        } catch {
          // fallback
        }
        setDrillContent(
          <div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
              <div className="stat-card" style={{ padding: '12px' }}>
                <div className="stat-value">{subData.byPlan?.free || 0}</div>
                <div className="stat-label">Free</div>
              </div>
              <div className="stat-card" style={{ padding: '12px' }}>
                <div className="stat-value">{subData.byPlan?.plus || 0}</div>
                <div className="stat-label">Plus</div>
              </div>
              <div className="stat-card" style={{ padding: '12px' }}>
                <div className="stat-value">{subData.byPlan?.ultra_pro || 0}</div>
                <div className="stat-label">Ultra Pro</div>
              </div>
            </div>
          </div>
        );
      } else if (kind === 'organisers') {
        const title = filter === 'verified' ? 'Verified Organizers' : 'Pending Organizer Applications';
        setDrillTitle(title);
        let orgs = [];
        try {
          const res = await fetch(`${API_BASE}/organisers?status=${filter}`);
          orgs = res.ok ? await res.json() : [];
        } catch {
          orgs = [
            { username: 'champion_org', plan: 'premium', appliedAt: new Date().toISOString() },
            { username: 'pixel_guild', plan: 'free', appliedAt: new Date().toISOString() },
          ];
        }
        setDrillContent(
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o, idx) => (
                  <tr key={idx}>
                    <td>{o.username}</td>
                    <td><span className="badge badge-active">{o.plan}</span></td>
                    <td>{o.appliedAt ? new Date(o.appliedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    } catch (err) {
      setDrillContent(<div style={{ color: 'var(--text-3)', padding: '20px' }}>Could not load details: {err.message}</div>);
    }

    setDrillLoading(false);
  };

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="header-icon">📊</div>
            <h1 className="header-title">Platform Statistics</h1>
            <span className="header-badge">OWNER</span>
          </div>
          <div className="header-right">
            <div
              className="header-avatar user-avatar"
              onClick={() => navigate('/profile-settings')}
              style={{ cursor: 'pointer' }}
              title="Profile Settings"
            />
          </div>
        </header>

        <div className="page active">
          <p style={{ color: 'var(--text-3, #9ca3af)', fontSize: '13px', marginBottom: '20px' }}>
            Read-only view — statistics and platform health. No user, community, or moderation actions are available from this account.
          </p>
          <p style={{ color: 'var(--text-3, #666)', fontSize: '11.5px', margin: '-12px 0 14px' }}>
            💡 Click any card for a breakdown.
          </p>

          {/* Communities & Events */}
          <div className="stats-grid">
            <div
              className="stat-card drill-card"
              onClick={() => openDrill('communities')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon bg-cyan">🏘️</div>
              <div className="stat-data">
                <div className="stat-value">{stats.totalCommunities}</div>
                <div className="stat-label">Communities</div>
              </div>
            </div>
            <div
              className="stat-card drill-card"
              onClick={() => openDrill('events')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon bg-green">📅</div>
              <div className="stat-data">
                <div className="stat-value">{stats.totalEvents}</div>
                <div className="stat-label">Total Events</div>
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="card-header" style={{ marginBottom: '14px', marginTop: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
              Revenue Overview
            </h3>
          </div>
          <div className="stats-grid">
            <div className="stat-card drill-card" onClick={() => openDrill('revenue')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-green">💰</div>
              <div className="stat-data">
                <div className="stat-value">₹{revenue.totalRevenue.toLocaleString()}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('revenue')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-purple">📈</div>
              <div className="stat-data">
                <div className="stat-value">₹{revenue.monthlyRevenue.toLocaleString()}</div>
                <div className="stat-label">Monthly Revenue</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('subscriptions')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-cyan">💎</div>
              <div className="stat-data">
                <div className="stat-value">₹{revenue.subscriptionRevenue.toLocaleString()}</div>
                <div className="stat-label">Subscription Revenue</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('revenue')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-orange">🏆</div>
              <div className="stat-data">
                <div className="stat-value">₹{revenue.organiserRevenue.toLocaleString()}</div>
                <div className="stat-label">Organizer Revenue</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('revenue')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-green">📣</div>
              <div className="stat-data">
                <div className="stat-value">₹{revenue.featuredEventRevenue.toLocaleString()}</div>
                <div className="stat-label">Featured Event Revenue</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('subscriptions')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-purple">👑</div>
              <div className="stat-data">
                <div className="stat-value">{revenue.premiumUsers}</div>
                <div className="stat-label">Active Premium Users</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('organisers', 'verified')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-cyan">✅</div>
              <div className="stat-data">
                <div className="stat-value">{revenue.verifiedOrganisers}</div>
                <div className="stat-label">Verified Organizers</div>
              </div>
            </div>
            <div className="stat-card drill-card" onClick={() => openDrill('organisers', 'pending')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon bg-orange">⏳</div>
              <div className="stat-data">
                <div className="stat-value">{revenue.pendingOrganiserApplications}</div>
                <div className="stat-label">Pending Organizer Applications</div>
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div className="section-grid" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                  Platform Health
                </h3>
              </div>
              <div className="health-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="health-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span className="h-dot green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  Backend: <strong className="h-val">{stats.backendStatus}</strong>
                </div>
                <div className="health-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span className="h-dot green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  Open Reports: <strong className="h-val">{stats.pendingReportsCount}</strong>
                </div>
                <div className="health-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span className="h-dot green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  Pending Events: <strong className="h-val">{stats.pendingEventsCount}</strong>
                </div>
                <div className="health-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span className="h-dot green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  Pending Appeals: <strong className="h-val">{stats.pendingAppealsCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drillModalOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrillModalOpen(false);
          }}
        >
          <div className="modal-container" style={{ width: '640px', maxWidth: '92vw' }}>
            <div className="modal-header">
              <h3>{drillTitle}</h3>
              <button className="modal-x" onClick={() => setDrillModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {drillLoading ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-state-text">Loading…</div>
                </div>
              ) : (
                drillContent
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
