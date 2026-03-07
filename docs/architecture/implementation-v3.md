# Implementation Overview V3

更新时间：2026-03-07

本文档描述当前代码仓库的实现状态，目标是让开发者或新的 AI agent 迅速理解系统结构、关键约束和部署方式。

## 1. 技术栈

- Next.js 15 + TypeScript
- Tailwind CSS
- PostgreSQL 16
- Prisma
- Zod
- Playwright（E2E smoke）

## 2. 目录结构

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

## 3. 当前已实现能力

1. Prisma schema 与数据库迁移链路已落地。
2. 后台登录鉴权已落地，使用 cookie session + middleware 保护管理页面与管理 API。
3. 前台已支持分类/套餐展示、套餐详情、预约创建、预约查询。
4. 可用时段计算、营业时间规则、预约冲突拦截已实现。
5. 预约状态流转已实现：`pending`、`confirmed`、`completed`、`canceled`。
6. 后台已支持预约管理、分类管理、套餐管理、加项管理、客户管理、积分查看与扣减。
7. 系统设置已落地，包括预约粒度、待确认自动取消时长、取消截止时长、积分倍率。
8. 自动取消待确认预约的 worker 已实现，支持循环执行。
9. Docker 单机部署链路已实现，适配 Ubuntu 单主机场景。
10. 中日双语框架已接入，页面通过 `?lang=zh|ja` 维持语言参数。

## 4. 默认系统设置

当前数据库中的默认系统设置：
- `slot_minutes`: 30
- `pending_auto_cancel_hours`: 24
- `cancel_cutoff_hours`: 6
- `point_earn_ratio_jpy`: 100
- `point_redeem_ratio_jpy`: 100

含义：
- 每 30 分钟一个预约粒度
- 待确认超过 24 小时自动取消
- 距预约开始 6 小时内不可取消
- 消费 100 日元返 1 point
- 1 point 可抵 100 日元

## 5. 关键业务约束

- 单店模式，不支持多门店。
- 当前只有一个店长/美甲师，不支持指定技师。
- 待确认预约占用档期。
- 超时未确认预约会自动取消并立即释放档期。
- 套餐和加项时长目前按 30 分钟倍数建模。
- 后台 settings 中的 `slotMinutes` 已限制为当前模型支持的 30 分钟倍数。
- 支付为线下处理，系统仅记录实付金额与积分变动。

## 6. 关键代码入口

业务规则：
- `src/lib/booking-rules.ts`
- `src/lib/business-hours.ts`
- `src/lib/system-settings.ts`
- `src/lib/points.ts`

管理端鉴权：
- `src/lib/admin-auth.ts`
- `src/middleware.ts`

Public API：
- `src/app/api/public/*`

Admin API：
- `src/app/api/admin/*`

自动任务：
- `scripts/auto-cancel-pending.cjs`
- `scripts/auto-cancel-loop.cjs`

部署相关：
- `Dockerfile`
- `docker-compose.deploy.yml`
- `scripts/deploy-docker.sh`
- `docs/deployment/deployment-v1.md`

## 7. 运行方式

### 本地开发

见：`docs/architecture/local-runbook-v1.md`

### Ubuntu 单机部署

见：`docs/deployment/deployment-v1.md`

## 8. 当前仍建议优先改进的点

1. 管理端预约完成流程仍值得从 `prompt` 迁移为正式表单。
2. 预约主流程可以增加更完整的自动化测试。
3. 二期能力如邮件通知、LINE 集成尚未接入。
