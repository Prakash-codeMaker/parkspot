import { C } from './tokens.js';

const LS = window.localStorage;

export function sGet(key, fallback) {
  try {
    const raw = LS.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function sSet(key, value) {
  try {
    LS.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors locally
  }
}

export function sDel(key) {
  try {
    LS.removeItem(key);
  } catch {
    // ignore
  }
}

export function auditLog(userId, ev, detail) {
  if (!userId) return;
  const key = `ps:audit:${userId}`;
  const existing = sGet(key, []);
  const entry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ev,
    detail
  };
  const next = [entry, ...existing].slice(0, 50);
  sSet(key, next);
}

export function seedListingsIfNeeded() {
  const key = 'ps:listings';
  const list = sGet(key, null);
  if (list && list.length) return;
  const now = new Date().toISOString();
  const base = [
    {
      title: 'Secured Underground Garage',
      location: 'Financial District',
      address: '12 Market Plaza, Financial District',
      price: 5.5,
      type: 'Indoor',
      tags: ['EV Charging', '24/7', 'CCTV'],
      img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
      slots: 8
    },
    {
      title: 'Rooftop Open-Air Car Park',
      location: 'Midtown',
      address: '88 Skyline Ave, Midtown',
      price: 3.0,
      type: 'Outdoor',
      tags: ['Easy Access'],
      img: 'https://images.unsplash.com/photo-1555447879-65c68c31b3b5?w=800&q=80',
      slots: 14
    },
    {
      title: 'Private Residential Driveway',
      location: 'West Village',
      address: '7 Grove Lane, West Village',
      price: 2.0,
      type: 'Driveway',
      tags: ['Quiet', 'Residential'],
      img: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80',
      slots: 1
    },
    {
      title: 'Automated Robotic Valet Tower',
      location: 'Tech Hub East',
      address: '101 Circuit Blvd, Tech Hub East',
      price: 7.0,
      type: 'Indoor',
      tags: ['Automated', 'EV Charging'],
      img: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&q=80',
      slots: 20
    },
    {
      title: 'Covered Multi-Level Car Park',
      location: 'Sports District',
      address: '22 Arena Way, Sports District',
      price: 5.0,
      type: 'Covered',
      tags: ['Large Vehicles'],
      img: 'https://images.unsplash.com/photo-1563694983011-6f4d90358083?w=800&q=80',
      slots: 40
    },
    {
      title: 'Historic District Basement Garage',
      location: 'Old Town',
      address: '3 Heritage St, Old Town',
      price: 3.5,
      type: 'Indoor',
      tags: ['Secure', 'Central'],
      img: 'https://images.unsplash.com/photo-1503503330641-4226ece56db0?w=800&q=80',
      slots: 6
    }
  ];
  const withMeta = base.map((b, idx) => ({
    id: `seed-${idx + 1}`,
    hostId: 'seed-host',
    hostName: 'ParkSpot Host',
    description:
      'Secure, verified space with CCTV monitoring, digital access and ParkSpot insurance coverage.',
    amenities: b.tags,
    availability: 'Weekdays 7am–10pm',
    createdAt: now,
    ...b
  }));
  sSet(key, withMeta);
}

