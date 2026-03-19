import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Field } from '../components/Field.jsx';
import { clean, sanitizeImageUrl } from '../security.js';
import { hit } from '../rateLimiter.js';

const AMENITIES = [
  'EV Charging',
  'CCTV',
  'Gated',
  'Covered',
  '24/7 Access',
  'Lighting',
  'Automated',
  'Valet'
];

export function AddListingPage({ user, onAddListing }) {
  const [form, setForm] = useState({
    title: '',
    location: '',
    address: '',
    type: 'Indoor',
    price: '',
    availability: 'Weekdays 7am–10pm',
    description: '',
    amenities: [],
    img: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const monthlyEstimate = useMemo(() => {
    const p = parseFloat(form.price || '0') || 0;
    const days = 30;
    const hoursPerDay = 8;
    return p * hoursPerDay * days;
  }, [form.price]);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleAmenity = (a) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const title = clean(form.title, 120);
    const location = clean(form.location, 120);
    const address = clean(form.address, 160);
    const description = clean(form.description, 400);
    const type = form.type;
    const priceVal = parseFloat(form.price);
    if (!title || !location || !address || !type || !form.price) {
      setError('Please fill in all required fields.');
      return;
    }
    if (Number.isNaN(priceVal) || priceVal <= 0) {
      setError('Enter a valid hourly price.');
      return;
    }
    const rl = hit('listing', user.id);
    if (!rl.allowed) {
      setError('Listing limit reached. Please wait before adding more spaces.');
      return;
    }
    const img = sanitizeImageUrl(form.img) || '';
    const listing = {
      id: crypto.randomUUID(),
      hostId: user.id,
      hostName: user.name,
      title,
      location,
      address,
      price: priceVal,
      type,
      tags: form.amenities.slice(0, 4),
      img:
        img ||
        'https://images.unsplash.com/photo-1503503731557-473c47e087f8?w=900&q=80',
      slots: 8,
      description:
        description ||
        'Host-managed space listed via ParkSpot with live monitoring and digital access.',
      amenities: form.amenities,
      availability: form.availability,
      createdAt: new Date().toISOString()
    };
    onAddListing(listing);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Listing created</h2>
          <p style={{ fontSize: 13, color: C.slate }}>
            Your space is now available to drivers in Browse. You can manage it from My Listings.
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: C.greenBg,
            color: C.green,
            fontSize: 13,
            marginBottom: 14
          }}
        >
          At ${parseFloat(form.price || '0').toFixed(2) || '0.00'}/hr listed 8hrs/day you could
          earn around ${monthlyEstimate.toFixed(0)} per month.
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10
          }}
        >
          <button
            type="button"
            className="btnPrimary"
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: 'none',
              background: C.blue,
              color: C.white,
              fontSize: 14,
              cursor: 'pointer'
            }}
            onClick={() => {
              // consumer will change route to My Listings
            }}
          >
            View My Listings
          </button>
          <button
            type="button"
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.white,
              fontSize: 13,
              cursor: 'pointer'
            }}
            onClick={() => {
              setSubmitted(false);
              setForm({
                title: '',
                location: '',
                address: '',
                type: 'Indoor',
                price: '',
                availability: 'Weekdays 7am–10pm',
                description: '',
                amenities: [],
                img: ''
              });
            }}
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Add a listing</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Create a new ParkSpot space with clear details, amenities and pricing.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 640
        }}
      >
        <Field label="Title" required>
          <input
            type="text"
            value={form.title}
            onChange={(e) => onChange('title', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <Field label="City / neighbourhood" required>
          <input
            type="text"
            value={form.location}
            onChange={(e) => onChange('location', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <Field label="Full address" required>
          <input
            type="text"
            value={form.address}
            onChange={(e) => onChange('address', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <div
          style={{
            display: 'flex',
            gap: 10
          }}
        >
          <Field label="Space type" required style={{ flex: 1 }}>
            <select
              value={form.type}
              onChange={(e) => onChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                background: C.white
              }}
            >
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>Driveway</option>
              <option>Covered</option>
            </select>
          </Field>
          <Field label="Price / hour" required style={{ width: 140 }}>
            <input
              type="number"
              min="0"
              step="0.25"
              value={form.price}
              onChange={(e) => onChange('price', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13
              }}
            />
          </Field>
        </div>
        <Field label="Availability" required>
          <select
            value={form.availability}
            onChange={(e) => onChange('availability', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              background: C.white
            }}
          >
            <option>Weekdays 7am–10pm</option>
            <option>24/7</option>
            <option>Evenings & weekends</option>
          </select>
        </Field>
        <Field label="Description" required>
          <textarea
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
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
        <Field label="Amenities">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6
            }}
          >
            {AMENITIES.map((a) => {
              const active = form.amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: `1px solid ${active ? C.blue : C.border}`,
                    background: active ? C.blueSoft : C.white,
                    fontSize: 11,
                    cursor: 'pointer',
                    color: active ? C.blue : C.slate
                  }}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </Field>
        <Field
          label="Image URL"
          hint="Optional · Unsplash, Imgur or Cloudinary only"
        >
          <input
            type="url"
            value={form.img}
            onChange={(e) => onChange('img', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13
            }}
          />
        </Field>
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            borderRadius: 10,
            background: C.greenBg,
            fontSize: 12,
            color: C.green
          }}
        >
          At ${parseFloat(form.price || '0').toFixed(2) || '0.00'}/hr listed 8hrs/day you could
          earn around ${monthlyEstimate.toFixed(0)} per month.
        </div>
        {error && (
          <div
            className="shake"
            style={{
              marginBottom: 8,
              fontSize: 12,
              color: C.red
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btnPrimary"
          style={{
            padding: '9px 14px',
            borderRadius: 10,
            border: 'none',
            background: C.blue,
            color: C.white,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Publish listing
        </button>
      </form>
    </div>
  );
}

