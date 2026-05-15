import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { authAdmin } from '../middleware.js';
import { signToken, setAuthCookie } from '../auth.js';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const r = Router();

function findRepoRoot(start = process.cwd()) {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function readGitInfo() {
  const repo = findRepoRoot();
  const gitDir = path.join(repo, '.git');
  const empty = { full_commit: null, branch: null, message: null, author: null, commit_time: null };
  try {
    let head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    let branch = null;
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5);
      branch = ref.replace(/^refs\/heads\//, '');
      head = fs.readFileSync(path.join(gitDir, ref), 'utf8').trim();
    }
    const objectPath = path.join(gitDir, 'objects', head.slice(0, 2), head.slice(2));
    if (!fs.existsSync(objectPath)) return { ...empty, full_commit: head, branch };
    const raw = zlib.inflateSync(fs.readFileSync(objectPath)).toString('utf8');
    const body = raw.slice(raw.indexOf('\0') + 1);
    const [headers, ...messageParts] = body.split('\n\n');
    const authorLine = headers.split('\n').find((line) => line.startsWith('author '));
    const authorMatch = authorLine?.match(/^author\s+(.+?)\s+<.*>\s+(\d+)\s+([+-]\d{4})$/);
    const commitTime = authorMatch ? new Date(Number(authorMatch[2]) * 1000).toISOString() : null;
    return { ...empty, full_commit: head, branch, message: messageParts.join('\n\n').split('\n')[0] || null, author: authorMatch?.[1] || null, commit_time: commitTime };
  } catch {
    return empty;
  }
}

// Overview stats
r.get('/stats', authAdmin, async (req, res) => {
  const [users, activeUsers, blocked, totalEarnings, pendingDep, pendingWd, totalTasks, activeTasks, totalCompletions, todayCompletions] = await Promise.all([
    q('SELECT COUNT(*) AS c FROM users'),
    q("SELECT COUNT(*) AS c FROM users WHERE status='active'"),
    q("SELECT COUNT(*) AS c FROM users WHERE status='blocked'"),
    q("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE type='task'"),
    q("SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS s FROM deposits WHERE status='pending'"),
    q("SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS s FROM withdrawals WHERE status='pending'"),
    q('SELECT COUNT(*) AS c FROM tasks'),
    q('SELECT COUNT(*) AS c FROM tasks WHERE active=1'),
    q('SELECT COUNT(*) AS c FROM task_completions'),
    q('SELECT COUNT(*) AS c FROM task_completions WHERE DATE(completed_at)=CURDATE()'),
  ]);
  res.json({
    users: { total: users[0].c, active: activeUsers[0].c, blocked: blocked[0].c },
    earnings: { total_paid_out: Number(totalEarnings[0].s) },
    deposits_pending: { count: pendingDep[0].c, amount: Number(pendingDep[0].s) },
    withdrawals_pending: { count: pendingWd[0].c, amount: Number(pendingWd[0].s) },
    tasks: { total: totalTasks[0].c, active: activeTasks[0].c },
    completions: { total: totalCompletions[0].c, today: todayCompletions[0].c },
  });
});

// Users list (paginated, search)
r.get('/users', authAdmin, async (req, res) => {
  const search = (req.query.search || '').toString().trim();
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const where = search ? 'WHERE phone LIKE ? OR name LIKE ?' : '';
  const params = search ? [`%${search}%`, `%${search}%`, limit] : [limit];
  const rows = await q(
    `SELECT id, phone, name, balance, refer_code, status, is_admin, created_at
     FROM users ${where} ORDER BY id DESC LIMIT ?`,
    params
  );
  res.json({ users: rows });
});

// Toggle block
r.post('/users/:id/block', authAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const u = await q('SELECT status FROM users WHERE id=?', [id]);
  if (!u.length) return res.status(404).json({ error: 'Not found' });
  const next = u[0].status === 'blocked' ? 'active' : 'blocked';
  await q('UPDATE users SET status=? WHERE id=?', [next, id]);
  res.json({ ok: true, status: next });
});

