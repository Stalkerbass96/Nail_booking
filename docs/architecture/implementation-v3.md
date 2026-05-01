# Implementation Overview V3

更新时间：2026-05-01

本文档描述当前代码仓库的实现状态，目标是让开发者或新的 AI agent 迅速理解系统结构、关键约束和部署方式。

## 1. 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15 (App Router) + TypeScript 5.6 |
| 样式 | Tailwind CSS v3 + CSS 自定义属性 |
| 数据库 | PostgreSQL 16 + Prisma 6 ORM |
| 校验 | Zod |
| 消息 | LINE Messaging API |
| 鉴权 | 自定义 JWT（HMAC-SHA256）+ HTTP-only cookie |
| 测试 | Vitest（单元测试）、Playwright（E2E smoke） |
| 构建/部署 | Docker + PM2 + Nginx |

## 2. 目录结构

```txt
src/
  app/
    admin/        # 后台页面（dashboard, showcase, appointments, customers, line, schedule, ...）
    api/
      admin/      # 后台 API（受 middleware 保护）
      public/     # 公开 API
      line/       # LINE Webhook
      system/     # 系统任务（auto-cancel）
    booking/      # 前台预约页
    line/         # LINE 旧版兼容页
    services/     # 旧版服务页（兼容保留）
  components/     # React 组件（admin panels, booking-form 等）
  lib/            # 业务逻辑库（booking-rules, line, system-settings 等）
  types/          # TypeScript 类型定义
prisma/
  schema.prisma
  migrations/
scripts/          # 数据库 seed、自动取消任务、部署脚本
e2e/              # Smoke & acceptance 测试
docs/
Dockerfile
docker-compose.yml
docker-compose.deploy.yml
```

## 3. 当前已实现能力

1. Prisma schema 与数据库迁移链路已落地（5 个迁移，截至 2026-03-08）。
2. 后台登录鉴权已落地，使用 JWT cookie session + middleware 保护管理页面与管理 API。
3. 前台图墙首页（分类筛选、宫格布局），图墙项关联套餐，点击进入固定套餐预约流程。
4. 可用时段计算、营业时间规则、封锁区间、预约冲突拦截已实现。
5. 预约状态流转已实现：`pending`、`confirmed`、`completed`、`canceled`。
6. 后台已支持：图墙管理、预约管理、顾客管理、LINE 会话管理、排班管理（含特殊营业日和封锁区间）、分类/套餐/加项管理、积分查看与扣减、系统设置。
7. LINE 完整接入：Webhook follow/unfollow/message/accountLink、自动建档（`lead` 顾客）、首次推送图墙链接、预约待确认通知、预约已确认通知、后台 1 对 1 文本会话。
8. 系统设置已落地，包括预约粒度、待确认自动取消时长、取消截止时长、积分倍率。
9. 自动取消待确认预约的 worker 已实现，支持循环执行。
10. Docker 单机部署链路已实现，适配 Ubuntu 单主机场景。
11. 中日双语框架已接入，页面通过 `?lang=zh|ja` 维持语言参数。

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
- 顾客从图墙进入预约后不能切换套餐。
- 支付为线下处理，系统仅记录实付金额与积分变动。
- 顾客主身份为 `LINE userId`；邮箱为可选辅助字段，不做唯一约束。

## 6. 关键代码入口

业务规则：
- `src/lib/booking-rules.ts`
- `src/lib/business-hours.ts`
- `src/lib/booking-blocks.ts`
- `src/lib/system-settings.ts` / `src/lib/system-settings-parser.ts`
- `src/lib/points.ts`

LINE 集成：
- `src/lib/line.ts`
- `src/lib/line-customers.ts`
- `src/lib/line-notifications.ts`
- `src/app/api/line/webhook/route.ts`

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

## 8. 潜在改进方向

1. 邮件通知尚未接入（LINE 不可用时无法触达顾客）。
2. LINE 消息当前为纯文本，可升级为模板消息或图片消息。
3. 预约主流程可增加更完整的自动化测试覆盖（尤其是 LINE 通知路径）。
4. 顾客自助取消流程尚未实现（当前只能由店长后台取消）。
