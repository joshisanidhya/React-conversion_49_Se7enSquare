import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/discovery.css';

const API_BASE = 'http://localhost:3000/api';

const CATEGORIES = ['All', 'Technology', 'Gaming', 'Design', 'Education', 'Social', 'Music', 'Sports'];

const DEFAULT_COMMUNITIES = [
  { id: 1, name: 'Pro Gamers', icon: '⚡', members: 2451, online: 312, category: 'Gaming', description: 'Competitive gaming for all skill levels.', tags: ['MOBA', 'FPS', 'Esports'] },
  { id: 2, name: 'Dev Nexus', icon: '💻', members: 12400, online: 890, category: 'Technology', description: 'Realtime discussions on web dev and open source.', tags: ['Web', 'Open Source'] },
  { id: 3, name: 'Design Studio', icon: '🎨', members: 8200, online: 420, category: 'Design', description: 'Weekly UI crits and design sprints.', tags: ['UI', 'Figma', 'Branding'] },
  { id: 4, name: 'Open Source Hub', icon: '🌱', members: 6800, online: 245, category: 'Technology', description: 'Collaborate on open source projects.', tags: ['Git', 'Hacktoberfest'] },
  { id: 5, name: 'Hackathon HQ', icon: '🏆', members: 5100, online: 180, category: 'Technology', description: 'Hackathons, competitions, and team-building.', tags: ['Hackathon', 'Prizes'] },
  { id: 6, name: 'Music Makers', icon: '🎵', members: 3200, online: 88, category: 'Music', description: 'Producers, singers, and music enthusiasts.', tags: ['EDM', 'Hip-hop', 'Classical'] },
  { id: 7, name: 'Fit Squad', icon: '🏋️', members: 4500, online: 130, category: 'Sports', description: 'Fitness goals, workout plans, nutrition tips.', tags: ['Fitness', 'Nutrition'] },
  { id: 8, name: 'Learn Anything', icon: '📚', members: 9800, online: 560, category: 'Education', description: 'Courses, tutorials, and study groups.', tags: ['Courses', 'Mentoring'] },
];

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('nexus_user') || localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export default function Discovery() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('active');
  const [showSort, setShowSort] = useState(false);
  const [joinedIds, setJoinedIds] = useState(new Set([1]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCommunities() {
      const user = getCurrentUser();
      const role = user.role || 'user';
      try {
        const [commsRes, memsRes] = await Promise.all([
          fetch(`${API_BASE}/communities`, { headers: { 'x-role': role } }),
          user.id ? fetch(`${API_BASE}/memberships?userId=${user.id}`, { headers: { 'x-role': role } }) : Promise.resolve(null),
        ]);
        if (commsRes.ok) {
          const data = await commsRes.json();
          if (Array.isArray(data) && data.length > 0) setCommunities(data);
        }
        if (memsRes && memsRes.ok) {
          const mems = await memsRes.json();
          if (Array.isArray(mems)) {
            setJoinedIds(new Set(mems.map(m => m.communityId)));
          }
        }
      } catch { /* Use defaults */ }
      finally { setLoading(false); }
    }
    fetchCommunities();
  }, []);

  const filtered = communities.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'members') return (b.members || 0) - (a.members || 0);
    if (sortBy === 'trending') return (b.online || 0) - (a.online || 0);
    if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
    return (b.online || 0) - (a.online || 0); // most active default
  });

  const toggleJoin = async (id, e) => {
    e.stopPropagation();
    const user = getCurrentUser();
    const role = user.role || 'user';
    const isJoined = joinedIds.has(id);

    // Optimistic UI update
    setJoinedIds(prev => {
      const next = new Set(prev);
      if (isJoined) next.delete(id); else next.add(id);
      return next;
    });

    try {
      if (isJoined) {
        const memsRes = await fetch(`${API_BASE}/memberships?userId=${user.id || 4}`, { headers: { 'x-role': role } });
        if (memsRes.ok) {
          const mems = await memsRes.json();
          const target = mems.find(m => m.communityId === id);
          if (target) {
            await fetch(`${API_BASE}/memberships/${target.id}`, {
              method: 'DELETE',
              headers: { 'x-role': role }
            });
          }
        }
      } else {
        await fetch(`${API_BASE}/memberships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-role': role
          },
          body: JSON.stringify({
            userId: user.id || 4,
            communityId: id
          })
        });
      }
    } catch (err) {
      console.error('Membership toggle error:', err);
    }
  };

  const sortLabels = { active: 'Most Active', members: 'Most Members', trending: 'Trending', newest: 'Recently Created' };

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="header-title">Discover Communities</div>
          <div className="header-actions">
            <div className="icon-btn">🔔<div className="notif-dot"></div></div>
            <div
              className="header-avatar user-avatar"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile-settings')}
            />
          </div>
        </header>

        <div className="content">
          {/* Hero Search */}
          <div className="hero">
            <div className="hero-title">
              Find your next <span>community</span>
            </div>
            <div className="hero-sub">Browse 50,000+ communities across every interest, topic, and niche.</div>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                id="searchInput"
                type="text"
                placeholder="Search by name, topic, or keyword…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="search-kbd">⌘K</span>
              <button className="search-btn" onClick={() => {}}>Search</button>
            </div>
            <div className="hero-stats">
              <div className="h-stat">🏘️ <strong>50,214</strong>&nbsp;communities</div>
              <div className="h-stat">👥 <strong>1.2M</strong>&nbsp;members</div>
              <div className="h-stat">🟢 <strong>84,320</strong>&nbsp;online now</div>
              <div className="h-stat">📅 <strong>1,400+</strong>&nbsp;events this week</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar" id="filterBar">
            {CATEGORIES.map(cat => (
              <div
                key={cat}
                className={`chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'All' && <span className="chip-icon">✦</span>} {cat}
              </div>
            ))}
            <div className="sort-container" style={{ marginLeft: 'auto' }}>
              <div
                className="sort-btn"
                id="sortBtn"
                onClick={() => setShowSort(s => !s)}
              >
                ⇅ Sort: {sortLabels[sortBy]}
              </div>
              {showSort && (
                <div className="sort-dropdown" id="sortDropdown" style={{ display: 'block' }}>
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className="sort-option"
                      onClick={() => { setSortBy(key); setShowSort(false); }}
                    >
                      {key === 'active' ? '🔥' : key === 'members' ? '👥' : key === 'trending' ? '📈' : '✨'} {label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="body-area">
            <div className="grid-header">
              <div>
                <span className="grid-title">All Communities</span>
                <span className="grid-count" id="gridCount">
                  {loading ? 'Loading communities...' : `${filtered.length} communities`}
                </span>
              </div>
            </div>
            <div className="comm-grid" id="commGrid">
              {loading ? (
                <div style={{ color: 'var(--text-3,#666)', fontSize: '13px', gridColumn: '1/-1', padding: '40px 0', textAlign: 'center' }}>
                  Loading communities…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ color: 'var(--text-3,#666)', fontSize: '13px', gridColumn: '1/-1', padding: '40px 0', textAlign: 'center' }}>
                  No communities match your search.
                </div>
              ) : (
                filtered.map(comm => (
                  <div
                    key={comm.id}
                    className="comm-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/community/${comm.id}`)}
                  >
                    <div className="cc-banner" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                      <div className="cc-icon">{comm.icon || '🏘️'}</div>
                    </div>
                    <div className="cc-body">
                      <div className="cc-name">{comm.name}</div>
                      <div className="cc-meta">
                        <span className="cc-members">👥 {(comm.members || 0).toLocaleString()} members</span>
                        {comm.online > 0 && <span className="cc-online">🟢 {comm.online} online</span>}
                      </div>
                      <div className="cc-desc">{comm.description}</div>
                      {comm.tags && (
                        <div className="cc-tags">
                          {comm.tags.slice(0, 3).map(t => (
                            <span key={t} className="cc-tag">{t}</span>
                          ))}
                        </div>
                      )}
                      <button
                        className={`cc-join-btn${joinedIds.has(comm.id) ? ' joined' : ''}`}
                        onClick={e => toggleJoin(comm.id, e)}
                        style={{
                          marginTop: '12px', width: '100%', padding: '8px',
                          borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: joinedIds.has(comm.id) ? 'rgba(99,102,241,0.15)' : '#6366f1',
                          color: joinedIds.has(comm.id) ? '#818cf8' : '#fff',
                          fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
                        }}
                      >
                        {joinedIds.has(comm.id) ? '✓ Joined' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
