import React from 'react';
import { C } from '../tokens.js';

export function MyListingsPage({ user, listings, onRemove }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>My listings</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Manage the spaces you host on ParkSpot. Removing a listing hides it from Browse.
        </p>
      </div>
      {listings.length === 0 && (
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: C.white,
            border: `1px dashed ${C.border}`,
            fontSize: 13,
            color: C.slate
          }}
        >
          You have no active listings yet. Add your first space from the Add Listing page.
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        {listings.map((l) => (
          <div
            key={l.id}
            className="cardHover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderRadius: 12,
              background: C.white,
              border: `1px solid ${C.border}`
            }}
          >
            <div
              style={{
                width: 80,
                height: 56,
                borderRadius: 10,
                backgroundImage: `url(${l.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 2
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {l.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.blue
                  }}
                >
                  ${l.price.toFixed(2)}
                  <span
                    style={{
                      fontSize: 11,
                      color: C.slateL,
                      marginLeft: 2
                    }}
                  >
                    /hr
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.slate,
                  marginBottom: 2
                }}
              >
                {l.location} ·{' '}
                <span style={{ color: C.slateL }}>{l.address}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  fontSize: 11,
                  color: C.slateL
                }}
              >
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: C.blueSoft,
                    color: C.blue
                  }}
                >
                  {l.type}
                </span>
                <span>{l.availability}</span>
                <span>
                  Listed {new Date(l.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Remove this listing from ParkSpot?')) {
                  onRemove(l.id);
                }
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: C.red,
                color: C.white,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

