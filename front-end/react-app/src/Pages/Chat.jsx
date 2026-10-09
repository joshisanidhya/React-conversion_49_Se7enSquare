import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import SideBar from '../Components/SideBar';
import '../styles/global.css';
import '../styles/sidebar.css';
import '../styles/chat.css';

const API_BASE = 'http://localhost:3000/api';

function getUser() {
  try {
    const raw = JSON.parse(localStorage.getItem('nexus_user') || localStorage.getItem('currentUser') || '{}');
    return { firstName: raw.firstName || 'You', username: raw.username || 'you', role: raw.role || 'user' };
  } catch { return { firstName: 'You', username: 'you', role: 'user' }; }
}

const EMOJIS = ['😊','😂','🔥','❤️','👍','🎉','🤔','😎','💡','🚀','🏆','⚡','🎮','💻','🌟','✨'];

const DEFAULT_CHANNELS = [
  { id: 1, name: 'general', type: 'text', topic: 'The main hub — say hello, share updates, ask anything 👋' },
  { id: 2, name: 'announcements', type: 'text', topic: 'Official community announcements' },
  { id: 3, name: 'dev-talk', type: 'text', topic: 'Technical discussions and code reviews' },
  { id: 4, name: 'off-topic', type: 'text', topic: 'Anything goes — keep it friendly!' },
];

