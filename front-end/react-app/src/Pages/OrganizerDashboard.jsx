import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/admin-dashboard.css';

const API_BASE = 'http://localhost:3000/api';

function getCurrentUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return {
      id: raw.id || 1,
      username: raw.username || 'organizer',
      firstName: raw.firstName || 'Organizer',
      lastName: raw.lastName || '',
      role: raw.role || 'organizer',
    };
  } catch {
    return { id: 1, username: 'organizer', firstName: 'Organizer', lastName: '', role: 'organizer' };
  }
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [myEvents, setMyEvents] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [regCountByEvent, setRegCountByEvent] = useState({});
  const [currentFilter, setCurrentFilter] = useState('all');
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [earnings, setEarnings] = useState('0');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editEventId, setEditEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    communityId: '',
    date: '',
    time: '6:00 PM',
    maxAttendees: 100,
    entryFee: 0,
    prizePool: 0,
    status: 'approved',
  });

  // Toast
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    let eventsData = [];
    let commsData = [];
    let regsData = [];

    try {
      const [evRes, commRes, regRes] = await Promise.all([
        fetch(`${API_BASE}/events`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_BASE}/communities`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_BASE}/event-registrations`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      eventsData = evRes;
      commsData = commRes;
      regsData = regRes;
    } catch {
      // Fallback to local storage if API is unreachable
      try {
        eventsData = JSON.parse(localStorage.getItem('events') || '[]');
        commsData = JSON.parse(localStorage.getItem('communities') || '[]');
      } catch {
        eventsData = [];
        commsData = [];
      }
    }

    if (!commsData || commsData.length === 0) {
      commsData = [
        { id: 1, name: 'FPS Arena', slug: 'fps-arena' },
        { id: 2, name: 'Pro Gamers', slug: 'pro-gamers' },
      ];
    }

    setAllCommunities(commsData);

    const userEvents = (eventsData || []).filter(
      (e) => e.organiserId === currentUser.id || e.createdBy === currentUser.username
    );
    setMyEvents(userEvents);

    const regCounts = {};
    (regsData || []).forEach((r) => {
      regCounts[r.eventId] = (regCounts[r.eventId] || 0) + 1;
    });
    setRegCountByEvent(regCounts);

    // Profile & Analytics
    try {
      const profRes = await fetch(`${API_BASE}/organisers/profile/${currentUser.id}`);
      if (profRes.ok) {
        const prof = await profRes.json();
        setOrganizerProfile(prof);
      }
    } catch {
      setOrganizerProfile({
        plan: 'free',
        limits: { maxActiveTournaments: 2, maxParticipants: 64 },
      });
    }

    try {
      const anaRes = await fetch(`${API_BASE}/organisers/analytics/${currentUser.id}`);
      if (anaRes.ok) {
        const ana = await anaRes.json();
        setEarnings(Number(ana.estimatedOrganiserEarnings || 0).toLocaleString());
      }
    } catch {
      setEarnings('0');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgradePlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/organisers/upgrade/${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' }),
      });
      if (res.ok) {
        showToast('🏆 Upgraded to Premium Organizer!');
        setOrganizerProfile((prev) => ({
          ...prev,
          plan: 'premium',
          limits: { maxActiveTournaments: 'Unlimited', maxParticipants: 'Unlimited' },
        }));
      } else {
        showToast('⚠️ Could not upgrade plan');
      }
    } catch {
      showToast('🏆 Upgraded to Premium Organizer (simulated)');
      setOrganizerProfile((prev) => ({
        ...prev,
        plan: 'premium',
        limits: { maxActiveTournaments: 'Unlimited', maxParticipants: 'Unlimited' },
      }));
    }
  };

  const handlePromoteEvent = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/featured-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId: currentUser.id, durationDays: 7 }),
      });
      if (res.ok) {
        showToast('📣 Promoted to the Discover carousel for 7 days');
      } else {
        showToast('⚠️ Could not promote event');
      }
    } catch {
      showToast('📣 Promoted to the Discover carousel for 7 days');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
      showToast('🗑️ Tournament deleted');
    } catch {
      showToast('🗑️ Tournament deleted');
    }
    setMyEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const openCreateModal = () => {
    if (allCommunities.length === 0) {
      showToast('⚠️ No communities available — join or create one first');
      return;
    }
    setModalMode('create');
    setEditEventId(null);
    setFormData({
      title: '',
      description: '',
      communityId: String(allCommunities[0]?.id || ''),
      date: new Date().toISOString().slice(0, 10),
      time: '6:00 PM',
      maxAttendees: 100,
      entryFee: 0,
      prizePool: 0,
      status: 'approved',
    });
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setEditEventId(event.id);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      communityId: String(event.communityId || allCommunities[0]?.id || ''),
      date: event.date || '',
      time: event.time || '6:00 PM',
      maxAttendees: event.maxAttendees || 100,
      entryFee: event.entryFee || 0,
      prizePool: event.prizePool || 0,
      status: event.status || 'approved',
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.title.length < 3) {
      showToast('⚠️ Title must be at least 3 characters');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      showToast('⚠️ Description must be at least 10 characters');
      return;
    }
    if (!formData.communityId) {
      showToast('⚠️ Select a community');
      return;
    }
    if (!formData.date) {
      showToast('⚠️ Select a date');
      return;
    }

    const payload = {
      ...formData,
      communityId: Number(formData.communityId),
      maxAttendees: Number(formData.maxAttendees) || 100,
      entryFee: Number(formData.entryFee) || 0,
      prizePool: Number(formData.prizePool) || 0,
      type: 'tournament',
      createdBy: currentUser.username,
      organiserId: currentUser.id,
    };

    try {
      if (modalMode === 'create') {
        const res = await fetch(`${API_BASE}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = res.ok ? await res.json() : { ...payload, id: Date.now() };
        setMyEvents((prev) => [created, ...prev]);
        showToast('🏆 Tournament created');
      } else {
        const res = await fetch(`${API_BASE}/events/${editEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = res.ok ? await res.json() : { ...payload, id: editEventId };
        setMyEvents((prev) => prev.map((item) => (item.id === editEventId ? updated : item)));
        showToast('✅ Tournament updated');
      }
    } catch {
      if (modalMode === 'create') {
        const localCreated = { ...payload, id: Date.now() };
        setMyEvents((prev) => [localCreated, ...prev]);
        showToast('🏆 Tournament created (locally)');
      } else {
        setMyEvents((prev) =>
          prev.map((item) => (item.id === editEventId ? { ...item, ...payload } : item))
        );
        showToast('✅ Tournament updated (locally)');
      }
    }

    setModalOpen(false);
  };

  const getCommunityName = (id) => {
    const c = allCommunities.find((item) => Number(item.id) === Number(id));
    return c ? c.name : `Community #${id}`;
  };

  // Stats calculation
  const today = new Date().toISOString().slice(0, 10);
  const totalCount = myEvents.length;
  const pendingCount = myEvents.filter((e) => e.status === 'pending').length;
  const upcomingCount = myEvents.filter((e) => e.status === 'approved' && e.date >= today).length;
  const totalRegistrations = myEvents.reduce(
    (sum, e) => sum + (regCountByEvent[e.id] || 0),
    0
  );

  // Filtered rows
  const filteredEvents = (
    currentFilter === 'all'
      ? myEvents
      : myEvents.filter((e) => e.status === currentFilter)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const isPremium = organizerProfile?.plan === 'premium';

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="header-icon">🏆</div>
            <h1 className="header-title">Organizer Dashboard</h1>
            <span className="header-badge">ORGANIZER</span>
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
            Create and manage the tournaments you host. Scoped to tournaments you created.
          </p>

          {/* Organizer Plan Card */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px' }}>
                  {isPremium ? '🏆 Premium Organizer' : '🆓 Free Organizer'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3, #888)', marginTop: '2px' }}>
                  {isPremium
                    ? 'Unlimited tournaments & participants.'
                    : `Limited to ${organizerProfile?.limits?.maxActiveTournaments || 1} active tournament, ${organizerProfile?.limits?.maxParticipants || 64} participants.`}
                </div>
              </div>
              {!isPremium && (
                <button className="btn-primary" onClick={handleUpgradePlan}>
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon bg-purple">🏆</div>
              <div className="stat-data">
                <div className="stat-value">{totalCount}</div>
                <div className="stat-label">My Tournaments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green">👥</div>
              <div className="stat-data">
                <div className="stat-value">{totalRegistrations}</div>
                <div className="stat-label">Total Registrations</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-orange">⏳</div>
              <div className="stat-data">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending Approval</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-cyan">📅</div>
              <div className="stat-data">
                <div className="stat-value">{upcomingCount}</div>
                <div className="stat-label">Upcoming (Approved)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green">💰</div>
              <div className="stat-data">
                <div className="stat-value">₹{earnings}</div>
                <div className="stat-label">Est. Earnings (15%)</div>
              </div>
            </div>
          </div>

          {/* Page Toolbar */}
          <div className="page-toolbar">
            <div className="filter-bar">
              {['all', 'approved', 'pending', 'cancelled'].map((filter) => (
                <button
                  key={filter}
                  className={`filter-btn ${currentFilter === filter ? 'on' : ''}`}
                  onClick={() => setCurrentFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className="toolbar-right">
              <button className="btn-primary" onClick={openCreateModal}>
                + Host Tournament
              </button>
            </div>
          </div>

          {/* Tournaments Table */}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Community</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                      Loading tournaments…
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">🏆</div>
                        <div className="empty-state-text">
                          No tournaments {currentFilter === 'all' ? 'yet' : 'in this filter'}
                        </div>
                        <div className="empty-state-sub">
                          Click "+ Host Tournament" to create one.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="row-name">{e.title}</div>
                        <div className="row-sub">
                          {e.type || 'tournament'}
                          {e.entryFee ? ` · ₹${e.entryFee} entry` : ' · free entry'}
                        </div>
                      </td>
                      <td>{getCommunityName(e.communityId)}</td>
                      <td>
                        {e.date}
                        {e.time ? ` · ${e.time}` : ''}
                      </td>
                      <td>
                        <span className={`badge badge-${e.status || 'pending'}`}>
                          {e.status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {regCountByEvent[e.id] || 0}
                        {e.maxAttendees ? ` / ${e.maxAttendees}` : ''}
                      </td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="act-btn act-edit"
                            onClick={() => openEditModal(e)}
                          >
                            Edit
                          </button>
                          {e.status === 'approved' && (
                            <button
                              className="act-btn act-view"
                              onClick={() => handlePromoteEvent(e.id)}
                            >
                              Promote
                            </button>
                          )}
                          <button
                            className="act-btn act-view"
                            onClick={() => navigate(`/event-registrants?eventId=${e.id}`)}
                          >
                            Registrants
                          </button>
                          <button
                            className="act-btn act-delete"
                            onClick={() => handleDeleteEvent(e.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Showing {filteredEvents.length} tournament{filteredEvents.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          className="modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Host a Tournament' : 'Edit Tournament'}</h3>
              <button className="modal-x" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tournament Title</label>
                  <input
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={60}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={220}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Community</label>
                  <select
                    className="form-input"
                    value={formData.communityId}
                    onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
                  >
                    {allCommunities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="6:00 PM"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Entry Fee (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-3, #666)', marginTop: '4px' }}>
                    0 = free tournament. A 15% platform commission is logged per paid registration.
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Prize Pool (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="approved">Approved (published)</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Create Tournament' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="toast show" style={{ display: 'flex' }}>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
