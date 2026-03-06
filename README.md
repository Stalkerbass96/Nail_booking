# Nail Booking

单店美甲预约系统（MVP）。

- 前台：套餐展示、在线预约、预约查询（邮箱 + 预约号）
- 后台：预约流转、分类/套餐/加项管理、客户与积分管理、系统设置
- 语言：中文 / 日文（`?lang=zh|ja`）

## 当前状态（2026-03-07）

- 需求冻结：`V1.1`
- 后台鉴权：已完成（Cookie Session + Middleware，禁用默认密钥回退）
- 核心 API：已完成（Public/Admin/System）
- 系统设置：已完成（`/admin/settings` + `/api/admin/system-settings`）
- UI/UX：已完成两轮商品化精修（前台 + 后台统一视觉）
- E2E：已完成（最近一轮 `5/5 PASS`）
- 二期功能（邮件通知、LINE、在线支付）：未开始

## 技术栈

- Next.js 15 + TypeScript
- PostgreSQL 16
- Prisma
- Tailwind CSS
- Playwright（E2E）

## 本地开发快速开始

1. 复制环境变量

```bash
cp .env.example .env
```

2. 准备 PostgreSQL（任选一种）

- 方式 A（推荐）：Docker

```bash
docker compose up -d
```

- 方式 B：本机 PostgreSQL 服务（确保 `localhost:5432` 可用）

```bash
systemctl start postgresql
```

3. 安装依赖并初始化数据库

```bash
npm install
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
```

4. 启动开发服务

```bash
npm run dev
```

5. 访问地址

- 前台：`http://localhost:3000`
- 后台登录：`http://localhost:3000/admin/login`
- 后台首页：`http://localhost:3000/admin`

默认管理员账号：

- Email: `owner@nail-booking.local`
- Password: 使用 `.env` 中 `ADMIN_SEED_PASSWORD`（默认 `dev-only-change-me`）

## E2E 测试

```bash
npm run test:e2e
```

最近测试报告：
- `docs/testing/e2e-report-2026-03-07.md`

## 任意主机部署（Docker 推荐）

```bash
cp .env.deploy.example .env.deploy
# 修改 .env.deploy 中密钥和密码
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh --seed
```

部署详见：`docs/deployment/deployment-v1.md`

## 文档入口

完整文档请看 [docs/README.md](docs/README.md)。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
npm run test:e2e
npm run job:auto-cancel
npm run job:auto-cancel:loop
```