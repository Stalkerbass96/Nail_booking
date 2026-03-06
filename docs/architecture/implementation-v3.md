# 技术实施清单 V3（按当前代码更新）

- 更新日期：2026-03-06

## 1. 技术栈

- Next.js 15 + TypeScript
- Tailwind CSS
- PostgreSQL 16
- Prisma
- Zod

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
7. 自动取消任务：已完成（脚本 + 常驻 worker）
8. 客户与积分管理：已完成
9. 多语言与验收：进行中（核心页面已覆盖）
10. Docker 化部署：已完成（一体部署 compose）

## 4. 核心参数（来自 `system_settings`）

- `slot_minutes = 30`
- `pending_auto_cancel_hours = 24`（seed 默认）
- `cancel_cutoff_hours = 6`（seed 默认）
- `point_earn_ratio_jpy = 100`
- `point_redeem_ratio_jpy = 100`

## 5. 已落地能力

- Admin 鉴权：`/admin/*` 与 `/api/admin/*` 受中间件保护。
- Public 预约：支持时段计算、冲突校验、预约创建、预约查询。
- Admin 预约：支持确认、取消、完成；完成时处理积分流水。
- Catalog：分类/套餐/加项 CRUD（套餐支持关联加项）。
- Customer/Points：客户历史查询、积分流水查询、手动扣减。
- Job：超时待确认自动取消（脚本 + API + worker 三入口）。
- Deploy：`docker-compose.deploy.yml` 可启动完整运行栈。

## 6. 主要风险与控制

- 时间冲突判定：建议补充边界测试（跨天、临界分钟、并发）。
- 自动取消任务：已幂等（按状态 + 时间批量更新），需上线后监控执行频率。
- 积分事务一致性：完成预约与积分流水已在事务内处理。

## 7. 待办（建议优先级）

- P0：系统设置管理页（营业时间、取消窗口、自动取消窗口等）。
- P1：邮件通知（预约成功、确认、取消提醒）。
- P1：统一 i18n 资源文件（替代分散在组件内的 TEXT 常量）。
- P2：自动化测试（API 单测 + 关键流程集成测试）。
