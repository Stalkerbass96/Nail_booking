# Nail Booking

单店美甲预约系统，当前主线版本是 **2.0 LINE-first**。

系统核心特征：
- 顾客通过线下扫码添加店铺 LINE 官方账号
- `follow` 后立即创建顾客档案，初始状态为“潜在客户”
- LINE 首次自动发送预约主页链接
- 前台首页是图墙式作品展示页
- 每个图墙项关联一个后台套餐
- 顾客从图墙进入预约，提交后收到 LINE 待确认通知
- 店长后台确认后，顾客收到 LINE 已确认通知
- 后台可维护图墙、排班、封锁、套餐、顾客、积分与 LINE 1 对 1 对话
- 中日双语界面（`?lang=zh|ja`）

## 当前目标

1. 新的 AI coding agent 打开仓库后，能快速接手继续开发。
2. 你在任意一台 Ubuntu 云主机上，按文档执行即可部署并运行整套系统。
3. 有域名和 HTTPS 时，可继续接入 LINE Messaging API 完成完整 2.0 业务闭环。

## 当前状态

截至 2026-03-08：
- `npm run build` 通过
- `npm run lint` 通过
- 2.0 文档已冻结
- 2.0 第一批实现已完成：
  - LINE `follow` 自动建档
  - 首次欢迎主页链接
  - 图墙模型、后台管理 API 与后台页面
  - 首页改为图墙入口
  - 图墙项进入预约流程
  - 预约提交后发送 LINE 待确认通知
  - 后台确认后发送 LINE 已确认通知
  - 后台顾客/预约页开始切换到 LINE-first 展示

## 技术栈

- Next.js 15
- TypeScript
- PostgreSQL 16
- Prisma
- Tailwind CSS
- Playwright / Node 脚本用于验收

## 本地开发

1. 复制环境变量：

```bash
cp .env.example .env
```

2. 启动本地 PostgreSQL：

```bash
docker compose up -d
```

如果 Docker daemon 没启动，`migrate` / `seed` 会失败。

3. 安装依赖并初始化数据库：

```bash
npm install
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
```

4. 启动开发环境：

```bash
npm run dev
```

5. 打开：
- 前台：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`
- 图墙管理：`http://localhost:3000/admin/showcase`
- LINE 会话页：`http://localhost:3000/admin/line`

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env` 中的 `ADMIN_SEED_PASSWORD`

## Ubuntu 单机部署

推荐直接使用 Docker Compose 部署。

先看这几份文档：
- `docs/deployment/deployment-v1.md`
- `docs/deployment/deployment-checklist-v1.md`
- `docs/deployment/line-setup-v1.md`

如果你需要域名、Nginx 和 HTTPS，再看：
- `docs/deployment/nginx-https-v1.md`

最短路径：

```bash
git clone https://github.com/Stalkerbass96/Nail_booking.git
cd Nail_booking
cp .env.deploy.example .env.deploy
nano .env.deploy
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh --seed
```

## 文档入口

从这里开始：
- `docs/README.md`

对接新 agent 时优先看：
- `docs/requirements/requirements-v2.0-line-first.md`
- `docs/prd/prd-v3-line-first.md`
- `docs/architecture/data-model-v2.0-line-first.md`
- `docs/architecture/task-breakdown-v2.0-line-first.md`
- `docs/architecture/agent-handoff-v1.md`

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run verify
npm run start
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
npm run test:e2e
npm run test:e2e:acceptance
npm run job:auto-cancel
npm run job:auto-cancel:loop
```
