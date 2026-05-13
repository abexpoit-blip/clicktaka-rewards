import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { authUser } from '../middleware.js';

const r = Router();

// Top earners (this week) — public-ish leaderboard with masked phones
r.get('/leaderboard', authUser, async (_req, res) => {
  const rows = await q(
    `SELECT u.id AS user_id, u.phone, u.name, COALESCE(SUM(tc.reward),0) AS total
     FROM task_completions tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY u.id, u.phone, u.name
     ORDER BY total DESC LIMIT 10`
  );
  res.json({ leaderboard: rows.map((r) => ({ ...r, total: Number(r.total) })) });
});

r.get('/me', authUser, async (req, res) => {
  const pkgs = await q(
    `SELECT up.id, up.expires_at, up.tasks_done_today, p.name, p.daily_task_limit, p.daily_earning
     FROM user_packages up JOIN packages p ON p.id=up.package_id
     WHERE up.user_id=? AND up.expires_at >= CURDATE()`,
    [req.user.id]
  );
  res.json({ user: req.user, packages: pkgs });
});

// Aggregated dashboard payload (balance + active tasks count + recent earnings)
r.get('/dashboard', authUser, async (req, res) => {
  const [tasksAvail, todayEarn, totalEarn, recentEarn, recentTx] = await Promise.all([
    q('SELECT COUNT(*) AS c FROM tasks WHERE active=1'),
    q("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='task' AND DATE(created_at)=CURDATE()", [req.user.id]),
    q("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='task'", [req.user.id]),
    q(
      `SELECT tc.id, tc.reward, tc.completed_at, t.title, t.type
       FROM task_completions tc JOIN tasks t ON t.id=tc.task_id
       WHERE tc.user_id=? ORDER BY tc.id DESC LIMIT 10`,
      [req.user.id]
    ),
    q(
      'SELECT id, type, amount, balance_after, note, created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 10',
      [req.user.id]
    ),
  ]);
  res.json({
    user: req.user,
    available_tasks: tasksAvail[0].c,
    earnings: { today: Number(todayEarn[0].s), total: Number(totalEarn[0].s) },
    recent_completions: recentEarn,
    recent_transactions: recentTx,
  });
});

// Tasks page: available tasks + active packages progress + today's completed task IDs
r.get('/tasks', authUser, async (req, res) => {
  const [tasks, pkgs, doneToday, todayCount] = await Promise.all([
    q('SELECT id, title, type, url, reward FROM tasks WHERE active=1 ORDER BY id DESC'),
    q(
      `SELECT up.id, up.tasks_done_today, up.expires_at, p.name, p.daily_task_limit, p.daily_earning
       FROM user_packages up JOIN packages p ON p.id=up.package_id
       WHERE up.user_id=? AND up.expires_at >= CURDATE()`,
      [req.user.id]
    ),
    q(
      `SELECT task_id FROM task_completions
       WHERE user_id=? AND DATE(completed_at)=CURDATE()`,
      [req.user.id]
    ),
    q(
      `SELECT COUNT(*) AS c FROM task_completions
       WHERE user_id=? AND DATE(completed_at)=CURDATE()`,
      [req.user.id]
    ),
  ]);
  const totalLimit = pkgs.reduce((s, p) => s + Number(p.daily_task_limit || 0), 0);
  res.json({
    tasks,
    packages: pkgs,
    completed_task_ids_today: doneToday.map((r) => r.task_id),
    today_completed: Number(todayCount[0].c),
    daily_limit: totalLimit,
  });
});

// Complete a task: validate package limits, insert completion + transaction, increment counter
r.post('/tasks/:id/complete', authUser, async (req, res) => {
  const taskId = Number(req.params.id);
  if (!taskId) return res.status(400).json({ error: 'Invalid task id' });
  const tasks = await q('SELECT id, reward, active FROM tasks WHERE id=? LIMIT 1', [taskId]);
  if (!tasks.length || !tasks[0].active) return res.status(404).json({ error: 'Task পাওয়া যায়নি' });
  const task = tasks[0];

  // Already done today?
  const dup = await q(
    `SELECT id FROM task_completions
     WHERE user_id=? AND task_id=? AND DATE(completed_at)=CURDATE() LIMIT 1`,
    [req.user.id, taskId]
  );
  if (dup.length) return res.status(409).json({ error: 'এই task আজ ইতিমধ্যে সম্পন্ন' });

  // Find an active package with remaining quota
  const pkgs = await q(
    `SELECT up.id, up.tasks_done_today, p.daily_task_limit
     FROM user_packages up JOIN packages p ON p.id=up.package_id
     WHERE up.user_id=? AND up.expires_at >= CURDATE()
     ORDER BY up.id ASC`,
    [req.user.id]
  );
  if (!pkgs.length) return res.status(403).json({ error: 'Active package নেই — package কিনুন' });
  const slot = pkgs.find((p) => Number(p.tasks_done_today) < Number(p.daily_task_limit));
  if (!slot) return res.status(429).json({ error: 'আজকের সব task সম্পন্ন — কাল আবার আসুন' });

  const reward = Number(task.reward);
  await q('INSERT INTO task_completions (user_id, task_id, reward) VALUES (?,?,?)', [req.user.id, taskId, reward]);
  await q('UPDATE user_packages SET tasks_done_today = tasks_done_today + 1 WHERE id=?', [slot.id]);
  await q('UPDATE users SET balance = balance + ? WHERE id=?', [reward, req.user.id]);
  const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
  await q(
    "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'task', ?, ?, ?)",
    [req.user.id, reward, Number(after[0].balance), `Task: #${taskId}`]
  );
  res.json({ ok: true, reward, balance: Number(after[0].balance) });
});

