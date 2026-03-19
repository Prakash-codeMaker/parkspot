import React from 'react';
import { C } from '../tokens.js';

export function Logo({ variant = 'dark', size = 24 }) {
  const bg = variant === 'dark' ? C.white : C.navy;
  const fg = variant === 'dark' ? C.navy : C.white;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(0,0,0,0.18)'
        }}
      >
        <div
          style={{
            width: size * 0.56,
            height: size * 0.56,
            borderRadius: 6,
            border: `2px solid ${fg}`,
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: 4,
              border: `2px solid ${fg}`,
              borderTopColor: 'transparent'
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 3,
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: fg
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: '"Bricolage Grotesque", system-ui',
            fontWeight: 700,
            letterSpacing: 0.3,
            fontSize: 20,
            color: variant === 'dark' ? C.white : C.navy
          }}
        >
          ParkSpot
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: variant === 'dark' ? 'rgba(255,255,255,0.72)' : C.slateL
          }}
        >
          Secure Parking Network
        </span>
      </div>
    </div>
  );
}