const DEMO_MESSAGES = [
  { id: 1, author: 'Alex Morgan', initials: 'AM', color: '#6366f1', text: 'Hey everyone! Excited to be here. Who else is working on the hackathon project?', time: '10:41 AM', reactions: [{ emoji: '👍', count: 3 }] },
  { id: 2, author: 'Maya Krishnan', initials: 'MK', color: '#8b5cf6', text: 'Just joined the team! Looking forward to collaborating 🚀', time: '10:44 AM', reactions: [] },
  { id: 3, author: 'Rahul Kumar', initials: 'RK', color: '#06b6d4', text: 'Welcome everyone! Don\'t forget to check #announcements for the hackathon rules.', time: '10:47 AM', reactions: [{ emoji: '🎉', count: 5 }] },
];

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('community') || '';
  const communityName = decodeURIComponent(searchParams.get('cname') || 'Community');
  const initialChannel = decodeURIComponent(searchParams.get('channel') || 'general');
  const messagesEndRef = useRef(null);

  const user = getUser();
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(() =>
    DEFAULT_CHANNELS.find(c => c.name === initialChannel) || DEFAULT_CHANNELS[0]
  );
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [msgInput, setMsgInput] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChannels() {
      if (!communityId) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/communities/${communityId}/channels`, { headers: { 'x-role': user.role } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChannels(data);
            const found = data.find(c => c.name === initialChannel) || data[0];
            if (found) setActiveChannel(found);
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchChannels();
  }, [communityId, user.role]);

  useEffect(() => {
    async function fetchMessages() {
      if (!activeChannel?.id) return;
      try {
        const res = await fetch(`${API_BASE}/messages/channel/${activeChannel.id}`, { headers: { 'x-role': user.role } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMessages(data.map(m => ({
              id: m.id,
              author: m.author?.name || m.author || 'User',
              initials: (m.author?.name || m.author || 'U').slice(0, 2).toUpperCase(),
              color: '#6366f1',
              text: m.content || m.text || '',
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              reactions: m.reactions || [],
            })));
          }
        }
      } catch {}
    }
    fetchMessages();
  }, [activeChannel?.id, user.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text) return;
    const newMsg = {
      id: Date.now(),
      author: user.firstName,
      initials: user.firstName.slice(0, 2).toUpperCase(),
      color: '#34d399',
      text: replyTo ? `↩️ ${replyTo}: ${text}` : text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setMessages(prev => [...prev, newMsg]);
    setMsgInput('');
    setReplyTo(null);

    try {
      await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-role': user.role },
        body: JSON.stringify({ channelId: activeChannel?.id, content: text, communityId }),
      });
    } catch {}
  };

  const toggleReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      const reactions = existing
        ? m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
        : [...m.reactions, { emoji, count: 1 }];
      return { ...m, reactions };
    }));
  };

  const filteredChannels = channels.filter(c =>
    !channelSearch || c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const filteredMessages = msgSearchQuery
    ? messages.filter(m => m.text.toLowerCase().includes(msgSearchQuery.toLowerCase()))
    : messages;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-1,#0d1117)' }}>
      {/* Header */}
      <header className="header" style={{ flexShrink: 0 }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => communityId ? navigate(`/community/${communityId}`) : navigate('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-secondary,#aaa)', borderRadius: '8px', padding: '6px 14px',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            ← Back
          </button>
          <div
            className="header-title"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Gameunity
          </div>
        </div>
        <div className="header-actions">
          <div className="hact-btn" id="searchToggleBtn" onClick={() => setShowSearch(s => !s)} title="Search Messages">🔍</div>
          <div className="hact-btn" id="pinnedToggleBtn" onClick={() => setShowPinned(s => !s)} title="Pinned Messages">📌</div>
          <div className="member-count-chip" id="memberCountChip" onClick={() => setShowMembers(s => !s)} title="Members List">
            👥 <span id="onlineCount">{channels.length}</span>
          </div>
          <div className="header-divider" style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 8px' }} />
          <div className="icon-btn" onClick={() => navigate('/profile-settings')}>
            <div className="header-avatar user-avatar">{user.firstName.slice(0, 2).toUpperCase()}</div>
          </div>
        </div>
      </header>

      <div className="chat-layout" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Channel Sidebar */}
        <nav className="ch-sidebar">
          <div className="comm-header">
            <div className="comm-header-top">
              <div className="comm-icon-sm" id="chatCommIcon">🎮</div>
              <div className="comm-hname" id="chatCommName">{communityName}</div>
            </div>
            <div className="comm-hmeta">Online</div>
          </div>

          <div className="ch-search">
            <input
              type="text"
              placeholder="Search channels…"
              value={channelSearch}
              onChange={e => setChannelSearch(e.target.value)}
            />
          </div>

          <div className="ch-list" id="channelsList">
            {loading ? (
              <div style={{ padding: '12px 16px', color: 'var(--sb-text)', fontSize: '13px' }}>Loading…</div>
            ) : filteredChannels.map(ch => (
              <div
                key={ch.id}
                className={`ch-row${activeChannel?.id === ch.id ? ' active' : ''}`}
                onClick={() => setActiveChannel(ch)}
              >
                <span className="ch-hash">#</span>
                <span className="ch-lbl">{ch.name}</span>
              </div>
            ))}
          </div>

          <div className="ch-footer">
            <div className="user-av grad-purple" style={{ background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '11px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.firstName.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-av-name">{user.firstName}</div>
            <div className="mic-btn" id="muteMicBtn" title="Mute Mic" onClick={() => setMuted(m => !m)}>
              {muted ? '🔇' : '🎤'}
            </div>
            <div className="mic-btn" id="deafenBtn" title="Deafen" onClick={() => setDeafened(d => !d)}>
              {deafened ? '🔕' : '🎧'}
            </div>
          </div>
        </nav>

        {/* Main Chat Area */}
        <main className="chat-area" style={{ height: '100%' }}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="ch-name-display">
              <span className="ch-hash" id="activeChanHash">#</span>
              <span className="ch-name-text" id="activeChanName">{activeChannel?.name || 'general'}</span>
              <span className="ch-topic" id="activeChanTopic">{activeChannel?.topic || ''}</span>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div id="chatSearchBar" className="chat-search-bar" style={{ display: 'block' }}>
              <div className="chat-search-inner">
                <span className="chat-search-icon">🔍</span>
                <input
                  type="text"
                  id="chatSearchInput"
                  placeholder="Search messages..."
                  value={msgSearchQuery}
                  onChange={e => setMsgSearchQuery(e.target.value)}
                />
                <span id="chatSearchCount" className="chat-search-count">
                  {msgSearchQuery ? `${filteredMessages.length} result${filteredMessages.length !== 1 ? 's' : ''}` : ''}
                </span>
                <button className="chat-search-close" onClick={() => { setShowSearch(false); setMsgSearchQuery(''); }}>✕</button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-wrap" id="messagesWrap">
            {filteredMessages.length === 0 ? (
              <div className="chat-empty-state" style={{ display: 'flex' }}>
                <div className="empty-icon">👋</div>
                <div className="empty-text">Start the conversation</div>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div key={msg.id} className="msg-group">
                  <div
                    className="msg-av"
                    style={{ background: msg.color, color: '#fff', fontWeight: 700, fontSize: '12px' }}
                  >
                    {msg.initials}
                  </div>
                  <div className="msg-body">
                    <div className="msg-header">
                      <span className="msg-uname">{msg.author}</span>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                    <div className="msg-text">{msg.text}</div>
                    {msg.reactions.length > 0 && (
                      <div className="reactions">
                        {msg.reactions.map((r, i) => (
                          <div
                            key={i}
                            className="FPS-pill"
                            onClick={() => toggleReaction(msg.id, r.emoji)}
                          >
                            <span>{r.emoji}</span><span className="FPS-count">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="msg-actions">
                    <button className="act-btn reaction-btn" onClick={() => setShowEmojiPicker(p => p === msg.id ? null : msg.id)}>😊</button>
                    <button className="act-btn reply-btn" onClick={() => setReplyTo(msg.author)}>↩</button>
                  </div>
                  {showEmojiPicker === msg.id && (
                    <div style={{ position: 'absolute', zIndex: 100, background: 'var(--bg-card,#151d2f)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '200px' }}>
                      {EMOJIS.map(e => (
                        <span key={e} style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => { toggleReaction(msg.id, e); setShowEmojiPicker(null); }}>{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Bar */}
          {replyTo && (
            <div id="replyBar" className="reply-bar" style={{ display: 'block' }}>
              <div className="reply-bar-inner">
                <span className="reply-bar-icon">↩️</span>
                <span className="reply-bar-text">Replying to <strong id="replyBarName">{replyTo}</strong></span>
                <button className="reply-bar-close" onClick={() => setReplyTo(null)}>✕</button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="input-area">
            <div className="input-wrap">
              <div className="input-toolbar">
                <div className="tb-btn" title="Bold" onClick={() => setMsgInput(t => `**${t}**`)}>
                  <strong>B</strong>
                </div>
                <div className="tb-btn" title="Italic" onClick={() => setMsgInput(t => `_${t}_`)}>
                  <em>I</em>
                </div>
                <div className="tb-btn" title="Code" onClick={() => setMsgInput(t => `\`${t}\``)}>
                  <span className="tb-mono">&lt;/&gt;</span>
                </div>
                <div className="tb-divider" />
                <div className="tb-btn" title="Emoji" onClick={() => setShowEmojiPicker(p => p === 'input' ? null : 'input')}>😊</div>
              </div>
              {showEmojiPicker === 'input' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', background: 'var(--bg-card,#151d2f)', borderRadius: '10px', marginBottom: '8px' }}>
                  {EMOJIS.map(e => (
                    <span key={e} style={{ cursor: 'pointer', fontSize: '18px' }} onClick={() => { setMsgInput(t => t + e); setShowEmojiPicker(null); }}>{e}</span>
                  ))}
                </div>
              )}
              <div className="input-row">
                <button type="button" className="tb-btn" title="Attach File">➕</button>
                <textarea
                  id="msgInput"
                  placeholder={`Message #${activeChannel?.name || 'general'}`}
                  rows={1}
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                />
                <button type="button" className="send-btn" onClick={sendMessage}>🚀</button>
              </div>
            </div>
          </div>

          {/* Pinned Panel */}
          {showPinned && (
            <div id="pinnedPanel" className="pinned-panel" style={{ display: 'block' }}>
              <div className="pinned-panel-header">
                <span>📌 Pinned Messages</span>
                <button className="pinned-panel-close" onClick={() => setShowPinned(false)}>✕</button>
              </div>
              <div className="pinned-panel-list" id="pinnedList">
                <div id="pinnedEmpty" className="pinned-empty">No pinned messages yet.</div>
              </div>
            </div>
          )}
        </main>

        {/* Member Sidebar */}
        {showMembers && (
          <aside className="mem-sidebar" id="memberSidebar">
            <div className="mem-header">
              <div className="mem-title">
                <span className="mem-title-text">Members</span>
                <div className="mem-toggle-area">
                  <button className="mem-toggle-btn" onClick={() => setShowMembers(false)} title="Toggle Sidebar">
                    <span className="toggle-icon">❯</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="mem-list">
              <div className="mem-group-title">ONLINE</div>
              {[
                { name: 'Alex Morgan', role: 'Member', color: '#6366f1' },
                { name: 'Maya Krishnan', role: 'Owner', color: '#f59e0b' },
                { name: 'Rahul Kumar', role: 'Moderator', color: '#06b6d4' },
              ].map(m => (
                <div key={m.name} className="mem-item">
                  <div className="mem-av" style={{ background: m.color, color: '#fff', fontWeight: 700, fontSize: '11px', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {m.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="mem-name">{m.name}</div>
                    <div className="mem-role" style={{ fontSize: '11px', color: m.color }}>{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
