import React, { useState } from 'react';
import { C } from '../tokens.js';
import { MapPin, Video, X } from 'lucide-react';

const CAMS = [
  {
    label: 'Entry / Exit',
    img: 'https://images.unsplash.com/photo-1517606303804-0e6a913fed6d?w=900&q=80'
  },
  {
    label: 'Bay overview',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&q=80'
  },
  {
    label: 'Rear approach',
    img: 'https://images.unsplash.com/photo-1553514029-1318c9127859?w=900&q=80'
  },
  {
    label: 'Access gate',
    img: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=900&q=80'
  }
];

export function LiveSpacePreview({ listing, booking, onClose, onBook }) {
  const [idx, setIdx] = useState(0);
  const nowStr = new Date().toLocaleTimeString();
  const activeCam = CAMS[idx];

  if (!listing && !booking) return null;
  const displayListing = listing || {
    title: booking.listingTitle,
    location: booking.location,
    address: booking.address
  };

  return (
    <div
      className="fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
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
          maxWidth: 720,
          background: '#080D18',
          borderRadius: 20,
          padding: 14,
          color: '#fff'
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span
              className="blink"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#FF4B5C'
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: 1.2
              }}
            >
              LIVE PREVIEW
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(19,84,249,0.2)',
                color: '#AFC2FF'
              }}
            >
              {activeCam.label}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              {nowStr}
            </span>
            <button
              onClick={onClose}
              style={{
                borderRadius: 999,
                border: 'none',
                background: 'rgba(8,13,24,0.9)',
                color: '#fff',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div
          className="scanline gridOverlay targetCorners"
          style={{
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.16)',
            height: 310,
            backgroundImage: `url(${activeCam.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 10,
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(8,13,24,0.86)'
            }}
          >
            {displayListing.title} · {displayListing.location}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(18,160,92,0.88)',
              color: '#0B1D35'
            }}
          >
            SECURED
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 6
          }}
        >
          {CAMS.map((c, i) => {
            const active = i === idx;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setIdx(i)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  border: active
                    ? `2px solid ${C.blue}`
                    : '1px solid rgba(255,255,255,0.2)',
                  padding: 0,
                  overflow: 'hidden',
                  height: 60,
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: active ? C.green : 'rgba(255,255,255,0.4)'
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${c.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </button>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MapPin size={14} />
            <span>
              {displayListing.location} ·{' '}
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>
                {displayListing.address}
              </span>
            </span>
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
                padding: '7px 10px',
                borderRadius: 999,
                border: 'none',
                background: 'rgba(8,13,24,0.9)',
                color: 'rgba(255,255,255,0.86)',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Close
            </button>
            {onBook && listing && (
              <button
                type="button"
                onClick={onBook}
                style={{
                  padding: '7px 12px',
                  borderRadius: 999,
                  border: 'none',
                  background: C.blue,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Video size={14} />
                Book this space
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

