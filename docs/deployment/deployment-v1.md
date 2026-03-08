# Ubuntu Single-Host Deployment V1

最后更新：2026-03-08

这份文档按 **2.0 LINE-first** 版本编写，目标是：
- 你拿到一台全新的 Ubuntu 云主机
- 按文档逐条执行
- 跑起前台、后台、PostgreSQL、自动取消 worker
- 后续在同一台机器上继续接入 HTTPS 和 LINE Webhook

本方案默认：
- Ubuntu 22.04 / 24.04
- 单机部署
- PostgreSQL、Next.js 应用、worker 都在同一台主机
- 使用 Docker Compose
- 测试阶段先直接开放 `3000` 端口

如果后面要接域名和 HTTPS，再看：
- `docs/deployment/nginx-https-v1.md`

如果后面要把 2.0 的 LINE 业务链路跑通，再看：
- `docs/deployment/line-setup-v1.md`

## 1. 部署完成后的访问地址

部署成功后，你应该能打开：
- 前台图墙首页：`http://<服务器IP>:3000`
- 后台登录：`http://<服务器IP>:3000/admin/login`
- 图墙管理：`http://<服务器IP>:3000/admin/showcase`
- 预约管理：`http://<服务器IP>:3000/admin/appointments`
- LINE 会话：`http://<服务器IP>:3000/admin/line`

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env.deploy` 中的 `ADMIN_SEED_PASSWORD`

## 2. 云主机前置准备

### 2.1 放行端口

先在云控制台放行：
- `22/tcp`
- `3000/tcp`

如果后面会接 Nginx/HTTPS，再额外放行：
- `80/tcp`
- `443/tcp`

### 2.2 登录服务器

```bash
ssh ubuntu@<服务器IP>
```

## 3. 安装 Docker

### 3.1 安装基础依赖

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git gnupg
```

### 3.2 安装 Docker Engine 与 Compose Plugin

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3.3 验证 Docker

```bash
docker --version
docker compose version
```

### 3.4 当前用户免 sudo（推荐）

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 4. 获取代码

```bash
git clone https://github.com/Stalkerbass96/Nail_booking.git
cd Nail_booking
```

## 5. 创建部署环境文件

### 5.1 复制模板

```bash
cp .env.deploy.example .env.deploy
```

### 5.2 编辑配置

```bash
nano .env.deploy
```

至少修改这些值：
- `POSTGRES_PASSWORD`
- `CRON_SECRET`
- `ADMIN_AUTH_SECRET`
- `ADMIN_SEED_PASSWORD`
- `APP_BASE_URL`

### 5.3 纯 IP 测试版示例

如果你现在只是先在云主机上验证功能，还没有域名：

```env
APP_PORT=3000
POSTGRES_DB=nail_booking
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-strong-password
CRON_SECRET=replace-with-random-cron-secret
ADMIN_AUTH_SECRET=replace-with-long-random-secret
ADMIN_SEED_PASSWORD=replace-with-strong-admin-password
AUTO_CANCEL_INTERVAL_MS=300000
APP_BASE_URL=http://<服务器IP>:3000
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_AUTO_REPLY_TEXT=Thanks for adding the salon LINE account. Please open the booking home page from the message link.
```

注意：
- `APP_BASE_URL` 不能写 `127.0.0.1` 或 `localhost`
- 否则系统生成的 LINE 主页链接或预约详情链接只能服务器自己访问

### 5.4 域名版示例

如果你已经有域名并准备后续走 HTTPS：

```env
APP_PORT=3000
POSTGRES_DB=nail_booking
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-strong-password
CRON_SECRET=replace-with-random-cron-secret
ADMIN_AUTH_SECRET=replace-with-long-random-secret
ADMIN_SEED_PASSWORD=replace-with-strong-admin-password
AUTO_CANCEL_INTERVAL_MS=300000
APP_BASE_URL=https://your-domain.com
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_AUTO_REPLY_TEXT=Thanks for adding the salon LINE account. Please open the booking home page from the message link.
```

### 5.5 2.0 版本里 LINE 不是“可有可无”的提醒

