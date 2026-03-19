import React, { useEffect, useMemo, useState } from 'react';
import { C } from './tokens.js';
import { seedListingsIfNeeded, sGet, sSet, sDel, auditLog } from './storage.js';
import { genToken, hashPw, verifyPw, pwStrength, clean } from './security.js';
import { hit } from './rateLimiter.js';
import { Logo } from './components/Logo.jsx';
import { Avatar } from './components/Avatar.jsx';
import { Field } from './components/Field.jsx';
import { Badge } from './components/Badge.jsx';
import {
  MapPin,
  Search,
  Bookmark,
  BookmarkCheck,
  Video,
  LayoutDashboard,
  CalendarClock,
  ShieldCheck,
  FileCheck,
  User,
  LogOut,
  PlusCircle,
  Settings,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

import { LandingPage } from './pages/LandingPage.jsx';
import { BrowsePage } from './pages/BrowsePage.jsx';
import { BookingsPage } from './pages/BookingsPage.jsx';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage.jsx';
import { SavedPage } from './pages/SavedPage.jsx';
import { AddListingPage } from './pages/AddListingPage.jsx';
import { MyListingsPage } from './pages/MyListingsPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';

import { BookingModal } from './modals/BookingModal.jsx';
import { LiveSpacePreview } from './modals/LiveSpacePreview.jsx';
import { InsuranceCertModal } from './modals/InsuranceCert.jsx';
import { AuthPage } from './pages/AuthPage.jsx';

const ROUTES = {
  LANDING: 'landing',
  AUTH: 'auth',
  BROWSE: 'browse',
  BOOKINGS: 'bookings',
  LIVE: 'live',
  SAVED: 'saved',
  ADD_LISTING: 'add-listing',
  MY_LISTINGS: 'my-listings',
  ACCOUNT: 'account'
};

function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function AppShell({
  user,
  route,
  setRoute,
  children,
  onLogout
}) {
  const navItems = useMemo(() => {
    const base = [
      { key: ROUTES.BROWSE, label: 'Browse', icon: <LayoutDashboard size={16} /> },
      { key: ROUTES.BOOKINGS, label: 'My Bookings', icon: <CalendarClock size={16} /> },
      { key: ROUTES.LIVE, label: 'Live Monitoring', icon: <Video size={16} /> },
      { key: ROUTES.SAVED, label: 'Saved', icon: <Bookmark size={16} /> },
      { key: ROUTES.ACCOUNT, label: 'Account', icon: <Settings size={16} /> }
    ];
    if (user?.role === 'host') {
      base.splice(1, 0, { key: ROUTES.MY_LISTINGS, label: 'My Listings', icon: <FileCheck size={16} /> });
      base.splice(2, 0, { key: ROUTES.ADD_LISTING, label: 'Add Listing', icon: <PlusCircle size={16} /> });
    }
    return base;
  }, [user]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: C.bg,
        color: C.navy
      }}
    >
      <aside
        style={{
          width: 220,
          background: C.navy,
          color: C.white,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 16px',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          minHeight: '100vh'
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <Logo variant="dark" />
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = route === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setRoute(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  marginBottom: 4,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'rgba(235,240,255,0.12)' : 'transparent',
                  color: active ? C.white : 'rgba(255,255,255,0.78)',
                  textAlign: 'left',
                  fontSize: 13
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: active ? 'rgba(19,84,249,0.2)' : 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div
          style={{
            borderTop: `1px solid rgba(255,255,255,0.08)`,
            paddingTop: 12,
            marginTop: 8
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10
            }}
          >
            <Avatar name={user?.name || ''} size={32} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.white,
                  marginBottom: 2
                }}
              >
                {user?.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.75)',
                  textTransform: 'capitalize'
                }}
              >
                {user?.role || 'driver'}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 7,
              border: 'none',
              background: C.red,
              color: C.white,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main
        style={{
          flex: 1,
          padding: '22px 26px',
          minHeight: '100vh'
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(ROUTES.LANDING);
  const [currentUser, setCurrentUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingModal, setBookingModal] = useState(null);
  const [livePreview, setLivePreview] = useState(null);
  const [certBooking, setCertBooking] = useState(null);

  useEffect(() => {
    seedListingsIfNeeded();
    const allListings = sGet('ps:listings', []);
    setListings(allListings);
    const sessionToken = sGet('ps:session', null);
    const users = sGet('ps:users', []);
    const found = users.find((u) => u.sessionToken === sessionToken);
    if (found) {
      setCurrentUser(found);
      setRoute(ROUTES.BROWSE);
      setWishlist(sGet(`ps:wishlist:${found.id}`, []));
      setBookings(sGet(`ps:bookings:${found.id}`, []));
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    sSet(`ps:wishlist:${currentUser.id}`, wishlist);
  }, [wishlist, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    sSet(`ps:bookings:${currentUser.id}`, bookings);
  }, [bookings, currentUser]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setRoute(ROUTES.BROWSE);
    setWishlist(sGet(`ps:wishlist:${user.id}`, []));
    setBookings(sGet(`ps:bookings:${user.id}`, []));
  };

  const handleLogout = () => {
    if (currentUser) {
      const users = sGet('ps:users', []);
      const updated = users.map((u) =>
        u.id === currentUser.id ? { ...u, sessionToken: null } : u
      );
      sSet('ps:users', updated);
      auditLog(currentUser.id, 'logout', 'User signed out');
    }
    sDel('ps:session');
    setCurrentUser(null);
    setRoute(ROUTES.LANDING);
  };

  const toggleWishlist = (listingId) => {
    if (!currentUser) return;
    setWishlist((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleNewBooking = (booking) => {
    setBookings((prev) => [booking, ...prev]);
    auditLog(currentUser.id, 'booking', `Booked ${booking.listingTitle}`);
  };

  const handleCancelBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    const b = bookings.find((x) => x.id === bookingId);
    if (b) {
      auditLog(currentUser.id, 'cancel', `Cancelled ${b.listingTitle}`);
    }
  };

  const handleAddListing = (listing) => {
    setListings((prev) => {
      const next = [listing, ...prev];
      sSet('ps:listings', next);
      return next;
    });
  };

  const handleRemoveListing = (id) => {
    setListings((prev) => {
      const next = prev.filter((l) => l.id !== id);
      sSet('ps:listings', next);
      return next;
    });
  };

  if (!currentUser && route !== ROUTES.AUTH && route !== ROUTES.LANDING) {
    setRoute(ROUTES.AUTH);
  }

  if (!currentUser && route === ROUTES.LANDING) {
    return (
      <LandingPage
        onGetStarted={() => setRoute(ROUTES.AUTH)}
        onSignIn={() => setRoute(ROUTES.AUTH)}
      />
    );
  }

  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <>
      <AppShell user={currentUser} route={route} setRoute={setRoute} onLogout={handleLogout}>
        {route === ROUTES.BROWSE && (
          <BrowsePage
            listings={listings}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onBook={(listing) => setBookingModal({ listing })}
            onLivePreview={(listing) => setLivePreview({ listing })}
          />
        )}
        {route === ROUTES.BOOKINGS && (
          <BookingsPage
            bookings={bookings}
            onCancel={handleCancelBooking}
            onWatchLive={(booking) => setLivePreview({ listingId: booking.listingId, booking })}
            onCert={(booking) => setCertBooking(booking)}
          />
        )}
        {route === ROUTES.LIVE && (
          <LiveMonitoringPage
            bookings={bookings}
            listings={listings}
          />
        )}
        {route === ROUTES.SAVED && (
          <SavedPage
            listings={listings.filter((l) => wishlist.includes(l.id))}
            onToggleWishlist={toggleWishlist}
            wishlist={wishlist}
            onBook={(listing) => setBookingModal({ listing })}
          />
        )}
        {route === ROUTES.ADD_LISTING && currentUser.role === 'host' && (
          <AddListingPage
            user={currentUser}
            onAddListing={handleAddListing}
          />
        )}
        {route === ROUTES.MY_LISTINGS && currentUser.role === 'host' && (
          <MyListingsPage
            user={currentUser}
            listings={listings.filter((l) => l.hostId === currentUser.id)}
            onRemove={handleRemoveListing}
          />
        )}
        {route === ROUTES.ACCOUNT && (
          <AccountPage
            user={currentUser}
            setUser={setCurrentUser}
            onSignOut={handleLogout}
          />
        )}
      </AppShell>
      {bookingModal && (
        <BookingModal
          listing={bookingModal.listing}
          user={currentUser}
          onClose={() => setBookingModal(null)}
          onConfirm={handleNewBooking}
        />
      )}
      {livePreview && (
        <LiveSpacePreview
          listing={livePreview.listing}
          booking={livePreview.booking}
          onClose={() => setLivePreview(null)}
          onBook={() => {
            if (livePreview.listing) {
              setBookingModal({ listing: livePreview.listing });
            }
            setLivePreview(null);
          }}
        />
      )}
      {certBooking && (
        <InsuranceCertModal booking={certBooking} onClose={() => setCertBooking(null)} />
      )}
    </>
  );
}

