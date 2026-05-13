import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db.js';
import { authAdmin } from '../middleware.js';

const r = Router();

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

// Tasks list
r.get('/tasks', authAdmin, async (req, res) => {
  const rows = await q(
    `SELECT t.id, t.title, t.type, t.url, t.reward, t.active, t.created_at,
            (SELECT COUNT(*) FROM task_completions tc WHERE tc.task_id=t.id) AS completions
     FROM tasks t ORDER BY t.id DESC LIMIT 200`
  );
  res.json({ tasks: rows });
});

// Create task
r.post('/tasks', authAdmin, async (req, res) => {
  try {
    const data = z.object({
      title: z.string().min(1).max(255),
      type: z.enum(['ad', 'video', 'app', 'social', 'game']).default('ad'),
      url: z.string().url().optional().or(z.literal('')),
      reward: z.number().min(0).max(10000),
      active: z.boolean().default(true),
    }).parse(req.body);
    const r2 = await q(
      'INSERT INTO tasks (title, type, url, reward, active) VALUES (?,?,?,?,?)',
      [data.title, data.type, data.url || null, data.reward, data.active ? 1 : 0]
    );
    res.json({ ok: true, id: r2.insertId });
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

export default r;
