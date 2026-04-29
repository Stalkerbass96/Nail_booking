# Tsuzuri — 美甲预约系统

单店美甲预约系统，LINE-first 架构，中日双语界面。

## 系统概览

- 顾客扫码添加店铺 LINE 官方账号，`follow` 后自动建档
- LINE 首次自动发送图墙预约链接
- 前台为图墙式作品展示页，每个作品关联后台套餐
- 顾客从图墙选款进入预约，提交后 LINE 收到待确认通知
- 店长后台确认后，顾客收到 LINE 已确认通知
- 后台可维护图墙、排班、套餐、顾客、积分与 LINE 1 对 1 对话
- 中日双语（`?lang=zh|ja`）

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 样式 | Tailwind CSS v3 + CSS 自定义属性 |
| 消息 | LINE Messaging API + LIFF |
| 部署 | PM2 + Nginx + Let's Encrypt |

## 当前状态（2026-04-29）

- `npm run build` 通过
- `npm run lint` 通过
- UI 已完成暖色系编辑风格重构（ivory 背景、暖近黑文字、无 TS 徽标）
- LINE follow 自动建档、欢迎推送、预约通知已实现
- 图墙、套餐、排班、顾客、积分后台管理已实现
- 等待 LINE Channel 配置后可完成完整业务闭环

## 本地开发

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 启动本地 PostgreSQL（需要 Docker）
docker compose up -d

# 3. 安装依赖，初始化数据库
npm install
npx prisma migrate deploy
npx prisma generate
npm run db:seed

# 4. 启动开发服务器
npm run dev
```

访问地址：

| 页面 | URL |
|------|-----|
| 前台图墙 | `http://localhost:3000` |
| 后台登录 | `http://localhost:3000/admin/login` |
| 图墙管理 | `http://localhost:3000/admin/showcase` |
| LINE 管理 | `http://localhost:3000/admin/line` |

默认种子账号：
- Email: `owner@nail-booking.local`
- Password: `.env` 中的 `ADMIN_SEED_PASSWORD`

## 生产部署（华为云 ECS / Ubuntu）

完整部署步骤见 **[docs/deploy.md](docs/deploy.md)**，包含：

- Node.js + PM2 + PostgreSQL + Nginx 安装配置
- `.env` 环境变量说明
- HTTPS（Let's Encrypt）配置
- LINE Messaging API Channel 创建、Webhook 配置、LIFF 配置
- 华为云安全组端口放行

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `NEXTAUTH_SECRET` | NextAuth 签名密钥（`openssl rand -hex 32`） |
| `NEXTAUTH_URL` | 生产域名，如 `https://example.com` |
| `NEXT_PUBLIC_BASE_URL` | 同上，供前端使用 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `LINE_LIFF_ID` | LIFF App ID（用于预约页身份识别） |
| `ADMIN_SEED_PASSWORD` | 种子数据管理员密码 |

## 常用命令

```bash
npm run dev                      # 开发服务器
npm run build                    # 生产构建
npm run start                    # 生产启动
npm run lint                     # 代码检查
npx prisma migrate deploy        # 执行数据库迁移
npx prisma generate              # 生成 Prisma Client
npm run db:seed                  # 种子数据
npm run job:auto-cancel          # 手动触发自动取消任务
```

## 文档目录

| 文档 | 说明 |
|------|------|
| [docs/deploy.md](docs/deploy.md) | ECS 生产部署 + LINE 配置完整指南 |
| [docs/architecture/data-model-v2.0-line-first.md](docs/architecture/data-model-v2.0-line-first.md) | 数据模型 |
| [docs/architecture/api-endpoints-v1.md](docs/architecture/api-endpoints-v1.md) | API 路由清单 |
| [docs/architecture/frontend-routes-v1.md](docs/architecture/frontend-routes-v1.md) | 前端路由清单 |
| [docs/prd/prd-v3-line-first.md](docs/prd/prd-v3-line-first.md) | 产品需求文档 |
