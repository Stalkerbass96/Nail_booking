# Ubuntu Single-Host Deployment V1

更新时间：2026-03-07

这份文档面向全新 Ubuntu 云主机，目标是让你在一台服务器上部署：
- Next.js 前后端应用
- PostgreSQL 数据库
- 自动取消待确认预约的 worker

本方案默认：
- Ubuntu 22.04 / 24.04
- 单机部署
- 数据库与应用在同一主机
- 使用 Docker Compose
- 暂时直接暴露 `3000` 端口，不强制要求反向代理

## 1. 最终效果

部署完成后，你可以访问：
- 前台：`http://<服务器IP>:3000`
- 后台登录：`http://<服务器IP>:3000/admin/login`
- 后台排班页：`http://<服务器IP>:3000/admin/schedule`
- 后台 LINE 页：`http://<服务器IP>:3000/admin/line`

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env.deploy` 中的 `ADMIN_SEED_PASSWORD`

## 2. 主机准备

### 2.1 安装系统依赖

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
```

### 2.2 安装 Docker Engine 和 Compose Plugin

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
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

### 2.3 验证 Docker

```bash
docker --version
docker compose version
```

如果你希望当前用户免 `sudo`：

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 3. 获取代码

```bash
git clone https://github.com/Stalkerbass96/Nail_booking.git
cd Nail_booking
```

## 4. 配置部署环境变量

### 4.1 复制模板

```bash
cp .env.deploy.example .env.deploy
```

### 4.2 编辑 `.env.deploy`

```bash
vim .env.deploy
```

至少修改这些值：
- `POSTGRES_PASSWORD`
- `ADMIN_AUTH_SECRET`
- `ADMIN_SEED_PASSWORD`
- `CRON_SECRET`

建议也检查：
- `POSTGRES_DB`
- `POSTGRES_USER`
- `APP_PORT`
- `AUTO_CANCEL_INTERVAL_MS`
- `LINE_CHANNEL_SECRET`（如需接入 LINE）
- `LINE_CHANNEL_ACCESS_TOKEN`（如需接入 LINE）
- `LINE_AUTO_REPLY_TEXT`（可选）

推荐配置示例：

```env
APP_PORT=3000
POSTGRES_DB=nail_booking
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-strong-password
CRON_SECRET=replace-with-random-cron-secret
ADMIN_AUTH_SECRET=replace-with-long-random-secret
ADMIN_SEED_PASSWORD=replace-with-strong-admin-password
AUTO_CANCEL_INTERVAL_MS=300000
APP_BASE_URL=http://127.0.0.1:3000
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_AUTO_REPLY_TEXT=Message received. The salon owner will reply to you shortly.
```

## 5. 启动服务

### 5.1 给脚本执行权限

```bash
chmod +x scripts/deploy-docker.sh
```

### 5.2 首次部署并写入种子数据

```bash
./scripts/deploy-docker.sh --seed
```

这个命令会完成：
- 使用 `.env.deploy` 构建应用镜像
- 先启动 `postgres`
- 等待数据库健康检查通过
- 执行 `prisma migrate deploy`
- 首次部署时执行数据库种子脚本
- 最后启动 `app` 和 `auto-cancel-worker`

## 6. 验证部署结果

### 6.1 查看容器状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

### 6.2 查看应用日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f app
```

### 6.3 查看 worker 日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f auto-cancel-worker
```

### 6.4 检查接口是否可访问

```bash
curl http://127.0.0.1:3000/api/public/categories
```

如果你的云厂商有安全组或防火墙，还需要放行 `APP_PORT` 对应端口，默认是 `3000/tcp`。

如果你要启用 LINE：
- Webhook URL 配置为 `https://<你的域名>/api/line/webhook`
- 纯测试环境也可以暂时用 `http://<服务器IP>:3000/api/line/webhook`
- 需要在 `.env.deploy` 中配置 `LINE_CHANNEL_SECRET` 和 `LINE_CHANNEL_ACCESS_TOKEN`
- 管理后台新增页面：`/admin/line`

如果主机启用了 UFW：

```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

## 7. 日常运维

### 查看状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

### 重启服务

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml restart
```

### 查看日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f app
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f postgres
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs -f auto-cancel-worker
```

### 手动执行一次自动取消任务

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec app npm run job:auto-cancel
```

## 8. 更新版本

推荐执行：

```bash
git pull
./scripts/deploy-docker.sh
```

说明：
- 推荐更新时继续使用 `./scripts/deploy-docker.sh`，由脚本统一处理启动顺序
- 正常更新不需要重复 `db:seed`

## 9. 备份与恢复

### 9.1 备份数据库

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres pg_dump -U postgres nail_booking > backup.sql
```

### 9.2 恢复数据库

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml exec -T postgres psql -U postgres nail_booking < backup.sql
```

## 10. 推荐的下一步

当前文档保证你在 Ubuntu 单机上直接跑起来。进入线上阶段时，建议再补这三项：
1. Nginx 或 Caddy 反向代理
2. HTTPS 证书
3. 定期数据库备份与监控

补充检查清单：
- `docs/deployment/deployment-checklist-v1.md`

域名与 HTTPS 文档：
- `docs/deployment/nginx-https-v1.md`
