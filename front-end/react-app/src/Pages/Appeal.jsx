import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import '../styles/appeal.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { role: raw.role || 'user', firstName: raw.firstName || 'User', username: raw.username || 'user', id: raw.id || 1 };
  } catch { return { role: 'user', firstName: 'User', username: 'user', id: 1 }; }
}

const APPEAL_TYPES = [
  { id: 'false_report', label: 'False Report', desc: 'The moderation action was based on a false or malicious report.' },
  { id: 'misunderstanding', label: 'Misunderstanding', desc: 'My content or behavior was misunderstood or taken out of context.' },
  { id: 'changed_behavior', label: 'Changed Behavior', desc: 'I understand why I was actioned and have committed to improving.' },
  { id: 'technical_error', label: 'Technical Error', desc: 'The action was applied due to a bug or system error, not my behavior.' },
  { id: 'other', label: 'Other Reason', desc: 'My appeal reason is not covered by the options above.' },
];

export default function Appeal() {
  const navigate = useNavigate();
  const user = getUser();

  const [appealType, setAppealType] = useState('');
  const [statement, setStatement] = useState('');
  const [commitment, setCommitment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refId, setRefId] = useState('');
  const [myAppeals, setMyAppeals] = useState([]);

  useEffect(() => {
    async function fetchAppeals() {
      try {
        const res = await fetch(`${API_BASE}/appeals`, { headers: { 'x-role': user.role } });
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d)) {
            setMyAppeals(d.filter((a) => !user.id || a.userId === user.id));
          }
        }
      } catch {}
    }
    fetchAppeals();
  }, [user.id, user.role]);

  const validate = () => {
    const errs = {};
    if (!appealType) errs.type = 'Please select an appeal type.';
    if (!statement.trim() || statement.trim().length < 20) errs.statement = 'Your statement must be at least 20 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      userId: Number(user.id || 4),
      actionId: `ACT-${Date.now()}`,
      text: statement.trim(),
      acknowledgement: (commitment || 'I agree to the platform community guidelines').slice(0, 95),
      resolution: (appealType || 'Reconsideration').slice(0, 95),
    };
    try {
      const res = await fetch(`${API_BASE}/appeals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify(payload),
      });
      const data = res.ok ? await res.json() : {};
      setRefId(`APL-${data.id || Date.now()}`);
    } catch { setRefId(`APL-${Date.now()}`); }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="main">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/profile-settings')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>← Back to Settings</button>
            <div className="breadcrumb">
              <span>Account</span><span className="sep">›</span>
              <span className="current">⚖️ Submit Appeal</span>
            </div>
          </div>
        </header>
        <div className="page-wrap" style={{ display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>✓</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Appeal Submitted</div>
            <div style={{ fontSize: '14px', color: 'var(--text-3,#9ca3af)', lineHeight: '1.6', marginBottom: '16px' }}>
              Your appeal has been received and will be reviewed by our moderation team within <strong style={{ color: '#fff' }}>48–72 hours</strong>. You will be notified of the outcome via your registered email.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3,#666)', marginBottom: '24px' }}>
              Reference ID: <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{refId}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Return to Dashboard</button>
              <button onClick={() => { setSubmitted(false); setAppealType(''); setStatement(''); setCommitment(''); }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#aaa', cursor: 'pointer', fontSize: '14px' }}>Submit Another Appeal</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/profile-settings')}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Settings
          </button>
          <div className="breadcrumb">
            <span>Pro Gamers</span><span className="sep">›</span>
            <span>Account</span><span className="sep">›</span>
            <span className="current">⚖️ Submit Appeal</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="icon-btn">🔔<div className="notif-dot"></div></div>
          <div className="header-avatar user-avatar" />
        </div>
      </header>

      <div className="page-wrap">
        <div className="appeal-layout">
          {/* Main form */}
          <div id="formWrap">
            {/* Page Title */}
            <div className="page-title-row">
              <div className="page-icon">⚖️</div>
              <div>
                <div className="page-title">Submit an Appeal</div>
                <div className="page-sub">Contest a moderation action taken against your account</div>
              </div>
            </div>

            {/* Action Details Card */}
            <div className="action-card">
              <div className="action-header">
                <div className="action-severity severity-ban">🚫</div>
                <div className="action-hinfo">
                  <div className="action-type">Temporary Ban — 7 Days</div>
                  <div className="action-community">
                    <span>⚡</span> Pro Gamers · Issued by moderator
                  </div>
                </div>
                <span className="action-badge badge-temp">⏳ Active · 5 days remaining</span>
              </div>
              <div className="action-details">
                {[
                  { key: 'Action Type', val: 'Temporary Ban (7 Days)', cls: 'red' },
                  { key: 'Issued By', val: 'Rahul Kumar (Moderator)' },
                  { key: 'Date Issued', val: 'March 3, 2025 · 4:17 PM IST' },
                  { key: 'Expires', val: 'March 10, 2025 · 4:17 PM IST', cls: 'gold' },
                  { key: 'Reason Given', val: 'Repeated harassment and violation of community conduct rules after two prior warnings.' },
                  { key: 'Action ID', val: 'ACT-DNX-2025-003847', cls: 'mono' },
                ].map((row, i) => (
                  <div key={i} className="detail-row">
                    <div className="detail-key">{row.key}</div>
                    <div className={`detail-val${row.cls ? ` ${row.cls}` : ''}`}>{row.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline-card">
              <div className="tc-title">📋 Action Timeline</div>
              <div className="timeline">
                {[
                  { dot: 'tl-past', icon: '⚠️', event: '1st Warning issued', time: 'Feb 18, 2025 · Off-topic spam in #general' },
                  { dot: 'tl-past', icon: '🔇', event: '2nd Warning + 1h mute', time: 'Feb 28, 2025 · Inappropriate language in #dev-talk' },
                  { dot: 'tl-now', icon: '🚫', event: 'Temporary Ban (7 days)', time: 'March 3, 2025 · Persistent harassment' },
                  { dot: 'tl-future', icon: '🔓', event: 'Ban Expiry', time: 'March 10, 2025 at 4:17 PM IST' },
                ].map((item, i) => (
                  <div key={i} className="tl-item">
                    <div className={`tl-dot ${item.dot}`}>{item.icon}</div>
                    <div className="tl-info">
                      <div className="tl-event">{item.event}</div>
                      <div className="tl-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Appeal Form */}
            <form className="appeal-form" onSubmit={handleSubmit}>
              <div className="form-section-title">Your Appeal</div>

              {/* Appeal Type */}
              <div className="field">
                <label>Appeal Reason *</label>
                <div className="reason-list">
                  {APPEAL_TYPES.map(t => (
                    <div
                      key={t.id}
                      className={`reason-opt${appealType === t.id ? ' selected' : ''}`}
                      onClick={() => setAppealType(t.id)}
                    >
                      <div className="reason-radio"></div>
                      <div className="reason-body">
                        <div className="reason-title">{t.label}</div>
                        <div className="reason-desc">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.type && <div className="error-msg">{errors.type}</div>}
              </div>

              {/* Statement */}
              <div className="field">
                <label>Your Statement *</label>
                <textarea
                  rows={5}
                  maxLength={1000}
                  placeholder="Explain your side of the story in detail. Include relevant context, evidence, or any information that may help the review team understand your situation…"
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                />
                <div className="char-count">{statement.length}/1000</div>
                {errors.statement && <div className="error-msg">{errors.statement}</div>}
              </div>

              {/* Commitment */}
              <div className="field">
                <label>Commitment to Community (Optional)</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="If your appeal is approved, how do you plan to contribute positively to the community going forward?"
                  value={commitment}
                  onChange={e => setCommitment(e.target.value)}
                />
                <div className="char-count">{commitment.length}/500</div>
              </div>

              <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '20px', fontSize: '13px', color: '#d97706', lineHeight: '1.5' }}>
                ⚠️ <strong>Important:</strong> Submitting a false appeal is a violation of Gameunity's Terms of Service and may result in additional moderation actions. Only submit this appeal if you genuinely believe the moderation action was incorrect.
              </div>

              <div className="form-actions">
                <button type="button" className="btn-back" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn-next" disabled={submitting}>
                  {submitting ? 'Submitting…' : '⚖️ Submit Appeal'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="appeal-sidebar">
            <div className="sidebar-card">
              <div className="sc-title">📋 What Happens Next</div>
              <div className="timeline">
                {[
                  { icon: '📥', label: 'Appeal received', desc: 'Your appeal is logged and queued for review.' },
                  { icon: '🔍', label: 'Senior mod review', desc: 'A senior moderator reviews your case and the original action.' },
                  { icon: '⚖️', label: 'Decision made', desc: 'A decision is made within 48–72 hours.' },
                  { icon: '📧', label: 'You are notified', desc: 'You receive the outcome via email and platform notification.' },
                ].map((step, i) => (
                  <div key={i} className="tl-item">
                    <div className="tl-dot" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{step.icon}</div>
                    <div className="tl-info">
                      <div className="tl-event" style={{ fontWeight: 600 }}>{step.label}</div>
                      <div className="tl-time">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Appeals */}
            {myAppeals.length > 0 && (
              <div className="sidebar-card" style={{ marginTop: '16px' }}>
                <div className="sc-title">📜 Previous Appeals</div>
                {myAppeals.map((ap, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{ap.appealType || 'Appeal'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3,#666)', marginTop: '3px' }}>{ap.status || 'Pending'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
