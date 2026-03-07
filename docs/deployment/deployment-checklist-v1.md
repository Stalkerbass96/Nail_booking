# Deployment Checklist V1

更新时间：2026-03-07

这份清单用于两种场景：
- 你第一次把项目部署到 Ubuntu 单机
- 新的 AI agent 接手后，想快速验证部署文档是否仍然可用

## 1. 部署前检查

- [ ] 主机系统为 Ubuntu 22.04 或 24.04
- [ ] 已安装 Docker Engine
- [ ] 已安装 Docker Compose Plugin
- [ ] 云安全组或防火墙已放行应用端口（默认 `3000/tcp`）
- [ ] 已获取仓库代码
- [ ] 已复制 `.env.deploy.example` 为 `.env.deploy`
- [ ] 已修改 `.env.deploy` 中的敏感值

## 2. 配置检查

`.env.deploy` 至少确认这些值：

- [ ] `APP_PORT`
- [ ] `POSTGRES_DB`
- [ ] `POSTGRES_USER`
- [ ] `POSTGRES_PASSWORD`
- [ ] `CRON_SECRET`
- [ ] `ADMIN_AUTH_SECRET`
- [ ] `ADMIN_SEED_PASSWORD`
- [ ] `AUTO_CANCEL_INTERVAL_MS`

## 3. 首次部署命令

按顺序执行：

```bash
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh --seed
```

执行后应满足：
- [ ] `postgres` 容器启动
- [ ] `app` 容器启动
- [ ] `auto-cancel-worker` 容器启动
- [ ] 数据迁移执行成功
- [ ] 种子数据写入成功

## 4. 部署后验证

### 4.1 容器状态

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
```

- [ ] 三个服务状态均为 `Up`

### 4.2 应用日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

- [ ] 没有数据库连接失败
- [ ] 没有 Next.js 启动失败

### 4.3 Worker 日志

```bash
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 auto-cancel-worker
```

- [ ] worker 已启动
- [ ] worker 没有持续报错

### 4.4 接口验证

```bash
curl http://127.0.0.1:3000/api/public/categories
curl http://127.0.0.1:3000/api/public/packages
```

- [ ] categories 返回 200
- [ ] packages 返回 200

### 4.5 页面验证

浏览器访问：
- `http://<服务器IP>:3000`
- `http://<服务器IP>:3000/admin/login`

- [ ] 前台页面能打开
- [ ] 后台登录页能打开
- [ ] 种子账号可以登录

## 5. 更新版本检查

推荐执行：

```bash
git pull
./scripts/deploy-docker.sh
```

更新后确认：
- [ ] 站点仍可访问
- [ ] 数据未丢失
- [ ] 后台仍可登录
- [ ] worker 仍在运行

## 6. 本仓库当前已完成的模拟验证

2026-03-07 本地已做过以下检查：
- [x] `npm run build` 通过
- [x] `docker compose --env-file .env.deploy.example -f docker-compose.deploy.yml config` 通过
- [x] `scripts/deploy-docker.sh` 已确认是 LF 行尾，适合 Ubuntu bash 执行
- [x] 本地容器模拟部署已跑通（独立端口 `3300` 与独立 compose project）
- [x] 模拟部署中已验证 `migrate -> seed -> app -> worker` 顺序可用
- [x] `GET /api/public/categories` 返回 200
- [x] `GET /api/public/packages` 返回 200

如果你准备上真正的 Ubuntu 云主机，优先参考：
- `docs/deployment/deployment-v1.md`
