import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/report.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'user', firstName: raw.firstName || 'User', username: raw.username || 'user', id: raw.id || 1 };
  } catch { return { role: 'user', firstName: 'User', username: 'user', id: 1 }; }
}

const REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', icon: '😡', desc: 'Targeted attacks, insults, intimidation, or persistent negative behaviour toward individuals.' },
  { id: 'hate', label: 'Hate Speech or Discrimination', icon: '🚫', desc: 'Content that promotes hatred based on race, religion, gender, sexual orientation, disability, or nationality.' },
  { id: 'spam', label: 'Spam or Unsolicited Promotion', icon: '📢', desc: 'Repetitive messages, advertisement spam, or irrelevant self-promotion.' },
  { id: 'nsfw', label: 'NSFW or Explicit Content', icon: '🔞', desc: 'Sexually explicit material, graphic violence, or content not appropriate for general audiences.' },
  { id: 'misinfo', label: 'Misinformation or False Claims', icon: '❌', desc: 'Deliberately false or misleading technical, medical, or factual information.' },
  { id: 'other', label: 'Other Rule Violation', icon: '⚠️', desc: 'The content violates community guidelines in a way not listed above.' },
];

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getUser();

  const ctxUser = searchParams.get('user');
  const ctxUserName = searchParams.get('uname') ? decodeURIComponent(searchParams.get('uname')) : null;
  const ctxMsg = searchParams.get('msg');
  const ctxMsgText = searchParams.get('text') ? decodeURIComponent(searchParams.get('text')) : null;
  const ctxComm = searchParams.get('community');
  const ctxCommName = searchParams.get('cname') ? decodeURIComponent(searchParams.get('cname')) : null;

  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(() => {
    if (ctxUser) return { type: 'user', id: ctxUser, name: ctxUserName || `User #${ctxUser}` };
    if (ctxMsg) return { type: 'message', id: ctxMsg, text: ctxMsgText };
    if (ctxComm) return { type: 'community', id: ctxComm, name: ctxCommName };
    return null;
  });
  const [searchResults, setSearchResults] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleUserSearch = async (val) => {
    setUserSearch(val);
    if (!val.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(val)}`, { headers: { 'x-role': user.role } });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data.slice(0, 5) : []);
        return;
      }
    } catch {}
    // Fallback
    const demo = [
      { id: 1, name: 'Rajat Jain', username: 'rajat' },
      { id: 2, name: 'Karmanya', username: 'karmanya' },
      { id: 3, name: 'Awadhesh', username: 'awadhesh' },
      { id: 4, name: 'Anant', username: 'anant' },
    ].filter(u => u.name.toLowerCase().includes(val.toLowerCase()) || u.username.toLowerCase().includes(val.toLowerCase()));
    setSearchResults(demo);
  };

  const submitReport = async () => {
    if (!selectedReason || !confirmed) return;
    setSubmitting(true);
    const reportData = {
      reporterId: user.id,
      targetType: selectedTarget?.type || 'user',
      targetId: selectedTarget?.id,
      reason: selectedReason,
      context: additionalContext,
      anonymous: true,
    };
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify(reportData),
      });
      if (res.ok) {
        const data = await res.json();
        setRefId(data.id || `RPT-${Date.now()}`);
      } else {
        setRefId(`RPT-${Date.now()}`);
      }
    } catch {
      setRefId(`RPT-${Date.now()}`);
    }
    setSubmitting(false);
    setStep(4);
    setSubmitted(true);
  };

  const resetForm = () => {
    setStep(1); setSelectedReason(''); setAdditionalContext(''); setConfirmed(false);
    setSubmitted(false); setRefId(''); setSelectedTarget(null); setUserSearch(''); setSearchResults([]);
  };

  const goStep = (s) => {
    if (s === 2 && !selectedTarget) { showToast('⚠️ Please select a target first.'); return; }
    if (s === 3 && !selectedReason) { showToast('⚠️ Please select a reason.'); return; }
    setStep(s);
  };

  const STEPS = [
    { num: 1, label: 'Select Content' },
    { num: 2, label: 'Choose Reason' },
    { num: 3, label: 'Review & Submit' },
  ];

  return (
    <div className="app-shell">
      <SideBar />
      <div className="main">
        {/* Header */}
        <header className="header">
          <div className="breadcrumb">
            <span>Pro Gamers</span>
            <span className="sep">›</span>
            <span>#general</span>
            <span className="sep">›</span>
            <span className="current">🚩 Report Content</span>
          </div>
          <div className="header-actions">
            <div className="icon-btn">🔔<div className="notif-dot"></div></div>
            <div className="header-avatar user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile-settings')} />
          </div>
        </header>

        <div className="page-wrap">
          <div className="report-container">
            {/* Stepper */}
            {!submitted && (
              <div className="stepper" id="stepper">
                {STEPS.map(s => (
                  <div key={s.num} className={`step${step === s.num ? ' active' : step > s.num ? ' done' : ''}`} id={`s${s.num}`}>
                    <div className="step-circle">{step > s.num ? '✓' : s.num}</div>
                    <div className="step-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Panel 1: Select Target */}
            {step === 1 && (
              <div className="panel active" id="panel1">
                <div className="panel-card">
                  {selectedTarget ? (
                    <div id="contextTargetWrap">
                      <div className="panel-title">Confirm what you're reporting</div>
                      <div className="panel-sub">Reports are anonymous and reviewed by community moderators within 24 hours.</div>
                      {selectedTarget.type === 'user' && (
                        <div className="user-preview">
                          <div className="up-av" id="ctxUserAv">
                            {selectedTarget.name?.slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div className="up-info">
                            <div className="up-name" id="ctxUserName">{selectedTarget.name}</div>
                            <div className="up-meta">User</div>
                          </div>
                          <div className="up-flag">Selected</div>
                        </div>
                      )}
                      {selectedTarget.type === 'message' && (
                        <div className="msg-preview">
                          <div className="mp-av">💬</div>
                          <div className="mp-body">
                            <div className="mp-text" id="ctxMsgText">{selectedTarget.text || 'Message content'}</div>
                          </div>
                          <div className="mp-flag">Selected</div>
                        </div>
                      )}
                      {selectedTarget.type === 'community' && (
                        <div className="user-preview">
                          <div className="up-av" id="ctxCommIcon">🏘️</div>
                          <div className="up-info">
                            <div className="up-name" id="ctxCommName">{selectedTarget.name}</div>
                          </div>
                          <div className="up-flag">Selected</div>
                        </div>
                      )}
                      <div className="btn-row" style={{ marginTop: '16px' }}>
                        <button className="btn-back" onClick={() => setSelectedTarget(null)}>Report something else instead</button>
                        <button className="btn-next" onClick={() => goStep(2)}>Choose Reason →</button>
                      </div>
                    </div>
                  ) : (
                    <div id="userSearchWrap">
                      <div className="panel-title">Who are you reporting?</div>
                      <div className="panel-sub">Search by username, or paste a numeric User ID directly. To report a specific message, use "Report Message" from inside the channel instead.</div>
                      <div className="additional-field">
                        <label>Search users or enter a User ID</label>
                        <input
                          type="text"
                          id="userSearchInput"
                          placeholder="e.g. player01 or 4"
                          autoComplete="off"
                          value={userSearch}
                          onChange={e => handleUserSearch(e.target.value)}
                        />
                      </div>
                      <div id="userSearchResults" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        {searchResults.map(u => (
                          <div
                            key={u.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-card,#151d2f)', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border,rgba(255,255,255,0.06))' }}
                            onClick={() => setSelectedTarget({ type: 'user', id: u.id, name: u.name || u.username })}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                              {(u.name || u.username).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name || u.username}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-3,#666)' }}>@{u.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="notice-bar" style={{ marginTop: '20px' }}>
                    <div className="notice-icon">🔒</div>
                    <div className="notice-text"><strong>Your report is fully anonymous.</strong> The reported user will never know who submitted this report. False or malicious reports may result in action against your own account.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2: Select Reason */}
            {step === 2 && (
              <div className="panel active" id="panel2">
                <div className="panel-card">
                  <div className="panel-title">Why are you reporting this?</div>
                  <div className="panel-sub">Choose the reason that best describes the violation. You can add additional context below.</div>
                  <div className="reason-list">
                    {REASONS.map(r => (
                      <div
                        key={r.id}
                        className={`reason-opt${selectedReason === r.label ? ' selected' : ''}`}
                        onClick={() => setSelectedReason(r.label)}
                      >
                        <div className="reason-radio"></div>
                        <div className="reason-icon">{r.icon}</div>
                        <div className="reason-body">
                          <div className="reason-title">{r.label}</div>
                          <div className="reason-desc">{r.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="additional-field">
                    <label>Additional Context (Optional)</label>
                    <textarea
                      id="additionalContext"
                      maxLength={500}
                      placeholder="Describe the issue in more detail…"
                      value={additionalContext}
                      onChange={e => setAdditionalContext(e.target.value)}
                    />
                    <div className="char-count" id="charCount">{additionalContext.length}/500</div>
                  </div>
                  <div className="btn-row">
                    <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn-next" onClick={() => goStep(3)}>Review Report →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 3: Review & Submit */}
            {step === 3 && (
              <div className="panel active" id="panel3">
                <div className="panel-card">
                  <div className="panel-title">Review your report</div>
                  <div className="panel-sub">Check the details below before submitting. Once sent, a moderator will review this report and take action within 24 hours.</div>
                  <div className="review-section">
                    <div className="review-row">
                      <div className="review-key">Report Type</div>
                      <div className="review-val" id="rvType">{selectedTarget?.type === 'message' ? 'Message Report' : selectedTarget?.type === 'community' ? 'Community Report' : 'User Report'}</div>
                    </div>
                    <div className="review-row">
                      <div className="review-key">Reporting</div>
                      <div className="review-val red" id="rvTarget">{selectedTarget?.name || selectedTarget?.text || `${selectedTarget?.type} #${selectedTarget?.id}`}</div>
                    </div>
                    <div className="review-row">
                      <div className="review-key">Violation Reason</div>
                      <div className="review-val red" id="rvReason">🚫 {selectedReason}</div>
                    </div>
                    <div className="review-row">
                      <div className="review-key">Additional Context</div>
                      <div className="review-val" id="rvContext">{additionalContext || 'None provided'}</div>
                    </div>
                    <div className="review-row">
                      <div className="review-key">Anonymous</div>
                      <div className="review-val green">✓ Yes — your identity is protected</div>
                    </div>
                  </div>
                  <div className="confirm-row">
                    <input
                      id="confirmCheck"
                      type="checkbox"
                      checked={confirmed}
                      onChange={e => setConfirmed(e.target.checked)}
                    />
                    <label htmlFor="confirmCheck">I confirm that this report is <strong>accurate and made in good faith</strong>. I understand that submitting false or malicious reports is a violation of Gameunity's Terms of Service and may result in action against my account.</label>
                  </div>
                  <div className="btn-row">
                    <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
                    <button
                      className="btn-next"
                      disabled={!confirmed || submitting}
                      id="submitBtn"
                      onClick={submitReport}
                    >
                      {submitting ? 'Submitting…' : '🚩 Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 4: Success */}
            {step === 4 && (
              <div className="panel active" id="panel4">
                <div className="panel-card">
                  <div className="success-screen">
                    <div className="success-circle">✓</div>
                    <div className="success-title">Report Submitted</div>
                    <div className="success-sub">Your report has been received and will be reviewed by a moderator within <strong>24 hours</strong>. We take all reports seriously and will take appropriate action if the content violates our community guidelines.</div>
                    <div className="success-ref">Report ID: <span id="successRefId">{refId}</span></div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                      <button className="btn-done" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
                      <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary,#aaa)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }} onClick={resetForm}>Submit Another Report</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`toast${toast.show ? ' show' : ''}`} id="toast">
          <span id="toastMsg">{toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
