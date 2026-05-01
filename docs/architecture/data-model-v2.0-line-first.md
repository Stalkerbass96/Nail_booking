# Data Model V2.0（LINE-first）

更新时间：2026-05-01

本文档描述当前 Prisma schema 的实际状态（2.0 LINE-first 已完整落地）。

---

## 1. 设计原则

1. 顾客主身份为 `LINE userId`，邮箱为可选辅助字段。
2. 图墙（ShowcaseItem）是前台的核心展示入口，与套餐解耦但可绑定套餐。
3. 预约记录"顾客从哪张图进入"（showcaseItemId + sourceChannel）。
4. 兼容旧版邮箱路径，旧数据不做破坏性删除。

---

## 2. 模型总览

| 模型 | 说明 |
|------|------|
| Admin | 店长账号 |
| Customer | 业务顾客实体 |
| LineUser | LINE 平台技术身份 |
| ServiceCategory | 套餐分类（也用于图墙筛选） |
| ServicePackage | 套餐 |
| ServiceAddon | 加项 |
| PackageAddonLink | 套餐-加项多对多关联 |
| Appointment | 预约记录 |
| AppointmentAddon | 预约-加项快照 |
| PointLedger | 积分流水 |
| BusinessHour | 每周营业时间 |
| SpecialBusinessDate | 特殊营业日覆盖 |
| SystemSetting | 键值配置 |
| BookingBlock | 预约封锁区间 |
| ShowcaseItem | 图墙展示项 |
| LineMessage | LINE 消息记录 |
| LineLinkSession | LINE 绑定会话 |
| LineLinkToken | LINE 绑定 Token |

---

## 3. 核心模型详解

### Admin

店长登录账号，单条记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt PK | |
| email | String unique | 登录邮箱 |
| passwordHash | String | SHA-256 哈希 |
| displayName | String | 后台显示名 |
| createdAt / updatedAt | DateTime | |

---

### Customer

业务顾客实体，与 LINE 身份分离。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt PK | |
| displayName | String | 默认取自 LINE 昵称，后台可修改 |
| name | String? | 店长维护的正式姓名（可空） |
| email | String? | 辅助字段，非唯一 |
| customerType | Enum | `lead`（已加好友，未预约）/ `active`（已预约） |
| createdFrom | Enum | `line` / `admin` / `legacy_web` |
| firstBookedAt | DateTime? | 首次提交预约时间 |
| totalSpentJpy | Int | 累计实付金额 |
| currentPoints | Int | 当前积分余额 |
| createdAt / updatedAt | DateTime | |

---

### LineUser

LINE 平台技术身份，与 Customer 一对一关联。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt PK | |
| lineUserId | String unique | LINE 平台 userId |
| displayName | String | LINE 昵称 |
| pictureUrl | String? | LINE 头像 |
| isFollowing | Boolean | 是否已加好友 |
| followedAt | DateTime? | 加好友时间 |
| lastSeenAt | DateTime? | 最后活跃时间 |
| welcomeSentAt | DateTime? | 首次欢迎链接推送时间（只推一次） |
| lastHomeLinkSentAt | DateTime? | 最后推送首页链接时间 |
| customerId | BigInt? FK→Customer | 关联业务顾客 |
| createdAt / updatedAt | DateTime | |

---

### ShowcaseItem

图墙展示项，前台首页的核心模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt PK | |
| title | String | 展示标题 |
| description | String? | 简短说明 |
| imageUrl | String? | 封面图 URL |
| categoryId | BigInt? FK→ServiceCategory | 关联分类 |
| servicePackageId | BigInt? FK→ServicePackage | 关联套餐（绑定后预约时固定此套餐） |
| displayPriceJpy | Int? | 展示价格（日元） |
| priceLabel | String? | 价格文案（如"起"） |
| sortOrder | Int | 排序值 |
| isPublished | Boolean | 是否上架 |
| createdAt / updatedAt | DateTime | |

约束：一个图墙项只能绑定一个套餐，一个套餐可以被多个图墙项引用。

---

### Appointment

