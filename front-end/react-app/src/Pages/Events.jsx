import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/events.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'user', firstName: raw.firstName || 'User', username: raw.username || 'user' };
  } catch { return { role: 'user', firstName: 'User', username: 'user' }; }
}

const DEFAULT_EVENTS = [
  { id: 1, title: 'Gaming Hackathon', community: 'Pro Gamers', communityId: 1, date: '2025-03-07', time: '14:00', type: 'Hackathon', mode: 'Online', capacity: 300, registered: 248, description: '48-hour hackathon open to all skill levels. Build anything — solo or in teams up to 4. Prizes worth $2,000.', status: 'approved', icon: '⚡', free: true },
  { id: 2, title: 'Frontend Workshop', community: 'Dev Nexus', communityId: 2, date: '2025-03-09', time: '17:00', type: 'Workshop', mode: 'Online', capacity: 100, registered: 63, description: 'Deep-dive into React and modern frontend tooling. Hands-on session with live demos.', status: 'approved', icon: '💻', free: true },
  { id: 3, title: 'UI Design Sprint', community: 'Design Studio', communityId: 3, date: '2025-03-12', time: '15:00', type: 'Workshop', mode: 'In-Person', capacity: 30, registered: 18, description: 'Weekly UI critique and rapid design sprint session. Bring your current project!', status: 'approved', icon: '🎨', free: false },
];

