import { Router } from 'express';
import { q } from '../db.js';
import { authUser } from '../middleware.js';

const r = Router();

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

r.get('/transactions', authUser, async (req, res) => {
  const rows = await q(
    'SELECT id, type, amount, balance_after, note, created_at FROM transactions WHERE user_id=? ORDER BY id DESC LIMIT 100',
    [req.user.id]
  );
  res.json({ transactions: rows });
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

export default r;
