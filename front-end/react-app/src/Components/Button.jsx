import React from 'react';

/**
 * Reusable Button Component
 * Simple, flexible button accepting children, onClick, type, variant, disabled, and custom classNames.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant,
  className = '',
  disabled = false,
  ...rest
}) {
  // If a variant is specified (e.g. 'cta', 'ghost', 'hero', 'submit'), map it to standard class
  const variantClass = variant ? (variant.startsWith('btn-') ? variant : `btn-${variant}`) : '';
  const combinedClasses = `${variantClass} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
