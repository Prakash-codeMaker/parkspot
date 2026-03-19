import React from 'react';
import { C } from '../tokens.js';
import { Logo } from '../components/Logo.jsx';
import { FileDown, X } from 'lucide-react';

function genCertNumber() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `PSC-${rand}`;
}

export function InsuranceCertModal({ booking, onClose }) {
  if (!booking) return null;
  const certNumber = genCertNumber();
  const issuedDate = new Date(booking.bookedAt).toLocaleDateString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,13,24,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div
        className="zoomIn"
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: C.bg,
          borderRadius: 20,
          padding: 16,
          border: `1px solid ${C.border}`
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10
          }}
        >
          <h3
            style={{
              fontSize: 18
            }}
          >
            Insurance certificate
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                border: 'none',
                background: C.green,
                color: C.white,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <FileDown size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                borderRadius: 999,
                border: 'none',
                padding: 4,
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 18px 40px rgba(11,29,53,0.18)'
          }}
        >
          <div
            style={{
              background: C.navy,
              color: C.white,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Logo variant="dark" />
            <div
              style={{
                textAlign: 'right',
                fontSize: 11
              }}
            >
              <div
                style={{
                  marginBottom: 4
                }}
              >
                VEHICLE SECURITY & PARKING INSURANCE CERTIFICATE
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8
                }}
              >
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: C.green,
                    color: C.navy,
                    fontWeight: 600
                  }}
                >
                  VERIFIED COVERAGE
                </span>
                <span>Certificate No. {certNumber}</span>
              </div>
            </div>
          </div>
          <div
            style={{
              position: 'relative',
              padding: 16
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                opacity: 0.08,
                transform: 'rotate(-18deg)'
              }}
            >
              <span
                style={{
                  fontSize: 80,
                  fontWeight: 700,
                  color: C.blue
                }}
              >
                VALID
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 12
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: C.bg,
                  fontSize: 12
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    color: C.slateL,
                    marginBottom: 4
                  }}
                >
                  Policyholder
                </div>
                <div style={{ fontWeight: 600 }}>{booking.userName || 'ParkSpot member'}</div>
                <div>{booking.userEmail}</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: C.slateL
                  }}
                >
                  Account ID: {booking.userId}
                  <br />
                  Member since:{' '}
                  {booking.userCreatedAt
                    ? new Date(booking.userCreatedAt).toLocaleDateString()
                    : issuedDate}
                </div>
              </div>
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: C.bg,
                  fontSize: 12
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    color: C.slateL,
                    marginBottom: 4
                  }}
                >
                  Parking session
                </div>
                <div style={{ fontWeight: 600 }}>{booking.listingTitle}</div>
                <div>{booking.location}</div>
                <div>{booking.address}</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: C.slateL
                  }}
                >
                  Date: {new Date(booking.date).toLocaleString()}
                  <br />
                  Duration: {booking.duration} hours
                  <br />
                  Access code: {booking.accessCode}
                  <br />
                  Booking ref: {booking.id}
                  <br />
                  Total paid: ${booking.total.toFixed(2)}
                </div>
              </div>
            </div>
            <div
              style={{
                marginBottom: 10
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  color: C.slateL,
                  marginBottom: 4
                }}
              >
                Coverage included
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                  gap: 8,
                  fontSize: 12
                }}
              >
                {[
                  'Vehicle Damage Protection — Up to $50,000',
                  'Theft Protection — Full replacement',
                  '24/7 CCTV Monitoring — All sessions',
                  'Secure Access Control — Digital code system',
                  'Liability Coverage — Up to $1,000,000',
                  'ParkSpot Guarantee — 100% refund if issue'
                ].map((text) => (
                  <div
                    key={text}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: C.greenBg,
                      color: C.green
                    }}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              background: C.navy,
              color: '#fff',
              padding: 10,
              fontSize: 11
            }}
          >
            Certificate policy: PS‑SEC‑2026 · This document confirms that the above parking
            session is covered by ParkSpot&apos;s integrated protection programme for the
            duration specified. Valid only when generated via the ParkSpot application for
            an active booking.
            <br />
            ParkSpot Technologies Ltd · Registered entity · All rights reserved.
          </div>
          <div
            style={{
              background: C.bg,
              padding: 8,
              fontSize: 11,
              textAlign: 'center',
              color: C.slate
            }}
          >
            Digitally issued by ParkSpot · {issuedDate} · Verify at{' '}
            <span style={{ color: C.blue }}>https://verify.parkspot.app</span>
          </div>
        </div>
      </div>
    </div>
  );
}

