import React, { useMemo, useState } from 'react';
import { C } from '../tokens.js';
import { Badge } from '../components/Badge.jsx';
import { MapPin, Search, Bookmark, BookmarkCheck, Video, Clock } from 'lucide-react';

const FILTERS = ['All', 'Indoor', 'Outdoor', 'Driveway', 'Covered', 'EV Charging'];

export function BrowsePage({
  listings,
  wishlist,
  onToggleWishlist,
  onBook,
  onLivePreview
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return listings.filter((l) => {
      const matchesQuery =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'EV Charging'
          ? l.tags?.some((t) => t.toLowerCase().includes('ev'))
          : l.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [listings, search, filter]);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Browse secure spaces</h2>
        <p style={{ fontSize: 13, color: C.slate }}>
          Preview CCTV feeds, check availability and book with built‑in insurance in just a few clicks.
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          alignItems: 'center'
        }}
      >
        <div
          style={{
            flex: '1 1 260px',
            position: 'relative'
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.slateL
            }}
          />
          <input
            placeholder="Search by title or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 28px',
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              background: C.white
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${active ? C.blue : C.border}`,
                  background: active ? C.blueSoft : C.white,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: active ? C.blue : C.slate
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 16
        }}
      >
        {filtered.map((l, idx) => {
          const saved = wishlist.includes(l.id);
          const lowSlots = l.slots <= 2;
          return (
            <div
              key={l.id}
              className="cardHover fadeUp"
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
                animationDelay: `${0.03 * idx}s`
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: 200,
                  backgroundImage: `linear-gradient(to bottom, rgba(8,13,24,0.45), rgba(8,13,24,0.9)), url(${l.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 10
                  }}
                >
                  <Badge
                    label={l.type}
                    bg="rgba(8,13,24,0.7)"
                    color={C.white}
                  />
                </div>
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
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    bottom: 10
                  }}
                >
                  <Badge
                    label={
                      lowSlots ? `${l.slots} slots left` : `${l.slots} open slots`
                    }
                    bg={lowSlots ? C.redBg : 'rgba(8,13,24,0.84)'}
                    color={lowSlots ? C.red : C.white}
                  />
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
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
                  <span>
                    {l.location} · <span style={{ color: C.slateL }}>{l.address}</span>
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginBottom: 8
                  }}
                >
                  {l.tags?.map((t) => (
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    fontSize: 11,
                    color: C.slateL
                  }}
                >
                  <span>
                    by <strong>{l.hostName}</strong>
                  </span>
                  <span>
                    <Clock size={12} style={{ marginRight: 3 }} />
                    {l.availability}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8
                  }}
                >
                  <button
                    onClick={() => onLivePreview(l)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.navy,
                      color: C.green,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Video size={14} />
                    Live view
                  </button>
                  <button
                    onClick={() => onBook(l)}
                    className="btnPrimary"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.blue,
                      color: C.white,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: C.white,
              border: `1px dashed ${C.border}`,
              fontSize: 13,
              color: C.slate
            }}
          >
            No spaces match your search yet. Try adjusting your filters or exploring a
            different neighbourhood.
          </div>
        )}
      </div>
    </div>
  );
}

