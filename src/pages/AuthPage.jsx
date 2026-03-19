import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Logo } from '../components/Logo.jsx';
import { Field } from '../components/Field.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { auth, db } from '../firebase.js';
import {
  doc,
  serverTimestamp,
  setDoc,
  addDoc,
  collection
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  Car,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  LockKeyhole,
  Clock
} from 'lucide-react';

export function AuthPage({ initialMode = 'signup', onRouteChange }) {
  const [mode, setMode] = useState(initialMode);
  const { signUp, setProfile } = useAuth();
  const [signup, setSignup] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'driver'
  });
  const [signin, setSignin] = useState({
    email: '',
    password: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signinError, setSigninError] = useState('');
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [failCount, setFailCount] = useState(0);

  const now = Date.now();
  const remainingLockMs = lockoutUntil ? lockoutUntil - now : 0;

  const passwordStrength = useMemo(() => {
    const pw = signup.password || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = [C.red, C.red, C.amber, '#D4B800', C.green, '#0B7A46'];
    return {
      score,
      label: labels[score] || 'Weak',
      color: colors[score] || C.red
    };
  }, [signup.password]);

  const updateSignup = (field, value) =>
    setSignup((s) => ({ ...s, [field]: value }));
  const updateSignin = (field, value) =>
    setSignin((s) => ({ ...s, [field]: value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    const name = signup.name.trim();
    const email = signup.email.trim().toLowerCase();
    const phone = signup.phone.replace(/\D/g, '');
    if (!name || !email || !phone || !signup.password) {
      setSignupError('Please fill in all fields.');
      return;
    }
    if (!/^(\d{10})$/.test(phone)) {
      setSignupError('Enter a valid 10‑digit Indian mobile number.');
      return;
    }
    if (passwordStrength.score < 3) {
      setSignupError('Please choose a stronger password (Good or better).');
      return;
    }
    try {
      const user = await signUp({
        fullName: name,
        email,
        password: signup.password,
        phone: `+91${phone}`,
        role: signup.role
      });
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, 'users', user.uid), {
        fullName: name,
        email,
        phone: `+91${phone}`,
        role: signup.role,
        kycStatus: 'pending',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        event: 'SIGNUP',
        detail: signup.role,
        createdAt: serverTimestamp()
      });
      setProfile({
        fullName: name,
        email,
        phone: `+91${phone}`,
        role: signup.role,
        kycStatus: 'pending'
      });
      if (onRouteChange) onRouteChange('/kyc');
    } catch (err) {
      setSignupError(err.message || 'Could not create account.');
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setSigninError('');
    if (lockoutUntil && lockoutUntil > Date.now()) {
      setSigninError('Too many attempts. Please wait before trying again.');
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        signin.email.trim().toLowerCase(),
        signin.password
      );
      const uid = cred.user.uid;
      const userDoc = doc(db, 'users', uid);
      const snap = await (await import('firebase/firestore')).getDoc(userDoc);
      let data = snap.exists() ? snap.data() : null;
      if (!data) {
        data = {
          fullName: cred.user.displayName || '',
          email: cred.user.email,
          phone: '',
          role: 'driver',
          kycStatus: 'pending'
        };
      }
      setProfile(data);
      await addDoc(collection(db, 'audit_logs'), {
        userId: uid,
        event: 'LOGIN',
        detail: '',
        createdAt: serverTimestamp()
      });
      const status = data.kycStatus || 'pending';
      if (status === 'verified') {
        if (onRouteChange) onRouteChange('/browse');
      } else if (status === 'rejected') {
        if (onRouteChange) onRouteChange('/kyc');
      } else {
        if (onRouteChange) onRouteChange('/kyc-status');
      }
      setFailCount(0);
      setLockoutUntil(null);
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setSigninError('No account with this email.');
      } else if (code === 'auth/wrong-password') {
        setSigninError('Incorrect password.');
      } else if (code === 'auth/too-many-requests') {
        setSigninError('Too many attempts. Try again later.');
      } else {
        setSigninError('Could not sign in. Please try again.');
      }
      const nextCount = failCount + 1;
      setFailCount(nextCount);
      if (nextCount >= 5) {
        setLockoutUntil(Date.now() + 15 * 60 * 1000);
      }
    }
  };

  const strengthBarWidth = `${(passwordStrength.score / 5) * 100}%`;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 26
      }}
    >
      <div
        className="fadeUp"
        style={{
          flex: '0 1 420px',
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 22,
          marginRight: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        <Logo />
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: C.navy,
            color: C.white
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
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Park Smarter. Earn from your space.
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(18,160,92,0.2)',
                fontSize: 11,
                color: '#B5F5CF'
              }}
            >
              <ShieldCheck size={14} />
              Aadhaar & UPI verified
            </div>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 8
            }}
          >
            Drivers find secure, verified spots across India. Hosts earn from unused parking with
            Aadhaar‑verified renters and instant UPI payouts.
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              color: 'rgba(255,255,255,0.9)'
            }}
          >
            <li>UPI QR payments with instant confirmation</li>
            <li>Identity verification with Aadhaar and licence</li>
            <li>Insurance certificate for every booking</li>
          </ul>
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: C.blueSoft,
            border: `1px solid ${C.blueLight}`,
            fontSize: 12,
            color: C.slate
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4
            }}
          >
            <LockKeyhole size={14} />
            <span>Security first</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Firebase Authentication with email + phone OTP.</li>
            <li>Aadhaar stored encrypted client‑side before upload.</li>
            <li>KYC docs locked behind strict Firebase rules.</li>
          </ul>
        </div>
      </div>
      <div
        className="fadeUp"
        style={{
          flex: '0 1 420px',
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 22
        }}
      >
        <div
          style={{
            display: 'flex',
            borderRadius: 999,
            padding: 3,
            background: C.bg,
            marginBottom: 16
          }}
        >
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              background: mode === 'signup' ? C.white : 'transparent',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Sign up
          </button>
          <button
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              background: mode === 'signin' ? C.white : 'transparent',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Sign in
          </button>
        </div>
        {mode === 'signup' ? (
          <form onSubmit={handleSignup}>
            <Field label="Full name" required>
              <input
                type="text"
                value={signup.name}
                onChange={(e) => updateSignup('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={signup.email}
                onChange={(e) => updateSignup('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Mobile number" required hint="+91 Indian mobile only">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    fontSize: 13
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  value={signup.phone}
                  onChange={(e) =>
                    updateSignup('phone', e.target.value.replace(/\D/g, ''))
                  }
                  maxLength={10}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13
                  }}
                />
              </div>
            </Field>
            <Field label="Password" required>
              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  value={signup.password}
                  onChange={(e) => updateSignup('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div
                style={{
                  marginTop: 6
                }}
              >
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: C.bg,
                    overflow: 'hidden',
                    marginBottom: 4
                  }}
                >
                  <div
                    style={{
                      width: strengthBarWidth,
                      height: '100%',
                      background: passwordStrength.color,
                      transition: 'width 0.18s ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: passwordStrength.color
                  }}
                >
                  Strength: {passwordStrength.label}
                </div>
              </div>
            </Field>
            <Field label="I am signing up as" required>
              <div
                style={{
                  display: 'flex',
                  gap: 10
                }}
              >
                <button
                  type="button"
                  onClick={() => updateSignup('role', 'driver')}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border:
                      signup.role === 'driver'
                        ? `2px solid ${C.blue}`
                        : `1px solid ${C.border}`,
                    background:
                      signup.role === 'driver' ? C.blueSoft : C.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4
                    }}
                  >
                    <Car size={16} />
                    <span style={{ fontWeight: 600 }}>I want to park</span>
                  </div>
                  <div style={{ color: C.slateL }}>
                    Find verified spots across Indian cities.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateSignup('role', 'host')}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border:
                      signup.role === 'host'
                        ? `2px solid ${C.blue}`
                        : `1px solid ${C.border}`,
                    background:
                      signup.role === 'host' ? C.blueSoft : C.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4
                    }}
                  >
                    <Building2 size={16} />
                    <span style={{ fontWeight: 600 }}>I own a space</span>
                  </div>
                  <div style={{ color: C.slateL }}>
                    List driveways, garages or commercial parking.
                  </div>
                </button>
              </div>
            </Field>
            {signupError && (
              <div
                className="shake"
                style={{
                  marginTop: 6,
                  marginBottom: 6,
                  fontSize: 12,
                  color: C.red,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: C.redBg
                }}
              >
                {signupError}
              </div>
            )}
            <button
              type="submit"
              className="btnPrimary"
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignin}>
            <Field label="Email" required>
              <input
                type="email"
                value={signin.email}
                onChange={(e) => updateSignin('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Password" required>
              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  value={signin.password}
                  onChange={(e) => updateSignin('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            {signinError && (
              <div
                className="shake"
                style={{
                  marginTop: 6,
                  marginBottom: 6,
                  fontSize: 12,
                  color: C.red,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: C.redBg
                }}
              >
                {signinError}
              </div>
            )}
            {remainingLockMs > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: C.amber,
                  marginBottom: 4
                }}
              >
                <Clock size={14} />
                <span>
                  Locked due to repeated attempts. Try again in{' '}
                  {Math.ceil(remainingLockMs / 1000 / 60)} min.
                </span>
              </div>
            )}
            <button
              type="submit"
              className="btnPrimary"
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Logo } from '../components/Logo.jsx';
import { Field } from '../components/Field.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { sGet, sSet, auditLog } from '../storage.js';
import { hashPw, verifyPw, pwStrength, clean, genToken } from '../security.js';
import { hit } from '../rateLimiter.js';
import { User, ShieldCheck, Car, ParkingSquare, Eye, EyeOff, Clock } from 'lucide-react';

