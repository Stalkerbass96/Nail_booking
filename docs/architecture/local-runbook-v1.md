# 本地运行手册 V1

- 适用：开发机（Windows / macOS / Linux）
- 更新日期：2026-03-06

## 1. 前置要求

- Node.js 20+
- npm 10+
- Docker（用于启动 PostgreSQL）

## 2. 初始化步骤

1. 复制环境变量

```bash
cp .env.example .env
```

Windows PowerShell 可用：

```powershell
Copy-Item .env.example .env
```

2. 启动数据库

```bash
docker compose up -d
```

3. 安装依赖

```bash
npm install
```

4. 初始化数据库结构与基础数据

```bash
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
```

## 3. 启动项目

```bash
npm run dev
```

默认地址：

- 前台：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`

## 4. 默认管理员账号

- Email：`owner@nail-booking.local`
- Password：`.env` 中 `ADMIN_SEED_PASSWORD`（默认 `dev-only-change-me`）

## 5. 常见排查

- 数据库连接失败：确认 `docker compose ps` 中 `postgres` 为 `running`。
- 迁移失败：检查 `.env` 的 `DATABASE_URL`。
- 登录失败：重新执行 `npm run db:seed`（会重置默认管理员密码为当前 `ADMIN_SEED_PASSWORD`）。
- 自动取消未生效：手动执行 `npm run job:auto-cancel` 验证。

## 6. 开发常用命令

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
npm run job:auto-cancel
```
