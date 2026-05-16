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
  res.json({
    user: req.user,
    packages: pkgs,
    impersonating: !!req.session?.imp,
    admin_id: req.session?.aid || null,
  });
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

// Tasks page: tasks filtered by user's active package targeting
r.get('/tasks', authUser, async (req, res) => {
  // 🌙 Daily auto-reset: if a new day started, zero out tasks_done_today for this user
  await q(
    `UPDATE user_packages
       SET tasks_done_today = 0,
           last_reset_date = CURDATE()
     WHERE user_id = ?
       AND (last_reset_date IS NULL OR last_reset_date < CURDATE())`,
    [req.user.id]
  );

  const [pkgs, doneToday, todayCount] = await Promise.all([
    q(
      `SELECT up.id, up.package_id, up.tasks_done_today, up.expires_at, p.name, p.daily_task_limit, p.daily_earning
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

  // Filter tasks by package targeting:
  //   - tasks with NO rows in task_packages → available to all users with any active package
  //   - tasks with rows → only if at least one matches user's active packages
  const userPkgIds = pkgs.map((p) => Number(p.package_id));
  let tasks = [];
  if (userPkgIds.length === 0) {
    tasks = []; // no active package → no tasks (locked screen)
  } else {
    const placeholders = userPkgIds.map(() => '?').join(',');
    tasks = await q(
      `SELECT t.id, t.title, t.description, t.type, t.url, t.reward
       FROM tasks t
       WHERE t.active=1
         AND (
           NOT EXISTS (SELECT 1 FROM task_packages tp WHERE tp.task_id = t.id)
           OR EXISTS (SELECT 1 FROM task_packages tp WHERE tp.task_id = t.id AND tp.package_id IN (${placeholders}))
         )
       ORDER BY t.id DESC`,
      userPkgIds
    );
  }

  const totalLimit = pkgs.reduce((s, p) => s + Number(p.daily_task_limit || 0), 0);
  res.json({
    tasks,
    packages: pkgs,
    completed_task_ids_today: doneToday.map((r) => r.task_id),
    today_completed: Number(todayCount[0].c),
    daily_limit: totalLimit,
  });
});

// ── Ad-click / task dwell tracker (in-memory; per server process) ──
// User must POST /tasks/:id/start, wait ≥25s, then POST /tasks/:id/complete.
// This is the server-side guarantee that a user actually engaged with the ad,
// in addition to the client-side "tab away 30s" check.
const TASK_STARTS = new Map(); // key: `${userId}:${taskId}` → startedAt(ms)
const MIN_DWELL_MS = 25_000;

r.post('/tasks/:id/start', authUser, async (req, res) => {
  const taskId = Number(req.params.id);
  if (!taskId) return res.status(400).json({ error: 'Invalid task id' });
  TASK_STARTS.set(`${req.user.id}:${taskId}`, Date.now());
  res.json({ ok: true, required_seconds: Math.ceil(MIN_DWELL_MS / 1000) });
});

// Complete a task: validate dwell + package limits, insert completion + transaction
r.post('/tasks/:id/complete', authUser, async (req, res) => {
  const taskId = Number(req.params.id);
  if (!taskId) return res.status(400).json({ error: 'Invalid task id' });
  const tasks = await q('SELECT id, reward, active, url FROM tasks WHERE id=? LIMIT 1', [taskId]);
  if (!tasks.length || !tasks[0].active) return res.status(404).json({ error: 'Task পাওয়া যায়নি' });
  const task = tasks[0];

  // Already done today?
  const dup = await q(
    `SELECT id FROM task_completions
     WHERE user_id=? AND task_id=? AND DATE(completed_at)=CURDATE() LIMIT 1`,
    [req.user.id, taskId]
  );
  if (dup.length) return res.status(409).json({ error: 'এই task আজ ইতিমধ্যে সম্পন্ন' });

  // Server-side dwell validation — only for URL-bearing tasks (ads/videos)
  if (task.url) {
    const key = `${req.user.id}:${taskId}`;
    const startedAt = TASK_STARTS.get(key);
    if (!startedAt) {
      return res.status(400).json({ error: 'প্রথমে Start চাপুন ও Ad দেখুন' });
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_DWELL_MS) {
      const left = Math.ceil((MIN_DWELL_MS - elapsed) / 1000);
      return res.status(400).json({ error: `আরও ${left}s অপেক্ষা করুন — Ad সম্পূর্ণ দেখুন` });
    }
    TASK_STARTS.delete(key);
  }

  // 🌙 Daily auto-reset before quota check (covers midnight rollover)
  await q(
    `UPDATE user_packages
       SET tasks_done_today = 0, last_reset_date = CURDATE()
     WHERE user_id = ?
       AND (last_reset_date IS NULL OR last_reset_date < CURDATE())`,
    [req.user.id]
  );

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

// Buy / activate a package using current balance
r.post('/packages/:id/buy', authUser, async (req, res) => {
  const pkgId = Number(req.params.id);
  if (!pkgId) return res.status(400).json({ error: 'Invalid package id' });
  try {
    const pkgs = await q('SELECT id, name, price, validity_days, active FROM packages WHERE id=? LIMIT 1', [pkgId]);
    if (!pkgs.length || !pkgs[0].active) return res.status(404).json({ error: 'Package পাওয়া যায়নি' });
    const pkg = pkgs[0];
    const price = Number(pkg.price);

    const balRows = await q('SELECT balance, refer_by FROM users WHERE id=? LIMIT 1', [req.user.id]);
    const bal = Number(balRows[0]?.balance || 0);
    if (bal < price) return res.status(400).json({ error: `Balance যথেষ্ট না — দরকার ৳${price}, আছে ৳${bal}` });

    // Deduct balance
    await q('UPDATE users SET balance = balance - ? WHERE id=?', [price, req.user.id]);
    const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);

    // Activate package (expires today + validity_days)
    const ins = await q(
      'INSERT INTO user_packages (user_id, package_id, expires_at, tasks_done_today) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), 0)',
      [req.user.id, pkg.id, Number(pkg.validity_days)]
    );

    await q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'package', ?, ?, ?)",
      [req.user.id, -price, Number(after[0].balance), `Activate ${pkg.name}`]
    );

    // ── First-time activation: credit ৳50 Join Bonus (once per user) ──
    const priorPkgs = await q(
      'SELECT COUNT(*) AS c FROM user_packages WHERE user_id=?',
      [req.user.id]
    );
    const alreadyBonus = await q(
      "SELECT id FROM transactions WHERE user_id=? AND type='bonus' AND note='Join Bonus' LIMIT 1",
      [req.user.id]
    );
    if (Number(priorPkgs[0]?.c || 0) === 1 && !alreadyBonus.length) {
      const JOIN_BONUS = 50;
      await q('UPDATE users SET balance = balance + ? WHERE id=?', [JOIN_BONUS, req.user.id]);
      const afterBonus = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
      await q(
        "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'bonus', ?, ?, 'Join Bonus')",
        [req.user.id, JOIN_BONUS, Number(afterBonus[0].balance)]
      ).catch(() => {});
      after[0].balance = afterBonus[0].balance;
    }

    // Pay referral commission to referrer (if any)
    const referrerId = balRows[0]?.refer_by;
    if (referrerId) {
      const s = await q('SELECT referral_percent FROM payment_settings WHERE id=1 LIMIT 1');
      const pct = Number(s[0]?.referral_percent || 10);
      const commission = Math.round((price * pct) / 100);
      if (commission > 0) {
        await q('UPDATE users SET balance = balance + ? WHERE id=?', [commission, referrerId]);
        const rAfter = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [referrerId]);
        await q(
          'INSERT INTO referrals (referrer_id, referred_id, commission, level) VALUES (?, ?, ?, 1)',
          [referrerId, req.user.id, commission]
        );
        await q(
          "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'refer', ?, ?, ?)",
          [referrerId, commission, Number(rAfter[0].balance), `Referral commission (${pkg.name})`]
        );
      }
    }

    res.json({ ok: true, package_id: ins.insertId, balance: Number(after[0].balance) });
  } catch (e) {
    console.error('package buy error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/transactions', authUser, async (req, res) => {
  const rows = await q(
    'SELECT id, type, amount, balance_after, note, created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 100',
    [req.user.id]
  );
  res.json({ transactions: rows });
});

// Daily Spin Wheel — package অনুযায়ী দৈনিক spin limit
// 500=1, 1000=2, 2000=3, 5000=5, 10000=8, 20000=12 ; package না থাকলে 0
let dailySpinsTableReady;
let spinSettingsTableReady;

const DEFAULT_SPIN_SLICES = [50, 100, 150, 200, 300, 400, 500, 600, 800, 1000];

async function ensureSpinSettingsTable() {
  if (!spinSettingsTableReady) {
    spinSettingsTableReady = (async () => {
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
    })().catch((error) => {
      spinSettingsTableReady = undefined;
      throw error;
    });
  }
  await spinSettingsTableReady;
}

async function getSpinSlices() {
  try {
    await ensureSpinSettingsTable();
    const rows = await q('SELECT slices FROM spin_settings WHERE id=1 LIMIT 1');
    const raw = rows[0]?.slices || '';
    const parsed = String(raw)
      .split(',')
      .map((x) => Number(String(x).trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (parsed.length >= 2) return parsed;
  } catch (e) {
    console.error('spin slices load error:', e);
  }
  return DEFAULT_SPIN_SLICES;
}

async function ensureDailySpinsTable() {
  if (!dailySpinsTableReady) {
    dailySpinsTableReady = (async () => {
      await q(`
        CREATE TABLE IF NOT EXISTS daily_spins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          spin_date DATE NOT NULL,
          reward DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, spin_date),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
      const uniqueIndex = await q(
        `SELECT 1 FROM information_schema.statistics
         WHERE table_schema = DATABASE() AND table_name = 'daily_spins' AND index_name = 'uniq_user_date'
         LIMIT 1`
      );
      const dateIndex = await q(
        `SELECT 1 FROM information_schema.statistics
         WHERE table_schema = DATABASE() AND table_name = 'daily_spins' AND index_name = 'idx_user_date'
         LIMIT 1`
      );
      if (!dateIndex.length) await q('ALTER TABLE daily_spins ADD INDEX idx_user_date (user_id, spin_date)');
      if (uniqueIndex.length) await q('ALTER TABLE daily_spins DROP INDEX uniq_user_date');
    })().catch((error) => {
      dailySpinsTableReady = undefined;
      throw error;
    });
  }
  await dailySpinsTableReady;
}