export function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'driver'
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lockoutMs, setLockoutMs] = useState(0);

  const strength = useMemo(() => pwStrength(form.password), [form.password]);

  React.useEffect(() => {
    if (!lockoutMs) return;
    const id = setInterval(() => {
      setLockoutMs((prev) => {
        if (prev <= 1000) {
          clearInterval(id);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutMs]);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const doSignup = async (e) => {
    e.preventDefault();
    setError('');
    const name = clean(form.name, 80);
    const email = clean(form.email.toLowerCase(), 120);
    const pw = form.password;
    const confirm = form.confirm;
    if (!name || !email || !pw || !confirm) {
      setError('All fields are required.');
      return;
    }
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (strength.score < 2) {
      setError('Please choose a stronger password.');
      return;
    }
    const users = sGet('ps:users', []);
    if (users.some((u) => u.email === email)) {
      setError('An account with this email already exists.');
      return;
    }
    const pwHash = await hashPw(pw);
    const id = crypto.randomUUID();
    const sessionToken = genToken();
    const now = new Date().toISOString();
    const user = {
      id,
      name,
      email,
      pwHash,
      role: form.role,
      sessionToken,
      createdAt: now
    };
    sSet('ps:users', [...users, user]);
    sSet('ps:session', sessionToken);
    auditLog(id, 'signup', `Created ${form.role} account`);
    auditLog(id, 'login', 'First login after signup');
    onAuthSuccess(user);
  };

  const doSignin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const email = clean(form.email.toLowerCase(), 120);
    const pw = form.password;
    if (lockoutMs > 0) {
      setLoginError('Too many attempts. Please wait before trying again.');
      return;
    }
    const rl = hit('login', email);
    if (!rl.allowed) {
      setLockoutMs(rl.resetInMs);
      setLoginError('Too many login attempts. Please wait before trying again.');
      return;
    }
    const users = sGet('ps:users', []);
    const user = users.find((u) => u.email === email);
    if (!user) {
      setLoginError('Invalid email or password.');
      return;
    }
    const ok = await verifyPw(pw, user.pwHash);
    if (!ok) {
      setLoginError('Invalid email or password.');
      return;
    }
    const sessionToken = genToken();
    const updated = users.map((u) =>
      u.id === user.id ? { ...u, sessionToken } : u
    );
    sSet('ps:users', updated);
    sSet('ps:session', sessionToken);
    auditLog(user.id, 'login', 'User signed in');
    onAuthSuccess({ ...user, sessionToken });
  };

  const strengthColors = ['#D43B3B', '#D43B3B', '#E07B00', '#12A05C', '#12A05C', '#1354F9'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 26
      }}
    >
      <div
        className="fadeUp"
        style={{
          flex: '0 1 420px',
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 22,
          marginRight: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        <Logo />
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: C.navy,
            color: C.white,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 0% 0%, rgba(19,84,249,0.4), transparent 55%)'
            }}
          />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                Park smarter, not longer.
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(18,160,92,0.12)',
                  fontSize: 11,
                  color: '#9FF2C4'
                }}
              >
                <ShieldCheck size={13} />
                End‑to‑end encrypted
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 12
              }}
            >
              Drivers get instant access to verified spaces. Hosts earn more from underused
              parking with live monitoring and built‑in insurance.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 10,
                fontSize: 11,
                color: 'rgba(255,255,255,0.84)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 4 }}>Drivers</div>
                <div>Search, preview CCTV and pay securely in seconds.</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 4 }}>Hosts</div>
                <div>Turn idle spaces into predictable monthly revenue.</div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: C.blueSoft,
            border: `1px solid ${C.blueLight}`,
            fontSize: 12,
            color: C.slate
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Security highlights</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>SHA-256 password hashing with per-user salts.</li>
            <li>Rotating session tokens and local activity audit log.</li>
            <li>Rate limited login and booking flows.</li>
          </ul>
        </div>
      </div>
      <div
        className="fadeUp"
        style={{
          flex: '0 1 420px',
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 22
        }}
      >
        <div
          style={{
            display: 'flex',
            borderRadius: 999,
            padding: 3,
            background: C.bg,
            marginBottom: 16
          }}
        >
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              background: mode === 'signup' ? C.white : 'transparent',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Sign up
          </button>
          <button
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              background: mode === 'signin' ? C.white : 'transparent',
              fontSize: 13,
              fontWeight: 500
            }}
          >
            Sign in
          </button>
        </div>
        {mode === 'signup' ? (
          <form onSubmit={doSignup}>
            <Field label="Full name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field
              label="Password"
              required
              hint="At least 8 characters recommended"
            >
              <div
                style={{
                  position: 'relative'
                }}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 30px 8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div
                style={{
                  marginTop: 6
                }}
              >
                <div
                  style={{
                    height: 6,
                    borderRadius: 999,
                    background: C.bg,
                    overflow: 'hidden',
                    marginBottom: 4
                  }}
                >
                  <div
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      height: '100%',
                      background: strengthColors[strength.score],
                      transition: 'width 0.18s ease'
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color:
                      strength.score >= 3
                        ? C.green
                        : strength.score >= 2
                        ? C.amber
                        : C.red
                  }}
                >
                  Password strength: {strength.label}
                </div>
              </div>
            </Field>
            <Field label="Confirm password" required>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => onChange('confirm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Role" required>
              <div
                style={{
                  display: 'flex',
                  gap: 10
                }}
              >
                <button
                  type="button"
                  onClick={() => onChange('role', 'driver')}
                  className="cardHover"
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border:
                      form.role === 'driver'
                        ? `2px solid ${C.blue}`
                        : `1px solid ${C.border}`,
                    background:
                      form.role === 'driver' ? C.blueSoft : C.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4
                    }}
                  >
                    <Car size={14} />
                    <span style={{ fontWeight: 600 }}>Driver</span>
                  </div>
                  <div style={{ color: C.slateL }}>
                    Find and monitor secure parking.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('role', 'host')}
                  className="cardHover"
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border:
                      form.role === 'host'
                        ? `2px solid ${C.blue}`
                        : `1px solid ${C.border}`,
                    background:
                      form.role === 'host' ? C.blueSoft : C.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4
                    }}
                  >
                    <ParkingSquare size={14} />
                    <span style={{ fontWeight: 600 }}>Host</span>
                  </div>
                  <div style={{ color: C.slateL }}>
                    List and manage your spaces.
                  </div>
                </button>
              </div>
            </Field>
            {error && (
              <div
                className="shake"
                style={{
                  marginTop: 6,
                  marginBottom: 6,
                  fontSize: 12,
                  color: C.red,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: C.redBg
                }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btnPrimary"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={doSignin}>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            {loginError && (
              <div
                className="shake"
                style={{
                  marginTop: 6,
                  marginBottom: 6,
                  fontSize: 12,
                  color: C.red,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: C.redBg
                }}
              >
                {loginError}
              </div>
            )}
            {lockoutMs > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: C.amber,
                  marginBottom: 4
                }}
              >
                <Clock size={14} />
                <span>
                  Locked out for{' '}
                  {Math.ceil(lockoutMs / 1000)}s due to repeated attempts.
                </span>
              </div>
            )}
            <button
              type="submit"
              className="btnPrimary"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