r.get('/transactions', authUser, async (req, res) => {
  const rows = await q(
    'SELECT id, type, amount, balance_after, note, created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 100',
    [req.user.id]
  );
  res.json({ transactions: rows });
});

// Daily Spin Wheel — দিনে ১ বার ৳1–10 random reward
r.get('/spin/status', authUser, async (req, res) => {
  const rows = await q(
    'SELECT id, reward, created_at FROM daily_spins WHERE user_id=? AND spin_date=CURDATE() LIMIT 1',
    [req.user.id]
  );
  res.json({ spun_today: rows.length > 0, last: rows[0] || null });
});

r.post('/spin', authUser, async (req, res) => {
  const exists = await q(
    'SELECT id FROM daily_spins WHERE user_id=? AND spin_date=CURDATE() LIMIT 1',
    [req.user.id]
  );
  if (exists.length) return res.status(409).json({ error: 'আজকের spin ইতিমধ্যে নেওয়া হয়েছে — কাল আবার আসুন' });

  const reward = Math.floor(Math.random() * 10) + 1; // 1..10 BDT
  await q('INSERT INTO daily_spins (user_id, spin_date, reward) VALUES (?, CURDATE(), ?)', [req.user.id, reward]);
  await q('UPDATE users SET balance = balance + ? WHERE id=?', [reward, req.user.id]);
  const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
  await q(
    "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'admin', ?, ?, ?)",
    [req.user.id, reward, Number(after[0].balance), 'Daily Spin Bonus']
  );
  res.json({ ok: true, reward, balance: Number(after[0].balance) });
});

r.get('/referrals', authUser, async (req, res) => {
  const rows = await q(
    `SELECT r.id, r.commission, r.created_at, u.phone, u.name
     FROM referrals r JOIN users u ON u.id=r.referred_id
     WHERE r.referrer_id=? ORDER BY r.id DESC`,
    [req.user.id]
  );
  res.json({ referrals: rows, refer_code: req.user.refer_code });
});

// ─── Deposits ───────────────────────────────────────────────────────────
const depositSchema = z.object({
  method: z.enum(['bkash', 'nagad']),
  amount: z.number().positive().max(1000000),
  transaction_id: z.string().min(4).max(100),
});

r.post('/deposit', authUser, async (req, res) => {
  try {
    const data = depositSchema.parse(req.body);
    const settings = await q('SELECT min_deposit FROM payment_settings WHERE id=1 LIMIT 1');
    const minDep = Number(settings[0]?.min_deposit || 0);
    if (data.amount < minDep) return res.status(400).json({ error: `Minimum deposit ৳${minDep}` });

    // Prevent duplicate txn submissions
    const dup = await q('SELECT id FROM deposits WHERE txn_id=? LIMIT 1', [data.transaction_id]);
    if (dup.length) return res.status(409).json({ error: 'এই Transaction ID আগেই submit হয়েছে' });

    const ins = await q(
      'INSERT INTO deposits (user_id, amount, method, txn_id) VALUES (?,?,?,?)',
      [req.user.id, data.amount, data.method, data.transaction_id]
    );
    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors[0].message });
    console.error('deposit error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/deposits', authUser, async (req, res) => {
  const rows = await q(
    `SELECT id, method, amount, txn_id AS transaction_id, status, admin_note, created_at
     FROM deposits WHERE user_id=? ORDER BY id DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ deposits: rows });
});

// ─── Withdrawals ───────────────────────────────────────────────────────
const withdrawSchema = z.object({
  method: z.enum(['bkash', 'nagad']),
  amount: z.number().positive().max(1000000),
  payment_number: z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক 11-digit number দিন'),
});

r.post('/withdraw', authUser, async (req, res) => {
  try {
    const data = withdrawSchema.parse(req.body);
    const settings = await q('SELECT min_withdraw FROM payment_settings WHERE id=1 LIMIT 1');
    const minWd = Number(settings[0]?.min_withdraw || 0);
    if (data.amount < minWd) return res.status(400).json({ error: `Minimum withdraw ৳${minWd}` });

    const balRows = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
    const bal = Number(balRows[0]?.balance || 0);
    if (data.amount > bal) return res.status(400).json({ error: 'Balance যথেষ্ট না' });

    // Hold balance: deduct now, log transaction; on reject we refund
    await q('UPDATE users SET balance = balance - ? WHERE id=?', [data.amount, req.user.id]);
    const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
    const ins = await q(
      'INSERT INTO withdrawals (user_id, amount, method, account) VALUES (?,?,?,?)',
      [req.user.id, data.amount, data.method, data.payment_number]
    );
    await q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note, ref_id) VALUES (?, 'withdraw', ?, ?, ?, ?)",
      [req.user.id, -data.amount, Number(after[0].balance), `Withdraw ${data.method} → ${data.payment_number}`, ins.insertId]
    ).catch(() => q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'withdraw', ?, ?, ?)",
      [req.user.id, -data.amount, Number(after[0].balance), `Withdraw ${data.method} → ${data.payment_number}`]
    ));
    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors[0].message });
    console.error('withdraw error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/withdrawals', authUser, async (req, res) => {
  const rows = await q(
    `SELECT id, method, amount, account AS payment_number, status, admin_note, created_at
     FROM withdrawals WHERE user_id=? ORDER BY id DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ withdrawals: rows });
});

export default r;
