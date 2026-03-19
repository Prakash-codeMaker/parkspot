import React, { useEffect, useState } from 'react';
import { C } from '../tokens.js';
import { useAuth } from '../hooks/useAuth.js';
import { db } from '../firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, Hourglass, Search, ShieldCheck, XCircle, AlertCircle, MapPin } from 'lucide-react';

export function KYCStatusPage({ onRouteChange }) {
  const { user, profile, setProfile } = useAuth();
  const [status, setStatus] = useState(profile?.kycStatus || 'pending');
  const [reason, setReason] = useState(profile?.kycRejectionReason || '');

  useEffect(() => {
    if (!user) {
      if (onRouteChange) onRouteChange('/login');
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setStatus(data.kycStatus || 'pending');
      setReason(data.kycRejectionReason || '');
      setProfile({ ...(profile || {}), ...data });
    });
    return () => unsub();
  }, [user, onRouteChange, setProfile]);

  if (!user) return null;

  const firstName =
    (profile?.fullName || user.displayName || '').split(' ')[0] || 'there';

  const renderPending = () => (
    <>
      <Clock size={64} color={C.slateL} style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Complete your verification</h2>
      <p style={{ fontSize: 13, color: C.slate, marginBottom: 10 }}>
        You need to verify your identity to start using ParkSpot. It usually takes about 5 minutes.
      </p>
      <button
        type="button"
        onClick={() => onRouteChange && onRouteChange('/kyc')}
        className="btnPrimary"
        style={{
          padding: '9px 16px',
          borderRadius: 999,
          border: 'none',
          background: C.blue,
          color: C.white,
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Start verification →
      </button>
    </>
  );

  const renderSubmitted = () => (
    <>
      <Hourglass size={64} color={C.amber} style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Documents submitted!</h2>
      <p style={{ fontSize: 13, color: C.slate, marginBottom: 10 }}>
        We&apos;ve received your documents and will verify them within 24–48 hours.
      </p>
      <div
        style={{
          marginBottom: 10,
          fontSize: 12,
          color: C.slate
        }}
      >
        <span style={{ color: C.green }}>✓ Submitted</span> → <span>⋯ Under review</span> →{' '}
        <span>○ Verified</span>
      </div>
      <p style={{ fontSize: 12, color: C.slateL }}>
        You&apos;ll receive a notification once your KYC is verified.
      </p>
    </>
  );

  const renderUnderReview = () => (
    <>
      <Search size={64} color={C.blue} style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Under review</h2>
      <p style={{ fontSize: 13, color: C.slate, marginBottom: 10 }}>
        Our team is actively reviewing your documents to keep ParkSpot safe for everyone.
      </p>
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          background: C.bg,
          marginBottom: 10
        }}
      >
        <div
          className="pulse"
          style={{
            width: '70%',
            height: '100%',
            background: C.blue
          }}
        />
      </div>
      <div
        style={{
          marginBottom: 10,
          fontSize: 12,
          color: C.slate
        }}
      >
        <span style={{ color: C.green }}>✓ Submitted</span> →{' '}
        <span style={{ color: C.blue }}>✓ Under review</span> → <span>○ Verified</span>
      </div>
      <p style={{ fontSize: 12, color: C.slateL }}>
        We&apos;ll notify you as soon as your identity is verified.
      </p>
    </>
  );

  const renderVerified = () => (
    <>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: C.greenBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12
        }}
      >
        <ShieldCheck size={40} color={C.green} className="pulse" />
      </div>
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Identity verified!</h2>
      <p style={{ fontSize: 13, color: C.slate, marginBottom: 10 }}>
        Welcome to ParkSpot, {firstName}. You&apos;re all set to start parking or hosting spaces.
      </p>
      <button
        type="button"
        onClick={() => onRouteChange && onRouteChange('/browse')}
        className="btnPrimary"
        style={{
          padding: '9px 16px',
          borderRadius: 999,
          border: 'none',
          background: C.blue,
          color: C.white,
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Start browsing →
      </button>
    </>
  );

  const renderRejected = () => (
    <>
      <XCircle size={64} color={C.red} style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 22, marginBottom: 6 }}>Verification failed</h2>
      <div
        style={{
          marginBottom: 10,
          padding: 10,
          borderRadius: 10,
          background: C.amberBg,
          fontSize: 12,
          color: C.slate,
          display: 'flex',
          gap: 8
        }}
      >
        <AlertCircle size={18} color={C.amber} />
        <div>
          <div style={{ fontWeight: 600 }}>Rejection reason</div>
          <div>{reason || 'Details not provided.'}</div>
        </div>
      </div>
      <div
        style={{
          textAlign: 'left',
          marginBottom: 10,
          fontSize: 12,
          color: C.slate
        }}
      >
        Common issues:
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Photo is blurry or part of the document is cut off.</li>
          <li>Document is expired.</li>
          <li>Name does not match across documents.</li>
          <li>Address mismatch on utility bill.</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={() => onRouteChange && onRouteChange('/kyc')}
        className="btnPrimary"
        style={{
          padding: '9px 16px',
          borderRadius: 999,
          border: 'none',
          background: C.blue,
          color: C.white,
          fontSize: 14,
          cursor: 'pointer'
        }}
      >
        Re‑submit documents →
      </button>
    </>
  );

  let content;
  if (status === 'submitted') content = renderSubmitted();
  else if (status === 'under_review') content = renderUnderReview();
  else if (status === 'verified') content = renderVerified();
  else if (status === 'rejected') content = renderRejected();
  else content = renderPending();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 20,
          textAlign: 'center'
        }}
      >
        {content}
      </div>
    </div>
  );
}

