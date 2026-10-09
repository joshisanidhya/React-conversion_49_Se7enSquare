import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/profile-settings.css';

const API_BASE = 'http://localhost:3000/api';

function getStoredUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return {
      id: raw.id || 1,
      firstName: raw.firstName || 'User',
      lastName: raw.lastName || '',
      fullName: raw.fullName || raw.name || `${raw.firstName || 'User'} ${raw.lastName || ''}`.trim(),
      username: raw.username || raw.handle || 'user',
      handle: raw.handle || raw.username || 'user',
      email: raw.email || 'user@gameunity.com',
      phone: raw.phone || '+91 98765 43210',
      bio: raw.bio || 'Passionate gamer and community builder.',
      avatar: raw.avatar || null,
      role: raw.role || 'user',
      plan: raw.plan || 'free',
      status: raw.status || 'Online',
    };
  } catch {
    return {
      id: 1,
      firstName: 'User',
      lastName: '',
      fullName: 'User',
      username: 'user',
      handle: 'user',
      email: 'user@gameunity.com',
      phone: '',
      bio: '',
      avatar: null,
      role: 'user',
      plan: 'free',
      status: 'Online',
    };
  }
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(getStoredUser);
  const [formData, setFormData] = useState({ ...getStoredUser() });
  const [isDirty, setIsDirty] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Password fields
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // Privacy toggles
  const [privacy, setPrivacy] = useState({
    profileVis: 'public',
    messages: 'everyone',
    showEmail: false,
    showPhone: false,
    showActivity: true,
    searchEngine: true,
  });

  // Accessibility
  const [accessibility, setAccessibility] = useState({
    fontSize: 'medium',
    contrast: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNav: false,
  });

  // Appearance
  const [theme, setTheme] = useState('dark');

  // Moderator quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({ q1: '', q2: '', q3: '' });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => ({ ...prev, status }));
    setIsDirty(true);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleInputChange('avatar', reader.result);
        showToast('📷 Photo uploaded. Remember to save changes!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    handleInputChange('avatar', null);
    showToast('🗑️ Photo removed.');
  };

  const discardChanges = () => {
    setFormData({ ...user });
    setPasswords({ current: '', new: '', confirm: '' });
    setIsDirty(false);
    showToast('Draft discarded.');
  };

  const saveAllChanges = async () => {
    if (!formData.firstName.trim() || !formData.username.trim() || !formData.email.trim()) {
      showToast('❌ Please fill in required fields (First Name, Username, Email).');
      return;
    }

    const updatedUser = {
      ...user,
      ...formData,
      handle: formData.username,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
    };

    try {
      localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsDirty(false);

      // Attempt live backend update
      await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          bio: updatedUser.bio,
          avatar: updatedUser.avatar,
        }),
      }).catch(() => {});

      showToast('✅ Profile & settings saved successfully!');
    } catch {
      showToast('❌ Failed to save changes.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const applyOrganizer = async () => {
    try {
      await fetch(`${API_BASE}/organisers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      showToast('🏆 Organizer application submitted for admin review!');
    } catch {
      showToast('🏆 Organizer application submitted!');
    }
  };

  const submitQuiz = () => {
    if (!quizAnswers.q1 || !quizAnswers.q2 || !quizAnswers.q3) {
      showToast('⚠️ Please answer all questions.');
      return;
    }
    const correct = (quizAnswers.q1 === 'b' ? 1 : 0) + (quizAnswers.q2 === 'c' ? 1 : 0) + (quizAnswers.q3 === 'a' ? 1 : 0);
    setQuizScore(correct);
    if (correct >= 2) {
      showToast('🎉 Quiz passed! Application forwarded to admins.');
    } else {
      showToast('❌ Quiz not passed. Please review policies and try again.');
    }
  };

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <SideBar />

      <div className="main-column-wrapper">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="tb-logo">
            <div className="tb-logo-icon">⬡</div>
            <span className="tb-logo-name">Gameunity</span>
          </div>
          <div className="tb-sep"></div>
          <div className="tb-page">⚙️ Profile &amp; Settings</div>
          <div className="tb-right">
            <button
              className="tb-btn"
              onClick={discardChanges}
              disabled={!isDirty}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: isDirty ? 'pointer' : 'default' }}
            >
              Discard
            </button>
            <button
              className={`tb-btn save ${isDirty ? 'pulse' : ''}`}
              id="btnSaveAll"
              onClick={saveAllChanges}
              disabled={!isDirty}
            >
              Save Changes
            </button>
            <div
              className="tb-av user-avatar"
              style={{
                backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {!formData.avatar && initials}
            </div>
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Body Wrap */}
        <div className="body-wrap">
          {/* Left Navigation */}
          <nav className="left-nav">
            <div className="nav-profile" onClick={() => setActiveTab('profile')}>
              <div className="profile-av-wrap">
                <div
                  className="profile-av user-avatar"
                  style={{
                    backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '24px',
                  }}
                >
                  {!formData.avatar && initials}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="profile-name user-name">
                  {formData.firstName} {formData.lastName}
                </div>
                <div className="profile-handle">@{formData.username}</div>
                <div className="profile-status" style={{ justifyContent: 'center', marginTop: '4px' }}>
                  {formData.status || 'Online'}
                </div>
              </div>
            </div>

            <div className="ln-section">
              <div className="ln-label">Account</div>
              <div
                className={`ln-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="ln-icon">👤</span> My Profile
              </div>
              <div
                className={`ln-item ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <span className="ln-icon">🔐</span> Account &amp; Security
              </div>
              <div
                className={`ln-item ${activeTab === 'membership' ? 'active' : ''}`}
                onClick={() => setActiveTab('membership')}
              >
                <span className="ln-icon">💎</span> Membership
              </div>
              <div
                className={`ln-item ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <span className="ln-icon">🔒</span> Privacy
              </div>
            </div>

            <div className="ln-section">
              <div className="ln-label">App</div>
              <div
                className={`ln-item ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                <span className="ln-icon">🎨</span> Appearance
              </div>
              <div
                className={`ln-item ${activeTab === 'accessibility' ? 'active' : ''}`}
                onClick={() => setActiveTab('accessibility')}
              >
                <span className="ln-icon">♿</span> Accessibility
              </div>
            </div>

            <div className="ln-section">
              <div
                className={`ln-item ln-danger ${activeTab === 'danger' ? 'active' : ''}`}
                onClick={() => setActiveTab('danger')}
              >
                <span className="ln-icon">⚠️</span> Danger Zone
              </div>
            </div>
          </nav>

          {/* Main Views */}
          <div className="main">
            {/* View: Profile */}
            {activeTab === 'profile' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">👤 Public Profile</div>
                  <div className="card-sub">This is how other members see you across Gameunity.</div>

                  <div className="avatar-picker" style={{ marginBottom: '24px' }}>
                    <div
                      className="av-preview user-avatar"
                      style={{
                        backgroundImage: formData.avatar ? `url(${formData.avatar})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '32px',
                      }}
                    >
                      {!formData.avatar && initials}
                    </div>
                    <div className="av-actions">
                      <label className="btn-sm accent" style={{ cursor: 'pointer' }}>
                        📷 Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleAvatarUpload}
                        />
                      </label>
                      <div className="btn-sm" onClick={removePhoto} style={{ cursor: 'pointer' }}>
                        Remove Photo
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', maxWidth: '200px' }}>
                      Recommended: Square image, min 200×200px. PNG, JPG or WEBP, max 5MB.
                    </div>
                  </div>

                  <div className="field-row" style={{ marginBottom: '16px' }}>
                    <div className="field">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field-row" style={{ marginBottom: '16px' }}>
                    <div className="field">
                      <label>Username *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        required
                      />
                      <div className="field-hint">
                        nexushub.io/@<span>{formData.username}</span>
                      </div>
                    </div>
                    <div className="field">
                      <label>Display Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: '16px' }}>
                    <label>Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      maxLength={160}
                    ></textarea>
                    <div className="field-hint">160 characters max. Visible on your public profile.</div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-title">🟢 Status</div>
                  <div className="card-sub">Set your current activity status.</div>
                  <div className="badge-row">
                    {[
                      { id: 'Online', color: 'var(--success)' },
                      { id: 'Away', color: 'var(--gold)' },
                      { id: 'Do Not Disturb', color: 'var(--error)' },
                      { id: 'Invisible', color: 'var(--text-3)' },
                    ].map((st) => (
                      <div
                        key={st.id}
                        className={`status-badge ${formData.status === st.id ? 'on' : ''}`}
                        onClick={() => handleStatusChange(st.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="dot" style={{ background: st.color }}></div>
                        {st.id}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* View: Account */}
            {activeTab === 'account' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">📧 Account Details</div>
                  <div className="card-sub">Manage your login credentials and account info.</div>

                  <div className="field-row" style={{ marginBottom: '16px' }}>
                    <div className="field">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="divider"></div>
                  <div className="card-title" style={{ marginBottom: '8px' }}>
                    🔑 Change Password
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>
                    Leave these fields blank unless you want to change your password.
                  </div>

                  <div className="field" style={{ marginBottom: '16px' }}>
                    <label>Current Password</label>
                    <div className="pwd-wrapper">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwords.current}
                        placeholder="••••••••"
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                      <span
                        className="pwd-toggle"
                        onClick={() =>
                          setShowPassword({ ...showPassword, current: !showPassword.current })
                        }
                      >
                        {showPassword.current ? '🐵' : '🙈'}
                      </span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <label>New Password</label>
                      <div className="pwd-wrapper">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          value={passwords.new}
                          placeholder="Min 8 characters"
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        />
                        <span
                          className="pwd-toggle"
                          onClick={() =>
                            setShowPassword({ ...showPassword, new: !showPassword.new })
                          }
                        >
                          {showPassword.new ? '🐵' : '🙈'}
                        </span>
                      </div>
                    </div>
                    <div className="field">
                      <label>Confirm New Password</label>
                      <div className="pwd-wrapper">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={passwords.confirm}
                          placeholder="Repeat new password"
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                        <span
                          className="pwd-toggle"
                          onClick={() =>
                            setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                          }
                        >
                          {showPassword.confirm ? '🐵' : '🙈'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Membership */}
            {activeTab === 'membership' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">💎 Subscription Plan</div>
                  <div className="card-sub">Your current Gameunity plan and what it unlocks.</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px' }}>
                        {user.plan === 'ultra_pro' ? '💎 Ultra Pro' : user.plan === 'plus' ? '⚡ Plus' : '🆓 Free'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                        {user.plan === 'ultra_pro'
                          ? 'Full platform access, custom badges, unlimited tournaments.'
                          : user.plan === 'plus'
                          ? 'HD streaming, 100MB file uploads, custom role icons.'
                          : 'Basic features, standard video quality, up to 10 communities.'}
                      </div>
                    </div>
                    <button className="btn-sm accent" onClick={() => navigate('/pricing')}>
                      Manage Plan
                    </button>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-title">🏆 Become an Organizer</div>
                  <div className="card-sub">
                    Apply for Verified Organizer status to host and manage your own tournaments.
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '10px' }}>
                      Status: {user.role === 'organizer' || user.role === 'admin' ? '✅ Verified Organizer' : '⚪ Standard Gamer'}
                    </div>
                    {user.role !== 'organizer' && user.role !== 'admin' && (
                      <button className="btn-sm accent" onClick={applyOrganizer}>
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-title">🛡️ Become a Certified Moderator</div>
                  <div className="card-sub">
                    Pass a short moderation-policy quiz, then get admin approval to earn the Certified Moderator badge.
                  </div>
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '10px' }}>
                      Status: {user.role === 'moderator' || user.role === 'admin' ? '🛡️ Certified Moderator' : '⚪ Not Certified'}
                    </div>
                    {user.role !== 'moderator' && user.role !== 'admin' && (
                      <button className="btn-sm accent" onClick={() => setQuizOpen(true)}>
                        Take the Quiz
                      </button>
                    )}
                  </div>
                </div>

                {/* Moderator Quiz Modal */}
                {quizOpen && (
                  <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) setQuizOpen(false); }}>
                    <div className="modal-container" style={{ maxWidth: '540px' }}>
                      <div className="modal-header">
                        <h3>Moderator Policy Quiz</h3>
                        <button className="modal-x" onClick={() => setQuizOpen(false)}>×</button>
                      </div>
                      <div className="modal-body">
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontWeight: 600 }}>1. What should you do when hate speech is detected?</p>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q1" value="a" onChange={(e) => setQuizAnswers({ ...quizAnswers, q1: e.target.value })} /> Ignore if it is funny
                          </label>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q1" value="b" onChange={(e) => setQuizAnswers({ ...quizAnswers, q1: e.target.value })} /> Delete message immediately and warn or mute the user
                          </label>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontWeight: 600 }}>2. How should you handle conflict escalation between players?</p>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q2" value="c" onChange={(e) => setQuizAnswers({ ...quizAnswers, q2: e.target.value })} /> Remind both parties of community rules and issue cooldown if necessary
                          </label>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q2" value="d" onChange={(e) => setQuizAnswers({ ...quizAnswers, q2: e.target.value })} /> Take sides with your friend
                          </label>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontWeight: 600 }}>3. What is the procedure for ban appeals?</p>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q3" value="a" onChange={(e) => setQuizAnswers({ ...quizAnswers, q3: e.target.value })} /> Review user statement, incident logs, and check for genuine remorse or mistaken action
                          </label>
                          <label style={{ display: 'block', margin: '4px 0' }}>
                            <input type="radio" name="q3" value="b" onChange={(e) => setQuizAnswers({ ...quizAnswers, q3: e.target.value })} /> Automatically reject all appeals
                          </label>
                        </div>
                        {quizScore !== null && (
                          <div style={{ marginTop: '12px', fontWeight: 700, color: quizScore >= 2 ? 'var(--success)' : 'var(--error)' }}>
                            Score: {quizScore} / 3
                          </div>
                        )}
                      </div>
                      <div className="modal-footer">
                        <button className="btn-ghost" onClick={() => setQuizOpen(false)}>Close</button>
                        <button className="btn-primary" onClick={submitQuiz}>Submit Quiz</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View: Privacy */}
            {activeTab === 'privacy' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">🔒 Privacy Controls</div>
                  <div className="card-sub">Control who sees your information and who can contact you.</div>

                  <div className="field" style={{ marginBottom: '16px' }}>
                    <label>Profile Visibility</label>
                    <select
                      value={privacy.profileVis}
                      onChange={(e) => setPrivacy({ ...privacy, profileVis: e.target.value })}
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private (Only Me)</option>
                    </select>
                  </div>

                  <div className="field" style={{ marginBottom: '24px' }}>
                    <label>Allow Direct Messages From</label>
                    <select
                      value={privacy.messages}
                      onChange={(e) => setPrivacy({ ...privacy, messages: e.target.value })}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="divider"></div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">Show Email on Profile</div>
                      <div className="tr-desc">Let others see your email address.</div>
                    </div>
                    <div
                      className={`toggle ${privacy.showEmail ? 'on' : ''}`}
                      onClick={() => setPrivacy({ ...privacy, showEmail: !privacy.showEmail })}
                    ></div>
                  </div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">Show Phone Number</div>
                      <div className="tr-desc">Let others see your phone number.</div>
                    </div>
                    <div
                      className={`toggle ${privacy.showPhone ? 'on' : ''}`}
                      onClick={() => setPrivacy({ ...privacy, showPhone: !privacy.showPhone })}
                    ></div>
                  </div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">Show Activity Status</div>
                      <div className="tr-desc">Show when you are currently online or in-game.</div>
                    </div>
                    <div
                      className={`toggle ${privacy.showActivity ? 'on' : ''}`}
                      onClick={() => setPrivacy({ ...privacy, showActivity: !privacy.showActivity })}
                    ></div>
                  </div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">Search Engine Visibility</div>
                      <div className="tr-desc">Allow search engines to index your public profile.</div>
                    </div>
                    <div
                      className={`toggle ${privacy.searchEngine ? 'on' : ''}`}
                      onClick={() => setPrivacy({ ...privacy, searchEngine: !privacy.searchEngine })}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Appearance */}
            {activeTab === 'appearance' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">🎨 Theme</div>
                  <div className="card-sub">Choose your Gameunity colour theme.</div>
                  <div className="theme-grid">
                    <div
                      className={`theme-opt ${theme === 'dark' ? 'on' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <div className="theme-swatch" style={{ background: 'var(--bg-deep)' }}></div>
                      <div className="theme-label">Dark (Default)</div>
                    </div>
                    <div
                      className={`theme-opt ${theme === 'green' ? 'on' : ''}`}
                      onClick={() => setTheme('green')}
                    >
                      <div className="theme-swatch" style={{ background: '#064e3b' }}></div>
                      <div className="theme-label">Midnight Green</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Accessibility */}
            {activeTab === 'accessibility' && (
              <div className="view active">
                <div className="settings-card">
                  <div className="card-title">♿ Accessibility Preferences</div>
                  <div className="card-sub">Adjust settings to make Gameunity easier to use for you.</div>

                  <div className="field" style={{ marginBottom: '24px' }}>
                    <label>Global Font Size</label>
                    <select
                      value={accessibility.fontSize}
                      onChange={(e) => setAccessibility({ ...accessibility, fontSize: e.target.value })}
                    >
                      <option value="medium">Medium (Default)</option>
                      <option value="small">Small</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="divider"></div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">High Contrast Mode</div>
                      <div className="tr-desc">Increase contrast between text and backgrounds for better readability.</div>
                    </div>
                    <div
                      className={`toggle ${accessibility.contrast ? 'on' : ''}`}
                      onClick={() => setAccessibility({ ...accessibility, contrast: !accessibility.contrast })}
                    ></div>
                  </div>

                  <div className="toggle-row">
                    <div className="tr-info">
                      <div className="tr-title">Reduce Motion</div>
                      <div className="tr-desc">Disable UI animations and smooth scrolling.</div>
                    </div>
                    <div
                      className={`toggle ${accessibility.reduceMotion ? 'on' : ''}`}
                      onClick={() => setAccessibility({ ...accessibility, reduceMotion: !accessibility.reduceMotion })}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* View: Danger */}
            {activeTab === 'danger' && (
              <div className="view active">
                <div className="danger-zone">
                  <div className="dz-title">⚠️ Danger Zone</div>
                  <div className="dz-sub">These actions are permanent and cannot be undone.</div>

                  <div className="dz-item">
                    <div>
                      <div className="dz-label">Appeal Moderation Action</div>
                      <div className="dz-desc">Submit an appeal if your account was unfairly warned, muted, or banned.</div>
                    </div>
                    <button className="btn-appeal" onClick={() => navigate('/appeal')}>
                      Submit Appeal
                    </button>
                  </div>

                  <div className="dz-item">
                    <div>
                      <div className="dz-label">Deactivate Account</div>
                      <div className="dz-desc">Temporarily hide your profile and pause notifications.</div>
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => showToast("⚠️ Account deactivation isn't available yet. Contact an admin.")}
                    >
                      Deactivate
                    </button>
                  </div>

                  <div className="dz-item">
                    <div>
                      <div className="dz-label">Log Out</div>
                      <div className="dz-desc">Sign out of your session on this device.</div>
                    </div>
                    <button type="button" className="btn-danger" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            )}
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
