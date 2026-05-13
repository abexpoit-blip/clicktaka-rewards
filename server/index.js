import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // behind nginx

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
  credentials: true,
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Public: packages list
import { q } from './db.js';
app.get('/api/packages', async (req, res) => {
  const rows = await q('SELECT id, name, price, daily_task_limit, daily_earning, validity_days FROM packages WHERE active=1 ORDER BY price ASC');
  res.json({ packages: rows });
});
app.get('/api/notices', async (req, res) => {
  const rows = await q('SELECT id, title, body, created_at FROM notices WHERE active=1 ORDER BY id DESC LIMIT 5');
  res.json({ notices: rows });
});

// Public payment settings (numbers + min limits) — used by deposit/withdraw forms
app.get('/api/payment-settings', async (_req, res) => {
  const rows = await q(
    'SELECT bkash_number, nagad_number, min_deposit, min_withdraw, referral_percent FROM payment_settings WHERE id=1 LIMIT 1'
  );
  const s = rows[0] || { bkash_number: '', nagad_number: '', min_deposit: 500, min_withdraw: 500, referral_percent: 10 };
  res.json({
    settings: {
      bkash_number: s.bkash_number,
      nagad_number: s.nagad_number,
      min_deposit: Number(s.min_deposit),
      min_withdraw: Number(s.min_withdraw),
      referral_percent: Number(s.referral_percent),
    },
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`✓ ClickTaka API on :${PORT}`));
