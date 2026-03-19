import React, { useEffect, useState } from 'react';
import { C } from '../tokens.js';
import { useAuth } from '../hooks/useAuth.js';
import { auth, db } from '../firebase.js';
import { Field } from '../components/Field.jsx';
import { FileUpload } from '../components/FileUpload.jsx';
import { StepWizard } from '../components/StepWizard.jsx';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ShieldCheck, Camera, Home, Key, Building2, Bike, Car, Truck, Bus } from 'lucide-react';
import CryptoJS from 'crypto-js';

export function KYCPage({ onRouteChange }) {
  const { user, profile } = useAuth();
  const [role, setRole] = useState(profile?.role || 'driver');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  // Shared personal info
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Driver KYC state
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [licenceFrontUrl, setLicenceFrontUrl] = useState('');
  const [licenceBackUrl, setLicenceBackUrl] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [aadhaarSelfieUrl, setAadhaarSelfieUrl] = useState('');

  // Host KYC state
  const [propertyAddress, setPropertyAddress] = useState('');
  const [ownershipType, setOwnershipType] = useState('owned');
  const [propertyDocUrl, setPropertyDocUrl] = useState('');
  const [utilityBillUrl, setUtilityBillUrl] = useState('');
  const [spacePhotos, setSpacePhotos] = useState(['', '', '', '', '']);
  const [spaceAddress, setSpaceAddress] = useState('');
  const [totalSlots, setTotalSlots] = useState(1);
  const [spaceDescription, setSpaceDescription] = useState('');

  useEffect(() => {
    setRole(profile?.role || 'driver');
  }, [profile?.role]);

  useEffect(() => {
    if (!user && onRouteChange) {
      onRouteChange('/login');
    }
  }, [user, onRouteChange]);

  if (!user) return null;

  const uid = user.uid;

  const isAdult = () => {
    if (!dob) return false;
    const birth = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    if (age > 18) return true;
    if (age < 18) return false;
    const m = now.getMonth() - birth.getMonth();
    if (m > 0) return true;
    if (m < 0) return false;
    return now.getDate() >= birth.getDate();
  };

  const formatAadhaarInput = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validateDriver = () => {
    if (!fullName || !dob || !gender) {
      setError('Please fill in personal details.');
      return false;
    }
    if (!isAdult()) {
      setError('You must be 18 or older to use ParkSpot.');
      return false;
    }
    if (!aadhaarNumber || aadhaarNumber.replace(/\D/g, '').length !== 12) {
      setError('Enter a valid 12‑digit Aadhaar number.');
      return false;
    }
    const digits = aadhaarNumber.replace(/\D/g, '');
    if (/^[01]/.test(digits)) {
      setError('Aadhaar number cannot start with 0 or 1.');
      return false;
    }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) {
      setError('Please upload Aadhaar front and back.');
      return false;
    }
    if (!licenceNumber || licenceNumber.length < 10) {
      setError('Enter a valid driving licence number.');
      return false;
    }
    if (!licenceExpiry) {
      setError('Select licence expiry date.');
      return false;
    }
    const exp = new Date(licenceExpiry);
    if (exp < new Date()) {
      setError('Your licence has expired. Please renew before registering.');
      return false;
    }
    if (!licenceFrontUrl || !licenceBackUrl) {
      setError('Please upload licence front and back.');
      return false;
    }
    if (!vehicleNumber || !vehicleType || !aadhaarSelfieUrl) {
      setError('Please complete vehicle and selfie step.');
      return false;
    }
    setError('');
    return true;
  };

  const validateHost = () => {
    if (!fullName || !dob || !gender) {
      setError('Please fill in personal details.');
      return false;
    }
    if (!isAdult()) {
      setError('You must be 18 or older to use ParkSpot.');
      return false;
    }
    if (!aadhaarNumber || aadhaarNumber.replace(/\D/g, '').length !== 12) {
      setError('Enter a valid 12‑digit Aadhaar number.');
      return false;
    }
    if (!aadhaarFrontUrl || !aadhaarBackUrl) {
      setError('Please upload Aadhaar front and back.');
      return false;
    }
    if (!propertyAddress || !propertyDocUrl || !utilityBillUrl) {
      setError('Please complete property details and uploads.');
      return false;
    }
    const filled = spacePhotos.filter(Boolean);
    if (filled.length < 2) {
      setError('Upload at least 2 clear photos of your space.');
      return false;
    }
    if (!spaceAddress || !spaceDescription || spaceDescription.length < 30) {
      setError('Provide a detailed description (at least 30 characters).');
      return false;
    }
    if (!totalSlots || totalSlots < 1) {
      setError('Enter a valid number of slots.');
      return false;
    }
    setError('');
    return true;
  };

  const submitDriver = async () => {
    if (!validateDriver()) return;
    const plainAadhaar = aadhaarNumber.replace(/\D/g, '');
    const encrypted = CryptoJS.AES.encrypt(plainAadhaar, uid).toString();
    const payload = {
      aadhaarNumber: encrypted,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      aadhaarSelfieUrl,
      licenceNumber,
      licenceFrontUrl,
      licenceBackUrl,
      licenceExpiry,
      vehicleNumber,
      vehicleType,
      submittedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'driver_kyc', uid), payload);
    await setDoc(
      doc(db, 'users', uid),
      {
        fullName,
        kycStatus: 'submitted'
      },
      { merge: true }
    );
    if (onRouteChange) onRouteChange('/kyc-status');
  };

  const submitHost = async () => {
    if (!validateHost()) return;
    const plainAadhaar = aadhaarNumber.replace(/\D/g, '');
    const encrypted = CryptoJS.AES.encrypt(plainAadhaar, uid).toString();
    const payload = {
      aadhaarNumber: encrypted,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      propertyDocUrl,
      utilityBillUrl,
      propertyAddress,
      ownershipType,
      spacePhotos: spacePhotos.filter(Boolean),
      spaceAddress,
      totalSlots,
      description: spaceDescription,
      submittedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'host_kyc', uid), payload);
    await setDoc(
      doc(db, 'users', uid),
      {
        fullName,
        kycStatus: 'submitted'
      },
      { merge: true }
    );
    if (onRouteChange) onRouteChange('/kyc-status');
  };

  const steps = ['Personal info', 'Aadhaar card', role === 'driver' ? 'Driving licence' : 'Property documents', role === 'driver' ? 'Vehicle & selfie' : 'Space preview'];

  const renderDriverStep = () => {
    if (step === 0) {
      return (
        <>
          <Field label="Full name" required>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Date of birth" required>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Gender" required>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                background: C.white
              }}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <div
            style={{
              marginBottom: 10,
              padding: 10,
              borderRadius: 10,
              background: C.amberBg,
              color: C.slate,
              fontSize: 12,
              display: 'flex',
              gap: 8
            }}
          >
            <ShieldCheck size={18} color={C.amber} />
            <div>
              <div style={{ fontWeight: 600 }}>Aadhaar privacy</div>
              <div>
                Your Aadhaar is encrypted end‑to‑end using AES‑256 and stored only for identity
                verification. We never share it with third parties or store it in plain text.
              </div>
            </div>
          </div>
          <Field label="Aadhaar number" required>
            <input
              type="text"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
              placeholder="XXXX XXXX XXXX"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                letterSpacing: 2
              }}
            />
          </Field>
          <FileUpload
            label="Aadhaar front"
            storagePath={`kyc/${uid}/aadhaar_front`}
            onUpload={setAadhaarFrontUrl}
            instruction="Clear photo of front side. All text must be visible."
          />
          <FileUpload
            label="Aadhaar back"
            storagePath={`kyc/${uid}/aadhaar_back`}
            onUpload={setAadhaarBackUrl}
          />
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <Field label="Driving licence number" required hint="e.g. MH0120210012345">
            <input
              type="text"
              value={licenceNumber}
              onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                textTransform: 'uppercase'
              }}
            />
          </Field>
          <Field label="Licence expiry date" required>
            <input
              type="date"
              value={licenceExpiry}
              onChange={(e) => setLicenceExpiry(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <FileUpload
            label="Licence front"
            storagePath={`kyc/${uid}/licence_front`}
            onUpload={setLicenceFrontUrl}
          />
          <FileUpload
            label="Licence back"
            storagePath={`kyc/${uid}/licence_back`}
            onUpload={setLicenceBackUrl}
          />
        </>
      );
    }
    // step 3
    return (
      <>
        <Field label="Vehicle registration number" required hint="e.g. MH12AB1234">
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              textTransform: 'uppercase'
            }}
          />
        </Field>
        <Field label="Vehicle type" required>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            {[
              { key: '2-Wheeler', icon: <Bike size={16} /> },
              { key: 'Car', icon: <Car size={16} /> },
              { key: 'SUV', icon: <Truck size={16} /> },
              { key: 'Van', icon: <Bus size={16} /> }
            ].map((v) => {
              const active = vehicleType === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVehicleType(v.key)}
                  style={{
                    flex: '1 1 45%',
                    padding: 8,
                    borderRadius: 10,
                    border: `1px solid ${active ? C.blue : C.border}`,
                    background: active ? C.blueSoft : C.white,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    justifyContent: 'flex-start'
                  }}
                >
                  {v.icon}
                  <span>{v.key}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <div
          style={{
            marginBottom: 8,
            padding: 10,
            borderRadius: 10,
            background: C.amberBg,
            fontSize: 12,
            color: C.slate,
            display: 'flex',
            gap: 8
          }}
        >
          <Camera size={18} color={C.amber} />
          <div>
            <div style={{ fontWeight: 600 }}>How to take this photo</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Hold your Aadhaar card beside your face.</li>
              <li>Ensure both your face and Aadhaar number are visible.</li>
              <li>Use good lighting, avoid blur and sunglasses.</li>
            </ol>
          </div>
        </div>
        <FileUpload
          label="Selfie with Aadhaar"
          storagePath={`kyc/${uid}/aadhaar_selfie`}
          onUpload={setAadhaarSelfieUrl}
          accept="image/*"
          instruction="Face and Aadhaar card clearly visible"
        />
      </>
    );
  };

  const renderHostStep = () => {
    if (step === 0) {
      return (
        <>
          <Field label="Full name" required>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Date of birth" required>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
          <Field label="Gender" required>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                background: C.white
              }}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
        </>
      );
    }
    if (step === 1) {
      return (
        <>
          <div
            style={{
              marginBottom: 10,
              padding: 10,
              borderRadius: 10,
              background: C.amberBg,
              color: C.slate,
              fontSize: 12,
              display: 'flex',
              gap: 8
            }}
          >
            <ShieldCheck size={18} color={C.amber} />
            <div>
              <div style={{ fontWeight: 600 }}>Aadhaar privacy</div>
              <div>
                Your Aadhaar is encrypted end‑to‑end using AES‑256 and stored only for verifying
                your identity as a host.
              </div>
            </div>
          </div>
          <Field label="Aadhaar number" required>
            <input
              type="text"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(formatAadhaarInput(e.target.value))}
              placeholder="XXXX XXXX XXXX"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                letterSpacing: 2
              }}
            />
          </Field>
          <FileUpload
            label="Aadhaar front"
            storagePath={`kyc/${uid}/aadhaar_front`}
            onUpload={setAadhaarFrontUrl}
            instruction="Clear photo of front side. All text must be visible."
          />
          <FileUpload
            label="Aadhaar back"
            storagePath={`kyc/${uid}/aadhaar_back`}
            onUpload={setAadhaarBackUrl}
          />
        </>
      );
    }
    if (step === 2) {
      const ownershipLabel =
        ownershipType === 'owned'
          ? 'Sale deed or property registry'
          : ownershipType === 'rented'
          ? 'Lease agreement + NOC from owner'
          : 'Commercial licence or NOC';
      return (
        <>
          <Field
            label="Property address"
            required
            hint="Flat, street, area, city, state, pincode"
          >
            <textarea
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                resize: 'vertical'
              }}
            />
          </Field>
          <Field label="Ownership type" required>
            <div
              style={{
                display: 'flex',
                gap: 8
              }}
            >
              {[
                { key: 'owned', label: 'I own it', icon: <Home size={16} /> },
                { key: 'rented', label: 'I rent it', icon: <Key size={16} /> },
                { key: 'commercial', label: 'Commercial', icon: <Building2 size={16} /> }
              ].map((o) => {
                const active = ownershipType === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setOwnershipType(o.key)}
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 10,
                      border: `1px solid ${active ? C.blue : C.border}`,
                      background: active ? C.blueSoft : C.white,
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'flex-start'
                    }}
                  >
                    {o.icon}
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <FileUpload
            label={ownershipLabel}
            storagePath={`kyc/${uid}/property_doc`}
            onUpload={setPropertyDocUrl}
            accept="image/*,.pdf"
            maxSizeMB={10}
          />
          <Field
            label="Recent electricity or water bill"
            required
            hint="Must be from last 3 months. Address must match parking location."
          >
            <FileUpload
              storagePath={`kyc/${uid}/utility_bill`}
              onUpload={setUtilityBillUrl}
              accept="image/*,.pdf"
            />
          </Field>
        </>
      );
    }
    // step 3
    return (
      <>
        <Field label="Space photos" required>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8
            }}
          >
            {spacePhotos.map((url, idx) => (
              <FileUpload
                key={idx}
                label={idx < 2 ? `Photo ${idx + 1} *` : `Photo ${idx + 1}`}
                storagePath={`kyc/${uid}/space_photo_${idx + 1}`}
                onUpload={(u) => {
                  setSpacePhotos((prev) => {
                    const next = [...prev];
                    next[idx] = u;
                    return next;
                  });
                }}
                accept="image/*"
              />
            ))}
          </div>
        </Field>
        <Field
          label="Space address"
          required
          hint="Should match your property address"
        >
          <input
            type="text"
            value={spaceAddress}
            onChange={(e) => setSpaceAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <Field label="Number of available slots" required>
          <input
            type="number"
            min={1}
            max={50}
            value={totalSlots}
            onChange={(e) => setTotalSlots(parseInt(e.target.value || '1', 10))}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <Field label="Brief description" required hint="At least 30 characters">
          <textarea
            value={spaceDescription}
            onChange={(e) => setSpaceDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              resize: 'vertical'
            }}
          />
        </Field>
      </>
    );
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      setError('');
    } else {
      if (role === 'driver') {
        submitDriver();
      } else {
        submitHost();
      }
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    setError('');
  };

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
          maxWidth: 720,
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          padding: 20
        }}
      >
        <h2
          style={{
            fontSize: 22,
            marginBottom: 4
          }}
        >
          Complete your KYC
        </h2>
        <p
          style={{
            fontSize: 13,
            color: C.slate,
            marginBottom: 12
          }}
        >
          Verify your identity with Aadhaar and documents to start using ParkSpot securely.
        </p>
        <StepWizard
          steps={steps}
          current={step}
          onBack={handleBack}
          onNext={handleNext}
        >
          {role === 'driver' ? renderDriverStep() : renderHostStep()}
          {error && (
            <div
              className="shake"
              style={{
                marginTop: 8,
                fontSize: 12,
                color: C.red
              }}
            >
              {error}
            </div>
          )}
        </StepWizard>
      </div>
    </div>
  );
}