预约记录，系统核心模型。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt PK | |
| bookingNo | String unique | 预约号，格式 `NB-YYYYMMDD-XXXX` |
| customerId | BigInt FK→Customer | |
| servicePackageId | BigInt FK→ServicePackage | |
| showcaseItemId | BigInt? FK→ShowcaseItem | 来源图墙项（2.0 新增） |
| sourceChannel | Enum | `line_showcase` / `admin_manual` / `legacy_web` |
| status | Enum | `pending` / `confirmed` / `completed` / `canceled` |
| startAt | DateTime | 预约开始时间（indexed） |
| endAt | DateTime | 预约结束时间 |
| autoCancelAt | DateTime? | 待确认自动取消时间 |
| styleNote | String? | 款式备注（旧版字段，兼容保留） |
| customerNote | String? | 顾客备注 |
| cancelReason | String? | 取消原因 |
| actualPaidJpy | Int? | 实收金额（完成时填写） |
| createdAt / updatedAt | DateTime | |

索引：`startAt`（单列），`(status, startAt)`（复合）。

---

### ServiceCategory / ServicePackage / ServiceAddon

| 模型 | 关键字段 |
|------|----------|
| ServiceCategory | id, nameZh, nameJa, sortOrder, isActive |
| ServicePackage | id, categoryId, nameZh, nameJa, priceJpy, durationMinutes, isActive |
| ServiceAddon | id, packageId, nameZh, nameJa, priceJpy, durationMinutes, isActive |
| PackageAddonLink | packageId + addonId（唯一约束） |

---

### BusinessHour / SpecialBusinessDate / BookingBlock

| 模型 | 关键字段 |
|------|----------|
| BusinessHour | weekday(0-6), openTime, closeTime |
| SpecialBusinessDate | date(unique), isClosed, openTime?, closeTime? |
| BookingBlock | startAt, endAt, reason? |

---

### PointLedger

| 字段 | 说明 |
|------|------|
| customerId | 关联顾客 |
| appointmentId? | 关联预约（可空） |
| type | `earn` / `use` / `adjust` |
| points | 变动积分数 |
| note? | 备注 |

---

### LineMessage

LINE 消息记录，用于后台 1 对 1 会话展示。

| 字段 | 说明 |
|------|------|
| lineUserId | 关联 LineUser |
| direction | `incoming`（顾客发） / `outgoing`（店长发） / `system`（系统通知） |
| messageType | `text` 等 |
| content | 消息内容 |
| isRead | 是否已读 |
| lineMessageId? | LINE 平台 Message ID（去重用） |

---

### SystemSetting

键值配置，支持运行时修改。

当前已定义的键：

| key | 默认值 | 说明 |
|-----|--------|------|
| `slot_minutes` | 30 | 预约时间粒度（分钟） |
| `pending_auto_cancel_hours` | 24 | 待确认超时自动取消时长（小时） |
| `cancel_cutoff_hours` | 6 | 距开始多少小时内不可取消 |
| `point_earn_ratio_jpy` | 100 | 消费多少日元获得 1 积分 |
| `point_redeem_ratio_jpy` | 100 | 1 积分抵多少日元 |

---

## 4. 关键枚举

```prisma
enum CustomerType    { lead active }
enum CustomerCreatedFrom { line admin legacy_web }
enum AppointmentStatus  { pending confirmed completed canceled }
enum AppointmentSourceChannel { line_showcase admin_manual legacy_web }
enum LineMessageDirection { incoming outgoing system }
enum PointLedgerType { earn use adjust }
```

---

## 5. 迁移历史

| 迁移文件 | 内容 |
|----------|------|
| `20260306153000_init` | 初始 schema（Customer、Appointment、ServicePackage 等核心模型） |
| `20260307190000_schedule_line_features` | BusinessHour、SpecialBusinessDate、BookingBlock、ShowcaseItem、LineUser |
| `20260307193000_line_link_sessions` | LineLinkSession、LineLinkToken |
| `20260307195000_line_message_read_state` | LineMessage.isRead 字段 |
| `20260308160000_line_first_v2` | Customer.customerType、Customer.createdFrom、Appointment.showcaseItemId、Appointment.sourceChannel |
