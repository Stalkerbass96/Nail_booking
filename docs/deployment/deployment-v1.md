# 部署手册 V1

- 适用环境：预发 / 生产
- 更新日期：2026-03-07

本手册目标：在 Linux 主机上，通过 Docker Compose 一次性启动应用、数据库与自动取消任务，并完成上线验证。

## 1. 部署方式选择

- 推荐：Docker Compose 一体部署（应用 + PostgreSQL + 自动取消 worker）
- 备用：手工 Node.js 部署（见文末）

## 2. 主机前置条件（推荐方案）

- Linux 主机（Ubuntu 22.04+ 推荐）
- 已安装 Docker
- 已安装 Docker Compose（`docker compose` 命令可用）
- 能访问仓库代码
- 3000 端口可访问（或通过反向代理转发）

## 3. 一体部署（推荐）

### 3.1 拉代码

```bash
git clone <your-repo-url>
cd Nail_booking
```

### 3.2 配置部署环境变量

```bash
cp .env.deploy.example .env.deploy
```

至少修改以下值（必需）：

- `ADMIN_AUTH_SECRET`：随机强密钥（32+ 位）
- `ADMIN_SEED_PASSWORD`：后台初始密码
- `CRON_SECRET`：随机字符串（系统任务鉴权）
- `DATABASE_URL`：保持 compose 网络可访问配置

### 3.3 方式 A：直接命令部署

```bash
docker compose -f docker-compose.deploy.yml up -d --build
```

### 3.4 方式 B：脚本部署（推荐）

```bash
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh
```

首次需要 seed：

```bash
./scripts/deploy-docker.sh --seed
```

### 3.5 首次初始化基础数据（仅首次）

若你未使用 `--seed`，执行：

```bash
docker compose -f docker-compose.deploy.yml exec app npm run db:seed
```

### 3.6 验收

会启动：

- `postgres`：数据库
- `app`：Next.js 应用（启动时自动执行 `prisma migrate deploy`）
- `auto-cancel-worker`：周期执行待确认超时取消

访问：

- `http://<your-host-ip>:3000`
- `http://<your-host-ip>:3000/admin/login`

默认管理员账号：

- Email: `owner@nail-booking.local`
- Password: `.env.deploy` 中 `ADMIN_SEED_PASSWORD`

## 4. 上线后检查清单（建议）

1. 后台登录正常：`/admin/login`
2. 系统设置页可访问并可保存：`/admin/settings`
3. 创建预约、查询预约流程可用
4. 自动取消 worker 日志正常
5. 执行一次测试：

```bash
# 在应用容器内
npm run build
npm run test:e2e
```

## 5. 日常升级发布

```bash
git pull
docker compose -f docker-compose.deploy.yml up -d --build
```

说明：

- 应用容器启动会自动执行迁移命令。
- `db:seed` 不建议每次发布都执行，避免重置管理员密码。

## 6. 运维常用命令

查看状态：

```bash
docker compose -f docker-compose.deploy.yml ps
```

查看日志：

```bash
docker compose -f docker-compose.deploy.yml logs -f app
docker compose -f docker-compose.deploy.yml logs -f auto-cancel-worker
```

手动执行一次自动取消：

```bash
docker compose -f docker-compose.deploy.yml exec app npm run job:auto-cancel
```

## 7. 反向代理建议

生产环境建议用 Nginx/Caddy 反向代理到 `127.0.0.1:3000` 并启用 HTTPS。

## 8. 回滚建议

- 代码回滚：切换到上一个 commit/tag 后执行 `docker compose ... up -d --build`
- 数据库回滚：优先前向修复，不建议直接回滚已执行迁移
- 高风险发布前先备份数据库卷

## 9. 安全注意事项

- 禁止使用默认 `ADMIN_SEED_PASSWORD`
- 禁止把 `.env.deploy` 提交到仓库
- 定期轮换 `ADMIN_AUTH_SECRET` 与 `CRON_SECRET`
- 仅开放必要端口；管理接口通过登录态控制

## 10. 备用方案：手工 Node.js 部署

如果不使用 Docker，请参考：

- `docs/architecture/local-runbook-v1.md`

并额外保证：

- 进程守护（systemd/pm2）
- 自动取消任务定时执行
- 反向代理 + HTTPS