import { useEffect, useState } from 'react';
import { auth, db } from '../firebase.js';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(fbUser);
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signUp = async ({ fullName, email, password, phone, role }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    const userDoc = {
      fullName,
      email,
      phone,
      role,
      kycStatus: 'pending',
      kycRejectionReason: '',
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', cred.user.uid), userDoc);
    setProfile(userDoc);
    return cred.user;
  };

  const signIn = async ({ email, password }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  };

  const logout = () => signOut(auth);

  return { user, profile, setProfile, loading, signUp, signIn, logout };
}

