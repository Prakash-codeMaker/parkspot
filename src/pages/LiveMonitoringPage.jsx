import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Video, CheckCircle, Maximize2, Volume2, VolumeX } from 'lucide-react';

const CAMERA_IMAGES = [
  'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=900&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&q=80',
  'https://images.unsplash.com/photo-1521133573892-e44906baee46?w=900&q=80',
  'https://images.unsplash.com/photo-1534447044450-81d17aafed4f?w=900&q=80'
];

export function LiveMonitoringPage({ bookings, listings }) {
  const [activeId, setActiveId] = useState(null);
  const [cameraIdx, setCameraIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(true);

  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed'),
    [bookings]
  );

  const active = useMemo(
    () => confirmed.find((b) => b.id === activeId) || confirmed[0],
    [confirmed, activeId]
  );

  React.useEffect(() => {
    if (confirmed.length && !activeId) {
      setActiveId(confirmed[0].id);
    }
  }, [confirmed, activeId]);

  const nowStr = new Date().toLocaleTimeString();

  const checks = [
    'Vehicle in bay',
    'Access gate',
    'CCTV coverage',
    'Motion sensors',
    'Stream quality',
    'Active alerts'
  ];

  if (!confirmed.length) {
    return (
      <div>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Live monitoring</h2>
          <p style={{ fontSize: 13, color: C.slate }}>
            Once you have confirmed bookings, you can monitor them here with live‑style feeds and security checks.
          </p>
        </div>
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: C.white,
            border: `1px dashed ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: C.slate
          }}
        >
          <Video size={18} color={C.slateL} />
          <span>No active bookings to monitor yet.</span>
        </div>
      </div>
    );
  }

  const listingForActive = listings.find((l) => l.id === active?.listingId);

  const feed = (
    <div
      className="scanline gridOverlay targetCorners"
      style={{
        position: 'relative',
        borderRadius: 16,
        border: `1px solid rgba(255,255,255,0.16)`,
        backgroundImage: `url(${CAMERA_IMAGES[cameraIdx]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: 300,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(8,13,24,0.78)',
          color: '#fff'
        }}
      >
        <span
          className="blink"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FF4B5C'
          }}
        />
        <span>REC</span>
        <span>{`CAM-${cameraIdx + 1}`}</span>
        <span>{nowStr}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 10,
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(8,13,24,0.78)',
          color: '#fff'
        }}
      >
        {active?.listingTitle} · {active?.accessCode}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          bottom: 10,
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(18,160,92,0.88)',
          color: '#0B1D35'
        }}
      >
        SECURED
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Live monitoring</h2>
          <p style={{ fontSize: 13, color: C.slate }}>
            Keep a live‑style view over your active ParkSpot sessions.
          </p>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 9px',
            borderRadius: 999,
            background: C.greenBg,
            color: C.green,
            fontSize: 11
          }}
        >
          <span
            className="pulse"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.green
            }}
          />
          <span>Live · {nowStr}</span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '248px 1fr',
          gap: 16,
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 14,
              background: C.white,
              border: `1px solid ${C.border}`
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6
              }}
            >
              Active bookings
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {confirmed.map((b) => {
                const isActive = active?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setActiveId(b.id)}
                    style={{
                      borderRadius: 10,
                      border: 'none',
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      background: isActive ? C.navy : C.bg,
                      color: isActive ? '#fff' : C.navy
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 36,
                        borderRadius: 8,
                        backgroundImage: `url(${b.img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 2
                        }}
                      >
                        {b.listingTitle}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isActive ? 'rgba(255,255,255,0.78)' : C.slate
                        }}
                      >
                        {b.location} · {b.accessCode}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div
            style={{
              padding: 10,
              borderRadius: 14,
              background: C.navy,
              color: '#fff',
              fontSize: 12
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6
              }}
            >
              Security status
            </div>
            {['CCTV active', 'Access locked', 'Stream online', 'Sensors OK'].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: C.green
                    }}
                  />
                  <span>{label}</span>
                </div>
              )
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              background: '#080D18',
              borderRadius: 18,
              padding: 10,
              color: '#fff',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11
                }}
              >
                <span
                  className="blink"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#FF4B5C'
                  }}
                />
                <span>REC</span>
                <span>{listingForActive?.title || active?.listingTitle}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  style={{
                    borderRadius: 999,
                    border: 'none',
                    padding: 4,
                    background: 'rgba(8,13,24,0.8)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreen((f) => !f)}
                  style={{
                    borderRadius: 999,
                    border: 'none',
                    padding: 4,
                    background: 'rgba(8,13,24,0.8)',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>
            {fullscreen ? (
              <div
                style={{
                  position: 'fixed',
                  inset: 20,
                  zIndex: 60,
                  background: '#080D18',
                  padding: 12
                }}
              >
                {feed}
              </div>
            ) : (
              feed
            )}
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                gap: 6
              }}
            >
              {CAMERA_IMAGES.map((src, idx) => {
                const activeCam = idx === cameraIdx;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setCameraIdx(idx)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      border: activeCam
                        ? `2px solid ${C.blue}`
                        : '1px solid rgba(255,255,255,0.22)',
                      padding: 0,
                      overflow: 'hidden',
                      height: 54,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: 6,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: activeCam ? C.green : 'rgba(255,255,255,0.4)'
                      }}
                    />
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              background: C.white,
              border: `1px solid ${C.border}`,
              fontSize: 12
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8
              }}
            >
              <span
                style={{
                  fontWeight: 600
                }}
              >
                Real‑time security checks
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: C.slateL
                }}
              >
                Updated {nowStr}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8
              }}
            >
              {checks.map((label) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 8,
                    borderRadius: 10,
                    background: C.greenBg,
                    color: C.green
                  }}
                >
                  <CheckCircle size={14} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