// Login as user (impersonate) — replaces admin session with that user's session
r.post('/users/:id/impersonate', authAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const rows = await q('SELECT id, status, is_admin FROM users WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  if (rows[0].is_admin) return res.status(400).json({ error: 'অন্য admin-কে impersonate করা যাবে না' });
  if (rows[0].status === 'blocked') return res.status(400).json({ error: 'Blocked user' });
  const token = signToken({ uid: id, imp: true });
  setAuthCookie(res, token);
  res.json({ ok: true });
});

// Lightweight package list (used in task editor multi-select)
r.get('/packages', authAdmin, async (_req, res) => {
  const rows = await q('SELECT id, name, price FROM packages WHERE active=1 ORDER BY price ASC');
  res.json({ packages: rows });
});

// Tasks list (with description + package_ids)
r.get('/tasks', authAdmin, async (_req, res) => {
  const rows = await q(
    `SELECT t.id, t.title, t.description, t.type, t.url, t.reward, t.active, t.created_at,
            (SELECT COUNT(*) FROM task_completions tc WHERE tc.task_id=t.id) AS completions
     FROM tasks t ORDER BY t.id DESC LIMIT 200`
  );
  const links = await q('SELECT task_id, package_id FROM task_packages').catch(() => []);
  const map = new Map();
  for (const l of links) {
    if (!map.has(l.task_id)) map.set(l.task_id, []);
    map.get(l.task_id).push(l.package_id);
  }
  res.json({
    tasks: rows.map((t) => ({ ...t, package_ids: map.get(t.id) || [] })),
  });
});

const taskInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['signup', 'ad', 'video', 'survey', 'app', 'social', 'game']).default('ad'),
  url: z.string().url().optional().or(z.literal('')),
  reward: z.number().min(0).max(10000),
  active: z.boolean().default(true),
  package_ids: z.array(z.number().int().positive()).max(50).optional().default([]),
});

async function setTaskPackages(taskId, ids) {
  await q('DELETE FROM task_packages WHERE task_id=?', [taskId]).catch(() => {});
  if (!ids || !ids.length) return;
  // dedupe
  const uniq = [...new Set(ids.map(Number))].filter(Boolean);
  if (!uniq.length) return;
  const values = uniq.map(() => '(?,?)').join(',');
  const params = uniq.flatMap((pid) => [taskId, pid]);
  await q(`INSERT IGNORE INTO task_packages (task_id, package_id) VALUES ${values}`, params);
}

// Create task
r.post('/tasks', authAdmin, async (req, res) => {
  try {
    const data = taskInputSchema.parse(req.body);
    const r2 = await q(
      'INSERT INTO tasks (title, description, type, url, reward, active) VALUES (?,?,?,?,?,?)',
      [data.title, data.description || null, data.type, data.url || null, data.reward, data.active ? 1 : 0]
    );
    await setTaskPackages(r2.insertId, data.package_ids);
    res.json({ ok: true, id: r2.insertId });
  } catch (e) {
    res.status(400).json({ error: e?.errors?.[0]?.message || 'Invalid input' });
  }
});

// Update task
r.put('/tasks/:id', authAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = taskInputSchema.parse(req.body);
    const exists = await q('SELECT id FROM tasks WHERE id=?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Not found' });
    await q(
      'UPDATE tasks SET title=?, description=?, type=?, url=?, reward=?, active=? WHERE id=?',
      [data.title, data.description || null, data.type, data.url || null, data.reward, data.active ? 1 : 0, id]
    );
    await setTaskPackages(id, data.package_ids);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e?.errors?.[0]?.message || 'Invalid input' });
  }
});

// Toggle task active
r.post('/tasks/:id/toggle', authAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const t = await q('SELECT active FROM tasks WHERE id=?', [id]);
  if (!t.length) return res.status(404).json({ error: 'Not found' });
  const next = t[0].active ? 0 : 1;
  await q('UPDATE tasks SET active=? WHERE id=?', [next, id]);
  res.json({ ok: true, active: !!next });
});

