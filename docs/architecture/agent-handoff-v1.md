# AI 接手文档 V1

- 目标：让新的 AI coding agent 在 5 分钟内进入可开发状态。
- 更新日期：2026-03-06

## 1. 项目定位

单店美甲预约系统（MVP）。

- 前台：服务展示、预约创建、预约查询。
- 后台：预约流转、分类/套餐/加项管理、客户与积分管理。
- 规则：30 分钟粒度，待确认占位，超时自动取消，积分 100 JPY = 1 point。

## 2. 当前已完成

- API：Public/Admin/System 主流程已打通。
- Admin 鉴权：Cookie Session + Middleware。
- 管理端页面：预约、分类、套餐、加项、客户、积分。
- 中日双语：核心页面支持 `?lang=zh|ja`。
- 自动取消任务：脚本与 API 均可执行。
- 部署：已提供 Docker 部署方案（`docker-compose.deploy.yml`）。

## 3. 当前未完成（优先级）

1. P0：系统设置管理页（营业时间、取消窗口、自动取消窗口、积分比例）。
2. P1：邮件通知（预约创建/确认/取消）。
3. P1：自动化测试（冲突判定、预约流转、积分事务）。
4. P2：统一 i18n 资源文件（减少组件内硬编码文案）。

## 4. 本地开发最短路径

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate:deploy
npm run prisma:generate
npm run db:seed
npm run dev
```

## 5. 关键代码位置

- 预约规则：`src/lib/booking-rules.ts`
- 业务时间计算：`src/lib/business-hours.ts`
- 积分计算：`src/lib/points.ts`
- Admin 鉴权：`src/lib/admin-auth.ts`、`middleware.ts`
- Public API：`src/app/api/public/*`
- Admin API：`src/app/api/admin/*`
- 自动取消：`scripts/auto-cancel-pending.cjs`、`scripts/auto-cancel-loop.cjs`

## 6. 开发约束（建议遵守）

- 保持 Prisma schema 与 API 行为同步更新。
- 涉及预约状态与积分时，优先使用事务。
- 涉及时间冲突与时段算法改动时，先补测试再改逻辑。
- 文案改动需同步中日两套。

## 7. 提交前检查

```bash
npm run build
```

至少保证 build 通过。

## 8. 文档同步要求

涉及以下改动时必须更新文档：

- 新 API / 变更 API：更新 `docs/architecture/api-endpoints-v1.md`
- 新页面 / 路由：更新 `docs/architecture/frontend-routes-v1.md`
- 部署方式变化：更新 `docs/deployment/deployment-v1.md`
- 需求边界变化：更新 `docs/requirements/` 与 `docs/prd/`
