import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Video, FileCheck, X } from 'lucide-react';

export function BookingsPage({ bookings, onCancel, onWatchLive, onCert }) {
  const [active, setActive] = useState(null);

  const sorted = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
      ),
    [bookings]
  );

  const open = (b) => setActive(b);
  const close = () => setActive(null);

  const statusColor = (s) => {
    if (s === 'cancelled') return { bg: C.redBg, color: C.red };
    return { bg: C.greenBg, color: C.green };
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>My bookings</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Review upcoming and past sessions, access live feeds and download insurance certificates.
        </p>
      </div>
      {sorted.length === 0 && (
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
          No bookings yet. Browse spaces, preview CCTV feeds and confirm your first ParkSpot session.
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        {sorted.map((b) => {
          const colors = statusColor(b.status);
          return (
            <button
              key={b.id}
              onClick={() => open(b)}
              className="cardHover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: 8,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.white,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 48,
                  borderRadius: 10,
                  backgroundImage: `url(${b.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
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
                    {b.listingTitle}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: colors.bg,
                      color: colors.color
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.slate,
                    marginBottom: 2
                  }}
                >
                  {b.location} ·{' '}
                  <span style={{ color: C.slateL }}>{b.address}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: C.slateL
                  }}
                >
                  <span>
                    {new Date(b.date).toLocaleString()} · {b.duration}h
                  </span>
                  <span>
                    Total ${b.total.toFixed(2)} · Code {b.accessCode}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {active && (
        <div
          className="fadeIn"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,13,24,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40
          }}
        >
          <div
            className="zoomIn"
            style={{
              width: '100%',
              maxWidth: 540,
              background: C.white,
              borderRadius: 18,
              padding: 18,
              border: `1px solid ${C.border}`
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
              }}
            >
              <h3
                style={{
                  fontSize: 18
                }}
              >
                Booking details
              </h3>
              <button
                onClick={close}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 10
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 72,
                  borderRadius: 12,
                  backgroundImage: `url(${active.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 2
                  }}
                >
                  {active.listingTitle}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.slate,
                    marginBottom: 4
                  }}
                >
                  {active.location} ·{' '}
                  <span style={{ color: C.slateL }}>{active.address}</span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.slateL
                  }}
                >
                  {new Date(active.date).toLocaleString()} · {active.duration}h · $
                  {active.total.toFixed(2)}
                </div>
              </div>
            </div>
            <div
              style={{
                marginBottom: 8,
                padding: 8,
                borderRadius: 10,
                background: C.bg,
                fontSize: 12
              }}
            >
              <div>Access code</div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 20,
                  letterSpacing: 3,
                  color: C.blue
                }}
              >
                {active.accessCode}
              </div>
            </div>
            {active.status === 'confirmed' && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 8
                }}
              >
                <button
                  onClick={() => {
                    onWatchLive(active);
                    close();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: C.navy,
                    color: C.green,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Video size={14} />
                  Watch live
                </button>
                <button
                  onClick={() => {
                    onCert(active);
                    close();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: C.green,
                    color: C.navy,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <FileCheck size={14} />
                  Get certificate
                </button>
              </div>
            )}
            {active.status === 'confirmed' && (
              <button
                onClick={() => {
                  if (window.confirm('Cancel this booking?')) {
                    onCancel(active.id);
                    close();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: C.red,
                  color: C.white,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 6
                }}
              >
                Cancel booking
              </button>
            )}
            <button
              onClick={close}
              style={{
                width: '100%',
                padding: '7px 8px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: C.slateL,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

