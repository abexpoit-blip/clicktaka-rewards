import { verifyToken } from './auth.js';
import { q } from './db.js';

export async function authUser(req, res, next) {
  const token = req.cookies?.ct_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(token);
  if (!payload?.uid) return res.status(401).json({ error: 'Invalid token' });
  const rows = await q('SELECT id, phone, name, balance, refer_code, is_admin, status FROM users WHERE id=? LIMIT 1', [payload.uid]);
  if (!rows.length) return res.status(401).json({ error: 'User not found' });
  if (rows[0].status === 'blocked') return res.status(403).json({ error: 'Account blocked' });
  req.user = rows[0];
  req.session = { imp: !!payload.imp, aid: payload.aid || null };
  next();
}

export async function authAdmin(req, res, next) {
  await authUser(req, res, () => {
    if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin only' });
    next();
  });
}
