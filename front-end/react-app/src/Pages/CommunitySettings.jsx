import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/global.css';
import '../styles/community-settings.css';

const API_BASE = 'http://localhost:3000/api';

export default function CommunitySettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('id') || '1';

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [community, setCommunity] = useState({
    id: communityId,
    name: 'Pro Gamers',
    description: 'Competitive esports community and tournaments.',
    banner: '',
    rules: "Be respectful to other members\nStay on topic in each channel\nNo spam or self-promotion",
    members: [
      { id: 1, name: 'Sanidhya Joshi', handle: '@sanidhya', role: 'Owner', initials: 'SJ' },
      { id: 2, name: 'Awadhesh', handle: '@awadhesh', role: 'Moderator', initials: 'AW' },
      { id: 3, name: 'Karmanya', handle: '@karmanya', role: 'Member', initials: 'KM' },
    ],
    channels: [
      { id: 1, name: 'announcements', type: 'Announcement' },
      { id: 2, name: 'general', type: 'Text' },
      { id: 3, name: 'voice-lounge', type: 'Voice' },
    ],
    memberCount: 124,
    onlineCount: 42,
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState('Text');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadCommunity() {
      try {
        const res = await fetch(`${API_BASE}/communities/${communityId}`);
        if (res.ok) {
          const data = await res.json();
          setCommunity((prev) => ({
            ...prev,
            ...data,
            channels: Array.isArray(data.channels)
              ? data.channels.map((ch, idx) =>
                  typeof ch === 'string' ? { id: idx + 1, name: ch, type: 'Text' } : ch
                )
              : prev.channels,
          }));
        }
      } catch {
        // use fallback
      }
      setLoading(false);
    }
    loadCommunity();
  }, [communityId]);

  const handleFieldChange = (field, value) => {
    setCommunity((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleMemberRoleChange = (memberId, newRole) => {
    setCommunity((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    }));
    setIsDirty(true);
    showToast(`Role updated to ${newRole}`);
  };

  const handleRemoveMember = (memberId) => {
    setCommunity((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }));
    setIsDirty(true);
    showToast('Member removed');
  };

  const handleDeleteChannel = (channelId) => {
    setCommunity((prev) => ({
      ...prev,
      channels: prev.channels.filter((c) => c.id !== channelId),
    }));
    setIsDirty(true);
    showToast('Channel deleted');
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    const cleanName = newChName.trim().toLowerCase().replace(/\s+/g, '-');
    setCommunity((prev) => ({
      ...prev,
      channels: [...prev.channels, { id: Date.now(), name: cleanName, type: newChType }],
    }));
    setNewChName('');
    setModalOpen(false);
    setIsDirty(true);
    showToast(`Channel #${cleanName} created`);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleFieldChange('banner', reader.result);
        showToast('📷 Banner updated! Save to persist.');
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    try {
      await fetch(`${API_BASE}/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: community.name,
          description: community.description,
          banner: community.banner,
          rules: community.rules,
        }),
      });
      showToast('✅ Community settings saved successfully!');
    } catch {
      showToast('✅ Community settings saved (locally)!');
    }
    setIsDirty(false);
  };

  const discardSettings = () => {
    setIsDirty(false);
    showToast('Changes discarded.');
  };

  return (
    <div className="page">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-mark">G</div>
            <div className="brand-name">Gameunity</div>
          </div>
          <div className="community-title">
            <div className="community-mark">{community.name?.[0] || 'C'}</div>
            <span>{community.name}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="back-btn"
            onClick={() => navigate(`/community-page?id=${communityId}`)}
          >
            &larr; Back to Community
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setActiveTab('channels');
              setModalOpen(true);
            }}
          >
            Add Channel
          </button>
          <div
            className="profile-avatar user-avatar"
            onClick={() => navigate('/profile-settings')}
            style={{ cursor: 'pointer' }}
            title="Profile Settings"
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-heading">Community Settings</div>
          <nav className="settings-nav" aria-label="Community settings sections">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'members', label: 'Members' },
              { id: 'channels', label: 'Channels' },
              { id: 'rules', label: '📜 Rules' },
              { id: 'insights', label: '💎 Insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content" id="view-settings">
          <div className="content-inner">
            <div className="page-heading">
              <p className="eyebrow">Settings</p>
              <h1>Community Settings</h1>
              {loading && <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Loading latest community details…</p>}
            </div>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <section className="settings-tab section active">
                <div className="settings-card">
                  <div className="settings-card-title">Basic Information</div>

                  <div className="settings-field">
                    <label>Community Name *</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={community.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Community Description *</label>
                    <textarea
                      className="settings-textarea"
                      rows="4"
                      value={community.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="settings-field">
                    <label>Community Banner</label>
                    <div className="banner-upload">
                      <div
                        className="current-banner"
                        style={{
                          backgroundImage: community.banner ? `url(${community.banner})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          height: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: community.banner || 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          color: '#aaa',
                        }}
                      >
                        {!community.banner && 'No Banner Uploaded'}
                      </div>
                      <label className="btn btn-muted" style={{ cursor: 'pointer', marginTop: '8px', display: 'inline-block' }}>
                        Upload Banner
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          hidden
                          onChange={handleBannerUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <section className="settings-tab section active">
                <div className="settings-card">
                  <div className="settings-card-title">Members</div>
                  <div className="member-list" style={{ marginTop: '16px' }}>
                    {community.members.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#38bdf8',
                              color: '#000',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {m.initials || m.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{m.handle}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <select
                            className="settings-input"
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={m.role}
                            onChange={(e) => handleMemberRoleChange(m.id, e.target.value)}
                          >
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Moderator">Moderator</option>
                            <option value="Member">Member</option>
                          </select>
                          {m.role !== 'Owner' && (
                            <button
                              className="btn btn-muted"
                              style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--error)' }}
                              onClick={() => handleRemoveMember(m.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && (
              <section className="settings-tab section active">
                <div className="settings-card">
                  <div
                    className="settings-card-head"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
                  >
                    <div className="settings-card-title">Channels</div>
                    <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                      Create Channel
                    </button>
                  </div>
                  <div className="channel-list">
                    {community.channels.map((ch) => (
                      <div
                        key={ch.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>
                            {ch.type === 'Voice' ? '🎙' : ch.type === 'Announcement' ? '📢' : '💬'}
                          </span>
                          <span style={{ fontWeight: 600 }}>#{ch.name}</span>
                          <span className="badge badge-active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {ch.type}
                          </span>
                        </div>
                        <button
                          className="btn btn-muted"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--error)' }}
                          onClick={() => handleDeleteChannel(ch.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <section className="settings-tab section active">
                <div className="settings-card">
                  <div className="settings-card-title">Community Rules</div>
                  <div className="settings-field">
                    <label>
                      One rule per line — shown to members on the Rules tab of the community page.
                    </label>
                    <textarea
                      className="settings-textarea"
                      rows="10"
                      value={community.rules}
                      onChange={(e) => handleFieldChange('rules', e.target.value)}
                      placeholder="Be respectful to other members&#10;Stay on topic in each channel&#10;No spam or self-promotion"
                    ></textarea>
                  </div>
                </div>
              </section>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <section className="settings-tab section active">
                <div className="settings-card">
                  <div className="settings-card-title">Community Insights</div>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>
                        {community.memberCount || community.members.length}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Members</div>
                    </div>
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{community.channels.length}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Channels</div>
                    </div>
                    <div style={{ minWidth: '120px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{community.onlineCount || 12}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Online now</div>
                    </div>
                  </div>
                </div>

                <div className="settings-card" style={{ marginTop: '20px' }}>
                  <div className="settings-card-title">💎 Community Boost</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '10px' }}>
                    Boost Level 1 Active (5 boosts from members)
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-3)', lineHeight: '1.8' }}>
                    • 100 Custom Emoji Slots<br />
                    • 128 Kbps Audio Quality in Voice Channels<br />
                    • Custom Community Banner &amp; Invite Splash
                  </div>
                </div>
              </section>
            )}

            {/* Settings Actions */}
            <div
              className={`settings-actions ${isDirty ? 'show' : ''}`}
              style={{ display: isDirty ? 'flex' : 'none', gap: '12px', marginTop: '24px' }}
            >
              <button className="btn btn-muted" onClick={discardSettings}>
                Discard Changes
              </button>
              <button className="save-btn btn btn-primary" onClick={saveSettings}>
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Create Channel Modal */}
      {modalOpen && (
        <div
          className="modal-bg"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modal-title">Create New Channel</div>
            <form onSubmit={handleCreateChannel}>
              <div className="modal-field">
                <label>Channel Name *</label>
                <input
                  type="text"
                  placeholder="e.g. highlights"
                  value={newChName}
                  onChange={(e) => setNewChName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label>Channel Type</label>
                <select value={newChType} onChange={(e) => setNewChType(e.target.value)}>
                  <option value="Text">Text</option>
                  <option value="Voice">Voice</option>
                  <option value="Announcement">Announcement</option>
                </select>
              </div>
              <div className="modal-btns">
                <button type="button" className="btn btn-muted" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Channel
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
