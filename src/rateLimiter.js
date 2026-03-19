// Simple in-memory + localStorage-backed rate limiter
// key shape: `${scope}:${emailOrUserId}`

const WINDOW_MS = {
  login: 2 * 60 * 1000,
  booking: 60 * 60 * 1000,
  listing: 60 * 60 * 1000
};

const LIMIT = {
  login: 5,
  booking: 10,
  listing: 5
};

function now() {
  return Date.now();
}

export function hit(scope, id) {
  const k = `ps:rl:${scope}:${id}`;
  let state;
  try {
    state = JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    state = null;
  }
  const ts = now();
  const win = WINDOW_MS[scope];
  const lim = LIMIT[scope];
  if (!win || !lim) return { allowed: true, remaining: lim, resetInMs: 0 };
  if (!state) {
    state = { count: 1, start: ts };
  } else {
    if (ts - state.start > win) {
      state = { count: 1, start: ts };
    } else {
      state.count += 1;
    }
  }
  const remaining = Math.max(0, lim - state.count);
  const resetInMs = win - (ts - state.start);
  const allowed = state.count <= lim;
  try {
    localStorage.setItem(k, JSON.stringify(state));
  } catch {
    // ignore
  }
  return { allowed, remaining, resetInMs };
}

