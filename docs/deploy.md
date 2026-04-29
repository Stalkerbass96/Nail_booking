# 部署指南 — 华为云 ECS (Ubuntu) + LINE

## 一、ECS 初始配置

```bash
ssh ubuntu@<ECS公网IP>

sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 进程守护
sudo npm install -g pm2

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx git
```

## 二、配置 PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER nailuser WITH PASSWORD '你的强密码';
CREATE DATABASE nail_booking OWNER nailuser;
GRANT ALL PRIVILEGES ON DATABASE nail_booking TO nailuser;
\q
```

## 三、拉取代码并构建

```bash
cd /var/www
sudo git clone https://github.com/Stalkerbass96/Nail_booking.git
sudo chown -R $USER:$USER Nail_booking
cd Nail_booking

npm install
```

创建 `.env`（参考 `.env.example`）：

```env
DATABASE_URL="postgresql://nailuser:你的强密码@localhost:5432/nail_booking"

NEXTAUTH_SECRET="随机32位字符串"   # openssl rand -hex 32
NEXTAUTH_URL="https://你的域名"
NEXT_PUBLIC_BASE_URL="https://你的域名"

LINE_CHANNEL_ACCESS_TOKEN="..."
LINE_CHANNEL_SECRET="..."
LINE_LIFF_ID="..."
```

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

## 四、PM2 启动

```bash
pm2 start npm --name "nail-booking" -- start
pm2 save
pm2 startup   # 按提示执行输出的 sudo 命令
```

## 五、Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/nail-booking
```

```nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nail-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 80 && sudo ufw allow 443
```

## 六、HTTPS（LINE Webhook 必须）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

> 没有域名需先在华为云购买，A 记录解析到 ECS 公网 IP，再申请证书。

## 七、配置 LINE

### 7.1 创建 Messaging API Channel

1. 打开 [LINE Developers Console](https://developers.line.biz/) 并登录
2. 创建 Provider → 创建 **Messaging API** Channel
3. 记录 **Channel Secret** 和 **Channel Access Token**（Messaging API 标签页 → Issue）

### 7.2 设置 Webhook

Messaging API 标签页：

- Webhook URL：`https://你的域名/api/line/webhook`
- 打开 **Use webhook** 开关
- 点 **Verify** 验证

### 7.3 创建 LIFF App

LIFF 标签页 → Add：

- Size：**Full**
- Endpoint URL：`https://你的域名/line/link`
- 记录生成的 **LIFF ID**（格式：`1234567890-xxxxxxxx`）

### 7.4 写入环境变量并重启

```bash
nano /var/www/Nail_booking/.env
# 填入 LINE_CHANNEL_ACCESS_TOKEN / LINE_CHANNEL_SECRET / LINE_LIFF_ID

npm run build
pm2 restart nail-booking
```

## 八、华为云安全组

在 ECS 安全组入方向确认放行：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22   | TCP  | SSH  |
| 80   | TCP  | HTTP |
| 443  | TCP  | HTTPS / LINE Webhook |

## 九、验证

```bash
pm2 status
pm2 logs nail-booking
curl -I https://你的域名
```
