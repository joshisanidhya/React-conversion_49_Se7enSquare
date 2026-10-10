import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import '../styles/create-community.css';

const API_BASE = 'http://localhost:3000/api';

const CATEGORIES = ['FPS', 'MOBA', 'RPG', 'Strategy', 'Sports', 'Indie', 'Speedrunning', 'Other'];
const ICONS = ['⚡', '🚀', '🔥', '🌟', '💡', '🎯', '🏆', '🌐', '⚙'];
const BANNERS = [
  'linear-gradient(135deg, #1e1b4b, #4338ca)',
  'linear-gradient(135deg, #064e3b, #059669)',
  'linear-gradient(135deg, #701a75, #c026d3)',
  'linear-gradient(135deg, #7c2d12, #ea580c)',
  'linear-gradient(135deg, #0f172a, #334155)',
  'linear-gradient(135deg, #134e4a, #0d9488)',
  'linear-gradient(135deg, #831843, #db2777)',
];

function getCurrentUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { id: raw.id || 1, username: raw.username || 'gamer' };
  } catch {
    return { id: 1, username: 'gamer' };
  }
}

export default function CreateCommunity() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState('community'); // 'community' | 'channel'
  const [currentStep, setCurrentStep] = useState(1);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State - Community
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('FPS');
  const [icon, setIcon] = useState('⚡');
  const [banner, setBanner] = useState(BANNERS[0]);
  const [website, setWebsite] = useState('');
  const [tags, setTags] = useState('');
  const [channels, setChannels] = useState([
    { id: 1, name: 'announcements', type: 'Read-only', icon: '📢', desc: 'Official updates' },
    { id: 2, name: 'general', type: 'Text', icon: '💬', desc: 'General discussion' },
    { id: 3, name: 'help', type: 'Text', icon: '🔧', desc: 'Ask questions' },
    { id: 4, name: 'voice-lounge', type: 'Voice', icon: '🎙', desc: 'Casual voice chats' },
  ]);
  const [privacy, setPrivacy] = useState('public');
  const [permissions, setPermissions] = useState({
    invites: true,
    approval: false,
    autoMod: true,
    memberEvents: true,
  });
  const [rules, setRules] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');

  // Add channel sub-form in Step 3
  const [showAddCh, setShowAddCh] = useState(false);
  const [newChName, setNewChName] = useState('');
  const [newChDesc, setNewChDesc] = useState('');
  const [newChType, setNewChType] = useState('Text');

  // Form State - Standalone Channel Flow
  const [allCommunities, setAllCommunities] = useState([]);
  const [channelCommId, setChannelCommId] = useState('');
  const [standaloneChName, setStandaloneChName] = useState('');
  const [standaloneChTopic, setStandaloneChTopic] = useState('');
  const [standaloneChType, setStandaloneChType] = useState('Text');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetch(`${API_BASE}/communities`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setAllCommunities(data);
          setChannelCommId(String(data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const handleNameChange = (val) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const handleAddChannel = () => {
    if (!newChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    const clean = newChName.trim().toLowerCase().replace(/\s+/g, '-');
    const chIcon = newChType === 'Voice' ? '🎙' : newChType === 'Announcement' ? '📢' : '💬';
    setChannels([
      ...channels,
      { id: Date.now(), name: clean, type: newChType, icon: chIcon, desc: newChDesc || 'Community channel' },
    ]);
    setNewChName('');
    setNewChDesc('');
    setShowAddCh(false);
  };

  const handleDeleteChannel = (id) => {
    setChannels(channels.filter((c) => c.id !== id));
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!name.trim() || name.length < 3) {
        showToast('⚠️ Community name must be at least 3 characters');
        return false;
      }
      if (!desc.trim() || desc.length < 10) {
        showToast('⚠️ Description must be at least 10 characters');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      submitCreateCommunity();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitCreateCommunity = async () => {
    showToast('🚀 Creating community…');
    const channelNames = channels.map((c) => c.name);

    const payload = {
      name,
      description: desc,
      ownerId: currentUser.id,
      category,
      icon,
      banner,
      slug: slug || 'community',
      channels: channelNames.length ? channelNames : ['general'],
      tags: tags ? tags.split(',').map((t) => t.trim()) : [category.toLowerCase()],
      visibility: privacy,
      memberCount: 1,
      onlineCount: 1,
    };

    try {
      const res = await fetch(`${API_BASE}/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': currentUser.role || 'user',
        },
        body: JSON.stringify(payload),
      });

      let created = null;
      if (res.ok) {
        created = await res.json();
      } else {
        created = { ...payload, id: Date.now() };
      }

      // Add to local joined communities
      const id = String(created.id);
      let joined = JSON.parse(localStorage.getItem('nexus_joined_communities') || '[]');
      if (!joined.includes(id)) joined.push(id);
      localStorage.setItem('nexus_joined_communities', JSON.stringify(joined));

      let owned = JSON.parse(localStorage.getItem('nexus_owned_community_ids') || '[]');
      if (!owned.includes(id)) owned.push(id);
      localStorage.setItem('nexus_owned_community_ids', JSON.stringify(owned));

      showToast('🎉 Community created! Redirecting…');
      setTimeout(() => {
        navigate(`/community-page?id=${created.id}`);
      }, 1000);
    } catch {
      showToast('🎉 Community created! Redirecting…');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  const submitCreateChannel = async () => {
    if (!standaloneChName.trim()) {
      showToast('⚠️ Channel name is required');
      return;
    }
    showToast('💬 Creating channel…');
    try {
      await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: Number(channelCommId),
          name: standaloneChName.trim().toLowerCase().replace(/\s+/g, '-'),
          type: standaloneChType,
          topic: standaloneChTopic,
        }),
      });
      showToast('✅ Channel created!');
      setTimeout(() => {
        navigate(`/community-page?id=${channelCommId}`);
      }, 1000);
    } catch {
      showToast('✅ Channel created!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="main">
      {/* Header */}
      <div className="header">
        <div className="header-title">Create New</div>
        <div className="breadcrumb">
          <span
            className="bc-link"
            onClick={() => navigate('/dashboard')}
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Home
          </span>
          <span className="bc-sep">›</span>
          <span className="bc-cur">
            {activeTab === 'community' ? 'Create Community' : 'Create Channel'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {activeTab === 'community' && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      )}

      <div className="body">
        {/* Steps Panel / Preview */}
        <div className="steps-panel">
          {activeTab === 'community' && (
            <>
              <div className="steps-title">Progress</div>
              {[
                { step: 1, title: 'Basic Info', sub: 'Name, category, description' },
                { step: 2, title: 'Appearance', sub: 'Banner, avatar, colors' },
                { step: 3, title: 'Channels', sub: 'Set up your channels' },
                { step: 4, title: 'Settings & Rules', sub: 'Privacy, roles, guidelines' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`step ${currentStep === s.step ? 'on' : ''}`}
                  onClick={() => {
                    if (s.step < currentStep || validateStep(currentStep)) {
                      setCurrentStep(s.step);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="step-num">{s.step}</div>
                  <div className="step-info">
                    <div className="step-lbl">{s.title}</div>
                    <div className="step-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Live Preview */}
          <div className="preview-card" style={{ marginTop: '24px' }}>
            <div className="pc-label">Live Preview</div>
            <div className="pc-banner" style={{ background: banner }}></div>
            <div className="pc-av">{icon}</div>
            <div className="pc-info">
              <div className="pc-name">{name || 'Your Community'}</div>
              <div className="pc-meta">{category} · 1 member</div>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="form-area">
          {/* Subpage Tabs */}
          <div className="subpage-tabs">
            <div
              className={`spt ${activeTab === 'community' ? 'on' : ''}`}
              onClick={() => {
                setActiveTab('community');
                setCurrentStep(1);
              }}
            >
              🏘 Community
            </div>
            <div
              className={`spt ${activeTab === 'channel' ? 'on' : ''}`}
              onClick={() => setActiveTab('channel')}
            >
              💬 Channel
            </div>
          </div>

          {/* Community Flow */}
          {activeTab === 'community' && (
            <div className="fview on">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div>
                  <div className="section-title">Basic Information</div>
                  <div className="section-sub">Tell people what your community is about.</div>

                  <div className="fg">
                    <div className="f-label">
                      Community Name <span className="f-req">*</span>
                    </div>
                    <input
                      className="f-in"
                      value={name}
                      maxLength={60}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Pro Gamers, Indie Games…"
                    />
                    <div className="char-count">
                      <span>{name.length}</span>/60
                    </div>
                  </div>

                  <div className="fg">
                    <div className="f-label">
                      Description <span className="f-req">*</span>
                    </div>
                    <textarea
                      className="f-ta"
                      value={desc}
                      maxLength={300}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="What will people talk about here? What makes this community unique?"
                    ></textarea>
                    <div className="char-count">
                      <span>{desc.length}</span>/300
                    </div>
                  </div>

                  <div className="fg-row">
                    <div>
                      <div className="f-label">Community URL</div>
                      <input
                        className="f-in"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="pro-gamers"
                      />
                      <div className="f-desc">
                        gameunity.io/c/<span>{slug || 'your-community'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="fg">
                    <div className="f-label">
                      Category <span className="f-req">*</span>
                    </div>
                    <div className="cat-grid">
                      {CATEGORIES.map((cat) => (
                        <div
                          key={cat}
                          className={`cat-item ${category === cat ? 'on' : ''}`}
                          onClick={() => setCategory(cat)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="cat-lbl">{cat}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Appearance */}
              {currentStep === 2 && (
                <div>
                  <div className="section-title">Appearance</div>
                  <div className="section-sub">Make your community visually recognisable.</div>

                  <div className="fg">
                    <div className="f-label">Community Icon</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div
                        style={{
                          fontSize: '36px',
                          width: '64px',
                          height: '64px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '16px',
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ICONS.map((ico) => (
                          <div
                            key={ico}
                            className={`cat-item ${icon === ico ? 'on' : ''}`}
                            onClick={() => setIcon(ico)}
                            style={{ cursor: 'pointer', padding: '10px 14px', fontSize: '20px' }}
                          >
                            {ico}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="fg">
                    <div className="f-label">Banner Style</div>
                    <div className="banner-picker" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {BANNERS.map((b, i) => (
                        <div
                          key={i}
                          className={`bp-item ${banner === b ? 'on' : ''}`}
                          onClick={() => setBanner(b)}
                          style={{
                            background: b,
                            width: '80px',
                            height: '40px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: banner === b ? '2px solid #fff' : '2px solid transparent',
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="fg-row">
                    <div>
                      <div className="f-label">Community Tags</div>
                      <input
                        className="f-in"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g. FPS, streaming, competitive"
                      />
                    </div>
                    <div>
                      <div className="f-label">Website (optional)</div>
                      <input
                        className="f-in"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Channels */}
              {currentStep === 3 && (
                <div>
                  <div className="section-title">Channels</div>
                  <div className="section-sub">Set up the channels your members will use to communicate.</div>

                  <div className="ch-list">
                    {channels.map((ch) => (
                      <div key={ch.id} className="ch-item">
                        <div className="ch-ico">{ch.icon || '💬'}</div>
                        <div className="ch-info">
                          <div className="ch-name">#{ch.name}</div>
                          <div className="ch-desc">{ch.desc}</div>
                        </div>
                        <span className="ch-type">{ch.type}</span>
                        <span
                          className="ch-del"
                          onClick={() => handleDeleteChannel(ch.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>

                  {showAddCh ? (
                    <div className="ch-form" style={{ marginTop: '16px' }}>
                      <div className="f-label">New Channel</div>
                      <div className="ch-type-picker" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        {['Text', 'Voice', 'Announcement', 'Forum'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`ctp ${newChType === t ? 'on' : ''}`}
                            onClick={() => setNewChType(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="ch-form-row">
                        <div>
                          <div className="f-label">Channel Name *</div>
                          <input
                            className="f-in"
                            value={newChName}
                            onChange={(e) => setNewChName(e.target.value)}
                            placeholder="e.g. clips-and-highlights"
                          />
                        </div>
                        <div>
                          <div className="f-label">Description</div>
                          <input
                            className="f-in"
                            value={newChDesc}
                            onChange={(e) => setNewChDesc(e.target.value)}
                            placeholder="What is this channel for?"
                          />
                        </div>
                      </div>
                      <div className="ch-form-acts" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button className="btn-sm btn-sm-g" onClick={() => setShowAddCh(false)}>
                          Cancel
                        </button>
                        <button className="btn-sm btn-sm-p" onClick={handleAddChannel}>
                          Add Channel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="add-ch-btn"
                      onClick={() => setShowAddCh(true)}
                      style={{ cursor: 'pointer', marginTop: '12px' }}
                    >
                      <span>+</span> Add another channel
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Settings & Rules */}
              {currentStep === 4 && (
                <div>
                  <div className="section-title">Settings &amp; Rules</div>
                  <div className="section-sub">Configure privacy, roles, and community guidelines.</div>

                  <div className="fg">
                    <div className="f-label">Privacy</div>
                    <div className="role-grid">
                      <div
                        className={`role-card ${privacy === 'public' ? 'on' : ''}`}
                        onClick={() => setPrivacy('public')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="rc-top">
                          <span className="rc-ico">🌍</span>
                          {privacy === 'public' && <span className="rc-badge">Selected</span>}
                        </div>
                        <div className="rc-name">Public</div>
                        <div className="rc-desc">Anyone can find and join. Content is visible to all.</div>
                      </div>
                      <div
                        className={`role-card ${privacy === 'private' ? 'on' : ''}`}
                        onClick={() => setPrivacy('private')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="rc-top">
                          <span className="rc-ico">🔒</span>
                          {privacy === 'private' && <span className="rc-badge">Selected</span>}
                        </div>
                        <div className="rc-name">Private</div>
                        <div className="rc-desc">Invite-only. Content hidden from non-members.</div>
                      </div>
                    </div>
                  </div>

                  <div className="fg">
                    <div className="f-label">Member Permissions</div>
                    <div>
                      <div className="toggle-row">
                        <div className="tr-l">
                          <div className="tr-lbl">Allow invites from members</div>
                          <div className="tr-desc">Any member can invite others to join</div>
                        </div>
                        <div
                          className={`toggle ${permissions.invites ? 'on' : ''}`}
                          onClick={() => setPermissions({ ...permissions, invites: !permissions.invites })}
                        ></div>
                      </div>
                      <div className="toggle-row">
                        <div className="tr-l">
                          <div className="tr-lbl">Require approval to join</div>
                          <div className="tr-desc">New members need admin approval</div>
                        </div>
                        <div
                          className={`toggle ${permissions.approval ? 'on' : ''}`}
                          onClick={() => setPermissions({ ...permissions, approval: !permissions.approval })}
                        ></div>
                      </div>
                      <div className="toggle-row">
                        <div className="tr-l">
                          <div className="tr-lbl">Enable AutoMod</div>
                          <div className="tr-desc">AI moderates harmful content automatically</div>
                        </div>
                        <div
                          className={`toggle ${permissions.autoMod ? 'on' : ''}`}
                          onClick={() => setPermissions({ ...permissions, autoMod: !permissions.autoMod })}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="fg">
                    <div className="f-label">Community Rules</div>
                    <textarea
                      className="f-ta"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Stay on topic&#10;4. No hate speech or harassment"
                      rows={5}
                    ></textarea>
                  </div>

                  <div className="fg">
                    <div className="f-label">Welcome Message</div>
                    <textarea
                      className="f-ta"
                      value={welcomeMsg}
                      onChange={(e) => setWelcomeMsg(e.target.value)}
                      placeholder="Welcome to the community! Introduce yourself in #general and let us know what you're working on…"
                      rows={3}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standalone Channel Flow */}
          {activeTab === 'channel' && (
            <div className="fview on">
              <div className="section-title">Create a Channel</div>
              <div className="section-sub">Add a new channel to an existing community.</div>

              <div className="fg">
                <label className="f-label">Community</label>
                <select
                  className="f-sel"
                  value={channelCommId}
                  onChange={(e) => setChannelCommId(e.target.value)}
                >
                  {allCommunities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fg">
                <div className="f-label">Channel Type</div>
                <div className="ch-type-picker" style={{ display: 'flex', gap: '8px' }}>
                  {['Text', 'Voice', 'Announcement', 'Forum', 'Events'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`ctp ${standaloneChType === t ? 'on' : ''}`}
                      onClick={() => setStandaloneChType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fg-row">
                <div>
                  <div className="f-label">
                    Channel Name <span className="f-req">*</span>
                  </div>
                  <input
                    className="f-in"
                    value={standaloneChName}
                    onChange={(e) => setStandaloneChName(e.target.value)}
                    placeholder="e.g. resources"
                  />
                </div>
                <div>
                  <div className="f-label">Topic</div>
                  <input
                    className="f-in"
                    value={standaloneChTopic}
                    onChange={(e) => setStandaloneChTopic(e.target.value)}
                    placeholder="What's this channel about?"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        {activeTab === 'community' ? (
          <>
            <div className="bb-step">Step {currentStep} of 4</div>
            <div className="bb-acts">
              {currentStep > 1 && (
                <button className="btn-ghost" onClick={prevStep}>
                  ← Back
                </button>
              )}
              <button className="btn-primary" onClick={nextStep}>
                {currentStep === 4 ? 'Create Community' : 'Continue →'}
              </button>
            </div>
          </>
        ) : (
          <div className="bb-acts" style={{ marginLeft: 'auto' }}>
            <button className="btn-primary" onClick={submitCreateChannel}>
              Create Channel
            </button>
          </div>
        )}
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
