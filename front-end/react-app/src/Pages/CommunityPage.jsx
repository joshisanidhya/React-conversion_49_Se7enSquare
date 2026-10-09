import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import '../styles/global.css';
import '../styles/community-page.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'user', username: raw.username || 'user', firstName: raw.firstName || 'User' };
  } catch { return { role: 'user', username: 'user', firstName: 'User' }; }
}

const DEFAULT_COMMUNITY = {
  id: 1, name: 'Pro Gamers', icon: '⚡', members: 2451, online: 312,
  category: 'Esports · Competitive', founded: 'Mar 2022',
  description: 'Pro Gamers is a thriving community for developers of all levels — from curious beginners to seasoned engineers. We share projects, debug together, discuss the latest frameworks, and support each other in growing our careers.',
  tags: ['MOBA', 'RPG', 'FPS', 'Streaming', 'Open Source', 'Career', 'Hackathons'],
  channels: [
    { id: 1, name: 'general', type: 'text', topic: 'Main hub' },
    { id: 2, name: 'announcements', type: 'text', topic: 'Official announcements' },
    { id: 3, name: 'dev-talk', type: 'text', topic: 'Technical discussions' },
    { id: 4, name: 'off-topic', type: 'text', topic: 'Anything goes' },
  ],
  members_list: [
    { id: 1, name: 'Rahul Kumar', role: 'owner', username: 'rahulkumar' },
    { id: 2, name: 'Alex Morgan', role: 'moderator', username: 'alexmorgan' },
    { id: 3, name: 'Maya Krishnan', role: 'member', username: 'mayak' },
    { id: 4, name: 'Priya Sharma', role: 'member', username: 'priyas' },
  ],
  rules: [
    'Be respectful and constructive in all discussions.',
    'No spam, self-promotion, or off-topic content.',
    'No hate speech, harassment, or discrimination.',
    'Use code blocks for code snippets.',
    'Keep discussions in the correct channels.',
    'No sharing of proprietary or confidential content.',
    'Follow platform Terms of Service at all times.',
  ],
};

