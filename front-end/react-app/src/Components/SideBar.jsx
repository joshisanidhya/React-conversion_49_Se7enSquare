import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

/**
 * Reusable Sidebar Component
 * Role-based navigation sidebar matching the original sidebar.js functionality.
 * Supports collapse, role-based sections, and mobile toggle.
 */

const NAV_USER = {
  label: null,
  sectionId: 'main',
  items: [
    { id: 'dashboard', name: 'Dashboard', link: '/dashboard', icon: '🏠' },
    { id: 'discovery', name: 'Discover', link: '/discovery', icon: '🔭' },
    { id: 'events', name: 'Events', link: '/events', icon: '📅' },
    { id: 'pricing', name: 'Pricing', link: '/pricing', icon: '💎' },
    { id: 'profile', name: 'Profile', link: '/profile-settings', icon: '⚙️' },
  ],
};

const NAV_MOD = {
  label: 'Moderation',
  sectionId: 'moderator',
  items: [
    { id: 'mod-panel', name: 'Moderator Panel', link: '/mod-panel', icon: '🛡️', badge: 'MODERATOR' },
    { id: 'report', name: 'Reports', link: '/report', icon: '🚩' },
  ],
};

const NAV_CM = {
  label: 'Community',
  sectionId: 'community-management',
  items: [
    { id: 'event-approval', name: 'Event Approval', link: '/event-approval', icon: '📅', badge: 'CM' },
  ],
};

const NAV_ORGANIZER = {
  label: 'Tournaments',
  sectionId: 'organizer',
  items: [
    { id: 'organizer-dash', name: 'Organizer Dashboard', link: '/organizer-dashboard', icon: '🏆', badge: 'ORGANIZER' },
  ],
};

const NAV_ADMIN = {
  label: 'Admin',
  sectionId: 'admin',
  items: [
    { id: 'admin-dash', name: 'Admin Panel', link: '/admin-dashboard', icon: '⚡', badge: 'ADMIN' },
    { id: 'users', name: 'User Management', link: '/admin-dashboard', icon: '👤' },
    { id: 'communities-admin', name: 'Communities', link: '/admin-dashboard', icon: '🏘️' },
    { id: 'audit', name: 'Audit Logs', link: '/admin-dashboard', icon: '📋' },
  ],
};

const NAV_OWNER = {
  label: null,
  sectionId: 'owner',
  items: [
    { id: 'owner-dash', name: 'Platform Statistics', link: '/owner-dashboard', icon: '📊', badge: 'OWNER' },
    { id: 'profile', name: 'Profile', link: '/profile-settings', icon: '⚙️' },
  ],
};

const ROLE_META = {
  user: { tier: 'User', color: '#34d399', badge: null },
  moderator: { tier: 'Moderator', color: '#818cf8', badge: 'MODERATOR' },
  community_manager: { tier: 'Community Manager', color: '#06b6d4', badge: 'CM' },
  organizer: { tier: 'Organizer', color: '#22c55e', badge: 'ORGANIZER' },
  admin: { tier: 'System Admin', color: '#f59e0b', badge: 'ADMIN' },
  owner: { tier: 'Owner', color: '#e879f9', badge: 'OWNER' },
};

function getSections(role) {
  if (role === 'owner') return [NAV_OWNER];
  const sections = [NAV_USER];
  if (role === 'moderator' || role === 'admin') sections.push(NAV_MOD);
  if (role === 'community_manager' || role === 'admin') sections.push(NAV_CM);
  if (role === 'organizer' || role === 'admin') sections.push(NAV_ORGANIZER);
  if (role === 'admin') sections.push(NAV_ADMIN);
  return sections;
}

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('nexus_user') || localStorage.getItem('currentUser');
    const raw = stored ? JSON.parse(stored) : {};
    const role = raw.role || 'user';
    return {
      firstName: raw.firstName || raw.username || 'User',
      lastName: raw.lastName || '',
      username: raw.username || 'user',
      role,
      avatar: raw.avatar || null,
    };
  } catch {
    return { firstName: 'User', lastName: '', username: 'user', role: 'user', avatar: null };
  }
}

export default function SideBar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('nexus_sidebar_collapsed') === 'true'
  );
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('nexus_sidebar_collapsed', String(next));
  };

  const role = user.role;
  const meta = ROLE_META[role] || ROLE_META.user;
  const sections = getSections(role);
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || user.firstName?.[1] || ''}`.toUpperCase();

  const isActive = (link) => {
    return location.pathname === link || location.pathname.startsWith(link + '/');
  };

  return (
    <aside
      className={`nexus-sidebar${collapsed ? ' collapsed' : ''}`}
      id="nexusSidebar"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-hex">G</div>
        {!collapsed && <span className="sb-logo-name">Gameunity</span>}
        <button
          className="sb-collapse-btn"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sb-nav" aria-label="Sidebar navigation">
        {sections.map((section) => (
          <div key={section.sectionId} className="sb-section">
            {section.label && !collapsed && (
              <div className="sb-section-label">{section.label}</div>
            )}
            {section.items.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className={`sb-item${isActive(item.link) ? ' active' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <span className="sb-item-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="sb-item-name">{item.name}</span>
                    {item.badge && <span className="sb-item-badge">{item.badge}</span>}
                  </>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sb-footer">
        <div
          className="sb-user"
          style={{ cursor: 'pointer' }}
          title={`${user.firstName} ${user.lastName} (${meta.tier})`}
        >
          <div
            className="sb-user-av"
            style={{ background: meta.color, color: '#000', fontWeight: 700, fontSize: '13px' }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              initials || '?'
            )}
          </div>
          {!collapsed && (
            <div className="sb-user-info">
              <div className="sb-user-name">{user.firstName} {user.lastName}</div>
              <div className="sb-user-role" style={{ color: meta.color }}>
                {meta.badge ? meta.badge : meta.tier}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
