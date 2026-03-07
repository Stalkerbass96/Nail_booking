# Deployment Checklist V1

最后更新：2026-03-08

这份清单是给两类人用的：
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
- [ ] `APP_BASE_URL` 不是 `127.0.0.1` 或 `localhost`，除非你只是做服务器本机测试
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
curl http://127.0.0.1:3000/api/public/categories
curl http://127.0.0.1:3000/api/public/packages
```

- [ ] categories 返回 200
- [ ] packages 返回 200

### 4.3 页面验证

浏览器打开：
- `http://<服务器IP>:3000`
- `http://<服务器IP>:3000/admin/login`

- [ ] 前台首页能打开
- [ ] 后台登录页能打开
- [ ] 后台种子账号能登录

### 4.4 关键后台页面验证

- [ ] `/admin/schedule` 能打开
- [ ] `/admin/line` 能打开
- [ ] `/admin/appointments` 能打开

### 4.5 如果本次同时验收 LINE

- [ ] 已在 LINE Developers Console 打开 `Use webhook`
- [ ] Webhook Verify 成功，或至少控制台未报 Webhook URL 不可达
- [ ] 测试 LINE 账号给官方账号发消息后，后台 `/admin/line` 能看到新会话
- [ ] 后台能向该用户发送一条测试消息
- [ ] 后台发送绑定链接后，顾客能打开 `/line/link`

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
- [ ] 服务器本机 `curl http://127.0.0.1:3000/api/public/categories` 是通的

## 6. 更新版本检查

执行：

```bash
git pull
./scripts/deploy-docker.sh
```

更新后确认：
- [ ] 页面仍可打开
- [ ] 后台仍可登录
- [ ] 数据未丢失
- [ ] worker 仍在运行

## 7. 本仓库当前已做过的验证

2026-03-07 已完成：
- [x] `npm run build` 通过
- [x] `npm run verify` 通过
- [x] `docker compose --env-file .env.deploy.example -f docker-compose.deploy.yml config` 通过
- [x] `scripts/deploy-docker.sh` 为 LF 行尾，可直接在 Ubuntu bash 执行
- [x] 部署脚本已包含 env 校验、compose 校验、数据库等待、HTTP 健康检查
- [x] 本地单机模拟部署已跑通过
- [x] `GET /api/public/categories` 返回 200
- [x] `GET /api/public/packages` 返回 200
