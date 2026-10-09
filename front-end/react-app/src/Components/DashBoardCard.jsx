import React from 'react';

/**
 * Reusable DashBoardCard Component
 * Metric or content card with icon, value, label, and optional badge or click action.
 */
export default function DashBoardCard({
  icon,
  iconBg = 'bg-purple',
  value,
  label,
  subtext,
  badge,
  onClick,
  className = '',
  children,
}) {
  return (
    <div
      className={`stat-card ${onClick ? 'drill-card' : ''} ${className}`.trim()}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon && (
        <div className={`stat-icon ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="stat-data">
        {value !== undefined && <div className="stat-value">{value}</div>}
        {label && <div className="stat-label">{label}</div>}
        {subtext && <div style={{ fontSize: '12px', color: 'var(--text-3, #888)', marginTop: '4px' }}>{subtext}</div>}
        {badge && <span className="badge badge-active" style={{ marginTop: '4px' }}>{badge}</span>}
        {children}
      </div>
    </div>
  );
}
