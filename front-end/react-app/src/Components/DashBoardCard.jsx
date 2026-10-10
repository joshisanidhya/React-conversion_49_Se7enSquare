import React from 'react';

/**
 * Reusable DashBoardCard Component
 * Metric or content card with icon, value, label, trend badge, and optional click action.
 */
export default function DashBoardCard({
  icon,
  iconBg = 'bg-purple',
  value,
  label,
  subtext,
  trend,
  trendUp = true,
  badge,
  onClick,
  className = '',
  children,
}) {
  return (
    <div
      className={`stat-card ${onClick ? 'drill-card' : ''} ${className}`.trim()}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', position: 'relative' }}
    >
      {icon && (
        <div className={`stat-icon ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="stat-data" style={{ flex: 1, minWidth: 0 }}>
        {value !== undefined && <div className="stat-value">{value}</div>}
        {label && <div className="stat-label">{label}</div>}
        {subtext && <div style={{ fontSize: '12px', color: 'var(--text-3, #888)', marginTop: '4px' }}>{subtext}</div>}
        {badge && <span className="badge badge-active" style={{ marginTop: '6px' }}>{badge}</span>}
        {children}
      </div>
      {trend && (
        <div className={`stat-trend ${trendUp ? 'up' : 'down'}`} style={{ alignSelf: 'flex-start' }}>
          {trend}
        </div>
      )}
    </div>
  );
}
