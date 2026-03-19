// Security helpers: hashing, sanitisation, tokens, card validation

const encoder = new TextEncoder();

async function sha256(message) {
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPw(plain) {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const digest = await sha256(salt + plain);
  return `${salt}:${digest}`;
}

export async function verifyPw(plain, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, digest] = stored.split(':');
  const verifyDigest = await sha256(salt + plain);
  return verifyDigest === digest;
}

export function genToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Basic input sanitisation
export function clean(value, maxLen = 160) {
  if (!value) return '';
  let v = String(value);
  v = v.slice(0, maxLen);
  v = v.replace(/<[^>]*>/gi, '');
  v = v.replace(/javascript:/gi, '');
  v = v.replace(/on\w+=/gi, '');
  return v.trim();
}

export function pwStrength(pw) {
  if (!pw) return { score: 0, label: 'Weak' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score, label: labels[score] || 'Weak' };
}

const ALLOWED_IMG_HOSTS = ['images.unsplash.com', 'unsplash.com', 'imgur.com', 'i.imgur.com', 'res.cloudinary.com', 'cloudinary.com'];

export function sanitizeImageUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (ALLOWED_IMG_HOSTS.includes(u.hostname)) return url;
    return '';
  } catch {
    return '';
  }
}

// Luhn algorithm for card validation
export function luhn(cardNumber) {
  const digits = (cardNumber || '').replace(/\D/g, '');
  if (!digits) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

