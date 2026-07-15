# Docs Index

更新时间：2026-07-06

文档按两条主线组织：
- 产品与需求
- 开发、运行、部署与接手

## 建议阅读顺序

1. `requirements/requirements-v2.0-line-first.md`
2. `prd/prd-v3-line-first.md`
3. `architecture/data-model-v2.0-line-first.md`
4. `architecture/implementation-v3.md`
5. `architecture/agent-handoff-v1.md`
6. `architecture/api-endpoints-v1.md`
7. `architecture/frontend-routes-v1.md`
8. `architecture/local-runbook-v1.md`
9. `deployment/deployment-v1.md`
10. `deployment/deployment-checklist-v1.md`
11. `deployment/nginx-https-v1.md`
12. `deployment/line-setup-v1.md`
13. `operations/notes-v1.md`
14. `testing/acceptance-v1.md`
15. `CHANGELOG.md`

## 与 GitHub 当前状态

- 本地 `main` 与 `origin/main` 已对齐，最近提交为 `1d76b17 revert: remove auto-reply for general text messages`。
- 本地文件夹相对 GitHub 仅有未跟踪截图文件：`line-mobile-*.png` 与 `ui-check-*.png`。
- `node_modules/`、`.next*`、日志文件和本地环境文件属于开发产物或本地配置，不作为仓库源码口径。

## 面向人的入口

- 想理解系统最新需求：看 `requirements/requirements-v2.0-line-first.md` 和 `prd/prd-v3-line-first.md`
- 想理解数据库和业务模型：看 `architecture/data-model-v2.0-line-first.md`
- 想理解已完成内容与后续方向：看 `architecture/task-breakdown-v2.0-line-first.md`
- 想继续开发：看 `architecture/agent-handoff-v1.md`、`architecture/api-endpoints-v1.md`
- 想本地启动：看 `architecture/local-runbook-v1.md`
- 想在全新 Ubuntu 云主机上一步步部署：看 `deployment/deployment-v1.md`
- 想接域名、Nginx 和 HTTPS：看 `deployment/nginx-https-v1.md`
- 想接入 LINE Messaging API：看 `deployment/line-setup-v1.md`
- 想做部署验收：看 `deployment/deployment-checklist-v1.md`

## 面向 AI agent 的最低接手集合

最少读这 6 份：
1. `docs/requirements/requirements-v2.0-line-first.md`
2. `docs/prd/prd-v3-line-first.md`
3. `docs/architecture/data-model-v2.0-line-first.md`
4. `docs/architecture/agent-handoff-v1.md`
5. `docs/architecture/api-endpoints-v1.md`
6. `docs/deployment/deployment-v1.md`

## 当前状态

当前代码口径：2.0 LINE-first 已全部落地，并在 2026-05 至 2026-06 追加了定额款式增强、DaySlot 排班、上传、GHCR 部署和 LINE 消息设置等改动。系统主链路：

1. 顾客身份：`LINE userId -> Customer`（`lead` → `active`）
2. 前台默认入口：`/` → `/services` menu 页面；定额款式入口为 `/?view=design`
3. 预约提交：`ShowcaseItem -> Appointment`（`line_showcase` 来源）
4. 通知链路：`follow` 欢迎 / `pending` 待确认 / `confirmed` 已确认
5. 后台运营：定额款式管理、预约确认、拖拽排班、LINE 1 对 1 会话

## 当前文件组织口径

- `src/app/`：页面和 Route Handlers，按 `public`、`admin`、`line`、`system` 分区。
- `src/components/`：前台预约组件和后台管理面板。
- `src/lib/`：预约规则、DaySlot、LINE、积分、系统设置和鉴权等共享业务逻辑。
- `prisma/`：schema 与迁移历史。
- `scripts/`：seed、部署、自动取消 worker 和验证脚本。
- `e2e/`：smoke 与 acceptance 测试入口。
- `docs/`：需求、架构、部署、运营和测试文档。

## 文档维护规则

任何影响运行或部署的改动，提交时至少同步更新下面文档中的一项：
- 运行方式变更：`architecture/local-runbook-v1.md`
- 部署方式变更：`deployment/deployment-v1.md`
- 部署验收变更：`deployment/deployment-checklist-v1.md`
- 反向代理或 HTTPS 变更：`deployment/nginx-https-v1.md`
- LINE 配置或消息流程变更：`deployment/line-setup-v1.md`
- API 或页面结构变更：`architecture/api-endpoints-v1.md` 或 `architecture/frontend-routes-v1.md`
- 需求边界变更：`requirements/` 或 `prd/`
