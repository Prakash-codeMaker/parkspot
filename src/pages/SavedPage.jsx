import React from 'react';
import { C } from '../tokens.js';
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';

export function SavedPage({ listings, wishlist, onToggleWishlist, onBook }) {
  const hasAny = listings.length > 0;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Saved spaces</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Quickly access your bookmarked spaces and confirm a booking when you are ready.
        </p>
      </div>
      {!hasAny && (
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: C.white,
            border: `1px dashed ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: C.slate
          }}
        >
          <Bookmark size={18} color={C.slateL} />
          <span>
            You have no saved spaces yet. Tap the bookmark icon on a space in Browse to add it here.
          </span>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14
        }}
      >
        {listings.map((l) => {
          const saved = wishlist.includes(l.id);
          return (
            <div
              key={l.id}
              className="cardHover"
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: 120,
                  backgroundImage: `url(${l.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <button
                  onClick={() => onToggleWishlist(l.id)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    borderRadius: 999,
                    border: 'none',
                    padding: 6,
                    background: 'rgba(8,13,24,0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.white
                  }}
                >
                  {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
              </div>
              <div
                style={{
                  padding: 10
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    {l.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.blue
                    }}
                  >
                    ${l.price.toFixed(2)}
                    <span
                      style={{
                        fontSize: 11,
                        color: C.slateL,
                        marginLeft: 2
                      }}
                    >
                      /hr
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: C.slate,
                    marginBottom: 8
                  }}
                >
                  <MapPin size={14} />
                  <span>{l.location}</span>
                </div>
                <button
                  onClick={() => onBook(l)}
                  className="btnPrimary"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.blue,
                    color: C.white,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Book now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

