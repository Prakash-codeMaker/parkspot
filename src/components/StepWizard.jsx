import React from 'react';
import { C } from '../tokens.js';

export function StepWizard({ steps, current, onBack, onNext, children }) {
  return (
    <div>
      <div
        style={{
          marginBottom: 14
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: C.slateL
            }}
          >
            Step {current + 1} of {steps.length}
          </span>
          <span
            style={{
              fontSize: 12,
              color: C.slate
            }}
          >
            {steps[current]}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4
          }}
        >
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: idx <= current ? C.blue : C.bg
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>{children}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={current === 0 || !onBack}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: current === 0 || !onBack ? C.bg : C.white,
            color: C.slate,
            fontSize: 13,
            cursor: current === 0 || !onBack ? 'default' : 'pointer'
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btnPrimary"
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            border: 'none',
            background: C.blue,
            color: C.white,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

