import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { hashPassword, verifyPassword, signToken, genReferCode, setAuthCookie, clearAuthCookie, verifyToken } from '../auth.js';

const r = Router();

const phoneRx = /^(?:\+?88)?01[3-9]\d{8}$/;

r.post('/register', async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().regex(phoneRx, 'সঠিক বাংলাদেশী নম্বর দিন'),
      password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'),
      name: z.string().min(1).max(100).optional(),
      refer_by: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await q('SELECT id FROM users WHERE phone=?', [data.phone]);
    if (existing.length) return res.status(409).json({ error: 'এই নম্বরে আগেই রেজিস্টার হয়েছে' });

    let referById = null;
    if (data.refer_by) {
      const rows = await q('SELECT id FROM users WHERE refer_code=? LIMIT 1', [data.refer_by]);
      if (rows.length) referById = rows[0].id;
    }

    const hash = await hashPassword(data.password);
    let referCode;
    for (let i = 0; i < 5; i++) {
      referCode = genReferCode();
      const exist = await q('SELECT id FROM users WHERE refer_code=?', [referCode]);
      if (!exist.length) break;
    }

    // Join bonus is credited AFTER first package activation (see /user/packages/:id/buy)
    const result = await q(
      'INSERT INTO users (phone, password_hash, name, refer_code, refer_by, balance) VALUES (?,?,?,?,?,?)',
      [data.phone, hash, data.name || null, referCode, referById, 0]
    );

    if (referById) {
      await q('INSERT INTO referrals (referrer_id, referred_id, level) VALUES (?,?,1)', [referById, result.insertId]);
    }

    const token = signToken({ uid: result.insertId });
    setAuthCookie(res, token);
    res.json({ ok: true, user: { id: result.insertId, phone: data.phone, refer_code: referCode } });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors[0].message });
    console.error('register error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().regex(phoneRx),
      password: z.string().min(1),
    });
    const data = schema.parse(req.body);

    const rows = await q('SELECT id, password_hash, status, is_admin FROM users WHERE phone=? LIMIT 1', [data.phone]);
    if (!rows.length) return res.status(401).json({ error: 'নম্বর বা পাসওয়ার্ড ভুল' });
    const u = rows[0];
    const ok = await verifyPassword(data.password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'নম্বর বা পাসওয়ার্ড ভুল' });
    if (u.status === 'blocked') return res.status(403).json({ error: 'Account blocked' });

    const token = signToken({ uid: u.id });
    setAuthCookie(res, token);
    res.json({ ok: true, is_admin: !!u.is_admin });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors[0].message });
    console.error('login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/admin-login', async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().min(1).max(64),
      password: z.string().min(1).max(200),
    });
    const data = schema.parse(req.body);

    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || '';
    const ADMIN_PHONE = process.env.ADMIN_PHONE || '01700000000';
    if (!ADMIN_PASS) return res.status(500).json({ error: 'Admin not configured' });

    if (data.username !== ADMIN_USER || data.password !== ADMIN_PASS) {
      return res.status(401).json({ error: 'Username বা password ভুল' });
    }

    // find an admin user row to attach the session to
    let rows = await q('SELECT id FROM users WHERE is_admin=1 ORDER BY id ASC LIMIT 1');
    let uid;
    if (rows.length) {
      uid = rows[0].id;
    } else {
      // bootstrap an admin user row (phone is just a placeholder)
      const hash = await hashPassword(ADMIN_PASS);
      const referCode = genReferCode();
      const ins = await q(
        'INSERT INTO users (phone, password_hash, name, refer_code, is_admin) VALUES (?,?,?,?,1)',
        [ADMIN_PHONE, hash, 'Admin', referCode]
      );
      uid = ins.insertId;
    }

    const token = signToken({ uid, admin: true });
    setAuthCookie(res, token);
    res.json({ ok: true, is_admin: true });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors[0].message });
    console.error('admin-login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Exit user impersonation — restores the original admin session
r.post('/exit-impersonation', async (req, res) => {
  const token = req.cookies?.ct_token;
  if (!token) return res.status(401).json({ error: 'No active session' });
  const payload = verifyToken(token);
  if (!payload?.imp || !payload?.aid) {
    return res.status(400).json({ error: 'Active impersonation নেই' });
  }
  const rows = await q('SELECT id, is_admin FROM users WHERE id=? LIMIT 1', [payload.aid]);
  if (!rows.length || !rows[0].is_admin) return res.status(403).json({ error: 'Admin user পাওয়া যায়নি' });
  const newToken = signToken({ uid: rows[0].id, admin: true });
  setAuthCookie(res, newToken);
  res.json({ ok: true });
});

export default r;
