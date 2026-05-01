# AI Agent Handoff V1

更新时间：2026-05-01

这份文档给新的 AI coding agent 或新开发者使用，目标是 5 分钟内建立足够上下文并继续开发。

## 1. 项目是什么

这是一个以 LINE 为主入口的单店美甲预约系统（Tsuzuri），中日双语，角色只有两类：
- 顾客（通过 LINE 加好友进入，图墙选款预约）
- 店长/美甲师（后台管理预约、图墙、顾客、LINE 会话）

系统分为两部分：
- 前台：图墙式作品展示 + 预约创建 + 预约详情查看
- 后台：预约管理、图墙管理、顾客管理、LINE 1 对 1 会话、排班/积分/系统设置

## 2. 当前已经完成的模块

- 前台图墙首页（分类筛选、图墙宫格布局）
- 从图墙项进入固定套餐预约流程
- 预约创建 API（LINE 路径：entry + showcaseItemId；旧版路径：email + packageId）
- 预约成功页与公开预约详情页
- LINE Webhook（follow / unfollow / message / accountLink）
- `follow` 自动创建顾客档案（`customerType=lead`）并首次推送图墙链接
- 预约提交后 LINE 待确认通知（含预约号与详情链接）
- 店长确认预约后 LINE 已确认通知
- 后台登录（JWT cookie session）
- 后台图墙管理（创建、编辑、删除、排序、上下架）
- 后台预约管理（列表、确认、取消、完成）
- 后台顾客管理（潜在客户/正式顾客、LINE 关联、预约历史、积分）
- 后台 LINE 会话页（1 对 1 文本消息、未读状态、手动绑定顾客）
- 后台排班管理（每周营业时间、特殊营业日、封锁区间）
- 分类管理、套餐管理、加项管理
- 积分查看与扣减
- 系统设置（预约粒度、待确认超时、取消截止、积分倍率）
- 自动取消待确认预约 worker
- Docker 单机部署链路

## 3. 当前已知边界

- 单店，不支持多门店
- 不支持在线支付，线下收款
- 不支持指定美甲师（店长即唯一技师）
- 邮件通知尚未接入
- LINE 会话当前仅支持文本消息（无图片/模板消息）
- 顾客预约时不能切换套餐

## 4. 最关键的代码入口

业务规则：
- `src/lib/booking-rules.ts` — 时间槽生成、时长计算、预约号生成
- `src/lib/business-hours.ts` — 营业时间查询（周计划 + 特殊日期）
- `src/lib/booking-blocks.ts` — 封锁区间校验
- `src/lib/system-settings.ts` / `src/lib/system-settings-parser.ts` — 运行时配置
- `src/lib/points.ts` — 积分计算

LINE 集成：
- `src/lib/line.ts` — Webhook 签名验证、LINE API 调用（发消息、获取用户档案）
- `src/lib/line-customers.ts` — LINE 用户与 Customer 映射、自动建档
- `src/lib/line-notifications.ts` — 预约消息模板（待确认/已确认/欢迎）

后台鉴权：
- `src/lib/admin-auth.ts`
- `src/middleware.ts`

Public API：
- `src/app/api/public/*`

Admin API：
- `src/app/api/admin/*`

LINE Webhook：
- `src/app/api/line/webhook/route.ts`

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
4. 阅读 `implementation-v3`、`api-endpoints-v1`、`frontend-routes-v1`
5. 再进入具体 feature 开发

如果需要本地完整跑通：
1. `cp .env.example .env`（Windows：`Copy-Item .env.example .env`）
2. `docker compose up -d`
3. `npm run db:setup`
4. `npm run dev`

如果需要验证 LINE 功能，还需在 `.env` 中填入：
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `APP_BASE_URL`

## 6. 变更规则

- 变更 Prisma schema 后，必须同步生成迁移与验证 seed
- 变更预约规则后，至少检查预约创建、可用时间、自动取消三处逻辑
- 变更 LINE 消息模板后，更新 `src/lib/line-notifications.ts`
- 变更部署方式后，同步更新 `docs/deployment/deployment-v1.md`
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

已完成（2.0 LINE-first 全部落地）：
- ✅ LINE Webhook 与自动建档
- ✅ 图墙首页与按图预约
- ✅ 预约通知（待确认/已确认）
- ✅ 后台图墙管理
- ✅ 后台 LINE 1 对 1 会话

潜在后续方向：
1. 邮件通知（目前缺失，LINE 不可用时无法触达顾客）
2. LINE 模板消息或图片消息（提升通知视觉体验）
3. 增加更多自动化测试覆盖（特别是 LINE 通知路径）
4. 顾客取消预约的自助流程
