# 🚀 ClickTaka — VPS Deploy Guide (বাংলা, ধাপে ধাপে)

> **আপনার VPS:** Contabo • **Domain:** clicktaka24.com • **OS ধরে নিচ্ছি:** Ubuntu 22.04

---

## 📋 শুরুর আগে যা লাগবে

- VPS-এ root SSH access (`ssh root@your-vps-ip`)
- Domain `clicktaka24.com` এর A record VPS IP-তে point করা
- GitHub repo connected (Lovable → GitHub button)

---

## ধাপ ১: VPS-এ এক‑বারের setup (১০ মিনিট)

SSH দিয়ে VPS-এ ঢুকুন, তারপর এই commands চালান:

```bash
# Update + basic tools
apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # v20.x দেখাবে

# PM2 (process manager)
npm install -g pm2

# MySQL 8
apt install -y mysql-server
systemctl enable --now mysql
mysql_secure_installation   # password set করুন, সব yes

# Firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw allow 3306
ufw --force enable
```

---

## ধাপ ২: MySQL database তৈরি

প্রথমে MySQL service চালু আছে কিনা নিশ্চিত করুন। আপনার screenshot-এর `ERROR 2002 ... mysqld.sock` মানে MySQL server এখনো চালু নেই/ইনস্টল হয়নি।

```bash
apt update
apt install -y mysql-server
systemctl enable --now mysql
systemctl status mysql --no-pager

# যদি status-এ inactive/failed দেখায়:
journalctl -u mysql -n 80 --no-pager
```

`active (running)` দেখালে database/user তৈরি করুন। Ubuntu VPS-এ root user দিয়ে সবচেয়ে সহজ command:

```bash
mysql -u root
```

MySQL prompt-এ এগুলো paste করুন (password পাল্টে নিন):

```sql
CREATE DATABASE clicktaka CHARACTER SET utf8mb4;
CREATE USER 'clicktaka'@'%' IDENTIFIED BY 'এখানে-শক্ত-পাসওয়ার্ড-দিন';
GRANT ALL PRIVILEGES ON clicktaka.* TO 'clicktaka'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Login test করুন:

```bash
mysql -h 127.0.0.1 -u clicktaka -p clicktaka -e "SHOW TABLES;"
```

MySQL-কে remote (Lovable preview থেকে) connect করতে দিন:

```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
# খুঁজুন:  bind-address = 127.0.0.1
# পাল্টে দিন:  bind-address = 0.0.0.0
systemctl restart mysql
```

---

## ধাপ ৩: কোড clone + schema import

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/<your-username>/<repo-name>.git clicktaka
cd clicktaka

# MySQL schema লোড করুন
mysql -u clicktaka -p clicktaka < database/schema.sql
```

---

## ধাপ ৪: Backend API setup

```bash
cd /var/www/clicktaka/server
cp .env.example .env
nano .env
```

`.env` এ এগুলো বসান:

```ini
DB_HOST=localhost
DB_USER=clicktaka
DB_PASS=ধাপ-২-এ-যে-পাসওয়ার্ড-দিয়েছেন
DB_NAME=clicktaka
JWT_SECRET=                       # নিচের command থেকে generate করুন
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://clicktaka24.com
COOKIE_DOMAIN=.clicktaka24.com
```

JWT secret generate:

```bash
openssl rand -hex 32
# output টি কপি করে JWT_SECRET= এর পরে paste করুন
```

Dependencies install:

```bash
cd /var/www/clicktaka/server
npm install
```

---

## ধাপ ৫: Frontend build

```bash
cd /var/www/clicktaka
npm install
npm run build
```

---

## ধাপ ৬: PM2 দিয়ে দুটোই start

```bash
cd /var/www/clicktaka
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup       # যে command দেখাবে সেটা copy-paste করুন
```

দেখুন চলছে কিনা:

```bash
pm2 status
pm2 logs --lines 30
```

---

## ধাপ ৭: Nginx + SSL

```bash
cp /var/www/clicktaka/deploy/nginx.conf /etc/nginx/sites-available/clicktaka24.com
ln -sf /etc/nginx/sites-available/clicktaka24.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# SSL (free, Let's Encrypt)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d clicktaka24.com -d www.clicktaka24.com
```

---

## ধাপ ৮: Admin user তৈরি

```bash
mysql -u clicktaka -p clicktaka
```

```sql
-- প্রথমে website-এ গিয়ে normal register করুন আপনার admin phone দিয়ে।
-- তারপর এই query চালিয়ে admin বানান:
UPDATE users SET is_admin=1 WHERE phone='01735765449';
EXIT;
```

---

## 🔁 প্রতিবার code update হলে (এটাই daily flow)

```bash
ssh root@your-vps-ip
cd /var/www/clicktaka
git pull

# Backend dependency পাল্টালে
cd server && npm install && cd ..

# Frontend rebuild
npm install && npm run build

# Restart
pm2 restart clicktaka-api clicktaka-web

# Logs দেখুন
pm2 logs --lines 50
```

---

## 🛠️ Troubleshooting

| সমস্যা | সমাধান |
|--------|--------|
| 502 Bad Gateway | `pm2 status` → app down হলে `pm2 restart all` + `pm2 logs` |
| API কাজ করে না | `curl http://localhost:3001/api/health` চালান |
| MySQL connect ফেল | `mysql -u clicktaka -p` দিয়ে test করুন |
| SSL renew | auto-renew হবে, manual: `certbot renew` |

---

## 📁 গুরুত্বপূর্ণ ফাইল location

```
/var/www/clicktaka/                  ← কোড
/var/www/clicktaka/server/.env       ← secrets (GitHub-এ যাবে না)
/etc/nginx/sites-available/clicktaka24.com  ← nginx config
~/.pm2/logs/                          ← app logs
```
