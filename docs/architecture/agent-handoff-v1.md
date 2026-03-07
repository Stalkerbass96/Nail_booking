# AI Agent Handoff V1

更新时间：2026-03-07

这份文档给新的 AI coding agent 或新开发者使用，目标是 5 分钟内建立足够上下文并继续开发。

## 1. 项目是什么

这是一个单店美甲预约系统，角色只有两类：
- 顾客
- 店长/美甲师（当前只有 1 人）

系统分为两部分：
- 前台：套餐展示、预约创建、预约查询
- 后台：预约管理、分类/套餐/加项管理、客户与积分管理、系统设置

## 2. 当前已经完成的模块

- 前台套餐分类展示
- 套餐详情页
- 预约创建 API 与页面
- 预约查询页
- 后台登录（cookie session）
- 后台预约列表
- 分类管理
- 套餐管理
- 加项管理
- 客户查询与积分面板
- 系统设置面板
- 自动取消待确认预约 worker
- Docker 单机部署链路

## 3. 当前已知边界

- 单店，不支持多门店
- 不支持在线支付，线下收款
- 不支持指定美甲师，因为当前店长就是唯一美甲师
- 邮件/LINE 通知属于后续阶段
- 积分目前以展示、后台扣减为主

## 4. 最关键的代码入口

业务规则：
- `src/lib/booking-rules.ts`
- `src/lib/business-hours.ts`
- `src/lib/system-settings.ts`
- `src/lib/points.ts`

后台鉴权：
- `src/lib/admin-auth.ts`
- `src/middleware.ts`

Public API：
- `src/app/api/public/*`

Admin API：
- `src/app/api/admin/*`

定时任务：
- `scripts/auto-cancel-pending.cjs`
- `scripts/auto-cancel-loop.cjs`

部署链路：
- `Dockerfile`
- `docker-compose.deploy.yml`
- `scripts/deploy-docker.sh`
- `docs/deployment/deployment-v1.md`

## 5. 接手后先做什么

建议顺序：
1. `npm install`
2. `npm run lint`
3. `npm run build`
4. 阅读 `implementation-v3`、API 路由文档、前端路由文档
5. 再进入具体 feature 开发

如果需要本地完整跑通：
1. `cp .env.example .env`
2. `docker compose up -d`
3. `npm run db:setup`
4. `npm run dev`

## 6. 变更规则

- 变更 Prisma schema 后，必须同步验证迁移与 seed
- 变更预约规则后，至少检查预约创建、可用时间、自动取消三处逻辑
- 变更部署方式后，必须同步更新 `docs/deployment/deployment-v1.md`
- 提交前至少运行：

```bash
npm run lint
npm run build
```

如果改到主流程，额外运行：

```bash
npm run test:e2e
```

## 7. 当前优先级建议

1. 管理端预约完成流程改成正式表单，不再使用 `prompt`
2. 管理端预约页剩余文案与交互打磨
3. 增加更多业务测试覆盖
4. 接入邮件通知/LINE 集成（二期）
