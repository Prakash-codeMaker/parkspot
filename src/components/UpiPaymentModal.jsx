import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { C } from '../tokens.js';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STEP_QR = 1;
const STEP_WAITING = 2;
const STEP_DONE = 3;

export function UpiPaymentModal({ bookingId, amount, open, onClose, onConfirmed }) {
  const [step, setStep] = useState(STEP_QR);
  const [remaining, setRemaining] = useState(600); // seconds
  const [expired, setExpired] = useState(false);
  const [utr, setUtr] = useState('');

  const upiId = import.meta.env.VITE_UPI_ID || 'parkspot@ybl';
  const upiName = import.meta.env.VITE_UPI_NAME || 'ParkSpot';

  useEffect(() => {
    if (!open) return;
    setStep(STEP_QR);
    setRemaining(600);
    setExpired(false);
    setUtr('');
  }, [open, bookingId, amount]);

  useEffect(() => {
    if (!open || step !== STEP_QR || expired) return;
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const id = setInterval(() => {
      setRemaining((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [open, step, remaining, expired]);

  useEffect(() => {
    if (!open || step !== STEP_WAITING) return;
    const id = setTimeout(() => {
      setStep(STEP_DONE);
      onConfirmed({
        transactionId: utr || null
      });
    }, 3000);
    return () => clearTimeout(id);
  }, [open, step, utr, onConfirmed]);

  const upiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: upiName,
      am: String(amount),
      cu: 'INR',
      tn: `ParkSpot-${bookingId || ''}`
    }).toString();
    return `upi://pay?${params}`;
  }, [upiId, upiName, amount, bookingId]);

  const appLinks = useMemo(() => {
    const qp = upiUrl.split('upi://pay?')[1] || '';
    return {
      gpay: `tez://upi/pay?${qp}`,
      phonepe: `phonepe://pay?${qp}`,
      paytm: `paytmmp://pay?${qp}`,
      bhim: `upi://pay?${qp}`
    };
  }, [upiUrl]);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  if (!open) return null;

  return (
    <div
      className="fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,13,24,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60
      }}
    >
      <div
        className="zoomIn"
        style={{
          width: '100%',
          maxWidth: 520,
          background: C.white,
          borderRadius: 20,
          padding: 16,
          border: `1px solid ${C.border}`
        }}
      >
        {step === STEP_QR && (
          <>
            <h3
              style={{
                fontSize: 18,
                marginBottom: 8
              }}
            >
              Pay via UPI
            </h3>
            <p
              style={{
                fontSize: 13,
                color: C.slate,
                marginBottom: 10
              }}
            >
              Scan the QR code with your UPI app or tap one of the quick‑launch buttons below to pay securely.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 16,
                  background: C.bg
                }}
              >
                <QRCodeSVG
                  value={upiUrl}
                  size={220}
                  level="H"
                  imageSettings={{
                    src: '/logo.png',
                    width: 40,
                    height: 40,
                    excavate: true
                  }}
                />
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 8,
                fontSize: 13
              }}
            >
              <div
                style={{
                  marginBottom: 2
                }}
              >
                Payable amount
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.blue
                }}
              >
                ₹{amount}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: C.slateL
                }}
              >
                UPI ID:&nbsp;
                <strong>{upiId}</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10
              }}
            >
              {[
                { key: 'gpay', label: 'GPay', bg: C.white, color: '#4285F4' },
                { key: 'phonepe', label: 'PhonePe', bg: '#5F259F', color: C.white },
                { key: 'paytm', label: 'Paytm', bg: '#043F8C', color: C.white },
                { key: 'bhim', label: 'BHIM', bg: '#F58634', color: C.white }
              ].map((app) => (
                <div key={app.key} style={{ textAlign: 'center', fontSize: 11 }}>
                  <a
                    href={appLinks[app.key]}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 60,
                      height: 60,
                      borderRadius: 14,
                      boxShadow: '0 8px 18px rgba(11,29,53,0.18)',
                      background: app.bg,
                      color: app.color,
                      textDecoration: 'none',
                      fontWeight: 700,
                      marginBottom: 4
                    }}
                  >
                    {app.label === 'GPay' ? 'G' : app.label === 'PhonePe' ? 'Pe' : app.label}
                  </a>
                  <div>{app.label}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                marginBottom: 10
              }}
            >
              <span
                style={{
                  color: expired ? C.red : C.slate
                }}
              >
                QR expires in{' '}
                <strong>
                  {minutes}:{seconds}
                </strong>
              </span>
              {expired && (
                <button
                  type="button"
                  onClick={() => {
                    setRemaining(600);
                    setExpired(false);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Generate new QR
                </button>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(STEP_WAITING)}
                className="btnPrimary"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: C.blue,
                  color: C.white,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                I&apos;ve paid
              </button>
            </div>
          </>
        )}
        {step === STEP_WAITING && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Loader2
              className="spin"
              size={40}
              color={C.blue}
              style={{ marginBottom: 10 }}
            />
            <h3
              style={{
                fontSize: 18,
                marginBottom: 6
              }}
            >
              Verifying your payment...
            </h3>
            <p
              style={{
                fontSize: 13,
                color: C.slate,
                textAlign: 'center',
                marginBottom: 10
              }}
            >
              This usually takes just a few seconds. You can optionally paste your UPI transaction ID (UTR) below.
            </p>
            <input
              type="text"
              placeholder="Optional: UPI transaction / UTR ID"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                marginBottom: 8
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: C.slateL,
                textAlign: 'center'
              }}
            >
              If amount was deducted but booking not confirmed, contact support with your UTR number.
            </p>
          </div>
        )}
        {step === STEP_DONE && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: C.greenBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}
            >
              <CheckCircle2 size={34} color={C.green} />
            </div>
            <h3
              style={{
                fontSize: 18,
                marginBottom: 4,
                textAlign: 'center'
              }}
            >
              Payment successful!
            </h3>
            <p
              style={{
                fontSize: 13,
                color: C.slate,
                textAlign: 'center',
                marginBottom: 8
              }}
            >
              ₹{amount} paid via UPI. Your booking is now confirmed with a secure access code.
            </p>
            <p
              style={{
                fontSize: 12,
                color: C.green,
                textAlign: 'center',
                marginBottom: 10
              }}
            >
              Insurance certificate will be available in My Bookings.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btnPrimary"
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

