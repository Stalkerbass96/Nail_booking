# CHANGELOG

## 2026-05-01

### 文档清理
- 删除遗留的一次性脚本：`scripts/git-push.ps1`、`scripts/bootstrap-dev.ps1`、`scripts/cleanup-workspace.ps1`（均为前次 Cowork 会话遗留）。
- 删除 E2E 测试跑批产物：`docs/testing/artifacts/e2e-2026-03-07/`。
- 删除被新版本取代的文档：`docs/prd/prd-v2.md`、`docs/requirements/requirements-v1.1.md`。
- 全面更新所有架构与运营文档，与 2.0 LINE-first 代码当前实际状态保持一致。
- 修正 `README.md` 中环境变量表（删除不存在的 `NEXTAUTH_SECRET`/`NEXTAUTH_URL`，补充 `ADMIN_AUTH_SECRET`/`APP_BASE_URL`/`CRON_SECRET`）。

## 2026-03-08

### LINE-first 2.0 完整落地
- LINE Webhook 完整接入：`follow / unfollow / message / accountLink` 事件处理。
- `follow` 事件自动创建顾客档案（`customerType=lead`）并仅首次推送图墙首页链接。
- 图墙前台首页完成切换，支持分类筛选，点击图墙项进入固定套餐预约流程。
- 预约创建写入 `showcaseItemId` 与 `sourceChannel=line_showcase`，首次预约将顾客从 `lead` 转为 `active`。
- 提交预约后 LINE 自动推送待确认消息（含预约号与详情链接）。
- 店长在后台确认预约后，LINE 自动推送已确认通知。
- 后台新增图墙管理页（`/admin/showcase`）：创建、编辑、删除、排序、上下架。
- 后台新增 LINE 会话页（`/admin/line`）：1 对 1 文本消息、未读状态管理、手动绑定顾客。
- 后台顾客页升级：潜在客户/正式顾客状态、LINE 关联档案、预约来源溯源。
- 后台预约页升级：展示来源图墙项、顾客 LINE 关联情况。
- 公开预约详情页（`/booking/{bookingNo}`）作为 LINE 消息落点页面完成接入。
- 新增预约封锁区间（BookingBlock）与特殊营业日管理。
- 完成暖色系 UI 重构（ivory 背景、warm tone 调色板、无 TS 徽标）。
- 完成所有架构与数据模型文档（data-model-v2.0、api-endpoints、frontend-routes、task-breakdown）。
- `npm run build` ✅，`npm run lint` ✅，`npm run test:e2e` 5/5 ✅。

## 2026-03-07

### 产品与功能
- 新增后台营业排班页面，支持每周营业时间维护。
- 新增特殊营业日配置，可按天覆盖默认工作时间。
- 新增预约封锁区间，封锁时段会直接从前台可预约时段中剔除。
- 前台预约创建逻辑增加封锁区间校验，避免顾客绕过前端占用被封锁时间。
- 新增 LINE 基础接入：Webhook、LINE 用户列表、消息会话、后台主动发消息、手动绑定顾客。
- 修复系统设置页与种子数据中的乱码文案。

### 文档与部署
- 新增 Ubuntu Nginx + HTTPS 文档，覆盖域名、反向代理、Certbot 与续期。
- 新增 `.env.nginx.example` 作为域名与证书配置占位模板。
- `deploy-docker.sh` 增加失败 trap、日志回显和 HTTP 探活。
- 重写根目录 `README.md`，明确本地开发、Ubuntu 单机部署和文档入口。
- 重写 `docs/deployment/deployment-v1.md`，补全 Ubuntu 22.04/24.04 从零部署步骤。
- 重写 `docs/README.md`、`docs/architecture/agent-handoff-v1.md`、`docs/architecture/local-runbook-v1.md`。
- 清理并重写实现架构、API 路由、前端路由文档，移除乱码。
- 新增 `.gitattributes`，固定 shell 脚本与部署文件使用 LF 行尾。
- 为 LINE 接入补充 `.env.example`、`.env.deploy.example` 与 `docker-compose.deploy.yml`。

### 部署链路
- 修复 Docker 镜像构建时过早设置 `NODE_ENV=production` 导致缺少 Tailwind 构建依赖的问题。
- 去掉部署 compose 中固定 `container_name`，避免同主机重复部署时命名冲突。
- 调整部署脚本顺序为 `postgres -> migrate/seed -> app + worker`，消除首次部署竞态。
- `docker-compose.deploy.yml` 改为从 `.env.deploy` 读取数据库、端口和部署参数。
- `Dockerfile` 改为显式绑定 `0.0.0.0`，确保容器能从宿主机端口访问。
- `.env.deploy.example` 扩展为单机部署所需的完整变量集合。
- `scripts/deploy-docker.sh` 改为统一使用 `--env-file .env.deploy`，并在启动后输出访问地址。

### 验证
- `npm run build` 通过。
- `npm run lint` 通过。
- 本轮由于本机 PostgreSQL 未启动，`prisma migrate deploy` 未在当前机器完成实际执行；迁移文件已写入仓库。

## 2026-03-06

### MVP 第一轮实现
- 完成单店美甲预约的核心数据模型。
- 完成公开预约流程与后台基础管理页面。
- 接入后台登录鉴权、自动取消任务、种子数据与基础部署文档。
