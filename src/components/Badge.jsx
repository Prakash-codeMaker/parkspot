import React from 'react';

export function Badge({ label, bg = '#EBF0FF', color = '#1354F9', icon = null }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

