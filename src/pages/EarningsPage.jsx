import React, { useState, useMemo } from 'react';
import { C } from '../tokens.js';
import { sGet, sSet } from '../storage.js';

/* ════════════════════════════════════════════════════════════
   PAYOUT ENGINE — inlined (no external file needed)
════════════════════════════════════════════════════════════ */
const COMMISSION_RATE = 0.15;
const MIN_PAYOUT      = 200;

function calcEarnings(totalAmount) {
  const amt        = Number(totalAmount) || 0;
  const commission = +(amt * COMMISSION_RATE).toFixed(2);
  return { totalAmount: amt, commission, hostEarning: +(amt - commission).toFixed(2) };
}

function getHostBookings(hostId) {
  const users   = sGet('ps:users') ?? [];
  const drivers = users.filter(u => u.role === 'driver');
  let all = [];
  for (const d of drivers) {
    all = all.concat((sGet(`ps:bookings:${d.id}`) ?? []).filter(b => b.hostId === hostId));
  }
  const seen = new Set();
  return all.filter(b => !seen.has(b.id) && seen.add(b.id));
}

function getCompletedBookings(hostId) {
  return getHostBookings(hostId).filter(b => b.status === 'confirmed' || b.status === 'completed');
}

function getPendingPayoutBookings(hostId) {
  return getCompletedBookings(hostId).filter(b => !b.payoutStatus || b.payoutStatus === 'pending');
}

function getPendingBalance(hostId) {
  return +getPendingPayoutBookings(hostId)
    .reduce((s, b) => s + calcEarnings(b.totalAmount ?? b.total ?? 0).hostEarning, 0)
    .toFixed(2);
}

function getTotalEarned(hostId) {
  return +getCompletedBookings(hostId)
    .filter(b => b.payoutStatus === 'paid')
    .reduce((s, b) => s + calcEarnings(b.totalAmount ?? b.total ?? 0).hostEarning, 0)
    .toFixed(2);
}

function requestPayout(hostId) {
  const pending = getPendingPayoutBookings(hostId);
  const balance = getPendingBalance(hostId);
  if (balance < MIN_PAYOUT)
    return { ok: false, reason: `Minimum payout is ₹${MIN_PAYOUT}. Your balance is ₹${balance.toFixed(2)}.` };

  const payoutId = 'PAY-' + crypto.randomUUID().slice(0, 8).toUpperCase();
  const now      = new Date().toISOString();

  const users = sGet('ps:users') ?? [];
  for (const d of users.filter(u => u.role === 'driver')) {
    const key = `ps:bookings:${d.id}`;
    const db  = sGet(key) ?? [];
    if (db.some(b => pending.find(p => p.id === b.id))) {
      sSet(key, db.map(b =>
        pending.find(p => p.id === b.id)
          ? { ...b, payoutStatus: 'processing', payoutId, payoutInitiatedAt: now }
          : b
      ));
    }
  }

  const payout = {
    id: payoutId, hostId,
    amount: balance, bookingCount: pending.length,
    bookingIds: pending.map(b => b.id),
    status: 'processing',
    initiatedAt: now, paidAt: null, upiId: null, utrNumber: null,
  };
  sSet(`ps:payouts:${hostId}`, [payout, ...(sGet(`ps:payouts:${hostId}`) ?? [])]);
  return { ok: true, payout };
}

function getPayouts(hostId) {
  return (sGet(`ps:payouts:${hostId}`) ?? [])
    .sort((a, b) => new Date(b.initiatedAt) - new Date(a.initiatedAt));
}

/* ════════════════════════════════════════════════════════════
   SVG ICONS
════════════════════════════════════════════════════════════ */
const Ic = {
  Clock:  () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Check:  () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>,
  Alert:  () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Arrow:  () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  Copy:   () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Bank:   () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>,
  Edit:   () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Info:   () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  Filter: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
};

/* ── Helpers ── */
const fmt     = n  => `₹${Number(n).toFixed(2)}`;
const fmtK    = n  => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : fmt(n);
const fmtDate = iso => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); };
const fmtTime = iso => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }); };

