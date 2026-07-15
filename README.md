# Tsuzuri — 美甲预约系统

单店美甲预约系统，LINE-first 架构，中日双语界面。

## 系统概览

- 顾客扫码添加店铺 LINE 官方账号，`follow` 后自动建档
- LINE 首次自动发送套餐页面预约链接
- 前台为定额款式作品展示页，每个作品关联后台套餐
- 顾客从定额款式选款进入预约，提交后 LINE 收到待确认通知
- 店长后台确认后，顾客收到 LINE 已确认通知
- 后台可维护定额款式、排班、套餐、顾客、积分与 LINE 1 对 1 对话
- 中日双语（`?lang=zh|ja`）

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 样式 | Tailwind CSS v3 + CSS 自定义属性 |
| 消息 | LINE Messaging API + LIFF |
| 部署 | Docker / GHCR + PM2 + Nginx + Let's Encrypt |

## 当前状态（2026-07-06）

- 本地 `main` 与 GitHub `origin/main` 对齐，最近提交为 `1d76b17`
- 2.0 LINE-first 主链路已落地：LINE 加友、套餐选款、预约提交、后台确认、LINE 通知
- UI 已完成暖色系编辑风格重构
- 定额款式支持自定义价格、自定义时长、固定/可选加项和图片上传
- 排班已切换到 `DaySlot` 拖拽日历，前台预约按开放 slot 校验
- 套餐、加项和前台展示支持 `sortOrder`
- LINE follow 自动建档、欢迎推送、预约通知已实现
- 后台支持定额款式、套餐、加项、排班、顾客、积分、系统设置和 LINE 1 对 1 会话
- 部署链路支持 GitHub Actions 构建 GHCR 镜像，服务器拉取预构建镜像

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
| 前台定额款式 | `http://localhost:3000` |
| 后台登录 | `http://localhost:3000/admin/login` |
| 定额款式管理 | `http://localhost:3000/admin/showcase` |
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
| `ADMIN_AUTH_SECRET` | 管理端 JWT 签名密钥（`openssl rand -hex 32`） |
| `ADMIN_SEED_PASSWORD` | 种子数据管理员密码 |
| `APP_BASE_URL` | 应用公开地址，如 `https://example.com`，LINE 消息链接依赖此值 |
| `CRON_SECRET` | 系统定时任务鉴权密钥 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret（Webhook 签名验证） |
| `LINE_AUTO_REPLY_TEXT` | 旧版兼容变量；当前普通自由文本不自动回复，消息模板优先从后台系统设置维护 |

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
| [docs/README.md](docs/README.md) | 文档索引与当前文件组织口径 |
| [docs/deploy.md](docs/deploy.md) | ECS 生产部署 + LINE 配置完整指南 |
| [docs/architecture/data-model-v2.0-line-first.md](docs/architecture/data-model-v2.0-line-first.md) | 数据模型 |
| [docs/architecture/api-endpoints-v1.md](docs/architecture/api-endpoints-v1.md) | API 路由清单 |
| [docs/architecture/frontend-routes-v1.md](docs/architecture/frontend-routes-v1.md) | 前端路由清单 |
| [docs/prd/prd-v3-line-first.md](docs/prd/prd-v3-line-first.md) | 产品需求文档 |