function spinLimitForPrice(price) {
  const p = Number(price) || 0;
  if (p >= 20000) return 12;
  if (p >= 10000) return 8;
  if (p >= 5000)  return 5;
  if (p >= 2000)  return 3;
  if (p >= 1000)  return 2;
  if (p >= 500)   return 1;
  return 0;
}

async function getSpinContext(userId) {
  await ensureDailySpinsTable();
  // highest-priced active (non-expired) package
  const pkgs = await q(
    `SELECT p.price FROM user_packages up
     JOIN packages p ON p.id = up.package_id
     WHERE up.user_id=? AND up.expires_at >= CURDATE()
     ORDER BY p.price DESC LIMIT 1`,
    [userId]
  );
  const price = pkgs.length ? Number(pkgs[0].price) : 0;
  const limit = spinLimitForPrice(price);
  const used = await q(
    'SELECT COUNT(*) AS c FROM daily_spins WHERE user_id=? AND spin_date=CURDATE()',
    [userId]
  );
  const last = await q(
    'SELECT reward, created_at FROM daily_spins WHERE user_id=? AND spin_date=CURDATE() ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return {
    has_package: price > 0,
    package_price: price,
    spins_limit: limit,
    spins_used: Number(used[0].c),
    spins_left: Math.max(0, limit - Number(used[0].c)),
    last: last[0] || null,
  };
}