const StatusPill = ({ status }) => {
  const cfg = {
    pending:    { bg:'#FEF9C3', color:'#92400E', label:'Pending' },
    processing: { bg:'#EDE9FE', color:'#6D28D9', label:'Processing' },
    paid:       { bg:'#DCFCE7', color:'#065F46', label:'Paid' },
    failed:     { bg:'#FEE2E2', color:'#B91C1C', label:'Failed' },
  }[status] ?? { bg:'#F5F7FC', color:'#4A5878', label: status ?? 'Pending' };
  return (
    <span style={{ padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:cfg.bg, color:cfg.color, textTransform:'uppercase', letterSpacing:.5 }}>
      {cfg.label}
    </span>
  );
};

const Spinner = () => (
  <>
    <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', animation:'ep-spin .7s linear infinite' }}/>
    <style>{`@keyframes ep-spin{to{transform:rotate(360deg);}}`}</style>
  </>
);

/* ── UPI ID editor ── */
function UpiEditor({ user, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(user?.upiId ?? '');
  const [err,     setErr]     = useState('');

  const validate = v => {
    if (!v.trim()) return 'UPI ID is required.';
    if (!/^[\w.\-]+@[\w]+$/.test(v.trim())) return 'Enter a valid UPI ID (e.g. name@ybl)';
    return '';
  };
  const save = () => {
    const er = validate(val); if (er) { setErr(er); return; }
    onSave(val.trim()); setEditing(false); setErr('');
  };

  if (!editing) return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ padding:'9px 14px', borderRadius:9, background:C.bg, border:`1px solid ${C.border}`, fontSize:13, color:user?.upiId?C.navy:C.slateL, flex:1, fontFamily:user?.upiId?'monospace':'inherit' }}>
        {user?.upiId ?? 'No UPI ID set — add one to request payouts'}
      </div>
      <button onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:C.blue, fontFamily:'inherit' }}>
        <Ic.Edit/>{user?.upiId ? 'Edit' : 'Add UPI ID'}
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', gap:8 }}>
        <input value={val} onChange={e=>{setVal(e.target.value);setErr('');}} placeholder="yourname@ybl" autoFocus
          style={{ flex:1, padding:'9px 14px', borderRadius:9, border:`1.5px solid ${err?C.red:C.border}`, fontSize:13, fontFamily:'monospace', color:C.navy, outline:'none', background:'#fff' }}/>
        <button onClick={save} style={{ padding:'9px 18px', borderRadius:9, border:'none', background:C.blue, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
        <button onClick={()=>{setEditing(false);setErr('');setVal(user?.upiId??'');}} style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
      </div>
      {err && <div style={{ fontSize:12, color:C.red, marginTop:5 }}>{err}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MONTHLY CHART
════════════════════════════════════════════════════════════ */
function MonthlySummary({ bookings }) {
  const months = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const d = new Date(b.startTime ?? b.date ?? b.bookedAt ?? 0);
      if (isNaN(d)) return;
      const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('en-IN', { month:'short', year:'numeric' });
      if (!map[key]) map[key] = { label, earned:0, count:0 };
      map[key].earned += calcEarnings(b.totalAmount ?? b.total ?? 0).hostEarning;
      map[key].count  += 1;
    });
    return Object.values(map).slice(-6);
  }, [bookings]);

  if (!months.length) return (
    <div style={{ padding:36, textAlign:'center', background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, color:C.slateL, fontSize:14 }}>
      No completed bookings yet. Your monthly chart will appear here.
    </div>
  );

  const maxE = Math.max(...months.map(m => m.earned), 1);
  return (
    <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:'22px', boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
      <div style={{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:20 }}>Monthly earnings</div>
      <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:140, marginBottom:12 }}>
        {months.map(m => {
          const pct = (m.earned / maxE) * 100;
          return (
            <div key={m.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#059669', marginBottom:2 }}>{fmtK(m.earned)}</div>
              <div style={{ width:'100%', height:110, display:'flex', alignItems:'flex-end' }}>
                <div style={{ width:'100%', height:`${Math.max(pct,4)}%`, background:'linear-gradient(to top,#1354F9,#3B82F6)', borderRadius:'6px 6px 0 0', transition:'height .4s' }}/>
              </div>
              <div style={{ fontSize:10.5, color:C.slateL, textAlign:'center', marginTop:6 }}>{m.label}</div>
              <div style={{ fontSize:10, color:C.border, textAlign:'center' }}>{m.count} bkg</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:16, justifyContent:'flex-end', fontSize:11, color:C.slateL, borderTop:`1px solid ${C.bg}`, paddingTop:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:'#1354F9' }}/> Your earnings (85%)
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAYOUT CARD
════════════════════════════════════════════════════════════ */
function PayoutCard({ payout, upiId }) {
  const [open, setOpen] = useState(false);
  const copy = t => navigator.clipboard?.writeText(t).catch(() => {});
  const cfg = {
    processing: { bg:'#EDE9FE', border:'#C4B5FD', color:'#6D28D9' },
    paid:       { bg:'#DCFCE7', border:'#A7F0CC', color:'#059669' },
    failed:     { bg:'#FEE2E2', border:'#FECACA', color:'#B91C1C' },
  }[payout.status] ?? { bg:C.bg, border:C.border, color:C.slateL };

  return (
    <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
      <div style={{ padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:cfg.color }}>
            {payout.status==='paid'?<Ic.Check/>:payout.status==='failed'?<Ic.Alert/>:<Ic.Clock/>}
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
              <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:14, color:C.navy }}>{payout.id}</span>
              <StatusPill status={payout.status}/>
            </div>
            <div style={{ fontSize:12, color:C.slateL }}>
              {fmtDate(payout.initiatedAt)} · {payout.bookingCount} booking{payout.bookingCount!==1?'s':''}
              {payout.paidAt && ` · Paid ${fmtDate(payout.paidAt)}`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:800, fontSize:24, color:C.navy, letterSpacing:-1 }}>{fmt(payout.amount)}</div>
            <div style={{ fontSize:11, color:C.slateL }}>to {payout.upiId ?? upiId ?? '—'}</div>
          </div>
          <button onClick={()=>setOpen(o=>!o)} style={{ padding:'8px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', color:C.slate }}>
            {open?'Hide':'Details'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'18px 22px', background:C.bg }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
            {[
              ['Payout ID',     payout.id],
              ['Initiated',     fmtDate(payout.initiatedAt)+' '+fmtTime(payout.initiatedAt)],
              ['Paid at',       payout.paidAt?fmtDate(payout.paidAt)+' '+fmtTime(payout.paidAt):'—'],
              ['UPI ID',        payout.upiId??upiId??'—'],
              ['UTR Number',    payout.utrNumber??'—'],
              ['Bookings count',String(payout.bookingCount)],
            ].map(([label,value]) => (
              <div key={label} style={{ background:'#fff', borderRadius:10, padding:'12px 14px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, color:C.slateL, marginBottom:4, textTransform:'uppercase', letterSpacing:.8 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.navy, fontFamily:['Payout ID','UPI ID','UTR Number'].includes(label)?'monospace':'inherit', display:'flex', alignItems:'center', gap:6 }}>
                  {value}
                  {['UTR Number','Payout ID'].includes(label) && value!=='—' && (
                    <button onClick={()=>copy(value)} style={{ border:'none',background:'none',cursor:'pointer',color:C.blue,display:'flex',padding:0 }}><Ic.Copy/></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:10, padding:'12px 14px', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.slateL, marginBottom:8, textTransform:'uppercase', letterSpacing:.8 }}>Booking IDs in this payout</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {(payout.bookingIds??[]).map(id=>(
                <span key={id} style={{ padding:'3px 10px', borderRadius:6, background:C.bg, border:`1px solid ${C.border}`, fontFamily:'monospace', fontSize:11, color:C.slate }}>
                  {id.slice(0,12).toUpperCase()}
                </span>
              ))}
              {(!payout.bookingIds||!payout.bookingIds.length)&&<span style={{ fontSize:13,color:C.slateL }}>—</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN EARNINGS PAGE
════════════════════════════════════════════════════════════ */
export function EarningsPage({ user, setUser }) {
  const [tab,          setTab]        = useState('overview');
  const [filterStatus, setFilter]     = useState('all');
  const [requesting,   setRequesting] = useState(false);
  const [reqResult,    setReqResult]  = useState(null);
  const [refresh,      setRefresh]    = useState(0);

  const completedBookings = useMemo(() => getCompletedBookings(user?.id??''),         [refresh, user?.id]);
  const pendingBookings   = useMemo(() => getPendingPayoutBookings(user?.id??''),     [refresh, user?.id]);
  const pendingBalance    = useMemo(() => getPendingBalance(user?.id??''),            [refresh, user?.id]);
  const totalEarned       = useMemo(() => getTotalEarned(user?.id??''),               [refresh, user?.id]);
  const payouts           = useMemo(() => getPayouts(user?.id??''),                   [refresh, user?.id]);

  const totalBookings   = completedBookings.length;
  const totalRevenue    = +completedBookings.reduce((s,b)=>s+(b.totalAmount??b.total??0),0).toFixed(2);
  const totalCommission = +completedBookings.reduce((s,b)=>s+calcEarnings(b.totalAmount??b.total??0).commission,0).toFixed(2);
  const processingPays  = payouts.filter(p=>p.status==='processing');
  const processingAmt   = +processingPays.reduce((s,p)=>s+p.amount,0).toFixed(2);
  const canRequest      = pendingBalance >= MIN_PAYOUT && !processingPays.length && !!user?.upiId;

  const handleSaveUpi = upiId => {
    const users = sGet('ps:users')??[]; const updated={...user,upiId};
    sSet('ps:users', users.map(u=>u.id===user.id?updated:u)); setUser(updated);
  };

  const handleRequestPayout = async () => {
    setRequesting(true); setReqResult(null);
    await new Promise(r=>setTimeout(r,600));
    const res = requestPayout(user.id);
    setReqResult({ ok:res.ok, message:res.ok?`Payout of ${fmt(res.payout.amount)} requested. We will transfer to ${user.upiId} within 24 hours.`:res.reason });
    setRefresh(r=>r+1); setRequesting(false);
    if (res.ok) setTab('payouts');
  };

  const filteredBookings = useMemo(() =>
    completedBookings
      .filter(b=>filterStatus==='all'||(b.payoutStatus??'pending')===filterStatus)
      .sort((a,b)=>new Date(b.createdAt??b.bookedAt??0)-new Date(a.createdAt??a.bookedAt??0)),
  [completedBookings, filterStatus]);

  if (!user || user.role !== 'host') return (
    <div style={{ padding:40, textAlign:'center', color:C.slate, fontSize:14 }}>
      This page is only available to hosts.
    </div>
  );

  const tabSt = active => ({
    padding:'9px 22px', borderRadius:8, border:'none',
    background:active?C.navy:'transparent',
    color:active?'#fff':C.slate,
    fontFamily:'inherit', fontSize:13.5, fontWeight:600,
    cursor:'pointer', transition:'all .16s',
  });

  return (
    <div style={{ maxWidth:960, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize:28, letterSpacing:-1, color:C.navy, marginBottom:4 }}>Earnings</h1>
          <p style={{ fontSize:14, color:C.slate }}>Track your income, manage payouts and review booking history.</p>
        </div>
        {processingPays.length>0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10, background:'#EDE9FE', border:'1px solid #C4B5FD', fontSize:13, color:'#6D28D9', fontWeight:600 }}>
            <Ic.Clock/>{processingPays.length} payout{processingPays.length>1?'s':''} in progress
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        {/* Pending balance */}
        <div style={{ padding:'22px 20px', borderRadius:18, background:'linear-gradient(145deg,#0B1D35,#142848)', boxShadow:'0 12px 40px rgba(11,29,53,.28)' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Available to Withdraw</div>
          <div style={{ fontWeight:800, fontSize:32, color:'#fff', letterSpacing:-1.5, marginBottom:4 }}>{fmtK(pendingBalance)}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:pendingBalance<MIN_PAYOUT?12:0 }}>
            {pendingBookings.length} booking{pendingBookings.length!==1?'s':''} · min ₹{MIN_PAYOUT}
          </div>
          {pendingBalance < MIN_PAYOUT && (
            <>
              <div style={{ height:4, borderRadius:999, background:'rgba(255,255,255,.1)', overflow:'hidden', marginBottom:5 }}>
                <div style={{ width:`${Math.min(100,(pendingBalance/MIN_PAYOUT)*100)}%`, height:'100%', background:'#3B82F6', borderRadius:999 }}/>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>₹{(MIN_PAYOUT-pendingBalance).toFixed(2)} more needed</div>
            </>
          )}
          {pendingBalance>=MIN_PAYOUT && !processingPays.length && !user?.upiId && (
            <div style={{ fontSize:11, color:'#FCD34D', display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
              <Ic.Alert/>Add UPI ID to withdraw
            </div>
          )}
        </div>

        {/* Total paid out */}
        <div style={{ padding:'22px 20px', borderRadius:18, background:'#EAFAF3', border:'1px solid #A7F0CC' }}>
          <div style={{ fontSize:11, color:'#059669', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Total Paid Out</div>
          <div style={{ fontWeight:800, fontSize:32, color:'#065F46', letterSpacing:-1.5, marginBottom:4 }}>{fmtK(totalEarned)}</div>
          <div style={{ fontSize:12, color:'#6EE7B7' }}>{payouts.filter(p=>p.status==='paid').length} payout{payouts.filter(p=>p.status==='paid').length!==1?'s':''} completed</div>
        </div>

        {/* Gross revenue */}
        <div style={{ padding:'22px 20px', borderRadius:18, background:C.blueSoft, border:`1px solid ${C.blueLight}` }}>
          <div style={{ fontSize:11, color:C.blue, textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Gross Revenue</div>
          <div style={{ fontWeight:800, fontSize:32, color:C.navy, letterSpacing:-1.5, marginBottom:4 }}>{fmtK(totalRevenue)}</div>
          <div style={{ fontSize:12, color:C.slateL }}>Across {totalBookings} booking{totalBookings!==1?'s':''}</div>
        </div>

        {/* Platform fee */}
        <div style={{ padding:'22px 20px', borderRadius:18, background:'#F5F7FC', border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.slateL, textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Platform Fee</div>
          <div style={{ fontWeight:800, fontSize:32, color:C.navy, letterSpacing:-1.5, marginBottom:4 }}>{fmtK(totalCommission)}</div>
          <div style={{ fontSize:12, color:C.slateL }}>{(COMMISSION_RATE*100).toFixed(0)}% of gross revenue</div>
        </div>
      </div>

      {/* UPI ID */}
      <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:'20px 22px', marginBottom:24, boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Ic.Bank/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:C.navy }}>Payout UPI ID</div>
            <div style={{ fontSize:12, color:C.slateL }}>Payouts are sent directly to this UPI ID</div>
          </div>
        </div>
        <UpiEditor user={user} onSave={handleSaveUpi}/>
      </div>

      {/* Result banner */}
      {reqResult && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', borderRadius:12, marginBottom:20, background:reqResult.ok?'#EAFAF3':'#FEF2F2', border:`1px solid ${reqResult.ok?'#A7F0CC':'#FECACA'}`, fontSize:13, color:reqResult.ok?'#065F46':'#B91C1C' }}>
          {reqResult.ok?<Ic.Check/>:<Ic.Alert/>}{reqResult.message}
        </div>
      )}

      {/* Withdraw CTA */}
      {!reqResult && pendingBalance>0 && (
        <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:'20px 22px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:4 }}>
              {canRequest?`₹${pendingBalance.toFixed(2)} ready to withdraw`:'Build your balance'}
            </div>
            <div style={{ fontSize:13, color:C.slate }}>
              {!user?.upiId?'Add a UPI ID above to enable withdrawals.'
               :processingPays.length?`${fmt(processingAmt)} payout is already being processed.`
               :pendingBalance<MIN_PAYOUT?`Minimum is ₹${MIN_PAYOUT}. Need ₹${(MIN_PAYOUT-pendingBalance).toFixed(2)} more.`
               :`${pendingBookings.length} completed booking${pendingBookings.length!==1?'s':''} · sends to ${user.upiId}`}
            </div>
          </div>
          <button onClick={handleRequestPayout} disabled={!canRequest||requesting} style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:10, border:'none',
            background:canRequest&&!requesting?'linear-gradient(135deg,#1354F9,#0C43DC)':'#CBD5E1',
            color:'#fff', fontSize:14, fontWeight:700,
            cursor:canRequest&&!requesting?'pointer':'not-allowed',
            fontFamily:'inherit', boxShadow:canRequest?'0 4px 16px rgba(19,84,249,.3)':'none',
            transition:'all .18s', whiteSpace:'nowrap',
          }}>
            {requesting?<><Spinner/>Processing…</>:<>{`Withdraw ${fmt(pendingBalance)}`}<Ic.Arrow/></>}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', background:C.bg, borderRadius:12, padding:4, gap:3, marginBottom:22, border:`1px solid ${C.border}` }}>
        {[['overview','Overview'],['history','Booking History'],['payouts','Payout History']].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={tabSt(tab===k)}>{lb}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (
        <div>
          <MonthlySummary bookings={completedBookings}/>
          <div style={{ background:'#fff', borderRadius:16, border:`1px solid ${C.border}`, padding:'22px', marginTop:18, boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:C.navy, marginBottom:16 }}>How payouts work</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                {n:'01',color:'#3B82F6',title:'Booking confirmed', body:'Driver pays full amount. Amount is added to your pending balance immediately.'},
                {n:'02',color:'#8B5CF6',title:'Request withdrawal',body:`Once your balance reaches ₹${MIN_PAYOUT}, tap "Withdraw". We process within 24 hours.`},
                {n:'03',color:'#10B981',title:'Receive payment',   body:'Amount sent directly to your UPI ID. You receive 85% of each booking.'},
              ].map(({n,color,title,body})=>(
                <div key={n} style={{ padding:'16px', borderRadius:12, background:C.bg, border:`1px solid ${C.border}` }}>
                  <div style={{ width:32,height:32,borderRadius:9,background:`${color}22`,border:`1.5px solid ${color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color,marginBottom:12 }}>{n}</div>
                  <div style={{ fontWeight:700,fontSize:13.5,color:C.navy,marginBottom:6 }}>{title}</div>
                  <div style={{ fontSize:12.5,color:C.slate,lineHeight:1.65 }}>{body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16,padding:'12px 16px',borderRadius:10,background:C.blueSoft,border:`1px solid ${C.blueLight}`,fontSize:12.5,color:C.slate,display:'flex',alignItems:'flex-start',gap:8 }}>
              <Ic.Info/>
              <span>ParkSpot charges <strong>{(COMMISSION_RATE*100).toFixed(0)}%</strong>. You keep <strong>{((1-COMMISSION_RATE)*100).toFixed(0)}%</strong>. The ₹15 service fee paid by drivers is separate and kept by ParkSpot.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING HISTORY ── */}
      {tab==='history' && (
        <div style={{ background:'#fff',borderRadius:16,border:`1px solid ${C.border}`,overflow:'hidden',boxShadow:'0 2px 8px rgba(11,29,53,.05)' }}>
          <div style={{ padding:'14px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:600,color:C.slate,marginRight:4 }}>
              <Ic.Filter/>Filter
            </div>
            {[['all','All'],['pending','Pending'],['processing','Processing'],['paid','Paid']].map(([v,lb])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 14px',borderRadius:8,border:'none',fontFamily:'inherit',background:filterStatus===v?C.navy:'#F5F7FC',color:filterStatus===v?'#fff':C.slate,fontSize:12.5,fontWeight:600,cursor:'pointer',transition:'all .14s' }}>{lb}</button>
            ))}
            <span style={{ marginLeft:'auto',fontSize:12,color:C.slateL }}>{filteredBookings.length} booking{filteredBookings.length!==1?'s':''}</span>
          </div>
          {filteredBookings.length===0?(
            <div style={{ padding:48,textAlign:'center',color:C.slateL,fontSize:14 }}>No bookings found.</div>
          ):(
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    {['Date','Booking ID','Driver','Space','Dur.','Gross','Commission','You Earn','Payout'].map(h=>(
                      <th key={h} style={{ padding:'11px 14px',textAlign:'left',fontWeight:600,color:C.slateL,fontSize:11,textTransform:'uppercase',letterSpacing:.7,whiteSpace:'nowrap',borderBottom:`1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b,i)=>{
                    const {totalAmount,commission,hostEarning}=calcEarnings(b.totalAmount??b.total??0);
                    const dur=b.durationHours??b.duration??'—';
                    return(
                      <tr key={b.id} style={{ borderBottom:i<filteredBookings.length-1?`1px solid ${C.bg}`:'none' }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 14px',color:C.slateL,fontSize:12,whiteSpace:'nowrap' }}>
                          <div>{fmtDate(b.startTime??b.date??b.bookedAt)}</div>
                          <div style={{ fontSize:11,color:'#CBD5E1' }}>{fmtTime(b.startTime??b.date??b.bookedAt)}</div>
                        </td>
                        <td style={{ padding:'12px 14px',fontFamily:'monospace',fontSize:11,color:C.slateL }}>{(b.id??'').slice(0,10).toUpperCase()}</td>
                        <td style={{ padding:'12px 14px',fontWeight:500,color:C.navy }}>{b.driverName??'—'}</td>
                        <td style={{ padding:'12px 14px',color:C.slate,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{b.listingTitle??'—'}</td>
                        <td style={{ padding:'12px 14px',color:C.slate,whiteSpace:'nowrap' }}>{dur}{dur!=='—'?'h':''}</td>
                        <td style={{ padding:'12px 14px',fontWeight:500,color:C.navy }}>{fmt(totalAmount)}</td>
                        <td style={{ padding:'12px 14px',color:'#EF4444' }}>−{fmt(commission)}</td>
                        <td style={{ padding:'12px 14px',fontWeight:700,color:'#059669' }}>{fmt(hostEarning)}</td>
                        <td style={{ padding:'12px 14px' }}><StatusPill status={b.payoutStatus??'pending'}/></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background:C.bg,borderTop:`2px solid ${C.border}` }}>
                    <td colSpan={5} style={{ padding:'12px 14px',fontWeight:700,fontSize:12,color:C.slate }}>Total ({filteredBookings.length})</td>
                    <td style={{ padding:'12px 14px',fontWeight:700,color:C.navy }}>{fmt(filteredBookings.reduce((s,b)=>s+(b.totalAmount??b.total??0),0))}</td>
                    <td style={{ padding:'12px 14px',fontWeight:700,color:'#EF4444' }}>−{fmt(filteredBookings.reduce((s,b)=>s+calcEarnings(b.totalAmount??b.total??0).commission,0))}</td>
                    <td style={{ padding:'12px 14px',fontWeight:700,color:'#059669' }}>{fmt(filteredBookings.reduce((s,b)=>s+calcEarnings(b.totalAmount??b.total??0).hostEarning,0))}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAYOUT HISTORY ── */}
      {tab==='payouts' && (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {payouts.length===0?(
            <div style={{ padding:48,textAlign:'center',background:'#fff',borderRadius:16,border:`1px solid ${C.border}`,color:C.slateL,fontSize:14 }}>
              No payouts yet. Once your balance reaches ₹{MIN_PAYOUT}, you can request your first withdrawal.
            </div>
          ):payouts.map(p=>(
            <PayoutCard key={p.id} payout={p} upiId={user?.upiId}/>
          ))}
        </div>
      )}
    </div>
  );
}