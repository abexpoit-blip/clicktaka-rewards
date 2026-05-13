import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { hashPassword, verifyPassword, signToken, genReferCode, setAuthCookie, clearAuthCookie } from '../auth.js';

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

    const result = await q(
      'INSERT INTO users (phone, password_hash, name, refer_code, refer_by) VALUES (?,?,?,?,?)',
      [data.phone, hash, data.name || null, referCode, referById]
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

r.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default r;