r.get('/spin/status', authUser, async (req, res) => {
  try {
    const [ctx, slices] = await Promise.all([
      getSpinContext(req.user.id),
      getSpinSlices(),
    ]);
    res.json({
      ...ctx,
      slices,
      spun_today: ctx.spins_left <= 0,   // backwards-compat for old client
    });
  } catch (e) {
    console.error('spin status error:', e);
    res.status(500).json({ error: 'Spin status load করা যায়নি' });
  }
});

r.post('/spin', authUser, async (req, res) => {
  try {
    const ctx = await getSpinContext(req.user.id);
    if (!ctx.has_package) {
      return res.status(403).json({ error: 'Spin করতে হলে আগে একটি package activate করুন' });
    }
    if (ctx.spins_left <= 0) {
      return res.status(409).json({
        error: `আজকের ${ctx.spins_limit} টি spin শেষ — কাল আবার আসুন`,
      });
    }

    // Reward: DB-configured slices থেকে random pick (admin panel-এ edit-able)
    const SPIN_REWARDS = await getSpinSlices();
    const reward = SPIN_REWARDS[Math.floor(Math.random() * SPIN_REWARDS.length)];
    await q('INSERT INTO daily_spins (user_id, spin_date, reward) VALUES (?, CURDATE(), ?)', [req.user.id, reward]);
    await q('UPDATE users SET balance = balance + ? WHERE id=?', [reward, req.user.id]);
    const after = await q('SELECT balance FROM users WHERE id=? LIMIT 1', [req.user.id]);
    await q(
      "INSERT INTO transactions (user_id, type, amount, balance_after, note) VALUES (?, 'admin', ?, ?, ?)",
      [req.user.id, reward, Number(after[0].balance), 'Daily Spin Bonus']
    );
    res.json({
      ok: true,
      reward,
      balance: Number(after[0].balance),
      spins_left: ctx.spins_left - 1,
      spins_limit: ctx.spins_limit,
    });
  } catch (e) {
    console.error('spin error:', e);
    res.status(500).json({ error: 'Spin করা যায়নি — একটু পরে আবার চেষ্টা করুন' });
  }
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

// Effective minimum for the *current* user.
// IMPORTANT: We intentionally always advertise ৳100 upfront — the stricter
// "2nd+ withdraw = ৳5000" rule is revealed ONLY when the user actually tries.
r.get('/withdraw-info', authUser, async (req, res) => {
  try {
    const prior = await q(
      'SELECT COUNT(*) AS c FROM withdrawals WHERE user_id=? AND status<>"rejected"',
      [req.user.id]
    );
    const isSecondOrLater = Number(prior[0]?.c || 0) >= 1;
    res.json({
      min_withdraw: 100,                  // ← always shown publicly
      is_second_or_later: isSecondOrLater, // (frontend ignores for the upfront UI)
      prior_count: Number(prior[0]?.c || 0),
      note: `Minimum withdraw ৳100`,
    });
  } catch (e) {
    console.error('withdraw-info error:', e);
    res.status(500).json({ error: 'Load failed' });
  }
});

r.post('/withdraw', authUser, async (req, res) => {
  try {
    const data = withdrawSchema.parse(req.body);

    // First withdraw min ৳100, 2nd+ min ৳5000 — only revealed on attempt
    const prior = await q(
      'SELECT COUNT(*) AS c FROM withdrawals WHERE user_id=? AND status<>"rejected"',
      [req.user.id]
    );
    const isSecondOrLater = Number(prior[0]?.c || 0) >= 1;
    const minWd = isSecondOrLater ? 5000 : 100;

    if (data.amount < minWd) {
      return res.status(400).json({
        error: isSecondOrLater
          ? `আমাদের প্যাকেজ আপডেট হয়েছে — এখন থেকে minimum withdraw ৳${minWd}। আরও advanced package activate করে বেশি earn ও withdraw করুন।`
          : `Minimum withdraw ৳${minWd}`,
      });
    }

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
