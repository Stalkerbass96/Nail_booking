# 技术实施清单 V3（按当前代码更新）

- 更新日期：2026-03-07

## 1. 技术栈

- Next.js 15 + TypeScript
- Tailwind CSS
- PostgreSQL 16
- Prisma
- Zod
- Playwright（E2E）

## 2. 工程目录（当前）

```txt
src/
  app/
    admin/
    api/
    booking/
    services/
  components/
  lib/
prisma/
scripts/
docs/
Dockerfile
docker-compose.deploy.yml
```

## 3. 里程碑完成度

1. 建库与 Prisma schema：已完成
2. 后台登录与权限保护：已完成
3. 分类/套餐/加项管理：已完成（基础管理 + 分类批量操作）
4. 前台展示与可预约时段计算：已完成
5. 预约创建与编号生成：已完成
6. 后台预约流转：已完成
7. 自动取消任务：已完成（脚本 + 常驻 worker + 鉴权）
8. 客户与积分管理：已完成
9. 系统设置后台页：已完成（含读写 API）
10. UI 商品化改造：已完成两轮（前后台一致性）
11. 自动化测试与 E2E：已完成基线并通过最近一轮
12. Docker 化部署：已完成（一体部署 compose）

## 4. 核心参数（来自 `system_settings`）

- `slot_minutes`（默认 30）
- `pending_auto_cancel_hours`（默认 24）
- `cancel_cutoff_hours`（默认 6）
- `point_earn_ratio_jpy`（默认 100）
- `point_redeem_ratio_jpy`（默认 100）

## 5. 已落地能力

- Admin 鉴权：`/admin/*` 与 `/api/admin/*` 受中间件保护。
- 安全策略：
  - `ADMIN_AUTH_SECRET` 必填（无默认回退）
  - `CRON_SECRET` 必填（系统任务接口强制鉴权）
- Public 预约：支持时段计算、冲突校验、预约创建、预约查询。
- 并发防护：预约创建流程加入事务内锁与冲突防重。
- Admin 预约：支持确认、取消、完成；完成时处理积分流水。
- Catalog：分类/套餐/加项 CRUD（套餐支持关联加项）。
- Customer/Points：客户历史查询、积分流水查询、手动扣减。
- Settings：后台可维护时间粒度、自动取消窗口、取消窗口、积分比例。
- Job：超时待确认自动取消（脚本 + API + worker 三入口）。
- Deploy：`docker-compose.deploy.yml` 可启动完整运行栈。

## 6. 质量与验证

- `npm run build`：通过
- `npm run test:e2e`：最近一轮 5/5 PASS（见 testing 报告）

## 7. 当前风险与建议

- P1：通知能力（邮件）未落地。
- P1：在线支付未落地。
- P1：i18n 文案仍有部分分散，建议统一资源化。
- P2：补充并发/异常压力测试与长期回归套件。