export default function CommunityPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const id = paramId || searchParams.get('id') || '1';
  const user = getUser();

  const [community, setCommunity] = useState(DEFAULT_COMMUNITY);
  const [activeTab, setActiveTab] = useState('overview');
  const [joined, setJoined] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const canManage = user.role === 'admin' || user.role === 'community_manager';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    async function fetchCommunity() {
      if (!id) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/communities/${id}`, { headers: { 'x-role': user.role } });
        if (res.ok) {
          const data = await res.json();
          setCommunity({ ...DEFAULT_COMMUNITY, ...data });
        }
      } catch {}
      setLoading(false);
    }
    fetchCommunity();
  }, [id, user.role]);

  const toggleJoin = async () => {
    const next = !joined;
    setJoined(next);
    try {
      await fetch(`${API_BASE}/communities/${community.id}/${next ? 'join' : 'leave'}`, {
        method: 'POST', headers: { 'x-role': user.role },
      });
    } catch {}
  };

  const filteredMembers = community.members_list?.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.username.toLowerCase().includes(memberSearch.toLowerCase())
  ) || [];

  const TABS = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'channels', label: `📡 Channels`, count: community.channels?.length || 0 },
    { id: 'members', label: `👥 Members`, count: community.members },
    { id: 'rules', label: `📜 Rules`, count: community.rules?.length || 0 },
  ];

  return (
    <div className="main">
      {/* Header */}
      <header className="header">
        <button className="page-back-btn" onClick={() => navigate(-1)} title="Back to communities">
          ← Back
        </button>
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/discovery')}>Discover</button>
          <span className="sep">›</span>
          <button className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <span className="sep">›</span>
          <span className="current" id="breadcrumbCommunityName">{community.name}</span>
        </div>
        <div className="header-actions">
          <div className="icon-btn">
            🔔
            <div className="notif-dot"></div>
          </div>
          <div className="header-avatar user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')} />
        </div>
      </header>

      {/* Banner */}
      <div className="comm-banner-area">
        <div className="comm-banner">
          <div className="banner-pattern"></div>
          <div className="banner-emoji" id="comm-icon">{community.icon}</div>
        </div>
        <div className="comm-profile-row">
          <div className="comm-big-icon">{community.icon}</div>
          <div className="comm-title-block">
            <div className="comm-title-row">
              <h1 className="comm-big-name" id="comm-name-title">{community.name}</h1>
              <div className="verified-badge">✓ Verified</div>
            </div>
            <div className="comm-meta-row">
              <div className="meta-chip"><span className="online-dot"></span> <span id="comm-online-count">{community.online}</span> online</div>
              <div className="meta-chip">👥 <span id="comm-member-count">{(community.members || 0).toLocaleString()}</span> members</div>
              <div className="meta-chip" id="comm-category">💻 {community.category}</div>
              <div className="meta-chip" id="comm-founded">📅 Founded {community.founded}</div>
            </div>
          </div>
          <div className="comm-actions">
            <button
              className={`btn-joined-main${joined ? '' : ' not-joined'}`}
              id="joinMainBtn"
              onClick={toggleJoin}
              style={{
                background: joined ? 'rgba(99,102,241,0.2)' : '#6366f1',
                border: joined ? '1px solid #6366f1' : 'none',
                color: '#fff', borderRadius: '10px', padding: '10px 20px',
                fontWeight: 600, cursor: 'pointer', fontSize: '14px',
              }}
            >
              {joined ? '✓ Joined' : '+ Join'}
            </button>
            {canManage && (
              <Link
                to={`/community-settings/${community.id}`}
                className="rbac-manage-btn"
                id="rbacManageBtn"
                title="Open community settings"
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ccc', borderRadius: '10px', padding: '10px 16px', textDecoration: 'none',
                  fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                ⚙️ Community Settings
              </Link>
            )}
            {canDelete && (
              <button
                id="rbacDeleteBtn"
                onClick={() => {
                  if (window.confirm(`Delete community "${community.name}"? This cannot be undone.`)) {
                    navigate('/dashboard');
                  }
                }}
                style={{
                  background: 'rgba(255,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,68,68,0.2)',
                  borderRadius: '8px', padding: '0 16px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', height: '40px',
                }}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{(tab.count || 0).toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="tab-content active" id="tab-overview">
          <div className="overview-left">
            {/* Pinned Announcement */}
            <div className="pinned-card">
              <div className="pin-header">📌 Pinned Announcement</div>
              <div className="pin-text">
                Welcome to {community.name}! 🎉 Our monthly hackathon is back —
                <strong> March Hack Sprint</strong> starts on March 7th. Register in #events before March 6th. Prizes worth $2,000 up for grabs. All skill levels welcome!
              </div>
              <div className="pin-footer">
                <div className="pin-author">
                  <div className="pin-av user-avatar"></div>
                  <span>Rahul Kumar (Owner) · 2 days ago</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="section-card">
              <div className="sc-title">
                <span className="sc-title-icon">ℹ</span> About <span className="comm-name-text">{community.name}</span>
              </div>
              <div className="about-text" id="comm-description">{community.description}</div>
              <div className="tag-row">
                {community.tags?.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="section-card">
              <div className="sc-title"><span className="sc-title-icon">📊</span> Community Stats</div>
              <div className="stat-grid">
                <div className="stat-box">
                  <div className="stat-val" id="stat-total-members">{(community.members || 0).toLocaleString()}</div>
                  <div className="stat-lbl">Total Members</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val stat-online" id="stat-online-now">{community.online}</div>
                  <div className="stat-lbl">Online Now</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val">{community.channels?.length || 14}</div>
                  <div className="stat-lbl">Channels</div>
                </div>
                <div className="stat-box">
                  <div className="stat-val">48k+</div>
                  <div className="stat-lbl">Messages Sent</div>
                </div>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="section-card">
              <div className="sc-title"><span className="sc-title-icon">💬</span> Recent Messages</div>
              <div className="messages-feed">
                {[
                  { initials: 'AM', color: 'grad-violet', name: 'Alex Morgan', time: '10:41 AM', text: 'This looks incredible! Love the design direction. Are you using Gameunity\'s design system?', reactions: [] },
                  { initials: 'MP', color: 'grad-pink', name: 'Maya Petrov', time: '10:44 AM', text: 'Sharing our team\'s early UI mockup for the hackathon 👀', reactions: [{ emoji: '🔥', count: 22 }, { emoji: '😍', count: 8 }] },
                  { initials: 'RK', color: 'grad-purple', name: 'Rahul Kumar', time: '10:08 AM', role: 'Moderator', text: 'Check out the nexus-cli setup snippet in #dev-talk', reactions: [] },
                ].map((msg, i) => (
                  <div key={i} className="msg-group">
                    <div className={`msg-av ${msg.color}`} style={{ fontWeight: 700, fontSize: '12px', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: msg.color === 'grad-violet' ? '#6366f1' : msg.color === 'grad-pink' ? '#ec4899' : '#8b5cf6', color: '#fff' }}>
                      {msg.initials}
                    </div>
                    <div className="msg-body">
                      <div className="msg-header">
                        <span className="msg-uname">{msg.name}</span>
                        {msg.role && <span className="msg-role role-moderator-badge">{msg.role}</span>}
                        <span className="msg-time">{msg.time}</span>
                      </div>
                      <div className="msg-text">{msg.text}</div>
                      {msg.reactions.length > 0 && (
                        <div className="reactions">
                          {msg.reactions.map((r, j) => (
                            <div key={j} className="FPS-pill"><span>{r.emoji}</span><span className="FPS-count">{r.count}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="msg-actions">
                      <button className="act-btn reaction-btn">😊</button>
                      <button className="act-btn reply-btn">↩</button>
                      <button className="act-btn more-btn">⋯</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="view-more-messages">
                <button
                  className="view-more-btn"
                  onClick={() => navigate(`/chat?community=${community.id}&cname=${encodeURIComponent(community.name)}`)}
                >
                  View Community Posts →
                </button>
              </div>
            </div>
          </div>

          <div className="overview-right">
            {/* Active Events */}
            <div className="section-card">
              <div className="sc-title"><span className="sc-title-icon">📅</span> Active Events</div>
              <div id="activeEventsList">
                <div style={{ padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>🏆 Gaming Hackathon</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '4px' }}>Mar 7 · 2:00 PM IST</div>
                  <button
                    style={{ marginTop: '8px', padding: '6px 14px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => navigate('/events')}
                  >
                    View Event
                  </button>
                </div>
              </div>
            </div>

            {/* Created By */}
            <div className="section-card">
              <div className="sc-title"><span className="sc-title-icon">👤</span> Created By</div>
              <div className="created-by-card">
                <div className="created-by-avatar" style={{ background: '#f59e0b', color: '#000', fontWeight: 700, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>RK</div>
                <div>
                  <div className="created-by-name">Rahul Kumar</div>
                  <div className="created-by-meta">Owner · Since {community.founded}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNELS TAB ── */}
      {activeTab === 'channels' && (
        <div className="tab-content active" id="tab-channels">
          <div className="channels-layout">
            <div className="channels-main" id="channelsList">
              {community.channels?.map(ch => (
                <div
                  key={ch.id}
                  className="channel-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    background: 'var(--bg-card,#151d2f)', borderRadius: '10px', marginBottom: '8px',
                    cursor: 'pointer', border: '1px solid var(--border,rgba(255,255,255,0.06))',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => navigate(`/chat?community=${community.id}&cname=${encodeURIComponent(community.name)}&channel=${encodeURIComponent(ch.name)}`)}
                >
                  <span style={{ fontSize: '18px', opacity: 0.7 }}>#</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-1,#fff)' }}>{ch.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginTop: '2px' }}>{ch.topic}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-3,#555)' }}>→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {activeTab === 'members' && (
        <div className="tab-content active" id="tab-members">
          <div className="members-layout">
            <div className="members-search">
              <span className="members-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search members…"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="members-groups" id="membersContainer">
              {filteredMembers.length === 0 ? (
                <div style={{ padding: '20px', color: 'var(--text-muted,#666)', fontSize: '13px' }}>No members found.</div>
              ) : (
                ['owner', 'moderator', 'member'].map(roleGroup => {
                  const groupMembers = filteredMembers.filter(m => m.role === roleGroup);
                  if (groupMembers.length === 0) return null;
                  return (
                    <div key={roleGroup}>
                      <div className="members-group-title" style={{ fontSize: '11px', color: 'var(--text-3,#666)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', padding: '16px 0 8px' }}>
                        {roleGroup === 'owner' ? '👑 Owner' : roleGroup === 'moderator' ? '🛡️ Moderators' : '👥 Members'} — {groupMembers.length}
                      </div>
                      {groupMembers.map(m => (
                        <div key={m.id} className="member-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.role === 'owner' ? '#f59e0b' : m.role === 'moderator' ? '#6366f1' : '#374151', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                            {m.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-1,#fff)' }}>{m.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-3,#666)' }}>@{m.username}</div>
                          </div>
                          <div style={{ marginLeft: 'auto' }}>
                            <button
                              onClick={() => navigate(`/report?user=${m.id}&uname=${encodeURIComponent(m.name)}`)}
                              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3,#666)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              🚩
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RULES TAB ── */}
      {activeTab === 'rules' && (
        <div className="tab-content active" id="tab-rules">
          <div className="rules-layout">
            <div className="rules-main" id="rulesMain">
              {community.rules?.map((rule, i) => (
                <div key={i} className="rule-item" style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--bg-card,#151d2f)', borderRadius: '10px', marginBottom: '10px', border: '1px solid var(--border,rgba(255,255,255,0.06))' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#818cf8', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ color: 'var(--text-secondary,#ccc)', fontSize: '14px', lineHeight: '1.5' }}>{rule}</div>
                </div>
              ))}
            </div>
            <div className="rules-aside">
              <div className="rules-note">
                <div className="rules-note-title">✓ Safe Community</div>
                <div className="rules-note-text">
                  {community.name} has zero tolerance for hate speech, harassment, or discrimination. Violations result in immediate action.
                </div>
              </div>
              <div className="section-card">
                <div className="sc-title">⚖️ Enforcement</div>
                <div className="enforcement-list">
                  {['⚠️ 1st offense: Warning', '🔇 2nd offense: 24h mute', '🚫 3rd offense: Temp ban', '⛔ Severe: Permanent ban'].map((item, i) => (
                    <div key={i} className={`enforcement-item${i === 3 ? ' enforcement-item--severe' : ''}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="section-card">
                <div className="sc-title">📬 Report a Problem</div>
                <div className="report-text">Use the report button on any message or contact a moderator directly.</div>
                <button
                  className="report-btn"
                  onClick={() => navigate(`/report?community=${community.id}&cname=${encodeURIComponent(community.name)}`)}
                >
                  🚩 Report an Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
