import React from 'react';

/**
 * Reusable SectionHeader Component
 * Section header with title, subtitle, and optional right actions.
 */
export default function SectionHeader({
  title,
  subtitle,
  children,
  className = '',
}) {
  return (
    <div className={`section-header ${className}`.trim()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        {title && <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{title}</h2>}
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-3, #9ca3af)' }}>{subtitle}</p>}
      </div>
      {children && <div className="section-actions">{children}</div>}
    </div>
  );
}
