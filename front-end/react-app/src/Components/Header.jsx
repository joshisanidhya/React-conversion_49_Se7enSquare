import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable Header Component
 * Top bar header with icon, title, badge, action buttons, and user avatar.
 */
export default function Header({
  icon,
  title,
  badge,
  children,
  onAvatarClick,
}) {
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      navigate('/profile-settings');
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        {icon && <div className="header-icon">{icon}</div>}
        {title && <h1 className="header-title">{title}</h1>}
        {badge && <span className="header-badge">{badge}</span>}
      </div>
      <div className="header-right">
        {children}
        <div
          className="header-avatar user-avatar"
          onClick={handleAvatarClick}
          style={{ cursor: 'pointer' }}
          title="Profile & Settings"
        />
      </div>
    </header>
  );
}
