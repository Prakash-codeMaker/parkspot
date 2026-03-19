import React from 'react';
import { C } from '../tokens.js';

export function Avatar({ name = '', size = 32 }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'PS';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: C.blueSoft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.blue,
        fontWeight: 600,
        fontSize: size * 0.4,
        border: `1px solid ${C.blueLight}`
      }}
    >
      {initials}
    </div>
  );
}

