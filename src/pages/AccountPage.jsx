import React, { useEffect, useState } from 'react';
import { C } from '../tokens.js';
import { Avatar } from '../components/Avatar.jsx';
import { Field } from '../components/Field.jsx';
import { auditLog, sGet, sSet } from '../storage.js';
import { clean, hashPw, verifyPw } from '../security.js';

export function AccountPage({ user, setUser, onSignOut }) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: ''
  });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    setAudit(sGet(`ps:audit:${user.id}`, []));
  }, [user.id]);

  const onProfileChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const saveProfile = () => {
    const name = clean(profile.name, 80);
    const email = clean(profile.email.toLowerCase(), 120);
    if (!name || !email) return;
    const users = sGet('ps:users', []);
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, name, email } : u
    );
    sSet('ps:users', updatedUsers);
    const updatedUser = { ...user, name, email };
    setUser(updatedUser);
    auditLog(user.id, 'profile', 'Updated profile details');
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1200);
  };

  const savePassword = async () => {
    setPwError('');
    setPwSaved(false);
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('Please fill in all password fields.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    const users = sGet('ps:users', []);
    const existing = users.find((u) => u.id === user.id);
    const ok = await verifyPw(pwForm.current, existing.pwHash);
    if (!ok) {
      setPwError('Current password is incorrect.');
      return;
    }
    const pwHash = await hashPw(pwForm.next);
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, pwHash } : u
    );
    sSet('ps:users', updatedUsers);
    auditLog(user.id, 'password', 'Changed account password');
    setPwForm({ current: '', next: '', confirm: '' });
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 1200);
  };

  const recentAudit = audit.slice(0, 10);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Account & security</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Manage your profile, credentials and recent activity.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 340px) minmax(0, 260px)',
          gap: 18,
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: 14
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12
            }}
          >
            <Avatar name={user.name} size={40} />
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.slateL,
                  textTransform: 'capitalize'
                }}
              >
                {user.role} · Member since{' '}
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Field label="Name">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onProfileChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => onProfileChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <button
            type="button"
            onClick={saveProfile}
            className="btnPrimary"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: C.blue,
              color: C.white,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 8
            }}
          >
            Save changes
          </button>
          {profileSaved && (
            <div
              style={{
                fontSize: 11,
                color: C.green
              }}
            >
              Profile updated.
            </div>
          )}
          <hr
            style={{
              margin: '12px 0',
              border: 'none',
              borderTop: `1px solid ${C.border}`
            }}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6
            }}
          >
            Change password
          </div>
          <Field label="Current password">
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, current: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, next: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirm: e.target.value }))
              }
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          {pwError && (
            <div
              className="shake"
              style={{
                fontSize: 12,
                color: C.red,
                marginBottom: 4
              }}
            >
              {pwError}
            </div>
          )}
          <button
            type="button"
            onClick={savePassword}
            className="btnPrimary"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: 'none',
              background: C.blue,
              color: C.white,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 6
            }}
          >
            Update password
          </button>
          {pwSaved && (
            <div
              style={{
                fontSize: 11,
                color: C.green
              }}
            >
              Password updated.
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 12,
              fontSize: 12,
              maxHeight: 260,
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6
              }}
            >
              Recent activity
            </div>
            {recentAudit.length === 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: C.slate
                }}
              >
                No recent events recorded yet.
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {recentAudit.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    background: C.bg
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  >
                    {a.ev}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate
                    }}
                  >
                    {a.detail}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.slateL,
                      marginTop: 2
                    }}
                  >
                    {new Date(a.ts).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              background: C.redBg,
              color: C.red,
              padding: 12,
              fontSize: 12
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6
              }}
            >
              Sign out
            </div>
            <p
              style={{
                marginTop: 0,
                marginBottom: 8
              }}
            >
              Signing out clears your active session token from this device.
            </p>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: 'none',
                background: C.red,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Sign out of ParkSpot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

