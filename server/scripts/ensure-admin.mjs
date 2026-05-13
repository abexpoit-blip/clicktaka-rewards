import '../env.js';
import { q } from '../db.js';
import { hashPassword, genReferCode } from '../auth.js';

const adminPhone = process.env.ADMIN_PHONE || '01700000000';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

if (!adminPassword) {
  throw new Error('ADMIN_PASSWORD is required to create the admin user');
}

async function uniqueReferCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = genReferCode();
    const rows = await q('SELECT id FROM users WHERE refer_code=? LIMIT 1', [code]);
    if (!rows.length) return code;
  }
  return `CT${Date.now().toString(36).toUpperCase()}`;
}

const hash = await hashPassword(adminPassword);
const existing = await q('SELECT id FROM users WHERE phone=? LIMIT 1', [adminPhone]);

if (existing.length) {
  await q(
    "UPDATE users SET password_hash=?, name=COALESCE(name, 'Admin'), status='active', is_admin=1 WHERE id=?",
    [hash, existing[0].id]
  );
  console.log(`✓ Admin user updated: ${adminPhone}`);
} else {
  await q(
    'INSERT INTO users (phone, password_hash, name, refer_code, is_admin, status) VALUES (?,?,?,?,1,\'active\')',
    [adminPhone, hash, 'Admin', await uniqueReferCode()]
  );
  console.log(`✓ Admin user created: ${adminPhone}`);
}

process.exit(0);