const CATEGORIES = ['Hackathon', 'Workshop', 'AMA', 'Tournament', 'Discussion', 'Social'];

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Events() {
  const navigate = useNavigate();
  const user = getUser();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create event form state
  const [eventType, setEventType] = useState('Online');
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', community: '', capacity: 50, category: 'Hackathon' });
  const [formErrors, setFormErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [communities, setCommunities] = useState([]);

  // Event modal
  const [modal, setModal] = useState(null);
  const [regModal, setRegModal] = useState(null);
  const [regForm, setRegForm] = useState({ fullName: '', email: '', phone: '', inGameId: '' });
  const [regErrors, setRegErrors] = useState({});

  const [filterChips, setFilterChips] = useState({ all: true });
  const [toast, setToast] = useState({ show: false, msg: '' });

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [evRes, commsRes] = await Promise.all([
          fetch(`${API_BASE}/events`, { headers: { 'x-role': user.role } }),
          fetch(`${API_BASE}/communities`, { headers: { 'x-role': user.role } }),
        ]);
        if (evRes.ok) { const d = await evRes.json(); if (Array.isArray(d) && d.length > 0) setEvents(d); }
        if (commsRes.ok) { const d = await commsRes.json(); if (Array.isArray(d)) setCommunities(d); }
      } catch {}

      // Load registrations from localStorage
      const stored = JSON.parse(localStorage.getItem('nexus_event_registrations') || '[]');
      setMyRegistrations(stored);
      setLoading(false);
    }
    fetchData();
  }, [user.role]);

  const canCreate = ['user', 'community_manager', 'organizer', 'admin'].includes(user.role);
  const isOrganizer = user.role === 'organizer';

  const upcomingEvents = events.filter(e => e.status === 'approved');

  const validateRegForm = () => {
    const errs = {};
    if (!regForm.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!regForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) errs.email = 'Valid email required.';
    if (!regForm.phone.trim() || !/^\d{10}$/.test(regForm.phone.replace(/\D/g, ''))) errs.phone = 'Valid phone number required.';
    if (!regForm.inGameId.trim()) errs.inGameId = 'In-game ID is required.';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitRegistration = async () => {
    if (!validateRegForm()) return;
    const reg = { ...regForm, eventId: regModal.id, eventTitle: regModal.title, registeredAt: new Date().toISOString() };
    const stored = JSON.parse(localStorage.getItem('nexus_event_registrations') || '[]');
    stored.push(reg);
    localStorage.setItem('nexus_event_registrations', JSON.stringify(stored));
    setMyRegistrations(stored);
    setRegModal(null);
    setRegForm({ fullName: '', email: '', phone: '', inGameId: '' });
    showToast(`✅ Registered for ${reg.eventTitle}!`);
    try {
      await fetch(`${API_BASE}/events/${regModal.id}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify(reg),
      });
    } catch {}
  };

  const validateCreate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Event title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.date) errs.date = 'Date is required.';
    if (!form.time) errs.time = 'Time is required.';
    if (!form.community) errs.community = 'Community is required.';
    if (!form.capacity || form.capacity < 1) errs.capacity = 'Capacity must be at least 1.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    const newEvent = { ...form, type: eventType, status: 'pending', id: Date.now(), registered: 0, free: true };
    setEvents(prev => [...prev, newEvent]);
    setActiveTab('upcoming');
    showToast('✅ Event submitted for approval!');
    try {
      await fetch(`${API_BASE}/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify(newEvent),
      });
    } catch {}
  };

  const saveDraft = () => {
    localStorage.setItem('nexus_event_draft', JSON.stringify(form));
    setDraftSaved(true);
    showToast('📝 Draft saved!');
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const loadDraft = () => {
    const draft = JSON.parse(localStorage.getItem('nexus_event_draft') || 'null');
    if (draft) { setForm(draft); showToast('📂 Draft loaded!'); }
    else showToast('ℹ️ No draft found.');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const isRegistered = (eventId) => myRegistrations.some(r => r.eventId === eventId);

  const TABS = [
    { id: 'upcoming', label: '📅 Upcoming', count: upcomingEvents.length },
    { id: 'registered', label: '🎟 My Registrations', count: myRegistrations.length },
    ...(canCreate ? [{ id: 'create', label: '✦ Create Event' }] : []),
  ];

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-title">Events</div>
          <div className="header-actions">
            <div className="icon-btn">🔔<div className="notif-dot"></div></div>
            <div className="header-avatar user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')} />
          </div>
        </header>

        {/* Tab Bar */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              id={tab.id === 'create' ? 'createTabButton' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
          <div className="tab-cta"></div>
          {canCreate && (
            <button className="btn-create" onClick={() => setActiveTab('create')}>+ Create Event</button>
          )}
        </div>

        {/* ── UPCOMING EVENTS TAB ── */}
        {activeTab === 'upcoming' && (
          <div className="content active" id="tab-upcoming">
            <div className="filters-row">
              <div className={`filter-chip${filterChips.all ? ' on' : ''}`} onClick={() => setFilterChips({ all: true })}>✦ All Events</div>
            </div>

            {/* Featured Event */}
            {upcomingEvents[0] && (
              <div className="featured-event">
                <div className="feat-glow"></div>
                <div className="feat-content">
                  <div>
                    <div className="feat-badge-row">
                      <span className="ev-badge badge-live">● Live Registration</span>
                      {upcomingEvents[0].free && <span className="ev-badge badge-free">🆓 Free</span>}
                      <span className="ev-badge badge-online">🌐 {upcomingEvents[0].mode || 'Online'}</span>
                    </div>
                    <div className="feat-title">{upcomingEvents[0].title}</div>
                    <div className="feat-desc">{upcomingEvents[0].description}</div>
                    <div className="feat-community">
                      <div className="feat-comm-av">{upcomingEvents[0].icon || '⚡'}</div>
                      <span className="feat-comm-name">Hosted by <strong>{upcomingEvents[0].community}</strong></span>
                    </div>
                  </div>
                  <div className="feat-bottom">
                    <div className="feat-meta-item">🗓 {formatDate(upcomingEvents[0].date)}</div>
                    <div className="feat-meta-item">⏰ Starts {upcomingEvents[0].time}</div>
                    <div className="feat-meta-item">👥 {upcomingEvents[0].registered} registered</div>
                    <div className="feat-meta-item">💺 {(upcomingEvents[0].capacity || 300) - (upcomingEvents[0].registered || 0)} seats left</div>
                  </div>
                </div>
                <div className="feat-actions">
                  <div className="attendee-stack">
                    <div className="avatar-stack">
                      <div className="av grad-purple"></div>
                      <div className="av grad-green">AK</div>
                      <div className="av">+{upcomingEvents[0].registered - 2 || 246}</div>
                    </div>
                    <div className="attendee-count">{upcomingEvents[0].registered} people registered</div>
                  </div>
                  <div>
                    <div className="seats-left">⚡ {(upcomingEvents[0].capacity || 300) - (upcomingEvents[0].registered || 0)} seats left</div>
                    <button
                      id="featured-register"
                      className={`btn-register${isRegistered(upcomingEvents[0].id) ? ' registered' : ''}`}
                      aria-label="Register for featured event"
                      onClick={() => isRegistered(upcomingEvents[0].id) ? null : setRegModal(upcomingEvents[0])}
                      disabled={isRegistered(upcomingEvents[0].id)}
                    >
                      {isRegistered(upcomingEvents[0].id) ? '✓ Registered' : 'Register Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section Header */}
            <div className="section-header">
              <div>
                <div className="section-title">All Upcoming Events</div>
                <div className="section-sub">{upcomingEvents.length} events across your communities</div>
              </div>
            </div>

            {/* Events Grid */}
            <div className="events-grid" id="upcomingGrid">
              {loading ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3,#666)' }}>Loading events…</div>
              ) : upcomingEvents.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3,#666)' }}>No upcoming events yet.</div>
              ) : (
                upcomingEvents.map(ev => (
                  <div key={ev.id} className="event-card" onClick={() => setModal(ev)} style={{ cursor: 'pointer' }}>
                    <div className="ev-banner" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', borderRadius: '10px 10px 0 0', padding: '24px', textAlign: 'center', fontSize: '32px' }}>
                      {ev.icon || '📅'}
                    </div>
                    <div className="ev-body">
                      <div className="ev-badges">
                        {ev.free && <span className="ev-badge badge-free">🆓 Free</span>}
                        <span className="ev-badge">{ev.type}</span>
                      </div>
                      <div className="ev-title">{ev.title}</div>
                      <div className="ev-meta">
                        <span>🗓 {formatDate(ev.date)}</span>
                        <span>👥 {ev.community}</span>
                      </div>
                      <div className="ev-capacity" style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '8px' }}>
                        {ev.registered}/{ev.capacity} registered
                      </div>
                      <button
                        className={`ev-register-btn${isRegistered(ev.id) ? ' registered' : ''}`}
                        style={{
                          marginTop: '12px', width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
                          background: isRegistered(ev.id) ? 'rgba(99,102,241,0.15)' : '#6366f1',
                          color: isRegistered(ev.id) ? '#818cf8' : '#fff',
                          fontWeight: 600, fontSize: '13px', cursor: isRegistered(ev.id) ? 'default' : 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); if (!isRegistered(ev.id)) setRegModal(ev); }}
                        disabled={isRegistered(ev.id)}
                      >
                        {isRegistered(ev.id) ? '✓ Registered' : 'Register'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MY REGISTRATIONS TAB ── */}
        {activeTab === 'registered' && (
          <div className="content active" id="tab-registered">
            <div className="section-header">
              <div>
                <div className="section-title">🎟 My Registrations</div>
                <div className="section-sub" id="reg-sub-header">{myRegistrations.length} upcoming events you're registered for</div>
              </div>
            </div>
            <div className="reg-list" id="regGrid">
              {myRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3,#666)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎟</div>
                  <div>You haven't registered for any events yet.</div>
                  <button style={{ marginTop: '16px', padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('upcoming')}>Browse Events</button>
                </div>
              ) : (
                myRegistrations.map((reg, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--bg-card,#151d2f)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border,rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '28px' }}>🎟</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{reg.eventTitle}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '3px' }}>
                        Registered on {new Date(reg.registeredAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3,#666)' }}>
                        {reg.fullName} · {reg.email}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>✓ Confirmed</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── CREATE EVENT TAB ── */}
        {activeTab === 'create' && (
          <div className="content active" id="tab-create">
            <form id="createEventForm" className="create-layout" onSubmit={submitEvent}>
              <div className="form-card">
                <div className="form-section-title">✦ Create a New Event</div>

                <div className="field">
                  <label>Event Title *</label>
                  <input id="evTitle" type="text" placeholder="e.g. MOBA Deep Dive Workshop" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  {formErrors.title && <div className="error-msg" id="err-title">{formErrors.title}</div>}
                </div>

                <div className="field">
                  <label>Description *</label>
                  <textarea id="evDesc" rows={3} placeholder="Tell attendees what to expect…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  {formErrors.description && <div className="error-msg" id="err-desc">{formErrors.description}</div>}
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Date *</label>
                    <input id="evDate" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    {formErrors.date && <div className="error-msg" id="err-date">{formErrors.date}</div>}
                  </div>
                  <div className="field">
                    <label>Time *</label>
                    <input id="evTime" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                    {formErrors.time && <div className="error-msg" id="err-time">{formErrors.time}</div>}
                  </div>
                </div>

                <div className="field">
                  <label>Event Type</label>
                  <div className="type-toggle">
                    {['Online', 'In-Person', 'Hybrid'].map(t => (
                      <div key={t} className={`type-opt${eventType === t ? ' on' : ''}`} onClick={() => setEventType(t)}>
                        {t === 'Online' ? '🌐' : t === 'In-Person' ? '📍' : '🔀'} {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Community *</label>
                    <select id="evCommunity" value={form.community} onChange={e => setForm(f => ({ ...f, community: e.target.value }))}>
                      <option value="">Select community</option>
                      {communities.length > 0
                        ? communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        : DEFAULT_EVENTS.map(e => <option key={e.communityId} value={e.communityId}>{e.community}</option>)
                      }
                    </select>
                    {formErrors.community && <div className="error-msg" id="err-community">{formErrors.community}</div>}
                  </div>
                  <div className="field">
                    <label>Max Attendees *</label>
                    <input id="evMax" type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 50 }))} />
                    {formErrors.capacity && <div className="error-msg" id="err-max">{formErrors.capacity}</div>}
                  </div>
                </div>

                <div className="field">
                  <label>Category *</label>
                  <select id="evCategory" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="Hackathon">🏆 Hackathon</option>
                    <option value="Workshop">🎓 Workshop</option>
                    <option value="AMA">🎙 AMA / Talk</option>
                    <option value="Tournament">🎮 Gaming / Tournament</option>
                    <option value="Discussion">📖 Discussion</option>
                    <option value="Social">🎉 Social / Meetup</option>
                  </select>
                </div>

                <div className="field">
                  <label>Cover Image (Optional)</label>
                  <div
                    id="uploadArea"
                    className="upload-area"
                    tabIndex={0}
                    role="button"
                    aria-label="Upload cover image"
                    onClick={() => document.getElementById('evCover').click()}
                  >
                    {coverPreview ? (
                      <div id="uploadPreview" className="upload-preview">
                        <img src={coverPreview} alt="Cover preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                      </div>
                    ) : (
                      <div id="uploadDefault">
                        <div className="upload-icon">🖼</div>
                        <div className="upload-text" id="uploadText">Drag &amp; drop or click to upload</div>
                        <div className="upload-sub">Using default gaming banner if empty</div>
                      </div>
                    )}
                  </div>
                  <input id="evCover" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>

                <div className="form-actions">
                  <button type="button" id="saveDraftBtn" className="btn-draft" onClick={saveDraft}>{draftSaved ? '✓ Saved!' : 'Save Draft'}</button>
                  <button type="button" id="loadDraftBtn" className="btn-draft" onClick={loadDraft}>Load Last Draft</button>
                  <button type="submit" id="publishEventBtn" className="btn-publish">Request Approval</button>
                </div>
              </div>

              {/* Preview + Tips */}
              <div className="preview-card-wrap">
                <div className="preview-label">Live Preview</div>
                <div className="preview-card">
                  <div className="preview-banner">📅</div>
                  <div className="preview-body">
                    <div className="preview-title" id="prevTitle">{form.title || 'Your event title'}</div>
                    <div className="preview-meta">
                      <div className="preview-meta-row" id="prevDate">
                        {form.date && form.time ? `🗓 ${formatDate(form.date)} at ${form.time}` : '🗓 Select a date and time'}
                      </div>
                      <div className="preview-meta-row">🌐 {eventType} · ⚡ Community</div>
                      <div className="preview-meta-row">🏆 {form.category} · 🆓 Free</div>
                    </div>
                  </div>
                </div>
                <div className="tips-card">
                  <div className="tips-title">✦ Tips for great events</div>
                  <div className="tip-row"><div className="tip-dot"></div>Use a clear, descriptive title that states what attendees will learn or do.</div>
                  <div className="tip-row"><div className="tip-dot"></div>Add a cover image — events with images get 3× more registrations.</div>
                  <div className="tip-row"><div className="tip-dot"></div>Set a max capacity to create urgency and manage expectations.</div>
                  <div className="tip-row"><div className="tip-dot"></div>Post in relevant channels to announce your event after publishing.</div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Event Details Modal */}
        {modal && (
          <div id="eventModal" className="event-modal" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <div className="event-modal-content">
              <button className="event-modal-close" onClick={() => setModal(null)} aria-label="Close">×</button>
              <div className="modal-status" id="modalStatus">
                <span className="ev-badge badge-live">● {modal.status || 'Approved'}</span>
              </div>
              <h2 id="modalTitle">{modal.title}</h2>
              <p id="modalDesc">{modal.description}</p>
              <div className="modal-detail-grid">
                <p id="modalDate">🗓 {formatDate(modal.date)} at {modal.time}</p>
                <p id="modalCommunity">🏘️ {modal.community}</p>
                <p id="modalCapacity">👥 {modal.registered}/{modal.capacity} registered</p>
                <p id="modalCategory">🏆 {modal.type}</p>
              </div>
              {!isRegistered(modal.id) && (
                <button className="btn-publish" style={{ width: '100%', marginTop: '16px' }} onClick={() => { setModal(null); setRegModal(modal); }}>Register Now</button>
              )}
            </div>
          </div>
        )}

        {/* Registration Modal */}
        {regModal && (
          <div id="registerModal" className="event-modal" onClick={e => { if (e.target === e.currentTarget) setRegModal(null); }}>
            <div className="event-modal-content">
              <button className="event-modal-close" onClick={() => setRegModal(null)} aria-label="Close">×</button>
              <h2>Register for <span id="regModalEventTitle">{regModal.title}</span></h2>
              <p style={{ color: 'var(--text-3,#9ca3af)', fontSize: '13px', marginTop: '-8px' }}>We need a few details before confirming your spot.</p>
              <div className="field">
                <label>Full Name *</label>
                <input id="regFullName" type="text" placeholder="Your full name" value={regForm.fullName} onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))} />
                {regErrors.fullName && <div className="error-msg">{regErrors.fullName}</div>}
              </div>
              <div className="field">
                <label>Email *</label>
                <input id="regEmail" type="email" placeholder="you@example.com" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                {regErrors.email && <div className="error-msg">{regErrors.email}</div>}
              </div>
              <div className="field">
                <label>Phone Number *</label>
                <input id="regPhone" type="tel" placeholder="e.g. 9876543210" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                {regErrors.phone && <div className="error-msg">{regErrors.phone}</div>}
              </div>
              <div className="field">
                <label>In-Game ID / Username *</label>
                <input id="regInGameId" type="text" placeholder="Your in-game handle" value={regForm.inGameId} onChange={e => setRegForm(f => ({ ...f, inGameId: e.target.value }))} />
                {regErrors.inGameId && <div className="error-msg">{regErrors.inGameId}</div>}
              </div>
              <div className="form-actions">
                <button type="button" className="btn-draft" onClick={() => setRegModal(null)}>Cancel</button>
                <button type="button" className="btn-publish" onClick={submitRegistration}>Confirm Registration</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className={`toast${toast.show ? ' show' : ''}`} id="toast">
          <span id="toastMsg">{toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
