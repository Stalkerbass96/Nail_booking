# Development Task Breakdown V2.0

更新时间：2026-07-06

本文档记录 2.0 LINE-first 升级的任务完成情况，并列出后续可能的开发方向。

**当前状态：2.0 所有 P0/P1 任务已全部完成，后续增强已覆盖 DaySlot 排班、图片上传、排序、定额套餐价格/时长和 GHCR 部署链路。**

---

## 1. 已完成任务（P0 — 设计基线）

- ✅ T0-1 文档冻结：`requirements-v2.0-line-first.md`、`prd-v3-line-first.md`、`data-model-v2.0-line-first.md`
- ✅ T0-2 技术方案冻结：顾客主身份切换、定额套餐模型、旧邮箱下线路径已确认

## 2. 已完成任务（P1 — 数据模型与迁移）

- ✅ T1-1 Prisma schema 调整：`Customer.customerType`、`Customer.createdFrom`、`LineUser.welcomeSentAt`、`Appointment.showcaseItemId`、`Appointment.sourceChannel`、新增 `ShowcaseItem` 模型
- ✅ T1-2 数据迁移：迁移文件已生成并跟踪，后续已追加定额套餐加项、DaySlot、排序和系统设置长文本迁移
- ✅ T1-3 数据访问层：顾客查找逻辑以 LINE 为主，预约创建支持记录定额套餐来源

## 3. 已完成任务（P1 — LINE 顾客建档主链路）

- ✅ T2-1 Webhook follow 处理：收到 `follow` 自动创建/更新 `LineUser`，绑定 `Customer`（`customerType=lead`）
- ✅ T2-2 首次欢迎消息：仅首次推送，依赖 `welcomeSentAt` 去重
- ✅ T2-3 顾客档案联动：后台顾客列表区分潜在客户/正式顾客，默认显示 LINE 昵称

## 4. 已完成任务（P1 — 定额套餐后台）

- ✅ T3-1 `/admin/showcase` 管理页：列表、创建、编辑、删除、上下架、排序
- ✅ T3-2 定额套餐字段：封面图 URL、标题、说明、价格文案、分类、关联套餐
- ✅ T3-3 定额套餐 API：admin CRUD + public 查询（分类筛选、上下架过滤、排序）

## 5. 已完成任务（P1 — 前台首页与预约流程）

- ✅ T4-1 首页切换为定额套餐：`/` 改为定额套餐首页，支持分类筛选
- ✅ T4-2 定额套餐项点击进入固定套餐预约页，不提供套餐切换
- ✅ T4-3 预约提交改造：写入 `showcaseItemId` 与 `sourceChannel`，首笔预约将顾客从 `lead` 转为 `active`

## 6. 已完成任务（P1 — LINE 自动通知）

- ✅ T5-1 提交预约后发送待确认消息（含预约号与详情链接）
- ✅ T5-2 店长确认预约后发送已确认消息
- ✅ T5-3 中日双语消息模板（`src/lib/line-notifications.ts`）

## 7. 已完成任务（P2 — 后台升级）

- ✅ T6-1 顾客页：潜在客户/正式顾客状态、LINE 关联档案
- ✅ T6-2 预约页：来源定额套餐项展示、顾客 LINE 关联情况
- ✅ T6-3 LINE 会话页（`/admin/line`）：1 对 1 文本消息、未读状态管理

## 8. 已完成任务（P2 — 收尾）

- ✅ T7-1 公开预约详情页（`/booking/{bookingNo}`），作为 LINE 消息落点
- ✅ T7-2 邮箱查询不再作为主路径（前台不暴露入口，旧接口兼容保留）
- ✅ T8-1/T8-2 E2E smoke + acceptance 测试跑通（5/5 PASS）
- ✅ T9-1/T9-2/T9-3 API 文档、部署文档、agent handoff 全部更新

---

## 9. 潜在后续方向（未排优先级）

以下内容不在 2.0 首批范围，可按业务需要择期推进：

| 方向 | 说明 |
|------|------|
| 邮件通知 | LINE 不可用时的顾客触达备选 |
| LINE 模板消息 / 图片消息 | 提升通知视觉体验 |
| 顾客自助取消 | 目前只有店长可在后台取消 |
| 积分兑换流程 | 目前仅后台扣减，无前台兑换界面 |
| 更多自动化测试 | 特别是 LINE 通知路径的 E2E 覆盖 |
| 多图定额套餐详情 | 当前每个定额套餐项仅单图 |

## 10. 2026-05 至 2026-06 追加完成项

- ✅ 定额套餐固定/可选加项、加项数量和最大数量
- ✅ 定额套餐自定义价格、折扣展示和自定义时长
- ✅ 套餐/加项排序与顾客侧排序一致
- ✅ 本地图片上传与上传图片 API
- ✅ 基于 `DaySlot` 的拖拽排班日历
- ✅ 前台预约按 `DaySlot` 校验可用时间
- ✅ LINE 消息模板进入系统设置
- ✅ GitHub Actions 构建 GHCR 镜像，部署脚本从 registry 拉取
