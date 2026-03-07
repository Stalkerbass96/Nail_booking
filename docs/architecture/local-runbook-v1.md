# Local Runbook V1

更新时间：2026-03-07

本文档用于本地开发和功能验证，不是生产部署手册。

## 1. 环境要求

- Node.js 20+
- npm 10+
- Docker Desktop 或本机 PostgreSQL 16

## 2. 本地启动步骤

### 2.1 复制环境变量

```bash
cp .env.example .env
```

PowerShell：

```powershell
Copy-Item .env.example .env
```

### 2.2 启动数据库

如果使用 Docker：

```bash
docker compose up -d
```

如果使用本机 PostgreSQL，请确认 `.env` 中的 `DATABASE_URL` 指向本机数据库，并手动启动 PostgreSQL 服务。

### 2.3 安装依赖

```bash
npm install
```

### 2.4 初始化数据库

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
```

或者直接：

```bash
npm run db:setup
```

### 2.5 启动开发服务器

```bash
npm run dev
```

访问地址：
- 前台：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env` 中的 `ADMIN_SEED_PASSWORD`

## 3. 本地验证命令

```bash
npm run lint
npm run build
npm run test:e2e
npm run verify
```

说明：
- `npm run test:e2e` 会尝试拉起本地开发服务并执行 smoke 测试
- 测试产物在 `docs/testing/artifacts/`

## 4. 常见问题

### 数据库连不上

检查：
- Docker 容器是否启动：`docker compose ps`
- `.env` 中 `DATABASE_URL` 是否正确
- PostgreSQL 端口是否被占用

### 种子账号无法登录

重新执行：

```bash
npm run db:seed
```

并确认 `.env` 中的 `ADMIN_SEED_PASSWORD` 与你输入的一致。

### 自动取消没有生效

本地可手动执行一次：

```bash
npm run job:auto-cancel
```
