import React, { useEffect, useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Field } from '../components/Field.jsx';
import { Minus, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UpiPaymentModal } from '../components/UpiPaymentModal.jsx';
import { auth, db } from '../firebase.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

function generateAccessCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < bytes.length; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `PS-${code}`;
}

function formatTimeRange(startDate, durationHours) {
  if (!startDate || !durationHours) return '';
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const fmt = (d) =>
    d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit'
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function BookingModal({
  listing,
  userProfile,
  onClose,
  onViewBookings
}) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [showUpi, setShowUpi] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (userProfile?.vehicleNumber) {
      setVehicleNumber(userProfile.vehicleNumber.toUpperCase());
    }
    if (userProfile?.vehicleType) {
      setVehicleType(userProfile.vehicleType);
    }
  }, [userProfile]);

  useEffect(() => {
    setStep(1);
    setError('');
    setBookingId(null);
    setShowUpi(false);
    setConfirmData(null);
  }, [listing?.id]);

  if (!listing) return null;

  const pricePerHour = listing.pricePerHour || 0;
  const subtotal = useMemo(() => pricePerHour * duration, [pricePerHour, duration]);
  const serviceFee = 15;
  const total = subtotal + serviceFee;

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h += 1) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  }, []);

  const buildStartDateTime = () => {
    if (!date || !startTime) return null;
    const [h, m] = startTime.split(':').map((x) => parseInt(x, 10));
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const startDateTime = buildStartDateTime();
  const endTimeLabel = startDateTime ? formatTimeRange(startDateTime, duration) : '';

  const validateStep2 = async () => {
    if (!date) {
      setError('Please select a booking date.');
      return false;
    }
    if (!startTime) {
      setError('Please select a start time.');
      return false;
    }
    if (!duration || duration < 1 || duration > 24) {
      setError('Duration must be between 1 and 24 hours.');
      return false;
    }
    if (!vehicleNumber) {
      setError('Please enter your vehicle registration number.');
      return false;
    }
    if (!vehicleType) {
      setError('Please select your vehicle type.');
      return false;
    }
    if (
      Array.isArray(listing.vehicleTypes) &&
      listing.vehicleTypes.length > 0 &&
      !listing.vehicleTypes.includes(vehicleType)
    ) {
      setError('This space does not accept the selected vehicle type.');
      return false;
    }
    // Ensure listing still has slots
    try {
      const snap = await getDoc(doc(db, 'listings', listing.id));
      if (!snap.exists()) {
        setError('This listing is no longer available.');
        return false;
      }
      const data = snap.data();
      if (data.availableSlots <= 0) {
        setError('Sorry, this space just became full.');
        return false;
      }
    } catch {
      setError('Unable to verify availability. Please try again.');
      return false;
    }
    setError('');
    return true;
  };

  const createPendingBooking = async () => {
    if (!auth.currentUser) return null;
    const driverId = auth.currentUser.uid;
    const driverName = userProfile?.fullName || auth.currentUser.displayName || 'Driver';
    const driverPhone = userProfile?.phone || '';
    const start = startDateTime;
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const docRef = await addDoc(collection(db, 'bookings'), {
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: Array.isArray(listing.images) ? listing.images[0] : listing.img,
      driverId,
      driverName,
      driverPhone,
      hostId: listing.hostId,
      hostName: listing.hostName,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationHours: duration,
      pricePerHour,
      subtotal,
      serviceFee,
      totalAmount: total,
      accessCode: null,
      vehicleNumber,
      status: 'pending',
      paymentStatus: 'pending',
      upiTransactionId: null,
      upiConfirmedAt: null,
      createdAt: serverTimestamp()
    });
    setBookingId(docRef.id);
    return docRef.id;
  };

  const handleProceedToPay = async () => {
    const ok = await validateStep2();
    if (!ok) return;
    try {
      const id = await createPendingBooking();
      if (!id) {
        setError('Unable to create booking. Please sign in again.');
        return;
      }
      setStep(3);
      setShowUpi(true);
    } catch {
      setError('Could not start payment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (upiTransactionId) => {
    if (!bookingId) return;
    const accessCode = generateAccessCode();
    const bookingRef = doc(db, 'bookings', bookingId);
    const listingRef = doc(db, 'listings', listing.id);
    try {
      await updateDoc(bookingRef, {
        status: 'confirmed',
        paymentStatus: 'paid',
        upiTransactionId: upiTransactionId || null,
        upiConfirmedAt: serverTimestamp(),
        accessCode
      });
      await updateDoc(listingRef, {
        availableSlots: increment(-1)
      });
      const driverId = auth.currentUser?.uid;
      const driverName = userProfile?.fullName || 'Driver';
      // Driver notification
      await addDoc(collection(db, 'notifications'), {
        userId: driverId,
        title: 'Booking Confirmed!',
        message: `Your spot at ${listing.title} is reserved. Code: ${accessCode}`,
        type: 'booking_confirmed',
        isRead: false,
        createdAt: serverTimestamp()
      });
      // Host notification
      if (listing.hostId) {
        await addDoc(collection(db, 'notifications'), {
          userId: listing.hostId,
          title: 'New Booking Received',
          message: `${driverName} booked ${listing.title} for ${duration}hrs`,
          type: 'new_booking',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
      setConfirmData({
        accessCode,
        when: startDateTime,
        duration,
        total
      });
      setShowUpi(false);
      setStep(4);
    } catch {
      setError('Payment succeeded but we could not confirm booking. Please contact support with your UTR.');
    }
  };

  const featureBoxes = (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 12
      }}
    >
      <div
        style={{
          flex: 1,
          padding: 8,
          borderRadius: 10,
          background: C.bg,
          fontSize: 11,
          color: C.slate
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Drive‑in access</div>
        <div>Arrive, park and exit with a digital access code.</div>
      </div>
      <div
        style={{
          flex: 1,
          padding: 8,
          borderRadius: 10,
          background: C.bg,
          fontSize: 11,
          color: C.slate
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Digital code</div>
        <div>Unique PS‑code generated per booking for secure entry.</div>
      </div>
      <div
        style={{
          flex: 1,
          padding: 8,
          borderRadius: 10,
          background: C.bg,
          fontSize: 11,
          color: C.slate
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>Insurance included</div>
        <div>Session‑level insurance certificate stored in My Bookings.</div>
      </div>
    </div>
  );

  return (
    <div
      className="fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,13,24,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40
      }}
    >
      <div
        className="zoomIn"
        style={{
          width: '100%',
          maxWidth: 620,
          background: C.white,
          borderRadius: 18,
          padding: 18,
          border: `1px solid ${C.border}`,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 12
          }}
        >
          <div
            style={{
              width: 148,
              height: 90,
              borderRadius: 12,
              backgroundImage: `linear-gradient(to bottom, rgba(8,13,24,0.45), rgba(8,13,24,0.9)), url(${
                Array.isArray(listing.images) ? listing.images[0] : listing.img
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 4
              }}
            >
              {listing.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.slate,
                marginBottom: 4
              }}
            >
              {listing.city || listing.location}{' '}
              {listing.address && (
                <>
                  · <span style={{ color: C.slateL }}>{listing.address}</span>
                </>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: C.slateL
              }}
            >
              <span>
                <strong>₹{pricePerHour}</strong>/hr
              </span>
              {listing.spaceType && <span>· {listing.spaceType}</span>}
              {typeof listing.availableSlots === 'number' && (
                <span>· {listing.availableSlots} slots</span>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            marginBottom: 12,
            fontSize: 10
          }}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                height: 4,
                borderRadius: 999,
                background: step >= s ? C.blue : C.bg
              }}
            />
          ))}
        </div>
        {featureBoxes}
        {step === 1 && (
          <div>
            <h3
              style={{
                fontSize: 15,
                marginBottom: 8
              }}
            >
              Space details
            </h3>
            <p
              style={{
                fontSize: 12,
                color: C.slate,
                marginBottom: 8
              }}
            >
              {listing.description}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 10
              }}
            >
              {(listing.amenities || listing.tags || []).slice(0, 8).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: C.blueSoft,
                    color: C.blue
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btnPrimary"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h3
              style={{
                fontSize: 15,
                marginBottom: 8
              }}
            >
              Schedule & vehicle
            </h3>
            <Field label="Date" required>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13
                }}
              />
            </Field>
            <Field label="Start time" required>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                  background: C.white
                }}
              >
                <option value="">Select time</option>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration (hours)" required>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.max(1, d - 1))}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={14} />
                </button>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 999,
                    background: C.bg,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${(duration / 24) * 100}%`,
                      height: '100%',
                      background: C.blue,
                      transition: 'width 0.16s ease'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.min(24, d + 1))}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={14} />
                </button>
                <span
                  style={{
                    fontSize: 12,
                    width: 52,
                    textAlign: 'right',
                    color: C.slate
                  }}
                >
                  {duration}h
                </span>
              </div>
              {endTimeLabel && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: C.slateL
                  }}
                >
                  Ends: {endTimeLabel}
                </div>
              )}
            </Field>
            <Field
              label="Vehicle number"
              required
              hint="e.g. MH12AB1234"
            >
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
                {['2-Wheeler', 'Car', 'SUV', 'Van'].map((t) => {
                  const active = vehicleType === t;
                  const disabled =
                    Array.isArray(listing.vehicleTypes) &&
                    listing.vehicleTypes.length > 0 &&
                    !listing.vehicleTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type='button'
                      disabled={disabled}
                      onClick={() => !disabled && setVehicleType(t)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: `1px solid ${
                          active ? C.blue : disabled ? C.border : C.border
                        }`,
                        background: active ? C.blueSoft : C.white,
                        fontSize: 12,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: C.bg,
                fontSize: 12,
                marginBottom: 10
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <span>
                  Subtotal: ₹{pricePerHour} × {duration}h
                </span>
                <span>₹{subtotal}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4
                }}
              >
                <span>Service fee</span>
                <span>₹{serviceFee}</span>
              </div>
              <div
                style={{
                  borderTop: `1px dashed ${C.border}`,
                  margin: '6px 0',
                  paddingTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Total</span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.blue
                  }}
                >
                  ₹{total}
                </span>
              </div>
            </div>
            {error && (
              <div
                className='shake'
                style={{
                  marginBottom: 6,
                  fontSize: 12,
                  color: C.red
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 8
              }}
            >
              <button
                type='button'
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type='button'
                onClick={handleProceedToPay}
                className='btnPrimary'
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: C.blue,
                  color: C.white,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Proceed to pay
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3
              style={{
                fontSize: 15,
                marginBottom: 6
              }}
            >
              Pay securely via UPI
            </h3>
            <p
              style={{
                fontSize: 12,
                color: C.slate,
                marginBottom: 4
              }}
            >
              You&apos;ll be redirected to your preferred UPI app. Once paid, we&apos;ll confirm your booking and generate your access code.
            </p>
          </div>
        )}
        {step === 4 && confirmData && (
          <div
            style={{
              textAlign: 'center'
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
                margin: '0 auto 10px'
              }}
            >
              <CheckCircle2 size={32} color={C.green} />
            </div>
            <h3
              style={{
                fontSize: 20,
                marginBottom: 6
              }}
            >
              Booking Confirmed!
            </h3>
            <p
              style={{
                fontSize: 13,
                color: C.slate,
                marginBottom: 8
              }}
            >
              Your spot at {listing.title} is reserved.
            </p>
            <div
              style={{
                marginBottom: 8,
                fontSize: 12,
                color: C.slateL
              }}
            >
              {confirmData.when &&
                `${confirmData.when.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })} · ${formatTimeRange(confirmData.when, confirmData.duration)}`}
            </div>
            <div
              style={{
                fontSize: 13,
                marginBottom: 8
              }}
            >
              Total paid:{' '}
              <strong>₹{confirmData.total}</strong>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                letterSpacing: 3,
                color: C.blue,
                marginBottom: 10
              }}
            >
              {confirmData.accessCode}
            </div>
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: C.greenBg,
                color: C.green,
                fontSize: 12,
                marginBottom: 12
              }}
            >
              Insurance certificate will be available in My Bookings along with full session details.
            </div>
            <button
              type='button'
              onClick={() => {
                onClose();
                if (onViewBookings) onViewBookings();
              }}
              className='btnPrimary'
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: C.blue,
                color: C.white,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 6
              }}
            >
              View My Bookings
            </button>
          </div>
        )}
        <button
          type='button'
          onClick={onClose}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '7px 10px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: C.slateL,
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
      <UpiPaymentModal
        bookingId={bookingId}
        amount={total}
        open={showUpi}
        onClose={() => {
          setShowUpi(false);
          onClose();
        }}
        onConfirmed={(info) => handlePaymentSuccess(info?.transactionId)}
      />
    </div>
  );
}


