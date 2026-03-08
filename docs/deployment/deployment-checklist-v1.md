# Deployment Checklist V1

最后更新：2026-03-08

这份清单给两类人用：
- 你自己在全新 Ubuntu 主机上部署
- 新的 AI agent 想验证部署文档是否还能直接落地

## 1. 部署前检查

- [ ] 主机系统为 Ubuntu 22.04 或 24.04
- [ ] 云安全组已放行 `22/tcp`
- [ ] 云安全组已放行 `3000/tcp`
- [ ] 已能通过 SSH 登录服务器
- [ ] 已安装 Docker Engine
- [ ] 已安装 Docker Compose Plugin
- [ ] 已拉取仓库代码
- [ ] 已复制 `.env.deploy.example` 为 `.env.deploy`

## 2. `.env.deploy` 必填项检查

至少确认下面这些值不是空的：
- [ ] `APP_PORT`
- [ ] `POSTGRES_DB`
- [ ] `POSTGRES_USER`
- [ ] `POSTGRES_PASSWORD`
- [ ] `CRON_SECRET`
- [ ] `ADMIN_AUTH_SECRET`
- [ ] `ADMIN_SEED_PASSWORD`
- [ ] `AUTO_CANCEL_INTERVAL_MS`
- [ ] `APP_BASE_URL`

额外确认：
- [ ] `APP_BASE_URL` 不是 `127.0.0.1` 或 `localhost`
- [ ] 已替换所有 `change-me-*` 或 `replace-with-*` 占位值

如果这次要同时接入 LINE，再额外确认：
- [ ] 已准备 `LINE_CHANNEL_SECRET`
- [ ] 已准备 `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `APP_BASE_URL` 是外部真实可访问地址
- [ ] 已知道 Webhook URL 应该填 `https://your-domain.com/api/line/webhook`

## 3. 首次部署命令

按顺序执行：

```bash
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh --seed
```

执行过程中应看到：
- [ ] compose 配置校验通过
- [ ] 镜像构建成功
- [ ] `postgres is healthy`
- [ ] migration 执行成功
- [ ] seed 执行成功
- [ ] `http ready`
- [ ] `stack started`

## 4. 部署后验证

### 4.1 容器状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

- [ ] `postgres` 为 `Up` 或 `healthy`
- [ ] `app` 为 `Up` 或 `healthy`
- [ ] `auto-cancel-worker` 为 `Up`

### 4.2 本机接口验证

```bash
curl http://127.0.0.1:3000/api/public/showcase
curl http://127.0.0.1:3000/api/public/categories
```

- [ ] showcase 返回 200
- [ ] categories 返回 200

### 4.3 页面验证

浏览器打开：
- `http://<服务器IP>:3000`
- `http://<服务器IP>:3000/admin/login`

- [ ] 前台首页能打开
- [ ] 首页看到的是图墙，不是旧式纯服务列表
- [ ] 后台登录页能打开
- [ ] 后台种子账号能登录

### 4.4 关键后台页面验证

- [ ] `/admin/showcase` 能打开
- [ ] `/admin/appointments` 能打开
- [ ] `/admin/customers` 能打开
- [ ] `/admin/schedule` 能打开
- [ ] `/admin/line` 能打开

### 4.5 如果本次同时验收 LINE

- [ ] 已在 LINE Developers Console 打开 `Use webhook`
- [ ] Webhook Verify 成功
- [ ] 测试账号首次加好友后，后台 `/admin/customers` 出现潜在客户
- [ ] 顾客收到了首页欢迎链接
- [ ] 顾客从图墙提交预约后，收到了“待确认”消息
- [ ] 后台确认预约后，顾客收到了“已确认”消息
- [ ] 顾客发送自由文本消息后，后台 `/admin/line` 能看到新会话
- [ ] 后台能向该用户发送一条测试消息

## 5. 如果部署失败

按这个顺序检查：

### 5.1 看容器状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

### 5.2 看应用日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

### 5.3 看数据库日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 postgres
```

### 5.4 看 worker 日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 auto-cancel-worker
```

### 5.5 看公网访问问题

- [ ] 云安全组已放行 `3000/tcp`
- [ ] 如果启用了 UFW，已执行 `sudo ufw allow 3000/tcp`
- [ ] 服务器本机 `curl http://127.0.0.1:3000/api/public/showcase` 是通的

## 6. 更新版本检查

执行：

```bash
git pull
./scripts/deploy-docker.sh
```

更新后确认：
- [ ] 页面仍可打开
- [ ] 后台仍可登录
- [ ] 图墙数据仍在
- [ ] 数据未丢失
- [ ] worker 仍在运行