// Delete task (only if no completions)
r.delete('/tasks/:id', authAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const c = await q('SELECT COUNT(*) AS c FROM task_completions WHERE task_id=?', [id]);
  if (c[0].c > 0) return res.status(409).json({ error: 'Completions আছে — শুধু pause করুন' });
  await q('DELETE FROM tasks WHERE id=?', [id]);
  res.json({ ok: true });
});

// Recent earnings (task completions across all users)
r.get('/earnings', authAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await q(
    `SELECT tc.id, tc.reward, tc.completed_at,
            u.id AS user_id, u.phone, u.name,
            t.title AS task_title, t.type AS task_type
     FROM task_completions tc
     JOIN users u ON u.id = tc.user_id
     JOIN tasks t ON t.id = tc.task_id
     ORDER BY tc.id DESC LIMIT ?`,
    [limit]
  );
  res.json({ earnings: rows });
});

// Deploy / git info
r.get('/deploy-info', authAdmin, async (_req, res) => {
  const git = readGitInfo();
  let deployedAt = null;
  try {
    const candidates = ['dist', '.output', 'build', 'server', '.git/FETCH_HEAD'];
    for (const d of candidates) {
      const p = path.resolve(process.cwd(), d);
      if (fs.existsSync(p)) { deployedAt = fs.statSync(p).mtime.toISOString(); break; }
    }
  } catch {}
  res.json({
    commit: git.full_commit ? git.full_commit.slice(0, 7) : null,
    full_commit: git.full_commit,
    branch: git.branch,
    message: git.message,
    author: git.author,
    commit_time: git.commit_time,
    deployed_at: deployedAt,
    server_time: new Date().toISOString(),
    uptime_sec: Math.floor(process.uptime()),
  });
});

// ─── Payment Settings ──────────────────────────────────────────────────
r.get('/payment-settings', authAdmin, async (_req, res) => {
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

r.put('/payment-settings', authAdmin, async (req, res) => {
  try {
    const data = z.object({
      bkash_number: z.string().max(50).default(''),
      nagad_number: z.string().max(50).default(''),
      min_deposit: z.number().min(0).max(1000000),
      min_withdraw: z.number().min(0).max(1000000),
      referral_percent: z.number().min(0).max(100),
    }).parse(req.body);
    await q('INSERT IGNORE INTO payment_settings (id) VALUES (1)');
    await q(
      `UPDATE payment_settings SET bkash_number=?, nagad_number=?, min_deposit=?, min_withdraw=?, referral_percent=? WHERE id=1`,
      [data.bkash_number, data.nagad_number, data.min_deposit, data.min_withdraw, data.referral_percent]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e?.errors?.[0]?.message || 'Invalid input' });
  }
});

// ─── Spin Settings (wheel slices) ─────────────────────────────────────
async function ensureSpinSettingsTable() {
  await q(`
    CREATE TABLE IF NOT EXISTS spin_settings (
      id INT PRIMARY KEY DEFAULT 1,
      slices TEXT NOT NULL DEFAULT '50,100,150,200,300,400,500,600,800,1000',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await q(
    "INSERT IGNORE INTO spin_settings (id, slices) VALUES (1, '50,100,150,200,300,400,500,600,800,1000')"
  );
}

r.get('/spin-settings', authAdmin, async (_req, res) => {
  try {
    await ensureSpinSettingsTable();
    const rows = await q('SELECT slices FROM spin_settings WHERE id=1 LIMIT 1');
    const raw = rows[0]?.slices || '';
    const slices = String(raw)
      .split(',')
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    res.json({ slices });
  } catch (e) {
    console.error('spin-settings GET error:', e);
    res.status(500).json({ error: 'Load failed' });
  }
});

r.put('/spin-settings', authAdmin, async (req, res) => {
  try {
    const data = z.object({
      slices: z.array(z.number().positive().max(1_000_000)).min(2).max(20),
    }).parse(req.body);
    await ensureSpinSettingsTable();
    const csv = data.slices.map((n) => Math.round(n)).join(',');
    await q('UPDATE spin_settings SET slices=? WHERE id=1', [csv]);
    res.json({ ok: true, slices: data.slices });
  } catch (e) {
    res.status(400).json({ error: e?.errors?.[0]?.message || 'Invalid input' });
  }
});
r.get('/deposits', authAdmin, async (req, res) => {
  const status = (req.query.status || 'pending').toString();
  const where = status === 'all' ? '' : 'WHERE d.status=?';
  const params = status === 'all' ? [] : [status];
  const rows = await q(
    `SELECT d.id, d.user_id, d.amount, d.method, d.txn_id AS transaction_id,
            d.status, d.admin_note, d.created_at,
            u.phone, u.name
     FROM deposits d JOIN users u ON u.id = d.user_id
     ${where}
     ORDER BY d.id DESC LIMIT 200`,
    params
  );
  res.json({ deposits: rows });
});

async function decideDeposit(req, res, action) {
  const id = Number(req.params.id);
  const note = (req.body?.note || '').toString().slice(0, 500);
  const rows = await q('SELECT id, user_id, amount, status FROM deposits WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const dep = rows[0];
  if (dep.status !== 'pending') return res.status(409).json({ error: 'Already processed' });

  if (action === 'approve') {
    const amount = Number(dep.amount);
    await q('UPDATE users SET balance = balance + ? WHERE id=?', [amount, dep.user_id]);
    const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [dep.user_id]);
    await q('UPDATE deposits SET status="approved", admin_note=? WHERE id=?', [note, id]);
    await q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'deposit', ?, ?, ?)",
      [dep.user_id, amount, Number(after[0].balance), `Deposit #${id} approved`]
    );
  } else {
    await q('UPDATE deposits SET status="rejected", admin_note=? WHERE id=?', [note, id]);
  }
  res.json({ ok: true });
}
r.post('/deposits/:id/approve', authAdmin, (req, res) => decideDeposit(req, res, 'approve'));
r.post('/deposits/:id/reject',  authAdmin, (req, res) => decideDeposit(req, res, 'reject'));

