import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import './env.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

export function genReferCode() {
  return 'CT' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function setAuthCookie(res, token) {
  res.cookie('ct_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}
export function clearAuthCookie(res) {
  res.clearCookie('ct_token', {
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}