2.0 的主业务链路是：
- 顾客加好友
- LINE 首次欢迎消息
- 图墙首页链接
- 顾客从图墙预约
- 待确认 / 已确认通知

所以：
- **系统可以先不配 LINE 启动起来**
- 但 **没有 LINE 配置时，2.0 的主路径无法完整验证**

推荐做法：
1. 先按本文件把应用部署起来
2. 确认前后台页面都能打开
3. 再接域名 + HTTPS
4. 最后按 `docs/deployment/line-setup-v1.md` 接入 LINE

## 6. 首次部署

### 6.1 给部署脚本加执行权限

```bash
chmod +x scripts/deploy-docker.sh
```

### 6.2 首次部署并写入种子数据

```bash
./scripts/deploy-docker.sh --seed
```

脚本会自动执行：
- 校验 `docker`、`docker compose`、`curl`
- 校验 `.env.deploy` 必填值
- 检查 compose 配置是否合法
- 构建应用镜像
- 启动 PostgreSQL
- 等待 PostgreSQL healthcheck 通过
- 执行 `prisma migrate deploy`
- 如果带 `--seed`，写入种子数据
- 启动 `app` 和 `auto-cancel-worker`
- 对 `http://127.0.0.1:${APP_PORT}/api/public/categories` 做健康检查

## 7. 部署后验证

### 7.1 看容器状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

期望结果：
- `postgres` 为 `healthy` 或 `Up`
- `app` 为 `healthy` 或 `Up`
- `auto-cancel-worker` 为 `Up`

### 7.2 看应用日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

### 7.3 看 worker 日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 auto-cancel-worker
```

### 7.4 在服务器本机测接口

```bash
curl http://127.0.0.1:3000/api/public/showcase
curl http://127.0.0.1:3000/api/public/categories
```

### 7.5 从你自己的电脑打开网页

浏览器访问：
- `http://<服务器IP>:3000`
- `http://<服务器IP>:3000/admin/login`
- `http://<服务器IP>:3000/admin/showcase`

## 8. 如果页面打不开，按这个顺序排查

### 8.1 先确认容器是否起来

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

### 8.2 再确认服务器本机接口通不通

```bash
curl http://127.0.0.1:3000/api/public/showcase
```

### 8.3 如果本机通，但外网不通

优先检查：
- 云安全组是否放行 `3000/tcp`
- Ubuntu 防火墙是否放行 `3000/tcp`

如果使用 UFW：

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

### 8.4 如果容器没起来

直接看日志：

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 postgres
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 auto-cancel-worker
```

### 8.5 如果 LINE 链接地址不对

检查 `.env.deploy` 里的：

```env
APP_BASE_URL=
```

这个值必须是：
- `http://<服务器IP>:3000`
- 或未来的 `https://your-domain.com`

不能是：
- `http://127.0.0.1:3000`
- `http://localhost:3000`

## 9. 日常操作

### 查看状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

### 查看日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f app
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f postgres
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f auto-cancel-worker
```

### 重启整个栈

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml restart
```

### 手动执行一次自动取消任务

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec app npm run job:auto-cancel
```

## 10. 更新版本

以后拉新代码时，推荐直接用：

```bash
git pull
./scripts/deploy-docker.sh
```

说明：
- 正常更新不需要再执行 `--seed`
- `--seed` 只建议首次部署时使用

## 11. 备份与恢复

### 11.1 备份数据库

```bash
set -a
source .env.deploy
set +a

docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

### 11.2 恢复数据库

```bash
set -a
source .env.deploy
set +a

docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" < backup.sql
```

## 12. 2.0 推荐验收顺序

1. 打开前台首页，确认看到图墙而不是旧式服务列表
2. 登录后台
3. 打开 `/admin/showcase`，确认能看到图墙管理页
4. 打开 `/admin/appointments`，确认预约管理页可正常打开
5. 打开 `/admin/customers`，确认顾客页可正常打开
6. 如果暂未接入 LINE，至少确认公开接口和后台页面都可用
7. 如果已接入 LINE，再按 `docs/deployment/line-setup-v1.md` 完成 follow / welcome / pending / confirmed 的验证
