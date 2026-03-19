import React from 'react';
import { C } from '../tokens.js';
import { Logo } from '../components/Logo.jsx';
import { ShieldCheck, Video, KeyRound } from 'lucide-react';

export function LandingPage({ onGetStarted, onSignIn }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.navy }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)',
          background: 'rgba(245,247,252,0.86)',
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Logo />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onSignIn}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: C.white,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="btnPrimary"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: 'none',
              background: C.blue,
              color: C.white,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(19,84,249,0.36)'
            }}
          >
            Get started
          </button>
        </div>
      </header>
      <main style={{ padding: '32px 26px 32px' }}>
        <section
          className="fadeUp"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 26,
            alignItems: 'stretch',
            marginBottom: 40
          }}
        >
          <div style={{ flex: '1 1 320px', maxWidth: 540 }}>
            <h1
              style={{
                fontSize: 40,
                lineHeight: 1.05,
                marginBottom: 14
              }}
            >
              Secure parking,{' '}
              <span style={{ color: C.blue }}>on-demand</span>, in every district.
            </h1>
            <p
              style={{
                fontSize: 15,
                color: C.slate,
                marginBottom: 20,
                maxWidth: 440
              }}
            >
              ParkSpot connects drivers with verified spaces featuring live CCTV, digital
              access codes and built‑in insurance coverage — all in one modern interface.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                onClick={onGetStarted}
                className="btnPrimary"
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: C.blue,
                  color: C.white,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Start as driver
              </button>
              <button
                onClick={onGetStarted}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                List a space
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 12,
                color: C.slateL
              }}
            >
              <span>Live CCTV coverage</span>
              <span>Instant digital access codes</span>
              <span>ParkSpot insurance included</span>
            </div>
          </div>
          <div
            className="fadeUp cardHover"
            style={{
              flex: '1 1 320px',
              maxWidth: 420,
              background: C.navy,
              borderRadius: 20,
              padding: 18,
              color: C.white,
              border: `1px solid rgba(255,255,255,0.12)`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 0% 0%, rgba(19,84,249,0.36), transparent 55%)'
              }}
            />
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                    color: 'rgba(255,255,255,0.72)'
                  }}
                >
                  Live space preview
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(222,47,47,0.16)',
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
                  REC
                </span>
              </div>
              <div
                className="scanline gridOverlay targetCorners"
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.14)',
                  padding: 10,
                  backgroundImage:
                    'url(https://images.unsplash.com/photo-1503503731557-473c47e087f8?w=900&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: 190,
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 10,
                    fontSize: 11,
                    padding: '3px 7px',
                    borderRadius: 999,
                    background: 'rgba(8,13,24,0.78)'
                  }}
                >
                  Secured Underground Garage · LIVE
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
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8
                  }}
                >
                  <Video size={16} />
                  <span style={{ fontSize: 13 }}>
                    Live CCTV feed from every space
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8
                  }}
                >
                  <ShieldCheck size={16} />
                  <span style={{ fontSize: 13 }}>
                    Insurance certificate generated for each booking
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <KeyRound size={16} />
                  <span style={{ fontSize: 13 }}>
                    Time‑bound digital access codes on confirmation
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="fadeUp" style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: 22,
              marginBottom: 8
            }}
          >
            How ParkSpot works
          </h2>
          <p style={{ fontSize: 14, color: C.slate, marginBottom: 20 }}>
            Three simple steps to park with live visibility and built‑in protection.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            {[
              {
                title: 'Create your secure account',
                body: 'Sign up as a driver or host with hardened authentication and activity logging.',
                step: '01'
              },
              {
                title: 'Find & preview a space',
                body: 'Filter by location and type, then inspect live CCTV feeds before booking.',
                step: '02'
              },
              {
                title: 'Park with a digital code',
                body: 'Receive a unique ParkSpot access code for every session, backed by insurance.',
                step: '03'
              }
            ].map((item, idx) => (
              <div
                key={item.step}
                className="cardHover"
                style={{
                  flex: '1 1 220px',
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: 16,
                  animationDelay: `${0.05 * idx}s`
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.slateL,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                    marginBottom: 6
                  }}
                >
                  Step {item.step}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 6
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: 13, color: C.slate }}>{item.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer
        style={{
          padding: '16px 26px 26px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: C.slateL
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo />
          <span>© {new Date().getFullYear()} ParkSpot. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: C.slateL
            }}
          >
            Privacy
          </button>
          <button
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: C.slateL
            }}
          >
            Terms
          </button>
          <button
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: C.slateL
            }}
          >
            Contact
          </button>
        </div>
      </footer>
    </div>
  );
}

