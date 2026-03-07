# Nail Booking

单店美甲预约系统，当前仓库包含：
- 顾客前台预约页面
- 店长后台管理页面
- PostgreSQL 数据库
- 自动取消待确认预约的后台任务
- 中日双语界面（`?lang=zh|ja`）
- 后台营业排班、特殊营业日、预约封锁区间
- LINE Webhook、LINE 会话、顾客绑定与后台主动发消息

当前目标是两件事：
1. 任何新的 AI coding agent 打开仓库后，能快速接手继续开发。
2. 你在任意一台 Ubuntu 云主机上，按文档执行即可部署并运行整套系统。

## 当前状态

截至 2026-03-07：
- `npm run build` 通过
- `npm run lint` 通过
- Docker 单机部署链路已整理为 `app + postgres + auto-cancel-worker`
- 管理端已包含预约、营业排班、分类、套餐、加项、客户、积分、LINE 会话、系统设置等页面

## 技术栈

- Next.js 15
- TypeScript
- PostgreSQL 16
- Prisma
- Tailwind CSS
- Playwright（E2E smoke）

## 本地开发

1. 复制环境变量：

```bash
cp .env.example .env
```

2. 启动数据库：

```bash
docker compose up -d
```

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

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env` 中的 `ADMIN_SEED_PASSWORD`

如需本地调试 LINE，再补这些变量：

```env
LINE_CHANNEL_SECRET=""
LINE_CHANNEL_ACCESS_TOKEN=""
LINE_AUTO_REPLY_TEXT="Message received. The salon owner will reply to you shortly."
```

## Ubuntu 单机部署

推荐直接使用 Docker Compose 部署。完整步骤见：
- [docs/deployment/deployment-v1.md](docs/deployment/deployment-v1.md)
- 如果需要域名、Nginx 和 HTTPS：
  [docs/deployment/nginx-https-v1.md](docs/deployment/nginx-https-v1.md)

最短路径：

```bash
cp .env.deploy.example .env.deploy
vim .env.deploy
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh --seed
```

部署后访问：
- `http://<服务器IP>:3000`
- `http://<服务器IP>:3000/admin/login`

如果接入 LINE：
- 后台页面：`/admin/line`
- Webhook 路径：`/api/line/webhook`
- 需要配置 `LINE_CHANNEL_SECRET` 与 `LINE_CHANNEL_ACCESS_TOKEN`

## 文档入口

先看这里：
- [docs/README.md](docs/README.md)

对接新 agent 时优先看：
- [docs/architecture/agent-handoff-v1.md](docs/architecture/agent-handoff-v1.md)

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run start
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
npm run test:e2e
npm run test:e2e:acceptance
npm run job:auto-cancel
npm run job:auto-cancel:loop
```
