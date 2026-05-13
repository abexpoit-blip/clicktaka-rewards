
# ClickTaka — Architecture & Build Plan

## Stack (final)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend: React 19 + TanStack Start + Tailwind v4      │
│  (Lovable-এ এডিট, GitHub-এ auto push)                   │
└──────────────────┬──────────────────────────────────────┘
                   │ fetch /api/*
┌──────────────────▼──────────────────────────────────────┐
│  Backend API: Node.js + Express + JWT                   │
│  (একই repo, /server folder)                             │
└──────────────────┬──────────────────────────────────────┘
                   │ mysql2
┌──────────────────▼──────────────────────────────────────┐
│  MySQL 8 on Contabo VPS (port 3306 public, IP whitelist)│
└─────────────────────────────────────────────────────────┘

Deploy:  Lovable → GitHub → VPS git pull → pm2 restart
```

## Folder structure

```
/                          # Lovable repo root
├── src/                   # React frontend (TanStack Start)
│   ├── routes/
│   │   ├── index.tsx              # Landing
│   │   ├── login.tsx              # User login
│   │   ├── register.tsx
│   │   ├── kt-admin-login.tsx     # Admin login (different URL)
│   │   ├── _user/                 # User dashboard (protected)
│   │   │   ├── dashboard.tsx
│   │   │   ├── tasks.tsx
│   │   │   ├── packages.tsx
│   │   │   ├── deposit.tsx
│   │   │   ├── withdraw.tsx
│   │   │   ├── refer.tsx
│   │   │   ├── history.tsx
│   │   │   └── profile.tsx
│   │   └── _kt-admin/             # Admin panel (protected)
│   │       ├── dashboard.tsx
│   │       ├── users.tsx
│   │       ├── deposits.tsx
│   │       ├── withdrawals.tsx
│   │       ├── tasks.tsx
│   │       └── settings.tsx
│   └── lib/api.ts                 # fetch wrapper
│
├── server/                # Node.js API (deploy on VPS)
│   ├── index.js           # Express app
│   ├── db.js              # mysql2 pool
│   ├── auth.js            # JWT helpers
│   ├── middleware.js      # authUser, authAdmin
│   └── routes/
│       ├── auth.js        # login/register
│       ├── user.js        # profile, balance, refer
│       ├── tasks.js       # task list, complete
│       ├── packages.js    # buy package
│       ├── deposit.js     # request deposit
│       ├── withdraw.js    # request withdraw
│       └── admin.js       # all admin endpoints
│
├── database/
│   └── schema.sql         # MySQL schema (run once on VPS)
│
└── deploy/
    ├── ecosystem.config.js  # PM2 config
    ├── nginx.conf           # nginx reverse proxy
    └── DEPLOY.md            # step-by-step deploy guide (Bangla)
```

## Database schema (MySQL)

12 tables — same as bdt69:
- `users` (id, phone UNIQUE, password_hash, name, balance, refer_code, refer_by, status, is_admin, created_at)
- `packages` (id, name, price, daily_task_limit, daily_earning, validity_days, image)
- `user_packages` (id, user_id, package_id, expires_at, tasks_done_today, last_reset)
- `tasks` (id, title, type, url, reward, package_required, active)
- `task_completions` (id, user_id, task_id, completed_at)
- `deposits` (id, user_id, amount, method, txn_id, status, created_at)
- `withdrawals` (id, user_id, amount, method, account, status, created_at)
- `referrals` (id, referrer_id, referred_id, commission, level)
- `transactions` (id, user_id, type, amount, note, created_at)
- `notices` (id, title, body, active)
- `payment_settings` (id, method, number, instructions)
- `admin_logs` (id, admin_id, action, target, created_at)

## Build phases

**Phase 1 (this turn):** Frontend skeleton + API skeleton + DB schema + deploy guide
- Remove Supabase remnants, set up Express server folder
- Create MySQL schema file
- Build login/register pages + landing
- Auth API (register, login, JWT)
- One protected user dashboard route working end-to-end
- DEPLOY.md with exact commands (Bangla, beginner-friendly)

**Phase 2:** Tasks, packages, user pages
**Phase 3:** Deposit/withdraw flow
**Phase 4:** Full admin panel
**Phase 5:** Referral system + polish

## Auth approach

- JWT in httpOnly cookie (secure)
- User login: `/login` → `/user/dashboard`
- Admin login: `/kt-admin-login` (gopon URL) → `/kt-admin/dashboard`
- Same `users` table, `is_admin` flag controls admin access
- Middleware checks `is_admin` for `/api/admin/*` routes

## Environment (VPS)

```
# server/.env (VPS-এ তৈরি হবে, GitHub-এ যাবে না)
DB_HOST=localhost
DB_USER=clicktaka
DB_PASS=<vps-password>
DB_NAME=clicktaka
JWT_SECRET=<random-64-char>
PORT=3001
```

## Deploy flow (after every code change)

```bash
ssh root@your-vps
cd /var/www/clicktaka
git pull
cd server && npm install   # if dependencies changed
cd .. && npm install && npm run build
pm2 restart clicktaka-api
pm2 restart clicktaka-web
pm2 logs --lines 50         # check logs
```

I'll write the full DEPLOY.md (Bangla) with VPS setup, MySQL install, nginx, SSL, PM2 — everything step-by-step.

## Confirmation

আমি Phase 1 শুরু করব। এতে যা পাবেন:
1. Working landing + login + register page
2. Express API with JWT auth
3. MySQL schema file (`database/schema.sql`)
4. Complete `deploy/DEPLOY.md` (Bangla, copy-paste ready)
5. PM2 + nginx config

আপনি Phase 1 শেষ হলে VPS-এ deploy করে test করবেন। সব ঠিক থাকলে Phase 2 শুরু করব।

**Approve করলে Phase 1 শুরু করছি।**
