# CHANGELOG

## 2026-07-11

### 顾客积分与前台排序
- 通过有效 LINE 专属链接识别到的客户，可在定额款式、套餐、详情和 option 页面顶栏查看当前积分余额；预约填写页不显示，0 分也会显示。
- 预约姓名不再预填 LINE 昵称，顾客必须主动填写姓名后才能提交。
- 预约表单统一汇总日期、时间和姓名校验错误，不再同时显示浏览器弹窗与页面错误。
- 后台套餐排序改为按分类分组，并仅调整同一分类内的套餐顺序。
- 套餐详情、预约页及公开套餐 API 的加项统一按后台 `sortOrder` 展示。
- 系统设置新增店主 LINE 通知接收人和测试发送；客户提交预约后自动向店主个人 LINE 推送预约摘要。

## 2026-06-02

### 预约、排序与 LINE 消息
- `public` 预约可用性与提交校验切换为 `DaySlot`，不再依赖旧版 `BusinessHour` 表。
- 前台套餐、加项和套餐-加项关联按 `sortOrder` 展示，保证顾客侧顺序与后台维护一致。
- `system_settings.value` 扩展为 `Text`，支持更长的 LINE 消息模板配置。
- 曾恢复通用文字消息自动回复，随后回滚为不对普通文字消息自动回复，仅保留明确触发的预约链接回复逻辑。

## 2026-05-27

### 前台导航、排序与系统设置
- 服务页新增 sticky 分类跳转栏，修复移动端分类导航横向溢出与头部间距问题。
- 定额款式首页查询只选择必要字段，降低迁移未完全执行时的页面风险。
- 后台导航压缩为更适合运营使用的布局。
- 系统设置新增可编辑 LINE 消息模板。
- LINE 预约通知固定使用日文模板；后台改期时同步按 `DaySlot` 校验。
- 套餐和加项新增 `sortOrder` 字段、迁移和上下移动 UI。
- 定额款式项新增 `customDurationMin`，支持按款式覆盖标准时长。

## 2026-05-23

### 排班日历与部署链路
- 后台排班面板替换为基于 `DaySlot` 的拖拽日历。
- 管理后台首页今日营业时间改为读取 `DaySlot`，移除旧版 block/calendar 摘要。
- 修复排班日历移动端横向/纵向滚动手势冲突，时间标签保持固定。
- 优化日历颜色，预约占用格使用绿色显示。
- 服务页套餐和加项描述保留换行。
- 部署脚本改为从 GHCR 拉取预构建镜像，不再在服务器本地构建。

## 2026-05-19

### CI、部署与预约封锁
- 新增 GitHub Actions 构建工作流，推送镜像到 GHCR，服务器端拉取预构建镜像。
- Next.js 构建限制 Node.js heap 为 768 MB，适配低内存主机。
- 后台套餐页支持图片展示。
- 管理日历支持点击创建预约封锁。
- 封锁创建支持 30 分钟粒度和时长选择。

## 2026-05-17 至 2026-05-18

### 上传、鉴权与 LINE 顾客
- 移除 `.gitignore` 中对 `*.png` 的忽略，允许提交必要截图或图片资产。
- 上传图片改为通过 `/api/uploads/{filename}` 服务，绕过 Next.js 静态文件缓存。
- 新增本地图片上传，用于定额款式和套餐后台表单。
- 根级 `middleware.ts` 保护所有后台页面与后台 API。
- 管理端登录改为 session-only cookie，并支持用户名/邮箱登录。
- 顾客页新增 LINE followers 标签页，支持同步 webhook 配置前已关注的用户。
- 当顾客发送指定触发词时，LINE 自动回复预约入口链接。
- 任何 LINE 互动都会确保顾客档案存在，followers 同步失败时返回更友好的错误。
- 预约详情页明确使用 Asia/Tokyo 时区显示时间。

## 2026-05-02

### 套餐、加项与定额款式预约增强
- 套餐时长支持 5 分钟粒度。
- 加项时长支持 5 分钟粒度，预约结束时间按 slot 边界向上取整。
- 加项支持数量、最大数量与 stepper；定额款式固定组合通过 `ShowcaseItemAddon` 建模。
- 定额款式支持自定义价格、折扣展示、隐藏加项明细、可选加项与长列表滚动。
- 定额款式预约表单正确展示包含固定加项后的总价和总时长。
- 前台新增 `/addons` 加项目录页。

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
- `follow` 事件自动创建顾客档案（`customerType=lead`）并仅首次推送套餐页面预约链接。
- 定额款式前台首页完成切换，支持分类筛选，点击定额款式项进入固定套餐预约流程。
- 预约创建写入 `showcaseItemId` 与 `sourceChannel=line_showcase`，首次预约将顾客从 `lead` 转为 `active`。
- 提交预约后 LINE 自动推送待确认消息（含预约号与详情链接）。
- 店长在后台确认预约后，LINE 自动推送已确认通知。
- 后台新增定额款式管理页（`/admin/showcase`）：创建、编辑、删除、排序、上下架。
- 后台新增 LINE 会话页（`/admin/line`）：1 对 1 文本消息、未读状态管理、手动绑定顾客。
- 后台顾客页升级：潜在客户/正式顾客状态、LINE 关联档案、预约来源溯源。
- 后台预约页升级：展示来源定额款式项、顾客 LINE 关联情况。
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
