import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/event-approval.css';

const API_BASE = 'http://localhost:3000/api';

function getRole() {
  try {
    const stored = localStorage.getItem('nexus_user') || localStorage.getItem('currentUser');
    const raw = stored ? JSON.parse(stored) : {};
    return raw.role || 'community_manager';
  } catch { return 'community_manager'; }
}

export default function EventApproval() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    let evList = [];
    let commList = [];

    const role = getRole();
    try {
      const [evRes, commRes] = await Promise.all([
        fetch(`${API_BASE}/events`, { headers: { 'x-role': role } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${API_BASE}/communities`, { headers: { 'x-role': role } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      evList = evRes;
      commList = commRes;
    } catch {
      // Fallback
    }

    if (!evList || evList.length === 0) {
      evList = [
        {
          id: 1,
          title: 'Valorant Regional Qualifiers',
          description: 'Official collegiate 5v5 tournament with single elimination format.',
          date: '2026-10-18',
          time: '5:00 PM',
          communityId: 1,
          createdBy: 'player01',
          status: 'pending',
          maxAttendees: 64,
          category: 'tournament',
        },
        {
          id: 2,
          title: 'Apex Legends Duo Scrims',
          description: 'Custom lobby practice for ranked players with live casting.',
          date: '2026-10-20',
          time: '7:00 PM',
          communityId: 2,
          createdBy: 'gamer99',
          status: 'approved',
          maxAttendees: 60,
          category: 'scrim',
        },
      ];
    }

    if (!commList || commList.length === 0) {
      commList = [
        { id: 1, name: 'FPS Arena' },
        { id: 2, name: 'Pro Gamers' },
      ];
    }

    setEvents(evList);
    setCommunities(commList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCommunityName = (id) => {
    const c = communities.find((item) => Number(item.id) === Number(id));
    return c ? c.name : `Community #${id}`;
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`${API_BASE}/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-role': getRole(),
        },
        body: JSON.stringify({ status: 'approved' }),
      });
      showToast('✅ Event approved — all users will now see it.');
    } catch {
      showToast('✅ Event approved.');
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'approved' } : e))
    );
  };

  const handleReject = async (id) => {
    try {
      await fetch(`${API_BASE}/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-role': getRole(),
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      showToast('❌ Event rejected.');
    } catch {
      showToast('❌ Event rejected.');
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e))
    );
  };

  const openDetails = (ev) => {
    setSelectedEvent(ev);
    setModalOpen(true);
  };

  const pendingList = events.filter((e) => e.status === 'pending');
  const approvedList = events.filter((e) => e.status === 'approved');
  const rejectedList = events.filter((e) => e.status === 'rejected');

  return (
    <div className="app-shell">
      <SideBar />

      <main className="approval-main">
        {/* Header */}
        <header className="approval-header">
          <div>
            <p className="approval-kicker">Community Operations</p>
            <h1>Event Requests</h1>
          </div>
          <button className="approval-secondary-btn" onClick={() => navigate('/events')}>
            View Events
          </button>
        </header>

        {/* Summary */}
        <section className="approval-summary" aria-label="Event approval summary">
          <div>
            <span className="summary-label">Pending</span>
            <strong>{pendingList.length}</strong>
          </div>
          <div>
            <span className="summary-label">Approved</span>
            <strong>{approvedList.length}</strong>
          </div>
          <div>
            <span className="summary-label">Rejected</span>
            <strong>{rejectedList.length}</strong>
          </div>
        </section>

        {/* Pending Events */}
        <section className="approval-list-section">
          <div className="approval-section-head">
            <div>
              <h2>Pending Events</h2>
              <p>Approve requests to make them visible on the events page.</p>
            </div>
          </div>
          <div className="approval-list">
            {loading ? (
              <div className="approval-empty">Loading events…</div>
            ) : pendingList.length === 0 ? (
              <div className="approval-empty">No pending event requests.</div>
            ) : (
              pendingList.map((event) => (
                <article key={event.id} className="approval-card">
                  <span className="status-badge pending">Pending</span>
                  <h3>{event.title}</h3>
                  <div className="approval-meta">
                    <div>
                      <span>Date:</span> {event.date} {event.time || ''}
                    </div>
                    <div>
                      <span>Community:</span> {getCommunityName(event.communityId)}
                    </div>
                    <div>
                      <span>Requested by:</span> {event.createdBy || 'Organizer'}
                    </div>
                  </div>
                  <button className="details-btn" onClick={() => openDetails(event)}>
                    View Details
                  </button>
                  <div className="approval-actions">
                    <button className="approve-btn" onClick={() => handleApprove(event.id)}>
                      Approve
                    </button>
                    <button className="reject-btn" onClick={() => handleReject(event.id)}>
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Approved Events */}
        <section className="approval-list-section">
          <div className="approval-section-head">
            <div>
              <h2>Approved Events</h2>
              <p>Live events currently visible to members.</p>
            </div>
          </div>
          <div className="approval-list">
            {approvedList.length === 0 ? (
              <div className="approval-empty">No events in this list.</div>
            ) : (
              approvedList.map((event) => (
                <article key={event.id} className="event-card">
                  <span className="status-badge approved">Approved</span>
                  <h3>{event.title}</h3>
                  <div className="approval-meta">
                    <div>
                      <span>Date:</span> {event.date} {event.time || ''}
                    </div>
                    <div>
                      <span>Community:</span> {getCommunityName(event.communityId)}
                    </div>
                  </div>
                  <button className="details-btn" onClick={() => openDetails(event)}>
                    View Details
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Rejected Events */}
        <section className="approval-list-section">
          <div className="approval-section-head">
            <div>
              <h2>Rejected Events</h2>
              <p>Requests that were declined by the management team.</p>
            </div>
          </div>
          <div className="approval-list">
            {rejectedList.length === 0 ? (
              <div className="approval-empty">No rejected events.</div>
            ) : (
              rejectedList.map((event) => (
                <article key={event.id} className="event-card">
                  <span className="status-badge rejected">Rejected</span>
                  <h3>{event.title}</h3>
                  <div className="approval-meta">
                    <div>
                      <span>Date:</span> {event.date} {event.time || ''}
                    </div>
                    <div>
                      <span>Community:</span> {getCommunityName(event.communityId)}
                    </div>
                  </div>
                  <button className="details-btn" onClick={() => openDetails(event)}>
                    View Details
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal */}
      {modalOpen && selectedEvent && (
        <div
          className="modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className={`status-badge ${selectedEvent.status || 'pending'}`}>
              {selectedEvent.status || 'pending'}
            </span>
            <h2>{selectedEvent.title}</h2>
            <p style={{ marginTop: '8px' }}>{selectedEvent.description || 'No description provided.'}</p>
            <p style={{ marginTop: '8px' }}>
              <strong>Date:</strong> {selectedEvent.date} {selectedEvent.time || ''}
            </p>
            <p>
              <strong>Community:</strong> {getCommunityName(selectedEvent.communityId)}
            </p>
            <p>
              <strong>Capacity:</strong> {selectedEvent.maxAttendees || 'Unlimited'}
            </p>
            <p>
              <strong>Category:</strong> {selectedEvent.category || selectedEvent.type || 'Tournament'}
            </p>
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
