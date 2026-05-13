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

## ধাপ ২: Database তৈরি (বিদ্যমান MariaDB ব্যবহার — নিরাপদ পথ)

> ⚠️ **গুরুত্বপূর্ণ:** আপনার VPS-এ আগে থেকেই MariaDB + অন্য প্রজেক্টের database আছে। **কিছু purge/remove করবেন না।** MariaDB হলো MySQL-compatible — আমাদের schema হুবহু কাজ করবে। নতুন MySQL ইনস্টলের দরকার **নেই**।
>
> যদি ভুল করে `apt purge` চালিয়ে এই purple prompt দেখেন — **`Remove all MariaDB databases?` → অবশ্যই `<No>` সিলেক্ট করুন (Tab → No → Enter)।** তারপর `Ctrl+C` দিয়ে বের হয়ে নিচের ধাপে যান। এটা না করলে অন্য প্রজেক্টের সব data মুছে যাবে।

### 2.1 MariaDB service চেক (অন্য প্রজেক্টের জন্য এটা ইতিমধ্যেই চলছে)

```bash
systemctl status mariadb --no-pager | head -20
```

`active (running)` দেখালে এগিয়ে যান। না দেখালে: `systemctl start mariadb`।

### 2.2 শুধু আমাদের database + user বানান (অন্য DB-তে হাত পড়বে না)

```bash
mysql -u root
```

প্রম্পটে paste করুন:

```sql
CREATE DATABASE clicktaka CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clicktaka'@'localhost' IDENTIFIED BY 'Clicktaka247';
CREATE USER 'clicktaka'@'%' IDENTIFIED BY 'Clicktaka247';
GRANT ALL PRIVILEGES ON clicktaka.* TO 'clicktaka'@'localhost';
GRANT ALL PRIVILEGES ON clicktaka.* TO 'clicktaka'@'%';
FLUSH PRIVILEGES;
EXIT;
```

> এখানে `GRANT` শুধু `clicktaka.*` এর উপর — **অন্য কোনো database স্পর্শ হবে না।**

### 2.3 Login test

```bash
mysql -h 127.0.0.1 -u clicktaka -pClicktaka247 clicktaka -e "SELECT 1;"
```

`1` রিটার্ন আসলে কাজ হয়েছে।

### 2.4 (Optional) Remote connect দরকার হলেই শুধু

> বেশিরভাগ ক্ষেত্রে দরকার নেই — backend আর DB একই VPS-এ, `localhost` যথেষ্ট।

```bash
nano /etc/mysql/mariadb.conf.d/50-server.cnf
# bind-address = 127.0.0.1  →  bind-address = 0.0.0.0
systemctl restart mariadb
ufw allow 3306/tcp
```


---

## ধাপ ৩: কোড clone + schema import

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/<your-username>/<repo-name>.git clicktaka-rewards
cd clicktaka-rewards

# MySQL schema লোড করুন
mysql -u clicktaka -p clicktaka < database/schema.sql
```

---

## ধাপ ৪: Backend API setup

```bash
cd /var/www/clicktaka-rewards/server
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
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Clicktaka247
```

JWT secret generate:

```bash
openssl rand -hex 32
# output টি কপি করে JWT_SECRET= এর পরে paste করুন
```

Dependencies install:

```bash
cd /var/www/clicktaka-rewards/server
npm install
```

---

## ধাপ ৫: Frontend build

```bash
cd /var/www/clicktaka-rewards
npm install
npm run build
```

---

## ধাপ ৬: PM2 দিয়ে দুটোই start

```bash
cd /var/www/clicktaka-rewards
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
cp /var/www/clicktaka-rewards/deploy/nginx.conf /etc/nginx/sites-available/clicktaka24.com
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
cd /var/www/clicktaka-rewards
bash deploy/update.sh
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
/var/www/clicktaka-rewards/                  ← কোড
/var/www/clicktaka-rewards/server/.env       ← secrets (GitHub-এ যাবে না)
/etc/nginx/sites-available/clicktaka24.com  ← nginx config
~/.pm2/logs/                          ← app logs
```