// ─── Withdrawals queue ────────────────────────────────────────────────
r.get('/withdrawals', authAdmin, async (req, res) => {
  const status = (req.query.status || 'pending').toString();
  const where = status === 'all' ? '' : 'WHERE w.status=?';
  const params = status === 'all' ? [] : [status];
  const rows = await q(
    `SELECT w.id, w.user_id, w.amount, w.method, w.account AS payment_number,
            w.status, w.admin_note, w.created_at,
            u.phone, u.name
     FROM withdrawals w JOIN users u ON u.id = w.user_id
     ${where}
     ORDER BY w.id DESC LIMIT 200`,
    params
  );
  res.json({ withdrawals: rows });
});

async function decideWithdrawal(req, res, action) {
  const id = Number(req.params.id);
  const note = (req.body?.note || '').toString().slice(0, 500);
  const rows = await q('SELECT id, user_id, amount, status FROM withdrawals WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const wd = rows[0];
  if (wd.status !== 'pending') return res.status(409).json({ error: 'Already processed' });
  const amount = Number(wd.amount);

  if (action === 'approve') {
    // Money already debited at submit-time. Just mark approved.
    await q('UPDATE withdrawals SET status="approved", admin_note=? WHERE id=?', [note, id]);
  } else {
    // Refund: credit balance back
    await q('UPDATE users SET balance = balance + ? WHERE id=?', [amount, wd.user_id]);
    const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [wd.user_id]);
    await q('UPDATE withdrawals SET status="rejected", admin_note=? WHERE id=?', [note, id]);
    await q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'refund', ?, ?, ?)",
      [wd.user_id, amount, Number(after[0].balance), `Withdraw #${id} rejected — refund`]
    );
  }
  res.json({ ok: true });
}
r.post('/withdrawals/:id/approve', authAdmin, (req, res) => decideWithdrawal(req, res, 'approve'));
r.post('/withdrawals/:id/reject',  authAdmin, (req, res) => decideWithdrawal(req, res, 'reject'));

export default r;
