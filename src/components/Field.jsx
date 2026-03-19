import React from 'react';
import { C } from '../tokens.js';

export function Field({
  label,
  children,
  error,
  hint,
  required,
  style,
  id
}) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
            fontSize: 13,
            color: C.slate
          }}
        >
          <span>
            {label}
            {required && <span style={{ color: C.red }}> *</span>}
          </span>
          {hint && (
            <span style={{ fontSize: 11, color: C.slateL }}>{hint}</span>
          )}
        </label>
      )}
      <div>{children}</div>
      {error && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: C.red
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

