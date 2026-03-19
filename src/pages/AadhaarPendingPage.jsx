import React, { useEffect, useState } from 'react';
import { C } from '../tokens.js';
import { Logo } from '../components/Logo.jsx';
import { sGet, sSet } from '../storage.js';
import {
  ShieldCheck, Clock, CheckCircle, XCircle,
  AlertCircle, ArrowRight, RefreshCw
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   AADHAAR PENDING PAGE

   Shown after signup (all users) until admin verifies Aadhaar.
   Polls localStorage every 3s so it auto-advances when approved.

   Props:
     user                    — current user object
     onVerified(updatedUser) — Aadhaar approved → go to app
     onRejected()            — Aadhaar rejected → back to signup
     onLogout()              — sign out button
════════════════════════════════════════════════════════════ */
export function AadhaarPendingPage({ user, onVerified, onRejected, onLogout }) {
  const [status,  setStatus]  = useState(user?.aadhaarStatus || 'pending');
  const [reason,  setReason]  = useState(user?.aadhaarRejectReason || '');
  const [checking,setChecking]= useState(false);

  /* Poll localStorage every 3s for admin approval */
  useEffect(() => {
    const check = () => {
      const users   = sGet('ps:users') ?? [];
      const current = users.find(u => u.id === user?.id);
      if (!current) return;
      if (current.aadhaarStatus !== status) {
        setStatus(current.aadhaarStatus);
        setReason(current.aadhaarRejectReason || '');
        if (current.aadhaarStatus === 'verified') {
          onVerified(current);
        } else if (current.aadhaarStatus === 'rejected') {
          // stay on page, show rejection reason
        }
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [user?.id, status]); // eslint-disable-line

  const maskedAadhaar = user?.aadhaarHash
    ? `XXXX XXXX ${user.aadhaarHash}`
    : 'XXXX XXXX XXXX';

  /* ── DEV: Simulate admin approval ── */
  const simulateApprove = () => {
    const users   = sGet('ps:users') ?? [];
    const updated = { ...user, aadhaarStatus: 'verified' };
    sSet('ps:users', users.map(u => u.id === user.id ? updated : u));
    setStatus('verified');
    onVerified(updated);
  };

  const simulateReject = () => {
    const users   = sGet('ps:users') ?? [];
    const updated = { ...user, aadhaarStatus: 'rejected', aadhaarRejectReason: 'Aadhaar number could not be verified. Please check the number and try again.' };
    sSet('ps:users', users.map(u => u.id === user.id ? updated : u));
    setStatus('rejected');
    setReason(updated.aadhaarRejectReason);
  };

  const manualCheck = () => {
    setChecking(true);
    setTimeout(() => {
      const users   = sGet('ps:users') ?? [];
      const current = users.find(u => u.id === user?.id);
      if (current?.aadhaarStatus === 'verified') {
        onVerified(current);
      } else if (current?.aadhaarStatus === 'rejected') {
        setStatus('rejected');
        setReason(current.aadhaarRejectReason || '');
      }
      setChecking(false);
    }, 800);
  };

  /* ── Status configs ── */
  const configs = {
    pending: {
      icon: Clock,
      iconBg: '#FFF5E6',
      iconBorder: '#F5C97A',
      iconColor: '#E07B00',
      title: 'Aadhaar Verification Pending',
      subtitle: 'Your Aadhaar details have been submitted and are awaiting verification by our team.',
    },
    under_review: {
      icon: ShieldCheck,
      iconBg: C.blueSoft,
      iconBorder: C.blueLight,
      iconColor: C.blue,
      title: 'Aadhaar Under Review',
      subtitle: 'Our team is actively reviewing your Aadhaar details. This usually takes a few minutes.',
    },
    verified: {
      icon: CheckCircle,
      iconBg: C.greenBg,
      iconBorder: '#A7F0CC',
      iconColor: C.green,
      title: 'Aadhaar Verified!',
      subtitle: 'Your identity has been confirmed. Redirecting you to the app…',
    },
    rejected: {
      icon: XCircle,
      iconBg: C.redBg,
      iconBorder: '#FECDCD',
      iconColor: C.red,
      title: 'Aadhaar Verification Failed',
      subtitle: 'We were unable to verify your Aadhaar details.',
    },
  };

  const cfg = configs[status] || configs.pending;
  const Icon = cfg.icon;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Logo/>
      </div>

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: C.white, borderRadius: 20,
        border: `1px solid ${C.border}`, padding: 32,
        boxShadow: '0 4px 24px rgba(11,29,53,.07)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: cfg.iconBg, border: `2px solid ${cfg.iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <Icon size={34} color={cfg.iconColor} strokeWidth={1.5}/>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
          {cfg.title}
        </h2>
        <p style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, marginBottom: 20 }}>
          {cfg.subtitle}
        </p>

        {/* Aadhaar being verified */}
        {(status === 'pending' || status === 'under_review') && (
          <>
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: C.bg, border: `1px solid ${C.border}`,
              marginBottom: 16, textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, color: C.slateL, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                Aadhaar being verified
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 18,
                letterSpacing: 3, fontWeight: 700, color: C.navy,
              }}>
                {maskedAadhaar}
              </div>
              <div style={{ fontSize: 11, color: C.slateL, marginTop: 4 }}>
                Submitted as: <strong style={{ color: C.navy }}>{user?.name || 'User'}</strong> · {user?.role === 'host' ? 'Host' : 'Driver'}
              </div>
            </div>

            {/* Progress steps */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, fontSize: 12 }}>
              {['Submitted', 'Under Review', 'Verified'].map((step, i) => {
                const done   = i === 0 || (i === 1 && status === 'under_review');
                const active = i === 0 ? status === 'pending' : i === 1 ? status === 'under_review' : false;
                return (
                  <React.Fragment key={step}>
                    <span style={{
                      padding: '4px 11px', borderRadius: 999, fontWeight: 600,
                      background: done ? C.greenBg : active ? C.blueSoft : C.bg,
                      color: done ? C.green : active ? C.blue : C.slateL,
                      border: `1px solid ${done ? '#A7F0CC' : active ? C.blueLight : C.border}`,
                      fontSize: 11,
                    }}>
                      {done && '✓ '}{step}
                    </span>
                    {i < 2 && <span style={{ color: C.border }}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{
              padding: '10px 14px', borderRadius: 9,
              background: '#FFF5E6', border: '1px solid #F5C97A',
              fontSize: 12, color: '#7A4A00', marginBottom: 20,
              textAlign: 'left',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>⏱ What happens next?</div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                <li>Our team verifies your Aadhaar against government records</li>
                <li>This usually takes <strong>a few minutes</strong></li>
                <li>You'll be automatically redirected once verified</li>
                <li>If rejected, you'll see the reason here and can re-submit</li>
              </ul>
            </div>

            {/* Manual check button */}
            <button onClick={manualCheck} disabled={checking} style={{
              width: '100%', padding: '11px', borderRadius: 10,
              border: `1.5px solid ${C.border}`, background: C.white,
              fontSize: 13, fontWeight: 600, cursor: checking ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', color: C.navy, marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: checking ? .7 : 1,
            }}>
              <RefreshCw size={14} color={C.blue} strokeWidth={2}
                style={{ animation: checking ? 'aadhaar-spin .8s linear infinite' : 'none' }}/>
              {checking ? 'Checking…' : 'Check verification status'}
            </button>
            <style>{`@keyframes aadhaar-spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {/* Rejection reason + re-submit */}
        {status === 'rejected' && (
          <>
            {reason && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: '#FFF5E6', border: '1px solid #F5C97A',
                fontSize: 12, color: '#7A4A00', marginBottom: 16,
                textAlign: 'left', display: 'flex', gap: 9,
              }}>
                <AlertCircle size={16} color="#E07B00" style={{ flexShrink: 0, marginTop: 1 }}/>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>Rejection reason:</div>
                  <div style={{ lineHeight: 1.6 }}>{reason}</div>
                </div>
              </div>
            )}
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: C.bg, fontSize: 12, color: C.slate,
              marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Common reasons for rejection:</div>
              {['Aadhaar number does not match government records','Name on Aadhaar does not match signup name','Aadhaar linked to a different account'].map(r => (
                <div key={r} style={{ display: 'flex', gap: 7, marginBottom: 5, alignItems: 'flex-start' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, marginTop: 5, flexShrink: 0 }}/>
                  {r}
                </div>
              ))}
            </div>
            <button onClick={onRejected} style={{
              width: '100%', padding: '12px', borderRadius: 10,
              border: 'none', background: C.blue, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Re-register with correct Aadhaar <ArrowRight size={14}/>
            </button>
          </>
        )}

        {/* Sign out */}
        <button onClick={onLogout} style={{
          width: '100%', padding: '9px', borderRadius: 10,
          border: 'none', background: 'transparent',
          color: C.slateL, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Sign out
        </button>

        {/* ── DEV ONLY: simulate admin actions ── */}
        {(status === 'pending' || status === 'under_review') && (
          <div style={{
            marginTop: 20, padding: '12px 16px', borderRadius: 12,
            background: C.bg, border: '1px dashed #DDE3EE',
            fontSize: 12, color: C.slateL,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: C.slate }}>
              🧪 Testing — Simulate admin action
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={simulateApprove} style={{
                flex: 2, padding: '8px', borderRadius: 8, border: 'none',
                background: C.blue, color: '#fff', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              }}>
                ✓ Approve Aadhaar
              </button>
              <button onClick={simulateReject} style={{
                flex: 1, padding: '8px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: '#fff',
                color: C.red, cursor: 'pointer', fontSize: 12,
                fontFamily: 'inherit',
              }}>
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: C.slateL, marginTop: 16, textAlign: 'center' }}>
        Need help? Contact us at <strong>support@parkspot.in</strong>
      </p>
    </div>
  );
}